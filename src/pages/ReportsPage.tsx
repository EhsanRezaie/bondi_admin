import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  Descriptions,
  Drawer,
  Form,
  Input,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  message
} from 'antd';
import { ReloadOutlined, DeleteOutlined } from '@ant-design/icons';
import { fetchReports, fetchReport, updateReport, deleteReport } from '../api/reports';
import { apiErrorMessage } from '../api/client';
import { formatDate } from '../utils/format';
import type { AdminReport } from '../api/types';

const PAGE_SIZE = 30;

const STATUS_COLORS: Record<string, string> = {
  pending: 'orange',
  reviewed: 'blue',
  action_taken: 'green'
};

export function ReportsPage() {
  const [items, setItems] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [offset, setOffset] = useState(0);

  const [detail, setDetail] = useState<AdminReport | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updateForm] = Form.useForm();

  const load = useCallback(async (off = 0, status?: string, append = false) => {
    setLoading(true);
    try {
      const list = await fetchReports({ status_filter: status, limit: PAGE_SIZE, offset: off });
      setOffset(off);
      setItems((prev) => (append ? [...prev, ...list] : list));
    } catch (error) {
      message.error(apiErrorMessage(error, 'Failed to load reports.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(0, statusFilter, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const openDetail = async (report: AdminReport) => {
    setDetailLoading(true);
    try {
      const fresh = await fetchReport(report.id);
      setDetail(fresh);
      updateForm.setFieldsValue({ status: fresh.status, admin_note: fresh.admin_note ?? undefined });
    } catch (error) {
      message.error(apiErrorMessage(error, 'Failed to load report.'));
    } finally {
      setDetailLoading(false);
    }
  };

  const onSave = async (values: { status: string; admin_note?: string }) => {
    if (!detail) return;
    try {
      const updated = await updateReport(detail.id, values);
      setDetail(updated);
      setItems((prev) => prev.map((r) => (r.id === detail.id ? updated : r)));
      message.success('Report updated');
    } catch (error) {
      message.error(apiErrorMessage(error, 'Update failed.'));
    }
  };

  const onDelete = async (id: string) => {
    try {
      await deleteReport(id);
      message.success('Report deleted');
      setDetail(null);
      setItems((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      message.error(apiErrorMessage(error, 'Delete failed.'));
    }
  };

  return (
    <Card
      title="Reports"
      extra={
        <Space>
          <Select
            placeholder="Status"
            allowClear
            style={{ width: 160 }}
            value={statusFilter}
            onChange={(v) => setStatusFilter(v)}
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'reviewed', label: 'Reviewed' },
              { value: 'action_taken', label: 'Action taken' }
            ]}
          />
          <Button icon={<ReloadOutlined />} onClick={() => void load(0, statusFilter, false)}>
            Refresh
          </Button>
        </Space>
      }
    >
      <Table<AdminReport>
        rowKey="id"
        dataSource={items}
        loading={loading}
        scroll={{ x: 800 }}
        pagination={false}
        columns={[
          {
            title: 'Reported user',
            dataIndex: 'reported_name',
            render: (v: string, r) => <a onClick={() => openDetail(r)}>{v}</a>
          },
          { title: 'Reported ID', dataIndex: 'reported_id', render: (v: string) => <small>{v.slice(0, 8)}…</small> },
          { title: 'Reporter', dataIndex: 'reporter_name', width: 160 },
          { title: 'Reason', dataIndex: 'reason', ellipsis: true },
          {
            title: 'Status',
            dataIndex: 'status',
            width: 120,
            render: (v: string) => <Tag color={STATUS_COLORS[v] ?? 'default'}>{v}</Tag>
          },
          { title: 'Created', dataIndex: 'created_at', width: 160, render: (v: string) => formatDate(v) }
        ]}
      />

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <Button onClick={() => void load(offset + PAGE_SIZE, statusFilter, true)} loading={loading} disabled={items.length < PAGE_SIZE}>
          Load more
        </Button>
      </div>

      <Drawer
        title="Report detail"
        open={Boolean(detail)}
        width={560}
        loading={detailLoading}
        onClose={() => setDetail(null)}
        extra={
          <Popconfirm
            title="Delete this report?"
            onConfirm={() => onDelete(detail!.id)}
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />}>Delete</Button>
          </Popconfirm>
        }
      >
        {detail && (
          <>
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="Reporter">{detail.reporter_name} ({detail.reporter_id})</Descriptions.Item>
              <Descriptions.Item label="Reported">{detail.reported_name} ({detail.reported_id})</Descriptions.Item>
              <Descriptions.Item label="Reason">{detail.reason}</Descriptions.Item>
              <Descriptions.Item label="Status"><Tag color={STATUS_COLORS[detail.status] ?? 'default'}>{detail.status}</Tag></Descriptions.Item>
              <Descriptions.Item label="Reported at">{formatDate(detail.created_at)}</Descriptions.Item>
              <Descriptions.Item label="Resolved at">{formatDate(detail.resolved_at)}</Descriptions.Item>
            </Descriptions>

            <Form form={updateForm} layout="vertical" style={{ marginTop: 16 }} onFinish={onSave}>
              <Form.Item name="status" label="Status" rules={[{ required: true, message: 'Status required' }]}>
                <Select
                  options={[
                    { value: 'pending', label: 'Pending' },
                    { value: 'reviewed', label: 'Reviewed' },
                    { value: 'action_taken', label: 'Action taken' }
                  ]}
                />
              </Form.Item>
              <Form.Item name="admin_note" label="Admin note">
                <Input.TextArea rows={3} maxLength={500} showCount />
              </Form.Item>
              <Button type="primary" htmlType="submit">Save</Button>
            </Form>
          </>
        )}
      </Drawer>
    </Card>
  );
}