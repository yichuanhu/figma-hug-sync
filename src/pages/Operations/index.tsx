import EmptyState from '@/components/EmptyState';
import './index.less';

const Operations = () => {
  return (
    <div className="operations-page">
      <EmptyState
        variant="noAccess"
        description="企业版专属服务，请联系销售代表咨询购买"
        size={150}
      />
      <p className="operations-page-hint">
        运营中心是平台的"指挥中心"，为管理者提供企业级自动化资产的运营、治理和价值度量视图，确保自动化投资可管理、可衡量、可持续创造价值。
      </p>
    </div>
  );
};

export default Operations;
