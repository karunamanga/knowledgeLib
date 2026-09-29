import { apiClient } from './client';
import {
  APIResponse,
  PaginatedResult,
  User,
  Role,
  Permission,
  Category,
  Tag,
  Resource,
  ResourceType,
  LearningPath,
  LearningEntry,
  Submission,
  SubmissionStatus,
  Project,
  AuditLog,
  DashboardSummary,
} from '../types';

export const authApi = {
  register: (data: {
    email: string;
    password: string;
    full_name: string;
    designation?: string;
    department?: string;
    employee_id?: string;
    auth_user_id?: string;
  }) =>
    apiClient.post<APIResponse<{ access_token: string; refresh_token: string; expires_in: number }>>(
      '/auth/register',
      data
    ),
  login: (data: { email: string; password: string }) =>
    apiClient.post<APIResponse<{ access_token: string; refresh_token: string; expires_in: number }>>(
      '/auth/login',
      data
    ),
  refresh: (refreshToken: string) =>
    apiClient.post<APIResponse<{ access_token: string; refresh_token: string }>>('/auth/refresh', {
      refresh_token: refreshToken,
    }),
  logout: (refreshToken: string) =>
    apiClient.post<APIResponse<boolean>>('/auth/logout', { refresh_token: refreshToken }),
  getMe: () => apiClient.get<APIResponse<User>>('/auth/me'),
};

export const dashboardApi = {
  getSummary: () => apiClient.get<APIResponse<DashboardSummary>>('/dashboard/summary'),
};

export const knowledgeApi = {
  list: (params?: {
    search?: string;
    category_id?: number;
    resource_type?: ResourceType;
    tag?: string;
    author_id?: number;
    sort_by?: string;
    sort_order?: string;
    page?: number;
    page_size?: number;
  }) => apiClient.get<APIResponse<PaginatedResult<Resource>>>('/knowledge', { params }),
  get: (id: number) => apiClient.get<APIResponse<Resource>>(`/knowledge/${id}`),
  create: (data: any) => apiClient.post<APIResponse<Resource>>('/knowledge', data),
  upload: (formData: FormData) =>
    apiClient.post<APIResponse<Resource>>('/knowledge/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (id: number, data: any) => apiClient.put<APIResponse<Resource>>(`/knowledge/${id}`, data),
  delete: (id: number) => apiClient.delete<APIResponse<boolean>>(`/knowledge/${id}`),
};

export const categoriesApi = {
  listCategories: () => apiClient.get<APIResponse<Category[]>>('/categories'),
  createCategory: (data: { name: string; description?: string; icon?: string; color?: string }) =>
    apiClient.post<APIResponse<Category>>('/categories', data),
  updateCategory: (id: number, data: any) =>
    apiClient.put<APIResponse<Category>>(`/categories/${id}`, data),
  deleteCategory: (id: number) => apiClient.delete<APIResponse<boolean>>(`/categories/${id}`),
  listTags: () => apiClient.get<APIResponse<Tag[]>>('/categories/tags'),
  createTag: (name: string) => apiClient.post<APIResponse<Tag>>('/categories/tags', { name }),
};

export const learningPathsApi = {
  list: (params?: { search?: string; level?: string; page?: number; page_size?: number }) =>
    apiClient.get<APIResponse<PaginatedResult<LearningPath>>>('/learning-paths', { params }),
  get: (id: number) => apiClient.get<APIResponse<LearningPath>>(`/learning-paths/${id}`),
  create: (data: any) => apiClient.post<APIResponse<LearningPath>>('/learning-paths', data),
  update: (id: number, data: any) =>
    apiClient.put<APIResponse<LearningPath>>(`/learning-paths/${id}`, data),
  delete: (id: number) => apiClient.delete<APIResponse<boolean>>(`/learning-paths/${id}`),
  toggleModuleProgress: (moduleId: number) =>
    apiClient.post<APIResponse<{ module_id: number; is_completed: boolean; path_progress_percentage: number; path_status: string }>>(
      `/learning-paths/modules/${moduleId}/toggle-progress`
    ),
};

export const learningApi = {
  list: (params?: {
    search?: string;
    user_id?: number;
    from_date?: string;
    to_date?: string;
    all_users?: boolean;
    page?: number;
    page_size?: number;
  }) => apiClient.get<APIResponse<PaginatedResult<LearningEntry>>>('/learning', { params }),
  get: (id: number) => apiClient.get<APIResponse<LearningEntry>>(`/learning/${id}`),
  create: (data: {
    title: string;
    description: string;
    work_completed?: string;
    learning_date?: string;
    status?: string;
    resource_ids?: number[];
  }) => apiClient.post<APIResponse<LearningEntry>>('/learning', data),
  update: (id: number, data: any) => apiClient.put<APIResponse<LearningEntry>>(`/learning/${id}`, data),
  delete: (id: number) => apiClient.delete<APIResponse<boolean>>(`/learning/${id}`),
};

export const submissionsApi = {
  list: (params?: {
    status?: SubmissionStatus;
    search?: string;
    all_users?: boolean;
    page?: number;
    page_size?: number;
  }) => apiClient.get<APIResponse<PaginatedResult<Submission>>>('/submissions', { params }),
  get: (id: number) => apiClient.get<APIResponse<Submission>>(`/submissions/${id}`),
  create: (
    data: { title: string; description?: string; learning_entry_id?: number },
    asSubmitted = true
  ) =>
    apiClient.post<APIResponse<Submission>>('/submissions', data, {
      params: { as_submitted: asSubmitted },
    }),
  submit: (id: number) => apiClient.post<APIResponse<Submission>>(`/submissions/${id}/submit`),
  delete: (id: number) => apiClient.delete<APIResponse<boolean>>(`/submissions/${id}`),
};

export const reviewsApi = {
  listPending: (params?: {
    status?: SubmissionStatus;
    search?: string;
    page?: number;
    page_size?: number;
  }) => apiClient.get<APIResponse<PaginatedResult<Submission>>>('/reviews/pending', { params }),
  review: (id: number, data: { status: SubmissionStatus; feedback: string }) =>
    apiClient.post<APIResponse<Submission>>(`/reviews/${id}/review`, data),
};

export const projectsApi = {
  list: (params?: { search?: string; page?: number; page_size?: number }) =>
    apiClient.get<APIResponse<PaginatedResult<Project>>>('/projects', { params }),
  get: (id: number) => apiClient.get<APIResponse<Project>>(`/projects/${id}`),
  create: (data: any) => apiClient.post<APIResponse<Project>>('/projects', data),
  update: (id: number, data: any) => apiClient.put<APIResponse<Project>>(`/projects/${id}`, data),
  delete: (id: number) => apiClient.delete<APIResponse<boolean>>(`/projects/${id}`),
};

export const usersApi = {
  getMe: () => apiClient.get<APIResponse<User>>('/users/me'),
  updateMe: (data: Partial<User>) => apiClient.patch<APIResponse<User>>('/users/me', data),
  uploadAvatar: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return apiClient.post<APIResponse<User>>('/users/me/avatar', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  removeAvatar: () => apiClient.delete<APIResponse<User>>('/users/me/avatar'),
  list: (params?: {
    search?: string;
    role_id?: number;
    is_active?: boolean;
    page?: number;
    page_size?: number;
  }) => apiClient.get<APIResponse<PaginatedResult<User>>>('/users', { params }),
  get: (id: number) => apiClient.get<APIResponse<User>>(`/users/${id}`),
  create: (data: any) => apiClient.post<APIResponse<User>>('/users', data),
  update: (id: number, data: any) => apiClient.put<APIResponse<User>>(`/users/${id}`, data),
  updateRoles: (id: number, roleIds: number[]) =>
    apiClient.put<APIResponse<User>>(`/users/${id}/roles`, { role_ids: roleIds }),
  getStats: (id: number) => apiClient.get<APIResponse<any>>(`/users/${id}/stats`),
  listRoles: () => apiClient.get<APIResponse<Role[]>>('/users/roles/all'),
  listPermissions: () => apiClient.get<APIResponse<Permission[]>>('/users/permissions/all'),
};

export const auditApi = {
  list: (params?: { action?: string; user_id?: number; page?: number; page_size?: number }) =>
    apiClient.get<APIResponse<PaginatedResult<AuditLog>>>('/audit-logs', { params }),
};
