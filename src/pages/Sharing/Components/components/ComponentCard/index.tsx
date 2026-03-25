import { Card, Tag, Typography, Space, Avatar } from '@douyinfe/semi-ui';
import { IconStarStroked } from '@douyinfe/semi-icons';
import { Download } from 'lucide-react';
import { ComponentItem } from '../../CreatorComponents/types';
import { getAvatarColor } from '@/utils/avatarColor';
import './index.less';

const { Text, Paragraph } = Typography;

interface ComponentCardProps {
  item: ComponentItem;
  onClick?: (item: ComponentItem) => void;
}

const ComponentCard = ({ item, onClick }: ComponentCardProps) => {
  return (
    <div onClick={() => onClick?.(item)}>
    <Card className="component-card">
      <div className="component-card-header">
        <Avatar size="small" shape="circle" color={getAvatarColor(item.name)}>
          {item.name.charAt(0)}
        </Avatar>
        <div className="component-card-title-area">
          <Text strong ellipsis={{ showTooltip: true }} className="component-card-name">
            {item.name}
          </Text>
          <Text type="tertiary" size="small">v{item.version}</Text>
        </div>
      </div>
      <Paragraph ellipsis={{ rows: 2 }} type="tertiary" size="small" className="component-card-desc">
        {item.description}
      </Paragraph>
      <div className="component-card-tags">
        {item.tags.slice(0, 3).map((tag) => (
          <Tag key={tag} size="small" color="blue" type="light">{tag}</Tag>
        ))}
      </div>
      <div className="component-card-footer">
        <Space spacing={12}>
          <span className="component-card-stat">
            <Download size={14} strokeWidth={2} />
            <Text size="small" type="tertiary">{item.downloads.toLocaleString()}</Text>
          </span>
          <span className="component-card-stat">
            <IconStarStroked size="small" style={{ color: 'var(--semi-color-warning)' }} />
            <Text size="small" type="tertiary">{item.rating}</Text>
          </span>
        </Space>
        <Text size="small" type="tertiary">{item.author}</Text>
      </div>
    </Card>
    </div>
  );
};

export default ComponentCard;
