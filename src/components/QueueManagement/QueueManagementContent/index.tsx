import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Button,
  Input,
  Table,
  Tag,
  Dropdown,
  Space,
  Toast,
  Modal,
  Row,
  Col,
  Typography,
  Tooltip,
  Breadcrumb,
  Pagination,
} from '@douyinfe/semi-ui';
import { IconSearchStroked, IconDeleteStroked } from '@douyinfe/semi-icons';
import EmptyState from '@/components/EmptyState';
import TableSkeleton from '@/components/TableSkeleton';
import FilterPopover from '@/components/FilterPopover';
import DepartmentSelect from '@/components/DepartmentSelect';
import { debounce } from 'lodash';
import { Ellipsis, List, Pencil, Plus, Trash2, UserPlus } from 'lucide-react';
import type {
  LYQueueResponse,
  LYQueueListResultResponse,
  GetQueuesParams,
} from '@/api/index';
import CreateQueueModal from './components/CreateQueueModal';
import EditQueueModal from './components/EditQueueModal';
import QueueDetailDrawer from './components/QueueDetailDrawer';
import { useCollaboratorAction } from '@/hooks/useCollaboratorAction';

import './index.less';

// Mock数据生成
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const generateMockQueue = (index: number): LYQueueResponse => {
  const names = [
    'Order Processing Queue',
    'Email Sending Queue',
    'Data Sync Queue',
    'Report Generation Queue',
    'Notification Push Queue',
    'File Processing Queue',
    'Task Scheduling Queue',
    'Log Collection Queue',
  ];

  const deptNames = ['Finance Department', 'R&D Center', 'Enterprise Business Center', 'Human Resources Department'];
  const deptIds = ['dept-finance', 'dept-rd', 'dept-enterprise', 'dept-hr'];

  return {
    queue_id: generateUUID(),
    queue_name: names[index % names.length],
    description: index === 0
      ? 'A high-priority order processing message queue for receiving and distributing orders from e-commerce platforms, ERP systems, and customer service systems. Supports message persistence, priority sorting, dead letter queues, and delayed consumption. Configured with auto-scaling based on message backlog.'
      : `Description for ${names[index % names.length]}, used for processing related business messages.`,
    is_published: index % 3 !== 0,
    test_unconsumed_count: Math.floor(Math.random() * 100),
    test_consumed_count: Math.floor(Math.random() * 500),
    test_failed_count: Math.floor(Math.random() * 10),
    prod_unconsumed_count: Math.floor(Math.random() * 200),
    prod_consumed_count: Math.floor(Math.random() * 1000),
    prod_failed_count: Math.floor(Math.random() * 20),
    owning_department_id: deptIds[index % deptIds.length],
    owning_department_name: deptNames[index % deptNames.length],
    created_by: `user-00${(index % 4) + 1}`,
    created_by_name: ['John Smith', 'Jane Doe', 'Mike Wang', 'David Zhao'][index % 4],
    created_by_department: ['R&D Dept', 'Product Dept', 'QA Dept', 'Ops Dept'][index % 4],
    created_by_role: ['Senior Engineer', 'Product Manager', 'QA Engineer', 'Ops Engineer'][index % 4],
    created_by_email: ['john.smith@example.com', 'jane.doe@example.com', 'mike.wang@example.com', 'david.zhao@example.com'][index % 4],
    created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
};

const generateMockQueueList = (): LYQueueResponse[] => {
  return Array.from({ length: 15 }, (_, i) => generateMockQueue(i));
};

// 模拟API调用
const fetchQueueList = async (
  params: GetQueuesParams
): Promise<LYQueueListResultResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  let data = generateMockQueueList();

  // 调度中心只显示已发布的队列
  if (params.context === 'scheduling') {
    data = data.filter((item) => item.is_published);
  }

  // 关键词筛选
  if (params.keyword) {
    const keyword = params.keyword.toLowerCase();
    data = data.filter((item) => item.queue_name.toLowerCase().includes(keyword));
  }

  // 发布状态筛选
  if (params.publishedFilter !== null && params.publishedFilter !== undefined) {
    data = data.filter((item) => item.is_published === params.publishedFilter);
  }

  // 部门筛选
  if ((params as any).departmentFilter && (params as any).departmentFilter.length > 0) {
    const deptNames: string[] = (params as any).departmentFilter;
    data = data.filter((item) => deptNames.includes((item as any).owning_department_name));
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

interface QueryParams {
  page: number;
  pageSize: number;
  keyword: string;
}

export interface QueueManagementContentProps {
  context: 'development' | 'scheduling';
}

const QueueManagementContent = ({ context }: QueueManagementContentProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // 搜索框输入值（即时显示）
  const [searchValue, setSearchValue] = useState('');

  // 查询参数
  const [queryParams, setQueryParams] = useState<QueryParams>({
    page: 1,
    pageSize: 20,
    keyword: '',
  });

  // 发布状态筛选（仅开发中心使用）
  const [publishedFilter, setPublishedFilter] = useState<boolean | null>(null);
  const [filterPopoverVisible, setFilterPopoverVisible] = useState(false);
  // 部门筛选
  const [departmentFilter, setDepartmentFilter] = useState<string[]>([]);

  // 列表数据
  const [listResponse, setListResponse] = useState<LYQueueListResultResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // 选中的队列（用于编辑/详情）
  const [editingQueue, setEditingQueue] = useState<LYQueueResponse | null>(null);
  const [selectedQueue, setSelectedQueue] = useState<LYQueueResponse | null>(null);

  // 模态框/抽屉状态
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [detailInitialTab, setDetailInitialTab] = useState('basic');
  const { openCollaborator, renderCollaboratorPanel } = useCollaboratorAction();

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchQueueList({
        keyword: queryParams.keyword || undefined,
        context,
        offset: (queryParams.page - 1) * queryParams.pageSize,
        size: queryParams.pageSize,
        publishedFilter: context === 'development' ? publishedFilter : null,
        departmentFilter,
      } as any);
      setListResponse(response);
      return response.data;
    } catch (error) {
      console.error('加载队列列表失败:', error);
      Toast.error(t('queue.list.loadError'));
      return [];
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [queryParams, publishedFilter, departmentFilter, context, t]);

  // 翻页并返回新数据（用于抽屉导航时自动翻页）
  const handleDrawerPageChange = useCallback(async (page: number): Promise<LYQueueResponse[]> => {
    setQueryParams(prev => ({ ...prev, page }));
    
    try {
      const response = await fetchQueueList({
        keyword: queryParams.keyword || undefined,
        context,
        offset: (page - 1) * queryParams.pageSize,
        size: queryParams.pageSize,
        publishedFilter: context === 'development' ? publishedFilter : null,
        departmentFilter,
      } as any);
      setListResponse(response);
      return response.data;
    } catch {
      return [];
    }
  }, [queryParams, publishedFilter, departmentFilter, context]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 从 URL 参数中恢复抽屉状态（用于从消息列表页面返回）
  useEffect(() => {
    const queueIdFromUrl = searchParams.get('queueId');
    
    if (queueIdFromUrl && listResponse && listResponse.data.length > 0) {
      const queue = listResponse.data.find((q) => q.queue_id === queueIdFromUrl);
      if (queue) {
        setSelectedQueue(queue);
        setDetailDrawerVisible(true);
        // 清除 URL 参数
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, listResponse, setSearchParams]);

  // 搜索防抖
  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setQueryParams((prev) => ({ ...prev, page: 1, keyword: value }));
      }, 500),
    []
  );

  const handleSearch = (value: string) => {
    setSearchValue(value);  // 立即更新输入框显示
    debouncedSearch(value); // 防抖更新查询参数
  };

  // 发布状态筛选选项
  const publishedFilterOptions = [
    { value: true, label: t('queue.detail.published') },
    { value: false, label: t('queue.detail.unpublished') },
  ];

  // 计算筛选数量
  const filterCount = publishedFilter !== null ? 1 : 0;

  // 点击行查看详情
  const handleRowClick = (record: LYQueueResponse) => {
    setSelectedQueue(record);
    setDetailInitialTab('basic');
    setDetailDrawerVisible(true);
  };

  // 查看消息列表
  const handleViewMessages = (record: LYQueueResponse) => {
    const basePath = context === 'development' 
      ? '/dev-center/business-assets/queues'
      : '/scheduling-center/business-assets/queues';
    navigate(`${basePath}/${record.queue_id}/messages`);
  };

  // 编辑队列
  const handleEdit = (record: LYQueueResponse) => {
    setEditingQueue(record);
    setEditModalVisible(true);
    setDetailDrawerVisible(false);
  };

  // 删除队列
  const handleDelete = (record: LYQueueResponse) => {
    Modal.confirm({
      title: t('queue.deleteModal.title'),
      icon: <IconDeleteStroked style={{ color: 'var(--semi-color-danger)' }} />,
      content: (
        <div>
          <div>{t('queue.deleteModal.confirmMessage', { name: record.queue_name })}</div>
          {record.is_published && (
            <div style={{ color: 'var(--semi-color-warning)', marginTop: 8 }}>{t('queue.deleteModal.publishedWarning')}</div>
          )}
        </div>
      ),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      okButtonProps: { type: 'danger' },
      onOk: async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        Toast.success(t('queue.deleteModal.success'));
        loadData();
      },
    });
  };

  // 分页变化
  const handlePageChange = (page: number) => {
    setQueryParams((prev) => ({ ...prev, page }));
  };

  // 表格列定义
  const columns = [
    {
      title: t('queue.table.name'),
      dataIndex: 'queue_name',
      key: 'queue_name',
      width: 180,
      ellipsis: true,
    },
    {
      title: t('queue.table.unconsumedCount'),
      dataIndex: 'unconsumed_count',
      key: 'unconsumed_count',
      width: 120,
      render: (_: unknown, record: LYQueueResponse) => (
        <span>
          {context === 'development' 
            ? record.test_unconsumed_count 
            : record.prod_unconsumed_count}
        </span>
      ),
    },
    {
      title: t('queue.table.consumedCount'),
      dataIndex: 'consumed_count',
      key: 'consumed_count',
      width: 120,
      render: (_: unknown, record: LYQueueResponse) => (
        <span>
          {context === 'development' 
            ? record.test_consumed_count 
            : record.prod_consumed_count}
        </span>
      ),
    },
    {
      title: t('queue.table.failedCount'),
      dataIndex: 'failed_count',
      key: 'failed_count',
      width: 120,
      render: (_: unknown, record: LYQueueResponse) => {
        const count = context === 'development' 
          ? record.test_failed_count 
          : record.prod_failed_count;
        return (
          <span>
            {count}
          </span>
        );
      },
    },
    ...(context === 'development' ? [{
      title: t('queue.detail.isPublished'),
      dataIndex: 'is_published',
      key: 'is_published',
      width: 100,
      sorter: (a: LYQueueResponse, b: LYQueueResponse) => {
        if (a.is_published === b.is_published) return 0;
        return a.is_published ? -1 : 1;
      },
      render: (isPublished: boolean) => (
        isPublished ? (
          <Tag color="green">{t('queue.detail.published')}</Tag>
        ) : (
          <Tag color="grey">{t('queue.detail.unpublished')}</Tag>
        )
      ),
    }] : []),
    {
      title: t('common.owningDepartment'),
      dataIndex: 'owning_department_name',
      key: 'owning_department_name',
      width: 140,
      ellipsis: true,
      render: (text: string | null) => text || '-',
    },
    {
      title: t('common.description'),
      dataIndex: 'description',
      key: 'description',
      width: 200,
      ellipsis: true,
      render: (text: string | null) => text || '-',
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 80,
      render: (_: unknown, record: LYQueueResponse) => {
        const canDelete = context === 'development';

        return (
          <Dropdown
            trigger="click"
            position="bottomRight"
            clickToHide
            render={
              <Dropdown.Menu>
                <Dropdown.Item icon={<List size={16} strokeWidth={2} />} onClick={(e) => { e.stopPropagation(); handleViewMessages(record); }}>
                  {t('queue.actions.viewMessages')}
                </Dropdown.Item>
                <Dropdown.Item icon={<Pencil size={16} strokeWidth={2} />} onClick={(e) => { e.stopPropagation(); handleEdit(record); }}>
                  {t('common.edit')}
                </Dropdown.Item>
                <Dropdown.Item icon={<UserPlus size={14} strokeWidth={2} />} onClick={(e) => { e.stopPropagation(); openCollaborator(record.queue_id); }}>
                  {t('collaborator.actions.addCollaborator')}
                </Dropdown.Item>
                {canDelete && (
                  <Dropdown.Item 
                    icon={<Trash2 size={16} strokeWidth={2} />}
                    type="danger" 
                    onClick={(e) => { e.stopPropagation(); handleDelete(record); }}
                  >
                    {t('common.delete')}
                  </Dropdown.Item>
                )}
              </Dropdown.Menu>
            }
          >
            <Button icon={<Ellipsis size={16} strokeWidth={2} />} theme="borderless" type="tertiary" onClick={(e) => e.stopPropagation()} />
          </Dropdown>
        );
      },
    },
  ];

  // 分页信息
  const range = listResponse?.range;
  const total = range?.total || 0;

  const { Title, Text } = Typography;

  return (
    <div className="queue-management-content">



      {/* 标题区域 */}
      <div className="queue-management-content-header">
        <div className="queue-management-content-header-title">
          <Title heading={3} className="title">
            {t('queue.title')}
          </Title>
          <Text type="tertiary">{t('queue.description')}</Text>
        </div>

        {/* 操作栏 */}
        <Row type="flex" justify="space-between" align="middle" className="queue-management-content-header-toolbar">
          <Col>
            <Space>
              <Input
                prefix={<IconSearchStroked />}
                placeholder={t('queue.searchPlaceholder')}
                className="queue-management-content-search-input"
                value={searchValue}
                onChange={handleSearch}
                showClear
                maxLength={100}
              />
              <DepartmentSelect
                placeholder={t('common.filterDepartment')}
                value={departmentFilter}
                onChange={(v) => {
                  setDepartmentFilter(v);
                  setQueryParams((prev) => ({ ...prev, page: 1 }));
                }}
                multiple
                showClear
                maxTagCount={1}
                useNameAsValue
                style={{ width: 'auto', minWidth: 150, maxWidth: 600 }}
              />
              {context === 'development' && (
                <FilterPopover
                  visible={filterPopoverVisible}
                  onVisibleChange={setFilterPopoverVisible}
                  onConfirm={(values) => {
                    setPublishedFilter(
                      values.published !== null && values.published !== undefined
                        ? (values.published as boolean)
                        : null
                    );
                    setQueryParams((prev) => ({ ...prev, page: 1 }));
                  }}
                  sections={[
                    {
                      key: 'published',
                      label: t('queue.detail.isPublished'),
                      type: 'radio',
                      options: publishedFilterOptions,
                      value: publishedFilter,
                    },
                  ]}
                />
              )}
            </Space>
          </Col>
          {context === 'development' && (
            <Col>
              <Button
                icon={<Plus size={16} strokeWidth={2} />}
                theme="solid"
                type="primary"
                onClick={() => setCreateModalVisible(true)}
              >
                {t('queue.createQueue')}
              </Button>
            </Col>
          )}
        </Row>
      </div>

      {/* 表格区域 */}
      <div className="queue-management-content-table">
        {isInitialLoad ? (
          <TableSkeleton columns={6} rows={10} />
        ) : (
          <Table
            size="small"
            dataSource={listResponse?.data || []}
            columns={columns}
            rowKey="queue_id"
            loading={loading}
            scroll={{ y: 'calc(100vh - 320px)' }}
            pagination={{
              currentPage: queryParams.page,
              pageSize: queryParams.pageSize,
              total,
              onPageChange: handlePageChange,
              onPageSizeChange: (newPageSize: number) => setQueryParams((prev) => ({ ...prev, page: 1, pageSize: newPageSize })),
              showTotal: true,
              showSizeChanger: true,
            }}
            empty={
              <EmptyState
                variant={queryParams.keyword || departmentFilter.length > 0 || filterCount > 0 ? 'noResult' : 'noData'}
                description={queryParams.keyword || departmentFilter.length > 0 || filterCount > 0 
                  ? t('queue.empty.filterDescription') 
                  : t('queue.empty.defaultDescription')}
              />
            }
            onRow={(record) => ({
              id: `queue-row-${(record as LYQueueResponse).queue_id}`,
              onClick: () => handleRowClick(record as LYQueueResponse),
              className: selectedQueue?.queue_id === record?.queue_id && detailDrawerVisible 
                ? 'queue-management-row-selected' 
                : '',
              style: { cursor: 'pointer' },
            })}
          />
        )}
      </div>

      {/* 新建队列弹窗 */}
      <CreateQueueModal
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={() => {
          setCreateModalVisible(false);
          loadData();
        }}
      />

      {/* 编辑队列弹窗 */}
      <EditQueueModal
        visible={editModalVisible}
        queue={editingQueue}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingQueue(null);
        }}
        onSuccess={() => {
          setEditModalVisible(false);
          setEditingQueue(null);
          loadData();
        }}
      />

      {/* 队列详情抽屉 */}
      <QueueDetailDrawer
        visible={detailDrawerVisible}
        queue={selectedQueue}
        context={context}
        onClose={() => {
          setDetailDrawerVisible(false);
          setSelectedQueue(null);
        }}
        onEdit={handleEdit}
        onDelete={context === 'development' ? handleDelete : undefined}
        allQueues={listResponse?.data || []}
        onQueueChange={setSelectedQueue}
        pagination={{
          currentPage: queryParams.page,
          pageSize: queryParams.pageSize,
          total,
          totalPages: Math.ceil(total / queryParams.pageSize),
        }}
        onPageChange={handleDrawerPageChange}
        initialTab={detailInitialTab}
        onScrollToRow={(id) => {
          const row = document.getElementById(`queue-row-${id}`);
          row?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }}
      />

      {renderCollaboratorPanel('QUEUE', context)}
    </div>
  );
};

export default QueueManagementContent;
