-- Serialize record numbering per book. Never trust a client-computed record_number.
CREATE OR REPLACE FUNCTION private.assign_record_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $fn$
BEGIN
  IF NEW.user_id IS DISTINCT FROM (SELECT auth.uid()) THEN
    RAISE EXCEPTION 'RECORD_OWNER_REQUIRED';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.projects WHERE id=NEW.project_id AND user_id=NEW.user_id) THEN
    RAISE EXCEPTION 'PROJECT_NOT_FOUND';
  END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(NEW.project_id::text, 52371));
  SELECT COALESCE(MAX(record_number),0)+1 INTO NEW.record_number
    FROM public.records WHERE project_id=NEW.project_id;
  RETURN NEW;
END;
$fn$;
DROP TRIGGER IF EXISTS records_assign_record_number ON public.records;
CREATE TRIGGER records_assign_record_number BEFORE INSERT ON public.records
FOR EACH ROW EXECUTE FUNCTION private.assign_record_number();
REVOKE ALL ON FUNCTION private.assign_record_number() FROM PUBLIC,anon,authenticated;
