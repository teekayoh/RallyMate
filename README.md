# RallyMate

RallyMate is a mobile-first tennis partner matching MVP for Birmingham. It lets a player create a request to play, lets nearby players mark interest, and lets the request creator accept one interested player to create a match.

The active direction is now the Expo/React Native mobile app in `mobile/`. The original browser prototype remains here as a reference for the MVP flow.

## Mobile App

The mobile app lives in `mobile/` and is built for Expo Go testing on iPhone.

```powershell
cd mobile
npm install
npm start
```

Then scan the Expo QR code with your iPhone camera or Expo Go.

The mobile app currently includes the same core MVP flow: browse requests, create requests, mark interest, accept a player, view matches, edit a profile, and switch demo players for testing.

This workspace still includes the dependency-free web prototype so the product flow remains visible without package installs. The planned production backend remains Supabase.

## Supabase Mode

The app runs in demo mode until credentials are added to `config.js`.

```js
export const supabaseConfig = {
  url: "https://your-project.supabase.co",
  anonKey: "your-public-anon-key"
};
```

After adding credentials, run `supabase/schema.sql` in the Supabase SQL editor. The browser app loads `@supabase/supabase-js` from a CDN when Supabase mode is enabled.

## Run Locally

Use the bundled Node runtime available in this Codex workspace:

```powershell
& 'C:\Users\OLAYINKA\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' server.mjs
```

Then open:

```text
http://localhost:4173
```

## MVP Included

- Mobile-first app shell
- Demo profile
- Browse open Birmingham play requests
- Filter requests by area and skill level
- Create a play request
- Mark interest in another player's request
- Accept one interested player on your own request
- Match page with both players' details
- Placeholder chat area for version 2
- Local storage persistence for prototype state
- Supabase Auth-ready sign in/sign up flow
- Supabase-backed profiles, requests, interests, and match acceptance when configured

## Next Build Steps

1. Convert this prototype to Next.js with TypeScript once package tooling is available.
2. Create a Supabase project and run `supabase/schema.sql`.
3. Add the project URL and anon key to `config.js`.
4. Add demo rows with `supabase/seed.sql` after real Supabase Auth users exist.
5. Add private realtime chat.
6. Add Birmingham court discovery with external booking links.

## Production Stack Target

- Frontend: Next.js with TypeScript
- Styling: Tailwind CSS
- Auth: Supabase Auth
- Database: Supabase Postgres
- Realtime chat later: Supabase Realtime
- Hosting: Vercel
