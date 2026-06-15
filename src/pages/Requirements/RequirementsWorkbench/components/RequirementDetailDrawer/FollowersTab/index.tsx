/**
 * 需求关注者 Tab
 * - 系统自动同步：根据关联流程聚合流程负责人 / 开发者 / 代码审核员
 * - 手动添加：支持手动添加关注者（来源标记为「手动添加」）
 * - 关注者拥有需求的只读访问权限，不能编辑、删除或参与审批
 */

import { useMemo, useState } from 'react';
import { Avatar, Tag, Typography, Banner, Tooltip, Button, Modal, Select, Toast } from '@douyinfe/semi-ui';
import { Info, GitBranch, UserPlus, Hand, X, Lock } from 'lucide-react';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import EmptyState from '@/components/EmptyState';
import type { RequirementItem, LinkedProcess } from '../../../types';
import './index.less';

const { Text } = Typography;

type FollowerRole = 'process_owner' | 'developer' | 'code_reviewer' | 'manual';

interface FollowerSource {
  processId?: string;
  processName?: string;
  role: FollowerRole;
}

interface FollowerEntry {
  userId: string;
  userName: string;
  department?: string;
  email?: string;
  sources: FollowerSource[];
}

const ROLE_LABEL: Record<FollowerRole, string> = {
  process_owner: '流程负责人',
  developer: '开发者',
  code_reviewer: '代码审核员',
  manual: '手动添加',
};

const ROLE_COLOR: Record<FollowerRole, 'blue' | 'green' | 'violet' | 'orange'> = {
  process_owner: 'blue',
  developer: 'green',
  code_reviewer: 'violet',
  manual: 'orange',
};

// 确定性 mock：根据流程 id 派生开发者 / 代码审核员
const DEV_POOL = [
  { name: 'Daniel Hu', dept: '智能自动化中心 · 开发组' },
  { name: 'Linda Zhao', dept: '智能自动化中心 · 开发组' },
  { name: 'Kevin Sun', dept: '智能自动化中心 · 平台组' },
  { name: 'Grace Lin', dept: '智能自动化中心 · 平台组' },
];
const REVIEWER_POOL = [
  { name: 'Frank Chen', dept: '智能自动化中心 · 质量组' },
  { name: 'Helen Wu', dept: '智能自动化中心 · 质量组' },
];

// 可被手动添加的候选用户池
const CANDIDATE_POOL = [
  { userId: 'user-Alice Wang', userName: 'Alice Wang', department: '产品中心 · 需求组' },
  { userId: 'user-Bob Liu', userName: 'Bob Liu', department: '产品中心 · 需求组' },
  { userId: 'user-Cathy Zhou', userName: 'Cathy Zhou', department: '运营中心 · 业务组' },
  { userId: 'user-David Lee', userName: 'David Lee', department: '运营中心 · 业务组' },
  { userId: 'user-Eric Yang', userName: 'Eric Yang', department: '智能自动化中心 · 架构组' },
  { userId: 'user-Fiona Xu', userName: 'Fiona Xu', department: '智能自动化中心 · 架构组' },
];

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const buildAutoFollowers = (processes: LinkedProcess[]): FollowerEntry[] => {
  const map = new Map<string, FollowerEntry>();
  const push = (
    key: string,
    info: { userName: string; department?: string },
    source: FollowerSource,
  ) => {
    const exist = map.get(key);
    if (exist) {
      if (!exist.sources.find((s) => s.processId === source.processId && s.role === source.role)) {
        exist.sources.push(source);
      }
    } else {
      map.set(key, {
        userId: key,
        userName: info.userName,
        department: info.department,
        sources: [source],
      });
    }
  };

  processes.forEach((p) => {
    if (p.ownerName) {
      push(
        `user-${p.ownerName}`,
        { userName: p.ownerName, department: '智能自动化中心 · 流程组' },
        { processId: p.id, processName: p.name, role: 'process_owner' },
      );
    }
    const devSeed = hash(p.id);
    const devCount = (devSeed % 2) + 1;
    for (let i = 0; i < devCount; i++) {
      const dev = DEV_POOL[(devSeed + i) % DEV_POOL.length];
      push(
        `user-${dev.name}`,
        { userName: dev.name, department: dev.dept },
        { processId: p.id, processName: p.name, role: 'developer' },
      );
    }
    const reviewer = REVIEWER_POOL[devSeed % REVIEWER_POOL.length];
    push(
      `user-${reviewer.name}`,
      { userName: reviewer.name, department: reviewer.dept },
      { processId: p.id, processName: p.name, role: 'code_reviewer' },
    );
  });

  return Array.from(map.values());
};

interface FollowersTabProps {
  data: RequirementItem;
}

const FollowersTab = ({ data }: FollowersTabProps) => {
  const processes = data.linkedProcesses ?? [];
  const autoFollowers = useMemo(() => buildAutoFollowers(processes), [processes]);

  // 手动添加的关注者（本地状态，mock）
  const [manualFollowers, setManualFollowers] = useState<FollowerEntry[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  // 合并自动 + 手动
  const followers = useMemo(() => {
    const map = new Map<string, FollowerEntry>();
    [...autoFollowers, ...manualFollowers].forEach((f) => {
      const exist = map.get(f.userId);
      if (exist) {
        f.sources.forEach((s) => {
          if (!exist.sources.find((x) => x.role === s.role && x.processId === s.processId)) {
            exist.sources.push(s);
          }
        });
      } else {
        map.set(f.userId, { ...f, sources: [...f.sources] });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.sources.length - a.sources.length);
  }, [autoFollowers, manualFollowers]);

  const existingIds = new Set(followers.map((f) => f.userId));
  const candidates = CANDIDATE_POOL.filter((c) => !existingIds.has(c.userId));

  const handleConfirm = () => {
    if (selected.length === 0) {
      Toast.warning('请至少选择一位关注者');
      return;
    }
    const added = selected
      .map((id) => CANDIDATE_POOL.find((c) => c.userId === id))
      .filter(Boolean)
      .map<FollowerEntry>((c) => ({
        userId: c!.userId,
        userName: c!.userName,
        department: c!.department,
        sources: [{ role: 'manual' }],
      }));
    setManualFollowers((prev) => [...prev, ...added]);
    Toast.success(`已添加 ${added.length} 位关注者`);
    setSelected([]);
    setModalOpen(false);
  };

  const handleRemoveManual = (userId: string, userName: string) => {
    Modal.confirm({
      title: '移除关注者',
      content: `确定要移除 ${userName} 吗？`,
      centered: true,
      okText: '确定',
      cancelText: '取消',
      okType: 'danger',
      onOk: () => {
        setManualFollowers((prev) => prev.filter((f) => f.userId !== userId));
        Toast.success('已移除');
      },
    });
  };

  return (
    <div className="requirement-followers-tab">
      <Banner
        type="info"
        fullMode={false}
        closeIcon={null}
        icon={<Info size={16} strokeWidth={2} />}
        description={
          <Text size="small">
            关注者由系统根据关联流程自动同步（流程负责人、开发者、代码审核员），也可手动添加。手动添加的成员若后续被流程覆盖，将自动锁定且无法单独移除。
          </Text>
        }
        style={{ marginBottom: 0 }}
      />

      <div className="requirement-followers-summary">
        <div className="requirement-followers-summary-item">
          <Text type="tertiary" size="small">关注者总数</Text>
          <Text strong style={{ fontSize: 20 }}>{followers.length}</Text>
        </div>
        <div className="requirement-followers-summary-divider" />
        <div className="requirement-followers-summary-item">
          <Text type="tertiary" size="small">来源流程</Text>
          <Text strong style={{ fontSize: 20 }}>{processes.length}</Text>
        </div>
        <div className="requirement-followers-summary-divider" />
        <div className="requirement-followers-summary-item">
          <Text type="tertiary" size="small">手动添加</Text>
          <Text strong style={{ fontSize: 20 }}>{manualFollowers.length}</Text>
        </div>
        <div style={{ flex: 1 }} />
        <Button
          theme="solid"
          type="primary"
          icon={<UserPlus size={14} strokeWidth={2} />}
          onClick={() => setModalOpen(true)}
        >
          添加关注者
        </Button>
      </div>

      {followers.length === 0 ? (
        <div style={{ padding: '48px 0' }}>
          <EmptyState
            variant="noData"
            description="暂无关注者，关联流程后或手动添加后将在此展示。"
          />
        </div>
      ) : (
        <div className="requirement-followers-list">
          {followers.map((f) => {
            const hasAuto = f.sources.some((s) => s.role !== 'manual');
            const hasManual = f.sources.some((s) => s.role === 'manual');
            const isManualOnly = hasManual && !hasAuto;
            const isManualLocked = hasManual && hasAuto;
            return (
              <div key={f.userId} className="requirement-followers-item">
                <div className="requirement-followers-item-user">
                  <Avatar
                    size="small"
                    style={{ backgroundColor: 'var(--semi-color-text-0)', color: 'var(--semi-color-bg-0)', flexShrink: 0 }}
                  >
                    {f.userName.slice(0, 1).toUpperCase()}
                  </Avatar>
                  <div className="requirement-followers-item-meta">
                    <UserNameWithCard
                      name={f.userName}
                      userId={f.userId}
                      department={f.department}
                    />
                    <Text type="tertiary" size="small" className="requirement-followers-item-dept">
                      {f.department || '-'}
                    </Text>
                  </div>
                </div>
                <div className="requirement-followers-item-sources">
                  {f.sources.map((s, i) => {
                    const isManualTag = s.role === 'manual';
                    const locked = isManualTag && isManualLocked;
                    return (
                      <Tooltip
                        key={`${s.processId ?? 'manual'}-${s.role}-${i}`}
                        content={
                          locked
                            ? '该成员已由关联流程自动同步覆盖，手动来源已锁定，无法单独移除'
                            : isManualTag
                              ? '由管理员手动添加'
                              : `来源流程：${s.processName}`
                        }
                        position="top"
                      >
                        <Tag
                          color={locked ? 'grey' : ROLE_COLOR[s.role]}
                          type="light"
                          prefixIcon={
                            locked
                              ? <Lock size={12} strokeWidth={2} />
                              : isManualTag
                                ? <Hand size={12} strokeWidth={2} />
                                : <GitBranch size={12} strokeWidth={2} />
                          }
                          className="requirement-followers-source-tag"
                          style={locked ? { opacity: 0.75 } : undefined}
                        >
                          {isManualTag ? `${ROLE_LABEL.manual}${locked ? '（已锁定）' : ''}` : `${s.processName} · ${ROLE_LABEL[s.role]}`}
                        </Tag>
                      </Tooltip>
                    );
                  })}
                  {isManualOnly && (
                    <Tooltip content="移除关注者" position="top">
                      <Button
                        size="small"
                        theme="borderless"
                        type="tertiary"
                        icon={<X size={14} strokeWidth={2} />}
                        onClick={() => handleRemoveManual(f.userId, f.userName)}
                      />
                    </Tooltip>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        title="添加关注者"
        visible={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setSelected([]);
        }}
        onOk={handleConfirm}
        okText="确认添加"
        cancelText="取消"
        width={520}
        centered
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Text type="tertiary" size="small">
            可选择多位用户。已是关注者的用户将不再显示。
          </Text>
          <Select
            multiple
            filter
            placeholder="请选择用户"
            value={selected}
            onChange={(v) => setSelected(v as string[])}
            style={{ width: '100%' }}
            emptyContent={<Text type="tertiary">暂无可选用户</Text>}
            optionList={candidates.map((c) => ({
              label: `${c.userName}（${c.department}）`,
              value: c.userId,
            }))}
          />
        </div>
      </Modal>
    </div>
  );
};

export default FollowersTab;
