import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  SideSheet,
  Table,
  Button,
  Toast,
  Modal,
  Typography,
  Space,
  Row,
  Col,
} from '@douyinfe/semi-ui';
import {
  IconClose,
  IconDeleteStroked,
} from '@douyinfe/semi-icons';
import type { PersonalCredential } from '../../index';

import './index.less';

// 关联的凭据类型
interface LinkedCredential {
  credential_id: string;
  credential_name: string;
  description: string | null;
  linked_at: string;
}

// Mock数据生成
const generateMockLinkedCredentials = (personalCredentialId: string): LinkedCredential[] => {
  // 模拟不同个人凭据有不同数量的关联凭据
  const hash = personalCredentialId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const count = (hash % 5) + 1; // 1-5个关联凭据
  
  const credentialNames = [
    '企业邮箱凭据',
    'Git仓库凭据',
    'ERP系统凭据',
    'VPN连接凭据',
    'OA系统凭据',
    '数据库连接凭据',
    'SSH服务器凭据',
    'CRM系统凭据',
  ];

  return Array.from({ length: count }, (_, i) => ({
    credential_id: `cred-${personalCredentialId.slice(0, 8)}-${i}`,
    credential_name: credentialNames[(hash + i) % credentialNames.length],
    description: `这是${credentialNames[(hash + i) % credentialNames.length]}的描述信息，用于流程运行时的认证`,
    linked_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  }));
};

interface LinkedCredentialsDrawerProps {
  visible: boolean;
  credential: PersonalCredential | null;
  onClose: () => void;
  onUnlinkSuccess: () => void;
}

const LinkedCredentialsDrawer = ({
  visible,
  credential,
  onClose,
  onUnlinkSuccess,
}: LinkedCredentialsDrawerProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [linkedCredentials, setLinkedCredentials] = useState<LinkedCredential[]>([]);

  useEffect(() => {
    if (visible && credential) {
      setLoading(true);
      // 模拟API调用
      setTimeout(() => {
        setLinkedCredentials(generateMockLinkedCredentials(credential.credential_id));
        setLoading(false);
      }, 300);
    }
  }, [visible, credential]);

  // 跳转到凭据详情
  const handleCredentialClick = (record: LinkedCredential) => {
    navigate(`/dev-center/business-assets/credentials?detail=${record.credential_id}`);
    onClose();
  };

  // 解除关联
  const handleUnlink = (record: LinkedCredential) => {
    Modal.confirm({
      title: t('personalCredential.linkedCredentials.unlinkConfirmTitle'),
      icon: <IconDeleteStroked style={{ color: 'var(--semi-color-danger)' }} />,
      content: t('personalCredential.linkedCredentials.unlinkConfirmContent', { name: record.credential_name }),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      okButtonProps: { type: 'danger' },
      onOk: async () => {
        // 模拟解除关联
        await new Promise((resolve) => setTimeout(resolve, 500));
        Toast.success(t('personalCredential.linkedCredentials.unlinkSuccess'));
        // 从列表中移除
        setLinkedCredentials((prev) => prev.filter((item) => item.credential_id !== record.credential_id));
        onUnlinkSuccess();
      },
    });
  };

  const { Text, Title } = Typography;

  const columns = [
    {
      title: t('personalCredential.linkedCredentials.table.name'),
      dataIndex: 'credential_name',
      key: 'credential_name',
      width: 180,
      render: (text: string, record: LinkedCredential) => (
        <span
          className="linked-credentials-drawer-link"
          onClick={() => handleCredentialClick(record)}
        >
          {text}
        </span>
      ),
    },
    {
      title: t('common.description'),
      dataIndex: 'description',
      key: 'description',
      render: (text: string | null) => (
        <Text
          ellipsis={{ showTooltip: true }}
          className="linked-credentials-drawer-description"
        >
          {text || '-'}
        </Text>
      ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 100,
      render: (_: unknown, record: LinkedCredential) => (
        <Button
          type="danger"
          theme="borderless"
          size="small"
          onClick={() => handleUnlink(record)}
        >
          {t('personalCredential.linkedCredentials.unlink')}
        </Button>
      ),
    },
  ];

  return (
    <SideSheet
      className="linked-credentials-drawer"
      title={null}
      visible={visible}
      onCancel={onClose}
      placement="right"
      width={600}
      closable={false}
      mask={false}
      headerStyle={{ display: 'none' }}
      bodyStyle={{ padding: 0 }}
    >
      <div className="linked-credentials-drawer-content">
        <div className="linked-credentials-drawer-header">
          <Row type="flex" justify="space-between" align="middle">
            <Col>
              <Space>
                <Title heading={5} style={{ margin: 0 }}>
                  {t('personalCredential.linkedCredentials.title')}
                </Title>
                <Text type="tertiary">- {credential?.credential_name}</Text>
              </Space>
            </Col>
            <Col>
              <Button
                icon={<IconClose />}
                theme="borderless"
                type="tertiary"
                onClick={onClose}
              />
            </Col>
          </Row>
          <Text type="tertiary" className="linked-credentials-drawer-description-text">
            {t('personalCredential.linkedCredentials.description')}
          </Text>
        </div>

        <div className="linked-credentials-drawer-table">
          <Table
            columns={columns}
            dataSource={linkedCredentials}
            rowKey="credential_id"
            loading={loading}
            pagination={false}
            scroll={{ y: 'calc(100vh - 200px)' }}
            empty={t('personalCredential.linkedCredentials.empty')}
          />
        </div>
      </div>
    </SideSheet>
  );
};

export default LinkedCredentialsDrawer;
