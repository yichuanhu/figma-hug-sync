/**
 * 用户名称组件（带名片 Hover）
 * 适配层：将分散的 props 转换为 UserCardInfo 格式
 */

import React from 'react';
import { UserNameWithCard as UserNameWithCardBase, UserCardInfo } from '../UserCard';
import './index.less';

interface UserNameWithCardProps {
  userId?: string;
  name: string;
  username?: string;
  avatar?: string;
  department?: string;
  role?: string;
  email?: string;
  className?: string;
  style?: React.CSSProperties;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'leftTop' | 'leftBottom' | 'rightTop' | 'rightBottom';
}

const UserNameWithCardAdapter: React.FC<UserNameWithCardProps> = ({
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
    <UserNameWithCardBase
      userInfo={userInfo}
      position={position}
      className={className}
      style={style}
    />
  );
};

export default UserNameWithCardAdapter;
