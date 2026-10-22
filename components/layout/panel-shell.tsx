"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Header } from "@/components/layout/header";
import { BottomNav, NavDrawer } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";
import type { SessionUser } from "@/lib/session";

/** Marco del panel: barra lateral fija, cabecera pegajosa y cajón en móvil. */
export function PanelShell({
  user,
  sportNames,
  children,
}: {
  user: SessionUser;
  sportNames: Record<string, string>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // El cajón no debe sobrevivir a un cambio de ruta.
  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <div className="min-h-screen bg-cream">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] lg:block">
        <Sidebar user={user} />
      </aside>

      <NavDrawer
        user={user}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />

      <div className="flex min-h-screen flex-col lg:pl-[264px]">
        <Header sportNames={sportNames} onOpenMenu={() => setMenuOpen(true)} />
        <main
          key={pathname}
          className="flex-1 animate-rise-in px-5 pb-24 pt-6 md:px-9 md:pb-10 md:pt-8"
        >
          <div className="mx-auto flex w-full max-w-[1140px] flex-col gap-5 md:gap-[22px]">
            {children}
          </div>
        </main>
      </div>

      <BottomNav user={user} />
    </div>
  );
}
