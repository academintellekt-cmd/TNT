const {test}=require('node:test');
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const {StrivexSession}=require('../lib/strivex-session');

test('round report is retried with stable identity and only matching receipts are accepted',()=>{
  const session=new StrivexSession({});
  const sent=[],rewards=[];
  session.send=message=>{sent.push(message);return true};
  session.sessionId='paid';session.users=[{uid:'A'},{uid:'B'}];
  session.on('round-reward',message=>rewards.push(message));
  try{
    const round={round_id:randomUUID(),difficulty:'normal',duration_ms:10000,players:[{uid:'A',offset_ms:1046},{uid:'B',offset_ms:190}]};
    assert(session.reportRound(round));
    session.retryRounds();
    assert.deepEqual(sent[0],sent[1]);
    const reply={type:'round_reward',session_id:'paid',round_id:round.round_id,uid:'B',xp:26,new_record:true,previous_best_ms:420};
    for(const bad of [{...reply,round_id:randomUUID()},{...reply,session_id:'old'},{...reply,uid:'stranger'},{...reply,xp:101}])session.receiveReward(bad);
    assert.equal(rewards.length,0);
    session.receiveReward(reply);session.receiveReward(reply);
    assert.equal(rewards.length,1);
    assert.equal(session.pendingRounds.size,1);
    session.receiveReward({...reply,uid:'A',xp:1,new_record:false});
    assert.equal(session.pendingRounds.size,0);
    assert.equal(session.rewardRetry,null);
  }finally{session.stop()}
});

test('unidentified, substituted and impossible round results are not sent',()=>{
  const session=new StrivexSession({});
  session.send=()=>{throw new Error('should not send')};
  const round={round_id:randomUUID(),difficulty:'normal',duration_ms:10000,players:[{uid:'A',offset_ms:100},{uid:'B',offset_ms:null}]};
  assert.equal(session.reportRound(round),false);
  session.sessionId='paid';session.users=[{uid:'A'},{uid:'B'}];
  for(const bad of [{...round,duration_ms:0},{...round,players:[round.players[0],round.players[0]]},{...round,players:[round.players[0],{uid:'B',offset_ms:-1}]}])assert.equal(session.reportRound(bad),false);
  session.stop();
});
