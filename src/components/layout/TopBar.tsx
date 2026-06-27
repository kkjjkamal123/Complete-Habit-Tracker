import { NavLink, useNavigate } from 'react-router-dom';
import { haptic } from '../../lib/haptics';
import { useCollection } from '../../lib/store';
import { currentStreak } from '../../lib/streaks';
import { prettyDate, prettyDateLong } from '../../lib/date';
import { useTheme } from '../../lib/theme';
import { useAuth } from '../../lib/auth';
import { useOnline, syncStatus, STATUS_LABEL } from '../../lib/useOnline';
import Icon from '../ui/Icon';

export default function TopBar({
  onOpenSettings,
  onToggleNav,
}: {
  onOpenSettings: () => void;
  onToggleNav: () => void;
}) {
  const habits = useCollection('habits');
  const { name } = useTheme();
  const { user, enabled } = useAuth();
  const online = useOnline();
  const navigate = useNavigate();

  const bestStreak = habits.reduce((m, h) => Math.max(m, currentStreak(h.done)), 0);
  const initial = name.trim() ? name.trim()[0].toUpperCase() : '+';
  const status = syncStatus(enabled, !!user, online);

  return (
    <header className="topbar">
      {/* Left: menu + brand */}
      <div className="topbar-left">
        <button className="icon-btn hide-mobile" aria-label="Toggle sidebar" onClick={onToggleNav}>
          <Icon name="menu" size={18} />
        </button>
        <span className="brand-mark" aria-hidden="true">
          <Icon name="today" size={16} strokeWidth={2.2} />
        </span>
        <span className="brand-name hide-mobile">DailyTrack</span>
      </div>

      {/* Centre: full date */}
      <div className="topbar-center">
        <span className="topbar-date hide-mobile">{prettyDateLong()}</span>
        <span className="topbar-date hide-desktop">{prettyDate()}</span>
      </div>

      {/* Right: review + sync light + streak + username */}
      <div className="topbar-right">
        <NavLink
          to="/review"
          className={({ isActive }) => `icon-btn ${isActive ? 'active' : ''}`}
          aria-label="Review"
          title="Review"
          onClick={() => haptic('light')}
        >
          <Icon name="review" size={18} />
        </NavLink>
        <button
          className="status-light"
          onClick={() => navigate('/sync')}
          aria-label={`Sync status: ${STATUS_LABEL[status]}`}
          title={STATUS_LABEL[status]}
        >
          <span className="status-dot" data-status={status} />
          <span className="status-label hide-mobile">{STATUS_LABEL[status]}</span>
        </button>
        {bestStreak > 0 && (
          <span className="streak-chip" title={`${bestStreak}-day best streak`}>
            <span className="streak-flame">
              <Icon name="habit" size={15} style={{ color: 'var(--c-habit)' }} />
            </span>
            {bestStreak}
          </span>
        )}
        <button className="topbar-user" onClick={onOpenSettings} aria-label="Profile and settings">
          <span className="topbar-profile">{initial}</span>
          <span className="topbar-username hide-mobile">{name.trim() || 'Set name'}</span>
        </button>
      </div>
    </header>
  );
}
