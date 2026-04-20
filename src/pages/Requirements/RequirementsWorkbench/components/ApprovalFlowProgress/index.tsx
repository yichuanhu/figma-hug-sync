import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Tag, Avatar, Collapsible } from '@douyinfe/semi-ui';
import { ChevronDown, ChevronRight, Check, X, Clock, Circle } from 'lucide-react';
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
  const [expanded, setExpanded] = useState(false);

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
      <button
        type="button"
        className="approval-flow-progress__header approval-flow-progress__header--toggle"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <span className="approval-flow-progress__header-left">
          {expanded ? <ChevronDown size={14} strokeWidth={2} /> : <ChevronRight size={14} strokeWidth={2} />}
          <Text strong>{t('requirements.approvalFlow.title')}</Text>
        </span>
        <Text type="tertiary" size="small">
          {t('requirements.approvalFlow.currentLevel', {
            current: config.currentLevel,
            total: config.levels.length,
            name: config.levels.find((l) => l.level === config.currentLevel)?.name ?? '',
          })}
        </Text>
      </button>

      {/* 收起态：紧凑圆点进度 */}
      {!expanded && (
        <div className="approval-flow-progress__dots">
          {config.levels.map((lv, idx) => {
            const status = computeLevelStatus(lv, config.currentLevel);
            return (
              <span key={lv.level} className="afp-dot-wrap">
                <span className={`afp-dot afp-dot--${status}`} />
                {idx < config.levels.length - 1 && (
                  <span className={`afp-dot-line afp-dot-line--${status}`} />
                )}
              </span>
            );
          })}
        </div>
      )}

      <Collapsible isOpen={expanded} keepDOM>
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
                <div className={`afp-node__card${isCurrent ? ' afp-node__card--current' : ''}`}>
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
                            <Avatar size="extra-small" style={{ backgroundColor: 'var(--semi-color-text-0)' }}>
                              {ap.name.slice(0, 1)}
                            </Avatar>
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
      </Collapsible>
    </div>
  );
};

export default ApprovalFlowProgress;
