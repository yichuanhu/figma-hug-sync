/**
 * 发布单详情抽屉（卡片化布局，参考需求审批详情视觉）
 */
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Typography, Tag, Tabs, TabPane, Timeline, Space, Banner, Button, TextArea, Toast, Table,
} from '@douyinfe/semi-ui';
import type { LYReleaseResponse, ReleaseType, ResourceType } from '@/api';
import DetailDrawerWrapper from '@/components/DetailDrawerWrapper';
import ExpandableText from '@/components/ExpandableText';
import EmptyState from '@/components/EmptyState';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import StatusDot, { type StatusDotColor } from '@/components/StatusDot';
import { getReleaseStatusDisplay } from '../../shared/releaseStatus';

import './index.less';

const { Title, Text } = Typography;

export interface ReleaseApprovalContext {
  canAct: boolean;
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
  extraActions?: React.ReactNode;
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

const formatTime = (time?: string) => {
  if (!time) return '-';
  return new Date(time).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
};

// ============ 右侧属性面板（堆叠样式，参考图字段顺序） ============
const ReleasePropertyPanel: React.FC<{ release: LYReleaseResponse }> = ({ release }) => {
  const status = getReleaseStatusDisplay(release);

  const items: { label: string; value: React.ReactNode }[] = [
    {
      label: '状态',
      value: <StatusDot color={status.color as StatusDotColor} label={status.text} />,
    },
    {
      label: '发布人',
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
  ];

  items.push(
    { label: '提交时间', value: <Text>{formatTime(release.publish_time)}</Text> },
    { label: '发布编号', value: <Text>{release.release_id}</Text> },
  );

  return (
    <div className="detail-property-stacked">
      {items.map((it) => (
        <div key={it.label} className="detail-property-stacked-item">
          <Text type="tertiary" size="small" className="detail-property-stacked-label">{it.label}</Text>
          <div className="detail-property-stacked-value">{it.value}</div>
        </div>
      ))}
    </div>
  );
};

const ReleaseDetailDrawer: React.FC<ReleaseDetailDrawerProps> = ({
  visible, release, releaseList = [], onClose, onNavigate, extraActions, approvalContext,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [comment, setComment] = useState('');

  const groupedResources = useMemo(() => {
    if (!release) return [] as Array<{ resource_id: string; resource_type: ResourceType; resource_name: string; is_manual?: boolean; used_by_processes?: string[] }>;
    const mockResources = [
      { resource_id: 'param-001', resource_type: 'PARAMETER' as ResourceType, resource_name: '全局系统超时配置', is_manual: false, used_by_processes: ['SAP_ERP 订单处理流程'] },
    ];
    return (release.resources?.length ? release.resources : mockResources) as typeof mockResources;
  }, [release]);

  const mockContents = useMemo(() => {
    if (release?.contents?.length) return release.contents;
    return [
      { process_id: 'proc-001', process_name: 'SAP_ERP 订单处理流程', version_id: 'v-001', version_number: 'v3.2.1', process_description: '示例流程描述。' },
    ];
  }, [release]);

  if (!release) return null;

  const status = getReleaseStatusDisplay(release);
  const typeCfg = releaseTypeConfig[release.release_type];

  // 抽屉标题：编号
  const drawerTitle = (
    <div className="detail-drawer-title">
      <Text strong style={{ fontSize: 16 }}>{release.release_id}</Text>
    </div>
  );

  // ============ Overview Tab ============
  const renderOverviewTab = () => (
    <div className="detail-cards-container">
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

      {/* 卡片1：发布申请快照 */}
      <div className="detail-snapshot-card">
        <Title heading={6} className="detail-card-title">发布申请快照</Title>
        <div className="detail-snapshot-grid">
          <Text type="tertiary" className="detail-snapshot-label">发布编号</Text>
          <Text>{release.release_id}</Text>

          {typeCfg && (
            <>
              <Text type="tertiary" className="detail-snapshot-label">发布类型</Text>
              <div><Tag color={typeCfg.color} type="light">{t(typeCfg.i18nKey)}</Tag></div>
            </>
          )}

          <Text type="tertiary" className="detail-snapshot-label">流程数量</Text>
          <Text>{mockContents.length}</Text>

          <Text type="tertiary" className="detail-snapshot-label">资源数量</Text>
          <Text>{groupedResources.length}</Text>

          {release.description && (
            <>
              <Text type="tertiary" className="detail-snapshot-label">描述</Text>
              <div><ExpandableText text={release.description} maxLines={3} /></div>
            </>
          )}
        </div>
      </div>

      {/* 卡片2：流程与版本 */}
      <div className="detail-snapshot-card">
        <Title heading={6} className="detail-card-title">流程与版本 ({mockContents.length})</Title>
        <Table
          size="small"
          pagination={false}
          dataSource={mockContents}
          rowKey="process_id"
          className="detail-card-table"
          columns={[
            { title: '流程名称', dataIndex: 'process_name', width: '40%', render: (v: string) => <Text ellipsis={{ showTooltip: true }} style={{ maxWidth: '100%' }}>{v}</Text> },
            { title: '版本', dataIndex: 'version_number', width: '20%' },
            { title: '描述', dataIndex: 'process_description', render: (v?: string) => <Text type="tertiary" ellipsis={{ showTooltip: true }} style={{ maxWidth: '100%' }}>{v || '-'}</Text> },
          ]}
        />
      </div>

      {/* 卡片3：资源 */}
      {groupedResources.length > 0 && (
        <div className="detail-snapshot-card">
          <Title heading={6} className="detail-card-title">资源 ({groupedResources.length})</Title>
          <Table
            size="small"
            pagination={false}
            dataSource={groupedResources}
            rowKey="resource_id"
            className="detail-card-table"
            columns={[
              { title: '资源名称', dataIndex: 'resource_name', width: '32%', render: (v: string) => <Text ellipsis={{ showTooltip: true }} style={{ maxWidth: '100%' }}>{v}</Text> },
              { title: '类型', dataIndex: 'resource_type', width: '22%' },
              { title: '来源流程', dataIndex: 'used_by_processes', render: (v?: string[]) => <Text type="tertiary" ellipsis={{ showTooltip: true }} style={{ maxWidth: '100%' }}>{(v && v.length) ? v.join(', ') : '-'}</Text> },
              { title: '手动添加', dataIndex: 'is_manual', width: '20%', render: (v?: boolean) => (v ? '是' : '否') },
            ]}
          />
        </div>
      )}
    </div>
  );

  // ============ Approval Tab ============
  const renderApprovalTab = () => {
    if (release.audit_status === null || release.audit_status === undefined) {
      return (
        <div className="detail-cards-container">
          <Banner type="info" fullMode={false} closeIcon={null}
            description="本次发布无需审批，已由系统直接执行。" />
        </div>
      );
    }

    const records = release.approval_records ?? [];

    // 构造审批流（基于 total_approval_levels）
    const totalLevels = release.total_approval_levels ?? records.length;
    const flowItems: Array<{ level: number; status: 'done' | 'pending'; record?: typeof records[0] }> = [];
    for (let lv = 1; lv <= totalLevels; lv += 1) {
      const rec = records.find((r) => r.level === lv);
      flowItems.push({ level: lv, status: rec ? 'done' : 'pending', record: rec });
    }

    return (
      <div className="detail-cards-container">
        {/* 卡片：审批流 */}
        <div className="detail-snapshot-card">
          <div className="detail-card-header">
            <Title heading={6} className="detail-card-title" style={{ margin: 0 }}>审批流</Title>
            {release.total_approval_levels ? (
              <Text type="tertiary" size="small">当前第 {release.current_approval_level} / {release.total_approval_levels} 级</Text>
            ) : null}
          </div>
          {flowItems.length > 0 ? (
            <Timeline>
              {flowItems.map((it) => {
                if (it.status === 'pending') {
                  return (
                    <Timeline.Item key={it.level} type="default" dot={<span className="detail-timeline-dot detail-timeline-dot-pending" />}>
                      <Space>
                        <Text strong>第 {it.level} 级审批</Text>
                        <StatusDot color="orange" label="待审批" />
                      </Space>
                      {release.current_approver_label && it.level === release.current_approval_level && (
                        <div><Text type="tertiary" size="small">{release.current_approver_label}</Text></div>
                      )}
                    </Timeline.Item>
                  );
                }
                const r = it.record!;
                const type = r.action === 'APPROVE' ? 'success' : r.action === 'REJECT' ? 'error' : 'default';
                const actionText = r.action === 'APPROVE' ? '通过' : r.action === 'REJECT' ? '拒绝' : '待审批';
                const tagColor: 'green' | 'red' | 'grey' = r.action === 'APPROVE' ? 'green' : r.action === 'REJECT' ? 'red' : 'grey';
                return (
                  <Timeline.Item key={it.level} type={type} time={r.acted_at ? formatTime(r.acted_at) : undefined}>
                    <Space>
                      <Text strong>第 {it.level} 级审批</Text>
                      <Tag color={tagColor} type="light" size="small">{actionText}</Tag>
                    </Space>
                    <div><Text type="tertiary" size="small">{r.approver_name}</Text></div>
                    {r.comment && <div><Text size="small">{r.comment}</Text></div>}
                  </Timeline.Item>
                );
              })}
            </Timeline>
          ) : (
            <Text type="tertiary" size="small">暂无审批流配置</Text>
          )}
        </div>

        {/* 卡片：审批记录 */}
        <div className="detail-snapshot-card">
          <Title heading={6} className="detail-card-title">审批记录</Title>
          {records.length === 0 ? (
            <EmptyState variant="noData" description="暂无审批记录" size={120} />
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

        {/* 审批操作 */}
        {approvalContext?.canAct && (
          <div className="detail-approve-actions">
            <Text strong size="small" style={{ display: 'block', marginBottom: 8 }}>审批</Text>
            <TextArea
              placeholder="请输入审批意见（拒绝时必填）"
              value={comment}
              onChange={setComment}
              rows={3}
              maxLength={500}
              showClear
              style={{ marginBottom: 12 }}
            />
            <div className="detail-approve-buttons">
              <Button
                theme="solid" type="primary" style={{ flex: 1, height: 32 }}
                loading={approvalContext.acting}
                onClick={() => { approvalContext.onApprove(); setComment(''); }}
              >
                通过
              </Button>
              <Button
                theme="solid" type="danger" style={{ flex: 1, height: 32 }}
                loading={approvalContext.acting}
                onClick={() => {
                  if (!comment.trim()) { Toast.warning('请填写拒绝原因'); return; }
                  approvalContext.onReject(comment.trim());
                  setComment('');
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
      title={drawerTitle}
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
            <TabPane tab="发布申请" itemKey="overview">
              {renderOverviewTab()}
            </TabPane>
            <TabPane tab="审批进度" itemKey="approval">
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
