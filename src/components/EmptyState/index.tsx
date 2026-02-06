import { Empty, Button } from '@douyinfe/semi-ui';
import { IconRefresh, IconHomeStroked } from '@douyinfe/semi-icons';
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
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

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

/**
 * 预设操作类型
 * - retry: 重试按钮
 * - goHome: 返回首页按钮
 * - goBack: 返回上一页按钮
 */
export type EmptyStateAction = 'retry' | 'goHome' | 'goBack';

interface EmptyStateProps {
  /** 描述文字 */
  description: string;
  /** 插图大小 */
  size?: number;
  /** 自定义类名 */
  className?: string;
  /** 空状态变体类型 */
  variant?: EmptyStateVariant;
  /** 底部操作区域（自定义内容） */
  footer?: React.ReactNode;
  /** 预设操作按钮 */
  actions?: EmptyStateAction[];
  /** 重试回调函数 */
  onRetry?: () => void;
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
 * 使用黄色系配色（背景色 #FFE600，图标灰色 #515151）
 * 
 * @example
 * // 默认无数据状态
 * <EmptyState description="暂无数据" />
 * 
 * // 搜索无结果
 * <EmptyState variant="noResult" description="未找到相关结果" />
 * 
 * // 加载失败带重试按钮
 * <EmptyState 
 *   variant="error" 
 *   description="加载失败，请重试" 
 *   actions={['retry']} 
 *   onRetry={() => refetch()} 
 * />
 * 
 * // 404页面带返回首页按钮
 * <EmptyState 
 *   variant="notFound" 
 *   description="页面不存在" 
 *   actions={['goHome', 'goBack']} 
 * />
 * 
 * // 自定义底部操作
 * <EmptyState 
 *   variant="noData" 
 *   description="暂无数据" 
 *   footer={<Button onClick={handleCreate}>创建第一条数据</Button>} 
 * />
 */
const EmptyState = ({ 
  description, 
  size = 150, 
  className, 
  variant = 'noData',
  footer,
  actions,
  onRetry,
}: EmptyStateProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { light: LightIllustration, dark: DarkIllustration } = getIllustrations(variant);

  // 自定义颜色变量，用于覆盖 Semi UI 默认的蓝色
  const illustrationStyle = {
    width: size, 
    height: size,
    '--semi-color-primary': '#515151',
    '--semi-color-primary-light-default': '#FFE600',
    '--semi-color-primary-light-hover': '#FFE600',
  } as React.CSSProperties;

  /**
   * 渲染预设操作按钮
   */
  const renderActions = () => {
    if (!actions || actions.length === 0) return null;

    return (
      <div className="empty-state-actions">
        {actions.map((action) => {
          switch (action) {
            case 'retry':
              return (
                <Button
                  key="retry"
                  theme="solid"
                  type="primary"
                  icon={<IconRefresh />}
                  onClick={onRetry}
                >
                  {t('emptyState.retry')}
                </Button>
              );
            case 'goHome':
              return (
                <Button
                  key="goHome"
                  theme="light"
                  type="primary"
                  icon={<IconHomeStroked />}
                  onClick={() => navigate('/')}
                >
                  {t('emptyState.goHome')}
                </Button>
              );
            case 'goBack':
              return (
                <Button
                  key="goBack"
                  theme="borderless"
                  type="tertiary"
                  onClick={() => navigate(-1)}
                >
                  {t('emptyState.goBack')}
                </Button>
              );
            default:
              return null;
          }
        })}
      </div>
    );
  };

  return (
    <Empty
      className={className}
      image={
        <LightIllustration
          className="empty-state-illustration"
          style={illustrationStyle}
        />
      }
      darkModeImage={
        <DarkIllustration
          className="empty-state-illustration"
          style={illustrationStyle}
        />
      }
      description={description}
    >
      {footer || renderActions()}
    </Empty>
  );
};

export default EmptyState;
