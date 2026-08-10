import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  Descriptions,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  message
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  CrownOutlined,
  SafetyOutlined,
  StopOutlined,
  DeleteOutlined,
  SendOutlined
} from '@ant-design/icons';
import type { TablePaginationConfig } from 'antd';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  fetchUsers,
  fetchUser,
  updateUser,
  deleteUser,
  grantPremium,
  fetchUserActivity,
  sendUserMessage
} from '../api/users';
import { apiErrorMessage } from '../api/client';
import { formatDate, formatDateOnly } from '../utils/format';
import type { AdminUser, UserActivityEntry } from '../api/types';

interface Filters {
  search: string;
  is_active?: boolean;
  is_premium?: boolean;
}

const PAGE_SIZE = 20;

export function UsersPage() {
  const [items, setItems] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({ search: '', is_active: undefined, is_premium: undefined });
  const [applyHint, setApplyHint] = useState(0);

  const [detail, setDetail] = useState<AdminUser | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activity, setActivity] = useState<UserActivityEntry[]>([]);

  const [premiumOpen, setPremiumOpen] = useState(false);
  const [premiumDays, setPremiumDays] = useState(30);
  const [premiumSubmitting, setPremiumSubmitting] = useState(false);

  const [messageOpen, setMessageOpen] = useState(false);
  const [messageForm] = Form.useForm();
  const [messageSubmitting, setMessageSubmitting] = useState(false);

  const load = useCallback(async (p = page, f = filters) => {
    setLoading(true);
    try {
      const res = await fetchUsers({
        search: f.search || undefined,
        is_active: f.is_active,
        is_premium: f.is_premium,
        limit: PAGE_SIZE,
        offset: (p - 1) * PAGE_SIZE
      });
      setItems(res.users);
      setTotal(res.total);
    } catch (error) {
      message.error(apiErrorMessage(error, 'Failed to load users.'));
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, applyHint]);

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const [u, a] = await Promise.all([fetchUser(id), fetchUserActivity(id, 30)]);
      setDetail(u);
      setActivity(a);
    } catch (error) {
      message.error(apiErrorMessage(error, 'Failed to load user detail.'));
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const updated = await updateUser(id, { is_active: isActive });
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, is_active: updated.is_active } : it)));
      setDetail(updated);
      message.success(isActive ? 'User activated' : 'User deactivated');
    } catch (error) {
      message.error(apiErrorMessage(error, 'Update failed.'));
    }
  };

  const grantPremiumSubmit = async () => {
    if (!detail) return;
    setPremiumSubmitting(true);
    try {
      const updated = await grantPremium(detail.id, premiumDays);
      setDetail(updated);
      setItems((prev) => prev.map((it) => (it.id === detail.id ? { ...it, is_premium: true } : it)));
      setPremiumOpen(false);
      message.success('Premium granted');
    } catch (error) {
      message.error(apiErrorMessage(error, 'Grant failed.'));
    } finally {
      setPremiumSubmitting(false);
    }
  };

  const onMessageSubmit = async (values: { title: string; content: string }) => {
    if (!detail) return;
    setMessageSubmitting(true);
    try {
      const res = await sendUserMessage(detail.id, values.title, values.content);
      message.success(res.message);
      setMessageOpen(false);
      messageForm.resetFields();
    } catch (error) {
      message.error(apiErrorMessage(error, 'Send failed.'));
    } finally {
      setMessageSubmitting(false);
    }
  };

  const onDelete = async (id: string) => {
    try {
      await deleteUser(id);
      message.success('User deleted');
      setDetail(null);
      void load();
    } catch (error) {
      message.error(apiErrorMessage(error, 'Delete failed.'));
    }
  };

  const activityData = activity.map((a) => ({ ...a, label: formatDateOnly(a.date) }));

  return (
    <Card
      title="Users"
      extra={
        <Space>
          <Form
            layout="inline"
            onFinish={() => {
              setPage(1);
              setApplyHint((n) => n + 1);
            }}
          >
            <Form.Item name="search" initialValue={filters.search}>
              <Input prefix={<SearchOutlined />} placeholder="Name or email" allowClear style={{ width: 220 }} />
            </Form.Item>
            <Form.Item name="is_active">
              <Select placeholder="Status" allowClear style={{ width: 120 }}>
                <Select.Option value={true}>Active</Select.Option>
                <Select.Option value={false}>Inactive</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="is_premium">
              <Select placeholder="Subscription" allowClear style={{ width: 130 }}>
                <Select.Option value={true}>Premium</Select.Option>
                <Select.Option value={false}>Free</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                Filter
              </Button>
            </Form.Item>
          </Form>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              setPage(1);
              setFilters({ search: '', is_active: undefined, is_premium: undefined });
              setApplyHint((n) => n + 1);
            }}
          >
            Reset
          </Button>
        </Space>
      }
    >
      <Table<AdminUser>
        rowKey="id"
        dataSource={items}
        loading={loading}
        scroll={{ x: 900 }}
        pagination={{
          current: page,
          pageSize: PAGE_SIZE,
          total,
          showSizeChanger: false,
          showTotal: (t) => `${t} users`
        }}
        onChange={(p: TablePaginationConfig) => {
          setPage(p.current ?? 1);
        }}
        columns={[
          { title: 'Name', dataIndex: 'name', render: (v: string, r) => <a onClick={() => openDetail(r.id)}>{v || '—'}</a> },
          { title: 'Email', dataIndex: 'email' },
          { title: 'Age', dataIndex: 'age', width: 70 },
          { title: 'Gender', dataIndex: 'gender', width: 100 },
          {
            title: 'Status',
            dataIndex: 'is_active',
            width: 100,
            render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? 'Active' : 'Inactive'}</Tag>
          },
          {
            title: 'Premium',
            dataIndex: 'is_premium',
            width: 110,
            render: (v: boolean) => (v ? <Tag color="gold"><CrownOutlined /> Premium</Tag> : <Tag>Free</Tag>)
          },
          { title: 'Verified', dataIndex: 'phone_verified', width: 100, render: (v: boolean) => (v ? 'Yes' : 'No') },
          { title: 'Joined', dataIndex: 'created_at', width: 150, render: (v: string) => formatDate(v) }
        ]}
      />

      <Drawer
        title={detail ? `${detail.name} (${detail.email})` : 'User'}
        open={Boolean(detail)}
        width={680}
        loading={detailLoading}
        onClose={() => setDetail(null)}
        extra={
          detail && (
          <Space>
            <Button
              type="primary"
              icon={<CrownOutlined />}
              disabled={detail.is_premium}
              onClick={() => setPremiumOpen(true)}
            >
              Grant premium
            </Button>
            <Button icon={<SendOutlined />} onClick={() => setMessageOpen(true)}>
              Message
            </Button>
            {detail.is_active ? (
              <Button danger icon={<StopOutlined />} onClick={() => toggleActive(detail.id, false)}>
                Deactivate
              </Button>
            ) : (
              <Button type="primary" icon={<SafetyOutlined />} onClick={() => toggleActive(detail.id, true)}>
                Activate
              </Button>
            )}
            <Popconfirm
              title="Delete this user permanently?"
              description="This cannot be undone."
              onConfirm={() => onDelete(detail.id)}
              okButtonProps={{ danger: true }}
            >
              <Button danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
          )
        }
      >
        {detail && (
          <>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Email">{detail.email}</Descriptions.Item>
              <Descriptions.Item label="Age">{detail.age}</Descriptions.Item>
              <Descriptions.Item label="Gender">{detail.gender}</Descriptions.Item>
              <Descriptions.Item label="Phone verified">{detail.phone_verified ? 'Yes' : 'No'}</Descriptions.Item>
              <Descriptions.Item label="Premium until">{formatDate(detail.premium_until)}</Descriptions.Item>
              <Descriptions.Item label="Joined">{formatDate(detail.created_at)}</Descriptions.Item>
              <Descriptions.Item label="Last seen">{formatDate(detail.last_seen_at)}</Descriptions.Item>
              <Descriptions.Item label="Reports">{detail.report_count ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Likes sent">{detail.total_likes_sent ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Matches">{detail.total_matches ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Messages">{detail.total_messages ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Hide online">{detail.hide_online_status ? 'Yes' : 'No'}</Descriptions.Item>
            </Descriptions>

            <Card title="Activity (last 30 days)" size="small" style={{ marginTop: 16 }}>
              {activityData.length === 0 ? (
                <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  No activity
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="swipes" name="Swipes" stroke="#7b2ff7" fill="#7b2ff7" fillOpacity={0.2} />
                    <Area type="monotone" dataKey="matches" name="Matches" stroke="#52c41a" fill="#52c41a" fillOpacity={0.2} />
                    <Area type="monotone" dataKey="messages" name="Messages" stroke="#fa8c16" fill="#fa8c16" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </Card>
          </>
        )}
      </Drawer>

      <Modal
        title="Grant premium"
        open={premiumOpen}
        onOk={() => grantPremiumSubmit()}
        onCancel={() => setPremiumOpen(false)}
        confirmLoading={premiumSubmitting}
      >
        <p>Number of days to add:</p>
        <InputNumber min={1} max={365} value={premiumDays} onChange={(v) => setPremiumDays(v ?? 30)} />
      </Modal>

      <Modal
        title="Send notification"
        open={messageOpen}
        onOk={() => messageForm.submit()}
        confirmLoading={messageSubmitting}
        onCancel={() => setMessageOpen(false)}
      >
        <Form form={messageForm} layout="vertical" onFinish={onMessageSubmit}>
          <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Title required' }]}>
            <Input maxLength={200} showCount />
          </Form.Item>
          <Form.Item name="content" label="Message" rules={[{ required: true, message: 'Message required' }]}>
            <Input.TextArea rows={4} maxLength={2000} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}