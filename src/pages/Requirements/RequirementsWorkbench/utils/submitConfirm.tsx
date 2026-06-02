import { Typography } from '@douyinfe/semi-ui';
import type { ReactNode } from 'react';

const { Text } = Typography;

/**
 * 构建「提交需求」确认弹窗的内容。
 * 仅向用户确认是否提交，具体走审批/评估/直接进入下阶段由服务端判断。
 */
export const buildSubmitConfirmContent = (
  requirementName: string,
  t: (key: string, options?: Record<string, unknown>) => string,
): ReactNode => (
  <Text>{t('requirements.detail.submitConfirmContent', { name: requirementName })}</Text>
);
