/** Sparse, line-based icons matching the editorial aesthetic. 1px strokes. */

const baseProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function MicOnIcon() {
  return (
    <svg {...baseProps}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
    </svg>
  );
}

export function MicOffIcon() {
  return (
    <svg {...baseProps}>
      <path d="M9 5a3 3 0 0 1 6 0v5" />
      <path d="M15 12.5a3 3 0 0 1-6 0V8" />
      <path d="M5 11a7 7 0 0 0 7 7" />
      <path d="M19 11v0a6.97 6.97 0 0 1-1.8 4.7" />
      <path d="M3 3l18 18" />
      <path d="M12 18v3" />
    </svg>
  );
}

export function CamOnIcon() {
  return (
    <svg {...baseProps}>
      <rect x="3" y="6" width="13" height="12" rx="2" />
      <path d="M16 10l5-2v8l-5-2z" />
    </svg>
  );
}

export function CamOffIcon() {
  return (
    <svg {...baseProps}>
      <path d="M16 10l5-2v8l-5-2v-4" />
      <path d="M16 16v-2.5" />
      <rect x="3" y="6" width="13" height="12" rx="2" />
      <path d="M3 3l18 18" />
    </svg>
  );
}

export function LinkIcon() {
  return (
    <svg {...baseProps}>
      <path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1.5 1.5" />
      <path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1.5-1.5" />
    </svg>
  );
}

export function LeaveIcon() {
  return (
    <svg {...baseProps}>
      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
      <path d="M10 17l-5-5 5-5" />
      <path d="M5 12h12" />
    </svg>
  );
}

export function CaptionsIcon() {
  return (
    <svg {...baseProps}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7 13a2 2 0 1 1 0-2" />
      <path d="M14 13a2 2 0 1 1 0-2" />
    </svg>
  );
}

export function ChevronDownIcon() {
  return (
    <svg {...baseProps} width={12} height={12}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function SecurityIcon() {
  return (
    <svg {...baseProps}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

export function ParticipantsIcon() {
  return (
    <svg {...baseProps}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function ChatIcon() {
  return (
    <svg {...baseProps}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function ShareScreenIcon() {
  return (
    <svg {...baseProps}>
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M12 8v4" />
      <path d="M10 10l2-2 2 2" />
    </svg>
  );
}

export function TranslateIcon() {
  return (
    <svg {...baseProps}>
      <path d="M5 8l6 6" />
      <path d="M4 14l6-6 2-3" />
      <path d="M2 5h12" />
      <path d="M7 2h1" />
      <path d="M22 22l-5-10-5 10" />
      <path d="M14 18h6" />
    </svg>
  );
}

export function RecordIcon() {
  return (
    <svg {...baseProps}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
  );
}

export function ReactionsIcon() {
  return (
    <svg {...baseProps}>
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg {...baseProps} width={16} height={16}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export function SpeakerIcon() {
  return (
    <svg {...baseProps}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}

export function SpeakerOffIcon() {
  return (
    <svg {...baseProps}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <line x1="3" y1="3" x2="21" y2="21" />
    </svg>
  );
}

export function TranslatorSpeakerIcon() {
  return (
    <svg {...baseProps}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <text x="4.5" y="15" fontSize="8" fontWeight="bold" fill="currentColor" stroke="none" fontFamily="sans-serif">T</text>
    </svg>
  );
}

export function TranslatorSpeakerOffIcon() {
  return (
    <svg {...baseProps}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <line x1="3" y1="3" x2="21" y2="21" />
      <text x="4.5" y="15" fontSize="8" fontWeight="bold" fill="currentColor" stroke="none" fontFamily="sans-serif">T</text>
    </svg>
  );
}

export function MoreIcon() {
  return (
    <svg {...baseProps}>
      <circle cx="5" cy="12" r="2" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function PollIcon() {
  return (
    <svg {...baseProps}>
      <rect x="4" y="14" width="4" height="6" rx="1" />
      <rect x="10" y="8" width="4" height="12" rx="1" />
      <rect x="16" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}

export function BreakoutRoomsIcon() {
  return (
    <svg {...baseProps}>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
    </svg>
  );
}

export function CaretUpIcon() {
  return (
    <svg {...baseProps} width={10} height={10}>
      <path d="M18 15l-6-6-6 6" />
    </svg>
  );
}

export function GridViewIcon() {
  return (
    <svg {...baseProps} width={14} height={14}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

export function SettingsIcon() {
  return (
    <svg {...baseProps}>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function HandRaiseIcon() {
  return (
    <svg {...baseProps}>
      <path d="M7 10v4a5 5 0 0 0 10 0v-4" />
      <path d="M10 5v7" />
      <path d="M14 3v9" />
      <path d="M18 9v2.5a6 6 0 0 1-6 6H10" />
    </svg>
  );
}

export function PinIcon() {
  return (
    <svg {...baseProps}>
      <path d="m15 3 6 6" />
      <path d="M9 15 3 21" />
      <path d="M12 3 3 12l3 3 3 3 9-9-6-6Z" />
      <line x1="9" y1="15" x2="15" y2="9" />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg {...baseProps}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export function LockIcon() {
  return (
    <svg {...baseProps}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export function UnlockIcon() {
  return (
    <svg {...baseProps}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  );
}

export function PersonIcon() {
  return (
    <svg {...baseProps}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function MoreVerticalIcon() {
  return (
    <svg {...baseProps}>
      <circle cx="12" cy="5" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function InviteIcon() {
  return (
    <svg {...baseProps}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  );
}

export function ShieldCheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function ScreenShareOnIcon() {
  return (
    <svg {...baseProps}>
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}
