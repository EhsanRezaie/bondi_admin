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
import { ReloadOutlined, DeleteOutlined, SendOutlined } from '@ant-design/icons';
import { fetchTickets, fetchTicket, updateTicket, replyTicket, deleteTicket } from '../api/tickets';
import { apiErrorMessage } from '../api/client';
import { formatDate } from '../utils/format';
import type { AdminTicket, AdminTicketDetail, AdminTicketMessage } from '../api/types';

const PAGE_SIZE = 30;
const STATUS_COLORS: Record<string, string> = {
  open: 'orange',
  in_progress: 'blue',
  closed: 'green'
};

export function TicketsPage() {
  const [items, setItems] = useState<AdminTicket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);

  const [detail, setDetail] = useState<AdminTicketDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [responseForm] = Form.useForm();

  const load = useCallback(async (p = page, status?: string) => {
    setLoading(true);
    try {
      const res = await fetchTickets({ status_filter: status, limit: PAGE_SIZE, offset: (p - 1) * PAGE_SIZE });
      setItems(res.tickets);
      setTotal(res.total);
    } catch (error) {
      message.error(apiErrorMessage(error, 'Failed to load tickets.'));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load(1, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, page]);

  const openDetail = async (ticket: AdminTicket) => {
    setDetailLoading(true);
    try {
      const fresh = await fetchTicket(ticket.id);
      setDetail(fresh);
    } catch (error) {
      message.error(apiErrorMessage(error, 'Failed to load ticket.'));
    } finally {
      setDetailLoading(false);
    }
  };

  const onRespond = async (values: { reply: string }) => {
    if (!detail) return;
    try {
      const updated = await replyTicket(detail.id, values.reply);
      setDetail(updated);
      setItems((prev) => prev.map((t) => (t.id === detail.id ? updated : t)));
      responseForm.resetFields();
      message.success('Reply sent');
    } catch (error) {
      message.error(apiErrorMessage(error, 'Send failed.'));
    }
  };

  const setStatus = async (status: string) => {
    if (!detail) return;
    try {
      const updated = await updateTicket(detail.id, { status });
      setDetail(updated);
      setItems((prev) => prev.map((t) => (t.id === detail.id ? updated : t)));
      message.success('Status updated');
    } catch (error) {
      message.error(apiErrorMessage(error, 'Update failed.'));
    }
  };

  const onDelete = async (id: string) => {
    try {
      await deleteTicket(id);
      message.success('Ticket deleted');
      setDetail(null);
      void load(page, statusFilter);
    } catch (error) {
      message.error(apiErrorMessage(error, 'Delete failed.'));
    }
  };

  const renderConversation = () => {
    const messages: AdminTicketMessage[] = detail?.messages ?? [];
    const thread = messages.length > 0 ? messages : (
      detail?.admin_response
        ? [{ id: 'legacy', sender_type: 'admin' as const, content: detail.admin_response, created_at: detail.updated_at ?? detail.created_at }]
        : []
    );

    if (thread.length === 0) {
      return (
        <div style={{ marginTop: 16, padding: 12, color: '#888', textAlign: 'center', background: '#fafafa', borderRadius: 8 }}>
          No messages yet — send the first reply.
        </div>
      );
    }

    return (
      <div
        style={{
          marginTop: 16,
          maxHeight: 320,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          padding: 4
        }}
      >
        {thread.map((m, i) => {
          const isAdmin = m.sender_type === 'admin';
          return (
            <div
              key={m.id ?? `msg-${i}`}
              style={{ display: 'flex', justifyContent: isAdmin ? 'flex-start' : 'flex-end' }}
            >
              <div
                style={{
                  maxWidth: '80%',
                  padding: '8px 12px',
                  borderRadius: 12,
                  background: isAdmin ? '#f5f5f5' : '#e6f4ff',
                  border: isAdmin ? '1px solid #eee' : '1px solid #91caff'
                }}
              >
                <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>
                  {isAdmin ? 'Admin' : 'User'} · {formatDate(m.created_at)}
                </div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card
      title="Support tickets"
      extra={
        <Space>
          <Select
            placeholder="Status"
            allowClear
            style={{ width: 160 }}
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
            options={[
              { value: 'open', label: 'Open' },
              { value: 'in_progress', label: 'In progress' },
              { value: 'closed', label: 'Closed' }
            ]}
          />
          <Button icon={<ReloadOutlined />} onClick={() => void load(page, statusFilter)}>
            Refresh
          </Button>
        </Space>
      }
    >
      <Table<AdminTicket>
        rowKey="id"
        dataSource={items}
        loading={loading}
        scroll={{ x: 700 }}
        pagination={{
          current: page,
          pageSize: PAGE_SIZE,
          total,
          showSizeChanger: false,
          showTotal: (t) => `${t} tickets`
        }}
        onChange={(p) => setPage(p.current ?? 1)}
        columns={[
          { title: 'Subject', dataIndex: 'subject', render: (v: string, r) => <a onClick={() => openDetail(r)}>{v}</a> },
          { title: 'Message', dataIndex: 'message', ellipsis: true, render: (_v: string, r) => r.last_message ?? r.message },
          {
            title: 'Status',
            dataIndex: 'status',
            width: 130,
            render: (v: string) => <Tag color={STATUS_COLORS[v] ?? 'default'}>{v}</Tag>
          },
          { title: 'Created', dataIndex: 'created_at', width: 160, render: (v: string) => formatDate(v) }
        ]}
      />

      <Drawer
        title={`Ticket: ${detail?.subject ?? ''}`}
        open={Boolean(detail)}
        width={620}
        loading={detailLoading}
        onClose={() => setDetail(null)}
        extra={
          <Space>
            {detail?.status !== 'closed' && (
              <Button type="primary" onClick={() => setStatus('closed')} icon={<SendOutlined />}>
                Close
              </Button>
            )}
            <Popconfirm title="Delete this ticket?" onConfirm={() => onDelete(detail!.id)} okButtonProps={{ danger: true }}>
              <Button danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        }
      >
        {detail && (
          <>
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="User UID">{detail.user_uid}</Descriptions.Item>
              <Descriptions.Item label="Subject">{detail.subject}</Descriptions.Item>
              <Descriptions.Item label="Message">{detail.message}</Descriptions.Item>
              <Descriptions.Item label="Status"><Tag color={STATUS_COLORS[detail.status] ?? 'default'}>{detail.status}</Tag></Descriptions.Item>
              <Descriptions.Item label="Created">{formatDate(detail.created_at)}</Descriptions.Item>
              <Descriptions.Item label="Updated">{formatDate(detail.updated_at)}</Descriptions.Item>
            </Descriptions>

            {renderConversation()}

            <Form form={responseForm} layout="vertical" style={{ marginTop: 16 }} onFinish={onRespond}>
              <Form.Item name="reply" label="Reply" rules={[{ required: true, message: 'Reply required' }]}>
                <Input.TextArea rows={4} maxLength={2000} showCount placeholder="Write a reply to the user…" />
              </Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" icon={<SendOutlined />}>Send reply</Button>
                {detail.status !== 'in_progress' && (
                  <Button onClick={() => setStatus('in_progress')}>Mark in progress</Button>
                )}
              </Space>
            </Form>
          </>
        )}
      </Drawer>
    </Card>
  );
}