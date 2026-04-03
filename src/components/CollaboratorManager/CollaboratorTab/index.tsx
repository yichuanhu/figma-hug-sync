import { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table,
  Button,
  Input,
  Tag,
  Typography,
  Toast,
  Modal,
} from '@douyinfe/semi-ui';
import {
  IconMinusCircleStroked,
  IconSearchStroked,
  IconFlowChartStroked,
} from '@douyinfe/semi-icons';
import { User, UserPlus } from 'lucide-react';
import type {
  AssetCollaborator,
  CollaboratorAssetType,
  CollaboratorRole,
} from '@/api/index';
import { COLLABORATOR_ROLE_PRIORITY } from '@/api/index';
import { useCollaboratorCascade } from '@/hooks/useCollaboratorCascade';
import { getCollaborators } from '@/components/CollaboratorManager/mockData';
import CollaboratorRoleSelect from '../CollaboratorRoleSelect';
import CollaboratorAddModal from '../CollaboratorAddModal';
import EmptyState from '@/components/EmptyState';

import './index.less';

const { Text } = Typography;

interface CollaboratorTabProps {
  assetType: CollaboratorAssetType;
  assetId: string;
  context: 'development' | 'scheduling';
  canManage?: boolean;
}

const CollaboratorTab = ({
  assetType,
  assetId,
  context,
  canManage = true,
}: CollaboratorTabProps) => {
  const { t } = useTranslation();
  const [collaborators, setCollaborators] = useState<AssetCollaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { cascadeRemove, cascadeUpdateRole, canCascade, cascadeCount } =
    useCollaboratorCascade(assetType, assetId);

  const loadData = useCallback(async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 300));
    setCollaborators(getCollaborators(assetType, assetId));
    setLoading(false);
  }, [assetType, assetId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredData = useMemo(() => {
    if (!searchValue) return collaborators;
    const keyword = searchValue.toLowerCase();
    return collaborators.filter(
      (c) =>
        c.collaborator_name.toLowerCase().includes(keyword) ||
        c.department_name?.toLowerCase().includes(keyword)
    );
  }, [collaborators, searchValue]);

  const handleRoleChange = useCallback(
    async (record: AssetCollaborator, newRole: CollaboratorRole) => {
      const result = cascadeUpdateRole(record.id, newRole);
      setCollaborators(getCollaborators(assetType, assetId));
      if (result.cascadeCount > 0) {
        Toast.success(
          t('collaborator.updateSuccessWithCascade', { count: result.cascadeCount })
        );
      } else {
        Toast.success(t('collaborator.updateSuccess'));
      }
    },
    [t, cascadeUpdateRole, assetType, assetId]
  );

  const handleRemove = useCallback(
    (record: AssetCollaborator) => {
      const cascadeInfo = canCascade && cascadeCount > 0;
      Modal.confirm({
        title: t('collaborator.removeConfirm.title'),
        icon: <IconMinusCircleStroked style={{ color: 'var(--semi-color-warning)' }} />,
        content: cascadeInfo
          ? t('collaborator.removeConfirm.contentWithCascade', {
              name: record.collaborator_name,
              count: cascadeCount,
            })
          : t('collaborator.removeConfirm.content', { name: record.collaborator_name }),
        okText: t('common.confirm'),
        cancelText: t('common.cancel'),
        okButtonProps: { type: 'primary', theme: 'solid' },
        onOk: async () => {
          const result = cascadeRemove(record.id);
          setCollaborators(getCollaborators(assetType, assetId));
          if (result.cascadeCount > 0) {
            Toast.success(
              t('collaborator.removeSuccessWithCascade', { count: result.cascadeCount })
            );
          } else {
            Toast.success(t('collaborator.removeSuccess'));
          }
        },
      });
    },
    [t, cascadeRemove, canCascade, cascadeCount, assetType, assetId]
  );

  const handleAddSuccess = useCallback(() => {
    setCollaborators(getCollaborators(assetType, assetId));
    setAddModalVisible(false);
  }, [assetType, assetId]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // 渲染权限来源（仅继承时展示）
  const renderSource = (record: AssetCollaborator) => {
    const sources = record.inheritance_sources || [];
    if (sources.length === 0) return null;
    const isExpanded = expandedRows.has(record.id);

    // 生成 MAX 计算说明
    const maxCalcText = sources.length > 1
      ? (() => {
          const roleNames = sources.map((s) => t(`collaborator.roles.${s.role}`));
          return `MAX(${roleNames.join(', ')}) = ${t(`collaborator.roles.${record.final_role}`)}`;
        })()
      : null;

    return (
      <div className="collaborator-tab-source-detail">
        {(isExpanded ? sources : sources.slice(0, 1)).map((src, idx) => (
          <div key={idx} className="collaborator-tab-source-detail-item">
            <Text size="small" type="tertiary">
              {src.source_type === 'INHERITED_HIERARCHY'
                ? t('collaborator.source.inheritedFromGroup', { name: src.asset_name })
                : t('collaborator.source.inheritedFromProcess', { name: src.asset_name })}
              {' → '}
              {t(`collaborator.roles.${src.role}`)}
            </Text>
          </div>
        ))}
        {isExpanded && maxCalcText && (
          <div className="collaborator-tab-source-detail-item">
            <Text size="small" type="tertiary" style={{ fontStyle: 'italic' }}>
              {maxCalcText}
            </Text>
          </div>
        )}
        {sources.length > 1 && (
          <span
            className="collaborator-tab-source-detail-toggle"
            onClick={() => toggleExpand(record.id)}
          >
            {isExpanded
              ? t('common.collapse')
              : t('collaborator.source.inheritedFromCount', { count: sources.length })}
          </span>
        )}
      </div>
    );
  };

  const columns = [
    {
      title: t('collaborator.table.name'),
      dataIndex: 'collaborator_name',
      key: 'collaborator_name',
      render: (_: unknown, record: AssetCollaborator) => (
        <div className="collaborator-tab-name-cell">
          <span className="collaborator-tab-name-cell-icon">
            {record.collaborator_type === 'DEPARTMENT' ? (
              <IconFlowChartStroked size="small" style={{ fontSize: 14 }} />
            ) : (
              <User size={14} strokeWidth={2} />
            )}
          </span>
          <div className="collaborator-tab-name-cell-info">
            <div className="collaborator-tab-name-cell-label">
              <Text ellipsis={{ showTooltip: true }} style={{ maxWidth: 200 }}>
                {record.collaborator_name}
              </Text>
              {record.is_owner && (
                <Tag size="small" color="blue" className="collaborator-tab-owner-tag">
                  {t('collaborator.owner')}
                </Tag>
              )}
            </div>
            {record.department_name && record.collaborator_type === 'USER' && (
              <Text size="small" type="tertiary" ellipsis={{ showTooltip: true }} style={{ maxWidth: 360 }}>
                {record.department_name}
              </Text>
            )}
            {renderSource(record) && (
              <div className="collaborator-tab-name-cell-source">
                {renderSource(record)}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: t('collaborator.table.role'),
      dataIndex: 'role',
      key: 'role',
      width: 160,
      render: (_: unknown, record: AssetCollaborator) => {
        const isDisabled = record.is_owner || record.source === 'INHERITED' || !canManage;
        const canRemove = !record.is_owner && record.source !== 'INHERITED' && canManage;
        return (
          <CollaboratorRoleSelect
            value={record.final_role}
            onChange={(role) => handleRoleChange(record, role)}
            assetType={assetType}
            disabled={isDisabled}
            onRemove={canRemove ? () => handleRemove(record) : undefined}
          />
        );
      },
    },
  ];

  return (
    <div className="collaborator-tab">
      <div className="collaborator-tab-toolbar">
        <Input
          prefix={<IconSearchStroked />}
          placeholder={t('collaborator.searchPlaceholder')}
          value={searchValue}
          onChange={setSearchValue}
          className="collaborator-tab-search"
          style={{ width: 320 }}
          showClear
        />
        {canManage && (
          <Button
            icon={<UserPlus size={14} strokeWidth={2} />}
            theme="solid"
            type="primary"
            onClick={() => setAddModalVisible(true)}
          >
            {t('collaborator.actions.add')}
          </Button>
        )}
      </div>

      <div className="collaborator-tab-table">
        <Table
          size="small"
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={loading}
          empty={<EmptyState description={t('collaborator.empty')} />}
          pagination={false}
          scroll={{ y: 'calc(100vh - 280px)' }}
        />
      </div>

      <CollaboratorAddModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSuccess={handleAddSuccess}
        assetType={assetType}
        assetId={assetId}
        existingCollaborators={collaborators}
      />
    </div>
  );
};

export default CollaboratorTab;
