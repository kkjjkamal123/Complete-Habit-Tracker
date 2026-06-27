# Changelog

All notable changes to DailyTrack. Format follows [Keep a Changelog](https://keepachangelog.com);
versions follow [Semantic Versioning](https://semver.org).

## [1.1.0] — 2026-06-28

A maintenance + reliability release. v1.1 makes **cloud sync and Google sign-in actually work on
every platform**, hardens the Firestore security rules, and polishes the mobile and desktop
experience. **No migration needed** — local data and your Firebase config carry over unchanged.

### Added
- **Native Android Google sign-in** (`@capacitor-firebase/authentication`). Google blocks OAuth
  inside embedded WebViews, so the APK now authenticates through Google Play services and exchanges
  the credential into the Firebase JS SDK. (One-time `google-services.json` setup — see
  `ANDROID-SIGNIN.md`.)
- **Version-controlled Firestore rules** — `firestore.rules` + `firebase.json`, deployable with
  `firebase deploy --only firestore:rules` instead of copy-pasting.
- **Real sign-in error messages** — the actual Firebase error code is shown
  (`auth/unauthorized-domain`, `auth/configuration-not-found`, `auth/popup-blocked`, …) instead of a
  generic "check Google is enabled."
- **Full desktop icon set** — Linux installers now ship every hicolor size (16–512), so the app
  launcher shows the DailyTrack icon.
- **Docs** — `ANDROID-SIGNIN.md`, `RELEASE-v1.1.0.md`, and this `CHANGELOG.md`.

### Changed
- **Sign-in now uses popups, not redirects** (web + desktop). `signInWithRedirect` broke in modern
  browsers with storage partitioning ("missing initial state"); popup is Firebase's recommended
  flow and works on mobile web too.
- **Desktop (Electron) serves the app over `http://localhost`** instead of `file://`, which Firebase
  Auth refused — sign-in now works in the desktop build.
- **`authDomain` is auto-derived** from the project ID when you don't paste it (its absence silently
  killed Google sign-in).
- **Setup guide** now says **Cloud Firestore, not Realtime Database** — pasting Firestore rules into
  the Realtime Database editor returns a "parse error."
- **Firestore rules hardened** — from a blanket `match /users/{uid}/{document=**}` to per-collection,
  owner-only access with document-id validation.

### Fixed
- **Google sign-in was broken on web, desktop, and Android in v1.0** — now works on all three.
- **Mobile Sync page** — the setup-guide rules box no longer overflows the card; it scrolls inside
  its own box, and **Copy rules** grabs the full text.
- **Cold-cache sync guard** — a transient empty Firestore cache snapshot can no longer wipe local
  data on the first sync.
- **Linux launcher icon** — `.deb` / `.AppImage` previously shipped only a 1024×1024 icon (not a
  standard menu size); now they install the full set.

---

### File comparison (v1.0.0 → v1.1.0)

**New files**

| File | Purpose |
|---|---|
| `firestore.rules` | Version-controlled Firestore security rules |
| `firebase.json` | Firebase CLI config (rules deploy) |
| `src/lib/platform.ts` | Runtime platform detection (web / Electron / native) |
| `src/lib/nativeAuth.ts` | Native Capacitor Google sign-in flow |
| `ANDROID-SIGNIN.md` | Android native sign-in setup guide |
| `RELEASE-v1.1.0.md` | v1.1.0 release notes |
| `CHANGELOG.md` | This file |

**Modified files**

| File | Change |
|---|---|
| `src/lib/auth.tsx` | Per-platform sign-in → popup; real error surfacing; native path |
| `src/firebase/config.ts` | Auto-derive `authDomain` |
| `src/lib/sync.ts` | Cold-cache snapshot guard |
| `src/pages/Sync.tsx` | Layout fix, Google button, Firestore-vs-Realtime guide |
| `src/styles/ui.css` | Sync layout + mobile overflow CSS |
| `electron/main.cjs` | Serve over `http://localhost` (was `file://`) |
| `capacitor.config.ts` | `FirebaseAuthentication` plugin config |
| `build/make-icon.cjs` | Generate the full icon size set |
| `package.json` | Add native-auth plugin; `linux.icon` → icon-set dir |
| `src/main.tsx` | Router comment (Electron now serves over http) |
| `.gitignore` | Ignore secrets, signing keys, `google-services.json`, build outputs |

### Artifact comparison

| Platform | v1.0.0 | v1.1.0 |
|---|---|---|
| Android | `DailyTrack-1.0.0-android.apk` | `DailyTrack-1.1.0-android.apk` |
| Linux · deb | `DailyTrack-1.0.0-linux-amd64.deb` | `DailyTrack-1.1.0-amd64.deb` |
| Linux · AppImage | `DailyTrack-1.0.0-linux-x86_64.AppImage` | `DailyTrack-1.1.0-x86_64.AppImage` |
| Windows | `DailyTrack-1.0.0-windows-setup.exe` | `DailyTrack-Setup-1.1.0.exe` |

---

## [1.0.0]

Initial release — a local-first daily activity, habit, and goal tracker: **Home, To-Do, Time,
Habits, Goals, Review**, with optional Firebase cloud sync. Shipped for Android, Linux
(deb + AppImage), and Windows.
