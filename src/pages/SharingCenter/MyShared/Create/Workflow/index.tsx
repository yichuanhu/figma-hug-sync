import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Toast, Typography, Space, Upload, Divider, Select, Modal } from '@douyinfe/semi-ui';
import { IconChevronLeft, IconImage, IconVideoListStroked } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';
import {
  addAsset, makeNativeWorkflow, buildAssetId, publishNewVersion, type ShareAsset,
} from '@/pages/SharingCenter/MyShared/store';
import RichTextEditor from '@/components/RichTextEditor';
import './index.less';

const { Title, Text } = Typography;

const COVER_MAX_KB = 2 * 1024;
const VIDEO_MAX_KB = 100 * 1024;
const COVER_ACCEPT = ['image/jpeg', 'image/png'];
const VIDEO_ACCEPT = ['video/mp4'];

/** Mock：当前用户有访问权限的自动化流程列表 */
interface AccessibleProcess {
  id: string;
  name: string;
  description: string;
  departmentName: string;
  versions: { id: string; version: string }[];
  resourceDeps: string[];
}

const ACCESSIBLE_PROCESSES: AccessibleProcess[] = [
  {
    id: 'proc-001',
    name: '订单审批自动化流程',
    description: '覆盖订单校验、多级审批、归档与异常告警的端到端流程',
    departmentName: '财务部',
    versions: [
      { id: 'proc-001-v1.2.0', version: 'v1.2.0' },
      { id: 'proc-001-v1.1.0', version: 'v1.1.0' },
      { id: 'proc-001-v1.0.0', version: 'v1.0.0' },
    ],
    resourceDeps: ['队列: order-queue', '凭据: erp-credential'],
  },
  {
    id: 'proc-002',
    name: 'HR 入职流程',
    description: '新员工入职信息收集、账号开通、设备分配的端到端流程',
    departmentName: '人力资源部',
    versions: [
      { id: 'proc-002-v2.1.0', version: 'v2.1.0' },
      { id: 'proc-002-v2.0.0', version: 'v2.0.0' },
    ],
    resourceDeps: ['凭据: ad-admin'],
  },
  {
    id: 'proc-003',
    name: '财务对账自动化',
    description: '银行流水与 ERP 单据自动比对，差异自动生成对账单',
    departmentName: '财务部',
    versions: [
      { id: 'proc-003-v1.0.0', version: 'v1.0.0' },
    ],
    resourceDeps: ['队列: finance-queue', '凭据: bank-api'],
  },
  {
    id: 'proc-004',
    name: '发票 OCR 识别与录入',
    description: '增值税发票 OCR 识别后自动录入业财一体化系统',
    departmentName: '财务部',
    versions: [
      { id: 'proc-004-v1.3.1', version: 'v1.3.1' },
      { id: 'proc-004-v1.3.0', version: 'v1.3.0' },
    ],
    resourceDeps: ['凭据: ocr-api', '参数: invoice-template'],
  },
  {
    id: 'proc-005',
    name: '客户工单分派',
    description: '根据规则将 CRM 客户工单自动分派至对应客服小组',
    departmentName: '客户中心',
    versions: [
      { id: 'proc-005-v1.0.0', version: 'v1.0.0' },
    ],
    resourceDeps: ['凭据: crm-api'],
  },
];

const WorkflowCreatePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [overview, setOverview] = useState('');
  const [coverFile, setCoverFile] = useState<{ name: string; size: number; url?: string } | null>(null);
  const [videoFile, setVideoFile] = useState<{ name: string; size: number } | null>(null);
  const [processId, setProcessId] = useState<string | undefined>();
  const [versionId, setVersionId] = useState<string | undefined>();

  const selectedProcess = useMemo(
    () => ACCESSIBLE_PROCESSES.find((p) => p.id === processId),
    [processId],
  );
  const selectedVersion = useMemo(
    () => selectedProcess?.versions.find((v) => v.id === versionId),
    [selectedProcess, versionId],
  );

  const fmtSize = (kb: number) => kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(0)} KB`;

  const beforeCover = (file: File) => {
    if (!COVER_ACCEPT.includes(file.type)) { Toast.error(t('sharing.assetSupply.publish.coverTypeError')); return false; }
    if (file.size / 1024 > COVER_MAX_KB) { Toast.error(t('sharing.assetSupply.publish.coverSizeError')); return false; }
    return true;
  };
  const beforeVideo = (file: File) => {
    if (!VIDEO_ACCEPT.includes(file.type) && !file.name.toLowerCase().endsWith('.mp4')) {
      Toast.error(t('sharing.assetSupply.publish.videoTypeError')); return false;
    }
    if (file.size / 1024 > VIDEO_MAX_KB) { Toast.error(t('sharing.assetSupply.publish.videoSizeError')); return false; }
    return true;
  };

  const handleProcessChange = (val: any) => {
    setProcessId(val);
    const p = ACCESSIBLE_PROCESSES.find((x) => x.id === val);
    setVersionId(p?.versions[0]?.id);
  };

  const submit = async (values: any, publish: boolean) => {
    if (!selectedProcess) {
      Toast.warning(t('sharing.assetSupply.create.validation.processRequired'));
      return;
    }
    if (!selectedVersion) {
      Toast.warning(t('sharing.assetSupply.create.validation.versionRequired'));
      return;
    }

    if (publish) {
      const dd = (values?.displayDesc ?? '').trim();
      if (!dd || dd.length < 10) { Toast.warning(t('sharing.assetSupply.publish.displayDescRequired')); return; }
      const ov = overview.replace(/<[^>]+>/g, '').trim();
      if (ov.length < 20) { Toast.warning(t('sharing.assetSupply.publish.overviewRequired')); return; }
    }

    setSubmitting(true);
    const id = buildAssetId('wf');
    const today = new Date().toISOString().slice(0, 10);
    const asset: ShareAsset = makeNativeWorkflow(
      id,
      selectedProcess.name,
      selectedProcess.description,
      'DRAFT',
      today,
      {
        processId: selectedProcess.id,
        processVersion: selectedVersion.version,
        resourceDeps: selectedProcess.resourceDeps,
        departmentName: selectedProcess.departmentName,
      },
    );
    asset.tags = Array.isArray(values?.categoryTags) ? values.categoryTags : [];

    if (publish) {
      asset.coverImage = coverFile?.url;
      asset.displayName = (values?.displayName ?? '').trim() || undefined;
      asset.displayDesc = (values?.displayDesc ?? '').trim() || undefined;
      asset.categoryTags = Array.isArray(values?.categoryTags) ? values.categoryTags : undefined;
      asset.overview = overview || undefined;
      asset.videoUrl = videoFile?.name;
    }

    addAsset(asset);
    if (publish) publishNewVersion(id, { changeLog: '首发版本' });
    Toast.success(publish ? t('sharing.assetSupply.toast.published') : t('sharing.assetSupply.toast.saved'));
    setSubmitting(false);
    navigate('/sharing-center/my-published');
  };

  const processOptions = ACCESSIBLE_PROCESSES.map((p) => ({ value: p.id, label: p.name }));
  const versionOptions = (selectedProcess?.versions ?? []).map((v) => ({ value: v.id, label: v.version }));

  return (
    <div className="ms-create-page">
      <div className="ms-create-header">
        <Button icon={<IconChevronLeft />} theme="borderless" onClick={() => navigate(-1)} />
        <Title heading={3} style={{ margin: 0 }}>{t('sharing.assetSupply.create.workflowTitle')}</Title>
      </div>
      <div className="ms-create-body">
        <Form
          labelPosition="top"
          labelAlign="left"
          onSubmit={(v) => submit(v, true)}
          getFormApi={(api) => ((window as any).__wfShareForm = api)}
        >
          {/* —— 第 1 段：选择要共享的自动化流程 —— */}
          <Title heading={6} style={{ marginBottom: 12 }}>
            {t('sharing.assetSupply.create.sectionSelectProcess')}
          </Title>
          <Form.Slot label={{ text: t('sharing.assetSupply.create.fields.selectProcess'), required: true } as any}>
            <Select
              placeholder={t('sharing.assetSupply.create.fields.selectProcessPh')}
              filter
              optionList={processOptions}
              value={processId}
              onChange={handleProcessChange}
              style={{ width: '100%' }}
            />
          </Form.Slot>
          {selectedProcess && (
            <>
              <Form.Slot label={{ text: t('sharing.assetSupply.create.fields.selectVersion'), required: true } as any}>
                <Select
                  optionList={versionOptions}
                  value={versionId}
                  onChange={(v: any) => setVersionId(v)}
                  style={{ width: 240 }}
                />
              </Form.Slot>
              <Form.Slot label={t('sharing.assetSupply.create.fields.processInfo')}>
                <div className="process-info-card">
                  <div className="info-row">
                    <span className="info-label">{t('sharing.assetSupply.create.fields.processName')}</span>
                    <span className="info-value">{selectedProcess.name}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">{t('sharing.assetSupply.create.fields.processDesc')}</span>
                    <span className="info-value">{selectedProcess.description}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">{t('sharing.assetSupply.create.fields.processDept')}</span>
                    <span className="info-value">{selectedProcess.departmentName}</span>
                  </div>
                  {selectedProcess.resourceDeps.length > 0 && (
                    <div className="info-row">
                      <span className="info-label">{t('sharing.assetSupply.create.fields.processDeps')}</span>
                      <span className="info-value">{selectedProcess.resourceDeps.join('、')}</span>
                    </div>
                  )}
                </div>
              </Form.Slot>
            </>
          )}

          <Divider style={{ margin: '24px 0' }} />

          {/* —— 第 2 段：上架展示信息 —— */}
          <Title heading={6} style={{ marginBottom: 4 }}>{t('sharing.assetSupply.create.sectionDisplay')}</Title>
          <Text type="tertiary" size="small" style={{ display: 'block', marginBottom: 12 }}>
            {t('sharing.assetSupply.create.sectionDisplayHint')}
          </Text>

          <Form.Slot label={t('sharing.assetSupply.publish.coverImage')}>
            <Upload
              action="" accept=".jpg,.jpeg,.png" maxSize={COVER_MAX_KB} showUploadList={false}
              beforeUpload={({ file }: any) => beforeCover(file.fileInstance as File)}
              customRequest={({ file, onSuccess }: any) => {
                const f = file.fileInstance as File;
                const url = URL.createObjectURL(f);
                setCoverFile({ name: f.name, size: f.size / 1024, url });
                setTimeout(() => onSuccess?.({}), 100);
              }}
            >
              <Button icon={<IconImage />}>
                {coverFile ? t('sharing.assetSupply.publish.coverReplace') : t('sharing.assetSupply.publish.coverImage')}
              </Button>
            </Upload>
            {coverFile ? (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                {coverFile.url && <img src={coverFile.url} alt="" style={{ width: 64, height: 64, borderRadius: 6, objectFit: 'cover', border: '1px solid var(--semi-color-border)' }} />}
                <div style={{ fontSize: 12, color: 'var(--semi-color-text-1)' }}>
                  <div>{coverFile.name}</div>
                  <div style={{ color: 'var(--semi-color-text-2)' }}>{fmtSize(coverFile.size)}</div>
                </div>
                <Button size="small" theme="borderless" type="danger" onClick={() => setCoverFile(null)}>{t('common.remove')}</Button>
              </div>
            ) : (
              <div style={{ color: 'var(--semi-color-text-2)', fontSize: 12, marginTop: 4 }}>{t('sharing.assetSupply.publish.coverImageHint')}</div>
            )}
          </Form.Slot>
          <Form.Input
            field="displayName"
            label={t('sharing.assetSupply.publish.displayName')}
            placeholder={t('sharing.assetSupply.publish.displayNamePh')}
            maxLength={100}
          />
          <Form.TextArea
            field="displayDesc"
            label={t('sharing.assetSupply.publish.displayDesc')}
            placeholder={t('sharing.assetSupply.publish.displayDescPh')}
            maxLength={500} rows={3}
          />
          <Form.TagInput
            field="categoryTags"
            label={t('sharing.assetSupply.publish.categoryTags')}
            placeholder={t('sharing.assetSupply.publish.categoryTagsPh')}
          />
          <Form.Slot label={{ text: t('sharing.assetSupply.publish.overview'), required: true } as any}>
            <RichTextEditor value={overview} onChange={setOverview} placeholder={t('sharing.assetSupply.publish.overviewPh')} maxLength={5000} minHeight={240} />
          </Form.Slot>
          <Form.Slot label={t('sharing.assetSupply.publish.videoUrl')}>
            <Upload
              action="" accept=".mp4" maxSize={VIDEO_MAX_KB} showUploadList={false}
              beforeUpload={({ file }: any) => beforeVideo(file.fileInstance as File)}
              customRequest={({ file, onSuccess }: any) => {
                const f = file.fileInstance as File;
                setVideoFile({ name: f.name, size: f.size / 1024 });
                setTimeout(() => onSuccess?.({}), 100);
              }}
            >
              <Button icon={<IconVideoListStroked />}>
                {videoFile ? t('sharing.assetSupply.publish.videoReplace') : t('sharing.assetSupply.publish.videoUrl')}
              </Button>
            </Upload>
            {videoFile ? (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12, fontSize: 12 }}>
                <span style={{ color: 'var(--semi-color-text-1)' }}>{videoFile.name}</span>
                <span style={{ color: 'var(--semi-color-text-2)' }}>{fmtSize(videoFile.size)}</span>
                <Button size="small" theme="borderless" type="danger" onClick={() => setVideoFile(null)}>{t('common.remove')}</Button>
              </div>
            ) : (
              <div style={{ color: 'var(--semi-color-text-2)', fontSize: 12, marginTop: 4 }}>{t('sharing.assetSupply.publish.videoUrlHint')}</div>
            )}
          </Form.Slot>
        </Form>
      </div>
      <div className="ms-create-footer">
        <Space>
          <Button onClick={() => navigate(-1)}>{t('common.cancel')}</Button>
          <Button
            onClick={() => { const v = (window as any).__wfShareForm?.getValues(); submit(v, false); }}
            loading={submitting}
          >
            {t('sharing.assetSupply.create.saveDraft')}
          </Button>
          <Button
            theme="solid" type="primary" loading={submitting}
            onClick={() => {
              const v = (window as any).__wfShareForm?.getValues();
              Modal.confirm({
                title: t('sharing.assetSupply.create.confirmTitle'),
                content: t('sharing.assetSupply.create.confirmContent'),
                okText: t('sharing.assetSupply.create.confirmOk'),
                cancelText: t('common.cancel'),
                onOk: () => submit(v, true),
              });
            }}
          >
            {t('sharing.assetSupply.create.publish')}
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default WorkflowCreatePage;
