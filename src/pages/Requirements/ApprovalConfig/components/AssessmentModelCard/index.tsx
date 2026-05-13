/**
 * 评估模型卡片（价值/复杂度通用）
 *
 * - 模型类型固定（不可新建/删除）
 * - 维度可增删；维度包含 name/weight/source_type，自动计算时支持表达式
 * - 维度档位 label/condition/score
 */
import { Button, Input, InputNumber, Select, Typography, Empty, Tag } from '@douyinfe/semi-ui';
import { Plus, Trash2 } from 'lucide-react';
import type { AssessmentModel, AssessmentDimension, DimensionSourceType, DimensionTier } from '../../mockData';

const { Text } = Typography;

const SOURCE_OPTIONS: Array<{ value: DimensionSourceType; label: string }> = [
  { value: 'manual', label: '人工打分' },
  { value: 'auto_calculated', label: '自动计算' },
];

interface Props {
  model: AssessmentModel;
  onChange: (next: AssessmentModel) => void;
  disabled?: boolean;
}

const defaultTiers: DimensionTier[] = [
  { label: '高', condition: '>=80', score: 100 },
  { label: '中', condition: '60~79', score: 75 },
  { label: '低', condition: '<60', score: 40 },
];

const AssessmentModelCard = ({ model, onChange, disabled }: Props) => {
  const updateDim = (idx: number, patch: Partial<AssessmentDimension>) => {
    onChange({
      ...model,
      dimensions: model.dimensions.map((d, i) => (i === idx ? { ...d, ...patch } : d)),
    });
  };
  const removeDim = (idx: number) =>
    onChange({ ...model, dimensions: model.dimensions.filter((_, i) => i !== idx) });
  const addDim = () =>
    onChange({
      ...model,
      dimensions: [
        ...model.dimensions,
        {
          key: `dim_${Date.now().toString(36)}`,
          name: `维度 ${model.dimensions.length + 1}`,
          weight: 0.5,
          source_type: 'manual',
          tiers: [...defaultTiers],
        },
      ],
    });

  const updateTier = (dIdx: number, tIdx: number, patch: Partial<DimensionTier>) => {
    const dim = model.dimensions[dIdx];
    const tiers = dim.tiers.map((t, i) => (i === tIdx ? { ...t, ...patch } : t));
    updateDim(dIdx, { tiers });
  };
  const removeTier = (dIdx: number, tIdx: number) => {
    const dim = model.dimensions[dIdx];
    updateDim(dIdx, { tiers: dim.tiers.filter((_, i) => i !== tIdx) });
  };
  const addTier = (dIdx: number) => {
    const dim = model.dimensions[dIdx];
    updateDim(dIdx, { tiers: [...dim.tiers, { label: '新档位', condition: '', score: 0 }] });
  };

  return (
    <div className="assessment-model-card">
      <div className="section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Text strong>{model.label}</Text>
          <Tag color={model.type === 'value' ? 'green' : 'orange'} type="light" size="small">
            {model.type === 'value' ? '价值' : '复杂度'}
          </Tag>
        </div>
        {!disabled && (
          <Button icon={<Plus size={14} strokeWidth={2} />} size="small" onClick={addDim}>
            添加维度
          </Button>
        )}
      </div>
      {model.description && (
        <Text type="tertiary" size="small" style={{ display: 'block', marginBottom: 12 }}>
          {model.description}
        </Text>
      )}

      {model.dimensions.length === 0 ? (
        <Empty description="暂无维度" style={{ padding: '24px 0' }} />
      ) : (
        model.dimensions.map((d, dIdx) => (
          <div key={d.key} className="dimension-block">
            <div className="dimension-head">
              <Input
                value={d.name}
                onChange={(v) => updateDim(dIdx, { name: v })}
                placeholder="维度名称"
                size="small"
                style={{ width: 200 }}
                disabled={disabled}
                maxLength={30}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Text size="small" type="tertiary">权重</Text>
                <InputNumber
                  value={d.weight}
                  onChange={(v) => updateDim(dIdx, { weight: typeof v === 'number' ? v : 0 })}
                  min={0}
                  max={1}
                  step={0.05}
                  precision={2}
                  size="small"
                  style={{ width: 90 }}
                  disabled={disabled}
                />
              </div>
              <Select
                value={d.source_type}
                onChange={(v) => updateDim(dIdx, { source_type: v as DimensionSourceType })}
                optionList={SOURCE_OPTIONS}
                size="small"
                style={{ width: 110 }}
                disabled={disabled}
              />
              {d.source_type === 'auto_calculated' && (
                <Input
                  value={d.expression ?? ''}
                  onChange={(v) => updateDim(dIdx, { expression: v })}
                  placeholder="计算表达式（如 duration_days）"
                  size="small"
                  style={{ flex: 1, minWidth: 200 }}
                  disabled={disabled}
                />
              )}
              {!disabled && (
                <Button
                  icon={<Trash2 size={14} strokeWidth={2} />}
                  theme="borderless"
                  type="danger"
                  size="small"
                  onClick={() => removeDim(dIdx)}
                />
              )}
            </div>
            <div className="tier-table">
              <div className="tier-row tier-head">
                <span>档位标签</span>
                <span>判定条件</span>
                <span>得分</span>
                <span />
              </div>
              {d.tiers.map((t, tIdx) => (
                <div key={tIdx} className="tier-row">
                  <Input
                    value={t.label}
                    onChange={(v) => updateTier(dIdx, tIdx, { label: v })}
                    size="small"
                    disabled={disabled}
                    maxLength={20}
                  />
                  <Input
                    value={t.condition}
                    onChange={(v) => updateTier(dIdx, tIdx, { condition: v })}
                    placeholder=">=80 / 60~79 / <60"
                    size="small"
                    disabled={disabled}
                  />
                  <InputNumber
                    value={t.score}
                    onChange={(v) => updateTier(dIdx, tIdx, { score: typeof v === 'number' ? v : 0 })}
                    min={0}
                    max={100}
                    size="small"
                    disabled={disabled}
                  />
                  {!disabled && (
                    <Button
                      icon={<Trash2 size={12} strokeWidth={2} />}
                      theme="borderless"
                      type="danger"
                      size="small"
                      onClick={() => removeTier(dIdx, tIdx)}
                    />
                  )}
                </div>
              ))}
              {!disabled && (
                <Button
                  icon={<Plus size={12} strokeWidth={2} />}
                  size="small"
                  theme="borderless"
                  onClick={() => addTier(dIdx)}
                  style={{ marginTop: 4 }}
                >
                  添加档位
                </Button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default AssessmentModelCard;
