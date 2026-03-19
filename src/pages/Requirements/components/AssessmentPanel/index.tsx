import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Typography,
  Descriptions,
  Tag,
  Button,
  Empty,
  Rating,
  Progress,
} from '@douyinfe/semi-ui';
import type { LYRequirementAssessment } from '@/api';
import UserNameWithCard from '@/components/layout/UserNameWithCard';

import './index.less';

const { Title, Text } = Typography;

interface AssessmentPanelProps {
  requirementId: string;
}

// Mock assessment data
const generateMockAssessment = (requirementId: string): LYRequirementAssessment | null => {
  const seed = requirementId.charCodeAt(requirementId.length - 1) % 10;
  if (seed < 3) return null; // 30% no assessment

  const business_value = (seed % 5) + 1;
  const technical_complexity = ((seed + 2) % 5) + 1;
  const risk_level = ((seed + 1) % 4) + 1;
  const resource_required = ((seed + 3) % 5) + 1;
  const ui_stability = ((seed + 4) % 5) + 1;
  const automation_feasibility = ((seed + 2) % 5) + 1;
  const api_availability = ((seed + 1) % 5) + 1;
  const data_quality = ((seed + 3) % 5) + 1;
  const total_score = Math.round(
    (business_value + (6 - technical_complexity) + (6 - risk_level) + (6 - resource_required) +
      ui_stability + automation_feasibility + api_availability + data_quality) / 8 * 20
  );

  const conclusions: Array<'RECOMMENDED' | 'CONDITIONAL' | 'NOT_RECOMMENDED'> = ['RECOMMENDED', 'CONDITIONAL', 'NOT_RECOMMENDED'];

  return {
    id: `assess-${requirementId}`,
    requirement_id: requirementId,
    business_value,
    technical_complexity,
    risk_level,
    resource_required,
    ui_stability,
    automation_feasibility,
    api_availability,
    data_quality,
    total_score,
    conclusion: conclusions[seed % 3],
    notes: seed % 2 === 0
      ? 'Process involves structured data with stable UI elements. API integration is straightforward. Recommend proceeding with standard RPA approach.'
      : 'Mixed complexity scenario. Some manual steps require OCR or image recognition. Suggest phased implementation with pilot testing.',
    assessor_id: `user-${seed}`,
    assessor_name: ['James Wilson', 'Emily Zhang', 'Michael Brown', 'Lisa Wang', 'David Lee'][seed % 5],
    assessed_at: '2026-03-10T14:30:00Z',
  };
};

const AssessmentPanel: React.FC<AssessmentPanelProps> = ({ requirementId }) => {
  const { t } = useTranslation();
  const assessment = useMemo(() => generateMockAssessment(requirementId), [requirementId]);

  const conclusionConfig: Record<string, { color: 'green' | 'orange' | 'red'; i18nKey: string }> = {
    RECOMMENDED: { color: 'green', i18nKey: 'requirement.assessment.conclusion.RECOMMENDED' },
    CONDITIONAL: { color: 'orange', i18nKey: 'requirement.assessment.conclusion.CONDITIONAL' },
    NOT_RECOMMENDED: { color: 'red', i18nKey: 'requirement.assessment.conclusion.NOT_RECOMMENDED' },
  };

  if (!assessment) {
    return (
      <div className="assessment-panel-empty">
        <Empty
          title={t('requirement.assessment.noAssessment')}
          description={t('requirement.assessment.noAssessmentDesc')}
        />
      </div>
    );
  }

  const scoreItems = [
    { label: t('requirement.assessment.businessValue'), value: assessment.business_value, type: 'positive' },
    { label: t('requirement.assessment.technicalComplexity'), value: assessment.technical_complexity, type: 'negative' },
    { label: t('requirement.assessment.riskLevel'), value: assessment.risk_level, type: 'negative' },
    { label: t('requirement.assessment.resourceRequired'), value: assessment.resource_required, type: 'negative' },
  ];

  const technicalItems = [
    { label: t('requirement.assessment.uiStability'), value: assessment.ui_stability },
    { label: t('requirement.assessment.automationFeasibility'), value: assessment.automation_feasibility },
    { label: t('requirement.assessment.apiAvailability'), value: assessment.api_availability },
    { label: t('requirement.assessment.dataQuality'), value: assessment.data_quality },
  ].filter(item => item.value != null);

  const conclusionCfg = conclusionConfig[assessment.conclusion];

  return (
    <div className="assessment-panel">
      {/* Overall Score */}
      <div className="assessment-panel-score-header">
        <div className="assessment-panel-score-circle">
          <Progress
            percent={assessment.total_score}
            type="circle"
            width={80}
            strokeWidth={6}
            format={() => <span className="assessment-panel-score-value">{assessment.total_score}</span>}
          />
          <Text size="small" type="tertiary" style={{ marginTop: 4 }}>
            {t('requirement.assessment.totalScore')}
          </Text>
        </div>
        <div className="assessment-panel-score-meta">
          <div className="assessment-panel-score-conclusion">
            {conclusionCfg && (
              <Tag color={conclusionCfg.color} size="large">
                {t(conclusionCfg.i18nKey)}
              </Tag>
            )}
          </div>
          <div className="assessment-panel-score-assessor">
            <Text size="small" type="tertiary">
              {t('requirement.assessment.assessor')}：
            </Text>
            <UserNameWithCard
              name={assessment.assessor_name}
              userId={assessment.assessor_id}
            />
          </div>
          <Text size="small" type="tertiary">
            {t('requirement.assessment.assessedAt')}：{new Date(assessment.assessed_at).toLocaleString('zh-CN')}
          </Text>
        </div>
      </div>

      {/* Business Dimensions */}
      <div className="assessment-panel-section">
        <Title heading={6} className="assessment-panel-section-title">
          <span className="assessment-panel-section-indicator" />
          {t('requirement.assessment.businessDimension')}
        </Title>
        <div className="assessment-panel-scores">
          {scoreItems.map((item) => (
            <div key={item.label} className="assessment-panel-score-item">
              <Text size="small" className="assessment-panel-score-label">{item.label}</Text>
              <Rating allowHalf disabled value={item.value} count={5} size={16} />
              <Text size="small" type="tertiary">{item.value}/5</Text>
            </div>
          ))}
        </div>
      </div>

      {/* Technical Dimensions */}
      {technicalItems.length > 0 && (
        <div className="assessment-panel-section">
          <Title heading={6} className="assessment-panel-section-title">
            <span className="assessment-panel-section-indicator" />
            {t('requirement.assessment.technicalDimension')}
          </Title>
          <div className="assessment-panel-scores">
            {technicalItems.map((item) => (
              <div key={item.label} className="assessment-panel-score-item">
                <Text size="small" className="assessment-panel-score-label">{item.label}</Text>
                <Rating allowHalf disabled value={item.value!} count={5} size={16} />
                <Text size="small" type="tertiary">{item.value}/5</Text>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {assessment.notes && (
        <div className="assessment-panel-section">
          <Title heading={6} className="assessment-panel-section-title">
            <span className="assessment-panel-section-indicator" />
            {t('requirement.assessment.notes')}
          </Title>
          <div className="assessment-panel-notes">
            <Text>{assessment.notes}</Text>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessmentPanel;
