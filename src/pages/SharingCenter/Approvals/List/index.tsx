import { useEffect, useMemo, useState } from 'react';
import {
  Typography, Tabs, Table, Button, Modal, Toast,
  Input, Select, DatePicker, Pagination, Empty, Banner,
} from '@douyinfe/semi-ui';
import { Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import noDataImg from '@/assets/empty-state/no-data.png';
import noResultImg from '@/assets/empty-state/no-result.png';
import { ShareAsset, getPendingApprovals, getApprovalHistory, pendingCount, getLastDecision } from '../../shared/mockData';
import { approveAsset, rejectAsset, subscribe } from '@/pages/SharingCenter/MyShared/store';
import StatusTag from '@/components/sharing/StatusTag';
import RejectReasonDialog from '@/components/sharing/RejectReasonDialog';
import './index.less';

const { Title, Text } = Typography;
const TabPane = Tabs.TabPane;

type TabKey = 'pending' | 'history';
type ResultFilter = 'ALL' | 'PUBLISHED' | 'REJECTED';
type TypeFilter = 'ALL' | 'WORKFLOW' | 'KNOWLEDGE';

const PAGE_SIZE = 20;

function formatDuration(submittedAt: string, decidedAt: string): string {
  const start = new Date(submittedAt).getTime();
  const end = new Date(decidedAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return '—';
  const hours = Math.round((end - start) / (1000 * 60 * 60));
  if (hours < 24) return `${Math.max(hours, 1)}h`;
  return `${Math.round(hours / 24)}d`;
}

const ApprovalsListPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const initial = (params.get('tab') as TabKey) || 'pending';
  const [tab, setTab] = useState<TabKey>(initial);

  const [pending, setPending] = useState<ShareAsset[]>(() => getPendingApprovals());
  const [history, setHistory] = useState<ShareAsset[]>(() => getApprovalHistory());
  const [pendingTotal, setPendingTotal] = useState<number>(() => pendingCount());

  useEffect(() => subscribe(() => {
    setPending(getPendingApprovals());
    setHistory(getApprovalHistory());
    setPendingTotal(pendingCount());
  }), []);

  // ============ 待审批筛选 ============
  const [pType, setPType] = useState<TypeFilter>('ALL');
  const [pKw, setPKw] = useState('');
  const [pPage, setPPage] = useState(1);
  const [rejectTarget, setRejectTarget] = useState<ShareAsset | null>(null);

  // ============ 历史筛选 ============
  const [hResult, setHResult] = useState<ResultFilter>('ALL');
  const [hType, setHType] = useState<TypeFilter>('ALL');
  const [hRange, setHRange] = useState<[Date, Date] | null>(null);
  const [hPage, setHPage] = useState(1);

  const handleTabChange = (k: string) => {
    setTab(k as TabKey);
    setParams({ tab: k });
  };

  const pendingFiltered = useMemo(() => {
    return pending.filter((a) => {
      if (pType !== 'ALL' && a.type !== pType) return false;
      if (pKw && !a.name.toLowerCase().includes(pKw.toLowerCase())) return false;
      return true;
    });
  }, [pending, pType, pKw]);
  const pendingPage = pendingFiltered.slice((pPage - 1) * PAGE_SIZE, pPage * PAGE_SIZE);

  const historyFiltered = useMemo(() => {
    return history.filter((a) => {
      if (hResult !== 'ALL' && a.shareStatus !== hResult) return false;
      if (hType !== 'ALL' && a.type !== hType) return false;
      if (hRange) {
        const ev = getLastDecision(a);
        const at = (ev?.at || a.submittedAt).slice(0, 10);
        const t0 = hRange[0].toISOString().slice(0, 10);
        const t1 = hRange[1].toISOString().slice(0, 10);
        if (at < t0 || at > t1) return false;
      }
      return true;
    });
  }, [history, hResult, hType, hRange]);
  const historyPage = historyFiltered.slice((hPage - 1) * PAGE_SIZE, hPage * PAGE_SIZE);

  useEffect(() => { setPPage(1); }, [pType, pKw]);
  useEffect(() => { setHPage(1); }, [hResult, hType, hRange]);

  // ============ 操作 ============
  const goDetail = (row: ShareAsset) => navigate(`/sharing-center/approvals/${row.id}`);

  const doApprove = (row: ShareAsset) => {
    const r = approveAsset(row.id);
    if (!r.ok) Toast.warning(t('sharing.approvals.toast.conflict'));
    else Toast.success(t('sharing.approvals.toast.approved'));
  };

  const handleApprove = (row: ShareAsset) => {
    Modal.confirm({
      title: t('sharing.approvals.confirmApproveTitle'),
      content: t('sharing.approvals.confirmApproveContent', { name: row.name }),
      onOk: () => doApprove(row),
    });
  };

  const handleReject = (reason: string) => {
    if (!rejectTarget) return;
    const r = rejectAsset(rejectTarget.id, reason);
    if (!r.ok) {
      Toast.warning(t('sharing.approvals.toast.conflict'));
    } else {
      // BR-APR-004a/b：按来源分流提示
      const key = rejectTarget.source === 'DEV_CENTER'
        ? 'sharing.approvals.toast.rejectedDevCenter'
        : 'sharing.approvals.toast.rejectedNative';
      Toast.success(t(key));
    }
    setRejectTarget(null);
  };

  // ============ 列 ============
  const baseColumns = [
    {
      title: t('sharing.approvals.col.name'),
      dataIndex: 'name',
      width: 280,
      ellipsis: { showTitle: true },
      render: (v: string, row: ShareAsset) => (
        <Button theme="borderless" type="primary" onClick={() => goDetail(row)} style={{ padding: 0, maxWidth: '100%' }}>
          <Text ellipsis={{ showTooltip: true }} style={{ maxWidth: 240 }}>{v}</Text>
        </Button>
      ),
    },
    {
      title: t('sharing.approvals.col.assetType'),
      dataIndex: 'type',
      width: 110,
      render: (v: string) => t(`sharing.market.tabs.${v}`),
    },
    {
      title: t('sharing.approvals.col.creator'),
      dataIndex: 'creatorName',
      width: 180,
      render: (v: string, row: ShareAsset) => (
        <span><Text>{v}</Text> <Text type="tertiary"> · {row.departmentName}</Text></span>
      ),
    },
  ];

  const pendingColumns = [
    ...baseColumns,
    { title: t('sharing.approvals.col.submittedAt'), dataIndex: 'submittedAt', width: 140 },
    {
      title: t('sharing.approvals.col.action'),
      width: 200,
      fixed: 'right' as const,
      align: 'center' as const,
      render: (_: unknown, row: ShareAsset) => (
        <div onClick={(e) => e.stopPropagation()} style={{ display: 'inline-flex', gap: 4 }}>
          <Button size="small" theme="borderless" type="primary" onClick={() => goDetail(row)}>
            {t('sharing.approvals.actions.view')}
          </Button>
          <Button size="small" theme="light" type="primary" onClick={() => handleApprove(row)}>
            {t('sharing.approvals.actions.approve')}
          </Button>
          <Button size="small" theme="borderless" type="danger" onClick={() => setRejectTarget(row)}>
            {t('sharing.approvals.actions.reject')}
          </Button>
        </div>
      ),
    },
  ];

  const historyColumns = [
    ...baseColumns,
    {
      title: t('sharing.approvals.col.result'),
      dataIndex: 'shareStatus',
      width: 110,
      render: (v: 'PUBLISHED' | 'REJECTED') => <StatusTag status={v} />,
    },
    {
      title: t('sharing.approvals.col.duration'),
      width: 90,
      render: (_: unknown, row: ShareAsset) => {
        const ev = getLastDecision(row);
        return ev ? formatDuration(row.submittedAt, ev.at) : '—';
      },
    },
    {
      title: t('sharing.approvals.col.comment'),
      width: 220,
      ellipsis: { showTitle: true },
      render: (_: unknown, row: ShareAsset) => {
        const ev = getLastDecision(row);
        return <Text type="tertiary" ellipsis={{ showTooltip: true }}>{ev?.comment || '—'}</Text>;
      },
    },
    {
      title: t('sharing.approvals.col.decidedAt'),
      width: 140,
      render: (_: unknown, row: ShareAsset) => getLastDecision(row)?.at || row.submittedAt,
    },
    {
      title: t('sharing.approvals.col.action'),
      width: 80,
      fixed: 'right' as const,
      align: 'center' as const,
      render: (_: unknown, row: ShareAsset) => (
        <Button size="small" theme="borderless" type="primary" onClick={(e) => { e.stopPropagation(); goDetail(row); }}>
          {t('sharing.approvals.actions.view')}
        </Button>
      ),
    },
  ];

  const tabLabel = (k: TabKey, count: number) =>
    `${t(`sharing.approvals.tabs.${k}`)}${count > 0 ? ` (${count})` : ''}`;

  const clearHistoryFilters = () => {
    setHResult('ALL'); setHType('ALL'); setHRange(null);
  };
  const hasHistoryFilter = hResult !== 'ALL' || hType !== 'ALL' || !!hRange;

  const typeOptions = [
    { label: t('common.all'), value: 'ALL' },
    { label: t('sharing.market.tabs.WORKFLOW'), value: 'WORKFLOW' },
    { label: t('sharing.market.tabs.KNOWLEDGE'), value: 'KNOWLEDGE' },
  ];

  return (
    <div className="approvals-list-page app-layout-content-card">
      <div className="approvals-header">
        <Title heading={3} className="title">{t('sharing.approvals.pageTitle')}</Title>
      </div>

      <Banner
        type="info"
        closeIcon={null}
        description={t('sharing.mvpDisabledBanner.approvals')}
        style={{ marginBottom: 12 }}
      />

      <Tabs activeKey={tab} onChange={handleTabChange} className="approvals-tabs" keepDOM={false}>
        <TabPane itemKey="pending" tab={tabLabel('pending', pendingTotal)} />
        <TabPane itemKey="history" tab={tabLabel('history', history.length)} />
      </Tabs>

      {tab === 'pending' ? (
        <>
          <div className="approvals-toolbar">
            <Input
              prefix={<Search size={14} strokeWidth={2} />}
              placeholder={t('sharing.approvals.filter.search')}
              value={pKw}
              onChange={setPKw}
              showClear
              style={{ width: 320 }}
            />
            <Select
              prefix={t('sharing.approvals.filter.assetType')}
              value={pType}
              onChange={(v) => setPType(v as TypeFilter)}
              style={{ width: 200 }}
              optionList={typeOptions}
            />
          </div>

          <div className="approvals-body">
            <Table
              size="small"
              columns={pendingColumns}
              dataSource={pendingPage}
              rowKey="id"
              pagination={false}
              scroll={{ x: 'max-content', y: '100%' }}
              empty={
                <Empty
                  image={<img src={noDataImg} alt="" style={{ width: 96 }} />}
                  title={t('sharing.approvals.empty.pending')}
                  style={{ padding: '42px 0' }}
                />
              }
            />
          </div>
          {pendingFiltered.length > PAGE_SIZE && (
            <div className="list-pagination">
              <Pagination
                total={pendingFiltered.length}
                pageSize={PAGE_SIZE}
                currentPage={pPage}
                onPageChange={setPPage}
                showTotal
              />
            </div>
          )}
        </>
      ) : (
        <>
          <div className="approvals-toolbar approvals-toolbar-history">
            <Select
              prefix={t('sharing.approvals.filter.result')}
              value={hResult}
              onChange={(v) => setHResult(v as ResultFilter)}
              style={{ width: 180 }}
              optionList={[
                { label: t('common.all'), value: 'ALL' },
                { label: t('sharing.status.PUBLISHED'), value: 'PUBLISHED' },
                { label: t('sharing.status.REJECTED'), value: 'REJECTED' },
              ]}
            />
            <Select
              prefix={t('sharing.approvals.filter.assetType')}
              value={hType}
              onChange={(v) => setHType(v as TypeFilter)}
              style={{ width: 200 }}
              optionList={typeOptions}
            />
            <DatePicker
              type="dateRange"
              value={hRange ?? undefined}
              onChange={(v) => setHRange(v as [Date, Date] | null)}
              style={{ width: 240 }}
            />
            {hasHistoryFilter && (
              <Button theme="borderless" icon={<X size={14} strokeWidth={2} />} onClick={clearHistoryFilters}>
                {t('sharing.approvals.filter.clear')}
              </Button>
            )}
          </div>

          <div className="approvals-body">
            <Table
              size="small"
              columns={historyColumns}
              dataSource={historyPage}
              rowKey="id"
              pagination={false}
              scroll={{ x: 'max-content', y: '100%' }}
              empty={
                <Empty
                  image={<img src={hasHistoryFilter ? noResultImg : noDataImg} alt="" style={{ width: 96 }} />}
                  title={t(hasHistoryFilter ? 'sharing.approvals.empty.noResult' : 'sharing.approvals.empty.history')}
                  style={{ padding: '42px 0' }}
                />
              }
            />
          </div>
          {historyFiltered.length > PAGE_SIZE && (
            <div className="list-pagination">
              <Pagination
                total={historyFiltered.length}
                pageSize={PAGE_SIZE}
                currentPage={hPage}
                onPageChange={setHPage}
                showTotal
              />
            </div>
          )}
        </>
      )}

      <RejectReasonDialog
        visible={!!rejectTarget}
        assetName={rejectTarget?.name}
        onSubmit={handleReject}
        onCancel={() => setRejectTarget(null)}
      />
    </div>
  );
};

export default ApprovalsListPage;
