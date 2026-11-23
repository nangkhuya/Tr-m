import React from 'react';

interface TeacupIconProps {
  liquorColor: string;
  liquorHighlight: string;
  rimColor?: string;
  size?: number;
  withSteam?: boolean;
  rippleActive?: boolean;
}

export const TeacupIcon: React.FC<TeacupIconProps> = ({
  liquorColor,
  liquorHighlight,
  rimColor = '#D8D1C2',
  size = 56,
  withSteam = false,
  rippleActive = false,
}) => {
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      {rippleActive && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-1 rounded-full border border-[#8C6D53]/50 animate-tea-ripple"
        />
      )}
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {withSteam && (
          <g className="animate-steam-slow" stroke="currentColor" strokeOpacity="0.35" strokeLinecap="round">
            <path d="M26 16C24 12 28 9 26 5" strokeWidth="1.3" />
            <path d="M35 15C37 11 33 8 35 4" strokeWidth="1.2" className="animate-steam-delayed" />
          </g>
        )}
        {/* Saucer shadow */}
        <ellipse cx="32" cy="48" rx="22" ry="6" fill="currentColor" fillOpacity="0.06" />
        {/* Cup body */}
        <path
          d="M14 28C14 40.5 21 47 32 47C43 47 50 40.5 50 28H14Z"
          fill="#EDE4D2"
          stroke={rimColor}
          strokeWidth="1.4"
        />
        {/* Cup rim */}
        <ellipse cx="32" cy="28" rx="18" ry="6.2" fill="#F9F5EB" stroke={rimColor} strokeWidth="1.3" />
        {/* Tea liquor */}
        <ellipse cx="32" cy="28.5" rx="15.2" ry="4.7" fill={liquorColor} />
        {/* Subtle liquor reflection */}
        <ellipse cx="29" cy="27.8" rx="7.5" ry="1.8" fill={liquorHighlight} fillOpacity="0.65" />
      </svg>
    </div>
  );
};

export const TeaBranchArtwork: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 180 90"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M172 14C135 32 102 48 34 62"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
    <path
      d="M126 35C114 20 96 17 86 24C98 31 112 36 126 35Z"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
    <path
      d="M95 47C84 62 68 68 56 64C68 54 81 48 95 47Z"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
    <path
      d="M66 55C54 41 38 38 28 45C40 52 54 56 66 55Z"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
  </svg>
);

export const RedSealStamp: React.FC<{ size?: 'sm' | 'md' }> = ({ size = 'md' }) => {
  const dims = size === 'sm' ? 'w-11 h-11 text-[10px]' : 'w-14 h-14 text-xs';
  return (
    <div
      className={`${dims} inline-flex flex-col items-center justify-center bg-[#A63A3A] text-[#F9F5EB] border border-[#F9F5EB]/50 p-1 select-none shrink-0`}
      style={{ boxShadow: 'inset 0 0 0 2px #A63A3A, inset 0 0 0 3px rgba(249,245,235,0.45)' }}
      aria-label="Triện đỏ Trà Đàm"
    >
      <span className="font-serif-editorial font-bold leading-tight tracking-wider">TRÀ</span>
      <span className="font-serif-editorial font-bold leading-tight tracking-wider">ĐÀM</span>
    </div>
  );
};

interface TeaPourRitualOverlayProps {
  teaName: string;
  liquorColor: string;
  liquorHighlight: string;
}

export const TeaPourRitualOverlay: React.FC<TeaPourRitualOverlayProps> = ({
  teaName,
  liquorColor,
  liquorHighlight,
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F3EDE0]/96 dark:bg-[#12110F]/96 backdrop-blur-sm transition-opacity duration-500"
    >
      <div className="relative w-64 h-64 flex items-center justify-center">
        <svg viewBox="0 0 240 240" className="w-full h-full" fill="none" aria-hidden="true">
          {/* Tilted ceramic teapot */}
          <g className="origin-[85px_75px] transition-transform duration-700" style={{ transform: 'rotate(24deg)' }}>
            <path
              d="M52 54C52 44 62 36 76 36H94C108 36 118 44 118 54V82C118 93 108 100 94 100H76C62 100 52 93 52 82V54Z"
              fill="#EAE2D3"
              stroke="#8C6D53"
              strokeWidth="1.6"
            />
            <path
              d="M116 66L142 52C145 50 148 53 146 57L120 79"
              fill="#EAE2D3"
              stroke="#8C6D53"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path
              d="M52 60C40 58 34 66 36 76C38 84 46 86 52 84"
              stroke="#8C6D53"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <ellipse cx="85" cy="36" rx="16" ry="4" fill="#D9CEBC" stroke="#8C6D53" strokeWidth="1.4" />
            <circle cx="85" cy="30" r="3.5" fill="#8C6D53" />
          </g>

          {/* Animated warm tea stream */}
          <path
            d="M150 96C152 122 148 144 146 164"
            stroke={liquorColor}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray="120"
            strokeDashoffset="0"
          >
            <animate
              attributeName="stroke-dashoffset"
              values="120;0;0"
              keyTimes="0;0.45;1"
              dur="1.5s"
              repeatCount="1"
            />
          </path>

          {/* Rising steam wisps */}
          <g className="animate-steam-slow" stroke="#8C6D53" strokeOpacity="0.45" strokeLinecap="round">
            <path d="M134 148C130 136 138 128 134 116" strokeWidth="1.5" />
            <path d="M156 146C160 134 152 126 156 114" strokeWidth="1.4" />
          </g>

          {/* Waiting teacup */}
          <ellipse cx="146" cy="196" rx="44" ry="8" fill="#8C6D53" fillOpacity="0.1" />
          <path
            d="M112 162C112 184 126 194 146 194C166 194 180 184 180 162H112Z"
            fill="#EDE4D2"
            stroke="#7D5E43"
            strokeWidth="1.6"
          />
          <ellipse cx="146" cy="162" rx="34" ry="9" fill="#F9F5EB" stroke="#7D5E43" strokeWidth="1.5" />
          <ellipse cx="146" cy="163" rx="28" ry="6.8" fill={liquorColor}>
            <animate attributeName="rx" values="6;28" dur="1.2s" fill="freeze" />
            <animate attributeName="ry" values="1.5;6.8" dur="1.2s" fill="freeze" />
          </ellipse>
          <ellipse cx="141" cy="162" rx="12" ry="2.6" fill={liquorHighlight} fillOpacity="0.55" />
        </svg>
      </div>
      <p className="font-serif-editorial text-xl text-[#1B1917] dark:text-[#EDE5D5] tracking-wide mt-2">
        Khai ấm {teaName}
      </p>
      <p className="text-sm text-[#5C554C] dark:text-[#A89F91] mt-2">
        Chậm lại một nhịp thở trước khi bước vào trà thất...
      </p>
    </div>
  );
};
