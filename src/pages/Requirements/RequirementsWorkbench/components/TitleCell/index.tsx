import { Typography } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import type { RequirementItem } from '../../types';
import './index.less';

interface TitleCellProps {
  record: RequirementItem;
}

const TitleCell = ({ record }: TitleCellProps) => {
  const { t } = useTranslation();
  const dept = record.owning_department_name || '-';
  const creator = record.creatorName || '-';
  const subtitle = t('requirements.list.subtitle', {
    department: dept,
    creator,
    defaultValue: `${dept} · ${creator}`,
  });
  return (
    <div className="req-title-cell">
      <Typography.Text className="req-title-cell__title" ellipsis={{ showTooltip: true }}>
        {record.title}
      </Typography.Text>
      <Typography.Text className="req-title-cell__sub" type="tertiary" size="small" ellipsis={{ showTooltip: true }}>
        {subtitle}
      </Typography.Text>
    </div>
  );
};

export default TitleCell;
