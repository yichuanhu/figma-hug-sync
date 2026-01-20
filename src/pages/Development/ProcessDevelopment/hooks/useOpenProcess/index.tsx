import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Button, Checkbox, Toast } from '@douyinfe/semi-ui';
import './index.less';

interface ProcessInfo {
  id: string;
  name: string;
}

export const useOpenProcess = () => {
  const { t } = useTranslation();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [dontRemindAgain, setDontRemindAgain] = useState(false);
  const [currentProcess, setCurrentProcess] = useState<ProcessInfo | null>(null);

  const triggerClientOpen = (processId: string) => {
    const clientProtocol = `laiye-client://open-process?id=${processId}`;
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = clientProtocol;
    document.body.appendChild(iframe);
    
    const timeout = setTimeout(() => {
      document.body.removeChild(iframe);
      Toast.error({ content: t('openProcess.clientError'), duration: 3 });
    }, 2000);
    
    const handleBlur = () => {
      clearTimeout(timeout);
      document.body.removeChild(iframe);
      window.removeEventListener('blur', handleBlur);
    };
    window.addEventListener('blur', handleBlur);
  };

  const openProcess = (process: ProcessInfo) => {
    const skipConfirm = localStorage.getItem('skipOpenProcessConfirm') === 'true';
    if (skipConfirm) {
      triggerClientOpen(process.id);
    } else {
      setCurrentProcess(process);
      setConfirmVisible(true);
    }
  };

  const handleConfirmOpen = () => {
    if (dontRemindAgain) {
      localStorage.setItem('skipOpenProcessConfirm', 'true');
    }
    setConfirmVisible(false);
    setDontRemindAgain(false);
    if (currentProcess) {
      triggerClientOpen(currentProcess.id);
    }
  };

  const handleCancel = () => {
    setConfirmVisible(false);
    setDontRemindAgain(false);
  };

  const OpenProcessModal = () => (
    <Modal
      title={t('openProcess.title')}
      visible={confirmVisible}
      onCancel={handleCancel}
      width={400}
      motion={false}
      footer={
        <div className="open-process-modal-footer">
          <Checkbox checked={dontRemindAgain} onChange={(e) => setDontRemindAgain(e.target.checked)}>
            {t('openProcess.dontRemindAgain')}
          </Checkbox>
          <div className="open-process-modal-buttons">
            <Button onClick={handleCancel}>{t('common.cancel')}</Button>
            <Button theme="solid" onClick={handleConfirmOpen}>{t('common.confirm')}</Button>
          </div>
        </div>
      }
    >
      <p>{t('openProcess.confirmMessage', { name: currentProcess?.name })}</p>
    </Modal>
  );

  return { openProcess, OpenProcessModal };
};
