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
  Popover,
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
import { getCollaborators, addCollaborators } from '@/components/CollaboratorManager/mockData';
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
  const [quickAddingId, setQuickAddingId] = useState<string | null>(null);

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

      // MIXED 协作者：检查新角色是否低于继承角色
      const isMixed = record.source === 'MIXED';
      const inheritedSources = record.inheritance_sources || [];
      if (isMixed && inheritedSources.length > 0) {
        const inheritedMaxPriority = Math.max(
          ...inheritedSources.map((s) => COLLABORATOR_ROLE_PRIORITY[s.role] || 0)
        );
        if (COLLABORATOR_ROLE_PRIORITY[newRole] < inheritedMaxPriority) {
          const inheritedMaxRole = inheritedSources.reduce((max, s) =>
            (COLLABORATOR_ROLE_PRIORITY[s.role] || 0) > (COLLABORATOR_ROLE_PRIORITY[max.role] || 0) ? s : max
          ).role;
          Toast.warning(
            t('collaborator.roleLowerWarningToast', {
              directRole: t(`collaborator.roles.${newRole}`),
              inheritedRole: t(`collaborator.roles.${inheritedMaxRole}`),
            })
          );
          return;
        }
      }

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

  const handleQuickAdd = useCallback(
    (record: AssetCollaborator, role: CollaboratorRole) => {
      addCollaborators(assetType, assetId, [
        {
          collaborator_type: record.collaborator_type,
          collaborator_id: record.collaborator_id,
          collaborator_name: record.collaborator_name,
          department_name: record.department_name,
          role,
        },
      ]);
      setCollaborators(getCollaborators(assetType, assetId));
      setQuickAddingId(null);
      Toast.success(t('collaborator.quickAddSuccess'));
    },
    [assetType, assetId, t]
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

  // 渲染权限来源（继承或 MIXED 时展示）
  const renderSource = (record: AssetCollaborator) => {
    const sources = record.inheritance_sources || [];
    const isMixed = record.source === 'MIXED';

    // MIXED 时即使 sources 为空也要展示直接分配行
    if (sources.length === 0 && !isMixed) return null;

    const isExpanded = expandedRows.has(record.id);

    // 1. 按角色优先级降序排序
    const sortedSources = [...sources].sort(
      (a, b) => (COLLABORATOR_ROLE_PRIORITY[b.role] || 0) - (COLLABORATOR_ROLE_PRIORITY[a.role] || 0)
    );

    // 2. 最多展示前3条
    const topSources = sortedSources.slice(0, 3);
    const remainCount = Math.max(0, sortedSources.length - 3);

    // 构建所有角色名（含直接分配）用于判断是否需要生效角色说明
    const allRoleCount = (isMixed && record.role ? 1 : 0) + sortedSources.length;

    // 3. 折叠/展开逻辑
    const inheritedItems = isExpanded ? topSources : topSources.slice(0, 1);

    // 4. 自然语言替代 MAX 公式
    const effectiveText = allRoleCount > 1
      ? t('collaborator.source.effectiveRole', {
          role: t(`collaborator.roles.${record.final_role}`),
        })
      : null;

    return (
      <div className="collaborator-tab-source-detail">
        {isMixed && record.role && (
          <div className="collaborator-tab-source-detail-item">
            <Text size="small" type="tertiary">
              {t('collaborator.source.direct')}
              {' → '}
              {t(`collaborator.roles.${record.role}`)}
            </Text>
          </div>
        )}
        {inheritedItems.map((src, idx) => {
          const sourceName = src.source_type === 'INHERITED_HIERARCHY'
            ? t('collaborator.source.inheritedFromGroup', { name: src.asset_name })
            : t('collaborator.source.inheritedFromProcess', { name: src.asset_name });
          return (
            <div key={idx} className="collaborator-tab-source-detail-item">
              <Text size="small" type="tertiary" ellipsis={{ showTooltip: true }}>
                {sourceName}
              </Text>
              <Text size="small" type="tertiary">
                {' → '}
                {t(`collaborator.roles.${src.role}`)}
              </Text>
            </div>
          );
        })}
        {isExpanded && remainCount > 0 && (
          <div className="collaborator-tab-source-detail-item">
            <Text size="small" type="tertiary">
              {t('collaborator.source.remainingCount', { count: remainCount })}
            </Text>
          </div>
        )}
        {isExpanded && effectiveText && (
          <div className="collaborator-tab-source-detail-item">
            <Text size="small" type="tertiary">
              {effectiveText}
            </Text>
          </div>
        )}
        {topSources.length > 1 && (
          <span
            className="collaborator-tab-source-detail-toggle"
            onClick={() => toggleExpand(record.id)}
          >
            {isExpanded
              ? t('common.collapse')
              : t('collaborator.source.inheritedFromCount', { count: sortedSources.length })}
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
              <Text ellipsis={{ showTooltip: true }}>
                {record.collaborator_name}
              </Text>
              {record.is_owner && (
                <Tag size="small" color="blue" className="collaborator-tab-owner-tag">
                  {t('collaborator.owner')}
                </Tag>
              )}
            </div>
            {record.department_name && record.collaborator_type === 'USER' && (
              <Text size="small" type="tertiary" ellipsis={{ showTooltip: true }}>
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
        const isInherited = record.source === 'INHERITED' || (record.inheritance_sources && record.inheritance_sources.length > 0 && record.source !== 'DIRECT' && record.source !== 'MIXED');
        const isDisabled = record.is_owner || isInherited || !canManage;
        const canRemove = !record.is_owner && !isInherited && canManage;

        const selectEl = (
          <CollaboratorRoleSelect
            value={record.final_role}
            onChange={(role) => handleRoleChange(record, role)}
            assetType={assetType}
            disabled={isDisabled}
            onRemove={canRemove ? () => handleRemove(record) : undefined}
          />
        );

        if (isInherited && !record.is_owner) {
          const popoverContent = (
              <div className="collaborator-tab-inherited-popover">
              <div className="collaborator-tab-inherited-popover-text">
                {t('collaborator.inheritedRoleHint')}
              </div>
              <div className="collaborator-tab-inherited-popover-hint">
                {t('collaborator.inheritedRoleMaxHint')}
              </div>
              {canManage && (
                quickAddingId === record.id ? (
                  <div style={{ marginTop: 8 }}>
                    <CollaboratorRoleSelect
                      value={record.final_role}
                      onChange={(role) => handleQuickAdd(record, role)}
                      assetType={assetType}
                      disabled={false}
                      size="small"
                    />
                  </div>
                ) : (
                  <Button
                    size="small"
                    theme="solid"
                    type="primary"
                    onClick={() => setQuickAddingId(record.id)}
                    style={{ marginTop: 8, width: '100%' }}
                  >
                    {t('collaborator.actions.quickAdd')}
                  </Button>
                )
              )}
            </div>
          );
          return (
            <Popover
              content={popoverContent}
              position="top"
              showArrow
              trigger="hover"
            >
              {selectEl}
            </Popover>
          );
        }

        return selectEl;
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
