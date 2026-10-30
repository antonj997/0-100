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
test("simple scorecard has seven rows, current input highlight and live sum", () => {
  const v = ui();
  v.run(
    `room={stage:'question',round:1,card:1,players:[],meId:'a',readerId:'a',myGuess:null,myTotal:4,myRounds:[{question:1,guess:40,answer:44,points:4}]};`,
  );
  const html = v.run("ownSheet()");
  assert.equal((html.match(/<tr /g) || []).length, 7);
  assert.match(html, /aria-current="step"/);
  assert.match(html, /id="my-guess"/);
  assert.match(html, /<tfoot>/);
  assert.match(html, />4<\/td>/);
});
test("player removal and ending live only in management menu", () => {
  const v = ui();
  v.run(
    `room={stage:'question',round:0,card:1,cardCount:2,limit:14,code:'ABCDEFGH',players:[{id:'a',name:'Anna'},{id:'b',name:'Bo'}],meId:'a',hostId:'a'};`,
  );
  assert.doesNotMatch(v.run("playerList()"), /data-remove/);
  assert.doesNotMatch(v.run("scoreHistory()"), /id="finish"/);
  const menu = v.run("management()");
  assert.match(menu, /data-remove/);
  assert.match(menu, /id="finish"/);
  assert.match(menu, /id="card-count"/);
});
test("management preserves configured lobby card count", () => {
  const v = ui();
  v.run(
    `room={stage:'lobby',mode:'cards:3',round:0,card:1,cardCount:null,players:[],meId:'a',hostId:'a'};`,
  );
  assert.match(v.run("management()"), /<option value="3" selected>/);
  assert.doesNotMatch(v.run("management()"), /3 Ett kort per spelare/);
});
