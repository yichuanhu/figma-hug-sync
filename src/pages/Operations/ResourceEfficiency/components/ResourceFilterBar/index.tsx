import { useMemo } from 'react';
import { Select, Button, Tag } from '@douyinfe/semi-ui';
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

  const timeDimensions = [
    { key: 'all', label: t('operations.roiAnalysis.dimAll') },
    { key: 'daily', label: t('operations.roiAnalysis.dimDaily') },
    { key: 'weekly', label: t('operations.roiAnalysis.dimWeekly') },
    { key: 'monthly', label: t('operations.roiAnalysis.dimMonthly') },
  ];

  return (
    <div className="resource-filter-bar">
      <div className="resource-filter-items">
        <div className="resource-filter-item">
          <span className="resource-filter-label">{t('operations.dashboard.timeRange')}</span>
          <Select
            size="small"
            value={filter.timeRange}
            optionList={timeRangeOptions}
            onChange={(val) => onFilterChange({ ...filter, timeRange: val as string })}
            style={{ width: 120 }}
          />
        </div>
        <div className="resource-filter-item">
          <span className="resource-filter-label">{t('operations.resourceEfficiency.group')}</span>
          <Select
            size="small"
            value={filter.group}
            optionList={localizedGroups}
            onChange={(val) => onFilterChange({ ...filter, group: val as string })}
            style={{ width: 120 }}
          />
        </div>
        <div className="resource-filter-item">
          <span className="resource-filter-label">{t('common.status')}</span>
          <Select
            size="small"
            value={filter.status}
            optionList={localizedStatuses}
            onChange={(val) => onFilterChange({ ...filter, status: val as string })}
            style={{ width: 120 }}
          />
        </div>
        <div className="resource-filter-item">
          <span className="resource-filter-label">{t('operations.roiAnalysis.timeDimension')}</span>
          <div className="resource-filter-dimensions">
            {timeDimensions.map(d => (
              <Tag
                key={d.key}
                color={filter.timeDimension === d.key ? 'blue' : undefined}
                type={filter.timeDimension === d.key ? 'light' : 'ghost'}
                size="small"
                style={{ cursor: 'pointer' }}
                onClick={() => onFilterChange({ ...filter, timeDimension: d.key })}
              >
                {d.label}
              </Tag>
            ))}
          </div>
        </div>
      </div>
      <Button icon={<IconRefresh />} size="small" onClick={onRefresh}>
        {t('common.refresh')}
      </Button>
    </div>
  );
};

export default ResourceFilterBar;
