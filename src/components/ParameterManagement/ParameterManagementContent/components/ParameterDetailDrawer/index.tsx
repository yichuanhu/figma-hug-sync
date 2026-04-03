import { useState, useEffect } from 'react';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Typography,
  Descriptions,
  Tag,
  Tooltip,
  Tabs,
  TabPane,
} from '@douyinfe/semi-ui';
import {
  IconEditStroked,
  IconDeleteStroked,
} from '@douyinfe/semi-icons';
import type { LYParameterResponse, ParameterType } from '@/api/index';
import ExpandableText from '@/components/ExpandableText';
import DetailDrawerWrapper from '@/components/DetailDrawerWrapper';
import type { PaginationInfo } from '@/components/DetailDrawerWrapper';
import CollaboratorTab from '@/components/CollaboratorManager/CollaboratorTab';
import { useCollaboratorPermission } from '@/hooks/useCollaboratorPermission';

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
  const [activeTab, setActiveTab] = useState(initialTab);

  const { canManage } = useCollaboratorPermission('PARAMETER', parameter?.parameter_id);

  useEffect(() => {
    if (parameter) setActiveTab(initialTab);
  }, [parameter?.parameter_id, initialTab]);

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

  const handleClose = () => {
    setActiveTab('basic');
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
      defaultWidth={900}
      minWidth={576}
      storageKey="parameter-detail-drawer-width"
      className="parameter-detail-drawer"
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab} className="parameter-detail-drawer-tabs" keepDOM={false}>
        <TabPane tab={t('parameter.detail.tabs.basicInfo')} itemKey="basic">
          <div className="parameter-detail-drawer-content">
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
        </TabPane>
        <TabPane tab={t('collaborator.tabTitle')} itemKey="collaborators">
          <CollaboratorTab
            assetType="PARAMETER"
            assetId={parameter.parameter_id}
            context={context}
            canManage={canManage}
          />
        </TabPane>
      </Tabs>
    </DetailDrawerWrapper>
  );
};

export default ParameterDetailDrawer;
