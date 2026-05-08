import { Button, Modal, Toast, Tooltip } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { Archive, EyeOff, Trash2, X } from 'lucide-react';
import type { ShareAsset } from '@/pages/SharingCenter/MyShared/store';
import { archiveAsset, unlistAsset, deleteAsset } from '@/pages/SharingCenter/MyShared/store';

interface Props {
  selected: ShareAsset[];
  onClear: () => void;
}

const BatchActionBar = ({ selected, onClear }: Props) => {
  const { t } = useTranslation();
  if (selected.length === 0) return null;

  const sources = new Set(selected.map((a) => a.source));
  const mixed = sources.size > 1;
  const onlyNative = !mixed && sources.has('NATIVE');
  const onlyDev = !mixed && sources.has('DEV_CENTER');

  const run = (titleKey: string, contentKey: string, action: (id: string) => void, toastKey: string, danger?: boolean) => {
    Modal.confirm({
      title: t(titleKey),
      content: t(contentKey),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      okButtonProps: danger ? { type: 'danger' } : undefined,
      centered: true,
      onOk: () => {
        selected.forEach((a) => action(a.id));
        Toast.success(t(toastKey));
        onClear();
      },
    });
  };

  const Btn = ({
    onClick, disabled, icon, label, danger,
  }: { onClick: () => void; disabled: boolean; icon: React.ReactNode; label: string; danger?: boolean }) => {
    const btn = (
      <Button size="small" type={danger ? 'danger' : 'tertiary'} theme="borderless" icon={icon} disabled={disabled} onClick={onClick}>
        {label}
      </Button>
    );
    return disabled && mixed ? <Tooltip content={t('sharing.myShared.batch.mixedHint')}>{btn}</Tooltip> : btn;
  };

  return (
    <div className="my-shared-batch-bar">
      <span className="count">{t('sharing.myShared.batch.selected', { count: selected.length })}</span>
      <div className="actions">
        <Btn
          onClick={() => run('sharing.myShared.confirm.archiveTitle', 'sharing.myShared.confirm.archiveContent', archiveAsset, 'sharing.myShared.toast.archived')}
          disabled={!onlyNative}
          icon={<Archive size={14} strokeWidth={2} />}
          label={t('sharing.myShared.batch.archive')}
        />
        <Btn
          onClick={() => run('sharing.myShared.confirm.unlistTitle', 'sharing.myShared.confirm.unlistContent', unlistAsset, 'sharing.myShared.toast.unlisted')}
          disabled={!onlyDev}
          icon={<EyeOff size={14} strokeWidth={2} />}
          label={t('sharing.myShared.batch.unlist')}
        />
        <Btn
          onClick={() => run('sharing.myShared.confirm.deleteTitle', 'sharing.myShared.confirm.deleteContent', deleteAsset, 'sharing.myShared.toast.deleted', true)}
          disabled={!onlyNative}
          icon={<Trash2 size={14} strokeWidth={2} />}
          label={t('sharing.myShared.batch.delete')}
          danger
        />
        <Button size="small" theme="borderless" type="tertiary" icon={<X size={14} strokeWidth={2} />} onClick={onClear}>
          {t('sharing.myShared.batch.cancel')}
        </Button>
      </div>
    </div>
  );
};

export default BatchActionBar;
