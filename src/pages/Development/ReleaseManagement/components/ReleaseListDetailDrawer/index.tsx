/**
 * 流程发布列表详情抽屉（独立于发布审批，3 个 Tab：基本信息 / 审批流程 / 发布内容）
 *
 * 仅作查看用途，不包含任何审批操作。
 */
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Typography, Tag, Tabs, TabPane, Timeline, Space, Banner, Descriptions,
} from '@douyinfe/semi-ui';
import { ExternalLink, Lock } from 'lucide-react';
import type { LYReleaseResponse, ReleaseType, ResourceType } from '@/api';
import DetailDrawerWrapper from '@/components/DetailDrawerWrapper';
import ExpandableText from '@/components/ExpandableText';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import StatusDot, { type StatusDotColor } from '@/components/StatusDot';
import { getReleaseStatusDisplay, getProcessRouteForRelease } from '../../shared/releaseStatus';

import './index.less';

const { Title, Text } = Typography;

interface ReleaseListDetailDrawerProps {
  visible: boolean;
  release: LYReleaseResponse | null;
  releaseList?: LYReleaseResponse[];
  onClose: () => void;
  onNavigate?: (release: LYReleaseResponse) => void;
  extraActions?: React.ReactNode;
}

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

const ReleaseListDetailDrawer: React.FC<ReleaseListDetailDrawerProps> = ({
  visible, release, releaseList = [], onClose, onNavigate, extraActions,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const groupedResources = useMemo(() => {
    if (!release) return { PARAMETER: [], CREDENTIAL: [], QUEUE: [], FILE: [] };
    const resources = release.resources ?? [];
    return {
      PARAMETER: resources.filter((r) => r.resource_type === 'PARAMETER'),
      CREDENTIAL: resources.filter((r) => r.resource_type === 'CREDENTIAL'),
      QUEUE: resources.filter((r) => r.resource_type === 'QUEUE'),
      FILE: resources.filter((r) => r.resource_type === 'FILE'),
    };
  }, [release]);

  if (!release) return null;

  const status = getReleaseStatusDisplay(release);
  const typeCfg = releaseTypeConfig[release.release_type];
  const contents = release.contents ?? [];

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

  // ============ Tab1：基本信息 ============
  const renderBasicTab = () => (
    <div className="release-list-detail-drawer-tab-content">
      {release.publish_status === 'REJECTED' && (
        <Banner type="danger" fullMode={false} closeIcon={null}
          description={`拒绝原因：${release.reject_reason || '审批被拒绝，未填写拒绝原因。'}`}
          style={{ marginBottom: 16 }} />
      )}
      {release.publish_status === 'FAILED' && release.failure_code === 'PROCESS_ARCHIVED_BEFORE_PUBLISH' && (
        <Banner type="warning" fullMode={false} closeIcon={null}
          description="审批已通过，但发布前流程已被归档，发布申请已失效。请重新创建发布单。"
          style={{ marginBottom: 16 }} />
      )}
      {release.publish_status === 'FAILED' && release.failure_code !== 'PROCESS_ARCHIVED_BEFORE_PUBLISH' && (
        <Banner type="danger" fullMode={false} closeIcon={null}
          description={`失败原因：${release.failure_reason || release.error_message || '发布执行异常。'}`}
          style={{ marginBottom: 16 }} />
      )}

      <Descriptions
        className="release-list-detail-drawer-desc"
        align="left"
        data={[
          { key: '发布编号', value: <Text>{release.release_id}</Text> },
          { key: '发布状态', value: <StatusDot color={status.color as StatusDotColor} label={status.text} /> },
          ...(typeCfg ? [{ key: '发布类型', value: <Tag color={typeCfg.color} type="light">{t(typeCfg.i18nKey)}</Tag> }] : []),
          {
            key: '发布人',
            value: release.publisher_name ? (
              <UserNameWithCard
                name={release.publisher_name}
                userId={release.publisher_id}
                department={release.publisher_department || undefined}
                role={release.publisher_role || undefined}
                email={release.publisher_email || undefined}
              />
            ) : <Text>-</Text>,
          },
          { key: '所属部门', value: <Text>{release.publisher_department || '-'}</Text> },
          { key: '提交时间', value: <Text>{formatTime(release.publish_time)}</Text> },
          { key: '流程数量', value: <Text>{contents.length}</Text> },
          { key: '资源数量', value: <Text>{release.resources?.length ?? 0}</Text> },
        ]}
      />

      {release.description && (
        <div className="release-list-detail-drawer-section">
          <Title heading={6} className="release-list-detail-drawer-section-title">描述</Title>
          <ExpandableText text={release.description} maxLines={6} />
        </div>
      )}
    </div>
  );

  // ============ Tab2：审批流程 ============
  const renderApprovalTab = () => {
    if (release.audit_status === null || release.audit_status === undefined) {
      return (
        <div className="release-list-detail-drawer-tab-content">
          <Banner type="info" fullMode={false} closeIcon={null}
            description="本次发布无需审批，已由系统直接执行。" />
        </div>
      );
    }
    const records = release.approval_records ?? [];
    return (
      <div className="release-list-detail-drawer-tab-content">
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

  // ============ Tab3：发布内容 ============
  const renderContentTab = () => {
    const archivedNotice = release.publish_status === 'FAILED' && release.failure_code === 'PROCESS_ARCHIVED_BEFORE_PUBLISH';
    return (
      <div className="release-list-detail-drawer-tab-content">
        <div className="release-list-detail-drawer-section" style={{ marginTop: 0 }}>
          <Text strong size="small" type="tertiary" className="release-list-detail-drawer-section-title">流程 ({contents.length})</Text>
          <div className="release-list-detail-drawer-process-list">
            {contents.map((content) => {
              const routeInfo = getProcessRouteForRelease(release, content.process_id);
              const clickable = !!routeInfo.href;
              return (
                <div key={content.process_id} className="release-list-detail-drawer-process-card">
                  <div className="release-list-detail-drawer-process-card-header">
                    <span
                      onClick={() => clickable && handleProcessClick(content.process_id)}
                      className="release-list-detail-drawer-process-name"
                      style={!clickable ? { cursor: 'not-allowed', opacity: 0.6 } : undefined}
                    >
                      <Text ellipsis={{ showTooltip: true }}>{content.process_name}</Text>
                      {clickable
                        ? <ExternalLink size={16} strokeWidth={2} className="release-list-detail-drawer-link-icon" />
                        : <Lock size={14} strokeWidth={2} className="release-list-detail-drawer-link-icon" />}
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
        </div>

        {Object.entries(groupedResources).map(([type, resources]) => {
          if (resources.length === 0) return null;
          const typeConf = resourceTypeConfig[type as ResourceType];
          return (
            <div key={type} className="release-list-detail-drawer-section">
              <Text strong size="small" type="tertiary" className="release-list-detail-drawer-section-title">{t(typeConf.i18nKey)} ({resources.length})</Text>
              <div className="release-list-detail-drawer-resource-list">
                {resources.map((resource) => (
                  <div key={resource.resource_id} className="release-list-detail-drawer-resource-card">
                    <div className="release-list-detail-drawer-resource-card-header">
                      <span onClick={() => handleResourceClick(type as ResourceType, resource.resource_id)} className="release-list-detail-drawer-resource-name">
                        <Text ellipsis={{ showTooltip: true }}>{resource.resource_name}</Text>
                        <ExternalLink size={16} strokeWidth={2} className="release-list-detail-drawer-link-icon" />
                      </span>
                      {resource.is_manual && <Tag size="small" color="grey" className="release-list-detail-drawer-resource-tag">{t('release.create.manuallyAdded')}</Tag>}
                    </div>
                    <div className="release-list-detail-drawer-resource-card-body">
                      <Text type="tertiary" ellipsis={{ showTooltip: true }}>{t('release.create.usedBy')}: {resource.used_by_processes?.join(', ') || '-'}</Text>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <DetailDrawerWrapper
      visible={visible}
      onClose={onClose}
      title={`[${release.release_id}] 发布单详情`}
      dataList={releaseList}
      currentId={release.release_id}
      getId={(item) => item.release_id}
      onNavigate={(item) => onNavigate?.(item)}
      extraActions={extraActions ?? <></>}
      defaultWidth={900}
      minWidth={720}
      storageKey="releaseListDetailDrawerWidth"
      className="release-list-detail-drawer"
    >
      <Tabs type="line" className="release-list-detail-drawer-tabs">
        <TabPane tab="基本信息" itemKey="basic">
          {renderBasicTab()}
        </TabPane>
        <TabPane tab="审批流程" itemKey="approval">
          {renderApprovalTab()}
        </TabPane>
        <TabPane tab="发布内容" itemKey="content">
          {renderContentTab()}
        </TabPane>
      </Tabs>
    </DetailDrawerWrapper>
  );
};

export default ReleaseListDetailDrawer;
