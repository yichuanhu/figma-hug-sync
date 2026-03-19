import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Typography,
  Tag,
  Button,
  Table,
  Toast,
} from '@douyinfe/semi-ui';
import { IconPlus, IconDelete } from '@douyinfe/semi-icons';
import type { LYClassificationAssignment } from '@/api';
import EmptyState from '@/components/EmptyState';
import ClassificationSelector from '../ClassificationSelector';

import './index.less';

const { Title, Text } = Typography;

interface ClassificationPanelProps {
  requirementId: string;
  classifications: LYClassificationAssignment[];
  onDataChange?: () => void;
}

// Available classification categories with options
const classificationCatalog: Record<string, string[]> = {
  'Industry': ['Manufacturing', 'Finance', 'Healthcare', 'Retail', 'Logistics', 'Telecommunications', 'Education'],
  'Process Type': ['Data Entry', 'Report Generation', 'Invoice Processing', 'Order Management', 'Customer Service', 'HR Onboarding', 'Compliance Check'],
  'Technology': ['RPA', 'AI/ML', 'OCR', 'NLP', 'API Integration', 'Database', 'Web Scraping'],
  'Business Function': ['Finance & Accounting', 'Human Resources', 'Supply Chain', 'Sales & Marketing', 'IT Operations', 'Legal & Compliance'],
};

const ClassificationPanel: React.FC<ClassificationPanelProps> = ({
  requirementId,
  classifications: initialClassifications,
  onDataChange,
}) => {
  const { t } = useTranslation();
  const [classifications, setClassifications] = useState<LYClassificationAssignment[]>(initialClassifications);
  const [selectorVisible, setSelectorVisible] = useState(false);

  const handleAdd = (key: string, value: string) => {
    const exists = classifications.some(c => c.classification_key === key && c.classification_value === value);
    if (exists) {
      Toast.warning(t('requirement.classification.alreadyExists'));
      return;
    }
    const newItem: LYClassificationAssignment = {
      classification_key: key,
      classification_value: value,
      assigned_at: new Date().toISOString(),
    };
    setClassifications(prev => [...prev, newItem]);
    Toast.success(t('requirement.classification.addSuccess'));
    onDataChange?.();
  };

  const handleRemove = (key: string, value: string) => {
    setClassifications(prev => prev.filter(c => !(c.classification_key === key && c.classification_value === value)));
    Toast.success(t('requirement.classification.removeSuccess'));
    onDataChange?.();
  };

  // Group by key
  const grouped = useMemo(() => {
    const map: Record<string, LYClassificationAssignment[]> = {};
    classifications.forEach(c => {
      if (!map[c.classification_key]) map[c.classification_key] = [];
      map[c.classification_key].push(c);
    });
    return map;
  }, [classifications]);

  const columns = [
    {
      title: t('requirement.classification.category'),
      dataIndex: 'classification_key',
      width: 150,
    },
    {
      title: t('requirement.classification.value'),
      dataIndex: 'classification_value',
      render: (_: string, record: LYClassificationAssignment) => (
        <Tag color="blue">{record.classification_value}</Tag>
      ),
    },
    {
      title: t('requirement.classification.assignedAt'),
      dataIndex: 'assigned_at',
      width: 160,
      render: (time: string) => new Date(time).toLocaleString('zh-CN'),
    },
    {
      title: t('common.actions'),
      width: 60,
      render: (_: unknown, record: LYClassificationAssignment) => (
        <Button
          icon={<IconDelete />}
          type="danger"
          theme="borderless"
          size="small"
          onClick={() => handleRemove(record.classification_key, record.classification_value)}
        />
      ),
    },
  ];

  return (
    <div className="classification-panel">
      {/* Summary by category */}
      {Object.keys(grouped).length > 0 && (
        <div className="classification-panel-summary">
          {Object.entries(grouped).map(([key, items]) => (
            <div key={key} className="classification-panel-group">
              <Text size="small" type="tertiary" className="classification-panel-group-label">
                {key}
              </Text>
              <div className="classification-panel-group-tags">
                {items.map((item, i) => (
                  <Tag
                    key={i}
                    color="blue"
                    closable
                    onClose={() => handleRemove(item.classification_key, item.classification_value)}
                  >
                    {item.classification_value}
                  </Tag>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="classification-panel-section">
        <div className="classification-panel-section-header">
          <Title heading={6} className="classification-panel-section-title">
            <span className="classification-panel-section-indicator" />
            {t('requirement.classification.allClassifications')}
          </Title>
          <Button
            icon={<IconPlus />}
            theme="light"
            size="small"
            onClick={() => setSelectorVisible(true)}
          >
            {t('requirement.classification.addClassification')}
          </Button>
        </div>

        {classifications.length > 0 ? (
          <Table
            columns={columns}
            dataSource={classifications}
            pagination={false}
            size="small"
            rowKey={(record) => `${record.classification_key}-${record.classification_value}`}
          />
        ) : (
          <EmptyState
            variant="noData"
            description={t('requirement.classification.noClassificationDesc')}
          />
        )}
      </div>

      {/* Selector Modal */}
      <ClassificationSelector
        visible={selectorVisible}
        catalog={classificationCatalog}
        existingClassifications={classifications}
        onSelect={handleAdd}
        onClose={() => setSelectorVisible(false)}
      />
    </div>
  );
};

export default ClassificationPanel;
