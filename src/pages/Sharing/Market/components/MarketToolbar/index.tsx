import { Input, Select } from '@douyinfe/semi-ui';
import { IconSearchStroked } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';
import { SortKey, SourceFilter } from '../../types';

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  sourceFilter?: SourceFilter;
  onSourceChange?: (v: SourceFilter) => void;
  sortBy: SortKey;
  onSortChange: (v: SortKey) => void;
  showSourceFilter?: boolean;
  extra?: React.ReactNode;
}

const MarketToolbar = ({
  search, onSearchChange,
  sourceFilter = 'ALL', onSourceChange,
  sortBy, onSortChange,
  showSourceFilter = true,
  extra,
}: Props) => {
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
      {showSourceFilter && (
        <Select
          value={sourceFilter}
          onChange={(v) => onSourceChange?.(v as SourceFilter)}
          style={{ width: 160 }}
          optionList={[
            { value: 'ALL', label: t('sharing.market.source.all') },
            { value: 'NATIVE', label: t('sharing.market.source.native') },
            { value: 'DEV_CENTER', label: t('sharing.market.source.devCenter') },
          ]}
          prefix={<span className="market-toolbar-prefix">{t('sharing.market.filter.source')}</span>}
        />
      )}
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
