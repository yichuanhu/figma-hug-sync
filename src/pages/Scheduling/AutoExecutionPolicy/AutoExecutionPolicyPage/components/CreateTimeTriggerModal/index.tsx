import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MOCK_CURRENT_USER, getDepartmentName } from '@/mocks/departmentData';
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
import { HelpCircle, Inbox } from 'lucide-react';
import TriggerRuleConfig from '@/components/TriggerRuleConfig';
import BotTargetSelector from '@/components/BotTargetSelector';
import { getWorkCalendarOptions } from '@/mocks/workCalendar';
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

// Mock ProcessList
const mockProcesses: LYProcessActiveVersionResponse[] = [
  {
    process_id: 'proc-001',
    process_name: 'Auto Order Processing',
    version_id: 'ver-001',
    version: 'v1.2.0',
    owning_department_id: 'dept-tech',
    owning_department_name: 'Technology Department',
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
    owning_department_id: 'dept-finance',
    owning_department_name: 'Finance Department',
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
    owning_department_id: 'dept-hr',
    owning_department_name: 'Human Resources',
    parameters: [],
    output_parameters: [],
  },
  {
    process_id: 'proc-004',
    process_name: 'Data Collection Flow',
    version_id: 'ver-004',
    version: 'v1.5.0',
    owning_department_id: 'dept-tech',
    owning_department_name: 'Technology Department',
    parameters: [
      { name: 'sourceUrl', type: 'TEXT', required: true, description: 'Data source URL' },
      { name: 'pageLimit', type: 'NUMBER', required: false, default_value: 10, description: 'Page limit for collection' },
    ],
    output_parameters: [
      { name: 'collectedCount', type: 'NUMBER', description: 'Collected data count' },
    ],
  },
];

// Mock 人Credential
const mockCredentials = [
  { id: 'cred-001', name: 'System Admin Credentials' },
  { id: 'cred-002', name: 'API Access Credentials' },
];

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
    input_parameters: { targetUrl: 'https://orders.example.com', maxCount: 50 },
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

// Already存in 's  TriggerName (模拟)
const existingTriggerNames = ['Daily Order Sync', 'Weekly Report Generation'];

const CreateTimeTriggerModal = ({ visible, onCancel, onSuccess }: CreateTimeTriggerModalProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formApi, setFormApi] = useState<any>(null);

  // 第Mon步: Basic Info - using Form Manage

  // 第Tue步: Task config
  const [selectedProcess, setSelectedProcess] = useState<LYProcessActiveVersionResponse | null>(null);
  const [targetType, setTargetType] = useState<ExecutionTargetType | null>(null);

  // 第Wed步: Trigger Rules
  const [ruleType, setRuleType] = useState<TriggerRuleType>('BASIC');
  const [frequencyType, setFrequencyType] = useState<BasicFrequencyType>('DAILY');
  const [minuteInterval, setMinuteInterval] = useState<number>(5);
  const [hourInterval, setHourInterval] = useState<number>(2);
  const [minuteOfHour, setMinuteOfHour] = useState<number>(0);
  const [triggerHour, setTriggerHour] = useState<number>(9);
  const [triggerMinute, setTriggerMinute] = useState<number>(0);
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([1]);
  const [selectedMonthDay, setSelectedMonthDay] = useState<number | 'L'>(1);
  const [cronExpression, setCronExpression] = useState('');
  const [timeZone, setTimeZone] = useState('Asia/Shanghai');
  const [startDateTime, setStartDateTime] = useState<Date | null>(new Date());
  const [endDateTime, setEndDateTime] = useState<Date | null>(null);
  const [endTimeType, setEndTimeType] = useState<'never' | 'custom'>('never');
  const [enableWorkCalendar, setEnableWorkCalendar] = useState(false);
  const [workCalendarId, setWorkCalendarId] = useState<string | null>(null);
  const [workCalendarExecutionType, setWorkCalendarExecutionType] = useState<'WORKDAY' | 'NON_WORKDAY'>('WORKDAY');

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

  // 重置表单
  useEffect(() => {
    if (!visible) {
      setCurrentStep(0);
      formApi?.reset();
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
  }, [visible, formApi]);

  // selectProcess
  const handleProcessChange = (processId: string) => {
    const process = mockProcesses.find((p) => p.process_id === processId);
    setSelectedProcess(process || null);
    if (process && formApi) {
      process.parameters.forEach((param) => {
        if (param.default_value !== undefined && param.default_value !== null) {
          formApi.setValue(`param_${param.name}`, param.default_value);
        }
      });
    }
  };

  // selectTemplate
  const handleTemplateChange = (templateId: string | null) => {
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
  };

  // ValidationTemplateName唯Mon性
  const validateTriggerName = (value: string) => {
    if (value && existingTriggerNames.includes(value.trim())) {
      return t('timeTrigger.validation.nameExists');
    }
    return '';
  };

  // 渲染Parameterinput
  const renderParameterInput = (param: LYProcessParameterDefinition) => {
    const renderLabel = () => (
      <div className="create-time-trigger-modal-param-label">
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
          <div className="create-time-trigger-modal-param-item" key={param.name}>
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

  // 下Mon步
  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  // 上Mon步
  const handlePrev = () => {
    setCurrentStep((prev) => prev - 1);
  };

  // Submit
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
      
      console.log('Creating time trigger:', {
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

      Toast.success(t('timeTrigger.createModal.success'));
      onSuccess();
    } catch (error) {
      console.error('Failed to create time trigger:', error);
      Toast.error(t('timeTrigger.createModal.error'));
    } finally {
      setLoading(false);
    }
  };

  // 渲染Step0: Basic Info
  const renderStep0Content = () => (
    <div className="create-time-trigger-modal-section">
      <div className="create-time-trigger-modal-section-title">{t('timeTrigger.createModal.basicSection')}</div>
      <Form.Input
        field="triggerName"
        label={t('timeTrigger.fields.name')}
        placeholder={t('timeTrigger.fields.namePlaceholder')}
        maxLength={255}
        showClear
        rules={[
          { required: true, message: t('timeTrigger.validation.nameRequired') },
          { max: 255, message: t('timeTrigger.validation.nameLengthError') },
          { validator: (rule, value, callback) => {
            const error = validateTriggerName(value);
            if (error) {
              callback(error);
              return false;
            }
            callback();
            return true;
          }},
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
      <div className="semi-form-field" style={{ marginBottom: 12 }}>
        <label className="semi-form-field-label">
          <span className="semi-form-field-label-text">{t('common.owningDepartment')}</span>
        </label>
        <Text type="tertiary">
          {selectedProcess?.owning_department_name || (selectedProcess ? MOCK_CURRENT_USER.department_name : t('timeTrigger.createModal.selectProcessFirst'))}
        </Text>
      </div>
      <div className="semi-form-field" style={{ marginBottom: 12 }}>
        <label className="semi-form-field-label">
          <span className="semi-form-field-label-text">{t('common.owner')}</span>
        </label>
        <Text>{MOCK_CURRENT_USER.name}</Text>
      </div>
    </div>
  );

  // 渲染Step1Left: Task config
  const renderStep1LeftContent = () => (
    <>
      {/* Template selection */}
      <div className="create-time-trigger-modal-section">
        <div className="create-time-trigger-modal-section-title">{t('task.createModal.selectTemplate')}</div>
        <Form.Select
          field="templateId"
          noLabel
          placeholder={t('task.createModal.templatePlaceholder')}
          optionList={mockTemplates.map((tpl) => ({ value: tpl.template_id, label: tpl.template_name }))}
          showClear
          filter
          className="create-time-trigger-modal-select-full"
          onChange={(v) => handleTemplateChange(v as string | null)}
        />
      </div>

      {/* Process config */}
      <div className="create-time-trigger-modal-section">
        <div className="create-time-trigger-modal-section-title">{t('timeTrigger.createModal.processSection')}</div>
        <Form.Select
          field="processId"
          label={t('timeTrigger.fields.process')}
          placeholder={t('timeTrigger.fields.processPlaceholder')}
          optionList={mockProcesses.map((p) => ({ value: p.process_id, label: p.process_name }))}
          filter
          className="create-time-trigger-modal-select-full"
          rules={[
            { required: true, message: t('timeTrigger.validation.processRequired') },
          ]}
          onChange={(v) => handleProcessChange(v as string)}
        />
      </div>

      {/* Execution target */}
      <div className="create-time-trigger-modal-section">
        <div className="create-time-trigger-modal-section-title">{t('timeTrigger.createModal.targetSection')}</div>
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
          <div className="create-time-trigger-modal-field">
            <div className="create-time-trigger-modal-field-label">{t('task.createModal.selectTarget')}</div>
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
      <div className="create-time-trigger-modal-section">
        <div className="create-time-trigger-modal-section-title">{t('timeTrigger.createModal.executionSection')}</div>
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
        <div className="create-time-trigger-modal-field">
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

  // 渲染Step1Right: ParameterConfig
  const renderStep1RightContent = () => (
    <>
      {/* Input parameters */}
      {hasParameters && (
        <div className="create-time-trigger-modal-section">
          <div className="create-time-trigger-modal-section-title">{t('timeTrigger.createModal.parameterSection')}</div>
          <div className="create-time-trigger-modal-params">
            {selectedProcess?.parameters.map((param) => renderParameterInput(param))}
          </div>
        </div>
      )}

      {/* Output parameters display */}
      {hasOutputParameters && (
        <div className="create-time-trigger-modal-section">
          <div className="create-time-trigger-modal-section-title">{t('template.createModal.outputParametersSection')}</div>
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

      {/* If no parameters */}
      {!hasParameters && !hasOutputParameters && (
        <div className="create-time-trigger-modal-no-params">
          <Inbox size={36} strokeWidth={2} style={{ color: 'var(--semi-color-text-2)', marginBottom: 8 }} />
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
      <div className="create-time-trigger-modal-section" style={{ borderTop: '1px solid var(--semi-color-border)', paddingTop: 20 }}>
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

  // calculationModal宽度
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
      <Form
        className="create-time-trigger-modal-form"
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
        <div className="create-time-trigger-modal-steps">
          <Steps current={currentStep} type="basic" size="small">
            <Steps.Step title={t('timeTrigger.createModal.steps.basicInfo')} />
            <Steps.Step title={t('timeTrigger.createModal.steps.taskConfig')} />
            <Steps.Step title={t('timeTrigger.createModal.steps.triggerRule')} />
          </Steps>
        </div>

        {/* Content area */}
        {currentStep === 0 && (
          <div className="create-time-trigger-modal-content">
            {renderStep0Content()}
          </div>
        )}

        {currentStep === 1 && (
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
        )}

        {currentStep === 2 && (
          <div className="create-time-trigger-modal-content">
            {renderStep2Content()}
          </div>
        )}

        {/* Footer buttons */}
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
      </Form>
    </Modal>
  );
};

export default CreateTimeTriggerModal;
