import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  Descriptions,
  Divider,
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
  Typography,
  message
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  CrownOutlined,
  SafetyOutlined,
  StopOutlined,
  DeleteOutlined,
  SendOutlined,
  FilterOutlined,
  CloseOutlined
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
import type { UserQuery } from '../api/users';
import { showApiError } from '../api/client';
import { formatDate, formatDateOnly } from '../utils/format';
import type { AdminUser, AdminUserPhoto, AdminUserListItem, UserActivityEntry } from '../api/types';

interface Filters {
  search: string;
  uid: string;
  is_active?: boolean;
  is_premium?: boolean;
  is_verified?: boolean;
  gender?: string;
  city?: string;
  country?: string;
  province?: string;
  age_min?: number;
  age_max?: number;
  height_min?: number;
  height_max?: number;
  weight_min?: number;
  weight_max?: number;
  body_type?: string;
  relationship_status?: string;
  education?: string;
  religion?: string;
  ethnicity?: string;
  political_orientation?: string;
  smoking?: string;
  drinking?: string;
  languages?: string;
  interests?: string;
  has_photos?: boolean;
}

const PAGE_SIZE = 20;

const EMPTY_FILTERS: Filters = {
  search: '',
  uid: '',
  is_active: undefined,
  is_premium: undefined,
  is_verified: undefined,
  gender: undefined,
  city: undefined,
  country: undefined,
  province: undefined,
  age_min: undefined,
  age_max: undefined,
  height_min: undefined,
  height_max: undefined,
  weight_min: undefined,
  weight_max: undefined,
  body_type: undefined,
  relationship_status: undefined,
  education: undefined,
  religion: undefined,
  ethnicity: undefined,
  political_orientation: undefined,
  smoking: undefined,
  drinking: undefined,
  languages: undefined,
  interests: undefined,
  has_photos: undefined
};

const OPTIONS = {
  gender: ['male', 'female'],
  body_type: ['slim', 'athletic', 'average', 'curvy', 'muscular', 'overweight'],
  relationship_status: ['single', 'divorced', 'separated', 'widowed'],
  education: ['high_school', 'associate', 'bachelor', 'master', 'phd'],
  religion: ["islam", 'christianity', "baha'i", 'zoroastrian', 'none'],
  ethnicity: ['persian', 'kurdish', 'lor', 'turk', 'arab', 'baloch', 'gilak', 'mazani'],
  political_orientation: ['liberal', 'conservative', 'moderate', 'apolitical'],
  smoking: ['never', 'occasionally', 'regularly'],
  drinking: ['never', 'socially', 'regularly']
} as const;

const SELECT_OPTIONS = (key: keyof typeof OPTIONS) =>
  OPTIONS[key].map((v) => ({ value: v, label: v.replace(/_/g, ' ') }));

const BOOL_OPTIONS = [
  { value: true, label: 'Yes' },
  { value: false, label: 'No' }
];

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <Divider orientation="left" style={{ margin: '8px 0 16px', fontSize: 13 }}>
        <Typography.Text type="secondary" style={{ fontSize: 13, fontWeight: 600, letterSpacing: 0.3 }}>
          {title}
        </Typography.Text>
      </Divider>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', columnGap: 16, rowGap: 0 }}>
        {children}
      </div>
    </div>
  );
}

function filterCount(f: Filters): number {
  return Object.values(f).filter((v) => v !== undefined && v !== '' && v !== null).length;
}

export function UsersPage() {
  const [items, setItems] = useState<AdminUserListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<Filters>({ ...EMPTY_FILTERS });
  const [applyHint, setApplyHint] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterForm] = Form.useForm();

  const [detail, setDetail] = useState<AdminUser | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activity, setActivity] = useState<UserActivityEntry[]>([]);

  const [premiumOpen, setPremiumOpen] = useState(false);
  const [premiumDays, setPremiumDays] = useState(30);
  const [premiumSubmitting, setPremiumSubmitting] = useState(false);

  const [messageOpen, setMessageOpen] = useState(false);
  const [messageForm] = Form.useForm();
  const [messageSubmitting, setMessageSubmitting] = useState(false);

  const load = useCallback(async (p = page, f = filters, sb = sortBy, so = sortOrder) => {
    setLoading(true);
    try {
      const params: UserQuery = {
        search: f.search || undefined,
        id: f.uid || undefined,
        is_active: f.is_active,
        is_premium: f.is_premium,
        is_verified: f.is_verified,
        gender: f.gender,
        city: f.city,
        country: f.country,
        province: f.province,
        age_min: f.age_min,
        age_max: f.age_max,
        height_min: f.height_min,
        height_max: f.height_max,
        weight_min: f.weight_min,
        weight_max: f.weight_max,
        body_type: f.body_type,
        relationship_status: f.relationship_status,
        education: f.education,
        religion: f.religion,
        ethnicity: f.ethnicity,
        political_orientation: f.political_orientation,
        smoking: f.smoking,
        drinking: f.drinking,
        languages: f.languages,
        interests: f.interests,
        has_photos: f.has_photos,
        sort_by: sb,
        sort_order: so,
        limit: PAGE_SIZE,
        offset: (p - 1) * PAGE_SIZE
      };
      const res = await fetchUsers(params);
      setItems(res.users);
      setTotal(res.total);
    } catch (error) {
      showApiError(error, 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [page, filters, sortBy, sortOrder]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sortBy, sortOrder, applyHint]);

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const [u, a] = await Promise.all([fetchUser(id), fetchUserActivity(id, 30)]);
      setDetail(u);
      setActivity(a);
    } catch (error) {
      showApiError(error, 'Failed to load user detail.');
    } finally {
      setDetailLoading(false);
    }
  };

  const onSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
    setPage(1);
    setApplyHint((n) => n + 1);
  };

  const openFilter = () => {
    filterForm.setFieldsValue(filters);
    setFilterOpen(true);
  };

  const applyFilter = (values: Filters) => {
    const clean = (v: unknown) => (v === undefined || v === '' || v === null ? undefined : v);
    setFilters({
      search: filters.search,
      uid: (clean(values.uid) as string | undefined) ?? '',
      is_active: clean(values.is_active) as boolean | undefined,
      is_premium: clean(values.is_premium) as boolean | undefined,
      is_verified: clean(values.is_verified) as boolean | undefined,
      gender: clean(values.gender) as string | undefined,
      city: clean(values.city) as string | undefined,
      country: clean(values.country) as string | undefined,
      province: clean(values.province) as string | undefined,
      age_min: clean(values.age_min) as number | undefined,
      age_max: clean(values.age_max) as number | undefined,
      height_min: clean(values.height_min) as number | undefined,
      height_max: clean(values.height_max) as number | undefined,
      weight_min: clean(values.weight_min) as number | undefined,
      weight_max: clean(values.weight_max) as number | undefined,
      body_type: clean(values.body_type) as string | undefined,
      relationship_status: clean(values.relationship_status) as string | undefined,
      education: clean(values.education) as string | undefined,
      religion: clean(values.religion) as string | undefined,
      ethnicity: clean(values.ethnicity) as string | undefined,
      political_orientation: clean(values.political_orientation) as string | undefined,
      smoking: clean(values.smoking) as string | undefined,
      drinking: clean(values.drinking) as string | undefined,
      languages: clean(values.languages) as string | undefined,
      interests: clean(values.interests) as string | undefined,
      has_photos: clean(values.has_photos) as boolean | undefined
    });
    setPage(1);
    setFilterOpen(false);
    setApplyHint((n) => n + 1);
  };

  const resetFilters = () => {
    setFilters({ ...EMPTY_FILTERS });
    filterForm.resetFields();
    setPage(1);
    setFilterOpen(false);
    setApplyHint((n) => n + 1);
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const updated = await updateUser(id, { is_active: isActive });
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, is_active: updated.is_active } : it)));
      setDetail(updated);
      message.success(isActive ? 'User activated' : 'User deactivated');
    } catch (error) {
      showApiError(error, 'Update failed.');
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
      showApiError(error, 'Grant failed.');
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
      showApiError(error, 'Send failed.');
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
      showApiError(error, 'Delete failed.');
    }
  };

  const activityData = activity.map((a) => ({ ...a, label: formatDateOnly(a.date) }));

  return (
    <Card
      title="Users"
      extra={
        <Space>
          <Input.Search
            placeholder="Name, email, phone, bio"
            allowClear
            style={{ width: 260 }}
            defaultValue={filters.search}
            onSearch={onSearch}
          />
          <Button
            icon={<FilterOutlined />}
            onClick={openFilter}
            style={filterCount(filters) > 1 ? { borderColor: '#7b2ff7', color: '#7b2ff7' } : undefined}
          >
            Filter{filters.search ? '' : filterCount(filters) > 0 ? ` (${filterCount(filters)})` : ''}
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={resetFilters}
            disabled={filterCount(filters) === 0 && !filters.search}
          >
            Reset
          </Button>
        </Space>
      }
    >
      <Table<AdminUserListItem>
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
        onChange={(p: TablePaginationConfig, _f, sorter: any) => {
          setPage(p.current ?? 1);
          if (sorter && sorter.field) {
            if (sorter.order === undefined) {
              setSortBy('created_at');
              setSortOrder('desc');
            } else {
              setSortBy(sorter.field);
              setSortOrder(sorter.order === 'ascend' ? 'asc' : 'desc');
            }
          }
        }}
        columns={[
          {
            title: 'UID',
            dataIndex: 'id',
            width: 90,
            sorter: true,
            render: (v: string, r) => (
              <a onClick={() => openDetail(r.id)}>
                <code style={{ fontSize: 12 }}>{v.slice(0, 8)}</code>
              </a>
            )
          },
          {
            title: 'Name',
            dataIndex: 'name',
            sorter: true,
            render: (v: string, r) => <a onClick={() => openDetail(r.id)}>{v || '—'}</a>
          },
          { title: 'Email', dataIndex: 'email', sorter: true },
          { title: 'Age', dataIndex: 'age', width: 70, sorter: true },
          { title: 'Gender', dataIndex: 'gender', width: 100, sorter: true },
          { title: 'City', dataIndex: 'city', width: 120, sorter: true, render: (v?: string) => v || '—' },
          {
            title: 'Status',
            dataIndex: 'is_active',
            width: 100,
            sorter: true,
            render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? 'Active' : 'Inactive'}</Tag>
          },
          {
            title: 'Premium',
            dataIndex: 'is_premium',
            width: 110,
            sorter: true,
            render: (v: boolean) => (v ? <Tag color="gold"><CrownOutlined /> Premium</Tag> : <Tag>Free</Tag>)
          },
          {
            title: 'Verified',
            dataIndex: 'is_verified',
            width: 100,
            sorter: true,
            render: (v?: boolean) => (v ? <Tag color="blue">Verified</Tag> : 'No')
          },
          {
            title: 'Joined',
            dataIndex: 'created_at',
            width: 150,
            sorter: true,
            defaultSortOrder: 'descend' as const,
            render: (v: string) => formatDate(v)
          }
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
        title={
          <Space>
            <FilterOutlined />
            Filter users
            {filterCount(filters) > 0 && (
              <Tag color="#7b2ff7" style={{ marginInlineStart: 4 }}>
                {filterCount(filters)} active
              </Tag>
            )}
          </Space>
        }
        open={filterOpen}
        width={760}
        onCancel={() => setFilterOpen(false)}
        footer={[
          <Button key="reset" icon={<CloseOutlined />} onClick={resetFilters} disabled={filterCount(filters) === 0}>
            Reset all
          </Button>,
          <Button key="cancel" onClick={() => setFilterOpen(false)}>
            Cancel
          </Button>,
          <Button key="apply" type="primary" icon={<SearchOutlined />} onClick={() => filterForm.submit()}>
            Apply filters
          </Button>
        ]}
      >
        <Form form={filterForm} layout="vertical" onFinish={applyFilter} style={{ marginTop: 4 }}>
          <FilterSection title="Account & status">
            <Form.Item name="uid" label="UID">
              <Input allowClear placeholder="Exact user UID" />
            </Form.Item>
            <Form.Item name="is_active" label="Status">
              <Select allowClear options={[
                { value: true, label: 'Active' },
                { value: false, label: 'Inactive' }
              ]} />
            </Form.Item>
            <Form.Item name="is_premium" label="Subscription">
              <Select allowClear options={[
                { value: true, label: 'Premium' },
                { value: false, label: 'Free' }
              ]} />
            </Form.Item>
            <Form.Item name="is_verified" label="Verified">
              <Select allowClear options={BOOL_OPTIONS} />
            </Form.Item>
            <Form.Item name="has_photos" label="Photos">
              <Select allowClear options={BOOL_OPTIONS} />
            </Form.Item>
            <Form.Item name="gender" label="Gender">
              <Select allowClear options={SELECT_OPTIONS('gender')} />
            </Form.Item>
          </FilterSection>

          <FilterSection title="Age & body">
            <Form.Item name="age_min" label="Age from">
              <InputNumber min={18} max={120} placeholder="18" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="age_max" label="Age to">
              <InputNumber min={18} max={120} placeholder="120" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="height_min" label="Height from (cm)">
              <InputNumber min={50} max={250} placeholder="50" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="height_max" label="Height to (cm)">
              <InputNumber min={50} max={250} placeholder="250" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="weight_min" label="Weight from (kg)">
              <InputNumber min={30} max={300} placeholder="30" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="weight_max" label="Weight to (kg)">
              <InputNumber min={30} max={300} placeholder="300" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="body_type" label="Body type">
              <Select allowClear options={SELECT_OPTIONS('body_type')} />
            </Form.Item>
            <Form.Item name="relationship_status" label="Relationship status">
              <Select allowClear options={SELECT_OPTIONS('relationship_status')} />
            </Form.Item>
            <Form.Item name="smoking" label="Smoking">
              <Select allowClear options={SELECT_OPTIONS('smoking')} />
            </Form.Item>
            <Form.Item name="drinking" label="Drinking">
              <Select allowClear options={SELECT_OPTIONS('drinking')} />
            </Form.Item>
          </FilterSection>

          <FilterSection title="Background">
            <Form.Item name="education" label="Education">
              <Select allowClear options={SELECT_OPTIONS('education')} />
            </Form.Item>
            <Form.Item name="religion" label="Religion">
              <Select allowClear options={SELECT_OPTIONS('religion')} />
            </Form.Item>
            <Form.Item name="ethnicity" label="Ethnicity">
              <Select allowClear options={SELECT_OPTIONS('ethnicity')} />
            </Form.Item>
            <Form.Item name="political_orientation" label="Political orientation">
              <Select allowClear options={SELECT_OPTIONS('political_orientation')} />
            </Form.Item>
            <Form.Item name="languages" label="Languages">
              <Input allowClear placeholder="e.g. english,persian" />
            </Form.Item>
            <Form.Item name="interests" label="Interests">
              <Input allowClear placeholder="Comma-separated" />
            </Form.Item>
          </FilterSection>

          <FilterSection title="Location">
            <Form.Item name="city" label="City">
              <Input allowClear placeholder="Contains" />
            </Form.Item>
            <Form.Item name="country" label="Country">
              <Input allowClear placeholder="Contains" />
            </Form.Item>
            <Form.Item name="province" label="Province">
              <Input allowClear placeholder="Contains" />
            </Form.Item>
          </FilterSection>
        </Form>
      </Modal>

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