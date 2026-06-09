import { Card, Typography, Tag, Tooltip } from '@douyinfe/semi-ui';
import { Repeat2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AssetTypeIcon from '../AssetTypeIcon';
import AssetIdentity from '../AssetIdentity';
import type { AssetCardProps } from './types';

import './index.less';

const { Paragraph } = Typography;

const AssetCard = ({ asset, onView }: AssetCardProps) => {
  const { t } = useTranslation();

  const title = asset.displayName || asset.name;
  const desc = asset.displayDesc || asset.description;
  const tagsToShow = (asset.categoryTags && asset.categoryTags.length > 0) ? asset.categoryTags : asset.tags;
  const reuseCount = asset.reuseCount ?? 0;

  const handleClick = () => onView(asset.id);

  return (
    <div className="asset-card-wrapper" onClick={handleClick}>
      <Card className="asset-card" bodyStyle={{ padding: 16 }}>
        {asset.coverImage && (
          <div className="asset-card-cover">
            <img src={asset.coverImage} alt={title} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
        )}
        <div className="asset-card-head">
          <AssetTypeIcon type={asset.type} />
          <div className="asset-card-title">
            <AssetIdentity asset={asset} size="md" ellipsis />
          </div>
        </div>
        <Paragraph ellipsis={{ rows: 2 }} type="tertiary" size="small" className="asset-card-desc">
          {desc}
        </Paragraph>
        <div className="asset-card-tags">
          {tagsToShow.slice(0, 3).map((tag) => (
            <Tag key={tag} size="small" color="grey" type="light">{tag}</Tag>
          ))}
        </div>
        {reuseCount > 0 && (
          <Tooltip
            content={t('sharing.market.metric.usageCountTooltip', { count: reuseCount })}
            position="top"
            mouseEnterDelay={100}
            mouseLeaveDelay={100}
          >
            <div
              className="asset-card-stat"
              onClick={(e) => e.stopPropagation()}
              role="button"
              tabIndex={0}
              aria-label={t('sharing.market.metric.usageCountTooltip', { count: reuseCount })}
            >
              <Repeat2 size={14} strokeWidth={2} />
              <span>{reuseCount}</span>
            </div>
          </Tooltip>
        )}
      </Card>
    </div>
  );
};

export default AssetCard;
