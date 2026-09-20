import { useNavigate } from 'react-router-dom';
import { Avatar, Button, Tag } from '@douyinfe/semi-ui';
import { Wallet, Package, Users, CreditCard, ChevronRight, ArrowRight, FileText, Sparkles, Headphones } from 'lucide-react';
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
  { key: 'plan', icon: CreditCard, label: '当前套餐', value: 'Basic', desc: '按月订阅', path: '/cloud/billing/plans' },
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
        <div className="user-card">
          <Avatar size="default" className="cloud-user-avatar">{cloudUser.initials}</Avatar>
          <div>
            <div className="u-name">{cloudUser.name}</div>
            <div className="u-mail">{cloudUser.email}</div>
          </div>
        </div>
      </section>

      <div className="cloud-grid cols-4">
        {METRICS.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.key} className="cloud-card cloud-home-metric" onClick={() => navigate(m.path)}>
               <div className={`cloud-icon-box metric-${m.key}`}>
                <Icon size={20} strokeWidth={2} />
              </div>
              <div className="body">
                <div className="label">{m.label}</div>
                <div className="value">{m.value}</div>
                <div className="desc">{m.desc}</div>
              </div>
               <ChevronRight size={18} className="chevron" />
            </div>
          );
        })}
      </div>

      <section>
        <div className="cloud-section-title">我的产品</div>
        <div className="cloud-section-desc" style={{ marginBottom: 16 }}>选择一个产品，继续你的工作。</div>
        <div className="cloud-grid cols-3">
          {cloudProducts.map((p) => {
            const Icon = PRODUCT_ICONS[p.code] || FileText;
            return (
              <div key={p.id} className="cloud-card cloud-home-product">
                 <div className={`cloud-icon-box product-${p.code.toLowerCase()}`}>
                  <Icon size={20} strokeWidth={2} />
                </div>
                <div className="code">{p.code}</div>
                <div className="p-name">{p.name}</div>
                <div className="p-desc">{p.description}</div>
                <div className="p-footer">
                  <span>最近使用：{p.lastUsed}</span>
                  <Button theme="light" type="tertiary" icon={<ArrowRight size={14} />} iconPosition="right">
                    进入应用
                  </Button>
                </div>
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
                <div className="m">{t.memberCount} 位成员 · {t.planName}</div>
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
