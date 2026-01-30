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
  Tooltip,
  Tag,
} from '@douyinfe/semi-ui';
import { IconHelpCircle } from '@douyinfe/semi-icons';
import type {
  LYExecutionTemplateResponse,
  LYProcessActiveVersionResponse,
  LYProcessParameterDefinition,
  ExecutionTargetType,
  TaskPriority,
} from '@/api';
import './index.less';

const { Text } = Typography;

interface EditTemplateModalProps {
  visible: boolean;
  template: LYExecutionTemplateResponse | null;
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
      { name: 'approvalCredential', type: 'CREDENTIAL', required: true, description: '审批凭据' },
    ],
    output_parameters: [
      { name: 'approvalStatus', type: 'TEXT', description: '审批状态' },
      { name: 'approvedAmount', type: 'NUMBER', description: '审批通过金额' },
    ],
  },
  {
    process_id: 'proc-003',
    process_name: '人事入职流程',
    version_id: 'ver-003',
    version: 'v1.0.0',
    parameters: [],
    output_parameters: [
      { name: 'employeeId', type: 'TEXT', description: '新员工ID' },
    ],
  },
  {
    process_id: 'proc-004',
    process_name: '采购申请流程',
    version_id: 'ver-004',
    version: 'v1.1.0',
    parameters: [
      { name: 'supplier', type: 'TEXT', required: true, description: '供应商名称' },
    ],
    output_parameters: [],
  },
  {
    process_id: 'proc-005',
    process_name: '合同审批流程',
    version_id: 'ver-005',
    version: 'v2.1.0',
    parameters: [],
    output_parameters: [
      { name: 'contractId', type: 'TEXT', description: '合同编号' },
      { name: 'signedDate', type: 'TEXT', description: '签署日期' },
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

const EditTemplateModal = ({ visible, template, onCancel, onSuccess }: EditTemplateModalProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  // 表单状态
  const [templateName, setTemplateName] = useState('');
  const [description, setDescription] = useState('');
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
    { value: 'BOT_GROUP', label: t('template.targetType.botGroup') },
    { value: 'BOT_IN_GROUP', label: t('template.targetType.botInGroup') },
    { value: 'UNGROUPED_BOT', label: t('template.targetType.ungroupedBot') },
  ], [t]);

  // 优先级选项
  const priorityOptions = useMemo(() => [
    { value: 'HIGH', label: t('task.priority.high') },
    { value: 'MEDIUM', label: t('task.priority.medium') },
    { value: 'LOW', label: t('task.priority.low') },
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
    // BOT_IN_GROUP
    return mockBots
      .filter((b) => b.groupId)
      .map((b) => ({
        value: b.id,
        label: `${b.name} (${b.status === 'ONLINE' ? '在线' : '离线'})`,
      }));
  }, [targetType]);

  // 判断是否有参数
  const hasParameters = selectedProcess && selectedProcess.parameters.length > 0;
  const hasOutputParameters = selectedProcess && selectedProcess.output_parameters && selectedProcess.output_parameters.length > 0;
  const showRightPanel = hasParameters || hasOutputParameters;

  // 初始化表单
  useEffect(() => {
    if (visible && template) {
      setTemplateName(template.template_name || '');
      setDescription(template.description || '');
      setSelectedProcessId(template.process_id);
      setTargetType(template.execution_target_type);
      setSelectedTargetId(template.execution_target_id);
      setPriority(template.priority);
      setMaxDuration(template.max_execution_duration);
      setValidityDays(template.validity_days);
      setEnableRecording(template.enable_recording);
      setParameterValues(template.input_parameters || {});

      // 设置选中的流程
      const process = mockProcesses.find((p) => p.process_id === template.process_id);
      setSelectedProcess(process || null);
    }
  }, [visible, template]);

  // 重置表单
  useEffect(() => {
    if (!visible) {
      setTemplateName('');
      setDescription('');
      setSelectedProcessId(null);
      setSelectedProcess(null);
      setTargetType(null);
      setSelectedTargetId(null);
      setPriority('MEDIUM');
      setMaxDuration(3600);
      setValidityDays(7);
      setEnableRecording(false);
      setParameterValues({});
    }
  }, [visible]);

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

  // 更新参数值
  const handleParameterChange = (name: string, value: unknown) => {
    setParameterValues((prev) => ({ ...prev, [name]: value }));
  };

  // 渲染参数输入
  const renderParameterInput = (param: LYProcessParameterDefinition) => {
    const value = parameterValues[param.name];

    const renderLabel = () => (
      <div className="edit-template-modal-param-label">
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
          <div className="edit-template-modal-param-item" key={param.name}>
            <div className="semi-form-field-label">
              {renderLabel()}
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
          <div className="edit-template-modal-param-item" key={param.name}>
            <div className="semi-form-field-label">
              {renderLabel()}
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
          <div className="edit-template-modal-param-item" key={param.name}>
            {renderLabel()}
            <div style={{ marginTop: 8 }}>
              <Switch
                checked={value as boolean || false}
                onChange={(v) => handleParameterChange(param.name, v)}
              />
            </div>
          </div>
        );
      case 'CREDENTIAL':
        return (
          <div className="edit-template-modal-param-item" key={param.name}>
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

  // 提交
  const handleSubmit = async () => {
    // 验证必填项
    if (!templateName.trim()) {
      Toast.warning(t('template.validation.nameRequired'));
      return;
    }
    if (templateName.length > 255) {
      Toast.warning(t('template.validation.nameLengthError'));
      return;
    }
    if (!selectedProcessId) {
      Toast.warning(t('template.validation.processRequired'));
      return;
    }
    if (!targetType) {
      Toast.warning(t('template.validation.targetTypeRequired'));
      return;
    }
    if (!selectedTargetId) {
      Toast.warning(t('template.validation.targetRequired'));
      return;
    }
    if (maxDuration < 60 || maxDuration > 86400) {
      Toast.warning(t('template.validation.maxDurationRange'));
      return;
    }
    if (validityDays < 1 || validityDays > 30) {
      Toast.warning(t('template.validation.validityDaysRange'));
      return;
    }

    // 验证必填参数
    if (selectedProcess) {
      for (const param of selectedProcess.parameters) {
        if (param.required && (parameterValues[param.name] === undefined || parameterValues[param.name] === '')) {
          Toast.warning(t('template.validation.parameterRequired', { name: param.name }));
          return;
        }
      }
    }

    setLoading(true);
    try {
      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      console.log('更新执行模板:', {
        template_id: template?.template_id,
        template_name: templateName.trim(),
        description: description.trim() || null,
        process_id: selectedProcessId,
        execution_target_type: targetType,
        execution_target_id: selectedTargetId,
        priority,
        max_execution_duration: maxDuration,
        validity_days: validityDays,
        enable_recording: enableRecording,
        input_parameters: parameterValues,
      });

      Toast.success(t('template.editModal.success'));
      onSuccess();
    } catch (error) {
      console.error('更新执行模板失败:', error);
      Toast.error(t('template.editModal.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      className="edit-template-modal"
      title={t('template.editModal.title')}
      visible={visible}
      onCancel={onCancel}
      footer={null}
      closeOnEsc
      maskClosable={false}
      width={showRightPanel ? 900 : 520}
      centered
    >
      <div className="edit-template-modal-form">
        <div className="edit-template-modal-body">
          {/* 左侧：基本配置 */}
          <div className="edit-template-modal-left">
            <div className="edit-template-modal-content">
              {/* 基本信息 */}
              <div className="edit-template-modal-section">
                <div className="edit-template-modal-section-title">
                  {t('template.createModal.basicInfo')}
                </div>
                <div className="semi-form-field-label">
                  <label>{t('template.fields.name')} *</label>
                </div>
                <Input
                  placeholder={t('template.fields.namePlaceholder')}
                  value={templateName}
                  onChange={setTemplateName}
                  maxLength={255}
                  showClear
                />

                <div className="semi-form-field-label" style={{ marginTop: 16 }}>
                  <label>{t('template.fields.description')}</label>
                </div>
                <Input
                  placeholder={t('template.fields.descriptionPlaceholder')}
                  value={description}
                  onChange={setDescription}
                  maxLength={1000}
                />
              </div>

              {/* 流程选择 */}
              <div className="edit-template-modal-section">
                <div className="edit-template-modal-section-title">
                  {t('template.createModal.processSection')}
                </div>
                <div className="semi-form-field-label">
                  <label>{t('template.fields.process')} *</label>
                </div>
                <Select
                  placeholder={t('template.fields.processPlaceholder')}
                  value={selectedProcessId}
                  onChange={(v) => handleProcessChange(v as string)}
                  optionList={mockProcesses.map((p) => ({ value: p.process_id, label: p.process_name }))}
                  filter
                  style={{ width: '100%' }}
                />
                {selectedProcess && (
                  <div className="edit-template-modal-version-info">
                    <Text type="tertiary" size="small">
                      {t('template.createModal.versionInfo')}: {selectedProcess.version}
                    </Text>
                  </div>
                )}
              </div>

              {/* 执行目标 */}
              <div className="edit-template-modal-section">
                <div className="edit-template-modal-section-title">
                  {t('template.createModal.targetSection')}
                </div>
                <div className="semi-form-field-label">
                  <label>{t('template.fields.targetType')} *</label>
                </div>
                <Select
                  placeholder={t('template.fields.targetTypePlaceholder')}
                  value={targetType}
                  onChange={(v) => {
                    setTargetType(v as ExecutionTargetType);
                    setSelectedTargetId(null);
                  }}
                  optionList={targetTypeOptions}
                  style={{ width: '100%' }}
                />
                {targetType && (
                  <>
                    <div className="semi-form-field-label" style={{ marginTop: 16 }}>
                      <label>{t('template.fields.target')} *</label>
                    </div>
                    <Select
                      placeholder={t('template.fields.targetPlaceholder')}
                      value={selectedTargetId}
                      onChange={(v) => setSelectedTargetId(v as string)}
                      optionList={targetOptions}
                      style={{ width: '100%' }}
                    />
                  </>
                )}
              </div>

              {/* 任务设置 */}
              <div className="edit-template-modal-section">
                <div className="edit-template-modal-section-title">
                  {t('template.createModal.settingsSection')}
                </div>
                <div className="semi-form-field-label">
                  <label>{t('template.fields.priority')}</label>
                </div>
                <Select
                  value={priority}
                  onChange={(v) => setPriority(v as TaskPriority)}
                  optionList={priorityOptions}
                  style={{ width: '100%' }}
                />
                
                <div className="semi-form-field-label" style={{ marginTop: 16 }}>
                  <label>{t('template.fields.maxDuration')}</label>
                </div>
                <InputNumber
                  value={maxDuration}
                  onChange={(v) => setMaxDuration(v as number)}
                  min={60}
                  max={86400}
                  style={{ width: '100%' }}
                />
                <Text type="tertiary" size="small">{t('template.fields.maxDurationHint')}</Text>
                
                <div className="semi-form-field-label" style={{ marginTop: 16 }}>
                  <label>{t('template.fields.validityDays')}</label>
                </div>
                <InputNumber
                  value={validityDays}
                  onChange={(v) => setValidityDays(v as number)}
                  min={1}
                  max={30}
                  style={{ width: '100%' }}
                />
                <Text type="tertiary" size="small">{t('template.fields.validityDaysHint')}</Text>
                
                <div className="edit-template-modal-param-item" style={{ marginTop: 16 }}>
                  <Text>{t('template.fields.enableRecording')}</Text>
                  <div style={{ marginTop: 8 }}>
                    <Switch checked={enableRecording} onChange={setEnableRecording} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧：流程参数 */}
          {showRightPanel && (
            <div className="edit-template-modal-right">
              <div className="edit-template-modal-content">
                {/* 流程输入参数 */}
                {hasParameters && (
                  <div className="edit-template-modal-section">
                    <div className="edit-template-modal-section-title">
                      {t('template.createModal.parametersSection')}
                    </div>
                    <div className="edit-template-modal-params">
                      {selectedProcess.parameters.map((param) => renderParameterInput(param))}
                    </div>
                  </div>
                )}

                {/* 流程输出参数 */}
                {hasOutputParameters && (
                  <div className="edit-template-modal-section">
                    <div className="edit-template-modal-section-title">
                      {t('template.createModal.outputParametersSection')}
                    </div>
                    <div className="edit-template-modal-output-params">
                      {selectedProcess.output_parameters!.map((param) => (
                        <div className="edit-template-modal-output-param-item" key={param.name}>
                          <div className="edit-template-modal-output-param-name">
                            {param.name}
                            <Tag size="small" color="grey" style={{ marginLeft: 8 }}>
                              {param.type}
                            </Tag>
                          </div>
                          {param.description && (
                            <div className="edit-template-modal-output-param-desc">
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

        {/* 底部按钮 */}
        <div className="edit-template-modal-footer">
          <Button theme="light" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button
            theme="solid"
            type="primary"
            loading={loading}
            onClick={handleSubmit}
          >
            {t('common.save')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default EditTemplateModal;
