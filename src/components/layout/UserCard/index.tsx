/**
 * 用户名片组件
 * 用于在hover用户头像或名字时展示用户详细信息
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Popover, Avatar } from '@douyinfe/semi-ui';
import './index.less';

// 用户信息接口
export interface UserCardInfo {
  // 基本信息
  avatar?: string;
  name: string;
  username: string;
  // 详细信息
  department?: string;
  role?: string;
  email?: string;
  // 自定义字段
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
  // 构建信息列表
  const infoItems = [
    ...(userInfo.department ? [{ label: '部门', value: userInfo.department }] : []),
    ...(userInfo.role ? [{ label: '角色', value: userInfo.role }] : []),
    ...(userInfo.email ? [{ label: '邮箱', value: userInfo.email }] : []),
    ...(userInfo.customFields || []),
  ];

  return (
    <div
      className={`layout-user-card ${className || ''}`}
      style={style}
    >
      {/* 上半部分：头像和基本信息 */}
      <div className="layout-user-card__header">
        {/* 渐变背景光晕 */}
        <div className="layout-user-card__glow" />

        {/* 用户头像和姓名 */}
        <div className="layout-user-card__user">
          {/* 头像 */}
          <Avatar
            size="default"
            src={userInfo.avatar}
            className="layout-user-card__avatar"
          >
            {userInfo.name.charAt(0)}
          </Avatar>

          {/* 姓名和用户名 */}
          <div className="layout-user-card__info">
            <div className="layout-user-card__name">
              {userInfo.name}
            </div>
            <div className="layout-user-card__username">
              {userInfo.username}
            </div>
          </div>
        </div>
      </div>

      {/* 下半部分：详细信息 */}
      {infoItems.length > 0 && (
        <div className="layout-user-card__details">
          <div className="layout-user-card__details-content">
            {/* 标签列 */}
            <div className="layout-user-card__labels">
              {infoItems.map((item, index) => (
                <div key={`label-${index}`} className="layout-user-card__label">
                  {item.label}
                </div>
              ))}
            </div>

            {/* 内容列 */}
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

interface UserCardTriggerProps {
  userInfo: UserCardInfo;
  children: React.ReactNode;
  position?: 'top' | 'topLeft' | 'topRight' | 'left' | 'leftTop' | 'leftBottom' | 'right' | 'rightTop' | 'rightBottom' | 'bottom' | 'bottomLeft' | 'bottomRight';
  mouseEnterDelay?: number;
  mouseLeaveDelay?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 用户名片触发器组件
 * 可以包裹任何触发元素（如头像、名字等）
 */
export const UserCardTrigger: React.FC<UserCardTriggerProps> = ({
  userInfo,
  children,
  position = 'rightTop',
  mouseEnterDelay = 200,
  mouseLeaveDelay = 300,
  className,
  style,
}) => {
  return (
    <Popover
      content={<UserCardContent userInfo={userInfo} />}
      trigger="hover"
      position={position}
      mouseEnterDelay={mouseEnterDelay}
      mouseLeaveDelay={mouseLeaveDelay}
      spacing={8}
      className={className}
      style={style}
      showArrow={false}
    >
      <span className="layout-user-card__trigger">
        {children}
      </span>
    </Popover>
  );
};

/**
 * 便捷组件：带头像的用户名片触发器
 */
interface UserAvatarWithCardProps {
  userInfo: UserCardInfo;
  size?: 'extra-extra-small' | 'extra-small' | 'small' | 'default' | 'medium' | 'large' | 'extra-large';
  position?: UserCardTriggerProps['position'];
  className?: string;
  style?: React.CSSProperties;
}

export const UserAvatarWithCard: React.FC<UserAvatarWithCardProps> = ({
  userInfo,
  size = 'small',
  position = 'rightTop',
  className,
  style,
}) => {
  return (
    <UserCardTrigger userInfo={userInfo} position={position} className={className} style={style}>
      <Avatar
        size={size}
        src={userInfo.avatar}
        className="layout-user-card__trigger-avatar"
      >
        {userInfo.name.charAt(0)}
      </Avatar>
    </UserCardTrigger>
  );
};

/**
 * 便捷组件：带名字的用户名片触发器
 */
interface UserNameWithCardProps {
  userInfo: UserCardInfo;
  position?: UserCardTriggerProps['position'];
  className?: string;
  style?: React.CSSProperties;
}

export const UserNameWithCard: React.FC<UserNameWithCardProps> = ({
  userInfo,
  position = 'rightTop',
  className,
  style,
}) => {
  return (
    <UserCardTrigger userInfo={userInfo} position={position} className={className} style={style}>
      <span className="layout-user-card__trigger-name">
        {userInfo.name}
      </span>
    </UserCardTrigger>
  );
};

export default UserCardTrigger;
