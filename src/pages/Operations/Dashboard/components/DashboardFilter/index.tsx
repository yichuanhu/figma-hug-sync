import { useMemo } from 'react';
import { Select, Button } from '@douyinfe/semi-ui';
import { IconRefresh } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';
import { mockDepartments, mockProjects } from '@/pages/Operations/mockData';
import type { DashboardFilter as FilterType } from '@/pages/Operations/types';
import './index.less';

interface DashboardFilterProps {
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  onRefresh: () => void;
}

const DashboardFilter = ({ filter, onFilterChange, onRefresh }: DashboardFilterProps) => {
  const { t } = useTranslation();

  const timeRangeOptions = [
    { value: 'thisMonth', label: t('operations.dashboard.thisMonth') },
    { value: 'lastMonth', label: t('operations.dashboard.lastMonth') },
    { value: 'thisQuarter', label: t('operations.dashboard.thisQuarter') },
    { value: 'thisYear', label: t('operations.dashboard.thisYear') },
    { value: 'all', label: t('operations.dashboard.allTime') },
  ];

  return (
    <div className="dashboard-filter">
      <div className="dashboard-filter-items">
        <div className="dashboard-filter-item">
          <span className="dashboard-filter-label">{t('operations.dashboard.timeRange')}</span>
          <Select
            size="small"
            value={filter.timeRange}
            optionList={timeRangeOptions}
            onChange={(val) => onFilterChange({ ...filter, timeRange: val as string })}
            style={{ width: 120 }}
          />
        </div>
        <div className="dashboard-filter-item">
          <span className="dashboard-filter-label">{t('operations.dashboard.department')}</span>
          <Select
            size="small"
            value={filter.department}
            optionList={mockDepartments}
            onChange={(val) => onFilterChange({ ...filter, department: val as string })}
            style={{ width: 120 }}
          />
        </div>
        <div className="dashboard-filter-item">
          <span className="dashboard-filter-label">{t('operations.dashboard.project')}</span>
          <Select
            size="small"
            value={filter.project}
            optionList={mockProjects}
            onChange={(val) => onFilterChange({ ...filter, project: val as string })}
            style={{ width: 140 }}
          />
        </div>
      </div>
      <Button
        icon={<IconRefresh />}
        size="small"
        onClick={onRefresh}
      >
        {t('common.refresh')}
      </Button>
    </div>
  );
};

export default DashboardFilter;
