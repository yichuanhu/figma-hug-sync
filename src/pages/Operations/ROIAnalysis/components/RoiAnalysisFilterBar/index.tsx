import { useMemo } from 'react';
import { Select, Button } from '@douyinfe/semi-ui';
import { IconRefresh } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';
import { mockDepartments, mockProjects } from '@/pages/Operations/mockData';
import type { RoiAnalysisFilter } from '@/pages/Operations/types';
import './index.less';

interface Props {
  filter: RoiAnalysisFilter;
  onFilterChange: (f: RoiAnalysisFilter) => void;
  onRefresh: () => void;
}

const RoiAnalysisFilterBar = ({ filter, onFilterChange, onRefresh }: Props) => {
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

  const localizedDepartments = useMemo(() =>
    mockDepartments.map(d => d.value === 'all' ? { ...d, label: t('operations.dashboard.selectAll') } : d),
    [t]
  );
  const localizedProjects = useMemo(() =>
    mockProjects.map(p => p.value === 'all' ? { ...p, label: t('operations.dashboard.selectAll') } : p),
    [t]
  );

  return (
    <div className="roi-analysis-filter">
      <div className="roi-analysis-filter-items">
        <div className="roi-analysis-filter-item">
          <span className="roi-analysis-filter-label">{t('operations.dashboard.timeRange')}</span>
          <Select size="small" value={filter.timeRange} optionList={timeRangeOptions}
            onChange={(val) => onFilterChange({ ...filter, timeRange: val as string })} style={{ width: 120 }} />
        </div>
        <div className="roi-analysis-filter-item">
          <span className="roi-analysis-filter-label">{t('operations.dashboard.department')}</span>
          <Select size="small" value={filter.department} optionList={localizedDepartments}
            onChange={(val) => onFilterChange({ ...filter, department: val as string })} style={{ width: 120 }} />
        </div>
        <div className="roi-analysis-filter-item">
          <span className="roi-analysis-filter-label">{t('operations.dashboard.project')}</span>
          <Select size="small" value={filter.project} optionList={localizedProjects}
            onChange={(val) => onFilterChange({ ...filter, project: val as string })} style={{ width: 140 }} />
        </div>
        <div className="roi-analysis-filter-item">
          <span className="roi-analysis-filter-label">{t('operations.roiAnalysis.timeDimension')}</span>
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

export default RoiAnalysisFilterBar;
