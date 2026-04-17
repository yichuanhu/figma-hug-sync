import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Tag } from '@douyinfe/semi-ui';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import EmptyState from '@/components/EmptyState';
import PriorityIndicator from '../PriorityIndicator';
import ScoreBar from '../ScoreBar';
import { statusConfigV2, statusOptionsV2, legacyStatusMap } from '../../statusConfig';
import type { RequirementItem, RequirementStatus } from '../../types';
import './index.less';

interface BoardViewProps {
  list: RequirementItem[];
  selectedId?: string;
  onCardClick: (record: RequirementItem) => void;
}

// Color tokens aligned with StatusDot
const colorMap: Record<string, string> = {
  grey:   'var(--semi-color-text-2)',
  orange: 'var(--semi-color-warning)',
  purple: '#a855f7',
  cyan:   '#06b6d4',
  blue:   'var(--semi-color-primary)',
  green:  'var(--semi-color-success)',
  red:    'var(--semi-color-danger)',
};

const normalize = (s: string): RequirementStatus =>
  (statusConfigV2[s as RequirementStatus] ? (s as RequirementStatus) : legacyStatusMap[s]) || 'DRAFT';

const BoardView = ({ list, selectedId, onCardClick }: BoardViewProps) => {
  const { t } = useTranslation();

  const grouped = useMemo(() => {
    const map: Record<RequirementStatus, RequirementItem[]> = {} as Record<RequirementStatus, RequirementItem[]>;
    statusOptionsV2.forEach((s) => { map[s.value] = []; });
    list.forEach((item) => {
      const s = normalize(item.status);
      map[s].push(item);
    });
    return map;
  }, [list]);

  return (
    <div className="req-board">
      <div className="req-board__scroll">
        {statusOptionsV2.map((s) => {
          const items = grouped[s.value] || [];
          const cfg = statusConfigV2[s.value];
          const accent = colorMap[cfg.color];
          return (
            <div key={s.value} className="req-board__col">
              <div className="req-board__col-header">
                <span className="req-board__col-dot" style={{ backgroundColor: accent }} />
                <span className="req-board__col-title">{t(cfg.i18nKey)}</span>
                <span className="req-board__col-count">{items.length}</span>
              </div>
              <div className="req-board__col-body">
                {items.length === 0 ? (
                  <div className="req-board__empty">
                    <EmptyState variant="noData" description={t('requirements.workbench.noData')} />
                  </div>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.id}
                      className={`req-board__card${selectedId === item.id ? ' req-board__card--selected' : ''}`}
                      onClick={() => onCardClick(item)}
                    >
                      <div className="req-board__card-top">
                        <PriorityIndicator priority={item.priority} />
                        <Typography.Text type="tertiary" size="small" className="req-board__card-no">
                          {item.req_no || `REQ-${item.id.slice(0, 8)}`}
                        </Typography.Text>
                      </div>
                      <Typography.Text className="req-board__card-title" ellipsis={{ rows: 2, showTooltip: true }}>
                        {item.title}
                      </Typography.Text>
                      <div className="req-board__card-meta">
                        <Tag size="small" color="white" type="light">{item.owning_department_name}</Tag>
                      </div>
                      <div className="req-board__card-scores">
                        <div className="req-board__card-score">
                          <Typography.Text type="tertiary" size="small">
                            {t('requirements.fields.valueScore', '价值')}
                          </Typography.Text>
                          <ScoreBar value={item.value_score} variant="value" />
                        </div>
                        <div className="req-board__card-score">
                          <Typography.Text type="tertiary" size="small">
                            {t('requirements.fields.complexityScore', '复杂度')}
                          </Typography.Text>
                          <ScoreBar value={item.complexity_score} variant="complexity" />
                        </div>
                      </div>
                      <div className="req-board__card-footer">
                        <UserNameWithCard
                          name={item.owner_name || item.creatorName}
                          userId={item.owner_id || item.creatorId}
                          department={item.creatorDepartment}
                          role={item.creatorRole}
                          email={item.creatorEmail}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BoardView;
