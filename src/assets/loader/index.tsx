import React from "react";

type SpinnerProps = {
  size: number;
};

const Spinner: React.FC<SpinnerProps> = ({ size }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 50 50"
    role="img"
    aria-label="Loading"
    style={{ display: "inline-block" }}
  >
    <defs>
      <linearGradient id="spinnerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
        <stop offset="50%" stopColor="currentColor" stopOpacity="0.85" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="1" />
      </linearGradient>
    </defs>
    {/* Track */}
    <circle cx="25" cy="25" r="20" stroke="currentColor" strokeWidth="4" opacity="0.15" fill="none" />
    {/* Arc */}
    <circle
      cx="25"
      cy="25"
      r="20"
      stroke="url(#spinnerGradient)"
      strokeWidth="4"
      strokeLinecap="round"
      fill="none"
      strokeDasharray="80"
      strokeDashoffset="60"
      transform="rotate(0 25 25)"
    >
      <animateTransform
        attributeName="transform"
        type="rotate"
        from="0 25 25"
        to="360 25 25"
        dur="0.9s"
        repeatCount="indefinite"
      />
    </circle>
  </svg>
);

export const LottieSmall = () => <Spinner size={20} />;

export const LottieMedium = () => <Spinner size={30} />;

export const LottieLarge = () => <Spinner size={90} />;
