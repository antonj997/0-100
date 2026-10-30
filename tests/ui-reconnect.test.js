import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
function ui() {
  const nodes = new Map();
  const node = (s) => {
    if (!nodes.has(s))
      nodes.set(s, {
        innerHTML: "",
        textContent: "",
        setAttribute() {},
        focus() {},
      });
    return nodes.get(s);
  };
  const context = vm.createContext({
    endpoint: "https://example.test",
    celebrate() {},
    stopCelebration() {},
    document: {
      querySelector: node,
      querySelectorAll: () => [],
      documentElement: {},
      addEventListener() {},
    },
    location: { href: "https://test/" },
    localStorage: { getItem: () => null, setItem() {} },
    URL,
    setInterval() {},
    window: { addEventListener() {} },
    console,
  });
  vm.runInContext(
    readFileSync(
      new URL("../public/online.js", import.meta.url),
      "utf8",
    ).replace(/^import .*;\n/gm, ""),
    context,
  );
  return { node, run: (s) => vm.runInContext(s, context) };
}
test("unchanged recovery clears visible connection warning", () => {
  const v = ui();
  v.run(
    `session={code:'ABCDEFGH'};room={code:'ABCDEFGH',revision:1,stage:'lobby',players:[],serverNow:0};connectionLost=true;`,
  );
  v.node("#online-connection").textContent = "Kontakten bröts";
  v.run("accept({...room,serverNow:1})");
  assert.equal(v.node("#online-connection").textContent, "");
  assert.equal(v.run("connectionLost"), false);
});
test("stale room response cannot overwrite current session", () => {
  const v = ui();
  v.run(
    `session={code:'ABCDEFGH'};room=null;accept({code:'OTHERABC',revision:1})`,
  );
  assert.equal(v.run("room"), null);
});
test("resaving a displayed restored guess submits that number", () => {
  const v = ui();
  v.run(
    `room={round:0};guessDraft='';command=(action,payload)=>{globalThis.sent=payload;};bind();`,
  );
  v.node("#my-guess").value = "42";
  v.node("#guess-form").onsubmit({ preventDefault() {} });
  assert.equal(v.run("sent.value"), "42");
});
