import { useTranslation } from 'react-i18next';
import { Button, Input, InputNumber, Select, Typography, Tag, Empty, Tooltip } from '@douyinfe/semi-ui';
import { Plus, Trash2, HelpCircle } from 'lucide-react';
import type {
  AssessmentModel,
  AssessmentDimension,
  AssessmentTier,
  SchemeField,
} from '@/pages/Requirements/RequirementsWorkbench/types';

const { Text } = Typography;

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
  weight: 0.5,
  dimension_type: 'manual_score',
  tiers: [
    { label: '高', condition: '>=80', score: 100 },
    { label: '中', condition: '60~79', score: 75 },
    { label: '低', condition: '<60', score: 40 },
  ],
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

  const totalWeight = model.dimensions.reduce((s, d) => s + (d.weight || 0), 0);
  const weightOk = Math.abs(totalWeight - 1) < 0.01 || model.dimensions.length === 0;
  const isValue = model.type === 'value';

  return (
    <div className="model-card">
      <div className="model-card-header">
        <div className="model-card-title">
          <Text strong style={{ fontSize: 14 }}>{model.label}</Text>
          <Tag color={isValue ? 'green' : 'purple'} type="light" size="small">
            {isValue ? '价值' : '复杂度'}
          </Tag>
          {!weightOk && (
            <Tag color="red" type="light" size="small">
              权重 Σ = {totalWeight.toFixed(2)} 应等于 1.0
            </Tag>
          )}
        </div>
        <div className="model-card-actions">
          <Button
            icon={<Plus size={14} strokeWidth={2} />}
            theme="borderless"
            size="small"
            onClick={() => onChange({ ...model, dimensions: [...model.dimensions, newDimension()] })}
          >
            添加维度
          </Button>
          <Button
            icon={<Trash2 size={14} strokeWidth={2} />}
            theme="borderless"
            type="danger"
            size="small"
            onClick={onDelete}
          />
        </div>
      </div>

      <Input
        value={model.description ?? ''}
        onChange={(v) => onChange({ ...model, description: v })}
        placeholder={isValue ? '基于业务收益与战略契合度评估需求价值' : '基于实施周期与技术难度评估需求复杂度'}
        borderless
        size="small"
        className="model-card-desc"
      />

      {model.dimensions.length === 0 && (
        <Empty description={<Text type="tertiary" size="small">暂无维度，点击右上角「添加维度」</Text>} style={{ padding: '20px 0' }} />
      )}

      {model.dimensions.map((d, idx) => (
        <div key={`${d.key}-${idx}`} className="dimension-card">
          <div className="dim-header">
            <Input
              value={d.label}
              onChange={(v) => updateDim(idx, { ...d, label: v })}
              style={{ width: 180 }}
              placeholder="维度名称"
            />
            <div className="dim-weight">
              <Text type="tertiary" size="small">权重</Text>
              <Tooltip content="所有维度权重之和需等于 1.0" position="top">
                <InputNumber
                  value={d.weight}
                  onChange={(v) => updateDim(idx, { ...d, weight: Number(v) || 0 })}
                  step={0.05}
                  min={0}
                  max={1}
                  precision={2}
                  style={{ width: 90 }}
                />
              </Tooltip>
            </div>
            <Select
              value={d.dimension_type ?? 'manual_score'}
              onChange={(v) => updateDim(idx, { ...d, dimension_type: v as 'auto_calculated' | 'manual_score' })}
              style={{ width: 120 }}
              optionList={[
                { label: '人工打分', value: 'manual_score' },
                { label: '自动计算', value: 'auto_calculated' },
              ]}
            />
            <Button
              icon={<Trash2 size={14} strokeWidth={2} />}
              theme="borderless"
              type="danger"
              size="small"
              onClick={() => removeDim(idx)}
            />
          </div>

          {d.dimension_type === 'auto_calculated' ? (
            <Input
              value={d.expression}
              onChange={(v) => updateDim(idx, { ...d, expression: v })}
              placeholder="表达式，如 {工时}*{单价}/60"
              style={{ marginTop: 8 }}
            />
          ) : d.dimension_type === 'manual_score' && fields.length > 0 ? (
            <Select
              value={d.source_field}
              onChange={(v) => updateDim(idx, { ...d, source_field: v as string })}
              placeholder="选择来源字段（可选）"
              style={{ marginTop: 8, width: '100%' }}
              showClear
              optionList={fields.map((f) => ({ label: f.label, value: f.key }))}
            />
          ) : null}

          <div className="tier-list">
            <div className="tier-header">
              <span className="col-label">档位标签</span>
              <span className="col-cond">
                判定条件
                <Tooltip content="支持 >=80、60~79、<60、==A 等表达式" position="top">
                  <HelpCircle size={12} strokeWidth={2} style={{ color: 'var(--semi-color-text-2)', cursor: 'pointer', marginLeft: 4, verticalAlign: '-2px' }} />
                </Tooltip>
              </span>
              <span className="col-score">得分</span>
              <span className="col-action" />
            </div>
            {(d.tiers ?? []).map((tier, ti) => (
              <div key={ti} className="tier-row">
                <Input
                  value={tier.label}
                  onChange={(v) => updateDim(idx, { ...d, tiers: d.tiers!.map((x, i) => i === ti ? { ...x, label: v } : x) })}
                  placeholder="如：高"
                  className="col-label"
                />
                <Input
                  value={tier.condition}
                  onChange={(v) => updateDim(idx, { ...d, tiers: d.tiers!.map((x, i) => i === ti ? { ...x, condition: v } : x) })}
                  placeholder=">=80"
                  className="col-cond"
                />
                <InputNumber
                  value={tier.score}
                  onChange={(v) => updateDim(idx, { ...d, tiers: d.tiers!.map((x, i) => i === ti ? { ...x, score: Number(v) || 0 } : x) })}
                  placeholder="0-100"
                  min={0}
                  max={100}
                  className="col-score"
                />
                <Button
                  icon={<Trash2 size={14} strokeWidth={2} />}
                  theme="borderless"
                  type="danger"
                  size="small"
                  className="col-action"
                  onClick={() => updateDim(idx, { ...d, tiers: d.tiers!.filter((_, i) => i !== ti) })}
                />
              </div>
            ))}
            <Button
              icon={<Plus size={12} strokeWidth={2} />}
              theme="borderless"
              size="small"
              style={{ alignSelf: 'flex-start', marginTop: 4 }}
              onClick={() => updateDim(idx, { ...d, tiers: [...(d.tiers ?? []), newTier()] })}
            >
              添加档位
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

const AssessmentBuilder = ({ valueModel, complexityModel, fields, onChange, disabled }: Props) => {
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

  if (disabled) return null;

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
