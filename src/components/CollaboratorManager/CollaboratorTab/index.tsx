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
  IconDeleteStroked,
  IconSearchStroked,
  IconFlowChartStroked,
} from '@douyinfe/semi-icons';
import { User, UserPlus } from 'lucide-react';
import type {
  AssetCollaborator,
  CollaboratorAssetType,
  CollaboratorRole,
} from '@/api/index';
import CollaboratorRoleSelect from '../CollaboratorRoleSelect';
import CollaboratorAddModal from '../CollaboratorAddModal';
import EmptyState from '@/components/EmptyState';

import './index.less';

const { Text } = Typography;

// Mock 数据生成
const generateMockCollaborators = (assetType: CollaboratorAssetType, assetId: string): AssetCollaborator[] => {
  const now = new Date().toISOString();
  const collaborators: AssetCollaborator[] = [
    {
      id: 'collab-001',
      asset_type: assetType,
      asset_id: assetId,
      collaborator_type: 'USER',
      collaborator_id: 'user-001',
      collaborator_name: '张三',
      department_name: '来也科技-大客户业务中心-APA产品部-产品团队',
      role: 'MANAGER',
      added_by: 'system',
      added_by_name: '系统',
      added_time: now,
      is_owner: true,
      source: 'DIRECT',
      final_role: 'MANAGER',
    },
    {
      id: 'collab-002',
      asset_type: assetType,
      asset_id: assetId,
      collaborator_type: 'USER',
      collaborator_id: 'user-002',
      collaborator_name: '李四',
      department_name: '来也科技-大客户业务中心-北区BU-北区解决方案团队',
      role: 'MAINTAINER',
      added_by: 'user-001',
      added_by_name: '张三',
      added_time: now,
      is_owner: false,
      source: 'DIRECT',
      final_role: 'MAINTAINER',
    },
    {
      id: 'collab-003',
      asset_type: assetType,
      asset_id: assetId,
      collaborator_type: 'DEPARTMENT',
      collaborator_id: 'dept-001',
      collaborator_name: '财务部',
      role: 'USER',
      added_by: 'user-001',
      added_by_name: '张三',
      added_time: now,
      is_owner: false,
      source: 'DIRECT',
      final_role: 'USER',
    },
    {
      id: 'collab-004',
      asset_type: assetType,
      asset_id: assetId,
      collaborator_type: 'USER',
      collaborator_id: 'user-003',
      collaborator_name: '王五',
      department_name: '来也科技-大客户业务中心-APA产品部-APA-客户端团队',
      role: 'MAINTAINER',
      added_by: 'system',
      added_by_name: '系统',
      added_time: now,
      is_owner: false,
      source: 'INHERITED',
      inheritance_sources: [
        { asset_type: 'PROCESS', asset_id: 'proc-001', asset_name: '财务报销流程', role: 'USER' },
        { asset_type: 'PROCESS', asset_id: 'proc-002', asset_name: '采购申请流程', role: 'MAINTAINER' },
        { asset_type: 'PROCESS', asset_id: 'proc-003', asset_name: '报表生成流程', role: 'OBSERVER' },
      ],
      final_role: 'MAINTAINER',
    },
  ];
  return collaborators;
};

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

  const loadData = useCallback(async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 300));
    setCollaborators(generateMockCollaborators(assetType, assetId));
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
      setCollaborators((prev) =>
        prev.map((c) => (c.id === record.id ? { ...c, role: newRole, final_role: newRole } : c))
      );
      Toast.success(t('collaborator.updateSuccess'));
    },
    [t]
  );

  const handleRemove = useCallback(
    (record: AssetCollaborator) => {
      Modal.confirm({
        title: t('collaborator.removeConfirm.title'),
        icon: <IconDeleteStroked style={{ color: 'var(--semi-color-danger)' }} />,
        content: t('collaborator.removeConfirm.content', { name: record.collaborator_name }),
        okText: t('common.confirm'),
        cancelText: t('common.cancel'),
        okButtonProps: { type: 'danger' },
        onOk: async () => {
          setCollaborators((prev) => prev.filter((c) => c.id !== record.id));
          Toast.success(t('collaborator.removeSuccess'));
        },
      });
    },
    [t]
  );

  const handleAddSuccess = useCallback(() => {
    loadData();
    setAddModalVisible(false);
  }, [loadData]);

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
    if (record.source !== 'INHERITED') return null;
    const sources = record.inheritance_sources || [];
    if (sources.length === 0) return null;
    const isExpanded = expandedRows.has(record.id);
    return (
      <div className="collaborator-tab-source-detail">
        {(isExpanded ? sources : sources.slice(0, 1)).map((src, idx) => (
          <div key={idx} className="collaborator-tab-source-detail-item">
            <Text size="small" type="tertiary">
              {src.asset_name} → {t(`collaborator.roles.${src.role}`)}
            </Text>
          </div>
        ))}
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
          prefix={<IconSearch />}
          placeholder={t('collaborator.searchPlaceholder')}
          value={searchValue}
          onChange={setSearchValue}
          className="collaborator-tab-search"
          showClear
        />
        {canManage && (
          <Button
            icon={<UserPlus size={14} strokeWidth={2} />}
            onClick={() => setAddModalVisible(true)}
            className="collaborator-tab-add-btn"
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
