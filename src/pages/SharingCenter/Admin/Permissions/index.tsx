import { Typography, Banner, Card, Tag, Table } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import './index.less';

const { Title, Text } = Typography;

interface PermissionGroup {
  entity: string;
  entityKey: string;
  items: string[];
}

const GROUPS: PermissionGroup[] = [
  { entity: 'asset', entityKey: 'asset', items: ['create', 'edit', 'delete', 'view', 'list', 'reuse'] },
  { entity: 'asset_market', entityKey: 'assetMarket', items: ['view', 'search', 'favorite'] },
  { entity: 'category', entityKey: 'category', items: ['create', 'edit', 'delete', 'list'] },
  { entity: 'approval_rule', entityKey: 'approvalRule', items: ['view', 'edit', 'list'] },
  { entity: 'asset_approval', entityKey: 'assetApproval', items: ['approve', 'reject', 'view'] },
];

interface RoleRow {
  role: string;
  apa: string;
  permissions: string;
}

const PermissionsPage = () => {
  const { t } = useTranslation();

  const roles: RoleRow[] = [
    {
      role: t('sharing.admin.permissions.roles.creator'),
      apa: 'APA_DEVELOPER',
      permissions: 'asset.create / asset.edit / asset.delete（仅自己的）',
    },
    {
      role: t('sharing.admin.permissions.roles.consumer'),
      apa: 'APA_OPERATOR',
      permissions: 'asset_market.* + asset.reuse',
    },
    {
      role: t('sharing.admin.permissions.roles.approver'),
      apa: 'APA_DEVELOPER + asset_approval',
      permissions: 'asset_approval.approve / asset_approval.reject / asset_approval.view',
    },
    {
      role: t('sharing.admin.permissions.roles.admin'),
      apa: 'Administrator',
      permissions: t('sharing.admin.permissions.allPermissions'),
    },
  ];

  const roleColumns = [
    { title: t('sharing.admin.permissions.col.role'), dataIndex: 'role', width: 160 },
    { title: t('sharing.admin.permissions.col.apa'), dataIndex: 'apa', width: 240 },
    { title: t('sharing.admin.permissions.col.permissions'), dataIndex: 'permissions' },
  ];

  return (
    <div className="permissions-page app-layout-content-card">
      <div className="page-header">
        <Title heading={3} className="title">{t('sharing.admin.permissions.pageTitle')}</Title>
      </div>

      <Banner type="info" closeIcon={null} description={t('sharing.admin.permissions.notice')} />

      <section className="section">
        <Title heading={5} className="section-title">{t('sharing.admin.permissions.entityTitle')}</Title>
        <div className="entity-grid">
          {GROUPS.map((g) => (
            <Card key={g.entity} className="entity-card" bodyStyle={{ padding: 16 }}>
              <div className="entity-card-head">
                <Text strong>{t(`sharing.admin.permissions.entities.${g.entityKey}`)}</Text>
                <Text type="tertiary" size="small">{g.entity}</Text>
              </div>
              <div className="entity-tags">
                {g.items.map((it) => (
                  <Tag key={it} color="blue" type="light" size="small">{`${g.entity}.${it}`}</Tag>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="section">
        <Title heading={5} className="section-title">{t('sharing.admin.permissions.roleTitle')}</Title>
        <Table size="small" columns={roleColumns} dataSource={roles} rowKey="role" pagination={false} />
      </section>
    </div>
  );
};

export default PermissionsPage;
