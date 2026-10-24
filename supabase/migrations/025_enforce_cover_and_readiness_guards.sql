-- 025: DB-level Pro cover entitlement + readiness field integrity.
-- Do NOT apply to production until review/approval. Repo-only until then.

CREATE OR REPLACE FUNCTION private.is_pro_only_cover(p_cover text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT p_cover IN ('cover_03', 'cover_04');
$$;

CREATE OR REPLACE FUNCTION private.user_has_active_pro(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions s
    WHERE s.user_id = p_user_id
      AND s.plan = 'pro'
      AND (s.expires_at IS NULL OR s.expires_at > now())
  );
$$;

REVOKE ALL ON FUNCTION private.is_pro_only_cover(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.user_has_active_pro(uuid) FROM PUBLIC, anon, authenticated;

-- Block Free / expired-Pro from storing Pro covers via REST UPDATE/INSERT.
CREATE OR REPLACE FUNCTION private.enforce_project_cover_entitlement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $guard$
DECLARE
  v_cover text;
BEGIN
  -- Service-role / system paths (no JWT) skip; authenticated clients are enforced.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  v_cover := COALESCE(NEW.selected_cover_id, NEW.cover_template_id);
  IF v_cover IS NULL OR NOT private.is_pro_only_cover(v_cover) THEN
    RETURN NEW;
  END IF;

  IF NOT private.user_has_active_pro(NEW.user_id) THEN
    RAISE EXCEPTION 'COVER_PRO_ONLY' USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$guard$;

DROP TRIGGER IF EXISTS projects_enforce_cover_entitlement ON public.projects;
CREATE TRIGGER projects_enforce_cover_entitlement
  BEFORE INSERT OR UPDATE OF selected_cover_id, cover_template_id
  ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION private.enforce_project_cover_entitlement();

REVOKE ALL ON FUNCTION private.enforce_project_cover_entitlement() FROM PUBLIC, anon, authenticated;

-- Prevent clients from forging ready_at / backdating started_at / lowering readiness mins.
CREATE OR REPLACE FUNCTION private.readiness_defaults_for_type(p_type text)
RETURNS TABLE(min_days int, min_records int, target_days int, target_records int)
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT
    CASE p_type
      WHEN 'growth' THEN 60
      WHEN 'life_story' THEN 90
      WHEN 'career' THEN 60
      WHEN 'parenting' THEN 30
      WHEN 'relationships' THEN 30
      WHEN 'travel' THEN 7
      WHEN 'hobby' THEN 30
      WHEN 'learning' THEN 30
      WHEN 'yearly' THEN 60
      ELSE 30
    END,
    CASE p_type
      WHEN 'growth' THEN 30
      WHEN 'life_story' THEN 40
      WHEN 'career' THEN 30
      WHEN 'parenting' THEN 30
      WHEN 'relationships' THEN 25
      WHEN 'travel' THEN 10
      WHEN 'hobby' THEN 20
      WHEN 'learning' THEN 20
      WHEN 'yearly' THEN 30
      ELSE 20
    END,
    CASE p_type
      WHEN 'growth' THEN 90
      WHEN 'life_story' THEN 180
      WHEN 'career' THEN 90
      WHEN 'parenting' THEN 90
      WHEN 'relationships' THEN 90
      WHEN 'travel' THEN 15
      WHEN 'hobby' THEN 60
      WHEN 'learning' THEN 90
      WHEN 'yearly' THEN 100
      ELSE 60
    END,
    CASE p_type
      WHEN 'growth' THEN 40
      WHEN 'life_story' THEN 60
      WHEN 'career' THEN 40
      WHEN 'parenting' THEN 45
      WHEN 'relationships' THEN 40
      WHEN 'travel' THEN 15
      WHEN 'hobby' THEN 30
      WHEN 'learning' THEN 35
      WHEN 'yearly' THEN 40
      ELSE 30
    END;
$$;

CREATE OR REPLACE FUNCTION private.enforce_project_readiness_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $guard$
DECLARE
  v_defaults record;
  v_elapsed int;
  v_records bigint;
  v_start date;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'PROJECT_OWNER_REQUIRED' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_defaults FROM private.readiness_defaults_for_type(NEW.type::text);

  -- Clients cannot invent weaker thresholds; type policy wins.
  NEW.readiness_min_days := v_defaults.min_days;
  NEW.readiness_min_records := v_defaults.min_records;
  NEW.readiness_target_days := v_defaults.target_days;
  NEW.readiness_target_records := v_defaults.target_records;

  IF TG_OP = 'INSERT' THEN
    IF NEW.started_at IS NOT NULL AND NEW.started_at < CURRENT_DATE THEN
      RAISE EXCEPTION 'STARTED_AT_INVALID' USING ERRCODE = 'P0001';
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.started_at IS DISTINCT FROM OLD.started_at THEN
      RAISE EXCEPTION 'STARTED_AT_IMMUTABLE' USING ERRCODE = 'P0001';
    END IF;
    IF OLD.ready_at IS NOT NULL AND NEW.ready_at IS NULL THEN
      RAISE EXCEPTION 'READY_AT_IMMUTABLE' USING ERRCODE = 'P0001';
    END IF;
    IF OLD.ready_at IS NOT NULL AND NEW.ready_at IS DISTINCT FROM OLD.ready_at THEN
      RAISE EXCEPTION 'READY_AT_IMMUTABLE' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  -- Stamping ready_at is allowed only when volume/time thresholds are truly met.
  IF NEW.ready_at IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.ready_at IS NULL) THEN
    v_start := COALESCE(NEW.started_at, NEW.created_at::date);
    v_elapsed := (CURRENT_DATE - v_start) + 1;
    SELECT count(*) INTO v_records
    FROM public.records r
    WHERE r.project_id = NEW.id
      AND r.is_draft = false;
    IF v_elapsed < NEW.readiness_min_days OR v_records < NEW.readiness_min_records THEN
      RAISE EXCEPTION 'BOOK_NOT_READY' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  RETURN NEW;
END;
$guard$;

DROP TRIGGER IF EXISTS projects_enforce_readiness_integrity ON public.projects;
CREATE TRIGGER projects_enforce_readiness_integrity
  BEFORE INSERT OR UPDATE
  ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION private.enforce_project_readiness_integrity();

REVOKE ALL ON FUNCTION private.readiness_defaults_for_type(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.enforce_project_readiness_integrity() FROM PUBLIC, anon, authenticated;

-- Publication reservation: reject Pro covers for Free / expired Pro.
CREATE OR REPLACE FUNCTION private.reserve_book_publication(p_project_id uuid, p_cover_template_id text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_user uuid := (select auth.uid());
  v_project public.projects%ROWTYPE;
  v_version integer;
  v_latest public.publications%ROWTYPE;
  v_id uuid;
  v_author text;
  v_toc jsonb;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'UNAUTHORIZED'; END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user::text, 41637));
  SELECT * INTO v_project FROM public.projects WHERE id=p_project_id AND user_id=v_user FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'PROJECT_NOT_FOUND'; END IF;
  IF v_project.ready_at IS NULL OR v_project.manuscript_reviewed_at IS NULL OR v_project.final_review_completed_at IS NULL THEN
    RAISE EXCEPTION 'REVIEW_REQUIRED';
  END IF;
  IF COALESCE(v_project.selected_cover_id,v_project.cover_template_id) IS DISTINCT FROM p_cover_template_id THEN
    RAISE EXCEPTION 'COVER_MISMATCH';
  END IF;
  IF private.is_pro_only_cover(p_cover_template_id) AND NOT private.user_has_active_pro(v_user) THEN
    RAISE EXCEPTION 'COVER_PRO_ONLY';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.chapters WHERE project_id=p_project_id) OR EXISTS
    (SELECT 1 FROM public.chapters WHERE project_id=p_project_id AND
       (length(trim(title))=0 OR length(trim(COALESCE(user_content,ai_content,'')))=0)) THEN
    RAISE EXCEPTION 'MANUSCRIPT_INCOMPLETE';
  END IF;
  -- Recover interrupted worker attempts after a conservative one-hour lease.
  -- The per-user advisory lock serializes cleanup with new reservations.
  UPDATE public.publications
    SET status='failed',
        error_code='PUBLICATION_TIMEOUT',
        error_message='PDF 발행 작업이 중단되어 재시도가 필요합니다.'
    WHERE user_id=v_user AND status='processing'
      AND COALESCE(processing_started_at,created_at) < now()-interval '1 hour';
  -- Active Pro only: plan=pro AND (expires_at IS NULL OR expires_at > now()).
  -- Expired Pro shares Free's single publication entitlement.
  IF NOT private.user_has_active_pro(v_user) AND EXISTS
    (SELECT 1 FROM public.publications WHERE user_id=v_user AND status='published') THEN
    RAISE EXCEPTION 'PUBLICATION_LIMIT';
  END IF;
  -- Free / expired-Pro entitlement must reserve its sole slot across *all* books, not
  -- only count completed publications (which leaves a concurrent gap).
  IF NOT private.user_has_active_pro(v_user) AND EXISTS
    (SELECT 1 FROM public.publications
     WHERE user_id=v_user AND status='processing' AND project_id<>p_project_id)
  THEN RAISE EXCEPTION 'PUBLICATION_IN_PROGRESS'; END IF;
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
    UPDATE public.publications SET status='processing', processing_started_at=now(),
      title_snapshot=v_project.title,subtitle_snapshot=v_project.subtitle,author_snapshot=v_author,
      cover_snapshot=jsonb_build_object('template_id',p_cover_template_id),toc_snapshot=v_toc,
      pdf_path=NULL,page_count=NULL,error_code=NULL,error_message=NULL,published_at=NULL
      WHERE id=v_id;
  ELSE
    INSERT INTO public.publications(id,project_id,user_id,version,status,processing_started_at,title_snapshot,subtitle_snapshot,author_snapshot,cover_snapshot,toc_snapshot)
    VALUES(v_id,p_project_id,v_user,v_version,'processing',now(),v_project.title,v_project.subtitle,v_author,
      jsonb_build_object('template_id',p_cover_template_id),v_toc);
  END IF;
  RETURN jsonb_build_object('id',v_id,'version',v_version);
END;
$$;

REVOKE ALL ON FUNCTION private.reserve_book_publication(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.reserve_book_publication(uuid,text) TO authenticated;
