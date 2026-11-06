// Presentation only. Rewards must eventually come from StriveX; no local XP accrual.
(function(root){
  const labels={
    ru:{newRecord:'Новый рекорд!',previous:'Предыдущий рекорд',pending:'XP рассчитывает StriveX',first:'Первый результат',miss:'Нет результата'},
    en:{newRecord:'New personal best!',previous:'Previous best',pending:'XP calculated by StriveX',first:'First result',miss:'No result'},
    de:{newRecord:'Neuer Rekord!',previous:'Bisheriger Rekord',pending:'XP berechnet StriveX',first:'Erstes Ergebnis',miss:'Kein Ergebnis'},
    fr:{newRecord:'Nouveau record !',previous:'Record précédent',pending:'XP calculés par StriveX',first:'Premier résultat',miss:'Aucun résultat'},
    zh:{newRecord:'新纪录！',previous:'之前的纪录',pending:'XP 由 StriveX 计算',first:'首次成绩',miss:'无成绩'},
    ja:{newRecord:'自己ベスト更新！',previous:'前のベスト',pending:'XP は StriveX が計算',first:'初回の記録',miss:'記録なし'},
  };
  const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const validTime=x=>Number.isFinite(x)&&x>=0;
  const seconds=(ms,lang)=>(ms/1000).toFixed(3)+(lang==='ru'?'с':'s');
  function cards({names=[],values=[],rewards=[],language='ru',allowPreview=false}={}){
    const l=labels[language]||labels.ru;
    return `<div class="result-players">${[0,1].map(p=>{
      const time=values[p],reward=rewards[p];
      const valid=validTime(time);
      const known=!!reward&&(reward.confirmed===true||(allowPreview&&reward.preview===true))
        &&Number.isInteger(reward.xp)&&reward.xp>=0&&reward.xp<=100;
      const record=known&&valid&&reward.newRecord===true&&validTime(reward.previousBestMs)&&time<reward.previousBestMs;
      return `<article class="result-player ${p?'orange':'blue'}">
        <div class="result-name">${esc(names[p])}</div>
        <div class="result-time">${valid?seconds(time,language):esc(l.miss)}</div>
        <div class="result-xp ${known?'':'unconfirmed'}">${known?`+${reward.xp} <span>XP</span>`:'— XP'}</div>
        <div class="result-record">${record?`<strong>${esc(l.newRecord)}</strong><small>${esc(l.previous)}: ${seconds(reward.previousBestMs,language)}</small>`
          :known&&valid&&reward.previousBestMs===null?`<small>${esc(l.first)}</small>`
          :!known?`<small>${esc(l.pending)}</small>`:''}</div>
      </article>`;
    }).join('')}</div>`;
  }
  const api={cards};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.TntResultView=api;
})(typeof window!=='undefined'?window:globalThis);
