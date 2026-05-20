/**
 * 部门绑定冲突的展示组件：在 Modal.confirm 的 content 里复用。
 * 渲染一个紧凑表格：部门 → 原归属 → 操作。
 */
import { Tag, Typography } from '@douyinfe/semi-ui';
import { ArrowRight, Building2 } from 'lucide-react';
import { getDepartmentName } from '@/mocks/departmentData';

const { Text } = Typography;

export interface ConflictRow {
  deptId: string;
  prevOwnerName: string;
}

interface Props {
  conflicts: ConflictRow[];
  /** 顶部提示文案，比如「保存后将改绑至本模板」或「启用后将自动抢占以下部门」 */
  hint: string;
  /** 操作列文案 */
  actionLabel?: string;
}

const BindingConflictContent = ({ conflicts, hint, actionLabel = '改绑至本模板' }: Props) => (
  <div>
    <div style={{ marginBottom: 12, color: 'var(--semi-color-text-1)' }}>{hint}</div>
    <div
      style={{
        border: '1px solid var(--semi-color-border)',
        borderRadius: 6,
        overflow: 'hidden',
        maxHeight: 280,
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 16px 1fr',
          gap: 8,
          padding: '8px 12px',
          background: 'var(--semi-color-fill-0)',
          fontSize: 12,
          color: 'var(--semi-color-text-2)',
          fontWeight: 500,
        }}
      >
        <span>部门</span>
        <span />
        <span>原归属 → {actionLabel}</span>
      </div>
      {conflicts.map((c) => (
        <div
          key={c.deptId}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 16px 1fr',
            gap: 8,
            padding: '8px 12px',
            alignItems: 'center',
            borderTop: '1px solid var(--semi-color-border)',
          }}
        >
          <Tag color="violet" type="light" size="small" prefixIcon={<Building2 size={12} strokeWidth={2} />}>
            {getDepartmentName(c.deptId)}
          </Tag>
          <ArrowRight size={14} strokeWidth={2} style={{ color: 'var(--semi-color-text-2)' }} />
          <Text size="small" type="secondary" ellipsis={{ showTooltip: true }} style={{ width: '100%' }}>
            {c.prevOwnerName}
          </Text>
        </div>
      ))}
    </div>
    <div style={{ marginTop: 12 }}>
      <Text size="small" type="tertiary">确认后，原模板对这些部门的绑定将被解除。</Text>
    </div>
  </div>
);

export default BindingConflictContent;
