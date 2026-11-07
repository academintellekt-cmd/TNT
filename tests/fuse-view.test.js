const {test}=require('node:test');
const assert=require('node:assert/strict');
const F=require('../lib/fuse-view');
const O=require('../lib/lobby-options');

test('fuse difficulty is available in normal and preview play',()=>{
  assert.deepEqual(O.modeOptions('tnt').difficulties,['normal','hard','fuse']);
  assert.deepEqual(O.modeOptions('tnt',true).difficulties,['normal','hard','fuse']);
});
test('fuse burns from the free end to the dynamite over nine seconds',()=>{
  assert.equal(F.DURATION_MS,9000);
  assert.deepEqual(F.pose(9000),{progress:0,x:860,y:115});
  const end=F.pose(0);
  assert.equal(end.progress,1);assert(Math.abs(end.x-450)<.001);assert(Math.abs(end.y-265)<.001);
  assert.equal(F.pose(4500).progress,.5);
  assert.equal(F.pose(-100).progress,1);
  assert.equal(F.pose(10000).progress,0);
});
test('artwork has no visible digits, and the ready view has no burning flame',()=>{
  const html=F.html(4500);
  assert(html.includes('class="fuse-flame"'));
  assert(!/\d/.test(html.replace(/<[^>]*>/g,'')));
  assert(!F.html(9000,{lit:false}).includes('class="fuse-flame"'));
  assert(F.html(9000,{label:'<unsafe>'}).includes('&lt;unsafe&gt;'));
});
