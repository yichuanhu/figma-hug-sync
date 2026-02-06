import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Form,
  Button,
  Toast,
  Typography,
  Tooltip,
  Tag,
  Steps,
  Select,
  Banner,
} from '@douyinfe/semi-ui';
import { IconHelpCircleStroked } from '@douyinfe/semi-icons';
import { Inbox } from 'lucide-react';
import BotTargetSelector from '@/components/BotTargetSelector';
import { getWorkCalendarOptions } from '@/mocks/workCalendar';
import type {
  LYQueueTriggerResponse,
  LYProcessActiveVersionResponse,
  LYProcessParameterDefinition,
  ExecutionTargetType,
  TaskPriority,
} from '@/api';
import './index.less';

const { Text } = Typography;

interface EditQueueTriggerModalProps {
  visible: boolean;
  trigger: LYQueueTriggerResponse;
  onCancel: () => void;
  onSuccess: () => void;
}

// Mock 执行模板
const mockTemplates = [
  {
    template_id: 'tpl-001',
    template_name: '订单处理默认模板',
    description: '使用默认配置处理订单',
    process_id: 'proc-001',
    process_name: '订单自动处理',
    execution_target_type: 'BOT_GROUP' as ExecutionTargetType,
    execution_target_id: 'group-001',
    execution_target_name: '订单处理组',
    priority: 'MEDIUM' as TaskPriority,
    max_execution_duration: 3600,
    validity_days: 7,
    enable_recording: true,
    input_parameters: { targetUrl: 'https://orders.example.com', maxCount: 50, enableRetry: true },
  },
  {
    template_id: 'tpl-002',
    template_name: '财务审批快速模板',
    description: '财务报销审批快速执行配置',
    process_id: 'proc-002',
    process_name: '财务报销审批',
    execution_target_type: 'BOT_GROUP' as ExecutionTargetType,
    execution_target_id: 'group-002',
    execution_target_name: '财务审批组',
    priority: 'HIGH' as TaskPriority,
    max_execution_duration: 1800,
    validity_days: 3,
    enable_recording: false,
    input_parameters: { department: '财务部' },
  },
];

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
    output_parameters: [],
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
    process_name: '数据采集流程',
    version_id: 'ver-004',
    version: 'v1.5.0',
    parameters: [
      { name: 'sourceUrl', type: 'TEXT', required: true, description: '数据源URL' },
      { name: 'pageLimit', type: 'NUMBER', required: false, default_value: 10, description: '采集页数限制' },
    ],
    output_parameters: [
      { name: 'collectedCount', type: 'NUMBER', description: '采集数据条数' },
    ],
  },
];

// Mock 队列列表
const mockQueues = [
  { queue_id: 'queue-001', queue_name: '订单待处理队列', monitored: false },
  { queue_id: 'queue-002', queue_name: '审批任务队列', monitored: true },
  { queue_id: 'queue-003', queue_name: '数据同步队列', monitored: false },
  { queue_id: 'queue-004', queue_name: '报表生成队列', monitored: false },
];

// Mock 个人凭据
const mockCredentials = [
  { id: 'cred-001', name: '系统管理员凭据' },
  { id: 'cred-002', name: 'API访问凭据' },
];

// 时区列表
const timeZoneOptions = [
  { value: 'Asia/Shanghai', label: 'Asia/Shanghai (UTC+8)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (UTC+9)' },
  { value: 'America/New_York', label: 'America/New_York (UTC-5)' },
  { value: 'Europe/London', label: 'Europe/London (UTC+0)' },
];

const EditQueueTriggerModal = ({ visible, trigger, onCancel, onSuccess }: EditQueueTriggerModalProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formApi, setFormApi] = useState<any>(null);
  const [initialized, setInitialized] = useState(false);

  // 第二步：任务配置
  const [selectedProcess, setSelectedProcess] = useState<LYProcessActiveVersionResponse | null>(null);
  const [targetType, setTargetType] = useState<ExecutionTargetType | null>(null);

  // 第三步：队列触发配置
  const [enableWorkCalendar, setEnableWorkCalendar] = useState(false);
  const [minEffectiveMessages, setMinEffectiveMessages] = useState(1);
  const [enablePeriodicCheck, setEnablePeriodicCheck] = useState(false);

  // 判断是否有参数需要填写
  const hasParameters = selectedProcess && selectedProcess.parameters.length > 0;
  const hasOutputParameters = selectedProcess && selectedProcess.output_parameters && selectedProcess.output_parameters.length > 0;
  const showRightPanel = (hasParameters || hasOutputParameters) && currentStep === 1;

  // 初始化表单数据
  useEffect(() => {
    if (visible && trigger && formApi && !initialized) {
      // 查找对应的流程
      const process = mockProcesses.find((p) => p.process_id === trigger.process_id);
      setSelectedProcess(process || null);
      setTargetType(trigger.execution_target_type);
      setEnableWorkCalendar(trigger.enable_work_calendar);
      setMinEffectiveMessages(trigger.min_effective_messages);
      setEnablePeriodicCheck(trigger.enable_periodic_check);

      // 设置表单值
      formApi.setValues({
        triggerName: trigger.name,
        description: trigger.description || '',
        processId: trigger.process_id,
        targetType: trigger.execution_target_type,
        targetId: trigger.execution_target_id,
        priority: trigger.priority,
        maxDuration: trigger.max_execution_duration,
        validityDays: trigger.validity_days,
        enableRecording: trigger.enable_recording,
        timeZone: trigger.time_zone,
        enableWorkCalendarSwitch: trigger.enable_work_calendar,
        workCalendarId: trigger.work_calendar_id,
        executionType: trigger.work_calendar_execution_type || 'WORKDAY',
        queueId: trigger.queue_id,
        minEffectiveMessages: trigger.min_effective_messages,
        enablePeriodicCheckSwitch: trigger.enable_periodic_check,
        periodicCheckInterval: trigger.periodic_check_interval || 30,
        messagesPerTrigger: trigger.messages_per_trigger,
        // 设置参数值
        ...Object.fromEntries(
          Object.entries(trigger.input_parameters || {}).map(([k, v]) => [`param_${k}`, v])
        ),
      });
      setInitialized(true);
    }
  }, [visible, trigger, formApi, initialized]);

  // 重置表单
  useEffect(() => {
    if (!visible) {
      setCurrentStep(0);
      setSelectedProcess(null);
      setTargetType(null);
      setEnableWorkCalendar(false);
      setMinEffectiveMessages(1);
      setEnablePeriodicCheck(false);
      setInitialized(false);
    }
  }, [visible]);

  // 选择流程
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

  // 选择模板
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

  // 渲染参数输入
  const renderParameterInput = (param: LYProcessParameterDefinition) => {
    const renderLabel = () => (
      <div className="edit-queue-trigger-modal-param-label">
        <span>{param.name}</span>
        <Tag size="small" color="grey" style={{ marginLeft: 8 }}>
          {param.type}
        </Tag>
        {param.description && (
          <Tooltip content={param.description}>
            <IconHelpCircleStroked size="small" style={{ color: 'var(--semi-color-text-2)', marginLeft: 4, cursor: 'help' }} />
          </Tooltip>
        )}
      </div>
    );

    const rules = param.required 
      ? [{ required: true, message: t('queueTrigger.validation.parameterRequired', { name: param.name }) }]
      : [];

    switch (param.type) {
      case 'TEXT':
        return (
          <Form.Input
            key={param.name}
            field={`param_${param.name}`}
            label={renderLabel()}
            placeholder={`请输入 ${param.name}`}
            rules={rules}
          />
        );
      case 'NUMBER':
        return (
          <Form.InputNumber
            key={param.name}
            field={`param_${param.name}`}
            label={renderLabel()}
            placeholder={`请输入 ${param.name}`}
            style={{ width: '100%' }}
            rules={rules}
          />
        );
      case 'BOOLEAN':
        return (
          <div className="edit-queue-trigger-modal-param-item" key={param.name}>
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
            placeholder="请选择凭据"
            optionList={mockCredentials.map((c) => ({ value: c.id, label: c.name }))}
            style={{ width: '100%' }}
            rules={rules}
          />
        );
      default:
        return null;
    }
  };

  // 验证步骤
  const validateStep = async (step: number): Promise<boolean> => {
    if (step === 0) {
      if (formApi) {
        try {
          await formApi.validate(['triggerName']);
          return true;
        } catch {
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
        } catch {
          return false;
        }
      }
      return false;
    }
    
    if (step === 2) {
      if (formApi) {
        try {
          const fieldsToValidate = ['timeZone', 'queueId', 'minEffectiveMessages', 'messagesPerTrigger'];
          if (enableWorkCalendar) {
            fieldsToValidate.push('workCalendarId');
          }
          if (enablePeriodicCheck) {
            fieldsToValidate.push('periodicCheckInterval');
          }
          await formApi.validate(fieldsToValidate);
          return true;
        } catch {
          return false;
        }
      }
      return false;
    }
    
    return true;
  };

  // 下一步
  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  // 上一步
  const handlePrev = () => {
    setCurrentStep((prev) => prev - 1);
  };

  // 提交
  const handleSubmit = async () => {
    const isValid = await validateStep(currentStep);
    if (!isValid) return;

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

      console.log('更新队列触发器:', {
        trigger_id: trigger.trigger_id,
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
        queue_id: formValues?.queueId,
        time_zone: formValues?.timeZone,
        enable_work_calendar: enableWorkCalendar,
        work_calendar_id: enableWorkCalendar ? formValues?.workCalendarId : null,
        work_calendar_execution_type: enableWorkCalendar ? formValues?.executionType : null,
        min_effective_messages: formValues?.minEffectiveMessages,
        messages_per_trigger: formValues?.messagesPerTrigger,
        enable_periodic_check: enablePeriodicCheck,
        periodic_check_interval: enablePeriodicCheck ? formValues?.periodicCheckInterval : null,
      });

      Toast.success(t('queueTrigger.editModal.success'));
      onSuccess();
    } catch (error) {
      console.error('更新队列触发器失败:', error);
      Toast.error(t('queueTrigger.editModal.error'));
    } finally {
      setLoading(false);
    }
  };

  // 渲染步骤0：基本信息
  const renderStep0Content = () => (
    <div className="edit-queue-trigger-modal-section">
      <div className="edit-queue-trigger-modal-section-title">{t('queueTrigger.createModal.basicSection')}</div>
      <Form.Input
        field="triggerName"
        label={t('queueTrigger.fields.name')}
        placeholder={t('queueTrigger.fields.namePlaceholder')}
        maxLength={255}
        showClear
        rules={[
          { required: true, message: t('queueTrigger.validation.nameRequired') },
          { max: 255, message: t('queueTrigger.validation.nameLengthError') },
        ]}
      />
      <Form.TextArea
        field="description"
        label={t('queueTrigger.fields.description')}
        placeholder={t('queueTrigger.fields.descriptionPlaceholder')}
        maxCount={2000}
        showClear
        rows={3}
      />
    </div>
  );

  // 渲染步骤1左侧：任务配置
  const renderStep1LeftContent = () => (
    <>
      {/* 模板选择 */}
      <div className="edit-queue-trigger-modal-section">
        <div className="edit-queue-trigger-modal-section-title">{t('task.createModal.selectTemplate')}</div>
        <Form.Select
          field="templateId"
          noLabel
          placeholder={t('task.createModal.templatePlaceholder')}
          optionList={mockTemplates.map((tpl) => ({ value: tpl.template_id, label: tpl.template_name }))}
          showClear
          filter
          className="edit-queue-trigger-modal-select-full"
          onChange={(v) => handleTemplateChange(v as string | null)}
        />
      </div>

      {/* 流程配置 */}
      <div className="edit-queue-trigger-modal-section">
        <div className="edit-queue-trigger-modal-section-title">{t('queueTrigger.createModal.processSection')}</div>
        <Form.Select
          field="processId"
          label={t('queueTrigger.fields.process')}
          placeholder={t('queueTrigger.fields.processPlaceholder')}
          optionList={mockProcesses.map((p) => ({ value: p.process_id, label: p.process_name }))}
          filter
          className="edit-queue-trigger-modal-select-full"
          rules={[
            { required: true, message: t('queueTrigger.validation.processRequired') },
          ]}
          onChange={(v) => handleProcessChange(v as string)}
        />
      </div>

      {/* 执行目标 */}
      <div className="edit-queue-trigger-modal-section">
        <div className="edit-queue-trigger-modal-section-title">{t('queueTrigger.createModal.targetSection')}</div>
        <Form.RadioGroup
          field="targetType"
          label={t('queueTrigger.fields.targetType')}
          direction="horizontal"
          rules={[
            { required: true, message: t('queueTrigger.validation.targetTypeRequired') },
          ]}
          onChange={(e) => {
            setTargetType(e.target.value as ExecutionTargetType);
            formApi?.setValue('targetId', undefined);
          }}
        >
          <Form.Radio value="BOT_GROUP">{t('queueTrigger.targetType.botGroup')}</Form.Radio>
          <Form.Radio value="BOT_IN_GROUP">{t('queueTrigger.targetType.botInGroup')}</Form.Radio>
          <Form.Radio value="UNGROUPED_BOT">{t('queueTrigger.targetType.ungroupedBot')}</Form.Radio>
        </Form.RadioGroup>
        {targetType && (
          <div className="edit-queue-trigger-modal-field">
            <div className="edit-queue-trigger-modal-field-label">{t('task.createModal.selectTarget')}</div>
            <BotTargetSelector
              targetType={targetType}
              value={formApi?.getValue('targetId')}
              onChange={(v) => formApi?.setValue('targetId', v)}
              placeholder={t('queueTrigger.fields.targetPlaceholder')}
            />
            <Form.Input
              field="targetId"
              noLabel
              style={{ display: 'none' }}
              rules={[
                { required: true, message: t('queueTrigger.validation.targetRequired') },
              ]}
            />
          </div>
        )}
      </div>

      {/* 执行设置 */}
      <div className="edit-queue-trigger-modal-section">
        <div className="edit-queue-trigger-modal-section-title">{t('queueTrigger.createModal.executionSection')}</div>
        <Form.RadioGroup
          field="priority"
          label={t('queueTrigger.fields.priority')}
          direction="horizontal"
        >
          <Form.Radio value="HIGH">{t('task.priority.high')}</Form.Radio>
          <Form.Radio value="MEDIUM">{t('task.priority.medium')}</Form.Radio>
          <Form.Radio value="LOW">{t('task.priority.low')}</Form.Radio>
        </Form.RadioGroup>
        <Form.InputNumber
          field="maxDuration"
          label={t('queueTrigger.fields.maxDuration')}
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
          label={t('queueTrigger.fields.validityDays')}
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
        <div className="edit-queue-trigger-modal-field">
          <div className="semi-form-field-label-text">{t('queueTrigger.fields.enableRecording')}</div>
          <Form.Switch
            field="enableRecording"
            noLabel
            size="small"
          />
        </div>
      </div>
    </>
  );

  // 渲染步骤1右侧：参数配置
  const renderStep1RightContent = () => (
    <>
      {/* 输入参数 */}
      {hasParameters && (
        <div className="edit-queue-trigger-modal-section">
          <div className="edit-queue-trigger-modal-section-title">{t('queueTrigger.createModal.parameterSection')}</div>
          <div className="edit-queue-trigger-modal-params">
            {selectedProcess?.parameters.map((param) => renderParameterInput(param))}
          </div>
        </div>
      )}

      {/* 输出参数展示 */}
      {hasOutputParameters && (
        <div className="edit-queue-trigger-modal-section">
          <div className="edit-queue-trigger-modal-section-title">{t('template.createModal.outputParametersSection')}</div>
          <div className="edit-queue-trigger-modal-output-params">
            {selectedProcess?.output_parameters?.map((param) => (
              <div className="edit-queue-trigger-modal-output-param-item" key={param.name}>
                <div className="edit-queue-trigger-modal-output-param-name">
                  <span>{param.name}</span>
                  <Tag size="small" color="grey" style={{ marginLeft: 8 }}>
                    {param.type}
                  </Tag>
                </div>
                {param.description && (
                  <div className="edit-queue-trigger-modal-output-param-desc">{param.description}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 如果没有任何参数 */}
      {!hasParameters && !hasOutputParameters && (
        <div className="edit-queue-trigger-modal-no-params">
          <IconInbox size="extra-large" style={{ color: 'var(--semi-color-text-2)', marginBottom: 8 }} />
          <div>{t('template.createModal.noParameters')}</div>
        </div>
      )}
    </>
  );

  // 渲染步骤2：队列触发配置
  const renderStep2Content = () => (
    <div className="edit-queue-trigger-modal-section">
      <div className="edit-queue-trigger-modal-section-title">{t('queueTrigger.createModal.queueSection')}</div>
      
      {/* 触发器时区 */}
      <Form.Select
        field="timeZone"
        label={t('queueTrigger.fields.timeZone')}
        placeholder={t('queueTrigger.fields.timeZonePlaceholder')}
        optionList={timeZoneOptions}
        rules={[{ required: true, message: t('queueTrigger.validation.timeZoneRequired') }]}
        style={{ width: '100%' }}
      />

      {/* 启用工作日历 */}
      <div className="edit-queue-trigger-modal-field">
        <div className="semi-form-field-label-text">{t('queueTrigger.fields.enableWorkCalendar')}</div>
        <Form.Switch
          field="enableWorkCalendarSwitch"
          noLabel
          size="small"
          onChange={(value) => setEnableWorkCalendar(value)}
        />
      </div>
      {enableWorkCalendar && (
        <>
          <Form.Select
            field="workCalendarId"
            label={t('queueTrigger.fields.workCalendar')}
            placeholder={t('queueTrigger.fields.workCalendarPlaceholder')}
            optionList={getWorkCalendarOptions()}
            rules={[{ required: true, message: t('queueTrigger.validation.workCalendarRequired') }]}
            style={{ width: '100%' }}
          />
          <Form.RadioGroup
            field="executionType"
            label={t('queueTrigger.fields.executionType')}
            direction="horizontal"
          >
            <Form.Radio value="WORKDAY">{t('queueTrigger.fields.executionTypeWorkday')}</Form.Radio>
            <Form.Radio value="NON_WORKDAY">{t('queueTrigger.fields.executionTypeNonWorkday')}</Form.Radio>
          </Form.RadioGroup>
        </>
      )}

      {/* 监控队列 */}
      <Form.Select
        field="queueId"
        label={t('queueTrigger.fields.monitoredQueue')}
        placeholder={t('queueTrigger.fields.monitoredQueuePlaceholder')}
        optionList={mockQueues.map((q) => ({
          value: q.queue_id,
          label: q.queue_name,
          disabled: q.monitored && q.queue_id !== trigger.queue_id,
        }))}
        extraText={t('queueTrigger.fields.monitoredQueueHint')}
        rules={[{ required: true, message: t('queueTrigger.validation.queueRequired') }]}
        style={{ width: '100%' }}
        renderOptionItem={(renderProps) => {
          const { disabled, selected, label, value, ...rest } = renderProps;
          const isCurrentQueue = value === trigger.queue_id;
          return (
            <Select.Option {...rest} value={value} disabled={disabled} selected={selected}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span>{label}</span>
                {disabled && !isCurrentQueue && <Tag size="small" color="orange">已被监控</Tag>}
              </div>
            </Select.Option>
          );
        }}
      />

      {/* 触发最少有效消息数 */}
      <Form.InputNumber
        field="minEffectiveMessages"
        label={t('queueTrigger.fields.minEffectiveMessages')}
        min={1}
        max={9999}
        extraText={t('queueTrigger.fields.minEffectiveMessagesHint')}
        onChange={(value) => setMinEffectiveMessages(value as number)}
        rules={[
          { required: true, message: t('queueTrigger.validation.minEffectiveMessagesRange') },
          { type: 'number', min: 1, max: 9999, message: t('queueTrigger.validation.minEffectiveMessagesRange') },
        ]}
        style={{ width: '100%' }}
      />

      {/* 启用定时检查 - 仅当 minEffectiveMessages > 1 时显示 */}
      {minEffectiveMessages > 1 && (
        <>
          <div className="edit-queue-trigger-modal-field">
            <div className="semi-form-field-label-text">{t('queueTrigger.fields.enablePeriodicCheck')}</div>
            <Form.Switch
              field="enablePeriodicCheckSwitch"
              noLabel
              size="small"
              onChange={(value) => setEnablePeriodicCheck(value)}
            />
          </div>
          {enablePeriodicCheck && (
            <Banner
              type="info"
              description={t('queueTrigger.fields.enablePeriodicCheckHint')}
              className="edit-queue-trigger-modal-banner"
            />
          )}
          {enablePeriodicCheck && (
            <Form.InputNumber
              field="periodicCheckInterval"
              label={t('queueTrigger.fields.periodicCheckInterval')}
              min={1}
              suffix={t('queueTrigger.fields.periodicCheckIntervalUnit')}
              rules={[
                { required: true, message: t('queueTrigger.validation.periodicCheckIntervalRange') },
                { type: 'number', min: 1, message: t('queueTrigger.validation.periodicCheckIntervalRange') },
              ]}
              style={{ width: '100%' }}
            />
          )}
        </>
      )}

      {/* 平均每若干条消息触发一次 */}
      <Form.InputNumber
        field="messagesPerTrigger"
        label={t('queueTrigger.fields.messagesPerTrigger')}
        min={1}
        extraText={t('queueTrigger.fields.messagesPerTriggerHint')}
        rules={[
          { required: true, message: t('queueTrigger.validation.messagesPerTriggerRange') },
          { type: 'number', min: 1, message: t('queueTrigger.validation.messagesPerTriggerRange') },
        ]}
        style={{ width: '100%' }}
      />
    </div>
  );

  // 计算弹窗宽度
  const modalWidth = showRightPanel ? 900 : 520;

  return (
    <Modal
      className="edit-queue-trigger-modal"
      title={t('queueTrigger.editModal.title')}
      visible={visible}
      onCancel={onCancel}
      footer={null}
      closeOnEsc
      maskClosable={false}
      width={modalWidth}
      centered
    >
      <Form
        className="edit-queue-trigger-modal-form"
        labelPosition="top"
        getFormApi={setFormApi}
      >
        {/* 步骤条 */}
        <div className="edit-queue-trigger-modal-steps">
          <Steps current={currentStep} type="basic" size="small">
            <Steps.Step title={t('queueTrigger.createModal.steps.basicInfo')} />
            <Steps.Step title={t('queueTrigger.createModal.steps.taskConfig')} />
            <Steps.Step title={t('queueTrigger.createModal.steps.queueConfig')} />
          </Steps>
        </div>

        {/* 内容区域 */}
        {currentStep === 0 && (
          <div className="edit-queue-trigger-modal-content">
            {renderStep0Content()}
          </div>
        )}

        {currentStep === 1 && (
          <div className="edit-queue-trigger-modal-body">
            <div className="edit-queue-trigger-modal-left">
              <div className="edit-queue-trigger-modal-content">
                {renderStep1LeftContent()}
              </div>
            </div>
            {showRightPanel && (
              <div className="edit-queue-trigger-modal-right">
                <div className="edit-queue-trigger-modal-content">
                  {renderStep1RightContent()}
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === 2 && (
          <div className="edit-queue-trigger-modal-content">
            {renderStep2Content()}
          </div>
        )}

        {/* 底部按钮 */}
        <div className="edit-queue-trigger-modal-footer">
          <Button theme="light" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          {currentStep > 0 && (
            <Button onClick={handlePrev}>
              {t('queueTrigger.createModal.prevStep')}
            </Button>
          )}
          {currentStep < 2 ? (
            <Button theme="solid" type="primary" onClick={handleNext}>
              {t('queueTrigger.createModal.nextStep')}
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

export default EditQueueTriggerModal;
