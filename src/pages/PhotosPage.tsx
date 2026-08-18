import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Empty,
  Input,
  Modal,
  Row,
  Statistic,
  Tag,
  message
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { fetchPendingPhotos, fetchPhotoStats, approvePhoto, rejectPhoto, verifyFace } from '../api/photos';
import { showApiError } from '../api/client';
import { formatDate } from '../utils/format';
import type { AdminPendingPhoto, AdminPhotoStats } from '../api/types';

const PAGE_SIZE = 12;

export function PhotosPage() {
  const [stats, setStats] = useState<AdminPhotoStats | null>(null);
  const [items, setItems] = useState<AdminPendingPhoto[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  const [rejectTarget, setRejectTarget] = useState<AdminPendingPhoto | null>(null);
  const [rejectReason, setRejectReason] = useState('Inappropriate content');
  const [preview, setPreview] = useState<string | null>(null);

  const load = useCallback(async (off = offset) => {
    setLoading(true);
    try {
      const list = await fetchPendingPhotos(PAGE_SIZE, off);
      setItems(off === 0 ? list : (prev) => [...prev, ...list]);
      setOffset(off);
    } catch (error) {
      showApiError(error, 'Failed to load photos.');
    } finally {
      setLoading(false);
    }
  }, [offset]);

  const refreshStats = useCallback(async () => {
    try {
      setStats(await fetchPhotoStats());
    } catch {
      // non-fatal
    }
  }, []);

  useEffect(() => {
    void load(0);
    void refreshStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runAction = async (fn: () => Promise<{ message: string }>, id: string, successText: string) => {
    setActionBusy(id);
    try {
      const res = await fn();
      message.success(res.message || successText);
      setItems((prev) => prev.filter((p) => p.id !== id));
      void refreshStats();
    } catch (error) {
      showApiError(error, 'Action failed.');
    } finally {
      setActionBusy(null);
    }
  };

  const submitReject = async () => {
    if (!rejectTarget) return;
    setActionBusy(rejectTarget.id);
    try {
      const res = await rejectPhoto(rejectTarget.id, rejectReason);
      message.success(res.message);
      setItems((prev) => prev.filter((p) => p.id !== rejectTarget.id));
      setRejectTarget(null);
      void refreshStats();
    } catch (error) {
      showApiError(error, 'Reject failed.');
    } finally {
      setActionBusy(null);
    }
  };

  const statCards = [
    { title: 'Pending', value: stats?.pending ?? 0, color: '#fa8c16' },
    { title: 'Approved', value: stats?.approved ?? 0, color: '#52c41a' },
    { title: 'Rejected', value: stats?.rejected ?? 0, color: '#f5222d' },
    { title: 'Total', value: stats?.total ?? 0, color: '#7b2ff7' }
  ];

  return (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {statCards.map((s) => (
          <Col xs={12} lg={6} key={s.title}>
            <Card><Statistic title={s.title} value={s.value} valueStyle={{ color: s.color }} /></Card>
          </Col>
        ))}
      </Row>

      <Card title={`Photo moderation queue (${items.length})`} extra={<Button icon={<ReloadOutlined />} onClick={() => load(0)}>Refresh</Button>}>
        {items.length === 0 && !loading ? (
          <Empty description="No pending photos" />
        ) : (
          <Row gutter={[16, 16]}>
            {items.map((p) => (
              <Col xs={24} sm={12} lg={8} key={p.id}>
                <Card
                  size="small"
                  cover={
                    <img
                      src={p.url}
                      alt="photo"
                      style={{ height: 200, objectFit: 'cover', cursor: 'pointer' }}
                      onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }}
                      onClick={() => setPreview(p.url)}
                    />
                  }
                  actions={[
                    <Button
                      type="text"
                      icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                      loading={actionBusy === p.id}
                      onClick={() => runAction(() => approvePhoto(p.id), p.id, 'Approved')}
                    >
                      Approve
                    </Button>,
                    <Button
                      type="text"
                      danger
                      icon={<CloseCircleOutlined />}
                      loading={actionBusy === p.id}
                      onClick={() => setRejectTarget(p)}
                    >
                      Reject
                    </Button>,
                    <Button
                      type="text"
                      icon={<EyeOutlined />}
                      loading={actionBusy === p.id}
                      onClick={() => runAction(() => verifyFace(p.id), p.id, 'Face verified')}
                    >
                      Verify face
                    </Button>
                  ]}
                >
                  <div style={{ marginBottom: 4 }}>
                    <b>{p.user_name || '—'}</b> <span style={{ color: '#888' }}>({p.user_email})</span>
                  </div>
                  <SpaceSmall p={p} />
                  <div style={{ color: '#888', fontSize: 12 }}>{formatDate(p.created_at)}</div>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Button onClick={() => load(offset + PAGE_SIZE)} loading={loading} disabled={items.length < PAGE_SIZE}>
            Load more
          </Button>
        </div>
      </Card>

      <Modal
        title="Reject photo"
        open={Boolean(rejectTarget)}
        onCancel={() => setRejectTarget(null)}
        onOk={() => submitReject()}
        okButtonProps={{ danger: true }}
        confirmLoading={actionBusy === rejectTarget?.id}
      >
        <p>Reason for rejection:</p>
        <Input.TextArea rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} maxLength={500} />
      </Modal>

      <Modal open={Boolean(preview)} footer={null} onCancel={() => setPreview(null)} width={520} destroyOnClose>
        {preview && <img src={preview} alt="preview" style={{ width: '100%' }} />}
      </Modal>
    </>
  );
}

function SpaceSmall({ p }: { p: AdminPendingPhoto }) {
  return (
    <div style={{ marginBottom: 4 }}>
      {p.is_main && <Tag color="purple">Main</Tag>}
      <Tag color={p.face_verified ? 'blue' : 'default'}>{p.face_verified ? 'Face verified' : 'Face not verified'}</Tag>
    </div>
  );
}