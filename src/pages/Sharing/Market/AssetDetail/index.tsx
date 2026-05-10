import { useMemo, useState, useSyncExternalStore } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Typography, Tabs, Button, Space, Tag, Toast, Table, Modal, Tooltip, Banner, Spin } from '@douyinfe/semi-ui';
import { ChevronLeft, Star, Repeat2, ExternalLink, Download, Pencil, Camera, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { findMarketAsset, getMarketAssets, subscribe, isOwner } from '@/pages/SharingCenter/MyShared/store';
import { useCollections } from '../hooks/useCollections';
import { useReuseAction } from '../hooks/useReuseAction';
import AssetTypeIcon from '../components/AssetTypeIcon';
import MvpPlaceholder from '../components/MvpPlaceholder';
import EmptyState from '@/components/EmptyState';
import './index.less';

const { Title, Text, Paragraph } = Typography;
const TabPane = Tabs.TabPane;

const typeRouteMap: Record<string, string> = {
  snippet: 'SNIPPET', workflow: 'WORKFLOW', knowledge: 'KNOWLEDGE', skill: 'SKILL',
};

const AssetDetail = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { type, id } = useParams<{ type: string; id: string }>();
  const version = useSyncExternalStore(subscribe, () => getMarketAssets().length);
  const asset = useMemo(() => (id ? findMarketAsset(id) : undefined), [id, version]);
  const { isCollected, toggle } = useCollections();
  const { getReuseState, getReusedAt, triggerReuse } = useReuseAction();
  const [previewVersion, setPreviewVersion] = useState<{ version: string; content: string } | null>(null);

  // SNIPPET / SKILL 在 MVP 不开放
  if (type === 'snippet' || type === 'skill') {
    return <MvpPlaceholder titleKey={`sharing.market.subTitles.${type}`} />;
  }

  if (!asset || (type && typeRouteMap[type] !== asset.type)) {
    return (
      <div className="asset-detail-empty">
        <EmptyState variant="notFound" description={t('sharing.market.detail.notFound')} actions={['goBack']} />
      </div>
    );
  }

  const collected = isCollected(asset.id);
  const owner = isOwner(asset.id);
  const reuseState = getReuseState(asset);
  const reusedAt = getReusedAt(asset.id);

  const displayName = asset.displayName || asset.name;
  const displayDesc = asset.displayDesc || asset.description;
  const categoryTags = asset.categoryTags ?? [];

  const handleEditDisplay = () => {
    navigate(`/sharing-center/market/${type}/${asset.id}/edit-display`);
  };

  const handleEditInDevCenter = () => {
    if (asset.originUrl) {
      window.open(asset.originUrl, '_blank');
    } else {
      window.open('/dev-center/process-development', '_blank');
    }
  };

  const handleDownloadKnowledge = () => {
    Toast.success(t('sharing.market.detail.knowledgeDownloadStarted'));
  };

  const renderReuseButton = () => {
    if (reuseState === 'hidden') return null;
    if (reuseState === 'loading') {
      return (
        <Button theme="solid" type="primary" disabled icon={<Spin size="small" />}>
          {t('sharing.market.action.reusing')}
        </Button>
      );
    }
    if (reuseState === 'reused') {
      return (
        <Tooltip content={reusedAt ? `${t('sharing.market.detail.reusedAt')} ${reusedAt}` : undefined}>
          <Button theme="light" type="tertiary" disabled icon={<Check size={14} strokeWidth={2.5} />}>
            {t('sharing.market.action.reused')}
          </Button>
        </Tooltip>
      );
    }
    return (
      <Button theme="solid" type="primary" icon={<Repeat2 size={14} strokeWidth={2} />} onClick={() => triggerReuse(asset)}>
        {t('sharing.market.action.reuse')}
      </Button>
    );
  };

  const renderTypeAction = () => {
    if (asset.type === 'WORKFLOW') {
      return (
        <Button theme="borderless" type="tertiary" icon={<ExternalLink size={14} strokeWidth={2} />} onClick={handleEditInDevCenter}>
          {t('sharing.market.detail.editInDevCenter')}
        </Button>
      );
    }
    if (asset.type === 'KNOWLEDGE') {
      return (
        <Button theme="light" type="tertiary" icon={<Download size={14} strokeWidth={2} />} onClick={handleDownloadKnowledge}>
          {t('sharing.market.detail.downloadZip')}
        </Button>
      );
    }
    return null;
  };

  const renderWorkflowContent = () => (
    <div className="asset-detail-workflow-content">
      {asset.overview ? (
        <div className="knowledge-html" dangerouslySetInnerHTML={{ __html: asset.overview }} />
      ) : (
        <Paragraph type="tertiary">{displayDesc}</Paragraph>
      )}
      {asset.videoUrl && (
        <div className="asset-detail-video">
          <video src={asset.videoUrl} controls style={{ width: '100%', maxWidth: 720, marginTop: 16, borderRadius: 8 }} />
        </div>
      )}
      <Banner
        type="info"
        fullMode={false}
        closeIcon={null}
        description={t('sharing.market.detail.workflow.readOnlyTip')}
        style={{ marginTop: 16 }}
      />
    </div>
  );

  const renderKnowledgeContent = () => {
    const k = asset.knowledge;
    return (
      <div className="asset-detail-content-knowledge">
        {asset.overview && <div className="knowledge-html" dangerouslySetInnerHTML={{ __html: asset.overview }} />}
        {k?.contentHtml && <div className="knowledge-html" dangerouslySetInnerHTML={{ __html: k.contentHtml }} />}
        {asset.videoUrl && (
          <video src={asset.videoUrl} controls style={{ width: '100%', maxWidth: 720, marginTop: 16, borderRadius: 8 }} />
        )}
        {k && k.attachments.length > 0 && (
          <div className="knowledge-attachments">
            <Text strong>{t('sharing.market.detail.attachments')}</Text>
            <ul>
              {k.attachments.map((a) => (
                <li key={a.name}>
                  <a href={a.url}>{a.name}</a>
                  <Text type="tertiary" size="small"> · {a.size}</Text>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="asset-detail">
      <div className="asset-detail-back">
        <Tooltip content={t('common.back')}>
          <Button
            type="tertiary"
            theme="borderless"
            icon={<ChevronLeft size={18} strokeWidth={2} />}
            onClick={() => navigate(-1)}
          />
        </Tooltip>
        <Text type="tertiary">{asset.type === 'WORKFLOW' ? t('sharing.market.detail.backWorkflow') : t('sharing.market.detail.back')}</Text>
      </div>

      <div className="asset-detail-info-card">
        {asset.coverImage && (
          <div className="info-card-cover" style={{ backgroundImage: `url(${asset.coverImage})` }} />
        )}
        <div className="info-card-head">
          <AssetTypeIcon type={asset.type} size={22} />
          <div className="info-card-title">
            <Title heading={4} style={{ margin: 0 }}>{displayName}</Title>
          </div>
          <Space>
            {owner && (
              <Button theme="light" type="tertiary" icon={<Pencil size={14} strokeWidth={2} />} onClick={handleEditDisplay}>
                {t('sharing.market.action.editDisplay')}
              </Button>
            )}
            {renderTypeAction()}
            <Button
              theme="light"
              type="tertiary"
              icon={<Star size={14} strokeWidth={2} fill={collected ? 'currentColor' : 'none'} />}
              onClick={() => { toggle(asset.id); Toast.success(collected ? t('sharing.market.toast.uncollected') : t('sharing.market.toast.collected')); }}
            >
              {collected ? t('sharing.market.action.uncollect') : t('sharing.market.action.collect')}
            </Button>
            {renderReuseButton()}
          </Space>
        </div>
        <Paragraph type="tertiary" className="info-card-desc">{displayDesc}</Paragraph>
        <div className="info-card-meta">
          <span><Text type="tertiary" size="small">{t('sharing.market.detail.creator')}</Text> {asset.creatorName}</span>
          <span><Text type="tertiary" size="small">{t('sharing.market.detail.createdAt')}</Text> {asset.createdAt}</span>
          <span><Text type="tertiary" size="small">{t('sharing.market.metric.reuseCount')}</Text> {asset.reuseCount}</span>
          <span><Text type="tertiary" size="small">{t('sharing.market.metric.version')}</Text> {asset.currentVersion}</span>
        </div>
        {(categoryTags.length > 0 || asset.tags.length > 0) && (
          <div className="info-card-tags">
            {categoryTags.map((tag) => <Tag key={`c-${tag}`} size="small" color="blue" type="light">{tag}</Tag>)}
            {asset.tags.map((tag) => <Tag key={tag} size="small" color="grey" type="light">{tag}</Tag>)}
          </div>
        )}
      </div>

      <Tabs className="asset-detail-tabs" type="line">
        <TabPane itemKey="content" tab={asset.type === 'WORKFLOW' ? t('sharing.market.detail.tabs.contentReadonly') : t('sharing.market.detail.tabs.content')}>
          {asset.type === 'WORKFLOW' ? renderWorkflowContent() : renderKnowledgeContent()}
        </TabPane>
        <TabPane itemKey="versions" tab={`${t('sharing.market.detail.tabs.versions')} (${asset.versions.length})`}>
          <Table
            size="small"
            pagination={false}
            dataSource={asset.versions}
            rowKey="id"
            columns={[
              {
                title: t('sharing.market.detail.col.version'), dataIndex: 'version', width: 140,
                render: (v: string, r) => (
                  <Space>
                    {v}
                    {r.isLatest && <Tag size="small" color="green">{t('sharing.market.detail.latest')}</Tag>}
                    {r.isSnapshot && (
                      <Tooltip content={t('sharing.market.detail.snapshotTip')}>
                        <Tag size="small" color="orange" prefixIcon={<Camera size={10} strokeWidth={2} />}>
                          {t('sharing.market.detail.snapshot')}
                        </Tag>
                      </Tooltip>
                    )}
                  </Space>
                ),
              },
              { title: t('sharing.market.detail.col.changeLog'), dataIndex: 'changeLog' },
              { title: t('sharing.market.detail.col.author'), dataIndex: 'createdBy', width: 120 },
              { title: t('sharing.market.detail.col.date'), dataIndex: 'createdAt', width: 140 },
              {
                title: t('sharing.market.detail.col.action'), width: 80,
                render: (_, r) => <Button size="small" theme="borderless" type="primary" onClick={() => setPreviewVersion({ version: r.version, content: r.content })}>{t('sharing.market.detail.view')}</Button>,
              },
            ]}
          />
        </TabPane>
        <TabPane itemKey="reuses" tab={`${t('sharing.market.detail.tabs.reuses')} (${asset.reuseRecords.length})`}>
          {asset.reuseRecords.length === 0 ? (
            <EmptyState variant="noData" description={t('sharing.market.detail.noReuse')} />
          ) : (
            <Table
              size="small"
              pagination={false}
              dataSource={asset.reuseRecords}
              rowKey="id"
              columns={[
                { title: t('sharing.market.detail.col.reuser'), dataIndex: 'reuserName', width: 120 },
                { title: t('sharing.market.detail.col.version'), dataIndex: 'versionNumber', width: 120 },
                { title: t('sharing.market.detail.col.date'), dataIndex: 'reusedAt', width: 140 },
                { title: t('sharing.market.detail.col.note'), dataIndex: 'adaptationNote', render: (v) => v ?? '—' },
              ]}
            />
          )}
        </TabPane>
      </Tabs>

      <Modal
        visible={!!previewVersion}
        title={`${t('sharing.market.detail.versionPreview')} · ${previewVersion?.version ?? ''}`}
        onCancel={() => setPreviewVersion(null)}
        onOk={() => { triggerReuse(asset); setPreviewVersion(null); }}
        okText={t('sharing.market.detail.reuseThisVersion')}
        cancelText={t('common.close')}
        width={520}
      >
        <pre className="asset-detail-yaml">{previewVersion?.content}</pre>
      </Modal>
    </div>
  );
};

export default AssetDetail;
