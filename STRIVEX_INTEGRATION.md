# StriveX integration

The integration is isolated in `lib/strivex-protocol.js`, `lib/strivex-serial.js`, and `lib/strivex-session.js`. Electron main process owns all serial and WebSocket I/O; renderers receive sanitized IPC events through `preload.js`, so neither UI window blocks on I/O.

States are `disconnected`, `idle`, `running`, `finishing`, and `error`. The line protocol buffers partial chunks, splits multiple LF/CRLF lines, ignores empty lines, rejects unknown commands, de-duplicates session IDs and enforces one final message. Reconnection sends `READY` again. WebSocket mode is compatible with the current local StriveX Gateway.

The final numeric result is `roundDurationMs - bestReactionOffsetMs` (higher is better). Metadata contains `reaction_ms`, difficulty and both player offsets. A round without a valid pre-zero press sends `TIMEOUT`; cancellation sends `FAILED`.

## Centralized per-round TNT XP

Every real WebSocket round sends `tnt_round_result` with a stable UUID, difficulty,
duration and each bracelet's offset (null for a missed/late press). Gateway maps
bracelets to paid sessions and the StriveX server computes 0–100 XP per player.
Server receipts return through `round_reward`; the results screen shows confirmed
XP, a strictly improved personal-best badge and the previous time. Without a
receipt it shows `— XP`. Paid-session score/points remain separate from XP.

Records are centralized by player ID and difficulty. First valid results earn
quality; later results earn the improvement in quality plus up to 10% attempt XP,
with a 20-XP daily repeat budget per player in TNT across sessions and stations.
The full policy and deployment/test instructions are in the Strivex repository's
`docs/tnt-xp.md`. Server, Gateway and TNT must all be updated.

Design/interface-test mode does not submit real rewards. Preview rewards are
accepted only in that mode. Reopening a results screen cannot award XP; replaying
a round returns its original server receipt instead of awarding again.
