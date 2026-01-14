interface IconProps {
  size?: number;
  className?: string;
}

const HomeIcon = ({ size = 20, className }: IconProps) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <g clipPath="url(#clip0_home)">
      <path d="M17.4509 9.30357C17.9964 7.92394 19.949 7.92393 20.4944 9.30357L22.7529 15.016C23.319 16.448 22.2637 18 20.7239 18H20.3618V20.7273C20.3618 21.3298 19.8733 21.8182 19.2708 21.8182H18.6745C18.072 21.8182 17.5836 21.3298 17.5836 20.7273L17.5836 18H17.2215C15.6816 18 14.6263 16.448 15.1925 15.016L17.4509 9.30357Z" fill="url(#paint0_home)"/>
      <g filter="url(#filter0_home)">
        <path d="M1.46729 11.216C1.46729 10.0723 1.91629 8.97435 2.71767 8.15839L7.08131 3.71535C8.79155 1.97398 11.5976 1.97398 13.3078 3.71535L17.6714 8.15839C18.4728 8.97435 18.9218 10.0723 18.9218 11.216V18.5455C18.9218 20.3529 17.4566 21.8182 15.6491 21.8182H4.74001C2.93254 21.8182 1.46729 20.3529 1.46729 18.5455V11.216Z" fill="url(#paint1_home)" shapeRendering="crispEdges"/>
        <path d="M1.46729 11.216C1.46729 10.0723 1.91629 8.97435 2.71767 8.15839L7.08131 3.71535C8.79155 1.97398 11.5976 1.97398 13.3078 3.71535L17.6714 8.15839C18.4728 8.97435 18.9218 10.0723 18.9218 11.216V18.5455C18.9218 20.3529 17.4566 21.8182 15.6491 21.8182H4.74001C2.93254 21.8182 1.46729 20.3529 1.46729 18.5455V11.216Z" fill="#0077FA" fillOpacity="0.25" shapeRendering="crispEdges"/>
        <path d="M7.15283 3.7853C8.8239 2.08399 11.5658 2.08389 13.2368 3.7853L17.6001 8.22866C18.383 9.02591 18.8218 10.0986 18.8218 11.216V18.5451C18.8218 20.2973 17.4012 21.7179 15.6489 21.7179H4.73975C2.98762 21.7178 1.56689 20.2972 1.56689 18.5451V11.216C1.5669 10.0987 2.00577 9.02588 2.78857 8.22866L7.15283 3.7853Z" stroke="url(#paint2_home)" strokeWidth="0.2" shapeRendering="crispEdges"/>
      </g>
      <path opacity="0.8" d="M8.45453 16.6364V21.8182H13.3636V16.6364C13.3636 16.0339 12.8752 15.5455 12.2727 15.5455H9.54544C8.94295 15.5455 8.45453 16.0339 8.45453 16.6364Z" fill="url(#paint3_home)"/>
    </g>
    <defs>
      <filter id="filter0_home" x="-8.53271" y="-7.59068" width="37.4545" height="39.4089" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix"/>
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
        <feOffset dy="1"/>
        <feGaussianBlur stdDeviation="1"/>
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
      <linearGradient id="paint0_home" x1="18.9727" y1="8.26884" x2="18.9727" y2="21.8182" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0077FA"/>
        <stop offset="1" stopColor="#113CC2"/>
      </linearGradient>
      <linearGradient id="paint1_home" x1="10.1946" y1="1.62255" x2="10.1946" y2="21.8182" gradientUnits="userSpaceOnUse">
        <stop stopColor="white" stopOpacity="0.1"/>
        <stop offset="1" stopColor="white" stopOpacity="0"/>
      </linearGradient>
      <linearGradient id="paint2_home" x1="10.1946" y1="2.40932" x2="10.1946" y2="21.8182" gradientUnits="userSpaceOnUse">
        <stop stopColor="white" stopOpacity="0.15"/>
        <stop offset="1" stopColor="white" stopOpacity="0"/>
      </linearGradient>
      <linearGradient id="paint3_home" x1="10.9091" y1="17.8264" x2="10.9091" y2="21.8182" gradientUnits="userSpaceOnUse">
        <stop stopColor="white"/>
        <stop offset="1" stopColor="white" stopOpacity="0.3"/>
      </linearGradient>
      <clipPath id="clip0_home">
        <rect width="24" height="24" fill="white"/>
      </clipPath>
    </defs>
  </svg>
);

export default HomeIcon;
