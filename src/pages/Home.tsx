import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCollection, updateItem } from '../lib/store';
import {
  dayKey,
  greeting,
  humanMinutes,
  clockTime,
  lastNDays,
  dayLabel,
  monthDays,
  shortDate,
} from '../lib/date';
import { currentStreak, longestStreak, isDoneToday } from '../lib/streaks';
import { useTheme } from '../lib/theme';
import { useMotion } from '../lib/motion';
import { haptic } from '../lib/haptics';
import { celebrate } from '../lib/celebrate';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import Icon from '../components/ui/Icon';
import Sparkline from '../components/ui/Sparkline';
import CountUp from '../components/ui/CountUp';
import type { Habit, Todo } from '../lib/types';

const PRANK: Record<Todo['priority'], number> = { high: 0, med: 1, low: 2 };

export default function Home() {
  const activities = useCollection('activities');
  const todos = useCollection('todos');
  const habits = useCollection('habits');
  const goals = useCollection('goals');
  const { name } = useTheme();
  const { prefs } = useMotion();
  const navigate = useNavigate();

  const today = dayKey();
  const week = useMemo(() => lastNDays(7), []);
  const monthKeys = useMemo(() => monthDays(), []);
  const [range, setRange] = useState<'week' | 'month'>('week');

  // One pass over activities → minutes per day-key, reused by every chart.
  const minutesMap = useMemo(() => {
    const m: Record<string, number> = {};
    for (const a of activities) {
      const k = dayKey(new Date(a.at));
      m[k] = (m[k] ?? 0) + a.minutes;
    }
    return m;
  }, [activities]);

  const minsByDay = useMemo(() => week.map((d) => minutesMap[d] ?? 0), [week, minutesMap]);
  const minutesToday = minutesMap[today] ?? 0;
  const avg = minsByDay.reduce((s, m) => s + m, 0) / 7;

  const chartKeys = range === 'week' ? week : monthKeys;
  const chartData = chartKeys.map((k) => minutesMap[k] ?? 0);
  const chartMax = Math.max(1, ...chartData);
  const chartTotal = chartData.reduce((a, b) => a + b, 0);
  const trend = avg > 0 ? Math.round(((minutesToday - avg) / avg) * 100) : null;

  const tasksTotal = todos.length;
  const tasksDone = todos.filter((t) => t.done).length;
  const taskPct = tasksTotal ? tasksDone / tasksTotal : 0;

  const activeStreaks = habits.filter((h) => currentStreak(h.done) > 0).length;
  const streakPct = habits.length ? activeStreaks / habits.length : 0;
  const bestStreakAll = habits.reduce((m, h) => Math.max(m, longestStreak(h.done)), 0);

  const todayActs = useMemo(
    () => activities.filter((a) => dayKey(new Date(a.at)) === today),
    [activities, today],
  );

  const upNext = useMemo(
    () =>
      [...todos]
        .filter((t) => !t.done)
        .sort((a, b) => PRANK[a.priority] - PRANK[b.priority] || (a.due ?? '~').localeCompare(b.due ?? '~'))
        .slice(0, 4),
    [todos],
  );

  const monthGoals = goals.filter((g) => g.month === dayKey().slice(0, 7)).slice(0, 3);

  function toggleHabit(h: Habit) {
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
      <header className="page-head">
        <h1>
          {greeting()}
          {name.trim() ? `, ${name.trim()}` : ''}
        </h1>
        <p>Here’s how today is shaping up.</p>
      </header>

      {/* Stat cards */}
      <div className="stat-grid">
        <div className="statcard">
          <div className="statcard-top">
            <span className="statcard-icon" style={{ color: 'var(--c-time)' }}>
              <Icon name="time" size={18} />
            </span>
            <span className="stat-label">Time today</span>
          </div>
          <div className="statcard-val">
            <CountUp value={minutesToday} render={(v) => humanMinutes(Math.round(v))} />
          </div>
          <Sparkline data={minsByDay} color="time" />
          <div className="statcard-sub">
            {trend === null
              ? 'Start tracking time'
              : `${trend >= 0 ? '▲' : '▼'} ${Math.abs(trend)}% vs 7-day avg`}
          </div>
        </div>

        <div className="statcard">
          <div className="statcard-top">
            <span className="statcard-icon" style={{ color: 'var(--c-move)' }}>
              <Icon name="todo" size={18} />
            </span>
            <span className="stat-label">Tasks</span>
          </div>
          <div className="statcard-val">
            <CountUp value={tasksDone} />/{tasksTotal}
          </div>
          <div className="bar">
            <motion.div
              className="bar-fill"
              style={{ background: 'var(--grad-move)' }}
              initial={prefs.charts ? { width: 0 } : false}
              animate={{ width: `${taskPct * 100}%` }}
              transition={prefs.charts ? { duration: 0.7, ease: [0.22, 1, 0.36, 1] } : { duration: 0 }}
            />
          </div>
          <div className="statcard-sub">
            {tasksTotal === 0
              ? 'No tasks yet'
              : tasksDone === tasksTotal
                ? 'All done — nice!'
                : `${tasksTotal - tasksDone} still open`}
          </div>
        </div>

        <div className="statcard">
          <div className="statcard-top">
            <span className="statcard-icon" style={{ color: 'var(--c-habit)' }}>
              <Icon name="habit" size={18} />
            </span>
            <span className="stat-label">Streaks</span>
          </div>
          <div className="statcard-val">
            <CountUp value={activeStreaks} /> active
          </div>
          <div className="bar">
            <motion.div
              className="bar-fill"
              style={{ background: 'var(--grad-habit)' }}
              initial={prefs.charts ? { width: 0 } : false}
              animate={{ width: `${streakPct * 100}%` }}
              transition={prefs.charts ? { duration: 0.7, ease: [0.22, 1, 0.36, 1] } : { duration: 0 }}
            />
          </div>
          <div className="statcard-sub">
            {bestStreakAll > 0 ? `Best ${bestStreakAll} days` : 'Build your first streak'}
          </div>
        </div>
      </div>

      {/* Two-column dashboard */}
      <div className="dash-grid">
        <div className="dash-col">
          {/* Today's activity */}
          <Card delay={0.05}>
            <div className="section-title" style={{ marginBottom: 'var(--sp-3)' }}>
              Today’s activity
              <button className="btn btn-soft" onClick={() => navigate('/time')}>
                <Icon name="plus" size={15} strokeWidth={2.2} />
                Log activity
              </button>
            </div>
            {todayActs.length === 0 ? (
              <EmptyState icon="time" title="Nothing logged yet" hint="Hit “Log activity” to track your time." />
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
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Activity — week / month */}
          <Card delay={0.1}>
            <div className="section-title" style={{ marginBottom: 'var(--sp-4)' }}>
              Activity
              <div className="segmented sm" role="group" aria-label="Chart range">
                <button
                  className={`seg-btn ${range === 'week' ? 'on' : ''}`}
                  onClick={() => setRange('week')}
                >
                  Week
                </button>
                <button
                  className={`seg-btn ${range === 'month' ? 'on' : ''}`}
                  onClick={() => setRange('month')}
                >
                  Month
                </button>
              </div>
            </div>

            <div className="weekchart" data-range={range}>
              {chartKeys.map((k, i) => (
                <div className="weekbar-col" key={k} title={`${shortDate(k)} · ${humanMinutes(chartData[i])}`}>
                  <div className="weekbar-track">
                    <motion.div
                      className="weekbar"
                      style={{ background: k === today ? 'var(--grad-accent)' : 'var(--grad-time)' }}
                      initial={prefs.charts ? { height: 0 } : false}
                      animate={{ height: `${(chartData[i] / chartMax) * 100}%` }}
                      transition={
                        prefs.charts
                          ? { duration: 0.5, delay: 0.05 + i * (range === 'week' ? 0.04 : 0.01), ease: [0.22, 1, 0.36, 1] }
                          : { duration: 0 }
                      }
                    />
                  </div>
                  {range === 'week' && <span className="weekbar-label">{dayLabel(k)}</span>}
                </div>
              ))}
            </div>

            {range === 'month' && (
              <div className="chart-axis">
                <span>{shortDate(chartKeys[0])}</span>
                <span>{shortDate(chartKeys[chartKeys.length - 1])}</span>
              </div>
            )}

            <div className="statcard-sub" style={{ marginTop: 'var(--sp-3)' }}>
              Total tracked: {humanMinutes(chartTotal)} this {range}
            </div>
          </Card>
        </div>

        <div className="dash-col">
          {/* Habits today */}
          <Card delay={0.07}>
            <div className="section-title" style={{ marginBottom: 'var(--sp-3)' }}>
              Habits today
            </div>
            {habits.length === 0 ? (
              <EmptyState icon="habit" title="No habits yet" hint="Add habits to build streaks." />
            ) : (
              <ul>
                {habits.map((h) => {
                  const on = isDoneToday(h.done);
                  const streak = currentStreak(h.done);
                  return (
                    <li key={h.id} className="row">
                      <span style={{ fontSize: '1.25rem', width: 28 }} aria-hidden="true">
                        {h.emoji}
                      </span>
                      <div className="row-main">
                        <div className="row-title">{h.name}</div>
                        <div className="habit-dots" style={{ marginTop: 5 }}>
                          {week.map((d) => (
                            <span key={d} className={`dot ${h.done.includes(d) ? 'on' : ''}`} />
                          ))}
                        </div>
                      </div>
                      <span className="streak-badge" style={{ minWidth: 36, justifyContent: 'center' }}>
                        {streak}
                      </span>
                      <button
                        className={`check ${on ? 'on' : ''}`}
                        aria-pressed={on}
                        aria-label={`Mark ${h.name} ${on ? 'not done' : 'done'} today`}
                        onClick={() => toggleHabit(h)}
                      >
                        <Icon name="check" size={15} strokeWidth={2.4} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {/* Up next */}
          <Card delay={0.12}>
            <div className="section-title" style={{ marginBottom: 'var(--sp-3)' }}>
              Up next
              <button className="btn btn-ghost" onClick={() => navigate('/todos')}>
                View all
              </button>
            </div>
            {upNext.length === 0 ? (
              <EmptyState icon="check" title="Nothing queued" hint="You’re all caught up." />
            ) : (
              <ul>
                {upNext.map((t) => (
                  <li key={t.id} className="row">
                    <button
                      className="check"
                      aria-label={`Complete ${t.text}`}
                      onClick={() => {
                        updateItem('todos', t.id, { done: true });
                        haptic('success');
                      }}
                    >
                      <Icon name="check" size={15} strokeWidth={2.4} />
                    </button>
                    <div className="row-main">
                      <div className="row-title">{t.text}</div>
                      {t.due && <div className="row-sub">Due {t.due === today ? 'today' : t.due}</div>}
                    </div>
                    <span className={`tag ${t.priority}`}>{t.priority}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Goals */}
          <Card delay={0.16}>
            <div className="section-title" style={{ marginBottom: 'var(--sp-3)' }}>
              Goals this month
              <button className="btn btn-ghost" onClick={() => navigate('/goals')}>
                View all
              </button>
            </div>
            {monthGoals.length === 0 ? (
              <EmptyState icon="goal" title="No goals yet" hint="Set a monthly goal to aim for." />
            ) : (
              <div className="wrap-grid" style={{ gap: 'var(--sp-4)' }}>
                {monthGoals.map((g) => {
                  const pct = g.target ? g.progress / g.target : 0;
                  return (
                    <div className="mini-goal" key={g.id}>
                      <div className="flex between">
                        <span className="row-title">{g.title}</span>
                        <span className="row-sub">
                          {g.progress}/{g.target}
                        </span>
                      </div>
                      <div className="bar" style={{ marginTop: 8 }}>
                        <motion.div
                          className="bar-fill"
                          style={{ background: `var(--grad-${g.color})` }}
                          initial={prefs.charts ? { width: 0 } : false}
                          animate={{ width: `${pct * 100}%` }}
                          transition={prefs.charts ? { duration: 0.6, ease: [0.22, 1, 0.36, 1] } : { duration: 0 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
