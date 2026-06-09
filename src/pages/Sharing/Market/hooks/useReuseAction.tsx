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
  /** WORKFLOW 资产必须传入 workflowName（全局唯一） */
  triggerReuse: (asset: Asset, opts?: { workflowName?: string }) => Promise<{ ok: boolean; reason?: string }>;
}

export const useReuseAction = (): UseReuseActionReturn => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // 触发 store 订阅，复用按钮跨组件同步
  useSyncExternalStore(subscribe, () => getMarketAssets().length, () => 0);
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  const isPub = useCallback((assetId: string) => isOwner(assetId), []);

  // WORKFLOW 支持多次复用（按钮始终可点击）；KNOWLEDGE 不再展示复用按钮
  const getReuseState = useCallback((asset: Asset): ReuseState => {
    if (isOwner(asset.id)) return 'hidden';
    if (loadingMap[asset.id]) return 'loading';
    if (asset.type !== 'WORKFLOW' && hasReused(asset.id)) return 'reused';
    return 'default';
  }, [loadingMap]);

  const triggerReuse = useCallback((asset: Asset, opts?: { workflowName?: string }) =>
    new Promise<{ ok: boolean; reason?: string }>((resolve) => {
      if (loadingMap[asset.id] || isOwner(asset.id)) {
        resolve({ ok: false, reason: 'BUSY' });
        return;
      }
      setLoadingMap((m) => ({ ...m, [asset.id]: true }));
      setTimeout(() => {
        const result = addReuseRecord(asset.id, opts);
        setLoadingMap((m) => {
          const next = { ...m };
          delete next[asset.id];
          return next;
        });
        if (result.ok === false) {
          const reason = result.reason;
          if (reason === 'NAME_TAKEN') Toast.error(t('sharing.market.toast.workflowNameTaken'));
          else if (reason === 'NAME_REQUIRED') Toast.error(t('sharing.market.toast.workflowNameRequired'));
          else Toast.error(t('sharing.market.toast.reuseFailed'));
          resolve({ ok: false, reason });
          return;
        }
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
        } else {
          Toast.success(t('sharing.market.toast.reuseSuccess'));
        }
        resolve({ ok: true });
      }, 600);
    }), [loadingMap, navigate, t]);

  return {
    getReuseState,
    getReusedAt: (id: string) => getReusedAt(id),
    isPublishedBy: isPub,
    triggerReuse,
  };
};
