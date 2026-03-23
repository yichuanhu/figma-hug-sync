import { Table, Tag } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import type { ProjectRoiDetail } from '@/pages/Operations/types';
import './index.less';

interface Props {
  data: ProjectRoiDetail[];
}

/* Semi Design Level 3-4 muted palette — text colors kept deeper for readability */
const COLORS = {
  textSuccess: '#00B42A',
  textPrimary: '#165DFF',
  textWarning: '#FF7D00',
};

const ProjectRoiSection = ({ data }: Props) => {
  const { t } = useTranslation();

  const statusMap: Record<string, { label: string; color: string }> = {
    running: { label: t('operations.dashboard.statusRunning'), color: 'green' },
    completed: { label: t('operations.dashboard.statusCompleted'), color: 'blue' },
    developing: { label: t('operations.dashboard.statusDeveloping'), color: 'orange' },
  };

  const columns = [
    { title: '#', dataIndex: 'projectName', width: 50, render: (_: string, __: ProjectRoiDetail, idx: number) => (
      <span className={`proj-rank-badge ${idx < 3 ? 'top' : ''}`}>{idx + 1}</span>
    )},
    { title: t('operations.roiAnalysis.projectName'), dataIndex: 'projectName', width: 200 },
    { title: t('common.status'), dataIndex: 'status', width: 100,
      render: (s: string) => {
        const info = statusMap[s] || { label: s, color: 'grey' };
        return <Tag color={info.color as any} size="small">{info.label}</Tag>;
      }
    },
    { title: t('operations.roiAnalysis.investmentCost'), dataIndex: 'investmentCost', width: 130,
      render: (v: number) => `$${(v / 1000).toFixed(0)}K` },
    { title: t('operations.roiAnalysis.savedCost'), dataIndex: 'savedCost', width: 130,
      render: (v: number) => `$${(v / 1000).toFixed(0)}K` },
    { title: 'ROI', dataIndex: 'roi', width: 80, render: (v: number) => (
      <span style={{ color: v >= 200 ? COLORS.textSuccess : v >= 100 ? COLORS.textPrimary : COLORS.textWarning, fontWeight: 600 }}>{v}%</span>
    )},
    { title: t('operations.roiAnalysis.reqCount'), dataIndex: 'requirementCount', width: 100 },
  ];

  return (
    <div className="project-roi-section dashboard-card">
      <div className="dashboard-card-header">
        <span className="dashboard-card-title">{t('operations.roiAnalysis.projectRoi')}</span>
      </div>
      <Table columns={columns} dataSource={data} rowKey="projectName" size="small" pagination={false} />
    </div>
  );
};

export default ProjectRoiSection;
