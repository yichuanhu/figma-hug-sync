import { Typography } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { Bell } from 'lucide-react';
import type { RequirementItem } from '../../types';
import './index.less';

interface TitleCellProps {
  record: RequirementItem;
  onViewChanges?: (record: RequirementItem) => void;
}

const TitleCell = ({ record, onViewChanges }: TitleCellProps) => {
  const { t } = useTranslation();
  const dept = record.owning_department_name || '-';
  const creator = record.creatorName || '-';
  const subtitle = t('requirements.list.subtitle', {
    department: dept,
    creator,
    defaultValue: `${dept} · ${creator}`,
  });
  const unread = record.unreadChangeCount ?? 0;
  return (
    <div className="req-title-cell">
      <div className="req-title-cell__row">
        <Typography.Text className="req-title-cell__title" ellipsis={{ showTooltip: true }}>
          {record.title}
        </Typography.Text>
        {unread > 0 && (
          <button
            type="button"
            className="req-title-cell__change"
            onClick={(e) => {
              e.stopPropagation();
              onViewChanges?.(record);
            }}
            title={t('requirements.list.unreadChange.tooltip', {
              count: unread,
              defaultValue: `有 ${unread} 条未读变更，点击查看`,
            })}
          >
            <Bell size={11} strokeWidth={2} className="req-title-cell__change-icon" />
            <span className="req-title-cell__change-count">{unread}</span>
            <span className="req-title-cell__change-label">
              {t('requirements.list.unreadChange.label', { defaultValue: '条未读变更' })}
            </span>
            <span className="req-title-cell__change-sep">·</span>
            <span className="req-title-cell__change-action">
              {t('common.view', { defaultValue: '查看' })}
            </span>
          </button>
        )}
      </div>
      <Typography.Text className="req-title-cell__sub" type="tertiary" size="small" ellipsis={{ showTooltip: true }}>
        {subtitle}
      </Typography.Text>
    </div>
  );
};

export default TitleCell;
