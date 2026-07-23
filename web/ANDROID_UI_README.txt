VYAPAR AI ANDROID UI v3

What changed:
- Compact Android app bar
- 5-item bottom navigation
- More sheet for AI Upload, Calculator, Plans and Settings
- Flat dark cards inspired by modern streaming apps
- Faster CSS-only startup loader
- Simpler OTP login screen
- Larger touch targets and Android safe-area support
- No blur-heavy glass effects
- Existing business, login, cloud and Razorpay logic preserved

Deploy:
1. Upload/replace all files in the frontend repository web folder.
2. Commit changes.
3. Render frontend -> Manual Deploy -> Clear build cache & deploy.
4. Open in Incognito or hard refresh.

No backend or Render Environment change is required for this UI update.


V3.1 THEME FIX:
- Dark palette matched to bluish-black (#06111f).
- Light mode now changes all cards, navigation, sheets, forms and system theme color.
- Theme preference persists through the existing app state.
- OTP login screen also respects the saved light/dark preference.


V3.2 CLEAN OPTIONS
- Developer Mode option and hidden logo unlock removed.
- Liquid Glass option removed and glass effect permanently disabled.
- Settings now only shows Appearance, Performance and Data Safety.
