/**
 * 折叠/展开图标
 * 用于侧边栏折叠切换
 */

import React from 'react';

export const CollapseIcon: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <div style={{ width: 18, height: 18, ...style }}>
    <svg
      style={{ display: 'block', width: '100%', height: '100%' }}
      fill="none"
      preserveAspectRatio="none"
      viewBox="0 0 18 18"
    >
      <path
        clipRule="evenodd"
        d="M3 15.75C2.17157 15.75 1.5 15.0784 1.5 14.25L1.5 3.75C1.5 2.92157 2.17157 2.25 3 2.25L15 2.25C15.8284 2.25 16.5 2.92157 16.5 3.75L16.5 14.25C16.5 15.0784 15.8284 15.75 15 15.75L3 15.75ZM3 3.75L3 14.25L6.375 14.25L6.375 3.75L3 3.75ZM7.875 3.75L7.875 14.25L15 14.25L15 3.75L7.875 3.75Z"
        fill="var(--semi-color-tertiary)"
        fillRule="evenodd"
      />
    </svg>
  </div>
);
