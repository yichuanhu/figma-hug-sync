import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Form, Toast } from '@douyinfe/semi-ui';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form';
import type { Project } from '../../types';
import { addProject, updateProject } from '../../mockData';

interface Props {
  visible: boolean;
  initialData?: Project | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormValues {
  name: string;
  dateRange?: [Date | string, Date | string];
  description?: string;
}

const ProjectFormModal = ({ visible, initialData, onClose, onSuccess }: Props) => {
  const { t } = useTranslation();
  const formApiRef = useRef<FormApi | null>(null);

  useEffect(() => {
    if (visible && formApiRef.current) {
      formApiRef.current.reset();
      if (initialData) {
        formApiRef.current.setValues({
          name: initialData.name,
          dateRange:
            initialData.startDate && initialData.endDate
              ? [initialData.startDate, initialData.endDate]
              : undefined,
          description: initialData.description,
        });
      }
    }
  }, [visible, initialData]);

  const handleOk = async () => {
    if (!formApiRef.current) return;
    try {
      const values = (await formApiRef.current.validate()) as FormValues;
      const startDate = values.dateRange?.[0]
        ? new Date(values.dateRange[0]).toISOString().slice(0, 10)
        : undefined;
      const endDate = values.dateRange?.[1]
        ? new Date(values.dateRange[1]).toISOString().slice(0, 10)
        : undefined;
      if (initialData) {
        await updateProject(initialData.id, {
          name: values.name,
          startDate,
          endDate,
          description: values.description,
        });
        Toast.success(t('common.editSuccess'));
      } else {
        await addProject({
          name: values.name,
          startDate,
          endDate,
          description: values.description,
        });
        Toast.success(t('common.createSuccess'));
      }
      onSuccess();
      onClose();
    } catch {
      // validate fail
    }
  };

  return (
    <Modal
      title={initialData ? t('requirements.projects.editProject') : t('requirements.projects.createProject')}
      visible={visible}
      onCancel={onClose}
      onOk={handleOk}
      okText={t('common.confirm')}
      cancelText={t('common.cancel')}
      width={520}
      centered
      maskClosable={false}
    >
      <Form
        getFormApi={(api) => (formApiRef.current = api)}
        labelPosition="top"
        style={{ paddingTop: 8 }}
      >
        <Form.Input
          field="name"
          label={t('requirements.projects.fields.name')}
          placeholder={t('requirements.projects.placeholders.name')}
          maxLength={80}
          showClear
          rules={[
            { required: true, message: t('requirements.projects.validation.nameRequired') },
            { max: 80, message: t('requirements.projects.validation.nameMax') },
          ]}
          trigger={['blur', 'change']}
        />
        <Form.DatePicker
          field="dateRange"
          type="dateRange"
          label={t('requirements.projects.fields.dateRange')}
          style={{ width: '100%' }}
        />
        <Form.TextArea
          field="description"
          label={t('common.description')}
          placeholder={t('requirements.projects.placeholders.description')}
          maxCount={2000}
          showClear
          autosize={{ minRows: 4, maxRows: 8 }}
          rules={[{ max: 2000, message: t('requirements.projects.validation.descMax') }]}
          trigger={['blur', 'change']}
        />
      </Form>
    </Modal>
  );
};

export default ProjectFormModal;
