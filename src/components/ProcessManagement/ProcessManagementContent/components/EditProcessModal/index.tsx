import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Form, Toast, Button } from '@douyinfe/semi-ui';
import type { LYUpdateProcessRequest, LYProcessResponse } from '@/api';
import DepartmentSelect from '@/components/DepartmentSelect';
import OwnerSelect from '@/components/OwnerSelect';
import { useCollaboratorPermission } from '@/hooks/useCollaboratorPermission';
import { getDependents, cascadeUpdateDepartment } from '@/mocks/processDependencies';
import { getDepartmentName } from '@/mocks/departmentData';
import './index.less';

interface EditProcessModalProps {
  visible: boolean;
  onCancel: () => void;
  processData: LYProcessResponse | null;
  onSuccess?: (updatedData: LYProcessResponse) => void;
}

const EditProcessModal = ({ visible, onCancel, processData, onSuccess }: EditProcessModalProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [owningDepartmentId, setOwningDepartmentId] = useState<string | undefined>(processData?.owning_department_id || undefined);
  const [ownerId, setOwnerId] = useState<string | undefined>(processData?.owner_id || undefined);
  const { canManage } = useCollaboratorPermission('PROCESS', processData?.id);

  const existingProcessNames = ['订单自动处理流程', '财务报销审批流程', '人事入职流程'];

  const validateProcessNameFormat = (rule: unknown, value: string, callback: (error?: string) => void) => {
    if (!value) {
      callback();
      return true;
    }
    const namePattern = /^[^\d][a-zA-Z0-9\u4e00-\u9fa5_]*$/;
    if (!namePattern.test(value.trim())) {
      callback(t('development.processDevelopment.createModal.validation.nameFormatError'));
      return false;
    }
    callback();
    return true;
  };

  const validateProcessNameUnique = (rule: unknown, value: string, callback: (error?: string) => void) => {
    if (value === processData?.name) {
      callback();
      return true;
    }
    if (value && existingProcessNames.includes(value.trim())) {
      callback(t('development.processDevelopment.createModal.validation.nameExists'));
      return false;
    }
    callback();
    return true;
  };

  const performSubmit = async (values: Record<string, unknown>, finalDeptId: string | undefined) => {
    if (!processData?.id) return;
    setLoading(true);
    try {
      const finalDeptName = finalDeptId ? getDepartmentName(finalDeptId) : processData.owning_department_name;

      const updateRequest: LYUpdateProcessRequest = {
        name: values.name as string,
        description: (values.description as string) || undefined,
      };

      await new Promise((resolve) => setTimeout(resolve, 300));

      // 若归属部门变更，同步级联更新依赖资源（mock）
      const deptChanged = finalDeptId !== processData.owning_department_id;
      let cascadedTotal = 0;
      if (deptChanged && finalDeptId) {
        const result = cascadeUpdateDepartment(processData.id, finalDeptId, finalDeptName || finalDeptId);
        cascadedTotal = result.total;
      }

      const updatedProcess: LYProcessResponse = {
        ...processData,
        name: updateRequest.name || processData.name,
        description: updateRequest.description || processData.description,
        owning_department_id: finalDeptId ?? processData.owning_department_id,
        owning_department_name: finalDeptName ?? processData.owning_department_name,
        owner_id: ownerId ?? processData.owner_id,
        updated_at: new Date().toISOString(),
      };

      Toast.success(t('development.processDevelopment.editModal.success'));
      if (cascadedTotal > 0) {
        Toast.info(t('development.processDevelopment.editModal.cascadeSuccess', { total: cascadedTotal }));
      }
      onSuccess?.(updatedProcess);
      onCancel();
    } catch (error) {
      console.error('更新流程失败:', error);
      Toast.error(t('development.processDevelopment.editModal.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (!processData?.id) return;
    if (!owningDepartmentId) {
      Toast.warning(t('common.owningDepartmentRequired'));
      return;
    }
    if (!ownerId) {
      Toast.warning(t('common.ownerRequired'));
      return;
    }

    const deptChanged = owningDepartmentId !== processData.owning_department_id;
    if (deptChanged) {
      const dependents = getDependents(processData.id);
      if (dependents.total > 0) {
        Modal.confirm({
          title: t('development.processDevelopment.editModal.cascadeConfirm.title'),
          content: t('development.processDevelopment.editModal.cascadeConfirm.content', {
            total: dependents.total,
            triggers: dependents.triggers.length,
            tasks: dependents.tasks.length,
            templates: dependents.templates.length,
          }),
          okText: t('development.processDevelopment.editModal.cascadeConfirm.ok'),
          cancelText: t('development.processDevelopment.editModal.cascadeConfirm.cancel'),
          onOk: () => performSubmit(values, owningDepartmentId),
        });
        return;
      }
    }
    performSubmit(values, owningDepartmentId);
  };

  return (
    <Modal
      title={t('development.processDevelopment.editModal.title')}
      visible={visible}
      onCancel={onCancel}
      footer={null}
      width={520}
      closeOnEsc
      maskClosable={false}
    >
      <Form
        onSubmit={handleSubmit}
        labelPosition="top"
        className="edit-process-modal-form"
        initValues={{
          name: processData?.name || '',
          description: processData?.description || '',
        }}
        key={processData?.id}
      >
        <Form.Input
          field="name"
          label={t('development.processDevelopment.fields.processName')}
          placeholder={t('development.processDevelopment.createModal.fields.namePlaceholder')}
          trigger={['blur', 'change']}
          rules={[
            { required: true, message: t('development.processDevelopment.createModal.validation.nameRequired') },
            { max: 100, message: t('development.processDevelopment.createModal.validation.nameLengthError') },
            { validator: validateProcessNameFormat },
            { max: 100, message: t('development.processDevelopment.createModal.validation.nameLengthError') },
            { validator: validateProcessNameUnique },
          ]}
        />

        <Form.TextArea
          field="description"
          label={t('common.description')}
          placeholder={t('development.processDevelopment.createModal.fields.descriptionPlaceholder')}
          autosize={{ minRows: 3, maxRows: 6 }}
          maxCount={2000}
          trigger={['blur', 'change']}
          rules={[
            { max: 2000, message: t('development.processDevelopment.createModal.validation.descriptionLengthError') },
          ]}
        />

        <Form.Slot label={{ text: t('common.owningDepartment'), required: true }}>
          <DepartmentSelect
            value={owningDepartmentId}
            onChange={setOwningDepartmentId}
            disabled={!canManage}
          />
        </Form.Slot>

        <Form.Slot label={{ text: t('common.owner'), required: true }}>
          <OwnerSelect value={ownerId} onChange={setOwnerId} disabled={!canManage} />
        </Form.Slot>

        <div className="edit-process-modal-footer">
          <Button theme="light" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button htmlType="submit" theme="solid" type="primary" loading={loading}>
            {t('common.save')}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default EditProcessModal;
