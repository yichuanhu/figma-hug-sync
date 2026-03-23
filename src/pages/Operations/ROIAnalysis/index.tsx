import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography } from '@douyinfe/semi-ui';
import RoiAnalysisFilterBar from './components/RoiAnalysisFilterBar';
import RequirementRoiSection from './components/RequirementRoiSection';
import DepartmentRoiSection from './components/DepartmentRoiSection';
import ProjectRoiSection from './components/ProjectRoiSection';
import {
  mockRequirementRoiDetails,
  mockDepartmentRoiDetails,
  mockProjectRoiDetails,
} from '@/pages/Operations/mockData';
import type { RoiAnalysisFilter } from '@/pages/Operations/types';
import './index.less';

const { Title } = Typography;

const ROIAnalysis = () => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<RoiAnalysisFilter>({
    timeRange: 'thisMonth',
    department: 'all',
    project: 'all',
    timeDimension: 'monthly',
  });

  const handleRefresh = () => {
    // Future API integration
  };

  return (
    <div className="roi-analysis-page">
      <Title heading={3} style={{ marginBottom: 24 }}>{t('operations.roiAnalysis.title')}</Title>
      <RoiAnalysisFilterBar filter={filter} onFilterChange={setFilter} onRefresh={handleRefresh} />
      <RequirementRoiSection data={mockRequirementRoiDetails} />
      <DepartmentRoiSection data={mockDepartmentRoiDetails} />
      <ProjectRoiSection data={mockProjectRoiDetails} />
    </div>
  );
};

export default ROIAnalysis;
