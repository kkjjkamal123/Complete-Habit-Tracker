import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCollection, addItem, updateItem, removeItem, uid } from '../lib/store';
import { haptic } from '../lib/haptics';
import { dayKey } from '../lib/date';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Fab from '../components/ui/Fab';
import Sheet from '../components/ui/Sheet';
import EmptyState from '../components/ui/EmptyState';
import Icon from '../components/ui/Icon';
import type { Todo } from '../lib/types';

const PRIORITIES: Todo['priority'][] = ['low', 'med', 'high'];

export default function Todos() {
  const todos = useCollection('todos');
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [priority, setPriority] = useState<Todo['priority']>('med');
  const [due, setDue] = useState('');

  const active = todos.filter((t) => !t.done);
  const done = todos.filter((t) => t.done);

  function add() {
    if (!text.trim()) return;
    addItem('todos', {
      id: uid(),
      text: text.trim(),
      done: false,
      createdAt: new Date().toISOString(),
      priority,
      due: due || undefined,
    });
    haptic('medium');
    setText('');
    setDue('');
    setPriority('med');
    setOpen(false);
  }

  function toggle(t: Todo) {
    updateItem('todos', t.id, { done: !t.done });
    haptic(t.done ? 'light' : 'success');
  }

  return (
    <>
      <header className="page-head flex between">
        <div>
          <h1>To-Do</h1>
          <p>
            {active.length} open · {done.length} done
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Icon name="plus" size={16} strokeWidth={2.2} />
          Add
        </Button>
      </header>

      {todos.length === 0 ? (
        <Card>
          <EmptyState
            icon="check"
            title="All clear"
            hint="Add your first task and start checking things off."
            action={<Button onClick={() => setOpen(true)}>Add a task</Button>}
          />
        </Card>
      ) : (
        <Card>
          <ul>
            <AnimatePresence initial={false}>
              {[...active, ...done].map((t) => (
                <motion.li
                  key={t.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`row ${t.done ? 'done' : ''}`}
                >
                  <button
                    className={`check ${t.done ? 'on' : ''}`}
                    aria-pressed={t.done}
                    aria-label={t.done ? 'Mark not done' : 'Mark done'}
                    onClick={() => toggle(t)}
                  >
                    <Icon name="check" size={15} strokeWidth={2.4} />
                  </button>
                  <div className="row-main">
                    <div className="row-title">{t.text}</div>
                    {t.due && (
                      <div className="row-sub">
                        Due {t.due === dayKey() ? 'today' : t.due}
                      </div>
                    )}
                  </div>
                  {!t.done && <span className={`tag ${t.priority}`}>{t.priority}</span>}
                  <button
                    className="icon-btn"
                    aria-label="Delete task"
                    onClick={() => {
                      removeItem('todos', t.id);
                      haptic('light');
                    }}
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </Card>
      )}

      <Fab onClick={() => setOpen(true)} label="Add task" />

      <Sheet open={open} onClose={() => setOpen(false)} title="New task">
        <div className="field">
          <label htmlFor="todo-text">Task</label>
          <input
            id="todo-text"
            className="input"
            value={text}
            autoFocus
            placeholder="What needs doing?"
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
          />
        </div>
        <div className="field">
          <label>Priority</label>
          <div className="chip-row">
            {PRIORITIES.map((p) => (
              <button
                key={p}
                className={`chip ${priority === p ? 'on' : ''}`}
                onClick={() => setPriority(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label htmlFor="todo-due">Due date (optional)</label>
          <input
            id="todo-due"
            type="date"
            className="input"
            value={due}
            onChange={(e) => setDue(e.target.value)}
          />
        </div>
        <Button onClick={add} {...{ style: { width: '100%' } }}>
          Add task
        </Button>
      </Sheet>
    </>
  );
}
