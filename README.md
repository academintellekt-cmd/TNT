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

## Controls

The values in `config.json` are one-based button numbers:

- button 1 — Player 1 start
- button 2 — Player 1 detonator
- button 3 — Player 2 start
- button 4 — Player 2 detonator

Keyboard development controls: `Enter`/`Space` starts, `1` and `2` are player detonators.

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

Put any number of menu tracks in `music\menu` and game tracks in `music\game`. Optional files in `music`:

- `countdown1.mp3` — one start countdown clip
- `detonator.mp3` — detonator press
- `end.mp3` — end screen music

Tracks crossfade between menu, game, and results.

## Arduino LED protocol

The included Nano sketch uses D2–D5 and accepts: `HELLO`, `MODE IDLE`, `MODE READY`, `MODE COUNTDOWN`, `MODE GAME NORMAL|HARD`, `PRESS P1|P2`, and `RESULT ...`. Change `LEDS_PER_LINE` to match the physical strips. LED power must come from a separate 5 V supply with common GND.

## Verification

Run `npm.cmd run check`. Hardware exchange must additionally be tested with the actual joystick, Nano and StriveX Gateway; automated tests do not prove physical wiring or COM port identity.
