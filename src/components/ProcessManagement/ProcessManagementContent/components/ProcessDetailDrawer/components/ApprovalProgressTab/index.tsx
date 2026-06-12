/**
 * 流程详情抽屉 — 审批进度 Tab（FEAT-025 BI-F-07 / FEAT-027 BI-F-04, R-17/R-18）
 *
 * 此 Tab 永久只读：即使当前用户是审批人也不显示任何操作按钮。
 * 审批操作请前往「发布审批 / 停用审批」页面进行。
 *
 * - development context：取该流程最新的发布审批版本（PENDING/REJECTED/APPROVED/PUBLISHED）
 * - scheduling   context：取该流程最新的停用审批申请
 */
import { useEffect, useState } from 'react';
import { Typography, Space, Card, Tag, Timeline, Spin } from '@douyinfe/semi-ui';
import {
  fetchProcessVersions,
  subscribeProcessVersionChange,
  type ProcessVersion,
} from '@/mocks/processVersionApproval';
import {
  fetchOfflineApprovals,
  subscribeOfflineRequestChange,
  type ProcessOfflineRequest,
} from '@/mocks/processOfflineApproval';
import EmptyState from '@/components/EmptyState';
import './index.less';

const { Text, Paragraph } = Typography;

interface Props {
  processId: string;
  context: 'development' | 'scheduling';
}

const fmtTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleString('zh-CN', { hour12: false }) : '-';

const PUBLISH_VISIBLE = new Set(['PENDING_APPROVAL', 'REJECTED', 'APPROVED', 'PUBLISHED']);

type ApproverSnap = { id: string; name: string; priority: number };
type RecordItem = {
  level: number;
  approver_name: string;
  action: 'approve' | 'reject';
  comment?: string;
  acted_at: string;
};

const ApprovalProgressTab = ({ processId, context }: Props) => {
  const [loading, setLoading] = useState(true);
  const [publishData, setPublishData] = useState<ProcessVersion | null>(null);
  const [offlineData, setOfflineData] = useState<ProcessOfflineRequest | null>(null);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      if (context === 'development') {
        const list = await fetchProcessVersions();
        const latest = list
          .filter((v) => v.process_id === processId && PUBLISH_VISIBLE.has(v.status))
          .sort((a, b) => (b.submitted_at || '').localeCompare(a.submitted_at || ''))[0];
        if (!cancelled) {
          setPublishData(latest ?? null);
          setLoading(false);
        }
      } else {
        const list = await fetchOfflineApprovals();
        const latest = list
          .filter((r) => r.process_id === processId)
          .sort((a, b) => (b.submitted_at || '').localeCompare(a.submitted_at || ''))[0];
        if (!cancelled) {
          setOfflineData(latest ?? null);
          setLoading(false);
        }
      }
    };
    refresh();
    const unsub = context === 'development'
      ? subscribeProcessVersionChange(refresh)
      : subscribeOfflineRequestChange(refresh);
    return () => { cancelled = true; unsub(); };
  }, [processId, context]);

  const renderTimeline = (
    approvers: ApproverSnap[] | undefined,
    records: RecordItem[],
    currentLevel: number | undefined,
    finalStatus: 'pending' | 'approved' | 'rejected',
  ) => {
    if (!approvers || approvers.length === 0) {
      return <Text type="tertiary" size="small">未配置审批流</Text>;
    }
    const sorted = [...approvers].sort((a, b) => a.priority - b.priority);
    return (
      <Timeline>
        {sorted.map((ap, idx) => {
          const level = idx + 1;
          const rec = records.find((r) => r.level === level);
          let type: 'success' | 'error' | 'ongoing' | 'default' = 'default';
          let statusText = '待审批';
          let statusColor: 'green' | 'red' | 'orange' | 'grey' = 'grey';
          let timeStr: string | undefined;

          if (rec?.action === 'approve') {
            type = 'success';
            statusText = '通过';
            statusColor = 'green';
            timeStr = fmtTime(rec.acted_at);
          } else if (rec?.action === 'reject') {
            type = 'error';
            statusText = '拒绝';
            statusColor = 'red';
            timeStr = fmtTime(rec.acted_at);
          } else if (finalStatus === 'pending' && currentLevel === level) {
            type = 'ongoing';
            statusText = '审批中';
            statusColor = 'orange';
          }

          return (
            <Timeline.Item key={ap.id} type={type} time={timeStr}>
              <Space spacing={8}>
                <Text strong>{rec?.approver_name || ap.name}</Text>
                <Tag color={statusColor} type="light" size="small">
                  {statusText}（第 {level} 级）
                </Tag>
              </Space>
              {rec?.comment && (
                <div style={{ marginTop: 4 }}>
                  <Text type="tertiary" size="small">{rec.comment}</Text>
                </div>
              )}
            </Timeline.Item>
          );
        })}
      </Timeline>
    );
  };

  if (loading) {
    return <div className="approval-progress-tab" style={{ padding: 24 }}><Spin /></div>;
  }

  // ============ Development: 发布审批 ============
  if (context === 'development') {
    if (!publishData) {
      return (
        <div className="approval-progress-tab">
          <EmptyState description="暂无审批记录" size={120} />
        </div>
      );
    }
    const v = publishData;
    const finalStatus: 'pending' | 'approved' | 'rejected' =
      v.status === 'PENDING_APPROVAL' ? 'pending'
        : v.status === 'REJECTED' ? 'rejected' : 'approved';
    const headerTag =
      v.status === 'PENDING_APPROVAL' ? <Tag color="orange" type="light">发布审批中</Tag>
        : v.status === 'REJECTED' ? <Tag color="red" type="light">已拒绝</Tag>
          : <Tag color="green" type="light">已通过</Tag>;

    return (
      <div className="approval-progress-tab approval-progress-tab__body">
        <div className="approval-progress-tab__readonly-tip">
          审批进度仅供查看。如需审批，请前往「发布审批」页面。
        </div>

        <Card className="detail-section" title="基本信息">
          <div className="info-row">
            <Text type="tertiary">流程名称：</Text>
            <Text>{v.process_name}</Text>
          </div>
          <div className="info-row">
            <Text type="tertiary">版本号：</Text>
            <Space spacing={8}><Text>v{v.version}</Text>{headerTag}</Space>
          </div>
          <div className="info-row"><Text type="tertiary">申请人：</Text><Text>{v.developer_name}</Text></div>
          <div className="info-row"><Text type="tertiary">所属部门：</Text><Text>{v.department_name}</Text></div>
          <div className="info-row"><Text type="tertiary">提交时间：</Text><Text>{fmtTime(v.submitted_at)}</Text></div>
          {v.publish_note && (
            <div className="info-row info-row-block">
              <Text type="tertiary">发布说明：</Text>
              <Paragraph>{v.publish_note}</Paragraph>
            </div>
          )}
        </Card>

        {v.approval_template_snapshot && (
          <Card
            className="detail-section"
            title={`审批流：${v.approval_template_snapshot.name}`}
            headerExtraContent={finalStatus === 'pending' && v.total_levels ? (
              <Text type="tertiary" size="small">当前第 {v.current_level} / {v.total_levels} 级</Text>
            ) : undefined}
          >
            {renderTimeline(v.approval_template_snapshot.approvers, v.records ?? [], v.current_level, finalStatus)}
          </Card>
        )}
      </div>
    );
  }

  // ============ Scheduling: 停用审批 ============
  if (!offlineData) {
    return (
      <div className="approval-progress-tab">
        <EmptyState description="暂无审批记录" size={120} />
      </div>
    );
  }
  const r = offlineData;
  const finalStatus: 'pending' | 'approved' | 'rejected' =
    r.status === 'PENDING_APPROVAL' ? 'pending'
      : r.status === 'REJECTED' ? 'rejected' : 'approved';
  const headerTag =
    r.status === 'PENDING_APPROVAL' ? <Tag color="orange" type="light">下线审批中</Tag>
      : r.status === 'APPROVED' ? <Tag color="blue" type="light">下线执行中</Tag>
        : r.status === 'EXECUTION_FAILED' ? <Tag color="red" type="light">下线失败</Tag>
          : r.status === 'REJECTED' ? <Tag color="red" type="light">已拒绝</Tag>
            : <Tag color="green" type="light">已通过</Tag>;

  return (
    <div className="approval-progress-tab approval-progress-tab__body">
      <div className="approval-progress-tab__readonly-tip">
        审批进度仅供查看。如需审批，请前往「停用审批」页面。
      </div>

      <Card className="detail-section" title="基本信息">
        <div className="info-row">
          <Text type="tertiary">流程名称：</Text>
          <Space spacing={8}><Text>{r.process_name}</Text>{headerTag}</Space>
        </div>
        <div className="info-row"><Text type="tertiary">申请人：</Text><Text>{r.applicant_name}</Text></div>
        <div className="info-row"><Text type="tertiary">所属部门：</Text><Text>{r.department_name}</Text></div>
        <div className="info-row"><Text type="tertiary">提交时间：</Text><Text>{fmtTime(r.submitted_at)}</Text></div>
        <div className="info-row info-row-block">
          <Text type="tertiary">下线原因：</Text>
          <Paragraph>{r.reason}</Paragraph>
        </div>
        {r.status === 'EXECUTION_FAILED' && r.execution_error && (
          <div className="info-row info-row-block">
            <Text type="tertiary">执行错误：</Text>
            <Paragraph style={{ color: 'var(--semi-color-danger)' }}>{r.execution_error}</Paragraph>
          </div>
        )}
        {r.executed_at && (
          <div className="info-row"><Text type="tertiary">执行时间：</Text><Text>{fmtTime(r.executed_at)}</Text></div>
        )}
      </Card>

      {r.approval_template_snapshot && (
        <Card
          className="detail-section"
          title={`审批流：${r.approval_template_snapshot.name}`}
          headerExtraContent={finalStatus === 'pending' && r.total_levels ? (
            <Text type="tertiary" size="small">当前第 {r.current_level} / {r.total_levels} 级</Text>
          ) : undefined}
        >
          {renderTimeline(r.approval_template_snapshot.approvers, r.records ?? [], r.current_level, finalStatus)}
        </Card>
      )}
    </div>
  );
};

export default ApprovalProgressTab;
