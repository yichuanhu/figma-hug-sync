import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography } from '@douyinfe/semi-ui';
import './index.less';

const { Text } = Typography;

interface ExpandableTextProps {
  text: string | null | undefined;
  maxLines?: number;
  className?: string;
}

/**
 * 可展开/收起的文本组件
 * 当文本超过指定行数时，显示展开/收起按钮
 */
const ExpandableText = ({ text, maxLines = 3, className = '' }: ExpandableTextProps) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [isOverflow, setIsOverflow] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textRef.current) {
      const element = textRef.current;
      const lineHeight = parseFloat(getComputedStyle(element).lineHeight) || 20;
      const maxHeight = lineHeight * maxLines;
      setIsOverflow(element.scrollHeight > maxHeight + 2); // 2px tolerance
    }
  }, [text, maxLines]);

  if (!text) {
    return <span>-</span>;
  }

  return (
    <div className={`expandable-text ${className}`}>
      <div
        ref={textRef}
        className={`expandable-text-content ${expanded ? 'expanded' : ''}`}
        style={{
          WebkitLineClamp: expanded ? 'unset' : maxLines,
        }}
      >
        {text}
      </div>
      {isOverflow && (
        <Text
          link
          className="expandable-text-toggle"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? t('common.collapse') : t('common.expand')}
        </Text>
      )}
    </div>
  );
};

export default ExpandableText;
