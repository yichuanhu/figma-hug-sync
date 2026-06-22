/**
 * 发布单详情抽屉（与需求审批详情抽屉版式统一）
 *
 * 布局：
 *  - 左侧 Tabs：概览 / 审批流程
 *  - 右侧属性面板：状态、发布类型、所属部门、发布人、提交时间...
 *  - 审批操作内联在「审批流程」Tab 底部，不再放在抽屉头部
 */
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Typography, Tag, Tabs, TabPane, Timeline, Space, Banner, Button, TextArea, Toast,
} from '@douyinfe/semi-ui';
import type { LYReleaseResponse, ReleaseType, ResourceType } from '@/api';
import DetailDrawerWrapper from '@/components/DetailDrawerWrapper';
import ExpandableText from '@/components/ExpandableText';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import StatusDot, { type StatusDotColor } from '@/components/StatusDot';
import { getReleaseStatusDisplay, getProcessRouteForRelease } from '../../shared/releaseStatus';

import './index.less';
import { ExternalLink, Lock } from 'lucide-react';

const { Title, Text } = Typography;

export interface ReleaseApprovalContext {
  /** 当前用户是否可以审批本发布单 */
  canAct: boolean;
  /** 通过中（按钮 loading 状态） */
  acting?: boolean;
  onApprove: () => void;
  onReject: (reason: string) => void;
}

interface ReleaseDetailDrawerProps {
  visible: boolean;
  release: LYReleaseResponse | null;
  releaseList?: LYReleaseResponse[];
  onClose: () => void;
  onNavigate?: (release: LYReleaseResponse) => void;
  /** 头部额外操作（编辑/分享等），不应放审批按钮 */
  extraActions?: React.ReactNode;
  /** 审批上下文：若传入则在「审批流程」Tab 底部渲染通过/拒绝输入区 */
  approvalContext?: ReleaseApprovalContext;
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

const ReleasePropertyPanel: React.FC<{ release: LYReleaseResponse }> = ({ release }) => {
  const { t } = useTranslation();
  const status = getReleaseStatusDisplay(release);
  const typeCfg = releaseTypeConfig[release.release_type];

  return (
    <div className="requirement-detail-property-panel">
      <div className="requirement-detail-property-group">
        <div className="requirement-detail-property-item">
          <Text type="tertiary" size="small">状态</Text>
          <div>
            <StatusDot color={status.color as StatusDotColor} label={status.text} />
          </div>
        </div>
        {typeCfg && (
          <div className="requirement-detail-property-item">
            <Text type="tertiary" size="small">发布类型</Text>
            <div>
              <Tag color={typeCfg.color} type="light">{t(typeCfg.i18nKey)}</Tag>
            </div>
          </div>
        )}
        {release.publish_status === 'PENDING_APPROVAL' && release.total_approval_levels && (
          <div className="requirement-detail-property-item">
            <Text type="tertiary" size="small">审批进度</Text>
            <Text size="small">
              第 {release.current_approval_level} / {release.total_approval_levels} 级
              {release.current_approver_label ? `（${release.current_approver_label}）` : ''}
            </Text>
          </div>
        )}
      </div>

      <div className="requirement-detail-property-divider" />

      <div className="requirement-detail-property-group">
        <div className="requirement-detail-property-item">
          <Text type="tertiary" size="small">所属部门</Text>
          <Text>{release.publisher_department || '-'}</Text>
        </div>
        <div className="requirement-detail-property-item">
          <Text type="tertiary" size="small">发布人</Text>
          {release.publisher_name ? (
            <UserNameWithCard
              name={release.publisher_name}
              userId={release.publisher_id}
              department={release.publisher_department || undefined}
              role={release.publisher_role || undefined}
              email={release.publisher_email || undefined}
            />
          ) : <Text>-</Text>}
        </div>
      </div>

      <div className="requirement-detail-property-divider" />

      <div className="requirement-detail-property-group">
        <div className="requirement-detail-property-item">
          <Text type="tertiary" size="small">发布编号</Text>
          <Text size="small">{release.release_id}</Text>
        </div>
        <div className="requirement-detail-property-item">
          <Text type="tertiary" size="small">提交时间</Text>
          <Text size="small">{formatTime(release.publish_time)}</Text>
        </div>
      </div>

      <div className="requirement-detail-property-divider" />

      <div className="requirement-detail-property-item">
        <Text type="tertiary" size="small">流程数</Text>
        <Text>{release.contents?.length ?? 0}</Text>
      </div>
    </div>
  );
};

const ReleaseDetailDrawer: React.FC<ReleaseDetailDrawerProps> = ({
  visible, release, releaseList = [], onClose, onNavigate, extraActions, approvalContext,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [approveComment, setApproveComment] = useState('');
  const [rejectReason, setRejectReason] = useState('');

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

  const renderOverviewTab = () => {
    const archivedNotice = release.publish_status === 'FAILED' && release.failure_code === 'PROCESS_ARCHIVED_BEFORE_PUBLISH';
    return (
      <div className="release-detail-drawer-tab-content">
        {release.publish_status === 'REJECTED' && (
          <Banner
            type="danger" fullMode={false} closeIcon={null}
            description={`拒绝原因：${release.reject_reason || '审批被拒绝，未填写拒绝原因。'}`}
            style={{ marginBottom: 16 }}
          />
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

        {release.description && (
          <div className="release-detail-drawer-section" style={{ marginTop: 0 }}>
            <Title heading={6} className="release-detail-drawer-section-title">描述</Title>
            <ExpandableText text={release.description} maxLines={3} />
          </div>
        )}

        <div className="release-detail-drawer-section">
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
      </div>
    );
  };

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

        {approvalContext?.canAct && (
          <div className="release-detail-drawer-approve-actions">
            <Text strong size="small" style={{ display: 'block', marginBottom: 8 }}>审批</Text>
            <TextArea
              placeholder="请输入审批意见（拒绝时必填）"
              value={approveComment || rejectReason}
              onChange={(v) => { setApproveComment(v); setRejectReason(v); }}
              rows={3}
              maxLength={500}
              showClear
              style={{ marginBottom: 12 }}
            />
            <div className="release-detail-drawer-approve-buttons">
              <Button
                theme="solid" type="primary" style={{ flex: 1, height: 32 }}
                loading={approvalContext.acting}
                onClick={() => { approvalContext.onApprove(); setApproveComment(''); setRejectReason(''); }}
              >
                通过
              </Button>
              <Button
                theme="solid" type="danger" style={{ flex: 1, height: 32 }}
                loading={approvalContext.acting}
                onClick={() => {
                  if (!rejectReason.trim()) {
                    Toast.warning('请填写拒绝原因');
                    return;
                  }
                  approvalContext.onReject(rejectReason.trim());
                  setApproveComment('');
                  setRejectReason('');
                }}
              >
                拒绝
              </Button>
            </div>
          </div>
        )}
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
      defaultWidth={1000}
      minWidth={800}
      storageKey="releaseDetailDrawerWidth"
      className="release-detail-drawer requirement-detail-drawer"
    >
      <div className="requirement-detail-layout">
        <div className="requirement-detail-left">
          <Tabs type="line" className="requirement-detail-tabs">
            <TabPane tab="概览" itemKey="overview">
              {renderOverviewTab()}
            </TabPane>
            <TabPane tab="审批流程" itemKey="approval">
              {renderApprovalTab()}
            </TabPane>
          </Tabs>
        </div>
        <div className="requirement-detail-right">
          <ReleasePropertyPanel release={release} />
        </div>
      </div>
    </DetailDrawerWrapper>
  );
};

export default ReleaseDetailDrawer;
