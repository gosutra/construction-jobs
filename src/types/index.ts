export type JobCategory =
  | '토목' | '건축' | '철근' | '형틀(거푸집)' | '콘크리트' | '방수' | '단열'
  | '조적' | '타일' | '석공' | '미장' | '도장' | '유리' | '창호'
  | '금속' | '기계설비' | '배관' | '덕트' | '용접' | '트레이'
  | '시스템 비계' | '강관비계' | '칸막이' | '바닥재(악세스플로어)'
  | '전기' | '소방' | '통신'
  | '유도원/신호수' | '화재감시자' | '안전감시단' | '기타';

export type SkillLevel = '조공' | '준기공' | '기공';
export type MatchResponse = 'pending' | 'interested' | 'not_interested' | 'expired';

export const JOB_CATEGORIES: JobCategory[] = [
  // 구조·콘크리트
  '토목', '건축', '철근', '형틀(거푸집)', '콘크리트',
  // 마감
  '방수', '단열', '조적', '타일', '석공', '미장', '도장', '유리', '창호',
  '칸막이', '바닥재(악세스플로어)',
  // 설비·기계
  '기계설비', '배관', '덕트', '용접', '트레이',
  // 비계·가설
  '시스템 비계', '강관비계', '금속',
  // 전기·소방·통신
  '전기', '소방', '통신',
  // 안전·감시
  '유도원/신호수', '화재감시자', '안전감시단',
  // 기타
  '기타',
];
export const SKILL_LEVELS: SkillLevel[] = ['조공', '준기공', '기공'];
export const CITIES = [
  '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
  '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
];
export const WORKER_DOCUMENTS = [
  '신분증', '외국인등록증', '건설기초안전보건이수증',
  '배치전건강진단표', '통장사본', '비계이수증',
];

// 생년월일 6자리로 나이 계산 (YYMMDD)
export function calcAgeFromBirthDate(birthDate: string): number {
  if (!birthDate || birthDate.length !== 6) return 0;
  const yy = parseInt(birthDate.substring(0, 2));
  const mm = parseInt(birthDate.substring(2, 4));
  const dd = parseInt(birthDate.substring(4, 6));
  const fullYear = yy > 30 ? 1900 + yy : 2000 + yy;
  const today = new Date();
  let age = today.getFullYear() - fullYear;
  const bMonth = mm - 1;
  if (today.getMonth() < bMonth || (today.getMonth() === bMonth && today.getDate() < dd)) age--;
  return age;
}

export interface Worker {
  id: string;
  name: string;
  phone: string;
  birth_date?: string;   // YYMMDD 6자리
  age?: number;          // birth_date에서 계산
  gender?: '남' | '여';
  city: string;
  district?: string;
  job_category: JobCategory;
  skill_level: SkillLevel;
  experience_years: number;
  available_from?: string;
  preferred_wage?: number;
  need_accommodation: boolean;
  need_transportation: boolean;
  has_car: boolean;
  certifications?: string[];
  cert_image_url?: string;
  id_card_url?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
}

export interface JobPosting {
  id: string;
  company_name: string;
  contact_name: string;
  contact_phone: string;
  location_city: string;
  location_district?: string;
  location_address?: string;
  job_category: JobCategory;
  skill_level_required: SkillLevel;
  workers_needed: number;
  daily_wage: number;
  work_start_date: string;
  work_end_date?: string;
  age_min?: number;
  age_max?: number;
  gender_preference?: '남' | '여' | '성별무관';
  pay_day?: string;
  accommodation_provided: boolean;
  transportation_provided: boolean;
  meal_provided: boolean;
  required_documents?: string[];
  document_deadline?: string;
  description?: string;
  status: 'open' | 'filled' | 'cancelled';
  created_at: string;
}

export interface Match {
  id: string;
  job_posting_id: string;
  worker_id: string;
  notify_method: 'kakao' | 'sms' | 'both';
  notified_at?: string;
  response: MatchResponse;
  responded_at?: string;
  created_at: string;
  worker?: Worker;
  job_posting?: JobPosting;
}

export interface WorkerFormData {
  name: string;
  phone: string;
  birth_date: string;    // YYMMDD 6자리
  gender: '남' | '여';
  city: string;
  district: string;
  job_category: JobCategory;
  skill_level: SkillLevel;
  experience_years: number;
  available_from: string;
  preferred_wage: number;
  need_accommodation: boolean;
  need_transportation: boolean;
  has_car: boolean;
  certifications: string[];
  notes: string;
}

export interface JobPostingFormData {
  company_name: string;
  contact_name: string;
  contact_phone: string;
  location_city: string;
  location_district: string;
  location_address: string;
  job_category: JobCategory;
  skill_level_required: SkillLevel;
  workers_needed: number;
  daily_wage: number;
  work_start_date: string;
  work_end_date: string;
  age_min: number;
  age_max: number;
  gender_preference: '남' | '여' | '성별무관';
  pay_day: string;
  accommodation_provided: boolean;
  transportation_provided: boolean;
  meal_provided: boolean;
  required_documents: string[];
  document_deadline: string;
  description: string;
}