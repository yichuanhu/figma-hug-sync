import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Tag, Avatar, Tooltip } from '@douyinfe/semi-ui';
import { Bookmark, Zap, Calendar } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
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

// Priority -> 图标颜色（参考 PingCode：高优先级用闪电图标，普通用书签）
const priorityAccent: Record<string, { color: string; icon: 'bolt' | 'bookmark' }> = {
  HIGHEST: { color: 'var(--semi-color-danger)', icon: 'bolt' },
  HIGH:    { color: 'var(--semi-color-warning)', icon: 'bolt' },
  MEDIUM:  { color: 'var(--semi-color-primary)', icon: 'bookmark' },
  LOW:     { color: 'var(--semi-color-text-2)', icon: 'bookmark' },
  LOWEST:  { color: 'var(--semi-color-text-2)', icon: 'bookmark' },
};

const formatDate = (d?: string) => {
  if (!d) return '';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getMonth() + 1}月${date.getDate()}日`;
};

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
                  items.map((item) => {
                    const pAccent = priorityAccent[item.priority] || priorityAccent.MEDIUM;
                    const ownerName = item.owner_name || item.creatorName || '';
                    const dueDate = formatDate((item as any).expectedReleaseDate || (item as any).expected_release_date);
                    return (
                      <div
                        key={item.id}
                        className={`req-board__card${selectedId === item.id ? ' req-board__card--selected' : ''}`}
                        onClick={() => onCardClick(item)}
                      >
                        <span className="req-board__card-bar" style={{ backgroundColor: pAccent.color }} />
                        <div className="req-board__card-inner">
                          <div className="req-board__card-top">
                            <span className="req-board__card-icon" style={{ color: pAccent.color }}>
                              {pAccent.icon === 'bolt'
                                ? <Zap size={14} strokeWidth={2} fill={pAccent.color} />
                                : <Bookmark size={14} strokeWidth={2} fill={pAccent.color} />}
                            </span>
                            <Typography.Text type="tertiary" size="small" className="req-board__card-no">
                              {item.req_no || `REQ-${item.id.slice(0, 8)}`}
                            </Typography.Text>
                            <Tooltip content={ownerName} position="top">
                              <Avatar size="extra-small" className="req-board__card-avatar">
                                {ownerName.slice(0, 1)}
                              </Avatar>
                            </Tooltip>
                          </div>
                          <Typography.Text className="req-board__card-title" ellipsis={{ rows: 2, showTooltip: true }}>
                            {item.title}
                          </Typography.Text>
                          {(cfg || dueDate) && (
                            <div className="req-board__card-footer">
                              <Tag size="small" color={cfg.color} type="light">
                                {t(cfg.i18nKey)}
                              </Tag>
                              {dueDate && (
                                <span className="req-board__card-date">
                                  <Calendar size={12} strokeWidth={2} />
                                  {dueDate}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
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
