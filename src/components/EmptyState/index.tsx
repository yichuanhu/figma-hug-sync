import { Empty } from '@douyinfe/semi-ui';
import { IllustrationNoContent, IllustrationNoContentDark } from '@douyinfe/semi-illustrations';

import './index.less';

interface EmptyStateProps {
  description: string;
  size?: number;
  className?: string;
}

/**
 * 统一的空状态组件
 * 使用黄色系配色（背景色 #FFE600，图标黑灰色）
 */
const EmptyState = ({ description, size = 150, className }: EmptyStateProps) => {
  return (
    <Empty
      className={className}
      image={
        <IllustrationNoContent
          className="empty-state-illustration"
          style={{ width: size, height: size }}
        />
      }
      darkModeImage={
        <IllustrationNoContentDark
          className="empty-state-illustration"
          style={{ width: size, height: size }}
        />
      }
      description={description}
    />
  );
};

export default EmptyState;
