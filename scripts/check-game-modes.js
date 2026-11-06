// Normal renderer flow with a simulated Gateway and gamepad, without test flags.
// TNT_UI_ROOT may point to a packaged app.asar for the same release checks.
const {app,BrowserWindow,ipcMain}=require('electron');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const assert=require('node:assert/strict');
const root=process.env.TNT_UI_ROOT||path.join(__dirname,'..');
delete process.env.TNT_INTERFACE_TEST;delete process.env.TNT_PREVIEW_PHASE;
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'tnt-modes-')));
const cfg=JSON.parse(fs.readFileSync(path.join(root,'config.json'),'utf8'));
cfg.audio.enabled=false;cfg.serial.enabled=false;cfg.strivex.enabled=true;
cfg.strivex.developmentMode=false;cfg.strivex.transport='websocket';
cfg.countdownSeconds=1;cfg.gameOverSeconds=.12;cfg.resultSeconds=.4;cfg.leaderboardSeconds=.4;
const users=[{uid:'A',name:'Алекс',avatar:'X1'},{uid:'B',name:'Мира',avatar:'X2'}];
const states=[],rounds=[],finals=[],starts=[];
let control,player;
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const timeout=setTimeout(()=>{console.error('Game modes UI timed out');app.exit(1)},32000);
app.whenReady().then(async()=>{try{
  ipcMain.handle('get-config',()=>cfg);
  ipcMain.handle('strivex-snapshot',()=>({connected:true,state:'idle'}));
  ipcMain.on('state-update',(_e,s)=>{states.push(s);player.webContents.send('state-update',s)});
  ipcMain.on('strivex-round',(_e,r)=>rounds.push(r));
  ipcMain.on('strivex-final',(_e,r)=>finals.push(r));
  ipcMain.on('strivex-lobby',(_e,m)=>{if(m.type==='start'){
    starts.push(m);control.webContents.send('strivex-event',{type:'unlock',users,paid_seconds:120});
  }});
  function windowFor(page,width,height){const w=new BrowserWindow({show:false,width,height,webPreferences:{preload:path.join(root,'preload.js'),contextIsolation:true,nodeIntegration:false,backgroundThrottling:false,offscreen:true}});w.loadFile(path.join(root,'public',page));return w}
  player=windowFor('player.html',1280,800);control=windowFor('control.html',750,1000);
  async function until(fn){for(let i=0;i<1500;i++){if(await fn())return;await pause(15)}throw Error('Game mode condition timed out')}
  const run=code=>control.webContents.executeJavaScript(code);
  const click=selector=>run(`document.querySelector(${JSON.stringify(selector)}).click()`);
  await until(()=>states.length>0);
  assert.equal(await run(`!!document.querySelector('.test-panel,.test-badge,.dev')`),false);
  assert.equal(await run(`document.querySelectorAll('[data-lobby-mode]').length`),2);
  await run(`window.testPad={index:0,buttons:Array.from({length:4},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[window.testPad],configurable:true});true`);
  async function button(index,pressed){await run(`window.testPad.buttons[${index}].pressed=${pressed};window.testPad.buttons[${index}].value=${pressed?1:0}`);await pause(80)}
  await click('[data-lobby-mode=bag]');
  assert.equal(await run(`document.querySelectorAll('[data-lobby-difficulty]').length`),1);
  control.webContents.send('strivex-event',{type:'lobby',players:users,max:2});await pause(60);
  await click('[data-lobby-start]');await until(()=>states.at(-1).phase==='game');
  assert.equal(states.find(s=>s.phase==='game').remainingMs,10000);
  assert.deepEqual(starts[0],{type:'start',mode:'bag',variant:null,difficulty:'standard',durationMinutes:null});
  await button(1,true);await pause(300);assert.equal(states.at(-1).bagRound.counts[0],1,'holding gamepad does not repeat');
  await button(1,false);await button(1,true);await button(1,false);await pause(260);await button(1,true);await button(1,false);
  await button(3,true);await button(3,false);
  assert.deepEqual(states.at(-1).bagRound.counts,[3,1]);
  for(const w of [control,player]){
    assert.equal(await w.webContents.executeJavaScript(`document.querySelectorAll('.bag-count').length`),0);
    assert.deepEqual(await w.webContents.executeJavaScript(`[...document.querySelectorAll('.bag-player')].map(x=>x.style.getPropertyValue('--bag-color'))`),['#ff9100','#a855f7']);
  }
  await until(()=>states.at(-1).phase==='bagStats');await pause(25);
  assert((await player.webContents.executeJavaScript('document.body.innerText')).includes('Темп: 0.30'));
  assert(!states.some(s=>s.phase==='result'),'bag has only one statistics screen');
  await until(()=>states.at(-1).phase==='lobby');
  assert.equal(rounds.length,0,'bag does not submit made-up time XP');
  assert.deepEqual(finals[0].meta.points,[{ic:'A',points:3},{ic:'B',points:1}]);
  assert.deepEqual(finals[0].meta.bag.counts,[3,1]);
  assert.equal(states.at(-1).lobbyPlayers.length,0);
  await click('[data-lobby-mode=tnt]');await click('[data-lobby-difficulty=fuse]');
  await click('[data-lobby-rules=tnt]');assert.equal(await run(`document.querySelectorAll('.lobby-modal ol li').length`),2);await click('button[data-lobby-dismiss]');
  control.webContents.send('strivex-event',{type:'lobby',players:users,max:2});await pause(60);
  const gameStart=states.length;await click('[data-lobby-start]');await until(()=>states.at(-1).phase==='game');
  assert.equal(states.slice(gameStart).find(s=>s.phase==='game').remainingMs,9000);
  for(const w of [control,player])assert(!/\d/.test(await w.webContents.executeJavaScript(`document.querySelector('.fuse-game').innerText`)));
  await until(()=>states.at(-1).phase==='game'&&states.at(-1).remainingMs<600);
  await button(1,true);await button(3,true);await until(()=>states.at(-1).phase==='result');
  assert.equal(rounds.length,1);assert.equal(rounds[0].difficulty,'fuse');assert.equal(rounds[0].duration_ms,9000);
  assert(rounds[0].players.every(p=>p.offset_ms>=0&&p.offset_ms<650));
  control.webContents.send('strivex-event',{type:'round-reward',round_id:rounds[0].round_id,uid:'A',xp:40,new_record:true,previous_best_ms:800});await pause(25);
  assert.equal(states.at(-1).result.rewards[0].xp,40);
  await until(()=>states.at(-1).phase==='lobby');
  assert.equal(finals.length,2);assert.equal(states.at(-1).lobbyPlayers.length,0);
  console.log('PASS: normal launch; real gamepad edges; bag 10s, hidden counts, one statistics screen, per-player session scores; fuse 9s, no digits, round rewards; fresh scans required');
  clearTimeout(timeout);app.quit();
}catch(e){console.error(e);app.exit(1)}});
