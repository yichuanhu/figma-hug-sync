import { Tag } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { Home, Link2 } from 'lucide-react';
import './index.less';

export type AssetSource = 'NATIVE' | 'DEV_CENTER';

interface Props {
  source: AssetSource;
  size?: 'small' | 'default';
}

const SourceBadge = ({ source, size = 'small' }: Props) => {
  const { t } = useTranslation();
  const isNative = source === 'NATIVE';
  return (
    <Tag
      size={size}
      type="light"
      color={isNative ? 'blue' : 'cyan'}
      className="sharing-source-badge"
      prefixIcon={isNative ? <Home size={12} strokeWidth={2} /> : <Link2 size={12} strokeWidth={2} />}
    >
      {isNative ? t('sharing.common.source.native') : t('sharing.common.source.devCenter')}
    </Tag>
  );
};

export default SourceBadge;
