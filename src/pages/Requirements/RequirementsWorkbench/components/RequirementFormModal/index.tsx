import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Form,
  Toast,
  Button,
  DatePicker,
} from '@douyinfe/semi-ui';
import type { RequirementItem } from '../../types';
import { departmentOptions } from '../../mockData';
import './index.less';

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
  const isEdit = !!editData;

  const priorityOptions = useMemo(
    () => [
      { value: 'HIGH', label: t('requirements.priority.high') },
      { value: 'MEDIUM', label: t('requirements.priority.medium') },
      { value: 'LOW', label: t('requirements.priority.low') },
    ],
    [t],
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
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      onSuccess(values);
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
      >
        <div className="requirement-form-modal-content">
          {/* 基本信息 */}
          <div className="requirement-form-modal-section">
            <div className="requirement-form-modal-section-title">
              {t('requirements.form.sectionBasicInfo')}
            </div>
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
            <Form.TextArea
              field="description"
              label={t('requirements.form.descriptionLabel')}
              placeholder={t('requirements.form.descriptionPlaceholder')}
              autosize={{ minRows: 3, maxRows: 6 }}
              maxCount={2000}
              rules={[
                { max: 2000, message: t('requirements.form.descriptionMaxLength') },
              ]}
            />
          </div>

          {/* 分类与优先级 */}
          <div className="requirement-form-modal-section">
            <div className="requirement-form-modal-section-title">
              {t('requirements.form.sectionClassification')}
            </div>
            <Form.Select
              field="department"
              label={t('requirements.fields.department')}
              placeholder={t('requirements.form.departmentPlaceholder')}
              rules={[{ required: true, message: t('requirements.form.departmentRequired') }]}
              optionList={departmentOptions}
              filter
              className="requirement-form-modal-select-full"
            />
            <Form.Select
              field="priority"
              label={t('requirements.fields.priority')}
              placeholder={t('requirements.form.priorityPlaceholder')}
              rules={[{ required: true, message: t('requirements.form.priorityRequired') }]}
              optionList={priorityOptions}
              className="requirement-form-modal-select-full"
            />
          </div>

          {/* 补充信息 */}
          <div className="requirement-form-modal-section">
            <div className="requirement-form-modal-section-title">
              {t('requirements.form.sectionAdditional')}
            </div>
            <Form.Input
              field="contactInfo"
              label={t('requirements.form.contactLabel')}
              placeholder={t('requirements.form.contactPlaceholder')}
              maxLength={100}
              showClear
            />
            <Form.Slot label={t('requirements.fields.expectedLaunchDate')}>
              <DatePicker
                type="date"
                style={{ width: '100%' }}
                placeholder={t('requirements.form.expectedLaunchDatePlaceholder')}
              />
            </Form.Slot>
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

export default RequirementFormModal;
