import { Dropdown, Button, Toast } from '@douyinfe/semi-ui';
import { Plus, BookOpen, Sparkles, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const CreateAssetDropdown = () => {
  const { t } = useTranslation();
  const handleCreate = (kind: 'knowledge' | 'skill') => {
    Toast.info(t(`sharing.market.create.comingSoon.${kind}`));
  };

  return (
    <Dropdown
      trigger="click"
      position="bottomRight"
      render={
        <Dropdown.Menu>
          <Dropdown.Item icon={<BookOpen size={14} strokeWidth={2} />} onClick={() => handleCreate('knowledge')}>
            {t('sharing.market.create.knowledge')}
          </Dropdown.Item>
          <Dropdown.Item icon={<Sparkles size={14} strokeWidth={2} />} onClick={() => handleCreate('skill')}>
            {t('sharing.market.create.skill')}
          </Dropdown.Item>
        </Dropdown.Menu>
      }
    >
      <Button theme="solid" type="primary" icon={<Plus size={14} strokeWidth={2} />}>
        {t('sharing.market.create.button')}
        <ChevronDown size={14} strokeWidth={2} style={{ marginLeft: 4 }} />
      </Button>
    </Dropdown>
  );
};

export default CreateAssetDropdown;
