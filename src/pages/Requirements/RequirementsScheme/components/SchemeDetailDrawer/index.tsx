import { useMemo, useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabPane, Typography, Tag, Button, Empty, Form } from '@douyinfe/semi-ui';
import { CheckCircle, Trash2 } from 'lucide-react';
import DetailDrawerWrapper from '@/components/DetailDrawerWrapper';
import type { RequirementScheme, SchemeField } from '@/pages/Requirements/RequirementsWorkbench/types';
import SchemeFieldRenderer from '@/pages/Requirements/RequirementsWorkbench/components/SchemeFieldRenderer';
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


  // 「表单字段」Tab 的预览初始值：按字段类型生成示例数据，让禁用表单看起来像真实填写后的样子
  const buildPreviewValues = (fields: SchemeField[]): Record<string, unknown> => {
    const values: Record<string, unknown> = {};
    fields.forEach((f) => {
      if (f.default !== undefined) {
        values[f.key] = f.default;
        return;
      }
      switch (f.type) {
        case 'number':
          values[f.key] = f.validation?.min ?? 12;
          break;
        case 'percentage':
          values[f.key] = 80;
          break;
        case 'select':
        case 'radio':
          values[f.key] = f.options?.[0]?.value;
          break;
        case 'multi_select':
        case 'checkbox_group':
          values[f.key] = f.options?.slice(0, 2).map((o) => o.value) ?? [];
          break;
        case 'date':
          values[f.key] = new Date();
          break;
        case 'textarea':
        case 'rich_text':
          values[f.key] = `${f.label} 示例内容`;
          break;
        case 'text':
          values[f.key] = `${f.label} 示例`;
          break;
        case 'calculation':
        case 'file_upload':
        default:
          break;
      }
    });
    return values;
  };


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
      className="scheme-detail-drawer"
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
                <div className="scheme-detail-drawer-form-preview">
                  <Text type="tertiary" size="small" style={{ display: 'block', marginBottom: 12 }}>
                    {t('requirements.scheme.fieldsPreview')}
                  </Text>
                  <Form
                    initValues={buildPreviewValues(scheme.custom_fields)}
                    disabled
                    labelPosition="top"
                    className="scheme-detail-drawer-preview-form"
                  >
                    {scheme.custom_fields.map((f) => (
                      <SchemeFieldRenderer
                        key={f.key}
                        field={f}
                        costConfig={scheme.cost_config}
                      />
                    ))}
                  </Form>
                </div>
              )}
            </div>
          </TabPane>

        </Tabs>
      )}
    </DetailDrawerWrapper>
  );
};

export default SchemeDetailDrawer;
