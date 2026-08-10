import { client } from './client';
import type { AdminAnnouncementResponse, AdminMessageResponse } from './types';

export async function sendAnnouncement(
  title: string,
  message: string,
  toPremiumOnly: boolean
): Promise<AdminAnnouncementResponse> {
  const { data } = await client.post<AdminAnnouncementResponse>('/admin/announcements', {
    title,
    message,
    to_premium_only: toPremiumOnly
  });
  return data;
}

export async function sendTestAnnouncement(
  title: string,
  message: string,
  targetUserId?: string
): Promise<AdminMessageResponse> {
  const { data } = await client.post<AdminMessageResponse>('/admin/announcements/test', {
    title,
    message,
    target_user_id: targetUserId || undefined
  });
  return data;
}