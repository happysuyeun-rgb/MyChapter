CREATE OR REPLACE FUNCTION private.finish_book_publication(
 p_publication_id uuid,p_attempt_token uuid,p_storage_path text,
 p_page_count integer,p_tagline text,p_failure_reason text DEFAULT NULL
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
 v_pub public.publications%ROWTYPE;
 v_project public.projects%ROWTYPE;
 v_project_id uuid;
BEGIN
 SELECT project_id INTO v_project_id FROM public.publications WHERE id=p_publication_id;
 IF v_project_id IS NULL THEN RETURN false; END IF;
 SELECT * INTO v_project FROM public.projects WHERE id=v_project_id FOR UPDATE;
 IF NOT FOUND THEN RETURN false; END IF;
 SELECT * INTO v_pub FROM public.publications WHERE id=p_publication_id FOR UPDATE;
 IF NOT FOUND OR v_pub.status <> 'processing' OR v_pub.attempt_token IS DISTINCT FROM p_attempt_token THEN
   RETURN false;
 END IF;

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
   cover_snapshot=jsonb_set(cover_snapshot,'{tagline}',COALESCE(to_jsonb(p_tagline),'null'::jsonb),true),
   published_at=now(),error_code=NULL,error_message=NULL
 WHERE id=p_publication_id;
 RETURN true;
END;
$$;

