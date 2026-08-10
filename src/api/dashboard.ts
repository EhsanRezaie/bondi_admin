import { client } from './client';
import type {
  DashboardOverview,
  TimeSeriesResponse,
  ActivitySeriesResponse,
  ReportStatsResponse,
  TicketStatsResponse
} from './types';

export async function fetchOverview(): Promise<DashboardOverview> {
  const { data } = await client.get<DashboardOverview>('/admin/dashboard');
  return data;
}

export async function fetchUserGrowth(days = 14): Promise<TimeSeriesResponse> {
  const { data } = await client.get<TimeSeriesResponse>('/admin/dashboard/stats/users', {
    params: { days }
  });
  return data;
}

export async function fetchActivityStats(days = 14): Promise<ActivitySeriesResponse> {
  const { data } = await client.get<ActivitySeriesResponse>('/admin/dashboard/stats/activity', {
    params: { days }
  });
  return data;
}

export async function fetchReportStats(): Promise<ReportStatsResponse> {
  const { data } = await client.get<ReportStatsResponse>('/admin/dashboard/stats/reports');
  return data;
}

export async function fetchTicketStats(): Promise<TicketStatsResponse> {
  const { data } = await client.get<TicketStatsResponse>('/admin/dashboard/stats/tickets');
  return data;
}