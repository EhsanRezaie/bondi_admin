import { client } from './client';
import type {
  AdminMessageDecryptResponse,
  AdminMessageDeleteResponse,
  AdminReportedMessageResponse
} from './types';

export async function decryptMessage(id: string): Promise<AdminMessageDecryptResponse> {
  const { data } = await client.get<AdminMessageDecryptResponse>(`/admin/messages/${id}/decrypt`);
  return data;
}

export async function deleteMessage(id: string, reason?: string): Promise<AdminMessageDeleteResponse> {
  const { data } = await client.delete<AdminMessageDeleteResponse>(`/admin/messages/${id}`, {
    params: { reason }
  });
  return data;
}

export async function fetchReportedMessage(reportId: string): Promise<AdminReportedMessageResponse> {
  const { data } = await client.get<AdminReportedMessageResponse>(`/admin/messages/reports/${reportId}/message`);
  return data;
}