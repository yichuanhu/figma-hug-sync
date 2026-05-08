import { useNavigate, useParams } from 'react-router-dom';
import { Typography, Button, Tag, Empty, Avatar } from '@douyinfe/semi-ui';
import { IconChevronLeft, IconExternalOpen } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';
import { findAsset, getVersions } from '@/pages/SharingCenter/MyShared/store';
import './index.less';

const { Title, Text } = Typography;

const VersionsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const asset = findAsset(id);
  const versions = getVersions(id);

  if (!asset) return <Empty title="资产不存在" style={{ padding: 64 }} />;

  const isDev = asset.source === 'DEV_CENTER';

  return (
    <div className="versions-page">
      <div className="versions-header">
        <Button icon={<IconChevronLeft />} theme="borderless" onClick={() => navigate(-1)} />
        <Title heading={3} style={{ margin: 0, flex: 1 }}>
          {asset.name} · {t('sharing.myShared.version.title')}
        </Title>
        {isDev && asset.originUrl && (
          <Button icon={<IconExternalOpen />} theme="light" type="primary"
            onClick={() => window.open(asset.originUrl, '_blank')}>
            {t('sharing.myShared.version.openInDevCenter')}
          </Button>
        )}
      </div>
      <div className="versions-body">
        {versions.map((v) => (
          <div key={v.id} className="version-row">
            <div className="version-main">
              <Text strong className="version-num">{v.version}</Text>
              {v.isLatest && <Tag size="small" color="green" type="solid">{t('sharing.myShared.version.latest')}</Tag>}
              {isDev && <Tag size="small" color="cyan" type="light">{t('sharing.myShared.version.snapshot')}</Tag>}
            </div>
            {!isDev && (
              <Text type="secondary" className="version-log">
                {v.changeLog || t('sharing.myShared.version.noChangeLog')}
              </Text>
            )}
            <div className="version-meta">
              <Avatar size="extra-small" style={{ background: '#000', color: '#fff' }}>{v.createdBy.slice(0, 1)}</Avatar>
              <Text size="small" type="tertiary">{v.createdBy} · {v.createdAt}</Text>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VersionsPage;
