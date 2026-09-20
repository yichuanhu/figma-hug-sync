import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabPane, Tag, Button, Progress, Switch, Toast } from '@douyinfe/semi-ui';
import { Check } from 'lucide-react';
import { cloudCreditAccounts, cloudLedger, cloudResourcePacks, cloudPlans, cloudSubscription } from '@/cloud/mock';
import './index.less';

const TAB_KEYS = ['credits', 'packs', 'plans'];

const Billing = () => {
  const { tab } = useParams();
  const navigate = useNavigate();
  const activeKey = tab && TAB_KEYS.includes(tab) ? tab : 'credits';
  const [autoRenew, setAutoRenew] = useState(cloudSubscription.autoRenew);

  return (
    <div className="cloud-billing">
      <div className="billing-head">
        <div>
          <div className="billing-title">费用与资源</div>
          <div className="billing-desc">管理积分、专项资源包以及套餐订阅。</div>
        </div>
        <div className="account-switch">
          <span className="dot" />
          <span className="k">当前账户</span>
          <span>张明的个人空间</span>
        </div>
      </div>

      <Tabs
        activeKey={activeKey}
        type="line"
        keepDOM={false}
        onChange={(key) => navigate(`/cloud/billing/${key}`)}
      >
        <TabPane tab="积分中心" itemKey="credits">
          <div className="cloud-grid cols-2" style={{ marginTop: 8 }}>
            {cloudCreditAccounts.map((a) => (
              <div key={a.id} className="cloud-card credit-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="c-name">{a.name}</span>
                  <Tag color={a.type === 'PERSONAL' ? 'blue' : 'green'} size="small">
                    {a.type === 'PERSONAL' ? '个人' : '团队共享'}
                  </Tag>
                </div>
                <div className="c-balance">{a.balance}</div>
                <div className="c-sub">当前可用积分</div>
                <div className="c-meta">
                  <div>每月发放<b>{a.monthlyGrant}</b></div>
                  <div>本月已用<b>{a.usedThisMonth}</b></div>
                  <div>有效期<b>{a.expireDesc}</b></div>
                </div>
              </div>
            ))}
          </div>

          <div className="cloud-card" style={{ marginTop: 16 }}>
            <div className="cloud-section-title">收支明细</div>
            <div className="cloud-section-desc" style={{ marginBottom: 8 }}>记录积分的获取与消耗</div>
            {cloudLedger.map((r) => (
              <div key={r.id} className="ledger-row">
                <div>
                  <div className="t">{r.title}</div>
                  <div className="s">{r.scene}</div>
                </div>
                <div>
                  <div className={`a${r.type === 'INCOME' ? ' income' : ''}`}>
                    {r.type === 'INCOME' ? '+' : '-'}{r.amount}
                  </div>
                  <div className="time">{r.time}</div>
                </div>
              </div>
            ))}
          </div>
        </TabPane>

        <TabPane tab="资源包" itemKey="packs">
          <div className="cloud-grid cols-2" style={{ marginTop: 8 }}>
            {cloudResourcePacks.map((p) => {
              const percent = p.total > 0 ? Math.round((p.used / p.total) * 100) : 0;
              const expired = p.status === 'EXPIRED';
              return (
                <div key={p.id} className="cloud-card pack-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div className="p-name">{p.name}</div>
                      <div className="p-product">适用产品：{p.productName}</div>
                    </div>
                    <Tag color={expired ? 'grey' : 'green'} size="small">{expired ? '已过期' : '生效中'}</Tag>
                  </div>
                  <div className="p-usage">
                    <span>已使用 {p.used} {p.unit}</span>
                    <span>共 {p.total} {p.unit}</span>
                  </div>
                  <Progress percent={percent} stroke={expired ? '#c9cdd8' : '#4a55e8'} />
                  <div className="p-exp">{expired ? '过期时间' : '有效期至'}：{p.expiresAt}</div>
                </div>
              );
            })}
          </div>
        </TabPane>

        <TabPane tab="套餐与订阅" itemKey="plans">
          <div className="cloud-grid cols-3" style={{ marginTop: 16 }}>
            {cloudPlans.map((p) => (
              <div key={p.id} className={`cloud-card plan-card${p.recommended ? ' recommended' : ''}`}>
                {p.recommended && (
                  <div className="pl-badge">
                    <Tag color="violet" size="small">推荐</Tag>
                  </div>
                )}
                <div className="pl-head">
                  <span className="pl-name">{p.name}</span>
                  {p.current && <Tag color="green" size="small">当前套餐</Tag>}
                </div>
                <div className="pl-price">
                  {p.price}
                  {p.priceSuffix && <span>{p.priceSuffix}</span>}
                </div>
                <div className="pl-desc">{p.description}</div>
                <ul className="pl-features">
                  {p.features.map((f) => (
                    <li key={f}>
                      <Check size={16} color="#17B26A" strokeWidth={2.5} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  block
                  size="large"
                  theme={p.current ? 'light' : 'solid'}
                  type={p.current ? 'tertiary' : 'primary'}
                  disabled={p.current}
                  onClick={() => Toast.info(p.customized ? '我们会尽快与你联系' : '已发起套餐变更')}
                >
                  {p.current ? '当前使用中' : p.customized ? '联系我们' : '升级到该套餐'}
                </Button>
              </div>
            ))}
          </div>

          <div className="cloud-card subscription-bar">
            <div>
              <div className="s-label">当前订阅</div>
              <div className="s-plan">{cloudSubscription.planName}</div>
              <div className="s-next">下次扣费时间：{cloudSubscription.nextBillingDate}</div>
            </div>
            <div className="s-metas">
              <div>
                <div className="s-label">扣费账户</div>
                <div className="v">{cloudSubscription.accountName}</div>
              </div>
              <div>
                <div className="s-label">自动续费</div>
                <div className="v" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Switch checked={autoRenew} onChange={setAutoRenew} size="small" />
                  <span>{autoRenew ? '已开启' : '已关闭'}</span>
                </div>
              </div>
              <Button theme="light" type="tertiary" onClick={() => Toast.info('已打开账单记录')}>
                查看账单
              </Button>
            </div>
          </div>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default Billing;
