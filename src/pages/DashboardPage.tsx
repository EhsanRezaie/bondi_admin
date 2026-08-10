import { useEffect, useState } from 'react';
import { Card, Col, Row, Skeleton, message } from 'antd';
import {
  UserAddOutlined,
  TeamOutlined,
  PictureOutlined,
  WarningOutlined,
  MessageOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { fetchOverview, fetchUserStats } from '../api/dashboard';
import { apiErrorMessage } from '../api/client';
import { StatCard } from '../components/StatCard';
import type { AdminDashboardOverview, UserStatsPoint } from '../api/types';

interface CardDef {
  key: keyof AdminDashboardOverview;
  title: string;
  icon: React.ReactNode;
}

export function DashboardPage() {
  const [overview, setOverview] = useState<AdminDashboardOverview | null>(null);
  const [stats, setStats] = useState<UserStatsPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [o, s] = await Promise.all([fetchOverview(), fetchUserStats(14)]);
        if (!cancelled) {
          setOverview(o);
          setStats(s);
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

  const cards: CardDef[] = [
    { key: 'total_users', title: 'Total Users', icon: <TeamOutlined /> },
    { key: 'active_today', title: 'Active Today', icon: <ClockCircleOutlined /> },
    { key: 'new_today', title: 'New Today', icon: <UserAddOutlined /> },
    { key: 'total_photos', title: 'Photos', icon: <PictureOutlined /> },
    { key: 'pending_photos', title: 'Pending Moderation', icon: <PictureOutlined /> },
    { key: 'open_reports', title: 'Open Reports', icon: <WarningOutlined /> },
    { key: 'open_tickets', title: 'Open Tickets', icon: <MessageOutlined /> }
  ];

  return (
    <>
      <Row gutter={[16, 16]}>
        {cards.map((c) => (
          <Col xs={24} sm={12} lg={6} key={c.key}>
            <StatCard
              title={c.title}
              value={overview?.[c.key] ?? 0}
              prefix={c.icon}
              loading={loading}
            />
          </Col>
        ))}
      </Row>
      <Card
        title="New users (last 14 days)"
        style={{ marginTop: 16 }}
        loading={loading}
      >
        {loading ? (
          <Skeleton active />
        ) : stats.length === 0 ? (
          <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            No data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={stats}>
              <defs>
                <linearGradient id="usersGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7b2ff7" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#7b2ff7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="count" name="Users" stroke="#7b2ff7" fill="url(#usersGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>
    </>
  );
}