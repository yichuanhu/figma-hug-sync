import { useEffect, useState } from 'react';
import { Typography, Table, Select, Button, Toast, Banner, Modal, Space } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import {
  type AssetTypeKey, type ApprovalLevel, type ApprovalConfig,
  DEFAULT_APPROVAL_CONFIG, getApprovalConfig, saveApprovalConfig, resetApprovalConfig,
} from '@/pages/SharingCenter/shared/approvalConfig';
import './index.less';

const { Title } = Typography;

type Row = { type: AssetTypeKey; level: ApprovalLevel };

const ApprovalLevelsPage = () => {
  const { t } = useTranslation();
  const [config, setConfig] = useState<ApprovalConfig>(() => getApprovalConfig());
  const [dirty, setDirty] = useState(false);

  useEffect(() => { setConfig(getApprovalConfig()); }, []);

  const handleChange = (k: AssetTypeKey, v: ApprovalLevel) => {
    setConfig((prev) => ({ ...prev, [k]: v }));
    setDirty(true);
  };

  const handleSave = () => {
    Modal.confirm({
      title: t('sharing.admin.approvalLevels.confirmSaveTitle'),
      content: t('sharing.admin.approvalLevels.confirmSaveContent'),
      onOk: () => {
        saveApprovalConfig(config);
        setDirty(false);
        Toast.success(t('sharing.admin.approvalLevels.toast.saved'));
      },
    });
  };

  const handleReset = () => {
    setConfig({ ...DEFAULT_APPROVAL_CONFIG });
    resetApprovalConfig();
    setDirty(false);
    Toast.success(t('sharing.admin.approvalLevels.toast.reset'));
  };

  const types: AssetTypeKey[] = ['SNIPPET', 'WORKFLOW', 'KNOWLEDGE', 'SKILL'];
  const dataSource: Row[] = types.map((k) => ({ type: k, level: config[k] }));

  const levelLabel = (lv: ApprovalLevel) => t(`sharing.admin.approvalLevels.levels.${lv}`);

  const columns = [
    {
      title: t('sharing.admin.approvalLevels.col.type'),
      dataIndex: 'type',
      width: 200,
      render: (v: AssetTypeKey) => t(`sharing.market.tabs.${v}`),
    },
    {
      title: t('sharing.admin.approvalLevels.col.current'),
      dataIndex: 'level',
      width: 200,
      render: (v: ApprovalLevel) => levelLabel(v),
    },
    {
      title: t('sharing.admin.approvalLevels.col.choose'),
      width: 240,
      render: (_: unknown, row: Row) => (
        <Select
          value={row.level}
          onChange={(v) => handleChange(row.type, v as ApprovalLevel)}
          style={{ width: 200 }}
          optionList={[
            { label: levelLabel('NONE'), value: 'NONE' },
            { label: levelLabel('SINGLE'), value: 'SINGLE' },
          ]}
        />
      ),
    },
    {
      title: t('sharing.admin.approvalLevels.col.desc'),
      render: (_: unknown, row: Row) => t(`sharing.admin.approvalLevels.desc.${row.type}`),
    },
  ];

  return (
    <div className="approval-levels-page app-layout-content-card">
      <div className="page-header">
        <Title heading={3} className="title">{t('sharing.admin.approvalLevels.pageTitle')}</Title>
      </div>

      <Banner type="info" closeIcon={null} description={t('sharing.admin.approvalLevels.notice')} />

      <Table
        size="small"
        columns={columns}
        dataSource={dataSource}
        rowKey="type"
        pagination={false}
      />

      <div className="page-footer">
        <Space spacing={8}>
          <Button onClick={handleReset}>{t('sharing.admin.approvalLevels.reset')}</Button>
          <Button theme="solid" type="primary" disabled={!dirty} onClick={handleSave}>
            {t('common.save')}
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default ApprovalLevelsPage;
