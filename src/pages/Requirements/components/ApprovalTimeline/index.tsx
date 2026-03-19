import React from 'react';
import { useTranslation } from 'react-i18next';
import { Timeline, Typography, Tag, Space } from '@douyinfe/semi-ui';
import { IconTickCircle, IconClose, IconClock } from '@douyinfe/semi-icons';
import type { LYApprovalRecord, ApprovalStatus } from '@/api';
import UserNameWithCard from '@/components/layout/UserNameWithCard';

import './index.less';

const { Text } = Typography;

interface ApprovalTimelineProps {
  approvalStatus: ApprovalStatus;
  records: LYApprovalRecord[];
}

/**
 * 审批流程节点定义：
 * 1. 提交需求
 * 2. 业务审批
 * 3. 技术审批
 * 4. 审批完成
 */

const ApprovalTimeline: React.FC<ApprovalTimelineProps> = ({ approvalStatus, records }) => {
  const { t } = useTranslation();

  const formatTime = (time: string) => {
    if (!time) return '';
    return new Date(time).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Find records by stage and action
  const submitRecord = records.find(r => r.action === 'SUBMIT' || r.action === 'RESUBMIT');
  const businessRecord = records.find(r => r.stage === 'BUSINESS' && (r.action === 'APPROVE' || r.action === 'REJECT'));
  const techRecord = records.find(r => r.stage === 'TECH' && (r.action === 'APPROVE' || r.action === 'REJECT'));

  // Determine node states based on approval_status
  type NodeState = 'done' | 'active' | 'error' | 'waiting';

  const getNodeStates = (): { submit: NodeState; business: NodeState; tech: NodeState; complete: NodeState } => {
    switch (approvalStatus) {
      case 'DRAFT':
        return { submit: 'waiting', business: 'waiting', tech: 'waiting', complete: 'waiting' };
      case 'BUSINESS_PENDING':
        return { submit: 'done', business: 'active', tech: 'waiting', complete: 'waiting' };
      case 'BUSINESS_APPROVED':
        return { submit: 'done', business: 'done', tech: 'waiting', complete: 'waiting' };
      case 'BUSINESS_REJECTED':
        return { submit: 'done', business: 'error', tech: 'waiting', complete: 'waiting' };
      case 'TECH_PENDING':
        return { submit: 'done', business: 'done', tech: 'active', complete: 'waiting' };
      case 'TECH_APPROVED':
        return { submit: 'done', business: 'done', tech: 'done', complete: 'done' };
      case 'TECH_REJECTED':
        return { submit: 'done', business: 'done', tech: 'error', complete: 'waiting' };
      default:
        return { submit: 'waiting', business: 'waiting', tech: 'waiting', complete: 'waiting' };
    }
  };

  const states = getNodeStates();

  const getNodeIcon = (state: NodeState) => {
    switch (state) {
      case 'done':
        return <IconTickCircle style={{ color: 'var(--semi-color-success)' }} />;
      case 'active':
        return <IconClock style={{ color: 'var(--semi-color-warning)' }} />;
      case 'error':
        return <IconClose style={{ color: 'var(--semi-color-danger)', fontSize: 14, background: 'var(--semi-color-danger-light-default)', borderRadius: '50%', padding: 2 }} />;
      case 'waiting':
        return <div className="approval-timeline-waiting-dot" />;
    }
  };

  const getNodeColor = (state: NodeState): string => {
    switch (state) {
      case 'done': return 'var(--semi-color-success)';
      case 'active': return 'var(--semi-color-warning)';
      case 'error': return 'var(--semi-color-danger)';
      case 'waiting': return 'var(--semi-color-text-3)';
    }
  };

  const renderRecordDetail = (record: LYApprovalRecord | undefined, state: NodeState) => {
    if (!record || state === 'waiting') return null;
    return (
      <div className="approval-timeline-detail">
        <Space spacing={8} align="center">
          <UserNameWithCard
            name={record.operator_name}
            userId={record.operator_id}
            department={record.operator_department || undefined}
            role={record.operator_role || undefined}
            email={record.operator_email || undefined}
          />
          <Text size="small" type="tertiary">{formatTime(record.operated_at)}</Text>
        </Space>
        {record.comment && (
          <div className="approval-timeline-comment">
            <Text size="small" type="secondary">{record.comment}</Text>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="approval-timeline">
      <Timeline mode="left">
        {/* Node 1: Submit */}
        <Timeline.Item
          dot={getNodeIcon(states.submit)}
          color={getNodeColor(states.submit)}
        >
          <div className="approval-timeline-node">
            <Text strong={states.submit === 'active'} type={states.submit === 'waiting' ? 'tertiary' : undefined}>
              {t('requirement.approvalFlow.submitRequirement')}
            </Text>
            {states.submit === 'active' && (
              <Tag color="blue" size="small" style={{ marginLeft: 8 }}>{t('requirement.approvalFlow.current')}</Tag>
            )}
            {renderRecordDetail(submitRecord, states.submit)}
          </div>
        </Timeline.Item>

        {/* Node 2: Business Approval */}
        <Timeline.Item
          dot={getNodeIcon(states.business)}
          color={getNodeColor(states.business)}
        >
          <div className="approval-timeline-node">
            <Text strong={states.business === 'active'} type={states.business === 'waiting' ? 'tertiary' : undefined}>
              {t('requirement.approvalFlow.businessApproval')}
            </Text>
            {states.business === 'active' && (
              <Tag color="orange" size="small" style={{ marginLeft: 8 }}>{t('requirement.approvalFlow.pending')}</Tag>
            )}
            {states.business === 'error' && (
              <Tag color="red" size="small" style={{ marginLeft: 8 }}>{t('requirement.approvalFlow.rejected')}</Tag>
            )}
            {renderRecordDetail(businessRecord, states.business)}
          </div>
        </Timeline.Item>

        {/* Node 3: Tech Approval */}
        <Timeline.Item
          dot={getNodeIcon(states.tech)}
          color={getNodeColor(states.tech)}
        >
          <div className="approval-timeline-node">
            <Text strong={states.tech === 'active'} type={states.tech === 'waiting' ? 'tertiary' : undefined}>
              {t('requirement.approvalFlow.techApproval')}
            </Text>
            {states.tech === 'active' && (
              <Tag color="orange" size="small" style={{ marginLeft: 8 }}>{t('requirement.approvalFlow.pending')}</Tag>
            )}
            {states.tech === 'error' && (
              <Tag color="red" size="small" style={{ marginLeft: 8 }}>{t('requirement.approvalFlow.rejected')}</Tag>
            )}
            {renderRecordDetail(techRecord, states.tech)}
          </div>
        </Timeline.Item>

        {/* Node 4: Complete */}
        <Timeline.Item
          dot={getNodeIcon(states.complete)}
          color={getNodeColor(states.complete)}
        >
          <div className="approval-timeline-node">
            <Text strong={states.complete === 'done'} type={states.complete === 'waiting' ? 'tertiary' : undefined}>
              {t('requirement.approvalFlow.approvalComplete')}
            </Text>
            {states.complete === 'done' && (
              <Tag color="green" size="small" style={{ marginLeft: 8 }}>{t('requirement.approvalFlow.passed')}</Tag>
            )}
          </div>
        </Timeline.Item>
      </Timeline>
    </div>
  );
};

export default ApprovalTimeline;
