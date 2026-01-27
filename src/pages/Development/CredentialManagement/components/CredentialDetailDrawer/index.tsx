import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  SideSheet,
  Descriptions,
  Tag,
  Button,
  Tooltip,
  Divider,
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
  Popover,
  CheckboxGroup,
  Image,
} from '@douyinfe/semi-ui';
import {
  IconClose,
  IconEditStroked,
  IconDeleteStroked,
  IconMaximize,
  IconMinimize,
  IconChevronLeft,
  IconChevronRight,
  IconFilter,
} from '@douyinfe/semi-icons';
import { Download } from 'lucide-react';
import type { LYCredentialResponse, CredentialType, LYRangeResponse } from '@/api/index';

import './index.less';

const { Title, Text } = Typography;

// 凭据类型配置
const typeConfig: Record<CredentialType, { color: 'blue' | 'green'; i18nKey: string }> = {
  FIXED_VALUE: { color: 'blue', i18nKey: 'credential.type.fixedValue' },
  PERSONAL_REF: { color: 'green', i18nKey: 'credential.type.personalRef' },
};

// 使用记录类型
type UsageType = 'debug' | 'task';

// 使用记录响应类型
interface CredentialUsageRecord {
  id: string;
  user_id: string;
  user_name: string;
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
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const generateMockUsageRecord = (index: number, context: 'development' | 'scheduling'): CredentialUsageRecord => {
  const users = ['张三', '李四', '王五', '赵六', '钱七'];
  const processes = ['订单处理流程', '数据同步流程', '报表生成流程', '审批流程', '通知发送流程'];
  const workers = ['Worker-01', 'Worker-02', 'Worker-03', 'Worker-04'];
  const versions = ['1.0.0', '1.0.1', '1.1.0', '2.0.0'];

  return {
    id: generateUUID(),
    user_id: `user-${(index % 5) + 1}`,
    user_name: users[index % users.length],
    usage_time: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    usage_type: context === 'development' ? 'debug' : 'task',
    process_id: generateUUID(),
    process_name: processes[index % processes.length],
    process_version: versions[index % versions.length],
    worker_id: generateUUID(),
    worker_name: workers[index % workers.length],
    task_id: context === 'scheduling' ? `TASK-${String(index + 1).padStart(6, '0')}` : null,
    screenshot_url: index % 3 === 0 ? 'https://via.placeholder.com/800x600' : null,
  };
};

const generateMockUsageList = (context: 'development' | 'scheduling'): CredentialUsageRecord[] => {
  return Array.from({ length: 25 }, (_, i) => generateMockUsageRecord(i, context));
};

// 模拟API调用
const fetchUsageList = async (
  params: {
    credentialId: string;
    context: 'development' | 'scheduling';
    userFilter?: string[];
    startDate?: Date;
    endDate?: Date;
    offset?: number;
    size?: number;
  }
): Promise<CredentialUsageListResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  let data = generateMockUsageList(params.context);

  // 使用者筛选
  if (params.userFilter && params.userFilter.length > 0) {
    data = data.filter((item) => params.userFilter!.includes(item.user_id));
  }

  // 时间段筛选
  if (params.startDate) {
    data = data.filter((item) => new Date(item.usage_time) >= params.startDate!);
  }
  if (params.endDate) {
    data = data.filter((item) => new Date(item.usage_time) <= params.endDate!);
  }

  const total = data.length;
  const offset = params.offset || 0;
  const size = params.size || 20;
  const pagedData = data.slice(offset, offset + size);

  return {
    data: pagedData,
    range: {
      offset,
      size: pagedData.length,
      total,
    },
  };
};

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  total: number;
}

interface CredentialDetailDrawerProps {
  visible: boolean;
  credential: LYCredentialResponse | null;
  context: 'development' | 'scheduling';
  onClose: () => void;
  onEdit: (credential: LYCredentialResponse) => void;
  onDelete: (credential: LYCredentialResponse) => void;
  onRefresh: () => void;
  // 导航相关
  dataList?: LYCredentialResponse[];
  onNavigate?: (credential: LYCredentialResponse) => void;
  // 分页相关 - 用于自动翻页
  pagination?: PaginationInfo;
  onPageChange?: (page: number) => Promise<LYCredentialResponse[] | void>;
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
}: CredentialDetailDrawerProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('basic');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [drawerWidth, setDrawerWidth] = useState(() => {
    const saved = localStorage.getItem('credentialDetailDrawerWidth');
    return saved ? Math.max(Number(saved), 576) : 900;
  });
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(drawerWidth);

  // 使用记录状态
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageListResponse, setUsageListResponse] = useState<CredentialUsageListResponse | null>(null);
  const [usageQueryParams, setUsageQueryParams] = useState({ page: 1, pageSize: 20 });
  const [userFilter, setUserFilter] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);
  const [filterPopoverVisible, setFilterPopoverVisible] = useState(false);

  // 使用者筛选选项
  const userFilterOptions = [
    { value: 'user-1', label: '张三' },
    { value: 'user-2', label: '李四' },
    { value: 'user-3', label: '王五' },
    { value: 'user-4', label: '赵六' },
    { value: 'user-5', label: '钱七' },
  ];

  // 加载使用记录数据
  const loadUsageData = useCallback(async () => {
    if (!credential) return;

    setUsageLoading(true);
    try {
      const response = await fetchUsageList({
        credentialId: credential.credential_id,
        context,
        userFilter: userFilter.length > 0 ? userFilter : undefined,
        startDate: dateRange?.[0],
        endDate: dateRange?.[1],
        offset: (usageQueryParams.page - 1) * usageQueryParams.pageSize,
        size: usageQueryParams.pageSize,
      });
      setUsageListResponse(response);
    } catch (error) {
      console.error('加载使用记录失败:', error);
      Toast.error(t('credential.usage.loadError'));
    } finally {
      setUsageLoading(false);
    }
  }, [credential, context, userFilter, dateRange, usageQueryParams, t]);

  // 当切换到使用记录tab时加载数据
  useEffect(() => {
    if (visible && activeTab === 'usage' && credential) {
      loadUsageData();
    }
  }, [visible, activeTab, credential, loadUsageData]);

  // 切换凭据时重置使用记录状态
  useEffect(() => {
    if (credential) {
      setUsageQueryParams({ page: 1, pageSize: 20 });
      setUserFilter([]);
      setDateRange(null);
      setUsageListResponse(null);
    }
  }, [credential?.credential_id]);

  // 拖拽调整宽度
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isResizing.current = true;
      startX.current = e.clientX;
      startWidth.current = drawerWidth;
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
      const handleMouseMove = (e: MouseEvent) => {
        if (!isResizing.current) return;
        const diff = startX.current - e.clientX;
        setDrawerWidth(Math.min(Math.max(startWidth.current + diff, 576), window.innerWidth - 100));
      };
      const handleMouseUp = () => {
        isResizing.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [drawerWidth],
  );

  useEffect(() => {
    localStorage.setItem('credentialDetailDrawerWidth', String(drawerWidth));
  }, [drawerWidth]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  // 导航逻辑
  const currentIndex = useMemo(() => {
    if (!credential || dataList.length === 0) return -1;
    return dataList.findIndex(item => item.credential_id === credential.credential_id);
  }, [credential, dataList]);

  // 判断是否可以导航（考虑分页）
  const canGoPrev = useMemo(() => {
    if (currentIndex > 0) return true;
    if (pagination && pagination.currentPage > 1) return true;
    return false;
  }, [currentIndex, pagination]);

  const canGoNext = useMemo(() => {
    if (currentIndex >= 0 && currentIndex < dataList.length - 1) return true;
    if (pagination && pagination.currentPage < pagination.totalPages) return true;
    return false;
  }, [currentIndex, dataList.length, pagination]);

  const [isNavigating, setIsNavigating] = useState(false);

  const handlePrev = useCallback(async () => {
    if (isNavigating) return;
    
    if (currentIndex > 0 && onNavigate) {
      onNavigate(dataList[currentIndex - 1]);
    } else if (pagination && pagination.currentPage > 1 && onPageChange) {
      setIsNavigating(true);
      try {
        const newList = await onPageChange(pagination.currentPage - 1);
        if (newList && newList.length > 0 && onNavigate) {
          onNavigate(newList[newList.length - 1]);
        }
      } finally {
        setIsNavigating(false);
      }
    }
  }, [currentIndex, dataList, onNavigate, pagination, onPageChange, isNavigating]);

  const handleNext = useCallback(async () => {
    if (isNavigating) return;
    
    if (currentIndex >= 0 && currentIndex < dataList.length - 1 && onNavigate) {
      onNavigate(dataList[currentIndex + 1]);
    } else if (pagination && pagination.currentPage < pagination.totalPages && onPageChange) {
      setIsNavigating(true);
      try {
        const newList = await onPageChange(pagination.currentPage + 1);
        if (newList && newList.length > 0 && onNavigate) {
          onNavigate(newList[0]);
        }
      } finally {
        setIsNavigating(false);
      }
    }
  }, [currentIndex, dataList, onNavigate, pagination, onPageChange, isNavigating]);

  // 格式化时间
  const formatDateTime = (dateStr: string | undefined) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // 获取凭据值显示
  const getCredentialValueDisplay = useMemo(() => {
    if (!credential) return '-';
    const value = context === 'development' ? credential.test_value : credential.production_value;
    if (!value) return '-';
    return `${value.username}:${value.password}`;
  }, [credential, context]);

  // 编辑凭据
  const handleEdit = () => {
    if (credential) {
      onEdit(credential);
    }
  };

  // 删除凭据
  const handleDelete = () => {
    if (!credential) return;
    Modal.confirm({
      title: t('credential.deleteModal.title'),
      icon: <IconDeleteStroked style={{ color: 'var(--semi-color-danger)' }} />,
      content: t('credential.deleteModal.confirmMessage', { name: credential.credential_name }),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      okButtonProps: { type: 'danger' },
      onOk: async () => {
        // 模拟删除
        await new Promise((resolve) => setTimeout(resolve, 500));
        Toast.success(t('credential.deleteModal.success'));
        onDelete(credential);
        onClose();
      },
    });
  };

  // 描述数据
  const descriptionData = useMemo(() => {
    if (!credential) return [];
    return [
      { key: t('credential.detail.name'), value: credential.credential_name },
      {
        key: t('credential.detail.type'),
        value: (
          <Tag color={typeConfig[credential.credential_type].color} type="light">
            {t(typeConfig[credential.credential_type].i18nKey)}
          </Tag>
        ),
      },
      {
        key: context === 'development' 
          ? t('credential.detail.testValue') 
          : t('credential.detail.productionValue'),
        value: <Text>{getCredentialValueDisplay}</Text>,
      },
      { key: t('common.description'), value: credential.description || '-' },
      ...(credential.credential_type === 'PERSONAL_REF' ? [
        { key: t('credential.detail.linkedPersonalCredential'), value: credential.linked_personal_credential_value || '-' },
      ] : []),
      { key: t('common.creator'), value: credential.created_by_name || '-' },
      { key: t('common.createTime'), value: formatDateTime(credential.created_at) },
      { key: t('common.updateTime'), value: formatDateTime(credential.updated_at) },
    ];
  }, [credential, context, getCredentialValueDisplay, t]);

  // 导出使用记录
  const handleExport = async () => {
    Toast.info(t('credential.usage.exporting'));
    await new Promise((resolve) => setTimeout(resolve, 1000));
    Toast.success(t('credential.usage.exportSuccess'));
  };

  // 计算筛选数量
  const filterCount = userFilter.length + (dateRange ? 1 : 0);

  // 使用记录表格列定义
  const usageColumns = [
    {
      title: t('credential.usage.table.user'),
      dataIndex: 'user_name',
      key: 'user_name',
      width: 100,
    },
    {
      title: t('credential.usage.table.usageTime'),
      dataIndex: 'usage_time',
      key: 'usage_time',
      width: 160,
      render: (text: string) => formatDateTime(text),
    },
    {
      title: t('credential.usage.table.type'),
      dataIndex: 'usage_type',
      key: 'usage_type',
      width: 80,
      render: (type: UsageType) => (
        <Tag color={type === 'debug' ? 'blue' : 'green'} type="light">
          {t(`credential.usage.type.${type}`)}
        </Tag>
      ),
    },
    {
      title: t('credential.usage.table.process'),
      dataIndex: 'process_name',
      key: 'process_name',
      width: 140,
      render: (text: string | null) => (
        text ? (
          <Tooltip content={text} position="top">
            <span className="credential-detail-drawer-cell-ellipsis">
              {text}
            </span>
          </Tooltip>
        ) : (
          <span>-</span>
        )
      ),
    },
    {
      title: t('credential.usage.table.processVersion'),
      dataIndex: 'process_version',
      key: 'process_version',
      width: 80,
    },
    {
      title: t('credential.usage.table.worker'),
      dataIndex: 'worker_name',
      key: 'worker_name',
      width: 100,
    },
    {
      title: t('credential.usage.table.taskId'),
      dataIndex: 'task_id',
      key: 'task_id',
      width: 120,
      render: (text: string | null) => (
        <span className="credential-detail-drawer-cell-task">{text || '-'}</span>
      ),
    },
    {
      title: t('credential.usage.table.screenshot'),
      dataIndex: 'screenshot_url',
      key: 'screenshot_url',
      width: 80,
      render: (url: string | null) =>
        url ? (
          <Image
            src={url}
            width={50}
            height={35}
            preview
            style={{ cursor: 'pointer', borderRadius: 4 }}
          />
        ) : (
          '-'
        ),
    },
  ];

  const usageRange = usageListResponse?.range;
  const usageTotal = usageRange?.total || 0;

  if (!credential) return null;

  return (
    <SideSheet
      title={
        <Row type="flex" justify="space-between" align="middle" className="credential-detail-drawer-header">
          <Col>
            <Title heading={5} className="credential-detail-drawer-header-title">
              {credential.credential_name}
            </Title>
          </Col>
          <Col>
            <Space spacing={8}>
              {(dataList.length > 1 || (pagination && pagination.totalPages > 1)) && (
                <>
                  <Tooltip content={t('common.previous')}>
                    <Button icon={<IconChevronLeft />} theme="borderless" size="small" disabled={!canGoPrev || isNavigating} onClick={handlePrev} loading={isNavigating} />
                  </Tooltip>
                  <Tooltip content={t('common.next')}>
                    <Button icon={<IconChevronRight />} theme="borderless" size="small" disabled={!canGoNext || isNavigating} onClick={handleNext} loading={isNavigating} />
                  </Tooltip>
                  <Divider layout="vertical" className="credential-detail-drawer-header-divider" />
                </>
              )}
              <Tooltip content={t('common.edit')}>
                <Button icon={<IconEditStroked />} theme="borderless" size="small" onClick={handleEdit} />
              </Tooltip>
              <Tooltip content={t('common.delete')}>
                <Button icon={<IconDeleteStroked className="credential-detail-drawer-header-delete-icon" />} theme="borderless" size="small" onClick={handleDelete} />
              </Tooltip>
              <Divider layout="vertical" className="credential-detail-drawer-header-divider" />
              <Tooltip content={isFullscreen ? t('common.exitFullscreen') : t('common.fullscreen')}>
                <Button icon={isFullscreen ? <IconMinimize /> : <IconMaximize />} theme="borderless" size="small" onClick={toggleFullscreen} />
              </Tooltip>
              <Tooltip content={t('common.close')}>
                <Button icon={<IconClose />} theme="borderless" size="small" onClick={onClose} className="credential-detail-drawer-header-close-btn" />
              </Tooltip>
            </Space>
          </Col>
        </Row>
      }
      visible={visible}
      onCancel={onClose}
      placement="right"
      width={isFullscreen ? '100%' : drawerWidth}
      mask={false}
      footer={null}
      closable={false}
      className={`card-sidesheet resizable-sidesheet credential-detail-drawer ${isFullscreen ? 'fullscreen-sidesheet' : ''}`}
    >
      {!isFullscreen && <div className="credential-detail-drawer-resize-handle" onMouseDown={handleMouseDown} />}
      
      <Tabs activeKey={activeTab} onChange={setActiveTab} className="credential-detail-drawer-tabs">
        <TabPane tab={t('credential.detail.tabs.basicInfo')} itemKey="basic">
          <div className="credential-detail-drawer-content">
            <Descriptions data={descriptionData} align="left" />
          </div>
        </TabPane>
        
        <TabPane tab={t('credential.detail.tabs.usageRecords')} itemKey="usage">
          <div className="credential-detail-drawer-usage">
            {/* 筛选区域 */}
            <div className="credential-detail-drawer-usage-filter">
              <Row type="flex" justify="space-between" align="middle">
                <Col>
                  <Space>
                    <DatePicker
                      type="dateRange"
                      placeholder={[t('common.startDate'), t('common.endDate')]}
                      value={dateRange || undefined}
                      onChange={(dates) => {
                        setDateRange(dates as [Date, Date] | null);
                        setUsageQueryParams((prev) => ({ ...prev, page: 1 }));
                      }}
                      style={{ width: 280 }}
                    />
                    <Popover
                      visible={filterPopoverVisible}
                      onVisibleChange={setFilterPopoverVisible}
                      trigger="click"
                      position="bottomLeft"
                      content={
                        <div className="credential-detail-drawer-filter-popover">
                          <div className="credential-detail-drawer-filter-popover-section">
                            <Text strong className="credential-detail-drawer-filter-popover-label">
                              {t('credential.usage.filter.user')}
                            </Text>
                            <CheckboxGroup
                              value={userFilter}
                              onChange={(values) => {
                                setUserFilter(values as string[]);
                                setUsageQueryParams((prev) => ({ ...prev, page: 1 }));
                              }}
                              options={userFilterOptions}
                              direction="vertical"
                            />
                          </div>
                          <div className="credential-detail-drawer-filter-popover-footer">
                            <Button theme="borderless" onClick={() => {
                              setUserFilter([]);
                              setUsageQueryParams((prev) => ({ ...prev, page: 1 }));
                            }} disabled={userFilter.length === 0}>
                              {t('common.reset')}
                            </Button>
                            <Button theme="solid" type="primary" onClick={() => setFilterPopoverVisible(false)}>
                              {t('common.confirm')}
                            </Button>
                          </div>
                        </div>
                      }
                    >
                      <Button
                        icon={<IconFilter />}
                        type={filterCount > 0 ? 'primary' : 'tertiary'}
                        theme={filterCount > 0 ? 'solid' : 'light'}
                      >
                        {t('common.filter')}{filterCount > 0 ? ` (${filterCount})` : ''}
                      </Button>
                    </Popover>
                  </Space>
                </Col>
                <Col>
                  <Button icon={<Download size={14} />} onClick={handleExport}>
                    {t('common.export')}
                  </Button>
                </Col>
              </Row>
            </div>

            {/* 使用记录表格 */}
            <Table
              columns={usageColumns}
              dataSource={usageListResponse?.data || []}
              rowKey="id"
              loading={usageLoading}
              pagination={{
                currentPage: usageQueryParams.page,
                pageSize: usageQueryParams.pageSize,
                total: usageTotal,
                onPageChange: (page) => setUsageQueryParams((prev) => ({ ...prev, page })),
                showSizeChanger: true,
                showTotal: true,
              }}
              scroll={{ y: 'calc(100vh - 350px)' }}
            />
          </div>
        </TabPane>
      </Tabs>
    </SideSheet>
  );
};

export default CredentialDetailDrawer;
