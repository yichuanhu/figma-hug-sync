import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Typography, Tabs, Empty, Pagination, Card, Space, Button, Tag, Input, Select, Checkbox } from '@douyinfe/semi-ui';
import { IconSearch } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal } from 'lucide-react';
import StatusTag, { type ShareStatus } from '@/components/sharing/StatusTag';
import SourceBadge from '@/components/sharing/SourceBadge';
import AssetTypeIcon from '@/pages/Sharing/Market/components/AssetTypeIcon';
import { IllustrationNoResult } from '@douyinfe/semi-illustrations';
import emptyImg from '@/assets/empty-state/no-data.png';
import {
  type ShareAsset, getMine, subscribe,
} from './store';
import NewAssetDropdown from './components/NewAssetDropdown';
import AssetActionsMenu from './components/AssetActionsMenu';
import BatchActionBar from './components/BatchActionBar';
import './index.less';

const { Title, Text, Paragraph } = Typography;
const TabPane = Tabs.TabPane;

const TABS: ShareStatus[] = ['PUBLISHED', 'DRAFT', 'PENDING_APPROVAL', 'REJECTED', 'ARCHIVED'];
const PAGE_SIZE = 12;

type TypeFilter = 'ALL' | 'SNIPPET' | 'WORKFLOW' | 'KNOWLEDGE' | 'SKILL';
type SourceFilter = 'ALL' | 'NATIVE' | 'DEV_CENTER';

const typeRoute: Record<string, string> = { SNIPPET: 'snippet', WORKFLOW: 'workflow', KNOWLEDGE: 'knowledge', SKILL: 'skill' };

const useStore = () => useSyncExternalStore(subscribe, () => getMine().length);

const MySharedPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  useStore(); // 触发订阅
  const all = getMine();

  const [tab, setTab] = useState<ShareStatus>('PUBLISHED');
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [debounced, setDebounced] = useState('');
  const [typeF, setTypeF] = useState<TypeFilter>('ALL');
  const [sourceF, setSourceF] = useState<SourceFilter>('ALL');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // 关键词 ≥2 字符 + 300ms 防抖
  useEffect(() => {
    const k = keyword.trim();
    const timer = setTimeout(() => setDebounced(k.length >= 2 ? k : ''), 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  const counts = useMemo(() => {
    const m: Record<ShareStatus, number> = {
      PUBLISHED: 0, DRAFT: 0, PENDING_APPROVAL: 0, REJECTED: 0, ARCHIVED: 0, UNLISTED: 0,
    };
    all.forEach((a) => { if (m[a.shareStatus] !== undefined) m[a.shareStatus] += 1; });
    return m;
  }, [all]);

  const list = useMemo(() => {
    return all.filter((a) => {
      if (a.shareStatus !== tab) return false;
      if (typeF !== 'ALL' && a.type !== typeF) return false;
      if (sourceF !== 'ALL' && a.source !== sourceF) return false;
      if (debounced) {
        const k = debounced.toLowerCase();
        const hit = a.name.toLowerCase().includes(k)
          || a.description.toLowerCase().includes(k)
          || a.tags.some((tag) => tag.toLowerCase().includes(k));
        if (!hit) return false;
      }
      return true;
    });
  }, [all, tab, typeF, sourceF, debounced]);

  const paged = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const filtered = typeF !== 'ALL' || sourceF !== 'ALL' || !!debounced;
  const clearFilters = () => { setKeyword(''); setTypeF('ALL'); setSourceF('ALL'); };

  const goDetail = (a: ShareAsset) => navigate(`/sharing-center/market/${typeRoute[a.type]}/${a.id}`);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const selectedAssets = paged.filter((a) => selected.has(a.id));

  const emptyTitle = filtered ? t('sharing.myShared.empty.noResult') : t(`sharing.myShared.empty.${tab.toLowerCase()}`);

  return (
    <div className="my-shared-page">
      <div className="my-shared-header">
        <Title heading={3} className="title">{t('sharing.myShared.pageTitle')}</Title>
        <NewAssetDropdown />
      </div>

      <Tabs
        activeKey={tab}
        onChange={(k) => { setTab(k as ShareStatus); setPage(1); setSelected(new Set()); }}
        className="my-shared-tabs"
        keepDOM={false}
      >
        {TABS.map((k) => (
          <TabPane key={k} itemKey={k} tab={`${t(`sharing.myShared.tabs.${k.toLowerCase()}`)} (${counts[k]})`} />
        ))}
      </Tabs>

      <div className="my-shared-filters">
        <Input
          prefix={<IconSearch />}
          value={keyword}
          onChange={setKeyword}
          placeholder={t('sharing.myShared.filters.searchPlaceholder')}
          showClear
          style={{ width: 320 }}
        />
        <Select
          value={typeF}
          onChange={(v) => setTypeF(v as TypeFilter)}
          style={{ width: 140 }}
          insetLabel={t('sharing.myShared.filters.type')}
          optionList={[
            { value: 'ALL', label: t('sharing.myShared.filters.allType') },
            { value: 'SNIPPET', label: t('sharing.myShared.newAsset.snippet') },
            { value: 'WORKFLOW', label: t('sharing.myShared.newAsset.workflow') },
            { value: 'KNOWLEDGE', label: t('sharing.myShared.newAsset.knowledge') },
            { value: 'SKILL', label: t('sharing.myShared.newAsset.skill') },
          ]}
        />
        <Select
          value={sourceF}
          onChange={(v) => setSourceF(v as SourceFilter)}
          style={{ width: 160 }}
          insetLabel={t('sharing.myShared.filters.source')}
          optionList={[
            { value: 'ALL', label: t('sharing.myShared.filters.allSource') },
            { value: 'NATIVE', label: t('sharing.common.source.native') },
            { value: 'DEV_CENTER', label: t('sharing.common.source.devCenter') },
          ]}
        />
        {filtered && (
          <Button theme="borderless" type="tertiary" onClick={clearFilters}>
            {t('sharing.myShared.filters.clear')}
          </Button>
        )}
      </div>

      <BatchActionBar selected={selectedAssets} onClear={() => setSelected(new Set())} />

      <div className="my-shared-body">
        {list.length === 0 ? (
          <div className="my-shared-empty">
            <Empty
              image={filtered
                ? <IllustrationNoResult style={{ width: 120, height: 120 }} />
                : <img src={emptyImg} alt="empty" style={{ width: 120, height: 120 }} />}
              title={emptyTitle}
              description={!filtered && (tab === 'PUBLISHED' || tab === 'DRAFT')
                ? <Button theme="solid" type="primary" onClick={() => navigate('/sharing-center/my-shared/create/knowledge')}>
                    {t('sharing.myShared.empty.createCta')}
                  </Button>
                : null}
            />
          </div>
        ) : (
          <>
            <div className="my-shared-grid">
              {paged.map((a) => {
                const isSel = selected.has(a.id);
                return (
                  <div
                    key={a.id}
                    className={`my-shared-card-wrapper${isSel ? ' selected' : ''}`}
                    onClick={() => goDetail(a)}
                  >
                    <Card className="my-shared-card" bodyStyle={{ padding: 16 }}>
                      <div className="card-top" onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={isSel} onChange={() => toggleSelect(a.id)} />
                        <AssetActionsMenu asset={a} trigger={
                          <Button size="small" theme="borderless" type="tertiary" icon={<MoreHorizontal size={16} strokeWidth={2} />} />
                        } />
                      </div>
                      <div className="card-head">
                        <AssetTypeIcon type={a.type} />
                        <Text strong ellipsis={{ showTooltip: true }} className="card-name">{a.name}</Text>
                      </div>
                      <div className="card-badges">
                        <SourceBadge source={a.source} />
                        <StatusTag status={a.shareStatus} />
                      </div>
                      <Paragraph ellipsis={{ rows: 2 }} type="tertiary" size="small" className="card-desc">
                        {a.description}
                      </Paragraph>
                      <div className="card-tags">
                        {a.tags.slice(0, 3).map((tag) => (
                          <Tag key={tag} size="small" color="grey" type="light">{tag}</Tag>
                        ))}
                      </div>
                      <div className="card-footer">
                        <Text size="small" type="tertiary" ellipsis={{ showTooltip: true }}>
                          {t('sharing.myShared.col.version')}: {a.currentVersion} · {a.updatedAt}
                        </Text>
                      </div>
                    </Card>
                  </div>
                );
              })}
            </div>
            <div className="list-pagination">
              <Pagination
                total={list.length}
                pageSize={PAGE_SIZE}
                currentPage={page}
                onPageChange={setPage}
                showTotal
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MySharedPage;
