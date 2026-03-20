import { Table, Tag } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import type { RequirementRoiItem } from '@/pages/Operations/types';
import './index.less';

interface RequirementRoiRankingProps {
  data: RequirementRoiItem[];
}

const RequirementRoiRanking = ({ data }: RequirementRoiRankingProps) => {
  const { t } = useTranslation();

  const statusMap: Record<string, { label: string; color: string }> = {
    running: { label: t('operations.dashboard.statusRunning'), color: 'green' },
    completed: { label: t('operations.dashboard.statusCompleted'), color: 'blue' },
    developing: { label: t('operations.dashboard.statusDeveloping'), color: 'orange' },
  };

  const columns = [
    {
      title: t('operations.dashboard.rank'),
      dataIndex: 'rank',
      width: 60,
      render: (rank: number) => (
        <span className={`req-rank-badge ${rank <= 3 ? 'top' : ''}`}>{rank}</span>
      ),
    },
    {
      title: t('operations.dashboard.requirementName'),
      dataIndex: 'requirementName',
      width: 200,
    },
    {
      title: t('operations.dashboard.departmentName'),
      dataIndex: 'department',
      width: 100,
    },
    {
      title: 'ROI',
      dataIndex: 'roi',
      width: 80,
      render: (val: number) => `${val}%`,
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      width: 100,
      render: (status: string) => {
        const info = statusMap[status] || { label: status, color: 'grey' };
        return <Tag color={info.color as any} size="small">{info.label}</Tag>;
      },
    },
  ];

  return (
    <div className="req-roi-ranking">
      <div className="req-roi-ranking-title">{t('operations.dashboard.reqRoiRanking')}</div>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="rank"
        size="small"
        pagination={false}
      />
    </div>
  );
};

export default RequirementRoiRanking;
