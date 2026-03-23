import { useMemo } from 'react';
import { Select, Button } from '@douyinfe/semi-ui';
import { IconRefresh } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';
import { mockRobotGroups, mockRobotStatuses } from '@/pages/Operations/mockData';
import type { ResourceEfficiencyFilter } from '@/pages/Operations/types';
import './index.less';

interface Props {
  filter: ResourceEfficiencyFilter;
  onFilterChange: (filter: ResourceEfficiencyFilter) => void;
  onRefresh: () => void;
}

const ResourceFilterBar = ({ filter, onFilterChange, onRefresh }: Props) => {
  const { t } = useTranslation();

  const timeRangeOptions = [
    { value: 'thisMonth', label: t('operations.dashboard.thisMonth') },
    { value: 'lastMonth', label: t('operations.dashboard.lastMonth') },
    { value: 'thisQuarter', label: t('operations.dashboard.thisQuarter') },
    { value: 'thisYear', label: t('operations.dashboard.thisYear') },
    { value: 'all', label: t('operations.dashboard.allTime') },
  ];

  const timeDimensionOptions = [
    { value: 'all', label: t('operations.roiAnalysis.dimAll') },
    { value: 'daily', label: t('operations.roiAnalysis.dimDaily') },
    { value: 'weekly', label: t('operations.roiAnalysis.dimWeekly') },
    { value: 'monthly', label: t('operations.roiAnalysis.dimMonthly') },
  ];

  const localizedGroups = useMemo(() =>
    mockRobotGroups.map(g => g.value === 'all' ? { ...g, label: t('operations.dashboard.selectAll') } : g),
    [t]
  );

  const localizedStatuses = useMemo(() =>
    mockRobotStatuses.map(s => s.value === 'all'
      ? { ...s, label: t('operations.dashboard.selectAll') }
      : { ...s, label: t(`operations.resourceEfficiency.status${s.value.charAt(0).toUpperCase() + s.value.slice(1)}`) }
    ),
    [t]
  );

  return (
    <div className="resource-filter-bar">
      <div className="resource-filter-items">
        <div className="resource-filter-item">
          <span className="resource-filter-label">{t('operations.dashboard.timeRange')}</span>
          <Select size="small" value={filter.timeRange} optionList={timeRangeOptions}
            onChange={(val) => onFilterChange({ ...filter, timeRange: val as string })} style={{ width: 120 }} />
        </div>
        <div className="resource-filter-item">
          <span className="resource-filter-label">{t('operations.resourceEfficiency.group')}</span>
          <Select size="small" value={filter.group} optionList={localizedGroups}
            onChange={(val) => onFilterChange({ ...filter, group: val as string })} style={{ width: 120 }} />
        </div>
        <div className="resource-filter-item">
          <span className="resource-filter-label">{t('common.status')}</span>
          <Select size="small" value={filter.status} optionList={localizedStatuses}
            onChange={(val) => onFilterChange({ ...filter, status: val as string })} style={{ width: 120 }} />
        </div>
        <div className="resource-filter-item">
          <span className="resource-filter-label">{t('operations.roiAnalysis.timeDimension')}</span>
          <Select size="small" value={filter.timeDimension} optionList={timeDimensionOptions}
            onChange={(val) => onFilterChange({ ...filter, timeDimension: val as string })} style={{ width: 120 }} />
        </div>
      </div>
      <Button icon={<IconRefresh />} size="small" onClick={onRefresh}>
        {t('common.refresh')}
      </Button>
    </div>
  );
};

export default ResourceFilterBar;
