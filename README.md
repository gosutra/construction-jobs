# 🏗️ 건설현장 인력 플랫폼

건설현장 구인·구직을 자동으로 매칭해주는 **Push형 인력 중개 플랫폼**입니다.
구직자가 조건을 등록해두면, 맞는 공고가 생겼을 때 카카오 알림톡·SMS로 자동 알림을 받습니다.

## ✨ 주요 기능

- **구직자 등록** — 직종, 숙련도, 거주지, 희망 조건 등록 (모바일 최적화, 3분 완료)
- **구인 공고 등록** — 일당, 기간, 위치, 숙소·교통·식사 제공 여부 등 상세 조건 입력
- **자동 매칭** — 공고 등록 즉시 조건에 맞는 구직자 자동 추출
- **자동 알림 발송** — 카카오 알림톡 우선 → 실패 시 SMS 자동 전환
- **구직자 응답** — 알림 링크 클릭으로 지원 의향 원터치 응답
- **관리자 대시보드** — 구직자·공고·매칭 현황 실시간 조회 (비밀번호 보호)

## 🛠️ 기술 스택

| 분류 | 기술 |
|------|------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Next.js API Routes (Serverless) |
| Database | Supabase (PostgreSQL) |
| 알림 발송 | Coolsms (카카오 알림톡 + SMS) |
| 배포 | Vercel |

## 📱 화면 구성

| 경로 | 설명 |
|------|------|
| `/` | 메인 랜딩 페이지 |
| `/worker/register` | 구직자 등록 폼 (3단계) |
| `/employer/post` | 구인 공고 등록 폼 |
| `/worker/respond?matchId=` | 구직자 응답 페이지 (알림 링크) |
| `/admin` | 관리자 대시보드 (비밀번호 보호) |

## ⚙️ 환경변수

`.env.local` 파일에 아래 변수를 설정하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
COOLSMS_API_KEY=
COOLSMS_API_SECRET=
COOLSMS_SENDER_PHONE=
KAKAO_CHANNEL_ID=
KAKAO_TEMPLATE_MATCH=
ADMIN_PASSWORD=
ADMIN_SECRET=
```

## 🚀 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3000 접속

## 📋 매칭 알고리즘

1. 직종 일치
2. 숙련도 조건 충족 (조공 / 준기공 / 기공)
3. 연령 범위 조건
4. 거주 지역 근접순 정렬
5. 이미 알림을 받은 구직자 제외