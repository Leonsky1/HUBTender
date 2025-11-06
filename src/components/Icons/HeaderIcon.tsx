import React from 'react';

interface HeaderIconProps {
  size?: number;
  className?: string;
  color?: string;
}

/**
 * Modern home/dashboard icon for TenderHub header
 * Features a minimalist house design with geometric shapes
 */
export const HeaderIcon: React.FC<HeaderIconProps> = ({
  size = 64,
  className = '',
  color = '#ffffff'
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Dashboard Icon"
    >
      {/* Roof */}
      <path
        d="M8 30L32 10L56 30V32H8V30Z"
        fill={color}
        fillOpacity="0.9"
      />

      {/* Main house body */}
      <path
        d="M12 32H52V54C52 55.1046 51.1046 56 50 56H14C12.8954 56 12 55.1046 12 54V32Z"
        fill={color}
        fillOpacity="0.7"
      />

      {/* Door */}
      <rect
        x="26"
        y="42"
        width="12"
        height="14"
        rx="1"
        fill={color}
        fillOpacity="0.3"
      />

      {/* Left window */}
      <rect
        x="16"
        y="36"
        width="6"
        height="6"
        rx="1"
        fill={color}
        fillOpacity="0.3"
      />

      {/* Right window */}
      <rect
        x="42"
        y="36"
        width="6"
        height="6"
        rx="1"
        fill={color}
        fillOpacity="0.3"
      />

      {/* Chimney */}
      <rect
        x="42"
        y="16"
        width="6"
        height="12"
        rx="1"
        fill={color}
        fillOpacity="0.9"
      />

      {/* Roof outline for depth */}
      <path
        d="M8 30L32 10L56 30"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Door handle */}
      <circle
        cx="35"
        cy="49"
        r="1"
        fill={color}
      />
    </svg>
  );
};

export default HeaderIcon;
