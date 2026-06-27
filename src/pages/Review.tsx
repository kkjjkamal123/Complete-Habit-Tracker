import { useMemo, useState } from 'react';
import { useCollection, upsertItem } from '../lib/store';
import { dayKey, prettyDate } from '../lib/date';
import { haptic } from '../lib/haptics';
import { celebrate } from '../lib/celebrate';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import type { Review as ReviewT } from '../lib/types';

const MOODS: { v: ReviewT['mood']; e: string; label: string }[] = [
  { v: 1, e: '😞', label: 'Rough' },
  { v: 2, e: '😕', label: 'Meh' },
  { v: 3, e: '😐', label: 'Okay' },
  { v: 4, e: '🙂', label: 'Good' },
  { v: 5, e: '🤩', label: 'Great' },
];

export default function Review() {
  const reviews = useCollection('reviews');
  const today = dayKey();
  const existing = useMemo(() => reviews.find((r) => r.date === today), [reviews, today]);

  const [mood, setMood] = useState<ReviewT['mood']>(existing?.mood ?? 3);
  const [wins, setWins] = useState(existing?.wins ?? '');
  const [improve, setImprove] = useState(existing?.improve ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [saved, setSaved] = useState(false);

  function save() {
    upsertItem('reviews', {
      id: today,
      date: today,
      mood,
      wins: wins.trim(),
      improve: improve.trim(),
      notes: notes.trim(),
    });
    setSaved(true);
    celebrate();
    setTimeout(() => setSaved(false), 2200);
  }

  const past = reviews
    .filter((r) => r.date !== today)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7);

  return (
    <>
      <header className="page-head">
        <h1>Daily review</h1>
        <p>{prettyDate()}</p>
      </header>

      <Card>
        <div className="field">
          <label>How was today?</label>
          <div className="mood-row" role="radiogroup" aria-label="Mood">
            {MOODS.map((m) => (
              <button
                key={m.v}
                className={`mood ${mood === m.v ? 'on' : ''}`}
                role="radio"
                aria-checked={mood === m.v}
                aria-label={m.label}
                onClick={() => {
                  setMood(m.v);
                  haptic('light');
                }}
              >
                {m.e}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label htmlFor="wins">What went well</label>
          <textarea
            id="wins"
            className="textarea"
            value={wins}
            placeholder="Wins, big or small…"
            onChange={(e) => setWins(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="improve">To improve</label>
          <textarea
            id="improve"
            className="textarea"
            value={improve}
            placeholder="What could go better tomorrow?"
            onChange={(e) => setImprove(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            className="textarea"
            value={notes}
            placeholder="Anything else on your mind…"
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <Button onClick={save} {...{ style: { width: '100%' } }}>
          {saved ? '✓ Saved' : existing ? 'Update review' : 'Save review'}
        </Button>
      </Card>

      {past.length > 0 && (
        <Card delay={0.05}>
          <div className="section-title" style={{ marginBottom: 'var(--sp-3)' }}>
            Recent reviews
          </div>
          <ul>
            {past.map((r) => (
              <li key={r.id} className="row">
                <span style={{ fontSize: '1.5rem' }} aria-hidden="true">
                  {MOODS.find((m) => m.v === r.mood)?.e}
                </span>
                <div className="row-main">
                  <div className="row-title">{r.date}</div>
                  <div className="row-sub">{r.wins || r.notes || 'No notes'}</div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
