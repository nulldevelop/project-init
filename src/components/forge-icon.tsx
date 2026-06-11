interface ForgeIconProps {
  className?: string;
}

export function ForgeIcon({ className }: ForgeIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Outer flame — ligeiramente assimétrica, inclina pra direita */}
      <path
        d="M13 2C16 5 22 10 22 15C22 19.1 17.5 23 12 23C6.5 23 2 19.1 2 15C2 10 8 5 11 2C10.5 4.5 11 7 13 8.5C12.5 6 12.5 4 13 2Z"
        fill="url(#fg-body)"
      />
      {/* Núcleo interno */}
      <path
        d="M12 10C13.5 12 16 14.5 16 17C16 18.7 14.2 20 12 20C9.8 20 8 18.7 8 17C8 14.5 10.5 12 12 10Z"
        fill="url(#fg-core)"
      />
      {/* Faísca no topo */}
      <line x1="13" y1="2" x2="14.5" y2="0.5" stroke="#fef3c7" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
      <line x1="11" y1="1.5" x2="9.5" y2="0" stroke="#fef3c7" strokeWidth="0.8" strokeLinecap="round" opacity="0.4" />

      <defs>
        <linearGradient id="fg-body" x1="12" y1="2" x2="12" y2="23" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fdba74" />
          <stop offset="40%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#991b1b" />
        </linearGradient>
        <linearGradient id="fg-core" x1="12" y1="10" x2="12" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fef9c3" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#fcd34d" stopOpacity="0.15" />
        </linearGradient>
      </defs>
    </svg>
  );
}
