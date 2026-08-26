const test=require('node:test');const assert=require('node:assert/strict');const{TntEngine}=require('../lib/tnt-engine');
test('starts exactly one clean round',()=>{const e=new TntEngine({durationMs:1000});e.start(100);assert.equal(e.state,'running');assert.equal(e.targetAt,1100);assert.deepEqual(e.presses,[null,null])});
test('ignores input before arm and duplicate input',()=>{const e=new TntEngine({durationMs:1000,armMs:100});e.start(0);assert.equal(e.press(0,50),false);assert.equal(e.press(0,500),true);assert.equal(e.press(0,600),false)});
test('closest valid press wins',()=>{const e=new TntEngine({durationMs:1000,armMs:0});e.start(0);e.press(0,900);e.press(1,980);const r=e.finish();assert.equal(r.winner,1);assert.deepEqual(r.values,[100,20]);assert.equal(r.result,20)});
test('late presses are invalid and no finite result is emitted',()=>{const e=new TntEngine({durationMs:1000,armMs:0});e.start(0);e.press(0,1001);const r=e.finish();assert.equal(r.result,0);assert.deepEqual(r.values,[null,null])});
test('finish is idempotent',()=>{const e=new TntEngine();e.start(0);const a=e.finish(),b=e.finish();assert.strictEqual(a,b)});
