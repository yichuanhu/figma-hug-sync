import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Button, Toast, Tooltip } from '@douyinfe/semi-ui';
import { Copy } from 'lucide-react';
import laiyeLogo from '@/assets/laiye-logo.png';
import { PLATFORM_VERSION } from '@/constants/platformVersion';
import './index.less';

interface AboutModalProps {
  visible: boolean;
  onCancel: () => void;
}

const AboutModal = ({ visible, onCancel }: AboutModalProps) => {
  const { t } = useTranslation();
  const [copying, setCopying] = useState(false);

  const handleCopy = async () => {
    if (copying) return;
    setCopying(true);
    try {
      await navigator.clipboard.writeText(PLATFORM_VERSION.version);
      Toast.success(t('about.copySuccess'));
    } catch {
      Toast.error(t('about.copyError'));
    } finally {
      setCopying(false);
    }
  };

  return (
    <Modal
      visible={visible}
      onCancel={onCancel}
      footer={null}
      width={560}
      centered
      className="about-modal"
    >
      <div className="about-modal-body">
        <img src={laiyeLogo} alt="Laiye" className="about-modal-logo" />
        <div className="about-modal-product">{t('about.productName')}</div>

        <div className="about-modal-info">
          <div className="about-modal-row">
            <span className="about-modal-label">{t('about.versionNumber')}：</span>
            <span className="about-modal-value">{PLATFORM_VERSION.version}</span>
            <Tooltip content={t('about.copy')}>
              <Button
                icon={<Copy size={14} strokeWidth={2} />}
                theme="borderless"
                type="tertiary"
                size="small"
                onClick={handleCopy}
              />
            </Tooltip>
          </div>
          <div className="about-modal-row">
            <span className="about-modal-label">{t('about.releaseDate')}：</span>
            <span className="about-modal-value">{PLATFORM_VERSION.releaseDate}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AboutModal;
