interface IconProps {
  size?: number;
  className?: string;
}

const BusinessIcon = ({ size = 20, className }: IconProps) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <g clipPath="url(#clip0_biz)">
      <path opacity="0.8" d="M19.7778 15.8182C21.0051 15.8182 22 17.1613 22 18.8182C22 20.475 21.0051 21.8182 19.7778 21.8182H4.22222C2.99492 21.8182 2 20.475 2 18.8182C2 17.1613 2.99492 15.8182 4.22222 15.8182H19.7778Z" fill="url(#paint0_biz)"/>
      <g filter="url(#filter0_biz)">
        <path d="M2.18182 6.54546C2.18182 4.13549 4.13549 2.18182 6.54546 2.18182H17.4546C19.8645 2.18182 21.8182 4.13549 21.8182 6.54546V14.7273C21.8182 17.1372 19.8645 19.0909 17.4546 19.0909H6.54546C4.13549 19.0909 2.18182 17.1372 2.18182 14.7273V6.54546Z" fill="url(#paint1_biz)" shapeRendering="crispEdges"/>
        <path d="M2.18182 6.54546C2.18182 4.13549 4.13549 2.18182 6.54546 2.18182H17.4546C19.8645 2.18182 21.8182 4.13549 21.8182 6.54546V14.7273C21.8182 17.1372 19.8645 19.0909 17.4546 19.0909H6.54546C4.13549 19.0909 2.18182 17.1372 2.18182 14.7273V6.54546Z" fill="#0077FA" fillOpacity="0.25" shapeRendering="crispEdges"/>
        <path d="M6.5451 2.28143H17.4543C19.8089 2.28143 21.7178 4.19053 21.718 6.5451V14.7277C21.7177 17.0823 19.8089 18.9914 17.4543 18.9914H6.5451C4.19068 18.9912 2.28167 17.0821 2.28143 14.7277V6.5451C2.28162 4.19065 4.19065 2.28163 6.5451 2.28143Z" stroke="url(#paint2_biz)" strokeWidth="0.2" shapeRendering="crispEdges"/>
      </g>
      <path d="M14.5526 6.73371C14.8578 6.09284 15.6253 5.81994 16.2663 6.12482C16.9072 6.43 17.1801 7.19757 16.8752 7.83851L14.579 12.6594C14.4046 13.0256 14.0677 13.2881 13.67 13.3675C13.2722 13.4468 12.8592 13.3338 12.5577 13.0624L11.5169 12.1246L10.436 14.289C10.1185 14.9241 9.34604 15.1815 8.71099 14.864C8.07594 14.5465 7.81847 13.7741 8.13599 13.139L9.97271 9.46557L10.0468 9.33626C10.2368 9.04611 10.538 8.84301 10.8829 8.77759C11.2772 8.70291 11.6844 8.8167 11.9827 9.08517L12.9971 9.99914L14.5526 6.73371Z" fill="url(#paint3_biz)"/>
    </g>
    <defs>
      <filter id="filter0_biz" x="-7.81818" y="-7.81818" width="39.6364" height="36.9091" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix"/>
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
        <feOffset dy="1"/>
        <feGaussianBlur stdDeviation="2"/>
        <feComposite in2="hardAlpha" operator="out"/>
        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.12 0"/>
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
        <feOffset dy="1"/>
        <feGaussianBlur stdDeviation="1.5"/>
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
        <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.1 0"/>
        <feBlend mode="normal" in2="shape" result="effect2_innerShadow"/>
      </filter>
      <linearGradient id="paint0_biz" x1="12" y1="15.8182" x2="12" y2="23.4432" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0077FA"/>
        <stop offset="1" stopColor="#113CC2"/>
      </linearGradient>
      <linearGradient id="paint1_biz" x1="12" y1="1.47728" x2="12" y2="19.0909" gradientUnits="userSpaceOnUse">
        <stop stopColor="white" stopOpacity="0.1"/>
        <stop offset="1" stopColor="white" stopOpacity="0"/>
      </linearGradient>
      <linearGradient id="paint2_biz" x1="12" y1="2.18182" x2="12" y2="19.0909" gradientUnits="userSpaceOnUse">
        <stop stopColor="white" stopOpacity="0.15"/>
        <stop offset="1" stopColor="white" stopOpacity="0"/>
      </linearGradient>
      <linearGradient id="paint3_biz" x1="12.5" y1="6" x2="12.5" y2="15" gradientUnits="userSpaceOnUse">
        <stop stopColor="white"/>
        <stop offset="1" stopColor="white" stopOpacity="0.3"/>
      </linearGradient>
      <clipPath id="clip0_biz">
        <rect width="24" height="24" fill="white"/>
      </clipPath>
    </defs>
  </svg>
);

export default BusinessIcon;
