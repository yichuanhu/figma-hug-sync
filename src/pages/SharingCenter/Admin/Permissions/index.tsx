import { Typography, Banner, Card, Tag, Table } from '@douyinfe/semi-ui';
import { IconTickCircle } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';
import './index.less';

const { Title, Text } = Typography;

type RoleKey = 'admin' | 'publisher' | 'approver' | 'consumer';
type GroupKey = 'browse' | 'operate' | 'publish' | 'approval' | 'admin';

interface PermissionPoint {
  code: string;
  group: GroupKey;
  roles: RoleKey[];
}

const ROLE_ORDER: RoleKey[] = ['admin', 'publisher', 'approver', 'consumer'];

const POINTS: PermissionPoint[] = [
  { code: 'SC_ASSET_VIEW',      group: 'browse',   roles: ['admin', 'publisher', 'approver', 'consumer'] },
  { code: 'SC_ASSET_REUSE',     group: 'browse',   roles: ['admin', 'publisher', 'approver', 'consumer'] },
  { code: 'SC_ASSET_CREATE',    group: 'operate',  roles: ['admin', 'publisher'] },
  { code: 'SC_ASSET_EDIT',      group: 'operate',  roles: ['admin', 'publisher'] },
  { code: 'SC_ASSET_DELETE',    group: 'operate',  roles: ['admin', 'publisher'] },
  { code: 'SC_DISPLAY_EDIT',    group: 'publish',  roles: ['admin', 'publisher'] },
  { code: 'SC_PUBLISH_SUBMIT',  group: 'publish',  roles: ['admin', 'publisher'] },
  { code: 'SC_PUBLISH_MANAGE',  group: 'publish',  roles: ['admin', 'publisher'] },
  { code: 'SC_PUBLISH_FEATURE', group: 'publish',  roles: ['admin', 'publisher'] },
  { code: 'SC_APPROVAL_VIEW',   group: 'approval', roles: ['admin', 'approver'] },
  { code: 'SC_APPROVAL_HANDLE', group: 'approval', roles: ['admin', 'approver'] },
  { code: 'SC_ADMIN_RULE',      group: 'admin',    roles: ['admin'] },
];

const GROUP_ORDER: GroupKey[] = ['browse', 'operate', 'publish', 'approval', 'admin'];

const PermissionsPage = () => {
  const { t } = useTranslation();
  const tp = (k: string, opts?: Record<string, unknown>) =>
    t(`sharing.admin.permissions.${k}`, opts as never);

  const groupedPoints = GROUP_ORDER.map((g) => ({
    key: g,
    items: POINTS.filter((p) => p.group === g),
  }));

  const roleBoundCount: Record<RoleKey, number> = {
    admin: 0, publisher: 0, approver: 0, consumer: 0,
  };
  POINTS.forEach((p) => p.roles.forEach((r) => { roleBoundCount[r] += 1; }));

  // 角色 × 权限矩阵列
  const matrixColumns = [
    {
      title: tp('matrix.permission'),
      dataIndex: 'code',
      width: 220,
      render: (code: string) => <Tag color="blue" type="light" size="small">{code}</Tag>,
    },
    ...ROLE_ORDER.map((r) => ({
      title: (
        <div className="matrix-head">
          <span>{tp(`roles.${r}.label`)}</span>
          <Text type="tertiary" size="small">{tp(`roles.${r}.archMapping`)}</Text>
        </div>
      ),
      dataIndex: r,
      align: 'center' as const,
      render: (bound: boolean) =>
        bound ? <IconTickCircle style={{ color: 'var(--semi-color-success)' }} /> : <Text type="tertiary">—</Text>,
    })),
  ];

  const matrixData = POINTS.map((p) => ({
    code: p.code,
    admin: p.roles.includes('admin'),
    publisher: p.roles.includes('publisher'),
    approver: p.roles.includes('approver'),
    consumer: p.roles.includes('consumer'),
  }));

  return (
    <div className="permissions-page app-layout-content-card">
      <div className="page-header">
        <Title heading={3} className="title">{tp('pageTitle')}</Title>
      </div>

      <Banner type="info" closeIcon={null} description={tp('notice')} />

      {/* Section A — 权限点（按 5 类分组） */}
      <section className="section">
        <Title heading={5} className="section-title">{tp('sectionTitles.points')}</Title>
        <div className="permission-groups">
          {groupedPoints.map(({ key, items }) => (
            <Card key={key} className="group-card" bodyStyle={{ padding: 16 }}>
              <div className="group-card-head">
                <Text strong>{tp(`groups.${key}`)}</Text>
                <Text type="tertiary" size="small">{items.length}</Text>
              </div>
              <ul className="point-list">
                {items.map((p) => (
                  <li key={p.code} className="point-item">
                    <Tag color="blue" type="light" size="small">{p.code}</Tag>
                    <Text type="tertiary" size="small">{tp(`points.${p.code}`)}</Text>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      {/* Section B — 内置角色模板 */}
      <section className="section">
        <Title heading={5} className="section-title">{tp('sectionTitles.roles')}</Title>
        <div className="role-grid">
          {ROLE_ORDER.map((r) => {
            const bound = POINTS.filter((p) => p.roles.includes(r));
            return (
              <Card key={r} className="role-card" bodyStyle={{ padding: 16 }}>
                <div className="role-card-head">
                  <Text strong>{tp(`roles.${r}.label`)}</Text>
                  <Text type="tertiary" size="small">{tp('boundCount', { count: roleBoundCount[r] })}</Text>
                </div>
                <Text type="tertiary" size="small" className="role-summary">
                  {tp(`roles.${r}.summary`)} · {tp(`roles.${r}.archMapping`)}
                </Text>
                <div className="role-tags">
                  {bound.map((p) => (
                    <Tag key={p.code} color="blue" type="light" size="small">{p.code}</Tag>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Section C — 角色 × 权限矩阵 */}
      <section className="section matrix-section">
        <Title heading={5} className="section-title">{tp('sectionTitles.matrix')}</Title>
        <Table
          size="small"
          columns={matrixColumns}
          dataSource={matrixData}
          rowKey="code"
          pagination={false}
        />
      </section>

      {/* Section D — 业务规则提示 */}
      <section className="section rules-section">
        <Text type="tertiary" size="small">{tp('rules.br002')}</Text>
        <Text type="tertiary" size="small">{tp('rules.br003')}</Text>
      </section>
    </div>
  );
};

export default PermissionsPage;
