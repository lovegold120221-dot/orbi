# Orbit Meeting Jitsi-Style UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the existing frontend into an Orbit Meeting branded video meeting experience with a Jitsi-inspired flow: create or join, pre-join media preview, dark meeting stage, icon-first toolbar, invite controls, participant/caption side panels, and responsive meeting layout.

**Architecture:** Keep the current Next.js App Router and LiveKit structure. Reuse the existing room components, but introduce a small meeting UI model for pre-join preferences, toolbar actions, active side panels, and Orbit Meeting design tokens. Avoid Jitsi logos, exact copy, proprietary assets, and exact color matching; copy the interaction pattern, not the trade dress.

**Tech Stack:** Next.js 16.2.6, React 19.2.4, LiveKit React components, LiveKit client, TypeScript, CSS in `src/app/globals.css`, optional `lucide-react` for meeting icons.

---

## Reference Behavior

Jitsi-style flow to mirror in Orbit Meeting:

- Meeting home lets the user start a named meeting or join from a link.
- Pre-join asks for display name, lets the user preview camera/mic, and offers device controls before entering.
- In-call view is a dark full-screen stage with top room chrome, video tiles, a centered bottom toolbar, a prominent leave button, and side panels for invite, participants, chat/captions, or settings.
- Invite sharing is usually reached from a toolbar or "More actions" flow.
- Keyboard shortcuts worth matching: `M` for mic, `V` for camera, `C` for captions/chat, `P` for participants, `W` for tile view.

Primary product constraint:

- Brand as `Orbit Meeting` everywhere. Use a custom Orbit Meeting wordmark, palette, icon treatment, copy, and panel styling.

---

## File Structure

Modify:

- `package.json`
  - Add `lucide-react` if we choose package icons over local SVGs.

- `src/app/globals.css`
  - Replace the editorial beige/serif theme with Orbit Meeting meeting-product tokens.
  - Add dark room shell, rounded video tiles, circular icon controls, modal/panel styles, responsive mobile toolbar behavior, focus states, and reduced-motion support.

- `src/app/page.tsx`
  - Convert the current marketing-style entry page into an Orbit Meeting start/join screen.

- `src/app/session/[id]/page.tsx`
  - Convert the current form-only preflight into a Jitsi-style pre-join page with preview, mic/camera toggles, display name, language selection, invite copy, and join.

- `src/app/session/[id]/room/RoomClient.tsx`
  - Read pre-join mic/camera preferences from session storage and pass initial media state into LiveKit.
  - Keep existing token flow and disconnect routing.

- `src/app/session/[id]/room/InCall.tsx`
  - Add Orbit Meeting top bar, active panel state, room name, participant count, and toolbar panel orchestration.

- `src/app/session/[id]/room/ControlBar.tsx`
  - Move to icon-first circular controls.
  - Add participants panel toggle, invite panel toggle, optional screen share control, more menu, and Jitsi-like keyboard shortcut labels.

- `src/app/session/[id]/room/ParticipantTile.tsx`
  - Update tile overlay to dark meeting-product style.
  - Preserve translation badges and speaking state.

- `src/app/session/[id]/room/SelfView.tsx`
  - Match tile treatment and place self view consistently for desktop and mobile.

- `src/app/session/[id]/room/CaptionsSidebar.tsx`
  - Restyle as a dark right side panel and align language/caption metadata with Orbit Meeting.

- `src/app/session/[id]/room/VideoGrid.tsx`
  - Tune grid sizing and mobile column behavior for Jitsi-like tile view.

- `src/app/session/[id]/room/icons.tsx`
  - Either replace with lucide wrappers or add missing icons if no dependency is added.

Create:

- `src/app/session/[id]/room/InvitePanel.tsx`
  - Shows meeting link, copy action, room name, and Orbit Meeting invite copy.

- `src/app/session/[id]/room/ParticipantsPanel.tsx`
  - Lists local and remote participants with mic/camera/language status.

- `src/app/session/[id]/room/MoreActionsMenu.tsx`
  - Holds secondary actions: copy link, language, settings placeholder removed until real settings exist.

- `src/app/session/[id]/room/useMeetingShortcuts.ts`
  - Centralizes keyboard shortcuts for mic, camera, captions, participants, and tile view.

- `src/app/session/[id]/usePreJoinMedia.ts`
  - Owns camera/mic preview tracks, permissions, attach/detach lifecycle, and cleanup.

Do not create nonfunctional UI controls. If a control is visible, implement its behavior in the same task.

---

## Task 1: Dependency and Next.js Readiness

**Files:**

- Modify: `package.json`
- Reference before code changes: `node_modules/next/dist/docs/` after dependencies are installed

- [ ] **Step 1: Install dependencies**

Run:

```bash
pnpm install
```

Expected:

```text
Packages are already up to date or installed successfully.
```

- [ ] **Step 2: Read the local Next.js guide**

Run:

```bash
find node_modules/next/dist/docs -maxdepth 2 -type f | sort | head -50
```

Expected:

```text
At least one local Next.js documentation file is listed.
```

Open the relevant App Router and CSS/global styling docs from that directory before editing Next code.

- [ ] **Step 3: Add icon dependency**

Run:

```bash
pnpm add lucide-react
```

Expected:

```text
lucide-react is added to dependencies and pnpm-lock.yaml is updated.
```

- [ ] **Step 4: Commit dependency setup**

Run:

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add meeting icon library"
```

Expected:

```text
[branch hash] chore: add meeting icon library
```

---

## Task 2: Orbit Meeting Design Tokens

**Files:**

- Modify: `src/app/globals.css`

- [ ] **Step 1: Replace brand tokens**

Define Orbit Meeting variables in `:root`:

```css
:root {
  --font-display: 'DM Sans', system-ui, sans-serif;
  --font-body: 'DM Sans', system-ui, sans-serif;
  --font-mono: 'DM Mono', 'SF Mono', monospace;

  --bg: #101114;
  --bg-elevated: #1a1c21;
  --bg-inset: #24272e;
  --panel: #181a1f;
  --panel-strong: #20232a;

  --fg: #f7f8fa;
  --fg-secondary: #c7cbd3;
  --fg-tertiary: #8f96a3;
  --fg-ghost: #5e6572;

  --accent: #4f8cff;
  --accent-strong: #2f6fed;
  --accent-soft: rgba(79, 140, 255, 0.16);
  --orbit: #55d6a7;

  --border: rgba(255, 255, 255, 0.12);
  --border-light: rgba(255, 255, 255, 0.08);

  --success: #55d6a7;
  --warning: #f4c15d;
  --error: #ff5c6c;
  --error-soft: rgba(255, 92, 108, 0.16);
}
```

- [ ] **Step 2: Normalize app typography**

Remove serif display styling from meeting screens by making `.display` use `--font-display`, no negative letter spacing, and tighter product UI sizing:

```css
.display {
  font-family: var(--font-display);
  font-weight: 650;
  line-height: 1.08;
  letter-spacing: 0;
  color: var(--fg);
}
```

- [ ] **Step 3: Add Orbit brand utility**

Add reusable brand styling:

```css
.brand-lockup {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--fg);
  font-weight: 650;
}

.brand-mark {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background:
    radial-gradient(circle at 68% 30%, var(--orbit) 0 3px, transparent 4px),
    linear-gradient(135deg, var(--accent), var(--accent-strong));
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.18);
}
```

- [ ] **Step 4: Run lint/build**

Run:

```bash
pnpm lint
pnpm build
```

Expected:

```text
No ESLint errors.
Production build completes.
```

- [ ] **Step 5: Commit design tokens**

Run:

```bash
git add src/app/globals.css
git commit -m "style: add Orbit Meeting design tokens"
```

---

## Task 3: Orbit Meeting Home Flow

**Files:**

- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Replace marketing page with create/join hub**

Implement a first screen with:

- Orbit Meeting brand lockup at top.
- Meeting name input.
- `Start meeting` primary button.
- `Join from link` secondary input behavior if a full `/session/{id}` URL is pasted.
- Compact product line: `Secure multilingual meetings, translated live.`

Behavior:

- If meeting name is blank, generate a UUID as today.
- If meeting name is present, slug it with lowercase alphanumeric and hyphens.
- Route to `/session/{sessionId}`.

- [ ] **Step 2: Add CSS for start screen**

Use dark full-page layout, no marketing cards:

```css
.meeting-home {
  min-height: 100vh;
  display: grid;
  grid-template-rows: auto 1fr auto;
  padding: 28px;
  background: var(--bg);
}

.meeting-home-main {
  width: min(520px, 100%);
  align-self: center;
  justify-self: center;
}

.meeting-input-row {
  display: flex;
  gap: 10px;
  margin-top: 24px;
}
```

- [ ] **Step 3: Verify routing**

Run:

```bash
pnpm lint
pnpm build
```

Expected:

```text
No ESLint errors.
Production build completes.
```

- [ ] **Step 4: Commit home flow**

Run:

```bash
git add src/app/page.tsx src/app/globals.css
git commit -m "feat: brand Orbit Meeting start flow"
```

---

## Task 4: Pre-Join Media Preview

**Files:**

- Create: `src/app/session/[id]/usePreJoinMedia.ts`
- Modify: `src/app/session/[id]/page.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add pre-join storage keys**

Use these keys in `page.tsx` and later in `RoomClient.tsx`:

```ts
const STORAGE_KEY_NAME = "lt.displayName";
const STORAGE_KEY_LANG = "lt.lang";
const STORAGE_KEY_MIC = "lt.prejoinMic";
const STORAGE_KEY_CAM = "lt.prejoinCam";
```

- [ ] **Step 2: Implement `usePreJoinMedia`**

Use `createLocalTracks` from `livekit-client`. The hook must:

- Start no devices by default.
- Start camera only when the camera toggle is enabled.
- Start microphone only when the mic toggle is enabled.
- Attach the camera track to a preview `<video>`.
- Stop tracks when toggled off and on unmount.
- Return `micEnabled`, `camEnabled`, `permissionError`, `toggleMic`, `toggleCam`, and `videoRef`.

- [ ] **Step 3: Redesign pre-join page**

Layout:

- Top-left Orbit Meeting lockup.
- Main preview column with a large 16:9 preview tile.
- Circular mic and camera buttons under the preview.
- Right panel with `Join Orbit Meeting`, display name input, language select, invite copy button, and `Join meeting`.

Join behavior:

```ts
window.sessionStorage.setItem(STORAGE_KEY_NAME, displayName.trim());
window.sessionStorage.setItem(STORAGE_KEY_LANG, lang);
window.sessionStorage.setItem(STORAGE_KEY_MIC, String(micEnabled));
window.sessionStorage.setItem(STORAGE_KEY_CAM, String(camEnabled));
router.push(`/session/${id}/room`);
```

- [ ] **Step 4: Add pre-join CSS**

Add stable responsive dimensions:

```css
.prejoin {
  min-height: 100vh;
  display: grid;
  grid-template-rows: auto 1fr;
  padding: 28px;
  background: var(--bg);
}

.prejoin-main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 32px;
  align-items: center;
  width: min(1180px, 100%);
  margin: 0 auto;
}

.prejoin-preview {
  position: relative;
  aspect-ratio: 16 / 9;
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-inset);
  border: 1px solid var(--border);
}

@media (max-width: 840px) {
  .prejoin-main {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 5: Verify pre-join**

Run:

```bash
pnpm lint
pnpm build
```

Manual browser checks:

- Name is required before join.
- Camera preview starts and stops.
- Mic permission errors are visible but do not block joining.
- Invite copy still writes the `/session/{id}` link.
- Mobile layout stacks preview above the form.

- [ ] **Step 6: Commit pre-join flow**

Run:

```bash
git add 'src/app/session/[id]/page.tsx' 'src/app/session/[id]/usePreJoinMedia.ts' src/app/globals.css
git commit -m "feat: add Orbit Meeting prejoin preview"
```

---

## Task 5: Initial Media State in Room

**Files:**

- Modify: `src/app/session/[id]/room/RoomClient.tsx`

- [ ] **Step 1: Read pre-join media preferences**

Add local state:

```ts
const [initialMicEnabled, setInitialMicEnabled] = useState(false);
const [initialCamEnabled, setInitialCamEnabled] = useState(false);
```

When reading session storage, set:

```ts
setInitialMicEnabled(window.sessionStorage.getItem(STORAGE_KEY_MIC) === "true");
setInitialCamEnabled(window.sessionStorage.getItem(STORAGE_KEY_CAM) === "true");
```

- [ ] **Step 2: Pass preferences to LiveKit**

Change:

```tsx
video={false}
audio={false}
```

to:

```tsx
video={initialCamEnabled}
audio={initialMicEnabled}
```

- [ ] **Step 3: Replace speaker emoji label**

Change `StartAudio` label from emoji text to an Orbit Meeting plain label:

```tsx
label="Enable translated audio"
```

- [ ] **Step 4: Verify join state**

Run:

```bash
pnpm lint
pnpm build
```

Manual checks:

- Join with mic/camera off keeps both off.
- Join with mic on publishes audio.
- Join with camera on publishes video.
- Leaving returns to home.

- [ ] **Step 5: Commit room media state**

Run:

```bash
git add 'src/app/session/[id]/room/RoomClient.tsx'
git commit -m "feat: honor prejoin media choices"
```

---

## Task 6: In-Call Shell and Stage

**Files:**

- Modify: `src/app/session/[id]/room/InCall.tsx`
- Modify: `src/app/session/[id]/room/VideoGrid.tsx`
- Modify: `src/app/session/[id]/room/ParticipantTile.tsx`
- Modify: `src/app/session/[id]/room/SelfView.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add Orbit Meeting top chrome**

Top bar content:

- Left: Orbit Meeting lockup, room name, elapsed time.
- Center: optional compact meeting title on wide screens.
- Right: participant count and language selector.

Keep the existing `LanguagePill` behavior.

- [ ] **Step 2: Add active side panel state**

In `InCall.tsx`, replace `captionsOpen` with:

```ts
type ActivePanel = "captions" | "invite" | "participants" | null;
const [activePanel, setActivePanel] = useState<ActivePanel>(null);
```

Use `activePanel === "captions"` for the existing captions sidebar.

- [ ] **Step 3: Restyle stage and tiles**

Tile treatment:

- 8px radius.
- Dark neutral tile backgrounds.
- Bottom-left participant name pill.
- Top-right mic-off circular badge.
- Speaking state uses Orbit accent ring.
- Translation badge remains visible but compact.

- [ ] **Step 4: Tune grid**

Keep `deriveLayout`, but add mobile behavior through CSS:

```css
@media (max-width: 720px) {
  .tile-grid {
    grid-template-columns: 1fr !important;
    align-content: start;
    overflow-y: auto;
  }

  .self-view {
    width: 132px;
    right: 12px;
    bottom: 88px;
  }
}
```

- [ ] **Step 5: Verify stage**

Run:

```bash
pnpm lint
pnpm build
```

Manual checks:

- Empty room still shows invite affordance.
- One remote participant is not oversized on desktop.
- Two to six remote participants form a balanced grid.
- Self view does not cover bottom toolbar.
- Captions sidebar pushes or overlays consistently by viewport.

- [ ] **Step 6: Commit stage shell**

Run:

```bash
git add 'src/app/session/[id]/room/InCall.tsx' 'src/app/session/[id]/room/VideoGrid.tsx' 'src/app/session/[id]/room/ParticipantTile.tsx' 'src/app/session/[id]/room/SelfView.tsx' src/app/globals.css
git commit -m "feat: add Orbit Meeting in-call stage"
```

---

## Task 7: Jitsi-Style Toolbar and Shortcuts

**Files:**

- Modify: `src/app/session/[id]/room/ControlBar.tsx`
- Create: `src/app/session/[id]/room/useMeetingShortcuts.ts`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Convert toolbar to icon-first controls**

Toolbar order:

1. Microphone
2. Camera
3. Screen share
4. Captions
5. Invite
6. Participants
7. More actions
8. Leave

Use lucide icons:

```ts
import {
  Captions,
  Link2,
  Mic,
  MicOff,
  MonitorUp,
  MoreHorizontal,
  PhoneOff,
  Users,
  Video,
  VideoOff,
} from "lucide-react";
```

- [ ] **Step 2: Implement screen share**

Use LiveKit local participant behavior:

```ts
const screenShareOn = localParticipant.isScreenShareEnabled;
await localParticipant.setScreenShareEnabled(!screenShareOn);
```

If the installed LiveKit type differs, inspect `livekit-client` types and use the current equivalent. Do not ship the button until it works.

- [ ] **Step 3: Add button API**

Expose toolbar props:

```ts
type PanelKey = "captions" | "invite" | "participants";

type ControlBarProps = {
  onLeave: () => void;
  inviteUrl: string;
  activePanel: PanelKey | null;
  onTogglePanel: (panel: PanelKey) => void;
};
```

- [ ] **Step 4: Add keyboard shortcuts**

`useMeetingShortcuts.ts` accepts callbacks:

```ts
type MeetingShortcuts = {
  toggleMic: () => void;
  toggleCamera: () => void;
  toggleCaptions: () => void;
  toggleParticipants: () => void;
};
```

Behavior:

- Ignore shortcuts while focus is in `input`, `textarea`, or `select`.
- `m` toggles mic.
- `v` toggles camera.
- `c` toggles captions.
- `p` toggles participants.

- [ ] **Step 5: Style toolbar**

Use circular icon buttons and a red leave button:

```css
.control-bar {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  padding: 14px 20px 20px;
  background: linear-gradient(to top, rgba(16, 17, 20, 0.96), rgba(16, 17, 20, 0.72));
}

.ctrl {
  width: 48px;
  height: 48px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  background: var(--panel-strong);
  color: var(--fg);
}

.ctrl--active {
  background: var(--accent);
  border-color: var(--accent);
  color: white;
}

.ctrl--danger {
  width: 60px;
  background: var(--error);
  border-color: var(--error);
  color: white;
}
```

- [ ] **Step 6: Verify toolbar**

Run:

```bash
pnpm lint
pnpm build
```

Manual checks:

- Every button has `aria-label` and `title`.
- Mic/camera icons switch correctly.
- Screen share starts and stops.
- Leave disconnects once and routes home.
- `M`, `V`, `C`, and `P` shortcuts work outside form fields.
- Toolbar wraps cleanly on mobile without covering text.

- [ ] **Step 7: Commit toolbar**

Run:

```bash
git add 'src/app/session/[id]/room/ControlBar.tsx' 'src/app/session/[id]/room/useMeetingShortcuts.ts' src/app/globals.css
git commit -m "feat: add Orbit Meeting toolbar controls"
```

---

## Task 8: Invite and Participants Panels

**Files:**

- Create: `src/app/session/[id]/room/InvitePanel.tsx`
- Create: `src/app/session/[id]/room/ParticipantsPanel.tsx`
- Modify: `src/app/session/[id]/room/InCall.tsx`
- Modify: `src/app/session/[id]/room/CaptionsSidebar.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Build `InvitePanel`**

Content:

- Header: `Invite people`
- Meeting link read-only field.
- `Copy link` button.
- Status text changes to `Copied` for two seconds.

Behavior:

```ts
await navigator.clipboard.writeText(inviteUrl);
```

- [ ] **Step 2: Build `ParticipantsPanel`**

Inputs:

```ts
type ParticipantsPanelProps = {
  open: boolean;
  onClose: () => void;
  myLang: string;
};
```

Use LiveKit hooks:

- `useLocalParticipant()`
- `useRemoteParticipants()`

Show each person:

- Display name.
- `You` label for local participant.
- Language code or language name.
- Mic/camera state when available.

- [ ] **Step 3: Generalize side panel CSS**

Create `.side-panel`, `.side-panel-inner`, `.side-panel-header`, and `.side-panel-body`. Reuse these classes for captions, invite, and participants.

- [ ] **Step 4: Wire panels into `InCall`**

Render exactly one active panel:

```tsx
{activePanel === "captions" && <CaptionsSidebar ... />}
{activePanel === "invite" && <InvitePanel ... />}
{activePanel === "participants" && <ParticipantsPanel ... />}
```

For smooth transitions, keep the existing shell class pattern:

```tsx
className={`room-shell${activePanel ? " room-shell--panel-open" : ""}`}
```

- [ ] **Step 5: Verify panels**

Run:

```bash
pnpm lint
pnpm build
```

Manual checks:

- Invite panel copies the same URL as the empty room invite.
- Participants panel updates when a remote joins or leaves.
- Captions still show translation streams.
- Opening one panel closes the previous panel.
- Close buttons are reachable by keyboard.

- [ ] **Step 6: Commit panels**

Run:

```bash
git add 'src/app/session/[id]/room/InvitePanel.tsx' 'src/app/session/[id]/room/ParticipantsPanel.tsx' 'src/app/session/[id]/room/InCall.tsx' 'src/app/session/[id]/room/CaptionsSidebar.tsx' src/app/globals.css
git commit -m "feat: add meeting side panels"
```

---

## Task 9: Final Responsive and Visual QA

**Files:**

- Modify as needed: `src/app/globals.css`
- Modify as needed: touched React components from prior tasks

- [ ] **Step 1: Run static checks**

Run:

```bash
pnpm lint
pnpm build
```

Expected:

```text
No ESLint errors.
Production build completes.
```

- [ ] **Step 2: Start the app**

Run:

```bash
pnpm run dev:web
```

Expected:

```text
Local: http://localhost:3000
```

- [ ] **Step 3: Desktop QA**

Check at 1440x900:

- Home page shows Orbit Meeting, not Live Translate.
- Pre-join preview and form fit without scroll.
- In-call top bar, tile area, and toolbar do not overlap.
- All toolbar labels are tooltips or accessible labels, not bulky visible text.
- Leave button is visually distinct.
- Side panel width leaves usable meeting stage.

- [ ] **Step 4: Mobile QA**

Check at 390x844:

- Home form fits without horizontal scroll.
- Pre-join stacks cleanly.
- Toolbar wraps or scrolls without covering self view.
- Panel uses most of the width and can close.
- Video tiles remain 16:9 and names do not overflow.

- [ ] **Step 5: Accessibility QA**

Check:

- Tab order reaches home input, start button, pre-join controls, join button, toolbar, and panel close buttons.
- Focus rings are visible on dark backgrounds.
- Icon buttons have `aria-label`.
- Copy actions announce visible state change.
- Shortcut handler ignores input/select focus.

- [ ] **Step 6: Brand and IP QA**

Check:

- No Jitsi logo, Jitsi name, copied SVG assets, copied text, or exact brand color set.
- Brand strings use `Orbit Meeting`.
- The UI reads as a familiar meeting product, not a clone of Jitsi's proprietary branding.

- [ ] **Step 7: Commit QA fixes**

Run:

```bash
git add src/app package.json pnpm-lock.yaml
git commit -m "fix: polish Orbit Meeting responsive UI"
```

Expected:

```text
[branch hash] fix: polish Orbit Meeting responsive UI
```

---

## Acceptance Criteria

- The product is branded `Orbit Meeting` on home, pre-join, room chrome, invite panel, and document title if updated.
- The flow is: start/join meeting -> pre-join preview -> in-call stage -> leave.
- Mic and camera can be controlled before joining and inside the room.
- The room uses a dark meeting UI with centered icon toolbar and a distinct red leave button.
- Invite, captions, and participants are reachable from the toolbar.
- Existing translation language selection and captions continue to work.
- Desktop and mobile layouts avoid overlap, text clipping, and horizontal scroll.
- `pnpm lint` and `pnpm build` pass.

---

## Implementation Notes

- Keep the current LiveKit token and translation routing logic intact.
- Do not rename route paths unless product requirements change.
- Do not add chat, reactions, recording, lobby moderation, or authentication in this pass.
- Use Orbit Meeting visual language: dark neutral stage, blue primary action, green orbital accent, red leave/destructive action.
- Prefer functional controls over decorative parity with Jitsi. If a Jitsi-like control cannot be implemented in this pass, omit it from visible UI.
