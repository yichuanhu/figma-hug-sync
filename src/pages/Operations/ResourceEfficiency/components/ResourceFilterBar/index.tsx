import { useMemo } from 'react';
import { Select, Button } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { mockDepartments, mockRobotStatuses } from '@/pages/Operations/mockData';
import type { ResourceEfficiencyFilter } from '@/pages/Operations/types';
import './index.less';
import { RefreshCw } from 'lucide-react';

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
    { value: 'cumulative', label: t('operations.resourceEfficiency.timeDimCumulative') },
    { value: 'today', label: t('operations.resourceEfficiency.timeDimToday') },
  ];

  const departmentOptions = useMemo(
    () => mockDepartments.filter(d => d.value !== 'all').map(d => ({ value: d.value, label: d.label })),
    []
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
          <Select value={filter.timeRange} optionList={timeRangeOptions}
            onChange={(val) => onFilterChange({ ...filter, timeRange: val as string })} style={{ width: 120 }} />
        </div>
        <div className="resource-filter-item">
          <span className="resource-filter-label">{t('operations.dashboard.department')}</span>
          <Select
            multiple
            maxTagCount={2}
            value={filter.departments}
            optionList={departmentOptions}
            placeholder={t('operations.dashboard.selectAll')}
            onChange={(val) => onFilterChange({ ...filter, departments: (val as string[]) || [] })}
            style={{ minWidth: 180, maxWidth: 320 }}
          />
        </div>
        <div className="resource-filter-item">
          <span className="resource-filter-label">{t('common.status')}</span>
          <Select value={filter.status} optionList={localizedStatuses}
            onChange={(val) => onFilterChange({ ...filter, status: val as string })} style={{ width: 120 }} />
        </div>
        <div className="resource-filter-item">
          <span className="resource-filter-label">{t('operations.resourceEfficiency.timeDimension')}</span>
          <Select value={filter.timeDimension} optionList={timeDimensionOptions}
            onChange={(val) => onFilterChange({ ...filter, timeDimension: val as string })} style={{ width: 120 }} />
        </div>
      </div>
      <Button icon={<RefreshCw size={16} strokeWidth={2} />} onClick={onRefresh}>
        {t('common.refresh')}
      </Button>
    </div>
  );
};

export default ResourceFilterBar;
