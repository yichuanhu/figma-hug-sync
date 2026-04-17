import { useState, useEffect, useRef } from 'react';
import { Typography, Tag, Button, Row, Col, Toast, Space } from '@douyinfe/semi-ui';
import { CheckCircle2, XCircle, RefreshCw, Activity } from 'lucide-react';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { initialMiddlewares } from '../mockData';
import type { MiddlewareItem } from '../types';
import './index.less';

const MiddlewareStatusPage = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<MiddlewareItem[]>(initialMiddlewares);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkOne = (id: string): MiddlewareItem => {
    const item = items.find((i) => i.id === id)!;
    const isHealthy = Math.random() > 0.15;
    return {
      ...item,
      status: isHealthy ? 'healthy' : 'unhealthy',
      responseTime: isHealthy ? Math.floor(50 + Math.random() * 150) : 0,
      lastCheck: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      errorMessage: isHealthy ? undefined : 'Connection timeout',
    };
  };

  const checkAll = () => {
    setItems((prev) => prev.map((item) => {
      const isHealthy = Math.random() > 0.15;
      return {
        ...item,
        status: isHealthy ? 'healthy' : 'unhealthy',
        responseTime: isHealthy ? Math.floor(50 + Math.random() * 150) : 0,
        lastCheck: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        errorMessage: isHealthy ? undefined : 'Connection timeout',
      };
    }));
    Toast.success(t('maintenance.dashboard.middleware.checkSuccess'));
  };

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setItems((prev) => prev.map((item) => ({ ...item, lastCheck: dayjs().format('YYYY-MM-DD HH:mm:ss') })));
    }, 10000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const total = items.length;
  const healthy = items.filter((i) => i.status === 'healthy').length;
  const unhealthy = total - healthy;

  return (
    <div className="mt-middleware-page">
      <div className="mt-middleware-page-header">
        <Typography.Title heading={3} className="title">{t('maintenance.dashboard.middleware.title')}</Typography.Title>
        <Typography.Text type="tertiary">{t('maintenance.dashboard.middleware.description')}</Typography.Text>
      </div>

      <div className="mt-middleware-page-toolbar">
        <Tag prefixIcon={<Activity size={12} strokeWidth={2} />} color="green" type="light">
          {t('maintenance.dashboard.middleware.autoRefresh')}
        </Tag>
        <Button icon={<RefreshCw size={14} strokeWidth={2} />} theme="light" type="primary" onClick={checkAll}>
          {t('maintenance.dashboard.middleware.checkAll')}
        </Button>
      </div>

      <Row gutter={16} className="mt-middleware-page-stats">
        <Col span={8}><div className="stat-card"><span className="stat-card__label">{t('maintenance.dashboard.middleware.total')}</span><span className="stat-card__value">{total}</span></div></Col>
        <Col span={8}><div className="stat-card stat-card--healthy"><span className="stat-card__label">{t('maintenance.dashboard.middleware.healthy')}</span><span className="stat-card__value">{healthy}</span></div></Col>
        <Col span={8}><div className="stat-card stat-card--unhealthy"><span className="stat-card__label">{t('maintenance.dashboard.middleware.unhealthy')}</span><span className="stat-card__value">{unhealthy}</span></div></Col>
      </Row>

      <div className="mt-middleware-page-body">
        <Row gutter={[16, 16]}>
          {items.map((item) => (
            <Col span={12} key={item.id}>
              <div className={`mw-card mw-card--${item.status}`}>
                <div className="mw-card__head">
                  <div className="mw-card__title">
                    <span className="mw-card__name">{item.name}</span>
                    <Tag size="small" color={item.source === 'apa_managed' ? 'blue' : 'grey'} type="light">
                      {item.source === 'apa_managed' ? t('maintenance.dashboard.middleware.sourceManaged') : t('maintenance.dashboard.middleware.sourceBuiltin')}
                    </Tag>
                  </div>
                  <div className="mw-card__status">
                    {item.status === 'healthy' ? (
                      <span className="mw-card__status-tag mw-card__status-tag--healthy"><CheckCircle2 size={14} strokeWidth={2} /> {t('maintenance.dashboard.middleware.healthy')}</span>
                    ) : (
                      <span className="mw-card__status-tag mw-card__status-tag--unhealthy"><XCircle size={14} strokeWidth={2} /> {t('maintenance.dashboard.middleware.unhealthy')}</span>
                    )}
                  </div>
                </div>
                <div className="mw-card__row"><span className="mw-card__label">{t('maintenance.dashboard.middleware.endpoint')}</span><span className="mw-card__value mono">{item.endpoint}</span></div>
                <div className="mw-card__row"><span className="mw-card__label">{t('maintenance.dashboard.middleware.responseTime')}</span><span className="mw-card__value">{item.status === 'healthy' ? `${item.responseTime} ms` : '-'}</span></div>
                <div className="mw-card__row"><span className="mw-card__label">{t('maintenance.dashboard.middleware.lastCheck')}</span><span className="mw-card__value">{item.lastCheck}</span></div>
                {item.errorMessage && (
                  <div className="mw-card__error">{item.errorMessage}</div>
                )}
                <div className="mw-card__actions">
                  <Button size="small" theme="light" type="primary" icon={<RefreshCw size={12} strokeWidth={2} />} onClick={() => setItems((prev) => prev.map((i) => i.id === item.id ? checkOne(item.id) : i))}>
                    {t('maintenance.dashboard.middleware.check')}
                  </Button>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

export default MiddlewareStatusPage;
