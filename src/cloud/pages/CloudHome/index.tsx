import { useNavigate } from 'react-router-dom';
import { Avatar, Button, Tag } from '@douyinfe/semi-ui';
import { ArrowRight } from 'lucide-react';
import { cloudProducts, cloudLedger, cloudOwnedTeams, cloudJoinedTeams } from '@/cloud/mock';
import documentIcon from '@/assets/shortcut-new-process.svg';
import meetingIcon from '@/assets/shortcut-create-task.svg';
import serviceIcon from '@/assets/shortcut-new-robot.svg';
import creditsIcon from '@/assets/metrics/saved-cost.svg';
import resourcesIcon from '@/assets/metrics/processes.svg';
import teamsIcon from '@/assets/metrics/robots.svg';
import './index.less';

const PRODUCT_ICONS: Record<string, string> = { ADP: documentIcon, MEETING: meetingIcon, SERVICE: serviceIcon };
const METRICS = [
  { key: 'credits', icon: creditsIcon, label: '可用通用积分', value: '80', unit: '分', path: '/cloud/billing/credits' },
  { key: 'resources', icon: resourcesIcon, label: '专项资源', value: '0', unit: '项', path: '/cloud/billing/packs' },
  { key: 'teams', icon: teamsIcon, label: '团队空间', value: '3', unit: '个', path: '/cloud/teams' },
];

const CloudHome = () => {
  const navigate = useNavigate();
  const allTeams = [...cloudOwnedTeams, ...cloudJoinedTeams];

  return (
    <div className="cloud-home">
      <section className="cloud-card cloud-home-products-section">
        <div className="card-head"><div className="cloud-section-title">我的产品</div><span className="product-count">3 个产品</span></div>
        <div className="cloud-home-products">
          {cloudProducts.map((p) => (
            <div key={p.id} className={`cloud-home-product product-${p.code.toLowerCase()}`}>
              <div className="product-copy">
                <div className="p-name">{p.name}</div>
                <div className="p-desc">{p.description}</div>
                <div className="last-used">最近使用：{p.lastUsed}</div>
              </div>
              <img className="product-icon" src={PRODUCT_ICONS[p.code] || documentIcon} alt="" />
              <Button className="product-entry" theme="borderless" type="primary" icon={<ArrowRight size={14} />} iconPosition="right">进入应用</Button>
            </div>
          ))}
        </div>
      </section>

      <section className="cloud-card cloud-home-metrics">
        <div className="cloud-section-title">资源概览</div>
        <div className="overview-metrics">
          {METRICS.map((m) => (
            <Button key={m.key} className="overview-metric" theme="borderless" onClick={() => navigate(m.path)}>
              <img className="metric-icon" src={m.icon} alt="" />
              <span className="metric-copy"><span className="metric-label">{m.label}</span><span className="metric-value">{m.value}<small>{m.unit}</small></span></span>
            </Button>
          ))}
        </div>
      </section>

      <div className="cloud-home-bottom">
        <section className="home-panel">
            <div className="card-head"><div className="cloud-section-title">最近收支</div><Button theme="borderless" type="tertiary" icon={<ArrowRight size={14} />} iconPosition="right" onClick={() => navigate('/cloud/billing/credits')}>查看全部</Button></div>
            {cloudLedger.map((r) => (
              <div key={r.id} className="cloud-home-ledger-row">
                <div><div className="t">{r.title}</div><div className="s">{r.scene === '个人空间' ? '产品使用' : r.scene}</div></div>
                <div><div className={`amount${r.type === 'INCOME' ? ' income' : ''}`}>{r.type === 'INCOME' ? '+' : '-'}{r.amount}</div><div className="time">{r.time}</div></div>
              </div>
            ))}
        </section>

        <section className="home-panel">
          <div className="card-head"><div className="cloud-section-title">团队空间</div><Button theme="borderless" type="tertiary" icon={<ArrowRight size={14} />} iconPosition="right" onClick={() => navigate('/cloud/teams')}>团队管理</Button></div>
          {allTeams.map((t) => (
            <div key={t.id} className="cloud-home-team-row">
              <Avatar size="small" className={t.myRole === 'OWNER' ? 'cloud-avatar-team' : 'cloud-user-avatar'}>{t.initials}</Avatar>
              <div className="team-copy"><div className="n">{t.name}</div><div className="m">{t.memberCount} 位成员</div></div>
              <Tag color={t.myRole === 'OWNER' ? 'green' : 'blue'} size="small">{t.myRole === 'OWNER' ? '团队所有者' : '成员'}</Tag>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};

export default CloudHome;
