const { test } = require('node:test');
const assert = require('node:assert/strict');
const { LightningAudio, roundSoundBuffers } = require('../public/audio-manager');

class TestContext {
  constructor(){this.sampleRate=8000;this.destination={};this.sources=[]}
  createBuffer(_channels,length,rate){const samples=new Float32Array(length);return{duration:length/rate,getChannelData:()=>samples}}
  createGain(){return{gain:{value:0},connect(){}}}
  resume(){return Promise.resolve()}
  createBufferSource(){
    const source={active:false,connect(){},disconnect(){},start(){this.active=true},stop(){this.active=false}};
    this.sources.push(source);return source;
  }
}

test('round sounds contain finite, non-silent samples and exact loop lengths',()=>{
  const buffers=roundSoundBuffers(new TestContext());
  assert.equal(buffers.countdown.duration,1);
  assert.equal(buffers.timer.duration,.5);
  assert.equal(buffers.fuse.duration,2);
  for(const buffer of Object.values(buffers)){
    const samples=buffer.getChannelData(0);
    assert(samples.every(x=>Number.isFinite(x)&&Math.abs(x)<=1));
    assert(samples.some(x=>Math.abs(x)>.1));
  }
});

test('each round sound stops the previous source; explosion is not restarted at finish',()=>{
  const previous=globalThis.AudioContext;
  globalThis.AudioContext=TestContext;
  try{
    const audio=new LightningAudio({effectsVolume:.5});
    audio.sequence('countdown');
    const countdown=audio.roundSource;
    assert(countdown.loop);
    audio.sequence('timer');
    assert(!countdown.active);
    const timer=audio.roundSource;
    audio.sequence('fuse');
    const fuse=audio.roundSource;
    assert(!timer.active);
    assert(fuse.loop);
    audio.sequence('explosion');
    assert(!fuse.active);
    const explosion=audio.roundSource;
    assert(!explosion.loop);
    audio.sequence('explosion');
    assert.equal(audio.roundSource,explosion);
    assert.equal(audio.context.sources.filter(x=>x.active).length,1);
    audio.crossfade('menu');
    assert(!explosion.active);
    assert.equal(audio.roundSource,null);
    const disabled=new LightningAudio({enabled:false});
    disabled.sequence('countdown');
    assert.equal(disabled.context,undefined);
  }finally{
    if(previous===undefined)delete globalThis.AudioContext;
    else globalThis.AudioContext=previous;
  }
});
