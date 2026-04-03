import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import { useTranslation } from 'react-i18next';
import CollaboratorTab from '@/components/CollaboratorManager/CollaboratorTab';
import { useCollaboratorPermission } from '@/hooks/useCollaboratorPermission';
import {
  Descriptions,
  Tag,
  Button,
  Tooltip,
  Typography,
  Toast,
  Modal,
  Row,
  Col,
  Space,
  Tabs,
  TabPane,
  Table,
  DatePicker,
  Image,
} from '@douyinfe/semi-ui';
import EmptyState from '@/components/EmptyState';
import DetailSkeleton from '@/components/DetailSkeleton';
import TableSkeleton from '@/components/TableSkeleton';
import ExpandableText from '@/components/ExpandableText';
import FilterPopover from '@/components/FilterPopover';
import {
  IconEditStroked,
  IconDeleteStroked,
} from '@douyinfe/semi-icons';
import { Download } from 'lucide-react';
import type { LYCredentialResponse, CredentialType, LYRangeResponse } from '@/api/index';
import { useUsageRecordFilter } from '@/hooks/useUsageRecordFilter';
import DetailDrawerWrapper from '@/components/DetailDrawerWrapper';
import type { PaginationInfo } from '@/components/DetailDrawerWrapper';

import './index.less';

const { Title, Text } = Typography;

// 凭据类型配置
const typeConfig: Record<CredentialType, { color: 'blue' | 'green'; i18nKey: string }> = {
  FIXED_VALUE: { color: 'blue', i18nKey: 'credential.type.fixedValue' },
  PERSONAL_REF: { color: 'green', i18nKey: 'credential.type.personalRef' },
};

type UsageType = 'debug' | 'task';

interface CredentialUsageRecord {
  id: string;
  user_id: string;
  user_name: string;
  user_department?: string;
  user_role?: string;
  user_email?: string;
  usage_time: string;
  usage_type: UsageType;
  process_id: string;
  process_name: string;
  process_version: string;
  worker_id: string;
  worker_name: string;
  task_id: string | null;
  screenshot_url: string | null;
}

interface CredentialUsageListResponse {
  data: CredentialUsageRecord[];
  range: LYRangeResponse;
}

// Mock数据生成
const generateUUID = (): string => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = (Math.random() * 16) | 0; const v = c === 'x' ? r : (r & 0x3) | 0x8; return v.toString(16); });

const generateMockUsageRecord = (index: number, context: 'development' | 'scheduling'): CredentialUsageRecord => {
  const users = ['John Smith', 'Jane Doe', 'Mike Wang', 'David Zhao', 'Chris Qian'];
  const processes = ['Order Processing Flow', 'Data Sync Flow', 'Report Generation Flow', 'Approval Flow', 'Notification Flow'];
  const workers = ['Worker-01', 'Worker-02', 'Worker-03', 'Worker-04'];
  const versions = ['1.0.0', '1.0.1', '1.1.0', '2.0.0'];
  const screenshotUrls = ['https://picsum.photos/seed/screen1/800/600', 'https://picsum.photos/seed/screen2/800/600', 'https://picsum.photos/seed/screen3/800/600'];

  return {
    id: generateUUID(), user_id: `user-${(index % 5) + 1}`, user_name: users[index % users.length],
    user_department: ['R&D Dept', 'Product Dept', 'QA Dept', 'Ops Dept', 'Marketing Dept'][index % 5],
    user_role: ['Senior Engineer', 'Product Manager', 'QA Engineer', 'Ops Engineer', 'Marketing Specialist'][index % 5],
    user_email: ['john.smith@example.com', 'jane.doe@example.com', 'mike.wang@example.com', 'david.zhao@example.com', 'chris.qian@example.com'][index % 5],
    usage_time: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    usage_type: context === 'development' ? 'debug' : 'task',
    process_id: generateUUID(), process_name: processes[index % processes.length], process_version: versions[index % versions.length],
    worker_id: generateUUID(), worker_name: workers[index % workers.length],
    task_id: context === 'scheduling' ? `TASK-${String(index + 1).padStart(6, '0')}` : null,
    screenshot_url: index % 3 === 0 ? screenshotUrls[index % screenshotUrls.length] : null,
  };
};

const generateMockUsageList = (context: 'development' | 'scheduling') => Array.from({ length: 25 }, (_, i) => generateMockUsageRecord(i, context));

const fetchUsageList = async (params: { credentialId: string; context: 'development' | 'scheduling'; userFilter?: string[]; startDate?: Date; endDate?: Date; offset?: number; size?: number; }): Promise<CredentialUsageListResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  let data = generateMockUsageList(params.context);
  if (params.userFilter?.length) data = data.filter((item) => params.userFilter!.includes(item.user_id));
  if (params.startDate) data = data.filter((item) => new Date(item.usage_time) >= params.startDate!);
  if (params.endDate) data = data.filter((item) => new Date(item.usage_time) <= params.endDate!);
  const total = data.length;
  const offset = params.offset || 0;
  const size = params.size || 20;
  const pagedData = data.slice(offset, offset + size);
  return { data: pagedData, range: { offset, size: pagedData.length, total } };
};

interface CredentialDetailDrawerProps {
  visible: boolean;
  credential: LYCredentialResponse | null;
  context: 'development' | 'scheduling';
  onClose: () => void;
  onEdit: (credential: LYCredentialResponse) => void;
  onDelete: (credential: LYCredentialResponse) => void;
  onRefresh: () => void;
  dataList?: LYCredentialResponse[];
  onNavigate?: (credential: LYCredentialResponse) => void;
  pagination?: PaginationInfo;
  onPageChange?: (page: number, direction: 'prev' | 'next') => void;
  initialTab?: 'basic' | 'usage' | 'collaborators';
  onScrollToRow?: (id: string) => void;
}

const CredentialDetailDrawer = ({
  visible,
  credential,
  context,
  onClose,
  onEdit,
  onDelete,
  dataList = [],
  onNavigate,
  pagination,
  onPageChange,
  initialTab = 'basic',
  onScrollToRow,
}: CredentialDetailDrawerProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(initialTab);
  const { canManage } = useCollaboratorPermission('CREDENTIAL', credential?.credential_id);

  const [usageLoading, setUsageLoading] = useState(false);
  const [usageListResponse, setUsageListResponse] = useState<CredentialUsageListResponse | null>(null);
  const [usageQueryParams, setUsageQueryParams] = useState({ page: 1, pageSize: 20 });
  const [isUsageInitialLoad, setIsUsageInitialLoad] = useState(true);

  const { userFilter, setUserFilter, dateRange, filterPopoverVisible, setFilterPopoverVisible, filterCount, resetFilters, handleDateRangeChange, datePresets } = useUsageRecordFilter({
    onFilterChange: () => setUsageQueryParams((prev) => ({ ...prev, page: 1 })),
  });

  const userFilterOptions = [
    { value: 'user-1', label: 'John Smith' }, { value: 'user-2', label: 'Jane Doe' }, { value: 'user-3', label: 'Mike Wang' }, { value: 'user-4', label: 'David Zhao' }, { value: 'user-5', label: 'Chris Qian' },
  ];

  const loadUsageData = useCallback(async () => {
    if (!credential) return;
    setUsageLoading(true);
    try {
      const response = await fetchUsageList({ credentialId: credential.credential_id, context, userFilter: userFilter.length > 0 ? userFilter : undefined, startDate: dateRange?.[0], endDate: dateRange?.[1], offset: (usageQueryParams.page - 1) * usageQueryParams.pageSize, size: usageQueryParams.pageSize });
      setUsageListResponse(response);
    } catch (error) {
      Toast.error(t('credential.usage.loadError'));
    } finally {
      setUsageLoading(false);
      setIsUsageInitialLoad(false);
    }
  }, [credential, context, userFilter, dateRange, usageQueryParams, t]);

  useEffect(() => {
    if (visible && activeTab === 'usage' && credential) loadUsageData();
  }, [visible, activeTab, credential?.credential_id, userFilter, dateRange, usageQueryParams]);

  const prevVisibleRef = useRef(false);
  useEffect(() => {
    if (visible && !prevVisibleRef.current) setActiveTab(initialTab);
    prevVisibleRef.current = visible;
  }, [visible, initialTab]);

  useEffect(() => {
    if (credential) {
      setUsageQueryParams({ page: 1, pageSize: 20 });
      resetFilters();
      setUsageListResponse(null);
      setIsUsageInitialLoad(true);
    }
  }, [credential?.credential_id]);

  const formatDateTime = (dateStr: string | undefined) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getCredentialValueDisplay = useMemo(() => {
    if (!credential) return '-';
    const value = context === 'development' ? credential.test_value : credential.production_value;
    if (!value) return '-';
    return `${value.username}:${value.password}`;
  }, [credential, context]);

  const handleEdit = () => { if (credential) onEdit(credential); };

  const handleDelete = () => {
    if (!credential) return;
    Modal.confirm({
      title: t('credential.deleteModal.title'),
      icon: <IconDeleteStroked style={{ color: 'var(--semi-color-danger)' }} />,
      content: t('credential.deleteModal.confirmMessage', { name: credential.credential_name }),
      okText: t('common.confirm'), cancelText: t('common.cancel'), okButtonProps: { type: 'danger' },
      onOk: async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        Toast.success(t('credential.deleteModal.success'));
        onDelete(credential);
        onClose();
      },
    });
  };

  const descriptionData = useMemo(() => {
    if (!credential) return [];
    return [
      { key: t('credential.detail.name'), value: credential.credential_name },
      { key: t('credential.detail.type'), value: <Tag color={typeConfig[credential.credential_type].color} type="light">{t(typeConfig[credential.credential_type].i18nKey)}</Tag> },
      { key: context === 'development' ? t('credential.detail.testValue') : t('credential.detail.productionValue'), value: <Text>{getCredentialValueDisplay}</Text> },
      ...(context === 'development' ? [{ key: t('credential.detail.publishStatus'), value: <Tag color={credential.is_published ? 'green' : 'grey'}>{credential.is_published ? t('credential.detail.published') : t('credential.detail.unpublished')}</Tag> }] : []),
      { key: t('common.description'), value: <ExpandableText text={credential.description} maxLines={3} /> },
      ...(credential.credential_type === 'PERSONAL_REF' ? [{ key: t('credential.detail.linkedPersonalCredential'), value: credential.linked_personal_credential_value || '-' }] : []),
      { key: t('common.creator'), value: credential.created_by_name ? <UserNameWithCard name={credential.created_by_name} userId={credential.created_by} department={credential.created_by_department || undefined} role={credential.created_by_role || undefined} email={credential.created_by_email || undefined} /> : '-' },
      { key: t('common.createTime'), value: formatDateTime(credential.created_at) },
      { key: t('common.updateTime'), value: formatDateTime(credential.updated_at) },
    ];
  }, [credential, context, getCredentialValueDisplay, t]);

  const handleExport = async () => {
    Toast.info(t('credential.usage.exporting'));
    await new Promise((resolve) => setTimeout(resolve, 1000));
    Toast.success(t('credential.usage.exportSuccess'));
  };

  const usageColumns = [
    { title: t('credential.usage.table.user'), dataIndex: 'user_name', key: 'user_name', width: 100, render: (text: string, record: any) => text ? <UserNameWithCard name={text} userId={record.user_id} department={record.user_department} role={record.user_role} email={record.user_email} /> : '-' },
    { title: t('credential.usage.table.usageTime'), dataIndex: 'usage_time', key: 'usage_time', width: 160, render: (text: string) => formatDateTime(text) },
    { title: t('credential.usage.table.type'), dataIndex: 'usage_type', key: 'usage_type', width: 80, render: (type: UsageType) => <Tag color={type === 'debug' ? 'blue' : 'green'} type="light">{t(`credential.usage.type.${type}`)}</Tag> },
    { title: t('credential.usage.table.process'), dataIndex: 'process_name', key: 'process_name', width: 140, ellipsis: true, render: (text: string | null) => text || '-' },
    { title: t('credential.usage.table.processVersion'), dataIndex: 'process_version', key: 'process_version', width: 80 },
    { title: t('credential.usage.table.worker'), dataIndex: 'worker_name', key: 'worker_name', width: 100, ellipsis: true },
    { title: t('credential.usage.table.taskId'), dataIndex: 'task_id', key: 'task_id', width: 120, ellipsis: true, render: (text: string | null) => text || '-' },
    { title: t('credential.usage.table.screenshot'), dataIndex: 'screenshot_url', key: 'screenshot_url', width: 80, render: (url: string | null) => url ? <div onClick={(e) => e.stopPropagation()} style={{ display: 'inline-block' }}><Image src={url} width={50} height={35} preview={true} style={{ cursor: 'pointer', borderRadius: 4, objectFit: 'cover' }} fallback={<div style={{ width: 50, height: 35, background: 'var(--semi-color-fill-1)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--semi-color-text-2)' }}>加载失败</div>} /></div> : '-' },
  ];

  const usageRange = usageListResponse?.range;
  const usageTotal = usageRange?.total || 0;

  if (!credential) return null;

  const handleClose = () => {
    setActiveTab('basic');
    onClose();
  };

  const extraActions = (
    <>
      {!credential.is_published && (
        <Tooltip content={t('common.edit')}>
          <Button icon={<IconEditStroked />} theme="borderless" size="small" onClick={handleEdit} />
        </Tooltip>
      )}
      {context === 'development' && !credential.is_published && (
        <Tooltip content={t('common.delete')}>
          <Button icon={<IconDeleteStroked style={{ color: 'var(--semi-color-danger)' }} />} theme="borderless" size="small" onClick={handleDelete} />
        </Tooltip>
      )}
    </>
  );

  return (
    <DetailDrawerWrapper
      visible={visible}
      onClose={handleClose}
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
      storageKey="credentialDetailDrawerWidth"
      className="credential-detail-drawer"
    >
      <Tabs activeKey={activeTab} onChange={(key) => setActiveTab(key as 'basic' | 'usage' | 'collaborators')} className="credential-detail-drawer-tabs">
        <TabPane tab={t('credential.detail.tabs.basicInfo')} itemKey="basic">
          <div className="credential-detail-drawer-content">
            <Descriptions data={descriptionData} align="left" />
          </div>
        </TabPane>

        <TabPane tab={t('credential.detail.tabs.usageRecords')} itemKey="usage">
          <div className="credential-detail-drawer-usage">
            <div className="credential-detail-drawer-usage-filter">
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
              <Table size="small" columns={usageColumns} dataSource={usageListResponse?.data || []} rowKey="id" loading={usageLoading} empty={<EmptyState description={t('credential.usage.empty')} />} pagination={{ currentPage: usageQueryParams.page, pageSize: usageQueryParams.pageSize, total: usageTotal, onPageChange: (page) => setUsageQueryParams((prev) => ({ ...prev, page })), showSizeChanger: true, showTotal: true }} scroll={{ y: 'calc(100vh - 350px)' }} />
            )}
          </div>
        </TabPane>

        <TabPane tab={t('collaborator.tabTitle')} itemKey="collaborators">
          <CollaboratorTab
            assetType="CREDENTIAL"
            assetId={credential.credential_id}
            context={context}
            canManage={canManage}
          />
        </TabPane>
      </Tabs>
    </DetailDrawerWrapper>
  );
};

export default CredentialDetailDrawer;
