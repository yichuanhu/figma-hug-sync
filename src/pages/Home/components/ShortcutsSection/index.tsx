import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { shortcuts } from '../../mockData';
import './index.less';

const ProcessIcon = () => (
  <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#filter0_i_process)">
      <path d="M24.2669 5.57015L10.7548 9.02005C5.85364 10.2714 3.76895 13.7345 5.08654 18.42L9.54905 34.2893C10.8882 39.0517 14.4936 40.9961 19.3947 39.7448L32.9068 36.2949C37.887 35.0233 39.9083 31.6423 38.5692 26.8799L34.1066 11.0106C32.7891 6.3251 29.2471 4.29861 24.2669 5.57015Z" fill="url(#paint0_process)"/>
    </g>
    <foreignObject x="8" y="7" width="50" height="50">
      <div style={{backdropFilter:'blur(4px)',WebkitBackdropFilter:'blur(4px)',clipPath:'url(#bgblur_process_clip)',height:'100%',width:'100%',backgroundColor:'rgba(255,255,255,0.16)',border:'1px solid rgba(255,255,255,0.28)',boxShadow:'inset 0 1px 0 rgba(255,255,255,0.36)'}}></div>
    </foreignObject>
    <g filter="url(#filter1_i_process)">
      <path d="M40.9163 15H25.0856C19.3433 15 16 18.026 16 23.211V40.772C16 46.042 19.3433 49 25.0856 49H40.9163C46.7511 49 50 46.042 50 40.772V23.211C50 18.026 46.7511 15 40.9163 15Z" fill="#9DAAFA" fillOpacity="0.45"/>
    </g>
    <path d="M30 34C30 35.6569 31.3431 37 33 37H37V36C37 34.8954 37.8954 34 39 34H43C44.1046 34 45 34.8954 45 36V40C45 41.1046 44.1046 42 43 42H39C37.8954 42 37 41.1046 37 40V39H33C30.2386 39 28 36.7614 28 34V30H27C25.8954 30 25 29.1046 25 28V24C25 22.8954 25.8954 22 27 22H31C32.1046 22 33 22.8954 33 24V28C33 29.1046 32.1046 30 31 30H30V34Z" fill="url(#paint1_process)"/>
    <defs>
      <filter id="filter0_i_process" x="4.69949" y="5.19775" width="34.2732" height="35.9175" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix"/>
        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
        <feOffset dy="1"/>
        <feGaussianBlur stdDeviation="0.5"/>
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
        <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0"/>
        <feBlend mode="normal" in2="shape" result="effect1_innerShadow"/>
      </filter>
      <filter id="filter1_i_process" x="8" y="7" width="50" height="50" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix"/>
        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
        <feOffset dy="3.66667"/>
        <feGaussianBlur stdDeviation="1.83333"/>
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
        <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0"/>
        <feBlend mode="normal" in2="shape" result="effect1_innerShadow"/>
      </filter>
      <clipPath id="bgblur_process_clip" transform="translate(-8 -7)">
        <path d="M40.9163 15H25.0856C19.3433 15 16 18.026 16 23.211V40.772C16 46.042 19.3433 49 25.0856 49H40.9163C46.7511 49 50 46.042 50 40.772V23.211C50 18.026 46.7511 15 40.9163 15Z"/>
      </clipPath>
      <linearGradient id="paint0_process" x1="17.5101" y1="7.2953" x2="25.4033" y2="38.2106" gradientUnits="userSpaceOnUse">
        <stop stopColor="#91A4FA"/>
        <stop offset="1" stopColor="#2A32CF"/>
      </linearGradient>
      <linearGradient id="paint1_process" x1="35" y1="26" x2="38" y2="43.5" gradientUnits="userSpaceOnUse">
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
      <div style={{backdropFilter:'blur(4px)',clipPath:'url(#bgblur_robot_clip)',height:'100%',width:'100%'}}></div>
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
      <div style={{backdropFilter:'blur(4px)',clipPath:'url(#bgblur_task_clip)',height:'100%',width:'100%'}}></div>
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
