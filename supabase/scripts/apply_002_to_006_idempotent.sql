-- MyChapter: 002~006 idempotent 적용 순서
-- Supabase SQL Editor에서는 아래 파일을 **순서대로 각각** Run 하세요.
-- (이 파일은 안내만 — 실행할 SQL 없음)
--
-- 1. supabase/scripts/002_idempotent.sql
-- 2. supabase/scripts/003_idempotent.sql
-- 3. supabase/scripts/004_idempotent.sql
-- 4. supabase/scripts/006_idempotent.sql
--
-- "already exists" 오류가 나면 migrations/*.sql 대신 scripts/*_idempotent.sql 을 사용하세요.

SELECT 'Run 002_idempotent.sql → 003 → 004 → 006 in order' AS next_step;
