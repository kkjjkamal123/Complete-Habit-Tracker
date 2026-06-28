import { useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '../lib/auth';
import { onSyncError } from '../lib/sync';
import { useOnline, syncStatus, STATUS_LABEL } from '../lib/useOnline';
import {
  FB_FIELDS,
  getStoredConfig,
  saveConfig,
  clearConfig,
  parseFirebaseConfig,
  type FbConfig,
} from '../firebase/config';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { isNativePlatform } from '../lib/platform';

// Kept byte-identical (functionally) to firestore.rules so the in-app copy and
// the version-controlled file never drift.
const RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId} {
      allow read, write: if isOwner(userId);
      match /{collection}/{itemId} {
        allow read, delete: if isOwner(userId);
        allow create, update: if isOwner(userId)
          && collection in ['activities', 'todos', 'habits', 'goals', 'reviews']
          && request.resource.data.id == itemId;
      }
    }
  }
}`;

const STATUS_DESC: Record<ReturnType<typeof syncStatus>, string> = {
  off: 'Not connected. Add your Firebase keys below to enable cross-device sync.',
  signedOut: 'Connected to Firebase. Sign in to start syncing.',
  synced: 'Your data is syncing across all your signed-in devices.',
  offline: 'You’re offline — changes are saved locally and will sync when you reconnect.',
};

/** Official multi-colour Google "G" for the sign-in button. */
function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

export default function Sync() {
  const { user, enabled, authError, signIn, signOutUser } = useAuth();
  const online = useOnline();
  const status = syncStatus(enabled, !!user, online);

  const stored = getStoredConfig() ?? {};
  const [fields, setFields] = useState<Partial<FbConfig>>(() => {
    const init: Partial<FbConfig> = {};
    for (const { key } of FB_FIELDS) init[key] = stored[key] ?? '';
    return init;
  });
  const [paste, setPaste] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [syncErr, setSyncErr] = useState<string | null>(null);
  useEffect(() => onSyncError(setSyncErr), []);

  function saveAndConnect() {
    let cfg: Partial<FbConfig> = { ...fields };
    if (paste.trim()) cfg = { ...cfg, ...parseFirebaseConfig(paste) };
    if (!cfg.apiKey || !cfg.projectId || !cfg.appId) {
      setError(
        'Couldn’t find the keys. Paste the whole config snippet, or fill API key, Project ID and App ID below.',
      );
      return;
    }
    saveConfig(cfg);
    location.reload();
  }

  function disconnect() {
    clearConfig();
    location.reload();
  }

  async function copyRules() {
    try {
      await navigator.clipboard.writeText(RULES);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked */
    }
  }

  // Android is local-first — cloud sync + sign-in live on web/desktop, where each
  // person connects their own Firebase.
  if (isNativePlatform()) {
    return (
      <>
        <header className="page-head">
          <h1>Sync</h1>
          <p>DailyTrack keeps your data on this device.</p>
        </header>
        <Card>
          <div className="empty">
            <h3>Local-first on Android</h3>
            <p>
              Everything you track stays on this device. For cloud sync across devices, open
              DailyTrack on the web or desktop and connect your own free Firebase.
            </p>
          </div>
        </Card>
      </>
    );
  }

  const problem = authError || syncErr;

  return (
    <>
      <header className="page-head">
        <h1>Sync</h1>
        <p>Connect your own free Firebase to sync across all your devices.</p>
      </header>

      {/* Status + account */}
      <Card>
        <div className="sync-status">
          <span className="status-dot lg" data-status={status} />
          <div className="row-main">
            <div className="row-title">{STATUS_LABEL[status]}</div>
            <div className="sync-status-desc">{STATUS_DESC[status]}</div>
          </div>
        </div>

        {enabled &&
          (user ? (
            <div className="sync-account">
              <div className="account">
                {user.photoURL ? (
                  <img
                    className="account-avatar"
                    src={user.photoURL}
                    alt=""
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="account-avatar account-avatar-fallback">
                    {(user.displayName || user.email || '?').charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="row-main">
                  <div className="row-title">{user.displayName || 'Signed in'}</div>
                  {user.email && <div className="row-sub">{user.email}</div>}
                </div>
              </div>
              <Button variant="soft" onClick={() => void signOutUser()}>
                Sign out
              </Button>
            </div>
          ) : (
            <div className="sync-cta">
              <Button variant="soft" onClick={() => void signIn()}>
                <GoogleMark />
                Sign in with Google
              </Button>
            </div>
          ))}

        {problem && <p className="form-error">{problem}</p>}
      </Card>

      {/* Connect */}
      <Card delay={0.05}>
        <div className="section-title" style={{ marginBottom: 'var(--sp-3)' }}>
          {enabled ? 'Update keys' : 'Connect your Firebase'}
        </div>

        <div className="field">
          <label htmlFor="fb-paste">Paste your Firebase config</label>
          <textarea
            id="fb-paste"
            className="codebox"
            spellCheck={false}
            placeholder={
              'const firebaseConfig = {\n  apiKey: "AIza…",\n  authDomain: "your-app.firebaseapp.com",\n  projectId: "your-app",\n  appId: "1:123:web:abc…"\n};'
            }
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
          />
        </div>

        <div className="sync-form-actions">
          <Button onClick={saveAndConnect}>Save &amp; connect</Button>
          <button className="btn btn-ghost" onClick={() => setShowManual((s) => !s)}>
            {showManual ? 'Hide manual fields' : 'Or fill fields manually'}
          </button>
          {enabled && (
            <button className="btn btn-ghost sync-disconnect" onClick={disconnect}>
              Disconnect
            </button>
          )}
        </div>
        {error && <p className="form-error">{error}</p>}

        {showManual && (
          <div className="wrap-grid cols-2" style={{ marginTop: 'var(--sp-4)' }}>
            {FB_FIELDS.map((f) => (
              <div className="field" key={f.key} style={{ marginBottom: 0 }}>
                <label htmlFor={`fb-${f.key}`}>
                  {f.label} {f.required && <span className="req">*</span>}
                </label>
                <input
                  id={`fb-${f.key}`}
                  className="input"
                  spellCheck={false}
                  value={fields[f.key] ?? ''}
                  onChange={(e) => setFields((s) => ({ ...s, [f.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Guide */}
      <Card delay={0.1}>
        <div className="section-title" style={{ marginBottom: 'var(--sp-4)' }}>
          Setup guide · about 3 minutes
        </div>
        <ol className="steps">
          <Step n={1}>
            Go to{' '}
            <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer">
              console.firebase.google.com
            </a>{' '}
            and create a project (it’s free).
          </Step>
          <Step n={2}>
            Click the <strong>Web</strong> icon (<code>&lt;/&gt;</code>) to add a web app, then copy
            the <code>firebaseConfig</code> snippet and paste it above.
          </Step>
          <Step n={3}>
            Open <strong>Authentication → Sign-in method</strong> and enable <strong>Google</strong>.
          </Step>
          <Step n={4}>
            Open <strong>Build → Firestore Database</strong> and create one (Production mode is
            fine). It must be <strong>Cloud Firestore</strong> — <em>not</em> Realtime Database.
            They’re different products with different rules.
          </Step>
          <Step n={5}>
            In <strong>Firestore Database → Rules</strong> (not Realtime Database — that one wants
            JSON and will say “parse error”), paste these so only you can read your data:
            <div className="codebox-wrap">
              <pre className="codebox">{RULES}</pre>
              <button className="btn btn-soft copy-btn" onClick={copyRules}>
                {copied ? 'Copied' : 'Copy rules'}
              </button>
            </div>
          </Step>
          <Step n={6}>
            Come back here, hit <strong>Save &amp; connect</strong>, then{' '}
            <strong>Sign in with Google</strong>. Repeat on any other device with the same account.
          </Step>
        </ol>
        <p className="sync-note">
          The desktop and Android apps sign in the same way. On Android, native Google sign-in needs
          a couple of extra one-time steps — see <code>ANDROID-SIGNIN.md</code>.
        </p>
      </Card>
    </>
  );
}

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="step">
      <span className="step-num">{n}</span>
      <div className="step-body">{children}</div>
    </li>
  );
}
