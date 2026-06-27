import { useState } from 'react';
import { motion } from 'framer-motion';
import { useCollection, addItem, updateItem, removeItem, uid } from '../lib/store';
import { monthKey, prettyMonth } from '../lib/date';
import { haptic } from '../lib/haptics';
import { celebrate } from '../lib/celebrate';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Fab from '../components/ui/Fab';
import Sheet from '../components/ui/Sheet';
import EmptyState from '../components/ui/EmptyState';
import Icon from '../components/ui/Icon';
import type { AccentKey, Goal } from '../lib/types';

const COLORS: AccentKey[] = ['goal', 'move', 'time', 'habit', 'review', 'accent'];
const GRAD: Record<AccentKey, string> = {
  move: 'var(--grad-move)',
  time: 'var(--grad-time)',
  habit: 'var(--grad-habit)',
  goal: 'var(--grad-goal)',
  review: 'var(--grad-review)',
  accent: 'var(--grad-accent)',
};

export default function Goals() {
  const goals = useCollection('goals');
  const thisMonth = monthKey();
  const monthGoals = goals.filter((g) => g.month === thisMonth);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('10');
  const [unit, setUnit] = useState('');
  const [color, setColor] = useState<AccentKey>('goal');

  function add() {
    const t = parseInt(target, 10);
    if (!title.trim() || !t || t < 1) return;
    addItem('goals', {
      id: uid(),
      title: title.trim(),
      month: thisMonth,
      target: t,
      progress: 0,
      unit: unit.trim(),
      color,
      createdAt: new Date().toISOString(),
    });
    haptic('medium');
    setTitle('');
    setTarget('10');
    setUnit('');
    setColor('goal');
    setOpen(false);
  }

  function bump(g: Goal, delta: number) {
    const progress = Math.max(0, Math.min(g.target, g.progress + delta));
    updateItem('goals', g.id, { progress });
    if (delta > 0 && progress === g.target && g.progress < g.target) celebrate();
    else haptic('light');
  }

  return (
    <>
      <header className="page-head flex between">
        <div>
          <h1>Goals</h1>
          <p>{prettyMonth(thisMonth)}</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Icon name="plus" size={16} strokeWidth={2.2} />
          Add
        </Button>
      </header>

      {monthGoals.length === 0 ? (
        <Card>
          <EmptyState
            icon="goal"
            title="No goals this month"
            hint="Set a monthly goal and watch the progress fill up."
            action={<Button onClick={() => setOpen(true)}>Add a goal</Button>}
          />
        </Card>
      ) : (
        <div className="wrap-grid">
          {monthGoals.map((g, i) => {
            const pct = g.target ? g.progress / g.target : 0;
            const done = g.progress >= g.target;
            return (
              <Card key={g.id} delay={i * 0.04}>
                <div className="flex between">
                  <div>
                    <div className="row-title" style={{ fontSize: 'var(--fs-lg)' }}>
                      {g.title}
                      {done && (
                        <Icon
                          name="check"
                          size={16}
                          strokeWidth={2.4}
                          style={{ color: 'var(--c-goal)', marginLeft: 6, verticalAlign: '-2px' }}
                        />
                      )}
                    </div>
                    <div className="row-sub">
                      {g.progress} / {g.target} {g.unit}
                    </div>
                  </div>
                  <span className="streak-badge">{Math.round(pct * 100)}%</span>
                </div>

                <div className="bar" style={{ marginTop: 'var(--sp-4)' }}>
                  <motion.div
                    className="bar-fill"
                    style={{ background: GRAD[g.color] }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct * 100}%` }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>

                <div className="flex between" style={{ marginTop: 'var(--sp-4)' }}>
                  <div className="flex">
                    <Button variant="soft" onClick={() => bump(g, -1)} aria-label="Decrease">
                      <Icon name="minus" size={16} strokeWidth={2.2} />
                    </Button>
                    <Button onClick={() => bump(g, 1)} aria-label="Increase">
                      <Icon name="plus" size={16} strokeWidth={2.2} />
                    </Button>
                  </div>
                  <button
                    className="icon-btn"
                    aria-label={`Delete ${g.title}`}
                    onClick={() => {
                      removeItem('goals', g.id);
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

      <Fab onClick={() => setOpen(true)} label="Add goal" />

      <Sheet open={open} onClose={() => setOpen(false)} title="New monthly goal">
        <div className="field">
          <label htmlFor="goal-title">Goal</label>
          <input
            id="goal-title"
            className="input"
            value={title}
            autoFocus
            placeholder="e.g. Read books"
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="flex" style={{ gap: 'var(--sp-3)' }}>
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="goal-target">Target</label>
            <input
              id="goal-target"
              type="number"
              min="1"
              className="input"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="goal-unit">Unit (optional)</label>
            <input
              id="goal-unit"
              className="input"
              value={unit}
              placeholder="books"
              onChange={(e) => setUnit(e.target.value)}
            />
          </div>
        </div>
        <div className="field">
          <label>Colour</label>
          <div className="chip-row">
            {COLORS.map((c) => (
              <button key={c} className={`chip ${color === c ? 'on' : ''}`} onClick={() => setColor(c)}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <Button onClick={add} {...{ style: { width: '100%' } }}>
          Create goal
        </Button>
      </Sheet>
    </>
  );
}
