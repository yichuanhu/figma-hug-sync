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
    {/* 后面的小文件夹 */}
    <path d="M1.09088 10.9091C1.09088 9.70411 2.06771 8.72727 3.2727 8.72727H7.96808C8.55339 8.72727 9.11416 8.96245 9.52438 9.37995L11.3745 11.2629C11.7753 11.6709 12 12.22 12 12.792V20.7273C12 21.9323 11.0231 22.9091 9.81815 22.9091H3.2727C2.06771 22.9091 1.09088 21.9323 1.09088 20.7273V10.9091Z" fill="url(#req_grad0)"/>
    {/* 主文档 */}
    <path d="M7.63635 5.45455C7.63635 3.04458 9.59002 1.09091 12 1.09091H16.66C17.8632 1.09091 19.013 1.58771 19.8376 2.46387L21.723 4.46711C22.4849 5.27656 22.9091 6.34622 22.9091 7.45779V17.4545C22.9091 19.8645 20.9554 21.8182 18.5454 21.8182H12C9.59002 21.8182 7.63635 19.8645 7.63635 17.4545V5.45455Z" fill="url(#req_grad1)"/>
    {/* 文本线条 */}
    <path d="M19.0909 13.3636C19.5428 13.3636 19.9091 13.7299 19.9091 14.1818C19.9091 14.6337 19.5428 15 19.0909 15H11.4545C11.0027 15 10.6364 14.6337 10.6364 14.1818C10.6364 13.7299 11.0027 13.3636 11.4545 13.3636H19.0909Z" fill="white"/>
    <path d="M14.7273 9C15.1791 9 15.5454 9.36631 15.5454 9.81818C15.5454 10.2701 15.1791 10.6364 14.7273 10.6364H11.4545C11.0027 10.6364 10.6364 10.2701 10.6364 9.81818C10.6364 9.36631 11.0027 9 11.4545 9H14.7273Z" fill="white"/>
    <defs>
      <linearGradient id="req_grad0" x1="6.54543" y1="8.72727" x2="6.54543" y2="22.9091" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0077FA"/>
        <stop offset="1" stopColor="#113CC2"/>
      </linearGradient>
      <linearGradient id="req_grad1" x1="15.2727" y1="1" x2="15.2727" y2="21.8182" gradientUnits="userSpaceOnUse">
        <stop stopColor="#4DA3FF"/>
        <stop offset="1" stopColor="#0066DD"/>
      </linearGradient>
    </defs>
  </svg>
);

export default RequirementsIcon;
