import { client } from './client';
import type { AdminDashboardOverview, UserStatsPoint } from './types';

export async function fetchOverview(): Promise<AdminDashboardOverview> {
  const { data } = await client.get<AdminDashboardOverview>('/admin/dashboard/overview');
  return data;
}

export async function fetchUserStats(days = 14): Promise<UserStatsPoint[]> {
  const { data } = await client.get<{ items: UserStatsPoint[] }>('/admin/dashboard/stats/users', {
    params: { days }
  });
  return data.items;
}

export async function fetchActivityFeed(): Promise<unknown[]> {
  const { data } = await client.get<{ items: unknown[] }>('/admin/dashboard/activity/recent');
  return data.items;
}