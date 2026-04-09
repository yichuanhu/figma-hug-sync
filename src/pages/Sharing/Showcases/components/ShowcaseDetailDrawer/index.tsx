import { useTranslation } from 'react-i18next';
import { Descriptions, Tag, Typography, Timeline, Avatar, Space } from '@douyinfe/semi-ui';
import { Eye, Star } from 'lucide-react';
import DetailDrawerWrapper from '@/components/DetailDrawerWrapper';
import './index.less';

const { Text, Paragraph } = Typography;

export interface VersionRecord {
  version: string;
  releaseDate: string;
  author: string;
  changelog: string;
}

export interface ShowcaseItem {
  id: string;
  name: string;
  description: string;
  tags: string[];
  author: string;
  department: string;
  views: number;
  rating: number;
  updatedAt: string;
  createdAt?: string;
  coverColor: string;
  status?: string;
  highlights?: string[];
  technologies?: string[];
  versionHistory?: VersionRecord[];
}

interface ShowcaseDetailDrawerProps {
  visible: boolean;
  onClose: () => void;
  item: ShowcaseItem | null;
  dataList: ShowcaseItem[];
  onNavigate: (item: ShowcaseItem) => void;
}

const ShowcaseDetailDrawer = ({ visible, onClose, item, dataList, onNavigate }: ShowcaseDetailDrawerProps) => {
  const { t } = useTranslation();

  if (!item) return null;

  const statusColorMap: Record<string, string> = {
    published: 'green',
    draft: 'grey',
    archived: 'red',
  };

  return (
    <DetailDrawerWrapper
      visible={visible}
      onClose={onClose}
      title={item.name}
      dataList={dataList}
      currentId={item.id}
      onNavigate={onNavigate}
      showNavigation={true}
      defaultWidth={900}
      storageKey="showcaseDetailDrawerWidth"
    >
      <div className="showcase-detail-content">
        {/* Header */}
        <div className="showcase-detail-section">
          <div className="showcase-detail-section-header">
            <Avatar size="default" shape="circle" style={{ backgroundColor: item.coverColor }}>
              {item.name.charAt(0)}
            </Avatar>
            <div className="showcase-detail-title-area">
              <Text strong style={{ fontSize: 16 }}>{item.name}</Text>
              <Space spacing={8}>
                {item.status && (
                  <Tag size="small" color={statusColorMap[item.status] as any}>
                    {t(`sharing.detail.status.${item.status}`)}
                  </Tag>
                )}
                <Tag size="small" color="cyan" type="light">{item.department}</Tag>
              </Space>
            </div>
          </div>
          <Paragraph type="tertiary" style={{ marginTop: 12 }}>
            {item.description}
          </Paragraph>
        </div>

        {/* Basic Info */}
        <div className="showcase-detail-section">
          <Text strong className="showcase-detail-section-title">{t('sharing.detail.basicInfo')}</Text>
          <Descriptions
            align="left"
            data={[
              { key: t('sharing.detail.author'), value: item.author },
              { key: t('sharing.showcases.department'), value: item.department },
              { key: t('sharing.showcases.views'), value: (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Eye size={14} strokeWidth={2} />
                  {item.views.toLocaleString()}
                </span>
              )},
              { key: t('sharing.detail.rating'), value: (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Star size={16} strokeWidth={2} />
                  {item.rating}
                </span>
              )},
              { key: t('common.updateTime'), value: item.updatedAt },
              { key: t('common.createTime'), value: item.createdAt || '-' },
            ]}
          />
        </div>

        {/* Tags */}
        <div className="showcase-detail-section">
          <Text strong className="showcase-detail-section-title">{t('sharing.detail.tags')}</Text>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {item.tags.map((tag) => (
              <Tag key={tag} color="violet" type="light">{tag}</Tag>
            ))}
          </div>
        </div>

        {/* Technologies */}
        {item.technologies && item.technologies.length > 0 && (
          <div className="showcase-detail-section">
            <Text strong className="showcase-detail-section-title">{t('sharing.showcases.technologies')}</Text>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {item.technologies.map((tech) => (
                <Tag key={tech} color="blue" type="light">{tech}</Tag>
              ))}
            </div>
          </div>
        )}

        {/* Highlights */}
        {item.highlights && item.highlights.length > 0 && (
          <div className="showcase-detail-section">
            <Text strong className="showcase-detail-section-title">{t('sharing.showcases.highlights')}</Text>
            <ul className="showcase-detail-highlights">
              {item.highlights.map((h, i) => (
                <li key={i}><Text size="small">{h}</Text></li>
              ))}
            </ul>
          </div>
        )}

        {/* Version History */}
        {item.versionHistory && item.versionHistory.length > 0 && (
          <div className="showcase-detail-section">
            <Text strong className="showcase-detail-section-title">{t('sharing.detail.versionHistory')}</Text>
            <Timeline>
              {item.versionHistory.map((v) => (
                <Timeline.Item key={v.version} time={v.releaseDate}>
                  <div className="showcase-detail-version-item">
                    <Space spacing={8}>
                      <Tag size="small" color="green">v{v.version}</Tag>
                      <Text size="small" type="tertiary">{v.author}</Text>
                    </Space>
                    <Text size="small" style={{ marginTop: 4, display: 'block' }}>
                      {v.changelog}
                    </Text>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </div>
        )}
      </div>
    </DetailDrawerWrapper>
  );
};

export default ShowcaseDetailDrawer;
