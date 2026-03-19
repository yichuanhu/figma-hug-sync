import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Select,
  Tag,
  Typography,
  Space,
  Empty,
} from '@douyinfe/semi-ui';
import type { LYClassificationAssignment } from '@/api';

import './index.less';

const { Text } = Typography;

interface ClassificationSelectorProps {
  visible: boolean;
  catalog: Record<string, string[]>;
  existingClassifications: LYClassificationAssignment[];
  onSelect: (key: string, value: string) => void;
  onClose: () => void;
}

const ClassificationSelector: React.FC<ClassificationSelectorProps> = ({
  visible,
  catalog,
  existingClassifications,
  onSelect,
  onClose,
}) => {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedValue, setSelectedValue] = useState<string>('');

  const categoryOptions = Object.keys(catalog).map(key => ({
    label: key,
    value: key,
  }));

  const valueOptions = selectedCategory
    ? catalog[selectedCategory]
        .filter(v => !existingClassifications.some(c => c.classification_key === selectedCategory && c.classification_value === v))
        .map(v => ({ label: v, value: v }))
    : [];

  const handleOk = () => {
    if (selectedCategory && selectedValue) {
      onSelect(selectedCategory, selectedValue);
      setSelectedValue('');
    }
  };

  const handleClose = () => {
    setSelectedCategory('');
    setSelectedValue('');
    onClose();
  };

  return (
    <Modal
      title={t('requirement.classification.addClassification')}
      visible={visible}
      onOk={handleOk}
      onCancel={handleClose}
      okButtonProps={{ disabled: !selectedCategory || !selectedValue }}
      width={520}
      closeOnEsc
      className="classification-selector-modal"
    >
      <div className="classification-selector">
        <div className="classification-selector-field">
          <Text size="small" className="classification-selector-label">
            {t('requirement.classification.category')}
          </Text>
          <Select
            value={selectedCategory}
            onChange={(val) => {
              setSelectedCategory(val as string);
              setSelectedValue('');
            }}
            optionList={categoryOptions}
            placeholder={t('requirement.classification.selectCategory')}
            style={{ width: '100%' }}
          />
        </div>
        <div className="classification-selector-field">
          <Text size="small" className="classification-selector-label">
            {t('requirement.classification.value')}
          </Text>
          <Select
            value={selectedValue}
            onChange={(val) => setSelectedValue(val as string)}
            optionList={valueOptions}
            placeholder={t('requirement.classification.selectValue')}
            style={{ width: '100%' }}
            disabled={!selectedCategory}
          />
        </div>

        {selectedCategory && valueOptions.length === 0 && (
          <Text size="small" type="tertiary" style={{ marginTop: 8 }}>
            {t('requirement.classification.allAssigned')}
          </Text>
        )}
      </div>
    </Modal>
  );
};

export default ClassificationSelector;
