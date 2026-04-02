"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { WorkspaceSwitcher } from "@/components/workspaces/workspace-switcher";
import type { ProfileSummary, WorkspaceSummary } from "@/lib/types/workspaces";
import { asRoute } from "@/lib/utils/as-route";
import { getDisplayName } from "@/lib/utils/display-name";
import { cn } from "@/lib/utils/cn";
import {
  ActivityIcon,
  ChatIcon,
  FileStackIcon,
  HomeIcon,
  MenuIcon,
  SearchIcon,
  SettingsIcon,
  SparkIcon,
  UserIcon,
} from "@/components/ui/icons";

type AppShellProps = {
  children: ReactNode;
  profile: ProfileSummary;
  workspaces: WorkspaceSummary[];
};

type NavigationItem = {
  href: string;
  icon: ReactNode;
  label: string;
  secondary?: string;
};

function isActivePath(pathname: string, href: string) {
  if (href === "/app") {
    return pathname === "/app";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function getShellContext(pathname: string, workspaceName?: string) {
  if (pathname === "/app") {
    return {
      eyebrow: "Control center",
      summary:
        "Track tenant foundations, jump between workspaces, and keep the whole product surface coherent before search and ingestion land.",
      title: "Workspace dashboard",
    };
  }

  if (pathname === "/app/account") {
    return {
      eyebrow: "Account profile",
      summary:
        "Review identity, access posture, and workspace footprint from one quiet, high-signal surface.",
      title: "Profile and account settings",
    };
  }

  if (workspaceName) {
    return {
      eyebrow: "Active workspace",
      summary:
        "This shell keeps role context, navigation, and operational defaults visible without turning the interface into a generic dashboard grid.",
      title: workspaceName,
    };
  }

  return {
    eyebrow: "Product shell",
    summary: "Core navigation and operational surfaces for the AI knowledge base.",
    title: "AI Knowledge Base",
  };
}

function NavLink({
  href,
  icon,
  isActive,
  label,
  onClick,
  secondary,
}: NavigationItem & {
  isActive: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      className={cn(
        "group flex items-center justify-between gap-4 rounded-[1.2rem] px-4 py-3 text-sm transition duration-200",
        isActive
          ? "bg-white/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
          : "text-slate-300 hover:bg-white/8 hover:text-white",
      )}
      href={asRoute(href)}
      {...(isActive ? { "aria-current": "page" as const } : {})}
      {...(onClick ? { onClick } : {})}
    >
      <span className="flex items-center gap-3">
        <span
          className={cn(
            "inline-flex size-9 items-center justify-center rounded-full border text-sm transition",
            isActive
              ? "border-white/14 bg-white/10 text-white"
              : "border-white/8 bg-white/4 text-slate-300 group-hover:border-white/14 group-hover:bg-white/8 group-hover:text-white",
          )}
        >
          {icon}
        </span>
        <span className="flex flex-col">
          <span className="font-medium">{label}</span>
          {secondary ? <span className="text-xs text-slate-400">{secondary}</span> : null}
        </span>
      </span>
      <span
        className={cn(
          "h-2.5 w-2.5 rounded-full transition",
          isActive ? "bg-amber-300" : "bg-transparent group-hover:bg-white/30",
        )}
      />
    </Link>
  );
}

export function AppShell({ children, profile, workspaces }: AppShellProps) {
  const pathname = usePathname();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const displayName = getDisplayName(profile, profile.email);
  const pathnameSegments = pathname.split("/").filter(Boolean);
  const currentWorkspaceSlug =
    pathnameSegments[0] === "app" && pathnameSegments[1] && pathnameSegments[1] !== "account"
      ? pathnameSegments[1]
      : null;
  const currentWorkspace = useMemo(() => {
    if (!currentWorkspaceSlug) {
      return null;
    }

    return workspaces.find((workspace) => workspace.slug === currentWorkspaceSlug) ?? null;
  }, [currentWorkspaceSlug, workspaces]);
  const shellContext = getShellContext(pathname, currentWorkspace?.name);

  const primaryNav: NavigationItem[] = [
    {
      href: "/app",
      icon: <HomeIcon />,
      label: "Dashboard",
      secondary: "Shell overview",
    },
    {
      href: "/app/account",
      icon: <UserIcon />,
      label: "Account",
      secondary: "Profile and access",
    },
  ];

  const workspaceNav: NavigationItem[] = currentWorkspace
    ? [
        {
          href: `/app/${currentWorkspace.slug}`,
          icon: <SparkIcon />,
          label: "Overview",
          secondary: "Signal and posture",
        },
        {
          href: `/app/${currentWorkspace.slug}/search`,
          icon: <SearchIcon />,
          label: "Search",
          secondary: "Retrieval surface",
        },
        {
          href: `/app/${currentWorkspace.slug}/documents`,
          icon: <FileStackIcon />,
          label: "Documents",
          secondary: "Corpus management",
        },
        {
          href: `/app/${currentWorkspace.slug}/conversations`,
          icon: <ChatIcon />,
          label: "Conversations",
          secondary: "Grounded answer threads",
        },
        {
          href: `/app/${currentWorkspace.slug}/activity`,
          icon: <ActivityIcon />,
          label: "Activity",
          secondary: "Audit surface",
        },
        ...(currentWorkspace.role === "admin" || currentWorkspace.role === "owner"
          ? [
              {
                href: `/app/${currentWorkspace.slug}/settings`,
                icon: <SettingsIcon />,
                label: "Settings",
                secondary: "Workspace defaults",
              },
            ]
          : []),
      ]
    : [];

  const sidebar = (
    <div className="app-noise relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-[var(--app-sidebar-border)] bg-[linear-gradient(180deg,rgba(19,28,41,0.98),rgba(14,22,33,0.96))] p-5 shadow-[var(--app-shadow-strong)]">
      <div className="app-shell-glow left-[-2rem] top-[-1rem] h-28 w-28 bg-cyan-400/16" />
      <div className="app-shell-glow bottom-[-2rem] right-[-1rem] h-28 w-28 bg-amber-300/12" />
      <div className="relative">
        <Link
          className="inline-flex items-center gap-3 text-sm font-semibold tracking-[0.18em] text-white uppercase"
          href={asRoute("/app")}
          onClick={() => setIsMobileNavOpen(false)}
        >
          <span className="inline-flex size-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#155e75,#0f766e)] text-xs font-bold tracking-[0.24em] text-white shadow-[0_18px_40px_-24px_rgba(21,94,117,0.9)]">
            AK
          </span>
          AI Knowledge Base
        </Link>

        <div className="mt-6 rounded-[1.5rem] border border-white/8 bg-white/6 p-4">
          <p className="text-xs font-semibold tracking-[0.16em] text-slate-400 uppercase">
            Session
          </p>
          <p className="mt-3 text-lg font-medium text-white">{displayName}</p>
          <p className="mt-1 text-sm text-slate-400">{profile.email ?? "No email available"}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge className="border-white/10 bg-white/8 text-slate-200">Authenticated</Badge>
            <Badge className="border-cyan-400/20 bg-cyan-400/10 text-cyan-100">
              {workspaces.length} workspace{workspaces.length === 1 ? "" : "s"}
            </Badge>
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-3 text-xs font-semibold tracking-[0.16em] text-slate-400 uppercase">
            Workspace switcher
          </p>
          <WorkspaceSwitcher
            ariaLabel="Switch active workspace"
            className="border-white/10 bg-white/8 text-white"
            workspaces={workspaces}
          />
        </div>

        <nav aria-label="Primary navigation" className="mt-8 space-y-2">
          <p className="px-1 pb-2 text-xs font-semibold tracking-[0.16em] text-slate-400 uppercase">
            Control center
          </p>
          {primaryNav.map((item) => (
            <NavLink
              key={item.href}
              {...item}
              isActive={isActivePath(pathname, item.href)}
              onClick={() => setIsMobileNavOpen(false)}
            />
          ))}
        </nav>

        {currentWorkspace ? (
          <nav aria-label="Workspace navigation" className="mt-8 space-y-2">
            <p className="px-1 pb-2 text-xs font-semibold tracking-[0.16em] text-slate-400 uppercase">
              {currentWorkspace.name}
            </p>
            {workspaceNav.map((item) => (
              <NavLink
                key={item.href}
                {...item}
                isActive={isActivePath(pathname, item.href)}
                onClick={() => setIsMobileNavOpen(false)}
              />
            ))}
          </nav>
        ) : null}
      </div>

      <div className="relative mt-auto pt-8">
        <div className="rounded-[1.5rem] border border-white/8 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-4">
          <p className="text-xs font-semibold tracking-[0.16em] text-slate-400 uppercase">
            Shell status
          </p>
          <p className="mt-3 text-base font-medium text-white">
            Frontend foundation is live.
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Search, documents, conversations, and activity routes are shaped as premium
            empty-state surfaces until their backend phases land.
          </p>
        </div>
        <div className="mt-4">
          <SignOutButton />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--app-background)] text-[var(--app-foreground)]">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[30rem] bg-[radial-gradient(circle_at_top_left,_rgba(21,94,117,0.18),_transparent_58%)]" />
        <div className="absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_top_right,_rgba(180,83,9,0.1),_transparent_44%)]" />
        <div className="absolute left-[-6rem] top-72 h-80 w-80 rounded-full bg-cyan-600/10 blur-3xl" />
        <div className="absolute right-[-8rem] top-20 h-96 w-96 rounded-full bg-amber-400/8 blur-3xl" />
      </div>

      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-0 px-3 py-3 sm:px-4 lg:px-6">
        <aside className="hidden w-[21rem] shrink-0 lg:block">{sidebar}</aside>

        <div className="flex min-h-[calc(100vh-1.5rem)] min-w-0 flex-1 flex-col lg:pl-6">
          <header className="sticky top-0 z-30 px-1 py-1">
            <div className="rounded-[1.8rem] border border-[var(--app-border)] bg-white/72 px-4 py-4 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.22)] backdrop-blur-xl sm:px-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3 lg:hidden">
                  <button
                    aria-controls="mobile-app-sidebar"
                    aria-expanded={isMobileNavOpen}
                    className={buttonStyles({ size: "sm", variant: "secondary" })}
                    onClick={() => setIsMobileNavOpen(true)}
                    type="button"
                  >
                    <MenuIcon />
                    Menu
                  </button>

                  <div className="min-w-0 flex-1">
                    <WorkspaceSwitcher
                      ariaLabel="Switch active workspace from the top bar"
                      className="w-full"
                      workspaces={workspaces}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold tracking-[0.22em] text-teal-700 uppercase">
                      {shellContext.eyebrow}
                    </p>
                    <h1 className="mt-2 text-[var(--text-title)] leading-none text-slate-950">
                      {shellContext.title}
                    </h1>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--app-foreground-soft)] sm:text-base">
                      {shellContext.summary}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {currentWorkspace ? (
                      <>
                        <Badge className="border-teal-700/16 bg-teal-700/8 text-teal-800">
                          {currentWorkspace.role}
                        </Badge>
                        <Badge className="border-amber-400/30 bg-amber-100/70 text-amber-900">
                          /{currentWorkspace.slug}
                        </Badge>
                      </>
                    ) : (
                      <Badge className="border-slate-300 bg-white text-slate-700">
                        {workspaces.length > 0 ? "Select a workspace to dive deeper" : "No workspace yet"}
                      </Badge>
                    )}
                    <Badge className="border-cyan-700/14 bg-cyan-700/8 text-cyan-900">
                      Responsive shell
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="app-grid flex-1 px-1 pb-8 pt-4 sm:pt-6">{children}</main>
        </div>
      </div>

      {isMobileNavOpen ? (
        <div className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden">
          <button
            aria-label="Close navigation overlay"
            className="absolute inset-0"
            onClick={() => setIsMobileNavOpen(false)}
            type="button"
          />
          <div className="absolute inset-y-0 left-0 w-[min(88vw,22rem)] p-3">
            <aside
              className="h-full"
              id="mobile-app-sidebar"
            >
              {sidebar}
            </aside>
          </div>
        </div>
      ) : null}
    </div>
  );
}
