import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Button,
  Banner,
  Tag,
  Typography,
  Toast,
  Spin,
  TextArea,
} from '@douyinfe/semi-ui';
import type { ChangedFieldDiff, ChangeType, RequirementDraft } from '../../types';
import { previewChange, publishChange } from '../../mockData';
import './index.less';

const { Text } = Typography;

interface PublishChangeModalProps {
  visible: boolean;
  requirementId: string;
  patch: RequirementDraft['patch'];
  onCancel: () => void;
  onPublished: () => void;
}

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

const ERROR_MAP: Record<string, string> = {
  CHANGE_REASON_TOO_SHORT: '变更说明至少 10 个字符',
  DEV_IMPACT_CONCURRENT_PENDING: '该需求已存在尚未响应的「影响开发」变更，请等待开发响应后再提交',
  NO_CHANGES: '未检测到有效变更',
  NOT_POST_PROJECT_STATUS: '当前需求未进入立项后阶段，无法发布变更',
  REQUIREMENT_NOT_FOUND: '需求不存在或已被删除',
};

const PublishChangeModal = ({
  visible,
  requirementId,
  patch,
  onCancel,
  onPublished,
}: PublishChangeModalProps) => {
  const [loading, setLoading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [diffs, setDiffs] = useState<ChangedFieldDiff[]>([]);
  const [reason, setReason] = useState('');
  const [devImpact, setDevImpact] = useState(false);

  useEffect(() => {
    if (!visible) {
      setReason('');
      setDiffs([]);
      setDevImpact(false);
      return;
    }
    let cancelled = false;
    setPreviewing(true);
    previewChange(requirementId, patch)
      .then((res) => {
        if (cancelled) return;
        setDiffs(res.diffs);
      })
      .catch(() => {
        if (cancelled) return;
        Toast.error('变更预览失败');
      })
      .finally(() => {
        if (!cancelled) setPreviewing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [visible, requirementId, patch]);

  const reasonTrim = reason.trim();
  const reasonValid = reasonTrim.length >= 10;
  const changeType: ChangeType = devImpact ? 'DEV_IMPACT' : 'CONTENT';
  const canSubmit = useMemo(
    () => diffs.length > 0 && reasonValid,
    [diffs.length, reasonValid],
  );

  const handlePublish = async () => {
    setLoading(true);
    try {
      await publishChange({ requirementId, patch, reason: reasonTrim, changeType });
      Toast.success(devImpact ? '变更已发布,开发侧需在 7 日内响应' : '变更已发布');
      onPublished();
    } catch (e) {
      const code = (e as Error)?.message ?? '';
      Toast.error(ERROR_MAP[code] || `发布失败: ${code || '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="发布变更"
      visible={visible}
      onCancel={onCancel}
      footer={null}
      width={520}
      centered
      closeOnEsc
      maskClosable={false}
      className="publish-change-modal"
    >
      <div className="publish-change-modal-body">
        {previewing ? (
          <div className="publish-change-modal-loading">
            <Spin />
          </div>
        ) : (
          <>
            <div className="publish-change-modal-row">
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
              <div className="publish-change-modal-diffs">
                <Text type="tertiary" className="publish-change-modal-section-title">
                  变更字段 ({diffs.length})
                </Text>
                <div className="publish-change-modal-diff-list">
                  {diffs.map((d) => (
                    <div className="publish-change-modal-diff-item" key={d.key}>
                      <div className="publish-change-modal-diff-key">{labelOf(d.key)}</div>
                      <div className="publish-change-modal-diff-values">
                        <span className="publish-change-modal-diff-before">
                          {formatVal(d.before)}
                        </span>
                        <span className="publish-change-modal-diff-arrow">→</span>
                        <span className="publish-change-modal-diff-after">
                          {formatVal(d.after)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="publish-change-modal-form">
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
                  onChange={(v) => setReason(v ?? '')}
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
              <label className="publish-change-modal-confirm">
                <input
                  type="checkbox"
                  checked={devImpact}
                  onChange={(e) => setDevImpact(e.target.checked)}
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

      <div className="publish-change-modal-footer">
        <Button theme="light" onClick={onCancel} disabled={loading}>
          取消
        </Button>
        <Button
          theme="solid"
          type="primary"
          loading={loading}
          disabled={!canSubmit || previewing}
          onClick={handlePublish}
        >
          {devImpact ? '确认并发布变更' : '发布变更'}
        </Button>
      </div>
    </Modal>
  );
};

export default PublishChangeModal;
