import { useNavigate } from 'react-router-dom';
import { Card, Typography, Tag, Button, Tooltip, Banner } from '@douyinfe/semi-ui';
import { MoreVertical, Send, Eye, Pencil, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import StatusTag from '@/components/sharing/StatusTag';
import AssetTypeIcon from '@/pages/Sharing/Market/components/AssetTypeIcon';
import AssetActionsMenu from '../AssetActionsMenu';
import type { ShareAsset } from '@/pages/SharingCenter/MyShared/store';
import { canPushNotification } from '@/pages/SharingCenter/MyShared/store';

import './index.less';

const { Text, Paragraph } = Typography;

interface Props {
  asset: ShareAsset;
  onView: (id: string) => void;
  onPush: (asset: ShareAsset) => void;
  highlighted?: boolean;
}

const SupplyAssetCard = ({ asset, onView, onPush, highlighted }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const typeRoute: Record<string, string> = { SNIPPET: 'snippet', WORKFLOW: 'workflow', KNOWLEDGE: 'knowledge', SKILL: 'skill' };
  const isRejected = asset.shareStatus === 'REJECTED';
  const isNative = asset.source === 'NATIVE';

  const title = asset.displayName || asset.name;
  const desc = asset.displayDesc || asset.description;
  const tagsToShow = (asset.categoryTags && asset.categoryTags.length > 0) ? asset.categoryTags : asset.tags;
  const stop = (e: React.MouseEvent) => e.stopPropagation();
  const handleClick = () => onView(asset.id);

  const showPush = asset.shareStatus === 'PUBLISHED';
  const pushCheck = showPush ? canPushNotification(asset.id, asset.currentVersionId) : null;
  const pushDisabled = pushCheck && pushCheck.ok === false;

  const lastReuse = asset.reuseRecords?.[0];
  const reuseSummary = (asset.reuseCount ?? 0) > 0
    ? t('sharing.myShared.card.reuseSummary', { count: asset.reuseCount })
    : t('sharing.myShared.card.noReuse');

  return (
    <div
      className={`supply-asset-card-wrapper${highlighted ? ' is-highlighted' : ''}`}
      onClick={handleClick}
    >
      <Card className="supply-asset-card" bodyStyle={{ padding: 16 }}>
        <div className="card-status">
          <StatusTag status={asset.shareStatus} />
        </div>
        <div className="card-head">
          <AssetTypeIcon type={asset.type} />
          <div className="card-title">
            <Text strong ellipsis={{ showTooltip: true }}>{title}</Text>
            <Text size="small" type="tertiary">{asset.currentVersion}</Text>
          </div>
        </div>
        <Paragraph ellipsis={{ rows: 2 }} type="tertiary" size="small" className="card-desc">
          {desc}
        </Paragraph>
        <div className="card-tags">
          {tagsToShow.slice(0, 3).map((tag) => (
            <Tag key={tag} size="small" color="grey" type="light">{tag}</Tag>
          ))}
        </div>
        {isRejected && asset.rejectedReason ? (
          <Banner
            type="danger"
            fullMode={false}
            closeIcon={null}
            description={
              <Text size="small">
                <Text strong size="small">{t('sharing.myShared.rejected.reasonLabel', '拒绝原因')}：</Text>
                {asset.rejectedReason}
              </Text>
            }
            style={{ marginBottom: 10 }}
          />
        ) : (
          <div className="card-reuse">
            <Text size="small" type="tertiary">{reuseSummary}</Text>
            {lastReuse && (
              <Text size="small" type="tertiary" ellipsis={{ showTooltip: true }}>
                {t('sharing.myShared.card.lastReuser', { name: lastReuse.reuserName, date: lastReuse.reusedAt })}
              </Text>
            )}
          </div>
        )}
        <div className="card-footer" onClick={stop}>
          <Text size="small" type="tertiary" ellipsis={{ showTooltip: true }} className="card-creator">
            {asset.creatorName} · {asset.departmentName}
          </Text>
          <div className="card-actions">
            <Button size="small" theme="borderless" type="primary"
              icon={<Eye size={14} strokeWidth={2} />}
              onClick={() => onView(asset.id)}
            >
              {t('sharing.myShared.actions.view')}
            </Button>
            {isRejected && isNative && (
              <Button
                size="small" theme="borderless" type="primary"
                icon={<Pencil size={14} strokeWidth={2} />}
                onClick={() => navigate(`/sharing-center/my-shared/edit/${asset.id}`)}
              >
                {t('sharing.myShared.actions.resubmit')}
              </Button>
            )}
            {isRejected && !isNative && asset.originUrl && (
              <Button
                size="small" theme="borderless" type="primary"
                icon={<ExternalLink size={14} strokeWidth={2} />}
                onClick={() => window.open(asset.originUrl, '_blank')}
              >
                {t('sharing.myShared.actions.backToDevCenter')}
              </Button>
            )}
            {showPush && (
              <Tooltip
                content={pushDisabled
                  ? t('sharing.myShared.toast.pushDuplicated', { hours: pushCheck?.ok === false ? pushCheck.retryAfterHours : 0 })
                  : t('sharing.myShared.actions.pushNotification')}
              >
                <Button
                  size="small"
                  theme="borderless"
                  type={pushDisabled ? 'tertiary' : 'primary'}
                  icon={<Send size={14} strokeWidth={2} />}
                  disabled={!!pushDisabled}
                  onClick={() => onPush(asset)}
                >
                  {t('sharing.myShared.actions.pushNotification')}
                </Button>
              </Tooltip>
            )}
            <AssetActionsMenu
              asset={asset}
              onPush={onPush}
              trigger={
                <Button size="small" theme="borderless" type="tertiary" icon={<MoreVertical size={14} strokeWidth={2} />} />
              }
            />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SupplyAssetCard;
