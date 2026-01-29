import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import type { TagColor } from '@douyinfe/semi-ui/lib/es/tag';
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
  Popover,
  CheckboxGroup,
  Tooltip,
  Breadcrumb,
} from '@douyinfe/semi-ui';
import EmptyState from '@/components/EmptyState';
import TableSkeleton from '@/components/TableSkeleton';
import {
  IconSearch,
  IconMore,
  IconDeleteStroked,
  IconFilter,
  IconChevronLeft,
  IconPlayCircle,
  IconRefresh,
} from '@douyinfe/semi-icons';
import { debounce } from 'lodash';
import type {
  LYQueueMessageResponse,
  LYQueueMessageListResultResponse,
  GetQueueMessagesParams,
  QueueMessageStatus,
  QueueMessagePriority,
} from '@/api/index';
import ConsumeMessageModal from './components/ConsumeMessageModal';
import RequeueMessageModal from './components/RequeueMessageModal';
import MessageDetailDrawer from './components/MessageDetailDrawer';
import BatchOperationBar from './components/BatchOperationBar';

import './index.less';

// Mock数据生成
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const generateMockMessage = (index: number, queueId: string, messageType: 'TEST' | 'PRODUCTION'): LYQueueMessageResponse => {
  const statuses: QueueMessageStatus[] = ['UNCONSUMED_INACTIVE', 'UNCONSUMED_ACTIVE', 'CONSUMED', 'EXPIRED'];
  const priorities: QueueMessagePriority[] = ['HIGH', 'MEDIUM', 'LOW'];
  const status = statuses[index % 4];
  const isConsumed = status === 'CONSUMED';
  const consumers = ['张三', '李四', '王五', '赵六'];

  return {
    message_id: generateUUID(),
    queue_id: queueId,
    message_number: `MSG-${String(index + 1).padStart(6, '0')}`,
    content: `这是第${index + 1}条消息的内容，用于测试队列消息管理功能。消息可能包含订单信息、通知内容或其他业务数据。`,
    status,
    priority: priorities[index % 3],
    message_type: messageType,
    enqueue_time: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    effective_time: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString(),
    expiry_time: Math.random() > 0.3 ? new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString() : null,
    consumer_type: isConsumed ? (Math.random() > 0.5 ? 'HUMAN' : 'ROBOT') : null,
    consumer_id: isConsumed ? generateUUID() : null,
    consumer_name: isConsumed ? consumers[index % 4] : null,
    consume_time: isConsumed ? new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString() : null,
    consume_task_id: isConsumed && Math.random() > 0.5 ? `TASK-${String(Math.floor(Math.random() * 1000)).padStart(6, '0')}` : null,
    consume_task_name: isConsumed && Math.random() > 0.5 ? '自动处理订单任务' : null,
    created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
};

const generateMockMessageList = (queueId: string, messageType: 'TEST' | 'PRODUCTION'): LYQueueMessageResponse[] => {
  return Array.from({ length: 25 }, (_, i) => generateMockMessage(i, queueId, messageType));
};

// 模拟API调用
const fetchMessageList = async (
  params: GetQueueMessagesParams
): Promise<LYQueueMessageListResultResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const messageType = params.context === 'development' ? 'TEST' : 'PRODUCTION';
  let data = generateMockMessageList(params.queue_id, messageType);

  // 状态筛选
  if (params.status) {
    data = data.filter((item) => item.status === params.status);
  }

  // 关键词搜索
  if (params.keyword) {
    const keyword = params.keyword.toLowerCase();
    data = data.filter((item) => item.content.toLowerCase().includes(keyword));
  }

  // 任务ID筛选
  if (params.consume_task_id) {
    data = data.filter((item) => item.consume_task_id === params.consume_task_id);
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

export interface QueueMessagesContentProps {
  context: 'development' | 'scheduling';
}

const QueueMessagesContent = ({ context }: QueueMessagesContentProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { queueId } = useParams<{ queueId: string }>();

  // 搜索框输入值（即时显示）
  const [searchValue, setSearchValue] = useState('');

  // 查询参数
  const [queryParams, setQueryParams] = useState<QueryParams>({
    page: 1,
    pageSize: 20,
    keyword: '',
  });

  // 状态筛选
  const [statusFilter, setStatusFilter] = useState<QueueMessageStatus | null>(null);
  const [filterPopoverVisible, setFilterPopoverVisible] = useState(false);

  // 列表数据
  const [listResponse, setListResponse] = useState<LYQueueMessageListResultResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // 选中的消息（用于操作/详情）
  const [selectedMessage, setSelectedMessage] = useState<LYQueueMessageResponse | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  // 模态框/抽屉状态
  const [consumeModalVisible, setConsumeModalVisible] = useState(false);
  const [requeueModalVisible, setRequeueModalVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);

  // 队列名称（模拟）
  const queueName = '订单处理队列';

  // 加载数据
  const loadData = useCallback(async () => {
    if (!queueId) return;
    setLoading(true);
    try {
      const response = await fetchMessageList({
        queue_id: queueId,
        context,
        keyword: queryParams.keyword || undefined,
        offset: (queryParams.page - 1) * queryParams.pageSize,
        size: queryParams.pageSize,
        status: statusFilter,
      });
      setListResponse(response);
    } catch (error) {
      console.error('加载消息列表失败:', error);
      Toast.error(t('queueMessage.list.loadError'));
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [queryParams, statusFilter, context, queueId, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 搜索防抖
  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setQueryParams((prev) => ({ ...prev, page: 1, keyword: value }));
      }, 500),
    []
  );

  const handleSearch = (value: string) => {
    setSearchValue(value);
    debouncedSearch(value);
  };

  // 状态筛选选项
  const statusFilterOptions = [
    { value: 'UNCONSUMED_INACTIVE', label: t('queueMessage.status.unconsumedInactive') },
    { value: 'UNCONSUMED_ACTIVE', label: t('queueMessage.status.unconsumedActive') },
    { value: 'CONSUMED', label: t('queueMessage.status.consumed') },
    { value: 'EXPIRED', label: t('queueMessage.status.expired') },
  ];

  // 计算筛选数量
  const filterCount = statusFilter !== null ? 1 : 0;

  // 点击行查看详情
  const handleRowClick = (record: LYQueueMessageResponse) => {
    setSelectedMessage(record);
    setDetailDrawerVisible(true);
  };

  // 消费消息
  const handleConsume = (record: LYQueueMessageResponse) => {
    setSelectedMessage(record);
    setConsumeModalVisible(true);
  };

  // 重新入队
  const handleRequeue = (record: LYQueueMessageResponse) => {
    setSelectedMessage(record);
    setRequeueModalVisible(true);
  };

  // 删除消息
  const handleDelete = (record: LYQueueMessageResponse) => {
    Modal.confirm({
      title: t('queueMessage.deleteModal.title'),
      icon: <IconDeleteStroked style={{ color: 'var(--semi-color-danger)' }} />,
      content: t('queueMessage.deleteModal.confirmMessage'),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      okButtonProps: { type: 'danger' },
      onOk: async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        Toast.success(t('queueMessage.deleteModal.success'));
        loadData();
      },
    });
  };

  // 批量删除
  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      Toast.warning(t('queueMessage.batch.selectRequired'));
      return;
    }

    Modal.confirm({
      title: t('queueMessage.batch.deleteTitle'),
      icon: <IconDeleteStroked style={{ color: 'var(--semi-color-danger)' }} />,
      content: t('queueMessage.batch.deleteConfirm', { count: selectedRowKeys.length }),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      okButtonProps: { type: 'danger' },
      onOk: async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        Toast.success(t('queueMessage.batch.deleteSuccess', { count: selectedRowKeys.length }));
        setSelectedRowKeys([]);
        loadData();
      },
    });
  };

  // 批量重新入队
  const handleBatchRequeue = async () => {
    if (selectedRowKeys.length === 0) {
      Toast.warning(t('queueMessage.batch.selectRequired'));
      return;
    }

    Modal.confirm({
      title: t('queueMessage.batch.requeueTitle'),
      icon: <IconRefresh style={{ color: 'var(--semi-color-primary)' }} />,
      content: t('queueMessage.batch.requeueConfirm', { count: selectedRowKeys.length }),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      onOk: async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        Toast.success(t('queueMessage.batch.requeueSuccess', { count: selectedRowKeys.length }));
        setSelectedRowKeys([]);
        loadData();
      },
    });
  };

  // 分页变化
  const handlePageChange = (page: number) => {
    setQueryParams((prev) => ({ ...prev, page }));
  };

  // 返回队列列表
  const handleBack = () => {
    const basePath = context === 'development' 
      ? '/dev-center/business-assets/queues'
      : '/scheduling-center/business-assets/queues';
    navigate(basePath);
  };

  // 获取状态标签
  const getStatusTag = (status: QueueMessageStatus) => {
    const statusConfig: Record<QueueMessageStatus, { color: TagColor; text: string }> = {
      UNCONSUMED_INACTIVE: { color: 'grey', text: t('queueMessage.status.unconsumedInactive') },
      UNCONSUMED_ACTIVE: { color: 'blue', text: t('queueMessage.status.unconsumedActive') },
      CONSUMED: { color: 'grey', text: t('queueMessage.status.consumed') },
      EXPIRED: { color: 'grey', text: t('queueMessage.status.expired') },
    };
    const config = statusConfig[status];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 获取优先级标签
  const getPriorityTag = (priority: QueueMessagePriority) => {
    const priorityConfig: Record<QueueMessagePriority, { color: TagColor; text: string }> = {
      HIGH: { color: 'red', text: t('queueMessage.priority.high') },
      MEDIUM: { color: 'orange', text: t('queueMessage.priority.medium') },
      LOW: { color: 'green', text: t('queueMessage.priority.low') },
    };
    const config = priorityConfig[priority];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 格式化日期
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('zh-CN');
  };

  // 表格列定义
  const columns = [
    {
      title: t('queueMessage.table.messageNumber'),
      dataIndex: 'message_number',
      key: 'message_number',
      width: 140,
    },
    {
      title: t('queueMessage.table.content'),
      dataIndex: 'content',
      key: 'content',
      width: 250,
      render: (text: string) => (
        <Tooltip content={text} position="top">
          <span className="queue-messages-content-table-content">{text}</span>
        </Tooltip>
      ),
    },
    {
      title: t('queueMessage.table.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: QueueMessageStatus) => getStatusTag(status),
    },
    {
      title: t('queueMessage.table.priority'),
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority: QueueMessagePriority) => getPriorityTag(priority),
    },
    {
      title: t('queueMessage.table.consumer'),
      dataIndex: 'consumer_name',
      key: 'consumer_name',
      width: 100,
      render: (name: string | null) => name || '-',
    },
    {
      title: t('queueMessage.table.consumeTask'),
      dataIndex: 'consume_task_id',
      key: 'consume_task_id',
      width: 140,
      render: (taskId: string | null) => taskId || '-',
    },
    {
      title: t('queueMessage.table.enqueueTime'),
      dataIndex: 'enqueue_time',
      key: 'enqueue_time',
      width: 160,
      render: (time: string) => formatDate(time),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 80,
      render: (_: unknown, record: LYQueueMessageResponse) => (
        <Dropdown
          trigger="click"
          position="bottomRight"
          clickToHide
          render={
            <Dropdown.Menu>
              <Dropdown.Item onClick={(e) => { e.stopPropagation(); handleRowClick(record); }}>
                {t('common.viewDetail')}
              </Dropdown.Item>
              {record.status === 'UNCONSUMED_ACTIVE' && (
                <Dropdown.Item onClick={(e) => { e.stopPropagation(); handleConsume(record); }}>
                  {t('queueMessage.actions.consume')}
                </Dropdown.Item>
              )}
              {(record.status === 'CONSUMED' || record.status === 'EXPIRED') && (
                <Dropdown.Item onClick={(e) => { e.stopPropagation(); handleRequeue(record); }}>
                  {t('queueMessage.actions.requeue')}
                </Dropdown.Item>
              )}
              <Dropdown.Item 
                type="danger" 
                onClick={(e) => { e.stopPropagation(); handleDelete(record); }}
              >
                {t('common.delete')}
              </Dropdown.Item>
            </Dropdown.Menu>
          }
        >
          <Button icon={<IconMore />} theme="borderless" type="tertiary" onClick={(e) => e.stopPropagation()} />
        </Dropdown>
      ),
    },
  ];

  // 分页信息
  const range = listResponse?.range;
  const total = range?.total || 0;

  const { Title, Text } = Typography;

  // 行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: (string | number)[], selectedRows: LYQueueMessageResponse[]) => {
      setSelectedRowKeys(selectedKeys as string[]);
    },
    getCheckboxProps: (record: LYQueueMessageResponse) => ({
      disabled: false,
    }),
  };

  return (
    <div className="queue-messages-content">
      {/* 面包屑 */}
      <Breadcrumb className="queue-messages-content-breadcrumb">
        <Breadcrumb.Item onClick={handleBack} className="queue-messages-content-breadcrumb-link">
          {t('queue.title')}
        </Breadcrumb.Item>
        <Breadcrumb.Item>{queueName}</Breadcrumb.Item>
        <Breadcrumb.Item>{t('queueMessage.title')}</Breadcrumb.Item>
      </Breadcrumb>

      {/* 标题区域 */}
      <div className="queue-messages-content-header">
        <div className="queue-messages-content-header-title">
          <Button 
            icon={<IconChevronLeft />} 
            theme="borderless" 
            onClick={handleBack}
            className="queue-messages-content-back-btn"
          />
          <div>
            <Title heading={3} className="title">
              {queueName} - {t('queueMessage.title')}
            </Title>
            <Text type="tertiary">{t('queueMessage.description')}</Text>
          </div>
        </div>

        {/* 操作栏 */}
        <Row type="flex" justify="space-between" align="middle" className="queue-messages-content-header-toolbar">
          <Col>
            <Space>
              <Input
                prefix={<IconSearch />}
                placeholder={t('queueMessage.searchPlaceholder')}
                className="queue-messages-content-search-input"
                value={searchValue}
                onChange={handleSearch}
                showClear
                maxLength={100}
              />
              <Popover
                visible={filterPopoverVisible}
                onVisibleChange={setFilterPopoverVisible}
                trigger="click"
                position="bottomLeft"
                content={
                  <div className="queue-filter-popover">
                    <div className="queue-filter-popover-section">
                      <Text strong className="queue-filter-popover-label">
                        {t('queueMessage.filter.status')}
                      </Text>
                      <CheckboxGroup
                        value={statusFilter !== null ? [statusFilter] : []}
                        onChange={(values) => {
                          const newValue = values.length > 0 ? values[values.length - 1] as QueueMessageStatus : null;
                          setStatusFilter(newValue);
                          setQueryParams((prev) => ({ ...prev, page: 1 }));
                        }}
                        options={statusFilterOptions}
                        direction="vertical"
                      />
                    </div>
                    <div className="queue-filter-popover-footer">
                      <Button theme="borderless" onClick={() => {
                        setStatusFilter(null);
                        setQueryParams((prev) => ({ ...prev, page: 1 }));
                      }}>
                        {t('common.reset')}
                      </Button>
                      <Button theme="solid" onClick={() => setFilterPopoverVisible(false)}>
                        {t('common.confirm')}
                      </Button>
                    </div>
                  </div>
                }
              >
                <Button
                  icon={<IconFilter />}
                  type={filterCount > 0 ? 'primary' : 'tertiary'}
                  theme={filterCount > 0 ? 'light' : 'borderless'}
                >
                  {t('common.filter')}
                  {filterCount > 0 && ` (${filterCount})`}
                </Button>
              </Popover>
            </Space>
          </Col>
        </Row>
      </div>

      {/* 批量操作栏 */}
      {selectedRowKeys.length > 0 && (
        <BatchOperationBar
          selectedCount={selectedRowKeys.length}
          onClearSelection={() => setSelectedRowKeys([])}
          onBatchRequeue={handleBatchRequeue}
          onBatchDelete={handleBatchDelete}
        />
      )}

      {/* 表格区域 */}
      <div className="queue-messages-content-table">
        {isInitialLoad ? (
          <TableSkeleton columns={8} rows={10} />
        ) : (
          <Table
            dataSource={listResponse?.data || []}
            columns={columns}
            rowKey="message_id"
            loading={loading}
            rowSelection={rowSelection}
            pagination={{
              currentPage: queryParams.page,
              pageSize: queryParams.pageSize,
              total,
              onPageChange: handlePageChange,
              showTotal: true,
              showSizeChanger: false,
            }}
            scroll={{ y: 'calc(100vh - 380px)' }}
            empty={
              <EmptyState
                variant={queryParams.keyword || filterCount > 0 ? 'noResult' : 'noData'}
                description={queryParams.keyword || filterCount > 0 
                  ? t('queueMessage.empty.filterDescription') 
                  : t('queueMessage.empty.defaultDescription')}
              />
            }
            onRow={(record) => ({
              onClick: () => handleRowClick(record as LYQueueMessageResponse),
              className: selectedMessage?.message_id === record?.message_id && detailDrawerVisible 
                ? 'queue-messages-row-selected' 
                : '',
            })}
          />
        )}
      </div>

      {/* 消费确认弹窗 */}
      <ConsumeMessageModal
        visible={consumeModalVisible}
        message={selectedMessage}
        onCancel={() => {
          setConsumeModalVisible(false);
          setSelectedMessage(null);
        }}
        onSuccess={() => {
          setConsumeModalVisible(false);
          setSelectedMessage(null);
          loadData();
        }}
      />

      {/* 重新入队弹窗 */}
      <RequeueMessageModal
        visible={requeueModalVisible}
        message={selectedMessage}
        onCancel={() => {
          setRequeueModalVisible(false);
          setSelectedMessage(null);
        }}
        onSuccess={() => {
          setRequeueModalVisible(false);
          setSelectedMessage(null);
          loadData();
        }}
      />

      {/* 消息详情抽屉 */}
      <MessageDetailDrawer
        visible={detailDrawerVisible}
        message={selectedMessage}
        context={context}
        onClose={() => {
          setDetailDrawerVisible(false);
          setSelectedMessage(null);
        }}
        onConsume={handleConsume}
        onRequeue={handleRequeue}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default QueueMessagesContent;
