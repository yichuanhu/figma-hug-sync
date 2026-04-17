import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Typography, Tag, Button } from '@douyinfe/semi-ui';
import { Workflow, Settings, ExternalLink } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import type { LinkedProcess } from '../../types';
import { aggregateLinkedStatus, linkedProcessStatusConfig } from '../../utils/aggregateLinkedStatus';
import ManageLinkedProcessesModal from '../ManageLinkedProcessesModal';
import './index.less';

const { Text } = Typography;

interface Props {
  requirementId: string;
  processes?: LinkedProcess[];
  onChanged?: () => void;
}

const PROCESS_LIST_PATH = '/scheduling-center/execution-assets/automation-process';

const LinkedProcessesSection = ({ requirementId, processes, onChanged }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [manageOpen, setManageOpen] = useState(false);
  const agg = aggregateLinkedStatus(processes);
  const list = processes ?? [];

  const handleNavigate = (p: LinkedProcess) => {
    navigate(`${PROCESS_LIST_PATH}?processId=${encodeURIComponent(p.id)}`);
  };

  return (
    <div className="linked-processes-section">
      <div className="linked-processes-section__header">
        <span className="linked-processes-section__title">
          <Workflow size={14} strokeWidth={2} />
          <Text strong>{t('requirements.linkedProcesses.title')}</Text>
          {list.length > 0 && (
            <Text type="tertiary" size="small">
              {t('requirements.linkedProcesses.count', { online: agg.online, total: agg.total })}
            </Text>
          )}
        </span>
        <span className="linked-processes-section__header-right">
          {list.length > 0 && (
            <Tag size="small" color={agg.color} type="light">
              {t(agg.i18nKey)}
            </Tag>
          )}
          <Button
            size="small"
            theme="borderless"
            type="tertiary"
            icon={<Settings size={14} strokeWidth={2} />}
            onClick={() => setManageOpen(true)}
          >
            {t('requirements.linkedProcesses.manage')}
          </Button>
        </span>
      </div>

      {list.length === 0 ? (
        <div className="linked-processes-section__empty">
          <EmptyState variant="noData" description={t('requirements.linkedProcesses.empty')} />
        </div>
      ) : (
        <div className="linked-processes-section__list">
          {list.map((p) => {
            const cfg = linkedProcessStatusConfig[p.status];
            return (
              <div key={p.id} className="linked-processes-section__row">
                <span className={`linked-processes-section__dot linked-processes-section__dot--${cfg.color}`} />
                <button
                  type="button"
                  className="linked-processes-section__name-btn"
                  onClick={() => handleNavigate(p)}
                  title={t('requirements.linkedProcesses.openProcess')}
                >
                  <Text className="linked-processes-section__name" ellipsis={{ showTooltip: true }}>
                    {p.name}
                  </Text>
                  <ExternalLink size={12} strokeWidth={2} className="linked-processes-section__name-icon" />
                </button>
                <Tag size="small" color={cfg.color} type="light">{t(cfg.i18nKey)}</Tag>
                <span className="linked-processes-section__owner">
                  {p.ownerName ? <UserNameWithCard name={p.ownerName} /> : <Text type="tertiary" size="small">-</Text>}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <ManageLinkedProcessesModal
        visible={manageOpen}
        requirementId={requirementId}
        linked={list}
        onClose={() => setManageOpen(false)}
        onChanged={() => onChanged?.()}
      />
    </div>
  );
};

export default LinkedProcessesSection;
