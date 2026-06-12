/**
 * 只读「审批进度抽屉」（FEAT-025 BI-F-07 / FEAT-027 BI-F-04, R-17/R-18）
 *
 * - 入口：流程列表「审批中」Tag 点击直接打开
 * - 权限：不依赖 process_*_approval.view；申请人 / 创建人 / 流程负责人 / 同部门可见
 * - 操作按钮：仅当「当前用户=本级审批人 + 拥有 approve 权限点」时显示通过/拒绝；
 *   mock 阶段简化为：当前用户 ID 匹配 `applicant_id !== CURRENT` 且 status=PENDING_APPROVAL，
 *   且 hasApprovePermission 为 true 时显示。默认 hasApprovePermission=false → 纯只读。
 */
import { useEffect, useState } from 'react';
import { SideSheet, Typography, Tag, Spin, Empty } from '@douyinfe/semi-ui';
import { Check, X, Clock, Circle } from 'lucide-react';
import {
  getProcessVersionById,
  subscribeProcessVersionChange,
  type ProcessVersion,
} from '@/mocks/processVersionApproval';
import {
  getOfflineRequestById,
  subscribeOfflineRequestChange,
  type ProcessOfflineRequest,
} from '@/mocks/processOfflineApproval';
import { useTranslation } from 'react-i18next';
import './index.less';

const { Text, Title } = Typography;

interface Props {
  visible: boolean;
  onClose: () => void;
  mode: 'publish' | 'offline';
  targetId: string | null;
}

const fmtTime = (iso?: string) => (iso ? new Date(iso).toLocaleString('zh-CN', { hour12: false }) : '-');

const ApprovalProgressDrawer = ({ visible, onClose, mode, targetId }: Props) => {
  const { t } = useTranslation();
  const [publishData, setPublishData] = useState<ProcessVersion | null>(null);
  const [offlineData, setOfflineData] = useState<ProcessOfflineRequest | null>(null);

  useEffect(() => {
    if (!visible || !targetId) return;
    const refresh = () => {
      if (mode === 'publish') setPublishData(getProcessVersionById(targetId) || null);
      else setOfflineData(getOfflineRequestById(targetId) || null);
    };
    refresh();
    const unsub = mode === 'publish'
      ? subscribeProcessVersionChange(refresh)
      : subscribeOfflineRequestChange(refresh);
    return () => unsub();
  }, [visible, mode, targetId]);

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
      <div className="approval-progress-drawer__levels">
        {sorted.map((ap, idx) => {
          const level = idx + 1;
          const rec = records.find((r) => r.level === level);
          let cls = 'approval-progress-drawer__level-num';
          let icon: React.ReactNode = level;
          if (rec?.action === 'approve') {
            cls += ' approval-progress-drawer__level-num--done';
            icon = <Check size={14} strokeWidth={3} />;
          } else if (rec?.action === 'reject') {
            cls += ' approval-progress-drawer__level-num--reject';
            icon = <X size={14} strokeWidth={3} />;
          } else if (finalStatus === 'pending' && currentLevel === level) {
            cls += ' approval-progress-drawer__level-num--current';
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
            <div key={ap.id} className="approval-progress-drawer__level">
              <span className={cls}>{icon}</span>
              <div className="approval-progress-drawer__level-body">
                <div className="approval-progress-drawer__level-name">
                  L{level} · {ap.name} {' '} {statusTag}
                </div>
                {rec && (
                  <div className="approval-progress-drawer__level-record">
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

  const renderBody = () => {
    if (mode === 'publish') {
      if (!publishData) return <Spin />;
      const v = publishData;
      const finalStatus: 'pending' | 'approved' | 'rejected' =
        v.status === 'PENDING_APPROVAL' ? 'pending' : v.status === 'REJECTED' ? 'rejected' : 'approved';
      return (
        <div className="approval-progress-drawer__body">
          <div className="approval-progress-drawer__readonly-tip">
            {t('development.processDevelopment.approvalHint.readonlyTip')}
          </div>
          <Title heading={6}>{v.process_name} · v{v.version}</Title>
          <div className="approval-progress-drawer__summary">
            <span className="approval-progress-drawer__summary-label">{t('development.processDevelopment.approvalHint.applicant')}</span>
            <span>{v.developer_name}</span>
            <span className="approval-progress-drawer__summary-label">{t('development.processDevelopment.approvalHint.department')}</span>
            <span>{v.department_name}</span>
            <span className="approval-progress-drawer__summary-label">{t('development.processDevelopment.approvalHint.submittedAt')}</span>
            <span>{fmtTime(v.submitted_at)}</span>
            {v.publish_note && (
              <>
                <span className="approval-progress-drawer__summary-label">{t('development.processDevelopment.approvalHint.publishNote')}</span>
                <span>{v.publish_note}</span>
              </>
            )}
          </div>
          {renderLevels(v.approval_template_snapshot?.approvers, v.records ?? [], v.current_level, finalStatus)}
        </div>
      );
    }
    if (!offlineData) return <Spin />;
    const r = offlineData;
    const finalStatus: 'pending' | 'approved' | 'rejected' =
      r.status === 'PENDING_APPROVAL' ? 'pending' : r.status === 'REJECTED' ? 'rejected' : 'approved';
    return (
      <div className="approval-progress-drawer__body">
        <div className="approval-progress-drawer__readonly-tip">
          {t('development.processDevelopment.approvalHint.readonlyTip')}
        </div>
        <Title heading={6}>{r.process_name}</Title>
        <div className="approval-progress-drawer__summary">
          <span className="approval-progress-drawer__summary-label">{t('development.processDevelopment.approvalHint.applicant')}</span>
          <span>{r.applicant_name}</span>
          <span className="approval-progress-drawer__summary-label">{t('development.processDevelopment.approvalHint.department')}</span>
          <span>{r.department_name}</span>
          <span className="approval-progress-drawer__summary-label">{t('development.processDevelopment.approvalHint.submittedAt')}</span>
          <span>{fmtTime(r.submitted_at)}</span>
          <span className="approval-progress-drawer__summary-label">{t('development.processDevelopment.approvalHint.offlineReason')}</span>
          <span>{r.reason}</span>
          {r.status === 'EXECUTION_FAILED' && r.execution_error && (
            <>
              <span className="approval-progress-drawer__summary-label">{t('development.processDevelopment.approvalHint.executionError')}</span>
              <span style={{ color: 'var(--semi-color-danger)' }}>{r.execution_error}</span>
            </>
          )}
          {r.executed_at && (
            <>
              <span className="approval-progress-drawer__summary-label">{t('development.processDevelopment.approvalHint.executedAt')}</span>
              <span>{fmtTime(r.executed_at)}</span>
            </>
          )}
        </div>
        {renderLevels(r.approval_template_snapshot?.approvers, r.records ?? [], r.current_level, finalStatus)}
      </div>
    );
  };

  const title = mode === 'publish'
    ? t('development.processDevelopment.approvalHint.titlePublish')
    : t('development.processDevelopment.approvalHint.titleOffline');

  return (
    <SideSheet
      visible={visible}
      onCancel={onClose}
      title={title}
      width={720}
      mask={false}
    >
      {renderBody()}
    </SideSheet>
  );
};

export default ApprovalProgressDrawer;
