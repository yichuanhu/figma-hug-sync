import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Form, Toast } from '@douyinfe/semi-ui';

import './index.less';

// Mock凭据数据（类型为 PERSONAL_REF 的凭据）
interface Credential {
  id: string;
  name: string;
}

const mockCredentials: Credential[] = [
  { id: '1', name: '企业邮箱凭据' },
  { id: '2', name: '数据库连接凭据' },
  { id: '3', name: 'SSH服务器凭据' },
  { id: '4', name: 'Git仓库凭据' },
  { id: '5', name: 'ERP系统凭据' },
];

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
  const [credentials, setCredentials] = useState<Credential[]>([]);

  useEffect(() => {
    if (visible) {
      // 模拟加载凭据列表
      setCredentials(mockCredentials);
    }
  }, [visible]);

  const handleSubmit = async (values: {
    credential_name: string;
    username: string;
    password: string;
    description?: string;
    linked_credential_id?: string;
  }) => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 500));
      console.log('创建个人凭据:', values);
      Toast.success(t('personalCredential.createModal.success'));
      onSuccess();
    } catch (error) {
      console.error('创建个人凭据失败:', error);
      Toast.error(t('personalCredential.createModal.error'));
    } finally {
      setLoading(false);
    }
  };

  const selectOptions = credentials.map((item) => ({
    value: item.id,
    label: item.name,
  }));

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
        <Form.Select
          field="linked_credential_id"
          label={t('personalCredential.fields.linkedCredential')}
          placeholder={t('personalCredential.fields.linkedCredentialPlaceholder')}
          optionList={selectOptions}
          showClear
          filter
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
