import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Form, Input, Select, Space, Table, Tag } from 'antd';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import type { TablePaginationConfig } from 'antd';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import { fetchLogs } from '../api/logs';
import { showApiError } from '../api/client';
import { formatDate } from '../utils/format';
import type { AdminLogEntry } from '../api/types';

const PAGE_SIZE = 50;

interface LogFilters {
  admin_id?: string;
  action?: string;
  target_type?: string;
  target_id?: string;
  from?: string;
  to?: string;
}

export function AuditLogPage() {
  const [items, setItems] = useState<AdminLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<LogFilters>({});
  const [form] = Form.useForm();

  const load = useCallback(async (p = page, f = filters) => {
    setLoading(true);
    try {
      const res = await fetchLogs({
        ...f,
        page: p,
        page_size: PAGE_SIZE
      });
      setItems(res.logs);
      setTotal(res.total);
    } catch (error) {
      showApiError(error, 'Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const onApply = (values: {
    admin_id?: string;
    action?: string;
    target_type?: string;
    target_id?: string;
    range?: [dayjs.Dayjs, dayjs.Dayjs];
  }) => {
    const next: LogFilters = {
      admin_id: values.admin_id || undefined,
      action: values.action || undefined,
      target_type: values.target_type || undefined,
      target_id: values.target_id || undefined,
      from: values.range?.[0]?.startOf('day').toISOString(),
      to: values.range?.[1]?.endOf('day').toISOString()
    };
    setFilters(next);
    setPage(1);
  };

  const onReset = () => {
    form.resetFields();
    setFilters({});
    setPage(1);
  };

  return (
    <Card
      title="Audit log"
      extra={
        <Form form={form} layout="inline" onFinish={onApply} style={{ rowGap: 8 }}>
          <Form.Item name="admin_id">
            <Input placeholder="Admin username" style={{ width: 150 }} allowClear />
          </Form.Item>
          <Form.Item name="action">
            <Input placeholder="Action" style={{ width: 150 }} allowClear />
          </Form.Item>
          <Form.Item name="target_type">
            <Select placeholder="Target type" allowClear style={{ width: 150 }} options={[
              { value: 'user', label: 'user' },
              { value: 'photo', label: 'photo' },
              { value: 'report', label: 'report' },
              { value: 'ticket', label: 'ticket' },
              { value: 'announcement', label: 'announcement' },
              { value: 'message', label: 'message' },
              { value: 'system', label: 'system' }
            ]} />
          </Form.Item>
          <Form.Item name="target_id">
            <Input placeholder="Target ID" style={{ width: 200 }} allowClear />
          </Form.Item>
          <Form.Item name="range">
            <DatePicker.RangePicker showTime />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>Filter</Button>
              <Button icon={<ReloadOutlined />} onClick={onReset}>Reset</Button>
            </Space>
          </Form.Item>
        </Form>
      }
    >
      <Table<AdminLogEntry>
        rowKey="id"
        dataSource={items}
        loading={loading}
        scroll={{ x: 900 }}
        pagination={{
          current: page,
          pageSize: PAGE_SIZE,
          total,
          showSizeChanger: false,
          showTotal: (t) => `${t} entries`
        }}
        onChange={(p: TablePaginationConfig) => setPage(p.current ?? 1)}
        columns={[
          { title: 'Time', dataIndex: 'created_at', width: 170, render: (v: string) => formatDate(v) },
          { title: 'Admin', dataIndex: 'admin_id', width: 140 },
          { title: 'Action', dataIndex: 'action', width: 180, render: (v: string) => <Tag color="geekblue">{v}</Tag> },
          { title: 'Target type', dataIndex: 'target_type', width: 130, render: (v?: string | null) => v ?? '—' },
          { title: 'Target ID', dataIndex: 'target_id', width: 220, render: (v?: string | null) => (v ? <small>{v}</small> : '—') },
          { title: 'IP', dataIndex: 'ip_address', width: 130, render: (v?: string | null) => v ?? '—' }
        ]}
      />
    </Card>
  );
}