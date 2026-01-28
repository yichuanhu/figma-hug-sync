import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Form, Button, Toast, Typography } from '@douyinfe/semi-ui';
import type { LYCredentialResponse } from '@/api/index';

import './index.less';

// Mock个人凭据数据
interface PersonalCredential {
  id: string;
  name: string;
  username: string;
}

const mockPersonalCredentials: PersonalCredential[] = [
  { id: '1', name: '我的工作邮箱', username: 'work@example.com' },
  { id: '2', name: '我的VPN账号', username: 'vpn_user' },
  { id: '3', name: '我的ERP账号', username: 'erp_admin' },
  { id: '4', name: '我的CRM账号', username: 'crm_user' },
  { id: '5', name: '我的Git账号', username: 'git_dev' },
];

interface LinkPersonalCredentialModalProps {
  visible: boolean;
  credential: LYCredentialResponse | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const LinkPersonalCredentialModal = ({
  visible,
  credential,
  onCancel,
  onSuccess,
}: LinkPersonalCredentialModalProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [personalCredentials, setPersonalCredentials] = useState<PersonalCredential[]>([]);

  useEffect(() => {
    if (visible) {
      // 模拟加载个人凭据列表
      setPersonalCredentials(mockPersonalCredentials);
    }
  }, [visible]);

  const handleSubmit = async (values: { personal_credential_id: string }) => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 500));

      console.log('关联个人凭据:', {
        credential_id: credential?.credential_id,
        personal_credential_id: values.personal_credential_id,
      });

      Toast.success(t('credential.linkPersonal.success'));
      onSuccess();
    } catch (error) {
      console.error('关联个人凭据失败:', error);
      Toast.error(t('credential.linkPersonal.error'));
    } finally {
      setLoading(false);
    }
  };

  const { Text } = Typography;

  const selectOptions = personalCredentials.map((item) => ({
    value: item.id,
    label: item.name,
    showTick: true,
  }));

  return (
    <Modal
      className="link-personal-credential-modal"
      title={t('credential.linkPersonal.title')}
      visible={visible}
      onCancel={onCancel}
      footer={null}
      closeOnEsc
      maskClosable={false}
      width={480}
    >
      <div className="link-personal-credential-modal-content">
        <div className="link-personal-credential-modal-info">
          <Text type="tertiary">{t('credential.linkPersonal.description')}</Text>
        </div>

        <div className="link-personal-credential-modal-credential-name">
          <Text strong>{t('credential.fields.name')}：</Text>
          <Text>{credential?.credential_name}</Text>
        </div>

        <Form
          className="link-personal-credential-modal-form"
          onSubmit={handleSubmit}
          labelPosition="top"
        >
          <Form.Select
            field="personal_credential_id"
            label={t('credential.linkPersonal.selectLabel')}
            placeholder={t('credential.linkPersonal.selectPlaceholder')}
            optionList={selectOptions}
            rules={[{ required: true, message: t('credential.linkPersonal.selectRequired') }]}
            className="link-personal-credential-modal-select"
            filter
          />

          <div className="link-personal-credential-modal-footer">
            <Button theme="light" onClick={onCancel}>
              {t('common.cancel')}
            </Button>
            <Button htmlType="submit" theme="solid" type="primary" loading={loading}>
              {t('common.confirm')}
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
};

export default LinkPersonalCredentialModal;
