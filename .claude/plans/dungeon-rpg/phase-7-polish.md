# Phase 7 — Polish, accessibility, and performance

**Ships:** particles, audio, the a11y mirror, reduced-motion support, a performance pass.
**Gate:** screen-reader-playable; no idle CPU; no regression to site vitals.

The game is complete. This phase makes it feel finished and pays back the accessibility debt Canvas
incurred — planned from day one, deliberately deferred to here so it lands against a stable UI
rather than being rewritten every phase.

---

## 1. Accessibility (`a11y/describe.ts`) — the headline item

Canvas is a black box to assistive technology. A DOM layer carries the same information.

```ts
export function describeState(state: GameState): A11yDescription;
```

Returns structured text: current segment and floor, room contents, available exits, player stats,
and in battle the enemy, both Integrity values, and the highlighted menu option.

Wired up as:

- **Visually-hidden live mirror** (`sr-only`) holding the full description, updated on state change.
- **`aria-live="polite"`** on the battle log — already DOM text since phase 2, so this is mostly
  free.
- **`role="img"` + `aria-label`** on the canvas with a one-line summary.
- **Focus management** — a visible ring on the game container; menus are real focusable elements
  where practical, not canvas-drawn illusions.
- **Full keyboard control** with no pointer-only actions anywhere.
- **Announcement throttling** — movement fires rapidly, and announcing every step floods a screen
  reader into uselessness. Announce room transitions and significant events; describe position only
  on request (a dedicated "where am I" key).

That last point is the difference between an a11y layer that technically exists and one someone can
actually play with.

### Tests
- `describeState` output matches state for every `mode`.
- The mirror updates on state change.
- Every action is keyboard-reachable.
- Throttling suppresses per-step announcements but never drops a room transition or battle event.

---

## 2. Reduced motion

`prefers-reduced-motion: reduce` disables screen shake, particles, camera easing, and damage-number
float; transitions become instant cuts.

The game stays fully playable because **animation was never load-bearing** — phase 2's `pending`
queue design was chosen precisely so this is a rendering toggle, not a gameplay change. Also exposed
as an in-game setting, since the OS preference isn't always what someone wants right now.

---

## 3. Particles and juice (`render/particles.ts`)

Transient, cosmetic, and **never gameplay state**. Particles live in a render-local pool, are never
saved, and never feed back into the reducer.

Hit sparks, damage numbers, level-up flash, floor-transition wipe, subtle torch flicker on lit tiles,
crit shake. Every effect is bounded (a hard cap on live particles) and skippable.

The rAF loop runs **only while effects are in flight**, then stops. This is the one place a
permanent loop could sneak in, so it gets checked explicitly.

---

## 4. Audio

Small, synthesized, and off by default.

- **Web Audio API oscillators — no audio files.** Consistent with the no-external-assets rule and
  costs nothing in bundle size.
- Blips for menu movement, hits, level-up, death, victory.
- **Muted by default**, with a visible toggle. Autoplaying audio on a portfolio page is hostile.
- Preference stored in the profile.
- `AudioContext` created lazily on first user gesture (browsers block it otherwise) and closed on
  unmount.

---

## 5. Performance

- **Bundle:** confirm the feature is code-split and doesn't inflate the initial load of `/projects`.
  Lazy-load the app component if `npm run build` shows it does.
- **Idle:** verify no rAF, timer, or listener runs when the game is idle or the tab is hidden.
  Pause on `visibilitychange`.
- **Sprite cache:** generated once, reused; confirm no per-frame regeneration crept in.
- **Memory:** play several full runs with the heap profiler open; assert no growth across runs.
- **Vitals:** Vercel Speed Insights is already installed — confirm no regression to `/projects` or
  the game route.

---

## 6. Final QA

- [ ] Keyboard-only playthrough, start to victory, no mouse
- [ ] Screen-reader playthrough (NVDA or VoiceOver) — playable, not merely announced
- [ ] Reduced-motion playthrough
- [ ] Muted and unmuted
- [ ] Several consecutive runs with no memory growth
- [ ] Idle tab uses no CPU
- [ ] Corrupt each storage key independently → graceful recovery
- [ ] Lighthouse on the game route — no new a11y or performance failures
- [ ] Cross-browser: Chrome, Firefox, Safari

---

## Exit criteria

- [ ] Playable without a mouse and without sight
- [ ] Reduced motion fully respected
- [ ] Audio off by default, toggleable, cleanly torn down
- [ ] No idle CPU, no memory growth, no bundle regression
- [ ] `docs/dungeon-rpg.md` matches the shipped implementation
- [ ] Lint, types, tests, build all clean

---

## After phase 7

Ideas, explicitly **not** committed to: daily seeded challenge · multiple starting classes ·
equipment slots · elite enemy variants · lore fragments · a shell integration where a `dungeon`
command in the fake terminal launches the game.

Anything picked up from this list gets its own phase doc first.
