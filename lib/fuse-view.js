// Preview-only vector artwork. Arc-length lookup keeps burning speed constant
// along the curved rope; both windows derive the same pose from remainingMs.
(function(root){
  const DURATION_MS=9000;
  const segments=[
    [[860,115],[830,15],[670,25],[680,120]],
    [[680,120],[690,200],[830,210],[725,265]],
    [[725,265],[620,320],[515,165],[450,265]],
  ];
  function point(s,t){const u=1-t;return{
    x:u*u*u*s[0][0]+3*u*u*t*s[1][0]+3*u*t*t*s[2][0]+t*t*t*s[3][0],
    y:u*u*u*s[0][1]+3*u*u*t*s[1][1]+3*u*t*t*s[2][1]+t*t*t*s[3][1],
  }}
  const samples=[{...point(segments[0],0),distance:0}];
  for(const segment of segments)for(let i=1;i<=120;i++){
    const p=point(segment,i/120),last=samples[samples.length-1];
    samples.push({...p,distance:last.distance+Math.hypot(p.x-last.x,p.y-last.y)});
  }
  const length=samples[samples.length-1].distance;
  function pose(remainingMs){
    const progress=Math.max(0,Math.min(1,1-remainingMs/DURATION_MS)),distance=progress*length;
    const next=samples.findIndex(p=>p.distance>=distance);
    if(next<=0)return{progress,x:samples[0].x,y:samples[0].y};
    const a=samples[next-1],b=samples[next],t=(distance-a.distance)/(b.distance-a.distance);
    return{progress,x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};
  }
  const rope='M860 115 C830 15 670 25 680 120 C690 200 830 210 725 265 C620 320 515 165 450 265';
  function html(remainingMs,{lit=true,label='Фитиль',ready='Приготовьтесь',instruction='Жми, пока огонёк не добрался до динамита'}={}){
    const p=pose(lit?remainingMs:DURATION_MS),time=(DURATION_MS-remainingMs)/1000;
    const pulse=1+Math.sin(time*29)*.055;
    const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const sparks=Array.from({length:7},(_,i)=>{
      const phase=(time*(1.3+i*.09)+i*.19)%1,angle=i*2.399+time*.3;
      const distance=12+phase*54,x=Math.cos(angle)*distance,y=-12-Math.abs(Math.sin(angle))*distance;
      return`<path d="M${x} ${y} l${Math.cos(angle)*7} -5" opacity="${1-phase}"/>`;
    }).join('');
    return`<section class="screen fuse-game"><div class="brand small">TNT</div>
      <div class="fuse-mode">${esc(lit?label:ready)}</div>
      <svg class="fuse-scene" viewBox="0 0 1000 660" role="img" aria-label="${esc(label)}" data-progress="${p.progress}">
        <defs>
          <linearGradient id="stick-red" x1="0" x2="1"><stop stop-color="#9d1725"/><stop offset=".28" stop-color="#ff5a55"/><stop offset=".64" stop-color="#ef303b"/><stop offset="1" stop-color="#a4162c"/></linearGradient>
          <linearGradient id="band-gold" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffdb8a"/><stop offset=".5" stop-color="#f5ad38"/><stop offset="1" stop-color="#bd6822"/></linearGradient>
          <radialGradient id="ember-glow"><stop stop-color="#ffcc54" stop-opacity=".65"/><stop offset="1" stop-color="#ff5500" stop-opacity="0"/></radialGradient>
        </defs>
        <ellipse cx="465" cy="586" rx="235" ry="25" fill="#000" opacity=".45"/>
        <path d="${rope}" fill="none" stroke="#1b1110" stroke-width="22" stroke-linecap="round"/>
        <path d="${rope}" fill="none" stroke="#cf9f68" stroke-width="13" stroke-linecap="round"/>
        <path d="${rope}" fill="none" stroke="#f4d3a2" stroke-width="3" stroke-dasharray="4 12" opacity=".85"/>
        ${lit?`<path d="${rope}" pathLength="1" fill="none" stroke="#04070d" stroke-width="25" stroke-dasharray="${p.progress} 2"/>
        <path d="${rope}" pathLength="1" fill="none" stroke="#554443" stroke-width="3" stroke-dasharray="${p.progress} 2"/>`:''}
        <g stroke="#32151d" stroke-width="8" stroke-linejoin="round">
          <g transform="rotate(-12 335 425)"><rect x="267" y="288" width="128" height="270" rx="28" fill="url(#stick-red)"/><ellipse cx="331" cy="293" rx="61" ry="21" fill="#ff8170"/></g>
          <g transform="rotate(12 577 425)"><rect x="515" y="288" width="128" height="270" rx="28" fill="url(#stick-red)"/><ellipse cx="579" cy="293" rx="61" ry="21" fill="#ff8170"/></g>
          <rect x="379" y="263" width="142" height="310" rx="30" fill="url(#stick-red)"/>
          <ellipse cx="450" cy="269" rx="67" ry="22" fill="#ff8a77"/>
          <path d="M433 264 v-17 q17-12 34 0 v17" fill="#e1b075"/>
          <path d="M264 390 Q450 425 641 390 L641 445 Q450 477 264 445 Z" fill="url(#band-gold)"/>
        </g>
        <path d="M401 303 V370" stroke="#ffb4a0" stroke-width="10" stroke-linecap="round" opacity=".7"/>
        <g fill="#fff1d8" stroke="#351822" stroke-width="5"><ellipse cx="424" cy="491" rx="14" ry="20"/><ellipse cx="478" cy="491" rx="14" ry="20"/></g>
        <g fill="#351822"><circle cx="429" cy="495" r="6"/><circle cx="482" cy="495" r="6"/></g>
        <path d="M432 530 Q450 542 470 527" fill="none" stroke="#351822" stroke-width="6" stroke-linecap="round"/>
        <text x="450" y="442" text-anchor="middle" fill="#54251e" font-family="Segoe UI,Arial" font-weight="1000" font-size="45" transform="rotate(-3 450 425)">TNT</text>
        ${lit?`<g class="fuse-flame" transform="translate(${p.x} ${p.y})">
          <circle r="65" fill="url(#ember-glow)"/>
          <g transform="scale(${pulse})">
            <path d="M0 12 C-35-5-24-29-9-46 C-9-25 1-27 7-62 C36-33 37-2 0 12" fill="#ff681f"/>
            <path d="M0 8 C-18-4-12-20 2-34 C0-19 22-6 0 8" fill="#ffd659"/>
            <ellipse cy="1" rx="7" ry="9" fill="#fffbd2"/>
          </g>
          <g fill="none" stroke="#ffda79" stroke-width="3" stroke-linecap="round">${sparks}</g>
        </g>`:''}
      </svg><div class="fuse-instruction">${esc(lit?instruction:label)}</div></section>`;
  }
  const api={DURATION_MS,pose,html};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.TntFuse=api;
})(typeof window!=='undefined'?window:globalThis);
