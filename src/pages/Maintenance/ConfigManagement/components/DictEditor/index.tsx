import { Input, Button } from '@douyinfe/semi-ui';
import { Plus, Trash2 } from 'lucide-react';

interface DictEditorProps {
  value: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
}

const DictEditor = ({ value, onChange }: DictEditorProps) => {
  const entries = Object.entries(value || {});

  const updateKey = (oldKey: string, newKey: string) => {
    if (!newKey || newKey === oldKey) return;
    const next: Record<string, string> = {};
    entries.forEach(([k, v]) => {
      next[k === oldKey ? newKey : k] = v;
    });
    onChange(next);
  };

  const updateValue = (key: string, val: string) => {
    onChange({ ...value, [key]: val });
  };

  const removeKey = (key: string) => {
    const next = { ...value };
    delete next[key];
    onChange(next);
  };

  const addRow = () => {
    let i = 1;
    let key = 'new_key';
    while (key in value) {
      key = `new_key_${i++}`;
    }
    onChange({ ...value, [key]: '' });
  };

  return (
    <div className="dict-editor">
      {entries.map(([k, v]) => (
        <div className="dict-editor__row" key={k}>
          <Input value={k} onBlur={(e) => updateKey(k, (e.target as HTMLInputElement).value)} style={{ width: 200 }} />
          <Input value={v} onChange={(val) => updateValue(k, val)} style={{ flex: 1 }} />
          <Button icon={<Trash2 size={14} strokeWidth={2} />} type="tertiary" theme="borderless" onClick={() => removeKey(k)} />
        </div>
      ))}
      <Button icon={<Plus size={14} strokeWidth={2} />} theme="light" type="tertiary" onClick={addRow} style={{ alignSelf: 'flex-start' }}>
        添加
      </Button>
    </div>
  );
};

export default DictEditor;
