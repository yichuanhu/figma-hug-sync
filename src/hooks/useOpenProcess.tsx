import { useState } from 'react';
import { Modal, Button, Checkbox, Toast } from '@douyinfe/semi-ui';

interface ProcessInfo {
  id: string;
  name: string;
}

export const useOpenProcess = () => {
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [dontRemindAgain, setDontRemindAgain] = useState(false);
  const [currentProcess, setCurrentProcess] = useState<ProcessInfo | null>(null);

  const triggerClientOpen = (processId: string) => {
    // 模拟客户端协议唤起
    const clientProtocol = `laiye-client://open-process?id=${processId}`;
    
    // 创建隐藏的 iframe 尝试唤起客户端
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = clientProtocol;
    document.body.appendChild(iframe);
    
    // 设置超时检测，如果无法唤起则提示用户
    const timeout = setTimeout(() => {
      document.body.removeChild(iframe);
      Toast.error({
        content: '无法唤起客户端，请确认已安装客户端程序',
        duration: 3
      });
    }, 2000);
    
    // 监听页面失焦（说明客户端被成功唤起）
    const handleBlur = () => {
      clearTimeout(timeout);
      document.body.removeChild(iframe);
      window.removeEventListener('blur', handleBlur);
    };
    
    window.addEventListener('blur', handleBlur);
  };

  const openProcess = (process: ProcessInfo) => {
    // 检查是否设置了不再提醒
    const skipConfirm = localStorage.getItem('skipOpenProcessConfirm') === 'true';
    if (skipConfirm) {
      triggerClientOpen(process.id);
    } else {
      setCurrentProcess(process);
      setConfirmVisible(true);
    }
  };

  const handleConfirmOpen = () => {
    // 保存用户的不再提醒设置
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
      title="打开流程"
      visible={confirmVisible}
      onCancel={handleCancel}
      width={400}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Checkbox 
            checked={dontRemindAgain} 
            onChange={(e) => setDontRemindAgain(e.target.checked)}
          >
            以后不再提醒
          </Checkbox>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button onClick={handleCancel}>取消</Button>
            <Button theme="solid" onClick={handleConfirmOpen}>确定</Button>
          </div>
        </div>
      }
    >
      <p>即将唤起客户端在本地打开流程「{currentProcess?.name}」，是否继续？</p>
    </Modal>
  );

  return {
    openProcess,
    OpenProcessModal
  };
};
