import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabPane, Tag, Button, Progress, Switch, Toast, Select, Table } from '@douyinfe/semi-ui';
import { Check, FileText, Sparkles, Wallet } from 'lucide-react';
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
      <Tabs
        activeKey={activeKey}
        type="line"
        keepDOM={false}
        onChange={(key) => navigate(`/cloud/billing/${key}`)}
      >
        <TabPane tab="积分中心" itemKey="credits">
          <div className="billing-context"><span>当前账户</span><strong>张明的个人空间</strong></div>
          <div className="credit-overview billing-grid-tight">
            <div className="credit-balance-card">
              <div className="c-name">{cloudCreditAccounts[0].name}</div>
              <div className="c-sub">可用积分</div>
              <div className="c-balance">{cloudCreditAccounts[0].balance}</div>
              <div className="c-foot"><span>账户状态正常</span><span>可用于全部已接入产品</span></div>
            </div>
            <div className="cloud-card credit-source-card">
              <div className="card-head"><div><div className="cloud-section-title">积分组成</div><div className="cloud-section-desc">优先使用即将到期的积分</div></div><span>1 个来源</span></div>
              <div className="credit-source-row"><span><i />平台注册赠送<small>长期有效</small></span><b>80</b></div>
            </div>
          </div>

          <div className="credit-insights">
            <div className="cloud-card usage-card">
              <div className="card-head"><div><div className="cloud-section-title">近 7 天积分使用</div><div className="cloud-section-desc">已完成 AI 任务的实际结算量</div></div><b className="total">累计 0</b></div>
              <div className="usage-bars">{['四', '五', '六', '日', '一', '二', '三'].map((day, index) => <div key={day}><span className={index === 6 ? 'active' : ''} /><small>{day}</small></div>)}</div>
            </div>
            <div className="cloud-card expiry-card">
              <div className="cloud-section-title">有效期提醒</div>
              <div className="cloud-section-desc">优先使用即将到期的积分</div>
              <div className="expiry-status"><Check size={18} /><div><b>近期没有积分到期</b><small>当前积分均为长期积分</small></div></div>
            </div>
          </div>

          <div className="cloud-card billing-ledger-card">
            <div className="card-head"><div><div className="cloud-section-title">积分明细</div><div className="cloud-section-desc ledger-desc">所有到账、使用和套餐调整记录</div></div><Select size="small" defaultValue="all" optionList={[{ value: 'all', label: '全部' }, { value: 'income', label: '到账' }, { value: 'expense', label: '使用' }]} /></div>
            <Table size="small" pagination={false} dataSource={cloudLedger} rowKey="id" columns={[
              { title: '时间', dataIndex: 'time' },
              { title: '说明', dataIndex: 'title', render: (value, record) => <div><div>{value}</div><div className="table-sub">{record.scene}</div></div> },
              { title: '类型', dataIndex: 'type', render: (value) => <Tag color={value === 'INCOME' ? 'green' : 'grey'} size="small">{value === 'INCOME' ? '到账' : '使用'}</Tag> },
              { title: '积分变动', dataIndex: 'amount', render: (value, record) => <span className={record.type === 'INCOME' ? 'income' : ''}>{record.type === 'INCOME' ? '+' : '-'}{value}</span> },
              { title: '结果', render: () => <Tag color="green" size="small">已完成</Tag> },
              { title: '操作', render: () => <Button theme="borderless" type="primary" size="small">详情</Button> },
            ]} />
          </div>
        </TabPane>

        <TabPane tab="资源包" itemKey="packs">
          <div className="billing-context"><span>当前账户</span><strong>张明的个人空间</strong></div>
          <div className="cloud-grid cols-2 billing-grid-tight">
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
                  <Progress percent={percent} stroke={expired ? 'var(--semi-color-disabled-border)' : 'var(--semi-color-primary)'} />
                  <div className="p-exp">{expired ? '过期时间' : '有效期至'}：{p.expiresAt}</div>
                </div>
              );
            })}
          </div>
        </TabPane>

        <TabPane tab="套餐与订阅" itemKey="plans">
          <div className="billing-context"><span>当前账户</span><strong>张明的个人空间</strong></div>
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
                <div className="v renew-control">
                  <Switch checked={autoRenew} onChange={setAutoRenew} size="small" />
                  <span>{autoRenew ? '已开启' : '已关闭'}</span>
                </div>
              </div>
              <Button theme="light" type="tertiary" onClick={() => Toast.info('已打开账单记录')}>
                查看账单
              </Button>
            </div>
          </div>

          <div className="cloud-grid cols-3 billing-grid-plans">
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
                      <Check size={16} className="feature-check" strokeWidth={2.5} />
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

          <section className="purchase-section">
            <div className="cloud-section-title">购买附加资源</div>
            <div className="cloud-section-desc">按需补充通用积分或专项额度，购买后立即到账。</div>
            <div className="cloud-grid cols-3 purchase-grid">
              <div className="cloud-card purchase-card">
                <div className="cloud-icon-box"><Wallet size={18} /></div>
                <Tag size="small" color="green">通用积分</Tag>
                <div className="purchase-main">
                  <div>
                    <b>通用积分充值</b>
                    <p>补充账户通用积分，可用于全部已接入产品</p>
                  </div>
                  <strong>¥10 <small>起</small></strong>
                </div>
                <div className="purchase-foot">
                  <div><b>按量计费</b><small>长期有效</small></div>
                  <Button theme="solid" type="primary" onClick={() => Toast.success('已进入充值流程')}>立即充值</Button>
                </div>
              </div>
              <div className="cloud-card purchase-card">
                <div className="cloud-icon-box"><FileText size={18} /></div>
                <Tag size="small" color="blue">文档智能</Tag>
                <div className="purchase-main">
                  <div>
                    <b>高精度解析加量包</b>
                    <p>适用于合同、票据和复杂格式文档的高精度解析</p>
                  </div>
                  <strong>1,000 <small>页</small></strong>
                </div>
                <div className="purchase-foot">
                  <div><b>¥49</b><small>长期有效</small></div>
                  <Button theme="solid" type="primary" onClick={() => Toast.success('已进入购买流程')}>立即购买</Button>
                </div>
              </div>
              <div className="cloud-card purchase-card">
                <div className="cloud-icon-box resource-meeting"><Sparkles size={18} /></div>
                <Tag size="small" color="green">会议助手</Tag>
                <div className="purchase-main">
                  <div>
                    <b>会议转写 600 分钟包</b>
                    <p>适用于实时字幕、会议转写和会后纪要生成</p>
                  </div>
                  <strong>600 <small>分钟</small></strong>
                </div>
                <div className="purchase-foot">
                  <div><b>¥39</b><small>90 天有效</small></div>
                  <Button theme="solid" type="primary" onClick={() => Toast.success('已进入购买流程')}>立即购买</Button>
                </div>
              </div>
            </div>
          </section>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default Billing;
