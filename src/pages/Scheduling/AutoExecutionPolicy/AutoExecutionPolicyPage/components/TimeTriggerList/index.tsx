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
  Tag,
  Select,
} from '@douyinfe/semi-ui';
import {
  IconSearch,
  IconPlus,
  IconMore,
  IconDeleteStroked,
  IconEditStroked,
  IconPlayCircle,
  IconStop,
  IconClock,
} from '@douyinfe/semi-icons';
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
import TimeTriggerDetailDrawer from '../TimeTriggerDetailDrawer';
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

const mockCreatorNames = ['张三', '李四', '王五', '赵六', '钱七'];

const generateMockTimeTriggerResponse = (index: number): LYTimeTriggerResponse => {
  const process = mockProcesses[index % mockProcesses.length];
  const priorities: TaskPriority[] = ['HIGH', 'MEDIUM', 'LOW'];
  const targetTypes: ExecutionTargetType[] = ['BOT_GROUP', 'BOT_IN_GROUP', 'UNGROUPED_BOT'];
  const targetNames = ['订单处理组', '财务审批组', '人事管理组', 'RPA-BOT-001', 'RPA-BOT-002'];
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
    name: `${process.process_name}触发器${index + 1}`,
    description: index % 3 === 0 ? null : `这是${process.process_name}的定时触发器，用于定期自动创建任务`,
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
    work_calendar_name: index % 3 === 0 ? '公司工作日历' : null,
    work_calendar_execution_type: index % 3 === 0 ? 'WORKDAY' : null,
    next_trigger_time: status === 'ENABLED' ? nextTriggerDate.toISOString() : null,
    last_trigger_time: index > 5 ? new Date(2026, 1, 3, 9, 0).toISOString() : null,
    created_by_id: `user-00${(index % 5) + 1}`,
    created_by_name: mockCreatorNames[index % mockCreatorNames.length],
    created_at: createDate.toISOString(),
    updated_at: createDate.toISOString(),
  };
};

// 生成 mock 数据
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

  // 列表数据状态
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

  // 选中状态（抽屉）
  const [selectedTrigger, setSelectedTrigger] = useState<LYTimeTriggerResponse | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  // 弹窗状态
  const [createModalVisible, setCreateModalVisible] = useState(false);

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
      console.error('加载时间触发器列表失败:', error);
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

  // 状态筛选
  const handleStatusFilter = (status: TriggerStatus | undefined) => {
    setQueryParams((prev) => ({ ...prev, offset: 0, status }));
  };

  // 创建触发器成功
  const handleCreateSuccess = () => {
    setCreateModalVisible(false);
    loadData(queryParams);
  };

  // 打开详情抽屉
  const handleOpenDrawer = (trigger: LYTimeTriggerResponse) => {
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

  // 启用/禁用触发器
  const handleToggleStatus = (trigger: LYTimeTriggerResponse) => {
    const isEnabling = trigger.status === 'DISABLED';
    Modal.confirm({
      title: isEnabling ? t('timeTrigger.enableModal.title') : t('timeTrigger.disableModal.title'),
      content: (
        <>
          <div>
            {isEnabling
              ? t('timeTrigger.enableModal.confirmMessage', { name: trigger.name })
              : t('timeTrigger.disableModal.confirmMessage', { name: trigger.name })}
          </div>
          <div style={{ color: 'var(--semi-color-text-2)', marginTop: 8 }}>
            {isEnabling
              ? t('timeTrigger.enableModal.enableHint')
              : t('timeTrigger.disableModal.disableHint')}
          </div>
        </>
      ),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      onOk: async () => {
        try {
          await new Promise((resolve) => setTimeout(resolve, 300));
          Toast.success(isEnabling ? t('timeTrigger.enableModal.success') : t('timeTrigger.disableModal.success'));
          loadData(queryParams);
        } catch (error) {
          Toast.error(isEnabling ? t('timeTrigger.enableModal.error') : t('timeTrigger.disableModal.error'));
          throw error;
        }
      },
    });
  };

  // 删除触发器
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

  // 格式化触发规则显示
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

  // 格式化时间
  const formatTime = (time: string | null | undefined): string => {
    if (!time) return '-';
    return new Date(time).toLocaleString('zh-CN');
  };

  // 表格列定义
  const columns = [
    {
      title: t('timeTrigger.table.name'),
      dataIndex: 'name',
      width: 200,
      render: (text: string) => (
        <span className="time-trigger-list-table-name">{text}</span>
      ),
    },
    {
      title: t('timeTrigger.table.processName'),
      dataIndex: 'process_name',
      width: 160,
      render: (text: string) => text || '-',
    },
    {
      title: t('timeTrigger.table.triggerRule'),
      dataIndex: 'rule_type',
      width: 180,
      render: (_: unknown, record: LYTimeTriggerResponse) => (
        <div className="time-trigger-list-rule">
          <IconClock size="small" className="time-trigger-list-rule-icon" />
          <span>{formatTriggerRule(record)}</span>
        </div>
      ),
    },
    {
      title: t('timeTrigger.table.status'),
      dataIndex: 'status',
      width: 100,
      render: (status: TriggerStatus) => (
        <Tag color={status === 'ENABLED' ? 'green' : 'grey'}>
          {t(`timeTrigger.status.${status.toLowerCase()}`)}
        </Tag>
      ),
    },
    {
      title: t('timeTrigger.table.nextTriggerTime'),
      dataIndex: 'next_trigger_time',
      width: 180,
      render: (time: string | null, record: LYTimeTriggerResponse) => (
        <span className={`time-trigger-list-next-time ${record.status === 'DISABLED' ? 'disabled' : ''}`}>
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
                  // TODO: 编辑触发器
                  Toast.info('编辑功能开发中');
                }}
              >
                {t('timeTrigger.actions.edit')}
              </Dropdown.Item>
              <Dropdown.Item
                icon={record.status === 'ENABLED' ? <IconStop /> : <IconPlayCircle />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleStatus(record);
                }}
              >
                {record.status === 'ENABLED' ? t('timeTrigger.actions.disable') : t('timeTrigger.actions.enable')}
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
  const hasFilters = queryParams.keyword || queryParams.process_id || queryParams.status;

  // 计算当前选中项在列表中的索引
  const currentIndex = selectedTrigger
    ? list.findIndex((t) => t.trigger_id === selectedTrigger.trigger_id)
    : -1;

  return (
    <div className="time-trigger-list">
      {/* 工具栏 */}
      <Row
        type="flex"
        justify="space-between"
        align="middle"
        className="time-trigger-list-toolbar"
      >
        <Col>
          <Space>
            <Input
              prefix={<IconSearch />}
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
            icon={<IconPlus />}
            theme="solid"
            type="primary"
            onClick={() => setCreateModalVisible(true)}
          >
            {t('timeTrigger.createTrigger')}
          </Button>
        </Col>
      </Row>

      {/* 表格区域 */}
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
            size="middle"
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

      {/* 创建触发器弹窗 */}
      <CreateTimeTriggerModal
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* 详情抽屉 */}
      <TimeTriggerDetailDrawer
        visible={drawerVisible}
        trigger={selectedTrigger}
        currentIndex={currentIndex}
        totalCount={list.length}
        onClose={handleCloseDrawer}
        onNavigate={handleNavigate}
        onEdit={() => Toast.info('编辑功能开发中')}
        onDelete={handleDeleteTrigger}
        onToggleStatus={handleToggleStatus}
      />
    </div>
  );
};

export default TimeTriggerList;
