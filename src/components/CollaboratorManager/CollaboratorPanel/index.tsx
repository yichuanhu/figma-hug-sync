import { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Input,
  Tag,
  Typography,
  Toast,
  Modal,
  Popover,
  Avatar,
  AvatarGroup,
  Button,
} from '@douyinfe/semi-ui';
import {
  IconMinusCircleStroked,
  IconSearchStroked,
  IconFlowChartStroked,
  IconChevronLeft,
} from '@douyinfe/semi-icons';
import { User, UserPlus, Building2 } from 'lucide-react';
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
  children: React.ReactNode;
}

const CollaboratorPanel = ({
  assetType,
  assetId,
  context,
  canManage,
  visible,
  onVisibleChange,
  children,
}: CollaboratorPanelProps) => {
  const { t } = useTranslation();
  const [panelView, setPanelView] = useState<'quick' | 'manage'>('quick');
  const [collaborators, setCollaborators] = useState<AssetCollaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [quickAddingId, setQuickAddingId] = useState<string | null>(null);
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
      setExpandedRows(new Set());
    }
  }, [visible, loadData]);

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
                ? { backgroundColor: `var(--semi-color-${getAvatarColor(record.collaborator_name)})` }
                : { backgroundColor: '#000000', color: '#ffffff' }
            }
          >
            {record.collaborator_type === 'DEPARTMENT' ? (
              <Building2 size={14} strokeWidth={2} />
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

  // Quick view header with avatar group
  const renderQuickViewHeader = () => (
    <div className="collaborator-panel-header">
      <Text strong>{t('collaborator.tabTitle')}</Text>
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
                  : { backgroundColor: `var(--semi-color-${getAvatarColor(c.collaborator_name)})` }
              }
            >
              {c.collaborator_name.slice(0, 1)}
            </Avatar>
          ))}
        </AvatarGroup>
        <Tag size="small" type="ghost" className="collaborator-panel-count-tag">
          {t('collaborator.panel.peopleCount', { count: collaborators.length })}
        </Tag>
      </div>
    </div>
  );

  // Quick view content
  const renderQuickView = () => (
    <div className="collaborator-panel-quick">
      {renderQuickViewHeader()}
      <div className="collaborator-panel-search">
        <Input
          prefix={<IconSearchStroked />}
          placeholder={t('collaborator.addModal.searchPlaceholder')}
          value={searchValue}
          onChange={setSearchValue}
          showClear
          size="default"
        />
      </div>
      <div
        className="collaborator-panel-action-row"
        onClick={() => setAddModalVisible(true)}
      >
        <div className="collaborator-panel-action-row-icon">
          <IconFlowChartStroked size="small" />
        </div>
        <Text>{t('collaborator.panel.addFromOrg')}</Text>
      </div>
    </div>
  );

  // Manage view content
  const renderManageView = () => (
    <div className="collaborator-panel-manage">
      <div className="collaborator-panel-manage-header">
        <div
          className="collaborator-panel-manage-back"
          onClick={() => setPanelView('quick')}
        >
          <IconChevronLeft size="small" />
          <Text strong>{t('collaborator.panel.manageTitle')}</Text>
        </div>
      </div>
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
          onClick={() => setAddModalVisible(true)}
        >
          <div className="collaborator-panel-action-row-icon">
            <UserPlus size={14} strokeWidth={2} />
          </div>
          <Text>{t('collaborator.actions.addCollaborator')}</Text>
        </div>
      )}
    </div>
  );

  const panelContent = (
    <div className="collaborator-panel">
      {panelView === 'quick' ? renderQuickView() : renderManageView()}
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

  return (
    <Popover
      content={panelContent}
      visible={visible}
      onVisibleChange={onVisibleChange}
      trigger="click"
      position="bottomRight"
      showArrow={false}
      stopPropagation
    >
      {children}
    </Popover>
  );
};

export default CollaboratorPanel;
