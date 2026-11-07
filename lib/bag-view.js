(function(root){
  const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function mix(hex,target,amount){
    let value=hex.slice(1);if(value.length===3)value=[...value].map(c=>c+c).join('');
    return'#'+[0,2,4].map(i=>Math.round(parseInt(value.slice(i,i+2),16)*(1-amount)+target*amount).toString(16).padStart(2,'0')).join('');
  }
  function bag(player,seat,count,{burst=false,drop=0}={}){
    const color=root.TntBagGame.colorFor(player,seat),light=mix(color,255,.35),dark=mix(color,0,.5),id='bag-cloth-'+seat;
    const stick=(x,y,rotate=0)=>`<g transform="translate(${x} ${y}) rotate(${rotate})"><rect x="-15" width="30" height="108" rx="8" fill="#f34945" stroke="#5b2029" stroke-width="5"/><ellipse cy="5" rx="13" ry="5" fill="#ffb09a"/><path d="M-8 22 v60" stroke="#ff9582" stroke-width="4" stroke-linecap="round"/></g>`;
    return`<svg class="bag-art" viewBox="0 0 420 450" role="img" aria-label="${esc(player.name)}">
      <defs><linearGradient id="${id}" x1="0" x2="1"><stop stop-color="${dark}"/><stop offset=".38" stop-color="${light}"/><stop offset="1" stop-color="${color}"/></linearGradient></defs>
      <ellipse cx="210" cy="415" rx="150" ry="17" fill="#000" opacity=".4"/>
      ${burst?`<g class="bag-explosion"><path d="M210 30 235 110 300 63 288 145 382 135 325 200 404 245 320 272 355 357 274 335 240 430 198 355 123 407 133 322 44 335 91 263 16 213 99 188 63 107 148 131 151 45 195 117Z" fill="#ff7026" stroke="#622520" stroke-width="8"/><path d="m210 99 29 68 65-30-21 73 67 30-78 24 12 69-70-31-50 56-11-75-74-6 48-60-37-55 78 1Z" fill="#ffe58c"/><text x="210" y="250" text-anchor="middle" fill="#6d251c" font-family="Segoe UI,Arial" font-weight="1000" font-size="52">БУМ!</text></g>`:`
      ${stick(155,72,-18)}${stick(207,47,0)}${stick(263,75,19)}
      ${Array.from({length:Math.min(5,Math.floor(count/4))},(_,i)=>stick(119+i*42,115-(i%2)*16,(i-2)*7)).join('')}
      <path d="M142 167 Q112 146 125 119 L163 144 192 125 219 143 257 125 290 142 274 173 Q348 235 357 323 Q370 408 281 414 H138 Q51 406 66 320 Q79 234 142 167Z" fill="url(#${id})" stroke="#19232d" stroke-width="8" stroke-linejoin="round"/>
      <path d="M137 174 Q210 196 280 175" fill="none" stroke="#f0c785" stroke-width="14" stroke-linecap="round"/>
      <path d="M140 179 Q204 194 279 181" fill="none" stroke="#866240" stroke-width="3"/>
      <path d="M188 186 q-12 24-35 29 M222 187 q18 30 36 28 M117 263 q-28 49-15 91 M302 267 q25 52 10 95" fill="none" stroke="${dark}" stroke-width="7" stroke-linecap="round" opacity=".55"/>
      <ellipse cx="210" cy="297" rx="86" ry="62" fill="#fff3d5" stroke="${dark}" stroke-width="5"/>
      <text x="210" y="315" text-anchor="middle" fill="${dark}" font-family="Segoe UI,Arial" font-weight="1000" font-size="51">TNT</text>
      <path d="M147 376 q64 20 124 0" fill="none" stroke="${light}" stroke-width="6" opacity=".55"/>
      ${drop>0?`<g transform="translate(0 ${-90*drop})" opacity="${drop}">${stick(208,46,-12)}</g>`:''}`}
    </svg>`;
  }
  function scene({players,counts,remainingMs,phase='game',countdown=3,winner=null,elapsedSincePress=[1000,1000]}){
    return`<section class="screen bag-game"><div class="brand small">TNT</div><h1 class="bag-title">Мешок тротила</h1>
      <div class="bag-clock">${phase==='countdown'?countdown:phase==='game'?(Math.max(0,remainingMs)/1000).toFixed(2):winner===null?'Ничья!':'Больше зарядов — больше взрыв!'}</div>
      <div class="bag-arena">${players.map((p,i)=>`<article class="bag-player" style="--bag-color:${root.TntBagGame.colorFor(p,i)}"><div class="bag-name">${esc(p.name)}</div>
        ${bag(p,i,counts[i],{burst:phase==='gameover'&&winner===i,drop:phase==='game'?Math.max(0,1-elapsedSincePress[i]/280):0})}
        </article>`).join('')}</div>
      <div class="bag-instruction">${phase==='gameover'?winner===null?'В этот раз мешки одинаковые':`${esc(players[winner].name)} собрал самый большой мешок!`:'Каждое нажатие добавляет заряд в твой мешок'}</div></section>`;
  }
  function resultView(players,result){
    return`<section class="screen bag-results"><div class="brand small">TNT</div><h1>Статистика раунда</h1>
      <div class="bag-total">Всего зарядов: ${result.total}</div>
      <div class="bag-result-grid">${players.map((p,i)=>`<article class="bag-result-card" style="--bag-color:${root.TntBagGame.colorFor(p,i)}">
        <h2>${esc(p.name)}</h2><div class="bag-final-count">${result.counts[i]}<small>зарядов</small></div>
        <p>Темп: ${result.rate[i].toFixed(2)} заряда/сек</p><p>Доля: ${result.share[i]}%</p></article>`).join('')}</div></section>`;
  }
  const api={bag,scene,resultView};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.TntBagView=api;
})(typeof window!=='undefined'?window:globalThis);
