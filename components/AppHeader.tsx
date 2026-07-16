"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LogOut, Menu, X, Home, ClipboardList, CalendarRange, Users, ClipboardCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/use-permissions";
import { formatBusinessRole } from "@/lib/format-business-role";

export default function AppHeader() {
  const { data: session } = useSession();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const { canReadPermitter, canReadSchedule, canCreateUser, canReadSurvey } = usePermissions();

  if (!session?.user) return null;

  const navLinks = [
    {
      label: "Main Menu",
      icon: Home,
      href: "/dashboard",
      show: true,
    },
    {
      label: "Permitters",
      icon: ClipboardList,
      href: "/permitters",
      show: canReadPermitter,
    },
    {
      label: "Schedule",
      icon: CalendarRange,
      href: "/schedule",
      show: canReadSchedule,
    },
    {
      label: "Survey",
      icon: ClipboardCheck,
      href: "/survey",
      show: canReadSurvey,
    },
    {
      label: "Users",
      icon: Users,
      href: "/users",
      show: canCreateUser,
    },
  ];

  const visibleLinks = navLinks.filter((l) => l.show);
  // businessRole is available at runtime from auth.ts — cast for type safety
  const roleLabel = formatBusinessRole(
    (session.user as { businessRole?: string }).businessRole,
    session.user.role,
    session.user.level
  );

  return (
    <header className="sticky top-0 z-50 w-full bg-sgm-red shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center"
          aria-label="Go to main menu"
        >
          <img
            src="/SGM_logo.svg"
            alt="SGM"
            width={128}
            height={128}
            className="h-12 w-auto"
          />
        </button>

        <nav className="hidden items-center gap-1 md:flex">
          {visibleLinks.map((link) => (
            <Button
              key={link.href}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 hover:text-white"
              onClick={() => router.push(link.href)}
            >
              <link.icon className="mr-1.5 h-4 w-4" />
              {link.label}
            </Button>
          ))}
          <div className="mx-2 h-5 w-px bg-white/30" />
          <span className="text-sm text-white/90">{roleLabel}</span>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10 hover:text-white"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </nav>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-lg text-white md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-white/20 bg-sgm-red px-4 pb-4 pt-2 md:hidden">
          <div className="mb-3 text-sm text-white/80">
            {session.user.name} · {roleLabel}
          </div>
          <div className="flex flex-col gap-1">
            {visibleLinks.map((link) => (
              <Button
                key={link.href}
                variant="ghost"
                className="justify-start text-white hover:bg-white/10 hover:text-white"
                onClick={() => {
                  router.push(link.href);
                  setMenuOpen(false);
                }}
              >
                <link.icon className="mr-2 h-4 w-4" /> {link.label}
              </Button>
            ))}
            <Button
              variant="ghost"
              className="justify-start text-white/90 hover:bg-white/10 hover:text-white"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
