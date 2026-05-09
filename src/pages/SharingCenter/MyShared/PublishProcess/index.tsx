import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Typography, Button, Tabs, Table, Input, Pagination, Toast, Dropdown, Tooltip, Select,
} from '@douyinfe/semi-ui';
import { IconSearchStroked } from '@douyinfe/semi-icons';
import { ChevronLeft, MoreHorizontal, Send } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import StatusTag, { type ShareStatus } from '@/components/sharing/StatusTag';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import { generateMockRecords } from './mockData';
import { addAsset, findAsset, CURRENT_USER_ID, CURRENT_USER_NAME, CURRENT_USER_DEPT, type ShareAsset } from '../store';
import type { PublishProcessRecord, PublishShareStatus } from './types';
import ProcessDetailDrawer from './components/ProcessDetailDrawer';
import PublishFormModal from './components/PublishFormModal';
import './index.less';

const { Title } = Typography;
const TabPane = Tabs.TabPane;

type TabKey = 'ALL' | PublishShareStatus;

const TAB_ORDER: TabKey[] = ['ALL', 'UNPUBLISHED', 'PENDING_APPROVAL', 'PUBLISHED', 'REJECTED'];
const PAGE_SIZE = 10;

const SHARE_TO_STATUS_TAG: Record<PublishShareStatus, ShareStatus> = {
  UNPUBLISHED: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  PUBLISHED: 'PUBLISHED',
  REJECTED: 'REJECTED',
};

const PublishProcessPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [records, setRecords] = useState<PublishProcessRecord[]>(() => generateMockRecords());
  const [tab, setTab] = useState<TabKey>('ALL');
  const [keyword, setKeyword] = useState('');
  const [debounced, setDebounced] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  const [detailRecord, setDetailRecord] = useState<PublishProcessRecord | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [publishRecord, setPublishRecord] = useState<PublishProcessRecord | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [highlightId, setHighlightId] = useState<string | null>(null);
  const tableWrapRef = useRef<HTMLDivElement | null>(null);

  // 搜索 debounce
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(keyword.trim()), 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  // 自动清除高亮
  useEffect(() => {
    if (!highlightId) return;
    const timer = setTimeout(() => setHighlightId(null), 2800);
    return () => clearTimeout(timer);
  }, [highlightId]);

  const departmentOptions = useMemo(
    () => Array.from(new Set(records.map((r) => r.department))).map((d) => ({ value: d, label: d })),
    [records],
  );

  const counts = useMemo(() => {
    const c: Record<TabKey, number> = {
      ALL: records.length, UNPUBLISHED: 0, PENDING_APPROVAL: 0, PUBLISHED: 0, REJECTED: 0,
    };
    records.forEach((r) => { c[r.shareStatus] += 1; });
    return c;
  }, [records]);

  const filtered = useMemo(() => {
    let list = records;
    if (tab !== 'ALL') list = list.filter((r) => r.shareStatus === tab);
    if (debounced) {
      const k = debounced.toLowerCase();
      list = list.filter((r) => r.processName.toLowerCase().includes(k));
    }
    if (departmentFilter.length > 0) {
      list = list.filter((r) => departmentFilter.includes(r.department));
    }
    if (tab === 'PENDING_APPROVAL') {
      list = [...list].sort((a, b) => (b.submitTime || 0) - (a.submitTime || 0));
    }
    return list;
  }, [records, tab, debounced, departmentFilter]);

  const paginated = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );

  useEffect(() => { setPage(1); }, [tab, debounced, departmentFilter]);

  const openDetail = (record: PublishProcessRecord) => {
    setDetailRecord(record);
    setDrawerVisible(true);
  };

  const handlePublishClick = (record: PublishProcessRecord) => {
    setPublishRecord(record);
    setModalVisible(true);
  };

  const closeModal = () => setModalVisible(false);

  const handlePublishSubmit = async (publishNote: string) => {
    if (!publishRecord) return;
    // 同版本重复校验
    if (publishRecord.shareStatus !== 'UNPUBLISHED') {
      Toast.warning(t('publishToSharing.toast.duplicate'));
      return;
    }
    // 模拟 API 延迟
    await new Promise((res) => setTimeout(res, 800));

    const targetId = publishRecord.id;
    const submitTime = Date.now();

    setRecords((prev) => prev.map((r) => (
      r.id === targetId
        ? {
          ...r,
          shareStatus: 'PENDING_APPROVAL',
          submitTime,
          assetId: r.assetId || `ASSET-${String(Math.floor(Math.random() * 9000) + 1000)}`,
          publishNote,
        }
        : r
    )));

    setModalVisible(false);
    setDrawerVisible(false);
    setTab('PENDING_APPROVAL');
    setPage(1);
    setHighlightId(targetId);
    Toast.success(t('publishToSharing.toast.success'));

    // 等列表/Tab 渲染完成后再滚动定位
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const root = tableWrapRef.current;
        if (!root) return;
        const row = root.querySelector(`[data-row-key="${targetId}"]`) as HTMLElement | null;
        row?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });
  };

  const columns = [
    {
      title: t('publishToSharing.col.processName'),
      dataIndex: 'processName',
      ellipsis: { showTitle: false } as any,
      render: (text: string) => (
        <Tooltip content={text} position="top">
          <span style={{ fontWeight: 500 }}>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: t('publishToSharing.col.shareStatus'),
      dataIndex: 'shareStatus',
      width: 120,
      render: (status: PublishShareStatus) => <StatusTag status={SHARE_TO_STATUS_TAG[status]} />,
    },
    { title: t('publishToSharing.col.version'), dataIndex: 'version', width: 100 },
    { title: t('publishToSharing.col.department'), dataIndex: 'department', width: 130 },
    {
      title: t('publishToSharing.col.publisher'),
      dataIndex: 'publisherName',
      width: 140,
      render: (_: string, record: PublishProcessRecord) => (
        <UserNameWithCard
          userId={record.publisherName}
          name={record.publisherName}
          department={record.publisherDepartment}
        />
      ),
    },
    { title: t('publishToSharing.col.publishTime'), dataIndex: 'publishTime', width: 160 },
    {
      title: t('publishToSharing.col.action'),
      width: 140,
      align: 'right' as const,
      render: (_: unknown, record: PublishProcessRecord) => (
        <div onClick={(e) => e.stopPropagation()} style={{ display: 'inline-flex', gap: 4 }}>
          {record.shareStatus === 'UNPUBLISHED' ? (
            <Button
              theme="borderless"
              type="primary"
              size="small"
              icon={<Send size={14} strokeWidth={2} />}
              onClick={() => handlePublishClick(record)}
            >
              {t('publishToSharing.actions.publish')}
            </Button>
          ) : (
            <Dropdown
              trigger="click"
              position="bottomRight"
              render={
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => openDetail(record)}>
                    {t('publishToSharing.actions.viewDetail')}
                  </Dropdown.Item>
                </Dropdown.Menu>
              }
            >
              <Button
                theme="borderless"
                type="tertiary"
                size="small"
                icon={<MoreHorizontal size={16} strokeWidth={2} />}
              />
            </Dropdown>
          )}
        </div>
      ),
    },
  ];

  const renderEmpty = () => (
    <div style={{ padding: '60px 0' }}>
      <EmptyState
        variant="noData"
        description={debounced || departmentFilter.length > 0
          ? t('publishToSharing.empty.noResult')
          : t('publishToSharing.empty.noProcess')}
      />
    </div>
  );

  return (
    <div className="publish-process-page">
      <div className="pp-header">
        <Button
          icon={<ChevronLeft size={18} strokeWidth={2} />}
          theme="borderless"
          type="tertiary"
          onClick={() => navigate('/sharing-center/my-shared')}
        />
        <Title heading={3}>{t('publishToSharing.pageTitle')}</Title>
      </div>

      <div className="pp-toolbar">
        <div className="pp-toolbar-left">
          <Input
            prefix={<IconSearchStroked />}
            placeholder={t('publishToSharing.searchPh')}
            value={keyword}
            onChange={setKeyword}
            showClear
            style={{ width: 320 }}
          />
          <Select
            placeholder={t('publishToSharing.departmentPh')}
            value={departmentFilter}
            onChange={(v) => setDepartmentFilter(v as string[])}
            multiple
            showClear
            maxTagCount={1}
            optionList={departmentOptions}
            style={{ minWidth: 180 }}
          />
        </div>
      </div>

      <div className="pp-card">
        <Tabs
          className="pp-tabs"
          activeKey={tab}
          onChange={(k) => setTab(k as TabKey)}
          keepDOM={false}
        >
          {TAB_ORDER.map((key) => (
            <TabPane
              key={key}
              itemKey={key}
              tab={`${t(`publishToSharing.tabs.${key.toLowerCase()}`)} (${counts[key]})`}
            />
          ))}
        </Tabs>

        <div className="pp-table-wrap" ref={tableWrapRef}>
          <Table
            size="small"
            columns={columns}
            dataSource={paginated}
            rowKey="id"
            pagination={false}
            empty={renderEmpty()}
            onRow={(record) => ({
              className: record && record.id === highlightId ? 'row-highlighted' : '',
              onClick: () => record && openDetail(record),
              style: { cursor: 'pointer' },
            })}
          />
        </div>

        {filtered.length > PAGE_SIZE && (
          <div className="list-pagination">
            <Pagination
              total={filtered.length}
              pageSize={PAGE_SIZE}
              currentPage={page}
              onChange={setPage}
              showTotal
            />
          </div>
        )}
      </div>

      <ProcessDetailDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        record={detailRecord}
        dataList={filtered}
        onNavigate={setDetailRecord}
        onPublish={(r) => { setDrawerVisible(false); handlePublishClick(r); }}
      />

      <PublishFormModal
        visible={modalVisible}
        record={publishRecord}
        onCancel={closeModal}
        onSubmit={handlePublishSubmit}
      />
    </div>
  );
};

export default PublishProcessPage;
