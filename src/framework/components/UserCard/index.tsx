import React from 'react';
import { Avatar, Popover } from '@douyinfe/semi-ui';
import { IconMail } from '@douyinfe/semi-icons';
import { Building2, Briefcase } from 'lucide-react';
import './index.less';

export interface UserInfo {
  avatar?: string;
  name: string;
  username: string;
  department?: string;
  role?: string;
  email?: string;
}

interface UserCardContentProps {
  userInfo: UserInfo;
}

// 用户卡片内容
const UserCardContent: React.FC<UserCardContentProps> = ({ userInfo }) => {
  const { avatar, name, username, department, role, email } = userInfo;

  // 获取头像显示的首字母
  const getAvatarText = () => {
    if (name) {
      return name.charAt(0).toUpperCase();
    }
    if (username) {
      return username.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="user-card">
      <div className="user-card-header">
        {avatar ? (
          <Avatar src={avatar} size="default" className="user-card-avatar" />
        ) : (
          <Avatar size="default" className="user-card-avatar">
            {getAvatarText()}
          </Avatar>
        )}
        <div className="user-card-info">
          <div className="user-card-name">{name}</div>
          <div className="user-card-username">{username}</div>
        </div>
      </div>

      {(department || role || email) && (
        <div className="user-card-details">
          {department && (
            <div className="user-card-detail-item">
              <Building2 size={14} className="user-card-detail-icon" />
              <span className="user-card-detail-text">{department}</span>
            </div>
          )}
          {role && (
            <div className="user-card-detail-item">
              <Briefcase size={14} className="user-card-detail-icon" />
              <span className="user-card-detail-text">{role}</span>
            </div>
          )}
          {email && (
            <div className="user-card-detail-item">
              <IconMail size="small" className="user-card-detail-icon" />
              <span className="user-card-detail-text">{email}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// 方式1: 自定义触发器
interface UserCardTriggerProps {
  userInfo: UserInfo;
  children: React.ReactNode;
  position?: 'top' | 'topLeft' | 'topRight' | 'left' | 'leftTop' | 'leftBottom' | 'right' | 'rightTop' | 'rightBottom' | 'bottom' | 'bottomLeft' | 'bottomRight';
}

export const UserCardTrigger: React.FC<UserCardTriggerProps> = ({ 
  userInfo, 
  children, 
  position = 'right' 
}) => {
  return (
    <Popover
      content={<UserCardContent userInfo={userInfo} />}
      position={position}
      trigger="hover"
      showArrow
      arrowPointAtCenter
    >
      {children}
    </Popover>
  );
};

// 方式2: 头像触发器
interface UserAvatarWithCardProps {
  userInfo: UserInfo;
  size?: 'extra-extra-small' | 'extra-small' | 'small' | 'default' | 'medium' | 'large';
  position?: 'top' | 'topLeft' | 'topRight' | 'left' | 'leftTop' | 'leftBottom' | 'right' | 'rightTop' | 'rightBottom' | 'bottom' | 'bottomLeft' | 'bottomRight';
  className?: string;
}

export const UserAvatarWithCard: React.FC<UserAvatarWithCardProps> = ({ 
  userInfo, 
  size = 'small',
  position = 'right',
  className = ''
}) => {
  const { avatar, name, username } = userInfo;

  const getAvatarText = () => {
    if (name) {
      return name.charAt(0).toUpperCase();
    }
    if (username) {
      return username.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <UserCardTrigger userInfo={userInfo} position={position}>
      {avatar ? (
        <Avatar src={avatar} size={size} className={`user-avatar-trigger ${className}`} />
      ) : (
        <Avatar size={size} className={`user-avatar-trigger ${className}`}>
          {getAvatarText()}
        </Avatar>
      )}
    </UserCardTrigger>
  );
};

// 方式3: 名字触发器
interface UserNameWithCardProps {
  userInfo: UserInfo;
  position?: 'top' | 'topLeft' | 'topRight' | 'left' | 'leftTop' | 'leftBottom' | 'right' | 'rightTop' | 'rightBottom' | 'bottom' | 'bottomLeft' | 'bottomRight';
  className?: string;
}

export const UserNameWithCard: React.FC<UserNameWithCardProps> = ({ 
  userInfo, 
  position = 'top',
  className = ''
}) => {
  return (
    <UserCardTrigger userInfo={userInfo} position={position}>
      <span className={`user-name-trigger ${className}`}>{userInfo.name}</span>
    </UserCardTrigger>
  );
};

export default UserCardContent;
