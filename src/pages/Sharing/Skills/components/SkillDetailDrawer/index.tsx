import { useTranslation } from 'react-i18next';
import { Descriptions, Tag, Typography, Timeline, Avatar, Space } from '@douyinfe/semi-ui';
import { IconStarStroked } from '@douyinfe/semi-icons';
import { Download } from 'lucide-react';
import { SkillItem } from '../SkillCard';
import DetailDrawerWrapper from '@/components/DetailDrawerWrapper';
import { getAvatarColor } from '@/utils/avatarColor';
import './index.less';

const { Text, Paragraph } = Typography;

interface SkillDetailDrawerProps {
  visible: boolean;
  onClose: () => void;
  item: SkillItem | null;
  dataList: SkillItem[];
  onNavigate: (item: SkillItem) => void;
}

const SkillDetailDrawer = ({ visible, onClose, item, dataList, onNavigate }: SkillDetailDrawerProps) => {
  const { t } = useTranslation();

  if (!item) return null;

  const statusColorMap: Record<string, string> = {
    published: 'green',
    draft: 'grey',
    deprecated: 'red',
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
      storageKey="skillDetailDrawerWidth"
    >
      <div className="skill-detail-content">
        {/* Header */}
        <div className="skill-detail-section">
          <div className="skill-detail-section-header">
            <Avatar size="default" shape="square" style={{ backgroundColor: 'var(--semi-color-primary)' }}>
              {item.name.charAt(0)}
            </Avatar>
            <div className="skill-detail-title-area">
              <Text strong style={{ fontSize: 16 }}>{item.name}</Text>
              <Space spacing={8}>
                {item.status && (
                  <Tag size="small" color={statusColorMap[item.status] as any}>
                    {t(`sharing.detail.status.${item.status}`)}
                  </Tag>
                )}
                <Tag size="small" color="cyan" type="light">{item.category}</Tag>
              </Space>
            </div>
          </div>
          <Paragraph type="tertiary" style={{ marginTop: 12 }}>
            {item.description}
          </Paragraph>
        </div>

        {/* Basic Info */}
        <div className="skill-detail-section">
          <Text strong className="skill-detail-section-title">{t('sharing.detail.basicInfo')}</Text>
          <Descriptions
            align="left"
            data={[
              { key: t('sharing.detail.version'), value: `v${item.version}` },
              { key: t('sharing.detail.author'), value: item.author },
              { key: t('sharing.detail.downloads'), value: (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Download size={14} strokeWidth={2} />
                  {item.downloads.toLocaleString()}
                </span>
              )},
              { key: t('sharing.detail.rating'), value: (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <IconStarStroked size="small" style={{ color: 'var(--semi-color-warning)' }} />
                  {item.rating}
                </span>
              )},
              { key: t('common.updateTime'), value: item.updatedAt },
              { key: t('common.createTime'), value: item.createdAt || '-' },
            ]}
          />
        </div>

        {/* Tags */}
        <div className="skill-detail-section">
          <Text strong className="skill-detail-section-title">{t('sharing.detail.tags')}</Text>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {item.tags.map((tag) => (
              <Tag key={tag} color="green" type="light">{tag}</Tag>
            ))}
          </div>
        </div>

        {/* Dependencies */}
        {item.dependencies && item.dependencies.length > 0 && (
          <div className="skill-detail-section">
            <Text strong className="skill-detail-section-title">{t('sharing.detail.dependencies')}</Text>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {item.dependencies.map((dep) => (
                <Tag key={dep} color="violet" type="light">{dep}</Tag>
              ))}
            </div>
          </div>
        )}

        {/* Version History */}
        {item.versionHistory && item.versionHistory.length > 0 && (
          <div className="skill-detail-section">
            <Text strong className="skill-detail-section-title">{t('sharing.detail.versionHistory')}</Text>
            <Timeline>
              {item.versionHistory.map((v) => (
                <Timeline.Item key={v.version} time={v.releaseDate}>
                  <div className="skill-detail-version-item">
                    <Space spacing={8}>
                      <Tag size="small" color={v.version === item.version ? 'green' : 'grey'}>
                        v{v.version}
                      </Tag>
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

export default SkillDetailDrawer;
