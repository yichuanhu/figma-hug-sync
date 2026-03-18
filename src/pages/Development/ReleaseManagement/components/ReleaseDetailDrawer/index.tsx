import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Descriptions,
  Tag,
  Tabs,
  TabPane,
} from '@douyinfe/semi-ui';
import {
  IconExternalOpenStroked,
} from '@douyinfe/semi-icons';
import type { LYReleaseResponse, ReleaseType, ReleaseStatus, ResourceType } from '@/api';
import DetailDrawerWrapper from '@/components/DetailDrawerWrapper';
import ExpandableText from '@/components/ExpandableText';
import UserNameWithCard from '@/components/layout/UserNameWithCard';

import './index.less';

const { Title, Text } = Typography;

interface ReleaseDetailDrawerProps {
  visible: boolean;
  release: LYReleaseResponse | null;
  releaseList?: LYReleaseResponse[];
  onClose: () => void;
  onNavigate?: (release: LYReleaseResponse) => void;
}

const ReleaseDetailDrawer: React.FC<ReleaseDetailDrawerProps> = ({
  visible,
  release,
  releaseList = [],
  onClose,
  onNavigate,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // 按类型分组资源
  const groupedResources = useMemo(() => {
    if (!release) return { PARAMETER: [], CREDENTIAL: [], QUEUE: [], FILE: [] };

    const mockResources = [
      { resource_id: 'param-001', resource_type: 'PARAMETER' as ResourceType, resource_name: 'Global_System_Timeout_Configuration_For_All_Enterprise_Services_And_Microservices_V2', test_value: '{"timeout_ms":30000,"retry_enabled":true,"retry_count":3,"retry_delay_ms":1000,"circuit_breaker":{"enabled":true,"threshold":5,"reset_timeout_ms":60000},"fallback":{"enabled":true,"default_value":"N/A"},"monitoring":{"log_level":"INFO","alert_threshold_ms":25000}}', production_value: '{"timeout_ms":60000,"retry_enabled":true,"retry_count":5,"retry_delay_ms":2000,"circuit_breaker":{"enabled":true,"threshold":10,"reset_timeout_ms":120000},"fallback":{"enabled":true,"default_value":"SERVICE_UNAVAILABLE"},"monitoring":{"log_level":"WARN","alert_threshold_ms":50000}}', use_test_as_production: false, is_previously_published: true, is_manual: false, used_by_processes: ['SAP_ERP_Order_Processing_And_Fulfillment_Workflow_V3', '库存检查流程'] },
      { resource_id: 'param-002', resource_type: 'PARAMETER' as ResourceType, resource_name: '最大重试次数', test_value: '3', production_value: '5', use_test_as_production: false, is_previously_published: false, is_manual: true, used_by_processes: ['SAP_ERP_Order_Processing_And_Fulfillment_Workflow_V3'] },
      { resource_id: 'param-003', resource_type: 'PARAMETER' as ResourceType, resource_name: 'Enterprise_Database_Connection_String_With_Failover_And_LoadBalancing_Parameters', test_value: 'Server=test-db-cluster.internal.company.com,1433;Database=TestDB_Enterprise_v5;User Id=svc_test_account;Password=********;MultipleActiveResultSets=True;Connection Timeout=30;Encrypt=True;TrustServerCertificate=False;Application Name=RPA_Platform_Test;Max Pool Size=100;Min Pool Size=10;Load Balance Timeout=30;Failover Partner=test-db-failover.internal.company.com', production_value: '', use_test_as_production: true, is_previously_published: true, is_manual: false, used_by_processes: ['SAP_ERP_Order_Processing_And_Fulfillment_Workflow_V3', '数据同步流程', 'Monthly_Financial_Report_Generation_And_Distribution_Workflow'] },
      { resource_id: 'cred-001', resource_type: 'CREDENTIAL' as ResourceType, resource_name: 'SAP_ERP_Production_System_Service_Account_Credentials_With_MFA', test_value: '********', test_username: 'svc_test_sap_erp_integration_account', test_password: '********', production_value: '********', production_username: 'svc_prod_sap_erp_admin_integration', production_password: '********', use_test_as_production: false, is_previously_published: true, is_manual: false, used_by_processes: ['SAP_ERP_Order_Processing_And_Fulfillment_Workflow_V3', '数据同步流程'] },
      { resource_id: 'cred-002', resource_type: 'CREDENTIAL' as ResourceType, resource_name: '邮件服务凭据', test_value: '********', test_username: 'mail_test', test_password: '********', production_value: '********', production_username: 'mail_user', production_password: '********', use_test_as_production: true, is_previously_published: false, is_manual: false, used_by_processes: ['通知发送流程'] },
      { resource_id: 'queue-001', resource_type: 'QUEUE' as ResourceType, resource_name: 'High_Priority_Order_Processing_Queue_For_Enterprise_Customers_Region_APAC', test_value: '', production_value: '', use_test_as_production: false, is_previously_published: true, is_manual: false, used_by_processes: ['SAP_ERP_Order_Processing_And_Fulfillment_Workflow_V3'] },
      { resource_id: 'file-001', resource_type: 'FILE' as ResourceType, resource_name: 'Enterprise_Order_Invoice_Template_With_MultiLanguage_Support_2024_v3.xlsx', test_value: '', production_value: '', use_test_as_production: false, is_previously_published: true, is_manual: false, used_by_processes: ['SAP_ERP_Order_Processing_And_Fulfillment_Workflow_V3'] },
      { resource_id: 'file-002', resource_type: 'FILE' as ResourceType, resource_name: '报表配置', test_value: '', production_value: '', use_test_as_production: false, is_previously_published: false, is_manual: true, used_by_processes: ['Monthly_Financial_Report_Generation_And_Distribution_Workflow'] },
    ];

    const resources = release.resources?.length ? release.resources : mockResources;

    return {
      PARAMETER: resources.filter((r) => r.resource_type === 'PARAMETER'),
      CREDENTIAL: resources.filter((r) => r.resource_type === 'CREDENTIAL'),
      QUEUE: resources.filter((r) => r.resource_type === 'QUEUE'),
      FILE: resources.filter((r) => r.resource_type === 'FILE'),
    };
  }, [release]);

  if (!release) return null;

  const handleProcessClick = (processId: string) => {
    navigate(`/dev-center/automation-process?processId=${processId}`);
  };

  const handleResourceClick = (resourceType: ResourceType, resourceId: string) => {
    if (resourceType === 'PARAMETER') navigate(`/dev-center/parameter?parameterId=${resourceId}`);
    else if (resourceType === 'CREDENTIAL') navigate(`/dev-center/credential?credentialId=${resourceId}`);
    else if (resourceType === 'QUEUE') navigate(`/scheduling-center/queue-management?queueId=${resourceId}`);
    else if (resourceType === 'FILE') navigate(`/dev-center/file-management?fileId=${resourceId}`);
  };

  const releaseTypeConfig: Record<ReleaseType, { color: 'blue' | 'cyan' | 'orange' | 'purple' | 'grey' | 'green'; i18nKey: string }> = {
    FIRST_RELEASE: { color: 'blue', i18nKey: 'release.releaseTypes.FIRST_RELEASE' },
    REQUIREMENT_CHANGE: { color: 'cyan', i18nKey: 'release.releaseTypes.REQUIREMENT_CHANGE' },
    BUG_FIX: { color: 'orange', i18nKey: 'release.releaseTypes.BUG_FIX' },
    CONFIG_UPDATE: { color: 'purple', i18nKey: 'release.releaseTypes.CONFIG_UPDATE' },
    VERSION_ROLLBACK: { color: 'grey', i18nKey: 'release.releaseTypes.VERSION_ROLLBACK' },
    OPTIMIZATION: { color: 'green', i18nKey: 'release.releaseTypes.OPTIMIZATION' },
  };

  const statusConfig: Record<ReleaseStatus, { color: 'green' | 'red' | 'blue'; i18nKey: string }> = {
    SUCCESS: { color: 'green', i18nKey: 'release.publishStatus.SUCCESS' },
    FAILED: { color: 'red', i18nKey: 'release.publishStatus.FAILED' },
    PUBLISHING: { color: 'blue', i18nKey: 'release.publishStatus.PUBLISHING' },
  };

  const resourceTypeConfig: Record<ResourceType, { i18nKey: string }> = {
    PARAMETER: { i18nKey: 'release.resourceTypes.parameter' },
    CREDENTIAL: { i18nKey: 'release.resourceTypes.credential' },
    QUEUE: { i18nKey: 'release.resourceTypes.queue' },
    FILE: { i18nKey: 'release.resourceTypes.file' },
  };

  const formatTime = (time: string) => {
    if (!time) return '-';
    return new Date(time).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const typeConfig = releaseTypeConfig[release.release_type];
  const statusCfg = statusConfig[release.publish_status];

  const descData = [
    { key: t('release.detail.releaseId'), value: release.release_id },
    { key: t('release.detail.releaseType'), value: typeConfig ? <Tag color={typeConfig.color}>{t(typeConfig.i18nKey)}</Tag> : '-' },
    { key: t('release.detail.status'), value: statusCfg ? <Tag color={statusCfg.color}>{t(statusCfg.i18nKey)}</Tag> : '-' },
    { key: t('release.detail.publisher'), value: release.publisher_name ? <UserNameWithCard name={release.publisher_name} userId={release.publisher_id} department={(release as any).publisher_department} role={(release as any).publisher_role} email={(release as any).publisher_email} /> : '-' },
    { key: t('release.detail.publishTime'), value: formatTime(release.publish_time) },
    { key: t('common.description'), value: <ExpandableText text={release.description} maxLines={3} /> },
  ];

  const renderBasicInfoTab = () => (
    <div className="release-detail-drawer-tab-content">
      <Descriptions data={descData} align="left" />
      {release.publish_status === 'FAILED' && release.error_message && (
        <div className="release-detail-drawer-section release-detail-drawer-error">
          <Title heading={6} className="release-detail-drawer-section-title">{t('release.detail.errorDetails')}</Title>
          <div className="release-detail-drawer-error-content">
            <Text type="danger">{release.error_message}</Text>
          </div>
        </div>
      )}
    </div>
  );

  const renderProcessesTab = () => (
    <div className="release-detail-drawer-tab-content">
      <Title heading={6} className="release-detail-drawer-section-title">
        {t('release.detail.processes')} ({release.contents?.length || 0})
      </Title>
      <div className="release-detail-drawer-process-list">
        {release.contents?.map((content) => (
          <div key={content.process_id} className="release-detail-drawer-process-card">
            <div className="release-detail-drawer-process-card-header">
              <span onClick={() => handleProcessClick(content.process_id)} className="release-detail-drawer-process-name">
                <Text strong>{content.process_name}</Text>
                <IconExternalOpenStroked className="release-detail-drawer-link-icon" />
              </span>
              <Tag size="small" color="blue">{content.version_number}</Tag>
            </div>
            {content.process_description && <Text type="tertiary" size="small">{content.process_description}</Text>}
          </div>
        ))}
      </div>

      {Object.entries(groupedResources).map(([type, resources]) => {
        if (resources.length === 0) return null;
        const typeConf = resourceTypeConfig[type as ResourceType];
        return (
          <div key={type} className="release-detail-drawer-section">
            <Title heading={6} className="release-detail-drawer-section-title">{t(typeConf.i18nKey)} ({resources.length})</Title>
            <div className="release-detail-drawer-resource-list">
              {resources.map((resource) => (
                <div key={resource.resource_id} className="release-detail-drawer-resource-card">
                  <div className="release-detail-drawer-resource-card-header">
                    <span onClick={() => handleResourceClick(type as ResourceType, resource.resource_id)} className="release-detail-drawer-resource-name">
                      <Text strong>{resource.resource_name}</Text>
                      <IconExternalOpenStroked className="release-detail-drawer-link-icon" />
                    </span>
                    {resource.is_manual && <Tag size="small" color="grey">{t('release.create.manuallyAdded')}</Tag>}
                  </div>
                  <div className="release-detail-drawer-resource-card-body">
                    <Text type="tertiary" size="small">{t('release.create.usedBy')}: {resource.used_by_processes?.join(', ') || '-'}</Text>
                    <Text type="tertiary" size="small">{t('release.detail.previouslyPublished')}: {resource.is_previously_published ? t('common.yes') : t('common.no')}</Text>
                    {type === 'CREDENTIAL' && (
                      <>
                        <Text type="tertiary" size="small">{t('release.create.testValue')}: {(resource as any).test_username ? `${(resource as any).test_username}:******` : '-'}</Text>
                        <Text type="tertiary" size="small">{t('release.create.productionValue')}: {resource.production_username ? `${resource.production_username}:******` : '-'}</Text>
                      </>
                    )}
                    {type !== 'QUEUE' && type !== 'FILE' && type !== 'CREDENTIAL' && (
                      <>
                        <Text type="tertiary" size="small">{t('release.create.testValue')}: {resource.test_value || '-'}</Text>
                        <Text type="tertiary" size="small">{t('release.create.productionValue')}: {resource.use_test_as_production ? `${resource.test_value} (${t('release.create.useTestAsProduction')})` : resource.production_value || '-'}</Text>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {Object.values(groupedResources).every((arr) => arr.length === 0) && (
        <div className="release-detail-drawer-no-resources">
          <Text type="tertiary">{t('release.create.noDependencies')}</Text>
        </div>
      )}
    </div>
  );

  return (
    <DetailDrawerWrapper
      visible={visible}
      onClose={onClose}
      title={t('release.detail.title')}
      dataList={releaseList}
      currentId={release.release_id}
      getId={(item) => item.release_id}
      onNavigate={(item) => onNavigate?.(item)}
      extraActions={<></>}
      defaultWidth={900}
      minWidth={576}
      storageKey="releaseDetailDrawerWidth"
      className="release-detail-drawer"
    >
      <div className="release-detail-drawer-content">
        <Tabs type="line">
          <TabPane tab={t('release.detail.basicInfo')} itemKey="basicInfo">
            {renderBasicInfoTab()}
          </TabPane>
          <TabPane tab={t('release.detail.publishedProcessesAndResources')} itemKey="processes">
            {renderProcessesTab()}
          </TabPane>
        </Tabs>
      </div>
    </DetailDrawerWrapper>
  );
};

export default ReleaseDetailDrawer;
