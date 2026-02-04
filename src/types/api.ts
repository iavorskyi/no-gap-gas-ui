// User types
export interface User {
  id: number;
  email: string;
  created_at: string;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface RefreshResponse {
  access_token: string;
  expires_in: number;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

// Config types
export interface MonthlyIncrements {
  [key: string]: number;
}

export interface UserConfig {
  id: number;
  user_id: number;
  gasolina_email: string;
  account_number: string;
  check_url: string;
  cron_schedule: string;
  dry_run: boolean;
  monthly_increments: MonthlyIncrements;
  configured: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateConfigRequest {
  gasolina_email?: string;
  gasolina_password?: string;
  account_number?: string;
  check_url?: string;
  cron_schedule?: string;
  dry_run?: boolean;
  monthly_increments?: MonthlyIncrements;
}

// Job types
export type JobType = 'full' | 'test-login' | 'test-check';
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface Job {
  id: string;
  user_id: number;
  type: JobType;
  status: JobStatus;
  error: string | null;
  logs: string[] | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  screenshots?: Screenshot[];
}

export interface CreateJobRequest {
  type: JobType;
}

export interface JobsResponse {
  jobs: Job[];
  total: number;
}

// Screenshot types
export interface Screenshot {
  id: number;
  job_id: string;
  user_id: number;
  filename: string;
  url: string;
  created_at: string;
}

// Status types
export interface ServiceStatus {
  configured: boolean;
  recent_jobs: Job[];
}

// Error response
export interface ApiError {
  error: string;
}

// Gasolina user info (scraped from gasolina-online.com)
export interface GasolinaUserInfo {
  user_name: string;
  user_address: string;
  gas_distribution_price: string;
  gas_distribution_debt: string;
  gas_distribution_date: string;
  counter_number: string;
  counter_type: string;
  previous_reading: string;
  tech_service_debt: string;
  tech_service_date: string;
  fetched_at: string;
}
