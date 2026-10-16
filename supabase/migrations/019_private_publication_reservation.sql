-- Keep privileged reservation logic out of exposed public API schema.
CREATE SCHEMA IF NOT EXISTS private;
ALTER FUNCTION public.reserve_book_publication(uuid,text) SET SCHEMA private;
REVOKE ALL ON FUNCTION private.reserve_book_publication(uuid,text) FROM PUBLIC,anon;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.reserve_book_publication(uuid,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.reserve_book_publication(p_project_id uuid,p_cover_template_id text)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT private.reserve_book_publication(p_project_id,p_cover_template_id);
$$;
REVOKE ALL ON FUNCTION public.reserve_book_publication(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.reserve_book_publication(uuid,text) TO authenticated;
