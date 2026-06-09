import { useState } from 'react';
import { Dropdown, Toast } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { ShareAsset } from '@/pages/SharingCenter/MyShared/store';
import {
  archiveAsset, recoverAsset, unlistAsset, deleteAsset, withdrawAsset,
} from '@/pages/SharingCenter/MyShared/store';
import {
  Pencil, Archive, RotateCcw, Trash2, EyeOff, Send, Undo2, AlertCircle,
} from 'lucide-react';
import LifecycleConfirmDialog, { type LifecycleAction } from '../LifecycleConfirmDialog';

interface Props {
  asset: ShareAsset;
  onClose?: () => void;
  trigger: React.ReactElement;
}

const typeRoute: Record<string, string> = { WORKFLOW: 'workflow', KNOWLEDGE: 'knowledge' };

const AssetActionsMenu = ({ asset, trigger }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [pending, setPending] = useState<LifecycleAction | null>(null);

  // goView 已废弃：详情通过右侧抽屉打开
  const goEdit = () => navigate(`/sharing-center/my-shared/edit/${asset.id}`);
  // 版本历史菜单已移除
  const goPublish = () => navigate(`/sharing-center/my-published/${typeRoute[asset.type]}/${asset.id}/publish`);
  const openDevCenter = () => window.open(asset.originUrl, '_blank');

  const handleConfirm = () => {
    if (!pending) return;
    switch (pending) {
      case 'archive':  archiveAsset(asset.id);  Toast.success(t('sharing.assetSupply.toast.archived')); break;
      case 'recover':  recoverAsset(asset.id);  Toast.success(t('sharing.assetSupply.toast.recovered')); break;
      case 'unlist':   unlistAsset(asset.id);   Toast.success(t('sharing.assetSupply.toast.unlisted')); break;
      case 'withdraw': withdrawAsset(asset.id); Toast.success(t('sharing.assetSupply.toast.withdrawn')); break;
      case 'delete':   deleteAsset(asset.id);   Toast.success(t('sharing.assetSupply.toast.deleted')); break;
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

    // 查看详情已由列表行点击 → 右侧抽屉承担，菜单不再重复展示

    if (isNative) {
      if (s === 'PUBLISHED') {
        Push('edit', <Pencil size={14} strokeWidth={2} />, t('sharing.assetSupply.actions.edit'), goEdit);
        if (asset.type === 'KNOWLEDGE') {
          Push('unlist', <EyeOff size={14} strokeWidth={2} />, t('sharing.assetSupply.actions.unlist'), () => setPending('unlist'));
        } else {
          Push('archive', <Archive size={14} strokeWidth={2} />, t('sharing.assetSupply.actions.archive'), () => setPending('archive'));
        }
      } else if (s === 'DRAFT') {
        Push('edit', <Pencil size={14} strokeWidth={2} />, t('sharing.assetSupply.actions.edit'), goEdit);
        Push('publish', <Send size={14} strokeWidth={2} />, t('sharing.assetSupply.actions.publish'), goEdit);
        Push('delete', <Trash2 size={14} strokeWidth={2} />, t('sharing.assetSupply.actions.delete'), () => setPending('delete'), 'danger');
      } else if (s === 'REJECTED') {
        Push('resubmit', <Pencil size={14} strokeWidth={2} />, t('sharing.assetSupply.actions.resubmit'), goEdit);
        Push('delete', <Trash2 size={14} strokeWidth={2} />, t('sharing.assetSupply.actions.delete'), () => setPending('delete'), 'danger');
      } else if (s === 'PENDING_APPROVAL') {
        Push('withdraw', <Undo2 size={14} strokeWidth={2} />, t('sharing.assetSupply.actions.withdraw'), () => setPending('withdraw'));
      } else if (s === 'ARCHIVED') {
        Push('recover', <RotateCcw size={14} strokeWidth={2} />, t('sharing.assetSupply.actions.recover'), () => setPending('recover'));
        Push('delete', <Trash2 size={14} strokeWidth={2} />, t('sharing.assetSupply.actions.delete'), () => setPending('delete'), 'danger');
      }
    } else {
      // DEV_CENTER
      if (s === 'PUBLISHED') {
        Push('editMeta', <Pencil size={14} strokeWidth={2} />, t('sharing.assetSupply.actions.editMeta'), goEdit);
        Push('unlist', <EyeOff size={14} strokeWidth={2} />, t('sharing.assetSupply.actions.unlist'), () => setPending('unlist'));
      } else if (s === 'PENDING_PUBLISH') {
        Push('publish', <Send size={14} strokeWidth={2} />, t('sharing.assetSupply.actions.publishNow'), goPublish);
      } else if (s === 'PENDING_APPROVAL') {
        Push('withdraw', <Undo2 size={14} strokeWidth={2} />, t('sharing.assetSupply.actions.withdraw'), () => setPending('withdraw'));
      } else if (s === 'REJECTED') {
        if (asset.originUrl) {
          Push('back', <AlertCircle size={14} strokeWidth={2} />, t('sharing.assetSupply.actions.backToDevCenter'), openDevCenter);
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
