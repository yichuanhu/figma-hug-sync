import { Card, Typography, Tag, Button, Dropdown } from '@douyinfe/semi-ui';
import { Repeat2, Check, MoreVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AssetTypeIcon from '../AssetTypeIcon';
import type { AssetCardProps } from './types';

import './index.less';

const { Text, Paragraph } = Typography;

const AssetCard = ({ asset, reuseState, reusedAt, isPublishedBy, onView, onReuse, onEditDisplay }: AssetCardProps) => {
  const { t } = useTranslation();
  const isSkill = asset.type === 'SKILL' && !!asset.skill;

  const title = asset.displayName || asset.name;
  const desc = asset.displayDesc || asset.description;
  const tagsToShow = (asset.categoryTags && asset.categoryTags.length > 0) ? asset.categoryTags : asset.tags;

  const stop = (e: React.MouseEvent) => e.stopPropagation();
  const handleClick = () => onView(asset.id);

  const renderReuseButton = () => {
    if (reuseState === 'hidden' || isPublishedBy) return null;
    if (reuseState === 'loading') {
      return (
        <Button theme="solid" type="primary" size="small" loading disabled onClick={stop}>
          {t('sharing.market.action.reusing')}
        </Button>
      );
    }
    if (reuseState === 'reused') {
      return (
        <div className="asset-card-reused" onClick={stop}>
          <Button theme="light" type="tertiary" size="small" disabled icon={<Check size={14} strokeWidth={2.5} />}>
            {t('sharing.market.action.reused')}
          </Button>
          {reusedAt && <Text size="small" type="tertiary" className="asset-card-reused-at">{reusedAt}</Text>}
        </div>
      );
    }
    return (
      <Button
        theme="solid"
        type="primary"
        size="small"
        icon={<Repeat2 size={14} strokeWidth={2} />}
        onClick={(e) => { stop(e); onReuse(asset.id); }}
      >
        {t('sharing.market.action.reuse')}
      </Button>
    );
  };

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
            <Text strong ellipsis={{ showTooltip: true }} className="asset-card-name">{title}</Text>
          </div>
          {reuseState === 'reused' && (
            <Tag size="small" color="green" type="light" className="asset-card-reused-badge">
              {t('sharing.market.badge.reused')}
            </Tag>
          )}
        </div>
        <Paragraph ellipsis={{ rows: 2 }} type="tertiary" size="small" className="asset-card-desc">
          {desc}
        </Paragraph>
        <div className="asset-card-tags">
          {tagsToShow.slice(0, 3).map((tag) => (
            <Tag key={tag} size="small" color="grey" type="light">{tag}</Tag>
          ))}
        </div>
        <div className="asset-card-meta">
          {isSkill ? (
            <>
              <span><Text size="small" type="tertiary">{t('sharing.market.metric.callCount')}</Text> <Text size="small">{asset.skill!.callCount}</Text></span>
              <span><Text size="small" type="tertiary">{t('sharing.market.metric.successRate')}</Text> <Text size="small">{asset.skill!.successRate}%</Text></span>
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
          <div className="asset-card-actions" onClick={stop}>
            {renderReuseButton()}
            {isPublishedBy && onEditDisplay && (
              <Dropdown
                trigger="click"
                position="bottomRight"
                render={
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => onEditDisplay(asset.id)}>
                      {t('sharing.market.action.editDisplay')}
                    </Dropdown.Item>
                  </Dropdown.Menu>
                }
              >
                <Button
                  theme="borderless"
                  type="tertiary"
                  size="small"
                  icon={<MoreVertical size={14} strokeWidth={2} />}
                />
              </Dropdown>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AssetCard;
