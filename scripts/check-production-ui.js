// Exercise the normal renderer flow, not the interface-test panel. Only the
// Gateway transport is simulated; no COM/NFC devices or real XP are used.
const {app,BrowserWindow,ipcMain}=require('electron');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const root=process.env.TNT_UI_ROOT||path.join(__dirname,'..');
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'tnt-production-ui-')));
delete process.env.TNT_INTERFACE_TEST;
delete process.env.TNT_PREVIEW_PHASE;
const cfg=JSON.parse(fs.readFileSync(path.join(root,'config.json'),'utf8'));
cfg.audio.enabled=false;cfg.serial.enabled=false;cfg.strivex.developmentMode=false;
cfg.strivex.enabled=true;cfg.strivex.transport='websocket';
cfg.gameOverSeconds=.05;cfg.resultSeconds=.05;cfg.leaderboardSeconds=.3;
const users=[{uid:'A',name:'BLUE'},{uid:'B',name:'ORANGE'}];
const states=[],rounds=[],starts=[],finals=[];
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let control,player;
const timeout=setTimeout(()=>{console.error('Production UI test timed out');app.exit(1)},25000);
app.whenReady().then(async()=>{
  ipcMain.handle('get-config',()=>cfg);
  ipcMain.handle('strivex-snapshot',()=>({connected:true,state:'idle'}));
  ipcMain.on('state-update',(_event,state)=>{
    states.push({...state,observedAt:performance.now()});
    if(!player.isDestroyed())player.webContents.send('state-update',state);
  });
  ipcMain.on('strivex-round',(_event,round)=>rounds.push(round));
  ipcMain.on('strivex-final',(_event,result)=>finals.push(result));
  ipcMain.on('strivex-lobby',(_event,message)=>{
    starts.push(message);
    if(message.type==='start')control.webContents.send('strivex-event',{type:'unlock',users,paid_seconds:120});
  });
  function windowFor(page){
    const window=new BrowserWindow({show:false,width:1280,height:800,webPreferences:{preload:path.join(root,'preload.js'),contextIsolation:true,nodeIntegration:false}});
    window.loadFile(path.join(root,'public',page));return window;
  }
  player=windowFor('player.html');control=windowFor('control.html');
  async function until(predicate){
    for(let i=0;i<1200;i++){if(predicate())return;await pause(15)}
    throw new Error('UI condition timed out');
  }
  try{
    await until(()=>states.length>0);
    assert.equal(await control.webContents.executeJavaScript("!!document.querySelector('.lobby-tap')"),true);
    control.webContents.send('strivex-event',{type:'lobby',players:users,max:2});
    await pause(80);
    assert.equal(await control.webContents.executeJavaScript("!!document.querySelector('.lobby-tap')"),false);
    control.webContents.send('strivex-event',{type:'lobby',players:users.slice(0,1),max:2});
    await pause(50);
    assert.equal(await control.webContents.executeJavaScript("!!document.querySelector('.lobby-tap')"),true);
    control.webContents.send('strivex-event',{type:'lobby',players:users,max:2});
    await pause(50);
    await control.webContents.executeJavaScript("document.querySelector('[data-lobby-start]').click()");
    await until(()=>states.at(-1).phase==='countdown');
    assert.equal(starts.length,1);
    assert.equal(starts[0].type,'start');
    assert.equal(await control.webContents.executeJavaScript("!!document.querySelector('[data-lobby-enter]')"),false);
    assert.equal(await control.webContents.executeJavaScript("!!document.querySelector('[data-action=quit]')"),false);
    await until(()=>states.at(-1).phase==='game');
    const first=states.find(s=>s.phase==='game');
    assert.equal(first.remainingMs,10000);
    assert(!states.some(s=>s.phase==='waitStart'),'no extra button-wait step');
    assert.deepEqual([...new Set(states.filter(s=>s.phase==='countdown').map(s=>s.countdown))],[3,2,1]);
    control.webContents.send('strivex-event',{type:'tick',remainingMs:75000});
    await pause(80);
    assert.equal(await control.webContents.executeJavaScript("!!document.querySelector('[data-action=quit]')"),false);
    const displayed=[];
    for(const [window,selector] of [[control,'.session-timer'],[player,'.timer']]){
      const value=await window.webContents.executeJavaScript(`document.querySelector('${selector}').textContent`);
      assert(/^\d{1,2}\.\d{2}$/.test(value),value);
      assert(Number(value)<=10&&Number(value)>9,value);
      assert(!await window.webContents.executeJavaScript("/Входите|Нажмите любую кнопку/.test(document.body.innerText)"));
      displayed.push(Number(value));
    }
    assert(Math.abs(displayed[0]-displayed[1])<.2,'both windows show round time');
    await until(()=>states.some(s=>s.phase==='game'&&s.remainingMs===0));
    const zero=states.find(s=>s.phase==='game'&&s.remainingMs===0);
    assert(zero.observedAt-first.observedAt>=9800&&zero.observedAt-first.observedAt<10800);
    await until(()=>states.at(-1).phase==='leaderboard');
    await pause(25);
    for(const window of [control,player]){
      assert.equal(await window.webContents.executeJavaScript("!!document.querySelector('.table')"),true);
      assert.equal(await window.webContents.executeJavaScript("!!document.querySelector('.language,[data-action=menu]')"),false);
    }
    await until(()=>states.at(-1).phase==='lobby');
    assert.equal(rounds.length,1);
    assert.equal(rounds[0].duration_ms,10000);
    assert(states.some(s=>s.phase==='game'&&s.gatewayRemaining===75000),'paid-session time stays separate during play');
    assert.equal(states.at(-1).gatewayRemaining,0);
    assert.equal(states.at(-1).sessionPlayers.length,0);
    assert.equal(states.at(-1).lobbyPlayers.length,0);
    assert.equal(states.at(-1).result,null);
    assert.equal(finals.length,1,'round closes its game-facing session once');
    assert.equal(finals[0].status,'completed');
    assert.equal(await control.webContents.executeJavaScript("document.querySelector('[data-lobby-start]').disabled"),true);
    await control.webContents.executeJavaScript("document.querySelector('[data-lobby-start]').click()");
    await pause(50);
    assert.equal(starts.length,1,'a new round needs two fresh bracelet scans');
    control.webContents.send('strivex-event',{type:'lobby',players:users,max:2});
    await pause(80);
    await control.webContents.executeJavaScript("document.querySelector('[data-lobby-start]').click()");
    await until(()=>states.at(-1).phase==='countdown');
    assert.equal(starts.length,2,'scanned players can start the next round');
    assert.equal(states.at(-1).countdown,3);
    console.log('PASS: normal round/player reset; requested buttons hidden; wristband prompt follows lobby readiness');
    clearTimeout(timeout);app.quit();
  }catch(error){console.error(error);app.exit(1)}
});
