-- 016: keep review milestones consistent with edited book content.
-- An edit of a manuscript chapter requires renewed manuscript and final review.
-- Cover or book metadata edits require renewed final review.
-- Triggers update only milestones, not the immutable publications snapshots.

CREATE OR REPLACE FUNCTION public.invalidate_book_review_on_project_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF ROW(NEW.title, NEW.subtitle, NEW.author_name, NEW.selected_cover_id, NEW.cover_template_id)
     IS DISTINCT FROM
     ROW(OLD.title, OLD.subtitle, OLD.author_name, OLD.selected_cover_id, OLD.cover_template_id)
  THEN
    NEW.final_review_completed_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS projects_invalidate_final_review ON public.projects;
CREATE TRIGGER projects_invalidate_final_review
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.invalidate_book_review_on_project_change();

CREATE OR REPLACE FUNCTION public.invalidate_book_review_on_chapter_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  affected_project uuid;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF ROW(NEW.title, NEW.ai_content, NEW.user_content, NEW.chapter_number, NEW.sort_order, NEW.record_ids)
       IS NOT DISTINCT FROM
       ROW(OLD.title, OLD.ai_content, OLD.user_content, OLD.chapter_number, OLD.sort_order, OLD.record_ids)
    THEN
      RETURN NEW;
    END IF;
    affected_project := NEW.project_id;
  ELSIF TG_OP = 'DELETE' THEN
    affected_project := OLD.project_id;
  ELSE
    affected_project := NEW.project_id;
  END IF;

  UPDATE public.projects
     SET manuscript_reviewed_at = NULL,
         final_review_completed_at = NULL
   WHERE id = affected_project
     AND (manuscript_reviewed_at IS NOT NULL OR final_review_completed_at IS NOT NULL);
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS chapters_invalidate_book_review ON public.chapters;
CREATE TRIGGER chapters_invalidate_book_review
AFTER INSERT OR UPDATE OR DELETE ON public.chapters
FOR EACH ROW
EXECUTE FUNCTION public.invalidate_book_review_on_chapter_change();
