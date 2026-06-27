import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useCollection, addItem, removeItem, uid } from '../lib/store';
import { dayKey, humanMinutes, clockTime } from '../lib/date';
import { haptic } from '../lib/haptics';
import { useMotion } from '../lib/motion';
import { useTimer, startTimer, stopTimer, setTimerMeta } from '../lib/timer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Sheet from '../components/ui/Sheet';
import EmptyState from '../components/ui/EmptyState';
import Icon from '../components/ui/Icon';

const CATEGORIES = ['Work', 'Study', 'Health', 'Creative', 'Chores', 'Other'];

function fmt(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export default function Time() {
  const activities = useCollection('activities');
  const { prefs } = useMotion();
  const timer = useTimer();
  const today = dayKey();

  // Re-render once a second while running; elapsed is derived from the stored
  // start timestamp, so it's correct even after navigating away or reloading.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!timer.running) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [timer.running]);
  const elapsed = timer.running ? Math.max(0, Math.floor((now - timer.startedAt) / 1000)) : 0;

  const [open, setOpen] = useState(false);
  const [mTitle, setMTitle] = useState('');
  const [mCat, setMCat] = useState(CATEGORIES[0]);
  const [mMin, setMMin] = useState('30');

  const todayActs = useMemo(
    () => activities.filter((a) => dayKey(new Date(a.at)) === today),
    [activities, today],
  );
  const minutesToday = todayActs.reduce((s, a) => s + a.minutes, 0);

  function start() {
    startTimer();
    haptic('medium');
  }

  function stop() {
    const secs = stopTimer();
    const minutes = Math.max(1, Math.round(secs / 60));
    addItem('activities', {
      id: uid(),
      title: timer.title.trim() || 'Focus session',
      category: timer.category,
      minutes,
      at: new Date().toISOString(),
    });
    haptic('success');
    setTimerMeta({ title: '' });
  }

  function manualAdd() {
    const minutes = parseInt(mMin, 10);
    if (!mTitle.trim() || !minutes || minutes < 1) return;
    addItem('activities', {
      id: uid(),
      title: mTitle.trim(),
      category: mCat,
      minutes,
      at: new Date().toISOString(),
    });
    haptic('medium');
    setMTitle('');
    setMMin('30');
    setOpen(false);
  }

  return (
    <>
      <header className="page-head flex between">
        <div>
          <h1>Time</h1>
          <p>Tracked {humanMinutes(minutesToday)} today</p>
        </div>
        <Button variant="soft" onClick={() => setOpen(true)}>
          Log manually
        </Button>
      </header>

      {/* Timer */}
      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--sp-4)' }}>
          <motion.div
            className="ring"
            style={{ width: 270, height: 270 }}
            animate={timer.running && prefs.ambient ? { scale: [1, 1.025, 1] } : { scale: 1 }}
            transition={{ duration: 2, repeat: timer.running && prefs.ambient ? Infinity : 0, ease: 'easeInOut' }}
          >
            <svg width={270} height={270} viewBox="0 0 270 270" aria-hidden="true">
              <defs>
                <linearGradient id="timer-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#5b9bff" />
                  <stop offset="100%" stopColor="#2d7ff9" />
                </linearGradient>
              </defs>
              <circle cx="135" cy="135" r="124" fill="none" stroke="var(--border)" strokeWidth="11" />
              <circle
                cx="135"
                cy="135"
                r="124"
                fill="none"
                stroke="url(#timer-grad)"
                strokeWidth="11"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 124}
                strokeDashoffset={2 * Math.PI * 124 * (1 - (elapsed % 60) / 60)}
                transform="rotate(-90 135 135)"
                style={{ transition: 'stroke-dashoffset 0.3s linear' }}
              />
            </svg>
            <div className="ring-center">
              <div className="timer-display">{fmt(elapsed)}</div>
            </div>
          </motion.div>

          <input
            className="input"
            style={{ maxWidth: 320, textAlign: 'center' }}
            value={timer.title}
            placeholder="What are you working on?"
            onChange={(e) => setTimerMeta({ title: e.target.value })}
            aria-label="Activity name"
          />

          <div className="chip-row" style={{ justifyContent: 'center' }}>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                className={`chip ${timer.category === c ? 'on' : ''}`}
                onClick={() => setTimerMeta({ category: c })}
              >
                {c}
              </button>
            ))}
          </div>

          {timer.running ? (
            <Button variant="soft" onClick={stop} {...{ style: { minWidth: 160 } }}>
              <Icon name="stop" size={16} />
              Stop & save
            </Button>
          ) : (
            <Button onClick={start} {...{ style: { minWidth: 160 } }}>
              <Icon name="play" size={16} />
              Start
            </Button>
          )}
        </div>
      </Card>

      {/* Today's log */}
      <Card delay={0.05}>
        <div className="section-title" style={{ marginBottom: 'var(--sp-3)' }}>
          Today’s log
        </div>
        {todayActs.length === 0 ? (
          <EmptyState icon="time" title="No sessions yet" hint="Start the timer or log time manually." />
        ) : (
          <ul>
            {todayActs.map((a) => (
              <li key={a.id} className="row">
                <span className="row-sub" style={{ width: 44 }}>
                  {clockTime(a.at)}
                </span>
                <div className="row-main">
                  <div className="row-title">{a.title}</div>
                  <div className="row-sub">{a.category}</div>
                </div>
                <span className="streak-badge">{humanMinutes(a.minutes)}</span>
                <button
                  className="icon-btn"
                  aria-label="Delete entry"
                  onClick={() => {
                    removeItem('activities', a.id);
                    haptic('light');
                  }}
                >
                  <Icon name="trash" size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Sheet open={open} onClose={() => setOpen(false)} title="Log time">
        <div className="field">
          <label htmlFor="m-title">Activity</label>
          <input
            id="m-title"
            className="input"
            value={mTitle}
            autoFocus
            placeholder="What did you do?"
            onChange={(e) => setMTitle(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Category</label>
          <div className="chip-row">
            {CATEGORIES.map((c) => (
              <button key={c} className={`chip ${mCat === c ? 'on' : ''}`} onClick={() => setMCat(c)}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label htmlFor="m-min">Minutes</label>
          <input
            id="m-min"
            type="number"
            min="1"
            className="input"
            value={mMin}
            onChange={(e) => setMMin(e.target.value)}
          />
        </div>
        <Button onClick={manualAdd} {...{ style: { width: '100%' } }}>
          Save entry
        </Button>
      </Sheet>
    </>
  );
}
