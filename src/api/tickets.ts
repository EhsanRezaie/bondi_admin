import { client } from './client';
import type { AdminTicketDetail, AdminTicketListResponse } from './types';

export interface TicketQuery {
  status_filter?: string;
  limit: number;
  offset: number;
}

export async function fetchTickets(params: TicketQuery): Promise<AdminTicketListResponse> {
  const { data } = await client.get<AdminTicketListResponse>('/admin/tickets', { params });
  return data;
}

export async function fetchTicket(id: string): Promise<AdminTicketDetail> {
  const { data } = await client.get<AdminTicketDetail>(`/admin/tickets/${id}`);
  return data;
}

export async function replyTicket(id: string, content: string): Promise<AdminTicketDetail> {
  const { data } = await client.post<AdminTicketDetail>(`/admin/tickets/${id}/messages`, { content });
  return data;
}

export async function updateTicket(
  id: string,
  body: { status?: string; admin_response?: string }
): Promise<AdminTicketDetail> {
  const { data } = await client.patch<AdminTicketDetail>(`/admin/tickets/${id}`, body);
  return data;
}

export async function deleteTicket(id: string): Promise<void> {
  await client.delete(`/admin/tickets/${id}`);
}