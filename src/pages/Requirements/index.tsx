import EmptyState from '@/components/EmptyState';
import './index.less';

const Requirements = () => {
  return (
    <div className="requirements-page">
      <EmptyState
        variant="noAccess"
        description="企业版专属服务，请联系销售代表咨询购买"
        size={150}
      />
      <p className="requirements-page-hint">
        需求中心整合需求发现、提报、评估、跟踪等功能，为业务部门负责人、CoE负责人提供完整的需求管理流程。
      </p>
    </div>
  );
};

export default Requirements;
