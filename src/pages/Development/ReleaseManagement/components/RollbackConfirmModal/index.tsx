import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Typography, Tag, Space, Banner } from '@douyinfe/semi-ui';
import type { LYReleaseResponse } from '@/api';

import './index.less';
import { AlertTriangle } from 'lucide-react';

const { Title, Text } = Typography;

interface RollbackConfirmModalProps {
  visible: boolean;
  release: LYReleaseResponse | null;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

const RollbackConfirmModal: React.FC<RollbackConfirmModalProps> = ({
  visible,
  release,
  onCancel,
  onConfirm,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  if (!release) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  const processContent = release.contents?.[0];
  const processName = processContent?.process_name || '-';
  const versionNumber = processContent?.version_number || '-';

  return (
    <Modal
      className="rollback-confirm-modal"
      title={
        <Space>
          <AlertTriangle size={16} strokeWidth={2} color="var(--semi-color-warning)" />
          {t('release.rollback.title')}
        </Space>
      }
      visible={visible}
      onCancel={onCancel}
      onOk={handleConfirm}
      okText={t('release.rollback.confirmRollback')}
      cancelText={t('common.cancel')}
      okButtonProps={{ type: 'danger', loading }}
      width={520}
      centered
      maskClosable={false}
    >
      <div className="rollback-confirm-modal-content">
        {/* Warning info */}
        <Banner
          type="warning"
          description={t('release.rollback.warning', {
            processName,
            version: versionNumber,
          })}
          className="rollback-confirm-modal-banner"
        />

        {/* Version info card */}
        <div className="rollback-confirm-modal-versions">
          {/* Current version */}
          <div className="rollback-confirm-modal-version-card">
            <Text type="tertiary" size="small">
              {t('release.rollback.currentVersion')}
            </Text>
            <div className="rollback-confirm-modal-version-card-content">
              <Text strong>{processContent?.version_number}</Text>
              <Tag size="small" color="green">
                {t('release.rollback.active')}
              </Tag>
            </div>
            <Text type="tertiary" size="small">
              {t('release.rollback.willBecomeInactive')}
            </Text>
          </div>

          {/* TargetVersion */}
          <div className="rollback-confirm-modal-version-card">
            <Text type="tertiary" size="small">
              {t('release.rollback.targetVersion')}
            </Text>
            <div className="rollback-confirm-modal-version-card-content">
              <Text strong>{versionNumber}</Text>
              <Tag size="small" color="grey">
                {t('release.rollback.inactive')}
              </Tag>
            </div>
            <Text type="tertiary" size="small">
              {t('release.rollback.willBecomeActive')}
            </Text>
          </div>
        </div>

        {/*  */}
        <div className="rollback-confirm-modal-impacts">
          <Text strong>{t('release.rollback.impacts')}:</Text>
          <ul className="rollback-confirm-modal-impact-list">
            <li>
              <Text type="tertiary">
                {t('release.rollback.impactNewTasks', {
                  version: versionNumber,
                  currentVersion: processContent?.version_number,
                })}
              </Text>
            </li>
            <li>
              <Text type="tertiary">
                {t('release.rollback.impactRunningTasks', {
                  currentVersion: processContent?.version_number,
                })}
              </Text>
            </li>
            <li>
              <Text type="tertiary">{t('release.rollback.impactAuditTrail')}</Text>
            </li>
            <li>
              <Text type="tertiary">{t('release.rollback.impactDependencies')}</Text>
            </li>
          </ul>
        </div>
      </div>
    </Modal>
  );
};

export default RollbackConfirmModal;
