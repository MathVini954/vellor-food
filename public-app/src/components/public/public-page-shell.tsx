import clsx from "clsx";
import type { ReactNode } from "react";
import { MobileBottomNav } from "./mobile-bottom-nav";

type PublicPageShellProps = {
  slug: string;
  activeTab?: "home" | "menu" | "cart" | "profile";
  withBottomNav?: boolean;
  children: ReactNode;
  className?: string;
};

export function PublicPageShell({
  slug,
  activeTab,
  withBottomNav = false,
  children,
  className,
}: PublicPageShellProps) {
  return (
    <>
      <div className="app-shell min-h-screen">
        <div className="relative min-h-screen bg-[linear-gradient(180deg,#fffdf9_0%,#fff6ee_52%,#fffefb_100%)]">
          <div className="absolute inset-x-0 top-0 h-44 bg-[radial-gradient(circle_at_top,_rgba(225,70,52,0.14),_transparent_68%)]" />
          <div className={clsx("relative min-h-screen", withBottomNav && "pb-20", className)}>
            {children}
          </div>
        </div>
      </div>
      {withBottomNav && activeTab ? <MobileBottomNav slug={slug} activeTab={activeTab} /> : null}
    </>
  );
}
