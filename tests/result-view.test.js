const {test}=require('node:test');
const assert=require('node:assert/strict');
const {cards}=require('../lib/result-view');

test('result cards show per-player seconds, XP and a verified improvement',()=>{
  const html=cards({names:['BLUE','ORANGE'],values:[1046,190],rewards:[
    {confirmed:true,xp:1,newRecord:false,previousBestMs:500},
    {confirmed:true,xp:26,newRecord:true,previousBestMs:420},
  ]});
  assert(html.includes('1.046с'));
  assert(html.includes('0.190с'));
  assert(html.includes('+26 <span>XP</span>'));
  assert.equal((html.match(/Новый рекорд!/g)||[]).length,1);
  assert(html.includes('Предыдущий рекорд: 0.420с'));
});

test('missing, unconfirmed, out-of-range and preview XP are not displayed as awards',()=>{
  for(const reward of [undefined,{xp:50},{confirmed:true,xp:101},{confirmed:true,xp:-1},{preview:true,xp:26}]){
    const html=cards({values:[100,200],rewards:[reward]});
    assert(html.includes('— XP'));
    assert(!html.includes('+'));
    assert(!html.includes('Новый рекорд!'));
  }
  assert(cards({allowPreview:true,values:[190],rewards:[{preview:true,xp:26}]}).includes('+26'));
});

test('record requires strict improvement; first result and misses are distinct',()=>{
  for(const previousBestMs of [190,100,null]){
    const html=cards({values:[190],rewards:[{confirmed:true,xp:10,newRecord:true,previousBestMs}]});
    assert(!html.includes('Новый рекорд!'));
    if(previousBestMs===null)assert(html.includes('Первый результат'));
  }
  const miss=cards({values:[null],rewards:[{confirmed:true,xp:0,newRecord:true,previousBestMs:500}]});
  assert(miss.includes('Нет результата'));
  assert(miss.includes('+0'));
  assert(!miss.includes('Новый рекорд!'));
});

test('player names are escaped and all supported languages have result labels',()=>{
  for(const language of ['ru','en','de','fr','zh','ja']){
    const html=cards({names:['<img onerror="bad()">'],values:[1046],language});
    assert(!html.includes('<img'));
    assert(html.includes('&lt;img'));
    assert(html.includes(language==='ru'?'1.046с':'1.046s'));
  }
});
