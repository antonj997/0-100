import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
function ui(){
 const nodes=new Map();const node=selector=>{if(!nodes.has(selector))nodes.set(selector,{innerHTML:'',textContent:'',setAttribute(){},focus(){}});return nodes.get(selector);};
 const context=vm.createContext({endpoint:'https://example.test',celebrate(){},stopCelebration(){},document:{querySelector:node,querySelectorAll:()=>[],documentElement:{},addEventListener(){}},location:{href:'https://antonj997.github.io/0-100/'},localStorage:{getItem:()=>null,setItem(){}},URL,setInterval(){},window:{addEventListener(){}},console});
 vm.runInContext(readFileSync(new URL('../public/online.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,''),context);
 return {context,node,run:code=>vm.runInContext(code,context)};
}
test('existing errors retranslate when switching language in both directions',()=>{
 const view=ui();view.run("notice='ROOM_NOT_FOUND';render()");assert.match(view.node('#app').innerHTML,/Spelet finns inte eller har gått ut/);
 view.node('#en').onclick();assert.match(view.node('#app').innerHTML,/The game does not exist or has expired/);assert.doesNotMatch(view.node('#app').innerHTML,/Spelet finns/);
 view.node('#sv').onclick();assert.match(view.node('#app').innerHTML,/Spelet finns inte eller har gått ut/);
});
test('all online text keys and backend error codes have both translations',()=>{
 const view=ui();assert.equal(view.run('JSON.stringify(Object.keys(words.sv).sort())'),view.run('JSON.stringify(Object.keys(words.en).sort())'));
 assert.equal(view.run('Object.values(words).every(dict=>Object.values(dict).every(value=>typeof value===\'string\'&&value.length>0))'),true);
 const sources=['../server/api.js','../server/game.js'].map(p=>readFileSync(new URL(p,import.meta.url),'utf8')).join('\n');
 const codes=[...new Set([...sources.matchAll(/'([A-Z]+(?:_[A-Z]+)+|BUSY)'/g)].map(m=>m[1]))];
 for(const code of codes)assert.equal(view.run(`errors[${JSON.stringify(code)}]?.every(text=>typeof text==='string'&&text.length>0)`),true,code);
});
test('English card counts use singular and plural and every error changes language',()=>{
 const view=ui();view.node('#en').onclick();assert.match(view.node('#app').innerHTML,/1 card · 7 questions/);assert.match(view.node('#app').innerHTML,/10 cards · 70 questions/);
 for(const code of JSON.parse(view.run('JSON.stringify(Object.keys(errors))'))){
  view.run(`notice=${JSON.stringify(code)};render()`);assert.ok(view.node('#app').innerHTML.includes(view.run(`esc(errors[${JSON.stringify(code)}][1])`)));
  view.node('#sv').onclick();assert.ok(view.node('#app').innerHTML.includes(view.run(`esc(errors[${JSON.stringify(code)}][0])`)));view.node('#en').onclick();
 }
});
