import { useTranslation } from 'react-i18next';
import { Typography, Tag } from '@douyinfe/semi-ui';
import { Check, X, Clock, Circle } from 'lucide-react';
import type { ApprovalFlowLevel, MultiLevelApprovalConfig } from '../../types';
import './index.less';

const { Text } = Typography;

interface Props {
  config: MultiLevelApprovalConfig;
}

type LevelStatus = 'finish' | 'error' | 'process' | 'wait';

const computeLevelStatus = (level: ApprovalFlowLevel, currentLevel: number): LevelStatus => {
  if (level.approvers.some((a) => a.status === 'REJECTED')) return 'error';
  if (level.approvers.length > 0 && level.approvers.every((a) => a.status === 'APPROVED')) return 'finish';
  if (level.level === currentLevel) return 'process';
  if (level.level < currentLevel) return 'finish';
  return 'wait';
};

const ApprovalFlowProgress = ({ config }: Props) => {
  const { t } = useTranslation();

  const modeLabel = (mode: ApprovalFlowLevel['mode']) =>
    t(`requirements.approvalFlow.mode.${mode}`);

  const levelStatusLabel = (status: LevelStatus) =>
    t(`requirements.approvalFlow.levelStatus.${status}`, {
      defaultValue:
        status === 'finish' ? '已通过' :
        status === 'error' ? '已驳回' :
        status === 'process' ? '审批中' : '待审批',
    });

  const renderNodeIcon = (status: LevelStatus) => {
    if (status === 'finish') {
      return (
        <span className="afp-node-icon afp-node-icon--finish">
          <Check size={12} strokeWidth={3} />
        </span>
      );
    }
    if (status === 'error') {
      return (
        <span className="afp-node-icon afp-node-icon--error">
          <X size={12} strokeWidth={3} />
        </span>
      );
    }
    if (status === 'process') {
      return (
        <span className="afp-node-icon afp-node-icon--process">
          <Clock size={12} strokeWidth={3} />
        </span>
      );
    }
    return (
      <span className="afp-node-icon afp-node-icon--wait">
        <Circle size={10} strokeWidth={2} />
      </span>
    );
  };

  return (
    <div className="approval-flow-progress">
      <div className="approval-flow-progress__timeline">
        {config.levels.map((lv, idx) => {
          const status = computeLevelStatus(lv, config.currentLevel);
          const isLast = idx === config.levels.length - 1;
          const isCurrent = status === 'process';
          return (
            <div key={lv.level} className={`afp-node afp-node--${status}`}>
              <div className="afp-node__rail">
                {renderNodeIcon(status)}
                {!isLast && <span className={`afp-node__line afp-node__line--${status}`} />}
              </div>
              <div className={`afp-node__content${isCurrent ? ' afp-node__content--current' : ''}`}>
                <div className="afp-node__head">
                  <span className="afp-node__title">
                    <Text strong size="small">{`L${lv.level} · ${lv.name}`}</Text>
                    <Tag size="small" type="light" color="white">{modeLabel(lv.mode)}</Tag>
                  </span>
                  <Text
                    size="small"
                    type={status === 'error' ? 'danger' : status === 'process' ? 'primary' : 'tertiary'}
                  >
                    {levelStatusLabel(status)}
                  </Text>
                </div>

                <div className="afp-node__approvers">
                  {lv.approvers.map((ap) => {
                    const apTag: 'green' | 'red' | 'orange' | 'grey' =
                      ap.status === 'APPROVED' ? 'green' :
                      ap.status === 'REJECTED' ? 'red' :
                      ap.status === 'PENDING' ? 'orange' : 'grey';
                    return (
                      <div key={ap.id} className="afp-approver">
                        <div className="afp-approver__row">
                          <Text size="small" className="afp-approver__name">{ap.name}</Text>
                          <Tag size="small" color={apTag} type="light">
                            {t(`requirements.approvalFlow.approverStatus.${ap.status}`)}
                          </Tag>
                          {ap.actedAt && (
                            <Text type="tertiary" size="small" className="afp-approver__time">
                              {ap.actedAt.replace('T', ' ').substring(0, 16)}
                            </Text>
                          )}
                        </div>
                        {ap.comment && (
                          <div className="afp-approver__comment">
                            <Text size="small" type="secondary">{ap.comment}</Text>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ApprovalFlowProgress;
