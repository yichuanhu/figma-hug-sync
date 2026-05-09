import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Form, Button, Toast } from '@douyinfe/semi-ui';
import type { CredentialType } from '@/api/index';
import DepartmentSearchSelect from '@/components/DepartmentSearchSelect';
import OwnerSearchSelect from '@/components/OwnerSearchSelect';
import WorkspaceSelect from '@/components/WorkspaceSelect';
import './index.less';
import { MOCK_CURRENT_USER } from '@/mocks/departmentData';

interface CreateCredentialModalProps {
  visible: boolean;
  context: 'development' | 'scheduling';
  onCancel: () => void;
  onSuccess: () => void;
  defaultName?: string;
}

const CreateCredentialModal = ({
  visible,
  context,
  onCancel,
  onSuccess,
  defaultName,
}: CreateCredentialModalProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [owningDepartmentId, setOwningDepartmentId] = useState<string | undefined>(undefined);
  const [ownerId, setOwnerId] = useState<string>(MOCK_CURRENT_USER.id);
  const [workspaceId, setWorkspaceId] = useState<string | undefined>(undefined);

  const handleSubmit = async (values: {
    credential_name: string;
    credential_type: CredentialType;
    username: string;
    password: string;
    description?: string;
  }) => {
    if (!owningDepartmentId) {
      Toast.warning(t('common.owningDepartmentRequired'));
      return;
    }
    if (!ownerId) {
      Toast.warning(t('common.ownerRequired'));
      return;
    }
    if (!workspaceId) {
      Toast.warning(t('workspaceSelect.required'));
      return;
    }
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      console.log('创建凭据:', {
        ...values,
        context,
      });

      Toast.success(
        context === 'development'
          ? t('credential.createModal.successDev')
          : t('credential.createModal.successProd')
      );
      onSuccess();
    } catch (error) {
      console.error('创建凭据失败:', error);
      Toast.error(t('credential.createModal.error'));
    } finally {
      setLoading(false);
    }
  };

  const typeOptions = [
    { value: 'FIXED_VALUE', label: t('credential.type.fixedValue') },
    { value: 'PERSONAL_REF', label: t('credential.type.personalRef') },
    ...(context === 'scheduling'
      ? [{ value: 'ASSIGNED_VALUE', label: t('credential.type.assignedValue') }]
      : []),
  ];

  return (
    <Modal
      className="create-credential-modal"
      title={t('credential.createModal.title')}
      visible={visible}
      onCancel={onCancel}
      footer={null}
      closeOnEsc
      maskClosable={false}
      width={520}
    >
      <Form
        className="create-credential-modal-form"
        onSubmit={handleSubmit}
        labelPosition="top"
        initValues={{ credential_name: defaultName || undefined }}
        key={defaultName}
      >
        <Form.Input
          field="credential_name"
          label={t('credential.fields.name')}
          placeholder={t('credential.fields.namePlaceholder')}
          trigger="blur"
          rules={[
            { required: true, message: t('credential.validation.nameRequired') },
            { max: 30, message: t('credential.validation.nameLengthError') },
          ]}
          showClear
          extraText={t('credential.fields.nameHint')}
        />

        <Form.Select
          field="credential_type"
          label={t('credential.fields.type')}
          placeholder={t('credential.fields.typePlaceholder')}
          optionList={typeOptions}
          rules={[{ required: true, message: t('credential.validation.typeRequired') }]}
          initValue="FIXED_VALUE"
          className="create-credential-modal-select-full"
        />

        <Form.Slot label={t('credential.fields.value')}>
          <div className="create-credential-modal-value-group">
            <div className="create-credential-modal-value-item">
              <span className="create-credential-modal-value-label">
                {t('credential.fields.username')}
              </span>
              <Form.Input
                field="username"
                noLabel
                placeholder={t('credential.fields.usernamePlaceholder')}
                rules={[{ required: true, message: t('credential.validation.usernameRequired') }]}
              />
            </div>
            <div className="create-credential-modal-value-item">
              <span className="create-credential-modal-value-label">
                {t('credential.fields.password')}
              </span>
              <Form.Input
                field="password"
                noLabel
                mode="password"
                placeholder={t('credential.fields.passwordPlaceholder')}
                rules={[{ required: true, message: t('credential.validation.passwordRequired') }]}
              />
            </div>
          </div>
        </Form.Slot>

        <Form.TextArea
          field="description"
          label={t('common.description')}
          placeholder={t('credential.fields.descriptionPlaceholder')}
          maxCount={2000}
          autosize={{ minRows: 3, maxRows: 6 }}
          trigger="blur"
        />

        
        <Form.Slot label={{ text: t('common.owningDepartment'), required: true }}>
          <DepartmentSearchSelect
            value={owningDepartmentId}
            onChange={(v) => {
              setOwningDepartmentId(v);
              setWorkspaceId(undefined);
            }}
          />
        </Form.Slot>

        <Form.Slot label={{ text: t('workspaceSelect.label'), required: true }}>
          <WorkspaceSelect
            value={workspaceId}
            onChange={setWorkspaceId}
            departmentId={owningDepartmentId}
            placeholder={
              owningDepartmentId
                ? t('workspaceSelect.placeholder')
                : t('workspaceSelect.pickDeptFirst')
            }
            disabled={!owningDepartmentId}
          />
        </Form.Slot>

        <Form.Slot label={{ text: t('common.owner'), required: true }}>
          <OwnerSearchSelect value={ownerId} onChange={setOwnerId} />
        </Form.Slot>

        <div className="create-credential-modal-footer">
          <Button theme="light" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button htmlType="submit" theme="solid" type="primary" loading={loading}>
            {t('common.create')}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default CreateCredentialModal;
