import { useRef } from 'react';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Typography,
  Descriptions,
  Tag,
  Tooltip,
} from '@douyinfe/semi-ui';
import type { LYParameterResponse, ParameterType } from '@/api/index';
import ExpandableText from '@/components/ExpandableText';
import DetailDrawerWrapper from '@/components/DetailDrawerWrapper';
import type { PaginationInfo } from '@/components/DetailDrawerWrapper';
import { useCollaboratorPermission } from '@/hooks/useCollaboratorPermission';

import './index.less';
import { Pencil, Trash2 } from 'lucide-react';

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
  initialTab?: string;
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
  initialTab = 'basic',
}: ParameterDetailDrawerProps) => {
  const { t } = useTranslation();
  const { Text } = Typography;

  const { canManage } = useCollaboratorPermission('PARAMETER', parameter?.parameter_id);

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
            icon={<Pencil size={16} strokeWidth={2} />}
            theme="borderless"
            type="tertiary"
            size="small"
            onClick={() => onEdit(parameter)}
          />
        </Tooltip>
    </>
  );

  const deleteAction = onDelete && context === 'development' && !parameter.is_published ? (
    <Tooltip content={t('common.delete')}>
      <Button
        icon={<Trash2 size={16} strokeWidth={2} color="var(--semi-color-danger)" />}
        theme="borderless"
        type="tertiary"
        size="small"
        onClick={() => onDelete(parameter)}
      />
    </Tooltip>
  ) : null;

  const handleClose = () => {
    onClose();
  };

  return (
    <DetailDrawerWrapper
      visible={visible}
      onClose={handleClose}
      title={parameter.parameter_name}
      dataList={allParameters}
      currentId={parameter.parameter_id}
      getId={(item) => item.parameter_id}
      onNavigate={onParameterChange}
      pagination={pagination}
      onPageChange={onPageChange}
      onScrollToRow={onScrollToRow}
      extraActions={extraActions}
      deleteAction={deleteAction}
      defaultWidth={900}
      minWidth={576}
      storageKey="parameter-detail-drawer-width"
      className="parameter-detail-drawer"
      collaboratorProps={{
        assetType: 'PARAMETER',
        assetId: parameter.parameter_id,
        context,
        canManage,
      }}
    >
      <div className="parameter-detail-drawer-content" style={{ padding: '16px 24px' }}>
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
            {parameter.created_by_name ? <UserNameWithCard name={parameter.created_by_name} userId={parameter.created_by} department={parameter.created_by_department || undefined} role={parameter.created_by_role || undefined} email={parameter.created_by_email || undefined} /> : '-'}
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
