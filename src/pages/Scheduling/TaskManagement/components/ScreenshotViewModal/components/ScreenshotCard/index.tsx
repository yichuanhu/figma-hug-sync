import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Checkbox, Image, Typography, Tooltip } from '@douyinfe/semi-ui';
import type { CheckboxEvent } from '@douyinfe/semi-ui/lib/es/checkbox';
import type { LYTaskScreenshotResponse } from '@/api';
import './index.less';

const { Text } = Typography;

interface ScreenshotCardProps {
  screenshot: LYTaskScreenshotResponse;
  selected: boolean;
  onSelect: (id: string, selected: boolean) => void;
}

// 格式化时间
const formatTime = (isoTime: string): string => {
  const date = new Date(isoTime);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const ScreenshotCard = ({ screenshot, selected, onSelect }: ScreenshotCardProps) => {
  const { t } = useTranslation();

  // 展示的名称
  const displayName = useMemo(() => {
    if (screenshot.name) {
      return screenshot.name;
    }
    return `${t('screenshot.defaultName')} ${screenshot.sequence_number}`;
  }, [screenshot.name, screenshot.sequence_number, t]);

  // 处理复选框变更
  const handleCheckboxChange = (e: CheckboxEvent) => {
    onSelect(screenshot.id, e.target.checked ?? false);
  };

  // 阻止事件冒泡，避免点击 checkbox 时触发其他事件
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className={`screenshot-card ${selected ? 'screenshot-card--selected' : ''}`}>
      {/* 复选框 */}
      <div className="screenshot-card-checkbox" onClick={handleCheckboxClick}>
        <Checkbox
          checked={selected}
          onChange={handleCheckboxChange}
          aria-label={t('screenshot.select')}
        />
      </div>

      {/* 序号标签 */}
      <div className="screenshot-card-sequence">
        #{screenshot.sequence_number}
      </div>

      {/* 图片容器 - 16:9 比例 */}
      <div className="screenshot-card-image-container">
        <Image
          src={screenshot.thumbnail_url || screenshot.file_url}
          alt={displayName}
          className="screenshot-card-image"
          preview={{
            src: screenshot.file_url,
          }}
          fallback={
            <div className="screenshot-card-image-fallback">
              <Text type="tertiary">{t('screenshot.loadFailed')}</Text>
            </div>
          }
        />
      </div>

      {/* 信息区域 */}
      <div className="screenshot-card-info">
        <Tooltip content={displayName} position="top">
          <Text className="screenshot-card-name" ellipsis={{ showTooltip: false }}>
            {displayName}
          </Text>
        </Tooltip>
        <Text className="screenshot-card-time" type="tertiary" size="small">
          {formatTime(screenshot.captured_at)}
        </Text>
      </div>
    </div>
  );
};

export default ScreenshotCard;
