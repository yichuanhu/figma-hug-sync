import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Form, Toast, Button } from '@douyinfe/semi-ui';
import type { LYPersonalCredentialResponse, LYUpdatePersonalCredentialRequest } from '@/api/index';

import './index.less';

interface EditPersonalCredentialModalProps {
  visible: boolean;
  credential: LYPersonalCredentialResponse | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const EditPersonalCredentialModal = ({
  visible,
  credential,
  onCancel,
  onSuccess,
}: EditPersonalCredentialModalProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formApi, setFormApi] = useState<any>(null);

  useEffect(() => {
    if (visible && credential && formApi) {
      formApi.setValues({
        credential_name: credential.credential_name,
        username: credential.credential_value?.username || '',
        password: '', // 密码不回显
        description: credential.description || '',
      });
    }
  }, [visible, credential, formApi]);

  const handleSubmit = async (values: {
    credential_name: string;
    username: string;
    password?: string;
    description?: string;
  }) => {
    setLoading(true);
    try {
      // 构建API请求体
      const requestBody: LYUpdatePersonalCredentialRequest = {
        credential_name: values.credential_name,
        credential_value: values.password 
          ? { username: values.username, password: values.password }
          : { username: values.username, password: '' }, // 空密码表示不修改
        description: values.description || null,
      };
      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 500));
      console.log('编辑个人凭据:', requestBody);
      Toast.success(t('personalCredential.editModal.success'));
      onSuccess();
    } catch (error) {
      console.error('编辑个人凭据失败:', error);
      Toast.error(t('personalCredential.editModal.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={t('personalCredential.editModal.title')}
      visible={visible}
      onCancel={onCancel}
      footer={null}
      className="edit-personal-credential-modal"
      width={520}
      centered
      closeOnEsc
      maskClosable={false}
    >
      <Form
        onSubmit={handleSubmit}
        getFormApi={setFormApi}
        labelPosition="top"
        className="edit-personal-credential-modal-form"
      >
        <div className="edit-personal-credential-modal-content">
          <Form.Input
            field="credential_name"
            label={t('personalCredential.fields.name')}
            placeholder={t('personalCredential.fields.namePlaceholder')}
            trigger="blur"
            disabled
            extraText={t('personalCredential.fields.nameEditHint')}
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
            placeholder={t('personalCredential.fields.passwordEditPlaceholder')}
            mode="password"
            trigger="blur"
            extraText={t('personalCredential.fields.passwordEditHint')}
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

        <div className="edit-personal-credential-modal-footer">
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

export default EditPersonalCredentialModal;
