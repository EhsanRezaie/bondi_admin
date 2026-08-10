// Hand-maintained API types mapping the backend admin API surface
// (app/schemas/admin.py, tickets.py, reports.py, system.py).

export interface PaginationParams {
  limit?: number;
  offset?: number;
  [key: string]: string | number | boolean | undefined;
}

// ---- Admin auth ----
export interface AdminLoginResult {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// ---- Users ----
export interface AdminUserPhoto {
  id: string;
  url: string;
  is_main: boolean;
  status: string;
  reject_reason?: string | null;
  face_verified: boolean;
  order: number;
  created_at?: string | null;
}

export interface AdminUser {
  // Account / UID
  id: string;
  email: string;
  phone?: string | null;
  phone_verified: boolean;
  google_id?: string | null;
  referral_code?: string | null;
  referred_by?: string | null;
  registration_status?: string | null;
  token_version?: number | null;
  is_active: boolean;
  created_at: string;
  last_seen_at?: string | null;

  // Profile / identity
  name: string;
  birth_date?: string | null;
  age: number;
  gender?: string | null;
  sexual_orientation?: string | null;
  bio?: string | null;

  // Appearance
  height?: number | null;
  weight?: number | null;
  body_type?: string | null;

  // Lifestyle
  relationship_status?: string | null;
  living_situation?: string | null;
  children_status?: string | null;
  smoking?: string | null;
  drinking?: string | null;

  // Background
  languages?: string[] | null;
  education?: string | null;
  workplace?: string | null;
  religion?: string | null;
  ethnicity?: string | null;
  political_orientation?: string | null;

  // Location
  lat?: number | null;
  lng?: number | null;
  country?: string | null;
  province?: string | null;
  city?: string | null;
  location_manual?: boolean | null;

  // Verification / premium
  is_verified?: boolean | null;
  verified_at?: string | null;
  is_premium: boolean;
  premium_until?: string | null;

  // Settings
  hide_last_seen: boolean;
  hide_online_status: boolean;

  // Relations
  interests?: string[] | null;
  photos?: AdminUserPhoto[] | null;

  // Stats
  total_likes_sent?: number | null;
  total_matches?: number | null;
  total_messages?: number | null;
  report_count?: number | null;
}

export interface AdminUserListResponse {
  users: AdminUser[];
  total: number;
  next_offset?: number | null;
}

export interface UserActivityEntry {
  date: string;
  swipes: number;
  matches: number;
  messages: number;
}

export interface AdminMessageResponse {
  success: boolean;
  message: string;
  user_id?: string | null;
  user_name?: string | null;
}

// ---- Photos ----
export interface AdminPendingPhoto {
  id: string;
  user_id: string;
  user_name?: string | null;
  user_email: string;
  url: string;
  is_main: boolean;
  status: string;
  face_verified: boolean;
  created_at?: string | null;
}

export interface AdminPhotoStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

export interface AdminPhotoActionResponse {
  message: string;
  photo_id: string;
}

export interface AdminPhotoRejectResponse {
  message: string;
  photo_id: string;
  reason: string;
}

export interface AdminPhotoVerifyResponse {
  message: string;
  photo_id: string;
  face_verified: boolean;
}

// ---- Reports ----
export interface AdminReport {
  id: string;
  reporter_id: string;
  reporter_name: string;
  reported_id: string;
  reported_name: string;
  reason: string;
  status: string; // pending | reviewed | action_taken
  admin_note?: string | null;
  created_at: string;
  resolved_at?: string | null;
}

// ---- Tickets ----
export interface AdminTicket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: string; // open | in_progress | closed
  admin_response?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface AdminTicketDetail extends AdminTicket {
  user_name: string;
  user_email: string;
}

export interface AdminTicketListResponse {
  tickets: AdminTicket[];
  total: number;
  next_offset?: number | null;
}

// ---- Dashboard ----
export interface DashboardOverview {
  total_users: number;
  active_today: number;
  new_users_today: number;
  new_users_this_week: number;
  premium_users: number;
  premium_percentage: number;
  total_swipes_today: number;
  total_matches_today: number;
  total_messages_today: number;
  pending_photos: number;
  pending_reports: number;
  open_tickets: number;
}

export interface TimeSeriesResponse {
  labels: string[];
  new_users: number[];
  active_users: number[];
}

export interface ActivitySeriesResponse {
  labels: string[];
  swipes: number[];
  matches: number[];
  messages: number[];
}

export interface ReportStatsResponse {
  pending: number;
  reviewed: number;
  action_taken: number;
}

export interface TicketStatsResponse {
  open: number;
  in_progress: number;
  closed: number;
}

// ---- Announcements ----
export interface AdminAnnouncementResponse {
  success: boolean;
  message: string;
  recipient_count: number;
}

// ---- Audit logs ----
export interface AdminLogEntry {
  id: string;
  admin_id: string;
  action: string;
  target_type?: string | null;
  target_id?: string | null;
  ip_address?: string | null;
  created_at: string;
}

export interface AdminLogListResponse {
  logs: AdminLogEntry[];
  total: number;
  page: number;
  page_size: number;
}

// ---- Messages ----
export interface AdminMessageDecryptResponse {
  message_id: string;
  sender_id: string;
  receiver_id: string;
  chat_id: string;
  content: string;
  sent_at?: string | null;
}

export interface AdminMessageDeleteResponse {
  message: string;
  message_id: string;
  reason: string;
}

export interface AdminReportedMessageResponse {
  report_id: string;
  message_id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  sent_at?: string | null;
  report_reason: string;
  report_description?: string | null;
}

// ---- System / ops ----
export interface SystemServiceStatus {
  status: string;
  latency_ms?: number | null;
}

export interface SystemServicesStatus {
  database: SystemServiceStatus;
  redis: SystemServiceStatus;
  storage: SystemServiceStatus;
}

export interface SystemMaintenanceStatus {
  enabled: boolean;
  message?: string | null;
  start_time?: string | null;
  end_time?: string | null;
}

export interface SystemStatusResponse {
  status: string;
  timestamp: string;
  version: string;
  environment: string;
  services: SystemServicesStatus;
  maintenance: SystemMaintenanceStatus;
}

export interface MaintenanceStatusResponse {
  maintenance_mode: boolean;
  message?: string | null;
  start_time?: string | null;
  end_time?: string | null;
}

export interface MaintenanceEnableResponse {
  status: string;
  message: string;
  data: SystemMaintenanceStatus;
}

export interface VersionConfigResponse {
  status: string;
  data: {
    minimum_versions: { android: string; ios: string };
    force_update: boolean;
    force_update_message?: string | null;
    app_version: string;
    play_store_url?: string | null;
    app_store_url?: string | null;
  };
}

export interface SimpleOkResponse {
  status: string;
  message: string;
  data?: unknown;
}