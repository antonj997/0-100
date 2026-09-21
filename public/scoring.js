export function number(value) {
  if ((typeof value !== 'string' && typeof value !== 'number') || String(value).trim() === '') throw new Error('Enter a number from 0 to 100.');
  const n = Number(String(value).replace(',', '.'));
  if (!Number.isFinite(n) || n < 0 || n > 100) throw new Error('Enter a number from 0 to 100.');
  return n;
}
// Add decimal representations without rounding small differences down to zero.
// This also avoids familiar binary artifacts such as 0.3 - 0.1.
function decimalParts(value) {
  const [mantissa, exponent = '0'] = String(value).split('e');
  const fractionLength = (mantissa.split('.')[1] || '').length;
  const scale = fractionLength - Number(exponent);
  const coefficient = BigInt(mantissa.replace('.', ''));
  return scale < 0
    ? { coefficient: coefficient * 10n ** BigInt(-scale), scale: 0 }
    : { coefficient, scale };
}
function decimalSum(values) {
  const parts = values.map(decimalParts);
  const scale = Math.max(0, ...parts.map(p => p.scale));
  const coefficient = parts.reduce((sum, p) => sum + p.coefficient * 10n ** BigInt(scale - p.scale), 0n);
  return Number(`${coefficient}e-${scale}`);
}
export function score(guess, answer) { const g=number(guess), a=number(answer); return g === a ? -10 : Math.abs(decimalSum([g,-a])); }
export function createGame(names, limit=21) {
  if (!Array.isArray(names) || names.some(n => typeof n !== 'string')) throw new Error('Player names must be text.');
  const players=names.map(n=>n.trim());
  if(players.length<2 || players.some(n=>!n || n.length>40)) throw new Error('Add at least two players. Names must be 1–40 characters.');
  if(new Set(players.map(n=>n.toLocaleLowerCase())).size!==players.length) throw new Error('Give each player a different name.');
  if(limit==='players') return {version:1,players,mode:'players',limit:players.length*7,rounds:[]};
  if(![7,21].includes(limit)) throw new Error('Choose 7 or 21 questions.');
  return {version:1,players,limit,rounds:[]};
}
export function saveRound(game, guesses, answer, index=game.rounds.length) {
  if(guesses.length!==game.players.length) throw new Error('Enter an answer for every player.');
  if(!Number.isInteger(index)|| index<0 || index>game.rounds.length || index>=game.limit) throw new Error('This game is complete.');
  const entry={guesses:guesses.map(number),answer:number(answer)};
  const rounds=game.rounds.slice(); rounds[index]=entry; return {...game,rounds};
}
export function totals(game, start=0, end=game.rounds.length) { return game.players.map((_,i)=>decimalSum(game.rounds.slice(start,end).map(r=>score(r.guesses[i],r.answer)))); }
export function ranking(game) {const t=totals(game); return game.players.map((name,i)=>({name,index:i,total:t[i],rank:1+t.filter(v=>v<t[i]).length})).sort((a,b)=>a.total-b.total||a.index-b.index);}
export function restore(value) {
  const raw=JSON.parse(value); if(raw.version!==1 || !Array.isArray(raw.players)||!Array.isArray(raw.rounds)) throw new Error('Invalid saved game');
  let game=createGame(raw.players,raw.mode==='players'?'players':raw.limit); if(game.limit!==raw.limit) throw new Error('Invalid saved game'); for(const r of raw.rounds) game=saveRound(game,r.guesses,r.answer); return game;
}

export function reader(game,index=game.rounds.length) { return game.mode==='players' && Number.isInteger(index) && index>=0 && index<game.limit ? game.players[Math.floor(index/7)] : null; }
