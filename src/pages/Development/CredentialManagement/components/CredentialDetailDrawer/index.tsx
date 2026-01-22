import { useMemo } from 'react';
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
} from '@douyinfe/semi-ui';
import {
  IconClose,
  IconEdit,
  IconHistogram,
  IconDeleteStroked,
} from '@douyinfe/semi-icons';
import type { LYCredentialResponse, CredentialType } from '@/api/index';

import './index.less';

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
}

const CredentialDetailDrawer = ({
  visible,
  credential,
  context,
  onClose,
  onEdit,
  onDelete,
}: CredentialDetailDrawerProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

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

  // 基本信息数据
  const basicInfoData = useMemo(() => {
    if (!credential) return [];
    return [
      {
        key: 'name',
        label: t('credential.detail.name'),
        value: credential.credential_name,
      },
      {
        key: 'type',
        label: t('credential.detail.type'),
        value: (
          <Tag color={typeConfig[credential.credential_type].color}>
            {t(typeConfig[credential.credential_type].i18nKey)}
          </Tag>
        ),
      },
      {
        key: 'value',
        label: context === 'development' 
          ? t('credential.detail.testValue') 
          : t('credential.detail.productionValue'),
        value: <Typography.Text copyable>{getCredentialValueDisplay}</Typography.Text>,
      },
      {
        key: 'description',
        label: t('common.description'),
        value: credential.description || '-',
      },
    ];
  }, [credential, context, getCredentialValueDisplay, t]);

  // 关联信息数据
  const linkedInfoData = useMemo(() => {
    if (!credential) return [];
    return [
      {
        key: 'linkedPersonalCredential',
        label: t('credential.detail.linkedPersonalCredential'),
        value: credential.linked_personal_credential_value || '-',
      },
    ];
  }, [credential, t]);

  // 系统信息数据
  const systemInfoData = useMemo(() => {
    if (!credential) return [];
    return [
      {
        key: 'createdBy',
        label: t('common.creator'),
        value: credential.created_by_name || '-',
      },
      {
        key: 'createdAt',
        label: t('common.createTime'),
        value: formatDateTime(credential.created_at),
      },
      {
        key: 'updatedAt',
        label: t('common.updateTime'),
        value: formatDateTime(credential.updated_at),
      },
    ];
  }, [credential, t]);

  // 自定义头部
  const renderHeader = () => (
    <div className="credential-detail-drawer-header">
      <div className="credential-detail-drawer-header-title">
        <Typography.Title heading={5} ellipsis={{ showTooltip: true }} style={{ margin: 0 }}>
          {credential?.credential_name || '-'}
        </Typography.Title>
      </div>
      <div className="credential-detail-drawer-header-actions">
        <Tooltip content={t('common.edit')}>
          <Button
            icon={<IconEdit />}
            theme="borderless"
            type="tertiary"
            onClick={handleEdit}
          />
        </Tooltip>
        <Tooltip content={t('credential.actions.viewUsage')}>
          <Button
            icon={<IconHistogram />}
            theme="borderless"
            type="tertiary"
            onClick={handleViewUsage}
          />
        </Tooltip>
        <Tooltip content={t('common.delete')}>
          <Button
            icon={<IconDeleteStroked style={{ color: 'var(--semi-color-danger)' }} />}
            theme="borderless"
            type="tertiary"
            onClick={handleDelete}
          />
        </Tooltip>
        <Divider layout="vertical" style={{ margin: '0 8px 0 4px' }} />
        <Button
          icon={<IconClose />}
          theme="borderless"
          type="tertiary"
          onClick={onClose}
        />
      </div>
    </div>
  );

  return (
    <SideSheet
      visible={visible}
      placement="right"
      width={576}
      mask={false}
      closable={false}
      headerStyle={{ padding: 0 }}
      bodyStyle={{ padding: 0 }}
      className="credential-detail-drawer"
      title={renderHeader()}
    >
      <div className="credential-detail-drawer-content">
        {/* 基本信息 */}
        <div className="credential-detail-drawer-section">
          <Typography.Title heading={6} className="credential-detail-drawer-section-title">
            {t('credential.detail.basicInfo')}
          </Typography.Title>
          <Descriptions
            data={basicInfoData}
            align="left"
            row
          />
        </div>

        {/* 关联信息 */}
        {credential?.credential_type === 'PERSONAL_REF' && (
          <div className="credential-detail-drawer-section">
            <Typography.Title heading={6} className="credential-detail-drawer-section-title">
              {t('credential.detail.linkedInfo')}
            </Typography.Title>
            <Descriptions
              data={linkedInfoData}
              align="left"
              row
            />
          </div>
        )}

        {/* 系统信息 */}
        <div className="credential-detail-drawer-section">
          <Typography.Title heading={6} className="credential-detail-drawer-section-title">
            {t('credential.detail.systemInfo')}
          </Typography.Title>
          <Descriptions
            data={systemInfoData}
            align="left"
            row
          />
        </div>
      </div>
    </SideSheet>
  );
};

export default CredentialDetailDrawer;
