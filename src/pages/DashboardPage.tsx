import { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, message, Tag } from 'antd';
import {
  TeamOutlined,
  UserAddOutlined,
  ClockCircleOutlined,
  CrownOutlined,
  HeartOutlined,
  WechatOutlined,
  PictureOutlined,
  WarningOutlined,
  MessageOutlined
} from '@ant-design/icons';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  fetchOverview,
  fetchUserGrowth,
  fetchActivityStats,
  fetchReportStats,
  fetchTicketStats
} from '../api/dashboard';
import { apiErrorMessage } from '../api/client';
import type {
  DashboardOverview,
  TimeSeriesResponse,
  ActivitySeriesResponse,
  ReportStatsResponse,
  TicketStatsResponse
} from '../api/types';

function toChartData(labels: string[], series: { [k: string]: number[] }) {
  return labels.map((label, i) => {
    const row: Record<string, string | number> = { label };
    for (const [key, arr] of Object.entries(series)) {
      row[key] = arr[i] ?? 0;
    }
    return row;
  });
}

export function DashboardPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [growth, setGrowth] = useState<TimeSeriesResponse>({ labels: [], new_users: [], active_users: [] });
  const [activity, setActivity] = useState<ActivitySeriesResponse>({ labels: [], swipes: [], matches: [], messages: [] });
  const [reportStats, setReportStats] = useState<ReportStatsResponse | null>(null);
  const [ticketStats, setTicketStats] = useState<TicketStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [o, g, a, rs, ts] = await Promise.all([
          fetchOverview(),
          fetchUserGrowth(14),
          fetchActivityStats(14),
          fetchReportStats(),
          fetchTicketStats()
        ]);
        if (!cancelled) {
          setOverview(o);
          setGrowth(g);
          setActivity(a);
          setReportStats(rs);
          setTicketStats(ts);
        }
      } catch (error) {
        message.error(apiErrorMessage(error, 'Failed to load dashboard.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const statCards = [
    { title: 'Total Users', value: overview?.total_users, icon: <TeamOutlined /> },
    { title: 'Active Today', value: overview?.active_today, icon: <ClockCircleOutlined /> },
    { title: 'New Today', value: overview?.new_users_today, icon: <UserAddOutlined /> },
    { title: 'New This Week', value: overview?.new_users_this_week, icon: <UserAddOutlined /> },
    { title: 'Premium Users', value: overview?.premium_users, icon: <CrownOutlined /> },
    { title: 'Swipes Today', value: overview?.total_swipes_today, icon: <HeartOutlined /> },
    { title: 'Matches Today', value: overview?.total_matches_today, icon: <TeamOutlined /> },
    { title: 'Messages Today', value: overview?.total_messages_today, icon: <WechatOutlined /> },
    { title: 'Pending Photos', value: overview?.pending_photos, icon: <PictureOutlined /> },
    { title: 'Pending Reports', value: overview?.pending_reports, icon: <WarningOutlined /> },
    { title: 'Open Tickets', value: overview?.open_tickets, icon: <MessageOutlined /> }
  ];

  const growthData = toChartData(growth.labels, { new_users: growth.new_users, active_users: growth.active_users });
  const activityData = toChartData(activity.labels, { swipes: activity.swipes, matches: activity.matches, messages: activity.messages });

  return (
    <>
      <Row gutter={[16, 16]}>
        {statCards.map((c) => (
          <Col xs={24} sm={12} lg={6} key={c.title}>
            <Card loading={loading}>
              <Statistic title={c.title} value={c.value ?? 0} prefix={c.icon} />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="User growth (last 14 days)" loading={loading}>
            {growthData.length === 0 ? (
              <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                No data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="newGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7b2ff7" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#7b2ff7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="new_users" name="New" stroke="#7b2ff7" fill="url(#newGrad)" />
                  <Area type="monotone" dataKey="active_users" name="Active" stroke="#13c2c2" fill="#13c2c2" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Activity (last 14 days)" loading={loading}>
            {activityData.length === 0 ? (
              <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                No data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="swipes" name="Swipes" fill="#7b2ff7" />
                  <Bar dataKey="matches" name="Matches" fill="#13c2c2" />
                  <Bar dataKey="messages" name="Messages" fill="#fa8c16" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="Reports by status" size="small" loading={loading}>
            <Row gutter={8}>
              <Col span={8}><Statistic title="Pending" value={reportStats?.pending ?? 0} valueStyle={{ color: '#fa8c16' }} /></Col>
              <Col span={8}><Statistic title="Reviewed" value={reportStats?.reviewed ?? 0} valueStyle={{ color: '#13c2c2' }} /></Col>
              <Col span={8}><Statistic title="Action taken" value={reportStats?.action_taken ?? 0} valueStyle={{ color: '#7b2ff7' }} /></Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Tickets by status" size="small" loading={loading}>
            <Row gutter={8}>
              <Col span={8}><Statistic title="Open" value={ticketStats?.open ?? 0} valueStyle={{ color: '#fa8c16' }} /></Col>
              <Col span={8}><Statistic title="In progress" value={ticketStats?.in_progress ?? 0} valueStyle={{ color: '#1677ff' }} /></Col>
              <Col span={8}><Statistic title="Closed" value={ticketStats?.closed ?? 0} valueStyle={{ color: '#52c41a' }} /></Col>
            </Row>
            <div style={{ marginTop: 8 }}>
              <Tag color="default">Premium {overview?.premium_percentage?.toFixed(1) ?? '0'}%</Tag>
            </div>
          </Card>
        </Col>
      </Row>
    </>
  );
}