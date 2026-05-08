import { useState } from 'react';
import { Typography, Tabs, Table, Button, Space, Modal, Toast } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShareAsset, getPendingApprovals, getApprovalHistory } from '../../shared/mockData';
import StatusTag from '@/components/sharing/StatusTag';
import SourceBadge from '@/components/sharing/SourceBadge';
import RejectReasonDialog from '@/components/sharing/RejectReasonDialog';
import './index.less';

const { Title } = Typography;
const TabPane = Tabs.TabPane;

type TabKey = 'pending' | 'history';

const ApprovalsListPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const initial = (params.get('tab') as TabKey) || 'pending';
  const [tab, setTab] = useState<TabKey>(initial);
  const [pending, setPending] = useState<ShareAsset[]>(() => getPendingApprovals());
  const [history, setHistory] = useState<ShareAsset[]>(() => getApprovalHistory());
  const [rejectTarget, setRejectTarget] = useState<ShareAsset | null>(null);

  const handleTabChange = (k: string) => {
    setTab(k as TabKey);
    setParams({ tab: k });
  };

  const handleApprove = (row: ShareAsset) => {
    Modal.confirm({
      title: t('sharing.approvals.confirmApproveTitle'),
      content: t('sharing.approvals.confirmApproveContent', { name: row.name }),
      onOk: () => {
        setPending((prev) => prev.filter((x) => x.id !== row.id));
        setHistory((prev) => [{ ...row, shareStatus: 'PUBLISHED' }, ...prev]);
        Toast.success(t('sharing.approvals.toast.approved'));
      },
    });
  };

  const handleReject = (reason: string) => {
    if (!rejectTarget) return;
    setPending((prev) => prev.filter((x) => x.id !== rejectTarget.id));
    setHistory((prev) => [{ ...rejectTarget, shareStatus: 'REJECTED', rejectedReason: reason }, ...prev]);
    Toast.success(t('sharing.approvals.toast.rejected'));
    setRejectTarget(null);
  };

  const goDetail = (row: ShareAsset) => navigate(`/sharing-center/approvals/${row.id}`);

  const baseColumns = [
    {
      title: t('sharing.approvals.col.assetType'),
      dataIndex: 'type',
      width: 110,
      render: (v: string) => t(`sharing.market.tabs.${v}`),
    },
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
      title: t('sharing.approvals.col.source'),
      dataIndex: 'source',
      width: 120,
      render: (v: 'NATIVE' | 'DEV_CENTER') => <SourceBadge source={v} />,
    },
    { title: t('sharing.approvals.col.creator'), dataIndex: 'creatorName', width: 110 },
    { title: t('sharing.approvals.col.submittedAt'), dataIndex: 'submittedAt', width: 130 },
  ];

  const pendingColumns = [
    ...baseColumns,
    {
      title: t('sharing.approvals.col.action'),
      width: 200,
      fixed: 'right' as const,
      render: (_: unknown, row: ShareAsset) => (
        <Space spacing={4}>
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
      title: t('sharing.approvals.col.action'),
      width: 100,
      fixed: 'right' as const,
      render: (_: unknown, row: ShareAsset) => (
        <Button size="small" theme="borderless" type="primary" onClick={() => goDetail(row)}>
          {t('sharing.approvals.actions.view')}
        </Button>
      ),
    },
  ];

  const tabLabel = (k: TabKey, count: number) =>
    `${t(`sharing.approvals.tabs.${k}`)}${count > 0 ? ` (${count})` : ''}`;

  return (
    <div className="approvals-list-page">
      <div className="approvals-header">
        <Title heading={3} className="title">{t('sharing.approvals.pageTitle')}</Title>
      </div>

      <Tabs activeKey={tab} onChange={handleTabChange} className="approvals-tabs" keepDOM={false}>
        <TabPane itemKey="pending" tab={tabLabel('pending', pending.length)} />
        <TabPane itemKey="history" tab={tabLabel('history', history.length)} />
      </Tabs>

      <div className="approvals-body">
        <Table
          size="small"
          columns={tab === 'pending' ? pendingColumns : historyColumns}
          dataSource={tab === 'pending' ? pending : history}
          rowKey="id"
          pagination={{ pageSize: 10, showTotal: true }}
          empty={t(`sharing.approvals.empty.${tab}`)}
        />
      </div>

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
