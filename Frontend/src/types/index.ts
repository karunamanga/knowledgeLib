export type RoleName = 'EMPLOYEE' | 'MENTOR' | 'ADMIN';

export type PermissionCode =
  | 'knowledge:read'
  | 'knowledge:create'
  | 'knowledge:update'
  | 'knowledge:delete'
  | 'learning:read'
  | 'learning:create'
  | 'learning:update'
  | 'learning:delete'
  | 'path:read'
  | 'path:manage'
  | 'submission:create'
  | 'submission:read'
  | 'submission:review'
  | 'project:read'
  | 'project:manage'
  | 'user:read'
  | 'user:update'
  | 'user:manage'
  | 'category:manage'
  | 'audit:read';

export type ResourceType =
  | 'DOCUMENT'
  | 'PDF'
  | 'PRESENTATION'
  | 'VIDEO'
  | 'IMAGE'
  | 'DIAGRAM'
  | 'ARCHITECTURE'
  | 'LINK'
  | 'OTHER';

export type SubmissionStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'RESUBMITTED';

export type LearningStatus = 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED';

export interface Permission {
  id: number;
  code: string;
  name: string;
  description?: string;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions?: Permission[];
}

export interface User {
  id: number;
  auth_user_id?: string;
  employee_id?: string;
  email: string;
  full_name: string;
  designation?: string;
  department?: string;
  joining_date?: string;
  avatar_url?: string;
  is_active: boolean;
  roles: Role[];
  permissions: string[];
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  created_at: string;
}

export interface ResourceAuthor {
  id: number;
  full_name: string;
  email: string;
  avatar_url?: string;
  designation?: string;
}

export interface Resource {
  id: number;
  title: string;
  description?: string;
  resource_type: ResourceType;
  category_id?: number;
  category?: Category;
  author_id: number;
  author: ResourceAuthor;
  file_path?: string;
  preview_path?: string;
  file_name?: string;
  file_type?: string;
  mime_type?: string;
  storage_bucket?: string;
  preview_url?: string;
  file_url?: string;
  download_url?: string;
  storage_key?: string;
  original_filename?: string;
  external_url?: string;
  file_size?: number;
  content_type?: string;
  view_count: number;
  download_count: number;
  tags: Tag[];
  created_at: string;
  updated_at: string;
}

export interface ModuleResource {
  id: number;
  module_id: number;
  resource_id: number;
  order_index: number;
  resource?: Resource;
}

export interface LearningModule {
  id: number;
  path_id: number;
  title: string;
  description?: string;
  order_index: number;
  resources: ModuleResource[];
  is_completed?: boolean;
  created_at: string;
  updated_at: string;
}

export interface LearningPath {
  id: number;
  title: string;
  description?: string;
  level: string;
  estimated_hours: number;
  is_published: boolean;
  author_id?: number;
  modules_count: number;
  user_progress_percentage: number;
  user_status: string;
  modules?: LearningModule[];
  created_at: string;
  updated_at: string;
}

export interface LearningEntry {
  id: number;
  user_id: number;
  user?: ResourceAuthor;
  title: string;
  description: string;
  work_completed?: string;
  learning_date: string;
  status: LearningStatus;
  resources: Resource[];
  created_at: string;
  updated_at: string;
}

export interface SubmissionHistory {
  id: number;
  submission_id: number;
  status: SubmissionStatus;
  actor_id?: number;
  actor?: ResourceAuthor;
  comments?: string;
  created_at: string;
}

export interface Submission {
  id: number;
  user_id: number;
  user: ResourceAuthor;
  learning_entry_id?: number;
  learning_entry?: LearningEntry;
  title: string;
  description?: string;
  status: SubmissionStatus;
  reviewer_id?: number;
  reviewer?: ResourceAuthor;
  feedback?: string;
  submitted_at?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
  history?: SubmissionHistory[];
}

export interface Project {
  id: number;
  name: string;
  slug: string;
  problem_statement?: string;
  description: string;
  technologies?: string;
  repository_url?: string;
  documentation_url?: string;
  architecture_summary?: string;
  created_by?: number;
  creator?: ResourceAuthor;
  resources: Resource[];
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  user_email?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  details?: string;
  ip_address?: string;
  created_at: string;
}

export interface DashboardSummary {
  user_name: string;
  greeting: string;
  learning_progress_pct: number;
  total_learning_entries: number;
  completed_learning_entries: number;
  pending_submissions: number;
  approved_submissions: number;
  resources_explored: number;
  total_org_resources: number;
  total_learning_paths: number;
  recent_resources: Resource[];
  active_paths: LearningPath[];
  recent_entries: LearningEntry[];
  pending_reviews_count: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface APIResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error_code?: string;
}
