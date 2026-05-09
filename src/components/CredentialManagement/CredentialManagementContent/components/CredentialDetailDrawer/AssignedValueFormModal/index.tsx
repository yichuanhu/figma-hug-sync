import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Form, Button, Toast } from '@douyinfe/semi-ui';
import OwnerSearchSelect from '@/components/OwnerSearchSelect';
import { ALL_ORG_USERS } from '@/components/CollaboratorManager/mockData';
import {
  createAssignedValue,
  updateAssignedValue,
  type AssignedValue,
} from '../../../assignedValueMock';

interface AssignedValueFormModalProps {
  visible: boolean;
  credentialId: string;
  editing: AssignedValue | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const AssignedValueFormModal = ({
  visible,
  credentialId,
  editing,
  onCancel,
  onSuccess,
}: AssignedValueFormModalProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (visible) setUserId(editing?.user_id);
  }, [visible, editing]);

  const isEdit = !!editing;

  const handleSubmit = async (values: { account: string; password?: string; description?: string }) => {
    if (!userId) {
      Toast.warning(t('credential.assignedValue.validation.userRequired'));
      return;
    }
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 300));
      if (isEdit && editing) {
        updateAssignedValue(credentialId, editing.id, {
          account: values.account,
          description: values.description,
        });
        Toast.success(t('credential.assignedValue.editSuccess'));
      } else {
        const user = ALL_ORG_USERS.find((u) => u.id === userId);
        const r = createAssignedValue(credentialId, {
          user_id: userId,
          user_name: user?.name || userId,
          account: values.account,
          description: values.description,
        });
        if (!r.ok) {
          Toast.error(r.reason);
          setLoading(false);
          return;
        }
        Toast.success(t('credential.assignedValue.createSuccess'));
      }
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={isEdit ? t('credential.assignedValue.editTitle') : t('credential.assignedValue.createTitle')}
      visible={visible}
      onCancel={onCancel}
      footer={null}
      closeOnEsc
      maskClosable={false}
      width={520}
    >
      <Form
        labelPosition="top"
        onSubmit={handleSubmit}
        initValues={{
          account: editing?.account || '',
          password: '',
          description: editing?.description || '',
        }}
        key={editing?.id || 'new'}
      >
        <Form.Slot label={{ text: t('credential.assignedValue.fields.user'), required: true }}>
          <OwnerSearchSelect
            value={userId}
            onChange={setUserId}
            disabled={isEdit}
            placeholder={t('credential.assignedValue.fields.userPlaceholder')}
          />
        </Form.Slot>
        <Form.Input
          field="account"
          label={t('credential.assignedValue.fields.account')}
          placeholder={t('credential.assignedValue.fields.accountPlaceholder')}
          trigger={['blur', 'change']}
          rules={[{ required: true, message: t('credential.assignedValue.validation.accountRequired') }]}
        />
        <Form.Input
          field="password"
          mode="password"
          label={t('credential.assignedValue.fields.password')}
          placeholder={
            isEdit
              ? t('credential.assignedValue.fields.passwordEditPlaceholder')
              : t('credential.assignedValue.fields.passwordPlaceholder')
          }
          trigger={['blur', 'change']}
          rules={
            isEdit
              ? []
              : [{ required: true, message: t('credential.assignedValue.validation.passwordRequired') }]
          }
        />
        <Form.TextArea
          field="description"
          label={t('common.description')}
          placeholder={t('credential.assignedValue.fields.descriptionPlaceholder')}
          maxCount={2000}
          autosize={{ minRows: 2, maxRows: 4 }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <Button theme="light" onClick={onCancel}>{t('common.cancel')}</Button>
          <Button htmlType="submit" theme="solid" type="primary" loading={loading}>
            {t('common.confirm')}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default AssignedValueFormModal;
