import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Typography,
  Button,
  RadioGroup,
  Radio,
  Checkbox,
  Tag,
  Toast,
  TextArea,
} from '@douyinfe/semi-ui';
import type { RequirementItem, AssessmentConclusion } from '../../types';

const { Text } = Typography;

interface ScoreItem {
  key: string;
  labelKey: string;
  lowDescKey: string;
  highDescKey: string;
  score: number | null;
}

interface TechnicalAssessmentSectionProps {
  data: RequirementItem;
  onStatusChange: (id: string, newStatus: string, comment?: string) => Promise<void>;
}

const SCORE_OPTIONS = [1, 2, 3, 4, 5];

const TechnicalAssessmentSection = ({ data, onStatusChange }: TechnicalAssessmentSectionProps) => {
  const { t } = useTranslation();

  // 通用维度
  const [generalScores, setGeneralScores] = useState<Record<string, number | null>>({
    businessComplexity: null,
    resourceAvailability: null,
    externalDependency: null,
    riskLevel: null,
  });

  // UI自动化维度
  const [uiEnabled, setUiEnabled] = useState(false);
  const [uiScores, setUiScores] = useState<Record<string, number | null>>({
    systemStability: null,
    elementIdentifiability: null,
    processStandardization: null,
  });

  // ADP维度
  const [adpEnabled, setAdpEnabled] = useState(false);
  const [adpScores, setAdpScores] = useState<Record<string, number | null>>({
    documentStandardization: null,
    ocrAvailability: null,
    fieldExtractionDifficulty: null,
  });

  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isAssessing = data.status === 'PENDING_ASSESSMENT';
  const showResult = data.assessment && (['DEVELOPING', 'LAUNCHED', 'OFFLINE'] as string[]).includes(data.status);

  if (!isAssessing && !showResult) return null;

  // 计算总分
  const calcTotal = (scores: Record<string, number | null>) =>
    Object.values(scores).reduce((sum, v) => sum + (v || 0), 0) as number;

  const calcMax = (scores: Record<string, number | null>) =>
    Object.keys(scores).length * 5;

  const generalTotal = calcTotal(generalScores);
  const generalMax = calcMax(generalScores);
  const uiTotal = uiEnabled ? calcTotal(uiScores) : 0;
  const uiMax = uiEnabled ? calcMax(uiScores) : 0;
  const adpTotal = adpEnabled ? calcTotal(adpScores) : 0;
  const adpMax = adpEnabled ? calcMax(adpScores) : 0;

  const totalScore = generalTotal + uiTotal + adpTotal;
  const maxScore = generalMax + uiMax + adpMax;

  // 结论计算
  const getConclusion = (score: number): AssessmentConclusion => {
    if (score >= 15) return 'PASSED';
    if (score >= 10) return 'CONDITIONAL';
    return 'FAILED';
  };

  const conclusion = getConclusion(totalScore);
  const conclusionConfig: Record<AssessmentConclusion, { color: string; labelKey: string }> = {
    PASSED: { color: 'green', labelKey: 'requirements.assessment.passed' },
    CONDITIONAL: { color: 'orange', labelKey: 'requirements.assessment.conditional' },
    FAILED: { color: 'red', labelKey: 'requirements.assessment.failed' },
  };

  // 通用维度定义
  const generalDimensions: ScoreItem[] = [
    { key: 'businessComplexity', labelKey: 'requirements.assessment.businessComplexity', lowDescKey: 'requirements.assessment.businessComplexityLow', highDescKey: 'requirements.assessment.businessComplexityHigh', score: generalScores.businessComplexity },
    { key: 'resourceAvailability', labelKey: 'requirements.assessment.resourceAvailability', lowDescKey: 'requirements.assessment.resourceAvailabilityLow', highDescKey: 'requirements.assessment.resourceAvailabilityHigh', score: generalScores.resourceAvailability },
    { key: 'externalDependency', labelKey: 'requirements.assessment.externalDependency', lowDescKey: 'requirements.assessment.externalDependencyLow', highDescKey: 'requirements.assessment.externalDependencyHigh', score: generalScores.externalDependency },
    { key: 'riskLevel', labelKey: 'requirements.assessment.riskLevel', lowDescKey: 'requirements.assessment.riskLevelLow', highDescKey: 'requirements.assessment.riskLevelHigh', score: generalScores.riskLevel },
  ];

  const uiDimensions: ScoreItem[] = [
    { key: 'systemStability', labelKey: 'requirements.assessment.systemStability', lowDescKey: 'requirements.assessment.systemStabilityLow', highDescKey: 'requirements.assessment.systemStabilityHigh', score: uiScores.systemStability },
    { key: 'elementIdentifiability', labelKey: 'requirements.assessment.elementIdentifiability', lowDescKey: 'requirements.assessment.elementIdentifiabilityLow', highDescKey: 'requirements.assessment.elementIdentifiabilityHigh', score: uiScores.elementIdentifiability },
    { key: 'processStandardization', labelKey: 'requirements.assessment.processStandardization', lowDescKey: 'requirements.assessment.processStandardizationLow', highDescKey: 'requirements.assessment.processStandardizationHigh', score: uiScores.processStandardization },
  ];

  const adpDimensions: ScoreItem[] = [
    { key: 'documentStandardization', labelKey: 'requirements.assessment.documentStandardization', lowDescKey: 'requirements.assessment.documentStandardizationLow', highDescKey: 'requirements.assessment.documentStandardizationHigh', score: adpScores.documentStandardization },
    { key: 'ocrAvailability', labelKey: 'requirements.assessment.ocrAvailability', lowDescKey: 'requirements.assessment.ocrAvailabilityLow', highDescKey: 'requirements.assessment.ocrAvailabilityHigh', score: adpScores.ocrAvailability },
    { key: 'fieldExtractionDifficulty', labelKey: 'requirements.assessment.fieldExtractionDifficulty', lowDescKey: 'requirements.assessment.fieldExtractionDifficultyLow', highDescKey: 'requirements.assessment.fieldExtractionDifficultyHigh', score: adpScores.fieldExtractionDifficulty },
  ];

  const allGeneralFilled = Object.values(generalScores).every((v) => v !== null);

  const handleSubmit = async () => {
    if (!allGeneralFilled) {
      Toast.warning(t('requirements.assessment.generalRequired'));
      return;
    }
    setSubmitting(true);
    try {
      const content = `Technical assessment completed. Score: ${totalScore}/${maxScore}. Conclusion: ${t(conclusionConfig[conclusion].labelKey)}. ${comment ? `Note: ${comment}` : ''}`;
      const nextStatus = conclusion === 'FAILED' ? 'APPROVED' : 'DEVELOPING';
      await onStatusChange(data.id, nextStatus, content);
      Toast.success(t('requirements.assessment.submitSuccess'));
    } catch {
      Toast.error(t('requirements.detail.actionFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const renderScoreRow = (
    dim: ScoreItem,
    setFn: (key: string, val: number) => void,
  ) => (
    <div key={dim.key} className="requirement-assessment-score-row">
      <Text strong size="small" style={{ marginBottom: 4 }}>
        {t(dim.labelKey)}
      </Text>
      <RadioGroup
        type="button"
        value={dim.score}
        onChange={(e) => setFn(dim.key, e.target.value as number)}
        style={{ marginBottom: 4 }}
      >
        {SCORE_OPTIONS.map((v) => (
          <Radio key={v} value={v}>
            {v}{t('requirements.assessment.point')}
          </Radio>
        ))}
      </RadioGroup>
      <Text type="tertiary" size="small">
        1{t('requirements.assessment.point')}: {t(dim.lowDescKey)}　5{t('requirements.assessment.point')}: {t(dim.highDescKey)}
      </Text>
    </div>
  );

  return (
    <>
      <div className="requirement-detail-property-divider" />
      <div className="requirement-detail-property-group">
        <Text strong size="small" style={{ marginBottom: 12, display: 'block' }}>
          {t('requirements.detail.technicalAssessment')}
        </Text>

        {/* 只读结果展示 */}
        {showResult && data.assessment && (
          <div className="requirement-assessment-result">
            <div className="requirement-detail-property-item">
              <Text type="tertiary" size="small" className="requirement-detail-property-label">
                {t('requirements.assessment.assessor')}
              </Text>
              <Text size="small">{data.assessment.assessorName}</Text>
            </div>
            <div className="requirement-detail-property-item">
              <Text type="tertiary" size="small" className="requirement-detail-property-label">
                {t('requirements.assessment.assessedAt')}
              </Text>
              <Text size="small">{data.assessment.assessedAt.replace('T', ' ').substring(0, 16)}</Text>
            </div>

            {/* 通用维度得分 */}
            <div className="requirement-detail-property-item">
              <Text type="tertiary" size="small" className="requirement-detail-property-label">
                {t('requirements.assessment.generalDimension')}
              </Text>
              <Text size="small">
                {Object.values(data.assessment.generalScores).reduce((a, b) => a + b, 0)}/20
              </Text>
            </div>

            {data.assessment.uiAutomationScores && (
              <div className="requirement-detail-property-item">
                <Text type="tertiary" size="small" className="requirement-detail-property-label">
                  {t('requirements.assessment.uiDimension')}
                </Text>
                <Text size="small">
                  {Object.values(data.assessment.uiAutomationScores).reduce((a, b) => a + b, 0)}/15
                </Text>
              </div>
            )}

            {data.assessment.adpScores && (
              <div className="requirement-detail-property-item">
                <Text type="tertiary" size="small" className="requirement-detail-property-label">
                  {t('requirements.assessment.adpDimension')}
                </Text>
                <Text size="small">
                  {Object.values(data.assessment.adpScores).reduce((a, b) => a + b, 0)}/15
                </Text>
              </div>
            )}

            <div className="requirement-detail-property-item">
              <Text type="tertiary" size="small" className="requirement-detail-property-label">
                {t('requirements.detail.totalScore')}
              </Text>
              <Text strong size="small">
                {data.assessment.totalScore}/{data.assessment.maxScore}
              </Text>
            </div>
            <div className="requirement-detail-property-item">
              <Text type="tertiary" size="small" className="requirement-detail-property-label">
                {t('requirements.detail.conclusion')}
              </Text>
              <Tag color={conclusionConfig[data.assessment.conclusion]?.color as 'green' | 'orange' | 'red'} type="light" size="small">
                {t(conclusionConfig[data.assessment.conclusion]?.labelKey || '')}
              </Tag>
            </div>
            {data.assessment.comment && (
              <div className="requirement-detail-property-item">
                <Text type="tertiary" size="small" className="requirement-detail-property-label">
                  {t('requirements.assessment.commentLabel')}
                </Text>
                <Text size="small">{data.assessment.comment}</Text>
              </div>
            )}
          </div>
        )}

        {/* 评估表单 - 仅 ASSESSING */}
        {isAssessing && (
          <div className="requirement-assessment-form">
            {/* 通用维度 */}
            <div className="requirement-assessment-dimension-group">
              <div className="requirement-assessment-dimension-header">
                <Text strong size="small">{t('requirements.assessment.generalDimension')}</Text>
                <Tag size="small" color="red" type="light">* {t('requirements.assessment.required')}</Tag>
              </div>
              {generalDimensions.map((dim) =>
                renderScoreRow(dim, (key, val) =>
                  setGeneralScores((prev) => ({ ...prev, [key]: val })),
                ),
              )}
              <div className="requirement-assessment-subtotal">
                <Text type="tertiary" size="small">{t('requirements.assessment.subtotal')}: {generalTotal}/{generalMax}</Text>
              </div>
            </div>

            {/* UI自动化维度 */}
            <div className="requirement-assessment-dimension-group">
              <div className="requirement-assessment-dimension-header">
                <Checkbox
                  checked={uiEnabled}
                  onChange={(e) => setUiEnabled(e.target.checked as boolean)}
                >
                  <Text strong size="small">{t('requirements.assessment.uiDimension')}</Text>
                </Checkbox>
              </div>
              {uiEnabled ? (
                <>
                  {uiDimensions.map((dim) =>
                    renderScoreRow(dim, (key, val) =>
                      setUiScores((prev) => ({ ...prev, [key]: val })),
                    ),
                  )}
                  <div className="requirement-assessment-subtotal">
                    <Text type="tertiary" size="small">{t('requirements.assessment.subtotal')}: {uiTotal}/{uiMax}</Text>
                  </div>
                </>
              ) : (
                <Text type="tertiary" size="small" style={{ padding: '4px 0' }}>
                  {t('requirements.assessment.uiNotInvolved')}
                </Text>
              )}
            </div>

            {/* ADP维度 */}
            <div className="requirement-assessment-dimension-group">
              <div className="requirement-assessment-dimension-header">
                <Checkbox
                  checked={adpEnabled}
                  onChange={(e) => setAdpEnabled(e.target.checked as boolean)}
                >
                  <Text strong size="small">{t('requirements.assessment.adpDimension')}</Text>
                </Checkbox>
              </div>
              {adpEnabled ? (
                <>
                  {adpDimensions.map((dim) =>
                    renderScoreRow(dim, (key, val) =>
                      setAdpScores((prev) => ({ ...prev, [key]: val })),
                    ),
                  )}
                  <div className="requirement-assessment-subtotal">
                    <Text type="tertiary" size="small">{t('requirements.assessment.subtotal')}: {adpTotal}/{adpMax}</Text>
                  </div>
                </>
              ) : (
                <Text type="tertiary" size="small" style={{ padding: '4px 0' }}>
                  {t('requirements.assessment.adpNotInvolved')}
                </Text>
              )}
            </div>

            {/* 评估结果 */}
            <div className="requirement-assessment-result-section">
              <div className="requirement-assessment-total-row">
                <Text strong size="small">{t('requirements.detail.totalScore')}</Text>
                <Text strong size="small" type={conclusion === 'FAILED' ? 'danger' : conclusion === 'CONDITIONAL' ? 'warning' : 'success'}>
                  {totalScore}/{maxScore}
                </Text>
              </div>
              <div className="requirement-assessment-total-row">
                <Text strong size="small">{t('requirements.detail.conclusion')}</Text>
                <Tag color={conclusionConfig[conclusion].color as 'green' | 'orange' | 'red'} type="light" size="small">
                  {t(conclusionConfig[conclusion].labelKey)}
                </Tag>
              </div>

              <TextArea
                placeholder={t('requirements.assessment.commentPlaceholder')}
                value={comment}
                onChange={setComment}
                autosize={{ minRows: 2, maxRows: 4 }}
                maxCount={500}
                style={{ marginTop: 8 }}
              />

              <Button
                theme="solid"
                type="primary"
                size="small"
                loading={submitting}
                onClick={handleSubmit}
                block
                style={{ marginTop: 12 }}
              >
                {t('requirements.assessment.submit')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default TechnicalAssessmentSection;
