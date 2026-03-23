import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography } from '@douyinfe/semi-ui';
import ResourceFilterBar from './components/ResourceFilterBar';
import RobotPerformance from './components/RobotPerformance';
import TaskExecutionSection from './components/TaskExecutionSection';
import { mockResourceEfficiency } from '@/pages/Operations/mockData';
import type { ResourceEfficiencyFilter } from '@/pages/Operations/types';
import './index.less';

const { Title } = Typography;

const ResourceEfficiency = () => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<ResourceEfficiencyFilter>({
    timeRange: 'thisMonth',
    group: 'all',
    status: 'all',
    timeDimension: 'monthly',
  });

  const handleRefresh = () => {
    // Future API integration
  };

  return (
    <div className="resource-efficiency-page">
      <Title heading={3} style={{ marginBottom: 24 }}>{t('operations.resourceEfficiency.title')}</Title>
      <ResourceFilterBar filter={filter} onFilterChange={setFilter} onRefresh={handleRefresh} />
      <RobotPerformance data={mockResourceEfficiency} />
      <TaskExecutionSection data={mockResourceEfficiency} />
    </div>
  );
};

export default ResourceEfficiency;
