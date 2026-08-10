import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  Descriptions,
  Drawer,
  Form,
  Image,
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
import type { AdminUser, AdminUserPhoto, UserActivityEntry } from '../api/types';

interface Filters {
  search: string;
  uid: string;
  is_active?: boolean;
  is_premium?: boolean;
  is_verified?: boolean;
  gender?: string;
  city: string;
  age_min?: number;
  age_max?: number;
}

const PAGE_SIZE = 20;

export function UsersPage() {
  const [items, setItems] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    uid: '',
    is_active: undefined,
    is_premium: undefined,
    is_verified: undefined,
    gender: undefined,
    city: '',
    age_min: undefined,
    age_max: undefined
  });
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
        id: f.uid || undefined,
        is_active: f.is_active,
        is_premium: f.is_premium,
        is_verified: f.is_verified,
        gender: f.gender,
        city: f.city || undefined,
        age_min: f.age_min,
        age_max: f.age_max,
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
              <Input prefix={<SearchOutlined />} placeholder="Name, email, phone, bio" allowClear style={{ width: 200 }} />
            </Form.Item>
            <Form.Item name="uid" initialValue={filters.uid}>
              <Input prefix={<SearchOutlined />} placeholder="UID" allowClear style={{ width: 220 }} />
            </Form.Item>
            <Form.Item name="is_active">
              <Select placeholder="Status" allowClear style={{ width: 110 }}>
                <Select.Option value={true}>Active</Select.Option>
                <Select.Option value={false}>Inactive</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="is_premium">
              <Select placeholder="Subscription" allowClear style={{ width: 120 }}>
                <Select.Option value={true}>Premium</Select.Option>
                <Select.Option value={false}>Free</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="is_verified">
              <Select placeholder="Verified" allowClear style={{ width: 110 }}>
                <Select.Option value={true}>Verified</Select.Option>
                <Select.Option value={false}>Unverified</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="gender">
              <Select placeholder="Gender" allowClear style={{ width: 110 }}>
                <Select.Option value="male">Male</Select.Option>
                <Select.Option value="female">Female</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="city" initialValue={filters.city}>
              <Input placeholder="City" allowClear style={{ width: 110 }} />
            </Form.Item>
            <Form.Item name="age_min">
              <InputNumber placeholder="Age min" min={18} max={120} style={{ width: 100 }} />
            </Form.Item>
            <Form.Item name="age_max">
              <InputNumber placeholder="Age max" min={18} max={120} style={{ width: 100 }} />
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
              setFilters({
                search: '',
                uid: '',
                is_active: undefined,
                is_premium: undefined,
                is_verified: undefined,
                gender: undefined,
                city: '',
                age_min: undefined,
                age_max: undefined
              });
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
          {
            title: 'UID',
            dataIndex: 'id',
            width: 90,
            render: (v: string, r) => (
              <a onClick={() => openDetail(r.id)}>
                <code style={{ fontSize: 12 }}>{v.slice(0, 8)}</code>
              </a>
            )
          },
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
        title={detail ? `${detail.name} — ${detail.email}` : 'User'}
        open={Boolean(detail)}
        width={720}
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
            <Card title="Profile" size="small" style={{ marginBottom: 16 }}>
              <Descriptions bordered size="small" column={2}>
                <Descriptions.Item label="UID">
                  <code style={{ fontSize: 11 }}>{detail.id}</code>
                </Descriptions.Item>
                <Descriptions.Item label="Age">{detail.age}</Descriptions.Item>
                <Descriptions.Item label="Gender">{detail.gender ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Orientation">{detail.sexual_orientation ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Email">{detail.email}</Descriptions.Item>
                <Descriptions.Item label="Phone">{detail.phone ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Phone verified">{detail.phone_verified ? 'Yes' : 'No'}</Descriptions.Item>
                <Descriptions.Item label="Google">
                  {detail.google_id ? 'Connected' : '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Birth date">{detail.birth_date ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Referral code">{detail.referral_code ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Registration">{detail.registration_status ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Token version">{detail.token_version ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Premium until">{formatDate(detail.premium_until)}</Descriptions.Item>
                <Descriptions.Item label="Verified">
                  {detail.is_verified ? <Tag color="blue">Verified</Tag> : 'No'}
                  {detail.verified_at ? ` (${formatDate(detail.verified_at)})` : ''}
                </Descriptions.Item>
                <Descriptions.Item label="Location">
                  {[detail.city, detail.province, detail.country].filter(Boolean).join(', ') || '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Coord">
                  {detail.lat != null && detail.lng != null
                    ? `${detail.lat.toFixed(4)}, ${detail.lng.toFixed(4)}`
                    : '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Joined">{formatDate(detail.created_at)}</Descriptions.Item>
                <Descriptions.Item label="Last seen">{formatDate(detail.last_seen_at)}</Descriptions.Item>
              </Descriptions>
            </Card>

            {detail.bio ? (
              <Card title="Bio" size="small" style={{ marginBottom: 16 }}>
                <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{detail.bio}</p>
              </Card>
            ) : null}

            <Card title="Appearance & Lifestyle" size="small" style={{ marginBottom: 16 }}>
              <Descriptions bordered size="small" column={3}>
                <Descriptions.Item label="Height">{detail.height != null ? `${detail.height} cm` : '—'}</Descriptions.Item>
                <Descriptions.Item label="Weight">{detail.weight != null ? `${detail.weight} kg` : '—'}</Descriptions.Item>
                <Descriptions.Item label="Body type">{detail.body_type ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Relationship">{detail.relationship_status ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Living">{detail.living_situation ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Children">{detail.children_status ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Smoking">{detail.smoking ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Drinking">{detail.drinking ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Languages">
                  {detail.languages && detail.languages.length ? detail.languages.join(', ') : '—'}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="Background" size="small" style={{ marginBottom: 16 }}>
              <Descriptions bordered size="small" column={2}>
                <Descriptions.Item label="Education">{detail.education ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Workplace">{detail.workplace ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Religion">{detail.religion ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Ethnicity">{detail.ethnicity ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Political">{detail.political_orientation ?? '—'}</Descriptions.Item>
              </Descriptions>
            </Card>

            {detail.interests && detail.interests.length > 0 && (
              <Card title="Interests" size="small" style={{ marginBottom: 16 }}>
                <Space wrap>
                  {detail.interests.map((interest) => (
                    <Tag key={interest} color="geekblue">{interest}</Tag>
                  ))}
                </Space>
              </Card>
            )}

            {detail.photos && detail.photos.length > 0 && (
              <Card title={`Photos (${detail.photos.length})`} size="small" style={{ marginBottom: 16 }}>
                <Space wrap align="start">
                  {(detail.photos as AdminUserPhoto[]).map((photo) => (
                    <div key={photo.id} style={{ textAlign: 'center', width: 110 }}>
                      <Image
                        src={photo.url}
                        alt={photo.id}
                        width={100}
                        height={130}
                        style={{ objectFit: 'cover', borderRadius: 8 }}
                      />
                      <div style={{ fontSize: 11, marginTop: 4 }}>
                        <Tag
                          color={photo.status === 'approved' ? 'green' : photo.status === 'rejected' ? 'red' : 'orange'}
                          style={{ margin: 0 }}
                        >
                          {photo.status}
                        </Tag>
                        {photo.is_main && <Tag color="purple">main</Tag>}
                        {photo.face_verified && <Tag color="cyan">face</Tag>}
                      </div>
                    </div>
                  ))}
                </Space>
              </Card>
            )}

            <Card title="Activity (last 30 days)" size="small">
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

            <Card title="Stats" size="small" style={{ marginTop: 16 }}>
              <Descriptions bordered size="small" column={4}>
                <Descriptions.Item label="Reports">{detail.report_count ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Likes sent">{detail.total_likes_sent ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Matches">{detail.total_matches ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Messages">{detail.total_messages ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Hide online">{detail.hide_online_status ? 'Yes' : 'No'}</Descriptions.Item>
                <Descriptions.Item label="Hide last seen">{detail.hide_last_seen ? 'Yes' : 'No'}</Descriptions.Item>
              </Descriptions>
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