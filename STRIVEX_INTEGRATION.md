# StriveX integration

The integration is isolated in `lib/strivex-protocol.js`, `lib/strivex-serial.js`, and `lib/strivex-session.js`. Electron main process owns all serial and WebSocket I/O; renderers receive sanitized IPC events through `preload.js`, so neither UI window blocks on I/O.

States are `disconnected`, `idle`, `running`, `finishing`, and `error`. The line protocol buffers partial chunks, splits multiple LF/CRLF lines, ignores empty lines, rejects unknown commands, de-duplicates session IDs and enforces one final message. Reconnection sends `READY` again. WebSocket mode is compatible with the current local StriveX Gateway.

The final numeric result is `roundDurationMs - bestReactionOffsetMs` (higher is better). Metadata contains `reaction_ms`, difficulty and both player offsets. A round without a valid pre-zero press sends `TIMEOUT`; cancellation sends `FAILED`.
