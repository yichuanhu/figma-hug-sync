import { useMemo } from 'react';
import { Table } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import ReactECharts from 'echarts-for-react';
import type { DepartmentRoiItem } from '@/pages/Operations/types';
import './index.less';

interface DepartmentRoiRankingProps {
  data: DepartmentRoiItem[];
}

const MiniTrend = ({ data }: { data: number[] }) => {
  const option = useMemo(() => ({
    grid: { left: 0, right: 0, top: 0, bottom: 0 },
    xAxis: { type: 'category', show: false, data: data.map((_, i) => i) },
    yAxis: { type: 'value', show: false },
    series: [{
      type: 'line',
      data,
      smooth: true,
      symbol: 'none',
      lineStyle: { width: 1.5, color: '#165DFF' },
      areaStyle: { color: 'rgba(22, 93, 255, 0.08)' },
    }],
  }), [data]);

  return <ReactECharts option={option} style={{ width: 80, height: 28 }} notMerge />;
};

const DepartmentRoiRanking = ({ data }: DepartmentRoiRankingProps) => {
  const { t } = useTranslation();

  const formatCurrency = (val: number) => {
    if (val >= 10000) return `¥${(val / 10000).toFixed(1)}${t('operations.dashboard.tenThousandUnit')}`;
    return `¥${val.toLocaleString()}`;
  };

  const columns = [
    {
      title: t('operations.dashboard.rank'),
      dataIndex: 'rank',
      width: 60,
      render: (rank: number) => (
        <span className={`dept-rank-badge ${rank <= 3 ? 'top' : ''}`}>{rank}</span>
      ),
    },
    {
      title: t('operations.dashboard.departmentName'),
      dataIndex: 'department',
      width: 120,
    },
    {
      title: t('operations.dashboard.investmentCostLabel'),
      dataIndex: 'investmentCost',
      width: 120,
      render: (val: number) => formatCurrency(val),
    },
    {
      title: t('operations.dashboard.savedCostLabel'),
      dataIndex: 'savedCost',
      width: 120,
      render: (val: number) => formatCurrency(val),
    },
    {
      title: 'ROI',
      dataIndex: 'roi',
      width: 80,
      render: (val: number) => `${val}%`,
    },
    {
      title: t('operations.dashboard.trendLabel'),
      dataIndex: 'trend',
      width: 120,
      render: (trend: number[]) => <MiniTrend data={trend} />,
    },
  ];

  return (
    <div className="dept-roi-ranking">
      <div className="dept-roi-ranking-title">{t('operations.dashboard.deptRoiRanking')}</div>
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

export default DepartmentRoiRanking;
