import { useState, useEffect, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
import { useTranslation } from 'react-i18next';
import {
  Input,
  Button,
  Table,
  Dropdown,
  Row,
  Col,
  Modal,
  Toast,
  Space,
  Select,
  Switch,
  Tooltip,
} from '@douyinfe/semi-ui';
import {
  IconSearch,
  IconPlus,
  IconMore,
  IconDeleteStroked,
  IconEditStroked,
} from '@douyinfe/semi-icons';
import EmptyState from '@/components/EmptyState';
import TableSkeleton from '@/components/TableSkeleton';
import type {
  LYQueueTriggerResponse,
  LYListResponseLYQueueTriggerResponse,
  TriggerStatus,
  TaskPriority,
  ExecutionTargetType,
} from '@/api';
import CreateQueueTriggerModal from '../CreateQueueTriggerModal';
import EditQueueTriggerModal from '../EditQueueTriggerModal';
import QueueTriggerDetailDrawer from '../QueueTriggerDetailDrawer';
import './index.less';

// ============= 工具函数 =============

const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// ============= Mock数据生成 =============

const mockProcesses = [
  { process_id: 'proc-001', process_name: '订单自动处理' },
  { process_id: 'proc-002', process_name: '财务报销审批' },
  { process_id: 'proc-003', process_name: '人事入职流程' },
  { process_id: 'proc-004', process_name: '采购申请流程' },
  { process_id: 'proc-005', process_name: '合同审批流程' },
];

const mockQueues = [
  { queue_id: 'queue-001', queue_name: '订单待处理队列' },
  { queue_id: 'queue-002', queue_name: '审批任务队列' },
  { queue_id: 'queue-003', queue_name: '数据同步队列' },
  { queue_id: 'queue-004', queue_name: '报表生成队列' },
];

const mockCreatorNames = ['张三', '李四', '王五', '赵六', '钱七'];

const generateMockQueueTriggerResponse = (index: number): LYQueueTriggerResponse => {
  const process = mockProcesses[index % mockProcesses.length];
  const queue = mockQueues[index % mockQueues.length];
  const priorities: TaskPriority[] = ['HIGH', 'MEDIUM', 'LOW'];
  const targetTypes: ExecutionTargetType[] = ['BOT_GROUP', 'BOT_IN_GROUP', 'UNGROUPED_BOT'];
  const targetNames = ['订单处理组', '财务审批组', '人事管理组', 'RPA-BOT-001', 'RPA-BOT-002'];
  const statuses: TriggerStatus[] = ['ENABLED', 'DISABLED'];

  const createDate = new Date(2026, 0, 1 + (index % 28), 10 + (index % 12), (index * 7) % 60);
  const status = statuses[index % statuses.length];

  return {
    trigger_id: `qt-${generateUUID().substring(0, 8)}`,
    name: `${queue.queue_name}触发器${index + 1}`,
    description: index % 3 === 0 ? null : `监控${queue.queue_name}，自动创建${process.process_name}任务`,
    status,
    process_id: process.process_id,
    process_name: process.process_name,
    department_id: `dept-00${(index % 3) + 1}`,
    execution_target_type: targetTypes[index % targetTypes.length],
    execution_target_id: `target-${index}`,
    execution_target_name: targetNames[index % targetNames.length],
    priority: priorities[index % priorities.length],
    max_execution_duration: 1800 + (index % 5) * 600,
    validity_days: 7 + (index % 7),
    enable_recording: index % 2 === 0,
    input_parameters: { targetUrl: 'https://example.com', maxCount: 100 },
    queue_id: queue.queue_id,
    queue_name: queue.queue_name,
    time_zone: 'Asia/Shanghai',
    enable_work_calendar: index % 3 === 0,
    work_calendar_id: index % 3 === 0 ? 'cal-001' : null,
    work_calendar_name: index % 3 === 0 ? '公司工作日历' : null,
    work_calendar_execution_type: index % 3 === 0 ? 'WORKDAY' : null,
    min_effective_messages: 1 + (index % 10),
    messages_per_trigger: 5 + (index % 20),
    enable_periodic_check: index % 2 === 0 && (1 + (index % 10)) > 1,
    periodic_check_interval: index % 2 === 0 && (1 + (index % 10)) > 1 ? 30 : null,
    current_message_count: Math.floor(Math.random() * 50),
    pending_task_count: Math.floor(Math.random() * 5),
    running_task_count: Math.floor(Math.random() * 3),
    last_trigger_time: index > 5 ? new Date(2026, 1, 3, 9, 0).toISOString() : null,
    created_by_id: `user-00${(index % 5) + 1}`,
    created_by_name: mockCreatorNames[index % mockCreatorNames.length],
    created_at: createDate.toISOString(),
    updated_at: createDate.toISOString(),
  };
};

// 生成 mock 数据
const generateMockTriggers = (count: number) => {
  return Array.from({ length: count }, (_, i) => generateMockQueueTriggerResponse(i));
};

const allMockTriggers = generateMockTriggers(25);

interface GetTriggersParams {
  offset?: number;
  size?: number;
  keyword?: string;
  process_id?: string;
  queue_id?: string;
  status?: TriggerStatus;
}

// ============= 组件 =============

const QueueTriggerList = () => {
  const { t } = useTranslation();

  // 列表数据状态
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [listResponse, setListResponse] = useState<LYListResponseLYQueueTriggerResponse>({
    range: { offset: 0, size: 20, total: 0 },
    list: [],
  });
  const [loading, setLoading] = useState(false);
  const [queryParams, setQueryParams] = useState<GetTriggersParams>({
    offset: 0,
    size: 20,
    keyword: '',
    process_id: undefined,
    queue_id: undefined,
    status: undefined,
  });

  // 选中状态（抽屉）
  const [selectedTrigger, setSelectedTrigger] = useState<LYQueueTriggerResponse | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  // 弹窗状态
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<LYQueueTriggerResponse | null>(null);

  // 从响应中直接获取分页信息
  const { range, list } = listResponse;
  const currentPage = Math.floor((range?.offset || 0) / (range?.size || 20)) + 1;
  const pageSize = range?.size || 20;
  const total = range?.total || 0;

  // 模拟加载数据
  const loadData = useCallback(async (params: GetTriggersParams) => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      let filtered = [...allMockTriggers];

      // 关键词搜索
      if (params.keyword) {
        const kw = params.keyword.toLowerCase();
        filtered = filtered.filter(
          (trigger) =>
            trigger.name.toLowerCase().includes(kw) ||
            (trigger.description && trigger.description.toLowerCase().includes(kw))
        );
      }

      // 按流程筛选
      if (params.process_id) {
        filtered = filtered.filter((trigger) => trigger.process_id === params.process_id);
      }

      // 按队列筛选
      if (params.queue_id) {
        filtered = filtered.filter((trigger) => trigger.queue_id === params.queue_id);
      }

      // 按状态筛选
      if (params.status) {
        filtered = filtered.filter((trigger) => trigger.status === params.status);
      }

      const offset = params.offset || 0;
      const size = params.size || 20;
      const paged = filtered.slice(offset, offset + size);

      setListResponse({
        range: { offset, size, total: filtered.length },
        list: paged,
      });
    } catch (error) {
      console.error('加载队列触发器列表失败:', error);
      Toast.error(t('common.loadError'));
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [t]);

  useEffect(() => {
    loadData(queryParams);
  }, [queryParams, loadData]);

  // 搜索防抖
  const handleSearch = useMemo(
    () =>
      debounce((value: string) => {
        setQueryParams((prev) => ({ ...prev, offset: 0, keyword: value }));
      }, 500),
    []
  );

  // 流程筛选
  const handleProcessFilter = (processId: string | undefined) => {
    setQueryParams((prev) => ({ ...prev, offset: 0, process_id: processId }));
  };

  // 队列筛选
  const handleQueueFilter = (queueId: string | undefined) => {
    setQueryParams((prev) => ({ ...prev, offset: 0, queue_id: queueId }));
  };

  // 状态筛选
  const handleStatusFilter = (status: TriggerStatus | undefined) => {
    setQueryParams((prev) => ({ ...prev, offset: 0, status }));
  };

  // 创建触发器成功
  const handleCreateSuccess = () => {
    setCreateModalVisible(false);
    loadData(queryParams);
  };

  // 编辑触发器成功
  const handleEditSuccess = () => {
    setEditModalVisible(false);
    setEditingTrigger(null);
    loadData(queryParams);
  };

  // 打开编辑弹窗
  const handleOpenEditModal = (trigger: LYQueueTriggerResponse) => {
    setEditingTrigger(trigger);
    setEditModalVisible(true);
  };

  // 打开详情抽屉
  const handleOpenDrawer = (trigger: LYQueueTriggerResponse) => {
    setSelectedTrigger(trigger);
    setDrawerVisible(true);
  };

  // 关闭详情抽屉
  const handleCloseDrawer = () => {
    setDrawerVisible(false);
    setSelectedTrigger(null);
  };

  // 抽屉中导航
  const handleNavigate = (direction: 'prev' | 'next') => {
    if (!selectedTrigger) return;
    const currentIndex = list.findIndex((t) => t.trigger_id === selectedTrigger.trigger_id);
    const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < list.length) {
      setSelectedTrigger(list[newIndex]);
    }
  };

  // 启用/禁用触发器（直接切换，不弹窗确认）
  const handleToggleStatus = async (trigger: LYQueueTriggerResponse, checked: boolean) => {
    try {
      const newStatus: TriggerStatus = checked ? 'ENABLED' : 'DISABLED';
      
      // 立即更新本地列表状态
      setListResponse((prev) => ({
        ...prev,
        list: prev.list.map((t) =>
          t.trigger_id === trigger.trigger_id
            ? { ...t, status: newStatus }
            : t
        ),
      }));
      
      // 同步更新 mock 数据
      const mockIndex = allMockTriggers.findIndex((t) => t.trigger_id === trigger.trigger_id);
      if (mockIndex !== -1) {
        allMockTriggers[mockIndex] = { 
          ...allMockTriggers[mockIndex], 
          status: newStatus, 
        };
      }
      
      // 如果抽屉打开且是当前触发器，更新抽屉中的数据
      if (selectedTrigger?.trigger_id === trigger.trigger_id) {
        setSelectedTrigger({
          ...trigger,
          status: newStatus,
        });
      }
      
      Toast.success(checked ? t('queueTrigger.enableModal.success') : t('queueTrigger.disableModal.success'));
    } catch (error) {
      Toast.error(checked ? t('queueTrigger.enableModal.error') : t('queueTrigger.disableModal.error'));
    }
  };

  // 删除触发器
  const handleDeleteTrigger = (trigger: LYQueueTriggerResponse) => {
    Modal.confirm({
      title: t('queueTrigger.deleteModal.title'),
      icon: <IconDeleteStroked style={{ color: 'var(--semi-color-danger)' }} />,
      content: (
        <>
          <div>{t('queueTrigger.deleteModal.confirmMessage', { name: trigger.name })}</div>
          <div style={{ color: 'var(--semi-color-text-2)', marginTop: 8 }}>
            {t('queueTrigger.deleteModal.deleteWarning')}
          </div>
        </>
      ),
      okText: t('queueTrigger.deleteModal.confirmDelete'),
      cancelText: t('common.cancel'),
      okButtonProps: { type: 'danger' },
      onOk: async () => {
        try {
          await new Promise((resolve) => setTimeout(resolve, 300));
          Toast.success(t('queueTrigger.deleteModal.success'));
          loadData(queryParams);
          if (selectedTrigger?.trigger_id === trigger.trigger_id) {
            handleCloseDrawer();
          }
        } catch (error) {
          Toast.error(t('queueTrigger.deleteModal.error'));
          throw error;
        }
      },
    });
  };

  // 格式化时间
  const formatTime = (time: string | null | undefined): string => {
    if (!time) return '-';
    return new Date(time).toLocaleString('zh-CN');
  };

  // 表格列定义
  const columns = [
    {
      title: t('queueTrigger.table.name'),
      dataIndex: 'name',
      width: 200,
      render: (text: string) => (
        <span className="queue-trigger-list-table-name">{text}</span>
      ),
    },
    {
      title: t('queueTrigger.table.queueName'),
      dataIndex: 'queue_name',
      width: 160,
      render: (text: string) => text || '-',
    },
    {
      title: t('queueTrigger.table.processName'),
      dataIndex: 'process_name',
      width: 160,
      render: (text: string) => text || '-',
    },
    {
      title: t('queueTrigger.table.messageCount'),
      dataIndex: 'current_message_count',
      width: 120,
      render: (count: number | null) => (
        <span className="queue-trigger-list-message-count">
          {count ?? 0}
        </span>
      ),
    },
    {
      title: t('queueTrigger.table.status'),
      dataIndex: 'status',
      width: 100,
      render: (status: TriggerStatus, record: LYQueueTriggerResponse) => (
        <div
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <Tooltip content={status === 'ENABLED' ? t('queueTrigger.actions.disable') : t('queueTrigger.actions.enable')}>
            <Switch
              checked={status === 'ENABLED'}
              onChange={(checked) => handleToggleStatus(record, checked)}
              size="small"
            />
          </Tooltip>
        </div>
      ),
    },
    {
      title: t('queueTrigger.table.lastTriggerTime'),
      dataIndex: 'last_trigger_time',
      width: 180,
      render: (time: string | null) => (
        <span className="queue-trigger-list-last-time">
          {time ? formatTime(time) : t('queueTrigger.detail.notTriggeredYet')}
        </span>
      ),
    },
    {
      title: t('common.actions'),
      dataIndex: 'actions',
      width: 80,
      render: (_: unknown, record: LYQueueTriggerResponse) => (
        <Dropdown
          trigger="click"
          position="bottomRight"
          clickToHide
          render={
            <Dropdown.Menu>
              <Dropdown.Item
                icon={<IconEditStroked />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenEditModal(record);
                }}
              >
                {t('queueTrigger.actions.edit')}
              </Dropdown.Item>
              <Dropdown.Item
                icon={<IconDeleteStroked />}
                type="danger"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteTrigger(record);
                }}
              >
                {t('queueTrigger.actions.delete')}
              </Dropdown.Item>
            </Dropdown.Menu>
          }
        >
          <Button
            icon={<IconMore />}
            theme="borderless"
            type="tertiary"
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      ),
    },
  ];

  // 判断是否有筛选条件
  const hasFilters = queryParams.keyword || queryParams.process_id || queryParams.queue_id || queryParams.status;

  // 计算当前选中项在列表中的索引
  const currentIndex = selectedTrigger
    ? list.findIndex((t) => t.trigger_id === selectedTrigger.trigger_id)
    : -1;

  return (
    <div className="queue-trigger-list">
      {/* 工具栏 */}
      <Row
        type="flex"
        justify="space-between"
        align="middle"
        className="queue-trigger-list-toolbar"
      >
        <Col>
          <Space>
            <Input
              prefix={<IconSearch />}
              placeholder={t('queueTrigger.searchPlaceholder')}
              onChange={(value) => handleSearch(value)}
              showClear
              className="queue-trigger-list-search-input"
            />
            <Select
              placeholder={t('queueTrigger.filter.allProcesses')}
              optionList={[
                { value: '', label: t('queueTrigger.filter.allProcesses') },
                ...mockProcesses.map((p) => ({ value: p.process_id, label: p.process_name })),
              ]}
              value={queryParams.process_id || ''}
              onChange={(value) => handleProcessFilter(value as string || undefined)}
              style={{ width: 160 }}
            />
            <Select
              placeholder={t('queueTrigger.filter.allQueues')}
              optionList={[
                { value: '', label: t('queueTrigger.filter.allQueues') },
                ...mockQueues.map((q) => ({ value: q.queue_id, label: q.queue_name })),
              ]}
              value={queryParams.queue_id || ''}
              onChange={(value) => handleQueueFilter(value as string || undefined)}
              style={{ width: 160 }}
            />
            <Select
              placeholder={t('queueTrigger.filter.allStatus')}
              optionList={[
                { value: 'ENABLED', label: t('queueTrigger.status.enabled') },
                { value: 'DISABLED', label: t('queueTrigger.status.disabled') },
              ]}
              value={queryParams.status}
              onChange={(v) => handleStatusFilter(v as TriggerStatus | undefined)}
              showClear
              style={{ width: 120 }}
            />
          </Space>
        </Col>
        <Col>
          <Button
            icon={<IconPlus />}
            theme="solid"
            onClick={() => setCreateModalVisible(true)}
          >
            {t('queueTrigger.createTrigger')}
          </Button>
        </Col>
      </Row>

      {/* 表格 */}
      {isInitialLoad ? (
        <TableSkeleton rows={5} />
      ) : list.length === 0 ? (
        <EmptyState
          variant={hasFilters ? 'noResult' : 'noData'}
          description={
            hasFilters
              ? t('queueTrigger.empty.filterDescription')
              : t('queueTrigger.empty.defaultDescription')
          }
        />
      ) : (
        <Table
          dataSource={list}
          columns={columns}
          rowKey="trigger_id"
          loading={loading && !isInitialLoad}
          pagination={{
            currentPage,
            pageSize,
            total,
            showTotal: true,
            showSizeChanger: true,
            pageSizeOpts: [10, 20, 50],
            onChange: (page, size) => {
              setQueryParams((prev) => ({
                ...prev,
                offset: (page - 1) * size,
                size,
              }));
            },
          }}
          onRow={(record) => ({
            onClick: () => handleOpenDrawer(record as LYQueueTriggerResponse),
            className: selectedTrigger?.trigger_id === (record as LYQueueTriggerResponse).trigger_id
              ? 'queue-trigger-row-selected'
              : '',
          })}
          className="queue-trigger-list-table"
        />
      )}

      {/* 创建弹窗 */}
      <CreateQueueTriggerModal
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* 编辑弹窗 */}
      {editingTrigger && (
        <EditQueueTriggerModal
          visible={editModalVisible}
          trigger={editingTrigger}
          onCancel={() => {
            setEditModalVisible(false);
            setEditingTrigger(null);
          }}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* 详情抽屉 */}
      <QueueTriggerDetailDrawer
        visible={drawerVisible}
        trigger={selectedTrigger}
        currentIndex={currentIndex}
        totalCount={list.length}
        onClose={handleCloseDrawer}
        onNavigate={handleNavigate}
        onEdit={handleOpenEditModal}
        onDelete={handleDeleteTrigger}
        onToggleStatus={handleToggleStatus}
      />
    </div>
  );
};

export default QueueTriggerList;
