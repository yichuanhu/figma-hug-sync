import { useTranslation } from 'react-i18next';
import { Banner, Button } from '@douyinfe/semi-ui';
import DetailDrawerWrapper from '@/components/DetailDrawerWrapper';
import StatusTag, { type ShareStatus } from '@/components/sharing/StatusTag';
import type { PublishProcessRecord } from '../../types';

interface Props {
  visible: boolean;
  onClose: () => void;
  record: PublishProcessRecord | null;
  dataList: PublishProcessRecord[];
  onNavigate: (record: PublishProcessRecord) => void;
  onPublish: (record: PublishProcessRecord) => void;
}

const ProcessDetailDrawer = ({ visible, onClose, record, dataList, onNavigate, onPublish }: Props) => {
  const { t } = useTranslation();

  if (!record) return null;

  const canPublish = record.shareStatus === 'UNPUBLISHED';

  const statusLabelKey: Record<PublishProcessRecord['shareStatus'], ShareStatus> = {
    UNPUBLISHED: 'DRAFT',
    PENDING_APPROVAL: 'PENDING_APPROVAL',
    PUBLISHED: 'PUBLISHED',
    REJECTED: 'REJECTED',
  };

  const renderShareStatusBanner = () => {
    if (record.shareStatus === 'UNPUBLISHED') return null;
    if (record.shareStatus === 'PENDING_APPROVAL') {
      return (
        <Banner
          type="info"
          fullMode={false}
          closeIcon={null}
          description={t('publishToSharing.banner.pending', { assetId: record.assetId })}
        />
      );
    }
    if (record.shareStatus === 'PUBLISHED') {
      return (
        <Banner
          type="success"
          fullMode={false}
          closeIcon={null}
          description={t('publishToSharing.banner.published', { assetId: record.assetId })}
        />
      );
    }
    return (
      <Banner
        type="danger"
        fullMode={false}
        closeIcon={null}
        description={t('publishToSharing.banner.rejected', { reason: record.reviewComment || '-' })}
      />
    );
  };

  return (
    <DetailDrawerWrapper
      visible={visible}
      onClose={onClose}
      title={record.processName}
      dataList={dataList}
      currentId={record.id}
      onNavigate={onNavigate}
      defaultWidth={900}
      storageKey="publishProcessDrawerWidth"
      className="pp-detail-drawer"
    >
      <div style={{ padding: '16px 24px 0' }}>{renderShareStatusBanner()}</div>

      <div className="pp-detail-section">
        <div className="pp-detail-section-title">{t('publishToSharing.detail.processInfo')}</div>
        <div className="pp-detail-grid">
          <div className="pp-detail-item">
            <span className="pp-detail-label">{t('publishToSharing.col.processName')}</span>
            <span className="pp-detail-value">{record.processName}</span>
          </div>
          <div className="pp-detail-item">
            <span className="pp-detail-label">{t('publishToSharing.col.version')}</span>
            <span className="pp-detail-value">{record.version}</span>
          </div>
          <div className="pp-detail-item">
            <span className="pp-detail-label">{t('publishToSharing.col.shareStatus')}</span>
            <span className="pp-detail-value">
              <StatusTag status={statusLabelKey[record.shareStatus]} />
            </span>
          </div>
          <div className="pp-detail-item">
            <span className="pp-detail-label">{t('publishToSharing.col.department')}</span>
            <span className="pp-detail-value">{record.department}</span>
          </div>
          <div className="pp-detail-item">
            <span className="pp-detail-label">{t('publishToSharing.detail.releaseId')}</span>
            <span className="pp-detail-value">{record.releaseId}</span>
          </div>
          <div className="pp-detail-item">
            <span className="pp-detail-label">{t('publishToSharing.col.publisher')}</span>
            <span className="pp-detail-value">{record.publisherName}（{record.publisherDepartment}）</span>
          </div>
          <div className="pp-detail-item">
            <span className="pp-detail-label">{t('publishToSharing.col.publishTime')}</span>
            <span className="pp-detail-value">{record.publishTime}</span>
          </div>
          {record.assetId && (
            <div className="pp-detail-item">
              <span className="pp-detail-label">{t('publishToSharing.detail.assetId')}</span>
              <span className="pp-detail-value">{record.assetId}</span>
            </div>
          )}
        </div>
      </div>

      <div className="pp-detail-section">
        <div className="pp-detail-section-title">{t('publishToSharing.detail.description')}</div>
        <div style={{ fontSize: 13, color: 'var(--semi-color-text-1)', lineHeight: 1.7 }}>
          {record.description || '-'}
        </div>
      </div>

      {canPublish && (
        <div className="pp-detail-footer">
          <Button onClick={onClose}>{t('common.close')}</Button>
          <Button theme="solid" type="primary" onClick={() => onPublish(record)}>
            {t('publishToSharing.detail.publishVersion', { version: record.version })}
          </Button>
        </div>
      )}
    </DetailDrawerWrapper>
  );
};

export default ProcessDetailDrawer;
