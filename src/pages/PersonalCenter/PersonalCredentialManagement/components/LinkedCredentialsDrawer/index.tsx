import { useState, useEffect, useRef, useCallback } from 'react';
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
  Tooltip,
  Divider,
} from '@douyinfe/semi-ui';
import {
  IconClose,
  IconDeleteStroked,
  IconMaximize,
  IconMinimize,
} from '@douyinfe/semi-icons';
import type { PersonalCredential } from '../../index';

import './index.less';

const { Title, Text } = Typography;

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
  
  // 抽屉状态
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [drawerWidth, setDrawerWidth] = useState(() => {
    const saved = localStorage.getItem('linkedCredentialsDrawerWidth');
    return saved ? Math.max(Number(saved), 576) : 600;
  });
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(drawerWidth);

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

  // 拖拽调整宽度
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isResizing.current = true;
      startX.current = e.clientX;
      startWidth.current = drawerWidth;
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
      const handleMouseMove = (e: MouseEvent) => {
        if (!isResizing.current) return;
        const diff = startX.current - e.clientX;
        setDrawerWidth(Math.min(Math.max(startWidth.current + diff, 576), window.innerWidth - 100));
      };
      const handleMouseUp = () => {
        isResizing.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [drawerWidth],
  );

  useEffect(() => {
    localStorage.setItem('linkedCredentialsDrawerWidth', String(drawerWidth));
  }, [drawerWidth]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

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
      title={
        <Row type="flex" justify="space-between" align="middle" className="linked-credentials-drawer-header">
          <Col>
            <Space>
              <Title heading={5} className="linked-credentials-drawer-header-title">
                {t('personalCredential.linkedCredentials.title')}
              </Title>
              <Text type="tertiary">- {credential?.credential_name}</Text>
            </Space>
          </Col>
          <Col>
            <Space spacing={8}>
              <Divider layout="vertical" className="linked-credentials-drawer-header-divider" />
              <Tooltip content={isFullscreen ? t('common.exitFullscreen') : t('common.fullscreen')}>
                <Button icon={isFullscreen ? <IconMinimize /> : <IconMaximize />} theme="borderless" size="small" onClick={toggleFullscreen} />
              </Tooltip>
              <Tooltip content={t('common.close')}>
                <Button icon={<IconClose />} theme="borderless" size="small" onClick={onClose} className="linked-credentials-drawer-header-close-btn" />
              </Tooltip>
            </Space>
          </Col>
        </Row>
      }
      visible={visible}
      onCancel={onClose}
      placement="right"
      width={isFullscreen ? '100%' : drawerWidth}
      mask={false}
      footer={null}
      closable={false}
      className={`card-sidesheet resizable-sidesheet linked-credentials-drawer ${isFullscreen ? 'fullscreen-sidesheet' : ''}`}
    >
      {!isFullscreen && <div className="linked-credentials-drawer-resize-handle" onMouseDown={handleMouseDown} />}
      <div className="linked-credentials-drawer-content">
        <Text type="tertiary" className="linked-credentials-drawer-desc">
          {t('personalCredential.linkedCredentials.description')}
        </Text>

        <div className="linked-credentials-drawer-table">
          <Table
            columns={columns}
            dataSource={linkedCredentials}
            rowKey="credential_id"
            loading={loading}
            pagination={false}
            scroll={{ y: 'calc(100vh - 240px)' }}
            empty={t('personalCredential.linkedCredentials.empty')}
          />
        </div>
      </div>
    </SideSheet>
  );
};

export default LinkedCredentialsDrawer;
