/**
 * 用户名片组件
 * 用于在hover用户头像或名字时展示用户详细信息
 */

import React from 'react';
import { Popover, Avatar } from '@douyinfe/semi-ui';
import './index.less';

// 用户信息接口
export interface UserCardInfo {
  avatar?: string;
  name: string;
  username: string;
  department?: string;
  role?: string;
  email?: string;
  customFields?: Array<{
    label: string;
    value: string;
  }>;
}

interface UserCardProps {
  userInfo: UserCardInfo;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 用户名片内容组件
 */
export const UserCardContent: React.FC<UserCardProps> = ({ userInfo, className, style }) => {
  const infoItems = [
    ...(userInfo.department ? [{ label: '部门', value: userInfo.department }] : []),
    ...(userInfo.role ? [{ label: '角色', value: userInfo.role }] : []),
    ...(userInfo.email ? [{ label: '邮箱', value: userInfo.email }] : []),
    ...(userInfo.customFields || []),
  ];

  return (
    <div className={`layout-user-card ${className || ''}`} style={style}>
      {/* 上半部分：头像和基本信息 */}
      <div className="layout-user-card__header">
        <div className="layout-user-card__glow" />
        <div className="layout-user-card__user">
          <Avatar
            size="default"
            src={userInfo.avatar}
            className="layout-user-card__avatar"
          >
            {userInfo.name.charAt(0)}
          </Avatar>
          <div className="layout-user-card__info">
            <div className="layout-user-card__name">{userInfo.name}</div>
            <div className="layout-user-card__username">{userInfo.username}</div>
          </div>
        </div>
      </div>

      {/* 下半部分：详细信息 */}
      {infoItems.length > 0 && (
        <div className="layout-user-card__details">
          <div className="layout-user-card__details-content">
            <div className="layout-user-card__labels">
              {infoItems.map((item, index) => (
                <div key={`label-${index}`} className="layout-user-card__label">
                  {item.label}
                </div>
              ))}
            </div>
            <div className="layout-user-card__values">
              {infoItems.map((item, index) => (
                <div key={`value-${index}`} className="layout-user-card__value">
                  {item.value}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * 用户名片 Popover 包装组件
 */
interface UserCardPopoverProps {
  userInfo: UserCardInfo;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'leftTop' | 'leftBottom' | 'rightTop' | 'rightBottom';
}

export const UserCardPopover: React.FC<UserCardPopoverProps> = ({
  userInfo,
  children,
  position = 'right',
}) => {
  return (
    <Popover
      content={<UserCardContent userInfo={userInfo} />}
      position={position}
      trigger="hover"
      showArrow
    >
      {children}
    </Popover>
  );
};

export default UserCardPopover;
