import Sheet from './ui/Sheet';
import { ACCENT_PRESETS, useTheme } from '../lib/theme';
import { ANIM_CATEGORIES, useMotion } from '../lib/motion';
import { haptic } from '../lib/haptics';

const LEVELS = ['full', 'reduced', 'off'] as const;

export default function Settings({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme, toggle, accent, setAccent, name, setName } = useTheme();
  const { prefs, preset, setPreset, toggle: toggleAnim } = useMotion();

  return (
    <Sheet open={open} onClose={onClose} title="Settings">
      <div className="field">
        <label htmlFor="set-name">Your name</label>
        <input
          id="set-name"
          className="input"
          value={name}
          placeholder="What should we call you?"
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="field">
        <label>Accent colour</label>
        <div className="swatch-row">
          {ACCENT_PRESETS.map((c) => (
            <button
              key={c}
              className={`swatch ${accent.toLowerCase() === c ? 'on' : ''}`}
              style={{ background: c }}
              aria-label={`Accent ${c}`}
              aria-pressed={accent.toLowerCase() === c}
              onClick={() => {
                setAccent(c);
                haptic('light');
              }}
            />
          ))}
          <label className="swatch swatch-custom" title="Custom colour">
            <span className="sr-only">Choose a custom accent colour</span>
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="field">
        <label>Appearance</label>
        <div className="chip-row">
          <button
            className={`chip ${theme === 'light' ? 'on' : ''}`}
            onClick={() => theme !== 'light' && toggle()}
          >
            Light
          </button>
          <button
            className={`chip ${theme === 'dark' ? 'on' : ''}`}
            onClick={() => theme !== 'dark' && toggle()}
          >
            Dark
          </button>
        </div>
      </div>

      <div className="field">
        <label>Animations</label>
        <div className="segmented" role="group" aria-label="Animation level">
          {LEVELS.map((p) => (
            <button
              key={p}
              className={`seg-btn ${preset === p ? 'on' : ''}`}
              onClick={() => {
                setPreset(p);
                haptic('light');
              }}
            >
              {p[0].toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
        <p className="statcard-sub" style={{ marginTop: 'var(--sp-2)' }}>
          Off is best for low-end PCs.{preset === 'custom' ? ' · Custom' : ''}
        </p>

        <div style={{ marginTop: 'var(--sp-2)' }}>
          {ANIM_CATEGORIES.map((c) => (
            <div className="toggle-row" key={c.key}>
              <span className="toggle-row-label">{c.label}</span>
              <button
                role="switch"
                aria-checked={prefs[c.key]}
                aria-label={c.label}
                className={`switch ${prefs[c.key] ? 'on' : ''}`}
                onClick={() => {
                  toggleAnim(c.key);
                  haptic('light');
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </Sheet>
  );
}
