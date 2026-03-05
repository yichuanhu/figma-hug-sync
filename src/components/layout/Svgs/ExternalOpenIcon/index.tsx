/**
 * 外部链接图标
 * 用于表示在新窗口打开
 */

import React from 'react';

export const ExternalOpenIcon: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <div style={{ width: 16, height: 16, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }}>
    <svg
      style={{ display: 'block', width: '16px', height: '16px' }}
      fill="none"
      viewBox="0 0 22 22"
    >
      <path
        d="M11 4C11.5523 4 12 4.44772 12 5C12 5.55228 11.5523 6 11 6H4V20H18V13C18 12.4477 18.4477 12 19 12C19.5523 12 20 12.4477 20 13V21C20 21.5523 19.5523 22 19 22H3C2.44772 22 2 21.5523 2 21V5C2 4.44772 2.44772 4 3 4H11ZM21 2C21.5523 2 22 2.44772 22 3V9C22 9.55228 21.5523 10 21 10C20.4477 10 20 9.55228 20 9V5.41406L10.707 14.707C10.3165 15.0976 9.68349 15.0976 9.29297 14.707C8.90244 14.3165 8.90244 13.6835 9.29297 13.293L18.5859 4H15C14.4477 4 14 3.55228 14 3C14 2.44771 14.4477 2 15 2H21Z"
        fill="rgba(28, 31, 35, 0.6)"
      />
    </svg>
  </div>
);
