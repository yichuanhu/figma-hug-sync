import { useEffect, useMemo, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './index.less';

export interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  /** 最小高度（px），默认 200 */
  minHeight?: number;
  /** 最大高度（px），超出滚动，默认 480 */
  maxHeight?: number;
  /** 字数上限。超出时仍允许输入，但会高亮提示 */
  maxLength?: number;
  /** 是否只读 */
  readOnly?: boolean;
  /** 简洁模式（隐藏标题/代码块等） */
  simple?: boolean;
}

const stripHtml = (html: string) => html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();

const RichTextEditor = ({
  value = '',
  onChange,
  placeholder,
  minHeight = 200,
  maxHeight = 480,
  maxLength,
  readOnly,
  simple,
}: RichTextEditorProps) => {
  const ref = useRef<ReactQuill>(null);

  const modules = useMemo(() => ({
    toolbar: simple
      ? [['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], ['link'], ['clean']]
      : [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ align: [] }],
          ['link', 'blockquote', 'code-block'],
          ['clean'],
        ],
    clipboard: { matchVisual: false },
  }), [simple]);

  useEffect(() => {
    const editor = ref.current?.getEditor();
    if (!editor) return;
    const root = editor.root as HTMLElement;
    root.style.minHeight = `${minHeight}px`;
    root.style.maxHeight = `${maxHeight}px`;
    root.style.overflowY = 'auto';
  }, [minHeight, maxHeight]);

  const text = stripHtml(value || '');
  const length = text.length;
  const over = maxLength != null && length > maxLength;

  return (
    <div className={`rich-text-editor${readOnly ? ' is-readonly' : ''}`}>
      <ReactQuill
        ref={ref}
        theme="snow"
        value={value}
        onChange={(html) => onChange?.(html)}
        placeholder={placeholder}
        readOnly={readOnly}
        modules={modules}
      />
      {maxLength != null && (
        <div className={`rte-counter${over ? ' is-over' : ''}`}>
          {length} / {maxLength}
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;
export { stripHtml };
