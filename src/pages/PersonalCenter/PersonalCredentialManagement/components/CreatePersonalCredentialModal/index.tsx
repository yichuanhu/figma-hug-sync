import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Form, Toast } from '@douyinfe/semi-ui';
import type { LYCreatePersonalCredentialRequest } from '@/api/index';

import './index.less';

interface CreatePersonalCredentialModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const CreatePersonalCredentialModal = ({
  visible,
  onCancel,
  onSuccess,
}: CreatePersonalCredentialModalProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: {
    credential_name: string;
    username: string;
    password: string;
    description?: string;
  }) => {
    setLoading(true);
    try {
      // 构建API请求体
      const requestBody: LYCreatePersonalCredentialRequest = {
        credential_name: values.credential_name,
        credential_value: {
          username: values.username,
          password: values.password,
        },
        description: values.description || null,
      };
      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 500));
      console.log('创建个人凭据:', requestBody);
      Toast.success(t('personalCredential.createModal.success'));
      onSuccess();
    } catch (error) {
      console.error('创建个人凭据失败:', error);
      Toast.error(t('personalCredential.createModal.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={t('personalCredential.createModal.title')}
      visible={visible}
      onCancel={onCancel}
      footer={null}
      className="create-personal-credential-modal"
      width={480}
      closeOnEsc
      maskClosable={false}
    >
      <Form
        onSubmit={handleSubmit}
        className="create-personal-credential-form"
      >
        <Form.Input
          field="credential_name"
          label={t('personalCredential.fields.name')}
          placeholder={t('personalCredential.fields.namePlaceholder')}
          rules={[
            { required: true, message: t('personalCredential.validation.nameRequired') },
            { max: 30, message: t('personalCredential.validation.nameLengthError') },
          ]}
          maxLength={30}
        />
        <Form.Input
          field="username"
          label={t('personalCredential.fields.username')}
          placeholder={t('personalCredential.fields.usernamePlaceholder')}
          rules={[
            { required: true, message: t('personalCredential.validation.usernameRequired') },
            { max: 100, message: t('personalCredential.validation.usernameLengthError') },
          ]}
          maxLength={100}
        />
        <Form.Input
          field="password"
          label={t('personalCredential.fields.password')}
          placeholder={t('personalCredential.fields.passwordPlaceholder')}
          mode="password"
          rules={[
            { required: true, message: t('personalCredential.validation.passwordRequired') },
            { max: 100, message: t('personalCredential.validation.passwordLengthError') },
          ]}
          maxLength={100}
        />
        <Form.TextArea
          field="description"
          label={t('common.description')}
          placeholder={t('personalCredential.fields.descriptionPlaceholder')}
          maxCount={2000}
          autosize={{ minRows: 3, maxRows: 6 }}
        />
        <div className="create-personal-credential-modal-footer">
          <Form.Slot>
            <div className="footer-buttons">
              <button type="button" className="semi-button semi-button-tertiary" onClick={onCancel}>
                {t('common.cancel')}
              </button>
              <button type="submit" className="semi-button semi-button-primary" disabled={loading}>
                {t('common.confirm')}
              </button>
            </div>
          </Form.Slot>
        </div>
      </Form>
    </Modal>
  );
};

export default CreatePersonalCredentialModal;
