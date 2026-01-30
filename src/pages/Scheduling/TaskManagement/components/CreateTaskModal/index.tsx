import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Form,
  Button,
  Toast,
  Typography,
  Select,
  Input,
  InputNumber,
  Switch,
  RadioGroup,
  Radio,
} from '@douyinfe/semi-ui';
import type {
  LYProcessActiveVersionResponse,
  LYExecutionTemplateResponse,
  LYProcessParameterDefinition,
  ExecutionTargetType,
  TaskPriority,
} from '@/api';
import './index.less';

const { Text } = Typography;

interface CreateTaskModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  initialTemplate?: LYExecutionTemplateResponse | null;
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
  },
  {
    process_id: 'proc-002',
    process_name: '财务报销审批',
    version_id: 'ver-002',
    version: 'v2.0.0',
    parameters: [
      { name: 'department', type: 'TEXT', required: true, description: '部门名称' },
      { name: 'approvalCredential', type: 'CREDENTIAL', required: true, description: '审批凭据' },
    ],
  },
  {
    process_id: 'proc-003',
    process_name: '人事入职流程',
    version_id: 'ver-003',
    version: 'v1.0.0',
    parameters: [],
  },
];

// Mock 执行目标
const mockBotGroups = [
  { id: 'group-001', name: '订单处理组', onlineCount: 3, totalCount: 5 },
  { id: 'group-002', name: '财务审批组', onlineCount: 2, totalCount: 3 },
  { id: 'group-003', name: '人事管理组', onlineCount: 1, totalCount: 2 },
];

const mockBots = [
  { id: 'bot-001', name: 'RPA-BOT-001', groupId: 'group-001', status: 'ONLINE' },
  { id: 'bot-002', name: 'RPA-BOT-002', groupId: 'group-001', status: 'OFFLINE' },
  { id: 'bot-003', name: 'RPA-BOT-003', groupId: 'group-002', status: 'ONLINE' },
  { id: 'bot-004', name: 'RPA-BOT-004', groupId: null, status: 'ONLINE' },
  { id: 'bot-005', name: 'RPA-BOT-005', groupId: null, status: 'OFFLINE' },
];

// Mock 个人凭据
const mockCredentials = [
  { id: 'cred-001', name: '系统管理员凭据' },
  { id: 'cred-002', name: 'API访问凭据' },
  { id: 'cred-003', name: '数据库凭据' },
];

// Mock 执行模板
const mockTemplates: LYExecutionTemplateResponse[] = [
  {
    template_id: 'tpl-001',
    template_name: '订单处理默认模板',
    description: '使用默认配置处理订单',
    process_id: 'proc-001',
    process_name: '订单自动处理',
    execution_target_type: 'BOT_GROUP',
    execution_target_id: 'group-001',
    execution_target_name: '订单处理组',
    priority: 'MEDIUM',
    max_execution_duration: 3600,
    validity_days: 7,
    enable_recording: true,
    input_parameters: { targetUrl: 'https://orders.example.com', maxCount: 50 },
  },
];

const CreateTaskModal = ({ visible, onCancel, onSuccess, initialTemplate }: CreateTaskModalProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // 表单状态
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
  const [selectedProcess, setSelectedProcess] = useState<LYProcessActiveVersionResponse | null>(null);
  const [targetType, setTargetType] = useState<ExecutionTargetType | null>(null);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [maxDuration, setMaxDuration] = useState<number>(3600);
  const [validityDays, setValidityDays] = useState<number>(7);
  const [enableRecording, setEnableRecording] = useState<boolean>(false);
  const [parameterValues, setParameterValues] = useState<Record<string, unknown>>({});

  // 目标类型选项
  const targetTypeOptions = useMemo(() => [
    { value: 'BOT_GROUP', label: t('task.createModal.targetType.botGroup') },
    { value: 'BOT_IN_GROUP', label: t('task.createModal.targetType.botInGroup') },
    { value: 'UNGROUPED_BOT', label: t('task.createModal.targetType.ungroupedBot') },
  ], [t]);

  // 优先级选项
  const priorityOptions = useMemo(() => [
    { value: 'HIGH', label: t('task.priority.high') },
    { value: 'MEDIUM', label: t('task.priority.medium') },
    { value: 'LOW', label: t('task.priority.low') },
    { value: 'MANUAL_QUEUE_BREAKER', label: t('task.priority.manualQueueBreaker') },
  ], [t]);

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
    // BOT_IN_GROUP - 需要先选择组
    return mockBots
      .filter((b) => b.groupId)
      .map((b) => ({
        value: b.id,
        label: `${b.name} (${b.status === 'ONLINE' ? '在线' : '离线'})`,
      }));
  }, [targetType]);

  // 重置表单
  useEffect(() => {
    if (!visible) {
      setSelectedTemplateId(null);
      setSelectedProcessId(null);
      setSelectedProcess(null);
      setTargetType(null);
      setSelectedTargetId(null);
      setPriority('MEDIUM');
      setMaxDuration(3600);
      setValidityDays(7);
      setEnableRecording(false);
      setParameterValues({});
      setIsInitialized(false);
    }
  }, [visible]);

  // 初始化时根据 initialTemplate 预填表单
  useEffect(() => {
    if (visible && initialTemplate && !isInitialized) {
      setSelectedTemplateId(initialTemplate.template_id);
      // 选择流程
      const process = mockProcesses.find((p) => p.process_id === initialTemplate.process_id);
      if (process) {
        setSelectedProcessId(process.process_id);
        setSelectedProcess(process);
      }
      // 设置其他字段
      setTargetType(initialTemplate.execution_target_type);
      setSelectedTargetId(initialTemplate.execution_target_id);
      setPriority(initialTemplate.priority);
      setMaxDuration(initialTemplate.max_execution_duration);
      setValidityDays(initialTemplate.validity_days);
      setEnableRecording(initialTemplate.enable_recording);
      if (initialTemplate.input_parameters) {
        setParameterValues(initialTemplate.input_parameters);
      }
      setIsInitialized(true);
    }
  }, [visible, initialTemplate, isInitialized]);

  // 选择流程
  const handleProcessChange = (processId: string) => {
    setSelectedProcessId(processId);
    const process = mockProcesses.find((p) => p.process_id === processId);
    setSelectedProcess(process || null);
    // 初始化参数默认值
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

  // 选择模板
  const handleTemplateChange = (templateId: string | null) => {
    setSelectedTemplateId(templateId);
    if (templateId) {
      const template = mockTemplates.find((t) => t.template_id === templateId);
      if (template) {
        handleProcessChange(template.process_id);
        setTargetType(template.execution_target_type);
        setSelectedTargetId(template.execution_target_id);
        setPriority(template.priority);
        setMaxDuration(template.max_execution_duration);
        setValidityDays(template.validity_days);
        setEnableRecording(template.enable_recording);
        if (template.input_parameters) {
          setParameterValues(template.input_parameters);
        }
      }
    }
  };

  // 更新参数值
  const handleParameterChange = (name: string, value: unknown) => {
    setParameterValues((prev) => ({ ...prev, [name]: value }));
  };

  // 渲染参数输入
  const renderParameterInput = (param: LYProcessParameterDefinition) => {
    const value = parameterValues[param.name];

    switch (param.type) {
      case 'TEXT':
        return (
          <div className="create-task-modal-param-item" key={param.name}>
            <div className="semi-form-field-label">
              <label>{param.name}{param.required ? ' *' : ''}</label>
            </div>
            <Input
              placeholder={param.description || `请输入 ${param.name}`}
              value={value as string || ''}
              onChange={(v) => handleParameterChange(param.name, v)}
            />
          </div>
        );
      case 'NUMBER':
        return (
          <div className="create-task-modal-param-item" key={param.name}>
            <div className="semi-form-field-label">
              <label>{param.name}{param.required ? ' *' : ''}</label>
            </div>
            <InputNumber
              placeholder={param.description || `请输入 ${param.name}`}
              value={value as number}
              onChange={(v) => handleParameterChange(param.name, v)}
              style={{ width: '100%' }}
            />
          </div>
        );
      case 'BOOLEAN':
        return (
          <div className="create-task-modal-param-item" key={param.name}>
            <Text>{param.name}{param.required ? ' *' : ''}</Text>
            <div style={{ marginTop: 8 }}>
              <Switch
                checked={value as boolean || false}
                onChange={(v) => handleParameterChange(param.name, v)}
              />
              {param.description && (
                <Text type="tertiary" size="small" style={{ marginLeft: 8 }}>
                  {param.description}
                </Text>
              )}
            </div>
          </div>
        );
      case 'CREDENTIAL':
        return (
          <div className="create-task-modal-param-item" key={param.name}>
            <div className="semi-form-field-label">
              <label>{param.name}{param.required ? ' *' : ''}</label>
            </div>
            <Select
              placeholder={t('task.createModal.credentialPlaceholder')}
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

  // 提交
  const handleSubmit = async () => {
    // 验证必填项
    if (!selectedProcessId) {
      Toast.warning(t('task.validation.processRequired'));
      return;
    }
    if (!targetType) {
      Toast.warning(t('task.validation.targetTypeRequired'));
      return;
    }
    if (!selectedTargetId) {
      Toast.warning(t('task.validation.targetRequired'));
      return;
    }
    if (maxDuration < 60 || maxDuration > 86400) {
      Toast.warning(t('task.validation.maxDurationRange'));
      return;
    }
    if (validityDays < 1 || validityDays > 30) {
      Toast.warning(t('task.validation.validityDaysRange'));
      return;
    }

    // 验证必填参数
    if (selectedProcess) {
      for (const param of selectedProcess.parameters) {
        if (param.required && (parameterValues[param.name] === undefined || parameterValues[param.name] === '')) {
          Toast.warning(t('task.validation.parameterRequired', { name: param.name }));
          return;
        }
      }
    }

    setLoading(true);
    try {
      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      console.log('创建任务:', {
        process_id: selectedProcessId,
        execution_target_type: targetType,
        execution_target_id: selectedTargetId,
        priority,
        max_execution_duration: maxDuration,
        validity_days: validityDays,
        enable_recording: enableRecording,
        input_parameters: parameterValues,
      });

      Toast.success(t('task.createModal.success'));
      onSuccess();
    } catch (error) {
      console.error('创建任务失败:', error);
      Toast.error(t('task.createModal.error'));
    } finally {
      setLoading(false);
    }
  };

  // 判断是否有参数需要填写
  const hasParameters = selectedProcess && selectedProcess.parameters.length > 0;

  return (
    <Modal
      className="create-task-modal"
      title={t('task.createModal.title')}
      visible={visible}
      onCancel={onCancel}
      footer={null}
      closeOnEsc
      maskClosable={false}
      width={900}
      centered
    >
      <div className="create-task-modal-form">
        <div className="create-task-modal-body">
          {/* 左侧：基本配置 */}
          <div className="create-task-modal-left">
            <div className="create-task-modal-content">
              {/* 模板选择 */}
              <div className="create-task-modal-section">
                <div className="create-task-modal-section-title">
                  {t('task.createModal.selectTemplate')}
                </div>
                <div className="create-task-modal-field">
                  <Select
                    placeholder={t('task.createModal.templatePlaceholder')}
                    value={selectedTemplateId}
                    onChange={(v) => handleTemplateChange(v as string | null)}
                    optionList={mockTemplates.map((tpl) => ({ value: tpl.template_id, label: tpl.template_name }))}
                    showClear
                    filter
                    className="create-task-modal-select-full"
                  />
                </div>
              </div>

              {/* 流程配置 */}
              <div className="create-task-modal-section">
                <div className="create-task-modal-section-title">
                  {t('task.createModal.processSection')}
                </div>
                <div className="create-task-modal-field">
                  <div className="semi-form-field-label-text">{t('task.createModal.processLabel')}</div>
                  <Select
                    placeholder={t('task.createModal.processPlaceholder')}
                    value={selectedProcessId}
                    onChange={(v) => handleProcessChange(v as string)}
                    optionList={mockProcesses.map((p) => ({ value: p.process_id, label: p.process_name }))}
                    filter
                    className="create-task-modal-select-full"
                  />
                </div>
              </div>

              {/* 执行目标 */}
              <div className="create-task-modal-section">
                <div className="create-task-modal-section-title">
                  {t('task.createModal.targetSection')}
                </div>
                <div className="create-task-modal-field">
                  <div className="semi-form-field-label-text">{t('task.createModal.targetTypeLabel')}</div>
                  <RadioGroup
                    value={targetType}
                    onChange={(e) => {
                      setTargetType(e.target.value as ExecutionTargetType);
                      setSelectedTargetId(null);
                    }}
                    direction="horizontal"
                  >
                    <Radio value="BOT_GROUP">{t('task.createModal.targetType.botGroup')}</Radio>
                    <Radio value="BOT_IN_GROUP">{t('task.createModal.targetType.botInGroup')}</Radio>
                    <Radio value="UNGROUPED_BOT">{t('task.createModal.targetType.ungroupedBot')}</Radio>
                  </RadioGroup>
                </div>
                {targetType && (
                  <div className="create-task-modal-field">
                    <div className="semi-form-field-label-text">{t('task.createModal.selectTarget')}</div>
                    <Select
                      placeholder={t('task.createModal.targetPlaceholder')}
                      value={selectedTargetId}
                      onChange={(v) => setSelectedTargetId(v as string)}
                      optionList={targetOptions}
                      className="create-task-modal-select-full"
                    />
                  </div>
                )}
              </div>

              {/* 执行设置 */}
              <div className="create-task-modal-section">
                <div className="create-task-modal-section-title">
                  {t('task.createModal.executionSection')}
                </div>
                <div className="create-task-modal-field">
                  <div className="semi-form-field-label-text">{t('task.createModal.priorityLabel')}</div>
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
                <div className="create-task-modal-field">
                  <div className="semi-form-field-label-text">{t('task.createModal.maxDurationLabel')}</div>
                  <InputNumber
                    value={maxDuration}
                    onChange={(v) => setMaxDuration(v as number)}
                    min={60}
                    max={86400}
                    suffix={t('common.seconds')}
                    style={{ width: 150 }}
                  />
                </div>
                <div className="create-task-modal-field">
                  <div className="semi-form-field-label-text">{t('task.createModal.validityDaysLabel')}</div>
                  <InputNumber
                    value={validityDays}
                    onChange={(v) => setValidityDays(v as number)}
                    min={1}
                    max={30}
                    suffix={t('common.days')}
                    style={{ width: 150 }}
                  />
                </div>
                <div className="create-task-modal-field">
                  <div className="semi-form-field-label-text">{t('task.createModal.enableRecordingLabel')}</div>
                  <Switch
                    checked={enableRecording}
                    onChange={(v) => setEnableRecording(v)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 右侧：流程输入（仅当有参数时显示） */}
          {hasParameters && (
            <div className="create-task-modal-right">
              <div className="create-task-modal-content">
                <div className="create-task-modal-section">
                  <div className="create-task-modal-section-title">
                    {t('task.createModal.parametersSection')}
                  </div>
                  <div className="create-task-modal-params">
                    {selectedProcess.parameters.map((param) => renderParameterInput(param))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="create-task-modal-footer">
          <Button theme="solid" type="primary" loading={loading} onClick={handleSubmit}>
            {t('common.confirm')}
          </Button>
          <Button theme="light" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CreateTaskModal;
