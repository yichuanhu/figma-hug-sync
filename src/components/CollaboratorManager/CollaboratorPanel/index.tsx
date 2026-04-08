import { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Tag,
  Typography,
  Toast,
  Modal,
  Popover,
  Avatar,
  AvatarGroup,
  Button,
  Divider,
} from '@douyinfe/semi-ui';
import {
  IconMinusCircleStroked,
  IconFlowChartStroked,
  IconChevronLeft,
  IconChevronDown,
} from '@douyinfe/semi-icons';
import { X, UserPlus } from 'lucide-react';
import type {
  AssetCollaborator,
  CollaboratorAssetType,
  CollaboratorRole,
} from '@/api/index';
import { COLLABORATOR_ROLE_PRIORITY, ASSET_AVAILABLE_ROLES } from '@/api/index';
import { useCollaboratorCascade } from '@/hooks/useCollaboratorCascade';
import { getCollaborators, addCollaborators, searchOrgUsers } from '@/components/CollaboratorManager/mockData';
import type { OrgUser } from '@/components/CollaboratorManager/mockData';
import CollaboratorRoleSelect from '../CollaboratorRoleSelect';
import CollaboratorAddModal from '../CollaboratorAddModal';
import { getAvatarColor } from '@/utils/avatarColor';

import './index.less';

const { Text } = Typography;

interface CollaboratorPanelProps {
  assetType: CollaboratorAssetType;
  assetId: string;
  context: 'development' | 'scheduling';
  canManage: boolean;
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
}

const CollaboratorPanel = ({
  assetType,
  assetId,
  context,
  canManage,
  visible,
  onVisibleChange,
}: CollaboratorPanelProps) => {
  const { t } = useTranslation();
  const [panelView, setPanelView] = useState<'quick' | 'manage'>('quick');
  const [collaborators, setCollaborators] = useState<AssetCollaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [quickAddingId, setQuickAddingId] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<OrgUser[]>([]);
  const [batchRole, setBatchRole] = useState<CollaboratorRole>(
    ASSET_AVAILABLE_ROLES[assetType]?.[ASSET_AVAILABLE_ROLES[assetType].length - 1] || 'OBSERVER'
  );
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { cascadeRemove, cascadeUpdateRole, canCascade, cascadeCount } =
    useCollaboratorCascade(assetType, assetId);

  const loadData = useCallback(async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 200));
    setCollaborators(getCollaborators(assetType, assetId));
    setLoading(false);
  }, [assetType, assetId]);

  useEffect(() => {
    if (visible) {
      loadData();
      setPanelView('quick');
      setSearchValue('');
      setQuickAddingId(null);
      setSelectedUsers([]);
      setBatchRole(ASSET_AVAILABLE_ROLES[assetType]?.[ASSET_AVAILABLE_ROLES[assetType].length - 1] || 'OBSERVER');
      setExpandedRows(new Set());
    }
  }, [visible, loadData, assetType]);

  const searchResults = useMemo(() => {
    if (!searchValue.trim()) return [];
    const existingIds = collaborators.map((c) => c.collaborator_id);
    const selectedIds = selectedUsers.map((u) => u.id);
    return searchOrgUsers(searchValue, [...existingIds, ...selectedIds]);
  }, [searchValue, collaborators, selectedUsers]);

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
      cascadeUpdateRole(record.id, newRole);
      setCollaborators(getCollaborators(assetType, assetId));

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

      Toast.success(t('collaborator.updateSuccess'));
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
          cascadeRemove(record.id);
          setCollaborators(getCollaborators(assetType, assetId));
          Toast.success(t('collaborator.removeSuccess'));
        },
      });
    },
    [t, cascadeRemove, canCascade, cascadeCount, assetType, assetId]
  );

  const handleBatchAdd = useCallback(() => {
    if (selectedUsers.length === 0) return;
    addCollaborators(
      assetType,
      assetId,
      selectedUsers.map((user) => ({
        collaborator_type: 'USER' as const,
        collaborator_id: user.id,
        collaborator_name: user.name,
        department_name: user.department,
        role: batchRole,
      }))
    );
    setCollaborators(getCollaborators(assetType, assetId));
    setSelectedUsers([]);
    setSearchValue('');
    setBatchRole(ASSET_AVAILABLE_ROLES[assetType]?.[ASSET_AVAILABLE_ROLES[assetType].length - 1] || 'OBSERVER');
    Toast.success(t('collaborator.quickAddSuccess'));
  }, [assetType, assetId, selectedUsers, batchRole, t]);

  const handleSelectUser = useCallback((user: OrgUser) => {
    setSelectedUsers((prev) => [...prev, user]);
    setSearchValue('');
  }, []);

  const handleDeselectUser = useCallback((userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  }, []);

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

  // 从组织架构添加：隐藏主弹窗，打开组织架构弹窗
  const handleOpenOrgModal = useCallback(() => {
    onVisibleChange(false);
    setAddModalVisible(true);
  }, [onVisibleChange]);

  const handleAddModalClose = useCallback(() => {
    setAddModalVisible(false);
    onVisibleChange(true);
  }, [onVisibleChange]);

  const handleAddSuccess = useCallback(() => {
    setCollaborators(getCollaborators(assetType, assetId));
    setAddModalVisible(false);
    onVisibleChange(true);
  }, [assetType, assetId, onVisibleChange]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // 渲染权限来源
  const renderSource = (record: AssetCollaborator) => {
    const sources = record.inheritance_sources || [];
    const isMixed = record.source === 'MIXED';
    if (sources.length === 0 && !isMixed) return null;

    const isExpanded = expandedRows.has(record.id);
    const sortedSources = [...sources].sort(
      (a, b) => (COLLABORATOR_ROLE_PRIORITY[b.role] || 0) - (COLLABORATOR_ROLE_PRIORITY[a.role] || 0)
    );
    const topSources = sortedSources.slice(0, 3);
    const remainCount = Math.max(0, sortedSources.length - 3);
    const allRoleCount = (isMixed && record.role ? 1 : 0) + sortedSources.length;
    const inheritedItems = isExpanded ? topSources : topSources.slice(0, 1);
    const effectiveText = allRoleCount > 1
      ? t('collaborator.source.effectiveRole', {
          role: t(`collaborator.roles.${record.final_role}`),
        })
      : null;

    return (
      <div className="collaborator-panel-source-detail">
        {isMixed && record.role && (
          <div className="collaborator-panel-source-detail-item">
            <Text size="small" type="tertiary">
              {t('collaborator.source.direct')} → {t(`collaborator.roles.${record.role}`)}
            </Text>
          </div>
        )}
        {inheritedItems.map((src, idx) => {
          const sourceName = src.source_type === 'INHERITED_HIERARCHY'
            ? t('collaborator.source.inheritedFromGroup', { name: src.asset_name })
            : t('collaborator.source.inheritedFromProcess', { name: src.asset_name });
          return (
            <div key={idx} className="collaborator-panel-source-detail-item">
              <Text size="small" type="tertiary" ellipsis={{ showTooltip: true }}>
                {sourceName} → {t(`collaborator.roles.${src.role}`)}
              </Text>
            </div>
          );
        })}
        {isExpanded && remainCount > 0 && (
          <div className="collaborator-panel-source-detail-item">
            <Text size="small" type="tertiary">
              {t('collaborator.source.remainingCount', { count: remainCount })}
            </Text>
          </div>
        )}
        {isExpanded && effectiveText && (
          <div className="collaborator-panel-source-detail-item">
            <Text size="small" type="tertiary">{effectiveText}</Text>
          </div>
        )}
        {topSources.length > 1 && (
          <span
            className="collaborator-panel-source-detail-toggle"
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

  // 渲染单个协作者行
  const renderCollaboratorItem = (record: AssetCollaborator) => {
    const isInherited = record.source === 'INHERITED' || (record.inheritance_sources && record.inheritance_sources.length > 0 && record.source !== 'DIRECT' && record.source !== 'MIXED');
    const isDisabled = record.is_owner || isInherited || !canManage;
    const canRemoveItem = !record.is_owner && !isInherited && canManage;

    const roleSelect = (
      <CollaboratorRoleSelect
        value={record.final_role}
        onChange={(role) => handleRoleChange(record, role)}
        assetType={assetType}
        disabled={isDisabled}
        onRemove={canRemoveItem ? () => handleRemove(record) : undefined}
      />
    );

    const roleEl = isInherited && !record.is_owner ? (
      <Popover
        content={
          <div className="collaborator-panel-inherited-popover">
            <div className="collaborator-panel-inherited-popover-text">
              {t('collaborator.inheritedRoleHint')}
            </div>
            <div className="collaborator-panel-inherited-popover-hint">
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
        }
        position="top"
        showArrow
        trigger="hover"
        onVisibleChange={(v) => {
          if (!v) setQuickAddingId(null);
        }}
      >
        {roleSelect}
      </Popover>
    ) : roleSelect;

    return (
      <div key={record.id} className="collaborator-panel-item">
        <div className="collaborator-panel-item-left">
          <Avatar
            size="small"
            style={
              record.collaborator_type === 'DEPARTMENT'
                ? { backgroundColor: 'var(--semi-color-fill-1)', color: 'var(--semi-color-text-2)' }
                : { backgroundColor: '#000000', color: '#ffffff' }
            }
          >
            {record.collaborator_type === 'DEPARTMENT' ? (
              <IconFlowChartStroked size="small" />
            ) : (
              record.collaborator_name.slice(0, 1)
            )}
          </Avatar>
          <div className="collaborator-panel-item-info">
            <div className="collaborator-panel-item-name-row">
              <Text ellipsis={{ showTooltip: true }} className="collaborator-panel-item-name">
                {record.collaborator_name}
              </Text>
              {record.is_owner && (
                <Tag size="small" color="blue" className="collaborator-panel-owner-tag">
                  {t('collaborator.owner')}
                </Tag>
              )}
            </div>
            {record.department_name && record.collaborator_type === 'USER' && (
              <Text size="small" type="tertiary" ellipsis={{ showTooltip: true }}>
                {record.department_name}
              </Text>
            )}
            {renderSource(record)}
          </div>
        </div>
        <div className="collaborator-panel-item-right">
          {roleEl}
        </div>
      </div>
    );
  };

  // 渲染搜索结果中的用户行
  const renderSearchResultItem = (user: OrgUser) => {
    return (
      <div
        key={user.id}
        className="collaborator-panel-item"
        style={{ cursor: 'pointer' }}
        onClick={() => handleSelectUser(user)}
      >
        <div className="collaborator-panel-item-left">
          <Avatar
            size="small"
            style={{ backgroundColor: '#000000', color: '#ffffff' }}
          >
            {user.name.slice(0, 1)}
          </Avatar>
          <div className="collaborator-panel-item-info">
            <Text ellipsis={{ showTooltip: true }} className="collaborator-panel-item-name">
              {user.name}
            </Text>
            <Text size="small" type="tertiary" ellipsis={{ showTooltip: true }}>
              {user.department}
            </Text>
          </div>
        </div>
      </div>
    );
  };

  // 头像组 + 人数（共用于 title 右侧）
  const renderAvatarGroup = () => (
    <div
      className="collaborator-panel-header-right"
      onClick={() => setPanelView('manage')}
    >
      <AvatarGroup size="extra-extra-small" maxCount={3}>
        {collaborators.slice(0, 3).map((c) => (
          <Avatar
            key={c.id}
            style={
              c.collaborator_type === 'USER'
                ? { backgroundColor: '#000000', color: '#ffffff' }
                : { backgroundColor: 'var(--semi-color-fill-1)', color: 'var(--semi-color-text-2)' }
            }
          >
            {c.collaborator_type === 'DEPARTMENT' ? (
              <IconFlowChartStroked style={{ fontSize: 10 }} />
            ) : (
              c.collaborator_name.slice(0, 1)
            )}
          </Avatar>
        ))}
      </AvatarGroup>
      <Tag size="small" type="ghost" className="collaborator-panel-count-tag">
        {t('collaborator.panel.peopleCount', { count: collaborators.length })}
      </Tag>
      <IconChevronLeft style={{ transform: 'rotate(180deg)', fontSize: 12 }} />
    </div>
  );

  // Feishu-style unified search input
  const renderSearchBox = () => (
    <div className="collaborator-panel-search-input-box">
      <div className="collaborator-panel-search-input-left">
        {selectedUsers.map((user) => (
          <Tag
            key={user.id}
            closable
            avatarShape="circle"
            onClose={() => handleDeselectUser(user.id)}
            size="large"
            className="collaborator-panel-selected-tag"
          >
            {user.name}
          </Tag>
        ))}
        <input
          className="collaborator-panel-search-native-input"
          placeholder={selectedUsers.length === 0 ? t('collaborator.addModal.searchPlaceholder') : ''}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
      </div>
      {selectedUsers.length > 0 && (
        <Popover
          content={
            <div style={{ padding: 4, width: 280 }}>
              {(ASSET_AVAILABLE_ROLES[assetType] || []).map((role) => (
                <div
                  key={role}
                  className={`semi-select-option${batchRole === role ? ' semi-select-option-selected' : ''}${batchRole === role ? ' semi-select-option-focused' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    borderRadius: 4,
                  }}
                  onClick={() => setBatchRole(role)}
                >
                  <div style={{ width: 20, flexShrink: 0, marginTop: 2 }}>
                    {batchRole === role && (
                      <span style={{ color: 'var(--semi-color-primary)', fontSize: 14 }}>✓</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                    <span>{t(`collaborator.roles.${role}`)}</span>
                    <Text size="small" type="tertiary" style={{ lineHeight: '18px' }}>
                      {t(`collaborator.roleDesc.${role}`)}
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          }
          trigger="click"
          position="bottomRight"
          showArrow={false}
        >
          <span className="collaborator-panel-role-text-btn">
            {t(`collaborator.roles.${batchRole}`)}
            <IconChevronDown size="small" />
          </span>
        </Popover>
      )}
    </div>
  );

  // Quick view content
  const renderQuickView = () => (
    <div className="collaborator-panel-quick">
      {renderSearchBox()}

      {searchValue.trim() && (
        <div className="collaborator-panel-search-results">
          {searchResults.length > 0 ? (
            searchResults.map((user) => renderSearchResultItem(user))
          ) : (
            <div className="collaborator-panel-search-empty">
              <Text type="tertiary" size="small">{t('collaborator.panel.noSearchResults')}</Text>
            </div>
          )}
        </div>
      )}

      {selectedUsers.length > 0 ? (
        <div className="collaborator-panel-batch-actions">
          <Button type="tertiary" onClick={() => setSelectedUsers([])}>
            {t('common.cancel')}
          </Button>
          <Button type="primary" theme="solid" onClick={handleBatchAdd}>
            {t('common.confirm')}
          </Button>
        </div>
      ) : !searchValue.trim() ? (
        <div style={{ padding: '8px 0 16px' }}>
          <Button
            type="tertiary"
            icon={<IconFlowChartStroked />}
            block
            onClick={handleOpenOrgModal}
          >
            {t('collaborator.panel.addFromOrg')}
          </Button>
        </div>
      ) : null}
    </div>
  );

  // Manage view content
  const renderManageView = () => (
    <div className="collaborator-panel-manage">
      <div className="collaborator-panel-manage-subtitle">
        <Text size="small" type="tertiary">
          {t('collaborator.panel.allAccessUsers')}
        </Text>
      </div>
      <div className="collaborator-panel-manage-list">
        {filteredData.map((record) => renderCollaboratorItem(record))}
        {filteredData.length === 0 && (
          <div className="collaborator-panel-manage-empty">
            <Text type="tertiary">{t('collaborator.empty')}</Text>
          </div>
        )}
      </div>
      {canManage && (
        <div
          className="collaborator-panel-action-row collaborator-panel-manage-add"
          onClick={handleOpenOrgModal}
        >
          <div className="collaborator-panel-action-row-icon">
            <UserPlus size={14} strokeWidth={2} />
          </div>
          <Text>{t('collaborator.actions.addCollaborator')}</Text>
        </div>
      )}
    </div>
  );

  // Modal title: 左侧标题/返回，右侧头像组 | 分隔线 | 关闭按钮
  const modalTitle = (
    <div className="collaborator-panel-modal-title">
      <div className="collaborator-panel-modal-title-left">
        {panelView === 'manage' ? (
          <div
            className="collaborator-panel-manage-back"
            onClick={() => setPanelView('quick')}
          >
            <IconChevronLeft size="small" />
            <span>{t('collaborator.panel.manageTitle')}</span>
          </div>
        ) : (
          <span className="collaborator-panel-header-title">
            {t('collaborator.actions.addCollaborator')}
          </span>
        )}
      </div>
      <div className="collaborator-panel-modal-title-right">
        {renderAvatarGroup()}
        <Divider layout="vertical" style={{ height: 16, margin: '0 4px' }} />
        <Button
          icon={<X size={16} />}
          theme="borderless"
          type="tertiary"
          size="small"
          onClick={() => onVisibleChange(false)}
        />
      </div>
    </div>
  );

  return (
    <>
      <Modal
        visible={visible}
        onCancel={() => onVisibleChange(false)}
        footer={null}
        closable={false}
        title={modalTitle}
        width={480}
        className="collaborator-panel-modal"
      >
        <div className="collaborator-panel">
          {panelView === 'quick' ? renderQuickView() : renderManageView()}
        </div>
      </Modal>
      <CollaboratorAddModal
        visible={addModalVisible}
        onClose={handleAddModalClose}
        onSuccess={handleAddSuccess}
        assetType={assetType}
        assetId={assetId}
        existingCollaborators={collaborators}
      />
    </>
  );
};

export default CollaboratorPanel;
