import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography } from '@douyinfe/semi-ui';
import DashboardFilter from './components/DashboardFilter';
import CoreMetricsCards from './components/CoreMetricsCards';
import ResourceOverview from './components/ResourceOverview';
import RequirementOverview from './components/RequirementOverview';
import RoiTrendChart from './components/RoiTrendChart';
import DepartmentRoiRanking from './components/DepartmentRoiRanking';
import RequirementRoiRanking from './components/RequirementRoiRanking';
import {
  mockRoiMetrics,
  mockResourceOverview,
  mockRequirementOverview,
  mockRoiTrend,
  mockDepartmentRoi,
  mockRequirementRoi,
} from '@/pages/Operations/mockData';
import type { DashboardFilter as FilterType } from '@/pages/Operations/types';
import './index.less';

const { Title } = Typography;

const Dashboard = () => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<FilterType>({
    timeRange: 'thisMonth',
    department: 'all',
    project: 'all',
  });

  const handleRefresh = () => {
    // 手动刷新逻辑 - 后续对接API
  };

  return (
    <div className="operations-dashboard">
      <div className="operations-dashboard-header">
        <div className="operations-dashboard-header-title">
          <Title heading={3} className="title">{t('operations.dashboard.title')}</Title>
        </div>
      </div>
      <DashboardFilter filter={filter} onFilterChange={setFilter} onRefresh={handleRefresh} />
      <CoreMetricsCards data={mockRoiMetrics} />
      <ResourceOverview data={mockResourceOverview} />
      <RequirementOverview data={mockRequirementOverview} />
      <RoiTrendChart data={mockRoiTrend} />
      <div className="operations-dashboard-rankings">
        <DepartmentRoiRanking data={mockDepartmentRoi} />
        <RequirementRoiRanking data={mockRequirementRoi} />
      </div>
    </div>
  );
};

export default Dashboard;
