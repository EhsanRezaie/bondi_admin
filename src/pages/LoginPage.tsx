import { useState } from 'react';
import { Button, Card, Form, Input, Typography, message } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { apiErrorMessage } from '../api/client';

interface LoginFormValues {
  username: string;
  password: string;
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/dashboard';

  const onFinish = async (values: LoginFormValues) => {
    setSubmitting(true);
    try {
      await login(values.username, values.password);
      navigate(from, { replace: true });
    } catch (error) {
      message.error(apiErrorMessage(error, 'Login failed. Check credentials.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1e1b4b 0%, #7b2ff7 100%)',
        padding: 16
      }}
    >
      <Card style={{ width: 380 }}>
        <Typography.Title level={3} style={{ textAlign: 'center', marginTop: 0 }}>
          BONDI Admin
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ textAlign: 'center' }}>
          Sign in to manage the platform
        </Typography.Paragraph>
        <Form<LoginFormValues> onFinish={onFinish} layout="vertical">
          <Form.Item name="username" rules={[{ required: true, message: 'Username required' }]}>
            <Input prefix={<UserOutlined />} placeholder="Admin username" autoComplete="username" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: 'Password required' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Password" autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={submitting}>
            Sign in
          </Button>
        </Form>
      </Card>
    </div>
  );
}