/**
 * 需求评估 Tab（配置驱动 + 多级串行 + A 模式：仅当前级别可编辑）
 * - 根据需求归属部门拉取激活的评估流配置；
 * - 各级别按 priority 顺序渲染卡片；
 * - 仅 status='in_progress' 且 assessor_id 命中当前用户的级别允许编辑；
 * - 维度按 input_type 渲染 tier_select 按钮 / numeric_input 数值输入；
 * - 可行性 feasibility 为下拉选择，替代旧的 conclusion。
 */
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Banner,
  Button,
  Empty,
  InputNumber,
  RadioGroup,
  Radio,
  Select,
  Tag,
  TextArea,
  Toast,
  Typography,
} from '@douyinfe/semi-ui';
import { ClipboardCheck, CheckCircle2, Clock, Layers } from 'lucide-react';
import type {
  RequirementItem,
  DetailedAssessment,
  LevelAssessmentRecord,
  DimensionAnswer,
  FeasibilityLevel,
} from '../../../types';
import {
  getActiveAssessmentFlowForDepartment,
  type AssessmentDimension,
  type AssessmentModelConfig,
} from '../../../../AssessmentConfig/mockData';
import { MOCK_CURRENT_USER_ID } from '../../../mockData';
import './index.less';

const { Text, Title } = Typography;

interface Props {
  data: RequirementItem;
  onSaveAssessment: (id: string, assessment: DetailedAssessment) => Promise<void>;
  forceReadonly?: boolean;
}

const FEASIBILITY_OPTIONS: { value: FeasibilityLevel; label: string; color: 'green' | 'orange' | 'red' }[] = [
  { value: 'feasible', label: '可行', color: 'green' },
  { value: 'not_recommended', label: '不建议', color: 'orange' },
  { value: 'not_feasible', label: '不通过', color: 'red' },
];

const feasibilityMap: Record<FeasibilityLevel, { label: string; color: 'green' | 'orange' | 'red' }> = {
  feasible: { label: '可行', color: 'green' },
  not_recommended: { label: '不建议', color: 'orange' },
  not_feasible: { label: '不通过', color: 'red' },
};

const buildEmptyAnswers = (dims: AssessmentDimension[]): DimensionAnswer[] =>
  dims.map((d) => ({
    dim_key: d.key,
    dim_name: d.name,
    tier_id: undefined,
    matched_tier_id: undefined,
    numeric_value: undefined,
    score: 0,
    weight: d.weight,
  }));

const matchNumericTier = (dim: AssessmentDimension, n: number | undefined) => {
  if (n === undefined || n === null || Number.isNaN(n)) return undefined;
  return dim.tiers.find((t) => {
    const minOk = t.min_value === undefined || t.min_value === null || n >= t.min_value;
    const maxOk = t.max_value === undefined || t.max_value === null || n < t.max_value;
    return minOk && maxOk;
  });
};

const weightedSum = (answers: DimensionAnswer[]) =>
  Number(answers.reduce((s, a) => s + a.score * a.weight, 0).toFixed(2));

const AssessmentTab = ({ data, onSaveAssessment, forceReadonly }: Props) => {
  const { t } = useTranslation();

  const flow = useMemo(
    () => getActiveAssessmentFlowForDepartment(data.owning_department_id),
    [data.owning_department_id],
  );

  // 初始化记录：若需求已有 detailedAssessment 则复用，否则按 flow 初始化空记录
  const initialAssessment: DetailedAssessment | null = useMemo(() => {
    if (!flow) return null;
    if (data.detailedAssessment && data.detailedAssessment.flow_id === flow.id) {
      return data.detailedAssessment;
    }
    const valueModel = flow.models.find((m) => m.type === 'value')!;
    const complexityModel = flow.models.find((m) => m.type === 'complexity')!;
    const records: LevelAssessmentRecord[] = flow.levels.map((lv, idx) => ({
      level_id: lv.id,
      level_name: lv.name,
      level_priority: lv.priority,
      status: idx === 0 ? 'in_progress' : 'pending',
      value_answers: buildEmptyAnswers(valueModel.dimensions),
      complexity_answers: buildEmptyAnswers(complexityModel.dimensions),
      value_score: 0,
      complexity_score: 0,
    }));
    return {
      flow_id: flow.id,
      flow_name: flow.name,
      records,
      current_level_priority: 1,
    };
  }, [flow, data.detailedAssessment]);

  const [assessment, setAssessment] = useState<DetailedAssessment | null>(initialAssessment);
  useEffect(() => setAssessment(initialAssessment), [initialAssessment]);

  const [submitting, setSubmitting] = useState(false);

  if (!flow || !assessment) {
    return (
      <div style={{ padding: 24 }}>
        <Empty
          title="尚未配置评估流"
          description="该需求所属部门暂未匹配到激活的评估流模板，请在「评估流配置」中先配置并启用。"
        />
      </div>
    );
  }

  const valueModel = flow.models.find((m) => m.type === 'value')!;
  const complexityModel = flow.models.find((m) => m.type === 'complexity')!;

  /** 当前用户可编辑的级别 */
  const editableLevel = (record: LevelAssessmentRecord) => {
    if (forceReadonly) return false;
    if (record.status !== 'in_progress') return false;
    const lv = flow.levels.find((l) => l.id === record.level_id);
    if (!lv) return false;
    if (lv.assessor_type === 'department_leader') return true; // mock：默认允许
    return lv.assessor_ids.includes(MOCK_CURRENT_USER_ID);
  };

  const patchRecord = (recordIdx: number, patch: Partial<LevelAssessmentRecord>) => {
    setAssessment((prev) => {
      if (!prev) return prev;
      const next = { ...prev, records: prev.records.map((r, i) => (i === recordIdx ? { ...r, ...patch } : r)) };
      return next;
    });
  };

  const patchAnswer = (
    recordIdx: number,
    modelType: 'value' | 'complexity',
    dimKey: string,
    patch: Partial<DimensionAnswer>,
  ) => {
    setAssessment((prev) => {
      if (!prev) return prev;
      const record = prev.records[recordIdx];
      const key = modelType === 'value' ? 'value_answers' : 'complexity_answers';
      const nextAnswers = record[key].map((a) => (a.dim_key === dimKey ? { ...a, ...patch } : a));
      const nextRecord: LevelAssessmentRecord = { ...record, [key]: nextAnswers };
      nextRecord.value_score = weightedSum(nextRecord.value_answers);
      nextRecord.complexity_score = weightedSum(nextRecord.complexity_answers);
      return { ...prev, records: prev.records.map((r, i) => (i === recordIdx ? nextRecord : r)) };
    });
  };

  const handleSubmitLevel = async (recordIdx: number) => {
    const record = assessment.records[recordIdx];
    // 校验：每个维度必须有作答
    const allDims = [...valueModel.dimensions, ...complexityModel.dimensions];
    const allAnswers = [...record.value_answers, ...record.complexity_answers];
    for (const dim of allDims) {
      const ans = allAnswers.find((a) => a.dim_key === dim.key);
      if (!ans) continue;
      if (dim.input_type === 'tier_select' && !ans.tier_id) {
        Toast.warning(`「${dim.name}」请选择档位`);
        return;
      }
      if (dim.input_type === 'numeric_input' && (ans.numeric_value === undefined || ans.numeric_value === null)) {
        Toast.warning(`「${dim.name}」请填写数值`);
        return;
      }
    }
    if (!record.feasibility) {
      Toast.warning('请选择可行性判断');
      return;
    }
    setSubmitting(true);
    try {
      const completed: LevelAssessmentRecord = {
        ...record,
        status: 'completed',
        assessor_id: MOCK_CURRENT_USER_ID,
        assessor_name: 'Angela Wu',
        assessed_at: new Date().toISOString(),
      };
      const nextRecords = assessment.records.map((r, i) => {
        if (i === recordIdx) return completed;
        if (i === recordIdx + 1 && r.status === 'pending') return { ...r, status: 'in_progress' as const };
        return r;
      });
      const completedCount = nextRecords.filter((r) => r.status === 'completed').length;
      const next: DetailedAssessment = {
        ...assessment,
        records: nextRecords,
        current_level_priority: Math.min(completedCount + 1, flow.levels.length),
        feasibility: completed.feasibility,
        netScore: Number((completed.value_score - completed.complexity_score).toFixed(2)),
        assessorId: completed.assessor_id,
        assessorName: completed.assessor_name,
        assessedAt: completed.assessed_at,
      };
      await onSaveAssessment(data.id, next);
      Toast.success('当前级别评估已提交');
    } finally {
      setSubmitting(false);
    }
  };

  const renderDimension = (
    dim: AssessmentDimension,
    answer: DimensionAnswer,
    editable: boolean,
    onChange: (patch: Partial<DimensionAnswer>) => void,
  ) => {
    if (dim.input_type === 'tier_select') {
      return (
        <div className="assessment-dim-row" key={dim.key}>
          <Text size="small" strong>
            {dim.name} <Text type="tertiary" size="small">（权重 {dim.weight}）</Text>
          </Text>
          <RadioGroup
            type="button"
            direction="vertical"
            className="assessment-tier-group"
            value={answer.tier_id}
            disabled={!editable}
            onChange={(e) => {
              const tier = dim.tiers.find((tt) => tt.id === e.target.value);
              onChange({ tier_id: e.target.value as string, score: tier?.score ?? 0 });
            }}
          >
            {dim.tiers.map((tier) => (
              <Radio key={tier.id} value={tier.id}>
                <span className="assessment-tier-label">
                  {tier.label} ({tier.score})
                </span>
              </Radio>
            ))}
          </RadioGroup>
        </div>
      );
    }
    return (
      <div className="assessment-dim-row" key={dim.key}>
        <Text size="small" strong>
          {dim.name} <Text type="tertiary" size="small">（权重 {dim.weight}，单位 {dim.unit}）</Text>
        </Text>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <InputNumber
            value={answer.numeric_value}
            disabled={!editable}
            placeholder="填写数值"
            style={{ width: 200 }}
            onChange={(v) => {
              const n = v === '' || v === undefined ? undefined : Number(v);
              const matched = matchNumericTier(dim, n);
              onChange({
                numeric_value: n,
                matched_tier_id: matched?.id,
                score: matched?.score ?? 0,
              });
            }}
          />
          {answer.matched_tier_id && (
            <Tag color="blue" type="light" size="small">
              命中：{dim.tiers.find((tt) => tt.id === answer.matched_tier_id)?.label} ({answer.score})
            </Tag>
          )}
        </div>
      </div>
    );
  };

  const renderModelCard = (
    model: AssessmentModelConfig,
    answers: DimensionAnswer[],
    score: number,
    editable: boolean,
    onChangeAnswer: (dimKey: string, patch: Partial<DimensionAnswer>) => void,
  ) => (
    <div className={`assessment-card assessment-card-${model.type === 'value' ? 'value' : 'complex'}`}>
      <div className="assessment-card-header">
        <Text strong>{model.name}</Text>
        <Tag color={model.type === 'value' ? 'blue' : 'purple'} type="light" size="small">
          加权得分：{score.toFixed(2)}
        </Tag>
      </div>
      {model.dimensions.map((dim) => {
        const ans =
          answers.find((a) => a.dim_key === dim.key) ?? {
            dim_key: dim.key,
            dim_name: dim.name,
            score: 0,
            weight: dim.weight,
          };
        return renderDimension(dim, ans, editable, (p) => onChangeAnswer(dim.key, p));
      })}
    </div>
  );

  return (
    <div className="assessment-tab-content">



      {(() => {
        const myRecords = assessment.records
          .map((r, i) => ({ r, i }))
          .filter(({ r }) => {
            const lv = flow.levels.find((l) => l.id === r.level_id);
            if (!lv) return false;
            if (lv.assessor_type === 'department_leader') return true;
            return lv.assessor_ids.includes(MOCK_CURRENT_USER_ID);
          });
        if (myRecords.length === 0) {
          return (
            <Empty title="暂无您负责的评估级别" description="当前评估流未将您列为任一级别的评估人。" />
          );
        }
        return myRecords.map(({ r: record, i: idx }) => {
        const editable = editableLevel(record);
        const statusTag =
          record.status === 'completed' ? (
            <Tag color="green" type="light" prefixIcon={<CheckCircle2 size={12} strokeWidth={2} />}>
              已完成
            </Tag>
          ) : record.status === 'in_progress' ? (
            <Tag color="blue" type="light" prefixIcon={<Clock size={12} strokeWidth={2} />}>
              进行中
            </Tag>
          ) : (
            <Tag color="grey" type="light">
              待开始
            </Tag>
          );

        return (
          <div key={record.level_id} className="assessment-level-card">
            <div className="assessment-level-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Tag color="blue" type="light" size="small">L{record.level_priority}</Tag>
                <Title heading={6} style={{ margin: 0 }}>{record.level_name}</Title>
                {statusTag}
              </div>
              {record.status === 'completed' && record.feasibility && (
                <Tag color={feasibilityMap[record.feasibility].color} type="light">
                  {feasibilityMap[record.feasibility].label}
                </Tag>
              )}
            </div>

            {record.status === 'pending' ? (
              <Text type="tertiary">前序级别评估通过后开放。</Text>
            ) : (
              <>
                <div className="assessment-cards-row">
                  {renderModelCard(
                    valueModel,
                    record.value_answers,
                    record.value_score,
                    editable,
                    (key, p) => patchAnswer(idx, 'value', key, p),
                  )}
                  {renderModelCard(
                    complexityModel,
                    record.complexity_answers,
                    record.complexity_score,
                    editable,
                    (key, p) => patchAnswer(idx, 'complexity', key, p),
                  )}
                </div>

                <div className="assessment-result">
                  <div className="assessment-result-row">
                    <Text type="tertiary">净得分（价值 − 复杂度）</Text>
                    <Title heading={4} style={{ margin: 0 }}>
                      {(record.value_score - record.complexity_score).toFixed(2)}
                    </Title>
                  </div>
                  <div className="assessment-result-row">
                    <Text type="tertiary">可行性判断</Text>
                    <Select
                      value={record.feasibility}
                      disabled={!editable}
                      placeholder="请选择"
                      style={{ width: 200 }}
                      optionList={FEASIBILITY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                      onChange={(v) => patchRecord(idx, { feasibility: v as FeasibilityLevel })}
                    />
                  </div>
                  {editable ? (
                    <>
                      <TextArea
                        placeholder="评估说明（可选，最多 500 字）"
                        value={record.comment ?? ''}
                        onChange={(v) => patchRecord(idx, { comment: v })}
                        autosize={{ minRows: 3, maxRows: 5 }}
                        maxCount={500}
                        showClear
                        className="assessment-result-textarea"
                      />
                      <Button
                        theme="solid"
                        type="primary"
                        loading={submitting}
                        onClick={() => handleSubmitLevel(idx)}
                        className="assessment-result-submit"
                        block
                      >
                        提交本级评估
                      </Button>
                    </>
                  ) : (
                    (record.comment || record.assessor_name) && (
                      <div className="assessment-result-readonly">
                        {record.comment && (
                          <>
                            <Text type="tertiary" size="small">评估说明</Text>
                            <Text>{record.comment}</Text>
                          </>
                        )}
                        {record.assessor_name && (
                          <Text type="tertiary" size="small">
                            {record.assessor_name} · {record.assessed_at?.replace('T', ' ').substring(0, 16)}
                          </Text>
                        )}
                      </div>
                    )
                  )}
                </div>
              </>
            )}
          </div>
        );
      });
      })()}
    </div>
  );
};

export default AssessmentTab;
