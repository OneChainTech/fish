import { SVGProps } from "react";

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

// 邮箱图标已移除
