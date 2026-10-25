# OFFLINE

*The printer is broken. Fix it.*

OFFLINE is a short point-and-click puzzle about one broken office printer with 47 jobs stuck in its queue. All you have is a mouse, a few printer parts to poke at, and a coworker who talks in riddles. A run takes a few minutes.

It is written in pure Three.js r128 (plain script tags, no build step) for the Xsolla x GamePix Game Jam c3 KL (jam code `xsolla-gamejam-c3-kl`).

## How to play

Press START on the main menu. HOW TO PLAY shows an index card (click it to dismiss). QUIT tries to close the tab and otherwise just shows a message.

**Controls**

- Mouse only. The one exception is typing a Wi-Fi password on the keyboard in one of the puzzles.
- Click a part of the printer to fly the camera to it, then click it again to use it. Hover over a part to see its name.
- In the wide view (the one you start in, and return to when you zoom out) drag to look around and scroll to zoom. Zoomed-in parts can't be orbited.
- BACK (top left, shown while you are zoomed in) zooms out. Esc does the same when zoomed in.
- MENU (top left) opens the pause card: Resume, Zoom out, Sound on/off, Restart game, Main menu. Esc opens it from the wide view and closes it again. The game also pauses by itself when you switch tabs.
- The top right shows SCORE, QUEUE (jobs left, starts at 47) and TIME (the countdown for the current fault).

**What you can click**

- The paper tray, and whatever is stuck in it.
- The ink panel and its four tanks.
- The touchscreen. It has real buttons and pages (Print Job, Settings, Status, Ink Level, Help and more).
- The fans on the side of the printer.
- The power inlet and the wall plug at the back. You can drag the plug.
- The power key on the touchscreen's bezel.
- Your coworker, bottom left. Click once for the riddle, twice for a comment, and after that you get silence. It starts over with every new fault.
- The page that comes out of the printer at the very end.

The office around the printer is part of the puzzle too, so drag the camera around.

## The five faults

The printer breaks five times in a row. Each fault has a countdown, a riddle, and its own symptoms. Fix one and the next starts a few seconds later.

1. **Paper jam** - 60 s. A sheet is stuck and the jam alarm sounds. Queue 47 -> 31.
2. **Ink** - 50 s. An alarm sounds and the touchscreen reports empty ink. Queue -> 19.
3. **Offline** - 45 s. The touchscreen says there is no network connection. Queue -> 8.
4. **Overheating** - 40 s. The fans roar, an alarm sounds, and the printer is too hot to print. Queue -> 1.
5. **Frozen** - no timer. The touchscreen freezes. Queue -> 0.

After the last fix, one final page prints.

## Scoring

Every fault is worth 1000 points, and penalties come off that fault's 1000.

| What happens | Points |
|---|---|
| Fix a fault | +1000, minus that fault's penalties (never below 0) |
| Wrong move | -100 |
| Hint | -200 |
| Timer runs out | -150, and the timer restarts at half length (penalties stack) |
| Every action tried (factory reset) | -500 |

- The SCORE on screen is what you would bank if you fixed the current fault right now, so it only drops while you are stuck.
- A wrong move can look like it worked: a green tick for a couple of seconds, then the fault comes back.
- After three wrong moves on one fault the coworker offers a hint. It costs 200 and is only right about 30% of the time.
- Try every possible fix without solving the fault and the printer factory-resets that fault. You start it again with a full timer and a 500 point penalty.
- At the end you get an Efficiency Rating: your points per minute of play (time on the pause card doesn't count). A perfect run is 5000 points, so faster is better.
- The game closes itself 8 seconds after the rating, with a Play again button.

## Tips

- Turn the sound on. Most faults have their own alarm, and some clues are audio.
- Read the riddle, and click the coworker for it again if you missed it.
- Looking is free. Zooming, orbiting and opening things costs nothing; only a fix attempt can cost points.
- Don't mash buttons. Wrong moves add up fast, and some of them look like they worked.
- The touchscreen is a real touchscreen. Its Status and Ink Level pages tell you what the printer thinks is wrong.
- Not everything useful is on the printer. Look around the office.

<details>
<summary>Spoilers: how to fix each fault</summary>

1. **Paper jam.** Click the paper tray to zoom in (it opens by itself), then click the crumpled sheet to pull it out. Reloading paper doesn't help.
2. **Ink.** Click the ink panel, then click the tank that is empty. The Ink Level page on the touchscreen shows which one. The wrong tank costs points.
3. **Offline.** Zoom in on the touchscreen. It shows No network connection (also under Settings > Network). Tap Connect Wi-Fi and type the network name and password from the whiteboard in the office: `Corbrat` and `241026`. Tab switches fields; Enter or the Connect button submits.
4. **Overheating.** On the touchscreen, open Print Job and press Pause job. Switching the printer off with the power key on the touchscreen's bezel works too. The fans are a trap.
5. **Frozen.** There is no button. Zoom in on the back of the printer, drag the wall plug out of the socket, then drag it back in. If you let go while it is out, it drops to the floor; pick it up again.

Hidden: unplug the printer five times within eight seconds and the credits roll. Every replug before the last fault counts as a wrong move, so it costs points.

</details>

## Run locally

```
python -m http.server 8000
```

Then open http://localhost:8000/ in desktop Chrome or Edge. You need a mouse and a keyboard; it is not mobile friendly.

- Serve the folder over HTTP instead of opening `index.html` from disk.
- Three.js is vendored in `lib/`, so the game needs no network. The GamePix SDK is optional: it only adds pause, mute and score hooks, and every call is guarded.
- Add `?debug` to the URL (http://localhost:8000/?debug) to show DANN's debug controller, with sound and animation toggles. It is for development only.

## Build the zip

```
powershell -ExecutionPolicy Bypass -File tools\make-zip.ps1
```

This writes `offline-build.zip` (git-ignored) in the repo root, for the GamePix / Xsolla upload. `index.html` sits at the zip root and entry names use forward slashes. Only what the game needs is packaged: `index.html`, `lib/`, `game/`, the `js` and `css` folders of `assets/printer` and `assets/office`, and `audio/*.mp3`. The script checks that every file `index.html` references is in the zip and fails if one is missing.

Options: `-DryRun` lists what would ship and runs the checks without writing anything, and `-Out <path>` picks the output file. It needs Windows (it uses the built-in `tar.exe`).

## Project structure

```
index.html            the game page; loads everything in order
lib/                  Three.js r128 and OrbitControls, vendored
game/
  js/                 the game layer (window.Offline). logic.js holds the rules and has
                      no DOM code; the other files wire it to the scene, the touchscreen,
                      the HUD and the GamePix SDK (session.js)
  css/                menu and HUD styles
  img/                menu art and the how-to card
assets/
  printer/            the 3D printer and its parts (window.Cetak), plus a standalone demo
                      page: http://localhost:8000/assets/printer/
  office/             the office, people and sounds (window.Cetak.office), plus a standalone
                      demo page: http://localhost:8000/assets/office/
audio/                printer sounds (mp3)
store/                cover and icon for the store listing
tools/make-zip.ps1    builds the upload zip
```

## Credits

- DANN: the 3D printer, the office scene, the sounds and the Wi-Fi screen.
- REX: the idea of predefined print jobs.
- Menu art: the team.
- Game layer (rules, HUD, touchscreen, scene wiring): written with Claude Code.
- Three.js r128 (MIT licensed) and the GamePix SDK.
