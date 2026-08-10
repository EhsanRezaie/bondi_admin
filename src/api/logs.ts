import { client } from './client';
import type { AdminLogListResponse } from './types';

export interface LogQuery {
  admin_id?: string;
  action?: string;
  target_type?: string;
  target_id?: string;
  from?: string;
  to?: string;
  page: number;
  page_size: number;
}

export async function fetchLogs(params: LogQuery): Promise<AdminLogListResponse> {
  const { data } = await client.get<AdminLogListResponse>('/admin/logs', { params });
  return data;
}