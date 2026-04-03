import type {
  AssetCollaborator,
  CollaboratorAssetType,
  CollaboratorRole,
  CollaboratorAddItem,
  AssetDependency,
} from '@/api/index';
import { COLLABORATOR_ROLE_PRIORITY, CASCADE_RULES } from '@/api/index';

// ============= Mock 资产依赖图 =============

/** Mock 资产依赖关系 */
const MOCK_DEPENDENCIES: AssetDependency[] = [
  // 流程 → 参数
  { parent_type: 'PROCESS', parent_id: 'proc-001', parent_name: 'Financial Reimbursement Process', child_type: 'PARAMETER', child_id: 'param-001', child_name: 'Reimbursement Amount Limit' },
  { parent_type: 'PROCESS', parent_id: 'proc-001', parent_name: 'Financial Reimbursement Process', child_type: 'PARAMETER', child_id: 'param-002', child_name: 'Approval Threshold' },
  // 流程 → 凭据
  { parent_type: 'PROCESS', parent_id: 'proc-001', parent_name: 'Financial Reimbursement Process', child_type: 'CREDENTIAL', child_id: 'cred-001', child_name: 'SAP System Credential' },
  // 流程 → 队列
  { parent_type: 'PROCESS', parent_id: 'proc-001', parent_name: 'Financial Reimbursement Process', child_type: 'QUEUE', child_id: 'queue-001', child_name: 'Reimbursement Task Queue' },
  // 流程 → 文件
  { parent_type: 'PROCESS', parent_id: 'proc-001', parent_name: 'Financial Reimbursement Process', child_type: 'FILE', child_id: 'file-001', child_name: 'Invoice Template' },
  // 另一个流程的依赖
  { parent_type: 'PROCESS', parent_id: 'proc-002', parent_name: 'Procurement Request Process', child_type: 'PARAMETER', child_id: 'param-001', child_name: 'Reimbursement Amount Limit' },
  { parent_type: 'PROCESS', parent_id: 'proc-002', parent_name: 'Procurement Request Process', child_type: 'CREDENTIAL', child_id: 'cred-001', child_name: 'SAP System Credential' },
  // 机器人组 → 机器人
  { parent_type: 'WORKER_GROUP', parent_id: 'wg-001', parent_name: 'Finance Robot Group', child_type: 'WORKER', child_id: 'worker-001', child_name: 'Finance Robot 01' },
  { parent_type: 'WORKER_GROUP', parent_id: 'wg-001', parent_name: 'Finance Robot Group', child_type: 'WORKER', child_id: 'worker-002', child_name: 'Finance Robot 02' },
];

// ============= Mock 协作者存储 =============

/** 内存中的协作者存储，按 assetType:assetId 索引 */
const collaboratorStore: Map<string, AssetCollaborator[]> = new Map();

const storeKey = (assetType: CollaboratorAssetType, assetId: string) => `${assetType}:${assetId}`;

/** 计算最终权限 = MAX(所有来源) */
const calculateFinalRole = (roles: CollaboratorRole[]): CollaboratorRole => {
  return roles.reduce((max, current) =>
    COLLABORATOR_ROLE_PRIORITY[current] > COLLABORATOR_ROLE_PRIORITY[max] ? current : max
  );
};

/** 初始化 Mock 协作者数据 */
const initMockData = (assetType: CollaboratorAssetType, assetId: string): AssetCollaborator[] => {
  const now = new Date().toISOString();

  const baseCollaborators: AssetCollaborator[] = [
    {
      id: `${assetId}-collab-001`,
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
      source_types: ['DIRECT'],
      final_role: 'MANAGER',
    },
    {
      id: `${assetId}-collab-002`,
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
      source_types: ['DIRECT'],
      final_role: 'MAINTAINER',
    },
    {
      id: `${assetId}-collab-003`,
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
      source_types: ['DIRECT'],
      final_role: 'USER',
    },
  ];

  // 对于子资产，添加继承协作者示例
  const inheritedSources = getParentDependencies(assetType, assetId);
  if (inheritedSources.length > 0) {
    const sourceType = assetType === 'WORKER' ? 'INHERITED_HIERARCHY' : 'INHERITED_DEPENDENCY';
    baseCollaborators.push({
      id: `${assetId}-collab-004`,
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
      source_types: [sourceType],
      inheritance_sources: inheritedSources.map((dep) => ({
        asset_type: dep.parent_type,
        asset_id: dep.parent_id,
        asset_name: dep.parent_name,
        role: 'USER' as CollaboratorRole,
        source_type: sourceType,
      })),
      final_role: calculateFinalRole(['USER', 'MAINTAINER']),
    });

    // 添加一个多源继承的示例（同一用户从多个流程继承不同角色）
    if (inheritedSources.length > 1) {
      const roles: CollaboratorRole[] = ['USER', 'MAINTAINER'];
      baseCollaborators.push({
        id: `${assetId}-collab-005`,
        asset_type: assetType,
        asset_id: assetId,
        collaborator_type: 'USER',
        collaborator_id: 'user-004',
        collaborator_name: '赵六',
        department_name: '来也科技-大客户业务中心-南区BU',
        role: 'MAINTAINER',
        added_by: 'system',
        added_by_name: '系统',
        added_time: now,
        is_owner: false,
        source: 'INHERITED',
        source_types: [sourceType],
        inheritance_sources: inheritedSources.map((dep, idx) => ({
          asset_type: dep.parent_type,
          asset_id: dep.parent_id,
          asset_name: dep.parent_name,
          role: roles[idx % roles.length],
          source_type: sourceType,
        })),
        final_role: calculateFinalRole(roles),
      });
    }
  }

  return baseCollaborators;
};

// ============= 公开 API =============

/** 获取资产的下游依赖资产 */
export const getChildDependencies = (
  assetType: CollaboratorAssetType,
  assetId: string
): AssetDependency[] => {
  return MOCK_DEPENDENCIES.filter(
    (d) => d.parent_type === assetType && d.parent_id === assetId
  );
};

/** 获取资产的上游父资产（谁给它继承权限） */
export const getParentDependencies = (
  assetType: CollaboratorAssetType,
  assetId: string
): AssetDependency[] => {
  return MOCK_DEPENDENCIES.filter(
    (d) => d.child_type === assetType && d.child_id === assetId
  );
};

/** 获取协作者列表（含 MAX 权限合并） */
export const getCollaborators = (
  assetType: CollaboratorAssetType,
  assetId: string
): AssetCollaborator[] => {
  const key = storeKey(assetType, assetId);
  if (!collaboratorStore.has(key)) {
    collaboratorStore.set(key, initMockData(assetType, assetId));
  }
  return collaboratorStore.get(key)!;
};

/** 添加协作者（含级联） */
export const addCollaborators = (
  assetType: CollaboratorAssetType,
  assetId: string,
  items: CollaboratorAddItem[]
): { directCount: number; cascadeCount: number } => {
  const now = new Date().toISOString();
  const key = storeKey(assetType, assetId);
  const existing = getCollaborators(assetType, assetId);

  let directCount = 0;
  const newCollaborators: AssetCollaborator[] = [];

  for (const item of items) {
    if (existing.some((c) => c.collaborator_id === item.collaborator_id)) continue;
    directCount++;
    newCollaborators.push({
      id: `collab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      asset_type: assetType,
      asset_id: assetId,
      collaborator_type: item.collaborator_type,
      collaborator_id: item.collaborator_id,
      collaborator_name: item.collaborator_name,
      department_name: item.department_name,
      role: item.role,
      added_by: 'user-001',
      added_by_name: '张三',
      added_time: now,
      is_owner: false,
      source: 'DIRECT',
      source_types: ['DIRECT'],
      final_role: item.role,
    });
  }

  collaboratorStore.set(key, [...existing, ...newCollaborators]);

  // 级联到下游依赖资产
  let cascadeCount = 0;
  const childDeps = getChildDependencies(assetType, assetId);
  const parentAssetName = assetType === 'WORKER_GROUP' ? 'Robot Group' : 'Process';

  for (const dep of childDeps) {
    const childKey = storeKey(dep.child_type, dep.child_id);
    const childCollabs = getCollaborators(dep.child_type, dep.child_id);
    const sourceType = dep.child_type === 'WORKER' ? 'INHERITED_HIERARCHY' : 'INHERITED_DEPENDENCY';

    for (const item of items) {
      const existingChild = childCollabs.find((c) => c.collaborator_id === item.collaborator_id);
      if (existingChild) {
        // 已存在：添加继承来源，重新计算 MAX
        if (!existingChild.inheritance_sources) existingChild.inheritance_sources = [];
        existingChild.inheritance_sources.push({
          asset_type: assetType,
          asset_id: assetId,
          asset_name: `${parentAssetName} (${dep.parent_name})`,
          role: item.role,
          source_type: sourceType,
        });
        if (!existingChild.source_types) existingChild.source_types = [];
        if (!existingChild.source_types.includes(sourceType)) {
          existingChild.source_types.push(sourceType);
        }
        const allRoles = [existingChild.role, ...existingChild.inheritance_sources.map((s) => s.role)];
        existingChild.final_role = calculateFinalRole(allRoles);
      } else {
        cascadeCount++;
        childCollabs.push({
          id: `collab-inherit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          asset_type: dep.child_type,
          asset_id: dep.child_id,
          collaborator_type: item.collaborator_type,
          collaborator_id: item.collaborator_id,
          collaborator_name: item.collaborator_name,
          department_name: item.department_name,
          role: item.role,
          added_by: 'system',
          added_by_name: '系统',
          added_time: now,
          is_owner: false,
          source: 'INHERITED',
          source_types: [sourceType],
          inheritance_sources: [{
            asset_type: assetType,
            asset_id: assetId,
            asset_name: dep.parent_name,
            role: item.role,
            source_type: sourceType,
          }],
          final_role: item.role,
        });
      }
    }
    collaboratorStore.set(childKey, childCollabs);
  }

  return { directCount, cascadeCount };
};

/** 移除协作者（含级联） */
export const removeCollaborator = (
  assetType: CollaboratorAssetType,
  assetId: string,
  collaboratorId: string
): { cascadeCount: number } => {
  const key = storeKey(assetType, assetId);
  const existing = getCollaborators(assetType, assetId);
  const target = existing.find((c) => c.id === collaboratorId);
  if (!target) return { cascadeCount: 0 };

  collaboratorStore.set(key, existing.filter((c) => c.id !== collaboratorId));

  // 级联移除下游继承
  let cascadeCount = 0;
  const childDeps = getChildDependencies(assetType, assetId);
  for (const dep of childDeps) {
    const childKey = storeKey(dep.child_type, dep.child_id);
    const childCollabs = getCollaborators(dep.child_type, dep.child_id);
    const updated = childCollabs.filter((c) => {
      if (c.collaborator_id !== target.collaborator_id) return true;
      if (c.source === 'DIRECT') return true; // 保留直接分配
      // 移除来自当前资产的继承来源
      if (c.inheritance_sources) {
        c.inheritance_sources = c.inheritance_sources.filter(
          (s) => !(s.asset_type === assetType && s.asset_id === assetId)
        );
        if (c.inheritance_sources.length > 0) {
          c.final_role = calculateFinalRole(c.inheritance_sources.map((s) => s.role));
          return true;
        }
      }
      cascadeCount++;
      return false;
    });
    collaboratorStore.set(childKey, updated);
  }

  return { cascadeCount };
};

/** 更新协作者角色（含级联） */
export const updateCollaboratorRole = (
  assetType: CollaboratorAssetType,
  assetId: string,
  collaboratorId: string,
  newRole: CollaboratorRole
): { cascadeCount: number } => {
  const key = storeKey(assetType, assetId);
  const existing = getCollaborators(assetType, assetId);
  const target = existing.find((c) => c.id === collaboratorId);
  if (!target) return { cascadeCount: 0 };

  target.role = newRole;
  target.final_role = target.inheritance_sources?.length
    ? calculateFinalRole([newRole, ...target.inheritance_sources.map((s) => s.role)])
    : newRole;
  collaboratorStore.set(key, [...existing]);

  // 级联更新下游继承
  let cascadeCount = 0;
  const childDeps = getChildDependencies(assetType, assetId);
  for (const dep of childDeps) {
    const childKey = storeKey(dep.child_type, dep.child_id);
    const childCollabs = getCollaborators(dep.child_type, dep.child_id);
    for (const child of childCollabs) {
      if (child.collaborator_id !== target.collaborator_id) continue;
      if (child.inheritance_sources) {
        const src = child.inheritance_sources.find(
          (s) => s.asset_type === assetType && s.asset_id === assetId
        );
        if (src) {
          src.role = newRole;
          child.final_role = calculateFinalRole(
            child.source === 'DIRECT'
              ? [child.role, ...child.inheritance_sources.map((s) => s.role)]
              : child.inheritance_sources.map((s) => s.role)
          );
          cascadeCount++;
        }
      }
    }
    collaboratorStore.set(childKey, [...childCollabs]);
  }

  return { cascadeCount };
};

/** 获取下游依赖资产数量 */
export const getCascadeCount = (
  assetType: CollaboratorAssetType,
  assetId: string
): number => {
  return getChildDependencies(assetType, assetId).length;
};

/** 检查资产类型是否有下游级联规则 */
export const hasCascadeRules = (assetType: CollaboratorAssetType): boolean => {
  return !!(CASCADE_RULES[assetType]?.length);
};
