interface IconProps {
  size?: number;
  className?: string;
}

const RequirementsIcon = ({ size = 20, className }: IconProps) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <g clipPath="url(#clip0_req)">
      <path d="M1.09088 10.9091C1.09088 9.70411 2.06771 8.72727 3.2727 8.72727H7.96808C8.55339 8.72727 9.11416 8.96245 9.52438 9.37995L11.3745 11.2629C11.7753 11.6709 12 12.22 12 12.792V20.7273C12 21.9323 11.0231 22.9091 9.81815 22.9091H3.2727C2.06771 22.9091 1.09088 21.9323 1.09088 20.7273V10.9091Z" fill="url(#paint0_req)"/>
      <g filter="url(#filter0_req)">
        <path d="M7.63635 5.45455C7.63635 3.04458 9.59002 1.09091 12 1.09091H16.66C17.8632 1.09091 19.013 1.58771 19.8376 2.46387L21.723 4.46711C22.4849 5.27656 22.9091 6.34622 22.9091 7.45779V17.4545C22.9091 19.8645 20.9554 21.8182 18.5454 21.8182H12C9.59002 21.8182 7.63635 19.8645 7.63635 17.4545V5.45455Z" fill="url(#paint1_req)" shapeRendering="crispEdges"/>
        <path d="M7.63635 5.45455C7.63635 3.04458 9.59002 1.09091 12 1.09091H16.66C17.8632 1.09091 19.013 1.58771 19.8376 2.46387L21.723 4.46711C22.4849 5.27656 22.9091 6.34622 22.9091 7.45779V17.4545C22.9091 19.8645 20.9554 21.8182 18.5454 21.8182H12C9.59002 21.8182 7.63635 19.8645 7.63635 17.4545V5.45455Z" fill="#0077FA" fillOpacity="0.25" shapeRendering="crispEdges"/>
        <path d="M11.9996 1.19052H16.6598C17.8354 1.19052 18.9595 1.67624 19.7653 2.53232L21.65 4.53525C22.3944 5.32614 22.8092 6.372 22.8092 7.4581V17.4542C22.8092 19.8089 20.9002 21.7178 18.5455 21.7179H11.9996C9.64506 21.7177 7.73596 19.8088 7.73596 17.4542V5.45419C7.73615 3.09973 9.64517 1.19071 11.9996 1.19052Z" stroke="url(#paint2_req)" strokeWidth="0.2" shapeRendering="crispEdges"/>
      </g>
      <g opacity="0.8">
        <path d="M19.0909 13.3636C19.5428 13.3636 19.9091 13.7299 19.9091 14.1818C19.9091 14.6337 19.5428 15 19.0909 15H11.4545C11.0027 15 10.6364 14.6337 10.6364 14.1818C10.6364 13.7299 11.0027 13.3636 11.4545 13.3636H19.0909Z" fill="url(#paint3_req)"/>
        <path d="M14.7273 9C15.1791 9 15.5454 9.36631 15.5454 9.81818C15.5454 10.2701 15.1791 10.6364 14.7273 10.6364H11.4545C11.0027 10.6364 10.6364 10.2701 10.6364 9.81818C10.6364 9.36631 11.0027 9 11.4545 9H14.7273Z" fill="url(#paint4_req)"/>
      </g>
    </g>
    <defs>
      <filter id="filter0_req" x="-2.36365" y="-8.90909" width="35.2727" height="40.7273" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
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
      <linearGradient id="paint0_req" x1="6.54543" y1="8.72727" x2="6.54543" y2="22.9091" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0077FA"/>
        <stop offset="1" stopColor="#113CC2"/>
      </linearGradient>
      <linearGradient id="paint1_req" x1="15.2727" y1="1.36364" x2="15.2727" y2="21.8182" gradientUnits="userSpaceOnUse">
        <stop stopColor="white" stopOpacity="0.1"/>
        <stop offset="1" stopColor="white" stopOpacity="0"/>
      </linearGradient>
      <linearGradient id="paint2_req" x1="15.2727" y1="1.09091" x2="15.2727" y2="21.8182" gradientUnits="userSpaceOnUse">
        <stop stopColor="white" stopOpacity="0.15"/>
        <stop offset="1" stopColor="white" stopOpacity="0"/>
      </linearGradient>
      <linearGradient id="paint3_req" x1="15.2727" y1="12.7686" x2="15.2727" y2="19.3636" gradientUnits="userSpaceOnUse">
        <stop stopColor="white"/>
        <stop offset="1" stopColor="white" stopOpacity="0.3"/>
      </linearGradient>
      <linearGradient id="paint4_req" x1="15.2727" y1="12.7686" x2="15.2727" y2="19.3636" gradientUnits="userSpaceOnUse">
        <stop stopColor="white"/>
        <stop offset="1" stopColor="white" stopOpacity="0.3"/>
      </linearGradient>
      <clipPath id="clip0_req">
        <rect width="24" height="24" fill="white"/>
      </clipPath>
    </defs>
  </svg>
);

export default RequirementsIcon;
