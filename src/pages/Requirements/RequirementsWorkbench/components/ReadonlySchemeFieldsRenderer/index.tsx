/**
 * ReadonlySchemeFieldsRenderer
 * 公共只读自定义字段渲染器：根据 Scheme.custom_fields + form_data 渲染 label/value 列表。
 *
 * 用法：
 *   <ReadonlySchemeFieldsRenderer fields={scheme.custom_fields} formData={req.form_data} />
 *
 * - showEmpty=false（默认）：仅渲染有值字段；全部为空时返回 null
 * - showEmpty=true：始终渲染所有字段（无值显示 "-"），用于方案预览/需求详情
 */

import { useState } from 'react';
import { Typography, Button, ImagePreview } from '@douyinfe/semi-ui';
import { Paperclip, Download, Eye } from 'lucide-react';
import dayjs from 'dayjs';
import ExpandableText from '@/components/ExpandableText';
import type { SchemeField } from '../../types';
import './index.less';

const { Text } = Typography;

const IMAGE_EXT = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'];
const isImageFile = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return IMAGE_EXT.includes(ext);
};

interface AttachmentFile {
  name: string;
  size?: number;
  uid?: string;
  url?: string;
}

const triggerDownload = (file: AttachmentFile) => {
  const url = file.url ?? '#';
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const LONG_TEXT_TYPES = new Set(['textarea', 'rich_text', 'file_upload']);

const formatScalar = (field: SchemeField, value: unknown): string => {
  if (value === undefined || value === null || value === '') return '-';
  if (Array.isArray(value)) {
    if (field.options) {
      return value
        .map((v) => field.options?.find((o) => o.value === v)?.label ?? String(v))
        .join('、');
    }
    return value.map((v) => String(v)).join('、');
  }
  if (field.options) {
    const opt = field.options.find((o) => o.value === value);
    if (opt) return opt.label;
  }
  if (field.type === 'percentage' && typeof value === 'number') {
    const pct = value <= 1 ? value * 100 : value;
    return `${Number(pct.toFixed(2))}%`;
  }
  if (field.type === 'date' && (typeof value === 'string' || value instanceof Date)) {
    const d = dayjs(value as string | Date);
    return d.isValid() ? d.format('YYYY-MM-DD') : String(value);
  }
  if (field.unit && (typeof value === 'number' || typeof value === 'string')) {
    return `${value}${field.unit}`;
  }
  if (typeof value === 'boolean') return value ? '是' : '否';
  return String(value);
};

const formatFileSize = (size?: number) => {
  if (!size && size !== 0) return '';
  if (size < 1024) return `${size}B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`;
  return `${(size / 1024 / 1024).toFixed(1)}MB`;
};

const isFileList = (value: unknown): value is AttachmentFile[] =>
  Array.isArray(value) && value.length > 0 && value.every((v) => v && typeof v === 'object' && 'name' in v);

const FileListRenderer = ({ files }: { files: AttachmentFile[] }) => {
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  const imageFiles = files.filter((f) => isImageFile(f.name) && f.url);
  const imageUrls = imageFiles.map((f) => f.url as string);

  const handlePreview = (file: AttachmentFile) => {
    const idx = imageFiles.findIndex((f) => (f.uid ?? f.name) === (file.uid ?? file.name));
    if (idx >= 0) {
      setPreviewIndex(idx);
      setPreviewVisible(true);
    }
  };

  return (
    <div className="readonly-scheme-fields-files">
      {files.map((f, idx) => {
        const canPreview = isImageFile(f.name) && !!f.url;
        return (
          <div key={f.uid ?? `${f.name}-${idx}`} className="readonly-scheme-fields-file-item">
            <Paperclip size={14} strokeWidth={2} />
            <Text className="readonly-scheme-fields-file-name" ellipsis={{ showTooltip: true }}>
              {f.name}
            </Text>
            {f.size !== undefined && (
              <Text type="tertiary" size="small">
                {formatFileSize(f.size)}
              </Text>
            )}
            <div className="readonly-scheme-fields-file-actions">
              {canPreview && (
                <Button
                  size="small"
                  theme="borderless"
                  type="tertiary"
                  icon={<Eye size={14} strokeWidth={2} />}
                  onClick={() => handlePreview(f)}
                />
              )}
              <Button
                size="small"
                theme="borderless"
                type="tertiary"
                icon={<Download size={14} strokeWidth={2} />}
                onClick={() => triggerDownload(f)}
                disabled={!f.url}
              />
            </div>
          </div>
        );
      })}
      {imageUrls.length > 0 && (
        <ImagePreview
          src={imageUrls}
          currentIndex={previewIndex}
          onIndexChange={setPreviewIndex}
          visible={previewVisible}
          onVisibleChange={setPreviewVisible}
        />
      )}
    </div>
  );
};

const renderValue = (field: SchemeField, value: unknown) => {
  // 文件上传
  if (field.type === 'file_upload') {
    if (!isFileList(value)) return <Text>-</Text>;
    return <FileListRenderer files={value} />;
  }

  // 长文本：textarea / rich_text，超长可展开
  if ((field.type === 'textarea' || field.type === 'rich_text') && typeof value === 'string' && value) {
    return <ExpandableText text={value} maxLines={3} />;
  }

  return <Text className="readonly-scheme-fields-value-text">{formatScalar(field, value)}</Text>;
};

interface Props {
  fields: SchemeField[];
  formData?: Record<string, unknown>;
  /** 是否渲染无值字段（true 用于方案预览 / 需求详情；默认 false 仅渲染有值字段） */
  showEmpty?: boolean;
  className?: string;
}

const ReadonlySchemeFieldsRenderer = ({
  fields,
  formData = {},
  showEmpty = false,
  className,
}: Props) => {
  const visible = showEmpty
    ? fields
    : fields.filter(
        (f) => formData[f.key] !== undefined && formData[f.key] !== null && formData[f.key] !== '',
      );

  if (visible.length === 0) return null;

  return (
    <div className={`readonly-scheme-fields ${className ?? ''}`}>
      {visible.map((f) => {
        const isLong = LONG_TEXT_TYPES.has(f.type);
        return (
          <div
            key={f.key}
            className={`readonly-scheme-fields-item ${isLong ? 'is-block' : ''}`}
          >
            <Text type="tertiary" size="small" className="readonly-scheme-fields-label">
              {f.label}
            </Text>
            <div className="readonly-scheme-fields-value">{renderValue(f, formData[f.key])}</div>
          </div>
        );
      })}
    </div>
  );
};

export default ReadonlySchemeFieldsRenderer;
