import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
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
  DatePicker,
} from '@douyinfe/semi-ui';
import type { TagColor } from '@douyinfe/semi-ui/lib/es/tag';
import EmptyState from '@/components/EmptyState';
import TableSkeleton from '@/components/TableSkeleton';
import {
  IconSearch,
  IconMore,
  IconDeleteStroked,
  IconFilter,
  IconChevronLeft,
} from '@douyinfe/semi-icons';
import { debounce } from 'lodash';
import type {
  LYQueueMessageResponse,
  LYQueueMessageListResultResponse,
  GetQueueMessagesParams,
  MessageStatus,
  MessagePriority,
} from '@/api/index';
import MessageDetailDrawer from './components/MessageDetailDrawer';
import ConsumeConfirmModal from './components/ConsumeConfirmModal';
import RequeueModal from './components/RequeueModal';

import './index.less';

// Mock数据生成
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const generateMockMessage = (index: number, context: 'development' | 'scheduling'): LYQueueMessageResponse => {
  const statuses: MessageStatus[] = ['UNCONSUMED_NOT_ACTIVE', 'UNCONSUMED_ACTIVE', 'CONSUMED', 'EXPIRED'];
  const priorities: MessagePriority[] = ['HIGH', 'MEDIUM', 'LOW'];
  const status = statuses[index % statuses.length];
  const isConsumed = status === 'CONSUMED';
  
  const contents = [
    '{"orderId": "ORD-2024-001", "amount": 1299.00, "status": "pending"}',
    '{"taskId": "TSK-001", "type": "data_sync", "priority": "high"}',
    '{"userId": "USR-123", "action": "login", "timestamp": "2024-01-15T10:30:00Z"}',
    '{"reportId": "RPT-456", "format": "xlsx", "status": "generating"}',
    '{"notificationId": "NTF-789", "channel": "email", "recipient": "user@example.com"}',
  ];

  const content = contents[index % contents.length];
  const now = new Date();
  const createdAt = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
  const effectiveTime = new Date(createdAt.getTime() + Math.random() * 60 * 60 * 1000);
  const expiryTime = Math.random() > 0.3 
    ? new Date(effectiveTime.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000) 
    : null;

  return {
    message_id: generateUUID(),
    queue_id: generateUUID(),
    queue_instance_id: generateUUID(),
    content,
    content_summary: content.length > 50 ? content.substring(0, 50) + '...' : content,
    status,
    priority: priorities[index % priorities.length],
    message_type: context === 'development' ? 'TEST' : 'PRODUCTION',
    created_at: createdAt.toISOString(),
    effective_time: effectiveTime.toISOString(),
    expiry_time: expiryTime?.toISOString() || null,
    consumed_at: isConsumed ? new Date(effectiveTime.getTime() + Math.random() * 24 * 60 * 60 * 1000).toISOString() : null,
    consumer_type: isConsumed ? (Math.random() > 0.5 ? 'MANUAL' : 'ROBOT') : null,
    consumer_id: isConsumed ? generateUUID() : null,
    consumer_name: isConsumed ? ['张三', '李四', '王五', '赵六'][index % 4] : null,
    consume_task_id: isConsumed && Math.random() > 0.5 ? `TSK-${1000 + index}` : null,
  };
};

const generateMockMessageList = (context: 'development' | 'scheduling'): LYQueueMessageResponse[] => {
  return Array.from({ length: 25 }, (_, i) => generateMockMessage(i, context));
};

// 模拟API调用
const fetchMessageList = async (
  params: GetQueueMessagesParams
): Promise<LYQueueMessageListResultResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  let data = generateMockMessageList(params.context || 'development');

  // 状态筛选
  if (params.status) {
    data = data.filter((item) => item.status === params.status);
  }

  // 关键词筛选
  if (params.keyword) {
    const keyword = params.keyword.toLowerCase();
    data = data.filter((item) => item.content.toLowerCase().includes(keyword));
  }

  // 消费任务ID筛选
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
  status: MessageStatus | null;
  consumeTaskId: string;
}

export interface QueueMessagesContentProps {
  queueId: string;
  queueName?: string;
  context: 'development' | 'scheduling';
}

const QueueMessagesContent = ({ queueId, queueName, context }: QueueMessagesContentProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // 搜索框输入值
  const [searchValue, setSearchValue] = useState('');
  const [taskIdFilter, setTaskIdFilter] = useState('');

  // 查询参数
  const [queryParams, setQueryParams] = useState<QueryParams>({
    page: 1,
    pageSize: 20,
    keyword: '',
    status: null,
    consumeTaskId: '',
  });

  // 筛选相关
  const [filterPopoverVisible, setFilterPopoverVisible] = useState(false);
  const [tempStatus, setTempStatus] = useState<MessageStatus | null>(null);
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);

  // 列表数据
  const [listResponse, setListResponse] = useState<LYQueueMessageListResultResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // 选中的消息
  const [selectedMessage, setSelectedMessage] = useState<LYQueueMessageResponse | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  // 模态框/抽屉状态
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [consumeModalVisible, setConsumeModalVisible] = useState(false);
  const [requeueModalVisible, setRequeueModalVisible] = useState(false);
  const [batchRequeueVisible, setBatchRequeueVisible] = useState(false);

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchMessageList({
        queue_id: queueId,
        keyword: queryParams.keyword || undefined,
        status: queryParams.status,
        consume_task_id: queryParams.consumeTaskId || undefined,
        context,
        offset: (queryParams.page - 1) * queryParams.pageSize,
        size: queryParams.pageSize,
      });
      setListResponse(response);
      return response.data;
    } catch (error) {
      console.error('加载消息列表失败:', error);
      Toast.error(t('queueMessage.list.loadError'));
      return [];
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [queueId, queryParams, context, t]);

  // 翻页并返回新数据
  const handleDrawerPageChange = useCallback(async (page: number): Promise<LYQueueMessageResponse[]> => {
    setQueryParams(prev => ({ ...prev, page }));
    
    try {
      const response = await fetchMessageList({
        queue_id: queueId,
        keyword: queryParams.keyword || undefined,
        status: queryParams.status,
        consume_task_id: queryParams.consumeTaskId || undefined,
        context,
        offset: (page - 1) * queryParams.pageSize,
        size: queryParams.pageSize,
      });
      setListResponse(response);
      return response.data;
    } catch {
      return [];
    }
  }, [queueId, queryParams, context]);

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

  // 任务ID筛选
  const handleTaskIdFilter = () => {
    setQueryParams((prev) => ({ ...prev, page: 1, consumeTaskId: taskIdFilter }));
  };

  // 状态筛选选项
  const statusFilterOptions = [
    { value: 'UNCONSUMED_NOT_ACTIVE', label: t('queueMessage.status.unconsumedNotActive') },
    { value: 'UNCONSUMED_ACTIVE', label: t('queueMessage.status.unconsumedActive') },
    { value: 'CONSUMED', label: t('queueMessage.status.consumed') },
    { value: 'EXPIRED', label: t('queueMessage.status.expired') },
  ];

  // 计算筛选数量
  const filterCount = (queryParams.status ? 1 : 0) + (queryParams.consumeTaskId ? 1 : 0);

  // 返回队列列表
  const handleBack = () => {
    const basePath = context === 'development' 
      ? '/dev-center/business-assets/queues'
      : '/scheduling-center/business-assets/queues';
    navigate(basePath);
  };

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

  // 批量消费
  const handleBatchConsume = () => {
    const selectedMessages = listResponse?.data.filter(m => selectedRowKeys.includes(m.message_id)) || [];
    const validMessages = selectedMessages.filter(m => m.status === 'UNCONSUMED_ACTIVE');
    
    if (validMessages.length === 0) {
      Toast.warning(t('queueMessage.batch.noValidConsumeMessages'));
      return;
    }

    Modal.confirm({
      title: t('queueMessage.batch.consumeTitle'),
      content: t('queueMessage.batch.consumeConfirm', { count: validMessages.length }),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      onOk: async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        Toast.success(t('queueMessage.batch.consumeSuccess', { count: validMessages.length }));
        setSelectedRowKeys([]);
        loadData();
      },
    });
  };

  // 批量重新入队
  const handleBatchRequeue = () => {
    const selectedMessages = listResponse?.data.filter(m => selectedRowKeys.includes(m.message_id)) || [];
    const validMessages = selectedMessages.filter(m => m.status === 'CONSUMED' || m.status === 'EXPIRED');
    
    if (validMessages.length === 0) {
      Toast.warning(t('queueMessage.batch.noValidRequeueMessages'));
      return;
    }

    setBatchRequeueVisible(true);
  };

  // 批量删除
  const handleBatchDelete = () => {
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

  // 分页变化
  const handlePageChange = (page: number) => {
    setQueryParams((prev) => ({ ...prev, page }));
  };

  // 获取状态标签
  const getStatusTag = (status: MessageStatus) => {
    const statusConfig: Record<MessageStatus, { color: TagColor; text: string }> = {
      UNCONSUMED_NOT_ACTIVE: { color: 'grey', text: t('queueMessage.status.unconsumedNotActive') },
      UNCONSUMED_ACTIVE: { color: 'blue', text: t('queueMessage.status.unconsumedActive') },
      CONSUMED: { color: 'grey', text: t('queueMessage.status.consumed') },
      EXPIRED: { color: 'grey', text: t('queueMessage.status.expired') },
    };
    const config = statusConfig[status];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 获取优先级标签
  const getPriorityTag = (priority: MessagePriority) => {
    const priorityConfig: Record<MessagePriority, { color: TagColor; text: string }> = {
      HIGH: { color: 'red', text: t('queueMessage.priority.high') },
      MEDIUM: { color: 'orange', text: t('queueMessage.priority.medium') },
      LOW: { color: 'grey', text: t('queueMessage.priority.low') },
    };
    const config = priorityConfig[priority];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 格式化日期
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('zh-CN');
  };

  // 表格列定义
  const columns = [
    {
      title: t('queueMessage.table.contentSummary'),
      dataIndex: 'content_summary',
      key: 'content_summary',
      width: 200,
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
      render: (status: MessageStatus) => getStatusTag(status),
    },
    {
      title: t('queueMessage.table.priority'),
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority: MessagePriority) => getPriorityTag(priority),
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
      width: 120,
      render: (taskId: string | null) => taskId || '-',
    },
    {
      title: t('queueMessage.table.createdAt'),
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      sorter: true,
      render: (date: string) => formatDate(date),
    },
    {
      title: t('queueMessage.table.effectiveTime'),
      dataIndex: 'effective_time',
      key: 'effective_time',
      width: 160,
      render: (date: string) => formatDate(date),
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
    onChange: (keys: (string | number)[]) => {
      setSelectedRowKeys(keys as string[]);
    },
    getCheckboxProps: (record: LYQueueMessageResponse) => ({
      disabled: false,
      name: record.message_id,
    }),
  };

  return (
    <div className="queue-messages-content">
      {/* 标题区域 */}
      <div className="queue-messages-content-header">
        <div className="queue-messages-content-header-title">
          <Space>
            <Button 
              icon={<IconChevronLeft />} 
              theme="borderless" 
              onClick={handleBack}
            />
            <Title heading={3} className="title">
              {queueName || t('queueMessage.title')}
            </Title>
          </Space>
          <Text type="tertiary">{t('queueMessage.description')}</Text>
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
              <Input
                placeholder={t('queueMessage.taskIdPlaceholder')}
                className="queue-messages-content-taskid-input"
                value={taskIdFilter}
                onChange={setTaskIdFilter}
                onEnterPress={handleTaskIdFilter}
                showClear
              />
              <Popover
                visible={filterPopoverVisible}
                onVisibleChange={setFilterPopoverVisible}
                trigger="click"
                position="bottomLeft"
                content={
                  <div className="queue-messages-filter-popover">
                    <div className="queue-messages-filter-popover-section">
                      <Text strong className="queue-messages-filter-popover-label">
                        {t('common.status')}
                      </Text>
                      <CheckboxGroup
                        value={tempStatus ? [tempStatus] : []}
                        onChange={(values) => {
                          const newValue = values.length > 0 ? values[values.length - 1] as MessageStatus : null;
                          setTempStatus(newValue);
                        }}
                        options={statusFilterOptions}
                        direction="vertical"
                      />
                    </div>
                    <div className="queue-messages-filter-popover-section">
                      <Text strong className="queue-messages-filter-popover-label">
                        {t('queueMessage.filter.timeRange')}
                      </Text>
                      <DatePicker
                        type="dateTimeRange"
                        value={dateRange || undefined}
                        onChange={(value) => setDateRange(value as [Date, Date] | null)}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div className="queue-messages-filter-popover-footer">
                      <Button theme="borderless" onClick={() => {
                        setTempStatus(null);
                        setDateRange(null);
                        setQueryParams((prev) => ({ ...prev, page: 1, status: null }));
                      }}>
                        {t('common.reset')}
                      </Button>
                      <Button theme="solid" onClick={() => {
                        setQueryParams((prev) => ({ ...prev, page: 1, status: tempStatus }));
                        setFilterPopoverVisible(false);
                      }}>
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
          <Col>
            {selectedRowKeys.length > 0 && (
              <Space>
                <Text type="tertiary">
                  {t('queueMessage.batch.selected', { count: selectedRowKeys.length })}
                </Text>
                <Dropdown
                  trigger="click"
                  position="bottomRight"
                  render={
                    <Dropdown.Menu>
                      <Dropdown.Item onClick={handleBatchConsume}>
                        {t('queueMessage.batch.consume')}
                      </Dropdown.Item>
                      <Dropdown.Item onClick={handleBatchRequeue}>
                        {t('queueMessage.batch.requeue')}
                      </Dropdown.Item>
                      <Dropdown.Item type="danger" onClick={handleBatchDelete}>
                        {t('queueMessage.batch.delete')}
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  }
                >
                  <Button theme="solid" type="primary">
                    {t('queueMessage.batch.actions')}
                  </Button>
                </Dropdown>
              </Space>
            )}
          </Col>
        </Row>
      </div>

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
            scroll={{ y: 'calc(100vh - 320px)' }}
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
        allMessages={listResponse?.data || []}
        currentPage={queryParams.page}
        pageSize={queryParams.pageSize}
        total={total}
        onPageChange={handleDrawerPageChange}
        onMessageChange={setSelectedMessage}
      />

      {/* 消费确认弹窗 */}
      <ConsumeConfirmModal
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
      <RequeueModal
        visible={requeueModalVisible}
        message={selectedMessage}
        isBatch={false}
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

      {/* 批量重新入队弹窗 */}
      <RequeueModal
        visible={batchRequeueVisible}
        message={null}
        isBatch={true}
        batchCount={selectedRowKeys.length}
        onCancel={() => setBatchRequeueVisible(false)}
        onSuccess={() => {
          setBatchRequeueVisible(false);
          setSelectedRowKeys([]);
          loadData();
        }}
      />
    </div>
  );
};

export default QueueMessagesContent;
