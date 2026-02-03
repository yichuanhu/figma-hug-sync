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
  DatePicker,
  TextArea,
} from '@douyinfe/semi-ui';
import { IconHelpCircle, IconInbox } from '@douyinfe/semi-icons';
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

// Mock 时区
const timeZones = [
  { value: 'Asia/Shanghai', label: 'Asia/Shanghai (UTC+8)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (UTC+9)' },
  { value: 'America/New_York', label: 'America/New_York (UTC-5)' },
  { value: 'Europe/London', label: 'Europe/London (UTC+0)' },
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
  const [frequencyValue, setFrequencyValue] = useState<number>(1);
  const [cronExpression, setCronExpression] = useState('');
  const [timeZone, setTimeZone] = useState('Asia/Shanghai');
  const [startDateTime, setStartDateTime] = useState<Date | null>(new Date());
  const [endDateTime, setEndDateTime] = useState<Date | null>(null);
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
      setFrequencyValue(trigger.basic_frequency_value || 1);
      setCronExpression(trigger.cron_expression || '');
      setTimeZone(trigger.time_zone);
      setStartDateTime(trigger.start_date_time ? new Date(trigger.start_date_time) : new Date());
      setEndDateTime(trigger.end_date_time ? new Date(trigger.end_date_time) : null);
      setEnableWorkCalendar(trigger.enable_work_calendar);
      setWorkCalendarId(trigger.work_calendar_id);
      setWorkCalendarExecutionType(trigger.work_calendar_execution_type || 'WORKDAY');
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
            triggerTime.setMinutes(triggerTime.getMinutes() + i * (frequencyValue || 1));
            break;
          case 'HOURLY':
            triggerTime.setHours(triggerTime.getHours() + i * (frequencyValue || 1));
            break;
          case 'DAILY':
            triggerTime.setDate(triggerTime.getDate() + i);
            break;
          case 'WEEKLY':
            triggerTime.setDate(triggerTime.getDate() + i * 7);
            break;
          case 'MONTHLY':
            triggerTime.setMonth(triggerTime.getMonth() + i);
            break;
        }
      } else {
        triggerTime.setDate(triggerTime.getDate() + i);
      }
      times.push(triggerTime.toLocaleString('zh-CN'));
    }
    return times;
  }, [startDateTime, ruleType, frequencyType, frequencyValue]);

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
        cron_expression: ruleType === 'CRON' ? cronExpression : null,
        basic_frequency_type: ruleType === 'BASIC' ? frequencyType : null,
        basic_frequency_value: ruleType === 'BASIC' ? frequencyValue : null,
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
            <Radio value="HIGH">{t('task.priority.high')}</Radio>
            <Radio value="MEDIUM">{t('task.priority.medium')}</Radio>
            <Radio value="LOW">{t('task.priority.low')}</Radio>
          </RadioGroup>
        </div>
        <div className="edit-time-trigger-modal-field">
          <Text className="edit-time-trigger-modal-field-label">{t('timeTrigger.fields.maxDuration')} *</Text>
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
          <Text className="edit-time-trigger-modal-field-label">{t('timeTrigger.fields.taskCountPerTrigger')}</Text>
          <InputNumber
            value={taskCountPerTrigger}
            onChange={(v) => setTaskCountPerTrigger(v as number)}
            min={1}
            max={100}
            style={{ width: '100%' }}
          />
        </div>
        <div className="edit-time-trigger-modal-field">
          <Text className="edit-time-trigger-modal-field-label">{t('timeTrigger.fields.enableRecording')}</Text>
          <Switch checked={enableRecording} onChange={setEnableRecording} />
        </div>
        <div className="edit-time-trigger-modal-field">
          <Text className="edit-time-trigger-modal-field-label">{t('timeTrigger.fields.allowDuplicateTasks')}</Text>
          <Switch checked={allowDuplicateTasks} onChange={setAllowDuplicateTasks} />
          <div className="edit-time-trigger-modal-field-hint">{t('timeTrigger.fields.allowDuplicateTasksHint')}</div>
        </div>
      </div>
    </>
  );

  const renderStep1RightContent = () => (
    <>
      {hasParameters && (
        <div className="edit-time-trigger-modal-section">
          <div className="edit-time-trigger-modal-section-title">
            {t('timeTrigger.createModal.parameterSection')}
          </div>
          <div className="edit-time-trigger-modal-params">
            {selectedProcess?.parameters.map(renderParameterInput)}
          </div>
        </div>
      )}

      {hasOutputParameters && (
        <div className="edit-time-trigger-modal-section">
          <div className="edit-time-trigger-modal-section-title">
            {t('timeTrigger.createModal.outputParameterSection')}
          </div>
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
                  <div className="edit-time-trigger-modal-output-param-desc">
                    {param.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasParameters && !hasOutputParameters && (
        <div className="edit-time-trigger-modal-no-params">
          <IconInbox style={{ fontSize: 32, marginBottom: 8 }} />
          <div>{t('timeTrigger.createModal.noParameters')}</div>
        </div>
      )}
    </>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
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
                maxLength={2000}
                showClear
                rows={3}
              />
              <div className="edit-time-trigger-modal-field-hint">
                {description.length}/2000
              </div>
            </div>
          </div>
        );

      case 1:
        return null;

      case 2:
        return (
          <>
            <div className="edit-time-trigger-modal-section">
              <div className="edit-time-trigger-modal-section-title">{t('timeTrigger.createModal.ruleSection')}</div>
              <div className="edit-time-trigger-modal-field">
                <Text className="edit-time-trigger-modal-field-label">{t('timeTrigger.fields.ruleType')} *</Text>
                <RadioGroup
                  value={ruleType}
                  onChange={(e) => setRuleType(e.target.value as TriggerRuleType)}
                  direction="horizontal"
                >
                  <Radio value="BASIC">{t('timeTrigger.ruleType.basic')}</Radio>
                  <Radio value="CRON">{t('timeTrigger.ruleType.cron')}</Radio>
                </RadioGroup>
              </div>

              {ruleType === 'BASIC' ? (
                <>
                  <div className="edit-time-trigger-modal-field">
                    <Text className="edit-time-trigger-modal-field-label">{t('timeTrigger.fields.frequencyType')} *</Text>
                    <Select
                      value={frequencyType}
                      onChange={(v) => setFrequencyType(v as BasicFrequencyType)}
                      optionList={[
                        { value: 'MINUTELY', label: t('timeTrigger.frequency.minutely') },
                        { value: 'HOURLY', label: t('timeTrigger.frequency.hourly') },
                        { value: 'DAILY', label: t('timeTrigger.frequency.daily') },
                        { value: 'WEEKLY', label: t('timeTrigger.frequency.weekly') },
                        { value: 'MONTHLY', label: t('timeTrigger.frequency.monthly') },
                      ]}
                      className="edit-time-trigger-modal-select-full"
                    />
                  </div>
                  {(frequencyType === 'MINUTELY' || frequencyType === 'HOURLY') && (
                    <div className="edit-time-trigger-modal-field">
                      <Text className="edit-time-trigger-modal-field-label">{t('timeTrigger.fields.frequencyValue')}</Text>
                      <InputNumber
                        value={frequencyValue}
                        onChange={(v) => setFrequencyValue(v as number)}
                        min={1}
                        max={frequencyType === 'MINUTELY' ? 59 : 23}
                        style={{ width: '100%' }}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="edit-time-trigger-modal-field">
                  <Text className="edit-time-trigger-modal-field-label">{t('timeTrigger.fields.cronExpression')} *</Text>
                  <Input
                    placeholder={t('timeTrigger.fields.cronExpressionPlaceholder')}
                    value={cronExpression}
                    onChange={setCronExpression}
                  />
                  <div className="edit-time-trigger-modal-field-hint">{t('timeTrigger.fields.cronExpressionHint')}</div>
                </div>
              )}

              <div className="edit-time-trigger-modal-field">
                <Text className="edit-time-trigger-modal-field-label">{t('timeTrigger.fields.timeZone')} *</Text>
                <Select
                  value={timeZone}
                  onChange={(v) => setTimeZone(v as string)}
                  optionList={timeZones}
                  className="edit-time-trigger-modal-select-full"
                />
              </div>

              <div className="edit-time-trigger-modal-field">
                <Text className="edit-time-trigger-modal-field-label">{t('timeTrigger.fields.startDateTime')} *</Text>
                <DatePicker
                  type="dateTime"
                  value={startDateTime}
                  onChange={(v) => setStartDateTime(v as Date)}
                  style={{ width: '100%' }}
                />
              </div>
              <div className="edit-time-trigger-modal-field">
                <Text className="edit-time-trigger-modal-field-label">{t('timeTrigger.fields.endDateTime')}</Text>
                <DatePicker
                  type="dateTime"
                  value={endDateTime}
                  onChange={(v) => setEndDateTime(v as Date | null)}
                  placeholder={t('timeTrigger.createModal.endTimeNever')}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

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
