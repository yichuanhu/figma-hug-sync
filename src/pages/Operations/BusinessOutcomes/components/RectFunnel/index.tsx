import { Tooltip } from '@douyinfe/semi-ui';
import './index.less';

export interface RectFunnelStage {
  name: string;
  value: number;
  conversionRate?: number; // 相对首段的占比，0-100
}

interface Props {
  data: RectFunnelStage[];
  height?: number;
  /** 渐变色，从深到浅；按阶段索引取色 */
  colors?: string[];
}

const DEFAULT_COLORS = ['#00328E', '#0048AA', '#005FC5', '#2778E2', '#4E91FF', '#70ABFF', '#8FC7FF', '#AEE2FF'];

/**
 * 矩形转化漏斗图：每阶段为居中矩形，宽度=该阶段绝对数量 / 最大值；
 * 阶段之间以梯形（trapezoid）连接，并标注阶段间转化率。
 */
const RectFunnel = ({ data, height = 320, colors = DEFAULT_COLORS }: Props) => {
  if (!data?.length) return null;

  const VIEW_W = 1000;
  const VIEW_H = height;
  const PADDING_X = 120; // 左右标签预留
  const TOP = 8;
  const BOTTOM = 8;
  const innerW = VIEW_W - PADDING_X * 2;
  const innerH = VIEW_H - TOP - BOTTOM;

  const n = data.length;
  // 矩形高度占 70%，梯形占 30%
  const rectH = (innerH * 0.62) / n;
  const trapH = n > 1 ? (innerH * 0.38) / (n - 1) : 0;

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const widthOf = (v: number) => Math.max(40, (v / maxVal) * innerW);

  return (
    <div className="rect-funnel">
      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} width="100%" height={height} preserveAspectRatio="xMidYMid meet">
        {data.map((s, i) => {
          const w = widthOf(s.value);
          const x = (VIEW_W - w) / 2;
          const y = TOP + i * (rectH + trapH);
          const color = colors[Math.min(i, colors.length - 1)];

          // 矩形 + 标签
          const rectEl = (
            <Tooltip
              key={`r-${i}`}
              content={
                <div style={{ minWidth: 140 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{s.name}</div>
                  <div>数量: <b>{s.value}</b></div>
                  {s.conversionRate != null && <div>累计转化: <b>{s.conversionRate}%</b></div>}
                </div>
              }
            >
              <g>
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={rectH}
                  rx={4}
                  ry={4}
                  fill={color}
                  stroke="#fff"
                  strokeWidth={2}
                  className="rf-rect"
                />
                <text
                  x={VIEW_W / 2}
                  y={y + rectH / 2 - 6}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize={13}
                  fontWeight={600}
                >
                  {s.name}
                </text>
                <text
                  x={VIEW_W / 2}
                  y={y + rectH / 2 + 12}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize={13}
                  fontWeight={700}
                >
                  {s.value}
                </text>
                {/* 右侧外部百分比 */}
                {s.conversionRate != null && (
                  <>
                    <line
                      x1={x + w}
                      y1={y + rectH / 2}
                      x2={VIEW_W - PADDING_X + 30}
                      y2={y + rectH / 2}
                      stroke="#9CA3AF"
                      strokeDasharray="2 2"
                      strokeWidth={1}
                    />
                    <text
                      x={VIEW_W - PADDING_X + 36}
                      y={y + rectH / 2 + 4}
                      fill="#6B7280"
                      fontSize={12}
                    >
                      {s.conversionRate}%
                    </text>
                  </>
                )}
              </g>
            </Tooltip>
          );

          // 梯形（与下一阶段之间）
          let trapEl = null;
          if (i < n - 1) {
            const next = data[i + 1];
            const nw = widthOf(next.value);
            const nx = (VIEW_W - nw) / 2;
            const ty = y + rectH;
            const tBottom = ty + trapH;
            const points = `${x},${ty} ${x + w},${ty} ${nx + nw},${tBottom} ${nx},${tBottom}`;
            const conv = ((next.value / s.value) * 100).toFixed(1);
            trapEl = (
              <g key={`t-${i}`}>
                <polygon points={points} fill="#F1F5F9" stroke="#fff" strokeWidth={2} />
                <text
                  x={VIEW_W / 2}
                  y={ty + trapH / 2 + 4}
                  textAnchor="middle"
                  fill="#475569"
                  fontSize={12}
                  fontWeight={600}
                >
                  {conv}%
                </text>
              </g>
            );
          }

          return (
            <g key={i}>
              {trapEl}
              {rectEl}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default RectFunnel;
