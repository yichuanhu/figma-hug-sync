import { useMemo, useState } from 'react';
import { SideSheet, Typography, Select, Table, Empty, Tag } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import type { ReuseRecord, AssetType } from '@/pages/Sharing/Market/types';
import { resolveUsageKind } from '@/pages/Sharing/Market/types';
import emptyImg from '@/assets/empty-state/no-data.png';
import './index.less';

const { Text, Title } = Typography;

type Range = 'all' | 'month' | 'week';

interface Props {
  visible: boolean;
  onCancel: () => void;
  /** 使用记录（流程=复用 / 知识=下载） */
  records: ReuseRecord[];
  /** 标题前缀，例如资产名称 */
  assetName?: string;
  /** 资产类型；用于在「复用 / 下载」语义间切换 */
  assetType?: AssetType;
}

const inRange = (iso: string, range: Range) => {
  if (range === 'all') return true;
  const d = new Date(iso).getTime();
  const days = range === 'week' ? 7 : 30;
  return Date.now() - d <= days * 24 * 3600 * 1000;
};

const PAGE_SIZE = 10;

const ReuseStatsPanel = ({ visible, onCancel, records, assetName, assetType }: Props) => {
  const { t } = useTranslation();
  const [range, setRange] = useState<Range>('all');
  const [page, setPage] = useState(1);
  const isDownload = assetType ? resolveUsageKind(assetType) === 'DOWNLOAD' : false;

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
    {
      title: t(isDownload ? 'sharing.assetSupply.reuseStats.colDownloader' : 'sharing.assetSupply.reuseStats.colReuser'),
      dataIndex: 'reuserName',
      width: 120,
    },
    { title: t('sharing.assetSupply.reuseStats.colDept'), dataIndex: 'reuserDept', width: 140, render: (v: string) => v || '—' },
    {
      title: t(isDownload ? 'sharing.assetSupply.reuseStats.colDownloadTime' : 'sharing.assetSupply.reuseStats.colTime'),
      dataIndex: 'reusedAt',
      width: 120,
    },
    ...(isDownload ? [] : [{ title: t('sharing.assetSupply.reuseStats.colVersion'), dataIndex: 'versionNumber', width: 100 }]),
    ...(isDownload ? [] : [{
      title: t('sharing.assetSupply.reuseStats.colType'),
      dataIndex: 'reuseType',
      width: 100,
      render: (v: string) => (
        <Tag size="small" color={v === 'ADAPTATION' ? 'orange' : 'blue'}>
          {v === 'ADAPTATION'
            ? t('sharing.assetSupply.reuseStats.typeAdaptation')
            : t('sharing.assetSupply.reuseStats.typeDirect')}
        </Tag>
      ),
    }]),
  ];

  return (
    <SideSheet
      width={900}
      mask={false}
      visible={visible}
      onCancel={onCancel}
      title={assetName
        ? t(isDownload ? 'sharing.assetSupply.reuseStats.downloadTitleWithName' : 'sharing.assetSupply.reuseStats.titleWithName', { name: assetName })
        : t(isDownload ? 'sharing.assetSupply.reuseStats.downloadTitle' : 'sharing.assetSupply.reuseStats.title')}
      bodyStyle={{ padding: 24 }}
      className="reuse-stats-panel"
    >
      <div className="reuse-stats-toolbar">
        <Select
          value={range}
          onChange={(v) => { setRange(v as Range); setPage(1); }}
          insetLabel={t('sharing.assetSupply.reuseStats.timeRange')}
          style={{ width: 180 }}
          optionList={[
            { value: 'all', label: t('sharing.assetSupply.reuseStats.rangeAll') },
            { value: 'month', label: t('sharing.assetSupply.reuseStats.rangeMonth') },
            { value: 'week', label: t('sharing.assetSupply.reuseStats.rangeWeek') },
          ]}
        />
      </div>

      <div className="reuse-stats-cards">
        <div className="stat-cell">
          <Text size="small" type="tertiary">{t(isDownload ? 'sharing.assetSupply.reuseStats.downloadTotal' : 'sharing.assetSupply.reuseStats.total')}</Text>
          <Title heading={3} style={{ margin: 0 }}>{total}</Title>
        </div>
        <div className="stat-cell">
          <Text size="small" type="tertiary">{t('sharing.assetSupply.reuseStats.thisMonth')}</Text>
          <Title heading={3} style={{ margin: 0 }}>{monthCount}</Title>
        </div>
        <div className="stat-cell">
          <Text size="small" type="tertiary">{t('sharing.assetSupply.reuseStats.thisWeek')}</Text>
          <Title heading={3} style={{ margin: 0 }}>{weekCount}</Title>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Empty
          image={<img src={emptyImg} alt="empty" style={{ width: 120, height: 120 }} />}
          description={t(isDownload ? 'sharing.assetSupply.reuseStats.emptyDownload' : 'sharing.assetSupply.reuseStats.empty')}
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
