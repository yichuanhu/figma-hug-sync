/**
 * WorkspaceSelect — 选择资产所属工作空间（按项目分组）
 * - 用于流程/参数/凭据等资产创建时强制归属
 * - 可按部门过滤（仅展示与指定部门匹配的工作空间）
 */
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Select, Tag, Typography } from '@douyinfe/semi-ui';
import { Folder } from 'lucide-react';
import { fetchProjects, fetchAllWorkspaces } from '@/pages/Requirements/RequirementsProjects/mockData';
import type { Project, Workspace } from '@/pages/Requirements/RequirementsProjects/types';

const { Text } = Typography;

interface Props {
  value?: string;
  onChange?: (workspaceId: string, workspace?: Workspace) => void;
  /** 仅展示该部门下的工作空间 */
  departmentId?: string;
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}

const WorkspaceSelect = ({
  value,
  onChange,
  departmentId,
  placeholder,
  disabled,
  style,
}: Props) => {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);

  useEffect(() => {
    Promise.all([fetchProjects(), fetchAllWorkspaces()]).then(([p, w]) => {
      setProjects(p);
      setWorkspaces(w);
    });
  }, []);

  const grouped = useMemo(() => {
    const filtered = departmentId
      ? workspaces.filter((w) => w.departmentId === departmentId)
      : workspaces;
    const map = new Map<string, Workspace[]>();
    filtered.forEach((w) => {
      const arr = map.get(w.projectId) ?? [];
      arr.push(w);
      map.set(w.projectId, arr);
    });
    return projects
      .map((p) => ({ project: p, items: map.get(p.id) ?? [] }))
      .filter((g) => g.items.length > 0);
  }, [projects, workspaces, departmentId]);

  return (
    <Select
      value={value}
      onChange={(v) => {
        const ws = workspaces.find((w) => w.id === v);
        onChange?.(v as string, ws);
      }}
      placeholder={placeholder ?? t('workspaceSelect.placeholder')}
      disabled={disabled}
      style={{ width: '100%', ...style }}
      filter
      showClear
    >
      {grouped.map((g) => (
        <Select.OptGroup label={g.project.name} key={g.project.id}>
          {g.items.map((w) => (
            <Select.Option key={w.id} value={w.id}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Folder size={14} style={{ color: 'var(--semi-color-text-2)' }} />
                <Text>{w.name}</Text>
                <Tag size="small" type="light" color="blue">
                  {w.departmentName}
                </Tag>
              </span>
            </Select.Option>
          ))}
        </Select.OptGroup>
      ))}
    </Select>
  );
};

export default WorkspaceSelect;
