/**
 * 流程详情抽屉 — 审批进度 Tab（FEAT-025 BI-F-07 / FEAT-027 BI-F-04, R-17/R-18）
 *
 * - 只读：不依赖 process_*_approval.view 权限
 * - development context：取该流程最新的发布审批版本（PENDING/REJECTED/APPROVED）
 * - scheduling context：取该流程最新的停用审批申请
 */
import { useEffect, useState } from 'react';
import { Typography, Tag, Spin, Empty } from '@douyinfe/semi-ui';
import { Check, X, Clock, Circle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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

const { Text, Title } = Typography;

interface Props {
  processId: string;
  context: 'development' | 'scheduling';
}

const fmtTime = (iso?: string) => (iso ? new Date(iso).toLocaleString('zh-CN', { hour12: false }) : '-');

const PUBLISH_VISIBLE = new Set(['PENDING_APPROVAL', 'REJECTED', 'APPROVED', 'PUBLISHED']);

const ApprovalProgressTab = ({ processId, context }: Props) => {
  const { t } = useTranslation();
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

  const renderLevels = (
    approvers: { id: string; name: string; priority: number }[] | undefined,
    records: { level: number; approver_name: string; action: 'approve' | 'reject'; comment?: string; acted_at: string }[],
    currentLevel?: number,
    finalStatus?: 'pending' | 'approved' | 'rejected',
  ) => {
    if (!approvers || approvers.length === 0) {
      return <Empty description={t('development.processDevelopment.approvalHint.noTemplate')} />;
    }
    const sorted = [...approvers].sort((a, b) => a.priority - b.priority);
    return (
      <div className="approval-progress-tab__levels">
        {sorted.map((ap, idx) => {
          const level = idx + 1;
          const rec = records.find((r) => r.level === level);
          let cls = 'approval-progress-tab__level-num';
          let icon: React.ReactNode = level;
          if (rec?.action === 'approve') {
            cls += ' approval-progress-tab__level-num--done';
            icon = <Check size={14} strokeWidth={3} />;
          } else if (rec?.action === 'reject') {
            cls += ' approval-progress-tab__level-num--reject';
            icon = <X size={14} strokeWidth={3} />;
          } else if (finalStatus === 'pending' && currentLevel === level) {
            cls += ' approval-progress-tab__level-num--current';
            icon = <Clock size={12} strokeWidth={3} />;
          } else {
            icon = <Circle size={10} strokeWidth={2} />;
          }
          const statusTag = rec
            ? (
              <Tag size="small" color={rec.action === 'approve' ? 'green' : 'red'} type="light">
                {rec.action === 'approve' ? t('development.processDevelopment.approvalHint.lvApproved')
                  : t('development.processDevelopment.approvalHint.lvRejected')}
              </Tag>
            )
            : currentLevel === level && finalStatus === 'pending'
              ? <Tag size="small" color="orange" type="light">{t('development.processDevelopment.approvalHint.lvPending')}</Tag>
              : <Tag size="small" color="grey" type="light">{t('development.processDevelopment.approvalHint.lvWaiting')}</Tag>;
          return (
            <div key={ap.id} className="approval-progress-tab__level">
              <span className={cls}>{icon}</span>
              <div className="approval-progress-tab__level-body">
                <div className="approval-progress-tab__level-name">
                  L{level} · {ap.name} {' '} {statusTag}
                </div>
                {rec && (
                  <div className="approval-progress-tab__level-record">
                    <Text type="tertiary" size="small">
                      {rec.approver_name} · {fmtTime(rec.acted_at)}
                    </Text>
                    {rec.comment && (
                      <div style={{ marginTop: 4, color: 'var(--semi-color-text-1)' }}>{rec.comment}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return <div className="approval-progress-tab" style={{ padding: 24 }}><Spin /></div>;
  }

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
      v.status === 'PENDING_APPROVAL' ? 'pending' : v.status === 'REJECTED' ? 'rejected' : 'approved';
    const headerTag = v.status === 'PENDING_APPROVAL'
      ? <Tag color="orange" type="light">{t('development.processDevelopment.approvalHint.publishPending')}</Tag>
      : v.status === 'REJECTED'
        ? <Tag color="red" type="light">{t('development.processDevelopment.approvalHint.lvRejected')}</Tag>
        : <Tag color="green" type="light">{t('development.processDevelopment.approvalHint.lvApproved')}</Tag>;
    return (
      <div className="approval-progress-tab approval-progress-tab__body">
        <div className="approval-progress-tab__readonly-tip">
          {t('development.processDevelopment.approvalHint.readonlyTip')}
        </div>
        <div className="approval-progress-tab__title-row">
          <Title heading={6} style={{ margin: 0 }}>{v.process_name} · v{v.version}</Title>
          {headerTag}
        </div>
        <div className="approval-progress-tab__summary">
          <span className="approval-progress-tab__summary-label">{t('development.processDevelopment.approvalHint.applicant')}</span>
          <span>{v.developer_name}</span>
          <span className="approval-progress-tab__summary-label">{t('development.processDevelopment.approvalHint.department')}</span>
          <span>{v.department_name}</span>
          <span className="approval-progress-tab__summary-label">{t('development.processDevelopment.approvalHint.submittedAt')}</span>
          <span>{fmtTime(v.submitted_at)}</span>
          {v.publish_note && (
            <>
              <span className="approval-progress-tab__summary-label">{t('development.processDevelopment.approvalHint.publishNote')}</span>
              <span>{v.publish_note}</span>
            </>
          )}
        </div>
        {renderLevels(v.approval_template_snapshot?.approvers, v.records ?? [], v.current_level, finalStatus)}
      </div>
    );
  }

  if (!offlineData) {
    return (
      <div className="approval-progress-tab">
        <EmptyState description="暂无审批记录" size={120} />
      </div>
    );
  }
  const r = offlineData;
  const finalStatus: 'pending' | 'approved' | 'rejected' =
    r.status === 'PENDING_APPROVAL' ? 'pending' : r.status === 'REJECTED' ? 'rejected' : 'approved';
  const headerTag = r.status === 'PENDING_APPROVAL'
    ? <Tag color="orange" type="light">{t('development.processDevelopment.approvalHint.offlinePending')}</Tag>
    : r.status === 'APPROVED'
      ? <Tag color="blue" type="light">{t('development.processDevelopment.approvalHint.offlineExecuting')}</Tag>
      : r.status === 'EXECUTION_FAILED'
        ? <Tag color="red" type="light">{t('development.processDevelopment.approvalHint.offlineFailed')}</Tag>
        : r.status === 'REJECTED'
          ? <Tag color="red" type="light">{t('development.processDevelopment.approvalHint.lvRejected')}</Tag>
          : <Tag color="green" type="light">{t('development.processDevelopment.approvalHint.lvApproved')}</Tag>;
  return (
    <div className="approval-progress-tab approval-progress-tab__body">
      <div className="approval-progress-tab__readonly-tip">
        {t('development.processDevelopment.approvalHint.readonlyTip')}
      </div>
      <div className="approval-progress-tab__title-row">
        <Title heading={6} style={{ margin: 0 }}>{r.process_name}</Title>
        {headerTag}
      </div>
      <div className="approval-progress-tab__summary">
        <span className="approval-progress-tab__summary-label">{t('development.processDevelopment.approvalHint.applicant')}</span>
        <span>{r.applicant_name}</span>
        <span className="approval-progress-tab__summary-label">{t('development.processDevelopment.approvalHint.department')}</span>
        <span>{r.department_name}</span>
        <span className="approval-progress-tab__summary-label">{t('development.processDevelopment.approvalHint.submittedAt')}</span>
        <span>{fmtTime(r.submitted_at)}</span>
        <span className="approval-progress-tab__summary-label">{t('development.processDevelopment.approvalHint.offlineReason')}</span>
        <span>{r.reason}</span>
        {r.status === 'EXECUTION_FAILED' && r.execution_error && (
          <>
            <span className="approval-progress-tab__summary-label">{t('development.processDevelopment.approvalHint.executionError')}</span>
            <span style={{ color: 'var(--semi-color-danger)' }}>{r.execution_error}</span>
          </>
        )}
        {r.executed_at && (
          <>
            <span className="approval-progress-tab__summary-label">{t('development.processDevelopment.approvalHint.executedAt')}</span>
            <span>{fmtTime(r.executed_at)}</span>
          </>
        )}
      </div>
      {renderLevels(r.approval_template_snapshot?.approvers, r.records ?? [], r.current_level, finalStatus)}
    </div>
  );
};

export default ApprovalProgressTab;
