import {number,score,totals} from '../public/scoring.js';
const fail=code=>{throw new Error(code);};
function name(value){if(typeof value!=='string'||!value.trim()||value.trim().length>40)fail('INVALID_NAME');return value.trim();}
function guess(value){try{return number(value);}catch{fail('INVALID_NUMBER');}}
function member(state,hash){const p=state.players.find(p=>p.tokenHash===hash);if(!p)fail('SESSION_INVALID');return p;}
function readerId(state,round=state.round){return state.players[Math.floor(round/7)%state.players.length].id;}
export function createRoom(playerName,hash,mode){
 if(!['7','21','players'].includes(mode)&&!(typeof mode==='string'&&/^cards:(?:[1-9]|10)$/.test(mode)))fail('INVALID_MODE');
 if(!/^[a-f0-9]{64}$/.test(hash))fail('SESSION_INVALID');
 const p={id:hash.slice(0,24),name:name(playerName),tokenHash:hash};
 return {version:1,players:[p],hostId:p.id,mode,limit:null,stage:'lobby',round:0,guesses:{},rounds:[]};
}
export function joinRoom(state,playerName,hash){
 if(state.players.some(p=>p.tokenHash===hash))return state;
 if(state.stage!=='lobby')fail('GAME_STARTED');
 if(!/^[a-f0-9]{64}$/.test(hash))fail('SESSION_INVALID');
 const n=name(playerName);
 if(state.players.some(p=>p.name.toLocaleLowerCase()===n.toLocaleLowerCase()))fail('NAME_TAKEN');
 if(state.players.length>=12)fail('ROOM_FULL');
 return {...state,players:[...state.players,{id:hash.slice(0,24),name:n,tokenHash:hash}]};
}
export function transition(state,hash,action,payload){
 const me=member(state,hash);const s=structuredClone(state);
 if(action==='start'||action==='remove'){
  if(me.id!==s.hostId)fail('HOST_ONLY');if(s.stage!=='lobby')fail('GAME_STARTED');
  if(action==='remove'){if(payload.playerId===s.hostId)fail('HOST_ONLY');s.players=s.players.filter(p=>p.id!==payload.playerId);return s;}
  if(s.players.length<2)fail('NEED_PLAYERS');
  s.limit=s.mode==='players'?Math.min(s.players.length,10)*7:s.mode.startsWith('cards:')?Number(s.mode.slice(6))*7:Number(s.mode);s.stage='question';return s;
 }
 if(!Number.isInteger(payload.round)||payload.round!==s.round)fail('STALE_QUESTION');
 if(action==='guess'){
  if(s.stage!=='question')fail('QUESTION_CLOSED');const value=guess(payload.value);
  if(Object.hasOwn(s.guesses,me.id)){if(s.guesses[me.id]===value)return state;fail('ANSWER_LOCKED');}
  s.guesses[me.id]=value;return s;
 }
 if(action==='reveal'){
  if(me.id!==readerId(s))fail('READER_ONLY');const value=guess(payload.value);
  if(s.stage!=='question'){
   if(['results','finished'].includes(s.stage)&&s.rounds[s.round]?.answer===value)return state;
   fail('QUESTION_CLOSED');
  }
  if(s.players.some(p=>!Object.hasOwn(s.guesses,p.id)))fail('WAIT_FOR_PLAYERS');
  s.rounds.push({guesses:s.players.map(p=>s.guesses[p.id]),answer:value});
  s.stage=s.rounds.length===s.limit?'finished':'results';return s;
 }
 if(action==='next'){
  if(s.stage==='finished')fail('GAME_FINISHED');if(me.id!==readerId(s))fail('READER_ONLY');
  if(s.stage!=='results')fail('WAIT_FOR_RESULT');s.round++;s.stage='question';s.guesses={};return s;
 }
 fail('INVALID_ACTION');
}
export function snapshot(state,hash){
 const me=member(state,hash),names=state.players.map(p=>p.name),total=totals({players:names,rounds:state.rounds});
 const answered=state.players.filter(p=>Object.hasOwn(state.guesses,p.id)).length;
 return {version:1,stage:state.stage,mode:state.mode,limit:state.limit,round:state.round,
  meId:me.id,hostId:state.hostId,readerId:state.stage==='lobby'?null:readerId(state),
  players:state.players.map(p=>({id:p.id,name:p.name,answered:Object.hasOwn(state.guesses,p.id)})),
  myGuess:Object.hasOwn(state.guesses,me.id)?state.guesses[me.id]:null,
  answered,allAnswered:answered===state.players.length,
  rounds:state.rounds.map(r=>({...r,points:r.guesses.map(g=>score(g,r.answer))})),totals:total,
  winnerIds:state.stage==='finished'?state.players.filter((_,i)=>total[i]===Math.min(...total)).map(p=>p.id):[]};
}
