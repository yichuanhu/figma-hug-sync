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
import type { RequirementItem, SchemeField, SchemeFieldDependsOn } from '../../types';
import DepartmentSearchSelect from '@/components/DepartmentSearchSelect';
import OwnerSearchSelect from '@/components/OwnerSearchSelect';
import { MOCK_CURRENT_USER } from '@/mocks/departmentData';
import { getActiveScheme } from '../../mockData';
import SchemeFieldRenderer from '../SchemeFieldRenderer';
import './index.less';

const { Text } = Typography;

interface RequirementFormModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: (values: Record<string, unknown>) => void;
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
    if (!ownerId) {
      Toast.warning(t('common.ownerRequired'));
      return;
    }
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      // 把动态字段拆分到 form_data，系统字段保留在顶层
      const systemKeys = new Set(['title', 'department', 'priority']);
      const form_data: Record<string, unknown> = {};
      activeScheme?.custom_fields.forEach((f) => {
        if (values[f.key] !== undefined) form_data[f.key] = values[f.key];
      });
      const submitValues = { ...values, form_data };
      // 移除已抽到 form_data 的 key（防止系统字段被污染）
      Object.keys(form_data).forEach((k) => {
        if (!systemKeys.has(k)) delete (submitValues as Record<string, unknown>)[k];
      });
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
    <Modal
      title={isEdit ? t('requirements.form.editTitle') : t('requirements.form.createTitle')}
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
          {/* 基本信息区块 — 系统字段（4 项） */}
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
                <Form.Input
                  field="department"
                  noLabel
                  rules={[{ required: true, message: t('requirements.form.departmentRequired') }]}
                  style={{ display: 'none' }}
                />
                <DepartmentSelect
                  value={departmentValue}
                  onChange={handleDepartmentChange}
                  useNameAsValue
                  placeholder={t('requirements.form.departmentPlaceholder')}
                />
              </Form.Slot>
            </div>

            <div className="scheme-field-w-medium">
              <Form.Slot label={{ text: t('requirements.form.requirementOwnerLabel'), required: true }}>
                <OwnerSearchSelect value={ownerId} onChange={setOwnerId} />
              </Form.Slot>
            </div>
          </div>

          {/* 需求详情 — 评估属性（优先级）+ Scheme 驱动动态字段 */}
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
            {isEdit ? t('common.save') : t('common.create')}
          </Button>
        </div>
      </Form>
    </Modal>
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
