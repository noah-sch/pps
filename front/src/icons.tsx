// ── Push Pull Skip — minimal line icons (simple geometric strokes) ──────────
import type { SVGProps, ReactNode } from "react";

export type IconProps = Omit<SVGProps<SVGSVGElement>, "d" | "stroke"> & {
  size?: number;
  stroke?: number;
  d?: string;
  children?: ReactNode;
};

const Icon = ({ d, size = 20, stroke = 1.6, children, ...p }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...p}
  >
    {d ? <path d={d} /> : children}
  </svg>
);

export const Icons = {
  History: (p: IconProps) => (
    <Icon {...p}>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h10" />
    </Icon>
  ),
  Plus: (p: IconProps) => (
    <Icon {...p}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </Icon>
  ),
  Timer: (p: IconProps) => (
    <Icon {...p}>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 13V9" />
      <path d="M9 2h6" />
    </Icon>
  ),
  Trend: (p: IconProps) => (
    <Icon {...p}>
      <path d="M4 16l5-5 4 4 7-8" />
      <path d="M20 7h-4M20 7v4" />
    </Icon>
  ),
  Arrow: (p: IconProps) => (
    <Icon {...p}>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </Icon>
  ),
  ArrowUp: (p: IconProps) => (
    <Icon {...p}>
      <path d="M12 19V5" />
      <path d="M6 11l6-6 6 6" />
    </Icon>
  ),
  Check: (p: IconProps) => (
    <Icon {...p}>
      <path d="M4 12l5 5L20 6" />
    </Icon>
  ),
  X: (p: IconProps) => (
    <Icon {...p}>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </Icon>
  ),
  Play: (p: IconProps) => (
    <Icon {...p}>
      <path d="M7 5l12 7-12 7V5z" />
    </Icon>
  ),
  Pause: (p: IconProps) => (
    <Icon {...p}>
      <path d="M8 5v14" />
      <path d="M16 5v14" />
    </Icon>
  ),
  Flag: (p: IconProps) => (
    <Icon {...p}>
      <path d="M5 21V4" />
      <path d="M5 4h11l-2 4 2 4H5" />
    </Icon>
  ),
  Trophy: (p: IconProps) => (
    <Icon {...p}>
      <path d="M7 4h10v4a5 5 0 01-10 0V4z" />
      <path d="M7 6H4v1a3 3 0 003 3" />
      <path d="M17 6h3v1a3 3 0 01-3 3" />
      <path d="M12 13v4" />
      <path d="M8 21h8" />
      <path d="M9 21v-2h6v2" />
    </Icon>
  ),
  Calendar: (p: IconProps) => (
    <Icon {...p}>
      <rect x="4" y="5" width="16" height="16" rx="2" />
      <path d="M4 9h16" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
    </Icon>
  ),
  Logout: (p: IconProps) => (
    <Icon {...p}>
      <path d="M14 4H6a2 2 0 00-2 2v12a2 2 0 002 2h8" />
      <path d="M16 12H9" />
      <path d="M13 8l4 4-4 4" />
    </Icon>
  ),
  Dumbbell: (p: IconProps) => (
    <Icon {...p}>
      <path d="M3 9v6" />
      <path d="M6 7v10" />
      <path d="M18 7v10" />
      <path d="M21 9v6" />
      <path d="M6 12h12" />
    </Icon>
  ),
  Clock: (p: IconProps) => (
    <Icon {...p}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </Icon>
  ),
  Bookmark: (p: IconProps) => (
    <Icon {...p}>
      <path d="M6 4h12v16l-6-4-6 4V4z" />
    </Icon>
  ),
  Trash: (p: IconProps) => (
    <Icon {...p}>
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M10 11v6M14 11v6" />
    </Icon>
  ),
  User: (p: IconProps) => (
    <Icon {...p}>
      <circle cx="12" cy="8" r="4" />
      <path d="M5 21a7 7 0 0114 0" />
    </Icon>
  ),
  Edit: (p: IconProps) => (
    <Icon {...p}>
      <path d="M4 20h4L19 9l-4-4L4 16v4z" />
      <path d="M13.5 6.5l4 4" />
    </Icon>
  ),
  Moon: (p: IconProps) => (
    <Icon {...p}>
      <path d="M20 14.5A8 8 0 119.5 4a6.5 6.5 0 0010.5 10.5z" />
    </Icon>
  ),
  Sun: (p: IconProps) => (
    <Icon {...p}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" />
    </Icon>
  ),
  Globe: (p: IconProps) => (
    <Icon {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.5 2.5 3.5 5.7 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.7-3.5-9s1-6.5 3.5-9z" />
    </Icon>
  ),
  Camera: (p: IconProps) => (
    <Icon {...p}>
      <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z" />
      <circle cx="12" cy="13" r="3.2" />
    </Icon>
  ),
};

export type IconName = keyof typeof Icons;
