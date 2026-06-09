import { useState, useSyncExternalStore } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { Button, Space, Toast, Tooltip } from '@douyinfe/semi-ui';
import {
  Pencil, FileText, Archive, EyeOff, Send, ExternalLink, Undo2, RotateCcw,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AssetDetail from '@/pages/Sharing/Market/AssetDetail';
import {
  findAsset, subscribe, getAll,
  archiveAsset, recoverAsset, unlistAsset, deleteAsset, withdrawAsset,
  canPushNotification,
} from '@/pages/SharingCenter/MyShared/store';
import LifecycleConfirmDialog, { type LifecycleAction } from '../components/LifecycleConfirmDialog';
import PushNotificationDialog from '../components/PushNotificationDialog';

const typeRoute: Record<string, string> = { WORKFLOW: 'workflow', KNOWLEDGE: 'knowledge' };

const SupplyAssetDetail = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { type, id } = useParams<{ type: string; id: string }>();
  // 订阅 store 变化以确保操作后视图刷新
  useSyncExternalStore(subscribe, () => getAll().length);

  const [pending, setPending] = useState<LifecycleAction | null>(null);
  const [pushOpen, setPushOpen] = useState(false);

  if (!type || !id) return <Navigate to="/sharing-center/my-published" replace />;

  const asset = findAsset(id);
  if (!asset) return <AssetDetail mode="supply" extraActions={null} />;

  const isNative = asset.source === 'NATIVE';
  const isWorkflow = asset.type === 'WORKFLOW';
  const s = asset.shareStatus;

  const goEdit = () => navigate(`/sharing-center/my-shared/edit/${asset.id}`);
  const goEditDisplay = () => navigate(`/sharing-center/market/${typeRoute[asset.type]}/${asset.id}/edit-display`);
  const goPublish = () => navigate(`/sharing-center/my-published/${typeRoute[asset.type]}/${asset.id}/publish`);
  const openDevCenter = () => window.open(asset.originUrl, '_blank');

  const handleConfirm = () => {
    if (!pending) return;
    switch (pending) {
      case 'archive':  archiveAsset(asset.id);  Toast.success(t('sharing.assetSupply.toast.archived')); break;
      case 'recover':  recoverAsset(asset.id);  Toast.success(t('sharing.assetSupply.toast.recovered')); break;
      case 'unlist':   unlistAsset(asset.id);   Toast.success(t('sharing.assetSupply.toast.unlisted')); break;
      case 'withdraw': withdrawAsset(asset.id); Toast.success(t('sharing.assetSupply.toast.withdrawn')); break;
      case 'delete':
        deleteAsset(asset.id); Toast.success(t('sharing.assetSupply.toast.deleted'));
        navigate('/sharing-center/my-published');
        break;
    }
    setPending(null);
  };

  const pushCheck = canPushNotification(asset.id, asset.currentVersionId);
  const pushDisabled = pushCheck.ok === false;

  // ============ 头部右侧操作组（按 source × status 渲染） ============
  const buildExtraActions = () => {
    const buttons: React.ReactNode[] = [];

    if (isNative && s === 'PUBLISHED') {
      buttons.push(
        <Button key="edit" theme="light" type="tertiary" icon={<Pencil size={14} strokeWidth={2} />} onClick={goEdit}>
          {t('sharing.assetSupply.actions.edit')}
        </Button>,
        <Button key="editDisplay" theme="light" type="tertiary" icon={<FileText size={14} strokeWidth={2} />} onClick={goEditDisplay}>
          {t('sharing.assetSupply.actions.editDisplay')}
        </Button>,
        <Tooltip key="push" content={pushDisabled
          ? t('sharing.assetSupply.toast.pushDuplicated', { hours: pushCheck.ok === false ? pushCheck.retryAfterHours : 0 })
          : t('sharing.assetSupply.actions.pushNotification')}>
          <Button theme="light" type="tertiary" icon={<Send size={14} strokeWidth={2} />} disabled={pushDisabled} onClick={() => setPushOpen(true)}>
            {t('sharing.assetSupply.actions.pushNotification')}
          </Button>
        </Tooltip>,
        <Button key="archive" theme="borderless" type="warning" icon={<Archive size={14} strokeWidth={2} />} onClick={() => setPending('archive')}>
          {t('sharing.assetSupply.actions.archive')}
        </Button>,
      );
    } else if (!isNative && s === 'PUBLISHED') {
      buttons.push(
        <Button key="editMeta" theme="light" type="tertiary" icon={<FileText size={14} strokeWidth={2} />} onClick={goEditDisplay}>
          {t('sharing.assetSupply.actions.editMeta')}
        </Button>,
        <Tooltip key="push" content={pushDisabled
          ? t('sharing.assetSupply.toast.pushDuplicated', { hours: pushCheck.ok === false ? pushCheck.retryAfterHours : 0 })
          : t('sharing.assetSupply.actions.pushNotification')}>
          <Button theme="light" type="tertiary" icon={<Send size={14} strokeWidth={2} />} disabled={pushDisabled} onClick={() => setPushOpen(true)}>
            {t('sharing.assetSupply.actions.pushNotification')}
          </Button>
        </Tooltip>,
        asset.originUrl && false,
        <Button key="unlist" theme="borderless" type="warning" icon={<EyeOff size={14} strokeWidth={2} />} onClick={() => setPending('unlist')}>
          {t('sharing.assetSupply.actions.unlist')}
        </Button>,
      );
    } else if (s === 'PENDING_APPROVAL') {
      buttons.push(
        <Button key="withdraw" theme="light" type="tertiary" icon={<Undo2 size={14} strokeWidth={2} />} onClick={() => setPending('withdraw')}>
          {t('sharing.assetSupply.actions.withdraw')}
        </Button>,
      );
    } else if (s === 'PENDING_PUBLISH' && !isNative) {
      buttons.push(
        <Button key="publish" theme="solid" type="primary" icon={<Send size={14} strokeWidth={2} />} onClick={goPublish}>
          {t('sharing.assetSupply.actions.publishNow')}
        </Button>,
      );
    } else if (s === 'DRAFT' && isNative) {
      buttons.push(
        <Button key="edit" theme="light" type="tertiary" icon={<Pencil size={14} strokeWidth={2} />} onClick={goEdit}>
          {t('sharing.assetSupply.actions.edit')}
        </Button>,
      );
    } else if (s === 'REJECTED') {
      if (isNative) {
        buttons.push(
          <Button key="resubmit" theme="solid" type="primary" icon={<Pencil size={14} strokeWidth={2} />} onClick={goEdit}>
            {t('sharing.assetSupply.actions.resubmit')}
          </Button>,
        );
      } else if (asset.originUrl) {
        buttons.push(
          <Button key="back" theme="solid" type="primary" icon={<ExternalLink size={14} strokeWidth={2} />} onClick={openDevCenter}>
            {t('sharing.assetSupply.actions.backToDevCenter')}
          </Button>,
        );
      }
    } else if (s === 'ARCHIVED' && isNative) {
      buttons.push(
        <Button key="recover" theme="solid" type="primary" icon={<RotateCcw size={14} strokeWidth={2} />} onClick={() => setPending('recover')}>
          {t('sharing.assetSupply.actions.recover')}
        </Button>,
      );
    }

    return <Space>{buttons.filter(Boolean)}</Space>;
  };

  return (
    <>
      <AssetDetail mode="supply" extraActions={buildExtraActions()} />
      <LifecycleConfirmDialog
        visible={!!pending}
        action={pending}
        assetName={asset.name}
        onCancel={() => setPending(null)}
        onConfirm={handleConfirm}
      />
      <PushNotificationDialog
        visible={pushOpen}
        asset={asset}
        onCancel={() => setPushOpen(false)}
      />
    </>
  );
};

export default SupplyAssetDetail;
