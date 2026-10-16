-- Atomic publication reservation. One active attempt per book; failed version is retryable.
CREATE OR REPLACE FUNCTION public.reserve_book_publication(p_project_id uuid, p_cover_template_id text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_user uuid := (select auth.uid());
  v_project public.projects%ROWTYPE;
  v_plan text;
  v_version integer;
  v_latest public.publications%ROWTYPE;
  v_id uuid;
  v_author text;
  v_toc jsonb;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'UNAUTHORIZED'; END IF;
  -- Serialize allocations per user, including the Free entitlement across books.
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user::text, 41637));
  SELECT * INTO v_project FROM public.projects WHERE id=p_project_id AND user_id=v_user FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'PROJECT_NOT_FOUND'; END IF;
  IF v_project.ready_at IS NULL OR v_project.manuscript_reviewed_at IS NULL OR v_project.final_review_completed_at IS NULL THEN
    RAISE EXCEPTION 'REVIEW_REQUIRED';
  END IF;
  IF COALESCE(v_project.selected_cover_id,v_project.cover_template_id) IS DISTINCT FROM p_cover_template_id THEN
    RAISE EXCEPTION 'COVER_MISMATCH';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.chapters WHERE project_id=p_project_id) OR EXISTS
    (SELECT 1 FROM public.chapters WHERE project_id=p_project_id AND
       (length(trim(title))=0 OR length(trim(COALESCE(user_content,ai_content,'')))=0)) THEN
    RAISE EXCEPTION 'MANUSCRIPT_INCOMPLETE';
  END IF;
  SELECT plan::text INTO v_plan FROM public.subscriptions WHERE user_id=v_user;
  IF COALESCE(v_plan,'free') <> 'pro' AND EXISTS
    (SELECT 1 FROM public.publications WHERE user_id=v_user AND status='published') THEN
    RAISE EXCEPTION 'PUBLICATION_LIMIT';
  END IF;
  SELECT * INTO v_latest FROM public.publications WHERE project_id=p_project_id
    ORDER BY version DESC LIMIT 1 FOR UPDATE;
  IF FOUND AND v_latest.status='processing' THEN RAISE EXCEPTION 'PUBLICATION_IN_PROGRESS'; END IF;
  IF FOUND AND v_latest.status='failed' THEN
    v_version := v_latest.version;
    v_id := v_latest.id;
  ELSE
    v_version := COALESCE(v_latest.version,0)+1;
    v_id := pg_catalog.gen_random_uuid();
  END IF;
  SELECT COALESCE(v_project.author_name, u.nickname, '작가') INTO v_author
    FROM public.users u WHERE u.id=v_user;
  SELECT COALESCE(jsonb_agg(jsonb_build_object('chapter_number',chapter_number,'title',title) ORDER BY sort_order),'[]'::jsonb)
    INTO v_toc FROM public.chapters WHERE project_id=p_project_id;
  IF v_latest.id IS NOT NULL AND v_latest.status='failed' THEN
    UPDATE public.publications SET status='processing',
      title_snapshot=v_project.title,subtitle_snapshot=v_project.subtitle,author_snapshot=v_author,
      cover_snapshot=jsonb_build_object('template_id',p_cover_template_id),toc_snapshot=v_toc,
      pdf_path=NULL,page_count=NULL,error_code=NULL,error_message=NULL,published_at=NULL
      WHERE id=v_id;
  ELSE
    INSERT INTO public.publications(id,project_id,user_id,version,status,title_snapshot,subtitle_snapshot,author_snapshot,cover_snapshot,toc_snapshot)
    VALUES(v_id,p_project_id,v_user,v_version,'processing',v_project.title,v_project.subtitle,v_author,
      jsonb_build_object('template_id',p_cover_template_id),v_toc);
  END IF;
  RETURN jsonb_build_object('id',v_id,'version',v_version);
END;
$$;
REVOKE ALL ON FUNCTION public.reserve_book_publication(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.reserve_book_publication(uuid,text) TO authenticated;
