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
  IconSearchStroked,
  IconPlusStroked,
  IconMoreStroked,
  IconDeleteStroked,
  IconEditStroked,
  IconClockStroked,
} from '@douyinfe/semi-icons';
import { UserPlus } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import TableSkeleton from '@/components/TableSkeleton';
import type {
  LYTimeTriggerResponse,
  LYListResponseLYTimeTriggerResponse,
  TriggerStatus,
  TaskPriority,
  ExecutionTargetType,
  TriggerRuleType,
  BasicFrequencyType,
} from '@/api';
import CreateTimeTriggerModal from '../CreateTimeTriggerModal';
import EditTimeTriggerModal from '../EditTimeTriggerModal';
import TimeTriggerDetailDrawer from '../TimeTriggerDetailDrawer';
import CollaboratorPanel from '@/components/CollaboratorManager/CollaboratorPanel';
import type { CollaboratorAssetType } from '@/api';
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
  { process_id: 'proc-001', process_name: 'Auto Order Processing' },
  { process_id: 'proc-002', process_name: 'Expense Reimbursement Approval' },
  { process_id: 'proc-003', process_name: 'Employee Onboarding Flow' },
  { process_id: 'proc-004', process_name: 'Data Collection Flow' },
];

const mockCreatorNames = ['John Smith', 'Jane Doe', 'Mike Wang', 'David Zhao', 'Chris Qian'];

const generateMockTimeTriggerResponse = (index: number): LYTimeTriggerResponse => {
  const process = mockProcesses[index % mockProcesses.length];
  const priorities: TaskPriority[] = ['HIGH', 'MEDIUM', 'LOW'];
  const targetTypes: ExecutionTargetType[] = ['BOT_GROUP', 'BOT_IN_GROUP', 'UNGROUPED_BOT'];
  const targetNames = ['Order Processing Group', 'Finance Approval Group', 'HR Management Group', 'RPA-BOT-001', 'RPA-BOT-002'];
  const statuses: TriggerStatus[] = ['ENABLED', 'DISABLED'];
  const ruleTypes: TriggerRuleType[] = ['BASIC', 'CRON'];
  const frequencyTypes: BasicFrequencyType[] = ['MINUTELY', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY'];

  const createDate = new Date(2026, 0, 1 + (index % 28), 10 + (index % 12), (index * 7) % 60);
  const nextTriggerDate = new Date(2026, 1, 4 + (index % 7), 9, 0);

  const ruleType = ruleTypes[index % ruleTypes.length];
  const frequencyType = frequencyTypes[index % frequencyTypes.length];
  const status = statuses[index % statuses.length];

  return {
    trigger_id: `trigger-${generateUUID().substring(0, 8)}`,
    name: `${process.process_name} Trigger${index + 1}`,
    description: index % 5 === 0 ? null : index % 5 === 1 ? `This is ${process.process_name}'s time trigger for periodic task creation. Automatically triggers and creates tasks assigned to specified execution targets. Supports daily, weekly, monthly, and Cron expression schedules. Also supports work calendar filtering to skip non-working days. When the associated process version updates, new tasks use the latest version.` : `${process.process_name} scheduled trigger for periodic task creation`,
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
    task_count_per_trigger: 1 + (index % 3),
    allow_duplicate_tasks: index % 2 === 0,
    input_parameters: { targetUrl: 'https://example.com', maxCount: 100 },
    rule_type: ruleType,
    cron_expression: ruleType === 'CRON' ? '0 9 * * *' : null,
    basic_frequency_type: ruleType === 'BASIC' ? frequencyType : null,
    basic_frequency_value: ruleType === 'BASIC' && (frequencyType === 'MINUTELY' || frequencyType === 'HOURLY') ? 30 : null,
    time_zone: 'Asia/Shanghai',
    start_date_time: createDate.toISOString(),
    end_date_time: index % 4 === 0 ? new Date(2026, 11, 31).toISOString() : null,
    enable_work_calendar: index % 3 === 0,
    work_calendar_id: index % 3 === 0 ? 'cal-001' : null,
    work_calendar_name: index % 3 === 0 ? 'Company Work Calendar' : null,
    work_calendar_execution_type: index % 3 === 0 ? 'WORKDAY' : null,
    next_trigger_time: status === 'ENABLED' ? nextTriggerDate.toISOString() : null,
    last_trigger_time: index > 5 ? new Date(2026, 1, 3, 9, 0).toISOString() : null,
    created_by_id: `user-00${(index % 5) + 1}`,
    created_by_name: mockCreatorNames[index % mockCreatorNames.length],
    created_at: createDate.toISOString(),
    updated_at: createDate.toISOString(),
  };
};

// generation mock Data
const generateMockTriggers = (count: number) => {
  return Array.from({ length: count }, (_, i) => generateMockTimeTriggerResponse(i));
};

const allMockTriggers = generateMockTriggers(35);

interface GetTriggersParams {
  offset?: number;
  size?: number;
  keyword?: string;
  process_id?: string;
  status?: TriggerStatus;
}

// ============= 组件 =============

const TimeTriggerList = () => {
  const { t } = useTranslation();

  // ListDataStatus
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [listResponse, setListResponse] = useState<LYListResponseLYTimeTriggerResponse>({
    range: { offset: 0, size: 20, total: 0 },
    list: [],
  });
  const [loading, setLoading] = useState(false);
  const [queryParams, setQueryParams] = useState<GetTriggersParams>({
    offset: 0,
    size: 20,
    keyword: '',
    process_id: undefined,
    status: undefined,
  });

  // SelectedStatus(Drawer)
  const [selectedTrigger, setSelectedTrigger] = useState<LYTimeTriggerResponse | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [detailInitialTab, setDetailInitialTab] = useState('basic');
  const [addCollaboratorModalVisible, setAddCollaboratorModalVisible] = useState(false);
  const [addCollaboratorAssetId, setAddCollaboratorAssetId] = useState('');

  // ModalStatus
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<LYTimeTriggerResponse | null>(null);

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

      // byStatusFilter
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
      console.error('LoadingTime triggerListFailed:', error);
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
  const handleOpenEditModal = (trigger: LYTimeTriggerResponse) => {
    setEditingTrigger(trigger);
    setEditModalVisible(true);
  };

  // openDetails drawer
  const handleOpenDrawer = (trigger: LYTimeTriggerResponse) => {
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
  const handleNavigate = (trigger: LYTimeTriggerResponse) => {
    setSelectedTrigger(trigger);
  };

  // Enable/Disable Trigger(直接切换, notModalConfirm)
  const handleToggleStatus = async (trigger: LYTimeTriggerResponse, checked: boolean) => {
    try {
      const newStatus: TriggerStatus = checked ? 'ENABLED' : 'DISABLED';
      const newNextTriggerTime = checked ? new Date(Date.now() + 86400000).toISOString() : null;
      
      // immediatelyUpdate本地ListStatus
      setListResponse((prev) => ({
        ...prev,
        list: prev.list.map((t) =>
          t.trigger_id === trigger.trigger_id
            ? { ...t, status: newStatus, next_trigger_time: newNextTriggerTime }
            : t
        ),
      }));
      
      // 同步Update mock Data
      const mockIndex = allMockTriggers.findIndex((t) => t.trigger_id === trigger.trigger_id);
      if (mockIndex !== -1) {
        allMockTriggers[mockIndex] = { 
          ...allMockTriggers[mockIndex], 
          status: newStatus, 
          next_trigger_time: newNextTriggerTime 
        };
      }
      
      // ifDraweropen且is当前 Trigger, UpdateDrawer's Data
      if (selectedTrigger?.trigger_id === trigger.trigger_id) {
        setSelectedTrigger({
          ...trigger,
          status: newStatus,
          next_trigger_time: newNextTriggerTime,
        });
      }
      
      Toast.success(checked ? t('timeTrigger.enableModal.success') : t('timeTrigger.disableModal.success'));
    } catch (error) {
      Toast.error(checked ? t('timeTrigger.enableModal.error') : t('timeTrigger.disableModal.error'));
    }
  };

  // Delete Trigger
  const handleDeleteTrigger = (trigger: LYTimeTriggerResponse) => {
    Modal.confirm({
      title: t('timeTrigger.deleteModal.title'),
      icon: <IconDeleteStroked style={{ color: 'var(--semi-color-danger)' }} />,
      content: (
        <>
          <div>{t('timeTrigger.deleteModal.confirmMessage', { name: trigger.name })}</div>
          <div style={{ color: 'var(--semi-color-text-2)', marginTop: 8 }}>
            {t('timeTrigger.deleteModal.deleteWarning')}
          </div>
        </>
      ),
      okText: t('timeTrigger.deleteModal.confirmDelete'),
      cancelText: t('common.cancel'),
      okButtonProps: { type: 'danger' },
      onOk: async () => {
        try {
          await new Promise((resolve) => setTimeout(resolve, 300));
          Toast.success(t('timeTrigger.deleteModal.success'));
          loadData(queryParams);
          if (selectedTrigger?.trigger_id === trigger.trigger_id) {
            handleCloseDrawer();
          }
        } catch (error) {
          Toast.error(t('timeTrigger.deleteModal.error'));
          throw error;
        }
      },
    });
  };

  // Format化Trigger Rulesdisplay
  const formatTriggerRule = (trigger: LYTimeTriggerResponse): string => {
    if (trigger.rule_type === 'CRON') {
      return trigger.cron_expression || '';
    }
    
    const freq = trigger.basic_frequency_type;
    const value = trigger.basic_frequency_value;
    
    switch (freq) {
      case 'MINUTELY':
        return t('timeTrigger.frequencyDisplay.everyMinute', { value });
      case 'HOURLY':
        return t('timeTrigger.frequencyDisplay.everyHour', { value });
      case 'DAILY':
        return t('timeTrigger.frequencyDisplay.everyDayAt', { time: '09:00' });
      case 'WEEKLY':
        return t('timeTrigger.frequencyDisplay.everyWeekAt', { day: t('timeTrigger.weekdays.monday'), time: '09:00' });
      case 'MONTHLY':
        return t('timeTrigger.frequencyDisplay.everyMonthAt', { day: 1, time: '09:00' });
      default:
        return '-';
    }
  };

  // Format化Time
  const formatTime = (time: string | null | undefined): string => {
    if (!time) return '-';
    return new Date(time).toLocaleString('zh-CN');
  };

  // Table列定义
  const columns = [
    {
      title: t('timeTrigger.table.name'),
      dataIndex: 'name',
      width: 200,
      ellipsis: true,
    },
    {
      title: t('timeTrigger.table.processName'),
      dataIndex: 'process_name',
      width: 160,
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: t('timeTrigger.table.triggerRule'),
      dataIndex: 'rule_type',
      width: 180,
      render: (_: unknown, record: LYTimeTriggerResponse) => (
        <div>
          <IconClockStroked size="small" />
          <span>{formatTriggerRule(record)}</span>
        </div>
      ),
    },
    {
      title: t('timeTrigger.table.status'),
      dataIndex: 'status',
      width: 100,
      render: (status: TriggerStatus, record: LYTimeTriggerResponse) => (
        <div
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <Tooltip content={status === 'ENABLED' ? t('timeTrigger.actions.disable') : t('timeTrigger.actions.enable')}>
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
      title: t('timeTrigger.table.nextTriggerTime'),
      dataIndex: 'next_trigger_time',
      width: 180,
      render: (time: string | null, record: LYTimeTriggerResponse) => (
        <span>
          {record.status === 'DISABLED' ? t('timeTrigger.detail.notScheduled') : formatTime(time)}
        </span>
      ),
    },
    {
      title: t('common.actions'),
      dataIndex: 'actions',
      width: 80,
      render: (_: unknown, record: LYTimeTriggerResponse) => (
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
                {t('timeTrigger.actions.edit')}
              </Dropdown.Item>
              <Dropdown.Item
                icon={<UserPlus size={14} strokeWidth={2} />}
                onClick={(e) => {
                  e.stopPropagation();
                  setAddCollaboratorAssetId(record.trigger_id);
                  setAddCollaboratorModalVisible(true);
                }}
              >
                {t('collaborator.actions.addCollaborator')}
              </Dropdown.Item>
              <Dropdown.Item
                icon={<IconDeleteStroked />}
                type="danger"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteTrigger(record);
                }}
              >
                {t('timeTrigger.actions.delete')}
              </Dropdown.Item>
            </Dropdown.Menu>
          }
        >
          <Button
            icon={<IconMoreStroked />}
            theme="borderless"
            type="tertiary"
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      ),
    },
  ];

  // 判断is否hasFilterCondition
  const hasFilters = queryParams.keyword || queryParams.process_id || queryParams.status;

  // currentIndex no longer needed - navigation handled by DetailDrawerWrapper

  return (
    <div className="time-trigger-list">
      {/* Toolbar */}
      <Row
        type="flex"
        justify="space-between"
        align="middle"
        className="time-trigger-list-toolbar"
      >
        <Col>
          <Space>
            <Input
              prefix={<IconSearchStroked />}
              placeholder={t('timeTrigger.searchPlaceholder')}
              onChange={handleSearch}
              showClear
              className="time-trigger-list-search-input"
            />
            <Select
              placeholder={t('timeTrigger.filter.allProcesses')}
              value={queryParams.process_id}
              onChange={(v) => handleProcessFilter(v as string | undefined)}
              showClear
              style={{ width: 180 }}
              optionList={mockProcesses.map((p) => ({
                value: p.process_id,
                label: p.process_name,
              }))}
            />
            <Select
              placeholder={t('timeTrigger.filter.allStatus')}
              value={queryParams.status}
              onChange={(v) => handleStatusFilter(v as TriggerStatus | undefined)}
              showClear
              style={{ width: 120 }}
              optionList={[
                { value: 'ENABLED', label: t('timeTrigger.status.enabled') },
                { value: 'DISABLED', label: t('timeTrigger.status.disabled') },
              ]}
            />
          </Space>
        </Col>
        <Col>
          <Button
            icon={<IconPlusStroked />}
            theme="solid"
            type="primary"
            onClick={() => setCreateModalVisible(true)}
          >
            {t('timeTrigger.createTrigger')}
          </Button>
        </Col>
      </Row>

      {/* Table area */}
      <div className="time-trigger-list-table">
        {isInitialLoad ? (
          <TableSkeleton />
        ) : list.length === 0 ? (
          <EmptyState
            variant={hasFilters ? 'noResult' : 'noData'}
            description={hasFilters ? t('common.noResult') : t('timeTrigger.noData')}
          />
        ) : (
          <Table
            size="small"
            dataSource={list}
            rowKey="trigger_id"
            loading={loading && !isInitialLoad}
            columns={columns}
            onRow={(record) => ({
              onClick: () => handleOpenDrawer(record as LYTimeTriggerResponse),
              style: { cursor: 'pointer' },
              className:
                selectedTrigger?.trigger_id === (record as LYTimeTriggerResponse).trigger_id && drawerVisible
                  ? 'time-trigger-row-selected'
                  : '',
            })}
            pagination={{
              total,
              pageSize,
              currentPage,
              showSizeChanger: true,
              showTotal: true,
              pageSizeOpts: [10, 20, 50, 100],
              onPageChange: (page) => {
                setQueryParams((prev) => ({ ...prev, offset: (page - 1) * pageSize }));
              },
              onPageSizeChange: (size) => {
                setQueryParams((prev) => ({ ...prev, offset: 0, size }));
              },
            }}
          />
        )}
      </div>

      {/* Create Trigger modal */}
      <CreateTimeTriggerModal
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Edit Trigger modal */}
      <EditTimeTriggerModal
        visible={editModalVisible}
        trigger={editingTrigger}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingTrigger(null);
        }}
        onSuccess={handleEditSuccess}
      />

      {/* Details drawer */}
      <TimeTriggerDetailDrawer
        visible={drawerVisible}
        trigger={selectedTrigger}
        triggerList={list}
        onClose={handleCloseDrawer}
        onNavigate={handleNavigate}
        onEdit={handleOpenEditModal}
        onDelete={handleDeleteTrigger}
        onToggleStatus={handleToggleStatus}
        onRefresh={() => loadData(queryParams)}
        initialTab={detailInitialTab}
      />

      <CollaboratorPanel
        visible={addCollaboratorModalVisible}
        onVisibleChange={setAddCollaboratorModalVisible}
        assetType={'TRIGGER' as CollaboratorAssetType}
        assetId={addCollaboratorAssetId}
        context="development"
        canManage={true}
      />
    </div>
  );
};

export default TimeTriggerList;
