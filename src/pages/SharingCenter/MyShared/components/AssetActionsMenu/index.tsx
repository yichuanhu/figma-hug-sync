import { Dropdown, Modal, Toast } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { ShareAsset } from '@/pages/SharingCenter/MyShared/store';
import { archiveAsset, recoverAsset, unlistAsset, deleteAsset } from '@/pages/SharingCenter/MyShared/store';
import { Eye, Pencil, Archive, RotateCcw, Trash2, EyeOff, ExternalLink, History, Send } from 'lucide-react';

interface Props {
  asset: ShareAsset;
  onClose?: () => void;
  trigger: React.ReactElement;
}

const typeRoute: Record<string, string> = { SNIPPET: 'snippet', WORKFLOW: 'workflow', KNOWLEDGE: 'knowledge', SKILL: 'skill' };

const AssetActionsMenu = ({ asset, trigger }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const goView = () => navigate(`/sharing-center/market/${typeRoute[asset.type]}/${asset.id}`);
  const goEdit = () => navigate(`/sharing-center/my-shared/edit/${asset.id}`);
  const goVersions = () => navigate(`/sharing-center/my-shared/${asset.id}/versions`);

  const confirm = (titleKey: string, contentKey: string, onOk: () => void, danger?: boolean) => {
    Modal.confirm({
      title: t(titleKey),
      content: t(contentKey),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      okButtonProps: danger ? { type: 'danger' } : undefined,
      onOk,
      centered: true,
    });
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
        Push('archive', <Archive size={14} strokeWidth={2} />, t('sharing.myShared.actions.archive'),
          () => confirm('sharing.myShared.confirm.archiveTitle', 'sharing.myShared.confirm.archiveContent', () => {
            archiveAsset(asset.id); Toast.success(t('sharing.myShared.toast.archived'));
          }));
      } else if (s === 'DRAFT') {
        Push('edit', <Pencil size={14} strokeWidth={2} />, t('sharing.myShared.actions.edit'), goEdit);
        Push('publish', <Send size={14} strokeWidth={2} />, t('sharing.myShared.actions.publish'), goEdit);
        Push('delete', <Trash2 size={14} strokeWidth={2} />, t('sharing.myShared.actions.delete'),
          () => confirm('sharing.myShared.confirm.deleteTitle', 'sharing.myShared.confirm.deleteContent', () => {
            deleteAsset(asset.id); Toast.success(t('sharing.myShared.toast.deleted'));
          }, true), 'danger');
      } else if (s === 'REJECTED') {
        Push('edit', <Pencil size={14} strokeWidth={2} />, t('sharing.myShared.actions.edit'), goEdit);
      } else if (s === 'ARCHIVED') {
        Push('recover', <RotateCcw size={14} strokeWidth={2} />, t('sharing.myShared.actions.recover'),
          () => confirm('sharing.myShared.confirm.recoverTitle', 'sharing.myShared.confirm.recoverContent', () => {
            recoverAsset(asset.id); Toast.success(t('sharing.myShared.toast.recovered'));
          }));
        Push('delete', <Trash2 size={14} strokeWidth={2} />, t('sharing.myShared.actions.delete'),
          () => confirm('sharing.myShared.confirm.deleteTitle', 'sharing.myShared.confirm.deleteContent', () => {
            deleteAsset(asset.id); Toast.success(t('sharing.myShared.toast.deleted'));
          }, true), 'danger');
      }
    } else {
      // DEV_CENTER
      if (s === 'PUBLISHED') {
        Push('editMeta', <Pencil size={14} strokeWidth={2} />, t('sharing.myShared.actions.editMeta'), goEdit);
        Push('versions', <History size={14} strokeWidth={2} />, t('sharing.myShared.actions.versions'), goVersions);
        if (asset.originUrl) {
          Push('open', <ExternalLink size={14} strokeWidth={2} />, t('sharing.myShared.actions.openInDevCenter'),
            () => window.open(asset.originUrl, '_blank'));
        }
        Push('unlist', <EyeOff size={14} strokeWidth={2} />, t('sharing.myShared.actions.unlist'),
          () => confirm('sharing.myShared.confirm.unlistTitle', 'sharing.myShared.confirm.unlistContent', () => {
            unlistAsset(asset.id); Toast.success(t('sharing.myShared.toast.unlisted'));
          }));
      }
    }
    return items;
  };

  return (
    <Dropdown trigger="click" position="bottomRight" render={<Dropdown.Menu>{buildItems()}</Dropdown.Menu>}>
      {trigger}
    </Dropdown>
  );
};

export default AssetActionsMenu;
