import { useTranslation } from 'react-i18next';
import { Button, Form, Table, Input, InputNumber, Tag, Toast } from '@douyinfe/semi-ui';
import { Plus, Trash2 } from 'lucide-react';
import type { CostConfig, CostRateEntry } from '@/pages/Requirements/RequirementsWorkbench/types';

interface Props {
  cost?: CostConfig;
  onChange: (c: CostConfig) => void;
}

const CostBuilder = ({ cost, onChange }: Props) => {
  const { t } = useTranslation();
  const c: CostConfig = cost ?? { working_hours_per_day: 8, currency: 'CNY', default_rate: 500, rate_table_v2: [] };
  const list = c.rate_table_v2 ?? [];

  const updateRow = (idx: number, patch: Partial<CostRateEntry>) => {
    const next = list.map((x, i) => (i === idx ? { ...x, ...patch } : x));
    // 唯一性校验
    if (patch.level !== undefined) {
      const dup = next.some((x, i) => i !== idx && x.level === patch.level);
      if (dup) {
        Toast.error(t('requirements.scheme.builder.errors.levelDuplicate'));
        return;
      }
    }
    onChange({ ...c, rate_table_v2: next });
  };
  const removeRow = (idx: number) => onChange({ ...c, rate_table_v2: list.filter((_, i) => i !== idx) });
  const addRow = () => onChange({ ...c, rate_table_v2: [...list, { level: `level_${list.length + 1}`, label: '新岗位级别', daily_rate: 500 }] });

  return (
    <div className="cost-builder scheme-builder-pane">
      <div className="cost-section">
        <Form labelPosition="left" labelWidth={120}>
          <Form.InputNumber field="working_hours_per_day" label="每天工作时长 (小时)" initValue={c.working_hours_per_day} min={1} max={24}
            onChange={(v) => onChange({ ...c, working_hours_per_day: Number(v) || 8 })} />
          <Form.Select field="currency" label="货币单位" initValue={c.currency ?? 'CNY'} style={{ width: 200 }}
            optionList={[{ label: 'CNY 人民币', value: 'CNY' }, { label: 'USD 美元', value: 'USD' }, { label: 'EUR 欧元', value: 'EUR' }]}
            onChange={(v) => onChange({ ...c, currency: v as string })} />
          <Form.InputNumber field="default_rate" label="默认费率 (元/天)" initValue={c.default_rate} min={0}
            onChange={(v) => onChange({ ...c, default_rate: Number(v) || 0 })} />
        </Form>
      </div>

      <div className="cost-section">
        <div className="scheme-builder-section-title">
          <span className="title">岗位级别费率表</span>
          <Button icon={<Plus size={14} strokeWidth={2} />} size="small" onClick={addRow}>添加岗位级别</Button>
        </div>
        <Table
          size="small"
          dataSource={list}
          rowKey="level"
          pagination={false}
          columns={[
            {
              title: '级别 code',
              dataIndex: 'level',
              width: 200,
              render: (v: string, _r: CostRateEntry, i: number) => (
                <Input value={v} onChange={(nv) => updateRow(i, { level: nv })} size="small" />
              ),
            },
            {
              title: '显示名称',
              dataIndex: 'label',
              render: (v: string, _r: CostRateEntry, i: number) => (
                <Input value={v} onChange={(nv) => updateRow(i, { label: nv })} size="small" />
              ),
            },
            {
              title: '人天成本 (元/天)',
              dataIndex: 'daily_rate',
              width: 200,
              render: (v: number, _r: CostRateEntry, i: number) => (
                <InputNumber value={v} onChange={(nv) => updateRow(i, { daily_rate: Number(nv) || 0 })} min={0} size="small" />
              ),
            },
            {
              title: '操作',
              fixed: 'right' as const,
              width: 80,
              render: (_v, _r, i: number) => (
                <Button icon={<Trash2 size={14} strokeWidth={2} />} theme="borderless" type="danger" size="small" onClick={() => removeRow(i)} />
              ),
            },
          ]}
          empty={<div style={{ padding: 24, textAlign: 'center', color: 'var(--semi-color-text-2)' }}>暂无岗位级别，点击右上角添加</div>}
        />
      </div>
    </div>
  );
};

export default CostBuilder;
