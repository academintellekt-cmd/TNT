// Per-player result for the Gateway's session_result: meta.points=[{ic,points}], where ic is the
// bracelet uid from unlock. Without it the Gateway gives both players the session's best value.
// Loaded as a plain <script> (global SessionPoints) and required by tests.
(function(root){
  function bestPoints(uids,rounds){return uids.map((ic,p)=>ic?{ic:String(ic),points:rounds.reduce((best,r)=>Math.max(best,Number(r?.scores?.[p])||0),0)}:null).filter(Boolean)}
  // XP v2: each player's best score per mode/level over the session's rounds, for
  // session_result.meta.records ([{ic, game_id, mode_id, level_id, difficulty, score}]).
  // keyOf(round) -> {mode_id, level_id, difficulty} or null to skip the round.
  function bestRecords(uids,rounds,gameId,keyOf){const out=new Map();for(const r of rounds){const k=keyOf(r);if(!k)continue;uids.forEach((ic,p)=>{if(!ic)return;const score=Number(r?.scores?.[p]);if(!Number.isFinite(score)||score<0)return;const id=`${ic}|${k.mode_id}|${k.level_id}`,prev=out.get(id);if(!prev||score>prev.score)out.set(id,{ic:String(ic),game_id:gameId,mode_id:String(k.mode_id),level_id:String(k.level_id),difficulty:k.difficulty??null,score})})}return[...out.values()]}
  const api={bestPoints,bestRecords};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SessionPoints=api;
})(typeof window!=='undefined'?window:globalThis);
