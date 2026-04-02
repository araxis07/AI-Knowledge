import Link from "next/link";
import type { ReactNode } from "react";

import { SiteShell } from "@/components/layout/site-shell";
import { buttonStyles } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { asRoute } from "@/lib/utils/as-route";

type PublicLayoutProps = {
  children: ReactNode;
};

export default async function PublicLayout({ children }: PublicLayoutProps) {
  const user = await getCurrentUser();

  return (
    <SiteShell
      actions={
        user ? (
          <Link className={buttonStyles({ size: "sm" })} href={asRoute("/app")}>
            Open app
          </Link>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              className={buttonStyles({ size: "sm", variant: "ghost" })}
              href={asRoute("/sign-in")}
            >
              Sign in
            </Link>
            <Link
              className={buttonStyles({ className: "text-white", size: "sm", variant: "accent" })}
              href={asRoute("/sign-up")}
            >
              Create account
            </Link>
          </div>
        )
      }
      caption="Secure workspace foundation for AI-backed document search"
    >
      {children}
    </SiteShell>
  );
}
