import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Form,
  Toast,
  Button,
  Typography,
  useFormState,
} from '@douyinfe/semi-ui';
import type { RequirementItem, SchemeField, SchemeFieldDependsOn, RequirementDraft } from '../../types';
import DepartmentSearchSelect from '@/components/DepartmentSearchSelect';
import OwnerSearchSelect from '@/components/OwnerSearchSelect';
import { MOCK_CURRENT_USER } from '@/mocks/departmentData';
import { getActiveScheme } from '../../mockData';
import SchemeFieldRenderer from '../SchemeFieldRenderer';
import { isPostProjectStatus } from '../../utils/fieldEditability';
import PublishChangeModal from '../PublishChangeModal';
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
  editData,
}: RequirementFormModalProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formApi, setFormApi] = useState<any>(null);
  const [departmentValue, setDepartmentValue] = useState<string | undefined>(undefined);
  const [ownerId, setOwnerId] = useState<string>(MOCK_CURRENT_USER.id);
  const isEdit = !!editData;
  const isPostProjectEdit = !!editData && isPostProjectStatus(editData.status);
  const [publishVisible, setPublishVisible] = useState(false);
  const [pendingPatch, setPendingPatch] = useState<RequirementDraft['patch']>({});

  const priorityOptions = useMemo(
    () => [
      { value: 'HIGH', label: t('requirements.priority.high') },
      { value: 'MEDIUM', label: t('requirements.priority.medium') },
      { value: 'LOW', label: t('requirements.priority.low') },
    ],
    [t],
  );

  const activeScheme = useMemo(() => getActiveScheme(), []);

  const initialValues = useMemo(() => {
    if (isEdit && editData) {
      const formData = (editData.form_data ?? {}) as Record<string, unknown>;
      // 把 0~1 的 ratio 反向归一化为 0~100 显示（兼容新旧 key）
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
    return {
      priority: 'MEDIUM',
    };
  }, [isEdit, editData]);

  useEffect(() => {
    const nextDepartment = editData?.owning_department_name || undefined;
    setDepartmentValue(nextDepartment);
    formApi?.setValue?.('department', nextDepartment);
  }, [editData?.owning_department_name, editData?.id, formApi, visible]);

  const handleDepartmentChange = (value: string) => {
    setDepartmentValue(value);
    formApi?.setValue?.('department', value);
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
      const patch: RequirementDraft['patch'] = {
        title: values.title as string | undefined,
        priority: values.priority as RequirementItem['priority'] | undefined,
        form_data,
      };
      setPendingPatch(patch);
      setPublishVisible(true);
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

  return (
    <>
    <Modal
      title={isEdit ? (isPostProjectEdit ? '编辑需求(立项后)' : t('requirements.form.editTitle')) : t('requirements.form.createTitle')}
      visible={visible}
      onCancel={onCancel}
      footer={null}
      width={520}
      centered
      closeOnEsc
      maskClosable={false}
    >
      <Form
        onSubmit={handleSubmit}
        labelPosition="top"
        className="requirement-form-modal-form"
        initValues={initialValues}
        key={editData?.id || 'create'}
        getFormApi={setFormApi}
      >
        <div className="requirement-form-modal-content">
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
                <OwnerSearchSelect value={ownerId} onChange={setOwnerId} disabled={isPostProjectEdit} />
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

        <div className="requirement-form-modal-footer">
          <Button theme="light" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button htmlType="submit" theme="solid" type="primary" loading={loading}>
            {isPostProjectEdit ? '下一步:发布变更' : (isEdit ? t('common.save') : t('common.create'))}
          </Button>
        </div>
      </Form>
    </Modal>
    {editData && (
      <PublishChangeModal
        visible={publishVisible}
        requirementId={editData.id}
        patch={pendingPatch}
        onCancel={() => setPublishVisible(false)}
        onPublished={() => {
          setPublishVisible(false);
          onSuccess({ __published: true });
          onCancel();
        }}
      />
    )}
    </>
  );
};

/**
 * Scheme 字段批量渲染器：必须作为 Form 的子组件以使用 useFormState 读取依赖字段值。
 * 根据 field.depends_on 决定是否渲染（不满足时整体卸载，避免脏值参与提交）。
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
