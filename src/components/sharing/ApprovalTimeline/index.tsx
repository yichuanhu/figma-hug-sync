import { Timeline, Typography } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';

export type ApprovalEventType = 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';

export interface ApprovalEvent {
  type: ApprovalEventType;
  actorName: string;
  at: string;
  comment?: string;
}

interface Props {
  events: ApprovalEvent[];
}

const typeMap: Record<ApprovalEventType, 'default' | 'success' | 'error' | 'warning'> = {
  SUBMITTED: 'default',
  APPROVED: 'success',
  REJECTED: 'error',
  WITHDRAWN: 'warning',
};

const ApprovalTimeline = ({ events }: Props) => {
  const { t } = useTranslation();
  return (
    <Timeline mode="left">
      {events.map((e, idx) => (
        <Timeline.Item key={idx} type={typeMap[e.type]} time={e.at}>
          <div>
            <Typography.Text strong>{e.actorName}</Typography.Text>{' '}
            <Typography.Text type="tertiary">
              {t(`sharing.approvals.timeline.${e.type.toLowerCase()}`)}
            </Typography.Text>
          </div>
          {e.comment && (
            <Typography.Paragraph type="secondary" style={{ margin: '4px 0 0' }}>
              {e.comment}
            </Typography.Paragraph>
          )}
        </Timeline.Item>
      ))}
    </Timeline>
  );
};

export default ApprovalTimeline;
