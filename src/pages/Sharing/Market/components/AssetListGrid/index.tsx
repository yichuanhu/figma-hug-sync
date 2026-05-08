import { Pagination } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { Asset } from '../../types';
import AssetCard from '../AssetCard';
import EmptyState from '@/components/EmptyState';

interface Props {
  assets: Asset[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onReused?: (id: string) => void;
  emptyDescription?: string;
}

const AssetListGrid = ({ assets, total, page, pageSize, onPageChange, onReused, emptyDescription }: Props) => {
  const { t } = useTranslation();

  if (total === 0) {
    return (
      <div className="asset-list-empty">
        <EmptyState variant="noData" description={emptyDescription ?? t('sharing.market.empty.default')} />
      </div>
    );
  }

  return (
    <>
      <div className="asset-list-grid">
        {assets.map((a) => (
          <AssetCard key={a.id} asset={a} onReused={onReused} />
        ))}
      </div>
      {total > pageSize && (
        <div className="list-pagination">
          <Pagination
            size="small"
            currentPage={page}
            pageSize={pageSize}
            total={total}
            onPageChange={onPageChange}
            showTotal
          />
        </div>
      )}
    </>
  );
};

export default AssetListGrid;
