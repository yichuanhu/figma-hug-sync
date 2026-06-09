import { useMemo, useState } from 'react';
import { Button, Space, Typography, Toast, Tooltip } from '@douyinfe/semi-ui';
import {
  Pencil, FileText, Archive, EyeOff, Send, ExternalLink, Undo2, RotateCcw,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import DetailDrawerWrapper from '@/components/DetailDrawerWrapper';
import AssetDetail from '@/pages/Sharing/Market/AssetDetail';
import AssetTypeIcon from '@/pages/Sharing/Market/components/AssetTypeIcon';
import StatusTag from '@/components/sharing/StatusTag';
import {
  type ShareAsset, archiveAsset, recoverAsset, unlistAsset, deleteAsset, withdrawAsset,
} from '@/pages/SharingCenter/MyShared/store';
import LifecycleConfirmDialog, { type LifecycleAction } from '../LifecycleConfirmDialog';

const { Text } = Typography;

const typeToRouteSeg: Record<string, string> = {
  WORKFLOW: 'workflow', KNOWLEDGE: 'knowledge',
};

interface Props {
  visible: boolean;
  onClose: () => void;
  asset: ShareAsset | null;
  dataList: ShareAsset[];
  onNavigate: (a: ShareAsset) => void;
}

const MySharedDetailDrawer = ({ visible, onClose, asset, dataList, onNavigate }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [pending, setPending] = useState<LifecycleAction | null>(null);

  const handleConfirm = () => {
    if (!asset || !pending) return;
    switch (pending) {
      case 'archive':  archiveAsset(asset.id);  Toast.success(t('sharing.assetSupply.toast.archived')); break;
      case 'recover':  recoverAsset(asset.id);  Toast.success(t('sharing.assetSupply.toast.recovered')); break;
      case 'unlist':   unlistAsset(asset.id);   Toast.success(t('sharing.assetSupply.toast.unlisted')); break;
      case 'withdraw': withdrawAsset(asset.id); Toast.success(t('sharing.assetSupply.toast.withdrawn')); break;
      case 'delete':
        deleteAsset(asset.id); Toast.success(t('sharing.assetSupply.toast.deleted'));
        onClose();
        break;
    }
    setPending(null);
  };

  const title = useMemo(() => {
    if (!asset) return '';
    const displayName = asset.displayName || asset.name;
    const showStatusTag = asset.shareStatus !== 'PUBLISHED';
    return (
      <Space spacing={8} style={{ minWidth: 0 }}>
        <AssetTypeIcon type={asset.type} size={16} />
        <Text strong ellipsis={{ showTooltip: true }} style={{ maxWidth: 560 }}>{displayName}</Text>
        {showStatusTag && <StatusTag status={asset.shareStatus} />}
      </Space>
    );
  }, [asset]);

  const extraActions = useMemo(() => {
    if (!asset) return null;
    const isNative = asset.source === 'NATIVE';
    const s = asset.shareStatus;
    const goEdit = () => navigate(`/sharing-center/my-shared/edit/${asset.id}`);
    const goEditDisplay = () => navigate(`/sharing-center/market/${typeToRouteSeg[asset.type]}/${asset.id}/edit-display`);
    const goPublish = () => navigate(`/sharing-center/my-published/${typeToRouteSeg[asset.type]}/${asset.id}/publish`);
    const openDevCenter = () => asset.originUrl && window.open(asset.originUrl, '_blank');
    const buttons: React.ReactNode[] = [];

    if (isNative && s === 'PUBLISHED') {
      buttons.push(
        <Tooltip key="edit" content={t('sharing.assetSupply.actions.edit')}>
          <Button theme="borderless" type="tertiary" size="small" icon={<Pencil size={14} strokeWidth={2} />} onClick={goEdit} />
        </Tooltip>,
        <Tooltip key="archive" content={t('sharing.assetSupply.actions.unlist')}>
          <Button theme="borderless" type="tertiary" size="small" icon={<EyeOff size={14} strokeWidth={2} />} onClick={() => setPending('unlist')} />
        </Tooltip>,
      );
    } else if (!isNative && s === 'PUBLISHED') {
      buttons.push(
        <Tooltip key="editMeta" content={t('sharing.assetSupply.actions.editMeta')}>
          <Button theme="borderless" type="tertiary" size="small" icon={<FileText size={14} strokeWidth={2} />} onClick={goEditDisplay} />
        </Tooltip>,
        <Tooltip key="unlist" content={t('sharing.assetSupply.actions.unlist')}>
          <Button theme="borderless" type="tertiary" size="small" icon={<EyeOff size={14} strokeWidth={2} />} onClick={() => setPending('unlist')} />
        </Tooltip>,
      );
    } else if (s === 'PENDING_APPROVAL') {
      buttons.push(
        <Button key="withdraw" theme="light" type="tertiary" size="small" icon={<Undo2 size={14} strokeWidth={2} />} onClick={() => setPending('withdraw')}>
          {t('sharing.assetSupply.actions.withdraw')}
        </Button>,
      );
    } else if (s === 'PENDING_PUBLISH' && !isNative) {
      buttons.push(
        <Button key="publish" theme="solid" type="primary" size="small" icon={<Send size={14} strokeWidth={2} />} onClick={goPublish}>
          {t('sharing.assetSupply.actions.publishNow')}
        </Button>,
      );
    } else if (s === 'DRAFT' && isNative) {
      buttons.push(
        <Button key="edit" theme="light" type="tertiary" size="small" icon={<Pencil size={14} strokeWidth={2} />} onClick={goEdit}>
          {t('sharing.assetSupply.actions.edit')}
        </Button>,
      );
    } else if (s === 'REJECTED') {
      if (isNative) {
        buttons.push(
          <Button key="resubmit" theme="solid" type="primary" size="small" icon={<Pencil size={14} strokeWidth={2} />} onClick={goEdit}>
            {t('sharing.assetSupply.actions.resubmit')}
          </Button>,
        );
      } else if (asset.originUrl) {
        buttons.push(
          <Button key="back" theme="solid" type="primary" size="small" icon={<ExternalLink size={14} strokeWidth={2} />} onClick={openDevCenter}>
            {t('sharing.assetSupply.actions.backToDevCenter')}
          </Button>,
        );
      }
    } else if ((s === 'ARCHIVED' || s === 'UNLISTED') && isNative) {
      buttons.push(
        <Button key="recover" theme="light" type="tertiary" size="small" icon={<RotateCcw size={14} strokeWidth={2} />} onClick={() => setPending('recover')}>
          {t('sharing.assetSupply.actions.recover')}
        </Button>,
      );
    }

    return <Space spacing={4}>{buttons}</Space>;
  }, [asset, navigate, t]);

  return (
    <>
      <DetailDrawerWrapper<ShareAsset>
        visible={visible && !!asset}
        onClose={onClose}
        title={title}
        extraActions={extraActions}
        defaultWidth={900}
        storageKey="mySharedDetailDrawerWidth"
        dataList={dataList}
        currentId={asset?.id}
        onNavigate={onNavigate}
      >
        <div style={{ padding: 16 }}>
          {asset && (
            <AssetDetail
              mode="supply"
              embedded
              idOverride={asset.id}
              typeOverride={typeToRouteSeg[asset.type]}
              extraActions={null}
            />
          )}
        </div>
      </DetailDrawerWrapper>
      <LifecycleConfirmDialog
        visible={!!pending}
        action={pending}
        assetName={asset?.name ?? ''}
        onCancel={() => setPending(null)}
        onConfirm={handleConfirm}
      />
    </>
  );
};

export default MySharedDetailDrawer;
