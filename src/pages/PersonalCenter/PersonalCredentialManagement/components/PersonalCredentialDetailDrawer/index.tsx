import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Typography,
  Button,
  Descriptions,
  Tabs,
  TabPane,
  Table,
  Tooltip,
  Toast,
  Modal,
  Tag,
  Row,
  Col,
  Space,
  DatePicker,
  Image,
  Dropdown,
} from '@douyinfe/semi-ui';
import EmptyState from '@/components/EmptyState';
import DetailSkeleton from '@/components/DetailSkeleton';
import TableSkeleton from '@/components/TableSkeleton';
import FilterPopover from '@/components/FilterPopover';
import {
  IconEditStroked,
  IconDeleteStroked,
  IconEyeOpenedStroked,
  IconMoreStroked,
} from '@douyinfe/semi-icons';
import { Download, Link, Unlink } from 'lucide-react';
import type { LYPersonalCredentialResponse } from '@/api/index';
import ExpandableText from '@/components/ExpandableText';
import { useUsageRecordFilter } from '@/hooks/useUsageRecordFilter';
import DetailDrawerWrapper from '@/components/DetailDrawerWrapper';
import type { PaginationInfo } from '@/components/DetailDrawerWrapper';

import './index.less';

const { Text } = Typography;



// ============= 使用记录类型 =============
interface UsageRecord {
  id: string; user_id: string; user_name: string; usage_time: string; usage_type: 'DEBUG' | 'TASK';
  description: string; process_name: string; process_version: string; worker_name: string; task_number: string; screenshot_url: string | null;
}

interface LinkedCredential {
  credential_id: string; credential_name: string; credential_type: string; description: string | null; created_at: string;
}

// ============= Mock数据生成 =============
const generateMockUsageRecords = (): UsageRecord[] => {
  const users = ['张三', '李四', '王五', '赵六', '钱七'];
  const usageTypes: ('DEBUG' | 'TASK')[] = ['DEBUG', 'TASK'];
  const processes = ['订单处理流程', '数据同步流程', '报表生成流程', '邮件发送流程'];
  const workers = ['Worker-01', 'Worker-02', 'Worker-03', 'Worker-04'];
  const screenshotUrls = ['https://picsum.photos/seed/usage1/800/600', 'https://picsum.photos/seed/usage2/800/600', 'https://picsum.photos/seed/usage3/800/600'];
  return Array.from({ length: 25 }, (_, i) => ({
    id: `usage-${i}`, user_id: `user-${(i % 5) + 1}`, user_name: users[i % users.length],
    usage_time: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    usage_type: usageTypes[Math.floor(Math.random() * usageTypes.length)], description: `凭据被成功获取`,
    process_name: processes[Math.floor(Math.random() * processes.length)], process_version: `1.0.${Math.floor(Math.random() * 10)}`,
    worker_name: workers[Math.floor(Math.random() * workers.length)], task_number: `TASK-${String(i + 1).padStart(6, '0')}`,
    screenshot_url: i % 3 === 0 ? screenshotUrls[i % screenshotUrls.length] : null,
  }));
};

const generateMockLinkedCredentials = (count: number): LinkedCredential[] => {
  const names = ['企业邮箱凭据', '数据库连接凭据', 'SSH服务器凭据', 'Git仓库凭据', 'ERP系统凭据'];
  const types = ['PERSONAL_REF', 'PERSONAL_REF', 'PERSONAL_REF'];
  return Array.from({ length: count }, (_, i) => ({
    credential_id: `cred-${i + 1}`, credential_name: names[i % names.length], credential_type: types[i % types.length],
    description: `${names[i % names.length]}的描述信息`, created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  }));
};

interface PersonalCredentialDetailDrawerProps {
  visible: boolean;
  credential: LYPersonalCredentialResponse | null;
  onClose: () => void;
  onEdit: (credential: LYPersonalCredentialResponse) => void;
  onDelete: (credential: LYPersonalCredentialResponse) => void;
  onLinkCredential: (credential: LYPersonalCredentialResponse) => void;
  onRefresh: () => void;
  dataList?: LYPersonalCredentialResponse[];
  onNavigate?: (credential: LYPersonalCredentialResponse) => void;
  pagination?: PaginationInfo;
  onPageChange?: (page: number, direction: 'prev' | 'next') => void;
  initialTab?: 'basic' | 'linked' | 'usage';
  onScrollToRow?: (id: string) => void;
}

const PersonalCredentialDetailDrawer = ({
  visible, credential, onClose, onEdit, onDelete, onLinkCredential, onRefresh,
  dataList = [], onNavigate, pagination, onPageChange, initialTab = 'basic', onScrollToRow,
}: PersonalCredentialDetailDrawerProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'basic' | 'linked' | 'usage'>(initialTab);
  

  const isInitialOpenRef = useRef(true);
  const prevVisibleRef = useRef(visible);

  const [linkedCredentials, setLinkedCredentials] = useState<LinkedCredential[]>([]);
  const [linkedCredentialsLoading, setLinkedCredentialsLoading] = useState(false);
  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>([]);
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageQueryParams, setUsageQueryParams] = useState({ page: 1, pageSize: 20 });
  const [usageTotal, setUsageTotal] = useState(0);
  const [isUsageInitialLoad, setIsUsageInitialLoad] = useState(true);

  const { userFilter, setUserFilter, dateRange, filterPopoverVisible, setFilterPopoverVisible, filterCount, resetFilters, handleDateRangeChange, datePresets } = useUsageRecordFilter({
    onFilterChange: () => setUsageQueryParams((prev) => ({ ...prev, page: 1 })),
  });

  const userFilterOptions = [
    { value: 'user-1', label: '张三' }, { value: 'user-2', label: '李四' }, { value: 'user-3', label: '王五' }, { value: 'user-4', label: '赵六' }, { value: 'user-5', label: '钱七' },
  ];

  const loadUsageRecords = useCallback(async () => {
    if (!credential) return;
    setUsageLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      let records = generateMockUsageRecords();
      if (userFilter.length > 0) records = records.filter((item) => userFilter.includes(item.user_id));
      if (dateRange?.[0]) records = records.filter((item) => new Date(item.usage_time) >= dateRange[0]);
      if (dateRange?.[1]) records = records.filter((item) => new Date(item.usage_time) <= dateRange[1]);
      const offset = (usageQueryParams.page - 1) * usageQueryParams.pageSize;
      setUsageRecords(records.slice(offset, offset + usageQueryParams.pageSize));
      setUsageTotal(records.length);
    } finally { setUsageLoading(false); setIsUsageInitialLoad(false); }
  }, [credential, userFilter, dateRange, usageQueryParams]);

  useEffect(() => {
    if (visible && activeTab === 'usage' && credential) loadUsageRecords();
  }, [visible, activeTab, credential?.credential_id, userFilter, dateRange, usageQueryParams]);

  useEffect(() => {
    if (visible && !prevVisibleRef.current) isInitialOpenRef.current = true;
    prevVisibleRef.current = visible;
  }, [visible]);

  useEffect(() => {
    if (credential) {
      if (isInitialOpenRef.current) { setActiveTab(initialTab); isInitialOpenRef.current = false; }
      
      setUsageQueryParams({ page: 1, pageSize: 20 });
      resetFilters();
      setUsageRecords([]);
      setIsUsageInitialLoad(true);
      setLinkedCredentialsLoading(true);
      const count = credential.linked_credentials_count || 0;
      setTimeout(() => { setLinkedCredentials(generateMockLinkedCredentials(count)); setLinkedCredentialsLoading(false); }, 300);
    }
  }, [credential?.credential_id, initialTab]);

  const handleDelete = useCallback(() => {
    if (!credential) return;
    Modal.confirm({
      title: t('personalCredential.deleteModal.title'), icon: <IconDeleteStroked style={{ color: 'var(--semi-color-danger)' }} />,
      content: t('personalCredential.deleteModal.confirmMessage'), okText: t('common.confirm'), cancelText: t('common.cancel'), okButtonProps: { type: 'danger' },
      onOk: async () => { await new Promise((resolve) => setTimeout(resolve, 500)); Toast.success(t('personalCredential.deleteModal.success')); onDelete(credential); onClose(); },
    });
  }, [credential, t, onDelete, onClose]);

  const handleUnlinkCredential = useCallback((linkedCredential: LinkedCredential) => {
    Modal.confirm({
      title: t('personalCredential.linkedCredentials.unlinkModal.title'), icon: <IconDeleteStroked style={{ color: 'var(--semi-color-danger)' }} />,
      content: t('personalCredential.linkedCredentials.unlinkModal.content', { name: linkedCredential.credential_name }),
      okText: t('common.confirm'), cancelText: t('common.cancel'), okButtonProps: { type: 'danger' },
      onOk: async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        Toast.success(t('personalCredential.linkedCredentials.unlinkModal.success'));
        setLinkedCredentials((prev) => prev.filter((item) => item.credential_id !== linkedCredential.credential_id));
        onRefresh();
      },
    });
  }, [t, onRefresh]);

  const handleNavigateToCredential = useCallback((linkedCredential: LinkedCredential) => {
    navigate(`/dev-center/business-assets/credentials?credentialId=${linkedCredential.credential_id}`);
    onClose();
  }, [navigate, onClose]);

  const formatDateTime = (dateStr: string | undefined) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };


  const descriptionData = useMemo(() => {
    if (!credential) return [];
    return [
      { key: t('personalCredential.table.name'), value: credential.credential_name },
      { key: t('personalCredential.table.username'), value: credential.credential_value?.username || '-' },
      { key: t('common.description'), value: <ExpandableText text={credential.description} maxLines={3} /> },
      { key: t('common.createTime'), value: formatDateTime(credential.created_at) },
      { key: t('common.updateTime'), value: formatDateTime(credential.updated_at) },
    ];
  }, [credential, t]);

  const handleExport = async () => {
    Toast.info(t('credential.usage.exporting'));
    await new Promise((resolve) => setTimeout(resolve, 1000));
    Toast.success(t('credential.usage.exportSuccess'));
  };

  const usageColumns = useMemo(() => [
    { title: t('credential.usage.table.usageTime'), dataIndex: 'usage_time', key: 'usage_time', width: 160, render: (text: string) => formatDateTime(text) },
    { title: t('credential.usage.table.type'), dataIndex: 'usage_type', key: 'usage_type', width: 80, render: (type: 'DEBUG' | 'TASK') => <Tag color={type === 'DEBUG' ? 'blue' : 'green'} type="light">{t(`credential.usage.type.${type.toLowerCase()}`)}</Tag> },
    { title: t('credential.usage.table.process'), dataIndex: 'process_name', key: 'process_name', width: 140, ellipsis: true, render: (text: string | null) => text || '-' },
    { title: t('credential.usage.table.processVersion'), dataIndex: 'process_version', key: 'process_version', width: 80 },
    { title: t('credential.usage.table.worker'), dataIndex: 'worker_name', key: 'worker_name', width: 100, ellipsis: true },
    { title: t('credential.usage.table.taskId'), dataIndex: 'task_number', key: 'task_number', width: 120, ellipsis: true, render: (text: string | null) => text || '-' },
    { title: t('credential.usage.table.screenshot'), dataIndex: 'screenshot_url', key: 'screenshot_url', width: 80, render: (url: string | null) => url ? <div onClick={(e) => e.stopPropagation()} style={{ display: 'inline-block' }}><Image src={url} width={50} height={35} preview style={{ cursor: 'pointer', borderRadius: 4, objectFit: 'cover' }} fallback={<div style={{ width: 50, height: 35, background: 'var(--semi-color-fill-1)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--semi-color-text-2)' }}>加载失败</div>} /></div> : '-' },
  ], [t]);

  if (!credential) return null;

  const extraActions = (
    <>
      <Tooltip content={t('common.edit')}>
        <Button icon={<IconEditStroked />} theme="borderless" size="small" onClick={() => onEdit(credential)} />
      </Tooltip>
      <Tooltip content={t('personalCredential.actions.linkCredential')}>
        <Button icon={<Link size={16} strokeWidth={2} />} theme="borderless" size="small" onClick={() => onLinkCredential(credential)} />
      </Tooltip>
      <Tooltip content={t('common.delete')}>
        <Button icon={<IconDeleteStroked style={{ color: 'var(--semi-color-danger)' }} />} theme="borderless" size="small" onClick={handleDelete} />
      </Tooltip>
    </>
  );

  return (
    <DetailDrawerWrapper
      visible={visible}
      onClose={onClose}
      title={credential.credential_name}
      dataList={dataList}
      currentId={credential.credential_id}
      getId={(item) => item.credential_id}
      onNavigate={(item) => onNavigate?.(item)}
      pagination={pagination}
      onPageChange={onPageChange}
      onScrollToRow={onScrollToRow}
      extraActions={extraActions}
      defaultWidth={900}
      minWidth={576}
      storageKey="personalCredentialDetailDrawerWidth"
      className="personal-credential-detail-drawer"
    >
      <Tabs activeKey={activeTab} onChange={(key) => setActiveTab(key as 'basic' | 'linked' | 'usage')} className="personal-credential-detail-drawer-tabs">
        <TabPane tab={t('credential.detail.tabs.basicInfo')} itemKey="basic">
          <div className="personal-credential-detail-drawer-content">
            <Descriptions data={descriptionData} align="left" />
          </div>
        </TabPane>

        <TabPane tab={t('personalCredential.linkedCredentials.title')} itemKey="linked">
          <div className="personal-credential-detail-drawer-linked">
            {linkedCredentialsLoading ? (
              <TableSkeleton rows={5} columns={4} columnWidths={['30%', '35%', '20%', '15%']} />
            ) : (
              <Table size="small" columns={[
                { title: t('personalCredential.linkedCredentials.credentialName'), dataIndex: 'credential_name', key: 'credential_name', render: (text: string) => <span>{text}</span> },
                { title: t('common.description'), dataIndex: 'description', key: 'description', render: (text: string | null) => text || '-' },
                { title: t('common.createTime'), dataIndex: 'created_at', key: 'created_at', width: 160, render: (text: string) => formatDateTime(text) },
                { title: t('common.actions'), key: 'actions', width: 80, render: (_: unknown, record: LinkedCredential) => (
                  <Dropdown trigger="click" position="bottomRight" clickToHide render={
                    <Dropdown.Menu>
                      <Dropdown.Item icon={<IconEyeOpenedStroked />} onClick={(e) => { e.stopPropagation(); handleNavigateToCredential(record); }}>{t('common.viewDetail')}</Dropdown.Item>
                      <Dropdown.Item icon={<Unlink size={16} strokeWidth={2} />} type="danger" onClick={(e) => { e.stopPropagation(); handleUnlinkCredential(record); }}>{t('personalCredential.linkedCredentials.unlink')}</Dropdown.Item>
                    </Dropdown.Menu>
                  }><Button icon={<IconMoreStroked />} theme="borderless" type="tertiary" onClick={(e) => e.stopPropagation()} /></Dropdown>
                ) },
              ]} dataSource={linkedCredentials} rowKey="credential_id" pagination={false} empty={
                <EmptyState description={t('personalCredential.linkedCredentials.empty')} footer={
                  <Button theme="solid" type="primary" icon={<Link size={16} strokeWidth={2} />} onClick={() => { if (credential) onLinkCredential(credential); }}>{t('personalCredential.linkedCredentials.linkCredential')}</Button>
                } />
              } />
            )}
          </div>
        </TabPane>

        <TabPane tab={t('credential.detail.tabs.usageRecords')} itemKey="usage">
          <div className="personal-credential-detail-drawer-usage">
            <div className="personal-credential-detail-drawer-usage-filter">
              <Row type="flex" justify="space-between" align="middle">
                <Col>
                  <Space>
                    <DatePicker type="dateRange" placeholder={[t('common.startDate'), t('common.endDate')]} value={dateRange || undefined} onChange={(dates) => handleDateRangeChange(dates as Date[] | null | undefined)} presets={datePresets} style={{ width: 280 }} />
                    <FilterPopover
                      visible={filterPopoverVisible}
                      onVisibleChange={setFilterPopoverVisible}
                      onConfirm={(values) => {
                        setUserFilter((values.user as string[]) || []);
                        setUsageQueryParams((prev) => ({ ...prev, page: 1 }));
                      }}
                      sections={[
                        {
                          key: 'user',
                          label: t('credential.usage.filter.user'),
                          type: 'checkbox',
                          options: userFilterOptions,
                          value: userFilter,
                        },
                      ]}
                    />
                  </Space>
                </Col>
                <Col>
                  <Button icon={<Download size={14} />} onClick={handleExport}>{t('common.export')}</Button>
                </Col>
              </Row>
            </div>
            {isUsageInitialLoad ? (
              <TableSkeleton rows={8} columns={8} columnWidths={['10%', '15%', '8%', '14%', '8%', '10%', '12%', '8%']} />
            ) : (
              <Table size="small" columns={usageColumns} dataSource={usageRecords} rowKey="id" loading={usageLoading} pagination={{ currentPage: usageQueryParams.page, pageSize: usageQueryParams.pageSize, total: usageTotal, onPageChange: (page) => setUsageQueryParams((prev) => ({ ...prev, page })), showSizeChanger: true, showTotal: true }} scroll={{ y: 'calc(100vh - 350px)' }} empty={<EmptyState description={t('credential.usage.empty')} />} />
            )}
          </div>
        </TabPane>
      </Tabs>
    </DetailDrawerWrapper>
  );
};

export default PersonalCredentialDetailDrawer;
