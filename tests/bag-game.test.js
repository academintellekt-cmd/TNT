const {test}=require('node:test');
const assert=require('node:assert/strict');
const B=require('../lib/bag-game');
const O=require('../lib/lobby-options');
global.TntBagGame=B;
const V=require('../lib/bag-view');

test('bag mode is available in normal play and has a single configurable level',()=>{
  assert.deepEqual(O.lobbyModes(),['tnt','bag']);
  assert.deepEqual(O.lobbyModes(true),['tnt','bag']);
  assert.deepEqual(O.modeOptions('bag').difficulties,['standard']);
  assert.deepEqual(O.modeOptions('bag',true).difficulties,['standard']);
  assert.equal(O.defaultSelection('bag').difficulty,'standard');
  assert.deepEqual(B.settings(),{durationMs:10000,debounceMs:250});
  assert.deepEqual(B.settings({durationSeconds:15,debounceMs:300}),{durationMs:15000,debounceMs:300});
});
test('250 ms debounce is independent for each player and rejects late input',()=>{
  const round=B.createRound(100);
  assert(B.press(round,0,100));assert(B.press(round,1,100));
  assert(!B.press(round,0,101));assert(!B.press(round,0,349));
  assert(B.press(round,0,350));assert(B.press(round,1,350));
  assert(!B.press(round,0,10100));assert(!B.press(round,-1,400));
  assert.deepEqual(round.counts,[2,2]);
});
test('higher charge count wins, statistics match, and finished rounds reject input',()=>{
  const round=B.createRound(0);
  B.press(round,0,0);B.press(round,0,250);B.press(round,1,0);
  const result=B.result(round);
  assert.equal(result.winner,0);assert.deepEqual(result.counts,[2,1]);
  assert.equal(result.total,3);assert.deepEqual(result.rate,[.2,.1]);
  assert.deepEqual(result.share,[67,33]);assert(!B.press(round,1,500));
  assert.equal(B.result(B.createRound(0)).winner,null);
});
test('bag colors follow nickname/avatars, with safe seat fallbacks',()=>{
  assert.equal(B.colorFor({nicknameColor:'#123456',avatar:'X2'}),'#123456');
  assert.equal(B.colorFor({avatar:{iconColor:'#abc'}}),'#abc');
  assert.equal(B.colorFor({avatar:'{"frameColor":"#abcdef"}'}),'#abcdef');
  assert.equal(B.colorFor({avatar:'X2'}),'#a855f7');
  assert.equal(B.colorFor({color:'red;position:fixed'},1),'#ff9100');
});
test('only the winner bag explodes, the tie leaves both bags intact, and names are escaped',()=>{
  const players=[{name:'<script>',avatar:'X1'},{name:'B',avatar:'X2'}];
  const html=V.scene({players,counts:[3,1],remainingMs:0,phase:'gameover',winner:0});
  assert.equal((html.match(/class="bag-explosion"/g)||[]).length,1);
  assert(html.includes('&lt;script&gt;'));assert(!html.includes('<script>'));
  assert(!V.scene({players,counts:[1,1],remainingMs:0,phase:'gameover',winner:null}).includes('class="bag-explosion"'));
});
