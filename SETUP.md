# Big Bro — Setup Checklist

Steps that need your input (accounts/credentials I can't create for you).

## 1. Supabase project

1. Create a project at https://supabase.com/dashboard.
2. Project Settings → API: copy the **Project URL** and **anon public** key, and the **service_role** key (keep this one secret).
3. Copy `.env.example` to `.env` in this folder and fill in:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Run the schema: open the Supabase SQL Editor and paste/run `supabase/migrations/0001_init_schema.sql`.
5. Import the Phase 1 workout program: `npm run import:workout-program` (reads `data/workout_program.json`, writes via the service-role key).

## 2. EAS Build (no local Mac needed)

1. `npm i -g eas-cli`
2. `eas login` (create a free Expo account if you don't have one)
3. `eas build:configure` — links this project to an EAS project (eas.json is already set up)
4. Apple Developer Program enrollment ($99/yr) is required for any iOS build/provisioning — enroll at https://developer.apple.com/programs/ if you haven't.
5. `eas device:create` — registers your physical iPhone via a QR code (needed for internal/dev-client distribution).
6. First build: `eas build --profile development --platform ios` and `eas build --profile development --platform android`.
7. Install the resulting build on your iPhone (via the link/QR EAS prints) and on an Android emulator.

## 3. Daily dev loop

- `npm start` — starts Metro; the installed dev-client app connects over Wi-Fi for instant JS refresh.
- You only need a full `eas build` again when a native module or app.json native config changes (this will happen in the HealthKit milestone).

## Notes

- The iOS Simulator does **not** support HealthKit, and there's no Simulator on Windows anyway — HealthKit testing always requires the physical iPhone build.
- Node.js was upgraded to v24.18.0 for this project via a user-level PATH entry (`C:\Users\mailf\node-versions\node-v24.18.0-win-x64`) — your existing Node 20 install elsewhere is untouched.
