import type {
  AssetCollaborator,
  CollaboratorAssetType,
  CollaboratorRole,
  CollaboratorAddItem,
  AssetDependency,
} from '@/api/index';
import { COLLABORATOR_ROLE_PRIORITY, CASCADE_RULES } from '@/api/index';

// ============= Mock 资产依赖图 =============

/** Mock 资产依赖关系 - 全面覆盖所有继承场景 */
const MOCK_DEPENDENCIES: AssetDependency[] = [
  // ===== 流程 proc-001 → 参数/凭据/队列/文件（依赖继承） =====
  { parent_type: 'PROCESS', parent_id: 'proc-001', parent_name: 'Financial Reimbursement Process', child_type: 'PARAMETER', child_id: 'param-001', child_name: 'Reimbursement Amount Limit' },
  { parent_type: 'PROCESS', parent_id: 'proc-001', parent_name: 'Financial Reimbursement Process', child_type: 'PARAMETER', child_id: 'param-002', child_name: 'Approval Threshold' },
  { parent_type: 'PROCESS', parent_id: 'proc-001', parent_name: 'Financial Reimbursement Process', child_type: 'CREDENTIAL', child_id: 'cred-001', child_name: 'SAP System Credential' },
  { parent_type: 'PROCESS', parent_id: 'proc-001', parent_name: 'Financial Reimbursement Process', child_type: 'CREDENTIAL', child_id: 'cred-002', child_name: 'Oracle ERP Credential' },
  { parent_type: 'PROCESS', parent_id: 'proc-001', parent_name: 'Financial Reimbursement Process', child_type: 'QUEUE', child_id: 'queue-001', child_name: 'Reimbursement Task Queue' },
  { parent_type: 'PROCESS', parent_id: 'proc-001', parent_name: 'Financial Reimbursement Process', child_type: 'FILE', child_id: 'file-001', child_name: 'Invoice Template' },
  { parent_type: 'PROCESS', parent_id: 'proc-001', parent_name: 'Financial Reimbursement Process', child_type: 'FILE', child_id: 'file-002', child_name: 'Reimbursement Policy Document' },

  // ===== 流程 proc-002 → 参数/凭据/队列/文件（共享子资产，多源继承场景） =====
  { parent_type: 'PROCESS', parent_id: 'proc-002', parent_name: 'Procurement Request Process', child_type: 'PARAMETER', child_id: 'param-001', child_name: 'Reimbursement Amount Limit' },
  { parent_type: 'PROCESS', parent_id: 'proc-002', parent_name: 'Procurement Request Process', child_type: 'CREDENTIAL', child_id: 'cred-001', child_name: 'SAP System Credential' },
  { parent_type: 'PROCESS', parent_id: 'proc-002', parent_name: 'Procurement Request Process', child_type: 'QUEUE', child_id: 'queue-002', child_name: 'Procurement Order Queue' },
  { parent_type: 'PROCESS', parent_id: 'proc-002', parent_name: 'Procurement Request Process', child_type: 'FILE', child_id: 'file-003', child_name: 'Purchase Order Template' },

  // ===== 流程 proc-003 → 参数/凭据（另一组依赖） =====
  { parent_type: 'PROCESS', parent_id: 'proc-003', parent_name: 'Employee Onboarding Process', child_type: 'PARAMETER', child_id: 'param-003', child_name: 'Probation Period Config' },
  { parent_type: 'PROCESS', parent_id: 'proc-003', parent_name: 'Employee Onboarding Process', child_type: 'CREDENTIAL', child_id: 'cred-003', child_name: 'HR System Credential' },
  { parent_type: 'PROCESS', parent_id: 'proc-003', parent_name: 'Employee Onboarding Process', child_type: 'QUEUE', child_id: 'queue-003', child_name: 'Onboarding Task Queue' },
  { parent_type: 'PROCESS', parent_id: 'proc-003', parent_name: 'Employee Onboarding Process', child_type: 'FILE', child_id: 'file-004', child_name: 'Employment Contract Template' },

  // ===== 流程 proc-004 → 共享凭据（三源继承场景） =====
  { parent_type: 'PROCESS', parent_id: 'proc-004', parent_name: 'Monthly Report Generation', child_type: 'CREDENTIAL', child_id: 'cred-001', child_name: 'SAP System Credential' },
  { parent_type: 'PROCESS', parent_id: 'proc-004', parent_name: 'Monthly Report Generation', child_type: 'PARAMETER', child_id: 'param-004', child_name: 'Report Output Format' },

  // ===== 机器人组 wg-001 → 机器人（层级继承） =====
  { parent_type: 'WORKER_GROUP', parent_id: 'wg-001', parent_name: 'Finance Robot Group', child_type: 'WORKER', child_id: 'worker-001', child_name: 'Finance Robot 01' },
  { parent_type: 'WORKER_GROUP', parent_id: 'wg-001', parent_name: 'Finance Robot Group', child_type: 'WORKER', child_id: 'worker-002', child_name: 'Finance Robot 02' },
  { parent_type: 'WORKER_GROUP', parent_id: 'wg-001', parent_name: 'Finance Robot Group', child_type: 'WORKER', child_id: 'worker-003', child_name: 'Finance Robot 03' },

  // ===== 机器人组 wg-002 → 机器人 =====
  { parent_type: 'WORKER_GROUP', parent_id: 'wg-002', parent_name: 'Operations Robot Group', child_type: 'WORKER', child_id: 'worker-004', child_name: 'Operations Robot 01' },
  { parent_type: 'WORKER_GROUP', parent_id: 'wg-002', parent_name: 'Operations Robot Group', child_type: 'WORKER', child_id: 'worker-005', child_name: 'Operations Robot 02' },

  // ===== 机器人组 wg-003 → 机器人 =====
  { parent_type: 'WORKER_GROUP', parent_id: 'wg-003', parent_name: 'IT Support Robot Group', child_type: 'WORKER', child_id: 'worker-006', child_name: 'IT Support Robot 01' },
];

// ============= Mock 协作者存储 =============

/** 内存中的协作者存储，按 assetType:assetId 索引 */
const collaboratorStore: Map<string, AssetCollaborator[]> = new Map();

const storeKey = (assetType: CollaboratorAssetType, assetId: string) => `${assetType}:${assetId}`;

/** 计算最终权限 = MAX(所有来源) */
const calculateFinalRole = (roles: CollaboratorRole[]): CollaboratorRole => {
  if (!roles || roles.length === 0) return 'OBSERVER';
  return roles.reduce((max, current) =>
    COLLABORATOR_ROLE_PRIORITY[current] > COLLABORATOR_ROLE_PRIORITY[max] ? current : max
  );
};

// ============= Mock 用户与部门数据 =============
// 注意：部分 user ID 与 CollaboratorAddModal 中的组织架构树 mock 数据保持一致
// 以便在添加协作者弹窗中正确展示"已添加"状态

const MOCK_USERS = {
  'user-001': { name: '张三', department: '来也科技-大客户业务中心-APA产品部-产品团队' },
  'user-n-001': { name: 'David Liu', department: 'North China Regional Solution and Delivery Team' },
  'user-003': { name: '王五', department: '来也科技-大客户业务中心-APA产品部-APA-客户端团队' },
  'user-004': { name: '赵六', department: '来也科技-大客户业务中心-南区BU' },
  'user-fin-001': { name: 'Yun Xie', department: 'Finance Department' },
  'user-fe-001': { name: 'Charles Feng', department: 'Frontend Development Team' },
  'user-hr-001': { name: 'Fei Liang', department: 'Human Resources Department' },
  'user-pt-001': { name: 'Lihong Fan', department: 'Product Team' },
  'user-dw-001': { name: 'Xuan Cai', department: 'Digital Worker Division' },
  'user-010': { name: '林晓华', department: '来也科技-法务部-合规团队' },
};

const MOCK_DEPARTMENTS = {
  'dept-finance': { name: 'Finance Department' },
  'dept-product': { name: 'APA Product Division' },
  'dept-hr': { name: 'Human Resources Department' },
  'dept-rd': { name: 'R&D Center' },
  'dept-enterprise': { name: 'Enterprise Business Center' },
};

/** 初始化 Mock 协作者数据 - 根据资产类型和ID生成丰富的场景数据 */
const initMockData = (assetType: CollaboratorAssetType, assetId: string): AssetCollaborator[] => {
  const now = new Date().toISOString();
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
  const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
  const oneWeekAgo = new Date(Date.now() - 604800000).toISOString();
  const oneMonthAgo = new Date(Date.now() - 2592000000).toISOString();

  const base: AssetCollaborator[] = [];

  // ===== 场景1: 创建者/拥有者 (所有资产都有) =====
  base.push({
    id: `${assetId}-collab-001`,
    asset_type: assetType,
    asset_id: assetId,
    collaborator_type: 'USER',
    collaborator_id: 'user-001',
    collaborator_name: MOCK_USERS['user-001'].name,
    department_name: MOCK_USERS['user-001'].department,
    role: 'MANAGER',
    added_by: 'system',
    added_by_name: '系统',
    added_time: oneMonthAgo,
    is_owner: true,
    source: 'DIRECT',
    source_types: ['DIRECT'],
    final_role: 'MANAGER',
  });

  // ===== 场景2: 直接分配的编辑者 (与org树匹配: David Liu) =====
  base.push({
    id: `${assetId}-collab-002`,
    asset_type: assetType,
    asset_id: assetId,
    collaborator_type: 'USER',
    collaborator_id: 'user-n-001',
    collaborator_name: MOCK_USERS['user-n-001'].name,
    department_name: MOCK_USERS['user-n-001'].department,
    role: 'MAINTAINER',
    added_by: 'user-001',
    added_by_name: MOCK_USERS['user-001'].name,
    added_time: oneWeekAgo,
    is_owner: false,
    source: 'DIRECT',
    source_types: ['DIRECT'],
    final_role: 'MAINTAINER',
  });

  // ===== 场景3: 直接分配的使用者 (与org树匹配: Yun Xie) =====
  base.push({
    id: `${assetId}-collab-003`,
    asset_type: assetType,
    asset_id: assetId,
    collaborator_type: 'USER',
    collaborator_id: 'user-fin-001',
    collaborator_name: MOCK_USERS['user-fin-001'].name,
    department_name: MOCK_USERS['user-fin-001'].department,
    role: 'USER',
    added_by: 'user-001',
    added_by_name: MOCK_USERS['user-001'].name,
    added_time: oneDayAgo,
    is_owner: false,
    source: 'DIRECT',
    source_types: ['DIRECT'],
    final_role: 'USER',
  });

  // ===== 场景4: 直接分配的观察者 (与org树匹配: Charles Feng) =====
  base.push({
    id: `${assetId}-collab-004`,
    asset_type: assetType,
    asset_id: assetId,
    collaborator_type: 'USER',
    collaborator_id: 'user-fe-001',
    collaborator_name: MOCK_USERS['user-fe-001'].name,
    department_name: MOCK_USERS['user-fe-001'].department,
    role: 'OBSERVER',
    added_by: 'user-001',
    added_by_name: MOCK_USERS['user-001'].name,
    added_time: oneHourAgo,
    is_owner: false,
    source: 'DIRECT',
    source_types: ['DIRECT'],
    final_role: 'OBSERVER',
  });

  // ===== 场景5: 部门协作者（与org树匹配: Finance Department） =====
  base.push({
    id: `${assetId}-collab-005`,
    asset_type: assetType,
    asset_id: assetId,
    collaborator_type: 'DEPARTMENT',
    collaborator_id: 'dept-finance',
    collaborator_name: MOCK_DEPARTMENTS['dept-finance'].name,
    role: 'USER',
    added_by: 'user-001',
    added_by_name: MOCK_USERS['user-001'].name,
    added_time: oneWeekAgo,
    is_owner: false,
    source: 'DIRECT',
    source_types: ['DIRECT'],
    final_role: 'USER',
  });

  // ===== 场景6: 另一个部门协作者（与org树匹配: R&D Center） =====
  base.push({
    id: `${assetId}-collab-006`,
    asset_type: assetType,
    asset_id: assetId,
    collaborator_type: 'DEPARTMENT',
    collaborator_id: 'dept-rd',
    collaborator_name: MOCK_DEPARTMENTS['dept-rd'].name,
    role: 'OBSERVER',
    added_by: 'user-001',
    added_by_name: MOCK_USERS['user-001'].name,
    added_time: oneDayAgo,
    is_owner: false,
    source: 'DIRECT',
    source_types: ['DIRECT'],
    final_role: 'OBSERVER',
  });

  // ===== 场景7-10: 继承协作者（仅子资产有） =====
  // 先尝试精确匹配依赖图，若无匹配则根据资产类型生成模拟继承来源
  let inheritedSources = getParentDependencies(assetType, assetId);

  // 对于有继承规则但无精确匹配的资产类型，生成虚拟继承来源
  const CHILD_ASSET_TYPES: CollaboratorAssetType[] = ['PARAMETER', 'CREDENTIAL', 'QUEUE', 'FILE', 'WORKER'];
  if (inheritedSources.length === 0 && CHILD_ASSET_TYPES.includes(assetType)) {
    if (assetType === 'WORKER') {
      inheritedSources = [
        { parent_type: 'WORKER_GROUP', parent_id: 'wg-001', parent_name: 'Finance Robot Group', child_type: assetType, child_id: assetId, child_name: '' },
      ];
    } else {
      inheritedSources = [
        { parent_type: 'PROCESS', parent_id: 'proc-001', parent_name: 'Financial Reimbursement Process', child_type: assetType, child_id: assetId, child_name: '' },
        { parent_type: 'PROCESS', parent_id: 'proc-002', parent_name: 'Procurement Request Process', child_type: assetType, child_id: assetId, child_name: '' },
      ];
    }
  }

  if (inheritedSources.length > 0) {
    const sourceType = assetType === 'WORKER' ? 'INHERITED_HIERARCHY' : 'INHERITED_DEPENDENCY';

    // 场景7: 纯继承用户（仅从一个父资产继承）
    base.push({
      id: `${assetId}-collab-007`,
      asset_type: assetType,
      asset_id: assetId,
      collaborator_type: 'USER',
      collaborator_id: 'user-003',
      collaborator_name: MOCK_USERS['user-003'].name,
      department_name: MOCK_USERS['user-003'].department,
      role: 'MAINTAINER',
      added_by: 'system',
      added_by_name: '系统',
      added_time: oneWeekAgo,
      is_owner: false,
      source: 'INHERITED',
      source_types: [sourceType],
      inheritance_sources: [{
        asset_type: inheritedSources[0].parent_type,
        asset_id: inheritedSources[0].parent_id,
        asset_name: inheritedSources[0].parent_name,
        role: 'MAINTAINER',
        source_type: sourceType,
      }],
      final_role: 'MAINTAINER',
    });

    // 场景8: 纯继承用户（观察者角色继承, 与org树匹配: Xuan Cai）
    base.push({
      id: `${assetId}-collab-008`,
      asset_type: assetType,
      asset_id: assetId,
      collaborator_type: 'USER',
      collaborator_id: 'user-dw-001',
      collaborator_name: MOCK_USERS['user-dw-001'].name,
      department_name: MOCK_USERS['user-dw-001'].department,
      role: 'OBSERVER',
      added_by: 'system',
      added_by_name: '系统',
      added_time: oneDayAgo,
      is_owner: false,
      source: 'INHERITED',
      source_types: [sourceType],
      inheritance_sources: [{
        asset_type: inheritedSources[0].parent_type,
        asset_id: inheritedSources[0].parent_id,
        asset_name: inheritedSources[0].parent_name,
        role: 'OBSERVER',
        source_type: sourceType,
      }],
      final_role: 'OBSERVER',
    });

    // 场景9: 混合来源用户（直接 + 继承, 与org树匹配: Fei Liang）
    // 直接分配 USER，继承 MAINTAINER → final_role = MAINTAINER（直接角色低于继承角色，触发警告）
    base.push({
      id: `${assetId}-collab-009`,
      asset_type: assetType,
      asset_id: assetId,
      collaborator_type: 'USER',
      collaborator_id: 'user-hr-001',
      collaborator_name: MOCK_USERS['user-hr-001'].name,
      department_name: MOCK_USERS['user-hr-001'].department,
      role: 'USER',
      added_by: 'user-001',
      added_by_name: MOCK_USERS['user-001'].name,
      added_time: oneDayAgo,
      is_owner: false,
      source: 'MIXED',
      source_types: ['DIRECT', sourceType],
      inheritance_sources: [{
        asset_type: inheritedSources[0].parent_type,
        asset_id: inheritedSources[0].parent_id,
        asset_name: inheritedSources[0].parent_name,
        role: 'MAINTAINER',
        source_type: sourceType,
      }],
      final_role: calculateFinalRole(['USER', 'MAINTAINER']), // = MAINTAINER
    });

    // 场景10: 多源继承用户（从多个父资产继承不同角色，MAX合并）
    if (inheritedSources.length > 1) {
      const multiRoles: CollaboratorRole[] = ['USER', 'MANAGER'];
      base.push({
        id: `${assetId}-collab-010`,
        asset_type: assetType,
        asset_id: assetId,
        collaborator_type: 'USER',
        collaborator_id: 'user-004',
        collaborator_name: MOCK_USERS['user-004'].name,
        department_name: MOCK_USERS['user-004'].department,
        role: 'MANAGER',
        added_by: 'system',
        added_by_name: '系统',
        added_time: oneWeekAgo,
        is_owner: false,
        source: 'INHERITED',
        source_types: [sourceType],
        inheritance_sources: inheritedSources.map((dep, idx) => ({
          asset_type: dep.parent_type,
          asset_id: dep.parent_id,
          asset_name: dep.parent_name,
          role: multiRoles[idx % multiRoles.length],
          source_type: sourceType,
        })),
        final_role: calculateFinalRole(multiRoles), // = MANAGER
      });

      // 场景11: 三源混合（直接 + 多源继承, 与org树匹配: Lihong Fan）
      // 直接分配 OBSERVER，继承 USER + MAINTAINER → final_role = MAINTAINER（直接角色低于继承角色，触发警告）
      base.push({
        id: `${assetId}-collab-011`,
        asset_type: assetType,
        asset_id: assetId,
        collaborator_type: 'USER',
        collaborator_id: 'user-pt-001',
        collaborator_name: MOCK_USERS['user-pt-001'].name,
        department_name: MOCK_USERS['user-pt-001'].department,
        role: 'OBSERVER',
        added_by: 'user-n-001',
        added_by_name: MOCK_USERS['user-n-001'].name,
        added_time: now,
        is_owner: false,
        source: 'MIXED',
        source_types: ['DIRECT', sourceType],
        inheritance_sources: inheritedSources.map((dep, idx) => ({
          asset_type: dep.parent_type,
          asset_id: dep.parent_id,
          asset_name: dep.parent_name,
          role: (['USER', 'MAINTAINER'] as CollaboratorRole[])[idx % 2],
          source_type: sourceType,
        })),
        final_role: calculateFinalRole(['OBSERVER', 'USER', 'MAINTAINER']), // = MAINTAINER
      });
    }

    // 场景12: 继承的部门协作者（与org树匹配: APA Product Division）
    base.push({
      id: `${assetId}-collab-012`,
      asset_type: assetType,
      asset_id: assetId,
      collaborator_type: 'DEPARTMENT',
      collaborator_id: 'dept-product',
      collaborator_name: MOCK_DEPARTMENTS['dept-product'].name,
      role: 'MAINTAINER',
      added_by: 'system',
      added_by_name: '系统',
      added_time: oneWeekAgo,
      is_owner: false,
      source: 'INHERITED',
      source_types: [sourceType],
      inheritance_sources: [{
        asset_type: inheritedSources[0].parent_type,
        asset_id: inheritedSources[0].parent_id,
        asset_name: inheritedSources[0].parent_name,
        role: 'MAINTAINER',
        source_type: sourceType,
      }],
      final_role: 'MAINTAINER',
    });
  }

  // ===== 场景13: 仅部门权限的用户（通过部门分配，无直接权限）=====
  base.push({
    id: `${assetId}-collab-013`,
    asset_type: assetType,
    asset_id: assetId,
    collaborator_type: 'USER',
    collaborator_id: 'user-010',
    collaborator_name: MOCK_USERS['user-010'].name,
    department_name: MOCK_USERS['user-010'].department,
    role: 'USER',
    added_by: 'system',
    added_by_name: '系统',
    added_time: oneWeekAgo,
    is_owner: false,
    source: 'DIRECT',
    source_types: ['DEPARTMENT'],
    final_role: 'USER',
  });

  return base;
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
    const existingCollab = existing.find((c) => c.collaborator_id === item.collaborator_id);
    if (existingCollab) {
      // 已存在且为纯继承 → 升级为 MIXED（直接+继承）
      if (existingCollab.source === 'INHERITED') {
        existingCollab.source = 'MIXED';
        existingCollab.role = item.role;
        if (!existingCollab.source_types) existingCollab.source_types = [];
        if (!existingCollab.source_types.includes('DIRECT')) {
          existingCollab.source_types.unshift('DIRECT');
        }
        const allRoles = [item.role, ...(existingCollab.inheritance_sources || []).map((s) => s.role)];
        existingCollab.final_role = calculateFinalRole(allRoles);
        existingCollab.added_by = 'user-001';
        existingCollab.added_by_name = MOCK_USERS['user-001'].name;
        existingCollab.added_time = now;
        directCount++;
      }
      continue;
    }
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
      added_by_name: MOCK_USERS['user-001'].name,
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
          asset_name: dep.parent_name,
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
      if (c.source === 'DIRECT' && !c.inheritance_sources?.some(
        (s) => s.asset_type === assetType && s.asset_id === assetId
      )) return true; // 保留无关直接分配
      // 移除来自当前资产的继承来源
      if (c.inheritance_sources) {
        c.inheritance_sources = c.inheritance_sources.filter(
          (s) => !(s.asset_type === assetType && s.asset_id === assetId)
        );
        if (c.inheritance_sources.length > 0) {
          // 还有其他继承来源，重新计算 MAX
          const allRoles = c.source === 'DIRECT'
            ? [c.role, ...c.inheritance_sources.map((s) => s.role)]
            : c.inheritance_sources.map((s) => s.role);
          c.final_role = calculateFinalRole(allRoles);
          return true;
        }
        // 没有继承来源了
        if (c.source === 'DIRECT') {
          // 保留直接分配，清理继承标记
          c.source_types = c.source_types?.filter((t) => t === 'DIRECT' || t === 'DEPARTMENT');
          c.final_role = c.role;
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
