import enterpriseImg from '@/assets/empty-state/enterprise-exclusive.png';
import '@/pages/Requirements/index.less';

const Operations = () => {
  return (
    <div className="enterprise-exclusive-page">
      <img src={enterpriseImg} alt="企业版专属" className="enterprise-exclusive-img" />
      <p className="enterprise-exclusive-title">企业版专属服务，请联系销售代表咨询购买</p>
      <p className="enterprise-exclusive-hint">
        运营中心是平台的"指挥中心"，为管理者提供企业级自动化资产的运营、治理和价值度量视图，确保自动化投资可管理、可衡量、可持续创造价值。
      </p>
    </div>
  );
};

export default Operations;
