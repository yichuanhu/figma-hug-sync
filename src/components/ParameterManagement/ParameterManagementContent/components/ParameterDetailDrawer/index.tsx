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
  Tabs,
  TabPane,
} from '@douyinfe/semi-ui';
import {
  IconClose,
  IconEditStroked,
  IconDeleteStroked,
  IconChevronLeft,
  IconChevronRight,
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
}: ParameterDetailDrawerProps) => {
  const { t } = useTranslation();
  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem(DRAWER_WIDTH_KEY);
    return saved ? Math.max(Number(saved), MIN_WIDTH) : DEFAULT_WIDTH;
  });
  const [isResizing, setIsResizing] = useState(false);

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
        onParameterChange(allParameters[currentIndex - 1]);
      } else if (currentPage > 1) {
        const newData = await onPageChange(currentPage - 1);
        if (newData.length > 0) {
          onParameterChange(newData[newData.length - 1]);
        }
      }
    } else {
      if (currentIndex < allParameters.length - 1) {
        onParameterChange(allParameters[currentIndex + 1]);
      } else if (globalIndex < total - 1) {
        const newData = await onPageChange(currentPage + 1);
        if (newData.length > 0) {
          onParameterChange(newData[0]);
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

  // 自定义header
  const renderHeader = () => (
    <div className="parameter-detail-drawer-header">
      <Title heading={5} className="parameter-detail-drawer-header-title">
        {parameter?.parameter_name || ''}
      </Title>
      <Space>
        <Button
          icon={<IconChevronLeft />}
          theme="borderless"
          type="tertiary"
          disabled={!canGoPrev}
          onClick={() => handleNavigate('prev')}
        >
          {t('common.previous')}
        </Button>
        <Button
          icon={<IconChevronRight />}
          iconPosition="right"
          theme="borderless"
          type="tertiary"
          disabled={!canGoNext}
          onClick={() => handleNavigate('next')}
        >
          {t('common.next')}
        </Button>
        <Divider layout="vertical" className="parameter-detail-drawer-header-divider" />
        <Button
          icon={<IconEditStroked />}
          theme="borderless"
          type="tertiary"
          onClick={() => parameter && onEdit(parameter)}
        />
        {onDelete && context === 'development' && (
          <Button
            icon={<IconDeleteStroked />}
            theme="borderless"
            type="tertiary"
            className="parameter-detail-drawer-header-delete-icon"
            disabled={parameter?.is_published}
            onClick={() => parameter && onDelete(parameter)}
          />
        )}
        <Divider layout="vertical" className="parameter-detail-drawer-header-divider" />
        <Button
          icon={<IconClose />}
          theme="borderless"
          type="tertiary"
          onClick={onClose}
          className="parameter-detail-drawer-header-close-btn"
        />
      </Space>
    </div>
  );

  return (
    <SideSheet
      className="card-sidesheet parameter-detail-drawer"
      visible={visible}
      onCancel={onClose}
      width={width}
      placement="right"
      mask={false}
      closable={false}
      headerStyle={{ padding: '12px 16px' }}
      title={renderHeader()}
    >
      <div
        className="parameter-detail-drawer-resize-handle"
        onMouseDown={handleMouseDown}
      />

      <Tabs className="parameter-detail-drawer-tabs">
        <TabPane tab={t('parameter.detail.tabs.basicInfo')} itemKey="basic">
          <div className="parameter-detail-drawer-content">
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
                <Text copyable>{getParameterValueDisplay()}</Text>
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
        </TabPane>
      </Tabs>
    </SideSheet>
  );
};

export default ParameterDetailDrawer;
