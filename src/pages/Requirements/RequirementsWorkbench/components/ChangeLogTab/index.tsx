import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Timeline, Typography, Spin } from '@douyinfe/semi-ui';
import EmptyState from '@/components/EmptyState';
import type { RequirementChangeLog } from '../../types';
import { listChangeLogs } from '../../mockData';
import './index.less';

const { Text } = Typography;

const formatTime = (iso: string) => iso.replace('T', ' ').substring(0, 19);

interface Props {
  requirementId: string;
  /** 父级触发刷新的版本号（变更后递增即可重新拉取） */
  refreshKey?: number;
  /** 需要高亮的变更日志 ID（短暂背景闪烁） */
  highlightLogId?: string;
}

const ChangeLogTab = ({ requirementId, refreshKey, highlightLogId }: Props) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<RequirementChangeLog[]>([]);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!highlightLogId || loading) return;
    const node = itemRefs.current[highlightLogId];
    if (!node) return;
    node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    node.classList.add('change-log-item-highlight');
    const timer = setTimeout(() => node.classList.remove('change-log-item-highlight'), 2200);
    return () => clearTimeout(timer);
  }, [highlightLogId, loading, logs]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    listChangeLogs(requirementId)
      .then((list) => {
        if (alive) setLogs(list);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [requirementId, refreshKey]);

  if (loading) {
    return (
      <div className="change-log-tab-loading">
        <Spin />
      </div>
    );
  }

  if (logs.length === 0) {
    return <EmptyState variant="noData" description={t('requirements.detail.changeLog.empty')} />;
  }

  return (
    <div className="change-log-tab">
      <Timeline mode="left">
        {logs.map((log) => (
          <Timeline.Item key={log.id} type="ongoing" time={formatTime(log.publishedAt)}>
            <div
              className="change-log-item"
              ref={(el) => {
                itemRefs.current[log.id] = el;
              }}
            >
              <div className="change-log-item-meta">
                <Text type="tertiary" size="small">
                  {t('requirements.detail.changeLog.publishedBy', {
                    name: log.publisherName,
                    time: formatTime(log.publishedAt),
                  })}
                </Text>
              </div>

              <div className="change-log-item-section">
                <div className="change-log-item-section-title">
                  {t('requirements.detail.changeLog.reasonTitle')}
                </div>
                <div className="change-log-item-reason">{log.reason}</div>
              </div>
            </div>
          </Timeline.Item>
        ))}
      </Timeline>
    </div>
  );
};

export default ChangeLogTab;
