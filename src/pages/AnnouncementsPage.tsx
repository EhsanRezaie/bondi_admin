import { useState } from 'react';
import { Alert, Button, Card, Form, Input, Modal, Row, Col, Switch, Typography, message } from 'antd';
import { NotificationOutlined, ExperimentOutlined } from '@ant-design/icons';
import { sendAnnouncement, sendTestAnnouncement } from '../api/announcements';
import { apiErrorMessage } from '../api/client';

const { TextArea } = Input;

interface BroadcastFormValues {
  title: string;
  message: string;
  to_premium_only: boolean;
}

export function AnnouncementsPage() {
  const [broadcastForm] = Form.useForm<BroadcastFormValues>();
  const [broadcasting, setBroadcasting] = useState(false);

  const [testOpen, setTestOpen] = useState(false);
  const [testForm] = Form.useForm<{ title: string; message: string; target_user_id?: string }>();
  const [testing, setTesting] = useState(false);

  const onBroadcast = async (values: BroadcastFormValues) => {
    setBroadcasting(true);
    try {
      const res = await sendAnnouncement(values.title, values.message, values.to_premium_only);
      message.success(res.message);
      broadcastForm.resetFields();
    } catch (error) {
      message.error(apiErrorMessage(error, 'Send failed.'));
    } finally {
      setBroadcasting(false);
    }
  };

  const onTest = async (values: { title: string; message: string; target_user_id?: string }) => {
    setTesting(true);
    try {
      const res = await sendTestAnnouncement(values.title, values.message, values.target_user_id);
      message.success(res.message);
      setTestOpen(false);
      testForm.resetFields();
    } catch (error) {
      message.error(apiErrorMessage(error, 'Test send failed.'));
    } finally {
      setTesting(false);
    }
  };

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={14}>
        <Card title="Broadcast announcement" extra={<NotificationOutlined />}>
          <Form<BroadcastFormValues>
            form={broadcastForm}
            layout="vertical"
            onFinish={onBroadcast}
            initialValues={{ to_premium_only: false }}
          >
            <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Title required' }]}>
              <Input maxLength={200} showCount placeholder="e.g. Version 1.4 is here!" />
            </Form.Item>
            <Form.Item name="message" label="Message" rules={[{ required: true, message: 'Message required' }]}>
              <TextArea rows={5} maxLength={2000} showCount placeholder="Write the announcement body…" />
            </Form.Item>
            <Form.Item name="to_premium_only" label="Audience" valuePropName="checked">
              <Switch checkedChildren="Premium only" unCheckedChildren="All users" />
            </Form.Item>
            <Alert
              type="info"
              showIcon
              message="This sends a system notification to every active user. Rate limit: 10/minute."
              style={{ marginBottom: 16 }}
            />
            <Button type="primary" htmlType="submit" loading={broadcasting} icon={<NotificationOutlined />}>
              Send broadcast
            </Button>
          </Form>
        </Card>
      </Col>

      <Col xs={24} lg={10}>
        <Card title="Send test to one user" extra={<ExperimentOutlined />}>
          <Typography.Paragraph type="secondary">
            Deliver the announcement to a single test account before broadcasting.
          </Typography.Paragraph>
          <Button onClick={() => setTestOpen(true)} icon={<ExperimentOutlined />}>
            Open test sender
          </Button>
        </Card>
      </Col>

      <Modal
        title="Send test announcement"
        open={testOpen}
        onCancel={() => setTestOpen(false)}
        onOk={() => testForm.submit()}
        confirmLoading={testing}
        destroyOnClose
        width={520}
      >
        <Form form={testForm} layout="vertical" onFinish={onTest} style={{ marginTop: 16 }}>
          <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Title required' }]}>
            <Input maxLength={200} showCount />
          </Form.Item>
          <Form.Item name="message" label="Message" rules={[{ required: true, message: 'Message required' }]}>
            <TextArea rows={4} maxLength={2000} showCount />
          </Form.Item>
          <Form.Item
            name="target_user_id"
            label="Target user ID (UUID)"
            tooltip="Send to a specific user; leave empty to fall back to the admin test account."
          >
            <Input placeholder="00000000-0000-0000-0000-000000000000" />
          </Form.Item>
        </Form>
      </Modal>
    </Row>
  );
}