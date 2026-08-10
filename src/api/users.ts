import { client } from './client';
import type {
  AdminUser,
  AdminUserListResponse,
  UserActivityEntry,
  AdminMessageResponse
} from './types';

export interface UserQuery {
  search?: string;
  is_active?: boolean;
  is_premium?: boolean;
  limit: number;
  offset: number;
}

export async function fetchUsers(params: UserQuery): Promise<AdminUserListResponse> {
  const { data } = await client.get<AdminUserListResponse>('/admin/users', { params });
  return data;
}

export async function fetchUser(id: string): Promise<AdminUser> {
  const { data } = await client.get<AdminUser>(`/admin/users/${id}`);
  return data;
}

export async function updateUser(id: string, body: { is_active?: boolean; premium_until?: string | null }): Promise<AdminUser> {
  const { data } = await client.patch<AdminUser>(`/admin/users/${id}`, body);
  return data;
}

export async function deleteUser(id: string): Promise<void> {
  await client.delete(`/admin/users/${id}`);
}

export async function grantPremium(id: string, days: number): Promise<AdminUser> {
  const { data } = await client.post<AdminUser>(`/admin/users/${id}/premium`, { days });
  return data;
}

export async function fetchUserActivity(id: string, days = 30): Promise<UserActivityEntry[]> {
  const { data } = await client.get<UserActivityEntry[]>(`/admin/users/${id}/activity`, { params: { days } });
  return data;
}

export async function sendUserMessage(id: string, title: string, message: string): Promise<AdminMessageResponse> {
  const { data } = await client.post<AdminMessageResponse>(`/admin/users/${id}/message`, { title, message });
  return data;
}