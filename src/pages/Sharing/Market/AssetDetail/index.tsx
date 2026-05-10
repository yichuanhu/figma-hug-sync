import { useMemo, useState, useSyncExternalStore } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Typography, Tabs, Button, Space, Tag, Toast, Table, Modal, Tooltip, Banner, Spin, Collapse,
} from '@douyinfe/semi-ui';
import {
  ChevronLeft, Repeat2, ExternalLink, Download, Pencil, Camera, Check, FileText,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { findMarketAsset, getMarketAssets, subscribe, isOwner } from '@/pages/SharingCenter/MyShared/store';
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

interface Props {
  /** consumer（默认）：消费者视图；supply：上架管理视图，隐藏「复用」与「打包下载」，由 extraActions 提供右侧按钮组 */
  mode?: 'consumer' | 'supply';
  /** supply 模式下右侧按钮组（替代默认编辑/在开发中心编辑） */
  extraActions?: React.ReactNode;
}

const AssetDetail = ({ mode = 'consumer', extraActions }: Props = {}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { type, id } = useParams<{ type: string; id: string }>();
  const version = useSyncExternalStore(subscribe, () => getMarketAssets().length);
  const asset = useMemo(() => (id ? findMarketAsset(id) : undefined), [id, version]);
  const { getReuseState, getReusedAt, triggerReuse } = useReuseAction();
  const [previewVersion, setPreviewVersion] = useState<{ version: string; content: string } | null>(null);

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

  const owner = isOwner(asset.id);
  const reuseState = getReuseState(asset);
  const reusedAt = getReusedAt(asset.id);

  const displayName = asset.displayName || asset.name;
  const displayDesc = asset.displayDesc || asset.description;
  const categoryTags = asset.categoryTags ?? [];
  const isWorkflow = asset.type === 'WORKFLOW';

  const handleEditDisplay = () => navigate(`/sharing-center/market/${type}/${asset.id}/edit-display`);
  const handleEditInDevCenter = () => window.open(asset.originUrl || '/dev-center/process-development', '_blank');
  const handleDownloadKnowledge = () => Toast.success(t('sharing.market.detail.knowledgeDownloadStarted'));
  const handleEditKnowledge = () => Toast.info(t('sharing.market.detail.editKnowledgeTip'));

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

  // ============ 头部操作行（2 行布局） ============
  const renderHeaderActions = () => {
    const isSupply = mode === 'supply';
    // 左侧：consumer 显示「复用 [+ 打包下载]」；supply 模式按 BR-MARKET-008 隐藏复用
    const left = isSupply ? null : (
      <Space>
        {renderReuseButton()}
        {!isWorkflow && (
          <Button theme="light" type="tertiary" icon={<Download size={14} strokeWidth={2} />} onClick={handleDownloadKnowledge}>
            {t('sharing.market.detail.downloadZip')}
          </Button>
        )}
      </Space>
    );
    // 右侧：supply 模式由父组件提供 extraActions；否则使用默认编辑按钮
    const right = isSupply ? extraActions : (
      <Space>
        {!isWorkflow && owner && (
          <Button theme="light" type="tertiary" icon={<Pencil size={14} strokeWidth={2} />} onClick={handleEditKnowledge}>
            {t('sharing.market.detail.editKnowledge')}
          </Button>
        )}
        {owner && (
          <Button theme="light" type="tertiary" icon={<FileText size={14} strokeWidth={2} />} onClick={handleEditDisplay}>
            {t('sharing.market.action.editDisplay')}
          </Button>
        )}
        {isWorkflow && (
          <Button theme="borderless" type="primary" icon={<ExternalLink size={14} strokeWidth={2} />} onClick={handleEditInDevCenter}>
            {t('sharing.market.detail.editInDevCenter')}
          </Button>
        )}
      </Space>
    );
    if (!left && !right) return null;
    return (
      <div className="asset-detail-header-actions">
        <div>{left}</div>
        <div>{right}</div>
      </div>
    );
  };

  // ============ 展示信息区（封面左 + 内容右） ============
  const renderDisplayInfo = () => (
    <section className="asset-detail-section asset-detail-display">
      <div className="display-cover" style={asset.coverImage ? { backgroundImage: `url(${asset.coverImage})` } : undefined}>
        {!asset.coverImage && <AssetTypeIcon type={asset.type} size={36} />}
      </div>
      <div className="display-body">
        <Title heading={4} style={{ margin: 0 }}>{displayName}</Title>
        <Paragraph type="tertiary" className="display-desc">{displayDesc}</Paragraph>
        {categoryTags.length > 0 && (
          <div className="display-tags">
            {categoryTags.map((tag) => (
              <Tag key={`c-${tag}`} size="small" color="blue" type="light">{tag}</Tag>
            ))}
          </div>
        )}
        {asset.videoUrl && (
          <div className="display-video">
            <Text type="tertiary" size="small" style={{ display: 'block', marginBottom: 6 }}>
              🎬 {t('sharing.market.detail.demoVideo')}
            </Text>
            <video src={asset.videoUrl} controls style={{ width: '100%', maxWidth: 720, borderRadius: 8 }} />
          </div>
        )}
      </div>
    </section>
  );

  // ============ 内容区 ============
  const renderContentSection = () => {
    if (isWorkflow) {
      return (
        <section className="asset-detail-section">
          <div className="section-head">
            <Title heading={6} style={{ margin: 0 }}>{t('sharing.market.detail.overview')}</Title>
            <Button theme="borderless" type="primary" size="small"
              icon={<ExternalLink size={14} strokeWidth={2} />} onClick={handleEditInDevCenter}>
              {t('sharing.market.detail.editInDevCenter')}
            </Button>
          </div>
          {asset.overview
            ? <div className="knowledge-html" dangerouslySetInnerHTML={{ __html: asset.overview }} />
            : <Paragraph type="tertiary">{t('sharing.market.detail.noOverview')}</Paragraph>}
        </section>
      );
    }
    const k = asset.knowledge;
    const hasContent = asset.overview || k?.contentHtml;
    return (
      <section className="asset-detail-section">
        <div className="section-head">
          <Title heading={6} style={{ margin: 0 }}>{t('sharing.market.detail.tabs.content')}</Title>
        </div>
        {asset.overview && <div className="knowledge-html" dangerouslySetInnerHTML={{ __html: asset.overview }} />}
        {k?.contentHtml && <div className="knowledge-html" dangerouslySetInnerHTML={{ __html: k.contentHtml }} />}
        {!hasContent && <Paragraph type="tertiary">{t('sharing.market.detail.noContent')}</Paragraph>}
        {k && k.attachments.length > 0 && (
          <div className="knowledge-attachments">
            <Text strong>📎 {t('sharing.market.detail.attachments')}</Text>
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
      </section>
    );
  };

  // ============ 资产元信息（默认折叠） ============
  const renderMetaCollapsible = () => {
    const metaItems: Array<{ label: string; value: React.ReactNode }> = [
      { label: t('sharing.market.detail.meta.name'), value: asset.name },
      { label: t('sharing.market.detail.meta.description'), value: asset.description || '—' },
      { label: t('sharing.market.detail.meta.version'), value: asset.currentVersion },
    ];
    if (isWorkflow) {
      metaItems.push({
        label: t('sharing.market.detail.meta.resourceDeps'),
        value: asset.resourceDeps && asset.resourceDeps.length > 0
          ? <Space wrap spacing={4}>{asset.resourceDeps.map((d) => <Tag key={d} size="small" color="grey" type="light">{d}</Tag>)}</Space>
          : '—',
      });
    } else {
      metaItems.push({
        label: t('sharing.market.detail.meta.tags'),
        value: asset.tags.length > 0
          ? <Space wrap spacing={4}>{asset.tags.map((tag) => <Tag key={tag} size="small" color="grey" type="light">{tag}</Tag>)}</Space>
          : '—',
      });
    }
    metaItems.push(
      { label: t('sharing.market.detail.meta.department'), value: asset.departmentName },
      { label: t('sharing.market.detail.meta.publishedBy'), value: asset.creatorName },
      { label: t('sharing.market.detail.meta.publishedAt'), value: asset.createdAt },
    );

    return (
      <Collapse className="asset-detail-meta-collapse" expandIconPosition="right">
        <Collapse.Panel
          header={<Text strong>{t('sharing.market.detail.meta.title')}</Text>}
          itemKey="meta"
        >
          <dl className="meta-grid">
            {metaItems.map((item) => (
              <div key={item.label} className="meta-row">
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
          <Banner
            type={isWorkflow ? 'warning' : 'success'}
            fullMode={false}
            closeIcon={null}
            description={isWorkflow
              ? t('sharing.market.detail.meta.workflowReadOnly')
              : t('sharing.market.detail.meta.knowledgeEditable')}
            style={{ marginTop: 12 }}
          />
        </Collapse.Panel>
      </Collapse>
    );
  };

  return (
    <div className="asset-detail">
      {/* ===== 头部（两行）===== */}
      <div className="asset-detail-header">
        <div className="asset-detail-header-title">
          <Tooltip content={t('common.back')}>
            <Button
              type="tertiary"
              theme="borderless"
              icon={<ChevronLeft size={18} strokeWidth={2} />}
              onClick={() => navigate(-1)}
            />
          </Tooltip>
          <AssetTypeIcon type={asset.type} size={20} />
          <Title heading={5} style={{ margin: 0 }} ellipsis={{ showTooltip: true }}>
            {displayName}
          </Title>
          <Tag color="green" type="light" size="small">{asset.status}</Tag>
        </div>
        {renderHeaderActions()}
      </div>

      {renderDisplayInfo()}
      {renderContentSection()}

      <Tabs className="asset-detail-tabs" type="line">
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

      {renderMetaCollapsible()}

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
