-- ============================================================
-- 건설현장 인력공급 자동화 플랫폼 - DB 스키마
-- Supabase SQL Editor에 붙여넣고 실행하세요
-- ============================================================

-- 직종 enum
CREATE TYPE job_category AS ENUM (
  '토목', '건축', '철근', '거푸집', '콘크리트', '방수', '단열',
  '조적', '타일', '석공', '미장', '도장', '유리', '창호',
  '금속', '기계설비', '전기', '소방', '통신', '기타'
);

-- 숙련도 enum
CREATE TYPE skill_level AS ENUM ('초급', '중급', '고급', '기능장');

-- 매칭 응답 enum
CREATE TYPE match_response AS ENUM ('pending', 'interested', 'not_interested', 'expired');

-- 알림 발송 방법 enum
CREATE TYPE notify_method AS ENUM ('kakao', 'sms', 'both');

-- ============================================================
-- 구직자 테이블
-- ============================================================
CREATE TABLE workers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  phone           TEXT NOT NULL UNIQUE,
  age             INT,
  city            TEXT NOT NULL,                   -- 거주 시/도
  district        TEXT,                             -- 거주 구/군
  job_category    job_category NOT NULL,
  skill_level     skill_level NOT NULL,
  experience_years INT DEFAULT 0,
  available_from  DATE,                             -- 근무 가능 시작일
  preferred_wage  INT,                              -- 희망 일당 (원)
  need_accommodation BOOLEAN DEFAULT false,         -- 숙소 필요 여부
  need_transportation BOOLEAN DEFAULT false,        -- 교통 필요 여부
  has_car         BOOLEAN DEFAULT false,
  certifications  TEXT[],                           -- 자격증 목록
  cert_image_url  TEXT,                             -- 자격증 사진 URL
  id_card_url     TEXT,                             -- 신분증 사진 URL
  notes           TEXT,
  is_active       BOOLEAN DEFAULT true,             -- 구직 활성 여부
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 구인 공고 테이블
-- ============================================================
CREATE TABLE job_postings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name          TEXT NOT NULL,
  contact_name          TEXT NOT NULL,
  contact_phone         TEXT NOT NULL,
  location_city         TEXT NOT NULL,              -- 현장 시/도
  location_district     TEXT,                       -- 현장 구/군
  location_address      TEXT,                       -- 현장 상세 주소
  job_category          job_category NOT NULL,
  skill_level_required  skill_level NOT NULL,
  workers_needed        INT NOT NULL DEFAULT 1,
  daily_wage            INT NOT NULL,               -- 일당 (원)
  work_start_date       DATE NOT NULL,
  work_end_date         DATE,
  age_min               INT,
  age_max               INT,
  accommodation_provided BOOLEAN DEFAULT false,
  transportation_provided BOOLEAN DEFAULT false,
  required_documents    TEXT[],                     -- 필요 서류 목록
  description           TEXT,
  status                TEXT DEFAULT 'open' CHECK (status IN ('open', 'filled', 'cancelled')),
  notify_sent_at        TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 매칭 결과 테이블
-- ============================================================
CREATE TABLE matches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id  UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  worker_id       UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  notify_method   notify_method DEFAULT 'both',
  notified_at     TIMESTAMPTZ,
  response        match_response DEFAULT 'pending',
  responded_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(job_posting_id, worker_id)
);

-- ============================================================
-- 알림 발송 로그 테이블
-- ============================================================
CREATE TABLE notification_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id    UUID REFERENCES matches(id) ON DELETE CASCADE,
  method      TEXT NOT NULL,                        -- 'kakao' | 'sms'
  recipient   TEXT NOT NULL,                        -- 수신 전화번호
  message     TEXT,
  status      TEXT DEFAULT 'pending',               -- 'pending' | 'sent' | 'failed'
  sent_at     TIMESTAMPTZ DEFAULT now(),
  error_msg   TEXT
);

-- ============================================================
-- 인덱스
-- ============================================================
CREATE INDEX idx_workers_city ON workers(city);
CREATE INDEX idx_workers_job_category ON workers(job_category);
CREATE INDEX idx_workers_skill_level ON workers(skill_level);
CREATE INDEX idx_workers_active ON workers(is_active);
CREATE INDEX idx_job_postings_status ON job_postings(status);
CREATE INDEX idx_matches_job ON matches(job_posting_id);
CREATE INDEX idx_matches_worker ON matches(worker_id);

-- ============================================================
-- RLS (Row Level Security) - 기본 설정
-- ============================================================
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- 구직자 등록: 누구나 INSERT 가능 (공개 폼)
CREATE POLICY "workers_insert_public" ON workers FOR INSERT WITH CHECK (true);
-- 구인 공고 등록: 누구나 INSERT 가능 (공개 폼)
CREATE POLICY "jobs_insert_public" ON job_postings FOR INSERT WITH CHECK (true);
-- 매칭 응답: match_id 아는 사람만 UPDATE 가능
CREATE POLICY "matches_response_update" ON matches FOR UPDATE USING (true);

-- Service Role은 모든 권한 (서버사이드 API에서 사용)
