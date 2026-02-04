import { useState, useEffect, useMemo } from 'react';
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
  Switch,
  InputNumber,
  Banner,
} from '@douyinfe/semi-ui';
import { IconHelpCircle, IconInbox } from '@douyinfe/semi-icons';
import BotTargetSelector from '@/components/BotTargetSelector';
import type {
  LYProcessActiveVersionResponse,
  LYProcessParameterDefinition,
  ExecutionTargetType,
  TaskPriority,
} from '@/api';
import './index.less';

const { Text } = Typography;

interface CreateQueueTriggerModalProps {
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
];

// Mock 工作日历
const mockWorkCalendars = [
  { value: 'cal-001', label: '公司工作日历' },
  { value: 'cal-002', label: '银行工作日历' },
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

// 已存在的触发器名称 (模拟)
const existingTriggerNames = ['订单队列触发器', '审批队列触发器'];

const CreateQueueTriggerModal = ({ visible, onCancel, onSuccess }: CreateQueueTriggerModalProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formApi, setFormApi] = useState<any>(null);

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

  // 重置表单
  useEffect(() => {
    if (!visible) {
      setCurrentStep(0);
      formApi?.reset();
      setSelectedProcess(null);
      setTargetType(null);
      setEnableWorkCalendar(false);
      setMinEffectiveMessages(1);
      setEnablePeriodicCheck(false);
    }
  }, [visible, formApi]);

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

  // 验证模板名称唯一性
  const validateTriggerName = (value: string) => {
    if (value && existingTriggerNames.includes(value.trim())) {
      return t('queueTrigger.validation.nameExists');
    }
    return '';
  };

  // 渲染参数输入
  const renderParameterInput = (param: LYProcessParameterDefinition) => {
    const renderLabel = () => (
      <div className="create-queue-trigger-modal-param-label">
        <span>{param.name}</span>
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
          <div className="create-queue-trigger-modal-param-item" key={param.name}>
            <div className="semi-form-field-label">
              {renderLabel()}
            </div>
            <Form.Switch
              field={`param_${param.name}`}
              noLabel
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

      console.log('创建队列触发器:', {
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

      Toast.success(t('queueTrigger.createModal.success'));
      onSuccess();
    } catch (error) {
      console.error('创建队列触发器失败:', error);
      Toast.error(t('queueTrigger.createModal.error'));
    } finally {
      setLoading(false);
    }
  };

  // 渲染步骤0：基本信息
  const renderStep0Content = () => (
    <div className="create-queue-trigger-modal-section">
      <div className="create-queue-trigger-modal-section-title">{t('queueTrigger.createModal.basicSection')}</div>
      <Form.Input
        field="triggerName"
        label={t('queueTrigger.fields.name')}
        placeholder={t('queueTrigger.fields.namePlaceholder')}
        maxLength={255}
        showClear
        rules={[
          { required: true, message: t('queueTrigger.validation.nameRequired') },
          { max: 255, message: t('queueTrigger.validation.nameLengthError') },
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
        label={t('queueTrigger.fields.description')}
        placeholder={t('queueTrigger.fields.descriptionPlaceholder')}
        maxCount={2000}
        showClear
        rows={3}
      />
    </div>
  );

  // 渲染步骤1：任务配置
  const renderStep1Content = () => (
    <>
      <div className="create-queue-trigger-modal-section">
        <div className="create-queue-trigger-modal-section-title">{t('queueTrigger.createModal.processSection')}</div>
        <Form.Select
          field="processId"
          label={t('queueTrigger.fields.process')}
          placeholder={t('queueTrigger.fields.processPlaceholder')}
          optionList={mockProcesses.map((p) => ({ value: p.process_id, label: p.process_name }))}
          onChange={(value) => handleProcessChange(value as string)}
          rules={[{ required: true, message: t('queueTrigger.validation.processRequired') }]}
          style={{ width: '100%' }}
        />
      </div>

      <div className="create-queue-trigger-modal-section">
        <div className="create-queue-trigger-modal-section-title">{t('queueTrigger.createModal.targetSection')}</div>
        <Form.Select
          field="targetType"
          label={t('queueTrigger.fields.targetType')}
          placeholder={t('queueTrigger.fields.targetPlaceholder')}
          optionList={[
            { value: 'BOT_GROUP', label: t('queueTrigger.targetType.botGroup') },
            { value: 'BOT_IN_GROUP', label: t('queueTrigger.targetType.botInGroup') },
            { value: 'UNGROUPED_BOT', label: t('queueTrigger.targetType.ungroupedBot') },
          ]}
          onChange={(value) => setTargetType(value as ExecutionTargetType)}
          rules={[{ required: true, message: t('queueTrigger.validation.targetTypeRequired') }]}
          style={{ width: '100%' }}
        />
        {targetType && (
          <Form.Slot label={t('queueTrigger.createModal.selectTarget')}>
            <BotTargetSelector
              targetType={targetType}
              value={formApi?.getValue('targetId')}
              onChange={(value) => formApi?.setValue('targetId', value)}
            />
          </Form.Slot>
        )}
        <Form.Input field="targetId" noLabel style={{ display: 'none' }} />
      </div>

      <div className="create-queue-trigger-modal-section">
        <div className="create-queue-trigger-modal-section-title">{t('queueTrigger.createModal.executionSection')}</div>
        <Form.RadioGroup
          field="priority"
          label={t('queueTrigger.fields.priority')}
          initValue="MEDIUM"
          direction="horizontal"
        >
          <Form.Radio value="HIGH">{t('task.priority.high')}</Form.Radio>
          <Form.Radio value="MEDIUM">{t('task.priority.medium')}</Form.Radio>
          <Form.Radio value="LOW">{t('task.priority.low')}</Form.Radio>
        </Form.RadioGroup>
        <Form.InputNumber
          field="maxDuration"
          label={t('queueTrigger.fields.maxDuration')}
          initValue={3600}
          min={60}
          max={86400}
          suffix={t('queueTrigger.fields.maxDurationUnit')}
          extraText={t('queueTrigger.fields.maxDurationHint')}
          rules={[
            { required: true, message: t('queueTrigger.validation.maxDurationRange') },
            { type: 'number', min: 60, max: 86400, message: t('queueTrigger.validation.maxDurationRange') },
          ]}
          style={{ width: '100%' }}
        />
        <Form.InputNumber
          field="validityDays"
          label={t('queueTrigger.fields.validityDays')}
          initValue={7}
          min={1}
          max={30}
          suffix={t('queueTrigger.fields.validityDaysUnit')}
          extraText={t('queueTrigger.fields.validityDaysHint')}
          rules={[
            { required: true, message: t('queueTrigger.validation.validityDaysRange') },
            { type: 'number', min: 1, max: 30, message: t('queueTrigger.validation.validityDaysRange') },
          ]}
          style={{ width: '100%' }}
        />
        <Form.Switch
          field="enableRecording"
          label={t('queueTrigger.fields.enableRecording')}
          initValue={false}
        />
      </div>
    </>
  );

  // 渲染步骤2：队列触发配置
  const renderStep2Content = () => (
    <>
      <div className="create-queue-trigger-modal-section">
        <div className="create-queue-trigger-modal-section-title">{t('queueTrigger.createModal.queueSection')}</div>
        
        {/* 触发器时区 */}
        <Form.Select
          field="timeZone"
          label={t('queueTrigger.fields.timeZone')}
          placeholder={t('queueTrigger.fields.timeZonePlaceholder')}
          initValue="Asia/Shanghai"
          optionList={timeZoneOptions}
          rules={[{ required: true, message: t('queueTrigger.validation.timeZoneRequired') }]}
          style={{ width: '100%' }}
        />

        {/* 启用工作日历 */}
        <div className="create-queue-trigger-modal-field-inline">
          <Form.Switch
            field="enableWorkCalendarSwitch"
            label={t('queueTrigger.fields.enableWorkCalendar')}
            onChange={(value) => setEnableWorkCalendar(value)}
          />
        </div>
        {enableWorkCalendar && (
          <>
            <Form.Select
              field="workCalendarId"
              label={t('queueTrigger.fields.workCalendar')}
              placeholder={t('queueTrigger.fields.workCalendarPlaceholder')}
              optionList={mockWorkCalendars}
              rules={[{ required: true, message: t('queueTrigger.validation.workCalendarRequired') }]}
              style={{ width: '100%' }}
            />
            <Form.RadioGroup
              field="executionType"
              label={t('queueTrigger.fields.executionType')}
              initValue="WORKDAY"
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
            disabled: q.monitored,
          }))}
          extraText={t('queueTrigger.fields.monitoredQueueHint')}
          rules={[{ required: true, message: t('queueTrigger.validation.queueRequired') }]}
          style={{ width: '100%' }}
          renderOptionItem={(renderProps) => {
            const { disabled, selected, label, ...rest } = renderProps;
            return (
              <Select.Option {...rest} disabled={disabled} selected={selected}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <span>{label}</span>
                  {disabled && <Tag size="small" color="orange">已被监控</Tag>}
                </div>
              </Select.Option>
            );
          }}
        />

        {/* 触发最少有效消息数 */}
        <Form.InputNumber
          field="minEffectiveMessages"
          label={t('queueTrigger.fields.minEffectiveMessages')}
          initValue={1}
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
            <div className="create-queue-trigger-modal-field-inline">
              <Form.Switch
                field="enablePeriodicCheckSwitch"
                label={t('queueTrigger.fields.enablePeriodicCheck')}
                onChange={(value) => setEnablePeriodicCheck(value)}
              />
            </div>
            {enablePeriodicCheck && (
              <Banner
                type="info"
                description={t('queueTrigger.fields.enablePeriodicCheckHint')}
                className="create-queue-trigger-modal-banner"
              />
            )}
            {enablePeriodicCheck && (
              <Form.InputNumber
                field="periodicCheckInterval"
                label={t('queueTrigger.fields.periodicCheckInterval')}
                initValue={30}
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
          initValue={10}
          min={1}
          extraText={t('queueTrigger.fields.messagesPerTriggerHint')}
          rules={[
            { required: true, message: t('queueTrigger.validation.messagesPerTriggerRange') },
            { type: 'number', min: 1, message: t('queueTrigger.validation.messagesPerTriggerRange') },
          ]}
          style={{ width: '100%' }}
        />
      </div>
    </>
  );

  // 渲染右侧参数面板
  const renderRightPanel = () => {
    if (!showRightPanel) return null;

    return (
      <div className="create-queue-trigger-modal-right-panel">
        {hasParameters && (
          <div className="create-queue-trigger-modal-section">
            <div className="create-queue-trigger-modal-section-title">{t('queueTrigger.createModal.parameterSection')}</div>
            {selectedProcess?.parameters.map(renderParameterInput)}
          </div>
        )}
        {hasOutputParameters && (
          <div className="create-queue-trigger-modal-section">
            <div className="create-queue-trigger-modal-section-title">输出参数</div>
            <div className="create-queue-trigger-modal-output-params">
              {selectedProcess?.output_parameters?.map((param) => (
                <div key={param.name} className="create-queue-trigger-modal-output-param">
                  <span className="create-queue-trigger-modal-output-param-name">{param.name}</span>
                  <Tag size="small" color="grey">{param.type}</Tag>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // 计算弹窗宽度
  const modalWidth = showRightPanel ? 900 : 520;

  return (
    <Modal
      title={t('queueTrigger.createModal.title')}
      visible={visible}
      onCancel={onCancel}
      footer={null}
      width={modalWidth}
      className="create-queue-trigger-modal"
      closeOnEsc={false}
      maskClosable={false}
    >
      {/* 步骤条 */}
      <Steps current={currentStep} size="small" className="create-queue-trigger-modal-steps">
        <Steps.Step title={t('queueTrigger.createModal.steps.basicInfo')} />
        <Steps.Step title={t('queueTrigger.createModal.steps.taskConfig')} />
        <Steps.Step title={t('queueTrigger.createModal.steps.queueConfig')} />
      </Steps>

      {/* 表单区域 */}
      <div className={`create-queue-trigger-modal-content ${showRightPanel ? 'has-right-panel' : ''}`}>
        <Form
          getFormApi={(api) => setFormApi(api)}
          labelPosition="top"
          className="create-queue-trigger-modal-form"
        >
          <div className="create-queue-trigger-modal-left-panel">
            {currentStep === 0 && renderStep0Content()}
            {currentStep === 1 && renderStep1Content()}
            {currentStep === 2 && renderStep2Content()}
          </div>
          {renderRightPanel()}
        </Form>
      </div>

      {/* 底部按钮 */}
      <div className="create-queue-trigger-modal-footer">
        <Button onClick={onCancel}>{t('common.cancel')}</Button>
        <div className="create-queue-trigger-modal-footer-right">
          {currentStep > 0 && (
            <Button onClick={handlePrev}>{t('queueTrigger.createModal.prevStep')}</Button>
          )}
          {currentStep < 2 ? (
            <Button theme="solid" onClick={handleNext}>
              {t('queueTrigger.createModal.nextStep')}
            </Button>
          ) : (
            <Button theme="solid" loading={loading} onClick={handleSubmit}>
              {t('common.create')}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default CreateQueueTriggerModal;
