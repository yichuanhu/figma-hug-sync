import { useState } from 'react';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Typography,
  Descriptions,
  Tag,
  Tooltip,
} from '@douyinfe/semi-ui';
import {
  IconEditStroked,
  IconDeleteStroked,
} from '@douyinfe/semi-icons';
import type { LYParameterResponse, ParameterType } from '@/api/index';
import ExpandableText from '@/components/ExpandableText';
import DetailDrawerWrapper from '@/components/DetailDrawerWrapper';
import type { PaginationInfo } from '@/components/DetailDrawerWrapper';

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
  onParameterChange: (parameter: LYParameterResponse) => void;
  pagination?: PaginationInfo;
  onPageChange?: (page: number, direction: 'prev' | 'next') => void;
  onScrollToRow?: (id: string) => void;
}

const ParameterDetailDrawer = ({
  visible,
  parameter,
  context,
  onClose,
  onEdit,
  onDelete,
  allParameters,
  onParameterChange,
  pagination,
  onPageChange,
  onScrollToRow,
}: ParameterDetailDrawerProps) => {
  const { t } = useTranslation();
  const { Text } = Typography;

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

  if (!parameter) return null;

  // 额外操作按钮
  const extraActions = (
    <>
      {!parameter.is_published && (
        <Tooltip content={t('common.edit')}>
          <Button
            icon={<IconEditStroked />}
            theme="borderless"
            size="small"
            onClick={() => onEdit(parameter)}
          />
        </Tooltip>
      )}
      {onDelete && context === 'development' && !parameter.is_published && (
        <Tooltip content={t('common.delete')}>
          <Button
            icon={<IconDeleteStroked style={{ color: 'var(--semi-color-danger)' }} />}
            theme="borderless"
            size="small"
            onClick={() => onDelete(parameter)}
          />
        </Tooltip>
      )}
    </>
  );

  return (
    <DetailDrawerWrapper
      visible={visible}
      onClose={onClose}
      title={parameter.parameter_name}
      dataList={allParameters}
      currentId={parameter.parameter_id}
      getId={(item) => item.parameter_id}
      onNavigate={onParameterChange}
      pagination={pagination}
      onPageChange={onPageChange}
      onScrollToRow={onScrollToRow}
      extraActions={extraActions}
      defaultWidth={900}
      minWidth={576}
      storageKey="parameter-detail-drawer-width"
      className="parameter-detail-drawer"
    >
      <div className="parameter-detail-drawer-content">
        <Text strong className="parameter-detail-drawer-section-title">
          {t('parameter.detail.tabs.basicInfo')}
        </Text>
        <Descriptions align="left">
          <Descriptions.Item itemKey={t('parameter.fields.name')}>
            {parameter.parameter_name || '-'}
          </Descriptions.Item>
          <Descriptions.Item itemKey={t('parameter.fields.type')}>
            {parameter.parameter_type && (
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
          {context === 'development' && (
            <Descriptions.Item itemKey={t('parameter.detail.isPublished')}>
              {parameter.is_published ? (
                <Tag color="green">{t('parameter.detail.published')}</Tag>
              ) : (
                <Tag color="grey">{t('parameter.detail.unpublished')}</Tag>
              )}
            </Descriptions.Item>
          )}
          <Descriptions.Item itemKey={t('common.description')}>
            <ExpandableText text={parameter.description} maxLines={3} />
          </Descriptions.Item>
          <Descriptions.Item itemKey={t('common.creator')}>
            {parameter.created_by_name || '-'}
          </Descriptions.Item>
          <Descriptions.Item itemKey={t('common.createTime')}>
            {formatDate(parameter.created_at || null)}
          </Descriptions.Item>
          <Descriptions.Item itemKey={t('common.updateTime')}>
            {formatDate(parameter.updated_at || null)}
          </Descriptions.Item>
        </Descriptions>
      </div>
    </DetailDrawerWrapper>
  );
};

export default ParameterDetailDrawer;
