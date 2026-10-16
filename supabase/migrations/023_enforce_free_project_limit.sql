-- Enforce the Free one-book entitlement in the database, not only in React.
CREATE OR REPLACE FUNCTION private.enforce_project_creation_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $guard$
DECLARE
  v_plan text;
BEGIN
  -- Service operations are privileged; authenticated client inserts must obey quota.
  IF auth.uid() IS NULL OR NEW.user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'PROJECT_OWNER_REQUIRED' USING ERRCODE='P0001';
  END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(NEW.user_id::text, 41637));
  SELECT plan::text INTO v_plan FROM public.subscriptions WHERE user_id=NEW.user_id;
  IF COALESCE(v_plan,'free') <> 'pro'
     AND EXISTS (SELECT 1 FROM public.projects WHERE user_id=NEW.user_id)
  THEN
    RAISE EXCEPTION 'FREE_PROJECT_LIMIT' USING ERRCODE='P0001';
  END IF;
  RETURN NEW;
END;
$guard$;
DROP TRIGGER IF EXISTS projects_enforce_creation_limit ON public.projects;
CREATE TRIGGER projects_enforce_creation_limit BEFORE INSERT ON public.projects
FOR EACH ROW EXECUTE FUNCTION private.enforce_project_creation_limit();
REVOKE ALL ON FUNCTION private.enforce_project_creation_limit() FROM PUBLIC,anon,authenticated;
