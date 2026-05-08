import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Timeline, Tag, Typography, Spin } from '@douyinfe/semi-ui';
import type { TagColor } from '@douyinfe/semi-ui/lib/es/tag/interface';
import { AlertTriangle } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import type { ChangeType, RequirementChangeLog } from '../../types';
import { listChangeLogs } from '../../mockData';
import './index.less';

const { Text } = Typography;

const OVERDUE_DAYS = 7;
const OVERDUE_MS = OVERDUE_DAYS * 24 * 60 * 60 * 1000;

const typeColorMap: Record<ChangeType, TagColor> = {
  CONTENT: 'blue',
  DEV_IMPACT: 'orange',
  SYSTEM: 'grey',
};

/** 时间线节点颜色 — 与 Tag 色调对齐 */
const dotColorMap: Record<ChangeType, 'default' | 'warning' | 'ongoing'> = {
  CONTENT: 'ongoing',
  DEV_IMPACT: 'warning',
  SYSTEM: 'default',
};

const formatTime = (iso: string) => iso.replace('T', ' ').substring(0, 19);

const formatValue = (v: unknown): string => {
  if (v === null || v === undefined || v === '') return '-';
  if (typeof v === 'object') {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  return String(v);
};

interface Props {
  requirementId: string;
  /** 父级触发刷新的版本号（变更后递增即可重新拉取） */
  refreshKey?: number;
}

const ChangeLogTab = ({ requirementId, refreshKey }: Props) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<RequirementChangeLog[]>([]);

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
        {logs.map((log) => {
          const overdue =
            log.changeType === 'DEV_IMPACT' &&
            log.status === 'PENDING' &&
            Date.now() - new Date(log.publishedAt).getTime() > OVERDUE_MS;
          return (
            <Timeline.Item
              key={log.id}
              type={dotColorMap[log.changeType]}
              time={formatTime(log.publishedAt)}
            >
              <div className="change-log-item">
                <div className="change-log-item-header">
                  <Tag color={typeColorMap[log.changeType]} size="small">
                    {t(`requirements.detail.changeLog.type.${log.changeType}`)}
                  </Tag>
                  {log.needsDevResponse && (
                    <Tag
                      color={log.status === 'PENDING' ? 'orange' : 'green'}
                      size="small"
                      type="light"
                    >
                      {t(`requirements.detail.changeLog.status.${log.status}`)}
                    </Tag>
                  )}
                  {overdue && (
                    <span className="change-log-overdue">
                      <AlertTriangle size={14} strokeWidth={2} />
                      {t('requirements.detail.changeLog.overdue', { days: OVERDUE_DAYS })}
                    </span>
                  )}
                </div>

                <div className="change-log-item-meta">
                  <Text type="tertiary" size="small">
                    {t('requirements.detail.changeLog.publishedBy', {
                      name: log.publisherName,
                      time: formatTime(log.publishedAt),
                    })}
                  </Text>
                  {log.workspaceName && (
                    <Text type="tertiary" size="small">
                      ·{' '}
                      {t('requirements.detail.changeLog.linkedWorkspace', {
                        name: log.workspaceName,
                      })}
                    </Text>
                  )}
                </div>

                <div className="change-log-item-section">
                  <div className="change-log-item-section-title">
                    {t('requirements.detail.changeLog.reasonTitle')}
                  </div>
                  <div className="change-log-item-reason">{log.reason}</div>
                </div>

                {log.diffs.length > 0 && (
                  <div className="change-log-item-section">
                    <div className="change-log-item-section-title">
                      {t('requirements.detail.changeLog.diffTitle')}
                    </div>
                    <ul className="change-log-diffs">
                      {log.diffs.map((d) => (
                        <li key={d.key}>
                          <span className="change-log-diff-key">{d.label || d.key}</span>
                          <span className="change-log-diff-before">{formatValue(d.before)}</span>
                          <span className="change-log-diff-arrow">→</span>
                          <span className="change-log-diff-after">{formatValue(d.after)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {log.response && (
                  <div className="change-log-item-section change-log-item-response">
                    <Tag
                      color={log.response.action === 'REJECTED' ? 'red' : 'green'}
                      size="small"
                    >
                      {t(`requirements.detail.changeLog.response.${log.response.action}`)}
                    </Tag>
                    <Text type="tertiary" size="small">
                      {t('requirements.detail.changeLog.respondedBy', {
                        name: log.response.responderName,
                        time: formatTime(log.response.respondedAt),
                      })}
                    </Text>
                    {log.response.comment && (
                      <div className="change-log-item-response-comment">
                        {log.response.comment}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Timeline.Item>
          );
        })}
      </Timeline>
    </div>
  );
};

export default ChangeLogTab;
