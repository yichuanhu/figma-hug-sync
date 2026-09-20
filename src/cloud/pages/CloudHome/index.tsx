import { useNavigate } from 'react-router-dom';
import { Avatar, Button, Tag } from '@douyinfe/semi-ui';
import { Wallet, Package, Users, ArrowRight, FileText, Sparkles, Headphones } from 'lucide-react';
import { cloudProducts, cloudLedger, cloudOwnedTeams, cloudJoinedTeams } from '@/cloud/mock';
import './index.less';

const PRODUCT_ICONS: Record<string, typeof FileText> = {
  ADP: FileText,
  MEETING: Sparkles,
  SERVICE: Headphones,
};

const METRICS = [
  { key: 'credits', icon: Wallet, label: '可用通用积分', value: '80', unit: '分', path: '/cloud/billing/credits' },
  { key: 'resources', icon: Package, label: '专项资源', value: '0', unit: '项', path: '/cloud/billing/packs' },
  { key: 'teams', icon: Users, label: '团队空间', value: '3', unit: '个', path: '/cloud/teams' },
];

const CloudHome = () => {
  const navigate = useNavigate();
  const allTeams = [...cloudOwnedTeams, ...cloudJoinedTeams];

  return (
    <div className="cloud-home">
      <section className="cloud-home-overview">
        <div className="overview-copy">
          <div className="overview-eyebrow">工作台</div>
          <div className="overview-title">开始今天的工作</div>
          <div className="overview-desc">进入产品继续任务，或查看当前资源使用情况。</div>
        </div>
        <div className="overview-metrics">
          {METRICS.map((m) => {
            const Icon = m.icon;
            return (
              <Button key={m.key} className={`overview-metric metric-${m.key}`} theme="borderless" onClick={() => navigate(m.path)}>
                <span className="metric-icon"><Icon size={17} strokeWidth={2} /></span>
                <span className="metric-copy">
                  <span className="metric-label">{m.label}</span>
                  <span className="metric-value">{m.value}<small>{m.unit}</small></span>
                </span>
              </Button>
            );
          })}
        </div>
      </section>

      <section className="cloud-home-products-section">
        <div className="section-heading section-heading-row">
          <div>
            <div className="cloud-section-title">我的产品</div>
            <div className="cloud-section-desc">选择产品，继续最近的工作</div>
          </div>
          <span className="product-count">3 个产品</span>
        </div>
        <div className="cloud-home-products">
          {cloudProducts.map((p) => {
            const Icon = PRODUCT_ICONS[p.code] || FileText;
            return (
              <div key={p.id} className={`cloud-home-product product-${p.code.toLowerCase()}`}>
                <div className="product-topline">
                  <div className="cloud-icon-box">
                  <Icon size={20} strokeWidth={2} />
                  </div>
                  <span className="code">{p.code}</span>
                </div>
                <div className="product-copy">
                  <div className="product-title-line"><span className="p-name">{p.name}</span></div>
                  <div className="p-desc">{p.description}</div>
                </div>
                <div className="product-footer">
                  <span className="last-used">最近使用：{p.lastUsed}</span>
                  <Button theme="borderless" type="primary" icon={<ArrowRight size={14} />} iconPosition="right">进入应用</Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="cloud-home-secondary">
        <section className="home-panel">
          <div className="card-head">
            <div>
              <div className="cloud-section-title">最近收支</div>
              <div className="cloud-section-desc">最近的积分与资源变动</div>
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
                <div className="s">{r.scene === '个人空间' ? '产品使用' : r.scene}</div>
              </div>
              <div>
                <div className={`amount${r.type === 'INCOME' ? ' income' : ''}`}>
                  {r.type === 'INCOME' ? '+' : '-'}{r.amount}
                </div>
                <div className="time">{r.time}</div>
              </div>
            </div>
          ))}
        </section>

        <section className="home-panel">
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
        </section>
      </div>
    </div>
  );
};

export default CloudHome;
