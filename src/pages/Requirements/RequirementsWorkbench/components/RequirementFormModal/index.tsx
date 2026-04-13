import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Form,
  Toast,
  Button,
  DatePicker,
  Upload,
  Typography,
} from '@douyinfe/semi-ui';
import { Upload as UploadIcon } from 'lucide-react';
import type { RequirementItem } from '../../types';
import DepartmentSelect from '@/components/DepartmentSelect';
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
        businessBackground: editData.businessBackground || '',
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
          {/* 基本信息区块 */}
          <div className="requirement-form-modal-section">
            <Text strong className="requirement-form-modal-section-title">
              {t('requirements.form.sectionBasicInfo')}
              <Text type="tertiary" size="small" style={{ marginLeft: 8, fontWeight: 400 }}>
                * {t('requirements.form.requiredHint')}
              </Text>
            </Text>
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
            trigger={['blur', 'change']}
            rules={[
              { required: true, message: t('requirements.form.descriptionRequired') },
              { max: 2000, message: t('requirements.form.descriptionMaxLength') },
            ]}
            showClear
          />

          <Form.TextArea
            field="businessBackground"
            label={`${t('requirements.form.businessBackgroundLabel')}${t('requirements.form.optionalSuffix')}`}
            placeholder={t('requirements.form.businessBackgroundPlaceholder')}
            autosize={{ minRows: 2, maxRows: 4 }}
            maxCount={2000}
            rules={[
              { max: 2000, message: t('requirements.form.descriptionMaxLength') },
            ]}
            showClear
          />

          <Form.Slot label={t('requirements.fields.department')}>
            <DepartmentSelect
              useNameAsValue
              placeholder={t('requirements.form.departmentPlaceholder')}
            />
          </Form.Slot>

          <Form.Input
            field="contactInfo"
            label={t('requirements.form.contactLabel')}
            placeholder={t('requirements.form.contactPlaceholder')}
            trigger={['blur', 'change']}
            rules={[
              { required: true, message: t('requirements.form.contactRequired') },
            ]}
            maxLength={100}
            showClear
          />

          <Form.Slot label={t('requirements.fields.expectedLaunchDate')}>
            <Form.DatePicker
              field="expectedLaunchDate"
              noLabel
              trigger={['blur', 'change']}
              rules={[
                { required: true, message: t('requirements.form.expectedLaunchDateRequired') },
              ]}
              type="date"
              style={{ width: '100%' }}
              placeholder={t('requirements.form.expectedLaunchDatePlaceholder')}
            />
          </Form.Slot>

          <Form.Select
            field="priority"
            label={`${t('requirements.fields.priority')}${t('requirements.form.optionalSuffix')}`}
            placeholder={t('requirements.form.priorityPlaceholder')}
            optionList={priorityOptions}
            className="requirement-form-modal-select-full"
          />

          {/* 附件区域 */}
          <Form.Slot label={`${t('requirements.form.attachmentLabel')}${t('requirements.form.optionalSuffix')}`}>
            <Upload
              action=""
              limit={5}
              maxSize={10240}
              draggable={false}
              listType="list"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.zip,.rar,.txt,.csv"
              onExceed={() => Toast.warning(t('requirements.form.attachmentExceed'))}
              onSizeError={() => Toast.warning(t('requirements.form.attachmentSizeError'))}
            >
              <Button icon={<UploadIcon size={14} strokeWidth={2} />} theme="light" type="tertiary">
                {t('requirements.form.attachmentUpload')}
              </Button>
            </Upload>
            <Text type="tertiary" size="small" style={{ marginTop: 4 }}>
              {t('requirements.form.attachmentHint')}
            </Text>
          </Form.Slot>

          {/* 底部提示 */}
          <Text type="tertiary" size="small" className="requirement-form-modal-hint">
            {t('requirements.form.requiredFieldsHint')}
          </Text>
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
