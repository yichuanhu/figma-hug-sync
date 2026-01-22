import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Form, Button, Toast } from '@douyinfe/semi-ui';
import type { CredentialType } from '@/api/index';

import './index.less';

interface CreateCredentialModalProps {
  visible: boolean;
  context: 'development' | 'scheduling';
  onCancel: () => void;
  onSuccess: () => void;
}

const CreateCredentialModal = ({
  visible,
  context,
  onCancel,
  onSuccess,
}: CreateCredentialModalProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: {
    credential_name: string;
    credential_type: CredentialType;
    username: string;
    password: string;
    description?: string;
  }) => {
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
