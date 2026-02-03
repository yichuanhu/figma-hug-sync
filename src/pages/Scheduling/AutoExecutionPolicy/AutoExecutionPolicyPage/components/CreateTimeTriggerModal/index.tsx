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
  LYProcessActiveVersionResponse,
  LYProcessParameterDefinition,
  ExecutionTargetType,
  TaskPriority,
  TriggerRuleType,
  BasicFrequencyType,
} from '@/api';
import './index.less';

const { Text } = Typography;

interface CreateTimeTriggerModalProps {
  visible: boolean;
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

// 已存在的触发器名称 (模拟)
const existingTriggerNames = ['每日订单同步', '每周报表生成'];

// Mock 凭据
const mockCredentials = [
  { id: 'cred-001', name: '系统管理员凭据' },
  { id: 'cred-002', name: 'API访问凭据' },
];

const CreateTimeTriggerModal = ({ visible, onCancel, onSuccess }: CreateTimeTriggerModalProps) => {
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
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([1]); // 默认周一
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

  // 重置表单
  useEffect(() => {
    if (!visible) {
      setCurrentStep(0);
      setTriggerName('');
      setDescription('');
      setSelectedProcessId(null);
      setSelectedProcess(null);
      setTargetType(null);
      setSelectedTargetId(null);
      setPriority('MEDIUM');
      setMaxDuration(3600);
      setValidityDays(7);
      setEnableRecording(false);
      setTaskCountPerTrigger(1);
      setAllowDuplicateTasks(true);
      setParameterValues({});
      setRuleType('BASIC');
      setFrequencyType('DAILY');
      setMinuteInterval(5);
      setHourInterval(2);
      setMinuteOfHour(0);
      setTriggerHour(9);
      setTriggerMinute(0);
      setSelectedWeekdays([1]);
      setSelectedMonthDay(1);
      setCronExpression('');
      setTimeZone('Asia/Shanghai');
      setStartDateTime(new Date());
      setEndDateTime(null);
      setEndTimeType('never');
      setEnableWorkCalendar(false);
      setWorkCalendarId(null);
      setWorkCalendarExecutionType('WORKDAY');
    }
  }, [visible]);

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
      <div className="create-time-trigger-modal-param-label">
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
          <div className="create-time-trigger-modal-param-item" key={param.name}>
            <div className="semi-form-field-label">
              {renderLabel()}
            </div>
            <Input
              placeholder={`请输入 ${param.name}`}
              value={value as string || ''}
              onChange={(v) => handleParameterChange(param.name, v)}
            />
          </div>
        );
      case 'NUMBER':
        return (
          <div className="create-time-trigger-modal-param-item" key={param.name}>
            <div className="semi-form-field-label">
              {renderLabel()}
            </div>
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
          <div className="create-time-trigger-modal-param-item" key={param.name}>
            <div className="semi-form-field-label">
              {renderLabel()}
            </div>
            <Switch
              checked={value as boolean || false}
              onChange={(v) => handleParameterChange(param.name, v)}
            />
          </div>
        );
      case 'CREDENTIAL':
        return (
          <div className="create-time-trigger-modal-param-item" key={param.name}>
            <div className="semi-form-field-label">
              {renderLabel()}
            </div>
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
      if (existingTriggerNames.includes(triggerName.trim())) {
        Toast.warning(t('timeTrigger.validation.nameExists'));
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
      // 验证必填参数
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

  // 下一步
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  // 上一步
  const handlePrev = () => {
    setCurrentStep((prev) => prev - 1);
  };

  // 提交
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
      
      console.log('创建时间触发器:', {
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

      Toast.success(t('timeTrigger.createModal.success'));
      onSuccess();
    } catch (error) {
      console.error('创建时间触发器失败:', error);
      Toast.error(t('timeTrigger.createModal.error'));
    } finally {
      setLoading(false);
    }
  };

  // 渲染步骤1的左侧内容
  const renderStep1LeftContent = () => (
    <>
      {/* 流程配置 */}
      <div className="create-time-trigger-modal-section">
        <div className="create-time-trigger-modal-section-title">{t('timeTrigger.createModal.processSection')}</div>
        <div className="create-time-trigger-modal-field">
          <Text className="create-time-trigger-modal-field-label">{t('timeTrigger.fields.process')} *</Text>
          <Select
            placeholder={t('timeTrigger.fields.processPlaceholder')}
            value={selectedProcessId}
            onChange={(v) => handleProcessChange(v as string)}
            optionList={mockProcesses.map((p) => ({ value: p.process_id, label: p.process_name }))}
            filter
            className="create-time-trigger-modal-select-full"
          />
        </div>
      </div>

      {/* 执行目标 */}
      <div className="create-time-trigger-modal-section">
        <div className="create-time-trigger-modal-section-title">{t('timeTrigger.createModal.targetSection')}</div>
        <div className="create-time-trigger-modal-field">
          <Text className="create-time-trigger-modal-field-label">{t('timeTrigger.fields.targetType')} *</Text>
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
          <div className="create-time-trigger-modal-field">
            <Text className="create-time-trigger-modal-field-label">{t('timeTrigger.createModal.selectTarget')} *</Text>
            <Select
              placeholder={t('timeTrigger.fields.targetPlaceholder')}
              value={selectedTargetId}
              onChange={(v) => setSelectedTargetId(v as string)}
              optionList={targetOptions}
              className="create-time-trigger-modal-select-full"
            />
          </div>
        )}
      </div>

      {/* 执行设置 */}
      <div className="create-time-trigger-modal-section">
        <div className="create-time-trigger-modal-section-title">{t('timeTrigger.createModal.executionSection')}</div>
        <div className="create-time-trigger-modal-field">
          <Text className="create-time-trigger-modal-field-label">{t('timeTrigger.fields.priority')}</Text>
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
        <div className="create-time-trigger-modal-field">
          <Text className="create-time-trigger-modal-field-label">{t('timeTrigger.fields.maxDuration')}</Text>
          <InputNumber
            value={maxDuration}
            onChange={(v) => setMaxDuration(v as number)}
            min={60}
            max={86400}
            suffix={t('timeTrigger.fields.maxDurationUnit')}
            style={{ width: '100%' }}
          />
          <div className="create-time-trigger-modal-field-hint">{t('timeTrigger.fields.maxDurationHint')}</div>
        </div>
        <div className="create-time-trigger-modal-field">
          <Text className="create-time-trigger-modal-field-label">{t('timeTrigger.fields.validityDays')}</Text>
          <InputNumber
            value={validityDays}
            onChange={(v) => setValidityDays(v as number)}
            min={1}
            max={30}
            suffix={t('timeTrigger.fields.validityDaysUnit')}
            style={{ width: '100%' }}
          />
          <div className="create-time-trigger-modal-field-hint">{t('timeTrigger.fields.validityDaysHint')}</div>
        </div>
        <div className="create-time-trigger-modal-field">
          <Text className="create-time-trigger-modal-field-label">{t('timeTrigger.fields.enableRecording')}</Text>
          <Switch checked={enableRecording} onChange={setEnableRecording} />
        </div>
      </div>
    </>
  );

  // 渲染步骤1的右侧内容（参数配置）
  const renderStep1RightContent = () => (
    <>
      {/* 输入参数 */}
      {hasParameters && (
        <div className="create-time-trigger-modal-section">
          <div className="create-time-trigger-modal-section-title">{t('timeTrigger.createModal.parameterSection')}</div>
          <div className="create-time-trigger-modal-params">
            {selectedProcess?.parameters.map((param) => renderParameterInput(param))}
          </div>
        </div>
      )}

      {/* 输出参数展示 */}
      {hasOutputParameters && (
        <div className="create-time-trigger-modal-section">
          <div className="create-time-trigger-modal-section-title">输出参数</div>
          <div className="create-time-trigger-modal-output-params">
            {selectedProcess?.output_parameters?.map((param) => (
              <div className="create-time-trigger-modal-output-param-item" key={param.name}>
                <div className="create-time-trigger-modal-output-param-name">
                  <span>{param.name}</span>
                  <Tag size="small" color="grey" style={{ marginLeft: 8 }}>
                    {param.type}
                  </Tag>
                </div>
                {param.description && (
                  <div className="create-time-trigger-modal-output-param-desc">{param.description}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 如果没有任何参数 */}
      {!hasParameters && !hasOutputParameters && (
        <div className="create-time-trigger-modal-no-params">
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
            <div className="create-time-trigger-modal-section">
              <div className="create-time-trigger-modal-section-title">{t('timeTrigger.createModal.basicSection')}</div>
              <div className="create-time-trigger-modal-field">
                <Text className="create-time-trigger-modal-field-label">{t('timeTrigger.fields.name')} *</Text>
                <Input
                  placeholder={t('timeTrigger.fields.namePlaceholder')}
                  value={triggerName}
                  onChange={setTriggerName}
                  maxLength={255}
                  showClear
                />
              </div>
              <div className="create-time-trigger-modal-field">
                <Text className="create-time-trigger-modal-field-label">{t('timeTrigger.fields.description')}</Text>
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
        // 步骤1使用双栏布局（当有参数时）
        return null; // 由 body 层渲染

      case 2:
        return (
          <>
            {/* 时间规则 - 使用 TriggerRuleConfig 组件 */}
            <div className="create-time-trigger-modal-section">
              <div className="create-time-trigger-modal-section-title">{t('timeTrigger.createModal.ruleSection')}</div>
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
                classPrefix="create-time-trigger-modal-rule"
              />
            </div>

            {/* 工作日历 */}
            <div className="create-time-trigger-modal-section">
              <div className="create-time-trigger-modal-section-title">{t('timeTrigger.createModal.calendarSection')}</div>
              <div className="create-time-trigger-modal-field">
                <Text className="create-time-trigger-modal-field-label">{t('timeTrigger.fields.enableWorkCalendar')}</Text>
                <Switch checked={enableWorkCalendar} onChange={setEnableWorkCalendar} />
              </div>
              {enableWorkCalendar && (
                <>
                  <div className="create-time-trigger-modal-field">
                    <Text className="create-time-trigger-modal-field-label">{t('timeTrigger.fields.workCalendar')} *</Text>
                    <Select
                      placeholder={t('timeTrigger.fields.workCalendarPlaceholder')}
                      value={workCalendarId}
                      onChange={(v) => setWorkCalendarId(v as string)}
                      optionList={mockWorkCalendars.map((c) => ({ value: c.id, label: c.name }))}
                      className="create-time-trigger-modal-select-full"
                    />
                  </div>
                  <div className="create-time-trigger-modal-field">
                    <Text className="create-time-trigger-modal-field-label">{t('timeTrigger.fields.executionType')}</Text>
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
            <div className="create-time-trigger-modal-section">
              <div className="create-time-trigger-modal-section-title">{t('timeTrigger.createModal.previewSection')}</div>
              <div className="create-time-trigger-modal-preview">
                <div className="create-time-trigger-modal-preview-title">
                  {t('timeTrigger.createModal.previewTitle')}
                </div>
                {previewTimes.length > 0 ? (
                  <ul className="create-time-trigger-modal-preview-list">
                    {previewTimes.map((time, index) => (
                      <li key={index}>
                        <span className="preview-index">{index + 1}.</span>
                        {time}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="create-time-trigger-modal-preview-empty">
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

  // 计算弹窗宽度
  const modalWidth = showRightPanel ? 900 : 520;

  return (
    <Modal
      className="create-time-trigger-modal"
      title={t('timeTrigger.createModal.title')}
      visible={visible}
      onCancel={onCancel}
      footer={null}
      closeOnEsc
      maskClosable={false}
      width={modalWidth}
      centered
    >
      <div className="create-time-trigger-modal-form">
        {/* 步骤条 - 使用迷你尺寸 */}
        <div className="create-time-trigger-modal-steps">
          <Steps current={currentStep} type="basic" size="small">
            <Steps.Step title={t('timeTrigger.createModal.steps.basicInfo')} />
            <Steps.Step title={t('timeTrigger.createModal.steps.taskConfig')} />
            <Steps.Step title={t('timeTrigger.createModal.steps.triggerRule')} />
          </Steps>
        </div>

        {/* 内容区域 */}
        {currentStep === 1 ? (
          <div className="create-time-trigger-modal-body">
            <div className="create-time-trigger-modal-left">
              <div className="create-time-trigger-modal-content">
                {renderStep1LeftContent()}
              </div>
            </div>
            {showRightPanel && (
              <div className="create-time-trigger-modal-right">
                <div className="create-time-trigger-modal-content">
                  {renderStep1RightContent()}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="create-time-trigger-modal-content">
            {renderStepContent()}
          </div>
        )}

        {/* 底部按钮 - 三个按钮放一起 */}
        <div className="create-time-trigger-modal-footer">
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
              {t('common.create')}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default CreateTimeTriggerModal;
