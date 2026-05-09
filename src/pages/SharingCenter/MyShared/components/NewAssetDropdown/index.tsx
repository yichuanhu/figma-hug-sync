import { Dropdown, Tooltip, Button } from '@douyinfe/semi-ui';
import { Plus, ChevronDown, BookOpen, Wrench, Box, GitBranch, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const NewAssetDropdown = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const Item = ({
    icon, label, hint, onClick, disabled,
  }: { icon: React.ReactNode; label: string; hint?: string; onClick?: () => void; disabled?: boolean }) => {
    const node = (
      <div
        onClick={disabled ? undefined : onClick}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px',
          cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, minWidth: 180,
        }}
      >
        <span style={{ display: 'inline-flex', width: 18, justifyContent: 'center' }}>{icon}</span>
        <span style={{ flex: 1 }}>{label}</span>
        {disabled && <Lock size={12} strokeWidth={2} style={{ color: 'var(--semi-color-text-2)' }} />}
      </div>
    );
    return disabled && hint ? <Tooltip content={hint} position="left">{node}</Tooltip> : node;
  };

  const menu = (
    <Dropdown.Menu>
      <Item icon={<BookOpen size={14} strokeWidth={2} />} label={t('sharing.myShared.newAsset.knowledge')}
        onClick={() => navigate('/sharing-center/my-shared/create/knowledge')} />
      <Item icon={<Wrench size={14} strokeWidth={2} />} label={t('sharing.myShared.newAsset.skill')}
        onClick={() => navigate('/sharing-center/my-shared/create/skill')} />
      <Dropdown.Divider />
      <Item icon={<Box size={14} strokeWidth={2} />} label={t('sharing.myShared.newAsset.snippet')}
        hint={t('sharing.myShared.newAsset.disabledHint')} disabled />
      <Item icon={<GitBranch size={14} strokeWidth={2} />} label={t('sharing.myShared.newAsset.workflow')}
        onClick={() => navigate('/sharing-center/my-shared/publish-process')} />
    </Dropdown.Menu>
  );

  return (
    <Dropdown trigger="click" position="bottomRight" render={menu}>
      <Button theme="solid" type="primary" icon={<Plus size={14} strokeWidth={2.5} />}>
        {t('sharing.myShared.newAsset.label')}
        <ChevronDown size={14} strokeWidth={2} style={{ marginLeft: 4 }} />
      </Button>
    </Dropdown>
  );
};

export default NewAssetDropdown;
