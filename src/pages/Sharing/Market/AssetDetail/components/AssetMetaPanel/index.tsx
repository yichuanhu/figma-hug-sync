import { Collapse, Space, Tag, Typography } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import type { Asset } from '../../../types';
import './index.less';

const { Text } = Typography;

interface Props {
  asset: Asset;
}

/**
 * 资产元信息折叠面板（统一复用组件）
 *
 * 严格遵循两层模型：仅承载「资产元信息层」中创建表单实际采集的原始字段，
 * 与 Hero 区的「展示信息层」字段（displayName/displayDesc/categoryTags）相互独立。
 *
 * - 通用项：名称 / 描述 / 归属部门
 * - WORKFLOW：+ 流程版本 / 资源依赖
 * - KNOWLEDGE：+ 附件 / 内容（轻量摘要，避免与 overview 重复）
 *
 * 不展示 tags / knowledgeType —— 当前创建表单未采集，避免伪信息。
 */
const AssetMetaPanel = ({ asset }: Props) => {
  const { t } = useTranslation();

  const metaItems: Array<{ label: string; value: React.ReactNode }> = [
    { label: t('sharing.market.detail.meta.name'), value: asset.name },
    { label: t('sharing.market.detail.meta.description'), value: asset.description || '—' },
    { label: t('sharing.market.detail.meta.department'), value: asset.departmentName || '—' },
  ];

  // ===== 类型差异项 =====
  if (asset.type === 'WORKFLOW') {
    metaItems.push({
      label: t('sharing.market.detail.meta.processVersion'),
      value: asset.currentVersion || '—',
    });
    metaItems.push({
      label: t('sharing.market.detail.meta.resourceDeps'),
      value: asset.resourceDeps && asset.resourceDeps.length > 0
        ? <Space wrap spacing={4}>{asset.resourceDeps.map((d) => <Tag key={d} size="small" color="grey" type="light">{d}</Tag>)}</Space>
        : '—',
    });
  }
  if (asset.type === 'KNOWLEDGE' && asset.knowledge) {
    const atts = asset.knowledge.attachments ?? [];
    metaItems.push({
      label: t('sharing.market.detail.meta.attachments'),
      value: atts.length > 0
        ? (
          <Space vertical align="start" spacing={2}>
            {atts.map((a) => (
              <Text key={a.name} size="small">{a.name}<Text type="tertiary" size="small"> · {a.size}</Text></Text>
            ))}
          </Space>
        )
        : '—',
    });
    const plain = (asset.knowledge.contentHtml || '').replace(/<[^>]+>/g, '').trim();
    metaItems.push({
      label: t('sharing.market.detail.meta.content'),
      value: plain.length > 0
        ? t('sharing.market.detail.meta.contentFilled', { count: plain.length })
        : t('sharing.market.detail.meta.contentEmpty'),
    });
  }

  return (
    <Collapse className="asset-meta-panel" expandIconPosition="right">
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
      </Collapse.Panel>
    </Collapse>
  );
};

export default AssetMetaPanel;
