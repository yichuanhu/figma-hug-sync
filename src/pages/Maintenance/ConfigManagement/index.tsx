import { useState } from 'react';
import { Typography, Tabs, TabPane, Switch, Button, Toast, Space } from '@douyinfe/semi-ui';
import { Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import SystemParamsTab from './components/SystemParamsTab';
import ServiceParamsTab from './components/ServiceParamsTab';
import InfrastructureTab from './components/InfrastructureTab';
import MonitoringConfigTab from './components/MonitoringConfigTab';
import LoggerConfigTab from './components/LoggerConfigTab';
import './index.less';

const TAB_ROUTES: Record<string, string> = {
  system: '/maintenance/config/system-params',
  service: '/maintenance/config/service-params',
  infrastructure: '/maintenance/config/infrastructure',
  monitoring: '/maintenance/config/monitoring',
  logger: '/maintenance/config/logger',
};

const PATH_TO_TAB: Record<string, string> = {
  '/maintenance/config/system-params': 'system',
  '/maintenance/config/service-params': 'service',
  '/maintenance/config/infrastructure': 'infrastructure',
  '/maintenance/config/monitoring': 'monitoring',
  '/maintenance/config/logger': 'logger',
};

const ConfigManagement = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [advanced, setAdvanced] = useState(false);
  const activeKey = PATH_TO_TAB[location.pathname] || 'system';

  const handleSave = () => Toast.success(t('maintenance.config.saveSuccess'));

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
          <Button icon={<Save size={14} strokeWidth={2} />} theme="solid" type="primary" onClick={handleSave}>
            {t('common.save')}
          </Button>
        </Space>
      </div>

      <div className="maintenance-config-page-body">
        <Tabs activeKey={activeKey} onChange={(k) => navigate(TAB_ROUTES[k])} type="line" keepDOM={false}>
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
    </div>
  );
};

export default ConfigManagement;
