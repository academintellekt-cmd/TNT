// Pure rules for the TNT duel lobby: one mode, normal/hard, fixed round length.
// Loaded as a plain <script> (global LobbyOptions) and required by tests.
(function(root){
  const LOBBY_MODES=['tnt'];
  const DIFFICULTIES={tnt:['normal','hard']};
  function modeOptions(mode){return{difficulties:[...(DIFFICULTIES[mode]||[])],durations:[]}}
  function defaultSelection(mode){const o=modeOptions(mode);return{mode,variant:null,difficulty:o.difficulties[0]??null,durationMinutes:null}}
  function canStart(selection,players,max,session){if(session)return{ok:true,reason:null};if((players||[]).length<max)return{ok:false,reason:'needPlayers'};return{ok:true,reason:null}}
  function selectionLabel(selection,names){return[names.modes[selection.mode],selection.difficulty?names.difficulties[selection.difficulty]:'',names.fixed].filter(Boolean).join(' · ')}
  const api={LOBBY_MODES,modeOptions,defaultSelection,canStart,selectionLabel};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.LobbyOptions=api;
})(typeof window!=='undefined'?window:globalThis);
