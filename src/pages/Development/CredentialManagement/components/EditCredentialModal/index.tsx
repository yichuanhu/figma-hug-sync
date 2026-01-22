import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Form, Button, Toast } from '@douyinfe/semi-ui';
import type { LYCredentialResponse, CredentialType } from '@/api/index';

import './index.less';

interface EditCredentialModalProps {
  visible: boolean;
  context: 'development' | 'scheduling';
  credential: LYCredentialResponse | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const EditCredentialModal = ({
  visible,
  context,
  credential,
  onCancel,
  onSuccess,
}: EditCredentialModalProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  // 获取当前入口的凭据值
  const getCurrentValue = () => {
    if (!credential) return { username: '', password: '' };
    const value = context === 'development' ? credential.test_value : credential.production_value;
    return {
      username: value?.username || '',
      password: '', // 密码不回显，显示为空
    };
  };

  const handleSubmit = async (values: {
    credential_name: string;
    username: string;
    password: string;
    description?: string;
  }) => {
    // 二次确认
    Modal.confirm({
      title: t('credential.editModal.confirmTitle'),
      content: t('credential.editModal.confirmMessage'),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      onOk: async () => {
        setLoading(true);
        try {
          // 模拟API调用
          await new Promise((resolve) => setTimeout(resolve, 500));
          
          console.log('更新凭据:', {
            ...values,
            context,
            credentialId: credential?.credential_id,
          });

          Toast.success(t('credential.editModal.success'));
          onSuccess();
        } catch (error) {
          console.error('更新凭据失败:', error);
          Toast.error(t('credential.editModal.error'));
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const typeOptions = [
    { value: 'FIXED_VALUE', label: t('credential.type.fixedValue') },
    { value: 'PERSONAL_REF', label: t('credential.type.personalRef') },
  ];

  const currentValue = getCurrentValue();

  if (!credential) return null;

  return (
    <Modal
      className="edit-credential-modal"
      title={t('credential.editModal.title')}
      visible={visible}
      onCancel={onCancel}
      footer={null}
      closeOnEsc
      maskClosable={false}
      width={480}
    >
      <Form
        className="edit-credential-modal-form"
        onSubmit={handleSubmit}
        labelPosition="top"
        initValues={{
          credential_name: credential.credential_name,
          credential_type: credential.credential_type,
          username: currentValue.username,
          password: currentValue.password,
          description: credential.description || '',
        }}
      >
        <Form.Input
          field="credential_name"
          label={t('credential.fields.name')}
          placeholder={t('credential.fields.namePlaceholder')}
          rules={[
            { required: true, message: t('credential.validation.nameRequired') },
            { max: 30, message: t('credential.validation.nameLengthError') },
          ]}
        />

        <div className="edit-credential-modal-form-type-disabled">
          <Form.Select
            field="credential_type"
            label={t('credential.fields.type')}
            optionList={typeOptions}
            disabled
          />
        </div>

        <Form.Slot
          label={
            context === 'development'
              ? t('credential.fields.testValue')
              : t('credential.fields.productionValue')
          }
        >
          <div className="edit-credential-modal-form-value-group">
            <div className="edit-credential-modal-form-value-item">
              <span className="edit-credential-modal-form-value-label">
                {t('credential.fields.username')}
              </span>
              <Form.Input
                field="username"
                noLabel
                placeholder={t('credential.fields.usernamePlaceholder')}
                rules={[{ required: true, message: t('credential.validation.usernameRequired') }]}
              />
            </div>
            <div className="edit-credential-modal-form-value-item">
              <span className="edit-credential-modal-form-value-label">
                {t('credential.fields.password')}
              </span>
              <Form.Input
                field="password"
                noLabel
                mode="password"
                placeholder={t('credential.fields.passwordEditPlaceholder')}
              />
            </div>
          </div>
        </Form.Slot>

        <Form.TextArea
          field="description"
          label={t('common.description')}
          placeholder={t('credential.fields.descriptionPlaceholder')}
          maxCount={500}
          autosize={{ minRows: 2, maxRows: 4 }}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
          <Button type="tertiary" onClick={onCancel}>{t('common.cancel')}</Button>
          <Button theme="solid" type="primary" htmlType="submit" loading={loading}>{t('common.save')}</Button>
        </div>
      </Form>
    </Modal>
  );
};

export default EditCredentialModal;
