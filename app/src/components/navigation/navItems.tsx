export type AppNavItem = {
  href: string;
  label: string;
};

export const navItems: AppNavItem[] = [
  { href: "/encyclopedia", label: "图鉴" },
  { href: "/identify", label: "识鱼" },
  { href: "/feedback", label: "反馈" },
];
