import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Typography,
  Steps,
  Button,
  Form,
  Toast,
  Modal,
  Tag,
  Spin,
  useFormState,
} from '@douyinfe/semi-ui';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Select, InputNumber } from '@douyinfe/semi-ui';
import DepartmentSearchSelect from '@/components/DepartmentSearchSelect';
import OwnerSearchSelect from '@/components/OwnerSearchSelect';
import { MOCK_CURRENT_USER } from '@/mocks/departmentData';
import {
  createRequirement,
  updateRequirement,
  getRequirementById,
  getActiveScheme,
  getDraft,
  saveDraft,
  discardDraft,
  publishChange,
  deleteRequirement,
} from '../../mockData';
import { getActiveSchemes, getSchemeById } from '../../schemeConfig';
import type {
  SchemeField,
  SchemeFieldDependsOn,
  RequirementItem,
  RequirementDraft,
} from '../../types';
import { isPostProjectStatus } from '../../utils/fieldEditability';
import { isClassificationEditable } from '../../utils/classificationEditable';
import SchemeFieldRenderer from '../SchemeFieldRenderer';
import PublishChangePanel, { ERROR_MAP } from '../PublishChangePanel';
import ClassificationTagsField, {
  type ClassificationValueMap,
  type ClassificationLoadStatus,
} from '@/components/ClassificationTagsField';
import {
  assignEntityClassifications,
  removeEntityClassifications,
} from '@/mocks/classification/service';
import './index.less';

const { Title, Text } = Typography;

const STEP_FIELDS: Array<string[]> = [
  ['title', 'department', 'owner', 'priority'],
  [],
  [],
  [], // Step 3: 分类标签
  [], // Step 4 (post-project edit only): 发布变更
];

/** 动态 scheme 字段渲染器 */
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
  const { id: editId } = useParams<{ id?: string }>();
  const isEdit = !!editId;

  const [editLoading, setEditLoading] = useState(isEdit);
  const [editData, setEditData] = useState<RequirementItem | null>(null);
  const isPostProjectEdit = !!editData && isPostProjectStatus(editData.status);

  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [formApi, setFormApi] = useState<any>(null);
  const [departmentValue, setDepartmentValue] = useState<string | undefined>(undefined);
  const [ownerId, setOwnerId] = useState<string>(MOCK_CURRENT_USER.id);
  const dirtyRef = useRef(false);
  const [, forceTick] = useState(0);
  const setDirty = (v = true) => {
    dirtyRef.current = v;
    forceTick((k) => k + 1);
  };
  const [positionCosts, setPositionCosts] = useState<Array<{ level?: string; cost?: number }>>([
    { level: undefined, cost: undefined },
  ]);

  // 草稿 / 发布变更 状态
  const [hasDraft, setHasDraft] = useState(false);
  const [draftLoadedAt, setDraftLoadedAt] = useState<string | null>(null);
  const [publishReason, setPublishReason] = useState('');

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

  // ============ 分类标签状态 ============
  const [classificationValue, setClassificationValue] = useState<ClassificationValueMap>({});
  const [classificationStatus, setClassificationStatus] =
    useState<ClassificationLoadStatus>('loading');
  const [forceClsError, setForceClsError] = useState(false);
  const classificationEditable = isClassificationEditable(editData?.status);
  const handleClassificationChange = (next: ClassificationValueMap) => {
    setClassificationValue(next);
    setForceClsError(false);
    setDirty(true);
  };

  // 可选方案列表（多激活）
  const activeSchemes = useMemo(() => {
    const list = getActiveSchemes();
    // 编辑态：若需求绑定的方案不在 active 列表里，也加入下拉
    if (isEdit && editData?.scheme_id) {
      const bound = getSchemeById(editData.scheme_id);
      if (bound && !list.some((s) => s.id === bound.id)) {
        return [bound, ...list];
      }
    }
    return list;
  }, [isEdit, editData]);

  const [selectedSchemeId, setSelectedSchemeId] = useState<string | undefined>(() => {
    if (isEdit && editData?.scheme_id) return editData.scheme_id;
    const first = getActiveSchemes()[0];
    return first?.id;
  });

  useEffect(() => {
    if (isEdit && editData?.scheme_id) setSelectedSchemeId(editData.scheme_id);
  }, [isEdit, editData]);

  const activeScheme = useMemo(() => {
    if (selectedSchemeId) return getSchemeById(selectedSchemeId);
    return getActiveScheme();
  }, [selectedSchemeId]);

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

  const baseInitialValues = useMemo(() => {
    if (isEdit && editData) {
      const formData = (editData.form_data ?? {}) as Record<string, unknown>;
      return {
        title: editData.title,
        department: editData.owning_department_name,
        priority: editData.priority,
        ...formData,
      };
    }
    return { priority: 'MEDIUM' as const };
  }, [isEdit, editData]);

  /** 加载需求 + 草稿 */
  useEffect(() => {
    if (!isEdit || !editId) return;
    let cancelled = false;
    (async () => {
      try {
        const item = await getRequirementById(editId);
        if (cancelled) return;
        if (!item) {
          Toast.error('需求不存在或已被删除');
          navigate('/requirements/list', { replace: true });
          return;
        }
        setEditData(item);
        setDepartmentValue(item.owning_department_name);
        setOwnerId(item.owner_id || MOCK_CURRENT_USER.id);
        // 还原岗位成本：优先 form_data.position_costs 数组；否则尝试从 position_level/position_cost 兼容
        const fd = (item.form_data ?? {}) as Record<string, unknown>;
        const arr = fd.position_costs as Array<{ level?: string; cost?: number }> | undefined;
        if (Array.isArray(arr) && arr.length > 0) {
          setPositionCosts(arr.map((r) => ({ level: r?.level, cost: r?.cost })));
        } else if (fd.position_level || fd.position_cost) {
          setPositionCosts([{ level: fd.position_level as string | undefined, cost: fd.position_cost as number | undefined }]);
        }

        // 立项后：尝试加载草稿合并
        if (isPostProjectStatus(item.status)) {
          const draft = await getDraft(item.id);
          if (draft && !cancelled) {
            const patch = draft.patch ?? {};
            setHasDraft(true);
            setDraftLoadedAt(draft.updatedAt);
            // 草稿覆盖
            setTimeout(() => {
              if (patch.title !== undefined) formApi?.setValue?.('title', patch.title);
              if (patch.priority !== undefined) formApi?.setValue?.('priority', patch.priority);
              if (patch.form_data) {
                Object.entries(patch.form_data).forEach(([k, v]) => formApi?.setValue?.(k, v));
                const da = (patch.form_data as Record<string, unknown>).position_costs as
                  | Array<{ level?: string; cost?: number }>
                  | undefined;
                if (Array.isArray(da) && da.length > 0) {
                  setPositionCosts(da.map((r) => ({ level: r?.level, cost: r?.cost })));
                }
              }
            }, 0);
          }
        }
      } finally {
        if (!cancelled) setEditLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // formApi 在 setValue 时使用，初次为 null 时延迟到下一帧；不放入依赖避免重复加载
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, editId]);

  const handleBack = () => {
    if (dirtyRef.current) {
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

  const validateCurrentStep = async (): Promise<boolean> => {
    if (!formApi) return true;
    const fields = STEP_FIELDS[currentStep];
    try {
      if (fields.length > 0) await formApi.validate(fields);
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

  // 步骤布局：
  //   0 基础信息 / 1 岗位与执行成本 / 2 需求详情 / 3 分类标签
  //   立项后编辑追加 4 发布变更
  const totalSteps = isPostProjectEdit ? 5 : 4;
  const lastFormStep = 3; // 提交按钮所在步骤（分类标签）
  const isPublishStep = isPostProjectEdit && currentStep === 4;

  const handleNext = async () => {
    const ok = await validateCurrentStep();
    if (!ok) return;
    setCurrentStep((s) => Math.min(totalSteps - 1, s + 1));
  };

  const handlePrev = () => setCurrentStep((s) => Math.max(0, s - 1));

  const locateFirstError = (errorFields: string[]) => {
    const step0 = new Set(['title', 'department', 'owner', 'priority']);
    const step1 = new Set(['execution_frequency', 'single_duration']);
    let target = 2;
    const first = errorFields[0];
    if (first) {
      if (step0.has(first)) target = 0;
      else if (step1.has(first)) target = 1;
    }
    setCurrentStep(target);
    setTimeout(() => {
      const el = document.querySelector('.requirement-create-page .semi-form-field-error-message');
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  /** 收集表单值 → submitValues / patch 通用 */
  const buildSubmitValues = () => {
    const values = (formApi?.getValues?.() ?? {}) as Record<string, unknown>;
    const systemKeys = new Set(['title', 'department', 'priority']);
    const form_data: Record<string, unknown> = {};
    activeScheme?.custom_fields.forEach((f) => {
      if (values[f.key] !== undefined) form_data[f.key] = values[f.key];
    });
    OPTIONAL_FORM_KEYS.forEach((k) => {
      if (values[k] !== undefined) form_data[k] = values[k];
    });
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
    return { submitValues, values, form_data };
  };

  /** 立项后构造 patch */
  const buildPatch = (): RequirementDraft['patch'] => {
    const { values, form_data } = buildSubmitValues();
    return {
      title: values.title as string | undefined,
      priority: values.priority as RequirementItem['priority'] | undefined,
      form_data,
    };
  };

  const handleSaveDraft = async () => {
    if (!editData || !isPostProjectEdit) return;
    try {
      setSavingDraft(true);
      await saveDraft(editData.id, buildPatch());
      Toast.success('草稿已保存');
      setHasDraft(true);
      setDraftLoadedAt(new Date().toISOString());
      dirtyRef.current = false;
      navigate('/requirements/list');
    } catch {
      Toast.error('草稿保存失败');
    } finally {
      setSavingDraft(false);
    }
  };

  const handleDiscardDraft = async () => {
    if (!editData) return;
    await discardDraft(editData.id);
    setHasDraft(false);
    setDraftLoadedAt(null);
    Toast.success('草稿已丢弃');
  };

  const validateClassification = (): boolean => {
    if (!classificationEditable) return true;
    if (classificationStatus === 'error') {
      Toast.error('分类标签加载失败，请稍后重试');
      setCurrentStep(3);
      return false;
    }
    if (classificationStatus === 'loading') {
      Toast.info('分类标签加载中，请稍候');
      return false;
    }
    if (classificationStatus === 'empty') return true; // AF1：无适用分类键
    // ready 态：合计至少 1 个
    const total = Object.values(classificationValue).reduce(
      (sum, ids) => sum + (ids?.length ?? 0),
      0,
    );
    if (total === 0) {
      setForceClsError(true);
      setCurrentStep(3);
      setTimeout(() => {
        const el = document.querySelector('[data-classification-anchor]');
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!formApi) return;
    if (!departmentValue) {
      setCurrentStep(0);
      Toast.warning(t('requirements.form.departmentRequired'));
      return;
    }
    if (!ownerId) {
      setCurrentStep(0);
      Toast.warning(t('common.ownerRequired'));
      return;
    }
    try {
      await formApi.validate();
    } catch (errors) {
      const fields = errors && typeof errors === 'object' ? Object.keys(errors as Record<string, unknown>) : [];
      locateFirstError(fields);
      return;
    }

    if (!validateClassification()) return;

    // 立项后：进入发布变更步骤
    if (isPostProjectEdit && editData) {
      try {
        await saveDraft(editData.id, buildPatch());
        setHasDraft(true);
      } catch {
        // 不阻塞
      }
      setCurrentStep(4);
      return;
    }

    const buildAssignmentPayload = () =>
      Object.entries(classificationValue)
        .filter(([, ids]) => ids && ids.length > 0)
        .map(([classificationKeyId, valueIds]) => ({ classificationKeyId, valueIds }));

    const { submitValues } = buildSubmitValues();
    setSubmitting(true);
    try {
      let entityId: string;
      if (isEdit && editData) {
        await updateRequirement(editData.id, submitValues);
        entityId = editData.id;
      } else {
        const created = await createRequirement(submitValues);
        // mockData.createRequirement 返回创建的 RequirementItem
        entityId = (created as RequirementItem)?.id ?? '';
      }
      // 保存分类
      if (classificationStatus === 'ready') {
        try {
          await assignEntityClassifications('requirement', entityId, buildAssignmentPayload());
        } catch {
          // 回滚需求创建
          if (!isEdit && entityId) {
            try {
              await deleteRequirement(entityId);
            } catch {
              /* ignore */
            }
            removeEntityClassifications('requirement', entityId);
          }
          Toast.error('需求创建失败：分类标签保存异常，请稍后重试');
          return;
        }
      }
      Toast.success(
        isEdit ? t('requirements.form.editSuccess') : t('requirements.form.createSuccess'),
      );
      navigate('/requirements/list');
    } catch {
      Toast.error(t('requirements.form.submitError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async () => {
    if (!editData) return;
    if (publishReason.trim().length < 10) {
      Toast.warning('变更说明至少 10 个字符');
      return;
    }
    setSubmitting(true);
    try {
      await publishChange({
        requirementId: editData.id,
        patch: buildPatch(),
        reason: publishReason.trim(),
      });
      Toast.success('变更已发布');
      setHasDraft(false);
      navigate('/requirements/list');
    } catch (e) {
      const code = (e as Error)?.message ?? '';
      Toast.error(ERROR_MAP[code] || `发布失败: ${code || '未知错误'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const draftHintTime = draftLoadedAt
    ? draftLoadedAt.replace('T', ' ').substring(5, 16)
    : '';

  const titleText = isEdit
    ? (isPostProjectEdit ? '变更需求' : t('requirements.form.editTitle'))
    : t('requirements.form.createTitle');

  if (editLoading) {
    return (
      <div className="requirement-create-page">
        <div style={{ padding: 80, textAlign: 'center' }}>
          <Spin />
        </div>
      </div>
    );
  }

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
          {titleText}
        </Title>
        {isPostProjectEdit && hasDraft && (
          <Tag size="small" color="orange" style={{ marginLeft: 8 }}>
            {`已加载草稿${draftHintTime ? ` · ${draftHintTime}` : ''}`}
          </Tag>
        )}
      </div>

      <div className="requirement-create-page-steps">
        <Steps current={currentStep} type="basic">
          <Steps.Step title="基础信息" description="标题、部门、归属人、优先级" />
          <Steps.Step title="岗位与执行成本" description="人力级别、成本、执行频率、时长" />
          <Steps.Step title="需求详情" description="按模版填写业务字段" />
          <Steps.Step title="分类标签" description="按业务维度打标，便于后续筛选" />
          {isPostProjectEdit && (
            <Steps.Step title="发布变更" description="填写变更说明并发布" />
          )}
        </Steps>
      </div>


      <div className="requirement-create-page-content">
        <div className="form-card">
          <Form
            labelPosition="top"
            initValues={baseInitialValues}
            getFormApi={setFormApi}
            onValueChange={() => setDirty(true)}
            key={editData?.id || 'create'}
          >
            {/* Step 0 */}
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
                  disabled={isPostProjectEdit}
                />
              </Form.Slot>
              <Form.Slot label={{ text: t('requirements.form.requirementOwnerLabel'), required: true }}>
                <OwnerSearchSelect
                  value={ownerId}
                  onChange={(v) => {
                    setOwnerId(v);
                    setDirty(true);
                  }}
                  disabled={isPostProjectEdit}
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

            {/* Step 1 */}
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

            {/* Step 2 */}
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

          {/* Step 3：分类标签 */}
          <div style={{ display: currentStep === 3 ? 'block' : 'none' }}>
            <ClassificationTagsField
              entityType="requirement"
              entityId={editData?.id}
              value={classificationValue}
              onChange={handleClassificationChange}
              onStatusChange={setClassificationStatus}
              required
              forceShowError={forceClsError}
              readonly={!classificationEditable}
            />
          </div>

          {/* Step 3: 发布变更（仅立项后编辑） */}
          {isPublishStep && editData && (
            <PublishChangePanel
              reason={publishReason}
              onReasonChange={setPublishReason}
            />
          )}
        </div>
      </div>

      <div className="requirement-create-page-footer">
        <div style={{ display: 'flex', gap: 8 }}>
          {isPostProjectEdit && !isPublishStep && (
            <Button
              theme="borderless"
              type="tertiary"
              loading={savingDraft}
              onClick={handleSaveDraft}
            >
              保存草稿
            </Button>
          )}
          {isPostProjectEdit && hasDraft && !isPublishStep && (
            <Button theme="borderless" type="danger" onClick={handleDiscardDraft}>
              丢弃草稿
            </Button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button onClick={handleBack} disabled={submitting}>
            {t('common.cancel')}
          </Button>
          {currentStep > 0 && (
            <Button onClick={handlePrev} disabled={submitting}>
              上一步
            </Button>
          )}
          {currentStep < lastFormStep && (
            <Button theme="solid" type="primary" onClick={handleNext}>
              下一步
            </Button>
          )}
          {currentStep === lastFormStep && (
            <Button
              theme="solid"
              type="primary"
              loading={submitting}
              disabled={
                classificationEditable &&
                (classificationStatus === 'error' || classificationStatus === 'loading')
              }
              onClick={handleSubmit}
            >
              {isPostProjectEdit ? '下一步：发布变更' : (isEdit ? t('common.save') : t('common.create'))}
            </Button>
          )}
          {isPublishStep && (
            <Button
              theme="solid"
              type="primary"
              loading={submitting}
              disabled={publishReason.trim().length < 10}
              onClick={handlePublish}
            >
              发布变更
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequirementCreatePage;
