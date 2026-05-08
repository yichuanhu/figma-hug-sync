import { useMemo, useState } from 'react';
import { Typography, Tabs, Empty, Pagination, Card, Space, Button, Tag } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ShareAsset, getMyShared } from '../shared/mockData';
import type { ShareStatus } from '@/components/sharing/StatusTag';
import StatusTag from '@/components/sharing/StatusTag';
import SourceBadge from '@/components/sharing/SourceBadge';
import AssetTypeIcon from '@/pages/Sharing/Market/components/AssetTypeIcon';
import emptyImg from '@/assets/empty-state/empty-list.png';
import './index.less';

const { Title, Text, Paragraph } = Typography;
const TabPane = Tabs.TabPane;

const TABS: ShareStatus[] = ['PUBLISHED', 'DRAFT', 'PENDING_APPROVAL', 'REJECTED'];
const PAGE_SIZE = 12;

const typeRoute: Record<string, string> = { SNIPPET: 'snippet', WORKFLOW: 'workflow', KNOWLEDGE: 'knowledge', SKILL: 'skill' };

const MySharedPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tab, setTab] = useState<ShareStatus>('PUBLISHED');
  const [page, setPage] = useState(1);

  const all = useMemo(() => getMyShared(), []);
  const counts = useMemo(() => {
    const m: Record<ShareStatus, number> = { PUBLISHED: 0, DRAFT: 0, PENDING_APPROVAL: 0, REJECTED: 0 };
    all.forEach((a) => { m[a.shareStatus] += 1; });
    return m;
  }, [all]);

  const list = useMemo(() => all.filter((a) => a.shareStatus === tab), [all, tab]);
  const paged = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const goDetail = (a: ShareAsset) => {
    navigate(`/sharing-center/market/${typeRoute[a.type]}/${a.id}`);
  };

  return (
    <div className="my-shared-page">
      <div className="my-shared-header">
        <Title heading={3} className="title">{t('sharing.myShared.pageTitle')}</Title>
      </div>

      <Tabs
        activeKey={tab}
        onChange={(k) => { setTab(k as ShareStatus); setPage(1); }}
        className="my-shared-tabs"
        keepDOM={false}
      >
        {TABS.map((k) => (
          <TabPane
            key={k}
            itemKey={k}
            tab={`${t(`sharing.myShared.tabs.${k.toLowerCase()}`)} (${counts[k]})`}
          />
        ))}
      </Tabs>

      <div className="my-shared-body">
        {list.length === 0 ? (
          <div className="my-shared-empty">
            <Empty
              image={<img src={emptyImg} alt="empty" style={{ width: 120 }} />}
              title={t('sharing.myShared.empty.title')}
              description={t('sharing.myShared.empty.description')}
            />
          </div>
        ) : (
          <>
            <div className="my-shared-grid">
              {paged.map((a) => (
                <Card
                  key={a.id}
                  className="my-shared-card"
                  bodyStyle={{ padding: 16 }}
                  onClick={() => goDetail(a)}
                >
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
                    <Text size="small" type="tertiary">
                      {t('sharing.myShared.col.version')}: {a.currentVersion} · {a.updatedAt}
                    </Text>
                    <Space spacing={4} onClick={(e) => e.stopPropagation()}>
                      {a.shareStatus === 'DRAFT' && a.source === 'NATIVE' && (
                        <Button size="small" theme="borderless" type="danger">
                          {t('common.delete')}
                        </Button>
                      )}
                      {(a.shareStatus === 'DRAFT' || a.shareStatus === 'REJECTED') && a.source === 'NATIVE' && (
                        <Button size="small" theme="light" type="primary">
                          {t('common.edit')}
                        </Button>
                      )}
                      <Button size="small" theme="borderless" type="tertiary" onClick={() => goDetail(a)}>
                        {t('sharing.myShared.actions.view')}
                      </Button>
                    </Space>
                  </div>
                </Card>
              ))}
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
