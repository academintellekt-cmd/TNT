// One-shot Game Over effect. Negative animation delay preserves its position
// when a Gateway tick or an XP receipt causes the screen to render again.
(function(root){
  function html({label='GAME OVER',elapsedMs=0}={}){
    const safeLabel=String(label).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const elapsed=Number.isFinite(elapsedMs)?Math.max(0,elapsedMs):0;
    const rays=Array.from({length:12},(_,i)=>{
      const angle=i*Math.PI/6,r=180+(i%3)*20;
      const x=500+Math.cos(angle)*r,y=290+Math.sin(angle)*r*.8;
      return`<path d="M${x} ${y} l${Math.cos(angle)*70} ${Math.sin(angle)*55}"/>`;
    }).join('');
    const debris=Array.from({length:18},(_,i)=>{
      const angle=i*2.399,dx=Math.cos(angle)*(260+i%4*45),dy=Math.sin(angle)*200-80;
      return`<g class="blast-debris" style="--dx:${dx}px;--dy:${dy}px;--turn:${i%2?'-':' '}${180+i*31}deg">
        <rect x="492" y="282" width="${i%3?12:20}" height="${i%3?6:28}" rx="3" fill="${i%3?'#ffcf6d':'#ec4543'}"/>
      </g>`;
    }).join('');
    const smoke=Array.from({length:7},(_,i)=>`<circle class="blast-smoke" cx="${350+i*50}" cy="${280+(i%2)*40}" r="${45+i%3*15}" style="--drift:${(i-3)*26}px;--rise:${-100-i%3*25}px"/>`).join('');
    return`<section class="screen explosion-screen" style="--blast-delay:-${elapsed/1000}s" aria-label="${safeLabel}">
      <div class="brand small">TNT</div>
      <svg class="explosion-art" viewBox="0 0 1000 620" role="img" aria-label="Взрыв">
        <defs><radialGradient id="blast-heat"><stop stop-color="#fff3ad" stop-opacity=".75"/><stop offset=".45" stop-color="#ff8629" stop-opacity=".3"/><stop offset="1" stop-color="#ff682c" stop-opacity="0"/></radialGradient>
        <linearGradient id="blast-fire" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#ffe79b"/><stop offset=".45" stop-color="#ffad43"/><stop offset="1" stop-color="#f25232"/></linearGradient></defs>
        <ellipse class="blast-glow" cx="500" cy="290" rx="440" ry="285" fill="url(#blast-heat)"/>
        <ellipse class="blast-ring" cx="500" cy="290" rx="180" ry="140" fill="none" stroke="#ffc96d" stroke-width="10"/>
        <g class="blast-rays" fill="none" stroke="#ffcb72" stroke-width="11" stroke-linecap="round">${rays}</g>
        <g fill="#8a7473">${smoke}</g>
        ${debris}
        <g class="blast-cloud">
          <path d="M490 105 536 158 596 100 605 169 690 140 663 211 749 237 686 282 757 337 675 350 697 423 612 404 579 478 521 428 469 486 434 420 352 453 351 378 269 379 304 308 236 267 317 226 295 152 381 175 405 105 452 161Z" fill="#f66b2c" stroke="#633034" stroke-width="12" stroke-linejoin="round"/>
          <path d="M483 157 521 209 570 155 577 225 643 200 614 263 678 292 616 326 646 381 576 365 552 423 506 378 464 424 442 360 374 384 389 321 326 293 391 261 365 211 434 231 442 168 471 220Z" fill="url(#blast-fire)" stroke="#ffe59c" stroke-width="5" stroke-linejoin="round"/>
          <path d="m498 229 25 38 43-14-18 45 35 27-48 6-16 42-24-38-44 8 15-43-28-31 44-3Z" fill="#fff3bc"/>
        </g>
      </svg>
      <div class="game-over explosion-title">${safeLabel}</div>
    </section>`;
  }
  const api={html};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.TntExplosion=api;
})(typeof window!=='undefined'?window:globalThis);
