# Server-Sent Events (SSE) — Concept and Implementation

## What is SSE?

SSE is an HTTP standard for **unidirectional server→browser communication**. The browser opens a normal HTTP connection that stays open. The server can push messages to the browser at any time without the browser having to ask again.

```
Browser                          Server
  |                                |
  |--- GET /flexcharts/events ---> |  (connection stays open)
  |                                |
  |         ... time passes ...    |
  |                                |
  | <-- data: {}  ----------------  |  (ioBroker state has changed)
  |                                |
  |  [Browser reloads chart]       |
```

Compared to WebSocket, SSE is intentionally simple: one direction only, plain HTTP,
natively supported by browsers, automatic reconnect included.

---

## How SSE works on the server side

```js
app.get('/flexcharts/events', (req, res) => {
    // Special HTTP headers activate SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Send a message — format is strictly defined
    res.write('data: {}\n\n');  // ← two newlines = end of one message

    // Keep connection open until the browser disconnects
    req.on('close', () => { /* clean up */ });
});
```

Additional headers required for reliable operation in real-world deployments:

```js
res.setHeader('X-Accel-Buffering', 'no');  // Prevent nginx/proxy buffering
req.socket.setTimeout(0);                   // Disable socket idle timeout
```

After each write, flush any compression middleware:

```js
if (typeof res.flush === 'function') res.flush();
```

---

## How SSE works on the browser side

```js
const evtSource = new EventSource('/flexcharts/events?source=state&id=...');
evtSource.onmessage = () => {
    location.reload();  // Reload chart page when state changes
};
```

---

## State change detection: event-driven vs. polling

### Variant A — event-driven via `adapter.on('stateChange', ...)`

The natural approach would be to subscribe to an ioBroker state and react to change events:

```js
this.adapter.subscribeForeignStates(stateId);
this.adapter.on('stateChange', id => {
    if (id === stateId) {
        res.write('data: {}\n\n');
    }
});
```

**Why this does NOT work in a web extension:**

A flexcharts web extension runs inside the **web adapter process** (iobroker.ws / iobroker.web),
not as a standalone adapter. The `adapter` object available to the extension is the web adapter's
own instance.

In certain versions of `@iobroker/adapter-core`, state changes are dispatched internally via a
direct constructor callback (`{ stateChange: handler }`), **not** via `EventEmitter.emit()`.
As a result, listeners registered with `adapter.on('stateChange', ...)` are never called —
confirmed by adding unconditional debug logging that produced no output when states changed.

### Variant B — polling via `getForeignStateAsync()` ✓ (used)

Instead of waiting for an event, the server polls the ioBroker state database every second
and compares the timestamp:

```js
let lastTs = 0;
const poll = setInterval(async () => {
    const state = await adapter.getForeignStateAsync(stateId);
    const ts = state ? state.ts : 0;
    if (ts > lastTs && lastTs > 0) {
        res.write('data: {}\n\n');  // State changed → push SSE event
    }
    lastTs = ts;
}, 1000);
```

**Why this works reliably:**

- `getForeignStateAsync()` is a local database access (no network round-trip)
- ioBroker itself performs thousands of such reads per second internally —
  a few extra reads per second for SSE clients are negligible
- Polling runs entirely on the ioBroker machine, not across the network
- The interval is active only while at least one browser client has the page open;
  `clearInterval()` is called when all clients disconnect

**Trade-off:** Up to 1 second delay between state change and chart reload.
For chart dashboards this is fully acceptable.
