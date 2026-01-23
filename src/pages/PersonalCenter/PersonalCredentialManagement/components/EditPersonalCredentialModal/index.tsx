import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Form, Toast } from '@douyinfe/semi-ui';
import type { PersonalCredential } from '../../index';

import './index.less';

interface EditPersonalCredentialModalProps {
  visible: boolean;
  credential: PersonalCredential | null;
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
        username: credential.username,
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
      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 500));
      console.log('编辑个人凭据:', values);
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
      width={480}
      closeOnEsc
      maskClosable={false}
    >
      <Form
        onSubmit={handleSubmit}
        getFormApi={setFormApi}
        className="edit-personal-credential-form"
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
          placeholder={t('personalCredential.fields.passwordEditPlaceholder')}
          mode="password"
          extraText={t('personalCredential.fields.passwordEditHint')}
          maxLength={100}
        />
        <Form.TextArea
          field="description"
          label={t('common.description')}
          placeholder={t('personalCredential.fields.descriptionPlaceholder')}
          maxCount={2000}
          autosize={{ minRows: 3, maxRows: 6 }}
        />
        <div className="edit-personal-credential-modal-footer">
          <Form.Slot>
            <div className="footer-buttons">
              <button type="button" className="semi-button semi-button-tertiary" onClick={onCancel}>
                {t('common.cancel')}
              </button>
              <button type="submit" className="semi-button semi-button-primary" disabled={loading}>
                {t('common.save')}
              </button>
            </div>
          </Form.Slot>
        </div>
      </Form>
    </Modal>
  );
};

export default EditPersonalCredentialModal;
