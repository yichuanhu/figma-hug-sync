import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Form, Toast, Button, Row, Col } from '@douyinfe/semi-ui';
import type { LYRequirementResponse, RequirementPriority } from '@/api';
import './index.less';

interface RequirementFormModalProps {
  visible: boolean;
  onCancel: () => void;
  requirementData: LYRequirementResponse | null;
  onSuccess: (data: LYRequirementResponse) => void;
}

const departmentOptions = [
  { value: 'dept-1', label: 'Finance' },
  { value: 'dept-2', label: 'IT' },
  { value: 'dept-3', label: 'Operations' },
  { value: 'dept-4', label: 'HR' },
  { value: 'dept-5', label: 'Sales' },
  { value: 'dept-6', label: 'Procurement' },
  { value: 'dept-7', label: 'Marketing' },
  { value: 'dept-8', label: 'Legal' },
];

const RequirementFormModal = ({ visible, onCancel, requirementData, onSuccess }: RequirementFormModalProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const isEdit = !!requirementData;

  const priorityOptions: { value: RequirementPriority; label: string }[] = [
    { value: 'HIGH', label: t('requirement.priority.HIGH') },
    { value: 'MEDIUM', label: t('requirement.priority.MEDIUM') },
    { value: 'LOW', label: t('requirement.priority.LOW') },
  ];

  const handleSubmit = async (values: Record<string, unknown>) => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const dept = departmentOptions.find(d => d.value === values.department_id);
      const result: LYRequirementResponse = {
        id: requirementData?.id || `REQ-${String(Date.now()).slice(-4)}`,
        title: values.title as string,
        description: (values.description as string) || '',
        business_background: (values.business_background as string) || '',
        department_id: values.department_id as string,
        department_name: dept?.label || '',
        contact_name: values.contact_name as string,
        contact_email: (values.contact_email as string) || '',
        expected_online_date: values.expected_online_date as string,
        priority: (values.priority as RequirementPriority) || 'MEDIUM',
        approval_status: requirementData?.approval_status || 'DRAFT',
        development_status: requirementData?.development_status || 'NOT_STARTED',
        operation_status: requirementData?.operation_status || 'NOT_LIVE',
        classifications: requirementData?.classifications || [],
        creator_id: requirementData?.creator_id || 'user-001',
        creator_name: requirementData?.creator_name || 'John Smith',
        creator_department: requirementData?.creator_department || 'Finance',
        creator_role: requirementData?.creator_role || 'Senior Analyst',
        creator_email: requirementData?.creator_email || 'john.smith@example.com',
        created_at: requirementData?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      Toast.success(isEdit ? t('requirement.form.editSuccess') : t('requirement.form.createSuccess'));
      onSuccess(result);
    } catch {
      Toast.error(isEdit ? t('requirement.form.editError') : t('requirement.form.createError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={isEdit ? t('requirement.form.editTitle') : t('requirement.form.createTitle')}
      visible={visible}
      onCancel={onCancel}
      footer={null}
      width={520}
      closeOnEsc
      maskClosable={false}
      centered
      className="requirement-form-modal"
    >
      <Form
        onSubmit={handleSubmit}
        labelPosition="top"
        className="requirement-form-modal-form"
        initValues={isEdit ? {
          title: requirementData?.title || '',
          description: requirementData?.description || '',
          business_background: requirementData?.business_background || '',
          department_id: requirementData?.department_id || undefined,
          priority: requirementData?.priority || 'MEDIUM',
          contact_name: requirementData?.contact_name || '',
          contact_email: requirementData?.contact_email || '',
          expected_online_date: requirementData?.expected_online_date || '',
        } : {
          priority: 'MEDIUM',
        }}
        key={requirementData?.id || 'new'}
      >
        <Form.Input
          field="title"
          label={t('requirement.form.fields.title')}
          placeholder={t('requirement.form.fields.titlePlaceholder')}
          rules={[
            { required: true, message: t('requirement.form.validation.titleRequired') },
            { max: 100, message: t('requirement.form.validation.titleMaxLength') },
          ]}
        />

        <Form.TextArea
          field="description"
          label={t('common.description')}
          placeholder={t('requirement.form.fields.descriptionPlaceholder')}
          autosize={{ minRows: 3, maxRows: 6 }}
          maxCount={2000}
          showClear
          rules={[
            { required: true, message: t('requirement.form.validation.descriptionRequired') },
          ]}
        />

        <Form.TextArea
          field="business_background"
          label={t('requirement.form.fields.businessBackground')}
          placeholder={t('requirement.form.fields.businessBackgroundPlaceholder')}
          autosize={{ minRows: 2, maxRows: 4 }}
          maxCount={2000}
          showClear
        />

        <Row gutter={16}>
          <Col span={12}>
            <Form.Select
              field="department_id"
              label={t('requirement.form.fields.department')}
              placeholder={t('requirement.form.fields.departmentPlaceholder')}
              style={{ width: '100%' }}
              optionList={departmentOptions}
              rules={[
                { required: true, message: t('requirement.form.validation.departmentRequired') },
              ]}
            />
          </Col>
          <Col span={12}>
            <Form.Select
              field="priority"
              label={t('requirement.list.columns.priority')}
              style={{ width: '100%' }}
              optionList={priorityOptions}
            />
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Input
              field="contact_name"
              label={t('requirement.form.fields.contactName')}
              placeholder={t('requirement.form.fields.contactNamePlaceholder')}
              rules={[
                { required: true, message: t('requirement.form.validation.contactRequired') },
              ]}
            />
          </Col>
          <Col span={12}>
            <Form.Input
              field="contact_email"
              label={t('requirement.form.fields.contactEmail')}
              placeholder={t('requirement.form.fields.contactEmailPlaceholder')}
            />
          </Col>
        </Row>

        <Form.DatePicker
          field="expected_online_date"
          label={t('requirement.form.fields.expectedOnlineDate')}
          style={{ width: '100%' }}
          type="date"
          rules={[
            { required: true, message: t('requirement.form.validation.expectedDateRequired') },
          ]}
        />

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
