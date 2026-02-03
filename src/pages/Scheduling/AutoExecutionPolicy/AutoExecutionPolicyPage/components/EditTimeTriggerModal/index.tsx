import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Button,
  Toast,
  Typography,
  Select,
  Input,
  InputNumber,
  Switch,
  RadioGroup,
  Radio,
  Tooltip,
  Tag,
  Steps,
  TextArea,
} from '@douyinfe/semi-ui';
import { IconHelpCircle, IconInbox } from '@douyinfe/semi-icons';
import TriggerRuleConfig from '@/components/TriggerRuleConfig';
import type {
  LYTimeTriggerResponse,
  LYProcessActiveVersionResponse,
  LYProcessParameterDefinition,
  ExecutionTargetType,
  TaskPriority,
  TriggerRuleType,
  BasicFrequencyType,
} from '@/api';
import './index.less';

const { Text } = Typography;

interface EditTimeTriggerModalProps {
  visible: boolean;
  trigger: LYTimeTriggerResponse | null;
  onCancel: () => void;
  onSuccess: () => void;
}

// Mock 流程列表
const mockProcesses: LYProcessActiveVersionResponse[] = [
  {
    process_id: 'proc-001',
    process_name: '订单自动处理',
    version_id: 'ver-001',
    version: 'v1.2.0',
    parameters: [
      { name: 'targetUrl', type: 'TEXT', required: true, description: '目标URL地址' },
      { name: 'maxCount', type: 'NUMBER', required: false, default_value: 100, description: '最大处理数量' },
      { name: 'enableRetry', type: 'BOOLEAN', required: false, default_value: true, description: '是否启用重试' },
    ],
    output_parameters: [
      { name: 'processedCount', type: 'NUMBER', description: '已处理订单数量' },
      { name: 'successRate', type: 'NUMBER', description: '处理成功率' },
    ],
  },
  {
    process_id: 'proc-002',
    process_name: '财务报销审批',
    version_id: 'ver-002',
    version: 'v2.0.0',
    parameters: [
      { name: 'department', type: 'TEXT', required: true, description: '部门名称' },
    ],
    output_parameters: [
      { name: 'approvalResult', type: 'BOOLEAN', description: '审批结果' },
    ],
  },
  {
    process_id: 'proc-003',
    process_name: '人事入职流程',
    version_id: 'ver-003',
    version: 'v1.0.0',
    parameters: [],
    output_parameters: [],
  },
  {
    process_id: 'proc-004',
    process_name: '采购申请流程',
    version_id: 'ver-004',
    version: 'v1.1.0',
    parameters: [],
    output_parameters: [],
  },
  {
    process_id: 'proc-005',
    process_name: '合同审批流程',
    version_id: 'ver-005',
    version: 'v2.1.0',
    parameters: [],
    output_parameters: [],
  },
];

// Mock 执行目标
const mockBotGroups = [
  { id: 'group-001', name: '订单处理组', onlineCount: 3, totalCount: 5 },
  { id: 'group-002', name: '财务审批组', onlineCount: 2, totalCount: 3 },
];

const mockBots = [
  { id: 'bot-001', name: 'RPA-BOT-001', groupId: 'group-001', status: 'ONLINE' },
  { id: 'bot-002', name: 'RPA-BOT-002', groupId: null, status: 'ONLINE' },
];

// Mock 工作日历
const mockWorkCalendars = [
  { id: 'cal-001', name: '公司工作日历' },
  { id: 'cal-002', name: '银行工作日历' },
];

// Mock 凭据
const mockCredentials = [
  { id: 'cred-001', name: '系统管理员凭据' },
  { id: 'cred-002', name: 'API访问凭据' },
];

const EditTimeTriggerModal = ({ visible, trigger, onCancel, onSuccess }: EditTimeTriggerModalProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // 第一步：基本信息
  const [triggerName, setTriggerName] = useState('');
  const [description, setDescription] = useState('');

  // 第二步：任务配置
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
  const [selectedProcess, setSelectedProcess] = useState<LYProcessActiveVersionResponse | null>(null);
  const [targetType, setTargetType] = useState<ExecutionTargetType | null>(null);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [maxDuration, setMaxDuration] = useState<number>(3600);
  const [validityDays, setValidityDays] = useState<number>(7);
  const [enableRecording, setEnableRecording] = useState<boolean>(false);
  const [taskCountPerTrigger, setTaskCountPerTrigger] = useState<number>(1);
  const [allowDuplicateTasks, setAllowDuplicateTasks] = useState<boolean>(true);
  const [parameterValues, setParameterValues] = useState<Record<string, unknown>>({});

  // 第三步：触发规则
  const [ruleType, setRuleType] = useState<TriggerRuleType>('BASIC');
  const [frequencyType, setFrequencyType] = useState<BasicFrequencyType>('DAILY');
  // 基本类型配置
  const [minuteInterval, setMinuteInterval] = useState<number>(5);
  const [hourInterval, setHourInterval] = useState<number>(2);
  const [minuteOfHour, setMinuteOfHour] = useState<number>(0);
  const [triggerHour, setTriggerHour] = useState<number>(9);
  const [triggerMinute, setTriggerMinute] = useState<number>(0);
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([1]);
  const [selectedMonthDay, setSelectedMonthDay] = useState<number | 'L'>(1);
  // Cron 表达式
  const [cronExpression, setCronExpression] = useState('');
  // 时区和时间范围
  const [timeZone, setTimeZone] = useState('Asia/Shanghai');
  const [startDateTime, setStartDateTime] = useState<Date | null>(new Date());
  const [endDateTime, setEndDateTime] = useState<Date | null>(null);
  const [endTimeType, setEndTimeType] = useState<'never' | 'custom'>('never');
  // 工作日历
  const [enableWorkCalendar, setEnableWorkCalendar] = useState(false);
  const [workCalendarId, setWorkCalendarId] = useState<string | null>(null);
  const [workCalendarExecutionType, setWorkCalendarExecutionType] = useState<'WORKDAY' | 'NON_WORKDAY'>('WORKDAY');

  // 初始化表单数据
  useEffect(() => {
    if (visible && trigger) {
      setCurrentStep(0);
      setTriggerName(trigger.name);
      setDescription(trigger.description || '');
      setSelectedProcessId(trigger.process_id);
      const process = mockProcesses.find((p) => p.process_id === trigger.process_id);
      setSelectedProcess(process || null);
      setTargetType(trigger.execution_target_type);
      setSelectedTargetId(trigger.execution_target_id);
      setPriority(trigger.priority);
      setMaxDuration(trigger.max_execution_duration);
      setValidityDays(trigger.validity_days);
      setEnableRecording(trigger.enable_recording);
      setTaskCountPerTrigger(trigger.task_count_per_trigger);
      setAllowDuplicateTasks(trigger.allow_duplicate_tasks);
      setParameterValues(trigger.input_parameters || {});
      setRuleType(trigger.rule_type);
      setFrequencyType(trigger.basic_frequency_type || 'DAILY');
      setCronExpression(trigger.cron_expression || '');
      setTimeZone(trigger.time_zone);
      setStartDateTime(trigger.start_date_time ? new Date(trigger.start_date_time) : new Date());
      setEndDateTime(trigger.end_date_time ? new Date(trigger.end_date_time) : null);
      setEndTimeType(trigger.end_date_time ? 'custom' : 'never');
      setEnableWorkCalendar(trigger.enable_work_calendar);
      setWorkCalendarId(trigger.work_calendar_id);
      setWorkCalendarExecutionType(trigger.work_calendar_execution_type || 'WORKDAY');

      // 根据 frequencyType 和 cron_expression 解析详细配置
      if (trigger.rule_type === 'BASIC' && trigger.basic_frequency_type) {
        // 解析 cron 表达式获取详细配置
        const cronParts = (trigger.cron_expression || '').split(' ');
        if (cronParts.length >= 5) {
          switch (trigger.basic_frequency_type) {
            case 'MINUTELY':
              const minMatch = cronParts[0].match(/\*\/(\d+)/);
              if (minMatch) setMinuteInterval(parseInt(minMatch[1]));
              break;
            case 'HOURLY':
              setMinuteOfHour(parseInt(cronParts[0]) || 0);
              const hourMatch = cronParts[1].match(/\*\/(\d+)/);
              if (hourMatch) setHourInterval(parseInt(hourMatch[1]));
              break;
            case 'DAILY':
              setTriggerMinute(parseInt(cronParts[0]) || 0);
              setTriggerHour(parseInt(cronParts[1]) || 9);
              break;
            case 'WEEKLY':
              setTriggerMinute(parseInt(cronParts[0]) || 0);
              setTriggerHour(parseInt(cronParts[1]) || 9);
              if (cronParts[4] && cronParts[4] !== '*') {
                setSelectedWeekdays(cronParts[4].split(',').map(Number));
              }
              break;
            case 'MONTHLY':
              setTriggerMinute(parseInt(cronParts[0]) || 0);
              setTriggerHour(parseInt(cronParts[1]) || 9);
              if (cronParts[2] === 'L') {
                setSelectedMonthDay('L');
              } else {
                setSelectedMonthDay(parseInt(cronParts[2]) || 1);
              }
              break;
          }
        }
      }
    }
  }, [visible, trigger]);

  // 执行目标选项
  const targetOptions = useMemo(() => {
    if (targetType === 'BOT_GROUP') {
      return mockBotGroups.map((g) => ({
        value: g.id,
        label: `${g.name} (${g.onlineCount}/${g.totalCount} 在线)`,
      }));
    }
    if (targetType === 'UNGROUPED_BOT') {
      return mockBots
        .filter((b) => !b.groupId)
        .map((b) => ({
          value: b.id,
          label: `${b.name} (${b.status === 'ONLINE' ? '在线' : '离线'})`,
        }));
    }
    return mockBots
      .filter((b) => b.groupId)
      .map((b) => ({
        value: b.id,
        label: `${b.name} (${b.status === 'ONLINE' ? '在线' : '离线'})`,
      }));
  }, [targetType]);

  // 判断是否有参数需要填写
  const hasParameters = selectedProcess && selectedProcess.parameters.length > 0;
  const hasOutputParameters = selectedProcess && selectedProcess.output_parameters && selectedProcess.output_parameters.length > 0;
  const showRightPanel = (hasParameters || hasOutputParameters) && currentStep === 1;

  // 生成 Cron 表达式
  const generatedCronExpression = useMemo(() => {
    if (ruleType !== 'BASIC') return cronExpression;

    switch (frequencyType) {
      case 'MINUTELY':
        return `*/${minuteInterval} * * * *`;
      case 'HOURLY':
        return `${minuteOfHour} */${hourInterval} * * *`;
      case 'DAILY':
        return `${triggerMinute} ${triggerHour} * * *`;
      case 'WEEKLY':
        const weekdayStr = selectedWeekdays.length > 0 ? selectedWeekdays.sort().join(',') : '*';
        return `${triggerMinute} ${triggerHour} * * ${weekdayStr}`;
      case 'MONTHLY':
        const dayStr = selectedMonthDay === 'L' ? 'L' : selectedMonthDay;
        return `${triggerMinute} ${triggerHour} ${dayStr} * *`;
      default:
        return '';
    }
  }, [ruleType, frequencyType, minuteInterval, hourInterval, minuteOfHour, triggerHour, triggerMinute, selectedWeekdays, selectedMonthDay, cronExpression]);

  // 预览触发时间
  const previewTimes = useMemo(() => {
    if (!startDateTime) return [];
    const times: string[] = [];
    const now = new Date(startDateTime);
    
    for (let i = 0; i < 10; i++) {
      const triggerTime = new Date(now);
      if (ruleType === 'BASIC') {
        switch (frequencyType) {
          case 'MINUTELY':
            triggerTime.setMinutes(triggerTime.getMinutes() + i * minuteInterval);
            break;
          case 'HOURLY':
            triggerTime.setHours(triggerTime.getHours() + i * hourInterval);
            break;
          case 'DAILY':
            triggerTime.setDate(triggerTime.getDate() + i);
            triggerTime.setHours(triggerHour, triggerMinute, 0, 0);
            break;
          case 'WEEKLY':
            triggerTime.setDate(triggerTime.getDate() + i * 7);
            triggerTime.setHours(triggerHour, triggerMinute, 0, 0);
            break;
          case 'MONTHLY':
            triggerTime.setMonth(triggerTime.getMonth() + i);
            triggerTime.setHours(triggerHour, triggerMinute, 0, 0);
            break;
        }
      } else {
        triggerTime.setDate(triggerTime.getDate() + i);
      }
      times.push(triggerTime.toLocaleString('zh-CN'));
    }
    return times;
  }, [startDateTime, ruleType, frequencyType, minuteInterval, hourInterval, triggerHour, triggerMinute]);

  // 选择流程
  const handleProcessChange = (processId: string) => {
    setSelectedProcessId(processId);
    const process = mockProcesses.find((p) => p.process_id === processId);
    setSelectedProcess(process || null);
    if (process) {
      const defaults: Record<string, unknown> = {};
      process.parameters.forEach((param) => {
        if (param.default_value !== undefined && param.default_value !== null) {
          defaults[param.name] = param.default_value;
        }
      });
      setParameterValues(defaults);
    }
  };

  // 更新参数值
  const handleParameterChange = (name: string, value: unknown) => {
    setParameterValues((prev) => ({ ...prev, [name]: value }));
  };

  // 渲染参数输入
  const renderParameterInput = (param: LYProcessParameterDefinition) => {
    const value = parameterValues[param.name];

    const renderLabel = () => (
      <div className="edit-time-trigger-modal-param-label">
        <span>{param.name}{param.required ? ' *' : ''}</span>
        <Tag size="small" color="grey" style={{ marginLeft: 8 }}>
          {param.type}
        </Tag>
        {param.description && (
          <Tooltip content={param.description}>
            <IconHelpCircle size="small" style={{ color: 'var(--semi-color-text-2)', marginLeft: 4, cursor: 'help' }} />
          </Tooltip>
        )}
      </div>
    );

    switch (param.type) {
      case 'TEXT':
        return (
          <div className="edit-time-trigger-modal-param-item" key={param.name}>
            <div className="semi-form-field-label">{renderLabel()}</div>
            <Input
              placeholder={`请输入 ${param.name}`}
              value={value as string || ''}
              onChange={(v) => handleParameterChange(param.name, v)}
            />
          </div>
        );
      case 'NUMBER':
        return (
          <div className="edit-time-trigger-modal-param-item" key={param.name}>
            <div className="semi-form-field-label">{renderLabel()}</div>
            <InputNumber
              placeholder={`请输入 ${param.name}`}
              value={value as number}
              onChange={(v) => handleParameterChange(param.name, v)}
              style={{ width: '100%' }}
            />
          </div>
        );
      case 'BOOLEAN':
        return (
          <div className="edit-time-trigger-modal-param-item" key={param.name}>
            <div className="semi-form-field-label">{renderLabel()}</div>
            <Switch
              checked={value as boolean || false}
              onChange={(v) => handleParameterChange(param.name, v)}
            />
          </div>
        );
      case 'CREDENTIAL':
        return (
          <div className="edit-time-trigger-modal-param-item" key={param.name}>
            <div className="semi-form-field-label">{renderLabel()}</div>
            <Select
              placeholder="请选择凭据"
              value={value as string}
              onChange={(v) => handleParameterChange(param.name, v)}
              optionList={mockCredentials.map((c) => ({ value: c.id, label: c.name }))}
              style={{ width: '100%' }}
            />
          </div>
        );
      default:
        return null;
    }
  };

  // 验证步骤
  const validateStep = (step: number): boolean => {
    if (step === 0) {
      if (!triggerName.trim()) {
        Toast.warning(t('timeTrigger.validation.nameRequired'));
        return false;
      }
      if (triggerName.length > 255) {
        Toast.warning(t('timeTrigger.validation.nameLengthError'));
        return false;
      }
      return true;
    }
    
    if (step === 1) {
      if (!selectedProcessId) {
        Toast.warning(t('timeTrigger.validation.processRequired'));
        return false;
      }
      if (!targetType) {
        Toast.warning(t('timeTrigger.validation.targetTypeRequired'));
        return false;
      }
      if (!selectedTargetId) {
        Toast.warning(t('timeTrigger.validation.targetRequired'));
        return false;
      }
      if (selectedProcess) {
        for (const param of selectedProcess.parameters) {
          if (param.required && (parameterValues[param.name] === undefined || parameterValues[param.name] === '')) {
            Toast.warning(t('timeTrigger.validation.parameterRequired', { name: param.name }));
            return false;
          }
        }
      }
      return true;
    }
    
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) return;

    if (ruleType === 'CRON' && !cronExpression.trim()) {
      Toast.warning(t('timeTrigger.validation.cronExpressionRequired'));
      return;
    }
    if (!startDateTime) {
      Toast.warning(t('timeTrigger.validation.startDateTimeRequired'));
      return;
    }
    if (enableWorkCalendar && !workCalendarId) {
      Toast.warning(t('timeTrigger.validation.workCalendarRequired'));
      return;
    }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const finalCronExpression = ruleType === 'CRON' ? cronExpression : generatedCronExpression;
      
      console.log('编辑时间触发器:', {
        trigger_id: trigger?.trigger_id,
        name: triggerName.trim(),
        description: description.trim() || null,
        process_id: selectedProcessId,
        execution_target_type: targetType,
        execution_target_id: selectedTargetId,
        priority,
        max_execution_duration: maxDuration,
        validity_days: validityDays,
        enable_recording: enableRecording,
        task_count_per_trigger: taskCountPerTrigger,
        allow_duplicate_tasks: allowDuplicateTasks,
        input_parameters: parameterValues,
        rule_type: ruleType,
        cron_expression: finalCronExpression,
        basic_frequency_type: ruleType === 'BASIC' ? frequencyType : null,
        time_zone: timeZone,
        start_date_time: startDateTime?.toISOString(),
        end_date_time: endDateTime?.toISOString() || null,
        enable_work_calendar: enableWorkCalendar,
        work_calendar_id: enableWorkCalendar ? workCalendarId : null,
        work_calendar_execution_type: enableWorkCalendar ? workCalendarExecutionType : null,
      });

      Toast.success(t('timeTrigger.editModal.success'));
      onSuccess();
    } catch (error) {
      console.error('编辑时间触发器失败:', error);
      Toast.error(t('timeTrigger.editModal.error'));
    } finally {
      setLoading(false);
    }
  };

  // 渲染步骤1的左侧内容
  const renderStep1LeftContent = () => (
    <>
      <div className="edit-time-trigger-modal-section">
        <div className="edit-time-trigger-modal-section-title">{t('timeTrigger.createModal.processSection')}</div>
        <div className="edit-time-trigger-modal-field">
          <Text className="edit-time-trigger-modal-field-label">{t('timeTrigger.fields.process')} *</Text>
          <Select
            placeholder={t('timeTrigger.fields.processPlaceholder')}
            value={selectedProcessId}
            onChange={(v) => handleProcessChange(v as string)}
            optionList={mockProcesses.map((p) => ({ value: p.process_id, label: p.process_name }))}
            filter
            className="edit-time-trigger-modal-select-full"
          />
        </div>
      </div>

      <div className="edit-time-trigger-modal-section">
        <div className="edit-time-trigger-modal-section-title">{t('timeTrigger.createModal.targetSection')}</div>
        <div className="edit-time-trigger-modal-field">
          <Text className="edit-time-trigger-modal-field-label">{t('timeTrigger.fields.targetType')} *</Text>
          <RadioGroup
            value={targetType}
            onChange={(e) => {
              setTargetType(e.target.value as ExecutionTargetType);
              setSelectedTargetId(null);
            }}
            direction="horizontal"
          >
            <Radio value="BOT_GROUP">{t('timeTrigger.targetType.botGroup')}</Radio>
            <Radio value="BOT_IN_GROUP">{t('timeTrigger.targetType.botInGroup')}</Radio>
            <Radio value="UNGROUPED_BOT">{t('timeTrigger.targetType.ungroupedBot')}</Radio>
          </RadioGroup>
        </div>
        {targetType && (
          <div className="edit-time-trigger-modal-field">
            <Text className="edit-time-trigger-modal-field-label">{t('timeTrigger.createModal.selectTarget')} *</Text>
            <Select
              placeholder={t('timeTrigger.fields.targetPlaceholder')}
              value={selectedTargetId}
              onChange={(v) => setSelectedTargetId(v as string)}
              optionList={targetOptions}
              className="edit-time-trigger-modal-select-full"
            />
          </div>
        )}
      </div>

      <div className="edit-time-trigger-modal-section">
        <div className="edit-time-trigger-modal-section-title">{t('timeTrigger.createModal.executionSection')}</div>
        <div className="edit-time-trigger-modal-field">
          <Text className="edit-time-trigger-modal-field-label">{t('timeTrigger.fields.priority')}</Text>
          <RadioGroup
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            direction="horizontal"
          >
            <Radio value="LOW">低</Radio>
            <Radio value="MEDIUM">中</Radio>
            <Radio value="HIGH">高</Radio>
          </RadioGroup>
        </div>
        <div className="edit-time-trigger-modal-field">
          <Text className="edit-time-trigger-modal-field-label">{t('timeTrigger.fields.maxDuration')}</Text>
          <InputNumber
            value={maxDuration}
            onChange={(v) => setMaxDuration(v as number)}
            min={60}
            max={86400}
            suffix={t('timeTrigger.fields.maxDurationUnit')}
            style={{ width: '100%' }}
          />
          <div className="edit-time-trigger-modal-field-hint">{t('timeTrigger.fields.maxDurationHint')}</div>
        </div>
        <div className="edit-time-trigger-modal-field">
          <Text className="edit-time-trigger-modal-field-label">{t('timeTrigger.fields.validityDays')}</Text>
          <InputNumber
            value={validityDays}
            onChange={(v) => setValidityDays(v as number)}
            min={1}
            max={30}
            suffix={t('timeTrigger.fields.validityDaysUnit')}
            style={{ width: '100%' }}
          />
          <div className="edit-time-trigger-modal-field-hint">{t('timeTrigger.fields.validityDaysHint')}</div>
        </div>
        <div className="edit-time-trigger-modal-field">
          <Text className="edit-time-trigger-modal-field-label">{t('timeTrigger.fields.enableRecording')}</Text>
          <Switch checked={enableRecording} onChange={setEnableRecording} />
        </div>
      </div>
    </>
  );

  // 渲染步骤1的右侧内容（参数配置）
  const renderStep1RightContent = () => (
    <>
      {hasParameters && (
        <div className="edit-time-trigger-modal-section">
          <div className="edit-time-trigger-modal-section-title">{t('timeTrigger.createModal.parameterSection')}</div>
          <div className="edit-time-trigger-modal-params">
            {selectedProcess?.parameters.map((param) => renderParameterInput(param))}
          </div>
        </div>
      )}

      {hasOutputParameters && (
        <div className="edit-time-trigger-modal-section">
          <div className="edit-time-trigger-modal-section-title">输出参数</div>
          <div className="edit-time-trigger-modal-output-params">
            {selectedProcess?.output_parameters?.map((param) => (
              <div className="edit-time-trigger-modal-output-param-item" key={param.name}>
                <div className="edit-time-trigger-modal-output-param-name">
                  <span>{param.name}</span>
                  <Tag size="small" color="grey" style={{ marginLeft: 8 }}>
                    {param.type}
                  </Tag>
                </div>
                {param.description && (
                  <div className="edit-time-trigger-modal-output-param-desc">{param.description}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasParameters && !hasOutputParameters && (
        <div className="edit-time-trigger-modal-no-params">
          <IconInbox size="extra-large" style={{ color: 'var(--semi-color-text-2)', marginBottom: 8 }} />
          <div>该流程没有配置参数</div>
        </div>
      )}
    </>
  );

  // 渲染步骤内容
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <>
            <div className="edit-time-trigger-modal-section">
              <div className="edit-time-trigger-modal-section-title">{t('timeTrigger.createModal.basicSection')}</div>
              <div className="edit-time-trigger-modal-field">
                <Text className="edit-time-trigger-modal-field-label">{t('timeTrigger.fields.name')} *</Text>
                <Input
                  placeholder={t('timeTrigger.fields.namePlaceholder')}
                  value={triggerName}
                  onChange={setTriggerName}
                  maxLength={255}
                  showClear
                />
              </div>
              <div className="edit-time-trigger-modal-field">
                <Text className="edit-time-trigger-modal-field-label">{t('timeTrigger.fields.description')}</Text>
                <TextArea
                  placeholder={t('timeTrigger.fields.descriptionPlaceholder')}
                  value={description}
                  onChange={setDescription}
                  maxCount={2000}
                  showClear
                  rows={3}
                />
              </div>
            </div>
          </>
        );

      case 1:
        return null;

      case 2:
        return (
          <>
            {/* 时间规则 - 使用 TriggerRuleConfig 组件 */}
            <div className="edit-time-trigger-modal-section">
              <div className="edit-time-trigger-modal-section-title">{t('timeTrigger.createModal.ruleSection')}</div>
              <TriggerRuleConfig
                ruleType={ruleType}
                onRuleTypeChange={setRuleType}
                frequencyType={frequencyType}
                onFrequencyTypeChange={setFrequencyType}
                minuteInterval={minuteInterval}
                onMinuteIntervalChange={setMinuteInterval}
                hourInterval={hourInterval}
                onHourIntervalChange={setHourInterval}
                minuteOfHour={minuteOfHour}
                onMinuteOfHourChange={setMinuteOfHour}
                triggerHour={triggerHour}
                onTriggerHourChange={setTriggerHour}
                triggerMinute={triggerMinute}
                onTriggerMinuteChange={setTriggerMinute}
                selectedWeekdays={selectedWeekdays}
                onSelectedWeekdaysChange={setSelectedWeekdays}
                selectedMonthDay={selectedMonthDay}
                onSelectedMonthDayChange={setSelectedMonthDay}
                cronExpression={cronExpression}
                onCronExpressionChange={setCronExpression}
                timeZone={timeZone}
                onTimeZoneChange={setTimeZone}
                startDateTime={startDateTime}
                onStartDateTimeChange={setStartDateTime}
                endDateTime={endDateTime}
                onEndDateTimeChange={setEndDateTime}
                endTimeType={endTimeType}
                onEndTimeTypeChange={setEndTimeType}
                classPrefix="edit-time-trigger-modal-rule"
              />
            </div>

            {/* 工作日历 */}
            <div className="edit-time-trigger-modal-section">
              <div className="edit-time-trigger-modal-section-title">{t('timeTrigger.createModal.calendarSection')}</div>
              <div className="edit-time-trigger-modal-field">
                <Text className="edit-time-trigger-modal-field-label">{t('timeTrigger.fields.enableWorkCalendar')}</Text>
                <Switch checked={enableWorkCalendar} onChange={setEnableWorkCalendar} />
              </div>
              {enableWorkCalendar && (
                <>
                  <div className="edit-time-trigger-modal-field">
                    <Text className="edit-time-trigger-modal-field-label">{t('timeTrigger.fields.workCalendar')} *</Text>
                    <Select
                      placeholder={t('timeTrigger.fields.workCalendarPlaceholder')}
                      value={workCalendarId}
                      onChange={(v) => setWorkCalendarId(v as string)}
                      optionList={mockWorkCalendars.map((c) => ({ value: c.id, label: c.name }))}
                      className="edit-time-trigger-modal-select-full"
                    />
                  </div>
                  <div className="edit-time-trigger-modal-field">
                    <Text className="edit-time-trigger-modal-field-label">{t('timeTrigger.fields.executionType')}</Text>
                    <RadioGroup
                      value={workCalendarExecutionType}
                      onChange={(e) => setWorkCalendarExecutionType(e.target.value as 'WORKDAY' | 'NON_WORKDAY')}
                      direction="horizontal"
                    >
                      <Radio value="WORKDAY">{t('timeTrigger.fields.executionTypeWorkday')}</Radio>
                      <Radio value="NON_WORKDAY">{t('timeTrigger.fields.executionTypeNonWorkday')}</Radio>
                    </RadioGroup>
                  </div>
                </>
              )}
            </div>

            {/* 触发预览 */}
            <div className="edit-time-trigger-modal-section">
              <div className="edit-time-trigger-modal-section-title">{t('timeTrigger.createModal.previewSection')}</div>
              <div className="edit-time-trigger-modal-preview">
                <div className="edit-time-trigger-modal-preview-title">
                  {t('timeTrigger.createModal.previewTitle')}
                </div>
                {previewTimes.length > 0 ? (
                  <ul className="edit-time-trigger-modal-preview-list">
                    {previewTimes.map((time, index) => (
                      <li key={index}>
                        <span className="preview-index">{index + 1}.</span>
                        {time}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="edit-time-trigger-modal-preview-empty">
                    {t('timeTrigger.createModal.noPreview')}
                  </div>
                )}
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  const modalWidth = showRightPanel ? 900 : 520;

  return (
    <Modal
      className="edit-time-trigger-modal"
      title={t('timeTrigger.editModal.title')}
      visible={visible}
      onCancel={onCancel}
      footer={null}
      closeOnEsc
      maskClosable={false}
      width={modalWidth}
      centered
    >
      <div className="edit-time-trigger-modal-form">
        <div className="edit-time-trigger-modal-steps">
          <Steps current={currentStep} type="basic" size="small">
            <Steps.Step title={t('timeTrigger.createModal.steps.basicInfo')} />
            <Steps.Step title={t('timeTrigger.createModal.steps.taskConfig')} />
            <Steps.Step title={t('timeTrigger.createModal.steps.triggerRule')} />
          </Steps>
        </div>

        {currentStep === 1 ? (
          <div className="edit-time-trigger-modal-body">
            <div className="edit-time-trigger-modal-left">
              <div className="edit-time-trigger-modal-content">
                {renderStep1LeftContent()}
              </div>
            </div>
            {showRightPanel && (
              <div className="edit-time-trigger-modal-right">
                <div className="edit-time-trigger-modal-content">
                  {renderStep1RightContent()}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="edit-time-trigger-modal-content">
            {renderStepContent()}
          </div>
        )}

        <div className="edit-time-trigger-modal-footer">
          <Button theme="light" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          {currentStep > 0 && (
            <Button onClick={handlePrev}>
              {t('timeTrigger.createModal.prevStep')}
            </Button>
          )}
          {currentStep < 2 ? (
            <Button theme="solid" type="primary" onClick={handleNext}>
              {t('timeTrigger.createModal.nextStep')}
            </Button>
          ) : (
            <Button theme="solid" type="primary" onClick={handleSubmit} loading={loading}>
              {t('common.save')}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default EditTimeTriggerModal;
