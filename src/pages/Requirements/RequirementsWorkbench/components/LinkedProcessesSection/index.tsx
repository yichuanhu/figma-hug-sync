import { useTranslation } from 'react-i18next';
import { Typography, Tag } from '@douyinfe/semi-ui';
import { Workflow } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import type { LinkedProcess } from '../../types';
import { aggregateLinkedStatus, linkedProcessStatusConfig } from '../../utils/aggregateLinkedStatus';
import './index.less';

const { Text } = Typography;

interface Props {
  processes?: LinkedProcess[];
}

const LinkedProcessesSection = ({ processes }: Props) => {
  const { t } = useTranslation();
  const agg = aggregateLinkedStatus(processes);
  const list = processes ?? [];

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
        {list.length > 0 && (
          <Tag size="small" color={agg.color} type="light">
            {t(agg.i18nKey)}
          </Tag>
        )}
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
                <Text className="linked-processes-section__name" ellipsis={{ showTooltip: true }}>
                  {p.name}
                </Text>
                <Tag size="small" color={cfg.color} type="light">{t(cfg.i18nKey)}</Tag>
                <span className="linked-processes-section__owner">
                  {p.ownerName ? <UserNameWithCard name={p.ownerName} /> : <Text type="tertiary" size="small">-</Text>}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LinkedProcessesSection;
