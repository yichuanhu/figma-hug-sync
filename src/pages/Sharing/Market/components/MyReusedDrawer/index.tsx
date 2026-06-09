import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { SideSheet, Typography, Input, Tag, Pagination, Button } from '@douyinfe/semi-ui';
import { IconSearchStroked } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';
import { getMyReusedAssets, subscribe } from '@/pages/SharingCenter/MyShared/store';
import type { Asset } from '../../types';
import { paginate } from '../../utils';
import AssetTypeIcon from '../AssetTypeIcon';
import EmptyState from '@/components/EmptyState';

import './index.less';

const { Text, Title } = Typography;

const PAGE_SIZE = 10;

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelectAsset: (asset: Asset) => void;
}

const MyReusedDrawer = ({ visible, onClose, onSelectAsset }: Props) => {
  const { t } = useTranslation();
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  useSyncExternalStore(subscribe, () => getMyReusedAssets().length, () => 0);

  const all = useMemo(() => getMyReusedAssets(), [visible]);

  const list = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    if (!k) return all;
    return all.filter((a) =>
      (a.displayName || a.name).toLowerCase().includes(k)
      || (a.displayDesc || a.description).toLowerCase().includes(k),
    );
  }, [keyword, visible, all]);

  // 搜索变化或重新打开时重置页码
  useEffect(() => { setPage(1); }, [keyword, visible]);

  const paged = paginate(list, page, PAGE_SIZE);
  const isEmpty = all.length === 0;
  const isSearchEmpty = all.length > 0 && list.length === 0;

  return (
    <SideSheet
      visible={visible}
      onCancel={onClose}
      title={
        <Title heading={5} style={{ margin: 0 }}>
          {t('sharing.market.myReused.drawerTitle')}
        </Title>
      }
      placement="right"
      width={520}
      mask
      maskClosable
      className="my-reused-drawer"
      footer={null}
    >
      <div className="my-reused-drawer-body">
        <Input
          prefix={<IconSearchStroked />}
          placeholder={t('sharing.market.searchPlaceholder')}
          value={keyword}
          onChange={setKeyword}
          showClear
          style={{ marginBottom: 16 }}
        />
        {list.length === 0 ? (
          <EmptyState
            variant={isEmpty ? 'noData' : 'noResult'}
            description={isEmpty
              ? t('sharing.market.empty.myReused')
              : t('sharing.market.empty.myReusedSearch')}
            footer={isEmpty ? (
              <Button
                theme="light"
                type="primary"
                onClick={onClose}
              >
                {t('sharing.market.empty.myReusedAction')}
              </Button>
            ) : undefined}
          />
        ) : (
          <>
            <ul className="my-reused-list">
              {paged.map((a) => (
                <li
                  key={a.myReuseRecordId}
                  className="my-reused-item"
                  onClick={() => onSelectAsset(a)}
                >
                  <div className="my-reused-item-icon">
                    <AssetTypeIcon type={a.type} size={18} />
                  </div>
                  <div className="my-reused-item-body">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                      <Text strong ellipsis={{ showTooltip: true }} className="my-reused-item-title" style={{ flex: 1, minWidth: 0 }}>
                        {a.displayName || a.name}
                      </Text>
                      {a.type !== 'KNOWLEDGE' && (
                        <Tag size="small" color="grey" type="light">{a.myReusedVersion}</Tag>
                      )}
                    </div>
                    <Text size="small" type="tertiary" ellipsis={{ showTooltip: true }} className="my-reused-item-desc">
                      {a.displayDesc || a.description}
                    </Text>
                    <Text size="small" type="tertiary">
                      {t('sharing.market.detail.reusedAt')}：{a.myReusedAt ?? '—'}
                    </Text>
                  </div>
                </li>
              ))}
            </ul>
            {list.length > PAGE_SIZE && (
              <div className="list-pagination">
                <Pagination
                  size="small"
                  currentPage={page}
                  pageSize={PAGE_SIZE}
                  total={list.length}
                  onPageChange={setPage}
                  style={{ marginLeft: 'auto' }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </SideSheet>
  );
};

export default MyReusedDrawer;
