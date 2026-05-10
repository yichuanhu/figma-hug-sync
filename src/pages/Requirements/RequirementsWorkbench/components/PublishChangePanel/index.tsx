import { Typography, TextArea } from '@douyinfe/semi-ui';
import type { ChangeType } from '../../types';
import './index.less';

const { Text } = Typography;

interface PublishChangePanelProps {
  reason: string;
  onReasonChange: (v: string) => void;
}

export const ERROR_MAP: Record<string, string> = {
  CHANGE_REASON_TOO_SHORT: '变更说明至少 10 个字符',
  NO_CHANGES: '未检测到有效变更',
  NOT_POST_PROJECT_STATUS: '当前需求未进入立项后阶段，无法发布变更',
  REQUIREMENT_NOT_FOUND: '需求不存在或已被删除',
};

export const computePublishChangeType = (): ChangeType => 'CONTENT';

const PublishChangePanel = ({ reason, onReasonChange }: PublishChangePanelProps) => {
  const reasonTrim = reason.trim();
  const reasonValid = reasonTrim.length >= 10;

  return (
    <div className="publish-change-panel">
      <div className="publish-change-panel-form">
        <div className="semi-form-field">
          <label className="semi-form-field-label">
            <span className="semi-form-field-label-text">
              <span style={{ color: 'var(--semi-color-danger)', marginRight: 4 }}>*</span>
              变更说明
            </span>
          </label>
          <TextArea
            placeholder="请说明本次变更的原因和影响范围，至少 10 个字符"
            value={reason}
            onChange={(v) => onReasonChange(v ?? '')}
            rows={5}
            maxCount={500}
          />
          {!reasonValid && reason.length > 0 && (
            <Text size="small" type="danger">
              变更说明至少 10 个字符，当前 {reasonTrim.length}
            </Text>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublishChangePanel;
