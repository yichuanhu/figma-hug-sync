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
    {/* 烟囱 */}
    <path d="M17.4509 9.30357C17.9964 7.92394 19.949 7.92393 20.4944 9.30357L22.7529 15.016C23.319 16.448 22.2637 18 20.7239 18H20.3618V20.7273C20.3618 21.3298 19.8733 21.8182 19.2708 21.8182H18.6745C18.072 21.8182 17.5836 21.3298 17.5836 20.7273L17.5836 18H17.2215C15.6816 18 14.6263 16.448 15.1925 15.016L17.4509 9.30357Z" fill="url(#home_grad0)"/>
    {/* 房屋主体 */}
    <path d="M1.46729 11.216C1.46729 10.0723 1.91629 8.97435 2.71767 8.15839L7.08131 3.71535C8.79155 1.97398 11.5976 1.97398 13.3078 3.71535L17.6714 8.15839C18.4728 8.97435 18.9218 10.0723 18.9218 11.216V18.5455C18.9218 20.3529 17.4566 21.8182 15.6491 21.8182H4.74001C2.93254 21.8182 1.46729 20.3529 1.46729 18.5455V11.216Z" fill="url(#home_grad1)"/>
    {/* 门 */}
    <path d="M8.45453 16.6364V21.8182H13.3636V16.6364C13.3636 16.0339 12.8752 15.5455 12.2727 15.5455H9.54544C8.94295 15.5455 8.45453 16.0339 8.45453 16.6364Z" fill="white"/>
    <defs>
      <linearGradient id="home_grad0" x1="18.9727" y1="8.26884" x2="18.9727" y2="21.8182" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0077FA"/>
        <stop offset="1" stopColor="#113CC2"/>
      </linearGradient>
      <linearGradient id="home_grad1" x1="10.1946" y1="2" x2="10.1946" y2="21.8182" gradientUnits="userSpaceOnUse">
        <stop stopColor="#4DA3FF"/>
        <stop offset="1" stopColor="#0066DD"/>
      </linearGradient>
    </defs>
  </svg>
);

export default HomeIcon;
