import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
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
  Row,
  Col,
} from '@douyinfe/semi-ui';
import {
  IconClose,
  IconChevronLeft,
  IconChevronRight,
  IconMaximize,
  IconMinimize,
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

  // 全屏状态
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // 抽屉宽度 - 默认 900px，最小 576px
  const [drawerWidth, setDrawerWidth] = useState(() => {
    const saved = localStorage.getItem('releaseDetailDrawerWidth');
    return saved ? Math.max(Number(saved), 576) : 900;
  });

  // 拖动相关
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(drawerWidth);

  // 拖动调整宽度
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isResizing.current = true;
      startX.current = e.clientX;
      startWidth.current = drawerWidth;
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';

      const handleMouseMove = (e: MouseEvent) => {
        if (!isResizing.current) return;
        const diff = startX.current - e.clientX;
        setDrawerWidth(Math.min(Math.max(startWidth.current + diff, 576), window.innerWidth - 100));
      };

      const handleMouseUp = () => {
        isResizing.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [drawerWidth],
  );

  // 保存宽度到 localStorage
  useEffect(() => {
    localStorage.setItem('releaseDetailDrawerWidth', String(drawerWidth));
  }, [drawerWidth]);

  // 切换全屏
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  // 计算上一个/下一个索引
  const currentIndex = useMemo(() => {
    if (!release || releaseList.length === 0) return -1;
    return releaseList.findIndex((r) => r.release_id === release.release_id);
  }, [release, releaseList]);

  // 按类型分组资源 - 使用mock数据填充
  const groupedResources = useMemo(() => {
    if (!release) return { PARAMETER: [], CREDENTIAL: [], QUEUE: [] };
    
    // Mock 依赖资源数据
    const mockResources = [
      {
        resource_id: 'param-001',
        resource_type: 'PARAMETER' as ResourceType,
        resource_name: '系统超时时间',
        test_value: '30000',
        production_value: '60000',
        use_test_as_production: false,
        is_previously_published: true,
        is_manual: false,
        used_by_processes: ['订单处理流程', '库存检查流程'],
      },
      {
        resource_id: 'param-002',
        resource_type: 'PARAMETER' as ResourceType,
        resource_name: '最大重试次数',
        test_value: '3',
        production_value: '5',
        use_test_as_production: false,
        is_previously_published: false,
        is_manual: true,
        used_by_processes: ['订单处理流程'],
      },
      {
        resource_id: 'cred-001',
        resource_type: 'CREDENTIAL' as ResourceType,
        resource_name: 'ERP系统凭据',
        test_value: '********',
        production_value: '********',
        use_test_as_production: false,
        is_previously_published: true,
        is_manual: false,
        used_by_processes: ['订单处理流程', '数据同步流程'],
      },
      {
        resource_id: 'cred-002',
        resource_type: 'CREDENTIAL' as ResourceType,
        resource_name: '邮件服务凭据',
        test_value: '********',
        production_value: '********',
        use_test_as_production: true,
        is_previously_published: false,
        is_manual: false,
        used_by_processes: ['通知发送流程'],
      },
      {
        resource_id: 'queue-001',
        resource_type: 'QUEUE' as ResourceType,
        resource_name: '订单处理队列',
        test_value: '',
        production_value: '',
        use_test_as_production: false,
        is_previously_published: true,
        is_manual: false,
        used_by_processes: ['订单处理流程'],
      },
    ];

    const resources = release.resources?.length ? release.resources : mockResources;
    
    return {
      PARAMETER: resources.filter((r) => r.resource_type === 'PARAMETER'),
      CREDENTIAL: resources.filter((r) => r.resource_type === 'CREDENTIAL'),
      QUEUE: resources.filter((r) => r.resource_type === 'QUEUE'),
    };
  }, [release]);

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
      {/* 流程标题 */}
      <Title heading={6} className="release-detail-drawer-section-title">
        {t('release.detail.processes')} ({release.contents?.length || 0})
      </Title>

      {/* 流程列表 */}
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
      className={`card-sidesheet resizable-sidesheet release-detail-drawer ${isFullscreen ? 'fullscreen-sidesheet' : ''}`}
      title={
        <Row type="flex" justify="space-between" align="middle" className="release-detail-drawer-header">
          <Col>
            <Title heading={5} className="release-detail-drawer-header-title">
              {t('release.detail.title')}
            </Title>
          </Col>
          <Col>
            <Space spacing={8}>
              <Tooltip content={t('common.previous')}>
                <Button
                  icon={<IconChevronLeft />}
                  theme="borderless"
                  size="small"
                  disabled={!hasPrevious}
                  onClick={handlePrevious}
                  className="navigate"
                />
              </Tooltip>
              <Tooltip content={t('common.next')}>
                <Button
                  icon={<IconChevronRight />}
                  theme="borderless"
                  size="small"
                  disabled={!hasNext}
                  onClick={handleNext}
                  className="navigate"
                />
              </Tooltip>
              <Divider layout="vertical" className="release-detail-drawer-header-divider" />
              <Tooltip content={isFullscreen ? t('common.exitFullscreen') : t('common.fullscreen')}>
                <Button
                  icon={isFullscreen ? <IconMinimize /> : <IconMaximize />}
                  theme="borderless"
                  size="small"
                  onClick={toggleFullscreen}
                />
              </Tooltip>
              <Tooltip content={t('common.close')}>
                <Button
                  icon={<IconClose />}
                  theme="borderless"
                  size="small"
                  onClick={onClose}
                  className="release-detail-drawer-header-close-btn"
                />
              </Tooltip>
            </Space>
          </Col>
        </Row>
      }
      visible={visible}
      onCancel={onClose}
      placement="right"
      width={isFullscreen ? '100%' : drawerWidth}
      mask={false}
      closable={false}
      maskClosable
    >
      {/* 拖动调整宽度的把手 */}
      {!isFullscreen && (
        <div
          className="release-detail-drawer-resize-handle"
          onMouseDown={handleMouseDown}
        />
      )}

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
