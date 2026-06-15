/**
 * 需求关注者 - 紧凑字段版
 * 在右侧属性面板以单行字段形式展示：头像组 + 添加入口 + 关注切换
 */
import { useMemo, useState } from 'react';
import { Avatar, AvatarGroup, Button, Modal, Select, Toast, Tooltip, Typography, Tag } from '@douyinfe/semi-ui';
import { Eye, EyeOff, UserPlus, GitBranch, Hand, Lock, X } from 'lucide-react';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
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
  const push = (key: string, info: { userName: string; department?: string }, source: FollowerSource) => {
    const exist = map.get(key);
    if (exist) {
      if (!exist.sources.find((s) => s.processId === source.processId && s.role === source.role)) {
        exist.sources.push(source);
      }
    } else {
      map.set(key, { userId: key, userName: info.userName, department: info.department, sources: [source] });
    }
  };

  processes.forEach((p) => {
    if (p.ownerName) {
      push(`user-${p.ownerName}`, { userName: p.ownerName, department: '智能自动化中心 · 流程组' },
        { processId: p.id, processName: p.name, role: 'process_owner' });
    }
    const devSeed = hash(p.id);
    const devCount = (devSeed % 2) + 1;
    for (let i = 0; i < devCount; i++) {
      const dev = DEV_POOL[(devSeed + i) % DEV_POOL.length];
      push(`user-${dev.name}`, { userName: dev.name, department: dev.dept },
        { processId: p.id, processName: p.name, role: 'developer' });
    }
    const reviewer = REVIEWER_POOL[devSeed % REVIEWER_POOL.length];
    push(`user-${reviewer.name}`, { userName: reviewer.name, department: reviewer.dept },
      { processId: p.id, processName: p.name, role: 'code_reviewer' });
  });

  return Array.from(map.values());
};

interface Props {
  data: RequirementItem;
}

const FollowersField = ({ data }: Props) => {
  const processes = data.linkedProcesses ?? [];
  const autoFollowers = useMemo(() => buildAutoFollowers(processes), [processes]);
  const [manualFollowers, setManualFollowers] = useState<FollowerEntry[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [isFollowing, setIsFollowing] = useState(true);

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
    setAddOpen(false);
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

  const renderFollowerTooltip = (f: FollowerEntry) => {
    const hasAuto = f.sources.some((s) => s.role !== 'manual');
    const hasManual = f.sources.some((s) => s.role === 'manual');
    const isManualOnly = hasManual && !hasAuto;
    const isManualLocked = hasManual && hasAuto;
    return (
      <div style={{ minWidth: 200, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <UserNameWithCard name={f.userName} userId={f.userId} department={f.department} />
          {isManualOnly && (
            <Button
              size="small"
              theme="borderless"
              type="tertiary"
              icon={<X size={12} strokeWidth={2} />}
              onClick={() => handleRemoveManual(f.userId, f.userName)}
            />
          )}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {f.sources.map((s, i) => {
            const isManualTag = s.role === 'manual';
            const locked = isManualTag && isManualLocked;
            return (
              <Tag
                key={`${s.processId ?? 'manual'}-${s.role}-${i}`}
                size="small"
                color={locked ? 'grey' : ROLE_COLOR[s.role]}
                type="light"
                prefixIcon={
                  locked ? <Lock size={10} strokeWidth={2} />
                  : isManualTag ? <Hand size={10} strokeWidth={2} />
                  : <GitBranch size={10} strokeWidth={2} />
                }
              >
                {isManualTag ? `${ROLE_LABEL.manual}${locked ? '（已锁定）' : ''}` : `${s.processName} · ${ROLE_LABEL[s.role]}`}
              </Tag>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="requirement-followers-field">
      <Text type="tertiary" size="small">关注</Text>
      <div className="requirement-followers-field-row">
        <div className="requirement-followers-field-avatars">
          {followers.length > 0 ? (
            <AvatarGroup size="extra-small" maxCount={5} overlapFrom="end">
              {followers.map((f) => (
                <Tooltip key={f.userId} content={renderFollowerTooltip(f)} position="top" trigger="hover" clickToHide>
                  <Avatar
                    style={{ backgroundColor: 'var(--semi-color-text-0)', color: 'var(--semi-color-bg-0)' }}
                  >
                    {f.userName.slice(0, 1).toUpperCase()}
                  </Avatar>
                </Tooltip>
              ))}
            </AvatarGroup>
          ) : (
            <Text type="tertiary" size="small">暂无关注者</Text>
          )}
          <Tooltip content="添加关注者" position="top">
            <Button
              size="small"
              theme="borderless"
              type="tertiary"
              icon={<UserPlus size={14} strokeWidth={2} />}
              onClick={() => setAddOpen(true)}
            />
          </Tooltip>
        </div>
        <Button
          size="small"
          theme="borderless"
          type={isFollowing ? 'tertiary' : 'primary'}
          icon={isFollowing ? <Eye size={14} strokeWidth={2} /> : <EyeOff size={14} strokeWidth={2} />}
          onClick={() => {
            setIsFollowing((v) => !v);
            Toast.success(isFollowing ? '已取消关注' : '已关注');
          }}
        >
          {isFollowing ? '已关注' : '关注'}
        </Button>
      </div>

      <Modal
        title="添加关注者"
        visible={addOpen}
        onCancel={() => { setAddOpen(false); setSelected([]); }}
        onOk={handleConfirm}
        okText="确认添加"
        cancelText="取消"
        width={520}
        centered
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Text type="tertiary" size="small">可选择多位用户。已是关注者的用户将不再显示。</Text>
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

export default FollowersField;
