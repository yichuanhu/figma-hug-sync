import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Form, Button, Toast, Typography, Row, Col } from '@douyinfe/semi-ui';
import SchemeFieldRenderer from '@/pages/Requirements/RequirementsWorkbench/components/SchemeFieldRenderer';
import type { RequirementScheme, SchemeField } from '@/pages/Requirements/RequirementsWorkbench/types';

const { Text } = Typography;

interface Props {
  visible: boolean;
  scheme: RequirementScheme;
  onClose: () => void;
}

const widthCol = (w?: SchemeField['ui_width']) => {
  switch (w) {
    case 'small': return 6;
    case 'medium': return 12;
    case 'large': return 18;
    default: return 24;
  }
};

const TestDriveModal = ({ visible, scheme, onClose }: Props) => {
  const { t } = useTranslation();
  const [resetKey, setResetKey] = useState(0);

  const handleSubmit = (values: Record<string, unknown>) => {
    Toast.success(t('requirements.scheme.builder.testDriveSubmitted'));
    console.info('[TestDrive] submitted values:', values);
  };

  return (
    <Modal
      title={t('requirements.scheme.builder.testDriveTitle')}
      visible={visible}
      onCancel={onClose}
      footer={null}
      fullScreen
      className="test-drive-modal"
    >
      <div className="test-drive-hint">
        {t('requirements.scheme.builder.testDriveHint')}
      </div>

      <div style={{ background: 'var(--semi-color-fill-0)', padding: 16, borderRadius: 6, marginBottom: 16 }}>
        <Text type="tertiary" size="small">系统字段</Text>
        <div style={{ marginTop: 6 }}>
          <Text>编号：REQ-2026-XXXX (自动生成)</Text>
        </div>
      </div>

      <Form key={resetKey} onSubmit={handleSubmit} labelPosition="top">
        <Row gutter={16}>
          {scheme.custom_fields.map((f) => (
            <Col span={widthCol(f.ui_width)} key={f.key}>
              <SchemeFieldRenderer field={f} costConfig={scheme.cost_config} />
            </Col>
          ))}
        </Row>
        <div style={{ marginTop: 24, display: 'flex', gap: 8 }}>
          <Button onClick={() => setResetKey(resetKey + 1)}>清空表单</Button>
          <Button theme="solid" type="primary" htmlType="submit">模拟提交</Button>
          <Button onClick={onClose} style={{ marginLeft: 'auto' }}>退出</Button>
        </div>
      </Form>
    </Modal>
  );
};

export default TestDriveModal;
