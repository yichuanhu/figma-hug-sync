import { useTranslation } from 'react-i18next';
import { Button, Input, InputNumber, Select, Typography, Tag, Empty } from '@douyinfe/semi-ui';
import { Plus, Trash2, ArrowUp, ArrowDown, PowerOff, ArrowRight } from 'lucide-react';
import type {
  AssessmentModel,
  AssessmentDimension,
  AssessmentTier,
  SchemeField,
} from '@/pages/Requirements/RequirementsWorkbench/types';

const { Text, Title } = Typography;

interface Props {
  valueModel?: AssessmentModel;
  complexityModel?: AssessmentModel;
  fields: SchemeField[];
  onChange: (value?: AssessmentModel, complexity?: AssessmentModel) => void;
  /** 工作流是否已关闭审批；为 true 时本页禁用并展示空态 */
  disabled?: boolean;
  /** 点击空态按钮跳转到工作流配置 */
  onJumpToWorkflow?: () => void;
}

const newDimension = (): AssessmentDimension => ({
  key: `dim_${Date.now().toString(36).slice(-4)}`,
  label: '新维度',
  weight: 0.2,
  dimension_type: 'manual_score',
  tiers: [],
});

const newTier = (): AssessmentTier => ({
  condition: '>=80',
  score: 100,
  label: '新档位',
});

const ModelCard = ({
  model,
  fields,
  onChange,
  onDelete,
}: {
  model: AssessmentModel;
  fields: SchemeField[];
  onChange: (m: AssessmentModel) => void;
  onDelete: () => void;
}) => {
  const updateDim = (idx: number, patch: AssessmentDimension) => {
    onChange({ ...model, dimensions: model.dimensions.map((d, i) => (i === idx ? patch : d)) });
  };
  const removeDim = (idx: number) => {
    onChange({ ...model, dimensions: model.dimensions.filter((_, i) => i !== idx) });
  };
  const moveDim = (idx: number, dir: -1 | 1) => {
    const next = [...model.dimensions];
    const t = idx + dir;
    if (t < 0 || t >= next.length) return;
    [next[idx], next[t]] = [next[t], next[idx]];
    onChange({ ...model, dimensions: next });
  };

  const totalWeight = model.dimensions.reduce((s, d) => s + (d.weight || 0), 0);
  const weightOk = Math.abs(totalWeight - 1) < 0.01;

  return (
    <div className="model-card">
      <div className="model-card-header">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1 }}>
          <Input value={model.label} onChange={(v) => onChange({ ...model, label: v })} style={{ maxWidth: 240 }} />
          <Tag color={model.type === 'value' ? 'blue' : 'purple'} type="light" size="small">
            {model.type === 'value' ? '价值评估' : '复杂度评估'}
          </Tag>
          <Tag color={weightOk ? 'green' : 'red'} type="light" size="small">
            权重 Σ = {totalWeight.toFixed(2)} {weightOk ? '✓' : '✗ 应等于 1.0'}
          </Tag>
        </div>
        <Button icon={<Trash2 size={14} strokeWidth={2} />} theme="borderless" type="danger" size="small" onClick={onDelete} />
      </div>

      <Input value={model.description} onChange={(v) => onChange({ ...model, description: v })} placeholder="模型描述" style={{ marginBottom: 12 }} />

      {model.dimensions.length === 0 && (
        <Empty description={<Text type="tertiary" size="small">暂无维度，请添加</Text>} style={{ padding: '20px 0' }} />
      )}

      {model.dimensions.map((d, idx) => (
        <div key={`${d.key}-${idx}`} className="dimension-card">
          <div className="dim-header">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
              <Input value={d.label} onChange={(v) => updateDim(idx, { ...d, label: v })} style={{ maxWidth: 200 }} placeholder="维度名称" />
              <InputNumber value={d.weight} onChange={(v) => updateDim(idx, { ...d, weight: Number(v) || 0 })} step={0.05} min={0} max={1} prefix="权重" style={{ width: 130 }} />
              <Select value={d.dimension_type ?? 'manual_score'} onChange={(v) => updateDim(idx, { ...d, dimension_type: v as 'auto_calculated' | 'manual_score' })} style={{ width: 140 }}
                optionList={[{ label: '手动打分', value: 'manual_score' }, { label: '自动计算', value: 'auto_calculated' }]} />
              {d.dimension_type === 'auto_calculated' ? (
                <Input value={d.expression} onChange={(v) => updateDim(idx, { ...d, expression: v })} placeholder="表达式 如 {a}*{b}/60" style={{ flex: 1, minWidth: 200 }} />
              ) : (
                <Select value={d.source_field} onChange={(v) => updateDim(idx, { ...d, source_field: v as string })} placeholder="来源字段" style={{ flex: 1, minWidth: 160 }}
                  showClear optionList={fields.map((f) => ({ label: f.label, value: f.key }))} />
              )}
            </div>
            <Button icon={<ArrowUp size={12} strokeWidth={2} />} theme="borderless" type="tertiary" size="small" disabled={idx === 0} onClick={() => moveDim(idx, -1)} />
            <Button icon={<ArrowDown size={12} strokeWidth={2} />} theme="borderless" type="tertiary" size="small" disabled={idx === model.dimensions.length - 1} onClick={() => moveDim(idx, 1)} />
            <Button icon={<Trash2 size={14} strokeWidth={2} />} theme="borderless" type="danger" size="small" onClick={() => removeDim(idx)} />
          </div>

          <div className="tier-list">
            {(d.tiers ?? []).map((tier, ti) => (
              <div key={ti} style={{ display: 'flex', gap: 6 }}>
                <Input value={tier.label} onChange={(v) => updateDim(idx, { ...d, tiers: d.tiers!.map((x, i) => i === ti ? { ...x, label: v } : x) })} placeholder="档位名" style={{ width: 140 }} />
                <Input value={tier.condition} onChange={(v) => updateDim(idx, { ...d, tiers: d.tiers!.map((x, i) => i === ti ? { ...x, condition: v } : x) })} placeholder=">=80" style={{ width: 140 }} />
                <InputNumber value={tier.score} onChange={(v) => updateDim(idx, { ...d, tiers: d.tiers!.map((x, i) => i === ti ? { ...x, score: Number(v) || 0 } : x) })} placeholder="分数" style={{ width: 100 }} />
                <Button icon={<Trash2 size={14} strokeWidth={2} />} theme="borderless" type="danger" size="small"
                  onClick={() => updateDim(idx, { ...d, tiers: d.tiers!.filter((_, i) => i !== ti) })} />
              </div>
            ))}
            <Button icon={<Plus size={12} strokeWidth={2} />} theme="borderless" size="small"
              onClick={() => updateDim(idx, { ...d, tiers: [...(d.tiers ?? []), newTier()] })}>
              添加档位
            </Button>
          </div>
        </div>
      ))}

      <Button icon={<Plus size={14} strokeWidth={2} />} theme="borderless" size="small" style={{ marginTop: 8 }}
        onClick={() => onChange({ ...model, dimensions: [...model.dimensions, newDimension()] })}>
        添加维度
      </Button>
    </div>
  );
};

const AssessmentBuilder = ({ valueModel, complexityModel, fields, onChange, disabled, onJumpToWorkflow }: Props) => {
  const { t } = useTranslation();

  const addModel = (type: 'value' | 'complexity') => {
    const m: AssessmentModel = {
      key: `${type}-model-${Date.now().toString(36).slice(-4)}`,
      type,
      label: type === 'value' ? '价值评估' : '复杂度评估',
      description: '',
      dimensions: [],
      tiers: [
        { condition: '>=80', score: 100, label: '高', color: 'green' },
        { condition: '60~79', score: 75, label: '中', color: 'blue' },
        { condition: '<60', score: 40, label: '低', color: 'orange' },
      ],
    };
    if (type === 'value') onChange(m, complexityModel);
    else onChange(valueModel, m);
  };

  return (
    <div className="assessment-builder scheme-builder-pane">
      <div className="scheme-builder-section-title">
        <span className="title">{t('requirements.scheme.builder.assessment.title')}</span>
        <div>
          {!valueModel && (
            <Button icon={<Plus size={14} strokeWidth={2} />} size="small" onClick={() => addModel('value')}>添加价值评估</Button>
          )}
          {!complexityModel && (
            <Button icon={<Plus size={14} strokeWidth={2} />} size="small" style={{ marginLeft: 8 }} onClick={() => addModel('complexity')}>添加复杂度评估</Button>
          )}
        </div>
      </div>

      {!valueModel && !complexityModel && (
        <Empty description={t('requirements.scheme.builder.assessment.empty')} style={{ padding: '40px 0' }} />
      )}

      {valueModel && (
        <ModelCard
          model={valueModel}
          fields={fields}
          onChange={(m) => onChange(m, complexityModel)}
          onDelete={() => onChange(undefined, complexityModel)}
        />
      )}
      {complexityModel && (
        <ModelCard
          model={complexityModel}
          fields={fields}
          onChange={(m) => onChange(valueModel, m)}
          onDelete={() => onChange(valueModel, undefined)}
        />
      )}
    </div>
  );
};

export default AssessmentBuilder;
