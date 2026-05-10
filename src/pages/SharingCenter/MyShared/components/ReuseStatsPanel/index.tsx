import { useMemo, useState } from 'react';
import { SideSheet, Typography, Select, Table, Empty, Tag } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import type { ReuseRecord } from '@/pages/Sharing/Market/types';
import emptyImg from '@/assets/empty-state/no-data.png';
import './index.less';

const { Text, Title } = Typography;

type Range = 'all' | 'month' | 'week';

interface Props {
  visible: boolean;
  onCancel: () => void;
  /** 复用记录（可来自单一资产或聚合） */
  records: ReuseRecord[];
  /** 标题前缀，例如资产名称 */
  assetName?: string;
}

const inRange = (iso: string, range: Range) => {
  if (range === 'all') return true;
  const d = new Date(iso).getTime();
  const days = range === 'week' ? 7 : 30;
  return Date.now() - d <= days * 24 * 3600 * 1000;
};

const PAGE_SIZE = 10;

const ReuseStatsPanel = ({ visible, onCancel, records, assetName }: Props) => {
  const { t } = useTranslation();
  const [range, setRange] = useState<Range>('all');
  const [page, setPage] = useState(1);

  const filtered = useMemo(
    () => records
      .filter((r) => inRange(r.reusedAt, range))
      .sort((a, b) => b.reusedAt.localeCompare(a.reusedAt)),
    [records, range],
  );

  const total = records.length;
  const monthCount = useMemo(() => records.filter((r) => inRange(r.reusedAt, 'month')).length, [records]);
  const weekCount = useMemo(() => records.filter((r) => inRange(r.reusedAt, 'week')).length, [records]);

  const columns = [
    { title: t('sharing.myShared.reuseStats.colReuser'), dataIndex: 'reuserName', width: 120 },
    { title: t('sharing.myShared.reuseStats.colDept'), dataIndex: 'reuserDept', width: 140, render: (v: string) => v || '—' },
    {
      title: t('sharing.myShared.reuseStats.colTime'),
      dataIndex: 'reusedAt',
      width: 120,
    },
    { title: t('sharing.myShared.reuseStats.colVersion'), dataIndex: 'versionNumber', width: 100 },
    {
      title: t('sharing.myShared.reuseStats.colType'),
      dataIndex: 'reuseType',
      width: 100,
      render: (v: string) => (
        <Tag size="small" color={v === 'ADAPTATION' ? 'orange' : 'blue'}>
          {v === 'ADAPTATION'
            ? t('sharing.myShared.reuseStats.typeAdaptation')
            : t('sharing.myShared.reuseStats.typeDirect')}
        </Tag>
      ),
    },
    {
      title: t('sharing.myShared.reuseStats.colNote'),
      dataIndex: 'adaptationNote',
      ellipsis: { showTitle: false },
      render: (v?: string) => v || '—',
    },
  ];

  return (
    <SideSheet
      width={900}
      mask={false}
      visible={visible}
      onCancel={onCancel}
      title={assetName
        ? t('sharing.myShared.reuseStats.titleWithName', { name: assetName })
        : t('sharing.myShared.reuseStats.title')}
      bodyStyle={{ padding: 24 }}
      className="reuse-stats-panel"
    >
      <div className="reuse-stats-toolbar">
        <Select
          value={range}
          onChange={(v) => { setRange(v as Range); setPage(1); }}
          insetLabel={t('sharing.myShared.reuseStats.timeRange')}
          style={{ width: 180 }}
          optionList={[
            { value: 'all', label: t('sharing.myShared.reuseStats.rangeAll') },
            { value: 'month', label: t('sharing.myShared.reuseStats.rangeMonth') },
            { value: 'week', label: t('sharing.myShared.reuseStats.rangeWeek') },
          ]}
        />
      </div>

      <div className="reuse-stats-cards">
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
          image={<img src={emptyImg} alt="empty" style={{ width: 120, height: 120 }} />}
          description={t('sharing.myShared.reuseStats.empty')}
          style={{ padding: '48px 0' }}
        />
      ) : (
        <Table
          size="small"
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          pagination={{
            pageSize: PAGE_SIZE,
            currentPage: page,
            onPageChange: setPage,
            total: filtered.length,
          }}
        />
      )}
    </SideSheet>
  );
};

export default ReuseStatsPanel;
