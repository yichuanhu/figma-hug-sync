import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  SideSheet,
  Typography,
  Descriptions,
  Tag,
  Button,
  Divider,
  Space,
  Tooltip,
  Tabs,
  TabPane,
} from '@douyinfe/semi-ui';
import {
  IconClose,
  IconChevronLeft,
  IconChevronRight,
} from '@douyinfe/semi-icons';
import type { LYReleaseResponse, ReleaseType, ReleaseStatus, ResourceType } from '@/api';

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

  // 计算上一个/下一个索引
  const currentIndex = useMemo(() => {
    if (!release || releaseList.length === 0) return -1;
    return releaseList.findIndex((r) => r.release_id === release.release_id);
  }, [release, releaseList]);

  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < releaseList.length - 1;

  const handlePrevious = () => {
    if (hasPrevious && onNavigate) {
      onNavigate(releaseList[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext && onNavigate) {
      onNavigate(releaseList[currentIndex + 1]);
    }
  };

  const handleProcessClick = (processId: string) => {
    navigate(`/dev-center/automation-process?processId=${processId}`);
  };

  if (!release) return null;

  // 发布类型配置
  const releaseTypeConfig: Record<ReleaseType, { color: 'blue' | 'cyan' | 'orange' | 'purple' | 'grey' | 'green'; i18nKey: string }> = {
    FIRST_RELEASE: { color: 'blue', i18nKey: 'release.releaseTypes.FIRST_RELEASE' },
    REQUIREMENT_CHANGE: { color: 'cyan', i18nKey: 'release.releaseTypes.REQUIREMENT_CHANGE' },
    BUG_FIX: { color: 'orange', i18nKey: 'release.releaseTypes.BUG_FIX' },
    CONFIG_UPDATE: { color: 'purple', i18nKey: 'release.releaseTypes.CONFIG_UPDATE' },
    VERSION_ROLLBACK: { color: 'grey', i18nKey: 'release.releaseTypes.VERSION_ROLLBACK' },
    OPTIMIZATION: { color: 'green', i18nKey: 'release.releaseTypes.OPTIMIZATION' },
  };

  // 状态配置
  const statusConfig: Record<ReleaseStatus, { color: 'green' | 'red' | 'blue'; i18nKey: string }> = {
    SUCCESS: { color: 'green', i18nKey: 'release.publishStatus.SUCCESS' },
    FAILED: { color: 'red', i18nKey: 'release.publishStatus.FAILED' },
    PUBLISHING: { color: 'blue', i18nKey: 'release.publishStatus.PUBLISHING' },
  };

  // 资源类型配置
  const resourceTypeConfig: Record<ResourceType, { i18nKey: string }> = {
    PARAMETER: { i18nKey: 'release.resourceTypes.parameter' },
    CREDENTIAL: { i18nKey: 'release.resourceTypes.credential' },
    QUEUE: { i18nKey: 'release.resourceTypes.queue' },
  };

  const formatTime = (time: string) => {
    if (!time) return '-';
    const date = new Date(time);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const typeConfig = releaseTypeConfig[release.release_type];
  const statusCfg = statusConfig[release.publish_status];

  const descData = [
    {
      key: t('release.detail.releaseId'),
      value: release.release_id,
    },
    {
      key: t('release.detail.releaseType'),
      value: typeConfig ? (
        <Tag color={typeConfig.color}>{t(typeConfig.i18nKey)}</Tag>
      ) : (
        '-'
      ),
    },
    {
      key: t('release.detail.status'),
      value: statusCfg ? (
        <Tag color={statusCfg.color}>{t(statusCfg.i18nKey)}</Tag>
      ) : (
        '-'
      ),
    },
    {
      key: t('release.detail.publisher'),
      value: release.publisher_name || '-',
    },
    {
      key: t('release.detail.publishTime'),
      value: formatTime(release.publish_time),
    },
    {
      key: t('common.description'),
      value: release.description || '-',
    },
  ];

  // 按类型分组资源
  const groupedResources = {
    PARAMETER: release.resources?.filter((r) => r.resource_type === 'PARAMETER') || [],
    CREDENTIAL: release.resources?.filter((r) => r.resource_type === 'CREDENTIAL') || [],
    QUEUE: release.resources?.filter((r) => r.resource_type === 'QUEUE') || [],
  };

  // 基本信息 Tab 内容
  const renderBasicInfoTab = () => (
    <div className="release-detail-drawer-tab-content">
      <Descriptions data={descData} align="left" />

      {/* 失败信息 */}
      {release.publish_status === 'FAILED' && release.error_message && (
        <div className="release-detail-drawer-section release-detail-drawer-error">
          <Title heading={6} className="release-detail-drawer-section-title">
            {t('release.detail.errorDetails')}
          </Title>
          <div className="release-detail-drawer-error-content">
            <Text type="danger">{release.error_message}</Text>
          </div>
        </div>
      )}
    </div>
  );

  // 已发布流程 Tab 内容
  const renderProcessesTab = () => (
    <div className="release-detail-drawer-tab-content">
      {/* 流程列表 */}
      <div className="release-detail-drawer-section">
        <Title heading={6} className="release-detail-drawer-section-title">
          {t('release.detail.publishedProcesses')} ({release.contents?.length || 0})
        </Title>
        <div className="release-detail-drawer-process-list">
          {release.contents?.map((content) => (
            <div
              key={content.process_id}
              className="release-detail-drawer-process-card"
            >
              <div className="release-detail-drawer-process-card-header">
                <Text 
                  strong 
                  link
                  onClick={() => handleProcessClick(content.process_id)}
                  style={{ cursor: 'pointer' }}
                >
                  {content.process_name}
                </Text>
                <Tag size="small" color="blue">
                  {content.version_number}
                </Tag>
              </div>
              {content.process_description && (
                <Text type="tertiary" size="small">
                  {content.process_description}
                </Text>
              )}
            </div>
          ))}
        </div>
      </div>

      <Divider margin="24px 0" />

      {/* 资源列表 */}
      {Object.entries(groupedResources).map(([type, resources]) => {
        if (resources.length === 0) return null;
        const typeConf = resourceTypeConfig[type as ResourceType];

        return (
          <div key={type} className="release-detail-drawer-section">
            <Title heading={6} className="release-detail-drawer-section-title">
              {t(typeConf.i18nKey)} ({resources.length})
            </Title>
            <div className="release-detail-drawer-resource-list">
              {resources.map((resource) => (
                <div
                  key={resource.resource_id}
                  className="release-detail-drawer-resource-card"
                >
                  <div className="release-detail-drawer-resource-card-header">
                    <Text strong>{resource.resource_name}</Text>
                    <Space spacing={4}>
                      {resource.is_previously_published && (
                        <Tag size="small" color="green">
                          {t('release.create.alreadyPublished')}
                        </Tag>
                      )}
                      {resource.is_manual && (
                        <Tag size="small" color="grey">
                          {t('release.create.manuallyAdded')}
                        </Tag>
                      )}
                    </Space>
                  </div>
                  <div className="release-detail-drawer-resource-card-body">
                    <Text type="tertiary" size="small">
                      {t('release.create.usedBy')}: {resource.used_by_processes?.join(', ') || '-'}
                    </Text>
                    {type !== 'QUEUE' && (
                      <>
                        <Text type="tertiary" size="small">
                          {t('release.create.testValue')}: {resource.test_value || '-'}
                        </Text>
                        <Text type="tertiary" size="small">
                          {t('release.create.productionValue')}:{' '}
                          {resource.use_test_as_production
                            ? `${resource.test_value} (${t('release.create.useTestAsProduction')})`
                            : resource.production_value || '-'}
                        </Text>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* 如果没有任何资源 */}
      {Object.values(groupedResources).every((arr) => arr.length === 0) && (
        <div className="release-detail-drawer-no-resources">
          <Text type="tertiary">{t('release.create.noDependencies')}</Text>
        </div>
      )}
    </div>
  );

  return (
    <SideSheet
      className="card-sidesheet release-detail-drawer"
      title={
        <div className="release-detail-drawer-header">
          <Space spacing={4}>
            <Tooltip content={t('common.previous')}>
              <Button
                icon={<IconChevronLeft />}
                theme="borderless"
                type="tertiary"
                disabled={!hasPrevious}
                onClick={handlePrevious}
                className="navigate"
              />
            </Tooltip>
            <Tooltip content={t('common.next')}>
              <Button
                icon={<IconChevronRight />}
                theme="borderless"
                type="tertiary"
                disabled={!hasNext}
                onClick={handleNext}
                className="navigate"
              />
            </Tooltip>
            <Divider layout="vertical" className="release-detail-drawer-header-divider" />
          </Space>
          <Title heading={5} className="release-detail-drawer-header-title">
            {t('release.detail.title')}
          </Title>
          <Space spacing={4}>
            <Divider layout="vertical" className="release-detail-drawer-header-divider" />
            <Button
              icon={<IconClose />}
              theme="borderless"
              type="tertiary"
              onClick={onClose}
              className="release-detail-drawer-header-close-btn"
            />
          </Space>
        </div>
      }
      visible={visible}
      onCancel={onClose}
      placement="right"
      width={560}
      closable={false}
      maskClosable
    >
      <div className="release-detail-drawer-content">
        <Tabs type="line">
          <TabPane
            tab={t('release.detail.basicInfo')}
            itemKey="basicInfo"
          >
            {renderBasicInfoTab()}
          </TabPane>
          <TabPane
            tab={`${t('release.detail.publishedProcesses')} (${release.contents?.length || 0})`}
            itemKey="processes"
          >
            {renderProcessesTab()}
          </TabPane>
        </Tabs>
      </div>
    </SideSheet>
  );
};

export default ReleaseDetailDrawer;
