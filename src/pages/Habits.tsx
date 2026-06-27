import { useState } from 'react';
import { motion } from 'framer-motion';
import { useCollection, addItem, updateItem, removeItem, uid } from '../lib/store';
import { currentStreak, longestStreak, isDoneToday } from '../lib/streaks';
import { dayKey, lastNDays } from '../lib/date';
import { haptic } from '../lib/haptics';
import { celebrate } from '../lib/celebrate';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Fab from '../components/ui/Fab';
import Sheet from '../components/ui/Sheet';
import EmptyState from '../components/ui/EmptyState';
import Icon from '../components/ui/Icon';
import type { AccentKey, Habit } from '../lib/types';

const EMOJIS = ['🏃', '📚', '🧘', '💧', '🥗', '💪', '🛏', '🎯', '✍️', '🎸'];
const COLORS: AccentKey[] = ['habit', 'move', 'time', 'goal', 'review', 'accent'];

export default function Habits() {
  const habits = useCollection('habits');
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [color, setColor] = useState<AccentKey>('habit');
  const week = lastNDays(7);

  function add() {
    if (!name.trim()) return;
    addItem('habits', {
      id: uid(),
      name: name.trim(),
      emoji,
      color,
      createdAt: new Date().toISOString(),
      done: [],
    });
    haptic('medium');
    setName('');
    setEmoji(EMOJIS[0]);
    setColor('habit');
    setOpen(false);
  }

  function toggle(h: Habit) {
    const today = dayKey();
    const wasDone = isDoneToday(h.done);
    const done = wasDone ? h.done.filter((d) => d !== today) : [...h.done, today];
    updateItem('habits', h.id, { done });
    if (!wasDone) {
      haptic('success');
      const s = currentStreak(done);
      if (s > 0 && s % 7 === 0) celebrate();
    } else {
      haptic('light');
    }
  }

  return (
    <>
      <header className="page-head flex between">
        <div>
          <h1>Habits</h1>
          <p>Build streaks, one day at a time</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Icon name="plus" size={16} strokeWidth={2.2} />
          Add
        </Button>
      </header>

      {habits.length === 0 ? (
        <Card>
          <EmptyState
            icon="habit"
            title="No habits yet"
            hint="Create a habit and check it off daily to grow a streak."
            action={<Button onClick={() => setOpen(true)}>Add a habit</Button>}
          />
        </Card>
      ) : (
        <div className="wrap-grid cols-2">
          {habits.map((h, i) => {
            const on = isDoneToday(h.done);
            const streak = currentStreak(h.done);
            const best = longestStreak(h.done);
            return (
              <Card key={h.id} delay={i * 0.04}>
                <div className="flex between">
                  <div className="flex">
                    <span style={{ fontSize: '1.8rem' }} aria-hidden="true">
                      {h.emoji}
                    </span>
                    <div>
                      <div className="row-title" style={{ fontSize: 'var(--fs-lg)' }}>
                        {h.name}
                      </div>
                      <div className="row-sub">Best: {best} days</div>
                    </div>
                  </div>
                  <span className="streak-badge">
                    <Icon name="habit" size={14} style={{ color: 'var(--c-habit)' }} />
                    {streak}
                  </span>
                </div>

                <div className="habit-dots" style={{ marginTop: 'var(--sp-4)' }}>
                  {week.map((d) => (
                    <span
                      key={d}
                      className={`dot ${h.done.includes(d) ? 'on' : ''}`}
                      title={d}
                    />
                  ))}
                </div>

                <div className="flex between" style={{ marginTop: 'var(--sp-4)' }}>
                  <motion.button
                    className={`check ${on ? 'on' : ''}`}
                    style={{ width: 40, height: 40 }}
                    whileTap={{ scale: 0.85 }}
                    aria-pressed={on}
                    aria-label={`Mark ${h.name} ${on ? 'not done' : 'done'} today`}
                    onClick={() => toggle(h)}
                  >
                    <Icon name="check" size={18} strokeWidth={2.4} />
                  </motion.button>
                  <button
                    className="icon-btn"
                    aria-label={`Delete ${h.name}`}
                    onClick={() => {
                      removeItem('habits', h.id);
                      haptic('light');
                    }}
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Fab onClick={() => setOpen(true)} label="Add habit" />

      <Sheet open={open} onClose={() => setOpen(false)} title="New habit">
        <div className="field">
          <label htmlFor="habit-name">Name</label>
          <input
            id="habit-name"
            className="input"
            value={name}
            autoFocus
            placeholder="e.g. Drink water"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
          />
        </div>
        <div className="field">
          <label>Icon</label>
          <div className="chip-row">
            {EMOJIS.map((e) => (
              <button
                key={e}
                className={`chip ${emoji === e ? 'on' : ''}`}
                style={{ fontSize: '1.2rem' }}
                onClick={() => setEmoji(e)}
                aria-label={`Icon ${e}`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label>Colour</label>
          <div className="chip-row">
            {COLORS.map((c) => (
              <button
                key={c}
                className={`chip ${color === c ? 'on' : ''}`}
                onClick={() => setColor(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <Button onClick={add} {...{ style: { width: '100%' } }}>
          Create habit
        </Button>
      </Sheet>
    </>
  );
}
