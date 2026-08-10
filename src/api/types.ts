// Hand-maintained API types. When an OpenAPI snapshot is available, regenerate
// these with: npm run gen:types -- --path <openapi.json>

export interface AdminDashboardOverview {
  total_users: number;
  active_today: number;
  new_today: number;
  total_photos: number;
  pending_photos: number;
  open_reports: number;
  open_tickets: number;
}

export interface UserStatsPoint {
  date: string;
  count: number;
}

export interface StatsResponse<T> {
  total: number;
  items: T[];
}

export interface UserDto {
  id: number;
  email: string;
  name?: string;
  age?: number;
  gender?: string;
  bio?: string;
  is_verified?: boolean;
  is_active?: boolean;
  photos_count?: number;
  reports_count?: number;
  created_at?: string;
}

export interface UserListResponse extends StatsResponse<UserDto> {}

export interface PhotoDto {
  id: number;
  user_id: number;
  url: string;
  is_primary: boolean;
  is_approved: boolean;
  moderation_note?: string;
  created_at?: string;
}

export interface PhotoListResponse extends StatsResponse<PhotoDto> {}

export interface ReportDto {
  id: number;
  reporter_id: number;
  target_id: number;
  reason: string;
  status: string;
  created_at?: string;
}

export interface ReportListResponse extends StatsResponse<ReportDto> {}

export interface TicketDto {
  id: number;
  user_id: number;
  subject: string;
  status: string;
  created_at?: string;
}

export interface TicketListResponse extends StatsResponse<TicketDto> {}

export interface AnnouncementDto {
  id: number;
  title: string;
  message: string;
  audience?: string;
  created_by?: string;
  created_at?: string;
}

export interface AnnouncementListResponse extends StatsResponse<AnnouncementDto> {}

export interface AdminLogEntry {
  id: number;
  admin_id: string;
  action: string;
  target_type?: string;
  target_id?: string;
  ip?: string;
  created_at: string;
}

export interface AdminLogListResponse extends StatsResponse<AdminLogEntry> {}

export interface PaginationParams {
  page?: number;
  page_size?: number;
  [key: string]: string | number | boolean | undefined;
}