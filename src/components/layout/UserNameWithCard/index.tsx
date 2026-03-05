/**
 * 用户名称组件（带名片 Hover）
 * 在所有展示用户名的地方使用，hover 时弹出用户名片
 */

import React from 'react';
import { UserCardPopover, UserCardInfo } from '../UserCard';
import './index.less';

interface UserNameWithCardProps {
  /** 用户ID，用于获取用户详情 */
  userId?: string;
  /** 用户名称（显示文本） */
  name: string;
  /** 用户名/账号 */
  username?: string;
  /** 头像 URL */
  avatar?: string;
  /** 部门 */
  department?: string;
  /** 角色 */
  role?: string;
  /** 邮箱 */
  email?: string;
  /** 自定义样式 */
  className?: string;
  style?: React.CSSProperties;
  /** Popover 位置 */
  position?: 'top' | 'bottom' | 'left' | 'right' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'leftTop' | 'leftBottom' | 'rightTop' | 'rightBottom';
}

const UserNameWithCard: React.FC<UserNameWithCardProps> = ({
  userId,
  name,
  username,
  avatar,
  department,
  role,
  email,
  className,
  style,
  position = 'top',
}) => {
  if (!name || name === '-') {
    return <span>{name || '-'}</span>;
  }

  const userInfo: UserCardInfo = {
    name,
    username: username || userId || name,
    avatar,
    department,
    role,
    email,
  };

  return (
    <UserCardPopover userInfo={userInfo} position={position}>
      <span className={`user-name-with-card ${className || ''}`} style={style}>
        {name}
      </span>
    </UserCardPopover>
  );
};

export default UserNameWithCard;
