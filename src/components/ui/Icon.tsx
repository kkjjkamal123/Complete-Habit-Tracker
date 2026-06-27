import type { CSSProperties } from 'react';

export type IconName =
  | 'today'
  | 'todo'
  | 'time'
  | 'habit'
  | 'goal'
  | 'review'
  | 'trash'
  | 'plus'
  | 'minus'
  | 'play'
  | 'stop'
  | 'sun'
  | 'moon'
  | 'close'
  | 'check'
  | 'settings'
  | 'menu'
  | 'sync';

interface Props {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: CSSProperties;
}

/** Hand-built line-icon set — consistent 24px grid, 1.8 stroke. */
export default function Icon({ name, size = 22, strokeWidth = 1.8, className, style }: Props) {
  const p = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    className,
    style,
  };

  switch (name) {
    case 'today':
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'todo':
      return (
        <svg {...p}>
          <path d="M4 6.5h.01M4 12h.01M4 17.5h.01" />
          <path d="M9 6.5h11M9 12h11M9 17.5h11" />
        </svg>
      );
    case 'time':
      return (
        <svg {...p}>
          <circle cx="12" cy="13" r="8" />
          <path d="M12 9.5V13l2.5 1.8M9.5 2.5h5" />
        </svg>
      );
    case 'habit':
      return (
        <svg {...p}>
          <path d="M12 3c.8 2.6 3.5 4 3.5 7.3A3.5 3.5 0 0 1 8.5 11c0-1.2.4-2 .9-2.6.2.9.9 1.3 1.4 1.3-.6-2.3.3-4.8 1.2-6.7z" />
        </svg>
      );
    case 'goal':
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="4.8" />
          <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'review':
    case 'moon':
      return (
        <svg {...p}>
          <path d="M20.5 15A8.5 8.5 0 1 1 9.5 3.5 6.6 6.6 0 0 0 20.5 15z" />
        </svg>
      );
    case 'trash':
      return (
        <svg {...p}>
          <path d="M4 6.5h16M9.5 6.5V4.5h5v2M6.5 6.5l.9 13.5h9.2l.9-13.5M10 10v6.5M14 10v6.5" />
        </svg>
      );
    case 'plus':
      return (
        <svg {...p}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case 'minus':
      return (
        <svg {...p}>
          <path d="M5 12h14" />
        </svg>
      );
    case 'play':
      return (
        <svg {...p}>
          <path d="M7 4.5l13 7.5-13 7.5z" />
        </svg>
      );
    case 'stop':
      return (
        <svg {...p}>
          <rect x="6" y="6" width="12" height="12" rx="2.5" />
        </svg>
      );
    case 'sun':
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8" />
        </svg>
      );
    case 'close':
      return (
        <svg {...p}>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      );
    case 'check':
      return (
        <svg {...p}>
          <path d="M5 12.5l4.5 4.5L19 7" />
        </svg>
      );
    case 'settings':
      return (
        <svg {...p}>
          <path d="M4 7h8M17 7h3M4 17h3M12 17h8" />
          <circle cx="15" cy="7" r="2.4" />
          <circle cx="9" cy="17" r="2.4" />
        </svg>
      );
    case 'menu':
      return (
        <svg {...p}>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      );
    case 'sync':
      return (
        <svg {...p}>
          <path d="M3.5 12a8.5 8.5 0 0 1 14.5-6M20.5 12A8.5 8.5 0 0 1 6 18" />
          <path d="M18 2v4h-4M6 22v-4h4" />
        </svg>
      );
  }
}
