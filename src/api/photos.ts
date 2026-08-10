import { client } from './client';
import type {
  AdminPendingPhoto,
  AdminPhotoStats,
  AdminPhotoActionResponse,
  AdminPhotoRejectResponse,
  AdminPhotoVerifyResponse
} from './types';

export async function fetchPendingPhotos(limit = 50, offset = 0): Promise<AdminPendingPhoto[]> {
  const { data } = await client.get<AdminPendingPhoto[]>('/admin/photos/pending', {
    params: { limit, offset }
  });
  return data;
}

export async function fetchPhotoStats(): Promise<AdminPhotoStats> {
  const { data } = await client.get<AdminPhotoStats>('/admin/photos/stats');
  return data;
}

export async function approvePhoto(id: string): Promise<AdminPhotoActionResponse> {
  const { data } = await client.post<AdminPhotoActionResponse>(`/admin/photos/${id}/approve`);
  return data;
}

export async function rejectPhoto(id: string, reason: string): Promise<AdminPhotoRejectResponse> {
  const { data } = await client.post<AdminPhotoRejectResponse>(`/admin/photos/${id}/reject`, null, {
    params: { reason }
  });
  return data;
}

export async function verifyFace(id: string): Promise<AdminPhotoVerifyResponse> {
  const { data } = await client.post<AdminPhotoVerifyResponse>(`/admin/photos/${id}/verify-face`);
  return data;
}