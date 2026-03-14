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
      <div style={{backdropFilter:'blur(4px)',WebkitBackdropFilter:'blur(4px)',clipPath:'url(#bgblur_process_clip)',height:'100%',width:'100%',backgroundColor:'rgba(255,255,255,0.16)',border:'1px solid rgba(255,255,255,0.28)',boxShadow:'inset 0 1px 0 rgba(255,255,255,0.36)'}}></div>
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
  <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#filter0_i_robot)">
      <rect x="21" y="7" width="31" height="31" rx="8" fill="url(#paint0_robot)"/>
    </g>
    <foreignObject x="-3" y="1" width="50" height="56">
      <div style={{backdropFilter:'blur(4px)',WebkitBackdropFilter:'blur(4px)',clipPath:'url(#bgblur_robot_clip)',height:'100%',width:'100%',backgroundColor:'rgba(255,255,255,0.16)',border:'1px solid rgba(255,255,255,0.28)',boxShadow:'inset 0 1px 0 rgba(255,255,255,0.36)'}}></div>
    </foreignObject>
    <g filter="url(#filter1_i_robot)">
      <path d="M22 9C23.6569 9 25 10.3431 25 12C25 13.3057 24.1645 14.413 23 14.8252V19H31C35.4183 19 39 22.5817 39 27V41C39 45.4183 35.4183 49 31 49H13C8.58172 49 5 45.4183 5 41V27C5 22.5817 8.58172 19 13 19H21V14.8252C19.8355 14.413 19 13.3057 19 12C19 10.3431 20.3431 9 22 9Z" fill="#EC82A5" fillOpacity="0.45"/>
    </g>
    <path d="M29 40C29.5523 40 30 40.4477 30 41C30 41.5523 29.5523 42 29 42H15C14.4477 42 14 41.5523 14 41C14 40.4477 14.4477 40 15 40H29ZM16 30C17.6569 30 19 31.3431 19 33C19 34.6569 17.6569 36 16 36C14.3431 36 13 34.6569 13 33C13 31.3431 14.3431 30 16 30ZM28 30C29.6569 30 31 31.3431 31 33C31 34.6569 29.6569 36 28 36C26.3431 36 25 34.6569 25 33C25 31.3431 26.3431 30 28 30Z" fill="url(#paint1_robot)"/>
    <defs>
      <filter id="filter0_i_robot" x="21" y="7" width="31" height="32" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix"/>
        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
        <feOffset dy="1"/>
        <feGaussianBlur stdDeviation="0.5"/>
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
        <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0"/>
        <feBlend mode="normal" in2="shape" result="effect1_innerShadow"/>
      </filter>
      <filter id="filter1_i_robot" x="-3" y="1" width="50" height="56" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix"/>
        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
        <feOffset dy="3.66667"/>
        <feGaussianBlur stdDeviation="1.83333"/>
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
        <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0"/>
        <feBlend mode="normal" in2="shape" result="effect1_innerShadow"/>
      </filter>
      <clipPath id="bgblur_robot_clip" transform="translate(3 -1)">
        <path d="M22 9C23.6569 9 25 10.3431 25 12C25 13.3057 24.1645 14.413 23 14.8252V19H31C35.4183 19 39 22.5817 39 27V41C39 45.4183 35.4183 49 31 49H13C8.58172 49 5 45.4183 5 41V27C5 22.5817 8.58172 19 13 19H21V14.8252C19.8355 14.413 19 13.3057 19 12C19 10.3431 20.3431 9 22 9Z"/>
      </clipPath>
      <linearGradient id="paint0_robot" x1="36.5" y1="7" x2="36.5" y2="38" gradientUnits="userSpaceOnUse">
        <stop stopColor="#EE93B1"/>
        <stop offset="1" stopColor="#CF225B"/>
      </linearGradient>
      <linearGradient id="paint1_robot" x1="22" y1="30" x2="22" y2="42" gradientUnits="userSpaceOnUse">
        <stop stopColor="white"/>
        <stop offset="1" stopColor="white" stopOpacity="0.3"/>
      </linearGradient>
    </defs>
  </svg>
);

const TaskIcon = () => (
  <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#filter0_i_task)">
      <rect x="17" y="5" width="32" height="32" rx="8" fill="url(#paint0_task)" fillOpacity="0.8"/>
    </g>
    <foreignObject x="-2" y="5" width="51" height="52.2979">
      <div style={{backdropFilter:'blur(4px)',WebkitBackdropFilter:'blur(4px)',clipPath:'url(#bgblur_task_clip)',height:'100%',width:'100%',backgroundColor:'rgba(255,255,255,0.16)',border:'1px solid rgba(255,255,255,0.28)',boxShadow:'inset 0 1px 0 rgba(255,255,255,0.36)'}}></div>
    </foreignObject>
    <g filter="url(#filter1_i_task)">
      <path d="M6 25.8C6 21.3196 6 19.0794 6.87195 17.3681C7.63893 15.8628 8.86278 14.6389 10.3681 13.8719C12.0794 13 14.3196 13 18.8 13H28.2C32.6804 13 34.9206 13 36.6319 13.8719C38.1372 14.6389 39.3611 15.8628 40.1281 17.3681C41 19.0794 41 21.3196 41 25.8V37.4366C41 42.5886 41 45.1646 39.9149 46.7143C38.9675 48.0674 37.5041 48.9701 35.8697 49.2095C33.998 49.4837 31.6959 48.3277 27.0918 46.0156L26.4558 45.6962C25.4086 45.1704 24.885 44.9074 24.3355 44.8032C23.8488 44.7108 23.3492 44.7097 22.862 44.7998C22.312 44.9016 21.7873 45.1621 20.7377 45.6832L19.8689 46.1145C15.2748 48.3953 12.9777 49.5358 11.1113 49.2562C9.48144 49.0121 8.02375 48.1084 7.08034 46.7571C6 45.2097 6 42.6451 6 37.5159V25.8Z" fill="#F5AC7B" fillOpacity="0.42"/>
    </g>
    <path d="M23 23C23.8991 23 24.6279 23.7289 24.6279 24.6279V28.3721H28.3721C29.2711 28.3721 29.9999 29.101 30 30C30 30.8991 29.2711 31.6279 28.3721 31.6279H24.6279V35.3721C24.6279 36.2711 23.8991 37 23 37C22.101 37 21.3721 36.2711 21.3721 35.3721V31.6279H17.6279C16.7289 31.6279 16 30.8991 16 30C16.0001 29.101 16.7289 28.3721 17.6279 28.3721H21.3721V24.6279C21.3721 23.7289 22.101 23 23 23Z" fill="url(#paint1_task)"/>
    <defs>
      <filter id="filter0_i_task" x="17" y="5" width="32" height="33" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix"/>
        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
        <feOffset dy="1"/>
        <feGaussianBlur stdDeviation="0.5"/>
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
        <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0"/>
        <feBlend mode="normal" in2="shape" result="effect1_innerShadow"/>
      </filter>
      <filter id="filter1_i_task" x="-2" y="5" width="51" height="52.2979" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix"/>
        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
        <feOffset dy="3.66667"/>
        <feGaussianBlur stdDeviation="1.83333"/>
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
        <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0"/>
        <feBlend mode="normal" in2="shape" result="effect1_innerShadow"/>
      </filter>
      <clipPath id="bgblur_task_clip" transform="translate(2 -5)">
        <path d="M6 25.8C6 21.3196 6 19.0794 6.87195 17.3681C7.63893 15.8628 8.86278 14.6389 10.3681 13.8719C12.0794 13 14.3196 13 18.8 13H28.2C32.6804 13 34.9206 13 36.6319 13.8719C38.1372 14.6389 39.3611 15.8628 40.1281 17.3681C41 19.0794 41 21.3196 41 25.8V37.4366C41 42.5886 41 45.1646 39.9149 46.7143C38.9675 48.0674 37.5041 48.9701 35.8697 49.2095C33.998 49.4837 31.6959 48.3277 27.0918 46.0156L26.4558 45.6962C25.4086 45.1704 24.885 44.9074 24.3355 44.8032C23.8488 44.7108 23.3492 44.7097 22.862 44.7998C22.312 44.9016 21.7873 45.1621 20.7377 45.6832L19.8689 46.1145C15.2748 48.3953 12.9777 49.5358 11.1113 49.2562C9.48144 49.0121 8.02375 48.1084 7.08034 46.7571C6 45.2097 6 42.6451 6 37.5159V25.8Z"/>
      </clipPath>
      <linearGradient id="paint0_task" x1="46.8247" y1="6.96129" x2="36.8879" y2="40.2373" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F7AC6E"/>
        <stop offset="1" stopColor="#EE5316"/>
      </linearGradient>
      <linearGradient id="paint1_task" x1="21.5" y1="22.5" x2="22.5" y2="38" gradientUnits="userSpaceOnUse">
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
              onClick={() => item.path && navigate(item.path)}
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
