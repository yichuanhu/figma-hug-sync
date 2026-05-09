/**
 * 角色 / 部门占位符 → 真实审批人解析器
 *
 * 解析规则：
 * 1. approver_type === 'user'        → 直接按 user_id 查询用户
 * 2. approver_type === 'role'        → 按角色键解析（line-manager 取提交人部门主管；其它按角色映射表）
 * 3. approver_type === 'department'  → 取该部门下默认审批代表
 *
 * 解析失败时回退到模版预填的 approver_ids（视为 user_id）；仍解析不到则返回空数组（调用方需兜底）。
 */

import type { ApprovalLevelConfig, RequirementItem, ApprovalFlowApprover } from '../types';
import { mockCreators } from '../mockData';

/** 部门主管映射：dept_id → user_id */
const DEPT_MANAGER_MAP: Record<string, string> = {
  'dept-001': 'user-007', // Finance → Robert Xu
  'dept-002': 'user-002', // HR → Emily Chen
  'dept-003': 'user-008', // IT → Angela Wu
  'dept-004': 'user-004', // Procurement → Sarah Li
  'dept-005': 'user-005', // Logistics → David Zhang
  'dept-006': 'user-006', // Sales → Jessica Liu
};

/** 角色键 → 默认审批人 user_id 列表 */
const ROLE_USER_MAP: Record<string, string[]> = {
  'role-dept-head': ['user-007'],          // 部门负责人
  'role-ai-lead': ['user-008'],            // AI 团队负责人
  'role-finance-head': ['user-007'],
  'role-it-head': ['user-008'],
};

/** 部门键 → 默认审批人 user_id 列表（部门委员会等） */
const DEPT_GROUP_MAP: Record<string, string[]> = {
  'dept-committee': ['user-002', 'user-006', 'user-007'], // 需求委员会
  'dept-it': ['user-003', 'user-008'],
  'dept-001': ['user-001', 'user-007'],
  'dept-002': ['user-002'],
  'dept-003': ['user-003', 'user-008'],
  'dept-004': ['user-004'],
  'dept-005': ['user-005'],
  'dept-006': ['user-006'],
};

/** 兜底审批人（兜底之兜底，避免空数组） */
const FALLBACK_APPROVER_ID = 'user-007';

const buildApprover = (userId: string): ApprovalFlowApprover | null => {
  const u = mockCreators[userId];
  if (!u) return null;
  return { id: userId, name: u.name, status: 'PENDING' };
};

const dedupeAndBuild = (userIds: string[]): ApprovalFlowApprover[] => {
  const seen = new Set<string>();
  const out: ApprovalFlowApprover[] = [];
  for (const uid of userIds) {
    if (seen.has(uid)) continue;
    seen.add(uid);
    const a = buildApprover(uid);
    if (a) out.push(a);
  }
  return out;
};

/**
 * 解析单级审批人配置 → 真实审批人列表
 */
export const resolveApprovers = (
  level: ApprovalLevelConfig,
  requirement: Pick<RequirementItem, 'creatorId' | 'owning_department_id'>,
): ApprovalFlowApprover[] => {
  const ids = level.approver_ids ?? [];
  let resolved: string[] = [];

  if (level.approver_type === 'user') {
    resolved = ids.filter((id) => !!mockCreators[id]);
  } else if (level.approver_type === 'role') {
    for (const roleKey of ids) {
      if (roleKey === 'role-line-manager') {
        // 提交人直属主管：按提交人部门反查
        const creator = mockCreators[requirement.creatorId];
        const deptId = requirement.owning_department_id;
        const mgr = DEPT_MANAGER_MAP[deptId]
          ?? (creator ? Object.values(DEPT_MANAGER_MAP).find((u) => u !== requirement.creatorId) : undefined);
        if (mgr && mgr !== requirement.creatorId) resolved.push(mgr);
      } else {
        const mapped = ROLE_USER_MAP[roleKey];
        if (mapped) resolved.push(...mapped);
      }
    }
  } else if (level.approver_type === 'department') {
    for (const deptKey of ids) {
      const mapped = DEPT_GROUP_MAP[deptKey];
      if (mapped) resolved.push(...mapped);
    }
  }

  // 解析失败回退：把 approver_ids 视为 user_id 直查
  if (resolved.length === 0) {
    resolved = ids.filter((id) => !!mockCreators[id]);
  }

  // 兜底之兜底
  if (resolved.length === 0) {
    resolved = [FALLBACK_APPROVER_ID];
  }

  return dedupeAndBuild(resolved);
};
