/**
 * 用户信息下拉弹窗组件
 * 基于 Figma 设计实现
 */

import React from 'react';
import { Avatar } from '@douyinfe/semi-ui';
import { IconApartment } from '@douyinfe/semi-icons';
import { Monitor, User, LogOut, ExternalLink } from 'lucide-react';
import './index.less';

export interface UserInfoConfig {
  name: string;
  avatar?: string;
  username?: string;
  companyName?: string;
  actions?: Array<{
    key: string;
    label: string;
    icon?: React.ReactNode;
    onClick?: () => void;
  }>;
}

interface UserInfoDropdownProps extends UserInfoConfig {
  className?: string;
  style?: React.CSSProperties;
}

// 光晕容器组件
const GlowContainer: React.FC = () => {
  return <div className="layout-user-dropdown__glow" />;
};

// 菜单项组件
const MenuItemComponent: React.FC<{
  icon?: React.ReactNode;
  label: string;
  endIcon?: React.ReactNode;
  onClick?: () => void;
}> = ({ icon, label, endIcon, onClick }) => {
  return (
    <div
      className="layout-user-dropdown__menu-item"
      onClick={onClick}
    >
      <div className="layout-user-dropdown__menu-content">
        {icon && <div className="layout-user-dropdown__menu-icon">{icon}</div>}
        <div className="layout-user-dropdown__menu-label">{label}</div>
        {endIcon && <div className="layout-user-dropdown__menu-end-icon">{endIcon}</div>}
      </div>
    </div>
  );
};

export const UserInfoDropdown: React.FC<UserInfoDropdownProps> = ({
  avatar,
  name,
  username = '',
  companyName = '',
  actions = [],
  className,
  style,
}) => {
  // 映射默认图标
  const getIcon = (key: string) => {
    switch (key) {
      case 'admin':
      case 'dashboard':
        return <Monitor size={20} strokeWidth={2} />;
      case 'settings':
        return <User size={20} strokeWidth={2} />;
      case 'logout':
        return <LogOut size={20} strokeWidth={2} />;
      default:
        return null;
    }
  };

  // 检查是否需要外部链接图标
  const needsExternalIcon = (key: string) => {
    return key === 'admin' || key === 'dashboard';
  };

  return (
    <div className={`layout-user-dropdown ${className || ''}`} style={style}>
      {/* 顶部用户信息区域 */}
      <div className="layout-user-dropdown__header">
        <div className="layout-user-dropdown__header-content">
          <GlowContainer />

          {/* 用户信息 */}
          <div className="layout-user-dropdown__user">
            <Avatar
              size="small"
              src={avatar}
              className="layout-user-dropdown__avatar"
            >
              {name.charAt(0)}
            </Avatar>
            <div className="layout-user-dropdown__user-info">
              <div className="layout-user-dropdown__name">{name}</div>
              {username && (
                <div className="layout-user-dropdown__username">{username}</div>
              )}
            </div>
          </div>

          {/* 公司信息 */}
          {companyName && (
            <div className="layout-user-dropdown__company">
              <IconApartment style={{ fontSize: 14, color: 'var(--semi-color-text-3)' }} />
              <div className="layout-user-dropdown__company-name">{companyName}</div>
            </div>
          )}
        </div>
      </div>

      {/* 菜单区域 */}
      <div className="layout-user-dropdown__menu">
        {actions.map((action) => (
          <MenuItemComponent
            key={action.key}
            icon={action.icon || getIcon(action.key)}
            label={action.label}
            endIcon={needsExternalIcon(action.key) ? <ExternalLink size={20} strokeWidth={2} /> : undefined}
            onClick={action.onClick}
          />
        ))}
      </div>
    </div>
  );
};

export default UserInfoDropdown;
