import { SVGProps, useId } from "react";

export function CameraIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M3 8.5a3 3 0 0 1 3-3h2l1-1.5h6l1 1.5h2a3 3 0 0 1 3 3V18a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V8.5Z" />
      <circle cx="12" cy="13.5" r="3.5" />
      <circle cx="18" cy="9" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function PhotoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m7 14 2.5-3 2.5 3 2-2.5L17 14" />
      <circle cx="8" cy="9" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FeedbackIcon(props: SVGProps<SVGSVGElement>) {
  const baseId = useId().replace(/:/g, "");
  const gradientId = `${baseId}-feedback-gradient`;
  const highlightId = `${baseId}-feedback-highlight`;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      {...props}
    >
      <defs>
        <linearGradient id={gradientId} x1="8" y1="5" x2="16" y2="16" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7DD3FC" />
          <stop offset="0.6" stopColor="#38BDF8" />
          <stop offset="1" stopColor="#0EA5E9" />
        </linearGradient>
        <linearGradient id={highlightId} x1="9" y1="6" x2="13.5" y2="9" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g fill="none">
        <path
          d="M7 7.2c0-1.33 1.17-2.2 2.61-2.2h4.78C15.83 5 17 5.87 17 7.2v4.1c0 1.33-1.17 2.2-2.61 2.2h-1.37l-1.86 1.4c-.65.49-1.56.02-1.56-.79v-.61H9.61C8.17 13.6 7 12.73 7 11.4Z"
          fill={`url(#${gradientId})`}
        />
        <path
          d="M8.5 6.4c.66-.74 1.7-1.14 2.96-1.14h1.08c1.26 0 2.3.4 2.96 1.14l-.92.86c-.58-.32-1.32-.52-2.18-.52h-1.08c-.86 0-1.6.2-2.18.52l-.92-.86Z"
          fill={`url(#${highlightId})`}
          opacity={0.7}
        />
        <path
          d="M7.7 7.2c0-1.02.96-1.84 2.14-1.84h4.32c1.18 0 2.14.82 2.14 1.84v3.54c0 1.02-.96 1.84-2.14 1.84h-1.16l-1.58 1.2c-.44.33-1.04.01-1.04-.5v-.7H9.84c-1.18 0-2.14-.82-2.14-1.84Z"
          stroke="#0EA5E9"
          strokeWidth="0.7"
          opacity={0.5}
        />
        <path
          d="M9.4 9.7h5.2M9.4 12.1h3.1"
          stroke="#0EA5E9"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

// 邮箱图标已移除
