import type { AccentKey } from '../../lib/types';
import type { IconName } from '../ui/Icon';

export interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  color: AccentKey;
}

export const NAV: NavItem[] = [
  { to: '/', label: 'Home', icon: 'today', color: 'accent' },
  { to: '/todos', label: 'To-Do', icon: 'todo', color: 'move' },
  { to: '/time', label: 'Time', icon: 'time', color: 'time' },
  { to: '/habits', label: 'Habits', icon: 'habit', color: 'habit' },
  { to: '/goals', label: 'Goals', icon: 'goal', color: 'goal' },
  { to: '/review', label: 'Review', icon: 'review', color: 'review' },
  { to: '/sync', label: 'Sync', icon: 'sync', color: 'time' },
];

// The mobile bottom bar shows only the five everyday screens — Review lives in
// the top bar, Sync behind the sync-status light. (Desktop sidebar uses NAV.)
export const MOBILE_NAV: NavItem[] = NAV.filter(
  (item) => item.to !== '/review' && item.to !== '/sync',
);
