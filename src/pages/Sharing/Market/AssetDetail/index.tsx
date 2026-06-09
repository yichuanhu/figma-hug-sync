import { useMemo, useState, useSyncExternalStore } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Typography, Tabs, Button, Space, Tag, Toast, Table, Modal, Tooltip, Spin, Form,
} from '@douyinfe/semi-ui';
import {
  ChevronLeft, Repeat2, Download, Pencil, Repeat as RepeatIcon, Clock, User, Building2, Paperclip,
} from 'lucide-react';
import AssetIdentity from '../components/AssetIdentity';
import { useTranslation } from 'react-i18next';
import { findMarketAsset, getMarketAssets, subscribe, isOwner, isWorkflowNameTaken } from '@/pages/SharingCenter/MyShared/store';
import { useReuseAction } from '../hooks/useReuseAction';
import AssetTypeIcon from '../components/AssetTypeIcon';
import EmptyState from '@/components/EmptyState';
import { resolveUsageKind } from '../types';
import AssetMetaPanel from './components/AssetMetaPanel';
import './index.less';

const { Title, Text, Paragraph } = Typography;
const TabPane = Tabs.TabPane;

const typeRouteMap: Record<string, string> = {
  workflow: 'WORKFLOW', knowledge: 'KNOWLEDGE',
};

interface Props {
  /** consumer（默认）：消费者视图；supply：上架管理视图，隐藏「复用」与「打包下载」，由 extraActions 提供右侧按钮组 */
  mode?: 'consumer' | 'supply';
  /** supply 模式下右侧按钮组（替代默认编辑/在开发中心编辑） */
  extraActions?: React.ReactNode;
  /** 内嵌模式（抽屉）：不渲染页面级头部（返回按钮+标题行），由外层抽屉负责 */
  embedded?: boolean;
  /** 内嵌模式下用于指定资产 ID 与类型（替代路由参数） */
  idOverride?: string;
  typeOverride?: string;
}

const AssetDetail = ({ mode = 'consumer', extraActions, embedded, idOverride, typeOverride }: Props = {}) => {
  const isSupply = mode === 'supply';
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams<{ type: string; id: string }>();
  const id = idOverride ?? params.id;
  const type = typeOverride ?? params.type;
  const version = useSyncExternalStore(subscribe, () => getMarketAssets().length);
  const asset = useMemo(() => (id ? findMarketAsset(id) : undefined), [id, version]);
  const { getReuseState, getReusedAt, triggerReuse } = useReuseAction();
  
  const [reuseDialog, setReuseDialog] = useState<{ open: boolean; workflowName: string; nameError?: string }>({ open: false, workflowName: '' });
  const [reuseSubmitting, setReuseSubmitting] = useState(false);

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

  

  // 知识资产：单附件下载（取首个）
  const singleAttachment = !isWorkflow ? asset.knowledge?.attachments?.[0] : undefined;
  const handleDownloadKnowledge = () => {
    if (!singleAttachment) return;
    Toast.success(t('sharing.market.detail.attachmentDownloadStarted'));
  };
  const handleEditKnowledge = () => Toast.info(t('sharing.market.detail.editKnowledgeTip'));

  // 打开「输入流程名称」对话框（仅 WORKFLOW；支持多次复用）
  const openWorkflowReuseDialog = () => setReuseDialog({ open: true, workflowName: '' });
  const closeWorkflowReuseDialog = () => { if (!reuseSubmitting) setReuseDialog({ open: false, workflowName: '' }); };
  const validateName = (name: string): string | undefined => {
    const v = name.trim();
    if (!v) return t('sharing.market.detail.reuseDialog.nameRequired');
    if (v.length > 100) return t('sharing.market.detail.reuseDialog.nameTooLong');
    if (isWorkflowNameTaken(v)) return t('sharing.market.detail.reuseDialog.nameTaken');
    return undefined;
  };
  const submitWorkflowReuse = async () => {
    const err = validateName(reuseDialog.workflowName);
    if (err) { setReuseDialog((s) => ({ ...s, nameError: err })); return; }
    setReuseSubmitting(true);
    const r = await triggerReuse(asset, { workflowName: reuseDialog.workflowName.trim() });
    setReuseSubmitting(false);
    if (r.ok) setReuseDialog({ open: false, workflowName: '' });
  };

  const renderReuseButton = () => {
    if (!isWorkflow) return null;
    if (reuseState === 'hidden') return null;
    if (reuseState === 'loading') {
      return (
        <Button theme="solid" type="primary" disabled icon={<Spin size="small" />}>
          {t('sharing.market.action.reusing')}
        </Button>
      );
    }
    return (
      <Button theme="solid" type="primary" icon={<Repeat2 size={14} strokeWidth={2} />} onClick={openWorkflowReuseDialog}>
        {t('sharing.market.action.reuse')}
      </Button>
    );
  };

  // ============ Hero 右上角操作组 ============
  // WORKFLOW: 主按钮=复用；KNOWLEDGE: 主下载按钮已下放到左侧"附件"插槽，此处仅保留次要编辑按钮
  const renderHeroActions = () => {
    if (isSupply) return extraActions ?? null;

    const buttons: React.ReactNode[] = [];
    if (isWorkflow) {
      const btn = renderReuseButton();
      if (btn) buttons.push(<span key="reuse">{btn}</span>);
    }
    if (!isWorkflow && owner) {
      buttons.push(
        <Button key="ek" theme="light" type="tertiary" icon={<Pencil size={14} strokeWidth={2} />} onClick={handleEditKnowledge}>
          {t('sharing.market.detail.editKnowledge')}
        </Button>,
      );
    }
    return buttons.length ? <Space>{buttons}</Space> : null;
  };

  // ============ Hero 区（封面 + 标题 + 描述 + 指标条 + 标签 + 操作） ============
  const renderHero = () => {
    return (
      <section className="asset-detail-section asset-detail-hero">
        <div className="hero-cover">
          {asset.coverImage ? (
            <div className="hero-cover-img" style={{ backgroundImage: `url(${asset.coverImage})` }} />
          ) : (
            <div className="hero-cover-placeholder">
              <AssetTypeIcon type={asset.type} size={48} />
              <span className="hero-cover-placeholder-label">
                {t(`sharing.market.detail.hero.defaultCover.${asset.type.toLowerCase()}`, {
                  defaultValue: t('sharing.market.detail.hero.defaultCover.fallback'),
                })}
              </span>
            </div>
          )}
        </div>
        <div className="hero-body">
          <div className="hero-head">
            <div className="hero-title-area">
              <AssetIdentity asset={asset} size="lg" ellipsis />
              <Paragraph type="tertiary" className="hero-desc" ellipsis={{ rows: 2, showTooltip: true }}>
                {displayDesc}
              </Paragraph>
            </div>
            <div className="hero-actions">{renderHeroActions()}</div>
          </div>
          <div className="hero-metrics">
            {(() => {
              const usageKind = resolveUsageKind(asset.type);
              const usageCount = asset.reuseRecords?.length ?? 0;
              const usageLabel = usageKind === 'DOWNLOAD'
                ? t('sharing.market.detail.hero.downloadCount', { count: usageCount })
                : t('sharing.market.detail.hero.reuseCount', { count: usageCount });
              const UsageIcon = usageKind === 'DOWNLOAD' ? Download : RepeatIcon;
              return <span className="hero-metric"><UsageIcon size={14} strokeWidth={2} />{usageLabel}</span>;
            })()}
            <span className="hero-metric"><Clock size={14} strokeWidth={2} />{t('sharing.market.detail.hero.publishedAt', { date: asset.createdAt })}</span>
            <span className="hero-metric"><User size={14} strokeWidth={2} />{asset.creatorName}</span>
            <span className="hero-metric"><Building2 size={14} strokeWidth={2} />{asset.departmentName}</span>
          </div>
          {categoryTags.length > 0 && (
            <div className="hero-tags">
              {categoryTags.map((tag) => (
                <Tag key={`c-${tag}`} size="small" color="blue" type="light">{tag}</Tag>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  };


  const hasVideo = !!asset.videoUrl;
  const knowledgeAttachment = asset.knowledge?.attachments?.[0];
  // ============ 媒体块解析（展示信息层统一外壳的关键扩展点） ============
  // 顺序：视频 → 知识附件；左栏纵向堆叠展示，空数组时回退到全宽概览。
  type MediaBlock = { key: string; title: string; node: React.ReactNode };
  const renderMediaBlocks = (): MediaBlock[] => {
    const blocks: MediaBlock[] = [];
    if (hasVideo) {
      blocks.push({
        key: 'video',
        title: t('sharing.market.detail.videoSectionTitle'),
        node: (
          <div className="video-frame">
            <video src={asset.videoUrl} controls preload="metadata" poster={asset.coverImage} />
          </div>
        ),
      });
    }
    if (!isWorkflow && knowledgeAttachment) {
      const ext = (knowledgeAttachment.name.split('.').pop() || '').toUpperCase();
      blocks.push({
        key: 'attachment',
        title: t('sharing.market.detail.attachment.title'),
        node: (
          <div className="attachment-card">
            <div className="attachment-icon">
              <Paperclip size={28} strokeWidth={1.6} />
              {ext && <span className="attachment-ext">{ext}</span>}
            </div>
            <div className="attachment-meta">
              <Text strong ellipsis={{ showTooltip: true }} className="attachment-name">{knowledgeAttachment.name}</Text>
              <Text type="tertiary" size="small">{knowledgeAttachment.size}</Text>
            </div>
            <Button theme="solid" type="primary" icon={<Download size={14} strokeWidth={2} />} onClick={handleDownloadKnowledge}>
              {t('sharing.market.detail.attachment.download')}
            </Button>
          </div>
        ),
      });
    }
    return blocks;
  };

  // ============ 资产概览 / 内容区 ============
  const renderOverviewBody = () => {
    if (isWorkflow) {
      return asset.overview
        ? <div className="knowledge-html" dangerouslySetInnerHTML={{ __html: asset.overview }} />
        : <Paragraph type="tertiary">{t('sharing.market.detail.noOverview')}</Paragraph>;
    }
    const k = asset.knowledge;
    const hasContent = asset.overview || k?.contentHtml;
    return (
      <>
        {asset.overview && <div className="knowledge-html" dangerouslySetInnerHTML={{ __html: asset.overview }} />}
        {k?.contentHtml && <div className="knowledge-html" dangerouslySetInnerHTML={{ __html: k.contentHtml }} />}
        {!hasContent && <Paragraph type="tertiary">{t('sharing.market.detail.noContent')}</Paragraph>}
      </>
    );
  };

  const overviewTitle = t('sharing.market.detail.overview');

  // 展示信息双栏：媒体块（纵向堆叠） + 概览
  const renderMediaRow = (blocks: MediaBlock[]) => (
    <div className="asset-detail-media-row">
      <section className="asset-detail-section asset-detail-video media-col-video">
        {blocks.map((b, i) => (
          <div key={b.key} className={`media-block${i > 0 ? ' media-block-stacked' : ''}`}>
            <div className="section-head">
              <Title heading={6} style={{ margin: 0 }}>{b.title}</Title>
            </div>
            {b.node}
          </div>
        ))}
      </section>
      <section className="asset-detail-section media-col-overview">
        <div className="section-head">
          <Title heading={6} style={{ margin: 0 }}>{overviewTitle}</Title>
        </div>
        <div className="overview-scroll">{renderOverviewBody()}</div>
      </section>
    </div>
  );

  // 全宽概览（媒体块为空时）
  const renderOverviewSection = () => (
    <section className="asset-detail-section">
      <div className="section-head">
        <Title heading={6} style={{ margin: 0 }}>{overviewTitle}</Title>
      </div>
      {renderOverviewBody()}
    </section>
  );

  // ============ 资产元信息（默认折叠，统一复用组件） ============
  const renderMetaCollapsible = () => <AssetMetaPanel asset={asset} />;

  const mediaBlocks = renderMediaBlocks();

  // 仅非正常状态才展示状态 Tag
  const showStatusTag = asset.status && asset.status !== 'PUBLISHED';

  return (
    <div className="asset-detail">
      {/* ===== 极简头部：仅返回按钮 + 类型图标 + 面包屑式小标题；标题由 Hero 区承载 ===== */}
      {!embedded && (
        <div className="asset-detail-header asset-detail-header-slim">
          <div className="asset-detail-header-title">
            <Tooltip content={t('common.back')}>
              <Button
                type="tertiary"
                theme="borderless"
                icon={<ChevronLeft size={18} strokeWidth={2} />}
                onClick={() => navigate(-1)}
              />
            </Tooltip>
            <AssetTypeIcon type={asset.type} size={16} />
            <Text type="tertiary" size="small">
              {t('sharing.market.pageTitle')} / {t(`sharing.market.tabs.${asset.type}`)}
            </Text>
            {showStatusTag && (
              <Tag color="orange" type="light" size="small">{asset.status}</Tag>
            )}
          </div>
        </div>
      )}

      {renderHero()}
      {mediaBlocks.length > 0 ? renderMediaRow(mediaBlocks) : renderOverviewSection()}

      {isSupply && (() => {
        const usageKind = resolveUsageKind(asset.type);
        const isDownload = usageKind === 'DOWNLOAD';
        return (
          <Tabs className="asset-detail-tabs" type="line">
            <TabPane
              itemKey="reuses"
              tab={`${t(isDownload ? 'sharing.market.detail.tabs.downloads' : 'sharing.market.detail.tabs.reuses')} (${asset.reuseRecords.length})`}
            >
              {asset.reuseRecords.length === 0 ? (
                <EmptyState
                  variant="noData"
                  description={t(isDownload ? 'sharing.market.detail.noDownload' : 'sharing.market.detail.noReuse')}
                />
              ) : (
                <Table
                  size="small"
                  pagination={false}
                  dataSource={asset.reuseRecords}
                  rowKey="id"
                  columns={[
                    {
                      title: t(isDownload ? 'sharing.market.detail.col.downloader' : 'sharing.market.detail.col.reuser'),
                      dataIndex: 'reuserName',
                      width: 120,
                    },
                    ...(isDownload ? [] : [{ title: t('sharing.market.detail.col.version'), dataIndex: 'versionNumber', width: 120 }]),
                    { title: t('sharing.market.detail.col.date'), dataIndex: 'reusedAt', width: 140 },
                  ]}
                />
              )}
            </TabPane>
          </Tabs>
        );
      })()}

      {renderMetaCollapsible()}

      {/* 复用为流程 — 名称输入对话框（支持多次复用，全局唯一） */}
      <Modal
        visible={reuseDialog.open}
        title={t('sharing.market.detail.reuseDialog.title')}
        onCancel={closeWorkflowReuseDialog}
        onOk={submitWorkflowReuse}
        okText={t('sharing.market.detail.reuseDialog.confirm')}
        cancelText={t('common.cancel')}
        confirmLoading={reuseSubmitting}
        width={520}
        maskClosable={false}
      >
        <Form labelPosition="top">
          <Form.Input
            label={t('sharing.market.detail.reuseDialog.nameLabel')}
            field="workflowName"
            placeholder={t('sharing.market.detail.reuseDialog.namePlaceholder')}
            initValue={reuseDialog.workflowName}
            onChange={(v) => setReuseDialog((s) => ({ ...s, workflowName: (v as string) ?? '', nameError: undefined }))}
            maxLength={100}
            showClear
            validateStatus={reuseDialog.nameError ? 'error' : 'default'}
            helpText={reuseDialog.nameError ?? t('sharing.market.detail.reuseDialog.nameHelp')}
          />
        </Form>
      </Modal>
    </div>
  );
};

export default AssetDetail;
