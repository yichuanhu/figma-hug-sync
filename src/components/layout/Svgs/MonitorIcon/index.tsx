/**
 * 显示器图标
 * 用于显示仪表盘相关信息
 */

import React from 'react';

export const MonitorIcon: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <div style={{ width: 20, height: 20, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }}>
    <svg
      style={{ display: 'block', width: '20px', height: '20px' }}
      fill="none"
      viewBox="0 0 23 21"
    >
      <path
        d="M16 19C16.5523 19 17 19.4477 17 20C17 20.5523 16.5523 21 16 21H8C7.44772 21 7 20.5523 7 20C7 19.4477 7.44772 19 8 19H11V17H3C1.89543 17 1 16.1046 1 15V5C1 3.89543 1.89543 3 3 3H21C22.1046 3 23 3.89543 23 5V15C23 16.1046 22.1046 17 21 17H13V19H16ZM3 15H21V5H3V15Z"
        fill="rgba(28, 31, 35, 0.6)"
      />
    </svg>
  </div>
);
