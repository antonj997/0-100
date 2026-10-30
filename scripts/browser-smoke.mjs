import { writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const tabs = await (await fetch("http://127.0.0.1:9222/json")).json();
const ws = new WebSocket(tabs[0].webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let n = 0;
const pending = new Map(),
  errors = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id) {
    const p = pending.get(m.id);
    pending.delete(m.id);
    m.error ? p.reject(m.error) : p.resolve(m.result);
  }
  if (m.method === "Runtime.exceptionThrown") errors.push(m.params);
};
const call = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++n;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
const evaluate = async (expression) => {
  const r = await call("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails));
  return r.result.value;
};
const wait = async (expression) => {
  for (let i = 0; i < 80; i++) {
    if (await evaluate(expression)) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw Error("Timed out: " + expression);
};
const click = async (selector) =>
  evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
const input = async (selector, value) =>
  evaluate(
    `(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('input',{bubbles:true}));})()`,
  );
await call("Runtime.enable");
await call("Page.enable");
await call("Emulation.setDeviceMetricsOverride", {
  width: 390,
  height: 844,
  deviceScaleFactor: 1,
  mobile: true,
});
await call("Page.navigate", { url: "http://127.0.0.1:4173/" });
await evaluate("localStorage.clear()");
await call("Page.reload");
await wait("!!document.querySelector('#my-name')");
await input("#my-name", "Anton");
await evaluate("document.querySelector('#connect-form').requestSubmit()");
await wait("!!document.querySelector('#share')");
const session = await evaluate(
  "JSON.parse(localStorage.getItem('zero100-online-session'))",
);
const B = "b".repeat(64);
const api = async (action, token = session.token, extra = {}) => {
  const r = await fetch("http://127.0.0.1:4173/api", {
    method: "POST",
    body: JSON.stringify({ code: session.code, token, action, ...extra }),
  });
  const data = await r.json();
  assert.equal(r.status, 200, JSON.stringify(data));
  return data;
};
await api("join", B, { name: "Sara" });
await wait("!document.querySelector('#start').disabled");
await click("#start");
await wait("!!document.querySelector('#guess-form')");
await input("#my-guess", "42");
await evaluate("document.querySelector('#guess-form').requestSubmit()");
await wait(
  "document.querySelector('#guess-form button').textContent.includes('Spara')",
);
await input("#my-guess", "43");
await evaluate("document.querySelector('#guess-form').requestSubmit()");
await api("guess", B, { round: 0, value: 30 });
await wait("!document.querySelector('#lock').disabled");
const shot = async (name) => {
  const metrics = await call("Page.getLayoutMetrics");
  const r = await call("Page.captureScreenshot", {
    clip: {x:0,y:0,width:metrics.cssContentSize.width,height:metrics.cssContentSize.height,scale:1},
    format: "png",
    captureBeyondViewport: true,
  });
  await writeFile(
    (process.env.SCREENSHOT_DIR || "/tmp") + "/zero100-" + name + ".png",
    Buffer.from(r.data, "base64"),
  );
};
assert.equal(
  await evaluate(
    "document.querySelectorAll('.live-scorecard tbody tr').length",
  ),
  7,
);
await shot("answer");
await click("#manage-game > summary");
await evaluate(
  "document.querySelector('#card-count').value='3';document.querySelector('#cards-form').requestSubmit()",
);
await wait(
  "document.querySelector('.simple-heading h1').textContent.includes('av 3')",
);
await shot("management");
await click("#manage-game > summary");
await click("#lock");
await wait("!!document.querySelector('#correct-answer')");
await input("#correct-answer", "46");
await evaluate("document.querySelector('#correct-form').requestSubmit()");
await wait("!!document.querySelector('#next-question')");
assert.equal(
  await evaluate(
    "document.querySelector('.live-scorecard tfoot td').textContent",
  ),
  "3",
);
await shot("private-result");
await click("#next-question");
await wait("document.body.innerText.includes('Väntar på de andra')");
await api("next", B, { round: 0 });
await wait("!!document.querySelector('#guess-form')");
for (let q = 1; q < 7; q++) {
  await api("guess", session.token, { round: q, value: 40 + q });
  await api("guess", B, { round: q, value: 30 + q });
  await api("lock", session.token, { round: q });
  await api("reveal", session.token, { round: q, value: 46 });
  await api("next", session.token, { round: q });
  await api("next", B, { round: q });
}
await wait("document.body.innerText.includes('Kortet är klart')");
await shot("card-summary");
await click(".scorecard-archive > summary");
await click(".scorecard-archive details > summary");
assert.equal(
  await evaluate(
    "document.querySelectorAll('.scorecard-archive section:first-of-type tbody tr').length",
  ),
  7,
);
await shot("card-archive");
await click("#manage-game > summary");
await click("#finish");
await click("#confirm-action");
await wait("document.body.innerText.includes('Spelet är klart')");
await shot("standings");
assert.equal(
  await evaluate("document.documentElement.scrollWidth > innerWidth"),
  false,
);
await call("Emulation.setDeviceMetricsOverride", {
  width: 1280,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});
await shot("desktop");
assert.equal(errors.length, 0, JSON.stringify(errors));
console.log(
  "Browser passed: create, join, edit, lock, reveal, private result, independent advance, early finish; mobile and desktop screenshots; no JS exceptions.",
);
ws.close();
