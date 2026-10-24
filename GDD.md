# OFFLINE: Game Design Document

**Version:** 1.1 (consolidated from GDD v0.2 "Rage Edition", v0.3 and Content Flow v0.1, with design decisions applied)
**Genre:** 3D office puzzle / escape-the-help-desk
**Platform:** Web (Xsolla Game Jam submission), vanilla JS, no build step
**Session length:** about 8 to 12 minutes
**Players:** Single player, mouse only

> Items marked **[OPEN]** are gaps in the source drafts that still need a decision. Decisions already made are recorded in section 17.

---

## 1. Concept

OFFLINE is a puzzle game about fixing a broken printer with no useful help. The only guidance comes from a coworker who speaks in riddles, gives contradictory hints, and reacts to every failure with quiet judgment.

The game is designed to feel solvable while being quietly hostile.

### Pillars

1. **Quiet hostility.** Nothing is loud or cruel. The game just never helps. Failure is delivered with a nod, a "hm", and a notebook the player cannot read.
2. **Fake progress.** Wrong actions look like they worked, then fail three seconds later. The player must learn not to trust the first reaction.
3. **Stillness is the answer.** The final solution requires the player to stop clicking the action list and look at the environment.
4. **Bureaucratic comedy.** The score is an "Efficiency Rating" with no context, and the game ends with a blank page and the word "perfect."

### Elevator pitch

You are the only person who can fix the office printer. Your coworker knows the answer and will only tell you in riddles. Every wrong guess makes things worse. The real fix was in front of you the whole time.

---

## 2. Core Loop

1. The printer enters a broken state.
2. The timer starts (states 1 to 4).
3. The coworker delivers a riddle tied to that state, sometimes inaccurately.
4. The player picks an action from a fixed list of six, or uses a printer-side secondary interaction.
5. Wrong actions play a fake recovery and then fail 3 seconds later.
6. Three wrong guesses unlock a hint, which is correct 30% of the time.
7. If the timer expires, the printer worsens and a penalty stacks.
8. Repeat across 5 escalating states.
9. The final state has no timer and no correct action on the list.

---

## 3. Player Actions

Six actions are visible at all times in the action button panel.

| # | Action | Notes |
|---|--------|-------|
| 1 | Check the paper tray | Correct in State 1 |
| 2 | Restart the printer | Never correct |
| 3 | Check the ink cartridge | Correct in State 2 |
| 4 | Unplug and replug the cable | Never correct from the list (the real fix is physical, see State 5) |
| 5 | Pause the operation | Correct in State 4 |
| 6 | Run a diagnostic | Never correct. Plays a fake loading bar that stops at 99% and idles |

**Run a diagnostic:** the bar takes longest in State 4. Players who have clicked it since State 1 will click it again and lose the most time.

**Secondary interactions** (not on the list):
- **Network icon on the printer screen.** Clickable in State 3 only. This is the correct fix for State 3.
- **Cable and port.** Clickable in State 5 only. Together they are the correct fix for State 5.
- **Coworker.** Clickable at any time (see section 7).
- **Printer rotation.** Always available (see section 8).

---

## 4. States

Each state is a small visual change on the same printer sprite.

### State 1: Paper Jam (tutorial)

| | |
|---|---|
| **Timer** | 60 s |
| **Riddle** | "I entered hungry and stopped halfway. Find where I gave up." |
| **Correct action** | Check the paper tray |
| **Visual** | Crumpled sheet in the output area, top tray slightly open, red status light |
| **Design intent** | Unlabeled tutorial. Fake recovery is short (2 s) before the problem returns, so the player learns the delay mechanic cheaply. The timer is generous enough that a first-time player will not expire it. |
| **On success** | Printer makes a satisfied sound. The coworker glances over once, then looks away. |

### State 2: Ink Low

| | |
|---|---|
| **Timer** | 50 s |
| **Riddle** | "I gave everything I had. Now look inside." |
| **Correct action** | Check the ink cartridge |
| **Visual** | One cartridge drained, warning icon on the touchscreen |
| **Design intent** | The riddle fits both Check the ink cartridge and Check the paper tray. A player coming off State 1 will try the tray first. That is intentional. The timer is short enough that two wrong guesses put the player close to expiry. |
| **On success** | Printer hums. Print queue drops to **31**. |

### State 3: Offline

| | |
|---|---|
| **Timer** | 45 s |
| **Riddle** | "I entered hungry and stopped halfway. Find where I gave up." (identical to State 1) |
| **Correct action** | Connect to wifi (not on the action list) |
| **Visual** | Dark touchscreen, wifi icon with an X, unlit status light |
| **Design intent** | The player recognises the riddle, tries Check the paper tray, gets the fake recovery, then gets confused. The real fix is a small network icon on the printer screen that became clickable this state only. |
| **Coworker (clicked twice)** | "you've heard this one before." Nothing else. |
| **On success** | A wifi signal icon blinks on the printer. Print queue drops to **19**. |

### State 4: Overheating

| | |
|---|---|
| **Timer** | 40 s |
| **Riddle** | "Too much. Too long. Too loud. Quiet everything." |
| **Correct action** | Pause the operation |
| **Visual** | Heat shimmer above the unit, red status light, red warning bar on the display |
| **Design intent** | The riddle is abstract enough to justify Restart, Unplug and replug, or Run a diagnostic. Nothing obviously points to pause. Players try to fix the printer before they think to stop it. |
| **Wrong actions** | The printer gets louder. Fake recovery still plays, but the printer sound does not fully normalise underneath. |
| **On success** | The printer winds down slowly. The heat shimmer fades. The status light shifts red to yellow. The coworker does not react. The printer vents for 4 s, then yellow turns green. Print queue drops to **8**. |

### State 5: Plug In, Plug Out

| | |
|---|---|
| **Timer** | None |
| **Riddle** | "You already have everything you need." |
| **Correct action** | None on the list |
| **Design intent** | The only moment of stillness. Pressure would push players toward the action list and away from the cable. Every button produces a fake recovery, then fails after 3 s. Run a diagnostic idles at 99% as usual. |

**Solution (two-step physical interaction):**
1. The player hovers the cable (subtle highlight) and clicks it to **unplug**. The printer goes fully dark. The office goes briefly quieter, with no hum. The coworker looks up once.
2. The player clicks the **port** to plug the cable back in. A startup sound plays and a short boot sequence runs on the status light. The queue clears. One page prints.

The cable-end hangs loose below the port while unplugged. After plug-in, the printer looks like idle plus a post-boot glow on the status light.

### Ending

The player and the coworker both look at the printed page. It is **blank**. The coworker nods slowly and says **"perfect."**

The **Efficiency Rating** then appears: score divided by total minutes played. There is no context for what a good number looks like. The game closes to desktop **8 seconds** later whether or not the player interacts.

---

## 5. Timer

Each timed state runs its own countdown, shown as a small desk clock near the printer.

| State | Duration | Reset duration after expiry |
|-------|----------|-----------------------------|
| 1 | 60 s | 30 s |
| 2 | 50 s | 25 s |
| 3 | 45 s | 22.5 s |
| 4 | 40 s | 20 s |
| 5 | none | n/a |

- **Audio:** no ticking until the final 10 seconds. At 10 seconds the clock ticks audibly and turns red.
- **On expiry:** the printer worsens visually (more smoke, louder hum, angrier status light). The timer resets to **half** its original duration. A flat **-150** penalty applies on top of any wrong-action penalties already accumulated. Expiry penalties stack.
- **State 5** has no timer on purpose.

---

## 6. Failure Behaviour

### Fake recovery

Every wrong action plays a fake recovery:
1. The printer sound normalises.
2. A small green checkmark flickers (small, green, slightly too cheerful).
3. Three seconds later the problem worsens and a distinct error sound plays. In State 1 this delay is 2 seconds, as a gentler tutorial.

### Hints

- Three wrong guesses on one state unlock a hint.
- A hint costs **200 points**.
- A hint is accurate **30%** of the time. The player cannot tell which kind they received.
- There is no refund for an inaccurate hint.

### Action exhaustion

Using all 6 actions without a correct pick **shuts the printer down and resets the current state**, with a **-500** penalty.

- Applies in States 1 to 4. In State 3 the correct fix is off the list, so exhaustion there is a deliberate trap.
- **Disabled in State 5.** List clicks only ever produce a fake recovery followed by failure, so the player is never pushed off the one moment of stillness.

---

## 7. Coworker

A seated character who never moves from the desk.

### Click behaviour (per state)

| Click | Result |
|-------|--------|
| 1st | Shows the current riddle |
| 2nd | Adds a passive comment |
| 3rd and later | Silence. They look at you and say nothing. |

The click counter resets at each new state.

### Reactions to wrong actions

The coworker reacts without speaking, picking from:
- a slow nod
- a quiet "hm"
- prolonged eye contact
- (occasionally) writing in a notebook and not showing it

These have **no mechanical weight**. The coworker does not acknowledge the timer or the printer getting worse.

### Expressions (6)

Neutral, slow nod, writing in notebook, eye contact, "hm" face, glancing over.

### Passive comments (8 lines, draft)

Shown on the 2nd click per state. Tone: flat, observational, never helpful, sometimes contradicting the riddle. The State 3 line and the ending line are fixed by the design. The rest are drafts for editing.

| State | Line |
|-------|------|
| 1 | "It's been like this since Tuesday." |
| 2 | "I'd check the tray. Or don't." |
| 3 | "you've heard this one before." (fixed) |
| 4 | "Some things are better left running." |
| 4 (alt) | "I don't touch it anymore." |
| 5 | "Have you tried looking at it?" |
| 5 (alt) | "The list was never mine." |
| Any | "I'm just finishing something." |

Ending line (fixed): "perfect."

Where a state has two lines, the second is used if the player clicks the coworker again after a wrong action.

---

## 8. Printer

- A large office multifunction printer, modelled in 3D. The existing front, left, right and back SVG sheets are the **orthographic reference** for modelling and for the texture and decal layouts.
- The player **can rotate the printer slightly** (drag, clamped to roughly +/-60 degrees around the vertical axis) to inspect the sides and back. The back shows the cable port. This is what makes the State 5 solution discoverable.
- Rotation is smooth and clamped, so the player can reach the back to see the port but never loses the desk view.
- The cable has a **hover highlight** in State 5 so the player knows it is clickable. It is subtle and does not give the answer away.

### Printer state visuals

| State | Key visual changes |
|-------|--------------------|
| Idle | Green status light, plugged-in cable, touchscreen showing the normal UI |
| 1 Paper jam | Jam sheet visible, top tray open, red light |
| 2 Ink low | Drained cartridge, warning icon |
| 3 Offline | Dark display, wifi-X icon, unlit light |
| 4 Overheating | Heat shimmer, red light, warning bar. Left-side vent slots tint orange. |
| 5 Unplugged | Cable end hanging loose, body slightly darker, black display, unlit light, hollow port |
| 5 Plugged in | Pulsing green light, boot bar filling to 60% |

---

## 9. Scoring

| Event | Points |
|-------|--------|
| Base per state | +1000 |
| Wrong guess | -100 |
| Hint used | -200 (no refund if inaccurate) |
| Timer expired | -150 per expiry (stacks) |
| State reset from action exhaustion | -500 |
| Perfect state (no wrong guesses, hints or expiry) | 1000 flat |

- Maximum score is **5000** (5 states x 1000).
- **Efficiency Rating = total score / total minutes played.**
- It is the only feedback on performance. There is no grade, no leaderboard and no comparison. The number sits on screen for 8 seconds, then the game closes.
- Print queue (starts at **47**): drops to 31 after State 2, 19 after State 3, 8 after State 4, and 0 after State 5.

---

## 10. Content Flow

```
MAIN MENU
  Keyboard "START" / Notebook "HOW TO PLAY" / Coffee cup "QUIT"
    HOW TO PLAY: index card, "The printer is broken. Fix it." (click to dismiss)
    START: coworker looks up briefly, then back down
           text above printer: "The printer is broken."
           player clicks the printer to begin
        |
STATE 1 Paper Jam (60 s)  ->  correct: Check the paper tray
        |
STATE 2 Ink Low (50 s)    ->  correct: Check the ink cartridge   -> queue 31
        |
STATE 3 Offline (45 s)    ->  correct: network icon on printer screen -> queue 19
        |
STATE 4 Overheating (40 s) -> correct: Pause the operation        -> queue 8
        |
STATE 5 Plug In, Plug Out (no timer) -> click cable, then click port -> queue 0
        |
ENDING  blank page -> coworker "perfect." -> Efficiency Rating -> game closes after 8 s
```

---

## 11. Visual Design

**Art style:** clean digital illustration look carried into 3D. Smooth gradients, soft shadows, semi-realistic proportions, modern game concept art. Day lighting only, from a window on the left, with muted beige, grey and off-white tones (7am mood).

**Dimension:** the game world is **true 3D** (fixed camera, desk and printer in view, printer rotatable). The existing SVG files serve three roles:
1. **Reference and concept art** for modelling the office, printer and cat.
2. **2D overlays on top of the 3D view:** action buttons, print queue widget, score, riddle card, end screen, progress bar, checkmark, desk clock face.
3. **Textures and decals** for the 3D models (touchscreen display, labels, ID card).

**SVG format:** all assets are hand-written SVG with named `id` and `class` groups. Fill and stroke are direct attributes so colour is easy to edit. Where animation or state switching is needed, a small `<style>` block holds only keyframes and state rules.

**Hands and coworker in 3D:** the player hands and the coworker are drawn in 2D and shown as billboards or screen-space overlays in the 3D scene. Full 3D rigs are out of scope for the jam. **[OPEN: confirm, or commit to 3D models for these.]**

### Environment

One static office background. The desk, printer and coworker desk are all in frame. There are no time-of-day changes.

### Main menu objects

Keyboard (START), notebook (HOW TO PLAY), coffee cup (QUIT), all with a subtle hover brightness increase and no animation.

### Player hands

Six base positions, with a short 0.1 s opacity crossfade between them (no hard cuts):

| Position | Used when |
|----------|-----------|
| `hands-idle` | Default, and during the post-plug-in boot sequence |
| `hands-hover` | Cursor over action buttons |
| `hands-reach` | Cursor over the printer body or a printer element, and State 5 cable hover |
| `hands-press` | Click on a button or printer element, then back to `hands-reach` |
| `hands-pull-cable` | State 5 cable click (unplug confirmed) |
| `hands-plug-in` | State 5 port click (plug-in confirmed) |

Animation hooks: `hands-idle-breathe` (3 s loop), `hands-press-dip` (0.15 s), `hands-reach-extend` (0.2 s), `hands-pull-tension` (0.3 s), `hands-plug-guide` (0.4 s).

### Coworker

Seated sprite with 6 expressions. Character art for a humanoid cat office worker (glasses, lanyard, dusty orange fur) already exists as a turnaround sheet and a peek sprite. **[OPEN: confirm the cat is the coworker.]**

### UI

- Action button panel: 6 buttons, one layout.
- Print queue counter: green monospace on a dark display, starting at 47.
- Score display.
- Desk clock for the timer (turns red at 10 s).
- Fake diagnostic loading bar: the 99% stop needs to look almost real.
- Fake recovery checkmark: small, green, slightly too cheerful.
- Efficiency Rating end screen: plain text on a plain background.
- Riddle card (index card) for the coworker's lines.

---

## 12. Audio Design

### Music
One ambient office track: a low hum, subtle, looping cleanly.

### Sound effects
| Sound | Notes |
|-------|-------|
| Printer idle hum | Loops. Louder and angrier as the printer worsens. |
| Paper jam crunch | State 1 |
| Fake recovery chime | Short and optimistic |
| Failure sound | Plays after the 3 s delay, distinct from the chime |
| Diagnostic tick | Loading bar |
| Button click | Unlabeled, mechanical, satisfying |
| Clock tick | Last 10 s only |
| Startup sound | State 5 plug-in |
| Final print | Ending |
| Page output | One sheet landing on the tray |

### Coworker sounds
A single "hm" (one take) and one short pen scratch. There is no other voice acting. Written lines appear as text.

---

## 13. Written Content

| Item | Count / status |
|------|----------------|
| Riddles | 5 (see section 4). State 3 reuses State 1's riddle on purpose. |
| Passive comments | About 8 lines. **[OPEN: to be written]** |
| Efficiency Rating label | No explanation text |
| Final word | "perfect." |
| How to Play card | "The printer is broken. Fix it." |
| Opening line | "The printer is broken." |

---

## 14. Asset Inventory

Existing SVG files in `assets/`:

| Area | File |
|------|------|
| Environment | `office-background.svg`, `office-main-menu-concept.svg` (also earlier menu variants) |
| Printer | `printer-sprite.svg` (front), `printer-left-view.svg`, `printer-right-view.svg`, `printer-back-view.svg` |
| Printer parts and states | `paper-tray.svg`, `ink-cartridge-low.svg`, `paper-jam-warning.svg`, `wifi-status-icons.svg`, `network-icon-hidden.svg`, `overheat-heat-warning.svg`, `overheat-heat-shimmer.svg`, `power-cable-states.svg`, `blank-page-output.svg` |
| Hands | `hand-positions.svg` |
| Characters | `cat-worker-turnaround.svg`, `cat-worker-peek.svg`, `coworker-peek.svg`, `office-worker.svg` |
| UI | `stapler-button.svg`, `pause-button.svg`, `print-queue-widget.svg`, `print-queue-states.svg`, `recovery-progress-bar.svg`, `riddle-card.svg`, `end-screen.svg` |

**Not yet made:**
- 3D models: office room, desk, coworker desk, printer, cable, props
- Coworker sprite with the 6 expressions
- Action button panel (6 buttons)
- Score display
- Desk clock
- Fake recovery checkmark
- Smoke effect
- All audio

---

## 15. Technical Notes

- **Stack.** Vanilla JavaScript with ES modules and no build step. **Three.js** (loaded from a vendored file or CDN) renders the 3D world. The DOM sits on top of the canvas for 2D UI.
- **SVG overlays.** UI SVGs are **inlined** in the DOM above the canvas (or loaded via `<object>`). Hover rules and CSS state switching do not work through `<img>`.
- **SVG as textures.** For on-model displays (touchscreen), rasterise the SVG to a canvas and use it as a texture. CSS state hooks do not apply there, so redraw the texture when the state changes.
- **Raycasting.** Clicking the printer, cable, port, network icon and coworker uses Three.js raycasting against invisible hit meshes.
- **Printer state switching.** Set `data-state` on the root `<svg>` of each printer view: `0` idle, `1`, `2`, `3`, `4`, `5-unplugged`, `5-plugged`.
- **Hands.** Set `data-hands` on `hand-positions.svg` (with its viewBox set to `0 0 800 400`) to show one pose at a time.
- **Timers and fake recovery.** Driven by JS. The 3 s failure delay and the per-state timers are the main gameplay logic.
- **Fonts.** The assets use system fonts, so text varies by machine. Embed or choose web fonts before release if exact layout matters.
- **Session end.** The game must close (or return to a closed state) 8 s after the rating appears, regardless of input.

---

## 16. Scope and Risks

- **Scope is small by design:** one room, 5 states, 6 actions and one NPC. The main work is 3D asset production, art consistency and timing tuning.
- **Risk: 3D asset time.** All existing art is 2D. If modelling the printer and room does not fit the jam schedule, the fallback is the 2D plan (swap the four printer view SVGs instead of rotating a model).
- **Risk: frustration.** The game is hostile by design, so the tutorial state must teach the delay mechanic cheaply, and the timers must be playtested (State 2 should land close to expiry after two wrong guesses).
- **Risk: State 3 and State 5 discoverability.** Both depend on the player noticing a non-list interaction. Playtest whether the secondary interactions get found without making them obvious.
- **Risk: art time.** Printer views, hand poses and coworker expressions are the most expensive items. Cut priority if time runs short: coworker expressions beyond 4, then printer side views.

---

## 17. Open Questions and Assumptions

**Decided with the designer:**

| # | Decision |
|---|----------|
| A | **True 3D** world (Three.js). The SVG art becomes reference, UI overlays and textures. |
| B | Action exhaustion resets States 1 to 4 and is **off in State 5**. |
| C | The cat is the coworker. Eight passive comments are drafted in section 7. |
| D | Stack is vanilla JS with inline SVG for UI, plus Three.js for the world. This resolves the conflict between "true 3D" and "inline SVG". |

**Still open, with proposed defaults:**

| # | Issue | Proposed default |
|---|-------|------------------|
| 1 | The hands and the coworker are 2D art in a 3D scene. | Billboards and screen-space overlays. Confirm, or commit to 3D models. |
| 2 | v0.2 says "printer will rotate slightly", v0.3 says "can be rotated slightly". | Player-controlled rotation (v0.3 wins). Resolved. |
| 3 | State 4's timer is in the Timer section (40 s) but missing from the Content Flow. | 40 s. |
| 4 | Print queue after State 1 is not specified (47, then 31 after State 2). | Stays at 47 after State 1. |
| 5 | Three.js assets are not made yet: office, printer and desk models. | Low-poly or stylised models built from the SVG reference. Needs an art or tools decision. |
| 6 | When the -200 hint cost applies. | On reveal (when the hint is shown). |
| 7 | "Perfect state: 1000 flat" duplicates the base rule (1000 minus 0 penalties). | Keep as stated, since it is harmless. |
| 8 | Scores can go negative (for example 1000 minus many penalties). | Floor each state at 0. |
| 9 | The visual-assets section was cut off mid-sentence about the cable hover ("nothing that give..."). | Taken as "nothing that gives the answer away." |
| 10 | Efficiency Rating rounding and the time unit. | Show two decimals (matches the end-screen asset's `0.00`), with minutes as a decimal. |
| 11 | The "How to Play" card text is a single sentence. | Keep as is. |

---

## 18. Revision History

| Version | Notes |
|---------|-------|
| v0.2 "Rage Edition" | Initial concept, core loop, actions, timers, scoring, coworker |
| v0.3 | Player-rotatable printer |
| Content Flow v0.1 | Menu, state-by-state flow, asset and audio lists |
| v1.0 | Consolidated all of the above, resolved duplicates, added an asset inventory, technical notes, risks and open questions. |
| **v1.1** | Committed to true 3D (Three.js) with SVG for UI and textures, disabled action exhaustion in State 5, confirmed the cat as coworker and drafted 8 passive comments. |
