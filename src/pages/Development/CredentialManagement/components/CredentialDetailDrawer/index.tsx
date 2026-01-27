import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  SideSheet,
  Descriptions,
  Tag,
  Button,
  Tooltip,
  Divider,
  Typography,
  Toast,
  Modal,
  Row,
  Col,
  Space,
} from '@douyinfe/semi-ui';
import {
  IconClose,
  IconEditStroked,
  IconHistogram,
  IconDeleteStroked,
  IconMaximize,
  IconMinimize,
  IconChevronLeft,
  IconChevronRight,
} from '@douyinfe/semi-icons';
import type { LYCredentialResponse, CredentialType } from '@/api/index';

import './index.less';

const { Title, Text } = Typography;

// 凭据类型配置
const typeConfig: Record<CredentialType, { color: 'blue' | 'green'; i18nKey: string }> = {
  FIXED_VALUE: { color: 'blue', i18nKey: 'credential.type.fixedValue' },
  PERSONAL_REF: { color: 'green', i18nKey: 'credential.type.personalRef' },
};

interface CredentialDetailDrawerProps {
  visible: boolean;
  credential: LYCredentialResponse | null;
  context: 'development' | 'scheduling';
  onClose: () => void;
  onEdit: (credential: LYCredentialResponse) => void;
  onDelete: (credential: LYCredentialResponse) => void;
  onRefresh: () => void;
  // 导航相关
  dataList?: LYCredentialResponse[];
  onNavigate?: (credential: LYCredentialResponse) => void;
}

const CredentialDetailDrawer = ({
  visible,
  credential,
  context,
  onClose,
  onEdit,
  onDelete,
  dataList = [],
  onNavigate,
}: CredentialDetailDrawerProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [drawerWidth, setDrawerWidth] = useState(() => {
    const saved = localStorage.getItem('credentialDetailDrawerWidth');
    return saved ? Math.max(Number(saved), 576) : 576;
  });
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(drawerWidth);

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
    localStorage.setItem('credentialDetailDrawerWidth', String(drawerWidth));
  }, [drawerWidth]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  // 导航逻辑
  const currentIndex = useMemo(() => {
    if (!credential || dataList.length === 0) return -1;
    return dataList.findIndex(item => item.credential_id === credential.credential_id);
  }, [credential, dataList]);

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < dataList.length - 1;

  const handlePrev = useCallback(() => {
    if (hasPrev && onNavigate) {
      onNavigate(dataList[currentIndex - 1]);
    }
  }, [hasPrev, onNavigate, dataList, currentIndex]);

  const handleNext = useCallback(() => {
    if (hasNext && onNavigate) {
      onNavigate(dataList[currentIndex + 1]);
    }
  }, [hasNext, onNavigate, dataList, currentIndex]);

  // 格式化时间
  const formatDateTime = (dateStr: string | undefined) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // 获取凭据值显示
  const getCredentialValueDisplay = useMemo(() => {
    if (!credential) return '-';
    const value = context === 'development' ? credential.test_value : credential.production_value;
    if (!value) return '-';
    return `${value.username}:${value.password}`;
  }, [credential, context]);

  // 查看使用记录
  const handleViewUsage = () => {
    if (!credential) return;
    const basePath = context === 'development'
      ? '/dev-center/business-assets/credentials'
      : '/scheduling-center/business-assets/credentials';
    navigate(`${basePath}/${credential.credential_id}/usage?name=${encodeURIComponent(credential.credential_name)}`);
  };

  // 编辑凭据
  const handleEdit = () => {
    if (credential) {
      onEdit(credential);
    }
  };

  // 删除凭据
  const handleDelete = () => {
    if (!credential) return;
    Modal.confirm({
      title: t('credential.deleteModal.title'),
      icon: <IconDeleteStroked style={{ color: 'var(--semi-color-danger)' }} />,
      content: t('credential.deleteModal.confirmMessage', { name: credential.credential_name }),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      okButtonProps: { type: 'danger' },
      onOk: async () => {
        // 模拟删除
        await new Promise((resolve) => setTimeout(resolve, 500));
        Toast.success(t('credential.deleteModal.success'));
        onDelete(credential);
        onClose();
      },
    });
  };

  // 描述数据
  const descriptionData = useMemo(() => {
    if (!credential) return [];
    return [
      { key: t('credential.detail.name'), value: credential.credential_name },
      {
        key: t('credential.detail.type'),
        value: (
          <Tag color={typeConfig[credential.credential_type].color} type="light">
            {t(typeConfig[credential.credential_type].i18nKey)}
          </Tag>
        ),
      },
      {
        key: context === 'development' 
          ? t('credential.detail.testValue') 
          : t('credential.detail.productionValue'),
        value: <Text>{getCredentialValueDisplay}</Text>,
      },
      { key: t('common.description'), value: credential.description || '-' },
      ...(credential.credential_type === 'PERSONAL_REF' ? [
        { key: t('credential.detail.linkedPersonalCredential'), value: credential.linked_personal_credential_value || '-' },
      ] : []),
      { key: t('common.creator'), value: credential.created_by_name || '-' },
      { key: t('common.createTime'), value: formatDateTime(credential.created_at) },
      { key: t('common.updateTime'), value: formatDateTime(credential.updated_at) },
    ];
  }, [credential, context, getCredentialValueDisplay, t]);

  if (!credential) return null;

  return (
    <SideSheet
      title={
        <Row type="flex" justify="space-between" align="middle" className="credential-detail-drawer-header">
          <Col>
            <Title heading={5} className="credential-detail-drawer-header-title">
              {credential.credential_name}
            </Title>
          </Col>
          <Col>
            <Space spacing={4}>
              {dataList.length > 1 && (
                <>
                  <Tooltip content={t('common.previous')}>
                    <Button icon={<IconChevronLeft />} theme="borderless" size="small" disabled={!hasPrev} onClick={handlePrev} />
                  </Tooltip>
                  <Tooltip content={t('common.next')}>
                    <Button icon={<IconChevronRight />} theme="borderless" size="small" disabled={!hasNext} onClick={handleNext} />
                  </Tooltip>
                  <Divider layout="vertical" className="credential-detail-drawer-header-divider" />
                </>
              )}
              <Tooltip content={t('common.edit')}>
                <Button icon={<IconEditStroked />} theme="borderless" size="small" onClick={handleEdit} />
              </Tooltip>
              <Tooltip content={t('credential.actions.viewUsage')}>
                <Button icon={<IconHistogram />} theme="borderless" size="small" onClick={handleViewUsage} />
              </Tooltip>
              <Tooltip content={t('common.delete')}>
                <Button icon={<IconDeleteStroked className="credential-detail-drawer-header-delete-icon" />} theme="borderless" size="small" onClick={handleDelete} />
              </Tooltip>
              <Divider layout="vertical" className="credential-detail-drawer-header-divider" />
              <Tooltip content={isFullscreen ? t('common.exitFullscreen') : t('common.fullscreen')}>
                <Button icon={isFullscreen ? <IconMinimize /> : <IconMaximize />} theme="borderless" size="small" onClick={toggleFullscreen} />
              </Tooltip>
              <Tooltip content={t('common.close')}>
                <Button icon={<IconClose />} theme="borderless" size="small" onClick={onClose} className="credential-detail-drawer-header-close-btn" />
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
      className={`card-sidesheet resizable-sidesheet credential-detail-drawer ${isFullscreen ? 'fullscreen-sidesheet' : ''}`}
    >
      {!isFullscreen && <div className="credential-detail-drawer-resize-handle" onMouseDown={handleMouseDown} />}
      <div className="credential-detail-drawer-content">
        <Descriptions data={descriptionData} align="left" />
      </div>
    </SideSheet>
  );
};

export default CredentialDetailDrawer;
