import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Form,
  Upload,
  Button,
  Toast,
  InputNumber,
  Typography,
  Tooltip,
  Input,
  Select,
} from '@douyinfe/semi-ui';
import {
  IconUpload,
  IconPlus,
  IconDelete,
  IconHelpCircle,
} from '@douyinfe/semi-icons';
import type { LYCreateVersionRequest, LYProcessResponse } from '@/api';
import './index.less';

const { Text } = Typography;

// ============= 类型定义 =============

interface ParameterDefinition {
  name: string;
  type: string;
  description?: string;
  [key: string]: unknown;
}

interface DependencyDefinition {
  name: string;
  version?: string;
  [key: string]: unknown;
}

interface UploadVersionModalProps {
  visible: boolean;
  onClose: () => void;
  processData: LYProcessResponse | null;
  onSuccess?: (version: LYCreateVersionRequest) => void;
}

// ============= 工具函数 =============

// 计算文件的 SHA-256 校验和
const calculateSHA256 = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

// 获取环境信息
const getEnvironmentInfo = () => {
  const userAgent = navigator.userAgent;
  let os = 'Unknown';
  let architecture = 'Unknown';

  // 检测操作系统
  if (userAgent.includes('Windows')) {
    os = 'Windows';
    architecture = userAgent.includes('Win64') || userAgent.includes('x64') ? 'x64' : 'x86';
  } else if (userAgent.includes('Mac')) {
    os = 'macOS';
    architecture = userAgent.includes('arm64') || userAgent.includes('ARM64') ? 'arm64' : 'x64';
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
    architecture = userAgent.includes('x86_64') ? 'x64' : 'x86';
  }

  return {
    clientVersion: '7.0.0', // 模拟客户端版本
    os,
    architecture,
  };
};

// 生成版本ID
const generateVersionId = (): string => {
  return `VER-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
};

// ============= 参数类型选项 =============

const parameterTypeOptions = [
  { value: 'string', label: '文本' },
  { value: 'number', label: '数字' },
  { value: 'boolean', label: '布尔' },
  { value: 'object', label: '对象' },
  { value: 'array', label: '数组' },
];

// ============= 组件 =============

const UploadVersionModal = ({
  visible,
  onClose,
  processData,
  onSuccess,
}: UploadVersionModalProps) => {
  const { t } = useTranslation();
  const [formApi, setFormApi] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [packageFile, setPackageFile] = useState<File | null>(null);
  const [parameters, setParameters] = useState<ParameterDefinition[]>([]);
  const [dependencies, setDependencies] = useState<DependencyDefinition[]>([]);

  // 环境信息
  const envInfo = useMemo(() => getEnvironmentInfo(), []);

  // 重置表单
  const resetForm = useCallback(() => {
    formApi?.reset();
    setPackageFile(null);
    setParameters([]);
    setDependencies([]);
  }, [formApi]);

  // 关闭模态框
  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  // 添加参数
  const handleAddParameter = useCallback(() => {
    setParameters((prev) => [...prev, { name: '', type: 'string', description: '' }]);
  }, []);

  // 移除参数
  const handleRemoveParameter = useCallback((index: number) => {
    setParameters((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // 更新参数
  const handleUpdateParameter = useCallback((index: number, field: keyof ParameterDefinition, value: string) => {
    setParameters((prev) =>
      prev.map((param, i) => (i === index ? { ...param, [field]: value } : param))
    );
  }, []);

  // 添加依赖
  const handleAddDependency = useCallback(() => {
    setDependencies((prev) => [...prev, { name: '', version: '' }]);
  }, []);

  // 移除依赖
  const handleRemoveDependency = useCallback((index: number) => {
    setDependencies((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // 更新依赖
  const handleUpdateDependency = useCallback((index: number, field: keyof DependencyDefinition, value: string) => {
    setDependencies((prev) =>
      prev.map((dep, i) => (i === index ? { ...dep, [field]: value } : dep))
    );
  }, []);

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await formApi?.validate();
      if (!values) return;

      if (!packageFile) {
        Toast.error(t('development.processDevelopment.uploadVersion.validation.packageRequired'));
        return;
      }

      setUploading(true);

      // 计算校验和
      const checksum = await calculateSHA256(packageFile);

      // 构建请求数据
      const versionData: LYCreateVersionRequest = {
        version: values.version,
        source_code: values.source_code || '',
        package_file_id: generateVersionId(),
        package_size: packageFile.size,
        package_checksum: checksum,
        version_note: values.version_note || null,
        client_version: envInfo.clientVersion,
        os: envInfo.os,
        architecture: envInfo.architecture,
        parameters: parameters.length > 0 ? parameters : null,
        dependencies: dependencies.length > 0 ? dependencies : null,
      };

      // 模拟API调用延迟
      await new Promise((resolve) => setTimeout(resolve, 1000));

      Toast.success(t('development.processDevelopment.uploadVersion.success'));
      onSuccess?.(versionData);
      handleClose();
    } catch (error) {
      console.error('Upload version error:', error);
      Toast.error(t('development.processDevelopment.uploadVersion.error'));
    } finally {
      setUploading(false);
    }
  };

  // 文件上传前的处理
  const beforeUpload = useCallback(({ file }: { file: { fileInstance?: File } }) => {
    if (file.fileInstance) {
      setPackageFile(file.fileInstance);
    }
    return false; // 阻止自动上传
  }, []);

  // 移除文件
  const handleRemoveFile = useCallback(() => {
    setPackageFile(null);
    return true;
  }, []);

  if (!processData) return null;

  return (
    <Modal
      title={t('development.processDevelopment.uploadVersion.title')}
      visible={visible}
      onCancel={handleClose}
      footer={
        <>
          <Button onClick={handleClose}>{t('common.cancel')}</Button>
          <Button theme="solid" onClick={handleSubmit} loading={uploading}>
            {t('common.confirm')}
          </Button>
        </>
      }
      width={720}
      className="upload-version-modal"
    >
      <Form getFormApi={setFormApi} labelPosition="top" className="upload-version-modal-form">
        {/* 基本信息 */}
        <div className="upload-version-modal-form-section">
          <Text className="upload-version-modal-form-section-title">
            {t('development.processDevelopment.uploadVersion.sections.basicInfo')}
          </Text>

          <Form.Input
            field="version"
            label={t('development.processDevelopment.uploadVersion.fields.version')}
            placeholder={t('development.processDevelopment.uploadVersion.fields.versionPlaceholder')}
            rules={[
              { required: true, message: t('development.processDevelopment.uploadVersion.validation.versionRequired') },
              {
                pattern: /^\d+\.\d+\.\d+$/,
                message: t('development.processDevelopment.uploadVersion.validation.versionFormat'),
              },
            ]}
          />

          <Form.TextArea
            field="source_code"
            label={t('development.processDevelopment.uploadVersion.fields.sourceCode')}
            placeholder={t('development.processDevelopment.uploadVersion.fields.sourceCodePlaceholder')}
            autosize={{ minRows: 3, maxRows: 6 }}
            rules={[
              { required: true, message: t('development.processDevelopment.uploadVersion.validation.sourceCodeRequired') },
            ]}
          />

          <Form.Slot label={t('development.processDevelopment.uploadVersion.fields.package')}>
            <Upload
              action=""
              beforeUpload={beforeUpload}
              onRemove={handleRemoveFile}
              fileList={packageFile ? [{ uid: '1', name: packageFile.name, size: String(packageFile.size), status: 'success' }] : []}
              limit={1}
              accept=".zip,.tar,.tar.gz,.tgz"
              className="upload-version-modal-upload-area"
            >
              <Button icon={<IconUpload />} theme="light">
                {t('development.processDevelopment.uploadVersion.fields.uploadPackage')}
              </Button>
            </Upload>
          </Form.Slot>

          <Form.Slot label={t('development.processDevelopment.uploadVersion.fields.timeout')}>
            <InputNumber
              defaultValue={60}
              min={1}
              max={1440}
              suffix={t('development.processDevelopment.uploadVersion.fields.timeoutUnit')}
              style={{ width: '100%' }}
              onChange={(value) => formApi?.setValue('timeout', value)}
            />
          </Form.Slot>

          <Form.TextArea
            field="version_note"
            label={t('development.processDevelopment.uploadVersion.fields.versionNote')}
            placeholder={t('development.processDevelopment.uploadVersion.fields.versionNotePlaceholder')}
            autosize={{ minRows: 2, maxRows: 4 }}
          />
        </div>

        {/* 开发环境信息 */}
        <div className="upload-version-modal-form-section">
          <Text className="upload-version-modal-form-section-title">
            {t('development.processDevelopment.uploadVersion.sections.envInfo')}
            <Tooltip content={t('development.processDevelopment.uploadVersion.sections.envInfoTooltip')}>
              <IconHelpCircle style={{ color: 'var(--semi-color-text-2)', marginLeft: 4 }} />
            </Tooltip>
          </Text>
          <div className="upload-version-modal-env-info">
            <div className="upload-version-modal-env-info-item">
              <Text className="upload-version-modal-env-info-item-label">
                {t('development.processDevelopment.uploadVersion.envInfo.clientVersion')}
              </Text>
              <Text className="upload-version-modal-env-info-item-value">{envInfo.clientVersion}</Text>
            </div>
            <div className="upload-version-modal-env-info-item">
              <Text className="upload-version-modal-env-info-item-label">
                {t('development.processDevelopment.uploadVersion.envInfo.os')}
              </Text>
              <Text className="upload-version-modal-env-info-item-value">{envInfo.os}</Text>
            </div>
            <div className="upload-version-modal-env-info-item">
              <Text className="upload-version-modal-env-info-item-label">
                {t('development.processDevelopment.uploadVersion.envInfo.architecture')}
              </Text>
              <Text className="upload-version-modal-env-info-item-value">{envInfo.architecture}</Text>
            </div>
          </div>
        </div>

        {/* 入口参数定义 */}
        <div className="upload-version-modal-form-section">
          <div className="upload-version-modal-params-header">
            <Text className="upload-version-modal-form-section-title">
              {t('development.processDevelopment.uploadVersion.sections.parameters')}
            </Text>
            <Button icon={<IconPlus />} theme="borderless" size="small" onClick={handleAddParameter}>
              {t('development.processDevelopment.uploadVersion.actions.addParameter')}
            </Button>
          </div>
          {parameters.length > 0 ? (
            <div className="upload-version-modal-params-list">
              {parameters.map((param, index) => (
                <div key={index} className="upload-version-modal-params-item">
                  <div className="upload-version-modal-params-item-fields">
                    <Input
                      placeholder={t('development.processDevelopment.uploadVersion.fields.paramName')}
                      value={param.name}
                      onChange={(value) => handleUpdateParameter(index, 'name', value)}
                    />
                    <Select
                      placeholder={t('development.processDevelopment.uploadVersion.fields.paramType')}
                      optionList={parameterTypeOptions}
                      value={param.type}
                      onChange={(value) => handleUpdateParameter(index, 'type', value as string)}
                    />
                    <Input
                      placeholder={t('development.processDevelopment.uploadVersion.fields.paramDescription')}
                      value={param.description || ''}
                      onChange={(value) => handleUpdateParameter(index, 'description', value)}
                    />
                  </div>
                  <Button
                    icon={<IconDelete />}
                    theme="borderless"
                    type="danger"
                    size="small"
                    className="upload-version-modal-params-item-remove"
                    onClick={() => handleRemoveParameter(index)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="upload-version-modal-params-empty">
              <Text type="tertiary">{t('development.processDevelopment.uploadVersion.empty.noParameters')}</Text>
            </div>
          )}
        </div>

        {/* 依赖资源定义 */}
        <div className="upload-version-modal-form-section">
          <div className="upload-version-modal-dependencies-header">
            <Text className="upload-version-modal-form-section-title">
              {t('development.processDevelopment.uploadVersion.sections.dependencies')}
            </Text>
            <Button icon={<IconPlus />} theme="borderless" size="small" onClick={handleAddDependency}>
              {t('development.processDevelopment.uploadVersion.actions.addDependency')}
            </Button>
          </div>
          {dependencies.length > 0 ? (
            <div className="upload-version-modal-dependencies-list">
              {dependencies.map((dep, index) => (
                <div key={index} className="upload-version-modal-dependencies-item">
                  <div className="upload-version-modal-dependencies-item-fields">
                    <Input
                      placeholder={t('development.processDevelopment.uploadVersion.fields.depName')}
                      value={dep.name}
                      onChange={(value) => handleUpdateDependency(index, 'name', value)}
                    />
                    <Input
                      placeholder={t('development.processDevelopment.uploadVersion.fields.depVersion')}
                      value={dep.version || ''}
                      onChange={(value) => handleUpdateDependency(index, 'version', value)}
                    />
                  </div>
                  <Button
                    icon={<IconDelete />}
                    theme="borderless"
                    type="danger"
                    size="small"
                    className="upload-version-modal-dependencies-item-remove"
                    onClick={() => handleRemoveDependency(index)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="upload-version-modal-dependencies-empty">
              <Text type="tertiary">{t('development.processDevelopment.uploadVersion.empty.noDependencies')}</Text>
            </div>
          )}
        </div>
      </Form>
    </Modal>
  );
};

export default UploadVersionModal;
