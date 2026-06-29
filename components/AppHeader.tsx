"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LogOut, Menu, X, Home, ClipboardList } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/use-permissions";

export default function AppHeader() {
  const { data: session } = useSession();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const { canReadPermitter } = usePermissions();

  if (!session?.user) return null;

  const navLinks = [
    {
      label: "Dashboard",
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
  ];

  const visibleLinks = navLinks.filter((l) => l.show);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-lg font-bold text-blue-600"
        >
          MOBI
        </button>

        <nav className="hidden items-center gap-1 md:flex">
          {visibleLinks.map((link) => (
            <Button
              key={link.href}
              variant="ghost"
              size="sm"
              onClick={() => router.push(link.href)}
            >
              <link.icon className="mr-1.5 h-4 w-4" />
              {link.label}
            </Button>
          ))}
          <div className="mx-2 h-5 w-px bg-gray-200" />
          <span className="text-sm text-gray-500">{session.user.name}</span>
          <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
            <LogOut className="h-4 w-4" />
          </Button>
        </nav>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-lg md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t bg-white px-4 pb-4 pt-2 md:hidden">
          <div className="mb-3 text-sm text-gray-500">
            {session.user.name} · {session.user.role}
          </div>
          <div className="flex flex-col gap-1">
            {visibleLinks.map((link) => (
              <Button
                key={link.href}
                variant="ghost"
                className="justify-start"
                onClick={() => { router.push(link.href); setMenuOpen(false); }}
              >
                <link.icon className="mr-2 h-4 w-4" /> {link.label}
              </Button>
            ))}
            <Button variant="ghost" className="justify-start text-red-500" onClick={() => signOut({ callbackUrl: "/login" })}>
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
