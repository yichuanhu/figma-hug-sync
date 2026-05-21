/**
 * 根据"激活模板/方案占用的部门"计算 DepartmentSelect 的 disabledOptions。
 *
 * 规则（STORY-001 R-04/R-08, STORY-016 v5）：
 * - 选中父部门时会自动展开为「自身 + 所有子孙」并写入绑定表，
 *   因此当某节点 X 已被其他激活模板占用时：
 *     1) X 本身禁用（直接绑定冲突）；
 *     2) X 的所有祖先节点禁用（选祖先会展开到 X，造成冲突）；
 *     3) X 的所有子孙节点禁用（其归属随 X 的父绑定锁定）。
 */
import {
  getDepartmentSubtreeIds,
  getDepartmentAncestorIds,
} from '@/mocks/departmentData';

export const computeDeptDisabledOptions = (
  occupied: Record<string, string>,
  resolveOwnerName: (ownerId: string) => string,
): Record<string, string> => {
  const map: Record<string, string> = {};
  const put = (deptId: string, ownerId: string) => {
    if (!map[deptId]) map[deptId] = `已绑定「${resolveOwnerName(ownerId)}」`;
  };

  Object.entries(occupied).forEach(([deptId, ownerId]) => {
    // 自身
    put(deptId, ownerId);
    // 子孙
    getDepartmentSubtreeIds(deptId).forEach((id) => {
      if (id !== deptId) put(id, ownerId);
    });
    // 祖先
    getDepartmentAncestorIds(deptId).forEach((id) => put(id, ownerId));
  });
  return map;
};
