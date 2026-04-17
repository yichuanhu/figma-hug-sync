import { useState, useMemo } from 'react';
import { Typography, RadioGroup, Radio, Row, Col } from '@douyinfe/semi-ui';
import ReactECharts from 'echarts-for-react';
import { useTranslation } from 'react-i18next';
import { generateMockSingleMetric, generateMockDualMetric } from '../mockData';
import './index.less';

const SystemMetricsPage = () => {
  const { t } = useTranslation();
  const [range, setRange] = useState('1hour');

  const cpu = useMemo(() => generateMockSingleMetric(range, 45, 30), [range]);
  const mem = useMemo(() => generateMockSingleMetric(range, 60, 20), [range]);
  const disk = useMemo(() => generateMockDualMetric(range, 30, 18, 25), [range]);
  const net = useMemo(() => generateMockDualMetric(range, 200, 150, 180), [range]);

  const buildSingleOpt = (data: typeof cpu, color: string, color2: string, unit: string) => ({
    grid: { left: 50, right: 16, top: 24, bottom: 28 },
    xAxis: { type: 'category', data: data.map((d) => d.timestamp), boundaryGap: false, axisLabel: { color: '#8a94a6', fontSize: 11 } },
    yAxis: { type: 'value', axisLabel: { color: '#8a94a6', formatter: `{value}${unit}` }, splitLine: { lineStyle: { color: '#eef0f3' } } },
    tooltip: { trigger: 'axis' },
    series: [{
      type: 'line', smooth: true, showSymbol: false,
      data: data.map((d) => d.value.toFixed(1)),
      lineStyle: { color, width: 2 },
      areaStyle: {
        color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: color2 }, { offset: 1, color: 'rgba(255,255,255,0)' }] }
      },
    }],
  });

  const buildDualOpt = (data: typeof disk, c1: string, c2: string, name1: string, name2: string, unit: string) => ({
    grid: { left: 50, right: 16, top: 30, bottom: 28 },
    legend: { data: [name1, name2], top: 0, right: 0, textStyle: { color: '#8a94a6' } },
    xAxis: { type: 'category', data: data.map((d) => d.timestamp), boundaryGap: false, axisLabel: { color: '#8a94a6', fontSize: 11 } },
    yAxis: { type: 'value', axisLabel: { color: '#8a94a6', formatter: `{value} ${unit}` }, splitLine: { lineStyle: { color: '#eef0f3' } } },
    tooltip: { trigger: 'axis' },
    series: [
      { name: name1, type: 'line', smooth: true, showSymbol: false, data: data.map((d) => d.a.toFixed(1)), lineStyle: { color: c1, width: 2 } },
      { name: name2, type: 'line', smooth: true, showSymbol: false, data: data.map((d) => d.b.toFixed(1)), lineStyle: { color: c2, width: 2 } },
    ],
  });

  return (
    <div className="mt-system-metrics-page">
      <div className="mt-system-metrics-page-header">
        <Typography.Title heading={3} className="title">{t('maintenance.dashboard.metrics.title')}</Typography.Title>
        <Typography.Text type="tertiary">{t('maintenance.dashboard.metrics.description')}</Typography.Text>
      </div>

      <div className="mt-system-metrics-page-toolbar">
        <Typography.Text type="tertiary" size="small" style={{ marginRight: 12 }}>{t('maintenance.dashboard.metrics.timeRange')}：</Typography.Text>
        <RadioGroup type="button" value={range} onChange={(e) => setRange(e.target.value as string)}>
          <Radio value="5min">{t('maintenance.dashboard.metrics.min5')}</Radio>
          <Radio value="15min">{t('maintenance.dashboard.metrics.min15')}</Radio>
          <Radio value="1hour">{t('maintenance.dashboard.metrics.hour1')}</Radio>
          <Radio value="6hour">{t('maintenance.dashboard.metrics.hour6')}</Radio>
          <Radio value="24hour">{t('maintenance.dashboard.metrics.hour24')}</Radio>
        </RadioGroup>
      </div>

      <div className="mt-system-metrics-page-body">
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <div className="metric-card">
              <div className="metric-card__title">{t('maintenance.dashboard.metrics.cpu')}</div>
              <ReactECharts option={buildSingleOpt(cpu, '#3b82f6', 'rgba(59,130,246,0.3)', '%')} style={{ height: 240 }} opts={{ renderer: 'svg' }} />
            </div>
          </Col>
          <Col span={12}>
            <div className="metric-card">
              <div className="metric-card__title">{t('maintenance.dashboard.metrics.memory')}</div>
              <ReactECharts option={buildSingleOpt(mem, '#10b981', 'rgba(16,185,129,0.3)', '%')} style={{ height: 240 }} opts={{ renderer: 'svg' }} />
            </div>
          </Col>
          <Col span={12}>
            <div className="metric-card">
              <div className="metric-card__title">{t('maintenance.dashboard.metrics.disk')}</div>
              <ReactECharts option={buildDualOpt(disk, '#f59e0b', '#8b5cf6', t('maintenance.dashboard.metrics.read'), t('maintenance.dashboard.metrics.write'), 'MB/s')} style={{ height: 240 }} opts={{ renderer: 'svg' }} />
            </div>
          </Col>
          <Col span={12}>
            <div className="metric-card">
              <div className="metric-card__title">{t('maintenance.dashboard.metrics.network')}</div>
              <ReactECharts option={buildDualOpt(net, '#3b82f6', '#ef4444', t('maintenance.dashboard.metrics.in'), t('maintenance.dashboard.metrics.out'), 'KB/s')} style={{ height: 240 }} opts={{ renderer: 'svg' }} />
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default SystemMetricsPage;
