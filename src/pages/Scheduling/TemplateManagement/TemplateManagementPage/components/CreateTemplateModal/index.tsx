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
import BotTargetSelector from '@/components/BotTargetSelector';
import type {
  LYProcessActiveVersionResponse,
  LYProcessParameterDefinition,
  ExecutionTargetType,
  TaskPriority,
} from '@/api';
import './index.less';

const { Text } = Typography;

interface CreateTemplateModalProps {
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
    process_name: '采购申请流程',
    version_id: 'ver-004',
    version: 'v1.1.0',
    parameters: [
      { name: 'supplier', type: 'TEXT', required: true, description: '供应商名称' },
    ],
    output_parameters: [
      { name: 'purchaseOrderId', type: 'TEXT', description: '采购单号' },
      { name: 'estimatedDelivery', type: 'TEXT', description: '预计交付时间' },
    ],
  },
  {
    process_id: 'proc-005',
    process_name: '合同审批流程',
    version_id: 'ver-005',
    version: 'v2.1.0',
    parameters: [],
    output_parameters: [
      { name: 'contractStatus', type: 'TEXT', description: '合同状态' },
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

// 已存在的模板名称 (模拟)
const existingTemplateNames = ['订单处理默认模板', '财务审批快速模板'];

const CreateTemplateModal = ({ visible, onCancel, onSuccess }: CreateTemplateModalProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formApi, setFormApi] = useState<any>(null);
  const [selectedProcess, setSelectedProcess] = useState<LYProcessActiveVersionResponse | null>(null);
  const [targetType, setTargetType] = useState<ExecutionTargetType | null>(null);

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

  // 重置表单
  useEffect(() => {
    if (!visible) {
      formApi?.reset();
      setSelectedProcess(null);
      setTargetType(null);
    }
  }, [visible, formApi]);

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

  // 验证模板名称唯一性
  const validateTemplateName = useCallback((value: string) => {
    if (value && existingTemplateNames.includes(value.trim())) {
      return t('template.validation.nameExists');
    }
    return '';
  }, [t]);

  // 渲染参数输入
  const renderParameterInput = (param: LYProcessParameterDefinition) => {
    const renderLabel = () => (
      <div className="create-template-modal-param-label">
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
      ? [{ required: true, message: t('template.validation.parameterRequired', { name: param.name }) }]
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
          <div className="create-template-modal-param-item" key={param.name}>
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

  // 判断是否有参数需要填写
  const hasParameters = selectedProcess && selectedProcess.parameters.length > 0;
  // 判断是否有输出参数
  const hasOutputParameters = selectedProcess && selectedProcess.output_parameters && selectedProcess.output_parameters.length > 0;
  // 右侧是否需要显示
  const showRightPanel = hasParameters || hasOutputParameters;

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
      
      console.log('创建执行模板:', {
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

      Toast.success(t('template.createModal.success'));
      onSuccess();
    } catch (error) {
      console.error('创建执行模板失败:', error);
      Toast.error(t('template.createModal.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      className="create-template-modal"
      title={t('template.createModal.title')}
      visible={visible}
      onCancel={onCancel}
      footer={null}
      closeOnEsc
      maskClosable={false}
      width={showRightPanel ? 900 : 520}
      centered
    >
      <Form
        className="create-template-modal-form"
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
        <div className="create-template-modal-body">
          {/* 左侧：基本配置 */}
          <div className="create-template-modal-left">
            <div className="create-template-modal-content">
              {/* 基本信息 */}
              <div className="create-template-modal-section">
                <div className="create-template-modal-section-title">
                  {t('template.createModal.basicSection')}
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
                    { validator: (rule, value, callback) => {
                      const error = validateTemplateName(value);
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
                  label={t('template.fields.description')}
                  placeholder={t('template.fields.descriptionPlaceholder')}
                  maxCount={2000}
                  showClear
                  rows={3}
                />
              </div>

              {/* 流程配置 */}
              <div className="create-template-modal-section">
                <div className="create-template-modal-section-title">
                  {t('template.createModal.processSection')}
                </div>
                <Form.Select
                  field="processId"
                  label={t('template.fields.process')}
                  placeholder={t('template.fields.processPlaceholder')}
                  optionList={mockProcesses.map((p) => ({ value: p.process_id, label: p.process_name }))}
                  filter
                  className="create-template-modal-select-full"
                  rules={[
                    { required: true, message: t('template.validation.processRequired') },
                  ]}
                  onChange={(v) => handleProcessChange(v as string)}
                />
              </div>

              {/* 执行目标 */}
              <div className="create-template-modal-section">
                <div className="create-template-modal-section-title">
                  {t('template.createModal.targetSection')}
                </div>
                <Form.RadioGroup
                  field="targetType"
                  label={t('template.fields.targetType')}
                  direction="horizontal"
                  rules={[
                    { required: true, message: t('template.validation.targetTypeRequired') },
                  ]}
                  onChange={(e) => {
                    setTargetType(e.target.value as ExecutionTargetType);
                    formApi?.setValue('targetId', undefined);
                  }}
                >
                  <Form.Radio value="BOT_GROUP">{t('template.targetType.botGroup')}</Form.Radio>
                  <Form.Radio value="BOT_IN_GROUP">{t('template.targetType.botInGroup')}</Form.Radio>
                  <Form.Radio value="UNGROUPED_BOT">{t('template.targetType.ungroupedBot')}</Form.Radio>
                </Form.RadioGroup>
                {targetType && (
                  <div className="create-template-modal-field">
                    <div className="semi-form-field-label-text">{t('template.createModal.selectTarget')}</div>
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

              {/* 执行设置 */}
              <div className="create-template-modal-section">
                <div className="create-template-modal-section-title">
                  {t('template.createModal.executionSection')}
                </div>
                <Form.RadioGroup
                  field="priority"
                  label={t('template.fields.priority')}
                  direction="horizontal"
                >
                  <Form.Radio value="HIGH">{t('task.priority.high')}</Form.Radio>
                  <Form.Radio value="MEDIUM">{t('task.priority.medium')}</Form.Radio>
                  <Form.Radio value="LOW">{t('task.priority.low')}</Form.Radio>
                </Form.RadioGroup>
                <Form.InputNumber
                  field="maxDuration"
                  label={t('template.fields.maxDuration')}
                  min={60}
                  max={86400}
                  suffix={t('common.seconds')}
                  style={{ width: 150 }}
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
                  suffix={t('common.days')}
                  style={{ width: 150 }}
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
                <div className="create-template-modal-field">
                  <div className="semi-form-field-label-text">{t('template.fields.enableRecording')}</div>
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
            <div className="create-template-modal-right">
              <div className="create-template-modal-content">
                {/* 流程输入 */}
                {hasParameters && (
                  <div className="create-template-modal-section">
                    <div className="create-template-modal-section-title">
                      {t('template.createModal.parametersSection')}
                    </div>
                    <div className="create-template-modal-params">
                      {selectedProcess.parameters.map((param) => renderParameterInput(param))}
                    </div>
                  </div>
                )}

                {/* 流程输出（只读） */}
                {hasOutputParameters && (
                  <div className="create-template-modal-section">
                    <div className="create-template-modal-section-title">
                      {t('template.createModal.outputParametersSection')}
                    </div>
                    <div className="create-template-modal-output-params">
                      {selectedProcess.output_parameters!.map((param) => (
                        <div className="create-template-modal-output-param-item" key={param.name}>
                          <div className="create-template-modal-output-param-name">
                            {param.name}
                            <Tag size="small" color="grey" style={{ marginLeft: 8 }}>
                              {param.type}
                            </Tag>
                          </div>
                          {param.description && (
                            <div className="create-template-modal-output-param-desc">
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

        <div className="create-template-modal-footer">
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

export default CreateTemplateModal;
