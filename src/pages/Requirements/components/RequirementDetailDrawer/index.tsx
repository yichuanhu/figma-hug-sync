import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Typography,
  Descriptions,
  Tag,
  Tabs,
  TabPane,
  Space,
  Tooltip,
} from '@douyinfe/semi-ui';
import type { LYRequirementResponse, ApprovalRole } from '@/api';
import DetailDrawerWrapper from '@/components/DetailDrawerWrapper';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import ExpandableText from '@/components/ExpandableText';
import ApprovalActions from '../ApprovalActions';
import ApprovalTimeline from '../ApprovalTimeline';
import AssessmentPanel from '../AssessmentPanel';
import ROIPanel from '../ROIPanel';
import ClassificationPanel from '../ClassificationPanel';
import ArtifactPanel from '../ArtifactPanel';
import DocumentPanel from '../DocumentPanel';
import AcceptancePanel from '../AcceptancePanel';

import './index.less';

const { Title, Text } = Typography;

interface RequirementDetailDrawerProps {
  visible: boolean;
  requirement: LYRequirementResponse | null;
  requirementList: LYRequirementResponse[];
  onClose: () => void;
  onNavigate: (requirement: LYRequirementResponse) => void;
  onDataChange?: () => void;
  currentUserRole?: ApprovalRole;
}

const approvalStatusConfig: Record<string, { color: 'grey' | 'orange' | 'green' | 'red' | 'blue'; i18nKey: string }> = {
  DRAFT: { color: 'grey', i18nKey: 'requirement.approvalStatus.DRAFT' },
  BUSINESS_PENDING: { color: 'orange', i18nKey: 'requirement.approvalStatus.BUSINESS_PENDING' },
  BUSINESS_APPROVED: { color: 'blue', i18nKey: 'requirement.approvalStatus.BUSINESS_APPROVED' },
  BUSINESS_REJECTED: { color: 'red', i18nKey: 'requirement.approvalStatus.BUSINESS_REJECTED' },
  TECH_PENDING: { color: 'orange', i18nKey: 'requirement.approvalStatus.TECH_PENDING' },
  TECH_APPROVED: { color: 'green', i18nKey: 'requirement.approvalStatus.TECH_APPROVED' },
  TECH_REJECTED: { color: 'red', i18nKey: 'requirement.approvalStatus.TECH_REJECTED' },
};

const devStatusConfig: Record<string, { color: 'grey' | 'blue' | 'cyan' | 'green'; i18nKey: string }> = {
  NOT_STARTED: { color: 'grey', i18nKey: 'requirement.devStatus.NOT_STARTED' },
  ASSESSING: { color: 'blue', i18nKey: 'requirement.devStatus.ASSESSING' },
  IN_DEVELOPMENT: { color: 'cyan', i18nKey: 'requirement.devStatus.IN_DEVELOPMENT' },
  DEVELOPED: { color: 'green', i18nKey: 'requirement.devStatus.DEVELOPED' },
};

const opStatusConfig: Record<string, { color: 'grey' | 'green' | 'orange'; i18nKey: string }> = {
  NOT_LIVE: { color: 'grey', i18nKey: 'requirement.opStatus.NOT_LIVE' },
  RUNNING: { color: 'green', i18nKey: 'requirement.opStatus.RUNNING' },
  SUSPENDED: { color: 'orange', i18nKey: 'requirement.opStatus.SUSPENDED' },
  ARCHIVED: { color: 'grey', i18nKey: 'requirement.opStatus.ARCHIVED' },
};

const priorityConfig: Record<string, { color: 'red' | 'orange' | 'grey'; i18nKey: string }> = {
  HIGH: { color: 'red', i18nKey: 'requirement.priority.HIGH' },
  MEDIUM: { color: 'orange', i18nKey: 'requirement.priority.MEDIUM' },
  LOW: { color: 'grey', i18nKey: 'requirement.priority.LOW' },
};

const RequirementDetailDrawer: React.FC<RequirementDetailDrawerProps> = ({
  visible,
  requirement,
  requirementList,
  onClose,
  onNavigate,
  onDataChange,
  currentUserRole = 'submitter',
}) => {
  const { t } = useTranslation();

  if (!requirement) return null;

  const formatTime = (time: string) => {
    if (!time) return '-';
    return new Date(time).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderStatusTags = () => {
    const approvalCfg = approvalStatusConfig[requirement.approval_status];
    const devCfg = devStatusConfig[requirement.development_status];
    const opCfg = opStatusConfig[requirement.operation_status];
    return (
      <Space spacing={4}>
        {approvalCfg && <Tag color={approvalCfg.color}>{t(approvalCfg.i18nKey)}</Tag>}
        {devCfg && <Tag color={devCfg.color}>{t(devCfg.i18nKey)}</Tag>}
        {opCfg && <Tag color={opCfg.color}>{t(opCfg.i18nKey)}</Tag>}
      </Space>
    );
  };

  const descData = [
    {
      key: t('requirement.detail.requirementId'),
      value: <Text copyable>{requirement.id}</Text>,
    },
    {
      key: t('requirement.detail.status'),
      value: renderStatusTags(),
    },
    {
      key: t('requirement.list.columns.department'),
      value: requirement.department_name || '-',
    },
    {
      key: t('requirement.list.columns.priority'),
      value: (() => {
        const cfg = priorityConfig[requirement.priority];
        return cfg ? <Tag color={cfg.color}>{t(cfg.i18nKey)}</Tag> : '-';
      })(),
    },
    {
      key: t('requirement.form.fields.contactName'),
      value: requirement.contact_name || '-',
    },
    {
      key: t('requirement.form.fields.contactEmail'),
      value: requirement.contact_email || '-',
    },
    {
      key: t('requirement.form.fields.expectedOnlineDate'),
      value: requirement.expected_online_date || '-',
    },
    {
      key: t('common.creator'),
      value: requirement.creator_name ? (
        <UserNameWithCard
          name={requirement.creator_name}
          userId={requirement.creator_id}
          department={requirement.creator_department}
          role={requirement.creator_role}
          email={requirement.creator_email}
        />
      ) : '-',
    },
    {
      key: t('common.createTime'),
      value: formatTime(requirement.created_at),
    },
    {
      key: t('common.updateTime'),
      value: formatTime(requirement.updated_at),
    },
  ];

  const renderBasicInfoTab = () => (
    <div className="requirement-detail-drawer-tab-content">
      <Descriptions data={descData} align="left" />

      {/* Description */}
      {requirement.description && (
        <div className="requirement-detail-drawer-section">
          <Title heading={6} className="requirement-detail-drawer-section-title">
            <span className="requirement-detail-drawer-section-indicator" />
            {t('common.description')}
          </Title>
          <div className="requirement-detail-drawer-section-body">
            <ExpandableText text={requirement.description} maxLines={4} />
          </div>
        </div>
      )}

      {/* Business Background */}
      {requirement.business_background && (
        <div className="requirement-detail-drawer-section">
          <Title heading={6} className="requirement-detail-drawer-section-title">
            <span className="requirement-detail-drawer-section-indicator" />
            {t('requirement.form.fields.businessBackground')}
          </Title>
          <div className="requirement-detail-drawer-section-body">
            <ExpandableText text={requirement.business_background} maxLines={4} />
          </div>
        </div>
      )}

      {/* Classifications */}
      {requirement.classifications && requirement.classifications.length > 0 && (
        <div className="requirement-detail-drawer-section">
          <Title heading={6} className="requirement-detail-drawer-section-title">
            <span className="requirement-detail-drawer-section-indicator" />
            {t('requirement.list.columns.classifications')}
          </Title>
          <div className="requirement-detail-drawer-classifications">
            {requirement.classifications.map((c, i) => (
              <Tooltip key={i} content={c.classification_key}>
                <Tag color="blue">{c.classification_value}</Tag>
              </Tooltip>
            ))}
          </div>
        </div>
      )}

      {/* Approval Flow Timeline */}
      <div className="requirement-detail-drawer-section">
        <Title heading={6} className="requirement-detail-drawer-section-title">
          <span className="requirement-detail-drawer-section-indicator" />
          {t('requirement.approvalFlow.title')}
        </Title>
        <div className="requirement-detail-drawer-section-body">
          <ApprovalTimeline
            approvalStatus={requirement.approval_status}
            records={requirement.approval_records || []}
          />
        </div>
      </div>

      {/* Approval Actions */}
      <div className="requirement-detail-drawer-actions">
        <ApprovalActions
          requirement={requirement}
          currentUserRole={currentUserRole}
          onStatusChange={() => onDataChange?.()}
        />
      </div>
    </div>
  );

  return (
    <DetailDrawerWrapper
      visible={visible}
      onClose={onClose}
      title={
        <Text ellipsis={{ showTooltip: true }} style={{ maxWidth: 400 }}>
          {requirement.title}
        </Text>
      }
      dataList={requirementList}
      currentId={requirement.id}
      getId={(item) => item.id}
      onNavigate={(item) => onNavigate(item)}
      defaultWidth={900}
      minWidth={576}
      storageKey="requirementDetailDrawerWidth"
      className="requirement-detail-drawer"
    >
      <div className="requirement-detail-drawer-content">
        <Tabs type="line">
          <TabPane tab={t('requirement.detail.basicInfo')} itemKey="basicInfo">
            {renderBasicInfoTab()}
          </TabPane>
          <TabPane tab={t('requirement.detail.classification')} itemKey="classification">
            <ClassificationPanel
              requirementId={requirement.id}
              classifications={requirement.classifications || []}
              onDataChange={onDataChange}
            />
          </TabPane>
          <TabPane tab={t('requirement.detail.assessment')} itemKey="assessment">
            <AssessmentPanel requirementId={requirement.id} />
          </TabPane>
          <TabPane tab={t('requirement.detail.roi')} itemKey="roi">
            <ROIPanel requirementId={requirement.id} />
          </TabPane>
          <TabPane tab={t('requirement.detail.artifacts')} itemKey="artifacts">
            <ArtifactPanel requirementId={requirement.id} />
          </TabPane>
          <TabPane tab={t('requirement.detail.documents')} itemKey="documents">
            <DocumentPanel requirementId={requirement.id} />
          </TabPane>
          <TabPane tab={t('requirement.detail.acceptance')} itemKey="acceptance">
            <AcceptancePanel requirementId={requirement.id} />
          </TabPane>
        </Tabs>
      </div>
    </DetailDrawerWrapper>
  );
};

export default RequirementDetailDrawer;
