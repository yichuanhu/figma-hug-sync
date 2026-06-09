import { useState } from 'react';
import { Typography, Table, Button, Toast, Banner, Tag } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import {
  type AssetTypeKey,
  getSharingApprovalConfig,
  getApprovalFlow,
  saveApprovalFlow,
} from '@/pages/SharingCenter/shared/approvalConfig';
import ApprovalFlowEditor from '@/components/ApprovalFlowEditor';
import type { ApprovalLevelConfig, ApprovalFlowConfig } from '@/pages/Requirements/RequirementsWorkbench/types';
import './index.less';

const { Title, Text } = Typography;

type Row = { type: AssetTypeKey; flow: ApprovalFlowConfig };

// MVP 仅 WORKFLOW + KNOWLEDGE
const TYPES: AssetTypeKey[] = ['WORKFLOW', 'KNOWLEDGE'];

const ApprovalLevelsPage = () => {
  const { t } = useTranslation();
  const [config, setConfig] = useState(() => getSharingApprovalConfig());
  const [editing, setEditing] = useState<AssetTypeKey | null>(null);

  const dataSource: Row[] = TYPES.map((k) => ({ type: k, flow: config[k] }));

  const renderSummary = (flow: ApprovalFlowConfig) => {
    if (flow.levels.length === 0) {
      return <Text type="tertiary">{t('sharing.admin.approvalLevels.noApproval')}</Text>;
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {flow.levels.map((lv, idx) => {
          const mode = t(`sharing.admin.approvalLevels.modeShort.${lv.mode ?? 'any_one'}`);
          const typeText = t(`sharing.admin.approvalLevels.approverTypeShort.${lv.approver_type}`);
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Tag color="blue" type="light" size="small">L{idx + 1}</Tag>
              <Text size="small">{lv.name}</Text>
              <Text type="tertiary" size="small">· {typeText} · {mode} · {lv.approver_ids.length} 人</Text>
            </div>
          );
        })}
      </div>
    );
  };

  const columns = [
    {
      title: t('sharing.admin.approvalLevels.col.type'),
      dataIndex: 'type',
      width: 160,
      render: (v: AssetTypeKey) => t(`sharing.market.tabs.${v}`),
    },
    {
      title: t('sharing.admin.approvalLevels.col.levelCount'),
      width: 120,
      render: (_: unknown, row: Row) =>
        row.flow.levels.length === 0
          ? t('sharing.admin.approvalLevels.noApproval')
          : t('sharing.admin.approvalLevels.levelCountValue', { n: row.flow.levels.length }),
    },
    {
      title: t('sharing.admin.approvalLevels.col.summary'),
      render: (_: unknown, row: Row) => renderSummary(row.flow),
    },
    {
      title: t('sharing.admin.approvalLevels.col.action'),
      width: 140,
      render: (_: unknown, row: Row) => (
        <Button theme="borderless" type="primary" onClick={() => setEditing(row.type)}>
          {t('sharing.admin.approvalLevels.configBtn')}
        </Button>
      ),
    },
  ];

  const handleSubmit = async (levels: ApprovalLevelConfig[]) => {
    if (!editing) return;
    saveApprovalFlow(editing, { levels });
    setConfig(getSharingApprovalConfig());
    Toast.success(t('sharing.admin.approvalLevels.toast.saved'));
  };

  return (
    <div className="approval-levels-page app-layout-content-card">
      <div className="page-header">
        <Title heading={3} className="title">{t('sharing.admin.approvalLevels.pageTitle')}</Title>
      </div>

      <Banner
        type="info"
        closeIcon={null}
        description={t('sharing.mvpDisabledBanner.approvalLevels')}
        style={{ marginBottom: 12 }}
      />

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

      <ApprovalFlowEditor
        visible={editing !== null}
        levels={editing ? getApprovalFlow(editing).levels : []}
        subtitle={editing ? t(`sharing.market.tabs.${editing}`) : undefined}
        onClose={() => setEditing(null)}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default ApprovalLevelsPage;
