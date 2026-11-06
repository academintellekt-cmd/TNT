const clamp01=v=>v<0?0:v>1?1:v;
// Buffers are prepared once, before the round: no file loading at transitions.
function roundSoundBuffers(context) {
  const make = (seconds, sample) => {
    const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * seconds), context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = sample(i / context.sampleRate);
    return buffer;
  };
  const countdown = make(1, t => t < .18
    ? Math.sin(2 * Math.PI * 880 * t) * Math.min(1, t / .004) * Math.pow(1 - t / .18, 2) * .7 : 0);
  const timer = make(.5, t => t < .055
    ? (Math.sin(2 * Math.PI * 1800 * t) + Math.sin(2 * Math.PI * 2700 * t) * .4)
      * Math.min(1, t / .001) * Math.exp(-t * 100) * .55 : 0);
  let rumble = 0;
  const explosion = make(1.6, t => {
    rumble = (rumble + (Math.random() * 2 - 1) * .12) / 1.12;
    const noise = rumble * 3 + (Math.random() * 2 - 1) * .35;
    return Math.max(-1, Math.min(1, (noise + Math.sin(2 * Math.PI * 48 * t) * .35)
      * Math.min(1, t / .003) * Math.exp(-t * 4))) * .85;
  });
  let lastNoise=0,crackle=0;
  const fuse=make(2,t=>{
    const noise=Math.random()*2-1,high=noise-lastNoise*.7;lastNoise=noise;
    crackle*=.97;if(Math.random()<.0015)crackle=(Math.random()*2-1)*.4;
    const edge=Math.min(1,t/.004,(2-t)/.004);
    return(high*.22+crackle)*edge;
  });
  return { countdown, timer, explosion, fuse };
}
class LightningAudio {
  constructor(config={}) {
    this.config=config;this.enabled=config.enabled!==false;this.music={};this.effects={};this.playlists={};this.current=null;this.fadeToken=0;this.duckToken=0;
    if(!this.enabled)return;
    const Context = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (Context) {
      this.context = new Context({ latencyHint: 'interactive' });
      this.roundBuffers = roundSoundBuffers(this.context);
      this.roundGain = this.context.createGain();
      this.roundGain.gain.value = config.effectsVolume ?? .85;
      this.roundGain.connect(this.context.destination);
    }
    this.setupPlaylist('menu',config.menuPlaylist,config.menu,true);
    this.setupPlaylist('game',config.gamePlaylist,config.game,true);
    if(config.end){const end=new Audio(config.end);end.loop=false;end.volume=0;end.preload='auto';this.music.end=end}
    for(const key of ['button','bonus','countdown','startCountdown'])if(config[key]){const audio=new Audio(config[key]);audio.volume=config.effectsVolume??.85;audio.preload='auto';this.effects[key]=audio}
  }
  setupPlaylist(name,files,fallback,loopFallback=true){
    const playlist=Array.isArray(files)?files.filter(Boolean):[],source=playlist[0]||fallback,previous=this.music[name];
    if(previous){previous.pause();try{previous.currentTime=0}catch{}}
    if(!source){delete this.music[name];this.playlists[name]={files:[],index:0};return}
    const audio=new Audio(source);audio.loop=!playlist.length&&loopFallback;audio.volume=0;audio.preload='auto';
    this.playlists[name]={files:playlist,index:0};
    audio.addEventListener('ended',()=>this.nextTrack(name));
    audio.addEventListener('error',()=>{if(this.playlists[name]?.files.length>1)setTimeout(()=>this.nextTrack(name),250)});
    this.music[name]=audio;
  }
  nextTrack(name){
    const audio=this.music[name],state=this.playlists[name];if(!audio||!state?.files.length)return;
    state.index=(state.index+1)%state.files.length;audio.src=state.files[state.index];audio.load();
    if(this.current===name){audio.volume=this.musicTarget(name);audio.play().catch(()=>{})}
  }
  selectGame(mode){
    const specific=this.config.gamePlaylists?.[mode],playlist=Array.isArray(specific)&&specific.length?specific:(this.config.gamePlaylist||[]);
    this.setupPlaylist('game',playlist,this.config.game,true);
  }
  playGame(mode){this.selectGame(mode);this.crossfade('game')}
  musicTarget(name){return name==='game'&&this.gameDucked?(this.config.sequenceMusicVolume??.08):(this.config.musicVolume??.35)}
  setGameDuck(active,duration=450){
    this.gameDucked=!!active;const game=this.music.game;if(!game||this.current!=='game')return;
    const token=++this.duckToken,from=game.volume,target=this.musicTarget('game'),started=performance.now();
    const step=now=>{if(token!==this.duckToken||this.current!=='game')return;const p=Math.min(1,(now-started)/Math.max(1,duration));game.volume=clamp01(from+(target-from)*p);if(p<1)requestAnimationFrame(step)};requestAnimationFrame(step);
  }
  stopSounds(){
    ++this.fadeToken; ++this.duckToken;
    if(this.roundSource){this.roundSource.stop();this.roundSource.disconnect();this.roundSource=null}
    this.roundName=null;
    for(const audio of [...Object.values(this.music),...Object.values(this.effects)]){
      audio.pause();try{audio.currentTime=0}catch{}
    }
    this.current=null;
  }
  sequence(name){
    if(!this.enabled||!this.roundBuffers?.[name])return;
    if(this.roundName===name)return; // Zero and finish may arrive in the same round.
    this.stopSounds();
    this.context.resume().catch(()=>{});
    const source=this.context.createBufferSource();
    source.buffer=this.roundBuffers[name];source.loop=name!=='explosion';
    source.connect(this.roundGain);this.roundSource=source;this.roundName=name;
    source.start();
  }
  effect(name){const audio=this.effects[name];if(!audio)return;this.stopSounds();audio.volume=this.config.effectsVolume??.85;audio.play().catch(()=>{})}
  color(color){const file=this.config.colors?.[color];if(!file)return;const audio=new Audio(file);audio.volume=this.config.effectsVolume??.85;audio.play().catch(()=>{})}
  crossfade(name){
    if(!this.enabled)return;
    if(this.current===name&&!this.roundSource)return;
    this.stopSounds();
    const to=this.music[name];
    this.current=name;
    if(to){to.volume=this.musicTarget(name);to.play().catch(()=>{})}
  }
}
if(typeof module!=='undefined')module.exports={LightningAudio,roundSoundBuffers};
