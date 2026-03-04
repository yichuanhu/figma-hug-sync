import { useState, useRef, useCallback, useEffect, ReactNode, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SideSheet, Typography, Button, Divider, Tooltip, Row, Col, Space } from '@douyinfe/semi-ui';
import {
  IconMaximize,
  IconMinimize,
  IconClose,
  IconChevronLeft,
  IconChevronRight,
} from '@douyinfe/semi-icons';
import './index.less';

const { Title } = Typography;

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  total: number;
}

export interface DetailDrawerWrapperProps<T> {
  /** 是否显示抽屉 */
  visible: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 标题 */
  title: ReactNode;
  /** 子内容 */
  children: ReactNode;
  /** 额外的操作按钮（显示在导航和全屏之间） */
  extraActions?: ReactNode;
  /** 是否显示导航按钮，默认 true */
  showNavigation?: boolean;

  // ========== 导航相关 ==========
  /** 数据列表 */
  dataList: T[];
  /** 当前数据的 ID */
  currentId: string | undefined;
  /** 获取数据 ID 的方法，默认 (item) => item.id */
  getId?: (item: T) => string;
  /** 导航到某条数据 */
  onNavigate: (item: T) => void;
  /** 分页信息（用于跨页导航） */
  pagination?: PaginationInfo;
  /** 翻页回调 */
  onPageChange?: (page: number, direction: 'prev' | 'next') => void;
  /** 滚动到某行（可选） */
  onScrollToRow?: (id: string) => void;

  // ========== 样式相关 ==========
  /** 默认宽度 */
  defaultWidth?: number;
  /** 最小宽度 */
  minWidth?: number;
  /** localStorage 存储宽度的 key */
  storageKey?: string;
  /** 自定义类名 */
  className?: string;
}

/**
 * 通用详情抽屉包装组件
 *
 * 提供统一的详情抽屉功能：
 * - 上一个/下一个导航（内置导航逻辑）
 * - 全屏切换
 * - 拖拽调整宽度
 *
 * 翻页逻辑说明：
 * - 当前页内导航：直接调用 onNavigate
 * - 跨页导航：调用 onPageChange，由父组件处理翻页和数据更新，然后通过 useEffect 选中目标项
 */
function DetailDrawerWrapper<T>({
  visible,
  onClose,
  title,
  children,
  extraActions,
  showNavigation = true,
  dataList,
  currentId,
  getId,
  onNavigate,
  pagination,
  onPageChange,
  onScrollToRow,
  defaultWidth = 800,
  minWidth = 576,
  storageKey = 'detailDrawerWidth',
  className,
}: DetailDrawerWrapperProps<T>) {
  const { t } = useTranslation();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [drawerWidth, setDrawerWidth] = useState(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const width = parseInt(saved, 10);
        if (!isNaN(width) && width >= minWidth) {
          return width;
        }
      }
    }
    return defaultWidth;
  });

  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(drawerWidth);

  // 获取 ID 的方法
  const getItemId = useCallback(
    (item: T) => {
      if (getId) return getId(item);
      return (item as any)?.id;
    },
    [getId]
  );

  // 计算当前索引
  const currentIndex = useMemo(() => {
    if (!currentId || !dataList) return -1;
    return dataList.findIndex((item) => getItemId(item) === currentId);
  }, [currentId, dataList, getItemId]);

  // 计算全局索引
  const globalIndex = useMemo(() => {
    if (currentIndex < 0 || !pagination) return currentIndex;
    return (pagination.currentPage - 1) * pagination.pageSize + currentIndex;
  }, [currentIndex, pagination]);

  // 计算是否可以导航
  const canGoPrev = useMemo(() => {
    if (!showNavigation) return false;
    if (currentIndex > 0) return true;
    if (pagination && pagination.currentPage > 1) return true;
    return false;
  }, [showNavigation, currentIndex, pagination]);

  const canGoNext = useMemo(() => {
    if (!showNavigation) return false;
    if (currentIndex >= 0 && currentIndex < dataList.length - 1) return true;
    if (pagination && globalIndex < pagination.total - 1) return true;
    return false;
  }, [showNavigation, currentIndex, dataList, pagination, globalIndex]);

  // 导航处理
  const handleNavigate = useCallback(
    (direction: 'prev' | 'next') => {
      if (direction === 'prev') {
        if (currentIndex > 0) {
          const target = dataList[currentIndex - 1];
          onNavigate(target);
          onScrollToRow?.(getItemId(target));
        } else if (pagination && pagination.currentPage > 1 && onPageChange) {
          onPageChange(pagination.currentPage - 1, 'prev');
        }
      } else {
        if (currentIndex < dataList.length - 1) {
          const target = dataList[currentIndex + 1];
          onNavigate(target);
          onScrollToRow?.(getItemId(target));
        } else if (pagination && globalIndex < pagination.total - 1 && onPageChange) {
          onPageChange(pagination.currentPage + 1, 'next');
        }
      }
    },
    [currentIndex, dataList, pagination, globalIndex, onNavigate, onPageChange, onScrollToRow, getItemId]
  );

  // 切换全屏
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  // 拖拽调整宽度
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isResizing.current = true;
      startX.current = e.clientX;
      startWidth.current = drawerWidth;
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';

      const handleMouseMove = (e: MouseEvent) => {
        if (!isResizing.current) return;
        const diff = startX.current - e.clientX;
        setDrawerWidth(Math.min(Math.max(startWidth.current + diff, minWidth), window.innerWidth - 100));
      };

      const handleMouseUp = () => {
        isResizing.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [drawerWidth, minWidth]
  );

  // 保存宽度到 localStorage
  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, String(drawerWidth));
    }
  }, [drawerWidth, storageKey]);

  // 点击表格以外的内容区域关闭抽屉
  useEffect(() => {
    if (!visible) return;

    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // 点击在抽屉内部，不关闭
      if (target.closest('.detail-drawer-wrapper')) return;
      // 点击在表格内部（行点击切换内容），不关闭
      if (target.closest('.semi-table')) return;
      // 点击在模态框/弹出层内，不关闭
      if (target.closest('.semi-modal, .semi-modal-wrapper, .semi-modal-mask, .semi-portal, .semi-popover, .semi-dropdown, .semi-tooltip, .semi-overlay')) return;
      // 其他区域点击，关闭抽屉
      onClose();
    };

    // 使用 setTimeout 避免打开抽屉时的点击立即触发关闭
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleDocumentClick);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, [visible, onClose]);

  return (
    <SideSheet
      title={
        <Row type="flex" justify="space-between" align="middle" className="detail-drawer-wrapper-header">
          <Col>
            <Title heading={5} className="detail-drawer-wrapper-header-title">
              {title}
            </Title>
          </Col>
          <Col>
            <Space spacing={4}>
              {/* 导航按钮 */}
              {showNavigation && (
                <>
                  <Tooltip content={t('common.previous')}>
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                      <Button
                        icon={<IconChevronLeft />}
                        theme="borderless"
                        size="small"
                        disabled={!canGoPrev}
                        onClick={() => handleNavigate('prev')}
                      />
                    </span>
                  </Tooltip>
                  <Tooltip content={t('common.next')}>
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                      <Button
                        icon={<IconChevronRight />}
                        theme="borderless"
                        size="small"
                        disabled={!canGoNext}
                        onClick={() => handleNavigate('next')}
                      />
                    </span>
                  </Tooltip>
                  <Divider layout="vertical" className="detail-drawer-wrapper-header-divider" />
                </>
              )}

              {/* 额外操作按钮 */}
              {extraActions}

              {/* 如果有额外操作按钮，添加分隔线 */}
              {extraActions && <Divider layout="vertical" className="detail-drawer-wrapper-header-divider" />}

              {/* 全屏按钮 */}
              <Tooltip content={isFullscreen ? t('common.exitFullscreen') : t('common.fullscreen')}>
                <Button
                  icon={isFullscreen ? <IconMinimize /> : <IconMaximize />}
                  theme="borderless"
                  size="small"
                  onClick={toggleFullscreen}
                />
              </Tooltip>

              {/* 关闭按钮 */}
              <Tooltip content={t('common.close')}>
                <Button
                  icon={<IconClose />}
                  theme="borderless"
                  size="small"
                  onClick={onClose}
                  className="detail-drawer-wrapper-header-close-btn"
                />
              </Tooltip>
            </Space>
          </Col>
        </Row>
      }
      visible={visible}
      onCancel={onClose}
      placement="right"
      width={isFullscreen ? '100%' : drawerWidth}
      mask={false}
      footer={null}
      closable={false}
      className={`card-sidesheet resizable-sidesheet detail-drawer-wrapper ${isFullscreen ? 'fullscreen-sidesheet' : ''} ${className || ''}`}
    >
      {/* 拖拽把手 */}
      {!isFullscreen && <div className="detail-drawer-wrapper-resize-handle" onMouseDown={handleMouseDown} />}

      {/* 内容区域 */}
      {children}
    </SideSheet>
  );
}

export default DetailDrawerWrapper;
