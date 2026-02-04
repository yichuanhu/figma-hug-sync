import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Form,
  Button,
  Toast,
  Typography,
  Tooltip,
  Tag,
} from '@douyinfe/semi-ui';
import { IconHelpCircle } from '@douyinfe/semi-icons';
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
    output_parameters: [
      { name: 'processedCount', type: 'NUMBER', description: '已处理订单数量' },
      { name: 'successRate', type: 'NUMBER', description: '处理成功率' },
      { name: 'errorList', type: 'TEXT', description: '错误订单列表' },
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
    output_parameters: [
      { name: 'approvalResult', type: 'BOOLEAN', description: '审批结果' },
      { name: 'approvalNote', type: 'TEXT', description: '审批意见' },
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
    process_name: '数据采集流程',
    version_id: 'ver-004',
    version: 'v1.5.0',
    parameters: [
      { name: 'sourceUrl', type: 'TEXT', required: true, description: '数据源URL' },
      { name: 'pageLimit', type: 'NUMBER', required: false, default_value: 10, description: '采集页数限制' },
    ],
    output_parameters: [
      { name: 'collectedCount', type: 'NUMBER', description: '采集数据条数' },
      { name: 'dataFilePath', type: 'TEXT', description: '数据文件路径' },
      { name: 'isComplete', type: 'BOOLEAN', description: '是否采集完成' },
    ],
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
  const [formApi, setFormApi] = useState<any>(null);
  const [selectedProcess, setSelectedProcess] = useState<LYProcessActiveVersionResponse | null>(null);
  const [targetType, setTargetType] = useState<ExecutionTargetType | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

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
      formApi?.reset();
      setSelectedProcess(null);
      setTargetType(null);
      setIsInitialized(false);
    }
  }, [visible, formApi]);

  // 初始化时根据 initialTemplate 预填表单
  useEffect(() => {
    if (visible && initialTemplate && formApi && !isInitialized) {
      // 选择流程
      const process = mockProcesses.find((p) => p.process_id === initialTemplate.process_id);
      if (process) {
        setSelectedProcess(process);
      }
      setTargetType(initialTemplate.execution_target_type);
      
      // 设置表单值
      formApi.setValues({
        templateId: initialTemplate.template_id,
        processId: initialTemplate.process_id,
        targetType: initialTemplate.execution_target_type,
        targetId: initialTemplate.execution_target_id,
        priority: initialTemplate.priority,
        maxDuration: initialTemplate.max_execution_duration,
        validityDays: initialTemplate.validity_days,
        enableRecording: initialTemplate.enable_recording,
        ...Object.fromEntries(
          Object.entries(initialTemplate.input_parameters || {}).map(([k, v]) => [`param_${k}`, v])
        ),
      });
      setIsInitialized(true);
    }
  }, [visible, initialTemplate, formApi, isInitialized]);

  // 选择流程
  const handleProcessChange = useCallback((processId: string) => {
    const process = mockProcesses.find((p) => p.process_id === processId);
    setSelectedProcess(process || null);
    // 初始化参数默认值
    if (process && formApi) {
      process.parameters.forEach((param) => {
        if (param.default_value !== undefined && param.default_value !== null) {
          formApi.setValue(`param_${param.name}`, param.default_value);
        }
      });
    }
  }, [formApi]);

  // 选择模板
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

  // 渲染参数输入
  const renderParameterInput = (param: LYProcessParameterDefinition) => {
    const renderLabel = () => (
      <div className="create-task-modal-param-label">
        <span>{param.name}{param.required ? '' : ''}</span>
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
      ? [{ required: true, message: t('task.validation.parameterRequired', { name: param.name }) }]
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
          <div className="create-task-modal-param-item" key={param.name}>
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
            placeholder={t('task.createModal.credentialPlaceholder')}
            optionList={mockCredentials.map((c) => ({ value: c.id, label: c.name }))}
            style={{ width: '100%' }}
            rules={rules}
          />
        );
      default:
        return null;
    }
  };

  // 提交
  const handleSubmit = async (values: Record<string, unknown>) => {
    setLoading(true);
    try {
      // 提取参数值
      const parameterValues: Record<string, unknown> = {};
      if (selectedProcess) {
        selectedProcess.parameters.forEach((param) => {
          parameterValues[param.name] = values[`param_${param.name}`];
        });
      }

      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      console.log('创建任务:', {
        process_id: values.processId,
        execution_target_type: values.targetType,
        execution_target_id: values.targetId,
        priority: values.priority,
        max_execution_duration: values.maxDuration,
        validity_days: values.validityDays,
        enable_recording: values.enableRecording,
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
  // 判断是否有输出参数
  const hasOutputParameters = selectedProcess && selectedProcess.output_parameters && selectedProcess.output_parameters.length > 0;
  // 右侧是否需要显示
  const showRightPanel = hasParameters || hasOutputParameters;

  return (
    <Modal
      className="create-task-modal"
      title={t('task.createModal.title')}
      visible={visible}
      onCancel={onCancel}
      footer={null}
      closeOnEsc
      maskClosable={false}
      width={showRightPanel ? 900 : 520}
      centered
    >
      <Form
        className="create-task-modal-form"
        labelPosition="top"
        getFormApi={setFormApi}
        onSubmit={handleSubmit}
        initValues={{
          priority: 'MEDIUM',
          maxDuration: 3600,
          validityDays: 7,
          enableRecording: false,
        }}
      >
        <div className="create-task-modal-body">
          {/* 左侧：基本配置 */}
          <div className="create-task-modal-left">
            <div className="create-task-modal-content">
              {/* 模板选择 */}
              <div className="create-task-modal-section">
                <div className="create-task-modal-section-title">
                  {t('task.createModal.selectTemplate')}
                </div>
                <Form.Select
                  field="templateId"
                  noLabel
                  placeholder={t('task.createModal.templatePlaceholder')}
                  optionList={mockTemplates.map((tpl) => ({ value: tpl.template_id, label: tpl.template_name }))}
                  showClear
                  filter
                  className="create-task-modal-select-full"
                  onChange={(v) => handleTemplateChange(v as string | null)}
                />
              </div>

              {/* 流程配置 */}
              <div className="create-task-modal-section">
                <div className="create-task-modal-section-title">
                  {t('task.createModal.processSection')}
                </div>
                <Form.Select
                  field="processId"
                  label={t('task.createModal.processLabel')}
                  placeholder={t('task.createModal.processPlaceholder')}
                  optionList={mockProcesses.map((p) => ({ value: p.process_id, label: p.process_name }))}
                  filter
                  className="create-task-modal-select-full"
                  rules={[
                    { required: true, message: t('task.validation.processRequired') },
                  ]}
                  onChange={(v) => handleProcessChange(v as string)}
                />
              </div>

              {/* 执行目标 */}
              <div className="create-task-modal-section">
                <div className="create-task-modal-section-title">
                  {t('task.createModal.targetSection')}
                </div>
                <Form.RadioGroup
                  field="targetType"
                  label={t('task.createModal.targetTypeLabel')}
                  direction="horizontal"
                  rules={[
                    { required: true, message: t('task.validation.targetTypeRequired') },
                  ]}
                  onChange={(e) => {
                    setTargetType(e.target.value as ExecutionTargetType);
                    formApi?.setValue('targetId', undefined);
                  }}
                >
                  <Form.Radio value="BOT_GROUP">{t('task.createModal.targetType.botGroup')}</Form.Radio>
                  <Form.Radio value="BOT_IN_GROUP">{t('task.createModal.targetType.botInGroup')}</Form.Radio>
                  <Form.Radio value="UNGROUPED_BOT">{t('task.createModal.targetType.ungroupedBot')}</Form.Radio>
                </Form.RadioGroup>
                {targetType && (
                  <Form.Select
                    field="targetId"
                    label={t('task.createModal.selectTarget')}
                    placeholder={t('task.createModal.targetPlaceholder')}
                    optionList={targetOptions}
                    className="create-task-modal-select-full"
                    rules={[
                      { required: true, message: t('task.validation.targetRequired') },
                    ]}
                  />
                )}
              </div>

              {/* 执行设置 */}
              <div className="create-task-modal-section">
                <div className="create-task-modal-section-title">
                  {t('task.createModal.executionSection')}
                </div>
                <Form.RadioGroup
                  field="priority"
                  label={t('task.createModal.priorityLabel')}
                  direction="horizontal"
                >
                  <Form.Radio value="HIGH">{t('task.priority.high')}</Form.Radio>
                  <Form.Radio value="MEDIUM">{t('task.priority.medium')}</Form.Radio>
                  <Form.Radio value="LOW">{t('task.priority.low')}</Form.Radio>
                </Form.RadioGroup>
                <Form.InputNumber
                  field="maxDuration"
                  label={t('task.createModal.maxDurationLabel')}
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
                  label={t('task.createModal.validityDaysLabel')}
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
                <div className="create-task-modal-field">
                  <div className="semi-form-field-label-text">{t('task.createModal.enableRecordingLabel')}</div>
                  <Form.Switch
                    field="enableRecording"
                    noLabel
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 右侧：流程输入和流程输出 */}
          {showRightPanel && (
            <div className="create-task-modal-right">
              <div className="create-task-modal-content">
                {/* 流程输入 */}
                {hasParameters && (
                  <div className="create-task-modal-section">
                    <div className="create-task-modal-section-title">
                      {t('task.createModal.parametersSection')}
                    </div>
                    <div className="create-task-modal-params">
                      {selectedProcess.parameters.map((param) => renderParameterInput(param))}
                    </div>
                  </div>
                )}

                {/* 流程输出（只读） */}
                {hasOutputParameters && (
                  <div className="create-task-modal-section">
                    <div className="create-task-modal-section-title">
                      {t('task.createModal.outputParametersSection')}
                    </div>
                    <div className="create-task-modal-output-params">
                      {selectedProcess.output_parameters!.map((param) => (
                        <div className="create-task-modal-output-param-item" key={param.name}>
                          <div className="create-task-modal-output-param-name">
                            {param.name}
                            <Tag size="small" color="grey" style={{ marginLeft: 8 }}>
                              {param.type}
                            </Tag>
                          </div>
                          {param.description && (
                            <div className="create-task-modal-output-param-desc">
                              {param.description}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="create-task-modal-footer">
          <Button theme="light" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button htmlType="submit" theme="solid" type="primary" loading={loading}>
            {t('common.create')}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default CreateTaskModal;
