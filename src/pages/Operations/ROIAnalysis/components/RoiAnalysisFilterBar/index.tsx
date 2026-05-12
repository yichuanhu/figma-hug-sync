import { useMemo } from 'react';
import { Select, Button } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { mockDepartments, mockProjects, mockClassifications } from '@/pages/Operations/mockData';
import type { RoiAnalysisFilter } from '@/pages/Operations/types';
import './index.less';
import { RefreshCw } from 'lucide-react';

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
    { value: 'cumulative', label: t('operations.businessOutcomes.timeDimCumulative') },
    { value: 'today', label: t('operations.businessOutcomes.timeDimToday') },
  ];

  const localizedDepartments = useMemo(() =>
    mockDepartments.filter(d => d.value !== 'all').map(d => ({ value: d.value, label: d.label })),
    []
  );
  const localizedProjects = useMemo(() =>
    mockProjects.filter(p => p.value !== 'all').map(p => ({ value: p.value, label: p.label })),
    []
  );
  const localizedClassifications = useMemo(() =>
    mockClassifications.filter(c => c.value !== 'all').map(c => ({ value: c.value, label: c.label })),
    []
  );

  return (
    <div className="roi-analysis-filter">
      <div className="roi-analysis-filter-items">
        <div className="roi-analysis-filter-item">
          <span className="roi-analysis-filter-label">{t('operations.dashboard.timeRange')}</span>
          <Select value={filter.timeRange} optionList={timeRangeOptions}
            onChange={(val) => onFilterChange({ ...filter, timeRange: val as string })} style={{ width: 120 }} />
        </div>
        <div className="roi-analysis-filter-item">
          <span className="roi-analysis-filter-label">{t('operations.dashboard.department')}</span>
          <Select multiple maxTagCount={2} value={filter.departments} optionList={localizedDepartments}
            placeholder={t('operations.dashboard.selectAll')}
            onChange={(val) => onFilterChange({ ...filter, departments: (val as string[]) || [] })}
            style={{ minWidth: 180, maxWidth: 320 }} />
        </div>
        <div className="roi-analysis-filter-item">
          <span className="roi-analysis-filter-label">{t('operations.dashboard.project')}</span>
          <Select multiple maxTagCount={2} value={filter.projects} optionList={localizedProjects}
            placeholder={t('operations.dashboard.selectAll')}
            onChange={(val) => onFilterChange({ ...filter, projects: (val as string[]) || [] })}
            style={{ minWidth: 180, maxWidth: 320 }} />
        </div>
        <div className="roi-analysis-filter-item">
          <span className="roi-analysis-filter-label">{t('operations.roiAnalysis.timeDimension')}</span>
          <Select value={filter.timeDimension} optionList={timeDimensionOptions}
            onChange={(val) => onFilterChange({ ...filter, timeDimension: val as string })} style={{ width: 120 }} />
        </div>
        <div className="roi-analysis-filter-item">
          <span className="roi-analysis-filter-label">{t('operations.roiAnalysis.classification')}</span>
          <Select multiple maxTagCount={2} value={filter.classifications} optionList={localizedClassifications}
            placeholder={t('operations.dashboard.selectAll')}
            onChange={(val) => onFilterChange({ ...filter, classifications: (val as string[]) || [] })}
            style={{ minWidth: 180, maxWidth: 320 }} />
        </div>
      </div>
      <Button icon={<RefreshCw size={16} strokeWidth={2} />} onClick={onRefresh}>
        {t('common.refresh')}
      </Button>
    </div>
  );
};

export default RoiAnalysisFilterBar;
