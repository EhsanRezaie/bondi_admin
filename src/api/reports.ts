import { client } from './client';
import type { AdminReport } from './types';

export interface ReportQuery {
  status_filter?: string;
  limit: number;
  offset: number;
}

export async function fetchReports(params: ReportQuery): Promise<AdminReport[]> {
  const { data } = await client.get<AdminReport[]>('/admin/reports', { params });
  return data;
}

export async function fetchReport(id: string): Promise<AdminReport> {
  const { data } = await client.get<AdminReport>(`/admin/reports/${id}`);
  return data;
}

export async function updateReport(
  id: string,
  body: { status: string; admin_note?: string }
): Promise<AdminReport> {
  const { data } = await client.patch<AdminReport>(`/admin/reports/${id}`, body);
  return data;
}

export async function deleteReport(id: string): Promise<void> {
  await client.delete(`/admin/reports/${id}`);
}