import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { shortcuts } from '../../mockData';
import './index.less';

const ProcessIcon = () => (
  <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#filter0_i_process)">
      <path d="M18.2002 4.17761L8.0661 6.76504C4.38973 7.70355 3.02671 9.30089 3.81491 12.815L7.16179 24.717C7.96615 28.2888 10.3702 29.7471 14.046 28.8086L24.6801 26.2212C28.4152 25.2675 29.6812 22.7317 28.8769 19.1599L25.53 7.25795C24.7418 3.74384 21.9353 2.22396 18.2002 4.17761Z" fill="url(#paint0_process)"/>
    </g>
    <foreignObject x="6" y="5.25" width="37.5" height="37.5">
      <div style={{backdropFilter:'blur(1px)',WebkitBackdropFilter:'blur(1px)',clipPath:'url(#bgblur_process_clip)',height:'100%',width:'100%',backgroundColor:'rgba(255,255,255,0.16)',border:'1px solid rgba(255,255,255,0.28)',boxShadow:'inset 0 1px 0 rgba(255,255,255,0.36)'}}></div>
    </foreignObject>
    <g filter="url(#filter1_i_process)">
      <path d="M30.6872 11.25H18.8142C14.5075 11.25 12 13.5195 12 17.4083V30.579C12 34.5315 14.5075 36.75 18.8142 36.75H30.6872C35.0633 36.75 37.5 34.5315 37.5 30.579V17.4083C37.5 13.5195 35.0633 11.25 30.6872 11.25Z" fill="#9DAAFA" fillOpacity="0.45"/>
    </g>
    <path d="M22.5 25.5C22.5 26.7426 23.5074 27.75 24.75 27.75H27.75V27C27.75 26.1716 28.4216 25.5 29.25 25.5H32.25C33.0784 25.5 33.75 26.1716 33.75 27V30C33.75 30.8284 33.0784 31.5 32.25 31.5H29.25C28.4216 31.5 27.75 30.8284 27.75 30V29.25H24.75C22.6789 29.25 21 27.5711 21 25.5V22.5H20.25C19.4216 22.5 18.75 21.8284 18.75 21V18C18.75 17.1716 19.4216 16.5 20.25 16.5H23.25C24.0784 16.5 24.75 17.1716 24.75 18V21C24.75 21.8284 24.0784 22.5 23.25 22.5H22.5V25.5Z" fill="url(#paint1_process)"/>
    <defs>
      <filter id="filter0_i_process" x="3.52462" y="3.89831" width="25.7049" height="26.9381" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix"/>
        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
        <feOffset dy="1"/>
        <feGaussianBlur stdDeviation="0.5"/>
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
        <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0"/>
        <feBlend mode="normal" in2="shape" result="effect1_innerShadow"/>
      </filter>
      <filter id="filter1_i_process" x="6" y="5.25" width="37.5" height="37.5" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix"/>
        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
        <feOffset dy="3.66667"/>
        <feGaussianBlur stdDeviation="1.83333"/>
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
        <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0"/>
        <feBlend mode="normal" in2="shape" result="effect1_innerShadow"/>
      </filter>
      <clipPath id="bgblur_process_clip" transform="translate(-6 -5.25)">
        <path d="M30.6872 11.25H18.8142C14.5075 11.25 12 13.5195 12 17.4083V30.579C12 34.5315 14.5075 36.75 18.8142 36.75H30.6872C35.0633 36.75 37.5 34.5315 37.5 30.579V17.4083C37.5 13.5195 35.0633 11.25 30.6872 11.25Z"/>
      </clipPath>
      <linearGradient id="paint0_process" x1="13.1326" y1="5.47147" x2="19.0525" y2="28.6579" gradientUnits="userSpaceOnUse">
        <stop stopColor="#91A4FA"/>
        <stop offset="1" stopColor="#2A32CF"/>
      </linearGradient>
      <linearGradient id="paint1_process" x1="26.25" y1="19.5" x2="28.5" y2="32.625" gradientUnits="userSpaceOnUse">
        <stop stopColor="white"/>
        <stop offset="1" stopColor="white" stopOpacity="0.3"/>
      </linearGradient>
    </defs>
  </svg>
);

const RobotIcon = () => (
  <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#filter0_i_robot)">
      <rect x="15.75" y="5.25" width="23.25" height="23.25" rx="6" fill="url(#paint0_robot)"/>
    </g>
    <foreignObject x="-2.25" y="0.75" width="37.5" height="42">
      <div style={{backdropFilter:'blur(1px)',WebkitBackdropFilter:'blur(1px)',clipPath:'url(#bgblur_robot_clip)',height:'100%',width:'100%',backgroundColor:'rgba(255,255,255,0.16)',border:'1px solid rgba(255,255,255,0.28)',boxShadow:'inset 0 1px 0 rgba(255,255,255,0.36)'}}></div>
    </foreignObject>
    <g filter="url(#filter1_i_robot)">
      <path d="M16.5 6.75C17.7426 6.75 18.75 7.75736 18.75 9C18.75 9.97926 18.1226 10.8098 17.25 11.1189V14.25H23.25C26.5637 14.25 29.25 16.9363 29.25 20.25V30.75C29.25 34.0637 26.5637 36.75 23.25 36.75H9.75C6.43629 36.75 3.75 34.0637 3.75 30.75V20.25C3.75 16.9363 6.43629 14.25 9.75 14.25H15.75V11.1189C14.8774 10.8098 14.25 9.97926 14.25 9C14.25 7.75736 15.2574 6.75 16.5 6.75Z" fill="#EC82A5" fillOpacity="0.45"/>
    </g>
    <path d="M21.75 30C21.75 30.4142 21.4142 30.75 21 30.75H11.25C10.8358 30.75 10.5 30.4142 10.5 30C10.5 29.5858 10.8358 29.25 11.25 29.25H21C21.4142 29.25 21.75 29.5858 21.75 30ZM12 22.5C13.2426 22.5 14.25 23.5074 14.25 24.75C14.25 25.9926 13.2426 27 12 27C10.7574 27 9.75 25.9926 9.75 24.75C9.75 23.5074 10.7574 22.5 12 22.5ZM21 22.5C22.2426 22.5 23.25 23.5074 23.25 24.75C23.25 25.9926 22.2426 27 21 27C19.7574 27 18.75 25.9926 18.75 24.75C18.75 23.5074 19.7574 22.5 21 22.5Z" fill="url(#paint1_robot)"/>
    <defs>
      <filter id="filter0_i_robot" x="15.75" y="5.25" width="23.25" height="24" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix"/>
        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
        <feOffset dy="1"/>
        <feGaussianBlur stdDeviation="0.5"/>
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
        <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0"/>
        <feBlend mode="normal" in2="shape" result="effect1_innerShadow"/>
      </filter>
      <filter id="filter1_i_robot" x="-2.25" y="0.75" width="37.5" height="42" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix"/>
        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
        <feOffset dy="3.66667"/>
        <feGaussianBlur stdDeviation="1.83333"/>
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
        <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0"/>
        <feBlend mode="normal" in2="shape" result="effect1_innerShadow"/>
      </filter>
      <clipPath id="bgblur_robot_clip" transform="translate(2.25 -0.75)">
        <path d="M16.5 6.75C17.2426 6.75 18.75 7.75736 18.75 9C18.75 9.97926 18.1226 10.8098 17.25 11.1189V14.25H23.25C26.5637 14.25 29.25 16.9363 29.25 20.25V30.75C29.25 34.0637 26.5637 36.75 23.25 36.75H9.75C6.43629 36.75 3.75 34.0637 3.75 30.75V20.25C3.75 16.9363 6.43629 14.25 9.75 14.25H15.75V11.1189C14.8774 10.8098 14.25 9.97926 14.25 9C14.25 7.75736 15.2574 6.75 16.5 6.75Z"/>
      </clipPath>
      <linearGradient id="paint0_robot" x1="27.375" y1="5.25" x2="27.375" y2="28.5" gradientUnits="userSpaceOnUse">
        <stop stopColor="#EE93B1"/>
        <stop offset="1" stopColor="#CF225B"/>
      </linearGradient>
      <linearGradient id="paint1_robot" x1="16.5" y1="22.5" x2="16.5" y2="30.75" gradientUnits="userSpaceOnUse">
        <stop stopColor="white"/>
        <stop offset="1" stopColor="white" stopOpacity="0.3"/>
      </linearGradient>
    </defs>
  </svg>
);

const TaskIcon = () => (
  <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#filter0_i_task)">
      <rect x="12.75" y="3.75" width="24" height="24" rx="6" fill="url(#paint0_task)" fillOpacity="0.8"/>
    </g>
    <foreignObject x="-1.5" y="3.75" width="38.25" height="39.2234">
      <div style={{backdropFilter:'blur(4px)',WebkitBackdropFilter:'blur(4px)',clipPath:'url(#bgblur_task_clip)',height:'100%',width:'100%',backgroundColor:'rgba(255,255,255,0.16)',border:'1px solid rgba(255,255,255,0.28)',boxShadow:'inset 0 1px 0 rgba(255,255,255,0.36)'}}></div>
    </foreignObject>
    <g filter="url(#filter1_i_task)">
      <path d="M4.5 19.35C4.5 15.9897 4.5 14.3095 5.15396 13.0261C5.7292 11.8971 6.64709 10.9792 7.77611 10.4039C9.05954 9.75 10.7397 9.75 14.1 9.75H21.15C24.5103 9.75 26.1905 9.75 27.4739 10.4039C28.6029 10.9792 29.5208 11.8971 30.0961 13.0261C30.75 14.3095 30.75 15.9897 30.75 19.35V28.0775C30.75 31.9414 30.75 33.8735 29.9362 35.0357C29.2256 36.0505 28.1281 36.7276 26.9023 36.9071C25.4985 37.1128 23.7719 36.2458 20.3189 34.5117L19.8419 34.2722C19.0565 33.8778 18.6638 33.6806 18.2516 33.6024C17.8866 33.5331 17.5119 33.5323 17.1465 33.5998C16.734 33.6762 16.3405 33.8716 15.5533 34.2624L14.9017 34.5859C11.4561 36.2965 9.7333 37.1518 8.33348 36.9421C7.11108 36.7591 6.01781 36.0813 5.31026 35.0678C4.5 33.9073 4.5 31.9838 4.5 28.1369V19.35Z" fill="#F5AC7B" fillOpacity="0.42"/>
    </g>
    <path d="M17.25 17.25C17.9243 17.25 18.4709 17.7967 18.4709 18.4709V21.2791H21.2791C21.9533 21.2791 22.4999 21.8257 22.5 22.5C22.5 23.1743 21.9533 23.7209 21.2791 23.7209H18.4709V26.5291C18.4709 27.2033 17.9243 27.75 17.25 27.75C16.5757 27.75 16.0291 27.2033 16.0291 26.5291V23.7209H13.2209C12.5467 23.7209 12 23.1743 12 22.5C12.0001 21.8257 12.5467 21.2791 13.2209 21.2791H16.0291V18.4709C16.0291 17.7967 16.5757 17.25 17.25 17.25Z" fill="url(#paint1_task)"/>
    <defs>
      <filter id="filter0_i_task" x="12.75" y="3.75" width="24" height="24.75" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix"/>
        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
        <feOffset dy="1"/>
        <feGaussianBlur stdDeviation="0.5"/>
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
        <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0"/>
        <feBlend mode="normal" in2="shape" result="effect1_innerShadow"/>
      </filter>
      <filter id="filter1_i_task" x="-1.5" y="3.75" width="38.25" height="39.2234" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix"/>
        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
        <feOffset dy="3.66667"/>
        <feGaussianBlur stdDeviation="1.83333"/>
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
        <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0"/>
        <feBlend mode="normal" in2="shape" result="effect1_innerShadow"/>
      </filter>
      <clipPath id="bgblur_task_clip" transform="translate(1.5 -3.75)">
        <path d="M4.5 19.35C4.5 15.9897 4.5 14.3095 5.15396 13.0261C5.7292 11.8971 6.64709 10.9792 7.77611 10.4039C9.05954 9.75 10.7397 9.75 14.1 9.75H21.15C24.5103 9.75 26.1905 9.75 27.4739 10.4039C28.6029 10.9792 29.5208 11.8971 30.0961 13.0261C30.75 14.3095 30.75 15.9897 30.75 19.35V28.0775C30.75 31.9414 30.75 33.8735 29.9362 35.0357C29.2256 36.0505 28.1281 36.7276 26.9023 36.9071C25.4985 37.1128 23.7719 36.2458 20.3189 34.5117L19.8419 34.2722C19.0565 33.8778 18.6638 33.6806 18.2516 33.6024C17.8866 33.5331 17.5119 33.5323 17.1465 33.5998C16.734 33.6762 16.3405 33.8716 15.5533 34.2624L14.9017 34.5859C11.4561 36.2965 9.7333 37.1518 8.33348 36.9421C7.11108 36.7591 6.01781 36.0813 5.31026 35.0678C4.5 33.9073 4.5 31.9838 4.5 28.1369V19.35Z"/>
      </clipPath>
      <linearGradient id="paint0_task" x1="35.1185" y1="5.22097" x2="27.666" y2="30.178" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F7AC6E"/>
        <stop offset="1" stopColor="#EE5316"/>
      </linearGradient>
      <linearGradient id="paint1_task" x1="16.125" y1="16.875" x2="16.875" y2="28.5" gradientUnits="userSpaceOnUse">
        <stop stopColor="white"/>
        <stop offset="1" stopColor="white" stopOpacity="0.3"/>
      </linearGradient>
    </defs>
  </svg>
);

const iconMap: Record<string, React.FC> = {
  Workflow: ProcessIcon,
  Bot: RobotIcon,
  Play: TaskIcon,
};

const ShortcutsSection = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="home-card shortcuts-section">
      <div className="home-card-header">
        <span className="home-card-title">{t('homepage.shortcuts.title')}</span>
      </div>
      <div className="shortcuts-grid">
        {shortcuts.map((item) => {
          const IconComp = iconMap[item.icon];
          return (
            <div
              key={item.key}
              className="shortcut-card"
              style={{ backgroundColor: item.bgColor, borderColor: item.borderColor || item.bgColor }}
              onClick={() => item.path && navigate(item.path, { state: { openCreate: true } })}
            >
              <div className="shortcut-card-info">
                <div className="shortcut-card-title">{t(item.titleKey)}</div>
                <div className="shortcut-card-desc">{t(item.descKey)}</div>
              </div>
              <div className="shortcut-card-icon">
                {IconComp && <IconComp />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ShortcutsSection;
