import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Spin, Toast } from '@douyinfe/semi-ui';
import RoiAnalysisFilterBar from './components/RoiAnalysisFilterBar';
import OverallRoiCards from './components/OverallRoiCards';
import RequirementRoiSection from './components/RequirementRoiSection';
import DepartmentRoiSection from './components/DepartmentRoiSection';
import ProjectRoiSection from './components/ProjectRoiSection';
import { getRoiAnalysis } from '@/pages/Operations/mockData';
import type { RoiAnalysisFilter } from '@/pages/Operations/types';
import './index.less';

const { Title } = Typography;

const ROIAnalysis = () => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<RoiAnalysisFilter>({
    timeRange: 'thisMonth',
    departments: [],
    projects: [],
    timeDimension: 'cumulative',
    classifications: [],
  });
  const [seed, setSeed] = useState(1);
  const [loading, setLoading] = useState(false);

  const data = useMemo(() => getRoiAnalysis(filter, seed), [filter, seed]);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setSeed(Date.now() & 0xffffffff);
      setLoading(false);
      Toast.success(t('operations.roiAnalysis.refreshed'));
    }, 600);
  };

  return (
    <div className="roi-analysis-page">
      <Title heading={3} style={{ marginBottom: 24 }}>{t('operations.roiAnalysis.title')}</Title>
      <RoiAnalysisFilterBar filter={filter} onFilterChange={setFilter} onRefresh={handleRefresh} />
      <Spin spinning={loading}>
        <OverallRoiCards data={data.metrics} />
        <RequirementRoiSection data={data.requirements} />
        <DepartmentRoiSection data={data.departments} />
        <ProjectRoiSection data={data.projects} />
      </Spin>
    </div>
  );
};

export default ROIAnalysis;
