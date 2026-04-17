import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Tag, Button } from '@douyinfe/semi-ui';
import { Workflow, Settings, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import EmptyState from '@/components/EmptyState';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import type { LinkedProcess } from '../../types';
import { aggregateLinkedStatus, linkedProcessStatusConfig } from '../../utils/aggregateLinkedStatus';
import ManageLinkedProcessesModal from '../ManageLinkedProcessesModal';
import './index.less';

const { Text } = Typography;

interface Props {
  processes?: LinkedProcess[];
  requirementId?: string;
  canManage?: boolean;
  onChanged?: () => void;
}

const PROCESS_DETAIL_BASE = '/dev-center/automation-process';

const LinkedProcessesSection = ({ processes, requirementId, canManage, onChanged }: Props) => {
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const agg = aggregateLinkedStatus(processes);
  const list = processes ?? [];

  return (
    <div className="linked-processes-section">
      <div className="linked-processes-section__header">
        <span className="linked-processses-section__left linked-processes-section__title">
          <Workflow size={14} strokeWidth={2} />
          <Text strong>{t('requirements.linkedProcesses.title')}</Text>
          {list.length > 0 && (
            <Text type="tertiary" size="small">
              {t('requirements.linkedProcesses.count', { online: agg.online, total: agg.total })}
            </Text>
          )}
        </span>
        <span className="linked-processes-section__right">
          {list.length > 0 && (
            <Tag size="small" color={agg.color} type="light">
              {t(agg.i18nKey)}
            </Tag>
          )}
          {canManage && requirementId && (
            <Button
              icon={<Settings size={14} strokeWidth={2} />}
              theme="borderless"
              size="small"
              type="tertiary"
              onClick={() => setModalVisible(true)}
            >
              {t('requirements.linkedProcesses.manage')}
            </Button>
          )}
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
                <Link
                  to={`${PROCESS_DETAIL_BASE}?processId=${p.id}`}
                  className="linked-processes-section__name-link"
                  title={p.name}
                >
                  <span className="linked-processes-section__name-text">{p.name}</span>
                  <ExternalLink size={12} strokeWidth={2} />
                </Link>
                <Tag size="small" color={cfg.color} type="light">{t(cfg.i18nKey)}</Tag>
                <span className="linked-processes-section__owner">
                  {p.ownerName ? <UserNameWithCard name={p.ownerName} /> : <Text type="tertiary" size="small">-</Text>}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {canManage && requirementId && (
        <ManageLinkedProcessesModal
          visible={modalVisible}
          requirementId={requirementId}
          linked={list}
          onClose={() => setModalVisible(false)}
          onChanged={() => onChanged?.()}
        />
      )}
    </div>
  );
};

export default LinkedProcessesSection;
