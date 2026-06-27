# Android — finishing native Google sign-in

Google **blocks** OAuth inside embedded WebViews, so `signInWithPopup`/`signInWithRedirect`
can never work in the Android app. V1.1 routes Android sign-in through the native
`@capacitor-firebase/authentication` plugin instead and exchanges its credential for a
Firebase JS-SDK session (so Firestore sync keeps using the same user).

The **code + native config** are already wired: `src/lib/nativeAuth.ts`, `src/lib/auth.tsx`,
`capacitor.config.ts`, the npm package, and — critically — `rgcfaIncludeGoogle = true` in
`android/variables.gradle`, which compiles the plugin's native Google method so it isn't
`[UNIMPLEMENTED]`. The steps below are the parts that need your Firebase project + signing
keystore — they can't be done from the repo, and Google sign-in stays inert until they're done.

## 1. Add the Android app to Firebase (once)

Firebase console → **Project settings → Your apps → Add app → Android**

- **Android package name:** `com.kamalesh.dailytrack` (must match `appId` in `capacitor.config.ts`)
- Nickname / debug SHA-1: optional here, added in step 2.

## 2. Register your signing fingerprints (SHA-1 / SHA-256)

Google sign-in only returns a valid token if the certificate that signed the APK is
registered. Get the fingerprints:

```bash
# Debug builds (npm run android:apk → assembleDebug)
keytool -list -v -alias androiddebugkey \
  -keystore ~/.android/debug.keystore -storepass android -keypass android | grep -E 'SHA1|SHA256'

# Release builds — use YOUR release keystore instead:
keytool -list -v -alias <your-alias> -keystore <path-to-release.keystore> | grep -E 'SHA1|SHA256'
```

Add **both** SHA-1 and SHA-256 (debug now; release before you publish) under
Firebase console → Project settings → Your apps → Android app → **Add fingerprint**.

> Distributing through Google Play? Also add the **Play App Signing** SHA-1 from
> Play Console → Setup → App integrity, or sign-in fails only for store installs.

## 3. Download `google-services.json`

From the same Android-app settings page, download `google-services.json` and place it at:

```
android/app/google-services.json
```

> `android/.gitignore` has a **commented-out** `google-services.json` line (~line 65).
> Since `Complete-Habit-Tracker` is a public repo, uncomment it (or add
> `app/google-services.json`) to keep this file out of git before you build.

## 4. Apply the Google-services Gradle plugin

**`android/build.gradle`** — in `buildscript { dependencies { … } }`:

```gradle
classpath 'com.google.gms:google-services:4.4.2'
```

**`android/app/build.gradle`** — at the very bottom of the file:

```gradle
apply plugin: 'com.google.gms.google-services'
```

This is what generates the `default_web_client_id` resource the plugin uses, from the
OAuth **Web client** Firebase auto-creates when you enable Google sign-in.

## 5. Enable Google in Authentication

Firebase console → **Authentication → Sign-in method → Google → Enable** (if not already).

## 6. Build & run

```bash
npm run android:apk     # build + cap sync + assembleDebug
# or, while iterating:
npm run android:run
```

`npx cap sync android` (run by the scripts above) links the native plugin.

## Quick troubleshooting

| Symptom on device | Cause |
|---|---|
| `Default FirebaseApp is not initialized` | `google-services.json` missing or step 4 not applied |
| Sign-in dialog opens then errors with code **10 / DEVELOPER_ERROR** | SHA-1 not registered (or wrong keystore / missing Play signing SHA-1) |
| `signInWithGoogle` returns no `idToken` | OAuth **Web** client missing — re-enable Google sign-in so Firebase recreates it, re-download `google-services.json` |
| Works on debug, fails on Play install | Add the Play App Signing SHA-1 (step 2 note) |
