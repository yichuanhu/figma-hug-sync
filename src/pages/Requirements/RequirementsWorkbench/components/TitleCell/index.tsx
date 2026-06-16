import { Typography, Tooltip } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { History } from 'lucide-react';
import type { RequirementItem } from '../../types';
import './index.less';

interface TitleCellProps {
  record: RequirementItem;
  onViewChanges?: (record: RequirementItem) => void;
}

const TitleCell = ({ record, onViewChanges }: TitleCellProps) => {
  const { t } = useTranslation();
  const unread = record.unreadChangeCount ?? 0;
  return (
    <div className="req-title-cell">
      <div className="req-title-cell__row">
        <Typography.Text className="req-title-cell__title" ellipsis={{ showTooltip: true }}>
          {record.title}
        </Typography.Text>
        {unread > 0 && (
          <Tooltip
            content={t('requirements.list.unreadChange.tooltip', {
              count: unread,
              defaultValue: `${unread} 条未读变更，点击查看`,
            })}
          >
            <button
              type="button"
              className="req-title-cell__change"
              onClick={(e) => {
                e.stopPropagation();
                onViewChanges?.(record);
              }}
            >
              <History size={12} strokeWidth={2} className="req-title-cell__change-icon" />
              <span className="req-title-cell__change-count">{unread > 99 ? '99+' : unread}</span>
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

export default TitleCell;
