(function(root){
  const DEFAULTS={durationSeconds:10,debounceMs:250};
  function settings(config={}){
    const duration=Number(config.durationSeconds),debounce=Number(config.debounceMs);
    return{durationMs:Number.isFinite(duration)&&duration>0?Math.round(duration*1000):10000,
      debounceMs:Number.isFinite(debounce)&&debounce>=0?debounce:250};
  }
  function createRound(startedAt,config={}){
    const s=settings(config);
    return{...s,startedAt,endAt:startedAt+s.durationMs,counts:[0,0],lastAccepted:[null,null],finished:false};
  }
  function press(round,player,now){
    if(!round||round.finished||![0,1].includes(player)||!Number.isFinite(now)||now<round.startedAt||now>=round.endAt)return false;
    const last=round.lastAccepted[player];
    if(last!==null&&now-last<round.debounceMs)return false;
    round.counts[player]++;round.lastAccepted[player]=now;return true;
  }
  function result(round){
    round.finished=true;
    const counts=[...round.counts],total=counts[0]+counts[1];
    return{kind:'bag',winner:counts[0]===counts[1]?null:counts[0]>counts[1]?0:1,counts,total,durationMs:round.durationMs,
      rate:counts.map(n=>n/(round.durationMs/1000)),share:counts.map(n=>total?Math.round(n/total*100):0)};
  }
  function colorFor(player={},seat=0){
    const valid=value=>typeof value==='string'&&/^#(?:[a-f\d]{3}|[a-f\d]{6})$/i.test(value);
    for(const value of [player.nicknameColor,player.nickname_color,player.nameColor,player.name_color,player.color])if(valid(value))return value;
    let avatar=player.avatar;
    if(typeof avatar==='string'&&avatar.trim().startsWith('{')){try{avatar=JSON.parse(avatar)}catch{avatar=null}}
    if(avatar&&typeof avatar==='object')for(const value of [avatar.iconColor,avatar.frameColor,avatar.color])if(valid(value))return value;
    const presets={X1:'#ff9100',X2:'#a855f7',X3:'#16cfff',X4:'#ff403d',X5:'#ffc24b',X6:'#36ef89'};
    return presets[avatar]||(seat===0?'#16aaff':'#ff9100');
  }
  const api={DEFAULTS,settings,createRound,press,result,colorFor};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.TntBagGame=api;
})(typeof window!=='undefined'?window:globalThis);
