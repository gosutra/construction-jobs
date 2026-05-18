import { createServiceClient } from './supabase';
import type { JobPosting, Worker } from '@/types';

/**
 * 구인 공고 조건에 맞는 구직자를 DB에서 자동 추출합니다.
 * 조건: 직종 일치 + 숙련도 일치 + 거주지 우선 + 연령 조건 + 활성 상태
 */
export async function findMatchingWorkers(job: JobPosting): Promise<Worker[]> {
  const supabase = createServiceClient();

  let query = supabase
    .from('workers')
    .select('*')
    .eq('is_active', true)
    .eq('job_category', job.job_category)
    .eq('skill_level', job.skill_level_required);

  // 연령 조건
  if (job.age_min) query = query.gte('age', job.age_min);
  if (job.age_max) query = query.lte('age', job.age_max);

  const { data, error } = await query.order('city').limit(100);

  if (error) throw new Error(`매칭 쿼리 오류: ${error.message}`);
  if (!data) return [];

  // 거주지 우선 정렬: 현장 도시 거주자를 앞으로
  const sorted = (data as Worker[]).sort((a, b) => {
    const aLocal = a.city === job.location_city ? 0 : 1;
    const bLocal = b.city === job.location_city ? 0 : 1;
    return aLocal - bLocal;
  });

  // 필요 인원의 3배수 추출 (선택권 제공)
  return sorted.slice(0, job.workers_needed * 3);
}

/**
 * 이미 이 공고에 알림을 받은 구직자는 제외합니다.
 */
export async function filterAlreadyNotified(
  jobId: string,
  workers: Worker[]
): Promise<Worker[]> {
  const supabase = createServiceClient();
  const workerIds = workers.map(w => w.id);

  const { data } = await supabase
    .from('matches')
    .select('worker_id')
    .eq('job_posting_id', jobId)
    .in('worker_id', workerIds);

  const alreadyNotified = new Set((data || []).map((m: { worker_id: string }) => m.worker_id));
  return workers.filter(w => !alreadyNotified.has(w.id));
}
