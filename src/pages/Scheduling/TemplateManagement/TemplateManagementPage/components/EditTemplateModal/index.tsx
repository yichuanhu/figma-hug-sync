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
import { IconHelpCircleStroked } from '@douyinfe/semi-icons';
import BotTargetSelector from '@/components/BotTargetSelector';
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

// Mock ProcessList
const mockProcesses: LYProcessActiveVersionResponse[] = [
  {
    process_id: 'proc-001',
    process_name: 'Auto Order Processing',
    version_id: 'ver-001',
    version: 'v1.2.0',
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
    parameters: [
      { name: 'department', type: 'TEXT', required: true, description: 'Department name' },
      { name: 'approvalCredential', type: 'CREDENTIAL', required: true, description: '审批Credential' },
    ],
    output_parameters: [
      { name: 'approvalStatus', type: 'TEXT', description: '审批Status' },
      { name: 'approvedAmount', type: 'NUMBER', description: '审批通过金额' },
    ],
  },
  {
    process_id: 'proc-003',
    process_name: 'Employee Onboarding Flow',
    version_id: 'ver-003',
    version: 'v1.0.0',
    parameters: [],
    output_parameters: [
      { name: 'employeeId', type: 'TEXT', description: '新员工ID' },
    ],
  },
  {
    process_id: 'proc-004',
    process_name: 'Data Collection Flow',
    version_id: 'ver-004',
    version: 'v1.5.0',
    parameters: [
      { name: 'sourceUrl', type: 'TEXT', required: true, description: 'Data source URL' },
      { name: 'pageLimit', type: 'NUMBER', required: false, default_value: 10, description: 'Page limit for collection' },
    ],
    output_parameters: [
      { name: 'collectedCount', type: 'NUMBER', description: 'Collected data count' },
      { name: 'dataFilePath', type: 'TEXT', description: 'DataFile路径' },
      { name: 'isComplete', type: 'BOOLEAN', description: '是否采集Done' },
    ],
  },
];

// Mock Execution target
const mockBotGroups = [
  { id: 'group-001', name: 'Order Processing Group', onlineCount: 3, totalCount: 5 },
  { id: 'group-002', name: 'Finance Approval Group', onlineCount: 2, totalCount: 3 },
  { id: 'group-003', name: 'HR Management Group', onlineCount: 1, totalCount: 2 },
];

const mockBots = [
  { id: 'bot-001', name: 'RPA-BOT-001', groupId: 'group-001', status: 'ONLINE' },
  { id: 'bot-002', name: 'RPA-BOT-002', groupId: 'group-001', status: 'OFFLINE' },
  { id: 'bot-003', name: 'RPA-BOT-003', groupId: 'group-002', status: 'ONLINE' },
  { id: 'bot-004', name: 'RPA-BOT-004', groupId: null, status: 'ONLINE' },
  { id: 'bot-005', name: 'RPA-BOT-005', groupId: null, status: 'OFFLINE' },
];

// Mock 个人Credential
const mockCredentials = [
  { id: 'cred-001', name: 'System Admin Credentials' },
  { id: 'cred-002', name: 'API Access Credentials' },
  { id: 'cred-003', name: 'Data库Credential' },
];

const EditTemplateModal = ({ visible, template, onCancel, onSuccess }: EditTemplateModalProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formApi, setFormApi] = useState<any>(null);
  const [selectedProcess, setSelectedProcess] = useState<LYProcessActiveVersionResponse | null>(null);
  const [targetType, setTargetType] = useState<ExecutionTargetType | null>(null);

  // Execution target选项
  const targetOptions = useMemo(() => {
    if (targetType === 'BOT_GROUP') {
      return mockBotGroups.map((g) => ({
        value: g.id,
        label: `${g.name} (${g.onlineCount}/${g.totalCount} Online)`,
      }));
    }
    if (targetType === 'UNGROUPED_BOT') {
      return mockBots
        .filter((b) => !b.groupId)
        .map((b) => ({
          value: b.id,
          label: `${b.name} (${b.status === 'ONLINE' ? 'Online' : 'Offline'})`,
        }));
    }
    // BOT_IN_GROUP
    return mockBots
      .filter((b) => b.groupId)
      .map((b) => ({
        value: b.id,
        label: `${b.name} (${b.status === 'ONLINE' ? 'Online' : 'Offline'})`,
      }));
  }, [targetType]);

  // 初始化表单
  useEffect(() => {
    if (visible && template && formApi) {
      const process = mockProcesses.find((p) => p.process_id === template.process_id);
      setSelectedProcess(process || null);
      setTargetType(template.execution_target_type);
      
      // Settings表单值
      formApi.setValues({
        templateName: template.template_name || '',
        description: template.description || '',
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
  }, [visible, template, formApi]);

  // 重置表单
  useEffect(() => {
    if (!visible) {
      formApi?.reset();
      setSelectedProcess(null);
      setTargetType(null);
    }
  }, [visible, formApi]);

  // 选择Process
  const handleProcessChange = useCallback((processId: string) => {
    const process = mockProcesses.find((p) => p.process_id === processId);
    setSelectedProcess(process || null);
    
    // 初始化ParameterDefault值
    if (process && formApi) {
      process.parameters.forEach((param) => {
        if (param.default_value !== undefined && param.default_value !== null) {
          formApi.setValue(`param_${param.name}`, param.default_value);
        }
      });
    }
  }, [formApi]);

  // 渲染Parameter输入
  const renderParameterInput = (param: LYProcessParameterDefinition) => {
    const renderLabel = () => (
      <div className="edit-template-modal-param-label">
        <span>{param.name}{param.required ? '' : ''}</span>
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
      ? [{ required: true, message: t('template.validation.parameterRequired', { name: param.name }) }]
      : [];

    switch (param.type) {
      case 'TEXT':
        return (
          <Form.Input
            key={param.name}
            field={`param_${param.name}`}
            label={renderLabel()}
            placeholder={param.description || `Please enter ${param.name}`}
            rules={rules}
          />
        );
      case 'NUMBER':
        return (
          <Form.InputNumber
            key={param.name}
            field={`param_${param.name}`}
            label={renderLabel()}
            placeholder={param.description || `Please enter ${param.name}`}
            style={{ width: '100%' }}
            rules={rules}
          />
        );
      case 'BOOLEAN':
        return (
          <div className="edit-template-modal-param-item" key={param.name}>
            {renderLabel()}
            <div style={{ marginTop: 8 }}>
              <Form.Switch
                field={`param_${param.name}`}
                noLabel
                size="small"
              />
            </div>
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

  // 判断是否有Parameter
  const hasParameters = selectedProcess && selectedProcess.parameters.length > 0;
  const hasOutputParameters = selectedProcess && selectedProcess.output_parameters && selectedProcess.output_parameters.length > 0;
  const showRightPanel = hasParameters || hasOutputParameters;

  // Submit
  const handleSubmit = async (values: Record<string, unknown>) => {
    setLoading(true);
    try {
      // 提取参Number
      const parameterValues: Record<string, unknown> = {};
      if (selectedProcess) {
        selectedProcess.parameters.forEach((param) => {
          parameterValues[param.name] = values[`param_${param.name}`];
        });
      }

      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      console.log('UpdateExecuteTemplate:', {
        template_id: template?.template_id,
        template_name: (values.templateName as string).trim(),
        description: (values.description as string)?.trim() || null,
        process_id: values.processId,
        execution_target_type: values.targetType,
        execution_target_id: values.targetId,
        priority: values.priority,
        max_execution_duration: values.maxDuration,
        validity_days: values.validityDays,
        enable_recording: values.enableRecording,
        input_parameters: parameterValues,
      });

      Toast.success(t('template.editModal.success'));
      onSuccess();
    } catch (error) {
      console.error('UpdateExecuteTemplateFailed:', error);
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
      <Form
        className="edit-template-modal-form"
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
        <div className="edit-template-modal-body">
          {/* Left: 基本Config */}
          <div className="edit-template-modal-left">
            <div className="edit-template-modal-content">
              {/* Basic Info */}
              <div className="edit-template-modal-section">
                <div className="edit-template-modal-section-title">
                  {t('template.createModal.basicInfo')}
                </div>
                <Form.Input
                  field="templateName"
                  label={t('template.fields.name')}
                  placeholder={t('template.fields.namePlaceholder')}
                  maxLength={255}
                  showClear
                  rules={[
                    { required: true, message: t('template.validation.nameRequired') },
                    { max: 255, message: t('template.validation.nameLengthError') },
                  ]}
                />
                <Form.TextArea
                  field="description"
                  label={t('template.fields.description')}
                  placeholder={t('template.fields.descriptionPlaceholder')}
                  maxCount={2000}
                  showClear
                  rows={3}
                />
              </div>

              {/* Process选择 */}
              <div className="edit-template-modal-section">
                <div className="edit-template-modal-section-title">
                  {t('template.createModal.processSection')}
                </div>
                <Form.Select
                  field="processId"
                  label={t('template.fields.process')}
                  placeholder={t('template.fields.processPlaceholder')}
                  optionList={mockProcesses.map((p) => ({ value: p.process_id, label: p.process_name }))}
                  filter
                  style={{ width: '100%' }}
                  rules={[
                    { required: true, message: t('template.validation.processRequired') },
                  ]}
                  onChange={(v) => handleProcessChange(v as string)}
                />
                {selectedProcess && (
                  <div className="edit-template-modal-version-info">
                    <Text type="tertiary" size="small">
                      {t('template.createModal.versionInfo')}: {selectedProcess.version}
                    </Text>
                  </div>
                )}
              </div>

              {/* Execution target */}
              <div className="edit-template-modal-section">
                <div className="edit-template-modal-section-title">
                  {t('template.createModal.targetSection')}
                </div>
                <Form.Select
                  field="targetType"
                  label={t('template.fields.targetType')}
                  placeholder={t('template.fields.targetTypePlaceholder')}
                  optionList={[
                    { value: 'BOT_GROUP', label: t('template.targetType.botGroup') },
                    { value: 'BOT_IN_GROUP', label: t('template.targetType.botInGroup') },
                    { value: 'UNGROUPED_BOT', label: t('template.targetType.ungroupedBot') },
                  ]}
                  style={{ width: '100%' }}
                  rules={[
                    { required: true, message: t('template.validation.targetTypeRequired') },
                  ]}
                  onChange={(v) => {
                    setTargetType(v as ExecutionTargetType);
                    formApi?.setValue('targetId', undefined);
                  }}
                />
                {targetType && (
                  <div className="edit-template-modal-field">
                    <div className="semi-form-field-label-text">{t('template.fields.target')}</div>
                    <BotTargetSelector
                      targetType={targetType}
                      value={formApi?.getValue('targetId')}
                      onChange={(v) => formApi?.setValue('targetId', v)}
                      placeholder={t('template.fields.targetPlaceholder')}
                    />
                    <Form.Input
                      field="targetId"
                      noLabel
                      style={{ display: 'none' }}
                      rules={[
                        { required: true, message: t('template.validation.targetRequired') },
                      ]}
                    />
                  </div>
                )}
              </div>

              {/* 任务Settings */}
              <div className="edit-template-modal-section">
                <div className="edit-template-modal-section-title">
                  {t('template.createModal.settingsSection')}
                </div>
                <Form.Select
                  field="priority"
                  label={t('template.fields.priority')}
                  optionList={[
                    { value: 'HIGH', label: t('task.priority.high') },
                    { value: 'MEDIUM', label: t('task.priority.medium') },
                    { value: 'LOW', label: t('task.priority.low') },
                  ]}
                  style={{ width: '100%' }}
                />
                <Form.InputNumber
                  field="maxDuration"
                  label={t('template.fields.maxDuration')}
                  min={60}
                  max={86400}
                  style={{ width: '100%' }}
                  extraText={t('template.fields.maxDurationHint')}
                  rules={[
                    { required: true, message: t('template.validation.maxDurationRequired') },
                    { validator: (rule, value, callback) => {
                      if (value < 60 || value > 86400) {
                        callback(t('template.validation.maxDurationRange'));
                        return false;
                      }
                      callback();
                      return true;
                    }},
                  ]}
                />
                <Form.InputNumber
                  field="validityDays"
                  label={t('template.fields.validityDays')}
                  min={1}
                  max={30}
                  style={{ width: '100%' }}
                  extraText={t('template.fields.validityDaysHint')}
                  rules={[
                    { required: true, message: t('template.validation.validityDaysRequired') },
                    { validator: (rule, value, callback) => {
                      if (value < 1 || value > 30) {
                        callback(t('template.validation.validityDaysRange'));
                        return false;
                      }
                      callback();
                      return true;
                    }},
                  ]}
                />
                <div className="edit-template-modal-param-item" style={{ marginTop: 16 }}>
                  <Text>{t('template.fields.enableRecording')}</Text>
                  <div style={{ marginTop: 8 }}>
                    <Form.Switch field="enableRecording" noLabel size="small" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: ProcessParameter */}
          {showRightPanel && (
            <div className="edit-template-modal-right">
              <div className="edit-template-modal-content">
                {/* ProcessInput parameters */}
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

                {/* Process输出Parameter */}
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

        {/* Footer buttons */}
        <div className="edit-template-modal-footer">
          <Button theme="light" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button htmlType="submit" theme="solid" type="primary" loading={loading}>
            {t('common.save')}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default EditTemplateModal;
