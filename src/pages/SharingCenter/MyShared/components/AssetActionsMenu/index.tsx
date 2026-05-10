import { useState } from 'react';
import { Dropdown, Toast } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { ShareAsset } from '@/pages/SharingCenter/MyShared/store';
import {
  archiveAsset, recoverAsset, unlistAsset, deleteAsset, withdrawAsset,
} from '@/pages/SharingCenter/MyShared/store';
import {
  Eye, Pencil, Archive, RotateCcw, Trash2, EyeOff, ExternalLink, History, Send, Undo2, AlertCircle,
} from 'lucide-react';
import LifecycleConfirmDialog, { type LifecycleAction } from '../LifecycleConfirmDialog';

interface Props {
  asset: ShareAsset;
  onClose?: () => void;
  trigger: React.ReactElement;
  /** 触发推送通知（来自父组件） */
  onPush?: (asset: ShareAsset) => void;
}

const typeRoute: Record<string, string> = { SNIPPET: 'snippet', WORKFLOW: 'workflow', KNOWLEDGE: 'knowledge', SKILL: 'skill' };

const AssetActionsMenu = ({ asset, trigger, onPush }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [pending, setPending] = useState<LifecycleAction | null>(null);

  const goView = () => navigate(`/sharing-center/my-published/${typeRoute[asset.type]}/${asset.id}`);
  const goEdit = () => navigate(`/sharing-center/my-shared/edit/${asset.id}`);
  const goVersions = () => navigate(`/sharing-center/my-shared/${asset.id}/versions`);
  const goPublish = () => navigate(`/sharing-center/my-published/${typeRoute[asset.type]}/${asset.id}/publish`);
  const openDevCenter = () => window.open(asset.originUrl, '_blank');

  const handleConfirm = () => {
    if (!pending) return;
    switch (pending) {
      case 'archive':  archiveAsset(asset.id);  Toast.success(t('sharing.myShared.toast.archived')); break;
      case 'recover':  recoverAsset(asset.id);  Toast.success(t('sharing.myShared.toast.recovered')); break;
      case 'unlist':   unlistAsset(asset.id);   Toast.success(t('sharing.myShared.toast.unlisted')); break;
      case 'withdraw': withdrawAsset(asset.id); Toast.success(t('sharing.myShared.toast.withdrawn')); break;
      case 'delete':   deleteAsset(asset.id);   Toast.success(t('sharing.myShared.toast.deleted')); break;
    }
    setPending(null);
  };

  const buildItems = () => {
    const items: React.ReactNode[] = [];
    const isNative = asset.source === 'NATIVE';
    const s = asset.shareStatus;
    const Push = (key: string, icon: React.ReactNode, label: string, onClick: () => void, type?: 'danger') => {
      items.push(
        <Dropdown.Item key={key} type={type} onClick={onClick} icon={icon}>{label}</Dropdown.Item>,
      );
    };

    Push('view', <Eye size={14} strokeWidth={2} />, t('sharing.myShared.actions.view'), goView);

    if (isNative) {
      if (s === 'PUBLISHED') {
        Push('edit', <Pencil size={14} strokeWidth={2} />, t('sharing.myShared.actions.edit'), goEdit);
        Push('versions', <History size={14} strokeWidth={2} />, t('sharing.myShared.actions.versions'), goVersions);
        if (onPush) Push('push', <Send size={14} strokeWidth={2} />, t('sharing.myShared.actions.pushNotification'), () => onPush(asset));
        Push('archive', <Archive size={14} strokeWidth={2} />, t('sharing.myShared.actions.archive'), () => setPending('archive'));
      } else if (s === 'DRAFT') {
        Push('edit', <Pencil size={14} strokeWidth={2} />, t('sharing.myShared.actions.edit'), goEdit);
        Push('publish', <Send size={14} strokeWidth={2} />, t('sharing.myShared.actions.publish'), goEdit);
        Push('delete', <Trash2 size={14} strokeWidth={2} />, t('sharing.myShared.actions.delete'), () => setPending('delete'), 'danger');
      } else if (s === 'REJECTED') {
        Push('resubmit', <Pencil size={14} strokeWidth={2} />, t('sharing.myShared.actions.resubmit'), goEdit);
        Push('delete', <Trash2 size={14} strokeWidth={2} />, t('sharing.myShared.actions.delete'), () => setPending('delete'), 'danger');
      } else if (s === 'PENDING_APPROVAL') {
        Push('withdraw', <Undo2 size={14} strokeWidth={2} />, t('sharing.myShared.actions.withdraw'), () => setPending('withdraw'));
      } else if (s === 'ARCHIVED') {
        Push('recover', <RotateCcw size={14} strokeWidth={2} />, t('sharing.myShared.actions.recover'), () => setPending('recover'));
        Push('delete', <Trash2 size={14} strokeWidth={2} />, t('sharing.myShared.actions.delete'), () => setPending('delete'), 'danger');
      }
    } else {
      // DEV_CENTER
      if (s === 'PUBLISHED') {
        Push('editMeta', <Pencil size={14} strokeWidth={2} />, t('sharing.myShared.actions.editMeta'), goEdit);
        Push('versions', <History size={14} strokeWidth={2} />, t('sharing.myShared.actions.versions'), goVersions);
        if (onPush) Push('push', <Send size={14} strokeWidth={2} />, t('sharing.myShared.actions.pushNotification'), () => onPush(asset));
        if (asset.originUrl) {
          Push('open', <ExternalLink size={14} strokeWidth={2} />, t('sharing.myShared.actions.openInDevCenter'), openDevCenter);
        }
        Push('unlist', <EyeOff size={14} strokeWidth={2} />, t('sharing.myShared.actions.unlist'), () => setPending('unlist'));
      } else if (s === 'PENDING_PUBLISH') {
        Push('publish', <Send size={14} strokeWidth={2} />, t('sharing.myShared.actions.publishNow'), goPublish);
        if (asset.originUrl) {
          Push('open', <ExternalLink size={14} strokeWidth={2} />, t('sharing.myShared.actions.openInDevCenter'), openDevCenter);
        }
      } else if (s === 'PENDING_APPROVAL') {
        Push('withdraw', <Undo2 size={14} strokeWidth={2} />, t('sharing.myShared.actions.withdraw'), () => setPending('withdraw'));
      } else if (s === 'REJECTED') {
        if (asset.originUrl) {
          Push('back', <AlertCircle size={14} strokeWidth={2} />, t('sharing.myShared.actions.backToDevCenter'), openDevCenter);
        }
      }
    }
    return items;
  };

  return (
    <>
      <Dropdown trigger="click" position="bottomRight" render={<Dropdown.Menu>{buildItems()}</Dropdown.Menu>}>
        {trigger}
      </Dropdown>
      <LifecycleConfirmDialog
        visible={!!pending}
        action={pending}
        assetName={asset.name}
        onCancel={() => setPending(null)}
        onConfirm={handleConfirm}
      />
    </>
  );
};

export default AssetActionsMenu;
