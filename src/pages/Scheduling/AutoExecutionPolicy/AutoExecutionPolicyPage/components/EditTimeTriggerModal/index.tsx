import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Form,
  Button,
  Toast,
  Typography,
  Popover,
  Tag,
  Steps,
} from '@douyinfe/semi-ui';
import TriggerRuleConfig from '@/components/TriggerRuleConfig';
import BotTargetSelector from '@/components/BotTargetSelector';
import { getWorkCalendarOptions } from '@/mocks/workCalendar';
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
import DepartmentSelect from '@/components/DepartmentSelect';
import OwnerSelect from '@/components/OwnerSelect';
import { MOCK_CURRENT_USER } from '@/mocks/departmentData';
import { HelpCircle, Inbox } from 'lucide-react';

const { Text } = Typography;

interface EditTimeTriggerModalProps {
  visible: boolean;
  trigger: LYTimeTriggerResponse | null;
  onCancel: () => void;
  onSuccess: () => void;
}

// Mock ExecuteTemplate
const mockTemplates = [
  {
    template_id: 'tpl-001',
    template_name: 'Order Processing Default Template',
    description: 'Process orders with default config',
    process_id: 'proc-001',
    process_name: 'Auto Order Processing',
    execution_target_type: 'BOT_GROUP' as ExecutionTargetType,
    execution_target_id: 'group-001',
    execution_target_name: 'Order Processing Group',
    priority: 'MEDIUM' as TaskPriority,
    max_execution_duration: 3600,
    validity_days: 7,
    enable_recording: true,
    input_parameters: { targetUrl: 'https://orders.example.com', maxCount: 50, enableRetry: true },
  },
  {
    template_id: 'tpl-002',
    template_name: 'Finance Approval Quick Template',
    description: 'Expense Reimbursement Approvalquick execution config',
    process_id: 'proc-002',
    process_name: 'Expense Reimbursement Approval',
    execution_target_type: 'BOT_GROUP' as ExecutionTargetType,
    execution_target_id: 'group-002',
    execution_target_name: 'Finance Approval Group',
    priority: 'HIGH' as TaskPriority,
    max_execution_duration: 1800,
    validity_days: 3,
    enable_recording: false,
    input_parameters: { department: 'Finance Dept' },
  },
];

// Mock ProcessList
const mockProcesses: (LYProcessActiveVersionResponse & { owning_department_name?: string; owner_name?: string })[] = [
  {
    process_id: 'proc-001',
    process_name: 'Auto Order Processing',
    version_id: 'ver-001',
    version: 'v1.2.0',
    owning_department_name: '技术研发部',
    owner_name: '张三',
    parameters: [
      { name: 'targetUrl', type: 'TEXT', required: true, description: 'Target URL address' },
      { name: 'maxCount', type: 'NUMBER', required: false, default_value: 100, description: 'Maximum processing count' },
      { name: 'enableRetry', type: 'BOOLEAN', required: false, default_value: true, description: 'Enable retry' },
    ],
    output_parameters: [
      { name: 'processedCount', type: 'NUMBER', description: 'Processed order count' },
      { name: 'successRate', type: 'NUMBER', description: 'Processing success rate' },
    ],
  },
  {
    process_id: 'proc-002',
    process_name: 'Expense Reimbursement Approval',
    version_id: 'ver-002',
    version: 'v2.0.0',
    owning_department_name: '财务部',
    owner_name: '李四',
    parameters: [
      { name: 'department', type: 'TEXT', required: true, description: 'Department name' },
    ],
    output_parameters: [
      { name: 'approvalResult', type: 'BOOLEAN', description: 'Approval result' },
    ],
  },
  {
    process_id: 'proc-003',
    process_name: 'Employee Onboarding Flow',
    version_id: 'ver-003',
    version: 'v1.0.0',
    owning_department_name: '人力资源部',
    owner_name: '王五',
    parameters: [],
    output_parameters: [],
  },
  {
    process_id: 'proc-004',
    process_name: 'Data Collection Flow',
    version_id: 'ver-004',
    version: 'v1.5.0',
    owning_department_name: '数据中心',
    owner_name: '赵六',
    parameters: [
      { name: 'sourceUrl', type: 'TEXT', required: true, description: 'Data source URL' },
      { name: 'pageLimit', type: 'NUMBER', required: false, default_value: 10, description: 'Page limit for collection' },
    ],
    output_parameters: [
      { name: 'collectedCount', type: 'NUMBER', description: 'Collected data count' },
    ],
  },
];

// Mock Execution target
const mockBotGroups = [
  { id: 'group-001', name: 'Order Processing Group', onlineCount: 3, totalCount: 5 },
  { id: 'group-002', name: 'Finance Approval Group', onlineCount: 2, totalCount: 3 },
];

const mockBots = [
  { id: 'bot-001', name: 'RPA-BOT-001', groupId: 'group-001', status: 'ONLINE' },
  { id: 'bot-002', name: 'RPA-BOT-002', groupId: null, status: 'ONLINE' },
];

// Mock Credential
const mockCredentials = [
  { id: 'cred-001', name: 'System Admin Credentials' },
  { id: 'cred-002', name: 'API Access Credentials' },
];

const EditTimeTriggerModal = ({ visible, trigger, onCancel, onSuccess }: EditTimeTriggerModalProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formApi, setFormApi] = useState<any>(null);
  const [initialized, setInitialized] = useState(false);

  // 第Tue步: Task config - 仅保留need's Status
  const [selectedProcess, setSelectedProcess] = useState<(LYProcessActiveVersionResponse & { owning_department_name?: string; owner_name?: string }) | null>(null);
  const [targetType, setTargetType] = useState<ExecutionTargetType | null>(null);
  const [owningDepartmentId, setOwningDepartmentId] = useState<string>('');
  const [ownerId, setOwnerId] = useState<string | undefined>(trigger?.owner_id || undefined);

  // 第Wed步: Trigger Rules
  const [ruleType, setRuleType] = useState<TriggerRuleType>('BASIC');
  const [frequencyType, setFrequencyType] = useState<BasicFrequencyType>('DAILY');
  // 基本TypeConfig
  const [minuteInterval, setMinuteInterval] = useState<number>(5);
  const [hourInterval, setHourInterval] = useState<number>(2);
  const [minuteOfHour, setMinuteOfHour] = useState<number>(0);
  const [triggerHour, setTriggerHour] = useState<number>(9);
  const [triggerMinute, setTriggerMinute] = useState<number>(0);
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([1]);
  const [selectedMonthDay, setSelectedMonthDay] = useState<number | 'L'>(1);
  // Cron 表达式
  const [cronExpression, setCronExpression] = useState('');
  // Timezone and Time范围
  const [timeZone, setTimeZone] = useState('Asia/Shanghai');
  const [startDateTime, setStartDateTime] = useState<Date | null>(new Date());
  const [endDateTime, setEndDateTime] = useState<Date | null>(null);
  const [endTimeType, setEndTimeType] = useState<'never' | 'custom'>('never');
  // Work Calendar
  const [enableWorkCalendar, setEnableWorkCalendar] = useState(false);
  const [workCalendarId, setWorkCalendarId] = useState<string | null>(null);
  const [workCalendarExecutionType, setWorkCalendarExecutionType] = useState<'WORKDAY' | 'NON_WORKDAY'>('WORKDAY');

  // 初始化表单Data
  useEffect(() => {
    if (visible && trigger && formApi && !initialized) {
      setCurrentStep(0);
      const process = mockProcesses.find((p) => p.process_id === trigger.process_id);
      setSelectedProcess(process || null);
      setTargetType(trigger.execution_target_type);
      
      // Settings表单值
      const formValues: Record<string, any> = {
        triggerName: trigger.name,
        description: trigger.description || '',
        processId: trigger.process_id,
        targetType: trigger.execution_target_type,
        targetId: trigger.execution_target_id,
        priority: trigger.priority,
        maxDuration: trigger.max_execution_duration,
        validityDays: trigger.validity_days,
        enableRecording: trigger.enable_recording,
      };
      
      // Settings参Number
      if (trigger.input_parameters && process) {
        process.parameters.forEach((param) => {
          if (trigger.input_parameters?.[param.name] !== undefined) {
            formValues[`param_${param.name}`] = trigger.input_parameters[param.name];
          }
        });
      }
      
      formApi.setValues(formValues);
      setInitialized(true);
      
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

      // 根据 frequencyType  and  cron_expression 解析详细Config
      if (trigger.rule_type === 'BASIC' && trigger.basic_frequency_type) {
        // 解析 cron 表达式获取详细Config
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
  }, [visible, trigger, formApi, initialized]);

  // 重置初始化标记
  useEffect(() => {
    if (!visible) {
      setInitialized(false);
      setCurrentStep(0);
      setSelectedProcess(null);
      setTargetType(null);
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

  // 判断is否hasParameterneed填写
  const hasParameters = selectedProcess && selectedProcess.parameters.length > 0;
  const hasOutputParameters = selectedProcess && selectedProcess.output_parameters && selectedProcess.output_parameters.length > 0;
  const showRightPanel = (hasParameters || hasOutputParameters) && currentStep === 1;

  // generation Cron 表达式
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

  // PreviewTriggerTime
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

  // selectProcess
  const handleProcessChange = useCallback((processId: string) => {
    const process = mockProcesses.find((p) => p.process_id === processId);
    setSelectedProcess(process || null);
    if (process && formApi) {
      process.parameters.forEach((param) => {
        if (param.default_value !== undefined && param.default_value !== null) {
          formApi.setValue(`param_${param.name}`, param.default_value);
        }
      });
    }
  }, [formApi]);

  // selectTemplate
  const handleTemplateChange = useCallback((templateId: string | null) => {
    if (templateId && formApi) {
      const template = mockTemplates.find((t) => t.template_id === templateId);
      if (template) {
        handleProcessChange(template.process_id);
        setTargetType(template.execution_target_type);
        formApi.setValues({
          processId: template.process_id,
          targetType: template.execution_target_type,
          targetId: template.execution_target_id,
          priority: template.priority,
          maxDuration: template.max_execution_duration,
          validityDays: template.validity_days,
          enableRecording: template.enable_recording,
          ...Object.fromEntries(
            Object.entries(template.input_parameters || {}).map(([k, v]) => [`param_${k}`, v])
          ),
        });
      }
    }
  }, [formApi, handleProcessChange]);

  // 渲染Parameterinput
  const renderParameterInput = (param: LYProcessParameterDefinition) => {
    const renderLabel = () => (
      <div className="edit-time-trigger-modal-param-label">
        <span>{param.name}</span>
        <Tag size="small" color="grey" style={{ marginLeft: 8 }}>
          {param.type}
        </Tag>
        {param.description && (
          <Popover
            content={
              <div style={{ maxWidth: 320, maxHeight: 200, overflowY: 'auto', wordBreak: 'break-word', fontSize: 12, lineHeight: '20px' }}>
                {param.description}
              </div>
            }
            trigger="hover"
            position="top"
            showArrow
          >
            <HelpCircle size={16} strokeWidth={2} />
          </Popover>
        )}
      </div>
    );

    const rules = param.required 
      ? [{ required: true, message: t('timeTrigger.validation.parameterRequired', { name: param.name }) }]
      : [];

    switch (param.type) {
      case 'TEXT':
        return (
          <Form.Input
            key={param.name}
            field={`param_${param.name}`}
            label={renderLabel()}
            placeholder={`Please enter ${param.name}`}
            rules={rules}
          />
        );
      case 'NUMBER':
        return (
          <Form.InputNumber
            key={param.name}
            field={`param_${param.name}`}
            label={renderLabel()}
            placeholder={`Please enter ${param.name}`}
            style={{ width: '100%' }}
            rules={rules}
          />
        );
      case 'BOOLEAN':
        return (
          <div className="edit-time-trigger-modal-param-item" key={param.name}>
            <div className="semi-form-field-label">
              {renderLabel()}
            </div>
            <Form.Switch
              field={`param_${param.name}`}
              noLabel
              size="small"
            />
          </div>
        );
      case 'CREDENTIAL':
        return (
          <Form.Select
            key={param.name}
            field={`param_${param.name}`}
            label={renderLabel()}
            placeholder="Select credentials"
            optionList={mockCredentials.map((c) => ({ value: c.id, label: c.name }))}
            style={{ width: '100%' }}
            rules={rules}
          />
        );
      default:
        return null;
    }
  };

  // ValidationStep
  const validateStep = async (step: number): Promise<boolean> => {
    if (step === 0) {
      if (formApi) {
        try {
          await formApi.validate(['triggerName']);
          return true;
        } catch (errors) {
          return false;
        }
      }
      return false;
    }
    
    if (step === 1) {
      if (formApi) {
        try {
          const fieldsToValidate = ['processId', 'targetType', 'targetId', 'maxDuration', 'validityDays'];
          if (selectedProcess) {
            selectedProcess.parameters.forEach((param) => {
              if (param.required) {
                fieldsToValidate.push(`param_${param.name}`);
              }
            });
          }
          await formApi.validate(fieldsToValidate);
          return true;
        } catch (errors) {
          return false;
        }
      }
      return false;
    }
    
    return true;
  };

  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
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
      
      const formValues = formApi?.getValues();
      const parameterValues: Record<string, unknown> = {};
      if (selectedProcess) {
        selectedProcess.parameters.forEach((param) => {
          parameterValues[param.name] = formValues?.[`param_${param.name}`];
        });
      }

      const finalCronExpression = ruleType === 'CRON' ? cronExpression : generatedCronExpression;
      
      console.log('EditTime trigger:', {
        trigger_id: trigger?.trigger_id,
        name: formValues?.triggerName?.trim(),
        description: formValues?.description?.trim() || null,
        process_id: formValues?.processId,
        execution_target_type: formValues?.targetType,
        execution_target_id: formValues?.targetId,
        priority: formValues?.priority,
        max_execution_duration: formValues?.maxDuration,
        validity_days: formValues?.validityDays,
        enable_recording: formValues?.enableRecording,
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
      console.error('Edit time trigger failed:', error);
      Toast.error(t('timeTrigger.editModal.error'));
    } finally {
      setLoading(false);
    }
  };

  // 渲染Step0: Basic Info
  const renderStep0Content = () => (
    <div className="edit-time-trigger-modal-section">
      <div className="edit-time-trigger-modal-section-title">{t('timeTrigger.createModal.basicSection')}</div>

      <Form.Input
        field="triggerName"
        label={t('timeTrigger.fields.name')}
        placeholder={t('timeTrigger.fields.namePlaceholder')}
        maxLength={255}
        showClear
        rules={[
          { required: true, message: t('timeTrigger.validation.nameRequired') },
          { max: 255, message: t('timeTrigger.validation.nameLengthError') },
        ]}
      />
      <Form.TextArea
        field="description"
        label={t('timeTrigger.fields.description')}
        placeholder={t('timeTrigger.fields.descriptionPlaceholder')}
        maxCount={2000}
        showClear
        rows={3}
      />
      <Form.Slot label={t('common.owningDepartment')}>
        <DepartmentSelect value={owningDepartmentId} onChange={setOwningDepartmentId} />
      </Form.Slot>
      <Form.Slot label={t('common.owner')}>
        <OwnerSelect value={ownerId} onChange={setOwnerId} />
      </Form.Slot>
    </div>
  );

  // 渲染Step1's LeftContent
  const renderStep1LeftContent = () => (
    <>
      {/* Template selection */}
      <div className="edit-time-trigger-modal-section">
        <div className="edit-time-trigger-modal-section-title">{t('task.createModal.selectTemplate')}</div>
        <Form.Select
          field="templateId"
          noLabel
          placeholder={t('task.createModal.templatePlaceholder')}
          optionList={mockTemplates.map((tpl) => ({ value: tpl.template_id, label: tpl.template_name }))}
          showClear
          filter
          className="edit-time-trigger-modal-select-full"
          onChange={(v) => handleTemplateChange(v as string | null)}
        />
      </div>

      {/* Process config */}
      <div className="edit-time-trigger-modal-section">
        <div className="edit-time-trigger-modal-section-title">{t('timeTrigger.createModal.processSection')}</div>
        <Form.Select
          field="processId"
          label={t('timeTrigger.fields.process')}
          placeholder={t('timeTrigger.fields.processPlaceholder')}
          optionList={mockProcesses.map((p) => ({ value: p.process_id, label: p.process_name }))}
          filter
          className="edit-time-trigger-modal-select-full"
          rules={[
            { required: true, message: t('timeTrigger.validation.processRequired') },
          ]}
          onChange={(v) => handleProcessChange(v as string)}
        />
        {selectedProcess && (
          <>
            <Form.Slot label={t('common.owningDepartment')}>
              <Form.Input field="__process_dept_readonly" noLabel initValue={selectedProcess.owning_department_name || '-'} disabled style={{ width: '100%' }} />
            </Form.Slot>
            <Form.Slot label={t('common.owner')}>
              <Form.Input field="__process_owner_readonly" noLabel initValue={selectedProcess.owner_name || '-'} disabled style={{ width: '100%' }} />
            </Form.Slot>
          </>
        )}
      </div>

      {/* Execution target */}
      <div className="edit-time-trigger-modal-section">
        <div className="edit-time-trigger-modal-section-title">{t('timeTrigger.createModal.targetSection')}</div>
        <Form.RadioGroup
          field="targetType"
          label={t('timeTrigger.fields.targetType')}
          direction="horizontal"
          rules={[
            { required: true, message: t('timeTrigger.validation.targetTypeRequired') },
          ]}
          onChange={(e) => {
            setTargetType(e.target.value as ExecutionTargetType);
            formApi?.setValue('targetId', undefined);
          }}
        >
          <Form.Radio value="BOT_GROUP">{t('timeTrigger.targetType.botGroup')}</Form.Radio>
          <Form.Radio value="BOT_IN_GROUP">{t('timeTrigger.targetType.botInGroup')}</Form.Radio>
          <Form.Radio value="UNGROUPED_BOT">{t('timeTrigger.targetType.ungroupedBot')}</Form.Radio>
        </Form.RadioGroup>
        {targetType && (
          <div className="edit-time-trigger-modal-field">
            <div className="edit-time-trigger-modal-field-label">{t('task.createModal.selectTarget')}</div>
            <BotTargetSelector
              targetType={targetType}
              value={formApi?.getValue('targetId')}
              onChange={(v) => formApi?.setValue('targetId', v)}
              placeholder={t('timeTrigger.fields.targetPlaceholder')}
            />
            <Form.Input
              field="targetId"
              noLabel
              style={{ display: 'none' }}
              rules={[
                { required: true, message: t('timeTrigger.validation.targetRequired') },
              ]}
            />
          </div>
        )}
      </div>

      {/* Execution settings */}
      <div className="edit-time-trigger-modal-section">
        <div className="edit-time-trigger-modal-section-title">{t('timeTrigger.createModal.executionSection')}</div>
        <Form.RadioGroup
          field="priority"
          label={t('timeTrigger.fields.priority')}
          direction="horizontal"
        >
          <Form.Radio value="HIGH">{t('task.priority.high')}</Form.Radio>
          <Form.Radio value="MEDIUM">{t('task.priority.medium')}</Form.Radio>
          <Form.Radio value="LOW">{t('task.priority.low')}</Form.Radio>
        </Form.RadioGroup>
        <Form.InputNumber
          field="maxDuration"
          label={t('timeTrigger.fields.maxDuration')}
          min={60}
          max={86400}
          suffix={t('common.seconds')}
          style={{ width: 150 }}
          rules={[
            { required: true, message: t('task.validation.maxDurationRequired') },
            { validator: (rule, value, callback) => {
              if (value < 60 || value > 86400) {
                callback(t('task.validation.maxDurationRange'));
                return false;
              }
              callback();
              return true;
            }},
          ]}
        />
        <Form.InputNumber
          field="validityDays"
          label={t('timeTrigger.fields.validityDays')}
          min={1}
          max={30}
          suffix={t('common.days')}
          style={{ width: 150 }}
          rules={[
            { required: true, message: t('task.validation.validityDaysRequired') },
            { validator: (rule, value, callback) => {
              if (value < 1 || value > 30) {
                callback(t('task.validation.validityDaysRange'));
                return false;
              }
              callback();
              return true;
            }},
          ]}
        />
        <div className="edit-time-trigger-modal-field">
          <div className="semi-form-field-label-text">{t('timeTrigger.fields.enableRecording')}</div>
          <Form.Switch
            field="enableRecording"
            noLabel
            size="small"
          />
        </div>
      </div>
    </>
  );

  // 渲染Step1's RightContent(ParameterConfig)
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
          <div className="edit-time-trigger-modal-section-title">{t('template.createModal.outputParametersSection')}</div>
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
          <Inbox size={16} strokeWidth={2} />
          <div>{t('template.createModal.noParameters')}</div>
        </div>
      )}
    </>
  );

  // 渲染Step2: Trigger Rules and Preview
  const renderStep2Content = () => (
    <>
      {/* Time rules - Using TriggerRuleConfig component */}
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
        enableWorkCalendar={enableWorkCalendar}
        onEnableWorkCalendarChange={setEnableWorkCalendar}
        workCalendarId={workCalendarId}
        onWorkCalendarIdChange={setWorkCalendarId}
        workCalendarExecutionType={workCalendarExecutionType}
        onWorkCalendarExecutionTypeChange={setWorkCalendarExecutionType}
        workCalendarOptions={getWorkCalendarOptions()}
        showWorkCalendar={true}
      />

      {/* Trigger preview - Separated from Trigger Rules by a line */}
      <div className="edit-time-trigger-modal-section" style={{ borderTop: '1px solid var(--semi-color-border)', paddingTop: 20 }}>
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
      <Form
        className="edit-time-trigger-modal-form"
        labelPosition="top"
        getFormApi={setFormApi}
        initValues={{
          priority: 'MEDIUM',
          maxDuration: 3600,
          validityDays: 7,
          enableRecording: false,
        }}
      >
        {/* Step bar */}
        <div className="edit-time-trigger-modal-steps">
          <Steps current={currentStep} type="basic" size="small">
            <Steps.Step title={t('timeTrigger.createModal.steps.basicInfo')} />
            <Steps.Step title={t('timeTrigger.createModal.steps.taskConfig')} />
            <Steps.Step title={t('timeTrigger.createModal.steps.triggerRule')} />
          </Steps>
        </div>

        {/* Content area */}
        {currentStep === 0 && (
          <div className="edit-time-trigger-modal-content">
            {renderStep0Content()}
          </div>
        )}

        {currentStep === 1 && (
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
        )}

        {currentStep === 2 && (
          <div className="edit-time-trigger-modal-content">
            {renderStep2Content()}
          </div>
        )}

        {/* Footer buttons */}
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
      </Form>
    </Modal>
  );
};

export default EditTimeTriggerModal;
