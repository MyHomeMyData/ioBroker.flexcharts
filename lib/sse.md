# Server-Sent Events (SSE) — Konzept

## Was ist SSE?

SSE ist ein HTTP-Standard für **unidirektionale Server→Browser-Kommunikation**. Der Browser öffnet eine normale HTTP-Verbindung, die aber *offen bleibt*. Der Server kann darüber jederzeit Nachrichten schicken, ohne dass der Browser erneut anfragen muss.

```
Browser                          Server
  |                                |
  |--- GET /flexcharts/events ---> |  (Verbindung bleibt offen)
  |                                |
  |                                |  ... Zeit vergeht ...
  |                                |
  | <-- data: {"reload":true} ---  |  (ioBroker State hat sich geändert)
  |                                |
  |  [Browser lädt Chart neu]      |
```

Gegenüber WebSocket ist SSE bewusst simpel: nur eine Richtung, reines HTTP, Browser-nativ unterstützt, automatisches Reconnect inklusive.

---

## Wie SSE im Server aussieht

```js
app.get('/flexcharts/events', (req, res) => {
    // Spezielle HTTP-Header aktivieren SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Nachricht senden — Format ist fest definiert
    res.write('data: {"reload":true}\n\n');  // ← zwei Newlines = Ende einer Nachricht

    // Verbindung offen halten bis Browser trennt
    req.on('close', () => { /* aufräumen */ });
});
```

## Wie SSE im Browser aussieht

```js
const evtSource = new EventSource('/flexcharts/events?source=state&id=...');
evtSource.onmessage = () => {
    // Chart neu laden
    fetchChartData().then(data => myChart.setOption(data));
};
```
