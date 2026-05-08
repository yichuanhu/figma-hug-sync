import { useEffect, useMemo, useState } from 'react';
import {
  Typography, Tabs, Table, Button, Space, Modal, Toast,
  Input, Select, DatePicker, Pagination, RadioGroup, Radio, Empty,
} from '@douyinfe/semi-ui';
import { Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import noDataImg from '@/assets/empty-state/no-data.png';
import noResultImg from '@/assets/empty-state/no-result.png';
import { ShareAsset, getPendingApprovals, getApprovalHistory, pendingCount } from '../../shared/mockData';
import { approveAsset, rejectAsset, batchApprove, subscribe } from '@/pages/SharingCenter/MyShared/store';
import StatusTag from '@/components/sharing/StatusTag';
import SourceBadge from '@/components/sharing/SourceBadge';
import RejectReasonDialog from '@/components/sharing/RejectReasonDialog';
import './index.less';

const { Title, Text } = Typography;
const TabPane = Tabs.TabPane;

type TabKey = 'pending' | 'history';
type SourceFilter = 'ALL' | 'NATIVE' | 'DEV_CENTER';
type ResultFilter = 'ALL' | 'PUBLISHED' | 'REJECTED';
type TypeFilter = 'ALL' | 'SNIPPET' | 'WORKFLOW' | 'KNOWLEDGE' | 'SKILL';

const PAGE_SIZE = 20;

const ApprovalsListPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const initial = (params.get('tab') as TabKey) || 'pending';
  const [tab, setTab] = useState<TabKey>(initial);

  // store 数据（订阅刷新）
  const [pending, setPending] = useState<ShareAsset[]>(() => getPendingApprovals());
  const [history, setHistory] = useState<ShareAsset[]>(() => getApprovalHistory());
  const [pendingTotal, setPendingTotal] = useState<number>(() => pendingCount());

  useEffect(() => subscribe(() => {
    setPending(getPendingApprovals());
    setHistory(getApprovalHistory());
    setPendingTotal(pendingCount());
  }), []);

  // ============ 待审批筛选 ============
  const [pSource, setPSource] = useState<SourceFilter>('ALL');
  const [pKw, setPKw] = useState('');
  const [pPage, setPPage] = useState(1);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [rejectTarget, setRejectTarget] = useState<ShareAsset | null>(null);
  const [batchVisible, setBatchVisible] = useState(false);

  // ============ 历史筛选 ============
  const [hResult, setHResult] = useState<ResultFilter>('ALL');
  const [hType, setHType] = useState<TypeFilter>('ALL');
  const [hSource, setHSource] = useState<SourceFilter>('ALL');
  const [hRange, setHRange] = useState<[Date, Date] | null>(null);
  const [hPage, setHPage] = useState(1);

  const handleTabChange = (k: string) => {
    setTab(k as TabKey);
    setParams({ tab: k });
  };

  // ============ 派生数据 ============
  const pendingFiltered = useMemo(() => {
    return pending.filter((a) => {
      if (pSource !== 'ALL' && a.source !== pSource) return false;
      if (pKw && !a.name.toLowerCase().includes(pKw.toLowerCase())) return false;
      return true;
    });
  }, [pending, pSource, pKw]);
  const pendingPage = pendingFiltered.slice((pPage - 1) * PAGE_SIZE, pPage * PAGE_SIZE);

  const historyFiltered = useMemo(() => {
    return history.filter((a) => {
      if (hResult !== 'ALL' && a.shareStatus !== hResult) return false;
      if (hType !== 'ALL' && a.type !== hType) return false;
      if (hSource !== 'ALL' && a.source !== hSource) return false;
      if (hRange) {
        const ev = a.approvalEvents[a.approvalEvents.length - 1];
        const at = ev?.at || a.submittedAt;
        const t0 = hRange[0].toISOString().slice(0, 10);
        const t1 = hRange[1].toISOString().slice(0, 10);
        if (at < t0 || at > t1) return false;
      }
      return true;
    });
  }, [history, hResult, hType, hSource, hRange]);
  const historyPage = historyFiltered.slice((hPage - 1) * PAGE_SIZE, hPage * PAGE_SIZE);

  useEffect(() => { setPPage(1); setSelectedKeys([]); }, [pSource, pKw]);
  useEffect(() => { setHPage(1); }, [hResult, hType, hSource, hRange]);

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
    if (!r.ok) Toast.warning(t('sharing.approvals.toast.conflict'));
    else Toast.success(t('sharing.approvals.toast.rejected'));
    setRejectTarget(null);
  };

  const doBatchApprove = () => {
    const r = batchApprove(selectedKeys);
    Toast.success(t('sharing.approvals.toast.batchApproved', { n: r.approved }));
    setSelectedKeys([]);
    setBatchVisible(false);
  };

  // ============ 列 ============
  const baseColumns = [
    {
      title: t('sharing.approvals.col.name'),
      dataIndex: 'name',
      ellipsis: { showTitle: true },
      render: (v: string, row: ShareAsset) => (
        <Button theme="borderless" type="primary" onClick={() => goDetail(row)} style={{ padding: 0 }}>
          {v}
        </Button>
      ),
    },
    {
      title: t('sharing.approvals.col.assetType'),
      dataIndex: 'type',
      width: 96,
      render: (v: string) => t(`sharing.market.tabs.${v}`),
    },
    {
      title: t('sharing.approvals.col.source'),
      dataIndex: 'source',
      width: 120,
      render: (v: 'NATIVE' | 'DEV_CENTER') => <SourceBadge source={v} />,
    },
    {
      title: t('sharing.approvals.col.creator'),
      dataIndex: 'creatorName',
      width: 160,
      render: (v: string, row: ShareAsset) => (
        <span><Text>{v}</Text> <Text type="tertiary"> · {row.departmentName}</Text></span>
      ),
    },
  ];

  const pendingColumns = [
    ...baseColumns,
    { title: t('sharing.approvals.col.submittedAt'), dataIndex: 'submittedAt', width: 120 },
    {
      title: t('sharing.approvals.col.action'),
      width: 200,
      fixed: 'right' as const,
      render: (_: unknown, row: ShareAsset) => (
        <Space spacing={4} onClick={(e) => e.stopPropagation()}>
          <Button size="small" theme="borderless" type="primary" onClick={() => goDetail(row)}>
            {t('sharing.approvals.actions.view')}
          </Button>
          <Button size="small" theme="light" type="primary" onClick={() => handleApprove(row)}>
            {t('sharing.approvals.actions.approve')}
          </Button>
          <Button size="small" theme="borderless" type="danger" onClick={() => setRejectTarget(row)}>
            {t('sharing.approvals.actions.reject')}
          </Button>
        </Space>
      ),
    },
  ];

  const historyColumns = [
    ...baseColumns,
    {
      title: t('sharing.approvals.col.result'),
      dataIndex: 'shareStatus',
      width: 120,
      render: (v: 'PUBLISHED' | 'REJECTED') => <StatusTag status={v} />,
    },
    {
      title: t('sharing.approvals.col.comment'),
      width: 220,
      ellipsis: { showTitle: true },
      render: (_: unknown, row: ShareAsset) => {
        const last = row.approvalEvents[row.approvalEvents.length - 1];
        return <Text type="tertiary" ellipsis={{ showTooltip: true }}>{last?.comment || '—'}</Text>;
      },
    },
    {
      title: t('sharing.approvals.col.decidedAt'),
      width: 120,
      render: (_: unknown, row: ShareAsset) => {
        const last = row.approvalEvents[row.approvalEvents.length - 1];
        return last?.at || row.submittedAt;
      },
    },
    {
      title: t('sharing.approvals.col.action'),
      width: 80,
      fixed: 'right' as const,
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
    setHResult('ALL'); setHType('ALL'); setHSource('ALL'); setHRange(null);
  };
  const hasHistoryFilter = hResult !== 'ALL' || hType !== 'ALL' || hSource !== 'ALL' || !!hRange;

  return (
    <div className="approvals-list-page app-layout-content-card">
      <div className="approvals-header">
        <Title heading={3} className="title">{t('sharing.approvals.pageTitle')}</Title>
      </div>

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
            <RadioGroup type="button" value={pSource} onChange={(e) => setPSource(e.target.value)}>
              <Radio value="ALL">{t('sharing.approvals.filter.sourceAll')}</Radio>
              <Radio value="NATIVE">{t('sharing.approvals.filter.sourceNative')}</Radio>
              <Radio value="DEV_CENTER">{t('sharing.approvals.filter.sourceDev')}</Radio>
            </RadioGroup>
          </div>

          {selectedKeys.length > 0 && (
            <div className="approvals-batch-bar">
              <Text>
                {t('sharing.approvals.batch.selected', { n: selectedKeys.length })}
              </Text>
              <Space spacing={8}>
                <Button theme="borderless" onClick={() => setSelectedKeys([])}>
                  {t('sharing.approvals.batch.clear')}
                </Button>
                <Button theme="solid" type="primary" onClick={() => setBatchVisible(true)}>
                  {t('sharing.approvals.batch.approve')}
                </Button>
              </Space>
            </div>
          )}

          <div className="approvals-body">
            <Table
              size="small"
              columns={pendingColumns}
              dataSource={pendingPage}
              rowKey="id"
              pagination={false}
              rowSelection={{
                selectedRowKeys: selectedKeys,
                onChange: (keys) => setSelectedKeys((keys as string[]) || []),
              }}
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
              prefix={t('sharing.approvals.filter.type')}
              value={hType}
              onChange={(v) => setHType(v as TypeFilter)}
              style={{ width: 180 }}
              optionList={[
                { label: t('common.all'), value: 'ALL' },
                { label: t('sharing.market.tabs.SNIPPET'), value: 'SNIPPET' },
                { label: t('sharing.market.tabs.WORKFLOW'), value: 'WORKFLOW' },
                { label: t('sharing.market.tabs.KNOWLEDGE'), value: 'KNOWLEDGE' },
                { label: t('sharing.market.tabs.SKILL'), value: 'SKILL' },
              ]}
            />
            <Select
              prefix={t('sharing.approvals.filter.source')}
              value={hSource}
              onChange={(v) => setHSource(v as SourceFilter)}
              style={{ width: 180 }}
              optionList={[
                { label: t('common.all'), value: 'ALL' },
                { label: t('sharing.approvals.filter.sourceNative'), value: 'NATIVE' },
                { label: t('sharing.approvals.filter.sourceDev'), value: 'DEV_CENTER' },
              ]}
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

      <Modal
        title={t('sharing.approvals.batch.confirmTitle')}
        visible={batchVisible}
        onOk={doBatchApprove}
        onCancel={() => setBatchVisible(false)}
        okText={t('sharing.approvals.batch.approve')}
        cancelText={t('common.cancel')}
        width={520}
      >
        <Text>{t('sharing.approvals.batch.confirmContent', { n: selectedKeys.length })}</Text>
        <ul className="batch-confirm-list">
          {pending.filter((a) => selectedKeys.includes(a.id)).slice(0, 8).map((a) => (
            <li key={a.id}>{a.name}</li>
          ))}
          {selectedKeys.length > 8 && <li>…</li>}
        </ul>
      </Modal>
    </div>
  );
};

export default ApprovalsListPage;
