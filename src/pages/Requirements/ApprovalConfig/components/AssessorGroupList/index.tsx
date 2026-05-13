/**
 * 评估人组列表编辑器
 *
 * - 评估人类型仅 specific_users（多组）
 * - 每组可设置名称、是否必需、用户列表
 */
import { Button, Input, Switch, Typography, Empty } from '@douyinfe/semi-ui';
import { Plus, Trash2 } from 'lucide-react';
import OwnerSearchSelect from '@/components/OwnerSearchSelect';
import type { AssessorGroup } from '../../mockData';

const { Text } = Typography;

interface Props {
  groups: AssessorGroup[];
  onChange: (next: AssessorGroup[]) => void;
  disabled?: boolean;
}

const AssessorGroupList = ({ groups, onChange, disabled }: Props) => {
  const update = (idx: number, patch: Partial<AssessorGroup>) =>
    onChange(groups.map((x, i) => (i === idx ? { ...x, ...patch } : x)));
  const remove = (idx: number) => onChange(groups.filter((_, i) => i !== idx));
  const add = () =>
    onChange([
      ...groups,
      {
        id: `ag-${Date.now().toString(36)}`,
        name: `评估人组 ${groups.length + 1}`,
        user_ids: [],
        required: true,
      },
    ]);

  return (
    <div className="assessor-group-list">
      <div className="section-header">
        <Text strong>评估人组</Text>
        {!disabled && (
          <Button icon={<Plus size={14} strokeWidth={2} />} size="small" onClick={add}>
            添加分组
          </Button>
        )}
      </div>
      {groups.length === 0 ? (
        <Empty description="暂无评估人组" style={{ padding: '24px 0' }} />
      ) : (
        groups.map((g, idx) => (
          <div key={g.id} className="assessor-row">
            <div className="assessor-row-body">
              <Input
                value={g.name}
                onChange={(v) => update(idx, { name: v })}
                placeholder="分组名称"
                size="small"
                disabled={disabled}
                maxLength={50}
              />
              <OwnerSearchSelect
                multiple
                size="small"
                value={g.user_ids}
                onChange={(v: string | string[]) => update(idx, { user_ids: Array.isArray(v) ? v : [] })}
                placeholder="搜索并选择评估人"
                disabled={disabled}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Switch
                  checked={g.required}
                  onChange={(v) => update(idx, { required: v })}
                  size="small"
                  disabled={disabled}
                />
                <Text size="small" type="tertiary">必需</Text>
              </div>
            </div>
            {!disabled && (
              <Button
                icon={<Trash2 size={14} strokeWidth={2} />}
                theme="borderless"
                type="danger"
                size="small"
                onClick={() => remove(idx)}
              />
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default AssessorGroupList;
