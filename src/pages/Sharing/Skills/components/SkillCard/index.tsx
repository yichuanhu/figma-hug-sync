import { Card, Tag, Typography, Space, Avatar } from '@douyinfe/semi-ui';
import { IconStarStroked } from '@douyinfe/semi-icons';
import { Download } from 'lucide-react';
import { getAvatarColor } from '@/utils/avatarColor';
import './index.less';

const { Text, Paragraph } = Typography;

export interface VersionRecord {
  version: string;
  releaseDate: string;
  changelog: string;
  author: string;
}

export interface SkillItem {
  id: string;
  name: string;
  description: string;
  tags: string[];
  author: string;
  version: string;
  downloads: number;
  rating: number;
  updatedAt: string;
  createdAt?: string;
  category: string;
  status?: string;
  dependencies?: string[];
  versionHistory?: VersionRecord[];
}

interface SkillCardProps {
  item: SkillItem;
  onClick?: (item: SkillItem) => void;
}

const SkillCard = ({ item, onClick }: SkillCardProps) => {
  return (
    <div className="skill-card-wrapper" onClick={() => onClick?.(item)}>
      <Card className="skill-card">
        <div className="skill-card-body">
          <div className="skill-card-header">
            <Avatar size="small" shape="circle" color={getAvatarColor(item.name)}>
              {item.name.charAt(0)}
            </Avatar>
            <div className="skill-card-title-area">
              <Text strong ellipsis={{ showTooltip: true }} className="skill-card-name">
                {item.name}
              </Text>
              <Text type="tertiary" size="small">v{item.version}</Text>
            </div>
          </div>
          <Paragraph ellipsis={{ rows: 2 }} type="tertiary" size="small" className="skill-card-desc">
            {item.description}
          </Paragraph>
          <div className="skill-card-tags">
            {item.tags.slice(0, 3).map((tag) => (
              <Tag key={tag} size="small" color="green" type="light">{tag}</Tag>
            ))}
          </div>
          <div className="skill-card-footer">
            <Space spacing={12}>
              <span className="skill-card-stat">
                <Download size={14} strokeWidth={2} />
                <Text size="small" type="tertiary">{item.downloads.toLocaleString()}</Text>
              </span>
              <span className="skill-card-stat">
                <IconStarStroked size="small" style={{ color: 'var(--semi-color-warning)' }} />
                <Text size="small" type="tertiary">{item.rating}</Text>
              </span>
            </Space>
            <Text size="small" type="tertiary">{item.author}</Text>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SkillCard;
