/**
 * 알림 발송 서비스 (Coolsms - SMS + 카카오 알림톡)
 * Coolsms 가입 후 API 키 발급: https://coolsms.co.kr
 */

import type { Match, JobPosting, Worker } from '@/types';

/* ── 환경변수 (! assertion 대신 ?? '' 사용 → undefined 런타임 에러 방지) ── */
const COOLSMS_API_KEY  = process.env.COOLSMS_API_KEY  ?? '';
const COOLSMS_API_SECRET = process.env.COOLSMS_API_SECRET ?? '';
const SENDER_PHONE     = process.env.COOLSMS_SENDER_PHONE ?? '';
const KAKAO_CHANNEL_ID = process.env.KAKAO_CHANNEL_ID  ?? '';
const KAKAO_TEMPLATE_ID = process.env.KAKAO_TEMPLATE_MATCH ?? '';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

/** 필수 환경변수 설정 여부 확인 */
function isSMSConfigured(): boolean {
  return !!(COOLSMS_API_KEY && COOLSMS_API_SECRET && SENDER_PHONE);
}
function isKakaoConfigured(): boolean {
  return !!(COOLSMS_API_KEY && COOLSMS_API_SECRET && SENDER_PHONE && KAKAO_CHANNEL_ID && KAKAO_TEMPLATE_ID);
}

/** 날짜 문자열을 한국어 형식으로 포맷 (중복 제거) */
function formatDate(dateStr: string, options?: Intl.DateTimeFormatOptions): string {
  return new Date(dateStr).toLocaleDateString('ko-KR', options ?? { month: 'long', day: 'numeric' });
}

/** 구직자에게 발송할 매칭 메시지 생성 */
function buildMatchMessage(worker: Worker, job: JobPosting, matchId: string): string {
  const wage        = job.daily_wage.toLocaleString('ko-KR');
  const startDate   = formatDate(job.work_start_date);
  const endDate     = job.work_end_date ? formatDate(job.work_end_date) : '미정';
  const accommodation = job.accommodation_provided ? '✅ 제공' : '❌ 미제공';
  const transport     = job.transportation_provided ? '✅ 제공' : '❌ 미제공';
  const responseUrl = `${BASE_URL}/worker/response/${matchId}`;

  return `[일자리 제안] ${worker.name}님, 조건에 맞는 현장이 있습니다!

📍 현장위치: ${job.location_city} ${job.location_district || ''}
🔨 공종: ${job.job_category} (${job.skill_level_required})
💰 일당: ${wage}원
📅 기간: ${startDate} ~ ${endDate}
🏠 숙소: ${accommodation}
🚌 교통: ${transport}
🏢 업체: ${job.company_name}

👇 지원 의향을 알려주세요 (24시간 내)
${responseUrl}`;
}

/** Coolsms API 서명 생성 (HMAC-SHA256) */
async function getCoolsmsHeaders() {
  const date      = new Date().toISOString();
  const salt      = Math.random().toString(36).substring(2, 12);
  const data      = date + salt;
  const encoder   = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(COOLSMS_API_SECRET),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig       = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const signature = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  return {
    'Authorization': `HMAC-SHA256 apiKey=${COOLSMS_API_KEY}, date=${date}, salt=${salt}, signature=${signature}`,
    'Content-Type': 'application/json',
  };
}

/** SMS 발송 */
export async function sendSMS(to: string, text: string): Promise<boolean> {
  if (!isSMSConfigured()) {
    console.warn('[SMS] 환경변수 미설정 — COOLSMS_API_KEY, COOLSMS_API_SECRET, COOLSMS_SENDER_PHONE 확인 필요');
    return false;
  }
  try {
    const headers = await getCoolsmsHeaders();
    const res = await fetch('https://api.coolsms.co.kr/messages/v4/send', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: {
          to: to.replace(/-/g, ''),
          from: SENDER_PHONE,
          text,
          type: 'LMS',
        },
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error('[SMS] 발송 실패:', res.status, body);
    }
    return res.ok;
  } catch (err) {
    console.error('[SMS] 발송 오류:', err);
    return false;
  }
}

/** 카카오 알림톡 발송 */
export async function sendKakaoAlimtalk(
  to: string,
  worker: Worker,
  job: JobPosting,
  matchId: string
): Promise<boolean> {
  if (!isKakaoConfigured()) {
    console.warn('[Kakao] 환경변수 미설정 — KAKAO_CHANNEL_ID, KAKAO_TEMPLATE_MATCH 확인 필요');
    return false;
  }
  try {
    const headers     = await getCoolsmsHeaders();
    const wage        = job.daily_wage.toLocaleString('ko-KR');
    const startDate   = formatDate(job.work_start_date);
    const responseUrl = `${BASE_URL}/worker/response/${matchId}`;

    const res = await fetch('https://api.coolsms.co.kr/messages/v4/send', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: {
          to: to.replace(/-/g, ''),
          from: SENDER_PHONE,
          kakaoOptions: {
            pfId: KAKAO_CHANNEL_ID,
            templateId: KAKAO_TEMPLATE_ID,
            variables: {
              '#{이름}':    worker.name,
              '#{현장위치}': `${job.location_city} ${job.location_district || ''}`.trim(),
              '#{공종}':    `${job.job_category} (${job.skill_level_required})`,
              '#{일당}':    `${wage}원`,
              '#{시작일}':  startDate,
              '#{업체명}':  job.company_name,
              '#{응답링크}': responseUrl,
            },
          },
          type: 'ATA',
        },
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error('[Kakao] 발송 실패:', res.status, body);
    }
    return res.ok;
  } catch (err) {
    console.error('[Kakao] 발송 오류:', err);
    return false;
  }
}

/** 매칭된 구직자에게 알림 발송 (카카오 우선, 실패 시 SMS fallback) */
export async function notifyWorker(
  match: Match,
  worker: Worker,
  job: JobPosting
): Promise<{ method: string; success: boolean }> {
  const message = buildMatchMessage(worker, job, match.id);

  const kakaoOk = await sendKakaoAlimtalk(worker.phone, worker, job, match.id);
  if (kakaoOk) return { method: 'kakao', success: true };

  const smsOk = await sendSMS(worker.phone, message);
  return { method: 'sms', success: smsOk };
}
