import { useState } from 'react';
import { Typography, Tabs, TabPane, Switch, Button, Toast, Space, Modal, Tag } from '@douyinfe/semi-ui';
import { Save, Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import SystemParamsTab from './components/SystemParamsTab';
import ServiceParamsTab from './components/ServiceParamsTab';
import InfrastructureTab from './components/InfrastructureTab';
import MonitoringConfigTab from './components/MonitoringConfigTab';
import LoggerConfigTab from './components/LoggerConfigTab';
import './index.less';

const PATH_TO_TAB: Record<string, string> = {
  '/maintenance/config/system-params': 'system',
  '/maintenance/config/service-params': 'service',
  '/maintenance/config/infrastructure': 'infrastructure',
  '/maintenance/config/monitoring': 'monitoring',
  '/maintenance/config/logger': 'logger',
};

interface SaveResult {
  backupPath: string;
  restartCommand: string;
  restoreCommand: string;
}

// 模拟后端返回的保存结果（实际接入后端时由 API 返回）
const mockSaveConfig = (tab: string): Promise<SaveResult> => {
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const service = tab === 'logger' ? 'server' : tab;
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        backupPath: `/opt/apa/config/backups/${tab}.yaml.${ts}.bak`,
        restartCommand: `sudo systemctl restart apa-${service}`,
        restoreCommand: `sudo cp /opt/apa/config/backups/${tab}.yaml.${ts}.bak /opt/apa/config/${tab}.yaml`,
      });
    }, 400);
  });
};

const ConfigManagement = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [advanced, setAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resultVisible, setResultVisible] = useState(false);
  const [saveResult, setSaveResult] = useState<SaveResult | null>(null);
  const [activeKey, setActiveKey] = useState<string>(PATH_TO_TAB[location.pathname] || 'system');

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      Toast.success(t('maintenance.config.copySuccess'));
    } catch {
      Toast.error('Copy failed');
    }
  };

  const doSave = async () => {
    setSaving(true);
    try {
      const result = await mockSaveConfig(activeKey);
      setSaveResult(result);
      setResultVisible(true);
      Toast.success(t('maintenance.config.saveSuccess'));
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    Modal.confirm({
      title: t('maintenance.config.saveConfirmTitle'),
      content: t('maintenance.config.saveConfirmContent'),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      centered: true,
      onOk: doSave,
    });
  };

  const renderCommandRow = (label: string, value: string) => (
    <div style={{ marginBottom: 16 }}>
      <Typography.Text strong style={{ display: 'block', marginBottom: 6, fontSize: 13 }}>
        {label}
      </Typography.Text>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          padding: '10px 12px',
          background: 'var(--semi-color-fill-0)',
          borderRadius: 6,
          border: '1px solid var(--semi-color-border)',
        }}
      >
        <Typography.Text
          code
          style={{ flex: 1, fontSize: 12, wordBreak: 'break-all', lineHeight: 1.6 }}
        >
          {value}
        </Typography.Text>
        <Button
          size="small"
          theme="borderless"
          icon={<Copy size={14} strokeWidth={2} />}
          onClick={() => handleCopy(value)}
        >
          {t('maintenance.config.copy')}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="maintenance-config-page">
      <div className="maintenance-config-page-header">
        <Typography.Title heading={3} className="title">{t('maintenance.config.title')}</Typography.Title>
        <Typography.Text type="tertiary">{t('maintenance.config.description')}</Typography.Text>
      </div>

      <div className="maintenance-config-page-toolbar">
        <div />
        <Space>
          <Typography.Text type="tertiary" size="small">{t('maintenance.config.advancedMode')}</Typography.Text>
          <Switch checked={advanced} onChange={setAdvanced} />
          <Button
            icon={<Save size={14} strokeWidth={2} />}
            theme="solid"
            type="primary"
            loading={saving}
            onClick={handleSave}
          >
            {t('common.save')}
          </Button>
        </Space>
      </div>

      <div className="maintenance-config-page-body">
        <Tabs activeKey={activeKey} onChange={setActiveKey} type="line" keepDOM={false}>
          <TabPane tab={t('maintenance.config.system.title')} itemKey="system">
            <SystemParamsTab advanced={advanced} />
          </TabPane>
          <TabPane tab={t('maintenance.config.service.title')} itemKey="service">
            <ServiceParamsTab advanced={advanced} />
          </TabPane>
          <TabPane tab={t('maintenance.config.infra.title')} itemKey="infrastructure">
            <InfrastructureTab advanced={advanced} />
          </TabPane>
          <TabPane tab={t('maintenance.config.monitoring.title')} itemKey="monitoring">
            <MonitoringConfigTab advanced={advanced} />
          </TabPane>
          <TabPane tab={t('maintenance.config.logger.title')} itemKey="logger">
            <LoggerConfigTab advanced={advanced} />
          </TabPane>
        </Tabs>
      </div>

      <Modal
        title={
          <Space>
            <span>{t('maintenance.config.saveResultTitle')}</span>
            <Tag color="green" size="small">Success</Tag>
          </Space>
        }
        visible={resultVisible}
        onCancel={() => setResultVisible(false)}
        footer={
          <Button theme="solid" type="primary" onClick={() => setResultVisible(false)}>
            {t('maintenance.config.gotIt')}
          </Button>
        }
        width={600}
        centered
        maskClosable={false}
      >
        {saveResult && (
          <div>
            <Typography.Paragraph type="tertiary" style={{ marginBottom: 16 }}>
              {t('maintenance.config.saveResultDesc')}
            </Typography.Paragraph>
            {renderCommandRow(t('maintenance.config.backupPathLabel'), saveResult.backupPath)}
            {renderCommandRow(t('maintenance.config.restartCommandLabel'), saveResult.restartCommand)}
            {renderCommandRow(t('maintenance.config.restoreCommandLabel'), saveResult.restoreCommand)}
            <Typography.Text type="tertiary" size="small">
              {t('maintenance.config.restoreHint')}
            </Typography.Text>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ConfigManagement;
