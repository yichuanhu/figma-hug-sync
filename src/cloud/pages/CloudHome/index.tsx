import { useNavigate } from 'react-router-dom';
import { Avatar, Button, Tag } from '@douyinfe/semi-ui';
import { Wallet, Package, Users, ChevronRight, ArrowRight, FileText, Sparkles, Headphones } from 'lucide-react';
import { cloudUser, cloudProducts, cloudLedger, cloudOwnedTeams, cloudJoinedTeams } from '@/cloud/mock';
import './index.less';

const PRODUCT_ICONS: Record<string, typeof FileText> = {
  ADP: FileText,
  MEETING: Sparkles,
  SERVICE: Headphones,
};

const METRICS = [
  { key: 'credits', icon: Wallet, label: '可用通用积分', value: '80', desc: '张明的个人空间', path: '/cloud/billing/credits' },
  { key: 'resources', icon: Package, label: '专项资源', value: '0', desc: '暂无可用资源', path: '/cloud/billing/packs' },
  { key: 'teams', icon: Users, label: '我的团队', value: '3', desc: '1 个拥有 · 2 个加入', path: '/cloud/teams' },
];

const CloudHome = () => {
  const navigate = useNavigate();
  const allTeams = [...cloudOwnedTeams, ...cloudJoinedTeams];

  return (
    <div className="cloud-home">
      <section className="cloud-home-welcome">
        <div>
          <div className="greeting">下午好，{cloudUser.name}</div>
          <div className="sub">从这里进入你的产品，或管理个人资产与团队。</div>
        </div>
      </section>

      <section className="cloud-home-profile">
        <div className="profile-identity">
          <Avatar size="large" className="cloud-user-avatar">{cloudUser.initials}</Avatar>
          <div className="profile-copy">
            <div className="profile-kicker">个人空间</div>
            <div className="profile-name">{cloudUser.name}</div>
            <div className="profile-meta">
              <span>{cloudUser.email}</span>
              <i />
              <span>{cloudUser.workspaceName}</span>
            </div>
          </div>
        </div>
        <div className="profile-assets">
          {METRICS.map((m) => {
            const Icon = m.icon;
            return (
              <button key={m.key} className="profile-asset" type="button" onClick={() => navigate(m.path)}>
                <span className={`asset-icon metric-${m.key}`}><Icon size={18} strokeWidth={2} /></span>
                <span className="asset-copy">
                  <span className="asset-label">{m.label}</span>
                  <strong>{m.value}</strong>
                  <span className="asset-desc">{m.desc}</span>
                </span>
                <ChevronRight size={16} className="chevron" />
              </button>
            );
          })}
        </div>
      </section>

      <section className="cloud-home-products-section">
        <div className="section-heading">
          <div>
            <div className="cloud-section-title">我的产品</div>
            <div className="cloud-section-desc">选择一个产品，继续你的工作。</div>
          </div>
        </div>
        <div className="cloud-home-products">
          {cloudProducts.map((p) => {
            const Icon = PRODUCT_ICONS[p.code] || FileText;
            return (
              <div key={p.id} className="cloud-home-product">
                <div className={`cloud-icon-box product-${p.code.toLowerCase()}`}>
                  <Icon size={20} strokeWidth={2} />
                </div>
                <div className="product-copy">
                  <div className="product-title-line"><span className="p-name">{p.name}</span><span className="code">{p.code}</span></div>
                  <div className="p-desc">{p.description}</div>
                  <div className="last-used">最近使用：{p.lastUsed}</div>
              </div>
                <Button theme="light" type="tertiary" icon={<ArrowRight size={14} />} iconPosition="right">进入应用</Button>
              </div>
            );
          })}
        </div>
      </section>

      <div className="cloud-grid cols-2">
        <div className="cloud-card">
          <div className="card-head">
            <div>
              <div className="cloud-section-title">最近收支</div>
              <div className="cloud-section-desc">个人空间的资产变动</div>
            </div>
            <Button
              theme="borderless"
              type="primary"
              icon={<ArrowRight size={14} />}
              iconPosition="right"
              onClick={() => navigate('/cloud/billing/credits')}
            >
              查看全部
            </Button>
          </div>
          {cloudLedger.map((r) => (
            <div key={r.id} className="cloud-home-ledger-row">
              <div>
                <div className="t">{r.title}</div>
                <div className="s">{r.scene}</div>
              </div>
              <div>
                <div className={`amount${r.type === 'INCOME' ? ' income' : ''}`}>
                  {r.type === 'INCOME' ? '+' : '-'}{r.amount}
                </div>
                <div className="time">{r.time}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="cloud-card">
          <div className="card-head">
            <div>
              <div className="cloud-section-title">团队空间</div>
              <div className="cloud-section-desc">与团队成员共享套餐和资源</div>
            </div>
            <Button
              theme="borderless"
              type="primary"
              icon={<ArrowRight size={14} />}
              iconPosition="right"
              onClick={() => navigate('/cloud/teams')}
            >
              团队管理
            </Button>
          </div>
          {allTeams.map((t) => (
            <div key={t.id} className="cloud-home-team-row">
               <Avatar size="small" className={t.myRole === 'OWNER' ? 'cloud-avatar-team' : 'cloud-user-avatar'}>
                {t.initials}
              </Avatar>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="n">{t.name}</div>
                <div className="m">{t.memberCount} 位成员</div>
              </div>
              <Tag color={t.myRole === 'OWNER' ? 'green' : 'blue'} size="small">
                {t.myRole === 'OWNER' ? '团队所有者' : '成员'}
              </Tag>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CloudHome;
