import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Form, Toast, Button } from '@douyinfe/semi-ui';
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
      width={520}
      centered
      closeOnEsc
      maskClosable={false}
    >
      <Form
        onSubmit={handleSubmit}
        labelPosition="top"
        className="create-personal-credential-modal-form"
      >
        <div className="create-personal-credential-modal-content">
          <Form.Input
            field="credential_name"
            label={t('personalCredential.fields.name')}
            placeholder={t('personalCredential.fields.namePlaceholder')}
            trigger="blur"
            rules={[
              { required: true, message: t('personalCredential.validation.nameRequired') },
              { max: 30, message: t('personalCredential.validation.nameLengthError') },
            ]}
            showClear
          />
          <Form.Input
            field="username"
            label={t('personalCredential.fields.username')}
            placeholder={t('personalCredential.fields.usernamePlaceholder')}
            trigger="blur"
            rules={[
              { required: true, message: t('personalCredential.validation.usernameRequired') },
              { max: 100, message: t('personalCredential.validation.usernameLengthError') },
            ]}
            showClear
          />
          <Form.Input
            field="password"
            label={t('personalCredential.fields.password')}
            placeholder={t('personalCredential.fields.passwordPlaceholder')}
            mode="password"
            trigger="blur"
            rules={[
              { required: true, message: t('personalCredential.validation.passwordRequired') },
              { max: 100, message: t('personalCredential.validation.passwordLengthError') },
            ]}
          />
          <Form.TextArea
            field="description"
            label={t('common.description')}
            placeholder={t('personalCredential.fields.descriptionPlaceholder')}
            maxCount={2000}
            autosize={{ minRows: 2, maxRows: 4 }}
            rules={[
              { max: 2000, message: t('personalCredential.validation.descriptionLengthError') },
            ]}
          />
        </div>

        <div className="create-personal-credential-modal-footer">
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

export default CreatePersonalCredentialModal;
