import { useState, useEffect } from 'react';
import { Typography, Card, Select, Button, Toast, Banner } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import './index.less';

const { Title, Text } = Typography;

type AssetTypeKey = 'SNIPPET' | 'WORKFLOW' | 'KNOWLEDGE' | 'SKILL';
type Level = 'NONE' | 'SINGLE';

const STORAGE_KEY = 'sharing-center.approval-levels';
const DEFAULT: Record<AssetTypeKey, Level> = {
  SNIPPET: 'SINGLE',
  WORKFLOW: 'SINGLE',
  KNOWLEDGE: 'SINGLE',
  SKILL: 'SINGLE',
};

const ApprovalLevelsPage = () => {
  const { t } = useTranslation();
  const [config, setConfig] = useState<Record<AssetTypeKey, Level>>(DEFAULT);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setConfig({ ...DEFAULT, ...JSON.parse(raw) });
    } catch {}
  }, []);

  const handleChange = (k: AssetTypeKey) => (v: unknown) => {
    setConfig((prev) => ({ ...prev, [k]: v as Level }));
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    Toast.success(t('sharing.admin.approvalLevels.toast.saved'));
  };

  const types: AssetTypeKey[] = ['SNIPPET', 'WORKFLOW', 'KNOWLEDGE', 'SKILL'];

  return (
    <div className="approval-levels-page">
      <div className="page-header">
        <Title heading={3} className="title">{t('sharing.admin.approvalLevels.pageTitle')}</Title>
      </div>

      <Banner
        type="info"
        description={t('sharing.admin.approvalLevels.notice')}
        closeIcon={null}
      />

      <Card className="config-card" bodyStyle={{ padding: 24 }}>
        {types.map((k) => (
          <div key={k} className="config-row">
            <div className="config-label">
              <Text strong>{t(`sharing.market.tabs.${k}`)}</Text>
              <Text type="tertiary" size="small">{t(`sharing.admin.approvalLevels.desc.${k}`)}</Text>
            </div>
            <Select
              value={config[k]}
              onChange={handleChange(k)}
              style={{ width: 200 }}
              optionList={[
                { label: t('sharing.admin.approvalLevels.levels.NONE'), value: 'NONE' },
                { label: t('sharing.admin.approvalLevels.levels.SINGLE'), value: 'SINGLE' },
              ]}
            />
          </div>
        ))}

        <div className="config-footer">
          <Button theme="solid" type="primary" onClick={handleSave}>
            {t('common.save')}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ApprovalLevelsPage;
