import { useState } from 'react';
import { Alert, Button, Card, Col, Descriptions, Form, Input, Modal, Row, message } from 'antd';
import { DeleteOutlined, EyeOutlined, WarningOutlined } from '@ant-design/icons';
import { decryptMessage, deleteMessage, fetchReportedMessage } from '../api/messages';
import { showApiError } from '../api/client';
import { formatDate } from '../utils/format';
import type { AdminMessageDecryptResponse, AdminReportedMessageResponse } from '../api/types';

export function MessagesPage() {
  const [decrypted, setDecrypted] = useState<AdminMessageDecryptResponse | null>(null);
  const [decrypting, setDecrypting] = useState(false);
  const [decryptForm] = Form.useForm<{ message_id: string }>();

  const [deleteTarget, setDeleteTarget] = useState<AdminMessageDecryptResponse | null>(null);
  const [deleteReason, setDeleteReason] = useState('Violates terms of service');
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [reported, setReported] = useState<AdminReportedMessageResponse | null>(null);
  const [reportedBusy, setReportedBusy] = useState(false);
  const [reportForm] = Form.useForm<{ report_id: string }>();

  const onDecrypt = async (values: { message_id: string }) => {
    setDecrypting(true);
    try {
      setDecrypted(await decryptMessage(values.message_id));
    } catch (error) {
      showApiError(error, 'Decrypt failed.');
    } finally {
      setDecrypting(false);
    }
  };

  const onDelete = async () => {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      const res = await deleteMessage(deleteTarget.message_id, deleteReason);
      message.success(res.message);
      setDeleteTarget(null);
      setDecrypted(null);
      decryptForm.resetFields();
    } catch (error) {
      showApiError(error, 'Delete failed.');
    } finally {
      setDeleteBusy(false);
    }
  };

  const onFetchReported = async (values: { report_id: string }) => {
    setReportedBusy(true);
    try {
      setReported(await fetchReportedMessage(values.report_id));
    } catch (error) {
      showApiError(error, 'Fetch failed.');
    } finally {
      setReportedBusy(false);
    }
  };

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={12}>
        <Card title="Look up a message" extra={<EyeOutlined />}>
          <Alert
            type="info"
            showIcon
            message="Decrypts an E2E-encrypted message as a moderation tool. Only use when required."
            style={{ marginBottom: 16 }}
          />
          <Form form={decryptForm} layout="vertical" onFinish={onDecrypt}>
            <Form.Item
              name="message_id"
              label="Message ID (UUID)"
              rules={[{ required: true, message: 'Message ID required' }]}
            >
              <Input placeholder="00000000-0000-0000-0000-000000000000" />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={decrypting} icon={<EyeOutlined />}>
              Decrypt
            </Button>
          </Form>

          {decrypted && (
            <Card size="small" title="Decrypted message" style={{ marginTop: 16 }}>
              <Descriptions bordered size="small" column={1}>
                <Descriptions.Item label="Sender">{decrypted.sender_id}</Descriptions.Item>
                <Descriptions.Item label="Receiver">{decrypted.receiver_id}</Descriptions.Item>
                <Descriptions.Item label="Sent at">{formatDate(decrypted.sent_at)}</Descriptions.Item>
                <Descriptions.Item label="Content">
                  <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{decrypted.content}</span>
                </Descriptions.Item>
              </Descriptions>
              <Button
                danger
                style={{ marginTop: 16 }}
                icon={<DeleteOutlined />}
                onClick={() => setDeleteTarget(decrypted)}
              >
                Delete for everyone
              </Button>
            </Card>
          )}
        </Card>
      </Col>

      <Col xs={24} lg={12}>
        <Card title="View reported message" extra={<WarningOutlined />}>
          <Alert
            type="warning"
            showIcon
            message="Loads the message attached to a report so you can review the evidence."
            style={{ marginBottom: 16 }}
          />
          <Form form={reportForm} layout="vertical" onFinish={onFetchReported}>
            <Form.Item
              name="report_id"
              label="Report ID (UUID)"
              rules={[{ required: true, message: 'Report ID required' }]}
            >
              <Input placeholder="00000000-0000-0000-0000-000000000000" />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={reportedBusy} icon={<WarningOutlined />}>
              Load message
            </Button>
          </Form>

          {reported && (
            <Card size="small" title="Reported message" style={{ marginTop: 16 }}>
              <Descriptions bordered size="small" column={1}>
                <Descriptions.Item label="Report reason">{reported.report_reason}</Descriptions.Item>
                <Descriptions.Item label="Report description">{reported.report_description ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Sender">{reported.sender_id}</Descriptions.Item>
                <Descriptions.Item label="Receiver">{reported.receiver_id}</Descriptions.Item>
                <Descriptions.Item label="Sent at">{formatDate(reported.sent_at)}</Descriptions.Item>
                <Descriptions.Item label="Content">
                  <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{reported.content}</span>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}
        </Card>
      </Col>

      <Modal
        title="Delete message for everyone"
        open={Boolean(deleteTarget)}
        onOk={() => onDelete()}
        confirmLoading={deleteBusy}
        okButtonProps={{ danger: true }}
        onCancel={() => setDeleteTarget(null)}
      >
        <p>Reason (shown to the recipient):</p>
        <Input.TextArea rows={3} value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)} maxLength={500} />
      </Modal>
    </Row>
  );
}