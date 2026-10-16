-- 021: Fence stale workers and reject a PDF whose source changed while rendering.
ALTER TABLE public.publications
 ADD COLUMN IF NOT EXISTS attempt_token uuid,
 ADD COLUMN IF NOT EXISTS source_fingerprint text;

CREATE OR REPLACE FUNCTION private.book_publication_fingerprint(p_project_id uuid)
RETURNS text LANGUAGE sql STABLE SET search_path = '' AS $$
 SELECT md5(
  concat_ws('|',
   p.title,p.subtitle,p.author_name,p.selected_cover_id,p.cover_template_id,
   COALESCE((
     SELECT jsonb_agg(jsonb_build_array(c.id,c.title,c.chapter_number,c.sort_order,c.user_content,c.ai_content,c.record_ids)
                       ORDER BY c.sort_order,c.id)::text
     FROM public.chapters c WHERE c.project_id=p.id
   ),'[]'::text)
  )
 ) FROM public.projects p WHERE p.id=p_project_id;
$$;

-- Wrap the existing reservation logic: change attempt token after the serialized
-- reservation finishes, in the same SQL transaction.
CREATE OR REPLACE FUNCTION private.reserve_book_publication_fenced(p_project_id uuid,p_cover_template_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_res jsonb;
  v_token uuid := gen_random_uuid();
BEGIN
  v_res := private.reserve_book_publication(p_project_id,p_cover_template_id);
  UPDATE public.publications
     SET attempt_token=v_token,
         source_fingerprint=private.book_publication_fingerprint(p_project_id)
   WHERE id=(v_res->>'id')::uuid AND status='processing';
  RETURN v_res || jsonb_build_object('attempt_token',v_token);
END;
$$;

CREATE OR REPLACE FUNCTION public.reserve_book_publication(p_project_id uuid,p_cover_template_id text)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
 SELECT private.reserve_book_publication_fenced(p_project_id,p_cover_template_id);
$$;

CREATE OR REPLACE FUNCTION private.finish_book_publication(
 p_publication_id uuid,p_attempt_token uuid,p_storage_path text,
 p_page_count integer,p_tagline text,p_failure_reason text DEFAULT NULL
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
 v_pub public.publications%ROWTYPE;
 v_project public.projects%ROWTYPE;
BEGIN
 SELECT * INTO v_pub FROM public.publications WHERE id=p_publication_id FOR UPDATE;
 IF NOT FOUND OR v_pub.status <> 'processing' OR v_pub.attempt_token IS DISTINCT FROM p_attempt_token THEN
   RETURN false;
 END IF;
 SELECT * INTO v_project FROM public.projects WHERE id=v_pub.project_id FOR UPDATE;
 IF NOT FOUND THEN RETURN false; END IF;
 IF p_failure_reason IS NOT NULL THEN
   UPDATE public.publications SET status='failed',error_code='PDF_GENERATE_FAILED',
     error_message=p_failure_reason WHERE id=p_publication_id;
   RETURN true;
 END IF;
 IF v_project.final_review_completed_at IS NULL OR v_project.manuscript_reviewed_at IS NULL
   OR v_pub.source_fingerprint IS DISTINCT FROM private.book_publication_fingerprint(v_pub.project_id) THEN
   UPDATE public.publications SET status='failed',error_code='SOURCE_CHANGED',
     error_message='발행 중 원고 또는 표지가 변경되었습니다. 다시 검수해주세요.'
     WHERE id=p_publication_id;
   RETURN false;
 END IF;
 UPDATE public.publications SET status='published',
   pdf_path=p_storage_path,page_count=p_page_count,
   cover_snapshot=jsonb_set(cover_snapshot,'{tagline}',to_jsonb(p_tagline),true),
   published_at=now(),error_code=NULL,error_message=NULL
 WHERE id=p_publication_id;
 RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.finish_book_publication(
 p_publication_id uuid,p_attempt_token uuid,p_storage_path text,
 p_page_count integer,p_tagline text,p_failure_reason text DEFAULT NULL
) RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $
BEGIN
 RETURN private.finish_book_publication(
 p_publication_id,p_attempt_token,p_storage_path,p_page_count,p_tagline,p_failure_reason
 );
END;
$;
-- Only service_role may finalize. This API must never be callable by normal users.
REVOKE ALL ON FUNCTION public.finish_book_publication(uuid,uuid,text,integer,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.finish_book_publication(uuid,uuid,text,integer,text,text) TO service_role;
REVOKE ALL ON FUNCTION private.finish_book_publication(uuid,uuid,text,integer,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION private.finish_book_publication(uuid,uuid,text,integer,text,text) TO service_role;
REVOKE ALL ON FUNCTION private.reserve_book_publication_fenced(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.reserve_book_publication_fenced(uuid,text) TO authenticated;
