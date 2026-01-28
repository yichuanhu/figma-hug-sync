import { Empty } from '@douyinfe/semi-ui';
import {
  IllustrationNoContent,
  IllustrationNoContentDark,
  IllustrationNoResult,
  IllustrationNoResultDark,
  IllustrationFailure,
  IllustrationFailureDark,
  IllustrationNoAccess,
  IllustrationNoAccessDark,
  IllustrationConstruction,
  IllustrationConstructionDark,
  IllustrationNotFound,
  IllustrationNotFoundDark,
} from '@douyinfe/semi-illustrations';

import './index.less';

/**
 * 空状态变体类型
 * - noData: 无数据（默认）
 * - noResult: 搜索无结果
 * - error: 加载失败/网络错误
 * - noAccess: 无权限访问
 * - maintenance: 功能维护中
 * - notFound: 页面/资源未找到
 */
export type EmptyStateVariant = 'noData' | 'noResult' | 'error' | 'noAccess' | 'maintenance' | 'notFound';

interface EmptyStateProps {
  /** 描述文字 */
  description: string;
  /** 插图大小 */
  size?: number;
  /** 自定义类名 */
  className?: string;
  /** 空状态变体类型 */
  variant?: EmptyStateVariant;
  /** 底部操作区域 */
  footer?: React.ReactNode;
}

/**
 * 获取对应变体的插图组件
 */
const getIllustrations = (variant: EmptyStateVariant) => {
  switch (variant) {
    case 'noResult':
      return {
        light: IllustrationNoResult,
        dark: IllustrationNoResultDark,
      };
    case 'error':
      return {
        light: IllustrationFailure,
        dark: IllustrationFailureDark,
      };
    case 'noAccess':
      return {
        light: IllustrationNoAccess,
        dark: IllustrationNoAccessDark,
      };
    case 'maintenance':
      return {
        light: IllustrationConstruction,
        dark: IllustrationConstructionDark,
      };
    case 'notFound':
      return {
        light: IllustrationNotFound,
        dark: IllustrationNotFoundDark,
      };
    case 'noData':
    default:
      return {
        light: IllustrationNoContent,
        dark: IllustrationNoContentDark,
      };
  }
};

/**
 * 统一的空状态组件
 * 使用黄色系配色（背景色 #FFE600，图标黑灰色）
 * 
 * @example
 * // 默认无数据状态
 * <EmptyState description="暂无数据" />
 * 
 * // 搜索无结果
 * <EmptyState variant="noResult" description="未找到相关结果" />
 * 
 * // 加载失败
 * <EmptyState variant="error" description="加载失败，请重试" />
 * 
 * // 无权限
 * <EmptyState variant="noAccess" description="暂无访问权限" />
 * 
 * // 维护中
 * <EmptyState variant="maintenance" description="功能维护中" />
 * 
 * // 404未找到
 * <EmptyState variant="notFound" description="页面不存在" />
 */
const EmptyState = ({ 
  description, 
  size = 150, 
  className, 
  variant = 'noData',
  footer,
}: EmptyStateProps) => {
  const { light: LightIllustration, dark: DarkIllustration } = getIllustrations(variant);

  return (
    <Empty
      className={className}
      image={
        <LightIllustration
          className="empty-state-illustration"
          style={{ width: size, height: size }}
        />
      }
      darkModeImage={
        <DarkIllustration
          className="empty-state-illustration"
          style={{ width: size, height: size }}
        />
      }
      description={description}
    >
      {footer}
    </Empty>
  );
};

export default EmptyState;
