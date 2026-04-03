import { useState, useEffect, useMemo } from 'react';
import { COLLABORATOR_ROLE_PRIORITY } from '@/api/index';
import type { CollaboratorRole } from '@/api/index';

interface BotPermission {
  id: string;
  canUse: boolean;
  role: CollaboratorRole | null;
}

/**
 * 批量检查用户对机器人/机器人组的 USER+ 权限
 * Mock 实现：部分机器人/组设置为无权限，模拟真实场景
 */
export const useBotPermissionCheck = (ids: string[]): {
  permissions: Map<string, BotPermission>;
  loading: boolean;
} => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 150);
    return () => clearTimeout(timer);
  }, [ids]);

  // Mock: 模拟部分目标无权限
  // id 以 '002' 或 '005' 结尾的目标设为 OBSERVER（无 USER 权限）
  const permissions = useMemo(() => {
    const map = new Map<string, BotPermission>();
    ids.forEach((id) => {
      const isRestricted = id.endsWith('002') || id.endsWith('005');
      const role: CollaboratorRole = isRestricted ? 'OBSERVER' : 'USER';
      const priority = COLLABORATOR_ROLE_PRIORITY[role];
      map.set(id, {
        id,
        canUse: priority >= COLLABORATOR_ROLE_PRIORITY.USER,
        role,
      });
    });
    return map;
  }, [ids]);

  return { permissions, loading };
};
