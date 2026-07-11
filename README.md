#FOR EMAIL SUPPORT - anujguptaofficial09@gmail.com
# Vyapar AI - Final Developer Package

Vyapar AI is an offline-first business manager for small retailers.

## Included

- Web version
- Android WebView version
- Clean user-facing UI
- Hidden Developer Mode
- AI extraction backend template
- Local auto-save
- JSON backup/restore
- Sales/profit/stock management
- HD profit graph and averages
- Adjustable code calculator
- Light/Dark/Liquid Glass controls
- Low-end Android Lite mode

## Open app

Web:
```text
web/index.html
```

Android asset:
```text
android-app/app/src/main/assets/index.html
```

## Developer Mode

Tap app logo 7 times.

Use this to set:
- AI extraction endpoint
- Billing mode
- Backend health test

## Backend

See:
```text
backend-firebase-functions/
docs/FINAL_DEVELOPER_SETUP.md
```

## Production note

The app shell is prepared. Live AI, cloud sync and payment activation require your own deployment keys/accounts and server-side configuration.

## AI Upload merged fix
- JSON/CSV profit import now goes to Monthly Profit, not Sales.
- CSV rows with year/month/profit are recognized as profit records.
- Duplicate month import updates the existing month instead of double adding.
- Settings includes Remove Bad Imported Sales cleanup for old wrong CSV test data.
- Photo/PDF smart reading still needs the backend AI Extract Endpoint in Developer Mode.


## GitHub Actions APK Build Ready

This package includes a mobile-friendly GitHub Actions workflow:

```text
.github/workflows/build-android.yml
```

Repo root must contain `android-app/` and `.github/` directly. Then run:

```text
GitHub → Actions → Build Vyapar AI Android APK → Run workflow
```

Artifacts generated:

```text
VyaparAI-debug-apk
VyaparAI-debug-aab
```

Detailed mobile guide:

```text
docs/GITHUB_MOBILE_APK_BUILD.md
```
