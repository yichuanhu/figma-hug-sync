import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Banner, Button, RadioGroup, Radio, Tag, Toast, Typography, TextArea } from '@douyinfe/semi-ui';
import { ClipboardCheck } from 'lucide-react';
import type {
  RequirementItem,
  AssessmentDimensionScore,
  AssessmentScore,
  AssessmentConclusionV2,
  DetailedAssessment,
} from '../../../types';
import './index.less';

const { Text, Title } = Typography;

const VALUE_DIMS = [
  { key: 'strategicAlignment', labelKey: 'requirements.assessmentV2.dim.strategicAlignment' },
  { key: 'benefitScale', labelKey: 'requirements.assessmentV2.dim.benefitScale' },
  { key: 'urgency', labelKey: 'requirements.assessmentV2.dim.urgency' },
];
const COMPLEX_DIMS = [
  { key: 'implementationDifficulty', labelKey: 'requirements.assessmentV2.dim.implementationDifficulty' },
  { key: 'dependencyComplexity', labelKey: 'requirements.assessmentV2.dim.dependencyComplexity' },
  { key: 'risk', labelKey: 'requirements.assessmentV2.dim.risk' },
];

const initialScores = (dims: { key: string }[]): Record<string, AssessmentScore> =>
  Object.fromEntries(dims.map((d) => [d.key, 3 as AssessmentScore]));

const conclusionOf = (net: number): AssessmentConclusionV2 => {
  if (net >= 5) return 'RECOMMEND';
  if (net >= 0) return 'CAUTION';
  return 'REJECT';
};

const conclusionTagColor: Record<AssessmentConclusionV2, 'green' | 'orange' | 'red'> = {
  RECOMMEND: 'green',
  CAUTION: 'orange',
  REJECT: 'red',
};

interface Props {
  data: RequirementItem;
  onSaveAssessment: (id: string, assessment: DetailedAssessment) => Promise<void>;
  forceReadonly?: boolean;
}

const AssessmentTab = ({ data, onSaveAssessment, forceReadonly }: Props) => {
  const { t } = useTranslation();
  const existing = data.detailedAssessment;
  const readonly =
    !!forceReadonly ||
    !!existing ||
    !(['PENDING_ASSESSMENT'] as string[]).includes(data.status);

  const [valueScores, setValueScores] = useState<Record<string, AssessmentScore>>(
    () => Object.fromEntries(
      (existing?.valueDimensions ?? VALUE_DIMS.map((d) => ({ key: d.key, score: 3 as AssessmentScore })))
        .map((d) => [d.key, d.score]),
    ) as Record<string, AssessmentScore>,
  );
  const [complexityScores, setComplexityScores] = useState<Record<string, AssessmentScore>>(
    () => Object.fromEntries(
      (existing?.complexityDimensions ?? COMPLEX_DIMS.map((d) => ({ key: d.key, score: 3 as AssessmentScore })))
        .map((d) => [d.key, d.score]),
    ) as Record<string, AssessmentScore>,
  );
  const [comment, setComment] = useState(existing?.comment ?? '');
  const [submitting, setSubmitting] = useState(false);

  const valueTotal = useMemo(() => Object.values(valueScores).reduce((a, b) => a + b, 0), [valueScores]);
  const complexityTotal = useMemo(() => Object.values(complexityScores).reduce((a, b) => a + b, 0), [complexityScores]);
  const netScore = valueTotal - complexityTotal;
  const conclusion = conclusionOf(netScore);

  const renderScoreCard = (
    title: string,
    dims: { key: string; labelKey: string }[],
    scores: Record<string, AssessmentScore>,
    setScores: (next: Record<string, AssessmentScore>) => void,
    subtotal: number,
    accent: 'value' | 'complex',
  ) => (
    <div className={`assessment-card assessment-card-${accent}`}>
      <div className="assessment-card-header">
        <Text strong>{title}</Text>
        <Tag color={accent === 'value' ? 'blue' : 'purple'} type="light" size="small">
          {t('requirements.assessmentV2.subtotal')}: {subtotal}
        </Tag>
      </div>
      {dims.map((dim) => (
        <div key={dim.key} className="assessment-dim-row">
          <Text size="small" strong>
            {t(dim.labelKey)}
          </Text>
          <RadioGroup
            type="button"
            value={scores[dim.key]}
            disabled={readonly}
            onChange={(e) => setScores({ ...scores, [dim.key]: e.target.value as AssessmentScore })}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <Radio key={n} value={n}>{n}</Radio>
            ))}
          </RadioGroup>
        </div>
      ))}
    </div>
  );

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const assessment: DetailedAssessment = {
        valueDimensions: VALUE_DIMS.map((d) => ({ key: d.key, score: valueScores[d.key] })),
        complexityDimensions: COMPLEX_DIMS.map((d) => ({ key: d.key, score: complexityScores[d.key] })),
        netScore,
        conclusion,
        assessorId: 'user-008',
        assessorName: 'Angela Wu',
        assessedAt: new Date().toISOString(),
        comment: comment.trim() || undefined,
      };
      await onSaveAssessment(data.id, assessment);
      Toast.success(t('requirements.assessmentV2.submitSuccess'));
    } finally {
      setSubmitting(false);
    }
  };

  // 顶部状态 Banner
  let bannerType: 'info' | 'warning' | 'success' | 'danger' = 'info';
  let bannerText = t('requirements.assessmentV2.banner.notStarted');
  if (existing) {
    bannerType = existing.conclusion === 'REJECT' ? 'danger' : existing.conclusion === 'CAUTION' ? 'warning' : 'success';
    bannerText = t('requirements.assessmentV2.banner.completedBy', {
      name: existing.assessorName,
      time: existing.assessedAt.replace('T', ' ').substring(0, 16),
    });
  } else if (data.status === 'PENDING_ASSESSMENT') {
    bannerType = 'warning';
    bannerText = t('requirements.assessmentV2.banner.assessing');
  }

  return (
    <div className="assessment-tab-content">
      <Banner
        type={bannerType}
        description={bannerText}
        icon={<ClipboardCheck size={16} strokeWidth={2} />}
        closeIcon={null}
      />

      <div className="assessment-cards-row">
        {renderScoreCard(
          t('requirements.assessmentV2.valueCard'),
          VALUE_DIMS,
          valueScores,
          setValueScores,
          valueTotal,
          'value',
        )}
        {renderScoreCard(
          t('requirements.assessmentV2.complexityCard'),
          COMPLEX_DIMS,
          complexityScores,
          setComplexityScores,
          complexityTotal,
          'complex',
        )}
      </div>

      <div className="assessment-result">
        <div className="assessment-result-row">
          <Text type="tertiary">{t('requirements.assessmentV2.netScore')}</Text>
          <Title heading={4} style={{ margin: 0 }}>
            {netScore > 0 ? `+${netScore}` : netScore}
          </Title>
        </div>
        <div className="assessment-result-row">
          <Text type="tertiary">{t('requirements.assessmentV2.recommendation')}</Text>
          <Tag color={conclusionTagColor[conclusion]} type="light" size="large">
            {t(`requirements.assessmentV2.conclusion.${conclusion}`)}
          </Tag>
        </div>
        {!readonly && (
          <>
            <TextArea
              placeholder={t('requirements.assessmentV2.commentPlaceholder')}
              value={comment}
              onChange={setComment}
              autosize={{ minRows: 2, maxRows: 4 }}
              maxCount={500}
              showClear
              style={{ marginTop: 12 }}
            />
            <Button
              theme="solid"
              type="primary"
              loading={submitting}
              onClick={handleSubmit}
              style={{ marginTop: 12 }}
              block
            >
              {t('requirements.assessmentV2.submit')}
            </Button>
          </>
        )}
        {readonly && existing?.comment && (
          <div style={{ marginTop: 12 }}>
            <Text type="tertiary" size="small" style={{ display: 'block', marginBottom: 4 }}>
              {t('requirements.assessmentV2.commentLabel')}
            </Text>
            <Text>{existing.comment}</Text>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssessmentTab;
