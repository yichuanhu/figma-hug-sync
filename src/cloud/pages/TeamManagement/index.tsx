import { useState } from 'react';
import { Avatar, Button, Input, Tag, Toast, Dropdown } from '@douyinfe/semi-ui';
import { MoreHorizontal } from 'lucide-react';
import { cloudOwnedTeams, cloudJoinedTeams, cloudInvitations } from '@/cloud/mock';
import type { CloudInvitation } from '@/cloud/types';
import './index.less';

const TeamManagement = () => {
  const team = cloudOwnedTeams[0];
  const [invitations, setInvitations] = useState<CloudInvitation[]>(cloudInvitations);
  const [email, setEmail] = useState('');

  const handleInvite = () => {
    if (!email.trim()) {
      Toast.warning('请输入成员邮箱');
      return;
    }
    setInvitations((prev) => [
      ...prev,
      { id: `i-${Date.now()}`, email: email.trim(), expiresAt: '2026-09-27 18:00' },
    ]);
    setEmail('');
    Toast.success('邀请已发送');
  };

  const handleCancelInvite = (id: string) => {
    setInvitations((prev) => prev.filter((i) => i.id !== id));
    Toast.success('邀请已取消');
  };

  return (
    <div className="cloud-team">
      <section>
        <div className="section-head">
          <div>
            <div className="cloud-section-title">我拥有的团队</div>
            <div className="cloud-section-desc">你可以管理成员、套餐和团队资源。</div>
          </div>
          <Button theme="solid" type="primary" onClick={handleInvite}>邀请成员</Button>
        </div>

        <div className="cloud-team-summary">
          <div className="cloud-card cloud-team-identity">
            <Avatar size="large" style={{ background: '#17B26A' }}>{team.initials}</Avatar>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="t-label">团队空间</div>
              <div className="t-name">{team.name}</div>
              <div className="t-desc">由 {team.ownerName} 创建并管理</div>
            </div>
            <Tag color="green" size="small">使用中</Tag>
          </div>
          <div className="cloud-card">
            <div className="stat-label">团队成员</div>
            <div className="stat-value">{team.memberCount}</div>
            <div className="stat-desc">含 1 位所有者</div>
          </div>
          <div className="cloud-card">
            <div className="stat-label">共享积分</div>
            <div className="stat-value">{team.sharedCredits}</div>
            <div className="stat-desc">所有活跃成员可使用</div>
          </div>
          <div className="cloud-card">
            <div className="stat-label">待接受邀请</div>
            <div className="stat-value">{invitations.length}</div>
            <div className="stat-desc">邀请将在到期后失效</div>
          </div>
        </div>
      </section>

      <div className="cloud-team-main">
        <div className="cloud-card">
          <div className="section-head" style={{ marginBottom: 4 }}>
            <div>
              <div className="cloud-section-title">成员</div>
              <div className="cloud-section-desc">管理访问团队空间的人员</div>
            </div>
            <span style={{ fontSize: 13, color: 'var(--cloud-text-2)' }}>{team.members.length} 位成员</span>
          </div>
          {team.members.map((m) => (
            <div key={m.id} className="cloud-team-member-row">
              <Avatar size="small" style={{ background: '#2b3350' }}>{m.name}</Avatar>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="m-name">{m.name}</div>
                <div className="m-mail">{m.email}</div>
              </div>
              <Tag color={m.role === 'OWNER' ? 'blue' : 'grey'} size="small">
                {m.role === 'OWNER' ? '团队所有者' : '成员'}
              </Tag>
              <Tag color="green" size="small">使用中</Tag>
              <Dropdown
                trigger="click"
                position="bottomRight"
                render={
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => Toast.info('已复制成员邮箱')}>复制邮箱</Dropdown.Item>
                    <Dropdown.Item
                      type="danger"
                      disabled={m.role === 'OWNER'}
                      onClick={() => Toast.success('已移出团队')}
                    >
                      移出团队
                    </Dropdown.Item>
                  </Dropdown.Menu>
                }
              >
                <Button theme="borderless" type="tertiary" icon={<MoreHorizontal size={16} />} />
              </Dropdown>
            </div>
          ))}
        </div>

        <div className="cloud-card">
          <div className="cloud-section-title">邀请新成员</div>
          <div className="cloud-section-desc" style={{ marginBottom: 12 }}>对方接受后即可共享团队套餐</div>
          <div style={{ fontSize: 12, color: 'var(--cloud-text-2)', marginBottom: 6 }}>成员邮箱</div>
          <Input
            value={email}
            onChange={setEmail}
            placeholder="member@example.com"
            size="large"
          />
          <Button
            theme="solid"
            type="primary"
            block
            size="large"
            style={{ marginTop: 12 }}
            onClick={handleInvite}
          >
            发送邀请
          </Button>

          <div style={{ fontSize: 13, fontWeight: 600, marginTop: 24 }}>待接受邀请</div>
          {invitations.length === 0 && (
            <div style={{ fontSize: 13, color: 'var(--cloud-text-2)', marginTop: 12 }}>暂无待接受的邀请</div>
          )}
          {invitations.map((i) => (
            <div key={i.id} className="cloud-team-invite-row">
              <div style={{ minWidth: 0 }}>
                <div className="i-mail">{i.email}</div>
                <div className="i-exp">{i.expiresAt} 前有效</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <Tag color="orange" size="small">待接受</Tag>
                <Button theme="borderless" type="danger" size="small" onClick={() => handleCancelInvite(i.id)}>
                  取消
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <section>
        <div className="section-head">
          <div>
            <div className="cloud-section-title">我加入的团队</div>
            <div className="cloud-section-desc">已加入 {cloudJoinedTeams.length} 个团队，最多可加入 5 个。</div>
          </div>
        </div>
        <div className="cloud-grid cols-2">
          {cloudJoinedTeams.map((t) => (
            <div key={t.id} className="cloud-card cloud-team-joined-card">
              <div className="j-head">
                <Avatar size="default" style={{ background: '#17B26A' }}>{t.initials}</Avatar>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="j-name">{t.name}</div>
                  <div className="j-desc">{t.memberCount} 位成员 · {t.planName}</div>
                </div>
                <Tag color="green" size="small">使用中</Tag>
              </div>
              <div className="j-meta">
                <div>
                  <div className="k">我的角色</div>
                  <div className="v">成员</div>
                </div>
                <div>
                  <div className="k">加入时间</div>
                  <div className="v">{t.joinedAt}</div>
                </div>
                <div>
                  <div className="k">共享积分</div>
                  <div className="v">{t.sharedCredits}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default TeamManagement;
