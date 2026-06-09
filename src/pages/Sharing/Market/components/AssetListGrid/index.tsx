import { Pagination } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { Asset } from '../../types';
import AssetCard from '../AssetCard';
import AssetCardSkeleton from '../AssetCardSkeleton';
import EmptyState from '@/components/EmptyState';
import { useReuseAction } from '../../hooks/useReuseAction';
import { useNavigate } from 'react-router-dom';

interface Props {
  assets: Asset[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  emptyDescription?: string;
  emptyExtra?: React.ReactNode;

  loading?: boolean;
  /** 点击卡片时的回调（提供则覆盖默认路由跳转，例如以抽屉打开详情） */
  onAssetSelect?: (asset: Asset) => void;
  /** 供给视角下的「编辑展示信息」回调；不传则不渲染该操作 */
  onEditDisplay?: (assetId: string, asset: Asset) => void;
}

const typeRoute: Record<string, string> = {
  WORKFLOW: 'workflow',
  KNOWLEDGE: 'knowledge',
};

const AssetListGrid = ({
  assets, total, page, pageSize, onPageChange, emptyDescription, emptyExtra,
  loading, onAssetSelect, onEditDisplay,
}: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isPublishedBy } = useReuseAction();

  if (loading) return <AssetCardSkeleton count={6} />;

  if (total === 0) {
    return (
      <div className="asset-list-empty">
        <EmptyState
          variant="noData"
          description={emptyDescription ?? t('sharing.market.empty.default')}
          footer={emptyExtra}
        />
      </div>
    );
  }

  return (
    <>
      <div className="asset-list-grid">
        {assets.map((a) => {
          const owner = isPublishedBy(a.id);
          return (
            <AssetCard
              key={a.id}
              asset={a}
              isPublishedBy={owner}
              onView={(id) => {
                if (onAssetSelect) onAssetSelect(a);
                else navigate(`/sharing-center/market/${typeRoute[a.type]}/${id}`);
              }}
              onEditDisplay={onEditDisplay ? (id) => onEditDisplay(id, a) : undefined}
            />
          );
        })}
      </div>
      {total > pageSize && (
        <div className="list-pagination">
          <Pagination
            size="small"
            currentPage={page}
            pageSize={pageSize}
            total={total}
            onPageChange={onPageChange}
            style={{ marginLeft: 'auto' }}
          />
        </div>
      )}
    </>
  );
};

export default AssetListGrid;
