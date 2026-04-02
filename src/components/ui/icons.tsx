import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function IconBase({ children, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="18"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.85"
      viewBox="0 0 24 24"
      width="18"
      {...props}
    >
      {children}
    </svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20h14V9.5" />
      <path d="M9.5 20v-6h5v6" />
    </IconBase>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="6.25" />
      <path d="m20 20-4.25-4.25" />
    </IconBase>
  );
}

export function FileStackIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M8 3.75h7l4 4V20.25H8z" />
      <path d="M15 3.75v4h4" />
      <path d="M5 7.75H4.75A1.75 1.75 0 0 0 3 9.5v10.75C3 21.216 3.784 22 4.75 22H13" />
      <path d="M11 12.5h5" />
      <path d="M11 16h5" />
    </IconBase>
  );
}

export function ChatIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5.5 18.5 4 21l4-1.2" />
      <path d="M8 18.5h7.5A4.5 4.5 0 0 0 20 14V9.5A4.5 4.5 0 0 0 15.5 5H8A4.5 4.5 0 0 0 3.5 9.5V14A4.5 4.5 0 0 0 8 18.5Z" />
      <path d="M8.5 10.25h7" />
      <path d="M8.5 13.75h4.5" />
    </IconBase>
  );
}

export function ActivityIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3 12h4l2.2-5L14 17l2.4-5H21" />
    </IconBase>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.2 15.5a1 1 0 0 0 .2 1.1l.05.05a1.8 1.8 0 0 1 0 2.55 1.8 1.8 0 0 1-2.55 0l-.05-.05a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a1.8 1.8 0 0 1-1.8 1.8h-1.1A1.8 1.8 0 0 1 10.45 20v-.1a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.05.05a1.8 1.8 0 0 1-2.55 0 1.8 1.8 0 0 1 0-2.55l.05-.05a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H5.4A1.8 1.8 0 0 1 3.6 13.1V12A1.8 1.8 0 0 1 5.4 10.2h.1a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.05-.05a1.8 1.8 0 0 1 0-2.55 1.8 1.8 0 0 1 2.55 0l.05.05a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4.9a1.8 1.8 0 0 1 1.8-1.8h1.1a1.8 1.8 0 0 1 1.8 1.8V5a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.05-.05a1.8 1.8 0 0 1 2.55 0 1.8 1.8 0 0 1 0 2.55l-.05.05a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6h.1A1.8 1.8 0 0 1 20.4 12v1.1a1.8 1.8 0 0 1-1.8 1.8h-.1a1 1 0 0 0-.9.6Z" />
    </IconBase>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20.25c1.6-3.1 4.05-4.65 7-4.65s5.4 1.55 7 4.65" />
    </IconBase>
  );
}

export function SparkIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3.5 13.7 8.3 18.5 10 13.7 11.7 12 16.5 10.3 11.7 5.5 10 10.3 8.3 12 3.5Z" />
      <path d="m18.5 3.5.7 2 .8.3-.8.3-.7 2-.7-2-.8-.3.8-.3.7-2Z" />
    </IconBase>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </IconBase>
  );
}

export function ArrowUpRightIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M7 17 17 7" />
      <path d="M9 7h8v8" />
    </IconBase>
  );
}

export function UploadIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 16.5V5.5" />
      <path d="m7.75 9.75 4.25-4.25 4.25 4.25" />
      <path d="M4 18.5h16" />
    </IconBase>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M20 7.5V4h-3.5" />
      <path d="M4 16.5V20h3.5" />
      <path d="M18.2 10A6.75 6.75 0 0 0 6.4 6.1L4 8.25" />
      <path d="M5.8 14A6.75 6.75 0 0 0 17.6 17.9l2.4-2.15" />
    </IconBase>
  );
}

export function ArchiveIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 6.25h16v3.5H4z" />
      <path d="M5.5 9.75v9.5h13v-9.5" />
      <path d="M10 13h4" />
    </IconBase>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5.5 7.25h13" />
      <path d="M9 7.25V5.5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14 5.5v1.75" />
      <path d="M7 7.25v11A1.75 1.75 0 0 0 8.75 20h5.5A1.75 1.75 0 0 0 16 18.25v-11" />
      <path d="M10 11v5.5" />
      <path d="M14 11v5.5" />
    </IconBase>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 4v10.5" />
      <path d="m7.75 10.25 4.25 4.25 4.25-4.25" />
      <path d="M4 19.5h16" />
    </IconBase>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8.25" />
      <path d="M12 7.75V12l3 2" />
    </IconBase>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8.25" />
      <path d="m8.5 12.25 2.25 2.25 4.75-5" />
    </IconBase>
  );
}
