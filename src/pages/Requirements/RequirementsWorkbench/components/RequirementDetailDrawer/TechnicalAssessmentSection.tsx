import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Button, Input, InputNumber, Select, Toast } from '@douyinfe/semi-ui';
import type { RequirementItem } from '../../types';

const { Text } = Typography;

interface AssessmentFormData {
  feasibility: number;
  complexity: number;
  risk: number;
  maintainability: number;
  conclusion: string;
  comment: string;
}

interface TechnicalAssessmentSectionProps {
  data: RequirementItem;
  onStatusChange: (id: string, newStatus: string, comment?: string) => Promise<void>;
}

const defaultForm: AssessmentFormData = {
  feasibility: 80,
  complexity: 70,
  risk: 75,
  maintainability: 80,
  conclusion: 'recommend',
  comment: '',
};

const TechnicalAssessmentSection = ({ data, onStatusChange }: TechnicalAssessmentSectionProps) => {
  const { t } = useTranslation();
  const [form, setForm] = useState<AssessmentFormData>(defaultForm);
  const [submitting, setSubmitting] = useState(false);

  const isAssessing = data.status === 'ASSESSING';
  const showResult = ['DEVELOPING', 'DEVELOPED', 'RUNNING'].includes(data.status);

  if (!isAssessing && !showResult) return null;

  const totalScore = Math.round(
    (form.feasibility + form.complexity + form.risk + form.maintainability) / 4,
  );

  const conclusionOptions = [
    { value: 'recommend', label: t('requirements.detail.conclusionRecommend') },
    { value: 'conditional', label: t('requirements.detail.conclusionConditional') },
    { value: 'notRecommend', label: t('requirements.detail.conclusionNotRecommend') },
  ];

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const content = `Technical assessment completed. Score: ${totalScore}/100. ${t(`requirements.detail.conclusion`)}: ${conclusionOptions.find((o) => o.value === form.conclusion)?.label || ''}. ${form.comment ? `Note: ${form.comment}` : ''}`;
      await onStatusChange(data.id, 'DEVELOPING', content);
      Toast.success(t('requirements.detail.assessmentSubmitted'));
    } catch {
      Toast.error(t('requirements.detail.actionFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const scoreDimensions: { key: keyof Pick<AssessmentFormData, 'feasibility' | 'complexity' | 'risk' | 'maintainability'>; labelKey: string }[] = [
    { key: 'feasibility', labelKey: 'requirements.detail.feasibility' },
    { key: 'complexity', labelKey: 'requirements.detail.complexity' },
    { key: 'risk', labelKey: 'requirements.detail.riskControl' },
    { key: 'maintainability', labelKey: 'requirements.detail.maintainability' },
  ];

  return (
    <>
      <div className="requirement-detail-property-divider" />
      <div className="requirement-detail-property-group">
        <Text strong size="small" style={{ marginBottom: 8, display: 'block' }}>
          {t('requirements.detail.technicalAssessment')}
        </Text>

        {/* 只读结果展示 */}
        {showResult && (
          <>
            <div className="requirement-detail-property-item">
              <Text type="tertiary" size="small" className="requirement-detail-property-label">
                {t('requirements.detail.score')}
              </Text>
              <Text>85/100</Text>
            </div>
            <div className="requirement-detail-property-item">
              <Text type="tertiary" size="small" className="requirement-detail-property-label">
                {t('requirements.detail.conclusion')}
              </Text>
              <Text>{t('requirements.detail.recommendImplement')}</Text>
            </div>
          </>
        )}

        {/* 评估表单 - 仅 ASSESSING */}
        {isAssessing && (
          <div className="requirement-detail-assessment-form">
            {scoreDimensions.map(({ key, labelKey }) => (
              <div key={key} className="requirement-detail-assessment-row">
                <Text size="small" className="requirement-detail-assessment-label">
                  {t(labelKey)}
                </Text>
                <InputNumber
                  size="small"
                  min={0}
                  max={100}
                  value={form[key]}
                  onChange={(v) => setForm((prev) => ({ ...prev, [key]: v as number }))}
                  style={{ width: 80 }}
                  suffix="/100"
                />
              </div>
            ))}

            <div className="requirement-detail-assessment-total">
              <Text strong size="small">{t('requirements.detail.totalScore')}</Text>
              <Text strong size="small" type={totalScore >= 60 ? 'success' : 'danger'}>
                {totalScore}/100
              </Text>
            </div>

            <div className="requirement-detail-assessment-row" style={{ marginTop: 8 }}>
              <Text size="small" className="requirement-detail-assessment-label">
                {t('requirements.detail.conclusion')}
              </Text>
              <Select
                size="small"
                value={form.conclusion}
                onChange={(v) => setForm((prev) => ({ ...prev, conclusion: v as string }))}
                optionList={conclusionOptions}
                style={{ flex: 1 }}
              />
            </div>

            <Input
              placeholder={t('requirements.detail.assessmentComment')}
              value={form.comment}
              onChange={(v: string) => setForm((prev) => ({ ...prev, comment: v }))}
              style={{ marginTop: 8 }}
              maxLength={500}
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
              {t('requirements.detail.submitAssessment')}
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default TechnicalAssessmentSection;
