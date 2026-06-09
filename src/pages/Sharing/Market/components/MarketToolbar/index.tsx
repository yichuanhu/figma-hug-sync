import { Input, Select, Button } from '@douyinfe/semi-ui';
import { IconSearchStroked } from '@douyinfe/semi-icons';
import { Repeat2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SortKey } from '../../types';

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  sortBy: SortKey;
  onSortChange: (v: SortKey) => void;
  extra?: React.ReactNode;
  onOpenReused?: () => void;
  // 分类标签筛选
  categoryFilter?: string[];
  onCategoryChange?: (v: string[]) => void;
  categoryOptions?: { value: string; label: string }[];
}

const MarketToolbar = ({
  search,
  onSearchChange,
  sortBy,
  onSortChange,
  extra,
  onOpenReused,
  categoryFilter,
  onCategoryChange,
  categoryOptions,
}: Props) => {
  const { t } = useTranslation();

  const enableCategory = !!onCategoryChange && !!categoryOptions;

  return (
    <div className="market-toolbar">
      <div className="market-toolbar-left">
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
          style={{ width: 200 }}
          optionList={[
            { value: 'reuseCount', label: t('sharing.market.sort.reuseCount') },
            { value: 'createdAt', label: t('sharing.market.sort.createdAt') },
          ]}
          prefix={<span className="market-toolbar-prefix">{t('sharing.market.filter.sort')}</span>}
        />
        {extra}
        {enableCategory && (
          <Select
            multiple
            filter
            showClear
            maxTagCount={2}
            value={categoryFilter ?? []}
            onChange={(v) => onCategoryChange?.((v as string[]) || [])}
            optionList={categoryOptions}
            placeholder={t('sharing.market.filter.categoryPlaceholder')}
            style={{ minWidth: 220, maxWidth: 360 }}
            prefix={<span className="market-toolbar-prefix">{t('sharing.market.filter.category')}</span>}
          />
        )}
      </div>
      {onOpenReused && (
        <div className="market-toolbar-right">
          <Button
            theme="borderless"
            icon={<Repeat2 size={16} strokeWidth={2} />}
            onClick={onOpenReused}
          >
            {t('sidebar.myReused')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default MarketToolbar;
