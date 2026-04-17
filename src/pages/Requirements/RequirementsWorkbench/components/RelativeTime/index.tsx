import { useMemo } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import { Tooltip, Typography } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';

dayjs.extend(relativeTime);

interface RelativeTimeProps {
  value?: string | null;
}

const RelativeTime = ({ value }: RelativeTimeProps) => {
  const { i18n } = useTranslation();
  const display = useMemo(() => {
    if (!value) return '-';
    const d = dayjs(value);
    if (!d.isValid()) return '-';
    return d.locale(i18n.language?.startsWith('zh') ? 'zh-cn' : 'en').fromNow();
  }, [value, i18n.language]);
  if (!value) return <Typography.Text type="tertiary">-</Typography.Text>;
  const full = dayjs(value).format('YYYY-MM-DD HH:mm:ss');
  return (
    <Tooltip content={full} position="top">
      <Typography.Text type="tertiary" size="small">{display}</Typography.Text>
    </Tooltip>
  );
};

export default RelativeTime;
