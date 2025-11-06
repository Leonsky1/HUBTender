import React from 'react';

interface LogoIconProps {
  size?: number;
  className?: string;
  color?: string;
}

/**
 * Modern construction/building logo icon for TenderHub
 * Features a geometric building/crane design suitable for sidebar logo
 */
export const LogoIcon: React.FC<LogoIconProps> = ({
  size = 24,
  className = '',
  color = 'currentColor'
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="TenderHub Logo"
    >
      {/* Base building structure */}
      <path
        d="M3 21V9L8 5L13 9V21H3Z"
        fill={color}
        fillOpacity="0.2"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Building windows */}
      <rect
        x="5"
        y="11"
        width="2"
        height="2"
        fill={color}
        rx="0.5"
      />
      <rect
        x="9"
        y="11"
        width="2"
        height="2"
        fill={color}
        rx="0.5"
      />
      <rect
        x="5"
        y="15"
        width="2"
        height="2"
        fill={color}
        rx="0.5"
      />
      <rect
        x="9"
        y="15"
        width="2"
        height="2"
        fill={color}
        rx="0.5"
      />

      {/* Crane tower */}
      <path
        d="M15 21V7"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Crane arm */}
      <path
        d="M13 7H21"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Crane hook */}
      <path
        d="M19 7V11"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Crane counterweight */}
      <circle
        cx="15"
        cy="7"
        r="1.5"
        fill={color}
      />

      {/* Ground line */}
      <path
        d="M2 21H22"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default LogoIcon;
