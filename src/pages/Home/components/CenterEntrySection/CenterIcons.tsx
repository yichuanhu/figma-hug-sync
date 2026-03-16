import React from 'react';

const glassStyle: React.CSSProperties = {
  backdropFilter: 'blur(2px)',
  WebkitBackdropFilter: 'blur(2px)',
  height: '100%',
  width: '100%',
  backgroundColor: 'rgba(255,255,255,0.16)',
  border: '1px solid rgba(255,255,255,0.28)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.36)',
};

/** 需求中心 */
export const RequirementsCenterIcon: React.FC = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#filter0_i_req)">
      <path d="M1.27271 12.0256C1.27271 10.5386 2.52631 9.33325 4.07271 9.33325H10.0984C10.8496 9.33325 11.5692 9.62345 12.0957 10.1386L14.47 12.4621C14.9844 12.9656 15.2727 13.6432 15.2727 14.3491V24.1409C15.2727 25.6279 14.0191 26.8333 12.4727 26.8333H4.0727C2.52631 26.8333 1.27271 25.6279 1.27271 24.1409V12.0256Z" fill="url(#paint0_req)" />
    </g>
    <foreignObject x="4.90918" y="-2.72729" width="25.8181" height="32.1819">
      <div style={{ ...glassStyle, clipPath: 'url(#bgblur_req_clip)' }} />
    </foreignObject>
    <g filter="url(#filter1_i_req)">
      <path d="M8.90918 6.36361C8.90918 3.55198 11.1885 1.27271 14.0001 1.27271H19.4368C20.8405 1.27271 22.182 1.8523 23.144 2.87448L25.3437 5.2116C26.2325 6.15596 26.7274 7.4039 26.7274 8.70073V20.3636C26.7274 23.1752 24.4481 25.4545 21.6365 25.4545H14.0001C11.1885 25.4545 8.90918 23.1752 8.90918 20.3636V6.36361Z" fill="url(#paint1_req)" />
      <path d="M8.90918 6.36361C8.90918 3.55198 11.1885 1.27271 14.0001 1.27271H19.4368C20.8405 1.27271 22.182 1.8523 23.144 2.87448L25.3437 5.2116C26.2325 6.15596 26.7274 7.4039 26.7274 8.70073V20.3636C26.7274 23.1752 24.4481 25.4545 21.6365 25.4545H14.0001C11.1885 25.4545 8.90918 23.1752 8.90918 20.3636V6.36361Z" fill="#165DFF" fillOpacity="0.45" />
    </g>
    <path opacity="0.8" d="M22.167 15.167C22.8111 15.1672 23.3328 15.6889 23.333 16.333C23.333 16.9772 22.8112 17.4998 22.167 17.5H12.833C12.1888 17.4998 11.667 16.9772 11.667 16.333C11.6672 15.6889 12.1889 15.1672 12.833 15.167H22.167ZM16.333 10.5C16.9773 10.5 17.5 11.0227 17.5 11.667C17.4998 12.3112 16.9772 12.833 16.333 12.833H12.833C12.1889 12.8328 11.6672 12.3111 11.667 11.667C11.667 11.0228 12.1888 10.5002 12.833 10.5H16.333Z" fill="url(#paint2_req)" />
    <defs>
      <filter id="filter0_i_req" x="1.27271" y="9.33325" width="14" height="18.5" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
        <feOffset dy="1" />
        <feGaussianBlur stdDeviation="0.5" />
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
        <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0" />
        <feBlend mode="normal" in2="shape" result="effect1_innerShadow" />
      </filter>
      <filter id="filter1_i_req" x="4.90918" y="-2.72729" width="25.8181" height="32.1819" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
        <feOffset dy="3.66667" />
        <feGaussianBlur stdDeviation="1.83333" />
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
        <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0" />
        <feBlend mode="normal" in2="shape" result="effect1_innerShadow" />
      </filter>
      <clipPath id="bgblur_req_clip" transform="translate(-4.90918 2.72729)">
        <path d="M8.90918 6.36361C8.90918 3.55198 11.1885 1.27271 14.0001 1.27271H19.4368C20.8405 1.27271 22.182 1.8523 23.144 2.87448L25.3437 5.2116C26.2325 6.15596 26.7274 7.4039 26.7274 8.70073V20.3636C26.7274 23.1752 24.4481 25.4545 21.6365 25.4545H14.0001C11.1885 25.4545 8.90918 23.1752 8.90918 20.3636V6.36361Z" />
      </clipPath>
      <linearGradient id="paint0_req" x1="7" y1="26" x2="7" y2="12.5" gradientUnits="userSpaceOnUse">
        <stop stopColor="#1E49D7" />
        <stop offset="0.971154" stopColor="#426AF4" />
      </linearGradient>
      <linearGradient id="paint1_req" x1="17.8183" y1="1.59089" x2="17.8183" y2="25.4545" gradientUnits="userSpaceOnUse">
        <stop stopColor="white" stopOpacity="0.1" />
        <stop offset="1" stopColor="white" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="paint2_req" x1="17.5" y1="10.5" x2="12.8333" y2="15.7497" gradientUnits="userSpaceOnUse">
        <stop stopColor="white" />
        <stop offset="1" stopColor="white" stopOpacity="0.3" />
      </linearGradient>
    </defs>
  </svg>
);

/** 开发中心 */
export const DevelopmentCenterIcon: React.FC = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1.27271 5.82271C1.27271 3.30981 3.30981 1.27271 5.82271 1.27271H11.8894C14.4023 1.27271 16.4394 3.30981 16.4394 5.82271V11.8894C16.4394 14.4023 14.4023 16.4394 11.8894 16.4394H5.82271C3.30981 16.4394 1.27271 14.4023 1.27271 11.8894V5.82271Z" fill="url(#paint0_dev)" />
    <foreignObject x="3" y="3" width="28" height="28">
      <div style={{ ...glassStyle, clipPath: 'url(#bgblur_dev_clip)' }} />
    </foreignObject>
    <g filter="url(#filter0_i_dev)">
      <path d="M7 12C7 9.23858 9.23858 7 12 7H22C24.7614 7 27 9.23858 27 12V22C27 24.7614 24.7614 27 22 27H12C9.23858 27 7 24.7614 7 22V12Z" fill="url(#paint1_dev)" />
      <path d="M7 12C7 9.23858 9.23858 7 12 7H22C24.7614 7 27 9.23858 27 12V22C27 24.7614 24.7614 27 22 27H12C9.23858 27 7 24.7614 7 22V12Z" fill="#4FBE31" fillOpacity="0.45" />
    </g>
    <path opacity="0.8" d="M16.6687 13.7395C16.7636 13.1247 17.3023 12.7088 17.8718 12.8108C18.4414 12.9133 18.8267 13.4948 18.7321 14.1096L17.6862 20.884C17.5912 21.4987 17.0527 21.914 16.4831 21.8118C15.9134 21.7093 15.528 21.1278 15.6228 20.5129L16.6687 13.7395ZM12.5925 14.2717C12.9923 13.8223 13.6543 13.8074 14.071 14.2385C14.4876 14.6701 14.5018 15.3853 14.1023 15.8352L12.8747 17.2161L14.2712 18.7874C14.6711 19.2372 14.6577 19.9524 14.2409 20.384C13.8241 20.8157 13.1614 20.8008 12.7614 20.3508L10.8786 18.2317C10.3741 17.6639 10.3741 16.7682 10.8786 16.2004L12.5925 14.2717ZM20.2839 14.2385C20.7006 13.8073 21.3625 13.8224 21.7624 14.2717L23.4773 16.2004C23.9814 16.7681 23.9814 17.664 23.4773 18.2317L21.5935 20.3508C21.1935 20.8008 20.5308 20.8157 20.114 20.384C19.6974 19.9524 19.6839 19.2372 20.0837 18.7874L21.4812 17.2161L20.2536 15.8352C19.8539 15.3853 19.8672 14.6702 20.2839 14.2385Z" fill="url(#paint2_dev)" />
    <defs>
      <filter id="filter0_i_dev" x="3" y="3" width="28" height="28" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
        <feOffset dy="3.66667" />
        <feGaussianBlur stdDeviation="1.83333" />
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
        <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0" />
        <feBlend mode="normal" in2="shape" result="effect1_innerShadow" />
      </filter>
      <clipPath id="bgblur_dev_clip" transform="translate(-3 -3)">
        <path d="M7 12C7 9.23858 9.23858 7 12 7H22C24.7614 7 27 9.23858 27 12V22C27 24.7614 24.7614 27 22 27H12C9.23858 27 7 24.7614 7 22V12Z" />
      </clipPath>
      <linearGradient id="paint0_dev" x1="8.85604" y1="1.27271" x2="8.85604" y2="16.4394" gradientUnits="userSpaceOnUse">
        <stop stopColor="#52C533" />
        <stop offset="1" stopColor="#2F791C" />
      </linearGradient>
      <linearGradient id="paint1_dev" x1="17" y1="6.16667" x2="17" y2="27" gradientUnits="userSpaceOnUse">
        <stop stopColor="white" stopOpacity="0.1" />
        <stop offset="1" stopColor="white" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="paint2_dev" x1="17.1778" y1="12.7954" x2="17.1778" y2="21.8272" gradientUnits="userSpaceOnUse">
        <stop stopColor="white" />
        <stop offset="1" stopColor="white" stopOpacity="0.3" />
      </linearGradient>
    </defs>
  </svg>
);

/** 调度中心 */
export const SchedulingCenterIcon: React.FC = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.5136 2.23657C20.5136 1.64607 20.0354 1.16696 19.4449 1.16675C18.8543 1.16675 18.3751 1.64593 18.3751 2.23657V7.58341H16.9167V2.23657C16.9167 1.64593 16.4376 1.16675 15.8469 1.16675C15.2564 1.16694 14.7782 1.64605 14.7782 2.23657V7.58341H13.3199V2.23657C13.3199 1.64595 12.8407 1.16677 12.2501 1.16675C11.6594 1.16675 11.1803 1.64593 11.1803 2.23657V7.58341H9.72192V2.23657C9.72192 1.64605 9.24371 1.16694 8.65324 1.16675C8.0626 1.16675 7.58341 1.64593 7.58341 2.23657V7.58341H2.23657C1.64594 7.58341 1.16675 8.0626 1.16675 8.65324C1.16695 9.2437 1.64606 9.72192 2.23657 9.72192H7.58341V11.1803H2.23657C1.64594 11.1803 1.16675 11.6594 1.16675 12.2501C1.16675 12.8407 1.64594 13.3199 2.23657 13.3199H7.58341V14.7782H2.23657C1.64607 14.7782 1.16696 15.2565 1.16675 15.8469C1.16675 16.4376 1.64594 16.9167 2.23657 16.9167H7.58341V18.3751H2.23657C1.64594 18.3751 1.16675 18.8543 1.16675 19.4449C1.16695 20.0354 1.64606 20.5136 2.23657 20.5136H7.58341V25.7636C7.58341 26.3542 8.0626 26.8334 8.65324 26.8334C9.24371 26.8332 9.72192 26.3541 9.72192 25.7636V20.5136H11.1803V25.7636C11.1803 26.3542 11.6594 26.8334 12.2501 26.8334C12.8407 26.8334 13.3199 26.3542 13.3199 25.7636V20.5136H14.7782V25.7636C14.7782 26.3541 15.2564 26.8332 15.8469 26.8334C16.4376 26.8334 16.9167 26.3542 16.9167 25.7636V20.5136H18.3751V25.7636C18.3751 26.3542 18.8543 26.8334 19.4449 26.8334C20.0354 26.8332 20.5136 26.3541 20.5136 25.7636V20.5136H25.7636C26.3541 20.5136 26.8332 20.0354 26.8334 19.4449C26.8334 18.8543 26.3542 18.3751 25.7636 18.3751H20.5136V16.9167H25.7636C26.3542 16.9167 26.8334 16.4376 26.8334 15.8469C26.8332 15.2565 26.3541 14.7782 25.7636 14.7782H20.5136V13.3199H25.7636C26.3542 13.3199 26.8334 12.8407 26.8334 12.2501C26.8334 11.6594 26.3542 11.1803 25.7636 11.1803H20.5136V9.72192H25.7636C26.3541 9.72192 26.8332 9.2437 26.8334 8.65324C26.8334 8.0626 26.3542 7.58341 25.7636 7.58341H20.5136V2.23657Z" fill="url(#paint0_sched)" />
    <foreignObject x="-0.5" y="-0.5" width="29" height="29">
      <div style={{ ...glassStyle, clipPath: 'url(#bgblur_sched_clip)' }} />
    </foreignObject>
    <g filter="url(#filter0_i_sched)">
      <path d="M3.5 8.91936C3.5 5.92633 5.58934 3.5 8.16667 3.5H19.8333C22.4107 3.5 24.5 5.92633 24.5 8.91936V19.0806C24.5 22.0737 22.4107 24.5 19.8333 24.5H8.16667C5.58934 24.5 3.5 22.0737 3.5 19.0806V8.91936Z" fill="url(#paint1_sched)" />
      <path d="M3.5 8.91936C3.5 5.92633 5.58934 3.5 8.16667 3.5H19.8333C22.4107 3.5 24.5 5.92633 24.5 8.91936V19.0806C24.5 22.0737 22.4107 24.5 19.8333 24.5H8.16667C5.58934 24.5 3.5 22.0737 3.5 19.0806V8.91936Z" fill="#4FC1CE" fillOpacity="0.45" />
    </g>
    <path opacity="0.8" d="M9.33325 12.205C9.33325 10.619 10.619 9.33325 12.205 9.33325H15.7948C17.3808 9.33325 18.6666 10.619 18.6666 12.205V15.7948C18.6666 17.3808 17.3808 18.6666 15.7948 18.6666H12.205C10.619 18.6666 9.33325 17.3808 9.33325 15.7948V12.205Z" fill="url(#paint2_sched)" />
    <defs>
      <filter id="filter0_i_sched" x="-0.5" y="-0.5" width="29" height="29" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
        <feOffset dy="3.66667" />
        <feGaussianBlur stdDeviation="1.83333" />
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
        <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0" />
        <feBlend mode="normal" in2="shape" result="effect1_innerShadow" />
      </filter>
      <clipPath id="bgblur_sched_clip" transform="translate(0.5 0.5)">
        <path d="M3.5 8.91936C3.5 5.92633 5.58934 3.5 8.16667 3.5H19.8333C22.4107 3.5 24.5 5.92633 24.5 8.91936V19.0806C24.5 22.0737 22.4107 24.5 19.8333 24.5H8.16667C5.58934 24.5 3.5 22.0737 3.5 19.0806V8.91936Z" />
      </clipPath>
      <linearGradient id="paint0_sched" x1="14.0001" y1="1.16675" x2="14.0001" y2="26.8334" gradientUnits="userSpaceOnUse">
        <stop stopColor="#50C2CF" />
        <stop offset="1" stopColor="#43A5B0" />
      </linearGradient>
      <linearGradient id="paint1_sched" x1="14" y1="2.625" x2="14" y2="24.5" gradientUnits="userSpaceOnUse">
        <stop stopColor="white" stopOpacity="0.1" />
        <stop offset="1" stopColor="white" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="paint2_sched" x1="13.9999" y1="9.33325" x2="13.9999" y2="18.6666" gradientUnits="userSpaceOnUse">
        <stop stopColor="white" />
        <stop offset="1" stopColor="white" stopOpacity="0.3" />
      </linearGradient>
    </defs>
  </svg>
);

/** 运营中心 */
export const OperationsCenterIcon: React.FC = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#filter0_i_ops)">
      <path d="M23.074 18.4546C24.5058 18.4546 25.6666 20.0216 25.6666 21.9546C25.6666 23.8876 24.5058 25.4546 23.074 25.4546H4.92584C3.494 25.4546 2.33325 23.8876 2.33325 21.9546C2.33325 20.0216 3.494 18.4546 4.92584 18.4546H23.074Z" fill="url(#paint0_ops)" />
    </g>
    <foreignObject x="-1.45459" y="-1.45459" width="30.9092" height="27.7273">
      <div style={{ ...glassStyle, clipPath: 'url(#bgblur_ops_clip)' }} />
    </foreignObject>
    <g filter="url(#filter1_i_ops)">
      <path d="M2.54541 7.63632C2.54541 4.82469 4.82469 2.54541 7.63632 2.54541H20.3636C23.1752 2.54541 25.4545 4.82469 25.4545 7.63632V17.1818C25.4545 19.9934 23.1752 22.2727 20.3636 22.2727H7.63632C4.82469 22.2727 2.54541 19.9934 2.54541 17.1818V7.63632Z" fill="url(#paint1_ops)" />
      <path d="M2.54541 7.63632C2.54541 4.82469 4.82469 2.54541 7.63632 2.54541H20.3636C23.1752 2.54541 25.4545 4.82469 25.4545 7.63632V17.1818C25.4545 19.9934 23.1752 22.2727 20.3636 22.2727H7.63632C4.82469 22.2727 2.54541 19.9934 2.54541 17.1818V7.63632Z" fill="#CA6DFF" fillOpacity="0.45" />
    </g>
    <path opacity="0.8" d="M18.2223 7.58343C18.5444 7.02572 19.2572 6.83445 19.8151 7.15619C20.3731 7.47835 20.5645 8.19209 20.2423 8.7501L16.9121 14.5185C16.4517 15.3154 15.3606 15.4587 14.7098 14.8079L13.6662 13.7643L11.5106 17.5001C11.1884 18.0581 10.4747 18.2494 9.91666 17.9273C9.35868 17.6052 9.16732 16.8914 9.48941 16.3334L12.2545 11.5449L12.348 11.4036C12.816 10.7779 13.7152 10.6596 14.3293 11.1427L14.4569 11.2555L15.4993 12.298L18.2223 7.58343Z" fill="url(#paint2_ops)" />
    <defs>
      <filter id="filter0_i_ops" x="2.33325" y="18.4546" width="23.3333" height="8" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
        <feOffset dy="1" />
        <feGaussianBlur stdDeviation="0.5" />
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
        <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0" />
        <feBlend mode="normal" in2="shape" result="effect1_innerShadow" />
      </filter>
      <filter id="filter1_i_ops" x="-1.45459" y="-1.45459" width="30.9092" height="27.7273" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
        <feOffset dy="3.66667" />
        <feGaussianBlur stdDeviation="1.83333" />
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
        <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0" />
        <feBlend mode="normal" in2="shape" result="effect1_innerShadow" />
      </filter>
      <clipPath id="bgblur_ops_clip" transform="translate(1.45459 1.45459)">
        <path d="M2.54541 7.63632C2.54541 4.82469 4.82469 2.54541 7.63632 2.54541H20.3636C23.1752 2.54541 25.4545 4.82469 25.4545 7.63632V17.1818C25.4545 19.9934 23.1752 22.2727 20.3636 22.2727H7.63632C4.82469 22.2727 2.54541 19.9934 2.54541 17.1818V7.63632Z" />
      </clipPath>
      <linearGradient id="paint0_ops" x1="13.9999" y1="25.4546" x2="13.9999" y2="18.4546" gradientUnits="userSpaceOnUse">
        <stop stopColor="#903AD7" />
        <stop offset="1" stopColor="#AE63ED" />
      </linearGradient>
      <linearGradient id="paint1_ops" x1="14" y1="1.72344" x2="14" y2="22.2727" gradientUnits="userSpaceOnUse">
        <stop stopColor="white" stopOpacity="0.1" />
        <stop offset="1" stopColor="white" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="paint2_ops" x1="14.8659" y1="7" x2="14.8659" y2="18.0838" gradientUnits="userSpaceOnUse">
        <stop stopColor="white" />
        <stop offset="1" stopColor="white" stopOpacity="0.3" />
      </linearGradient>
    </defs>
  </svg>
);

/** 运维中心 */
export const MaintenanceCenterIcon: React.FC = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#filter0_i_maint)">
      <path d="M18.1708 1.69165C18.8843 1.08358 19.9338 1.08358 20.6473 1.69165L21.374 2.31087C21.6797 2.57145 22.0599 2.72892 22.4604 2.76088L23.412 2.83682C24.3465 2.91139 25.0886 3.65348 25.1632 4.588L25.2391 5.53965C25.2711 5.94012 25.4286 6.32029 25.6891 6.62606L26.3084 7.35268C26.9164 8.06622 26.9164 9.11568 26.3084 9.82922L25.6891 10.5558C25.4286 10.8616 25.2711 11.2418 25.2391 11.6422L25.1632 12.5939C25.0886 13.5284 24.3465 14.2705 23.412 14.3451L22.4604 14.421C22.0599 14.453 21.6797 14.6105 21.374 14.871L20.6473 15.4902C19.9338 16.0983 18.8843 16.0983 18.1708 15.4902L17.4442 14.871C17.1384 14.6105 16.7582 14.453 16.3578 14.421L15.4061 14.3451C14.4716 14.2705 13.7295 13.5284 13.6549 12.5939L13.579 11.6422C13.547 11.2418 13.3896 10.8616 13.129 10.5558L12.5098 9.82922C11.9017 9.11568 11.9017 8.06622 12.5098 7.35268L13.129 6.62606C13.3896 6.32029 13.547 5.94011 13.579 5.53965L13.6549 4.588C13.7295 3.65348 14.4716 2.91139 15.4061 2.83682L16.3578 2.76088C16.7582 2.72892 17.1384 2.57145 17.4442 2.31087L18.1708 1.69165Z" fill="url(#paint0_maint)" />
    </g>
    <foreignObject x="-2.80151" y="-0.256104" width="31.0579" height="31.0579">
      <div style={{ ...glassStyle, clipPath: 'url(#bgblur_maint_clip)' }} />
    </foreignObject>
    <g filter="url(#filter1_i_maint)">
      <path d="M10.2508 4.656C11.6779 3.43986 13.7768 3.43986 15.2039 4.656L15.6831 5.06432C16.2946 5.58547 17.0549 5.90042 17.8559 5.96433L18.4834 6.01441C20.3524 6.16356 21.8366 7.64773 21.9858 9.51676L22.0358 10.1443C22.0997 10.9452 22.4147 11.7056 22.9358 12.3171L23.3442 12.7962C24.5603 14.2233 24.5603 16.3222 23.3442 17.7493L22.9358 18.2285C22.4147 18.84 22.0997 19.6004 22.0358 20.4013L21.9858 21.0288C21.8366 22.8978 20.3524 24.382 18.4834 24.5312L17.8559 24.5812C17.0549 24.6452 16.2946 24.9601 15.6831 25.4812L15.2039 25.8896C13.7768 27.1057 11.6779 27.1057 10.2508 25.8896L9.7717 25.4812C9.16016 24.9601 8.39981 24.6452 7.59889 24.5812L6.97135 24.5312C5.10232 24.382 3.61815 22.8978 3.469 21.0288L3.41892 20.4013C3.35501 19.6004 3.04006 18.84 2.51891 18.2285L2.11059 17.7493C0.89445 16.3223 0.894451 14.2233 2.11059 12.7962L2.51891 12.3171C3.04006 11.7056 3.35501 10.9452 3.41892 10.1443L3.469 9.51676C3.61815 7.64773 5.10232 6.16356 6.97135 6.01441L7.59888 5.96433C8.39981 5.90042 9.16016 5.58547 9.7717 5.06432L10.2508 4.656Z" fill="#B1A00F" fillOpacity="0.45" />
    </g>
    <path opacity="0.8" d="M17.1818 15.2727C17.1818 17.7328 15.1874 19.7272 12.7273 19.7272C10.2671 19.7272 8.27271 17.7328 8.27271 15.2727C8.27271 12.8125 10.2671 10.8181 12.7273 10.8181C15.1874 10.8181 17.1818 12.8125 17.1818 15.2727Z" fill="url(#paint1_maint)" />
    <defs>
      <filter id="filter0_i_maint" x="12.0537" y="1.2356" width="14.7107" height="15.7107" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
        <feOffset dy="1" />
        <feGaussianBlur stdDeviation="0.5" />
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
        <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0" />
        <feBlend mode="normal" in2="shape" result="effect1_innerShadow" />
      </filter>
      <filter id="filter1_i_maint" x="-2.80151" y="-0.256104" width="31.0579" height="31.0579" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
        <feOffset dy="3.66667" />
        <feGaussianBlur stdDeviation="1.83333" />
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
        <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0" />
        <feBlend mode="normal" in2="shape" result="effect1_innerShadow" />
      </filter>
      <clipPath id="bgblur_maint_clip" transform="translate(2.80151 0.256104)">
        <path d="M10.2508 4.656C11.6779 3.43986 13.7768 3.43986 15.2039 4.656L15.6831 5.06432C16.2946 5.58547 17.0549 5.90042 17.8559 5.96433L18.4834 6.01441C20.3524 6.16356 21.8366 7.64773 21.9858 9.51676L22.0358 10.1443C22.0997 10.9452 22.4147 11.7056 22.9358 12.3171L23.3442 12.7962C24.5603 14.2233 24.5603 16.3222 23.3442 17.7493L22.9358 18.2285C22.4147 18.84 22.0997 19.6004 22.0358 20.4013L21.9858 21.0288C21.8366 22.8978 20.3524 24.382 18.4834 24.5312L17.8559 24.5812C17.0549 24.6452 16.2946 24.9601 15.6831 25.4812L15.2039 25.8896C13.7768 27.1057 11.6779 27.1057 10.2508 25.8896L9.7717 25.4812C9.16016 24.9601 8.39981 24.6452 7.59889 24.5812L6.97135 24.5312C5.10232 24.382 3.61815 22.8978 3.469 21.0288L3.41892 20.4013C3.35501 19.6004 3.04006 18.84 2.51891 18.2285L2.11059 17.7493C0.89445 16.3223 0.894451 14.2233 2.11059 12.7962L2.51891 12.3171C3.04006 11.7056 3.35501 10.9452 3.41892 10.1443L3.469 9.51676C3.61815 7.64773 5.10232 6.16356 6.97135 6.01441L7.59888 5.96433C8.39981 5.90042 9.16016 5.58547 9.7717 5.06432L10.2508 4.656Z" />
      </clipPath>
      <linearGradient id="paint0_maint" x1="19.4091" y1="1.2356" x2="19.4091" y2="15.9463" gradientUnits="userSpaceOnUse">
        <stop stopColor="#B19F03" />
        <stop offset="1" stopColor="#9B8B05" />
      </linearGradient>
      <linearGradient id="paint1_maint" x1="12.7272" y1="14.0578" x2="12.7272" y2="19.7272" gradientUnits="userSpaceOnUse">
        <stop stopColor="white" />
        <stop offset="1" stopColor="white" stopOpacity="0.3" />
      </linearGradient>
    </defs>
  </svg>
);
