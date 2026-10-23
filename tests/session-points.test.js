const assert=require('assert');const fs=require('fs');const path=require('path');
const P=require('../lib/session-points');

// Each bracelet gets its own best round, not the pair's best.
assert.deepStrictEqual(P.bestPoints(['A','B'],[{scores:[9800,9700]},{scores:[9600,9900]}]),[{ic:'A',points:9800},{ic:'B',points:9900}]);
// No valid press in any round -> 0, never the opponent's value.
assert.deepStrictEqual(P.bestPoints(['A','B'],[{scores:[9800,0]}]),[{ic:'A',points:9800},{ic:'B',points:0}]);
// No rounds played -> both 0.
assert.deepStrictEqual(P.bestPoints(['A','B'],[]),[{ic:'A',points:0},{ic:'B',points:0}]);
// A seat without a bracelet is left out; the Gateway falls back to the aggregate for it.
assert.deepStrictEqual(P.bestPoints(['A',null],[{scores:[5,7]}]),[{ic:'A',points:5}]);
// Uids are sent as strings, matching the Gateway's lobby uids.
assert.deepStrictEqual(P.bestPoints([123,'B'],[{scores:[1,2]}]),[{ic:'123',points:1},{ic:'B',points:2}]);

const app=fs.readFileSync(path.join(__dirname,'..','public','app.js'),'utf8');
const control=fs.readFileSync(path.join(__dirname,'..','public','control.html'),'utf8');
assert(control.includes('../lib/session-points.js'),'control page loads session-points');
assert(app.includes('points:SessionPoints.bestPoints(gatewayUids,sessionRounds)'),'session end reports per-player points');
assert(/scores=values\.map\(/.test(app)&&app.includes('return{winner,values,scores,'),'each round keeps a score per player');
console.log('session-points tests passed');
