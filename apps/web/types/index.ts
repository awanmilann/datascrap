export type Role = 'user' | 'admin'

export type ProjectStatus = 'active' | 'archived' | 'deleted'

export type DataType = 'product' | 'article' | 'business' | 'custom'

export type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'rejected'

export interface Profile {
  id: string
  full_name: string | null
  email: string | null
  role: Role
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface UserConsent {
  id: string
  user_id: string
  consent_text: string
  consent_version: string
  consent_at: string
  created_at: string
}

export interface Project {
  id: string
  user_id: string
  name: string
  description: string | null
  data_type: DataType
  status: ProjectStatus
  created_at: string
  updated_at: string
}

export interface ProjectUrl {
  id: string
  project_id: string
  url: string
  domain: string
  is_active: boolean
  robots_allowed: boolean | null
  robots_checked_at: string | null
  created_at: string
  updated_at: string
}

export interface ScrapeJob {
  id: string
  project_id: string
  user_id: string
  status: JobStatus
  total_urls: number
  processed_urls: number
  total_items: number
  started_at: string | null
  completed_at: string | null
  error_message: string | null
  rejection_reason: string | null
  created_at: string
  updated_at: string
}

export interface ScrapedItem {
  id: string
  project_id: string
  scrape_job_id: string
  title: string | null
  price: string | null
  description: string | null
  image_url: string | null
  source_url: string | null
  published_date: string | null
  raw_data: any
  scraped_at: string
  created_at: string
}

export interface ExportLog {
  id: string
  project_id: string
  user_id: string
  file_name: string
  file_path: string
  total_items: number
  created_at: string
}

export interface AuditLog {
  id: string
  user_id: string
  action: string
  entity_type: string
  entity_id: string
  domain: string | null
  metadata: any
  created_at: string
}

export interface DomainBlocklist {
  id: string
  domain: string
  reason: string | null
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface ErrorLog {
  id: string
  scrape_job_id: string
  project_id: string
  url: string
  error_code: string | null
  error_message: string | null
  error_stack: string | null
  created_at: string
}

export interface DashboardStats {
  total_projects: number
  total_urls: number
  total_items: number
  active_jobs: number
  completed_jobs: number
  failed_jobs: number
}

export interface DailyActivity {
  date: string
  count: number
}
