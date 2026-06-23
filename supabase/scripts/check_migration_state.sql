-- MyChapter: 마이그레이션 적용 상태 확인
-- Supabase SQL Editor에서 실행하세요.

-- 1) ENUM 타입
SELECT typname AS enum_type
FROM pg_type
WHERE typname IN (
  'project_type',
  'record_frequency',
  'record_mode',
  'record_mode_instance',
  'subscription_plan',
  'notification_type',
  'ai_feature'
)
ORDER BY typname;

-- 2) public 테이블
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'users',
    'projects',
    'chapters',
    'records',
    'daily_questions',
    'subscriptions',
    'ai_usage',
    'notifications',
    'device_tokens',
    'published_books',
    'record_drafts'
  )
ORDER BY table_name;

-- 해석:
-- enum만 있고 테이블이 없음 → 001을 타입 생성에서 멈춘 상태 (001_idempotent.sql 사용)
-- 테이블 일부만 있음     → 001_idempotent.sql 사용 (나머지만 생성)
-- 전부 있음             → 001 건너뛰고 002부터 실행
