# TNT Attraction 2.0 — StriveX

Windows/Electron client for the TNT reaction attraction. The application opens a touch control window on the primary display and a player window on the secondary display. The player must press the detonator as close as possible **before** the timer reaches zero; the lower reaction offset wins.

## Requirements

- Windows 10/11 x64
- Node.js 22 LTS (Node 24 is not recommended for native serial dependencies)
- two displays configured in Windows as “Extend these displays”
- USB joystick board (four buttons)
- optional Arduino Nano LED controller
- StriveX Gateway listening on local WebSocket port 4200

## Install and run

Open Command Prompt in this folder and run:

```bat
npm.cmd install
npm.cmd run check
npm.cmd start
```

Or double-click `scripts\start-dev.bat`. Build a portable EXE with `scripts\build-exe.bat`; output is placed in `dist`.

## Interface test mode

The normal and design mode lists include **Мешок тротила** with one level. Each rising edge
of a player's detonator (or keyboard `1` / `2`) adds one charge. Debounce is
independent for each player; keyboard auto-repeat is ignored. Configure the
game using `bagPreview.durationSeconds` (10) and `bagPreview.debounceMs` (250)
in `config.json`. Holding a gamepad button does not add repeated charges.
At timeout only the higher-count bag explodes; a tie explodes neither. Live charge
counts are hidden. A single statistics screen shows final counts, total charges,
and each player's pace/share, followed by an empty lobby.
Bag colors prefer supplied nickname colors, then avatar colors/presets, then
blue/orange seat defaults. Final charge counts are reported per player to Gateway.
This mode does not award XP or alter accuracy records; its XP policy is not defined.
The **Мешок тротила** test-panel shortcut starts a full preview round.

The normal and design settings also offer the **Фитиль** difficulty.
Its cartoon dynamite fuse burns for nine seconds, with a moving ember and sizzling
audio instead of ticking. Both game windows hide numerical timers and score cards.
Real rounds use central XP with a separate `fuse` record; update Server and Station
along with TNT 2.0.5. `npm run check:game-modes` verifies both ordinary game flows.
The test panel collapses during this mode; use keyboard `1` / `2` for the players,
or open the flask button to access the panel. The **Фитиль** panel shortcut launches
a complete preview round. Design/interface-test rounds do not submit real XP
and use a separate local preview leaderboard. For design work no installer
build is needed: run `npm.cmd run design` and choose the third difficulty.

### Windowed design preview (no EXE build)

Run `scripts\start-design.bat`, or from PowerShell in the project folder:

```powershell
npm.cmd run design
```

This opens two movable, resizable windows side by side on the primary monitor.
The interface test panel switches screens and simulates detonator presses. A demo
Gateway replaces the real connection; COM devices are disabled.
To exercise the lobby, type `111` then Enter and `222` then Enter in the control
window to simulate two bracelets. F12 opens developer tools in either window.
Closing either preview window ends the design session.

Demo bracelet codes also work in the player window while the lobby is open.
The test panel has **Браслет 111** / **Браслет 222** buttons. Returning to Lobby
from the panel or reloading the control page resets the demo session, so an
unfinished preview round cannot silently block the next scan. HTML/JS reloads
reset demo players; CSS refreshes keep them. Main-process changes require
closing both preview windows and restarting `start-design.bat` once.

Save CSS files under `public` to update both windows automatically while keeping
the selected screen. Saving HTML, JavaScript, images or other files under `public`
or `lib` reloads both pages and resets the preview; select the desired screen again
using the test panel. Changes to `main.js`, `preload.js` or `config.json` require a
restart of design mode. No EXE rebuild is needed. These features only run in design
mode from source; normal launch and packaged application behavior are unchanged.

Double-click `scripts\start-interface-test.bat`. This mode disables StriveX and COM devices, opens both application windows and adds an operator panel to the touch window. The panel can display every screen, simulate both players, start a complete countdown/round and verify responsive layout and translations. A yellow `INTERFACE TEST` badge makes it impossible to confuse this mode with normal operation.

The same mode can be started from Command Prompt:

```bat
set TNT_INTERFACE_TEST=true
npm.cmd start
```

The test panel shows the active mapping:

- blue player: USB start button 1, detonator button 2, keyboard `1`;
- orange player: USB start button 3, detonator button 4, keyboard `2`.

Both windows use their assigned displays in fullscreen. Use “Свернуть панель” to inspect the touch layout without the operator panel.

## Controls

The values in `config.json` are one-based button numbers:

- button 1 — Player 1 start
- button 2 — Player 1 detonator
- button 3 — Player 2 start
- button 4 — Player 2 detonator

The lobby Start button starts the 3–2–1 countdown directly after Gateway approval,
with no entry invitation or extra button-press screen. Both windows show the
10-second round timer, not the paid-session balance. After results and the
leaderboard the game returns to an empty lobby; both bracelets must be scanned
again. Ending the game round does not remove remaining paid time on the server.
Keyboard development controls: `1` and `2` are player detonators.

Run `npm.cmd run check:production-ui` to exercise the normal Gateway-approved
start flow, both round timers and the player reset in Electron without hardware.

## StriveX

Default transport is WebSocket on `127.0.0.1:4200`. The game identifies itself as `tnt`. Gateway `unlock` opens the menu and supplies the registered player. Gateway `tick` controls paid session time. `expired`/`lock` terminates the session. A legacy line-based serial transport is also retained.

Environment variables override configuration:

```text
STRIVEX_ENABLED=true
STRIVEX_TRANSPORT=websocket
STRIVEX_WS_PORT=4200
STRIVEX_SERIAL_PORT=COM10
STRIVEX_SERIAL_BAUD=115200
STRIVEX_RECONNECT_MS=3000
```

Legacy serial commands: `START:<session_id>` and `DENY:<reason>`. Outgoing messages: `READY`, exactly one of `RESULT:<number>:<json>`, `FAILED:<json>`, `TIMEOUT`, or `ERROR:<message>` per START. TNT result is a proximity score; `reaction_ms` and both player values are included in metadata.

Set `strivex.developmentMode` to `true` to show simulation controls. Set `offline.enabled` to `true` only for service testing without Gateway.

## Audio

Round audio is generated and buffered locally using Web Audio: one countdown beep
per second, a looping clock tick during play, and an explosion at zero or when both
players press. The explosion starts at zero without waiting for the result grace
period. Each new round sound immediately stops the previous sound and background
music; returning to the menu stops the round sound. No downloaded audio files are
required for these three sounds. `audio.effectsVolume` controls their volume.
Result cards and leaderboards display seconds with three decimal places (for
example `1.046с` in Russian); internal scores and Gateway data remain in milliseconds.

Put any number of menu tracks in `music\menu` and game tracks in `music\game`. Optional files in `music`:

- `countdown1.mp3` — one start countdown clip
- `detonator.mp3` — detonator press
- `end.mp3` — end screen music

Music switches immediately; round countdown, ticking and explosion take precedence.

## Arduino LED protocol

The included Nano sketch uses D2–D5 and accepts: `HELLO`, `MODE IDLE`, `MODE READY`, `MODE COUNTDOWN`, `MODE GAME NORMAL|HARD`, `PRESS P1|P2`, and `RESULT ...`. Change `LEDS_PER_LINE` to match the physical strips. LED power must come from a separate 5 V supply with common GND.

## Verification

Run `npm.cmd run check`. Hardware exchange must additionally be tested with the actual joystick, Nano and StriveX Gateway; automated tests do not prove physical wiring or COM port identity.
