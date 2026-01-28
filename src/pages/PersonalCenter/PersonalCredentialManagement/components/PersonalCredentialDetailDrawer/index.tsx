import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  SideSheet,
  Typography,
  Button,
  Descriptions,
  Tabs,
  TabPane,
  Table,
  Divider,
  Tooltip,
  DatePicker,
  Row,
  Col,
  Space,
  Toast,
  Modal,
  Tag,
  Popover,
  CheckboxGroup,
  Image,
} from '@douyinfe/semi-ui';
import EmptyState from '@/components/EmptyState';
import DetailSkeleton from '@/components/DetailSkeleton';
import TableSkeleton from '@/components/TableSkeleton';
import {
  IconEditStroked,
  IconDeleteStroked,
  IconMaximize,
  IconMinimize,
  IconClose,
  IconLink,
  IconChevronDown,
  IconChevronUp,
  IconChevronLeft,
  IconChevronRight,
  IconFilter,
  IconUnlink,
  IconEyeOpened,
} from '@douyinfe/semi-icons';
import { Download } from 'lucide-react';
import type { PersonalCredential } from '../../index';
import { useUsageRecordFilter } from '@/hooks/useUsageRecordFilter';

import './index.less';

const { Title, Text } = Typography;

// 描述展开收起的阈值（字符数）
const DESCRIPTION_COLLAPSE_THRESHOLD = 100;

// ============= 使用记录类型 =============
interface UsageRecord {
  id: string;
  user_id: string;
  user_name: string;
  usage_time: string;
  usage_type: 'DEBUG' | 'TASK';
  description: string;
  process_name: string;
  process_version: string;
  worker_name: string;
  task_number: string;
  screenshot_url: string | null;
}

// ============= 关联凭据类型 =============
interface LinkedCredential {
  credential_id: string;
  credential_name: string;
  credential_type: string;
  description: string | null;
  created_at: string;
}

// ============= Mock数据生成 =============
const generateMockUsageRecords = (): UsageRecord[] => {
  const users = ['张三', '李四', '王五', '赵六', '钱七'];
  const usageTypes: ('DEBUG' | 'TASK')[] = ['DEBUG', 'TASK'];
  const processes = ['订单处理流程', '数据同步流程', '报表生成流程', '邮件发送流程'];
  const workers = ['Worker-01', 'Worker-02', 'Worker-03', 'Worker-04'];
  
  // 使用 picsum.photos 提供真实可访问的图片
  const screenshotUrls = [
    'https://picsum.photos/seed/usage1/800/600',
    'https://picsum.photos/seed/usage2/800/600',
    'https://picsum.photos/seed/usage3/800/600',
  ];

  return Array.from({ length: 25 }, (_, i) => ({
    id: `usage-${i}`,
    user_id: `user-${(i % 5) + 1}`,
    user_name: users[i % users.length],
    usage_time: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    usage_type: usageTypes[Math.floor(Math.random() * usageTypes.length)],
    description: `凭据被成功获取`,
    process_name: processes[Math.floor(Math.random() * processes.length)],
    process_version: `1.0.${Math.floor(Math.random() * 10)}`,
    worker_name: workers[Math.floor(Math.random() * workers.length)],
    task_number: `TASK-${String(i + 1).padStart(6, '0')}`,
    screenshot_url: i % 3 === 0 ? screenshotUrls[i % screenshotUrls.length] : null,
  }));
};

// 生成关联凭据的Mock数据
const generateMockLinkedCredentials = (count: number): LinkedCredential[] => {
  const names = ['企业邮箱凭据', '数据库连接凭据', 'SSH服务器凭据', 'Git仓库凭据', 'ERP系统凭据'];
  const types = ['PERSONAL_REF', 'PERSONAL_REF', 'PERSONAL_REF'];
  return Array.from({ length: count }, (_, i) => ({
    credential_id: `cred-${i + 1}`,
    credential_name: names[i % names.length],
    credential_type: types[i % types.length],
    description: `${names[i % names.length]}的描述信息`,
    created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  }));
};

// ============= 组件Props =============
interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  total: number;
}

interface PersonalCredentialDetailDrawerProps {
  visible: boolean;
  credential: PersonalCredential | null;
  onClose: () => void;
  onEdit: (credential: PersonalCredential) => void;
  onDelete: (credential: PersonalCredential) => void;
  onLinkCredential: (credential: PersonalCredential) => void;
  onRefresh: () => void;
  // 导航相关
  dataList?: PersonalCredential[];
  onNavigate?: (credential: PersonalCredential) => void;
  // 分页相关 - 用于自动翻页
  pagination?: PaginationInfo;
  onPageChange?: (page: number) => Promise<PersonalCredential[] | void>;
  // 初始显示的tab
  initialTab?: 'basic' | 'linked' | 'usage';
}

const PersonalCredentialDetailDrawer = ({
  visible,
  credential,
  onClose,
  onEdit,
  onDelete,
  onLinkCredential,
  onRefresh,
  dataList = [],
  onNavigate,
  pagination,
  onPageChange,
  initialTab = 'basic',
}: PersonalCredentialDetailDrawerProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'basic' | 'linked' | 'usage'>(initialTab);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [drawerWidth, setDrawerWidth] = useState(() => {
    const saved = localStorage.getItem('personalCredentialDetailDrawerWidth');
    return saved ? Math.max(Number(saved), 576) : 900;
  });
  
  // 用于追踪是否是首次打开抽屉（通过外部操作打开）
  const isInitialOpenRef = useRef(true);
  const prevVisibleRef = useRef(visible);

  // 关联凭据数据
  const [linkedCredentials, setLinkedCredentials] = useState<LinkedCredential[]>([]);
  const [linkedCredentialsLoading, setLinkedCredentialsLoading] = useState(false);

  // 使用记录数据
  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>([]);
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageQueryParams, setUsageQueryParams] = useState({ page: 1, pageSize: 20 });
  const [usageTotal, setUsageTotal] = useState(0);
  const [isUsageInitialLoad, setIsUsageInitialLoad] = useState(true);
  
  // 使用筛选 Hook
  const {
    userFilter,
    setUserFilter,
    dateRange,
    filterPopoverVisible,
    setFilterPopoverVisible,
    filterCount,
    resetFilters,
    handleDateRangeChange,
    datePresets,
  } = useUsageRecordFilter({
    onFilterChange: () => setUsageQueryParams((prev) => ({ ...prev, page: 1 })),
  });

  // 使用者筛选选项
  const userFilterOptions = [
    { value: 'user-1', label: '张三' },
    { value: 'user-2', label: '李四' },
    { value: 'user-3', label: '王五' },
    { value: 'user-4', label: '赵六' },
    { value: 'user-5', label: '钱七' },
  ];

  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(drawerWidth);

  // 加载使用记录
  const loadUsageRecords = useCallback(async () => {
    if (!credential) return;
    setUsageLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      let records = generateMockUsageRecords();
      
      // 使用者筛选
      if (userFilter.length > 0) {
        records = records.filter((item) => userFilter.includes(item.user_id));
      }
      
      // 时间段筛选
      if (dateRange?.[0]) {
        records = records.filter((item) => new Date(item.usage_time) >= dateRange[0]);
      }
      if (dateRange?.[1]) {
        records = records.filter((item) => new Date(item.usage_time) <= dateRange[1]);
      }
      
      const offset = (usageQueryParams.page - 1) * usageQueryParams.pageSize;
      const pagedRecords = records.slice(offset, offset + usageQueryParams.pageSize);
      
      setUsageRecords(pagedRecords);
      setUsageTotal(records.length);
    } catch (error) {
      console.error('加载使用记录失败:', error);
    } finally {
      setUsageLoading(false);
      setIsUsageInitialLoad(false);
    }
  }, [credential, userFilter, dateRange, usageQueryParams]);

  // 当切换到使用记录tab时加载数据
  useEffect(() => {
    if (visible && activeTab === 'usage' && credential) {
      loadUsageRecords();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, activeTab, credential?.credential_id, userFilter, dateRange, usageQueryParams]);

  // 监听抽屉打开/关闭状态，用于判断是否是首次打开
  useEffect(() => {
    if (visible && !prevVisibleRef.current) {
      // 抽屉从关闭变为打开，标记为首次打开
      isInitialOpenRef.current = true;
    }
    prevVisibleRef.current = visible;
  }, [visible]);

  // 切换凭据时重置状态，加载关联凭据
  // 只在首次打开时应用 initialTab，导航切换时保持当前tab
  useEffect(() => {
    if (credential) {
      // 只在首次打开时应用 initialTab
      if (isInitialOpenRef.current) {
        setActiveTab(initialTab);
        isInitialOpenRef.current = false;
      }
      
      setIsDescriptionExpanded(false);
      setUsageQueryParams({ page: 1, pageSize: 20 });
      resetFilters();
      setUsageRecords([]);
      setIsUsageInitialLoad(true);
      
      // 加载关联凭据
      setLinkedCredentialsLoading(true);
      const count = credential.linked_credentials_count || 0;
      setTimeout(() => {
        setLinkedCredentials(generateMockLinkedCredentials(count));
        setLinkedCredentialsLoading(false);
      }, 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [credential?.credential_id, initialTab]);

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
    localStorage.setItem('personalCredentialDetailDrawerWidth', String(drawerWidth));
  }, [drawerWidth]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  // 导航逻辑
  const currentIndex = useMemo(() => {
    if (!credential || dataList.length === 0) return -1;
    return dataList.findIndex(item => item.credential_id === credential.credential_id);
  }, [credential, dataList]);

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

  // 删除凭据
  const handleDelete = useCallback(() => {
    if (!credential) return;
    Modal.confirm({
      title: t('personalCredential.deleteModal.title'),
      icon: <IconDeleteStroked style={{ color: 'var(--semi-color-danger)' }} />,
      content: t('personalCredential.deleteModal.confirmMessage'),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      okButtonProps: { type: 'danger' },
      onOk: async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        Toast.success(t('personalCredential.deleteModal.success'));
        onDelete(credential);
        onClose();
      },
    });
  }, [credential, t, onDelete, onClose]);

  // 解除关联凭据
  const handleUnlinkCredential = useCallback((linkedCredential: LinkedCredential) => {
    Modal.confirm({
      title: t('personalCredential.linkedCredentials.unlinkModal.title'),
      icon: <IconDeleteStroked style={{ color: 'var(--semi-color-danger)' }} />,
      content: t('personalCredential.linkedCredentials.unlinkModal.content', { name: linkedCredential.credential_name }),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      okButtonProps: { type: 'danger' },
      onOk: async () => {
        // 模拟解除关联
        await new Promise((resolve) => setTimeout(resolve, 500));
        Toast.success(t('personalCredential.linkedCredentials.unlinkModal.success'));
        // 从列表中移除
        setLinkedCredentials((prev) => prev.filter((item) => item.credential_id !== linkedCredential.credential_id));
        // 刷新主列表
        onRefresh();
      },
    });
  }, [t, onRefresh]);

  // 跳转到凭据详情页面
  const handleNavigateToCredential = useCallback((linkedCredential: LinkedCredential) => {
    // 跳转到开发中心的凭据管理页面，并传递凭据ID作为查询参数
    navigate(`/dev-center/business-assets/credentials?credentialId=${linkedCredential.credential_id}`);
    onClose();
  }, [navigate, onClose]);

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

  // 处理描述展示
  const description = credential?.description || '-';
  const isDescriptionLong = description.length > DESCRIPTION_COLLAPSE_THRESHOLD;
  const displayDescription = isDescriptionLong && !isDescriptionExpanded 
    ? description.slice(0, DESCRIPTION_COLLAPSE_THRESHOLD) + '...' 
    : description;

  const renderDescriptionValue = () => {
    if (description === '-') return '-';
    
    return (
      <div className="personal-credential-detail-drawer-description">
        <span className="personal-credential-detail-drawer-description-text">{displayDescription}</span>
        {isDescriptionLong && (
          <Button
            theme="borderless"
            size="small"
            type="tertiary"
            className="personal-credential-detail-drawer-description-toggle"
            icon={isDescriptionExpanded ? <IconChevronUp /> : <IconChevronDown />}
            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
          >
            {isDescriptionExpanded ? t('common.collapse') : t('common.expand')}
          </Button>
        )}
      </div>
    );
  };

  // 基本信息描述数据
  const descriptionData = useMemo(() => {
    if (!credential) return [];
    return [
      {
        key: t('personalCredential.table.name'),
        value: credential.credential_name,
      },
      {
        key: t('personalCredential.table.username'),
        value: credential.username,
      },
      {
        key: t('common.description'),
        value: renderDescriptionValue(),
      },
      {
        key: t('common.createTime'),
        value: formatDateTime(credential.created_at),
      },
      {
        key: t('common.updateTime'),
        value: formatDateTime(credential.updated_at),
      },
    ];
  }, [credential, t, isDescriptionExpanded]);

  // 导出使用记录
  const handleExport = async () => {
    Toast.info(t('credential.usage.exporting'));
    await new Promise((resolve) => setTimeout(resolve, 1000));
    Toast.success(t('credential.usage.exportSuccess'));
  };

  // 使用记录表格列
  const usageColumns = useMemo(() => [
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
      render: (type: 'DEBUG' | 'TASK') => (
        <Tag color={type === 'DEBUG' ? 'blue' : 'green'} type="light">
          {t(`credential.usage.type.${type.toLowerCase()}`)}
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
            <span className="personal-credential-detail-drawer-cell-ellipsis">
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
      dataIndex: 'task_number',
      key: 'task_number',
      width: 120,
      render: (text: string | null) => (
        <span className="personal-credential-detail-drawer-cell-task">{text || '-'}</span>
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
            preview={{
              src: url,
              getPopupContainer: () => document.body,
              zIndex: 1100,
            }}
            onClick={(e) => e.stopPropagation()}
            style={{ cursor: 'pointer', borderRadius: 4, objectFit: 'cover' }}
            fallback={<div style={{ width: 50, height: 35, background: 'var(--semi-color-fill-1)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--semi-color-text-2)' }}>加载失败</div>}
          />
        ) : (
          '-'
        ),
    },
  ], [t]);

  if (!credential) return null;

  return (
    <SideSheet
      visible={visible}
      onCancel={onClose}
      closable={false}
      mask={false}
      placement="right"
      width={isFullscreen ? '100%' : drawerWidth}
      footer={null}
      className={`card-sidesheet resizable-sidesheet personal-credential-detail-drawer ${isFullscreen ? 'fullscreen-sidesheet' : ''}`}
      title={
        <Row type="flex" justify="space-between" align="middle" className="personal-credential-detail-drawer-header">
          <Col>
            <Title heading={5} className="personal-credential-detail-drawer-header-title">
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
                  <Divider layout="vertical" className="personal-credential-detail-drawer-header-divider" />
                </>
              )}
              <Tooltip content={t('common.edit')}>
                <Button icon={<IconEditStroked />} theme="borderless" size="small" onClick={() => onEdit(credential)} />
              </Tooltip>
              <Tooltip content={t('personalCredential.actions.linkCredential')}>
                <Button icon={<IconLink />} theme="borderless" size="small" onClick={() => onLinkCredential(credential)} />
              </Tooltip>
              <Tooltip content={t('common.delete')}>
                <Button icon={<IconDeleteStroked className="personal-credential-detail-drawer-header-delete-icon" />} theme="borderless" size="small" onClick={handleDelete} />
              </Tooltip>
              <Divider layout="vertical" className="personal-credential-detail-drawer-header-divider" />
              <Tooltip content={isFullscreen ? t('common.exitFullscreen') : t('common.fullscreen')}>
                <Button icon={isFullscreen ? <IconMinimize /> : <IconMaximize />} theme="borderless" size="small" onClick={toggleFullscreen} />
              </Tooltip>
              <Tooltip content={t('common.close')}>
                <Button icon={<IconClose />} theme="borderless" size="small" onClick={onClose} className="personal-credential-detail-drawer-header-close-btn" />
              </Tooltip>
            </Space>
          </Col>
        </Row>
      }
    >
      {/* 拖拽调整宽度手柄 */}
      {!isFullscreen && (
        <div className="personal-credential-detail-drawer-resize-handle" onMouseDown={handleMouseDown} />
      )}

      {isNavigating ? (
        <DetailSkeleton rows={5} showTabs={true} sections={1} />
      ) : (
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as 'basic' | 'linked' | 'usage')}
          className="personal-credential-detail-drawer-tabs"
        >
          <TabPane
            tab={t('credential.detail.tabs.basicInfo')}
            itemKey="basic"
          >
            <div className="personal-credential-detail-drawer-content">
              <Descriptions
                data={descriptionData}
                align="left"
              />
            </div>
          </TabPane>

          <TabPane
            tab={t('personalCredential.linkedCredentials.title')}
            itemKey="linked"
          >
            <div className="personal-credential-detail-drawer-linked">
              {linkedCredentialsLoading ? (
                <TableSkeleton rows={5} columns={4} columnWidths={['30%', '35%', '20%', '15%']} />
              ) : (
                <Table
                  columns={[
                    {
                      title: t('personalCredential.linkedCredentials.credentialName'),
                      dataIndex: 'credential_name',
                      key: 'credential_name',
                      render: (text: string) => (
                        <span>{text}</span>
                      ),
                    },
                    {
                      title: t('common.description'),
                      dataIndex: 'description',
                      key: 'description',
                      render: (text: string | null) => text || '-',
                    },
                    {
                      title: t('common.createTime'),
                      dataIndex: 'created_at',
                      key: 'created_at',
                      width: 160,
                      render: (text: string) => formatDateTime(text),
                    },
                    {
                      title: t('common.actions'),
                      key: 'actions',
                      width: 100,
                      render: (_: unknown, record: LinkedCredential) => (
                        <Space spacing={4}>
                          <Tooltip content={t('common.viewDetail')}>
                            <Button
                              icon={<IconEyeOpened />}
                              theme="borderless"
                              size="small"
                              type="tertiary"
                              onClick={() => handleNavigateToCredential(record)}
                            />
                          </Tooltip>
                          <Tooltip content={t('personalCredential.linkedCredentials.unlink')}>
                            <Button
                              icon={<IconUnlink />}
                              theme="borderless"
                              size="small"
                              type="tertiary"
                              onClick={() => handleUnlinkCredential(record)}
                            />
                          </Tooltip>
                        </Space>
                      ),
                    },
                  ]}
                  dataSource={linkedCredentials}
                  rowKey="credential_id"
                  pagination={false}
                  empty={<EmptyState description={t('personalCredential.linkedCredentials.empty')} />}
                />
              )}
            </div>
          </TabPane>
          
          <TabPane
            tab={t('credential.detail.tabs.usageRecords')}
            itemKey="usage"
          >
            <div className="personal-credential-detail-drawer-usage">
              {/* 筛选区域 */}
              <div className="personal-credential-detail-drawer-usage-filter">
                <Row type="flex" justify="space-between" align="middle">
                  <Col>
                    <Space>
                      <DatePicker
                        type="dateRange"
                        placeholder={[t('common.startDate'), t('common.endDate')]}
                        value={dateRange || undefined}
                        onChange={(dates) => handleDateRangeChange(dates as Date[] | null | undefined)}
                        presets={datePresets}
                        style={{ width: 280 }}
                      />
                      <Popover
                        visible={filterPopoverVisible}
                        onVisibleChange={setFilterPopoverVisible}
                        trigger="click"
                        position="bottomLeft"
                        content={
                          <div className="personal-credential-detail-drawer-filter-popover">
                            <div className="personal-credential-detail-drawer-filter-popover-section">
                              <Text strong className="personal-credential-detail-drawer-filter-popover-label">
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
                            <div className="personal-credential-detail-drawer-filter-popover-footer">
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
              {isUsageInitialLoad ? (
                <TableSkeleton rows={8} columns={8} columnWidths={['10%', '15%', '8%', '14%', '8%', '10%', '12%', '8%']} />
              ) : (
                <Table
                  columns={usageColumns}
                  dataSource={usageRecords}
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
                  empty={<EmptyState description={t('credential.usage.empty')} />}
                />
              )}
            </div>
          </TabPane>
        </Tabs>
      )}
    </SideSheet>
  );
};

export default PersonalCredentialDetailDrawer;
