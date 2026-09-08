"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListChecks, GraduationCap, Wallet, CalendarClock } from "lucide-react";
import { theme } from "@/lib/theme";

const tabs = [
  { href: "/", label: "HOME", icon: Home },
  { href: "/assignments", label: "TASKS", icon: ListChecks },
  { href: "/exams", label: "EXAMS", icon: GraduationCap },
  { href: "/finance", label: "MONEY", icon: Wallet },
  { href: "/schedule", label: "SCHED", icon: CalendarClock },
];

export function BottomTabBar() {
  const pathname = usePathname();
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 flex justify-around border-t z-40"
      style={{ backgroundColor: theme.panel, borderColor: theme.border }}
    >
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link key={href} href={href} className="flex flex-col items-center gap-0.5 py-2.5 flex-1 text-[10px] tracking-widest"
            style={{ color: active ? theme.accent : theme.inkMuted }}>
            <Icon size={18} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
