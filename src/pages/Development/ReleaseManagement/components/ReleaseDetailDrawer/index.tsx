/**
 * 发布单详情抽屉
 *
 * Tabs:
 *  1. 基本信息（含拒绝/失败/失效原因）
 *  2. 审批过程（有审批 Timeline 或 "无需审批"）
 *  3. 发布内容（流程 + 资源）
 */
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Typography, Descriptions, Tag, Tabs, TabPane, Timeline, Space, Banner,
} from '@douyinfe/semi-ui';
import type { LYReleaseResponse, ReleaseType, ResourceType } from '@/api';
import DetailDrawerWrapper from '@/components/DetailDrawerWrapper';
import ExpandableText from '@/components/ExpandableText';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import { getReleaseStatusDisplay, getProcessRouteForRelease } from '../../shared/releaseStatus';

import './index.less';
import { ExternalLink, Lock } from 'lucide-react';

const { Title, Text } = Typography;

interface ReleaseDetailDrawerProps {
  visible: boolean;
  release: LYReleaseResponse | null;
  releaseList?: LYReleaseResponse[];
  onClose: () => void;
  onNavigate?: (release: LYReleaseResponse) => void;
  /** 抽屉头部额外操作（审批列表中注入"通过 / 拒绝"） */
  extraActions?: React.ReactNode;
}

const ReleaseDetailDrawer: React.FC<ReleaseDetailDrawerProps> = ({
  visible, release, releaseList = [], onClose, onNavigate, extraActions,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const groupedResources = useMemo(() => {
    if (!release) return { PARAMETER: [], CREDENTIAL: [], QUEUE: [], FILE: [] };
    const mockResources = [
      { resource_id: 'param-001', resource_type: 'PARAMETER' as ResourceType, resource_name: '全局系统超时配置', test_value: '{"timeout_ms":30000}', production_value: '{"timeout_ms":60000}', use_test_as_production: false, is_previously_published: true, is_manual: false, used_by_processes: ['SAP_ERP 订单处理流程'] },
      { resource_id: 'cred-001', resource_type: 'CREDENTIAL' as ResourceType, resource_name: 'SAP ERP 生产环境服务账号凭据', test_username: 'svc_test_sap', test_password: '********', production_username: 'svc_prod_sap', production_password: '********', use_test_as_production: false, is_previously_published: true, is_manual: false, used_by_processes: ['SAP_ERP 订单处理流程'] },
      { resource_id: 'queue-001', resource_type: 'QUEUE' as ResourceType, resource_name: '高优先级订单处理队列', test_value: '', production_value: '', use_test_as_production: false, is_previously_published: true, is_manual: false, used_by_processes: ['SAP_ERP 订单处理流程'] },
    ];
    const resources = (release.resources?.length ? release.resources : mockResources) as typeof mockResources;
    return {
      PARAMETER: resources.filter((r) => r.resource_type === 'PARAMETER'),
      CREDENTIAL: resources.filter((r) => r.resource_type === 'CREDENTIAL'),
      QUEUE: resources.filter((r) => r.resource_type === 'QUEUE'),
      FILE: resources.filter((r) => r.resource_type === 'FILE'),
    };
  }, [release]);

  const mockContents = useMemo(() => {
    if (release?.contents?.length) return release.contents;
    return [
      { process_id: 'proc-001', process_name: 'SAP_ERP 订单处理流程', version_number: 'v3.2.1', process_description: '示例流程描述。' },
    ];
  }, [release]);

  if (!release) return null;

  const statusDisplay = getReleaseStatusDisplay(release);

  const handleProcessClick = (processId: string) => {
    const r = getProcessRouteForRelease(release, processId);
    if (r.href) navigate(r.href);
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

  const resourceTypeConfig: Record<ResourceType, { i18nKey: string }> = {
    PARAMETER: { i18nKey: 'release.resourceTypes.parameter' },
    CREDENTIAL: { i18nKey: 'release.resourceTypes.credential' },
    QUEUE: { i18nKey: 'release.resourceTypes.queue' },
    FILE: { i18nKey: 'release.resourceTypes.file' },
  };

  const formatTime = (time?: string) => {
    if (!time) return '-';
    return new Date(time).toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  };

  const typeConfig = releaseTypeConfig[release.release_type];

  const descData = [
    { key: '发布编号', value: release.release_id },
    { key: '发布类型', value: typeConfig ? <Tag color={typeConfig.color} type="light">{t(typeConfig.i18nKey)}</Tag> : '-' },
    { key: '状态', value: <Tag color={statusDisplay.color} type="light">{statusDisplay.text}</Tag> },
    ...(release.current_approver_label || release.total_approval_levels ? [{
      key: '当前审批节点',
      value: release.current_approver_label
        ? <Text>{release.current_approver_label}</Text>
        : <Text type="tertiary">第 {release.current_approval_level} / {release.total_approval_levels} 级</Text>,
    }] : []),
    {
      key: '发布人',
      value: release.publisher_name
        ? <UserNameWithCard name={release.publisher_name} userId={release.publisher_id}
            department={release.publisher_department || undefined}
            role={release.publisher_role || undefined}
            email={release.publisher_email || undefined} />
        : '-',
    },
    { key: '所属部门', value: release.publisher_department || '-' },
    { key: '提交时间', value: formatTime(release.publish_time) },
    { key: '描述', value: <ExpandableText text={release.description} maxLines={3} /> },
  ];

  const renderBasicInfoTab = () => (
    <div className="release-detail-drawer-tab-content">
      <Descriptions data={descData} align="left" />

      {release.publish_status === 'REJECTED' && (
        <div className="release-detail-drawer-section">
          <Title heading={6} className="release-detail-drawer-section-title">拒绝原因</Title>
          <Banner type="danger" fullMode={false} closeIcon={null}
            description={release.reject_reason || '审批被拒绝，未填写拒绝原因。'} />
        </div>
      )}

      {release.publish_status === 'FAILED' && release.failure_code === 'PROCESS_ARCHIVED_BEFORE_PUBLISH' && (
        <div className="release-detail-drawer-section">
          <Title heading={6} className="release-detail-drawer-section-title">失效原因</Title>
          <Banner type="warning" fullMode={false} closeIcon={null}
            description="审批已通过，但发布前流程已被归档，发布申请已失效。请重新创建发布单。" />
        </div>
      )}

      {release.publish_status === 'FAILED' && release.failure_code !== 'PROCESS_ARCHIVED_BEFORE_PUBLISH' && (
        <div className="release-detail-drawer-section">
          <Title heading={6} className="release-detail-drawer-section-title">失败原因</Title>
          <Banner type="danger" fullMode={false} closeIcon={null}
            description={release.failure_reason || release.error_message || '发布执行异常。'} />
        </div>
      )}
    </div>
  );

  const renderApprovalTab = () => {
    if (release.audit_status === null || release.audit_status === undefined) {
      return (
        <div className="release-detail-drawer-tab-content">
          <Banner type="info" fullMode={false} closeIcon={null}
            description="本次发布无需审批，已由系统直接执行。" />
        </div>
      );
    }
    const records = release.approval_records ?? [];
    return (
      <div className="release-detail-drawer-tab-content">
        {release.total_approval_levels && (
          <Text type="tertiary" size="small" style={{ display: 'block', marginBottom: 12 }}>
            当前第 {release.current_approval_level} / {release.total_approval_levels} 级
          </Text>
        )}
        {records.length === 0 ? (
          <Text type="tertiary">暂无审批记录</Text>
        ) : (
          <Timeline>
            {records.map((r, idx) => {
              const type = r.action === 'APPROVE' ? 'success' : r.action === 'REJECT' ? 'error' : 'default';
              const actionText = r.action === 'APPROVE' ? '通过' : r.action === 'REJECT' ? '拒绝' : '待审批';
              const tagColor: 'green' | 'red' | 'grey' = r.action === 'APPROVE' ? 'green' : r.action === 'REJECT' ? 'red' : 'grey';
              return (
                <Timeline.Item key={idx} type={type} time={r.acted_at ? formatTime(r.acted_at) : undefined}>
                  <Space>
                    <Text strong>{r.approver_name}</Text>
                    <Tag color={tagColor} type="light" size="small">{actionText}（第 {r.level} 级）</Tag>
                  </Space>
                  {r.comment && <div><Text type="tertiary" size="small">{r.comment}</Text></div>}
                </Timeline.Item>
              );
            })}
          </Timeline>
        )}
      </div>
    );
  };

  const renderContentTab = () => {
    const archivedNotice = release.publish_status === 'FAILED' && release.failure_code === 'PROCESS_ARCHIVED_BEFORE_PUBLISH';
    return (
      <div className="release-detail-drawer-tab-content">
        <Title heading={6} className="release-detail-drawer-section-title">
          流程 ({mockContents.length})
        </Title>
        <div className="release-detail-drawer-process-list">
          {mockContents.map((content) => {
            const routeInfo = getProcessRouteForRelease(release, content.process_id);
            const clickable = !!routeInfo.href;
            return (
              <div key={content.process_id} className="release-detail-drawer-process-card">
                <div className="release-detail-drawer-process-card-header">
                  <span
                    onClick={() => clickable && handleProcessClick(content.process_id)}
                    className="release-detail-drawer-process-name"
                    style={!clickable ? { cursor: 'not-allowed', opacity: 0.6 } : undefined}
                  >
                    <Text strong ellipsis={{ showTooltip: true }}>{content.process_name}</Text>
                    {clickable
                      ? <ExternalLink size={16} strokeWidth={2} className="release-detail-drawer-link-icon" />
                      : <Lock size={14} strokeWidth={2} className="release-detail-drawer-link-icon" />}
                  </span>
                  <Tag size="small" color="blue" type="light">{content.version_number}</Tag>
                </div>
                {content.process_description && (
                  <Text type="tertiary" ellipsis={{ showTooltip: false }}>{content.process_description}</Text>
                )}
                {archivedNotice && (
                  <Text type="tertiary" size="small" style={{ marginTop: 4 }}>发布申请已失效 / 流程已归档</Text>
                )}
              </div>
            );
          })}
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
                        <Text strong ellipsis={{ showTooltip: true }}>{resource.resource_name}</Text>
                        <ExternalLink size={16} strokeWidth={2} className="release-detail-drawer-link-icon" />
                      </span>
                      {resource.is_manual && <Tag size="small" color="grey" className="release-detail-drawer-resource-tag">{t('release.create.manuallyAdded')}</Tag>}
                    </div>
                    <div className="release-detail-drawer-resource-card-body">
                      <Text type="tertiary" ellipsis={{ showTooltip: true }}>{t('release.create.usedBy')}: {resource.used_by_processes?.join(', ') || '-'}</Text>
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
  };

  return (
    <DetailDrawerWrapper
      visible={visible}
      onClose={onClose}
      title="发布单详情"
      dataList={releaseList}
      currentId={release.release_id}
      getId={(item) => item.release_id}
      onNavigate={(item) => onNavigate?.(item)}
      extraActions={extraActions ?? <></>}
      defaultWidth={900}
      minWidth={576}
      storageKey="releaseDetailDrawerWidth"
      className="release-detail-drawer"
    >
      <div className="release-detail-drawer-content">
        <Tabs type="line">
          <TabPane tab="基本信息" itemKey="basicInfo">{renderBasicInfoTab()}</TabPane>
          <TabPane tab="审批过程" itemKey="approval">{renderApprovalTab()}</TabPane>
          <TabPane tab="发布内容" itemKey="content">{renderContentTab()}</TabPane>
        </Tabs>
      </div>
    </DetailDrawerWrapper>
  );
};

export default ReleaseDetailDrawer;
