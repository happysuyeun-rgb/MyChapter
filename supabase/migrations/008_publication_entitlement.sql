-- Publication entitlement: Free users may publish one book; Pro users may publish repeatedly.
-- Existing published_books rows are treated as already-used Free publication entitlement.

CREATE INDEX IF NOT EXISTS idx_published_books_user_id ON public.published_books(user_id);
