import { useCallback, useState, useSyncExternalStore } from 'react';
import { Toast } from '@douyinfe/semi-ui';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  addReuseRecord, hasReused, isOwner, getReusedAt, subscribe, getMarketAssets,
} from '@/pages/SharingCenter/MyShared/store';
import type { Asset, ReuseState } from '../types';

export interface UseReuseActionReturn {
  getReuseState: (asset: Asset) => ReuseState;
  getReusedAt: (assetId: string) => string | undefined;
  isPublishedBy: (assetId: string) => boolean;
  triggerReuse: (asset: Asset) => void;
}

export const useReuseAction = (): UseReuseActionReturn => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // 触发 store 订阅，复用按钮跨组件同步
  useSyncExternalStore(subscribe, () => getMarketAssets().length, () => 0);
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  const isPub = useCallback((assetId: string) => isOwner(assetId), []);

  const getReuseState = useCallback((asset: Asset): ReuseState => {
    if (isOwner(asset.id)) return 'hidden';
    if (loadingMap[asset.id]) return 'loading';
    if (hasReused(asset.id)) return 'reused';
    return 'default';
  }, [loadingMap]);

  const triggerReuse = useCallback((asset: Asset) => {
    if (loadingMap[asset.id] || hasReused(asset.id) || isOwner(asset.id)) return;
    setLoadingMap((m) => ({ ...m, [asset.id]: true }));
    // 模拟 API 延时
    setTimeout(() => {
      const result = addReuseRecord(asset.id);
      setLoadingMap((m) => {
        const next = { ...m };
        delete next[asset.id];
        return next;
      });
      if (!result.ok) {
        Toast.error(t('sharing.market.toast.reuseFailed'));
        return;
      }
      // 按资产类型分叉
      if (asset.type === 'WORKFLOW') {
        Toast.success({
          content: (
            <span>
              {t('sharing.market.toast.workflowReused')}
              <a
                style={{ marginLeft: 8 }}
                onClick={(e) => {
                  e.preventDefault();
                  window.open('/dev-center/process-development', '_blank');
                }}
                href="/dev-center/process-development"
              >
                {t('sharing.market.toast.workflowReusedLink')} →
              </a>
            </span>
          ),
          duration: 6,
        });
      } else if (asset.type === 'KNOWLEDGE') {
        Toast.success({
          content: (
            <span>
              {t('sharing.market.toast.knowledgeReused')}
              <a
                style={{ marginLeft: 8 }}
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/sharing-center/market', { state: { tab: 'MY_REUSED' } });
                }}
                href="#"
              >
                {t('sharing.market.toast.knowledgeReusedLink')} →
              </a>
            </span>
          ),
          duration: 6,
        });
      } else {
        Toast.success(t('sharing.market.toast.reuseSuccess'));
      }
    }, 600);
  }, [loadingMap, navigate, t]);

  return {
    getReuseState,
    getReusedAt: (id: string) => getReusedAt(id),
    isPublishedBy: isPub,
    triggerReuse,
  };
};
