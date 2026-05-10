import { useEffect, useState } from 'react';
import { Typography, Table, Select, Button, Toast, Banner, Modal, Space } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import {
  type AssetTypeKey, type ApprovalLevel, type ApprovalConfig,
  getApprovalConfig, saveApprovalConfig,
} from '@/pages/SharingCenter/shared/approvalConfig';
import './index.less';

const { Title, Text } = Typography;

type Row = { type: AssetTypeKey; level: ApprovalLevel };

// TODO(权限): 接入 SC_ADMIN_RULE 权限校验，未授权用户重定向至 403 / 首页（STORY-003 AC-FUNC-05 / E1）。
//             Mock 阶段默认放行，便于预览。
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
        // TODO(API): PUT /api/sharing-center/admin/approval-config，失败时按 AC-ERR-01 处理（保留用户选择 + Toast 错误）
        saveApprovalConfig(config);
        setDirty(false);
        Toast.success(t('sharing.admin.approvalLevels.toast.saved'));
      },
    });
  };

  // MVP 仅 WORKFLOW + KNOWLEDGE（流程块/技能 P2）
  const types: AssetTypeKey[] = ['WORKFLOW', 'KNOWLEDGE'];
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
      title: t('sharing.admin.approvalLevels.col.choose'),
      width: 320,
      render: (_: unknown, row: Row) => (
        <Select
          value={row.level}
          onChange={(v) => handleChange(row.type, v as ApprovalLevel)}
          style={{ width: 280 }}
          optionList={[
            { label: levelLabel('SINGLE'), value: 'SINGLE' },
            { label: levelLabel('NONE'), value: 'NONE' },
          ]}
        />
      ),
    },
    {
      title: '',
      render: (_: unknown, row: Row) => (
        <Text type="tertiary">{t(`sharing.admin.approvalLevels.desc.${row.type}`)}</Text>
      ),
    },
  ];

  return (
    <div className="approval-levels-page app-layout-content-card">
      <div className="page-header">
        <Title heading={3} className="title">{t('sharing.admin.approvalLevels.pageTitle')}</Title>
      </div>

      <Text className="page-intro">{t('sharing.admin.approvalLevels.intro')}</Text>

      <Table
        size="small"
        columns={columns}
        dataSource={dataSource}
        rowKey="type"
        pagination={false}
      />

      <Banner type="warning" closeIcon={null} description={t('sharing.admin.approvalLevels.devCenterNotice')} />

      <Text type="tertiary" className="queue-notice">
        {t('sharing.admin.approvalLevels.queueNotice')}
      </Text>

      <div className="page-footer">
        <Space spacing={8}>
          <Button theme="solid" type="primary" disabled={!dirty} onClick={handleSave}>
            {t('common.save')}
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default ApprovalLevelsPage;
