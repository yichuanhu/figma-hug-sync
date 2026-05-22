import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Spin, Toast, Button } from '@douyinfe/semi-ui';
import { RefreshCw } from 'lucide-react';
import dayjs from 'dayjs';
import RobotPerformance from './components/RobotPerformance';
import TaskExecutionSection from './components/TaskExecutionSection';
import { getResourceEfficiency } from '@/pages/Operations/mockData';
import type { ResourceEfficiencyFilter } from '@/pages/Operations/types';
import './index.less';

const { Title, Text } = Typography;

const DEFAULT_FILTER: ResourceEfficiencyFilter = {
  timeRange: 'thisMonth',
  departments: [],
  status: 'all',
  timeDimension: 'cumulative',
};

const ResourceEfficiency = () => {
  const { t } = useTranslation();
  const [seed, setSeed] = useState(1);
  const [loading, setLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date>(new Date());

  const data = useMemo(() => getResourceEfficiency(DEFAULT_FILTER, seed), [seed]);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setSeed(Date.now() & 0xffffffff);
      setUpdatedAt(new Date());
      setLoading(false);
      Toast.success(t('operations.resourceEfficiency.refreshed'));
    }, 600);
  };

  return (
    <div className="resource-efficiency-page">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
          gap: 12,
        }}
      >
        <Title heading={3} style={{ margin: 0 }}>
          {t('operations.resourceEfficiency.title')}
        </Title>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Text type="tertiary" size="small">
            {t('operations.resourceEfficiency.dataUpdatedAt')}：
            {dayjs(updatedAt).format('YYYY-MM-DD HH:mm')}
          </Text>
          <Button
            theme="borderless"
            size="small"
            icon={<RefreshCw size={14} strokeWidth={2} />}
            onClick={handleRefresh}
          >
            {t('common.refresh')}
          </Button>
        </div>
      </div>
      <Spin spinning={loading}>
        <RobotPerformance data={data} />
        <TaskExecutionSection data={data} />
      </Spin>
    </div>
  );
};

export default ResourceEfficiency;
