import { Banner, Typography } from '@douyinfe/semi-ui';
import type { ReactNode } from 'react';

const { Text } = Typography;

/**
 * 构建提交需求弹窗的内容节点。
 * - 有审批流：仅展示一段说明文案
 * - 无审批流：在文案上方追加一个橙色 Banner，明确提示「已跳过审批流程」
 */
export const buildSubmitConfirmContent = (
  hasApproval: boolean,
  hasAssessment: boolean,
  t: (key: string, options?: Record<string, unknown>) => string,
): ReactNode => {
  if (hasApproval) {
    return <Text>{t('requirements.detail.submitConfirmContent')}</Text>;
  }
  const detail = hasAssessment
    ? t('requirements.detail.submitDirectConfirmContent')
    : t('requirements.detail.submitDirectNoAssessmentContent');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Banner
        type="warning"
        fullMode={false}
        closeIcon={null}
        description={t('requirements.detail.submitSkipNotice')}
        style={{ borderRadius: 6 }}
      />
      <Text>{detail}</Text>
    </div>
  );
};
