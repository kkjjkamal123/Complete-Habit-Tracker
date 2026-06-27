import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { NAV, MOBILE_NAV } from './nav';
import { haptic } from '../../lib/haptics';
import { useMotion } from '../../lib/motion';
import Icon from '../ui/Icon';
import TopBar from './TopBar';
import Settings from '../Settings';

export default function AppShell() {
  const location = useLocation();
  const { prefs } = useMotion();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="app">
      <TopBar
        onOpenSettings={() => setSettingsOpen(true)}
        onToggleNav={() => setCollapsed((c) => !c)}
      />

      <div className={`app-body ${collapsed ? 'collapsed' : ''}`}>
        {/* ---- Desktop sidebar (nav only) ---- */}
        <aside className="sidebar">
          <nav className="side-nav" aria-label="Primary">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={() => haptic('light')}
              >
                <span className="nav-icon">
                  <Icon name={item.icon} size={20} />
                </span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* ---- Main content ---- */}
        <main className="main">
          {prefs.page ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { type: 'spring', stiffness: 360, damping: 32, mass: 0.7 },
                }}
                exit={{ opacity: 0, y: -8, transition: { duration: 0.13, ease: 'easeIn' } }}
                className="page"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="page" key={location.pathname}>
              <Outlet />
            </div>
          )}
        </main>
      </div>

      {/* ---- Mobile bottom tab bar (5 everyday screens) ---- */}
      <nav className="tabbar" aria-label="Primary">
        {MOBILE_NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}
            onClick={() => haptic('light')}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="tab-pill"
                    className="tab-pill"
                    transition={{ type: 'spring', stiffness: 480, damping: 36 }}
                  />
                )}
                <span className="tab-icon">
                  <Icon name={item.icon} size={20} />
                </span>
                <span className="tab-label">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <Settings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
