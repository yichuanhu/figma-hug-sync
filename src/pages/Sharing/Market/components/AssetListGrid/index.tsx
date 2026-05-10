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
  /** 强制卡片显示为已复用（"我已复用"Tab 用） */
  forceReused?: boolean;
  /** 已复用时间映射（assetId -> reusedAt），用于 forceReused 模式 */
  reusedAtMap?: Record<string, string>;
}

const typeRoute: Record<string, string> = {
  SNIPPET: 'snippet',
  WORKFLOW: 'workflow',
  KNOWLEDGE: 'knowledge',
  SKILL: 'skill',
};

const AssetListGrid = ({
  assets, total, page, pageSize, onPageChange, emptyDescription, emptyExtra,
  loading, forceReused, reusedAtMap,
}: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { getReuseState, getReusedAt, isPublishedBy, triggerReuse } = useReuseAction();

  if (loading) return <AssetCardSkeleton count={6} />;

  if (total === 0) {
    return (
      <div className="asset-list-empty">
        <EmptyState
          variant="noData"
          description={emptyDescription ?? t('sharing.market.empty.default')}
          extra={emptyExtra}
        />
      </div>
    );
  }

  return (
    <>
      <div className="asset-list-grid">
        {assets.map((a) => {
          const owner = isPublishedBy(a.id);
          const state = forceReused ? 'reused' : getReuseState(a);
          const reusedAt = forceReused ? reusedAtMap?.[a.id] : getReusedAt(a.id);
          return (
            <AssetCard
              key={a.id}
              asset={a}
              reuseState={state}
              reusedAt={reusedAt}
              isPublishedBy={owner}
              onView={(id) => navigate(`/sharing-center/market/${typeRoute[a.type]}/${id}`)}
              onReuse={() => triggerReuse(a)}
              onEditDisplay={(id) => navigate(`/sharing-center/market/${typeRoute[a.type]}/${id}/edit-display`)}
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
            showTotal
          />
        </div>
      )}
    </>
  );
};

export default AssetListGrid;
