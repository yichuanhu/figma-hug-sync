import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import FormModal from '@/components/FormModal';
import type { FieldConfig } from '@/components/FormModal';
import type { RequirementItem } from '../types';
import { departmentOptions } from '../mockData';

interface RequirementFormModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: (values: Record<string, unknown>) => void;
  /** 编辑模式传入已有数据 */
  editData?: RequirementItem | null;
}

const RequirementFormModal = ({
  visible,
  onCancel,
  onSuccess,
  editData,
}: RequirementFormModalProps) => {
  const { t } = useTranslation();
  const isEdit = !!editData;

  const priorityOptions = useMemo(
    () => [
      { value: 'HIGH', label: t('requirements.priority.high') },
      { value: 'MEDIUM', label: t('requirements.priority.medium') },
      { value: 'LOW', label: t('requirements.priority.low') },
    ],
    [t],
  );

  const fields: FieldConfig[] = useMemo(
    () => [
      {
        type: 'input',
        field: 'title',
        label: t('requirements.form.titleLabel'),
        placeholder: t('requirements.form.titlePlaceholder'),
        rules: [
          { required: true, message: t('requirements.form.titleRequired') },
          { max: 200, message: t('requirements.form.titleMaxLength') },
        ],
        maxLength: 200,
        showClear: true,
      },
      {
        type: 'textarea',
        field: 'description',
        label: t('requirements.form.descriptionLabel'),
        placeholder: t('requirements.form.descriptionPlaceholder'),
        maxCount: 2000,
        autosize: { minRows: 3, maxRows: 8 },
      },
      {
        type: 'select',
        field: 'department',
        label: t('requirements.fields.department'),
        placeholder: t('requirements.form.departmentPlaceholder'),
        rules: [{ required: true, message: t('requirements.form.departmentRequired') }],
        options: departmentOptions,
        filter: true,
      },
      {
        type: 'select',
        field: 'priority',
        label: t('requirements.fields.priority'),
        placeholder: t('requirements.form.priorityPlaceholder'),
        rules: [{ required: true, message: t('requirements.form.priorityRequired') }],
        options: priorityOptions,
      },
      {
        type: 'input',
        field: 'contactInfo',
        label: t('requirements.form.contactLabel'),
        placeholder: t('requirements.form.contactPlaceholder'),
        maxLength: 100,
        showClear: true,
      },
      {
        type: 'custom',
        field: 'expectedLaunchDate',
        label: t('requirements.fields.expectedLaunchDate'),
        render: (formApi) => {
          // Use Semi DatePicker inline
          const SemiDatePicker = require('@douyinfe/semi-ui').DatePicker;
          return (
            <SemiDatePicker
              type="date"
              style={{ width: '100%' }}
              placeholder={t('requirements.form.expectedLaunchDatePlaceholder')}
              value={formApi.getValue('expectedLaunchDate')}
              onChange={(date: Date | null) => {
                formApi.setValue('expectedLaunchDate', date);
              }}
            />
          );
        },
      },
    ],
    [t, priorityOptions],
  );

  const initialValues = useMemo(() => {
    if (isEdit && editData) {
      return {
        title: editData.title,
        description: editData.description,
        department: editData.department,
        priority: editData.priority,
        contactInfo: editData.contactInfo || '',
        expectedLaunchDate: editData.expectedLaunchDate
          ? new Date(editData.expectedLaunchDate)
          : undefined,
      };
    }
    return {
      priority: 'MEDIUM',
    };
  }, [isEdit, editData]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    onSuccess(values);
  };

  return (
    <FormModal
      visible={visible}
      title={
        isEdit
          ? t('requirements.form.editTitle')
          : t('requirements.form.createTitle')
      }
      onCancel={onCancel}
      onSubmit={handleSubmit}
      width={520}
      fields={fields}
      initialValues={initialValues}
      formKey={editData?.id || 'create'}
      submitText={isEdit ? t('common.save') : t('common.create')}
      successMessage={
        isEdit
          ? t('requirements.form.editSuccess')
          : t('requirements.form.createSuccess')
      }
      errorMessage={t('requirements.form.submitError')}
    />
  );
};

export default RequirementFormModal;
