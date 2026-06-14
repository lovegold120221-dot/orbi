<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Orbit Meeting / Live Translate — Agent Guide

## Repo layout

Two independent projects in one monorepo:
- **Frontend:** `src/` — Next.js 16 (Turbopack, React 19), pnpm
- **Agent:** `translator/` — Python LiveKit Agents worker, uv

Other directories at root:
- `components/` — **Legacy `.js` files.** Do not modify. Not part of the main app. Has pre-existing lint warnings — ignore them.
- `electron/` — Electron desktop wrapper (Next.js standalone server)
- `android/` — Capacitor Android project (loads production web app)
- `supabase/` — SQL migrations (profiles, meetings, recordings, chat_messages)
- `scripts/` — setup.sh (idempotent: seeds `.env` files + installs deps)
- `public/` — PWA manifest, service worker, icons
- `.github/workflows/deploy.yml` — Vercel auto-deploy on push/PR to main

## Critical naming (must keep in sync)

The agent dispatch name `"gemini-translator"` is hardcoded in **two places** — if you rename it, change both:

| File | Location |
|------|----------|
| `translator/src/agent.py` | `@server.rtc_session(agent_name="gemini-translator")` |
| `src/app/api/token/route.ts` | `const TRANSLATOR_AGENT_NAME = "gemini-translator"` |

The unique name avoids collisions with stale Cloud Agents registered under common names.

## Config pairing (must mirror)

`src/lib/config.ts` and `translator/src/config.py` share overlapping constants. Keep them in sync:

| Constant | Frontend | Agent |
|----------|----------|-------|
| Max participants | `MAX_PARTICIPANTS = 40` | (token route, hardcoded in `route.ts`) |
| Native sentinel | `NATIVE_LANG = "none"` | `NATIVE_LANG = "none"` |
| Lang attribute key | `PARTICIPANT_LANG_ATTR = "lang"` | `PARTICIPANT_LANG_ATTR = "lang"` |
| Gemini model | (varies per route) | `GEMINI_MODEL = "gemini-3.5-live-translate-preview"` |

The token route also hardcodes `SESSION_TTL_SECONDS`, `EMPTY_ROOM_TIMEOUT`, `DEPARTURE_TIMEOUT`, and `MAX_PARTICIPANTS` separately from `config.ts` — keep both in sync.

## Commands

```bash
# Setup (idempotent — seeds .env files + installs both halves)
pnpm run setup

# Dev (runs frontend + agent concurrently)
pnpm run dev

# One half at a time
pnpm run dev:web       # next dev on :3000
pnpm run dev:agent     # uv run python src/agent.py dev (from translator/)

# Frontend
pnpm build          # next build (output: standalone, except on Vercel)
pnpm lint           # eslint
pnpm start          # next start

# Agent only (from translator/)
uv run pytest              # 14 unit tests (pure logic, no LiveKit/Gemini connectivity)
uv run ruff check           # lint
uv run ruff format          # format
```

Build validation: always run `pnpm build` and `cd translator && uv run pytest` before claiming a change is done.

## Env files

| File | Variables | Used by |
|------|-----------|---------|
| `.env.local` | `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` | Frontend token route |
| `translator/.env.local` | `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `GEMINI_API_KEY` | Python agent |
| `.env` (not committed) | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings persistence |

## Translation track routing

Agent publishes tracks named `tx:<speaker_identity>:<track_source>:<target_lang>`.
- `track_source` is `"mic"` or `"screen_share_audio"`
- Frontend parses this in `useTranslationRouting.ts` to subscribe/unsubscribe
- Agent-published tracks carry `lk.translation` text-stream for captions

The router uses a demand model: a translation session exists iff at least one listener wants language `T` AND speaker `S` has an enabled mic AND `S.lang != T`. Grace teardown is 10s to avoid thrash on brief mutes.

## Key gotchas

- **Build output differs by environment:** `next.config.ts` detects Vercel/CI at build time and sets `output: undefined` (Vercel handles its own). Locally and in Docker, `output: "standalone"` is used. Docker copies `.next/standalone` for the production server.
- **Session creation:** `sessionStorage` stores name + lang before navigating to `/room`. Read from `sessionStorage` inside `useEffect`, **never** in a `useState` initializer — prevents hydration mismatch.
- **Settings persistence:** Supabase upsert in `UserContext.tsx`. Falls back silently if the `profiles` table doesn't exist. User identity uses auth user.id when logged in, anonymous UUID in `localStorage("orbitUserId")` when not.
- **Language picker:** 240+ languages + `"none"` sentinel. The full list is in `src/lib/languages.ts`. No Belgium regional variants remain in the current codebase.
- **API routes** (`/api/token`, `/api/translate-voice`, `/api/translate-text`, `/api/breakout`, `/api/moderate`, `/api/record`) are stateless — Vercel-friendly.
- **Translator uses raw WebSockets** (not `@google/genai` SDK's `live.connect()`) to control exact JSON shape sent to Gemini v1beta. The `google-genai` SDK was removed as a dependency. See `translator/src/session.py` docstring. If you need Gemini SDK features later, re-add the package.
- **TrackSource enum name trap:** LiveKit protobuf defines `SOURCE_SCREENSHARE_AUDIO` (no underscore between SCREEN and SHARE). The spelling `SOURCE_SCREEN_SHARE_AUDIO` silently raises `AttributeError` — both occurrences in `router.py` must match.
- **Agent dependency pin:** `yarl<1.24` in `translator/pyproject.toml` — cp310-only wheel issue. Do not remove without testing on all supported Python versions.
- **`showSaveFilePicker()` requires secure context** (HTTPS or localhost). On HTTP deploys, recording falls back to `<a>` download.
- **Supabase auth:** the `handle_new_user()` trigger in `supabase/migrations/001_schema.sql` assumes the `profiles` table exists before the first signup. Run migrations before enabling email auth in Supabase dashboard.
- **Supabase migrations must be idempotent:** Use `DROP POLICY IF EXISTS` / `DROP CONSTRAINT IF EXISTS` before `CREATE` / `ALTER`. Column type changes require dropping dependent RLS policies first, then recreating them with proper CASTs. See `supabase/migrations/003_chat_fk_fix.sql` for the pattern.
- **Android builds require JDK 21:** Capacitor 8.4.0 requires JDK 21. Set `JAVA_HOME` accordingly (e.g. `export JAVA_HOME="/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home"` on macOS with Homebrew).
- **Electron Windows builds:** `electron-builder.yml` must include `"!.next/node_modules/**"` in `extraResources.filter` to avoid 7zip crash on dangling symlinks in `.next/node_modules`. Clean that directory before Windows builds.
- **Host detection uses `sessionStorage`:** Both `orbitHostRoom` and pre-flight name/lang are stored in `sessionStorage` (not `localStorage`). Keep this consistent so host state doesn't leak across tabs/sessions.
- **`node_modules` has a global `.pnpm-store/` at repo root** (not just inside `node_modules/`). Never delete the root-level `.pnpm-store/` — it contains the pnpm content-addressable store. Ignored by `.gitignore`.
- **TASK.md** is the persistent task ledger. Every task gets a `TASK-YYYYMMDD-HHMMSS` record with START + TODO + FINAL REPORT sections. Update it after every significant change.

## macOS code signing & notarization

The workflow `.github/workflows/signed-release.yml` builds + signs + notarizes macOS Electron installers.

**Required GitHub secrets** (set in repo → Settings → Secrets and variables → Actions):

| Secret | Description |
|--------|-------------|
| `MACOS_CERTIFICATE_P12_BASE64` | base64 of your Developer ID Application `.p12` |
| `MACOS_CERTIFICATE_PASSWORD` | Password for the `.p12` |
| `APPLE_ID` | Apple Developer account email |
| `APPLE_APP_SPECIFIC_PASSWORD` | App-specific password (generate at appleid.apple.com) |
| `APPLE_TEAM_ID` | Team ID from developer.apple.com |

**How to export your cert:**
```bash
# List available signing identities
security find-identity -v -p codesigning

# Export the Developer ID Application cert to p12
security export -k ~/Library/Keychains/login.keychain \
  -t identities -f pkcs12 -o developer-id.p12

# Base64 encode for GitHub secret
base64 -i developer-id.p12 | pbcopy
```

**How to trigger a signed build:**
1. Push your release tag (e.g. `git tag v1.2.3 && git push origin v1.2.3`)
2. Go to GitHub → Actions → **Signed Release Builds** → Run workflow
3. Enter the tag name → the workflow builds + signs + uploads all platforms

**Local testing without signing:**
```bash
CSC_IDENTITY_AUTO_DISCOVERY=false pnpm electron:build:mac
```

## Testing

- Agent has unit tests only (`translator/tests/test_router.py`): pure logic, no LiveKit/Gemini connectivity.
- Run: `cd translator && uv run pytest`
- pytest config in `pyproject.toml`: `asyncio_mode = "auto"`, loop scope = `"function"`
- No frontend tests exist in the repo.
- CI: `translator/.github/workflows/ci.yml` runs pytest + ruff on push/PR to translator paths.
- CI: `.github/workflows/deploy.yml` builds + deploys to Vercel on push/PR to main.

## When working on the Python agent

Read `translator/AGENTS.md` — it includes guidance on `lk docs` CLI, LiveKit MCP server, handoffs/tasks patterns, and TDD for agent behavior changes. Key: when modifying agent behavior (instructions, tool descriptions, workflows), use TDD — write tests first.
