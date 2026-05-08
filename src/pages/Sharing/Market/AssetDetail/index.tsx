import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Typography, Tabs, Button, Space, Tag, Toast, Table, Modal, Tooltip } from '@douyinfe/semi-ui';
import { ChevronLeft, Star, Repeat2, Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { findAssetById } from '../mockData';
import { useCollections } from '../hooks/useCollections';
import AssetTypeIcon from '../components/AssetTypeIcon';
import SourceBadge from '../components/SourceBadge';
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
  const asset = useMemo(() => (id ? findAssetById(id) : undefined), [id]);
  const { isCollected, toggle } = useCollections();
  const [reuseTick, setReuseTick] = useState(0);
  const [previewVersion, setPreviewVersion] = useState<{ version: string; content: string } | null>(null);

  if (!asset || (type && typeRouteMap[type] !== asset.type)) {
    return (
      <div className="asset-detail-empty">
        <EmptyState variant="notFound" description={t('sharing.market.detail.notFound')} actions={['goBack']} />
      </div>
    );
  }

  const collected = isCollected(asset.id);
  const isSkill = asset.type === 'SKILL' && !!asset.skill;
  const reuseCount = asset.reuseCount + reuseTick;

  const handleReuse = () => {
    Toast.success(t('sharing.market.toast.reuseSuccess'));
    setReuseTick((x) => x + 1);
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      Toast.success(t('sharing.market.toast.copied'));
    } catch {
      Toast.error(t('sharing.market.toast.copyFailed'));
    }
  };

  const renderContentTab = () => {
    if (asset.type === 'KNOWLEDGE' && asset.knowledge) {
      return (
        <div className="asset-detail-content-knowledge">
          <div className="knowledge-html" dangerouslySetInnerHTML={{ __html: asset.knowledge.contentHtml }} />
          {asset.knowledge.attachments.length > 0 && (
            <div className="knowledge-attachments">
              <Text strong>{t('sharing.market.detail.attachments')}</Text>
              <ul>
                {asset.knowledge.attachments.map((a) => (
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
    }
    const yaml = asset.workflow?.yaml ?? asset.snippet?.yaml ?? '';
    return <pre className="asset-detail-yaml">{yaml || t('sharing.market.detail.noContent')}</pre>;
  };

  const renderSkillParamsTab = () => (
    <div className="asset-detail-skill-params">
      <Text strong>{t('sharing.market.skill.inputParams')}</Text>
      <Table
        size="small"
        pagination={false}
        dataSource={asset.skill!.inputParams}
        rowKey="name"
        columns={[
          { title: t('sharing.market.skill.col.name'), dataIndex: 'name' },
          { title: t('sharing.market.skill.col.type'), dataIndex: 'type', width: 100 },
          { title: t('sharing.market.skill.col.required'), dataIndex: 'required', width: 80,
            render: (v: boolean) => v ? <Tag size="small" color="red">必填</Tag> : <Tag size="small" color="grey">可选</Tag> },
          { title: t('sharing.market.skill.col.desc'), dataIndex: 'description' },
          { title: t('sharing.market.skill.col.default'), dataIndex: 'defaultValue', width: 120, render: (v) => v ?? '—' },
        ]}
      />
      <div style={{ marginTop: 16 }}>
        <Text strong>{t('sharing.market.skill.outputParams')}</Text>
        <Table
          size="small"
          pagination={false}
          dataSource={asset.skill!.outputParams}
          rowKey="name"
          columns={[
            { title: t('sharing.market.skill.col.name'), dataIndex: 'name' },
            { title: t('sharing.market.skill.col.type'), dataIndex: 'type', width: 100 },
            { title: t('sharing.market.skill.col.desc'), dataIndex: 'description' },
          ]}
        />
      </div>
    </div>
  );

  const renderSkillExecTab = () => (
    <div className="asset-detail-skill-exec">
      <div className="exec-config">
        <div><Text type="tertiary">{t('sharing.market.skill.timeout')}</Text> <Text>{asset.skill!.timeoutSec}s</Text></div>
        <div><Text type="tertiary">{t('sharing.market.skill.retry')}</Text> <Text>{asset.skill!.retryPolicy}</Text></div>
      </div>
      <div className="exec-example-head">
        <Text strong>{t('sharing.market.skill.callExample')}</Text>
        <Button size="small" icon={<Copy size={14} strokeWidth={2} />} onClick={() => handleCopy(asset.skill!.callExample)}>
          {t('common.copy')}
        </Button>
      </div>
      <pre className="asset-detail-yaml">{asset.skill!.callExample}</pre>
    </div>
  );

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
        <Text type="tertiary">{t('sharing.market.detail.back')}</Text>
      </div>

      <div className="asset-detail-info-card">
        <div className="info-card-head">
          <AssetTypeIcon type={asset.type} size={22} />
          <div className="info-card-title">
            <Title heading={4} style={{ margin: 0 }}>{asset.name}</Title>
            <SourceBadge source={asset.source} />
          </div>
          <Space>
            <Button
              theme="light"
              type="tertiary"
              icon={<Star size={14} strokeWidth={2} fill={collected ? 'currentColor' : 'none'} />}
              onClick={() => { toggle(asset.id); Toast.success(collected ? t('sharing.market.toast.uncollected') : t('sharing.market.toast.collected')); }}
            >
              {collected ? t('sharing.market.action.uncollect') : t('sharing.market.action.collect')}
            </Button>
            <Button theme="solid" type="primary" icon={<Repeat2 size={14} strokeWidth={2} />} onClick={handleReuse}>
              {t('sharing.market.action.reuse')}
            </Button>
          </Space>
        </div>
        <Paragraph type="tertiary" className="info-card-desc">{asset.description}</Paragraph>
        <div className="info-card-meta">
          <span><Text type="tertiary" size="small">{t('sharing.market.detail.creator')}</Text> {asset.creatorName}</span>
          <span><Text type="tertiary" size="small">{t('sharing.market.detail.createdAt')}</Text> {asset.createdAt}</span>
          <span><Text type="tertiary" size="small">{t('sharing.market.metric.reuseCount')}</Text> {reuseCount}</span>
          <span><Text type="tertiary" size="small">{t('sharing.market.metric.version')}</Text> {asset.currentVersion}</span>
          {isSkill && (
            <>
              <span><Text type="tertiary" size="small">{t('sharing.market.metric.callCount')}</Text> {asset.skill!.callCount}</span>
              <span><Text type="tertiary" size="small">{t('sharing.market.metric.successRate')}</Text> {asset.skill!.successRate}%</span>
              <span><Text type="tertiary" size="small">{t('sharing.market.metric.rating')}</Text> ★ {asset.skill!.rating}</span>
            </>
          )}
        </div>
        <div className="info-card-tags">
          {asset.tags.map((tag) => <Tag key={tag} size="small" color="grey" type="light">{tag}</Tag>)}
        </div>
      </div>

      <Tabs className="asset-detail-tabs" type="line">
        {isSkill && (
          <TabPane itemKey="params" tab={t('sharing.market.detail.tabs.params')}>
            {renderSkillParamsTab()}
          </TabPane>
        )}
        {isSkill && (
          <TabPane itemKey="exec" tab={t('sharing.market.detail.tabs.exec')}>
            {renderSkillExecTab()}
          </TabPane>
        )}
        {!isSkill && (
          <TabPane itemKey="content" tab={t('sharing.market.detail.tabs.content')}>
            {renderContentTab()}
          </TabPane>
        )}
        <TabPane itemKey="versions" tab={`${t('sharing.market.detail.tabs.versions')} (${asset.versions.length})`}>
          <Table
            size="small"
            pagination={false}
            dataSource={asset.versions}
            rowKey="id"
            columns={[
              { title: t('sharing.market.detail.col.version'), dataIndex: 'version', width: 120,
                render: (v: string, r) => <Space>{v}{r.isLatest && <Tag size="small" color="green">{t('sharing.market.detail.latest')}</Tag>}</Space> },
              { title: t('sharing.market.detail.col.changeLog'), dataIndex: 'changeLog' },
              { title: t('sharing.market.detail.col.author'), dataIndex: 'createdBy', width: 120 },
              { title: t('sharing.market.detail.col.date'), dataIndex: 'createdAt', width: 140 },
              { title: t('sharing.market.detail.col.action'), width: 80,
                render: (_, r) => <Button size="small" theme="borderless" type="primary" onClick={() => setPreviewVersion({ version: r.version, content: r.content })}>{t('sharing.market.detail.view')}</Button> },
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
                { title: t('sharing.market.detail.col.reuseType'), dataIndex: 'reuseType', width: 120,
                  render: (v: string) => v === 'DIRECT' ? <Tag size="small" color="blue">{t('sharing.market.detail.reuseDirect')}</Tag> : <Tag size="small" color="violet">{t('sharing.market.detail.reuseAdaptation')}</Tag> },
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
        footer={null}
        width={520}
      >
        <pre className="asset-detail-yaml">{previewVersion?.content}</pre>
      </Modal>
    </div>
  );
};

export default AssetDetail;
