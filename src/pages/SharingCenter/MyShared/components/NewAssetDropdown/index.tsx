import { Dropdown, Button } from '@douyinfe/semi-ui';
import { Plus, ChevronDown, BookOpen, GitBranch } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface Props {
  onPublishWorkflow?: () => void;
}

const NewAssetDropdown = ({ onPublishWorkflow }: Props = {}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const Item = ({
    icon, label, onClick,
  }: { icon: React.ReactNode; label: string; onClick?: () => void }) => (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px',
        cursor: 'pointer', minWidth: 180,
      }}
    >
      <span style={{ display: 'inline-flex', width: 18, justifyContent: 'center' }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
    </div>
  );

  const menu = (
    <Dropdown.Menu>
      <Item icon={<BookOpen size={14} strokeWidth={2} />} label={t('sharing.myShared.newAsset.knowledge')}
        onClick={() => navigate('/sharing-center/my-shared/create/knowledge')} />
      <Item icon={<GitBranch size={14} strokeWidth={2} />} label={t('sharing.myShared.newAsset.workflow')}
        onClick={() => onPublishWorkflow?.()} />
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
