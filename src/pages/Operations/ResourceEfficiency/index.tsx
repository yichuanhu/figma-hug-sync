import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Spin, Toast } from '@douyinfe/semi-ui';
import ResourceFilterBar from './components/ResourceFilterBar';
import RobotPerformance from './components/RobotPerformance';
import TaskExecutionSection from './components/TaskExecutionSection';
import { getResourceEfficiency } from '@/pages/Operations/mockData';
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
    topN: 5,
  });
  const [seed, setSeed] = useState(1);
  const [loading, setLoading] = useState(false);

  const data = useMemo(() => getResourceEfficiency(filter, seed), [filter, seed]);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setSeed(Date.now() & 0xffffffff);
      setLoading(false);
      Toast.success(t('operations.roiAnalysis.refreshed'));
    }, 600);
  };

  return (
    <div className="resource-efficiency-page">
      <Title heading={3} style={{ marginBottom: 24 }}>{t('operations.resourceEfficiency.title')}</Title>
      <ResourceFilterBar filter={filter} onFilterChange={setFilter} onRefresh={handleRefresh} />
      <Spin spinning={loading}>
        <RobotPerformance data={data} topN={filter.topN} />
        <TaskExecutionSection data={data} topN={filter.topN} />
      </Spin>
    </div>
  );
};

export default ResourceEfficiency;
