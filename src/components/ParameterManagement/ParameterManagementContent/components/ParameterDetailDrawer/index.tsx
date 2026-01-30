import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  SideSheet,
  Button,
  Typography,
  Descriptions,
  Tag,
  Space,
  Divider,
  Tooltip,
  Row,
  Col,
  Toast,
} from '@douyinfe/semi-ui';
import {
  IconClose,
  IconEditStroked,
  IconDeleteStroked,
  IconChevronLeft,
  IconChevronRight,
  IconMaximize,
  IconMinimize,
  IconCopyStroked,
} from '@douyinfe/semi-icons';
import type { LYParameterResponse, ParameterType } from '@/api/index';

import './index.less';

// 参数类型配置
const typeConfig: Record<ParameterType, { color: 'blue' | 'green' | 'orange'; i18nKey: string }> = {
  1: { color: 'blue', i18nKey: 'parameter.type.text' },
  2: { color: 'green', i18nKey: 'parameter.type.boolean' },
  3: { color: 'orange', i18nKey: 'parameter.type.number' },
};

interface ParameterDetailDrawerProps {
  visible: boolean;
  parameter: LYParameterResponse | null;
  context: 'development' | 'scheduling';
  onClose: () => void;
  onEdit: (parameter: LYParameterResponse) => void;
  onDelete?: (parameter: LYParameterResponse) => void;
  allParameters: LYParameterResponse[];
  currentPage: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => Promise<LYParameterResponse[]>;
  onParameterChange: (parameter: LYParameterResponse) => void;
  onScrollToRow?: (id: string) => void;
}

const DRAWER_WIDTH_KEY = 'parameter-detail-drawer-width';
const DEFAULT_WIDTH = 900;
const MIN_WIDTH = 576;

const ParameterDetailDrawer = ({
  visible,
  parameter,
  context,
  onClose,
  onEdit,
  onDelete,
  allParameters,
  currentPage,
  pageSize,
  total,
  onPageChange,
  onParameterChange,
  onScrollToRow,
}: ParameterDetailDrawerProps) => {
  const { t } = useTranslation();
  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem(DRAWER_WIDTH_KEY);
    return saved ? Math.max(Number(saved), MIN_WIDTH) : DEFAULT_WIDTH;
  });
  const [isResizing, setIsResizing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // 拖拽调整宽度
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.max(MIN_WIDTH, window.innerWidth - e.clientX);
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        localStorage.setItem(DRAWER_WIDTH_KEY, String(width));
      }
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, width]);

  // 计算当前参数在列表中的索引
  const currentIndex = allParameters.findIndex(
    (p) => p.parameter_id === parameter?.parameter_id
  );

  // 计算全局索引
  const globalIndex = (currentPage - 1) * pageSize + currentIndex;

  // 导航到上一个/下一个
  const handleNavigate = async (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentIndex > 0) {
        const target = allParameters[currentIndex - 1];
        onParameterChange(target);
        onScrollToRow?.(target.parameter_id);
      } else if (currentPage > 1) {
        const newData = await onPageChange(currentPage - 1);
        if (newData.length > 0) {
          const target = newData[newData.length - 1];
          onParameterChange(target);
          onScrollToRow?.(target.parameter_id);
        }
      }
    } else {
      if (currentIndex < allParameters.length - 1) {
        const target = allParameters[currentIndex + 1];
        onParameterChange(target);
        onScrollToRow?.(target.parameter_id);
      } else if (globalIndex < total - 1) {
        const newData = await onPageChange(currentPage + 1);
        if (newData.length > 0) {
          const target = newData[0];
          onParameterChange(target);
          onScrollToRow?.(target.parameter_id);
        }
      }
    }
  };

  const canGoPrev = globalIndex > 0;
  const canGoNext = globalIndex < total - 1;

  const { Title, Text } = Typography;

  // 格式化日期
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('zh-CN');
  };

  // 获取参数值显示
  const getParameterValueDisplay = () => {
    if (!parameter) return '-';
    const value = context === 'development' ? parameter.dev_value : parameter.prod_value;
    if (value === null || value === undefined) return '-';
    return value;
  };

  // 切换全屏
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  // 自定义header
  const renderHeader = () => (
    <Row type="flex" justify="space-between" align="middle" className="parameter-detail-drawer-header">
      <Col>
        <Title heading={5} className="parameter-detail-drawer-header-title">
          {parameter?.parameter_name || ''}
        </Title>
      </Col>
      <Col>
        <Space spacing={8}>
          <Tooltip content={t('common.previous')}>
            <Button
              icon={<IconChevronLeft />}
              theme="borderless"
              size="small"
              className="navigate"
              disabled={!canGoPrev}
              onClick={() => handleNavigate('prev')}
            />
          </Tooltip>
          <Tooltip content={t('common.next')}>
            <Button
              icon={<IconChevronRight />}
              theme="borderless"
              size="small"
              className="navigate"
              disabled={!canGoNext}
              onClick={() => handleNavigate('next')}
            />
          </Tooltip>
          <Divider layout="vertical" className="parameter-detail-drawer-header-divider" />
          <Tooltip content={t('common.edit')}>
            <Button
              icon={<IconEditStroked />}
              theme="borderless"
              size="small"
              onClick={() => parameter && onEdit(parameter)}
            />
          </Tooltip>
          {onDelete && context === 'development' && (
            <Tooltip content={parameter?.is_published ? t('parameter.detail.cannotDeletePublished') : t('common.delete')}>
              <Button
                icon={<IconDeleteStroked className={parameter?.is_published ? '' : 'parameter-detail-drawer-header-delete-icon'} />}
                theme="borderless"
                size="small"
                disabled={parameter?.is_published}
                onClick={() => parameter && onDelete(parameter)}
              />
            </Tooltip>
          )}
          <Divider layout="vertical" className="parameter-detail-drawer-header-divider" />
          <Tooltip content={isFullscreen ? t('common.exitFullscreen') : t('common.fullscreen')}>
            <Button
              icon={isFullscreen ? <IconMinimize /> : <IconMaximize />}
              theme="borderless"
              size="small"
              onClick={toggleFullscreen}
            />
          </Tooltip>
          <Tooltip content={t('common.close')}>
            <Button
              icon={<IconClose />}
              theme="borderless"
              size="small"
              onClick={onClose}
              className="parameter-detail-drawer-header-close-btn"
            />
          </Tooltip>
        </Space>
      </Col>
    </Row>
  );

  return (
    <SideSheet
      className={`card-sidesheet resizable-sidesheet parameter-detail-drawer ${isFullscreen ? 'fullscreen-sidesheet' : ''}`}
      visible={visible}
      onCancel={onClose}
      width={isFullscreen ? '100%' : width}
      placement="right"
      mask={false}
      closable={false}
      title={renderHeader()}
    >
      {!isFullscreen && (
        <div
          className="parameter-detail-drawer-resize-handle"
          onMouseDown={handleMouseDown}
        />
      )}

      <div className="parameter-detail-drawer-content">
        <Text strong className="parameter-detail-drawer-section-title">
          {t('parameter.detail.tabs.basicInfo')}
        </Text>
        <Descriptions align="left">
          <Descriptions.Item itemKey={t('parameter.fields.name')}>
            {parameter?.parameter_name || '-'}
          </Descriptions.Item>
          <Descriptions.Item itemKey={t('parameter.fields.type')}>
            {parameter?.parameter_type && (
              <Tag color={typeConfig[parameter.parameter_type].color}>
                {t(typeConfig[parameter.parameter_type].i18nKey)}
              </Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item 
            itemKey={context === 'development' 
              ? t('parameter.table.devValue') 
              : t('parameter.table.prodValue')
            }
          >
            <Text>{getParameterValueDisplay()}</Text>
          </Descriptions.Item>
          <Descriptions.Item itemKey={t('parameter.detail.isPublished')}>
            {parameter?.is_published ? (
              <Tag color="green">{t('parameter.detail.published')}</Tag>
            ) : (
              <Tag color="grey">{t('parameter.detail.unpublished')}</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item itemKey={t('common.description')}>
            {parameter?.description || '-'}
          </Descriptions.Item>
          <Descriptions.Item itemKey={t('common.creator')}>
            {parameter?.created_by_name || '-'}
          </Descriptions.Item>
          <Descriptions.Item itemKey={t('common.createTime')}>
            {formatDate(parameter?.created_at || null)}
          </Descriptions.Item>
          <Descriptions.Item itemKey={t('common.updateTime')}>
            {formatDate(parameter?.updated_at || null)}
          </Descriptions.Item>
        </Descriptions>
      </div>
    </SideSheet>
  );
};

export default ParameterDetailDrawer;
