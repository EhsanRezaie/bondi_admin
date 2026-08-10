import { Card, Statistic } from 'antd';
import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: number;
  prefix?: ReactNode;
  suffix?: ReactNode;
  loading?: boolean;
}

export function StatCard({ title, value, prefix, suffix, loading }: StatCardProps) {
  return (
    <Card loading={loading}>
      <Statistic title={title} value={value} prefix={prefix} suffix={suffix} />
    </Card>
  );
}