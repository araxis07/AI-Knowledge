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
import { formatWorkspaceRoleLabel } from "@/lib/utils/workspace-labels";
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
      eyebrow: "Workspace hub",
      summary:
        "Open a workspace, create a new one, and keep the next step obvious without digging through menus.",
      title: "Start from a workspace, not from guesswork.",
    };
  }

  if (pathname === "/app/account") {
    return {
      eyebrow: "Profile",
      summary:
        "See who is signed in, what you can access, and which workspaces you can manage.",
      title: "Account and access",
    };
  }

  if (workspaceName) {
    return {
      eyebrow: "Workspace",
      summary:
        "Documents, search, chats, activity, and settings all stay inside this one workspace so the flow stays easy to follow.",
      title: workspaceName,
    };
  }

  return {
    eyebrow: "AI knowledge base",
    summary: "Core navigation and workspace surfaces for the product.",
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
        "group flex items-center justify-between gap-4 rounded-[1.25rem] border px-4 py-3 text-sm transition duration-200",
        isActive
          ? "border-white/14 bg-white/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
          : "border-transparent text-slate-300 hover:border-white/10 hover:bg-white/6 hover:text-white",
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
              ? "border-white/18 bg-white/12 text-white"
              : "border-white/8 bg-white/4 text-slate-300 group-hover:border-white/14 group-hover:bg-white/10 group-hover:text-white",
          )}
        >
          {icon}
        </span>
        <span className="flex flex-col">
          <span className="font-medium">{label}</span>
          {secondary ? <span className="text-xs text-slate-400/95">{secondary}</span> : null}
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
      label: "Home",
      secondary: "All workspaces",
    },
    {
      href: "/app/account",
      icon: <UserIcon />,
      label: "Profile",
      secondary: "Account and access",
    },
  ];

  const workspaceNav: NavigationItem[] = currentWorkspace
    ? [
        {
          href: `/app/${currentWorkspace.slug}`,
          icon: <SparkIcon />,
          label: "Overview",
          secondary: "Start here",
        },
        {
          href: `/app/${currentWorkspace.slug}/search`,
          icon: <SearchIcon />,
          label: "Search & ask",
          secondary: "Find answers",
        },
        {
          href: `/app/${currentWorkspace.slug}/documents`,
          icon: <FileStackIcon />,
          label: "Document library",
          secondary: "Files and status",
        },
        {
          href: `/app/${currentWorkspace.slug}/conversations`,
          icon: <ChatIcon />,
          label: "Chats",
          secondary: "Saved threads",
        },
        {
          href: `/app/${currentWorkspace.slug}/activity`,
          icon: <ActivityIcon />,
          label: "Activity",
          secondary: "Recent changes",
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

  const guideSteps = currentWorkspace
    ? [
        "Upload documents into this workspace.",
        "Wait for processing or review any failures.",
        "Search and ask questions from the same place.",
      ]
    : [
        "Create a workspace for a team, project, or client.",
        "Open that workspace and upload source files.",
        "Use search and chat once documents are ready.",
      ];

  const sidebar = (
    <div className="app-noise relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-[var(--app-sidebar-border)] bg-[linear-gradient(180deg,rgba(15,27,45,0.98),rgba(11,19,31,0.98))] p-5 shadow-[var(--app-shadow-strong)]">
      <div className="app-shell-glow left-[-2rem] top-[-1rem] h-28 w-28 bg-cyan-400/18" />
      <div className="app-shell-glow bottom-[-2rem] right-[-1rem] h-28 w-28 bg-amber-300/14" />
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

        <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/7 p-4">
          <p className="text-xs font-semibold tracking-[0.16em] text-slate-400 uppercase">
            Signed in
          </p>
          <p className="mt-3 text-lg font-medium text-white">{displayName}</p>
          <p className="mt-1 text-sm text-slate-400">{profile.email ?? "No email available"}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge className="border-white/10 bg-white/8 text-slate-100">Active session</Badge>
            <Badge className="border-cyan-400/20 bg-cyan-400/10 text-cyan-100">
              {workspaces.length} workspace{workspaces.length === 1 ? "" : "s"}
            </Badge>
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-3 text-xs font-semibold tracking-[0.16em] text-slate-400 uppercase">
            Workspace
          </p>
          <WorkspaceSwitcher
            ariaLabel="Switch active workspace"
            className="border-white/10 bg-white/8 text-white"
            workspaces={workspaces}
          />
        </div>

        <nav aria-label="Primary navigation" className="mt-8 space-y-2">
          <p className="px-1 pb-2 text-xs font-semibold tracking-[0.16em] text-slate-400 uppercase">
            Main navigation
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
        <div className="rounded-[1.5rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.1),rgba(255,255,255,0.03))] p-4">
          <p className="text-xs font-semibold tracking-[0.16em] text-slate-400 uppercase">
            Quick guide
          </p>
          <p className="mt-3 text-base font-medium text-white">
            {currentWorkspace ? "What to do in this workspace" : "How this product flows"}
          </p>
          <ol className="mt-3 grid gap-3 text-sm leading-6 text-slate-300">
            {guideSteps.map((step, index) => (
              <li className="flex items-start gap-3" key={step}>
                <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/10 text-[11px] font-semibold text-white">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
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
        <div className="absolute inset-x-0 top-0 h-[30rem] bg-[radial-gradient(circle_at_top_left,_rgba(21,94,117,0.16),_transparent_58%)]" />
        <div className="absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_top_right,_rgba(194,140,59,0.12),_transparent_44%)]" />
        <div className="absolute left-[-6rem] top-72 h-80 w-80 rounded-full bg-cyan-600/10 blur-3xl" />
        <div className="absolute right-[-8rem] top-20 h-96 w-96 rounded-full bg-amber-400/10 blur-3xl" />
      </div>

      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-0 px-3 py-3 sm:px-4 lg:px-6">
        <aside className="hidden w-[21rem] shrink-0 lg:block">{sidebar}</aside>

        <div className="flex min-h-[calc(100vh-1.5rem)] min-w-0 flex-1 flex-col lg:pl-6">
          <header className="sticky top-0 z-30 px-1 py-1">
            <div className="rounded-[1.8rem] border border-[var(--app-border)] bg-white/84 px-4 py-4 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.18)] backdrop-blur-xl sm:px-6">
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

                  <div className="flex min-w-0 flex-col gap-3 xl:items-end">
                    {workspaces.length > 0 ? (
                      <WorkspaceSwitcher
                        ariaLabel="Switch active workspace"
                        className="w-full min-w-[15rem] xl:w-[18rem]"
                        workspaces={workspaces}
                      />
                    ) : null}
                    <div className="flex flex-wrap items-center gap-2">
                      {currentWorkspace ? (
                        <>
                          <Badge className="border-teal-700/16 bg-teal-700/8 text-teal-800">
                            {formatWorkspaceRoleLabel(currentWorkspace.role)}
                          </Badge>
                          <Badge className="border-amber-400/30 bg-amber-100/70 text-amber-900">
                            /{currentWorkspace.slug}
                          </Badge>
                        </>
                      ) : (
                        <Badge className="border-slate-300 bg-white text-slate-700">
                          {workspaces.length > 0 ? "Choose a workspace to continue" : "No workspace yet"}
                        </Badge>
                      )}
                      <Badge className="border-cyan-700/14 bg-cyan-700/8 text-cyan-900">
                        Responsive shell
                      </Badge>
                    </div>
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
