ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.published_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.record_drafts ENABLE ROW LEVEL SECURITY;

-- users
CREATE POLICY users_select_own ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY users_update_own ON public.users FOR UPDATE USING (auth.uid() = id);

-- projects
CREATE POLICY projects_select_own ON public.projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY projects_insert_own ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY projects_update_own ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY projects_delete_own ON public.projects FOR DELETE USING (auth.uid() = user_id);

-- chapters
CREATE POLICY chapters_select_own ON public.chapters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY chapters_insert_own ON public.chapters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY chapters_update_own ON public.chapters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY chapters_delete_own ON public.chapters FOR DELETE USING (auth.uid() = user_id);

-- records
CREATE POLICY records_select_own ON public.records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY records_insert_own ON public.records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY records_update_own ON public.records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY records_delete_own ON public.records FOR DELETE USING (auth.uid() = user_id);

-- daily_questions
CREATE POLICY daily_questions_select_own ON public.daily_questions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY daily_questions_insert_own ON public.daily_questions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- subscriptions
CREATE POLICY subscriptions_select_own ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

-- ai_usage
CREATE POLICY ai_usage_select_own ON public.ai_usage FOR SELECT USING (auth.uid() = user_id);

-- notifications
CREATE POLICY notifications_select_own ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY notifications_update_own ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- device_tokens
CREATE POLICY device_tokens_all_own ON public.device_tokens FOR ALL USING (auth.uid() = user_id);

-- published_books
CREATE POLICY published_books_select_own ON public.published_books FOR SELECT USING (auth.uid() = user_id);

-- record_drafts
CREATE POLICY record_drafts_all_own ON public.record_drafts FOR ALL USING (auth.uid() = user_id);
