import { Input, Select } from '@douyinfe/semi-ui';
import { IconSearchStroked } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';
import { SortKey } from '../../types';

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  sortBy: SortKey;
  onSortChange: (v: SortKey) => void;
  extra?: React.ReactNode;
}

const MarketToolbar = ({ search, onSearchChange, sortBy, onSortChange, extra }: Props) => {
  const { t } = useTranslation();
  return (
    <div className="market-toolbar">
      <Input
        prefix={<IconSearchStroked />}
        placeholder={t('sharing.market.searchPlaceholder')}
        value={search}
        onChange={onSearchChange}
        showClear
        style={{ width: 320 }}
      />
      <Select
        value={sortBy}
        onChange={(v) => onSortChange(v as SortKey)}
        style={{ width: 180 }}
        optionList={[
          { value: 'reuseCount', label: t('sharing.market.sort.reuseCount') },
          { value: 'createdAt', label: t('sharing.market.sort.createdAt') },
        ]}
        prefix={<span className="market-toolbar-prefix">{t('sharing.market.filter.sort')}</span>}
      />
      {extra}
    </div>
  );
};

export default MarketToolbar;
