import { useMemo, useState } from 'react';
import { Card, Typography, Select, Table, Empty } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import type { ReuseRecord } from '@/pages/Sharing/Market/types';
import emptyImg from '@/assets/empty-state/no-data.png';

const { Text, Title } = Typography;

interface Props {
  records: ReuseRecord[];
  // 可选：传入资产名/版本上下文用于显示
}

type Range = 'all' | 'month' | 'week';

const inRange = (iso: string, range: Range) => {
  if (range === 'all') return true;
  const d = new Date(iso).getTime();
  const now = Date.now();
  const days = range === 'week' ? 7 : 30;
  return now - d <= days * 24 * 3600 * 1000;
};

const ReuseSummaryPanel = ({ records }: Props) => {
  const { t } = useTranslation();
  const [range, setRange] = useState<Range>('all');
  const [page, setPage] = useState(1);

  const filtered = useMemo(
    () => records.filter((r) => inRange(r.reusedAt, range))
      .sort((a, b) => b.reusedAt.localeCompare(a.reusedAt)),
    [records, range],
  );

  const total = records.length;
  const monthCount = useMemo(() => records.filter((r) => inRange(r.reusedAt, 'month')).length, [records]);
  const weekCount = useMemo(() => records.filter((r) => inRange(r.reusedAt, 'week')).length, [records]);

  const columns = [
    { title: t('sharing.myShared.reuseStats.colReuser'), dataIndex: 'reuserName', width: 140 },
    { title: t('sharing.myShared.reuseStats.colVersion'), dataIndex: 'versionNumber', width: 100 },
    { title: t('sharing.myShared.reuseStats.colTime'), dataIndex: 'reusedAt', width: 140 },
    { title: '复用方式', dataIndex: 'reuseType', width: 100 },
    { title: '适配说明', dataIndex: 'adaptationNote', ellipsis: { showTitle: false } },
  ];

  return (
    <Card className="reuse-summary-panel" bodyStyle={{ padding: 16 }}>
      <div className="reuse-summary-head">
        <Title heading={6} style={{ margin: 0 }}>{t('sharing.myShared.reuseStats.title')}</Title>
        <Select
          value={range}
          onChange={(v) => { setRange(v as Range); setPage(1); }}
          insetLabel={t('sharing.myShared.reuseStats.timeRange')}
          style={{ width: 160 }}
          optionList={[
            { value: 'all', label: t('sharing.myShared.reuseStats.rangeAll') },
            { value: 'month', label: t('sharing.myShared.reuseStats.rangeMonth') },
            { value: 'week', label: t('sharing.myShared.reuseStats.rangeWeek') },
          ]}
        />
      </div>
      <div className="reuse-summary-stats">
        <div className="stat-cell">
          <Text size="small" type="tertiary">{t('sharing.myShared.reuseStats.total')}</Text>
          <Title heading={3} style={{ margin: 0 }}>{total}</Title>
        </div>
        <div className="stat-cell">
          <Text size="small" type="tertiary">{t('sharing.myShared.reuseStats.thisMonth')}</Text>
          <Title heading={3} style={{ margin: 0 }}>{monthCount}</Title>
        </div>
        <div className="stat-cell">
          <Text size="small" type="tertiary">{t('sharing.myShared.reuseStats.thisWeek')}</Text>
          <Title heading={3} style={{ margin: 0 }}>{weekCount}</Title>
        </div>
      </div>
      {filtered.length === 0 ? (
        <Empty
          image={<img src={emptyImg} alt="empty" style={{ width: 96, height: 96 }} />}
          description={t('sharing.myShared.reuseStats.empty')}
          style={{ padding: '24px 0' }}
        />
      ) : (
        <Table
          size="small"
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          pagination={{ pageSize: 5, currentPage: page, onPageChange: setPage, total: filtered.length }}
        />
      )}
    </Card>
  );
};

export default ReuseSummaryPanel;
