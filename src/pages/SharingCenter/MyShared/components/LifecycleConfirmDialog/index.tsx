import { Modal, Banner, Typography } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';

export type LifecycleAction = 'archive' | 'unlist' | 'withdraw' | 'delete' | 'recover';

interface Props {
  visible: boolean;
  action: LifecycleAction | null;
  assetName: string;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

const { Text } = Typography;

const VARIANTS: Record<LifecycleAction, {
  titleKey: string;
  contentKey: string;
  bannerType?: 'warning' | 'danger' | 'info';
  danger?: boolean;
}> = {
  archive: {
    titleKey: 'sharing.assetSupply.confirm.archiveTitle',
    contentKey: 'sharing.assetSupply.confirm.archiveContent',
    bannerType: 'info',
  },
  unlist: {
    titleKey: 'sharing.assetSupply.confirm.unlistTitle',
    contentKey: 'sharing.assetSupply.confirm.unlistContent',
    bannerType: 'warning',
  },
  withdraw: {
    titleKey: 'sharing.assetSupply.confirm.withdrawTitle',
    contentKey: 'sharing.assetSupply.confirm.withdrawContent',
    bannerType: 'info',
  },
  delete: {
    titleKey: 'sharing.assetSupply.confirm.deleteTitle',
    contentKey: 'sharing.assetSupply.confirm.deleteContent',
    bannerType: 'danger',
    danger: true,
  },
  recover: {
    titleKey: 'sharing.assetSupply.confirm.recoverTitle',
    contentKey: 'sharing.assetSupply.confirm.recoverContent',
    bannerType: 'info',
  },
};

const LifecycleConfirmDialog = ({ visible, action, assetName, onCancel, onConfirm, loading }: Props) => {
  const { t } = useTranslation();
  if (!action) return null;
  const cfg = VARIANTS[action];

  return (
    <Modal
      visible={visible}
      title={t(cfg.titleKey)}
      onCancel={onCancel}
      onOk={onConfirm}
      confirmLoading={loading}
      okText={t('common.confirm')}
      cancelText={t('common.cancel')}
      okButtonProps={cfg.danger ? { type: 'danger' } : undefined}
      width={520}
      centered
    >
      <Banner
        type={cfg.bannerType ?? 'info'}
        fullMode={false}
        closeIcon={null}
        description={<Text>{t(cfg.contentKey, { name: assetName })}</Text>}
      />
    </Modal>
  );
};

export default LifecycleConfirmDialog;
