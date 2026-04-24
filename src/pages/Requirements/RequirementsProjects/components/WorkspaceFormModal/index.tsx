import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Form, Toast } from '@douyinfe/semi-ui';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form';
import DepartmentSearchSelect from '@/components/DepartmentSearchSelect';
import type { Workspace } from '../../types';
import { addWorkspace, updateWorkspace } from '../../mockData';
import { departmentTree } from '@/mocks/departmentData';
import { useFormApi, useFormState } from '@douyinfe/semi-ui';

interface Props {
  visible: boolean;
  projectId: string;
  initialData?: Workspace | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormValues {
  name: string;
  departmentId: string;
  description?: string;
}

// 在部门树中按 value 找 label
const findDeptLabel = (id: string): string => {
  const walk = (nodes: typeof departmentTree): string | null => {
    for (const n of nodes) {
      if (n.value === id) return n.label;
      if (n.children) {
        const r = walk(n.children);
        if (r) return r;
      }
    }
    return null;
  };
  return walk(departmentTree) ?? id;
};

const WorkspaceFormModal = ({ visible, projectId, initialData, onClose, onSuccess }: Props) => {
  const { t } = useTranslation();
  const formApiRef = useRef<FormApi | null>(null);

  useEffect(() => {
    if (visible && formApiRef.current) {
      formApiRef.current.reset();
      if (initialData) {
        formApiRef.current.setValues({
          name: initialData.name,
          departmentId: initialData.departmentId,
          description: initialData.description,
        });
      }
    }
  }, [visible, initialData]);

  const handleOk = async () => {
    if (!formApiRef.current) return;
    try {
      const values = (await formApiRef.current.validate()) as FormValues;
      if (!values.departmentId) {
        Toast.error(t('requirements.projects.validation.departmentRequired'));
        return;
      }
      const departmentName = findDeptLabel(values.departmentId);
      try {
        if (initialData) {
          await updateWorkspace(initialData.id, {
            name: values.name,
            departmentId: values.departmentId,
            departmentName,
            description: values.description,
          });
          Toast.success(t('common.editSuccess'));
        } else {
          await addWorkspace({
            projectId,
            name: values.name,
            departmentId: values.departmentId,
            departmentName,
            description: values.description,
          });
          Toast.success(t('common.createSuccess'));
        }
        onSuccess();
        onClose();
      } catch (err) {
        if ((err as Error).message === 'DUPLICATE_NAME') {
          Toast.error(t('requirements.projects.validation.workspaceDuplicate'));
        } else {
          Toast.error(t('common.operationFailed'));
        }
      }
    } catch {
      // validation
    }
  };

  return (
    <Modal
      title={
        initialData
          ? t('requirements.projects.editWorkspace')
          : t('requirements.projects.createWorkspace')
      }
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
          label={t('requirements.projects.fields.workspaceName')}
          placeholder={t('requirements.projects.placeholders.workspaceName')}
          maxLength={80}
          showClear
          rules={[
            { required: true, message: t('requirements.projects.validation.workspaceNameRequired') },
            { max: 80, message: t('requirements.projects.validation.nameMax') },
          ]}
          trigger={['blur', 'change']}
        />
        <Form.Slot
          label={{
            text: t('requirements.projects.fields.department'),
            required: true,
          }}
        >
          <DepartmentSelectField t={t} />
        </Form.Slot>
        <Form.TextArea
          field="description"
          label={t('common.description')}
          placeholder={t('requirements.projects.placeholders.workspaceDescription')}
          maxCount={2000}
          showClear
          autosize={{ minRows: 3, maxRows: 6 }}
          rules={[{ max: 2000, message: t('requirements.projects.validation.descMax') }]}
          trigger={['blur', 'change']}
        />
      </Form>
    </Modal>
  );
};

// 把 Form.Slot 包出来：DepartmentSelect 不是 Semi Form Field
const DepartmentSelectField = ({ t }: { t: (k: string) => string }) => {
  const formApi = useFormApi();
  const formState = useFormState();
  const value = formState.values?.departmentId;
  return (
    <DepartmentSearchSelect
      value={value}
      onChange={(v: string) => {
        formApi.setValue('departmentId', v);
      }}
      placeholder={t('requirements.projects.placeholders.department')}
      style={{ width: '100%' }}
    />
  );
};

export default WorkspaceFormModal;
