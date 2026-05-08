import { Card, Typography, Tag, Button, Space, Toast } from '@douyinfe/semi-ui';
import { Star, Repeat2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Asset } from '../../types';
import { useCollections } from '../../hooks/useCollections';
import AssetTypeIcon from '../AssetTypeIcon';
import SourceBadge from '../SourceBadge';
import './index.less';

const { Text, Paragraph } = Typography;

interface Props {
  asset: Asset;
  onReused?: (id: string) => void;
}

const typeRoute: Record<string, string> = {
  SNIPPET: 'snippet',
  WORKFLOW: 'workflow',
  KNOWLEDGE: 'knowledge',
  SKILL: 'skill',
};

const AssetCard = ({ asset, onReused }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isCollected, toggle } = useCollections();
  const collected = isCollected(asset.id);

  const handleClick = () => navigate(`/sharing/market/${typeRoute[asset.type]}/${asset.id}`);
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const handleCollect = (e: React.MouseEvent) => {
    stop(e);
    toggle(asset.id);
    Toast.success(collected ? t('sharing.market.toast.uncollected') : t('sharing.market.toast.collected'));
  };
  const handleReuse = (e: React.MouseEvent) => {
    stop(e);
    Toast.success(t('sharing.market.toast.reuseSuccess'));
    onReused?.(asset.id);
  };

  const isSkill = asset.type === 'SKILL' && asset.skill;

  return (
    <div className="asset-card-wrapper" onClick={handleClick}>
    <Card className="asset-card" bodyStyle={{ padding: 16 }}>
      <div className="asset-card-head">
        <AssetTypeIcon type={asset.type} />
        <div className="asset-card-title">
          <Text strong ellipsis={{ showTooltip: true }} className="asset-card-name">
            {asset.name}
          </Text>
        </div>
      </div>
      <Paragraph ellipsis={{ rows: 2 }} type="tertiary" size="small" className="asset-card-desc">
        {asset.description}
      </Paragraph>
      <div className="asset-card-tags">
        {asset.tags.slice(0, 3).map((tag) => (
          <Tag key={tag} size="small" color="grey" type="light">{tag}</Tag>
        ))}
      </div>
      <div className="asset-card-meta">
        {isSkill ? (
          <>
            <span><Text size="small" type="tertiary">{t('sharing.market.metric.callCount')}</Text> <Text size="small">{asset.skill!.callCount}</Text></span>
            <span><Text size="small" type="tertiary">{t('sharing.market.metric.successRate')}</Text> <Text size="small">{asset.skill!.successRate}%</Text></span>
            <span><Text size="small" type="tertiary">{t('sharing.market.metric.rating')}</Text> <Text size="small">★ {asset.skill!.rating}</Text></span>
          </>
        ) : (
          <>
            <span><Text size="small" type="tertiary">{t('sharing.market.metric.reuseCount')}</Text> <Text size="small">{asset.reuseCount}</Text></span>
            <span><Text size="small" type="tertiary">{t('sharing.market.metric.version')}</Text> <Text size="small">{asset.currentVersion}</Text></span>
          </>
        )}
      </div>
      <div className="asset-card-footer">
        <Text size="small" type="tertiary" ellipsis={{ showTooltip: true }} className="asset-card-creator">
          {asset.creatorName} · {asset.departmentName}
        </Text>
        <Space spacing={4}>
          <Button
            theme="borderless"
            type="tertiary"
            size="small"
            icon={<Star size={14} strokeWidth={2} fill={collected ? 'currentColor' : 'none'} />}
            onClick={handleCollect}
          />
          <Button
            theme="light"
            type="primary"
            size="small"
            icon={<Repeat2 size={14} strokeWidth={2} />}
            onClick={handleReuse}
          >
            {t('sharing.market.action.reuse')}
          </Button>
        </Space>
      </div>
    </Card>
    </div>
  );
};

export default AssetCard;
