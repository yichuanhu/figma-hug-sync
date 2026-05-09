import { useEffect, useState } from 'react';
import { Banner, Tag, Typography, Toast, Spin, TextArea } from '@douyinfe/semi-ui';
import type { ChangedFieldDiff, ChangeType, RequirementDraft } from '../../types';
import { previewChange } from '../../mockData';
import './index.less';

const { Text } = Typography;

const FIELD_LABELS: Record<string, string> = {
  title: '标题',
  description: '描述',
  priority: '优先级',
};

const formatVal = (v: unknown): string => {
  if (v == null || v === '') return '—';
  if (Array.isArray(v)) return v.length ? v.join('、') : '—';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
};

const labelOf = (key: string): string => {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];
  if (key.startsWith('form.')) return key.slice(5);
  return key;
};

interface PublishChangePanelProps {
  requirementId: string;
  patch: RequirementDraft['patch'];
  reason: string;
  onReasonChange: (v: string) => void;
  devImpact: boolean;
  onDevImpactChange: (v: boolean) => void;
  diffs: ChangedFieldDiff[];
  onDiffsChange: (d: ChangedFieldDiff[]) => void;
  previewing: boolean;
  onPreviewingChange: (v: boolean) => void;
}

export const ERROR_MAP: Record<string, string> = {
  CHANGE_REASON_TOO_SHORT: '变更说明至少 10 个字符',
  DEV_IMPACT_CONCURRENT_PENDING: '该需求已存在尚未响应的「影响开发」变更，请等待开发响应后再提交',
  NO_CHANGES: '未检测到有效变更',
  NOT_POST_PROJECT_STATUS: '当前需求未进入立项后阶段，无法发布变更',
  REQUIREMENT_NOT_FOUND: '需求不存在或已被删除',
};

export const computePublishChangeType = (devImpact: boolean): ChangeType =>
  devImpact ? 'DEV_IMPACT' : 'CONTENT';

const PublishChangePanel = ({
  requirementId,
  patch,
  reason,
  onReasonChange,
  devImpact,
  onDevImpactChange,
  diffs,
  onDiffsChange,
  previewing,
  onPreviewingChange,
}: PublishChangePanelProps) => {
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    onPreviewingChange(true);
    setHasLoaded(false);
    previewChange(requirementId, patch)
      .then((res) => {
        if (cancelled) return;
        onDiffsChange(res.diffs);
        setHasLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        Toast.error('变更预览失败');
      })
      .finally(() => {
        if (!cancelled) onPreviewingChange(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requirementId, patch]);

  const reasonTrim = reason.trim();
  const reasonValid = reasonTrim.length >= 10;

  return (
    <div className="publish-change-panel">
      {previewing && !hasLoaded ? (
        <div className="publish-change-panel-loading">
          <Spin />
        </div>
      ) : (
        <>
          <div className="publish-change-panel-row">
            <Text type="tertiary">变更类型</Text>
            <Tag color={devImpact ? 'red' : 'blue'}>
              {devImpact ? '影响开发' : '内容变更'}
            </Tag>
          </div>

          {diffs.length === 0 ? (
            <Banner
              type="info"
              fullMode={false}
              closeIcon={null}
              description="未检测到有效变更,无需发布。"
            />
          ) : (
            <div className="publish-change-panel-diffs">
              <Text type="tertiary" className="publish-change-panel-section-title">
                变更字段 ({diffs.length})
              </Text>
              <div className="publish-change-panel-diff-list">
                {diffs.map((d) => (
                  <div className="publish-change-panel-diff-item" key={d.key}>
                    <div className="publish-change-panel-diff-key">{labelOf(d.key)}</div>
                    <div className="publish-change-panel-diff-values">
                      <span className="publish-change-panel-diff-before">
                        {formatVal(d.before)}
                      </span>
                      <span className="publish-change-panel-diff-arrow">→</span>
                      <span className="publish-change-panel-diff-after">
                        {formatVal(d.after)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="publish-change-panel-form">
            <div className="semi-form-field">
              <label className="semi-form-field-label">
                <span className="semi-form-field-label-text">
                  <span style={{ color: 'var(--semi-color-danger)', marginRight: 4 }}>*</span>
                  变更说明
                </span>
              </label>
              <TextArea
                placeholder="请说明本次变更的原因和影响范围,至少 10 个字符"
                value={reason}
                onChange={(v) => onReasonChange(v ?? '')}
                rows={4}
                maxCount={500}
              />
              {!reasonValid && reason.length > 0 && (
                <Text size="small" type="danger">
                  变更说明至少 10 个字符,当前 {reasonTrim.length}
                </Text>
              )}
            </div>
          </div>

          {diffs.length > 0 && (
            <label className="publish-change-panel-confirm">
              <input
                type="checkbox"
                checked={devImpact}
                onChange={(e) => onDevImpactChange(e.target.checked)}
              />
              <Text>本次变更影响开发,需要开发侧响应（7 日内）</Text>
            </label>
          )}

          {devImpact && diffs.length > 0 && (
            <Banner
              type="warning"
              fullMode={false}
              closeIcon={null}
              description="发布后将通知关联工作空间,请开发侧在 7 日内响应。"
            />
          )}
        </>
      )}
    </div>
  );
};

export default PublishChangePanel;
