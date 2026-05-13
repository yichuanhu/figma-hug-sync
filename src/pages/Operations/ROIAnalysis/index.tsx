import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Spin, Toast, Button } from '@douyinfe/semi-ui';
import { RefreshCw } from 'lucide-react';
import dayjs from 'dayjs';
import OverallRoiCards from './components/OverallRoiCards';
import RequirementRoiSection from './components/RequirementRoiSection';
import DepartmentRoiSection from './components/DepartmentRoiSection';
import ProjectRoiSection from './components/ProjectRoiSection';
import { getRoiAnalysis } from '@/pages/Operations/mockData';
import type { RoiAnalysisFilter } from '@/pages/Operations/types';
import './index.less';

const { Title, Text } = Typography;

const DEFAULT_FILTER: RoiAnalysisFilter = {
  timeRange: 'thisMonth',
  departments: [],
  projects: [],
  timeDimension: 'cumulative',
  classifications: [],
};

const ROIAnalysis = () => {
  const { t } = useTranslation();
  const [seed, setSeed] = useState(1);
  const [loading, setLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date>(new Date());

  const data = useMemo(() => getRoiAnalysis(DEFAULT_FILTER, seed), [seed]);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setSeed(Date.now() & 0xffffffff);
      setUpdatedAt(new Date());
      setLoading(false);
      Toast.success(t('operations.roiAnalysis.refreshed'));
    }, 600);
  };

  return (
    <div className="roi-analysis-page">
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
          {t('operations.roiAnalysis.title')}
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
        <OverallRoiCards data={data.metrics} />
        <RequirementRoiSection data={data.requirements} />
        <DepartmentRoiSection data={data.departments} />
        <ProjectRoiSection data={data.projects} />
      </Spin>
    </div>
  );
};

export default ROIAnalysis;
