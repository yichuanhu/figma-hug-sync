import { Tag } from '@douyinfe/semi-ui';
import { Home, Link2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AssetSource } from '../../types';

interface Props {
  source: AssetSource;
}

const SourceBadge = ({ source }: Props) => {
  const { t } = useTranslation();
  if (source === 'NATIVE') {
    return (
      <Tag size="small" color="blue" prefixIcon={<Home size={12} strokeWidth={2} />}>
        {t('sharing.market.source.native')}
      </Tag>
    );
  }
  return (
    <Tag size="small" color="violet" prefixIcon={<Link2 size={12} strokeWidth={2} />}>
      {t('sharing.market.source.devCenter')}
    </Tag>
  );
};

export default SourceBadge;
