import { useMemo, useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabPane, Typography, Tag, Button, Empty } from '@douyinfe/semi-ui';
import { CheckCircle, Trash2 } from 'lucide-react';
import DetailDrawerWrapper from '@/components/DetailDrawerWrapper';
import type {
  RequirementScheme,
  AssessmentModel,
  SchemeField,
  ApprovalLevelConfig,
} from '@/pages/Requirements/RequirementsWorkbench/types';
import './index.less';

const { Text, Title } = Typography;

interface Props {
  visible: boolean;
  scheme: RequirementScheme | null;
  schemes: RequirementScheme[];
  onClose: () => void;
  onNavigate: (s: RequirementScheme) => void;
  onActivate: (s: RequirementScheme) => void;
  onDelete: (s: RequirementScheme) => void;
}

const SchemeDetailDrawer = ({
  visible,
  scheme,
  schemes,
  onClose,
  onNavigate,
  onActivate,
  onDelete,
}: Props) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('basic');
  const lastVisible = useRef(visible);

  // 抽屉关闭重新打开时重置 tab
  useEffect(() => {
    if (visible && !lastVisible.current) {
      setActiveTab('basic');
    }
    lastVisible.current = visible;
  }, [visible]);

  const extraActions = useMemo(() => {
    if (!scheme) return null;
    return (
      <>
        {scheme.status !== 'active' && (
          <Button
            icon={<CheckCircle size={16} strokeWidth={2} />}
            theme="borderless"
            type="tertiary"
            size="small"
            onClick={() => onActivate(scheme)}
          >
            {t('requirements.scheme.activate')}
          </Button>
        )}
      </>
    );
  }, [scheme, onActivate, t]);

  const deleteAction = useMemo(() => {
    if (!scheme || scheme.is_preset) return null;
    return (
      <Button
        icon={<Trash2 size={16} strokeWidth={2} />}
        theme="borderless"
        type="danger"
        size="small"
        onClick={() => onDelete(scheme)}
      />
    );
  }, [scheme, onDelete]);

  const renderModel = (model: AssessmentModel | undefined, label: string) => {
    if (!model) {
      return (
        <Empty
          image={null}
          description={<Text type="tertiary">{label}：{t('requirements.scheme.notConfigured')}</Text>}
          style={{ padding: '24px 0' }}
        />
      );
    }
    return (
      <div className="scheme-detail-drawer-model-card">
        <div className="scheme-detail-drawer-model-card-header">
          <div>
            <Text strong>{model.label}</Text>
            <Text type="tertiary" size="small" style={{ marginLeft: 8 }}>
              {model.key}
            </Text>
          </div>
          <Tag color={model.type === 'value' ? 'cyan' : 'purple'} type="light">
            {model.type === 'value' ? t('requirements.scheme.valueModel') : t('requirements.scheme.complexityModel')}
          </Tag>
        </div>
        {model.description && (
          <Text type="secondary" size="small" style={{ display: 'block', marginBottom: 12 }}>
            {model.description}
          </Text>
        )}
        <Text strong size="small" style={{ display: 'block', marginBottom: 8 }}>
          {t('requirements.scheme.dimensions')}（{model.dimensions.length}）
        </Text>
        {model.dimensions.map((d) => (
          <div key={d.key} className="scheme-detail-drawer-dim-row">
            <Text strong style={{ flex: 1 }}>{d.label}</Text>
            <Tag size="small" color="grey" type="light">{t('requirements.scheme.weight')}: {(d.weight * 100).toFixed(0)}%</Tag>
            {d.source_field && (
              <Text type="tertiary" size="small" style={{ fontFamily: 'Menlo, monospace' }}>
                {d.source_field}
              </Text>
            )}
          </div>
        ))}
        <Text strong size="small" style={{ display: 'block', margin: '12px 0 8px' }}>
          {t('requirements.scheme.tiers')}
        </Text>
        <div>
          {model.tiers.map((tier, i) => (
            <span key={i} className="scheme-detail-drawer-tier-row">
              <Tag size="small" color={(tier.color as any) || 'blue'} type="light">{tier.label}</Tag>
              <Text type="tertiary" size="small">{tier.condition} → {tier.score}</Text>
            </span>
          ))}
        </div>
      </div>
    );
  };

  const renderField = (f: SchemeField) => (
    <div key={f.key} className="scheme-detail-drawer-field-row">
      <Tag size="small" color="blue" type="light">{f.type}</Tag>
      <div className="field-label">
        <Text strong>{f.label}</Text>
        {f.required && <Text type="danger" style={{ marginLeft: 4 }}>*</Text>}
        {f.description && (
          <div>
            <Text type="tertiary" size="small">{f.description}</Text>
          </div>
        )}
      </div>
      <span className="field-key">{f.key}</span>
    </div>
  );

  const renderLevel = (l: ApprovalLevelConfig) => (
    <div key={l.order} className="scheme-detail-drawer-level-row">
      <Tag color="blue" type="solid" size="small">{t('requirements.scheme.level')} {l.order}</Tag>
      <Text strong style={{ flex: 1 }}>{l.name}</Text>
      <Tag size="small" color="grey" type="light">{l.approver_type}</Tag>
      {l.count_sign && <Tag size="small" color="orange" type="light">{t('requirements.scheme.countSign')}</Tag>}
      <Text type="tertiary" size="small">{l.approver_ids.length} {t('requirements.scheme.approvers')}</Text>
    </div>
  );

  return (
    <DetailDrawerWrapper
      visible={visible}
      onClose={onClose}
      title={
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {scheme?.name}
          {scheme?.status === 'active' && <Tag color="green" type="solid" size="small">{t('requirements.scheme.active')}</Tag>}
          {scheme?.is_preset && <Tag color="blue" type="light" size="small">{t('requirements.scheme.preset')}</Tag>}
        </span>
      }
      defaultWidth={900}
      minWidth={720}
      storageKey="schemeDetailDrawerWidth"
      dataList={schemes}
      currentId={scheme?.id}
      onNavigate={onNavigate}
      extraActions={extraActions}
      deleteAction={deleteAction}
    >
      {scheme && (
        <Tabs activeKey={activeTab} onChange={setActiveTab} type="line" style={{ height: '100%' }}>
          <TabPane tab={t('requirements.scheme.tab.basic')} itemKey="basic">
            <div className="scheme-detail-drawer-content">
              <div className="scheme-detail-drawer-meta-grid">
                <Text className="label">{t('requirements.scheme.code')}</Text>
                <Text>{scheme.code}</Text>
                <Text className="label">{t('requirements.scheme.version')}</Text>
                <Text>v{scheme.version}</Text>
                <Text className="label">{t('common.status')}</Text>
                <Text>{scheme.status === 'active' ? t('requirements.scheme.active') : t('requirements.scheme.inactive')}</Text>
                <Text className="label">{t('requirements.scheme.category')}</Text>
                <Text>{scheme.meta?.category || '-'}</Text>
                <Text className="label">{t('requirements.scheme.scenario')}</Text>
                <Text>{scheme.meta?.scenario || '-'}</Text>
                <Text className="label">{t('common.description')}</Text>
                <Text>{scheme.description || '-'}</Text>
                <Text className="label">{t('common.createdAt')}</Text>
                <Text>{scheme.created_at}</Text>
              </div>
            </div>
          </TabPane>

          <TabPane tab={`${t('requirements.scheme.tab.fields')} (${scheme.custom_fields.length})`} itemKey="fields">
            <div className="scheme-detail-drawer-content">
              {scheme.custom_fields.length === 0 ? (
                <Empty description={t('common.noData')} />
              ) : (
                scheme.custom_fields.map(renderField)
              )}
            </div>
          </TabPane>

          <TabPane tab={t('requirements.scheme.tab.assessment')} itemKey="assessment">
            <div className="scheme-detail-drawer-content">
              {renderModel(scheme.value_assessment_model, t('requirements.scheme.valueModel'))}
              {renderModel(scheme.complexity_assessment_model, t('requirements.scheme.complexityModel'))}
            </div>
          </TabPane>

          <TabPane tab={`${t('requirements.scheme.tab.approval')} (${scheme.approval_flow.levels.length})`} itemKey="approval">
            <div className="scheme-detail-drawer-content">
              {scheme.approval_flow.levels.length === 0 ? (
                <Empty description={t('common.noData')} />
              ) : (
                scheme.approval_flow.levels.map(renderLevel)
              )}
            </div>
          </TabPane>

          <TabPane tab={t('requirements.scheme.tab.cost')} itemKey="cost">
            <div className="scheme-detail-drawer-content">
              {scheme.cost_config ? (
                <div className="scheme-detail-drawer-meta-grid">
                  <Text className="label">{t('requirements.scheme.avgHourlyCost')}</Text>
                  <Text>¥ {scheme.cost_config.avg_hourly_cost}</Text>
                  <Text className="label">{t('requirements.scheme.workingHoursPerDay')}</Text>
                  <Text>{scheme.cost_config.working_hours_per_day} h</Text>
                  <Text className="label">{t('requirements.scheme.workingDaysPerMonth')}</Text>
                  <Text>{scheme.cost_config.working_days_per_month} d</Text>
                  {scheme.cost_config.custom_basis && (
                    <>
                      <Text className="label">{t('requirements.scheme.customBasis')}</Text>
                      <Text>{scheme.cost_config.custom_basis}</Text>
                    </>
                  )}
                </div>
              ) : (
                <Empty description={t('requirements.scheme.notConfigured')} />
              )}
            </div>
          </TabPane>
        </Tabs>
      )}
    </DetailDrawerWrapper>
  );
};

export default SchemeDetailDrawer;
