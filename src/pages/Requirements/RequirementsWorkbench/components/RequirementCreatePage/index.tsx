import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Typography,
  Steps,
  Button,
  Form,
  Toast,
  Modal,
  useFormState,
} from '@douyinfe/semi-ui';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Select, InputNumber } from '@douyinfe/semi-ui';
import DepartmentSearchSelect from '@/components/DepartmentSearchSelect';
import OwnerSearchSelect from '@/components/OwnerSearchSelect';
import { MOCK_CURRENT_USER } from '@/mocks/departmentData';
import {
  createRequirement,
  getActiveScheme,
} from '../../mockData';
import type {
  SchemeField,
  SchemeFieldDependsOn,
} from '../../types';
import SchemeFieldRenderer from '../SchemeFieldRenderer';
import './index.less';

const { Title, Text } = Typography;

const STEP_FIELDS: Array<string[]> = [
  // Step 0 基础信息
  ['title', 'department', 'owner', 'priority'],
  // Step 1 岗位与执行成本（全部非必填，无需校验字段）
  [],
  // Step 2 详情字段会动态收集
  [],
];

/** 动态 scheme 字段渲染器（与 Modal 内一致） */
const SchemeFieldsRenderer = ({
  fields,
  costConfig,
}: {
  fields: SchemeField[];
  costConfig?: import('../../types').CostConfig;
}) => {
  const formState = useFormState();
  const values = (formState.values ?? {}) as Record<string, unknown>;

  const matchDep = (dep: SchemeFieldDependsOn): boolean => {
    const current = values[dep.field];
    const target = dep.value;
    switch (dep.operator) {
      case 'eq': return current === target;
      case 'ne': return current !== target;
      case 'in': return Array.isArray(target) && (target as Array<string | number>).includes(current as string | number);
      case 'not_in': return Array.isArray(target) && !(target as Array<string | number>).includes(current as string | number);
      case 'gt': return Number(current) > Number(target);
      case 'lt': return Number(current) < Number(target);
      case 'gte': return Number(current) >= Number(target);
      case 'lte': return Number(current) <= Number(target);
      default: return true;
    }
  };

  return (
    <>
      {fields.map((f) => {
        if (f.depends_on && !matchDep(f.depends_on)) return null;
        return <SchemeFieldRenderer key={f.key} field={f} costConfig={costConfig} />;
      })}
    </>
  );
};

const RequirementCreatePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [formApi, setFormApi] = useState<any>(null);
  const [departmentValue, setDepartmentValue] = useState<string | undefined>(undefined);
  const [ownerId, setOwnerId] = useState<string>(MOCK_CURRENT_USER.id);
  const [dirty, setDirty] = useState(false);
  // 岗位成本列表：可同时录入多个 {岗位级别, 成本}
  const [positionCosts, setPositionCosts] = useState<Array<{ level?: string; cost?: number }>>([
    { level: undefined, cost: undefined },
  ]);

  const updatePositionCost = (idx: number, patch: Partial<{ level: string; cost: number }>) => {
    setPositionCosts((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
    setDirty(true);
  };
  const addPositionCost = () => {
    setPositionCosts((prev) => [...prev, { level: undefined, cost: undefined }]);
    setDirty(true);
  };
  const removePositionCost = (idx: number) => {
    setPositionCosts((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
    setDirty(true);
  };

  const activeScheme = useMemo(() => getActiveScheme(), []);

  const priorityOptions = useMemo(
    () => [
      { value: 'HIGH', label: t('requirements.priority.high') },
      { value: 'MEDIUM', label: t('requirements.priority.medium') },
      { value: 'LOW', label: t('requirements.priority.low') },
    ],
    [t],
  );

  const positionLevelOptions = useMemo(() => [
    { value: 'JUNIOR', label: '初级' },
    { value: 'INTERMEDIATE', label: '中级' },
    { value: 'SENIOR', label: '高级' },
    { value: 'EXPERT', label: '专家' },
  ], []);

  const executionFrequencyOptions = useMemo(() => [
    { value: 'DAILY', label: '每天' },
    { value: 'WEEKLY', label: '每周' },
    { value: 'MONTHLY', label: '每月' },
    { value: 'QUARTERLY', label: '每季度' },
    { value: 'YEARLY', label: '每年' },
  ], []);

  const OPTIONAL_FORM_KEYS = ['execution_frequency', 'single_duration'] as const;

  const baseInitialValues = { priority: 'MEDIUM' as const };

  const handleBack = () => {
    if (dirty) {
      Modal.confirm({
        title: '确认离开？',
        content: '当前已填写的内容将不会保存。',
        okText: '离开',
        cancelText: '继续编辑',
        okButtonProps: { type: 'danger' },
        onOk: () => navigate('/requirements/list'),
      });
      return;
    }
    navigate('/requirements/list');
  };

  const validateCurrentStep = async (isFinal = false): Promise<boolean> => {
    if (!formApi) return true;
    const fields = STEP_FIELDS[currentStep];
    try {
      if (isFinal) {
        // 最终提交：校验全部字段（含模版自定义必填）
        await formApi.validate();
      } else if (fields.length > 0) {
        await formApi.validate(fields);
      }
      // 自定义 Slot 字段（部门 / 归属人）
      if (currentStep === 0) {
        if (!departmentValue) {
          Toast.warning(t('requirements.form.departmentRequired'));
          return false;
        }
        if (!ownerId) {
          Toast.warning(t('common.ownerRequired'));
          return false;
        }
      }
      return true;
    } catch {
      return false;
    }
  };

  const handleNext = async () => {
    const ok = await validateCurrentStep();
    if (!ok) return;
    setCurrentStep((s) => Math.min(2, s + 1));
  };

  const handlePrev = () => setCurrentStep((s) => Math.max(0, s - 1));

  const handleSubmit = async () => {
    const ok = await validateCurrentStep(true);
    if (!ok) return;
    const values = (formApi?.getValues?.() ?? {}) as Record<string, unknown>;
    const systemKeys = new Set(['title', 'department', 'priority']);
    const form_data: Record<string, unknown> = {};
    activeScheme?.custom_fields.forEach((f) => {
      if (values[f.key] !== undefined) form_data[f.key] = values[f.key];
    });
    OPTIONAL_FORM_KEYS.forEach((k) => {
      if (values[k] !== undefined) form_data[k] = values[k];
    });
    // 多岗位级别与成本（仅保留至少填写了一项的行）
    const cleanedPositionCosts = positionCosts
      .filter((r) => r.level !== undefined || (typeof r.cost === 'number' && !Number.isNaN(r.cost)))
      .map((r) => ({ level: r.level, cost: r.cost }));
    if (cleanedPositionCosts.length > 0) {
      form_data.position_costs = cleanedPositionCosts;
    }
    const submitValues = { ...values, form_data };
    Object.keys(form_data).forEach((k) => {
      if (!systemKeys.has(k)) delete (submitValues as Record<string, unknown>)[k];
    });

    setSubmitting(true);
    try {
      await createRequirement(submitValues);
      Toast.success(t('requirements.form.createSuccess'));
      navigate('/requirements/list');
    } catch {
      Toast.error(t('requirements.form.submitError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="requirement-create-page">
      <div className="requirement-create-page-header">
        <Button
          icon={<ArrowLeft size={16} strokeWidth={2} />}
          theme="borderless"
          type="tertiary"
          className="back-btn"
          onClick={handleBack}
        />
        <Title heading={3} className="title">
          {t('requirements.form.createTitle')}
        </Title>
      </div>

      <div className="requirement-create-page-steps">
        <Steps current={currentStep} type="basic">
          <Steps.Step title="基础信息" description="标题、部门、归属人、优先级" />
          <Steps.Step title="岗位与执行成本" description="人力级别、成本、执行频率、时长" />
          <Steps.Step title="需求详情" description="按模版填写业务字段" />
        </Steps>
      </div>

      <div className="requirement-create-page-content">
        <div className="form-card">
          <Form
            labelPosition="top"
            initValues={baseInitialValues}
            getFormApi={setFormApi}
            onValueChange={() => setDirty(true)}
          >
            {/* Step 0: 基础信息 */}
            <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
              <Form.Input
                field="title"
                label={t('requirements.form.titleLabel')}
                placeholder={t('requirements.form.titlePlaceholder')}
                trigger={['blur', 'change']}
                rules={[
                  { required: true, message: t('requirements.form.titleRequired') },
                  { max: 200, message: t('requirements.form.titleMaxLength') },
                ]}
                maxLength={200}
                showClear
              />
              <Form.Slot label={{ text: t('common.owningDepartment'), required: true }}>
                <DepartmentSearchSelect
                  value={departmentValue}
                  onChange={(v) => {
                    setDepartmentValue(v);
                    formApi?.setValue?.('department', v);
                    setDirty(true);
                  }}
                  useNameAsValue
                  placeholder={t('requirements.form.departmentPlaceholder')}
                />
              </Form.Slot>
              <Form.Slot label={{ text: t('requirements.form.requirementOwnerLabel'), required: true }}>
                <OwnerSearchSelect
                  value={ownerId}
                  onChange={(v) => {
                    setOwnerId(v);
                    setDirty(true);
                  }}
                />
              </Form.Slot>
              <Form.Select
                field="priority"
                label={`${t('requirements.fields.priority')}${t('requirements.form.optionalSuffix')}`}
                placeholder={t('requirements.form.priorityPlaceholder')}
                optionList={priorityOptions}
                style={{ width: '100%' }}
              />
            </div>

            {/* Step 1: 岗位与执行成本（全部非必填，岗位支持多条） */}
            <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
              <Form.Slot label={{ text: '岗位级别与成本' }}>
                <div className="position-cost-list">
                  {positionCosts.map((row, idx) => (
                    <div key={idx} className="position-cost-row">
                      <Select
                        placeholder="请选择岗位级别"
                        value={row.level}
                        onChange={(v) => updatePositionCost(idx, { level: v as string })}
                        optionList={positionLevelOptions}
                        showClear
                        style={{ flex: 1 }}
                      />
                      <InputNumber
                        placeholder="请输入岗位成本"
                        value={row.cost}
                        onChange={(v) => updatePositionCost(idx, { cost: v as number })}
                        suffix={<span style={{ color: 'var(--semi-color-text-2)', paddingRight: 8, whiteSpace: 'nowrap' }}>元/人天</span>}
                        min={0}
                        precision={2}
                        hideButtons
                        style={{ flex: 1 }}
                      />
                      <Button
                        icon={<Trash2 size={16} strokeWidth={2} />}
                        theme="borderless"
                        type="tertiary"
                        disabled={positionCosts.length <= 1}
                        onClick={() => removePositionCost(idx)}
                      />
                    </div>
                  ))}
                  <Button
                    icon={<Plus size={16} strokeWidth={2} />}
                    theme="borderless"
                    type="primary"
                    onClick={addPositionCost}
                    style={{ alignSelf: 'flex-start', paddingLeft: 0 }}
                  >
                    添加岗位
                  </Button>
                </div>
              </Form.Slot>
              <Form.Select
                field="execution_frequency"
                label="执行频率"
                placeholder="请选择执行频率"
                optionList={executionFrequencyOptions}
                showClear
                style={{ width: '100%' }}
              />
              <Form.InputNumber
                field="single_duration"
                label="单次时长"
                placeholder="请输入"
                suffix={<span style={{ color: 'var(--semi-color-text-2)', paddingRight: 8, whiteSpace: 'nowrap' }}>分钟</span>}
                min={0}
                precision={0}
                hideButtons
                style={{ width: '100%' }}
              />
            </div>

            {/* Step 2: 需求详情（合并 scheme 自定义字段） */}
            <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
              {activeScheme && activeScheme.custom_fields.length > 0 ? (
                <SchemeFieldsRenderer
                  fields={activeScheme.custom_fields}
                  costConfig={activeScheme.cost_config}
                />
              ) : (
                <Text type="tertiary">当前模版未配置自定义字段，可直接提交。</Text>
              )}
            </div>
          </Form>
        </div>
      </div>

      <div className="requirement-create-page-footer">
        <Button onClick={handleBack} disabled={submitting}>
          {t('common.cancel')}
        </Button>
        {currentStep > 0 && (
          <Button onClick={handlePrev} disabled={submitting}>
            上一步
          </Button>
        )}
        {currentStep < 2 && (
          <Button theme="solid" type="primary" onClick={handleNext}>
            下一步
          </Button>
        )}
        {currentStep === 2 && (
          <Button theme="solid" type="primary" loading={submitting} onClick={handleSubmit}>
            {t('common.create')}
          </Button>
        )}
      </div>
    </div>
  );
};

export default RequirementCreatePage;
