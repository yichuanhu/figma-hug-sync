import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Timeline, Typography, Spin, Tag } from '@douyinfe/semi-ui';
import {
  FileEdit, FilePlus2, FileX2, Send, Undo2, RotateCcw, CheckCircle2, XCircle,
  GitBranchPlus, Power, PowerOff, Pencil, ArrowUpDown, Coins, ListChecks, FileText,
} from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import { statusConfigV2 } from '../../statusConfig';
import type { RequirementChangeLog, RequirementChangeType, RequirementStatus, RequirementChangeFieldDiff } from '../../types';
import { listChangeLogs } from '../../mockData';
import './index.less';

const { Text } = Typography;

const formatTime = (iso: string) => iso.replace('T', ' ').substring(0, 19);

type Meta = { icon: JSX.Element; color: 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'cyan' | 'grey' | 'lime' | 'pink'; key: string };

const typeMeta = (type: RequirementChangeType | undefined): Meta => {
  switch (type) {
    case 'SUBMITTED':              return { icon: <Send size={14} strokeWidth={2} />,           color: 'blue',   key: 'requirements.detail.changeLog.type.submitted' };
    case 'RESUBMIT':               return { icon: <Send size={14} strokeWidth={2} />,           color: 'cyan',   key: 'requirements.detail.changeLog.type.resubmit' };
    case 'WITHDRAWN':              return { icon: <Undo2 size={14} strokeWidth={2} />,          color: 'grey',   key: 'requirements.detail.changeLog.type.withdrawn' };
    case 'APPROVAL_PASSED':        return { icon: <CheckCircle2 size={14} strokeWidth={2} />,   color: 'green',  key: 'requirements.detail.changeLog.type.approvalPassed' };
    case 'APPROVAL_REJECTED':      return { icon: <XCircle size={14} strokeWidth={2} />,        color: 'red',    key: 'requirements.detail.changeLog.type.approvalRejected' };
    case 'ASSESSMENT_PASSED':      return { icon: <CheckCircle2 size={14} strokeWidth={2} />,   color: 'lime',   key: 'requirements.detail.changeLog.type.assessmentPassed' };
    case 'ASSESSMENT_REJECTED':    return { icon: <XCircle size={14} strokeWidth={2} />,        color: 'pink',   key: 'requirements.detail.changeLog.type.assessmentRejected' };
    case 'PROCESS_CREATED':        return { icon: <GitBranchPlus size={14} strokeWidth={2} />,  color: 'purple', key: 'requirements.detail.changeLog.type.processCreated' };
    case 'LAUNCHED':               return { icon: <Power size={14} strokeWidth={2} />,          color: 'green',  key: 'requirements.detail.changeLog.type.launched' };
    case 'OFFLINE':                return { icon: <PowerOff size={14} strokeWidth={2} />,       color: 'grey',   key: 'requirements.detail.changeLog.type.offline' };
    case 'RELAUNCHED':             return { icon: <RotateCcw size={14} strokeWidth={2} />,      color: 'green',  key: 'requirements.detail.changeLog.type.relaunched' };
    case 'EDIT_FULL':              return { icon: <Pencil size={14} strokeWidth={2} />,         color: 'orange', key: 'requirements.detail.changeLog.type.editFull' };
    case 'EDIT_BUSINESS':          return { icon: <Pencil size={14} strokeWidth={2} />,         color: 'blue',   key: 'requirements.detail.changeLog.type.editBusiness' };
    case 'PRIORITY_CHANGED':       return { icon: <ArrowUpDown size={14} strokeWidth={2} />,    color: 'orange', key: 'requirements.detail.changeLog.type.priorityChanged' };
    case 'COST_BASELINE_UPDATED':  return { icon: <Coins size={14} strokeWidth={2} />,          color: 'cyan',   key: 'requirements.detail.changeLog.type.costBaselineUpdated' };
    case 'FORM_DATA_UPDATED':      return { icon: <ListChecks size={14} strokeWidth={2} />,     color: 'blue',   key: 'requirements.detail.changeLog.type.formDataUpdated' };
    case 'DEV_SCHEME_DOC_UPLOADED':return { icon: <FilePlus2 size={14} strokeWidth={2} />,      color: 'green',  key: 'requirements.detail.changeLog.type.devSchemeUploaded' };
    case 'DEV_SCHEME_DOC_DELETED': return { icon: <FileX2 size={14} strokeWidth={2} />,         color: 'red',    key: 'requirements.detail.changeLog.type.devSchemeDeleted' };
    default:                       return { icon: <FileEdit size={14} strokeWidth={2} />,       color: 'blue',   key: 'requirements.detail.changeLog.type.content' };
  }
};

const formatValue = (v: unknown, emptyLabel: string): string => {
  if (v === undefined || v === null || v === '') return emptyLabel;
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
};

interface Props {
  requirementId: string;
  refreshKey?: number;
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
      .then((list) => { if (alive) setLogs(list); })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [requirementId, refreshKey]);

  if (loading) {
    return <div className="change-log-tab-loading"><Spin /></div>;
  }
  if (logs.length === 0) {
    return <EmptyState variant="noData" description={t('requirements.detail.changeLog.empty')} />;
  }

  const emptyLabel = t('requirements.detail.changeLog.emptyValue');

  const renderStatusTag = (s?: RequirementStatus) => {
    if (!s) return null;
    const cfg = statusConfigV2[s];
    return <Tag size="small" color={cfg?.color ?? 'grey'} type="light">{t(cfg?.i18nKey ?? '')}</Tag>;
  };

  const renderDiffs = (diffs?: RequirementChangeFieldDiff[]) => {
    if (!diffs || diffs.length === 0) return null;
    return (
      <div className="change-log-item-section">
        <div className="change-log-item-section-title">
          {t('requirements.detail.changeLog.changedFieldsTitle')}
        </div>
        <ul className="change-log-diffs">
          {diffs.map((d) => (
            <li key={d.field}>
              <span className="change-log-diff-key">{d.label}</span>
              {d.oldValue !== undefined && (
                <>
                  <span className="change-log-diff-before">{formatValue(d.oldValue, emptyLabel)}</span>
                  <span className="change-log-diff-arrow">→</span>
                </>
              )}
              <span className="change-log-diff-after">{formatValue(d.newValue, emptyLabel)}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="change-log-tab">
      <Timeline mode="left">
        {logs.map((log) => {
          const meta = typeMeta(log.changeType);
          const hasTransition = log.oldStatus || log.newStatus;
          return (
            <Timeline.Item key={log.id} type="ongoing" time={formatTime(log.publishedAt)}>
              <div
                className="change-log-item"
                ref={(el) => { itemRefs.current[log.id] = el; }}
              >
                <div className="change-log-item-meta">
                  <Tag color={meta.color} prefixIcon={meta.icon} size="small">{t(meta.key)}</Tag>
                  {hasTransition && (
                    <>
                      {renderStatusTag(log.oldStatus)}
                      <span style={{ color: 'var(--semi-color-text-2)' }}>→</span>
                      {renderStatusTag(log.newStatus)}
                    </>
                  )}
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

                {renderDiffs(log.changedFields)}

                {log.meta && (log.changeType === 'DEV_SCHEME_DOC_UPLOADED' || log.changeType === 'DEV_SCHEME_DOC_DELETED') && (
                  <div className="change-log-item-section">
                    <div className="change-log-item-section-title">
                      <FileText size={12} strokeWidth={2} style={{ verticalAlign: '-2px', marginRight: 4 }} />
                      {String(log.meta.fileName ?? `v${log.meta.version ?? ''}`)}
                    </div>
                  </div>
                )}

                {log.notifiedRoles && log.notifiedRoles.length > 0 && (
                  <Text type="tertiary" size="small">
                    {t('requirements.detail.changeLog.notifiedRoles', { roles: log.notifiedRoles.join('、') })}
                  </Text>
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
