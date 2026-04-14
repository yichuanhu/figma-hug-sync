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
import DepartmentSelect from '@/components/DepartmentSelect';
import { IconSearchStroked } from '@douyinfe/semi-icons';
import { Ellipsis, Pencil, Plus, Trash2, UserPlus } from 'lucide-react';
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
import { useCollaboratorAction } from '@/hooks/useCollaboratorAction';
import './index.less';

// ============= 工具函数 =============

const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// ============= MockDatageneration =============

const mockProcesses = [
  { process_id: 'proc-001', process_name: 'Auto Order Processing', owning_department_name: 'Finance Department' },
  { process_id: 'proc-002', process_name: 'Expense Reimbursement Approval', owning_department_name: 'Enterprise Business Center' },
  { process_id: 'proc-003', process_name: 'Employee Onboarding Flow', owning_department_name: 'Human Resources Department' },
  { process_id: 'proc-004', process_name: 'Data Collection Flow', owning_department_name: 'R&D Center' },
];

const mockQueues = [
  { queue_id: 'queue-001', queue_name: 'Pending Orders Queue' },
  { queue_id: 'queue-002', queue_name: 'Approval Tasks Queue' },
  { queue_id: 'queue-003', queue_name: 'Data Sync Queue' },
  { queue_id: 'queue-004', queue_name: 'Report Generation Queue' },
];

const mockCreatorNames = ['John Smith', 'Jane Doe', 'Mike Wang', 'David Zhao', 'Chris Qian'];

const generateMockQueueTriggerResponse = (index: number): LYQueueTriggerResponse => {
  const process = mockProcesses[index % mockProcesses.length];
  const queue = mockQueues[index % mockQueues.length];
  const priorities: TaskPriority[] = ['HIGH', 'MEDIUM', 'LOW'];
  const targetTypes: ExecutionTargetType[] = ['BOT_GROUP', 'BOT_IN_GROUP', 'UNGROUPED_BOT'];
  const targetNames = ['Order Processing Group', 'Finance Approval Group', 'HR Management Group', 'RPA-BOT-001', 'RPA-BOT-002'];
  const statuses: TriggerStatus[] = ['ENABLED', 'DISABLED'];

  const createDate = new Date(2026, 0, 1 + (index % 28), 10 + (index % 12), (index * 7) % 60);
  const status = statuses[index % statuses.length];

  return {
    trigger_id: `qt-${generateUUID().substring(0, 8)}`,
    name: `${queue.queue_name} Trigger${index + 1}`,
    description: index % 5 === 0 ? null : index % 5 === 1 ? `Monitors ${queue.queue_name} in real-time and auto-creates ${process.process_name} tasks. When effective message count reaches the preset threshold, tasks are automatically triggered. Supports configuring message consumption per trigger and scheduled check mechanisms. Created tasks carry queue messages as input parameters for end-to-end automation. Suitable for order processing, ticket assignment, and message-driven scenarios.` : `Monitor ${queue.queue_name}, auto-create ${process.process_name} tasks`,
    status,
    process_id: process.process_id,
    process_name: process.process_name,
    owning_department_name: process.owning_department_name,
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
    work_calendar_name: index % 3 === 0 ? 'Company Work Calendar' : null,
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

// generation mock Data
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
  owning_department_name?: string;
}

// ============= 组件 =============

const QueueTriggerList = () => {
  const { t } = useTranslation();

  // ListDataStatus
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
    owning_department_name: undefined,
  });

  // SelectedStatus(Drawer)
  const [selectedTrigger, setSelectedTrigger] = useState<LYQueueTriggerResponse | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [detailInitialTab, setDetailInitialTab] = useState('basic');
  const { openCollaborator, renderCollaboratorPanel } = useCollaboratorAction();

  // ModalStatus
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<LYQueueTriggerResponse | null>(null);

  // from响应直接获取分页Info
  const { range, list } = listResponse;
  const currentPage = Math.floor((range?.offset || 0) / (range?.size || 20)) + 1;
  const pageSize = range?.size || 20;
  const total = range?.total || 0;

  // 模拟LoadingData
  const loadData = useCallback(async (params: GetTriggersParams) => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      let filtered = [...allMockTriggers];

      // 关键词Search
      if (params.keyword) {
        const kw = params.keyword.toLowerCase();
        filtered = filtered.filter(
          (trigger) =>
            trigger.name.toLowerCase().includes(kw) ||
            (trigger.description && trigger.description.toLowerCase().includes(kw))
        );
      }

      // byProcessFilter
      if (params.process_id) {
        filtered = filtered.filter((trigger) => trigger.process_id === params.process_id);
      }

      // byQueueFilter
      if (params.queue_id) {
        filtered = filtered.filter((trigger) => trigger.queue_id === params.queue_id);
      }

      // byStatusFilter
      if (params.status) {
        filtered = filtered.filter((trigger) => trigger.status === params.status);
      }

      // by归属部门Filter
      if (params.owning_department_name && params.owning_department_name.length > 0) {
        const deptNames: string[] = Array.isArray(params.owning_department_name) ? params.owning_department_name : [params.owning_department_name];
        filtered = filtered.filter((trigger) => deptNames.includes(trigger.owning_department_name));
      }

      const offset = params.offset || 0;
      const size = params.size || 20;
      const paged = filtered.slice(offset, offset + size);

      setListResponse({
        range: { offset, size, total: filtered.length },
        list: paged,
      });
    } catch (error) {
      console.error('LoadingQueue TriggerListFailed:', error);
      Toast.error(t('common.loadError'));
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [t]);

  useEffect(() => {
    loadData(queryParams);
  }, [queryParams, loadData]);

  // Searchdebounced
  const handleSearch = useMemo(
    () =>
      debounce((value: string) => {
        setQueryParams((prev) => ({ ...prev, offset: 0, keyword: value }));
      }, 500),
    []
  );

  // ProcessFilter
  const handleProcessFilter = (processId: string | undefined) => {
    setQueryParams((prev) => ({ ...prev, offset: 0, process_id: processId }));
  };

  // QueueFilter
  const handleQueueFilter = (queueId: string | undefined) => {
    setQueryParams((prev) => ({ ...prev, offset: 0, queue_id: queueId }));
  };

  // StatusFilter
  const handleStatusFilter = (status: TriggerStatus | undefined) => {
    setQueryParams((prev) => ({ ...prev, offset: 0, status }));
  };

  // Create TriggerSuccess
  const handleCreateSuccess = () => {
    setCreateModalVisible(false);
    loadData(queryParams);
  };

  // Edit TriggerSuccess
  const handleEditSuccess = () => {
    setEditModalVisible(false);
    setEditingTrigger(null);
    loadData(queryParams);
  };

  // openEdit modal
  const handleOpenEditModal = (trigger: LYQueueTriggerResponse) => {
    setEditingTrigger(trigger);
    setEditModalVisible(true);
  };

  // openDetails drawer
  const handleOpenDrawer = (trigger: LYQueueTriggerResponse) => {
    setSelectedTrigger(trigger);
    setDetailInitialTab('basic');
    setDrawerVisible(true);
  };

  // CloseDetails drawer
  const handleCloseDrawer = () => {
    setDrawerVisible(false);
    setSelectedTrigger(null);
    setDetailInitialTab('basic');
  };

  // Drawer导航
  const handleNavigate = (trigger: LYQueueTriggerResponse) => {
    setSelectedTrigger(trigger);
  };

  // Enable/Disable Trigger(直接切换, notModalConfirm)
  const handleToggleStatus = async (trigger: LYQueueTriggerResponse, checked: boolean) => {
    try {
      const newStatus: TriggerStatus = checked ? 'ENABLED' : 'DISABLED';
      
      // immediatelyUpdate本地ListStatus
      setListResponse((prev) => ({
        ...prev,
        list: prev.list.map((t) =>
          t.trigger_id === trigger.trigger_id
            ? { ...t, status: newStatus }
            : t
        ),
      }));
      
      // 同步Update mock Data
      const mockIndex = allMockTriggers.findIndex((t) => t.trigger_id === trigger.trigger_id);
      if (mockIndex !== -1) {
        allMockTriggers[mockIndex] = { 
          ...allMockTriggers[mockIndex], 
          status: newStatus, 
        };
      }
      
      // ifDraweropen且is当前 Trigger, UpdateDrawer's Data
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

  // Delete Trigger
  const handleDeleteTrigger = (trigger: LYQueueTriggerResponse) => {
    Modal.confirm({
      title: t('queueTrigger.deleteModal.title'),      content: (
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

  // Format化Time
  const formatTime = (time: string | null | undefined): string => {
    if (!time) return '-';
    return new Date(time).toLocaleString('zh-CN');
  };

  // Table列定义
  const columns = [
    {
      title: t('queueTrigger.table.name'),
      dataIndex: 'name',
      width: 200,
      ellipsis: true,
    },
    {
      title: t('queueTrigger.table.queueName'),
      dataIndex: 'queue_name',
      width: 160,
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: t('queueTrigger.table.processName'),
      dataIndex: 'process_name',
      width: 160,
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: t('queueTrigger.table.messageCount'),
      dataIndex: 'current_message_count',
      width: 120,
      render: (count: number | null) => (
        <span>
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
        <span>
          {time ? formatTime(time) : t('queueTrigger.detail.notTriggeredYet')}
        </span>
      ),
    },
    {
      title: t('common.owningDepartment'),
      dataIndex: 'owning_department_name',
      width: 140,
      ellipsis: true,
      render: (text: string | null) => text || '-',
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
                icon={<Pencil size={16} strokeWidth={2} />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenEditModal(record);
                }}
              >
                {t('queueTrigger.actions.edit')}
              </Dropdown.Item>
              <Dropdown.Item
                icon={<UserPlus size={14} strokeWidth={2} />}
                onClick={(e) => {
                  e.stopPropagation();
                  openCollaborator(record.trigger_id);
                }}
              >
                {t('collaborator.actions.addCollaborator')}
              </Dropdown.Item>
              <Dropdown.Item
                icon={<Trash2 size={16} strokeWidth={2} />}
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
            icon={<Ellipsis size={16} strokeWidth={2} />}
            theme="borderless"
            type="tertiary"
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      ),
    },
  ];

  // departmentOptions removed - using DepartmentSelect with tree data

  const hasFilters = queryParams.keyword || queryParams.process_id || queryParams.queue_id || queryParams.status || queryParams.owning_department_name;

  // currentIndex no longer needed - navigation handled by DetailDrawerWrapper

  return (
    <div className="queue-trigger-list">
      {/* Toolbar */}
      <Row
        type="flex"
        justify="space-between"
        align="middle"
        className="queue-trigger-list-toolbar"
      >
        <Col>
          <Space>
            <Input
              prefix={<IconSearchStroked />}
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
            <DepartmentSelect
              placeholder={t('common.owningDepartment')}
              value={queryParams.owning_department_name}
              onChange={(v) => setQueryParams(prev => ({ ...prev, offset: 0, owning_department_name: v as string | undefined }))}
              showClear
              useNameAsValue
              style={{ width: 'auto', minWidth: 120, maxWidth: 600 }}
            />
          </Space>
        </Col>
        <Col>
          <Button
            icon={<Plus size={16} strokeWidth={2} />}
            theme="solid"
            onClick={() => setCreateModalVisible(true)}
          >
            {t('queueTrigger.createTrigger')}
          </Button>
        </Col>
      </Row>

      {/* Table */}
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
          size="small"
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

      {/* Create modal */}
      <CreateQueueTriggerModal
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Edit modal */}
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

      {/* Details drawer */}
      <QueueTriggerDetailDrawer
        visible={drawerVisible}
        trigger={selectedTrigger}
        triggerList={list}
        onClose={handleCloseDrawer}
        onNavigate={handleNavigate}
        onEdit={handleOpenEditModal}
        onDelete={handleDeleteTrigger}
        onToggleStatus={handleToggleStatus}
        initialTab={detailInitialTab}
      />

      {renderCollaboratorPanel('TRIGGER', 'scheduling')}
    </div>
  );
};

export default QueueTriggerList;
