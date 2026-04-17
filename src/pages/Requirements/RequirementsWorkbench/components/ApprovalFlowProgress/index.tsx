import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Steps, Typography, Tag, Tooltip, Avatar, Collapsible } from '@douyinfe/semi-ui';
import { ChevronDown, ChevronRight, CheckCircle2, XCircle, Clock } from 'lucide-react';
import type { ApprovalFlowLevel, MultiLevelApprovalConfig } from '../../types';
import './index.less';

const { Step } = Steps;
const { Text } = Typography;

interface Props {
  config: MultiLevelApprovalConfig;
}

type StepStatus = 'finish' | 'error' | 'process' | 'wait';

const computeLevelStatus = (level: ApprovalFlowLevel, currentLevel: number): StepStatus => {
  if (level.approvers.some((a) => a.status === 'REJECTED')) return 'error';
  if (level.approvers.length > 0 && level.approvers.every((a) => a.status === 'APPROVED')) return 'finish';
  if (level.level === currentLevel) return 'process';
  if (level.level < currentLevel) return 'finish';
  return 'wait';
};

const ApprovalFlowProgress = ({ config }: Props) => {
  const { t } = useTranslation();
  const [openLevel, setOpenLevel] = useState<number | null>(config.currentLevel);
  const [expanded, setExpanded] = useState(false);

  const modeLabel = (mode: ApprovalFlowLevel['mode']) =>
    t(`requirements.approvalFlow.mode.${mode}`);

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

      <Steps type="basic" size="small" className="approval-flow-progress__steps">
        {config.levels.map((lv) => {
          const status = computeLevelStatus(lv, config.currentLevel);
          return (
            <Step
              key={lv.level}
              status={status}
              title={`L${lv.level} ${lv.name}`}
              description={
                <span className="approval-flow-progress__step-desc">
                  <Tag size="small" type="light" color="white">{modeLabel(lv.mode)}</Tag>
                  <span className="approval-flow-progress__avatars">
                    {lv.approvers.map((ap) => (
                      <Tooltip key={ap.id} content={`${ap.name} · ${t(`requirements.approvalFlow.approverStatus.${ap.status}`)}`}>
                        <Avatar size="extra-small" style={{ backgroundColor: 'var(--semi-color-text-0)' }}>
                          {ap.name.slice(0, 1)}
                        </Avatar>
                      </Tooltip>
                    ))}
                  </span>
                </span>
              }
            />
          );
        })}
      </Steps>

      <Collapsible isOpen={expanded} keepDOM>
      <div className="approval-flow-progress__details">
        {config.levels.map((lv) => {
          const isOpen = openLevel === lv.level;
          return (
            <div key={lv.level} className="approval-flow-progress__level">
              <button
                type="button"
                className="approval-flow-progress__level-toggle"
                onClick={() => setOpenLevel(isOpen ? null : lv.level)}
              >
                {isOpen ? <ChevronDown size={14} strokeWidth={2} /> : <ChevronRight size={14} strokeWidth={2} />}
                <Text size="small" strong>{`L${lv.level} · ${lv.name}`}</Text>
                <Tag size="small" type="light" color="white">{modeLabel(lv.mode)}</Tag>
              </button>
              {isOpen && (
                <div className="approval-flow-progress__approver-list">
                  {lv.approvers.map((ap) => {
                    const icon =
                      ap.status === 'APPROVED' ? <CheckCircle2 size={14} strokeWidth={2} color="var(--semi-color-success)" /> :
                      ap.status === 'REJECTED' ? <XCircle size={14} strokeWidth={2} color="var(--semi-color-danger)" /> :
                      <Clock size={14} strokeWidth={2} color="var(--semi-color-warning)" />;
                    const tagColor: 'green' | 'red' | 'orange' =
                      ap.status === 'APPROVED' ? 'green' : ap.status === 'REJECTED' ? 'red' : 'orange';
                    return (
                      <div key={ap.id} className="approval-flow-progress__approver">
                        <span className="approval-flow-progress__approver-name">
                          {icon}
                          <Text size="small">{ap.name}</Text>
                        </span>
                        <Tag size="small" color={tagColor} type="light">
                          {t(`requirements.approvalFlow.approverStatus.${ap.status}`)}
                        </Tag>
                        {ap.actedAt && (
                          <Text type="tertiary" size="small" className="approval-flow-progress__approver-time">
                            {ap.actedAt.replace('T', ' ').substring(0, 16)}
                          </Text>
                        )}
                        {ap.comment && (
                          <Text type="tertiary" size="small" className="approval-flow-progress__approver-comment">
                            {ap.comment}
                          </Text>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      </Collapsible>
    </div>
  );
};

export default ApprovalFlowProgress;
