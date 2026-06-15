/**
 * 需求关注者 Tab（只读）
 * - 关注者由系统根据关联流程自动聚合（v1 仅 PROCESS 来源）
 * - 每位关注者展示其全部来源 Chip（流程名 · 角色）
 * - 角色映射：流程负责人 / 开发者 / 代码审核员
 */

import { useMemo } from 'react';
import { Avatar, Tag, Typography, Banner, Tooltip } from '@douyinfe/semi-ui';
import { Info, GitBranch } from 'lucide-react';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import EmptyState from '@/components/EmptyState';
import type { RequirementItem, LinkedProcess } from '../../../types';
import './index.less';

const { Text } = Typography;

type FollowerRole = 'process_owner' | 'developer' | 'code_reviewer';

interface FollowerSource {
  processId: string;
  processName: string;
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
};

const ROLE_COLOR: Record<FollowerRole, 'blue' | 'green' | 'violet'> = {
  process_owner: 'blue',
  developer: 'green',
  code_reviewer: 'violet',
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

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const buildFollowers = (processes: LinkedProcess[]): FollowerEntry[] => {
  const map = new Map<string, FollowerEntry>();
  const push = (
    key: string,
    info: { userName: string; department?: string },
    source: FollowerSource,
  ) => {
    const exist = map.get(key);
    if (exist) {
      // 去重相同 source
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
    // 1) 流程负责人
    if (p.ownerName) {
      push(
        `user-${p.ownerName}`,
        { userName: p.ownerName, department: '智能自动化中心 · 流程组' },
        { processId: p.id, processName: p.name, role: 'process_owner' },
      );
    }
    // 2) 开发者（每个流程派生 1-2 个）
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
    // 3) 代码审核员（每个流程 1 个）
    const reviewer = REVIEWER_POOL[devSeed % REVIEWER_POOL.length];
    push(
      `user-${reviewer.name}`,
      { userName: reviewer.name, department: reviewer.dept },
      { processId: p.id, processName: p.name, role: 'code_reviewer' },
    );
  });

  return Array.from(map.values()).sort((a, b) => b.sources.length - a.sources.length);
};

interface FollowersTabProps {
  data: RequirementItem;
}

const FollowersTab = ({ data }: FollowersTabProps) => {
  const processes = data.linkedProcesses ?? [];
  const followers = useMemo(() => buildFollowers(processes), [processes]);

  return (
    <div className="requirement-followers-tab">
      <Banner
        type="info"
        fullMode={false}
        closeIcon={null}
        icon={<Info size={16} strokeWidth={2} />}
        description={
          <Text size="small">
            关注者由系统根据关联流程自动同步，包含流程负责人、开发者与代码审核员。
            关注者拥有需求的只读访问权限，不能编辑、删除或参与审批。
          </Text>
        }
        style={{ marginBottom: 16 }}
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
      </div>

      {followers.length === 0 ? (
        <div style={{ padding: '48px 0' }}>
          <EmptyState
            variant="no-data"
            title="暂无关注者"
            description="需求关联流程后，流程相关人员将自动成为关注者。"
          />
        </div>
      ) : (
        <div className="requirement-followers-list">
          {followers.map((f) => (
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
                {f.sources.map((s, i) => (
                  <Tooltip key={`${s.processId}-${s.role}-${i}`} content={`来源流程：${s.processName}`} position="top">
                    <Tag
                      color={ROLE_COLOR[s.role]}
                      type="light"
                      prefixIcon={<GitBranch size={12} strokeWidth={2} />}
                      className="requirement-followers-source-tag"
                    >
                      {s.processName} · {ROLE_LABEL[s.role]}
                    </Tag>
                  </Tooltip>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FollowersTab;
