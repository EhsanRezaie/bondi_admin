import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Space,
  Switch,
  Tag,
  Typography,
  message
} from 'antd';
import {
  PoweroffOutlined,
  UndoOutlined
} from '@ant-design/icons';
import {
  fetchMaintenanceStatus,
  enableMaintenance,
  disableMaintenance,
  fetchVersionConfig,
  setMinimumVersion,
  setForceUpdate,
  clearVersionOverride
} from '../api/system';
import { showApiError } from '../api/client';
import { formatDate } from '../utils/format';
import type { VersionConfigResponse } from '../api/types';

export function SystemPage() {
  const [maint, setMaint] = useState<{ maintenance_mode: boolean; message?: string | null; start_time?: string | null }>({
    maintenance_mode: false
  });
  const [maintBusy, setMaintBusy] = useState(false);
  const [enableOpen, setEnableOpen] = useState(false);
  const [maintForm] = Form.useForm();

  const [version, setVersion] = useState<VersionConfigResponse['data'] | null>(null);
  const [versionBusy, setVersionBusy] = useState(false);
  const [minModal, setMinModal] = useState<{ open: boolean; platform: 'android' | 'ios' }>({ open: false, platform: 'android' });
  const [minForm] = Form.useForm();
  const [forceMessage, setForceMessage] = useState('');

  const load = useCallback(async () => {
    try {
      const [m, v] = await Promise.all([fetchMaintenanceStatus(), fetchVersionConfig()]);
      setMaint({ maintenance_mode: m.maintenance_mode, message: m.message, start_time: m.start_time });
      setVersion(v.data);
      setForceMessage(v.data.force_update_message ?? '');
    } catch (error) {
      showApiError(error, 'Failed to load system status.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onEnableMaint = async (values: { message?: string }) => {
    setMaintBusy(true);
    try {
      await enableMaintenance(values.message || undefined);
      setEnableOpen(false);
      message.success('Maintenance mode enabled');
      await load();
    } catch (error) {
      showApiError(error, 'Enable failed.');
    } finally {
      setMaintBusy(false);
    }
  };

  const onDisableMaint = async () => {
    setMaintBusy(true);
    try {
      await disableMaintenance();
      message.success('Maintenance mode disabled');
      await load();
    } catch (error) {
      showApiError(error, 'Disable failed.');
    } finally {
      setMaintBusy(false);
    }
  };

  const onSetMinVersion = async (values: { version: string }) => {
    setVersionBusy(true);
    try {
      await setMinimumVersion(minModal.platform, values.version);
      message.success(`Minimum ${minModal.platform} version updated`);
      setMinModal({ open: false, platform: minModal.platform });
      await load();
    } catch (error) {
      showApiError(error, 'Update failed.');
    } finally {
      setVersionBusy(false);
    }
  };

  const onToggleForce = async (enabled: boolean) => {
    setVersionBusy(true);
    try {
      await setForceUpdate(enabled, forceMessage || undefined);
      message.success(enabled ? 'Force update enabled' : 'Force update disabled');
      await load();
    } catch (error) {
      showApiError(error, 'Update failed.');
    } finally {
      setVersionBusy(false);
    }
  };

  const onClearOverride = async () => {
    setVersionBusy(true);
    try {
      await clearVersionOverride();
      message.success('Version overrides cleared');
      await load();
    } catch (error) {
      showApiError(error, 'Clear failed.');
    } finally {
      setVersionBusy(false);
    }
  };

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={12}>
        <Card
          title="Maintenance mode"
          extra={
            maint.maintenance_mode ? (
              <Tag color="red">Enabled</Tag>
            ) : (
              <Tag color="green">Disabled</Tag>
            )
          }
        >
          {maint.maintenance_mode && (
            <Alert
              type="warning"
              showIcon
              message="Users are seeing the maintenance screen right now."
              description={maint.message ? `Message: ${maint.message}` : undefined}
              style={{ marginBottom: 16 }}
            />
          )}
          <Typography.Paragraph type="secondary">
            Since {maint.start_time ? formatDate(maint.start_time) : '—'}
          </Typography.Paragraph>
          <Button
            danger
            disabled={!maint.maintenance_mode}
            loading={maintBusy}
            icon={<PoweroffOutlined />}
            onClick={() => onDisableMaint()}
          >
            Disable
          </Button>
          <Button
            style={{ marginLeft: 8 }}
            type="primary"
            disabled={maint.maintenance_mode}
            onClick={() => setEnableOpen(true)}
          >
            Enable
          </Button>
        </Card>
      </Col>

      <Col xs={24} lg={12}>
        <Card
          title="Version control"
          extra={version && <Tag>app {version.app_version}</Tag>}
        >
          <Alert
            type="info"
            showIcon
            message="Runtime overrides take priority over the configured settings below."
            style={{ marginBottom: 16 }}
          />
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form layout="vertical">
                <Form.Item label="Minimum Android version">
                  <Space>
                    <Input value={version?.minimum_versions.android ?? '—'} disabled style={{ width: 120 }} />
                    <Button size="small" onClick={() => { minForm.setFieldsValue({ version: '' }); setMinModal({ open: true, platform: 'android' }); }}>
                      Edit
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Col>
            <Col span={12}>
              <Form layout="vertical">
                <Form.Item label="Minimum iOS version">
                  <Space>
                    <Input value={version?.minimum_versions.ios ?? '—'} disabled style={{ width: 120 }} />
                    <Button size="small" onClick={() => { minForm.setFieldsValue({ version: '' }); setMinModal({ open: true, platform: 'ios' }); }}>
                      Edit
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Col>
          </Row>
          <Form layout="vertical">
            <Form.Item label="Force update">
              <Space>
                <Switch
                  checked={version?.force_update ?? false}
                  loading={versionBusy}
                  onChange={(v) => onToggleForce(v)}
                />
                <Input
                  placeholder="Force update message"
                  value={forceMessage}
                  onChange={(e) => setForceMessage(e.target.value)}
                  style={{ width: 220 }}
                />
              </Space>
            </Form.Item>
          </Form>
          <Button icon={<UndoOutlined />} onClick={onClearOverride} loading={versionBusy}>
            Clear all overrides
          </Button>
        </Card>
      </Col>

      <Modal
        title="Enable maintenance mode"
        open={enableOpen}
        onOk={() => maintForm.submit()}
        confirmLoading={maintBusy}
        onCancel={() => setEnableOpen(false)}
        width={460}
      >
        <Form form={maintForm} layout="vertical" onFinish={onEnableMaint} style={{ marginTop: 16 }}>
          <Form.Item
            name="message"
            label="Message (shown to users on the maintenance screen)"
            tooltip="Defaults to the standard maintenance message if left empty."
          >
            <Input.TextArea rows={3} maxLength={500} showCount />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Set minimum ${minModal.platform} version`}
        open={minModal.open}
        onOk={() => minForm.submit()}
        confirmLoading={versionBusy}
        onCancel={() => setMinModal((m) => ({ ...m, open: false }))}
        width={420}
      >
        <Form form={minForm} layout="vertical" onFinish={onSetMinVersion} style={{ marginTop: 16 }}>
          <Form.Item
            name="version"
            label="Version (x.y.z)"
            rules={[
              { required: true, message: 'Version required' },
              { pattern: /^\d+(\.\d+){1,2}$/, message: 'Format: 1.2 or 1.2.3' }
            ]}
          >
            <Input placeholder="1.4.0" />
          </Form.Item>
        </Form>
      </Modal>
    </Row>
  );
}