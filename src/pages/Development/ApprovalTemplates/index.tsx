/**
 * 审批模板页面
 *
 * 合并「发布审批模板」与「停用审批模板」为单一菜单，
 * 通过 Tabs 切换两种业务类型，内部复用 ApprovalConfigPage。
 */
import { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabPane } from '@douyinfe/semi-ui';
import ApprovalConfigPage from '@/pages/Requirements/ApprovalConfig';

type TabKey = 'publish' | 'offline';

const ApprovalTemplatesPage = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const activeKey: TabKey = useMemo(() => {
    return pathname.includes('/offline') ? 'offline' : 'publish';
  }, [pathname]);

  const handleChange = (key: string) => {
    navigate(`/dev-center/approval-templates/${key}`);
  };

  const tabsSlot = (
    <Tabs type="line" activeKey={activeKey} onChange={handleChange}>
      <TabPane tab="发布审批" itemKey="publish" />
      <TabPane tab="停用审批" itemKey="offline" />
    </Tabs>
  );

  const isPublish = activeKey === 'publish';

  return (
    <ApprovalConfigPage
      key={activeKey}
      businessType={isPublish ? 'PROCESS_PUBLISH' : 'PROCESS_OFFLINE'}
      basePath={`/dev-center/approval-templates/${activeKey}`}
      pageTitle="审批模板"
      pageDescription="统一管理流程发布与停用审批模板，通过模板中的「适用部门」决定哪些部门的对应操作需要走审批。"
      createButtonText={isPublish ? '新建发布审批' : '新建停用审批'}
      tabsSlot={tabsSlot}
    />
  );
};

export default ApprovalTemplatesPage;
