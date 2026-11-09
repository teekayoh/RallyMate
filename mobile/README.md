# RallyMate Mobile

This is the Expo/React Native version of RallyMate. It replicates the web MVP as a phone-first app.

The package is currently set to Expo SDK 54 for the quickest Expo Go test on a physical iPhone. Expo's SDK 55 notes say App Store Expo Go remained on SDK 54 during the transition window, so SDK 54 is the safer first scan target.

- Browse open Birmingham tennis requests
- Filter by area and skill level
- Create a play request
- Mark interest in another player's request
- Accept one interested player on your own request
- View accepted matches
- Edit the active player profile
- Switch demo players while testing

## Run On iPhone

Install Expo Go on your iPhone, then run this from the `mobile` folder:

```powershell
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
npm install
npm start
```

Expo will show a QR code. Scan it with your iPhone camera or Expo Go.

Your iPhone and computer should usually be on the same Wi-Fi network. If the QR connection is awkward, choose Expo's tunnel option in the terminal.

## Supabase

The mobile app has a Supabase client scaffold in `src/services/supabase.ts`.

Add your Supabase project URL and anon key here:

```ts
// src/config/supabase.ts
export const supabaseMobileConfig = {
  url: "https://your-project.supabase.co",
  anonKey: "your-public-anon-key"
};
```

Use the existing workspace schema:

```text
../supabase/schema.sql
```

The current mobile screen flow still uses demo/local state so you can test the product feel before wiring real accounts.
