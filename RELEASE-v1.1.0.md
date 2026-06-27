# DailyTrack v1.1.0

Your day, beautifully tracked — a local-first daily activity, habit & goal tracker.

This release makes **cloud sync + Google sign-in work across every platform**, hardens the
Firestore security rules, and fixes the mobile Sync screen.

## ✨ Fixes

### Google sign-in — now works on web, desktop, and Android
- **`authDomain` is auto-derived** from your project ID when you don't paste one — its absence was silently killing Google sign-in.
- **Real error messages** — sign-in failures now show the actual cause (e.g. `auth/unauthorized-domain`, `auth/configuration-not-found`) instead of a generic "check Google is enabled."
- **Popup-based sign-in** on web + desktop. The old redirect flow broke in modern browsers with storage partitioning ("missing initial state"); popup is Firebase's recommended approach.
- **Desktop (Electron) now serves over `http://localhost`** instead of `file://`, which Firebase Auth refused — so sign-in works in the desktop app.
- **Android uses native Google sign-in** (`@capacitor-firebase/authentication`), since Google blocks OAuth inside embedded WebViews.

### Sync & data
- **Hardened, version-controlled Firestore rules** (`firestore.rules` + `firebase.json`) — owner-only, scoped to the five synced collections.
- **Cold-cache guard** so the first sync can't transiently wipe local data.

## 🩹 Hotfixes
- **Mobile Sync layout** — the setup-guide rules box no longer overflows the card on phones; it scrolls inside its own box, and **Copy rules** grabs the full text.
- **Setup-guide clarity** — it now says **Cloud Firestore, not Realtime Database** (pasting Firestore rules into the Realtime Database editor returns a "parse error").

## 📦 Downloads
| Platform | File |
|---|---|
| Android | `DailyTrack-1.1.0-android.apk` |
| Linux · deb | `DailyTrack-1.1.0-amd64.deb` |
| Linux · AppImage | `DailyTrack-1.1.0-x86_64.AppImage` |
| Windows | `DailyTrack-Setup-1.1.0.exe` |

Verify downloads against `SHA256SUMS.txt`.

## ⚠️ Android Google sign-in — one-time setup
The APK's **Google sign-in** needs a one-time Firebase setup (`google-services.json` + your app's
SHA-1 fingerprint). Steps are in **`ANDROID-SIGNIN.md`**. Everything else — habits, to-dos, time,
goals, reviews, and fully offline local-first storage — works out of the box.

## Cloud sync setup (optional)
Sync uses **your own** free Firebase. In the app: **Sync tab → paste your Firebase config →
enable Authentication ▸ Google → create a Cloud Firestore database → publish the rules → Sign in
with Google.** Repeat on any device with the same account.
