import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Form, Button, Toast, Typography } from '@douyinfe/semi-ui';
import type { LYPersonalCredentialResponse, LYLinkCredentialRequest } from '@/api/index';

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

interface LinkCredentialModalProps {
  visible: boolean;
  credential: LYPersonalCredentialResponse | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const LinkCredentialModal = ({
  visible,
  credential,
  onCancel,
  onSuccess,
}: LinkCredentialModalProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<Credential[]>([]);

  useEffect(() => {
    if (visible) {
      // 模拟加载凭据列表
      setCredentials(mockCredentials);
    }
  }, [visible]);

  const handleSubmit = async (values: { credential_ids: string[] }) => {
    setLoading(true);
    try {
      // 构建API请求体（仅关联第一个凭据，或者多次调用）
      const requestBody: LYLinkCredentialRequest = {
        personal_credential_id: credential?.credential_id || '',
        credential_id: values.credential_ids[0] || '',
        credential_ids: values.credential_ids,
      };
      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 500));

      console.log('关联凭据:', requestBody);

      Toast.success(t('personalCredential.linkCredential.success'));
      onSuccess();
    } catch (error) {
      console.error('关联凭据失败:', error);
      Toast.error(t('personalCredential.linkCredential.error'));
    } finally {
      setLoading(false);
    }
  };

  const { Text } = Typography;

  const selectOptions = credentials.map((item) => ({
    value: item.id,
    label: item.name,
    showTick: true,
  }));

  return (
    <Modal
      className="link-credential-modal"
      title={t('personalCredential.linkCredential.title')}
      visible={visible}
      onCancel={onCancel}
      footer={null}
      closeOnEsc
      maskClosable={false}
      width={520}
      centered
    >
      <div className="link-credential-modal-content">
        <div className="link-credential-modal-info">
          <Text type="tertiary">{t('personalCredential.linkCredential.description')}</Text>
        </div>

        <div className="link-credential-modal-credential-name">
          <Text strong>{t('personalCredential.fields.name')}：</Text>
          <Text>{credential?.credential_name}</Text>
        </div>

        <Form
          className="link-credential-modal-form"
          onSubmit={handleSubmit}
          labelPosition="top"
        >
          <Form.Select
            field="credential_ids"
            label={t('personalCredential.linkCredential.selectLabel')}
            placeholder={t('personalCredential.linkCredential.selectPlaceholder')}
            optionList={selectOptions}
            rules={[{ required: true, message: t('credential.linkPersonal.selectRequired') }]}
            className="link-credential-modal-select"
            multiple
            maxTagCount={3}
            filter
          />

          <div className="link-credential-modal-footer">
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

export default LinkCredentialModal;
