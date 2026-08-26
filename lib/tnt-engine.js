const {EventEmitter}=require('events');
class TntEngine extends EventEmitter{
  constructor(options={}){super();this.options={durationMs:10000,armMs:300,graceMs:500,...options};this.reset()}
  reset(){this.state='idle';this.startedAt=0;this.targetAt=0;this.armedAt=0;this.presses=[null,null];this.final=null}
  start(now=0){this.reset();this.state='running';this.startedAt=now;this.targetAt=now+this.options.durationMs;this.armedAt=now+this.options.armMs;this.emit('start',this.snapshot());return this.snapshot()}
  press(player,now){if(this.state!=='running'||![0,1].includes(player)||now<this.armedAt||this.presses[player])return false;const signedMs=now-this.targetAt;this.presses[player]={at:now,valid:signedMs<=0,offsetMs:signedMs<=0?Math.abs(signedMs):null,signedMs};this.emit('press',{player,...this.presses[player]});return true}
  expire(now){if(this.state!=='running'||now<this.targetAt+this.options.graceMs)return false;return this.finish('timeout')}
  finish(reason='completed'){if(this.final)return this.final;this.state='finished';const valid=this.presses.map(x=>x&&x.valid);let winner=null;if(valid[0]&&!valid[1])winner=0;else if(valid[1]&&!valid[0])winner=1;else if(valid[0]&&valid[1]&&this.presses[0].offsetMs!==this.presses[1].offsetMs)winner=this.presses[0].offsetMs<this.presses[1].offsetMs?0:1;const values=this.presses.map(x=>x?.valid?Math.round(x.offsetMs):null),finite=values.filter(Number.isFinite);this.final={reason,winner,draw:winner===null,values,result:finite.length?Math.min(...finite):0};this.emit('finish',this.final);return this.final}
  snapshot(){return{state:this.state,startedAt:this.startedAt,targetAt:this.targetAt,armedAt:this.armedAt,presses:this.presses.map(x=>x&&({...x})),final:this.final&&({...this.final})}}
}
module.exports={TntEngine};
