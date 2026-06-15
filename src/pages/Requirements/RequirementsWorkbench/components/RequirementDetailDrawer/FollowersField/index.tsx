/**
 * 需求关注者 - 紧凑字段版
 * 仅记录手动添加的关注者，不再与流程角色合并
 */
import { useMemo, useState } from 'react';
import { Avatar, AvatarGroup, Button, Modal, Select, Toast, Tooltip, Typography } from '@douyinfe/semi-ui';
import { Eye, EyeOff, Plus, X } from 'lucide-react';
import type { RequirementItem } from '../../../types';
import './index.less';

const { Text } = Typography;

interface FollowerEntry {
  userId: string;
  userName: string;
  department?: string;
}

const CANDIDATE_POOL: FollowerEntry[] = [
  { userId: 'user-Alice Wang', userName: 'Alice Wang', department: '产品中心 · 需求组' },
  { userId: 'user-Bob Liu', userName: 'Bob Liu', department: '产品中心 · 需求组' },
  { userId: 'user-Cathy Zhou', userName: 'Cathy Zhou', department: '运营中心 · 业务组' },
  { userId: 'user-David Lee', userName: 'David Lee', department: '运营中心 · 业务组' },
  { userId: 'user-Eric Yang', userName: 'Eric Yang', department: '智能自动化中心 · 架构组' },
  { userId: 'user-Fiona Xu', userName: 'Fiona Xu', department: '智能自动化中心 · 架构组' },
];

interface Props {
  data: RequirementItem;
}

const FollowersField = ({ data: _data }: Props) => {
  const [followers, setFollowers] = useState<FollowerEntry[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [isFollowing, setIsFollowing] = useState(true);

  const existingIds = useMemo(() => new Set(followers.map((f) => f.userId)), [followers]);
  const candidates = CANDIDATE_POOL.filter((c) => !existingIds.has(c.userId));

  const handleConfirm = () => {
    if (selected.length === 0) {
      Toast.warning('请至少选择一位关注者');
      return;
    }
    const added = selected
      .map((id) => CANDIDATE_POOL.find((c) => c.userId === id))
      .filter(Boolean) as FollowerEntry[];
    setFollowers((prev) => [...prev, ...added]);
    Toast.success(`已添加 ${added.length} 位关注者`);
    setSelected([]);
    setAddOpen(false);
  };

  const handleRemove = (userId: string, userName: string) => {
    Modal.confirm({
      title: '移除关注者',
      content: `确定要移除 ${userName} 吗？`,
      centered: true,
      okText: '确定',
      cancelText: '取消',
      okType: 'danger',
      onOk: () => {
        setFollowers((prev) => prev.filter((f) => f.userId !== userId));
        Toast.success('已移除');
      },
    });
  };

  const renderUserTooltip = (f: FollowerEntry) => (
    <div className="requirement-followers-field-tooltip">
      <div className="requirement-followers-field-tooltip-meta">
        <Text strong size="small">{f.userName}</Text>
        {f.department && <Text type="tertiary" size="small">{f.department}</Text>}
      </div>
      <Button
        size="small"
        theme="borderless"
        type="danger"
        icon={<X size={12} strokeWidth={2} />}
        onClick={() => handleRemove(f.userId, f.userName)}
      />
    </div>
  );

  return (
    <div className="requirement-followers-field">
      <div className="requirement-followers-field-header">
        <Text type="tertiary" size="small">关注</Text>
        <Button
          size="small"
          theme="borderless"
          type={isFollowing ? 'tertiary' : 'primary'}
          icon={isFollowing ? <Eye size={14} strokeWidth={2} /> : <EyeOff size={14} strokeWidth={2} />}
          onClick={() => {
            setIsFollowing((v) => !v);
            Toast.success(isFollowing ? '已取消关注' : '已关注');
          }}
          className="requirement-followers-field-toggle"
        >
          {isFollowing ? '已关注' : '关注'}
        </Button>
      </div>
      <div className="requirement-followers-field-body">
        {followers.length > 0 ? (
          <AvatarGroup size="extra-small" maxCount={6} overlapFrom="end">
            {followers.map((f) => (
              <Tooltip
                key={f.userId}
                content={renderUserTooltip(f)}
                position="top"
                trigger="hover"
                clickToHide
              >
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
          <button
            type="button"
            className="requirement-followers-field-add"
            onClick={() => setAddOpen(true)}
            aria-label="添加关注者"
          >
            <Plus size={14} strokeWidth={2.5} />
          </button>
        </Tooltip>
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
