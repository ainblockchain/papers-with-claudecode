# WebSocket & Event Reference

Communication protocol between Browser, web-terminal-service, and Sandbox Pod.

---

## Architecture Overview

```
Browser (xterm.js)          web-terminal-service          Sandbox Pod
     │                            │                           │
     │── WebSocket /ws ──────────>│                           │
     │   { type: 'input' }        │── K8s exec (TTY) ───────>│
     │   { type: 'resize' }       │   stdin / stdout          │ Claude CLI
     │   { type: 'ping' }         │   channel 4 (resize)      │ start-claude.sh
     │                            │                           │
     │<── raw text ──────────────│<── stdout ────────────────│
     │<── { type: 'stage_complete' }  (marker detected)       │
     │<── { type: 'auto_start' }                              │
```

---

## 1. Browser → Service (WebSocket messages)

| Event | Format | When | Handler Action |
|-------|--------|------|----------------|
| `{ type: 'input', data: '...' }` | JSON | User types in terminal | Forward `data` to Pod stdin via `stdinStream.push()`. Reset idle timer. |
| `{ type: 'resize', cols, rows }` | JSON | Browser terminal resized | Forward to K8s exec channel 4 as `{ Width, Height }` (TTY resize). |
| `{ type: 'ping' }` | JSON | Frontend heartbeat (periodic) | Respond with `{ type: 'pong' }`. |
| Raw text (non-JSON) | string | Fallback (legacy compat) | Forward directly to `stdinStream.push()`. |

### Connection URL

```
wss://api.paperswithclaudecode.com/ws?sessionId={sessionId}
```

---

## 2. Service → Browser (WebSocket messages)

| Event | Format | When | Frontend Action |
|-------|--------|------|-----------------|
| Raw text | string | Pod stdout output (Claude responses) | Render in xterm.js terminal |
| `{ type: 'auto_start' }` | JSON | Right after K8s exec attaches (if courseId exists) | Switch from loading UI to active session |
| `{ type: 'stage_complete', stageNumber }` | JSON | Claude outputs `[STAGE_COMPLETE:N]` marker | Show stage completion UI. Marker is stripped from terminal output. |
| `{ type: 'course_complete' }` | JSON | Claude outputs `[DUNGEON_COMPLETE]` marker | Show course completion UI. Marker is stripped. |
| `{ type: 'stage_unlocked', stageNumber, txHash }` | JSON | Claude outputs `[PAYMENT_CONFIRMED:N:0x...]` marker | Show payment confirmation + unlock stage. Marker is stripped. |
| `{ type: 'session_end', reason }` | JSON | K8s exec process exits (Claude CLI done/exit/crash) | Show "session ended" UI. `reason`: `'process_exit'` or `'error'`. Connection closes after this. |
| `{ type: 'pong' }` | JSON | In response to `ping` | Heartbeat acknowledged |
| `Error: sessionId required` | string | Missing sessionId query param | Show error, connection closes |
| `Error: session not found or not running` | string | Invalid or expired session | Show error, connection closes |
| `Connection to pod failed: ...` | string | K8s exec fails | Show error, connection closes |

### Server-Side Ping

The service sends WebSocket protocol-level `ping` frames every **25 seconds** to detect stale connections. This is separate from the application-level `ping`/`pong` above.

---

## 3. Service → Sandbox Pod (K8s exec)

| Action | When | Details |
|--------|------|---------|
| `exec start-claude.sh {courseId} {model} {mode}` | WebSocket connection established | Spawns Claude CLI inside Pod with TTY. `start-claude.sh` handles first-visit vs revisit logic. |
| stdin relay | User input or idle nudge | `stdinStream → Pod stdin` |
| stdout relay | Claude produces output | `Pod stdout → stdoutStream` → marker detection → browser |
| Idle nudge injection | No user input for 120s (learner mode only) | Injects prompt like `"Please continue exploring the next topic\n"` into stdin. Cycles through 3 prompts. Generator mode: disabled. |
| Channel 4 resize | Terminal resize event | `{ Width: cols, Height: rows }` sent via K8s exec resize channel |

---

## 4. Marker-Based Event Detection

The Claude CLI inside the sandbox outputs special markers as instructed by `CLAUDE.md`. The `terminal-bridge` detects these in stdout, fires structured WebSocket events, and strips them from terminal output.

### Markers

| Marker Pattern | Regex | Event Emitted | DB Action |
|----------------|-------|---------------|-----------|
| `[STAGE_COMPLETE:N]` | `/\[STAGE_COMPLETE:(\d+)\]/g` | `{ type: 'stage_complete', stageNumber: N }` | `saveStageComplete(userId, courseId, N, sessionId)` |
| `[DUNGEON_COMPLETE]` | Exact string match | `{ type: 'course_complete' }` | `saveCourseComplete(userId, courseId)` |
| `[PAYMENT_CONFIRMED:N:0xHASH]` | `/\[PAYMENT_CONFIRMED:(\d+):(0x[a-fA-F0-9]+)\]/g` | `{ type: 'stage_unlocked', stageNumber: N, txHash }` | `saveStagePayment(userId, courseId, N, txHash, sessionId)` |

### Flow

```
Claude CLI stdout: "Great job! [STAGE_COMPLETE:2] Let's move on..."
                                │
                                v
terminal-bridge stdoutStream.write():
  1. Detect [STAGE_COMPLETE:2]
  2. Save to SQLite: progressStore.saveStageComplete(...)
  3. Send to browser: ws.send({ type: 'stage_complete', stageNumber: 2 })
  4. Strip marker from text
  5. Forward remaining text: "Great job!  Let's move on..."
```

---

## 5. REST API Events (HTTP)

| Endpoint | Method | When | Internal Actions |
|----------|--------|------|------------------|
| `/api/sessions` | POST | Create new session | Validate courseUrl → findUserPod (reuse or create) → waitForPodReady → (learner) fetch course tarball → return session info |
| `/api/sessions` | GET | List sessions | Iterate sessions, sync each with K8s Pod status |
| `/api/sessions/:id` | GET | Get session detail | Sync Pod status, return session |
| `/api/sessions/:id` | DELETE | End session | Remove session record only; Pod stays alive for reuse |
| `/api/stages` | GET | Query stage definitions | Return course stage metadata |
| `/api/progress/:userId/:courseId` | GET | Query learner progress | Read from SQLite |
| `/api/x402/unlock-stage` | POST | Payment for stage unlock | x402 facilitator flow (if merchant wallet configured) |
| `/health` | GET | Health check | `{ status: 'ok', activeSessions: N }` |

### Session Creation Flow (POST /api/sessions)

```
Request: { courseUrl, userId, mode, resumeStage? }
    │
    ├─ Validate courseUrl (HTTPS only)
    ├─ Derive courseId from URL
    ├─ Check maxSessions limit (429 if exceeded)
    │
    ├─ findUserPod(userId, mode)
    │   ├─ Found Running Pod → reuse (podReused: true)
    │   └─ Not found → createPod() → waitForPodReady()
    │
    ├─ (learner + courseUrl) Fetch course into Pod:
    │   ├─ GitHub raw URL → tarball download + extract
    │   └─ Other URL → curl CLAUDE.md only
    │
    ├─ (resumeStage) Write /tmp/resume-context in Pod
    │
    └─ Response 201: { sessionId, podName, courseId, mode, podReused }
```

---

## 6. Idle Nudge System (Learner Mode Only)

When the user is inactive, the service injects prompts to keep Claude teaching autonomously.

| Setting | Value |
|---------|-------|
| Timer | 120 seconds (learner with courseId) |
| Generator mode | Disabled (0) |
| No courseId | Disabled (0) |

### Nudge Prompts (cycled in order)

1. `"Please continue exploring the next topic\n"`
2. `"Find and explain a more interesting part\n"`
3. `"Shall we look at the next important concept?\n"`

### Timer Lifecycle

```
User input → resetIdleTimer() → 120s countdown
    │                               │
    │  (user types again)           │ (timeout fires)
    └── resetIdleTimer() ◄──────── stdinStream.push(nudge prompt)
                                    └── resetIdleTimer() (restart for next nudge)
```
