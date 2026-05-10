import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Form,
  Toast,
  Button,
  Typography,
  Tag,
  useFormState,
} from '@douyinfe/semi-ui';
import type { RequirementItem, SchemeField, SchemeFieldDependsOn, RequirementDraft } from '../../types';
import DepartmentSearchSelect from '@/components/DepartmentSearchSelect';
import OwnerSearchSelect from '@/components/OwnerSearchSelect';
import { MOCK_CURRENT_USER } from '@/mocks/departmentData';
import { getActiveScheme, getDraft, saveDraft, discardDraft, publishChange } from '../../mockData';
import SchemeFieldRenderer from '../SchemeFieldRenderer';
import { isPostProjectStatus } from '../../utils/fieldEditability';
import PublishChangePanel, { ERROR_MAP, computePublishChangeType } from '../PublishChangePanel';
import './index.less';

const { Text } = Typography;

interface RequirementFormModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: (values: Record<string, unknown>) => void;
  /** 立项后通过「发布变更」流程提交时触发(代替 onSuccess) */
  onPublished?: () => void;
  editData?: RequirementItem | null;
}

const RequirementFormModal = ({
  visible,
  onCancel,
  onSuccess,
  onPublished,
  editData,
}: RequirementFormModalProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [formApi, setFormApi] = useState<any>(null);
  const [departmentValue, setDepartmentValue] = useState<string | undefined>(undefined);
  const [ownerId, setOwnerId] = useState<string>(MOCK_CURRENT_USER.id);
  const isEdit = !!editData;
  const isPostProjectEdit = !!editData && isPostProjectStatus(editData.status);
  const [step, setStep] = useState<'edit' | 'publish'>('edit');
  const [pendingPatch, setPendingPatch] = useState<RequirementDraft['patch']>({});
  // Step 2 (发布变更) 状态：仅在弹窗整体关闭时才重置
  const [publishReason, setPublishReason] = useState('');
  const [publishLoading, setPublishLoading] = useState(false);

  // 草稿态：仅在立项后编辑模式下使用
  const [hasDraft, setHasDraft] = useState(false);
  const [draftLoadedAt, setDraftLoadedAt] = useState<string | null>(null);
  // 用于判定是否「有未保存改动」：每次打开重置为 false，任何字段变化置 true
  const dirtyRef = useRef(false);

  const priorityOptions = useMemo(
    () => [
      { value: 'HIGH', label: t('requirements.priority.high') },
      { value: 'MEDIUM', label: t('requirements.priority.medium') },
      { value: 'LOW', label: t('requirements.priority.low') },
    ],
    [t],
  );

  const activeScheme = useMemo(() => getActiveScheme(), []);

  const baseInitialValues = useMemo(() => {
    if (isEdit && editData) {
      const formData = (editData.form_data ?? {}) as Record<string, unknown>;
      const ratio = (formData.automation_ratio ?? formData.automationRatio) as number | undefined;
      const ratioDisplay = typeof ratio === 'number' && ratio <= 1 ? ratio * 100 : ratio;
      return {
        title: editData.title,
        department: editData.owning_department_name,
        priority: editData.priority,
        ...formData,
        automation_ratio: ratioDisplay,
      };
    }
    return { priority: 'MEDIUM' as const };
  }, [isEdit, editData]);

  // 立项后模式：弹窗打开时尝试读取该用户的草稿并合并
  useEffect(() => {
    if (!visible) {
      // 关闭时重置脏标记、草稿态、步骤与发布信息
      dirtyRef.current = false;
      setHasDraft(false);
      setDraftLoadedAt(null);
      setStep('edit');
      setPublishReason('');
      setPendingPatch({});
      return;
    }
    if (!isPostProjectEdit || !editData) return;
    let cancelled = false;
    getDraft(editData.id).then((draft) => {
      if (cancelled || !draft) return;
      // 合并草稿到表单
      const patch = draft.patch ?? {};
      const merged: Record<string, unknown> = {};
      if (patch.title !== undefined) merged.title = patch.title;
      if (patch.priority !== undefined) merged.priority = patch.priority;
      if (patch.form_data) Object.assign(merged, patch.form_data);
      // 等 formApi 就绪
      Object.entries(merged).forEach(([k, v]) => formApi?.setValue?.(k, v));
      setHasDraft(true);
      setDraftLoadedAt(draft.updatedAt);
      // 草稿回填不算作脏改动
      dirtyRef.current = false;
    });
    return () => {
      cancelled = true;
    };
  }, [visible, isPostProjectEdit, editData, formApi]);

  useEffect(() => {
    const nextDepartment = editData?.owning_department_name || undefined;
    setDepartmentValue(nextDepartment);
    formApi?.setValue?.('department', nextDepartment);
  }, [editData?.owning_department_name, editData?.id, formApi, visible]);

  const handleDepartmentChange = (value: string) => {
    setDepartmentValue(value);
    formApi?.setValue?.('department', value);
    dirtyRef.current = true;
  };

  /** 收集当前表单值并构造 patch（立项后用） */
  const buildPatchFromValues = (values: Record<string, unknown>): RequirementDraft['patch'] => {
    const form_data: Record<string, unknown> = {};
    activeScheme?.custom_fields.forEach((f) => {
      if (values[f.key] !== undefined) form_data[f.key] = values[f.key];
    });
    return {
      title: values.title as string | undefined,
      priority: values.priority as RequirementItem['priority'] | undefined,
      form_data,
    };
  };

  const handleSaveDraft = async () => {
    if (!editData || !isPostProjectEdit) return;
    try {
      const values = (formApi?.getValues?.() ?? {}) as Record<string, unknown>;
      setSavingDraft(true);
      const patch = buildPatchFromValues(values);
      await saveDraft(editData.id, patch);
      Toast.success('草稿已保存');
      dirtyRef.current = false;
      setHasDraft(true);
      setDraftLoadedAt(new Date().toISOString());
      onCancel();
    } catch {
      Toast.error('草稿保存失败');
    } finally {
      setSavingDraft(false);
    }
  };

  const handleDiscardAndClose = async () => {
    if (!editData) {
      onCancel();
      return;
    }
    try {
      await discardDraft(editData.id);
      setHasDraft(false);
      setDraftLoadedAt(null);
    } finally {
      dirtyRef.current = false;
      onCancel();
    }
  };

  /** 关闭弹窗：立项后模式且有改动时弹出三选确认 */
  const handleClose = () => {
    if (isPostProjectEdit && (dirtyRef.current || hasDraft)) {
      const hasChange = dirtyRef.current;
      Modal.confirm({
        title: '关闭后修改将丢失',
        content: hasChange
          ? '您有未保存的改动，是否将其保存为草稿？保存后下次打开会自动恢复。'
          : '是否丢弃当前已加载的草稿？',
        okText: hasChange ? '保存草稿' : '继续编辑',
        cancelText: hasChange ? '丢弃修改' : '丢弃草稿',
        onOk: async () => {
          if (hasChange) {
            await handleSaveDraft();
          }
          // 「继续编辑」分支：什么都不做（关闭对话框即可）
        },
        onCancel: async () => {
          await handleDiscardAndClose();
        },
      });
      return;
    }
    onCancel();
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (!isPostProjectEdit && !ownerId) {
      Toast.warning(t('common.ownerRequired'));
      return;
    }
    const systemKeys = new Set(['title', 'department', 'priority']);
    const form_data: Record<string, unknown> = {};
    activeScheme?.custom_fields.forEach((f) => {
      if (values[f.key] !== undefined) form_data[f.key] = values[f.key];
    });
    const submitValues = { ...values, form_data };
    Object.keys(form_data).forEach((k) => {
      if (!systemKeys.has(k)) delete (submitValues as Record<string, unknown>)[k];
    });

    // 立项后:走「发布变更」流程,而不是直接保存
    if (isPostProjectEdit && editData) {
      const patch = buildPatchFromValues(values);
      // 进入发布前先把当前状态保存为草稿，避免发布失败时丢失
      try {
        await saveDraft(editData.id, patch);
        setHasDraft(true);
      } catch {
        // 草稿保存失败不阻断发布流程
      }
      setPendingPatch(patch);
      setStep('publish');
      return;
    }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      onSuccess(submitValues);
      Toast.success(
        isEdit
          ? t('requirements.form.editSuccess')
          : t('requirements.form.createSuccess'),
      );
      onCancel();
    } catch {
      Toast.error(t('requirements.form.submitError'));
    } finally {
      setLoading(false);
    }
  };

  const draftHintTime = draftLoadedAt
    ? draftLoadedAt.replace('T', ' ').substring(5, 16)
    : '';

  const publishReasonValid = publishReason.trim().length >= 10;
  const canPublish = publishReasonValid;

  const handlePublish = async () => {
    if (!editData) return;
    setPublishLoading(true);
    try {
      await publishChange({
        requirementId: editData.id,
        patch: pendingPatch,
        reason: publishReason.trim(),
        changeType: computePublishChangeType(),
      });
      Toast.success('变更已发布');
      // publishChange 内部会清掉草稿
      setHasDraft(false);
      setDraftLoadedAt(null);
      dirtyRef.current = false;
      onPublished?.();
      onCancel();
    } catch (e) {
      const code = (e as Error)?.message ?? '';
      Toast.error(ERROR_MAP[code] || `发布失败: ${code || '未知错误'}`);
    } finally {
      setPublishLoading(false);
    }
  };

  const isPublishStep = step === 'publish';

  return (
    <Modal
      title={
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {isPublishStep ? (
            <>
              <Text type="tertiary">编辑需求(立项后) ›</Text>
              <span>发布变更</span>
            </>
          ) : (
            <>
              {isEdit ? (isPostProjectEdit ? '编辑需求(立项后)' : t('requirements.form.editTitle')) : t('requirements.form.createTitle')}
              {isPostProjectEdit && hasDraft && (
                <Tag size="small" color="orange">
                  {`已加载草稿${draftHintTime ? ` · ${draftHintTime}` : ''}`}
                </Tag>
              )}
            </>
          )}
        </span>
      }
      visible={visible}
      onCancel={handleClose}
      footer={null}
      width={isPublishStep ? 600 : 520}
      centered
      closeOnEsc
      maskClosable={false}
    >
      <Form
        onSubmit={handleSubmit}
        labelPosition="top"
        className="requirement-form-modal-form"
        initValues={baseInitialValues}
        key={editData?.id || 'create'}
        getFormApi={setFormApi}
        onValueChange={() => {
          dirtyRef.current = true;
        }}
      >
        <div
          className="requirement-form-modal-content"
          style={{ display: isPublishStep ? 'none' : undefined }}
        >
          {isPostProjectEdit && (
            <div style={{ marginBottom: 12 }}>
              <Text type="warning" size="small">
                立项后部门、归属人等系统字段已锁定;保存将以「发布变更」形式提交,需要填写变更说明。
              </Text>
            </div>
          )}
          <div className="requirement-form-modal-section">
            <Text strong className="requirement-form-modal-section-title">
              {t('requirements.form.sectionBasicInfo')}
            </Text>
          </div>

          <div className="requirement-form-modal-grid">
            <div className="scheme-field-w-full">
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
            </div>

            <div className="scheme-field-w-medium">
              <Form.Slot label={{ text: t('common.owningDepartment'), required: true }}>
                <DepartmentSearchSelect
                  value={departmentValue}
                  onChange={handleDepartmentChange}
                  useNameAsValue
                  placeholder={t('requirements.form.departmentPlaceholder')}
                  disabled={isPostProjectEdit}
                />
              </Form.Slot>
            </div>

            <div className="scheme-field-w-medium">
              <Form.Slot label={{ text: t('requirements.form.requirementOwnerLabel'), required: true }}>
                <OwnerSearchSelect
                  value={ownerId}
                  onChange={(v) => {
                    setOwnerId(v);
                    dirtyRef.current = true;
                  }}
                  disabled={isPostProjectEdit}
                />
              </Form.Slot>
            </div>
          </div>

          <div className="requirement-form-modal-section requirement-form-modal-section-divider">
            <Text strong className="requirement-form-modal-section-title">
              {t('requirements.form.sectionDetails')}
            </Text>
          </div>
          <div className="requirement-form-modal-grid">
            <div className="scheme-field-w-medium">
              <Form.Select
                field="priority"
                label={`${t('requirements.fields.priority')}${t('requirements.form.optionalSuffix')}`}
                placeholder={t('requirements.form.priorityPlaceholder')}
                optionList={priorityOptions}
                style={{ width: '100%' }}
              />
            </div>
            {activeScheme && activeScheme.custom_fields.length > 0 ? (
              <SchemeFieldsRenderer
                fields={activeScheme.custom_fields}
                costConfig={activeScheme.cost_config}
              />
            ) : null}
          </div>
        </div>

        {isPublishStep && editData && (
          <div className="requirement-form-modal-content">
            <PublishChangePanel
              requirementId={editData.id}
              patch={pendingPatch}
              reason={publishReason}
              onReasonChange={setPublishReason}
              devImpact={publishDevImpact}
              onDevImpactChange={setPublishDevImpact}
              diffs={publishDiffs}
              onDiffsChange={setPublishDiffs}
              previewing={publishPreviewing}
              onPreviewingChange={setPublishPreviewing}
            />
          </div>
        )}

        <div
          className="requirement-form-modal-footer"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}
        >
          <div>
            {isPublishStep ? (
              <Button
                theme="borderless"
                type="tertiary"
                disabled={publishLoading}
                onClick={() => setStep('edit')}
              >
                上一步
              </Button>
            ) : (
              isPostProjectEdit && (
                <Button
                  theme="borderless"
                  type="tertiary"
                  loading={savingDraft}
                  onClick={handleSaveDraft}
                >
                  保存草稿
                </Button>
              )
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button theme="light" onClick={handleClose} disabled={publishLoading}>
              {t('common.cancel')}
            </Button>
            {isPublishStep ? (
              <Button
                theme="solid"
                type="primary"
                loading={publishLoading}
                disabled={!canPublish}
                onClick={handlePublish}
              >
                {publishDevImpact ? '确认并发布变更' : '发布变更'}
              </Button>
            ) : (
              <Button htmlType="submit" theme="solid" type="primary" loading={loading}>
                {isPostProjectEdit ? '下一步:发布变更' : (isEdit ? t('common.save') : t('common.create'))}
              </Button>
            )}
          </div>
        </div>
      </Form>
    </Modal>
  );
};

/**
 * Scheme 字段批量渲染器：必须作为 Form 的子组件以使用 useFormState 读取依赖字段值。
 */
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

export default RequirementFormModal;
