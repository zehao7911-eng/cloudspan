import * as C from './core.mjs';
import {View} from './view.mjs';
import {bridge} from './sdk.mjs';

const get = id => document.getElementById(id);
const storageKey = 'cloudspan-v1';
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let saved = {};
try { saved = JSON.parse(localStorage.getItem(storageKey) || '{}') || {}; } catch {}
let profile = C.profile(saved.profile);
let route = C.restore(saved.route, profile);
const view = new View(get('view'));
let host, audio, motion, frame;

function persist() {
  try { localStorage.setItem(storageKey, JSON.stringify({profile,route})); } catch {}
}

function attachHost() {
  return bridge({
    read:()=>C.profile(profile),
    write(data,merge) {
      profile=merge?C.mergeProfile(profile,data):C.profile(data);
      persist();
      if(get('menu').open) fillMenu();
      repaint();
    },
    changed() { if(get('menu').open) fillMenu(); }
  });
}

function chime(kind) {
  if(profile.mute) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    if(audio.state==='suspended') audio.resume().catch(()=>{});
    const notes={bridge:[330,440],beacon:[440,660,880],undo:[300,215],goal:[392,523,659,1046]}[kind];
    const now=audio.currentTime;
    notes.forEach((frequency,i)=>{
      const osc=audio.createOscillator(), gain=audio.createGain(), start=now+.07*i;
      osc.type=i?'sine':'triangle';
      osc.frequency.value=frequency;
      gain.gain.setValueAtTime(.0001,start);
      gain.gain.exponentialRampToValueAtTime(.105,start+.01);
      gain.gain.exponentialRampToValueAtTime(.0001,start+.22);
      osc.connect(gain);gain.connect(audio.destination);
      osc.start(start);osc.stop(start+.24);
    });
  } catch {}
}

function repaint() {
  if(!frame) frame=requestAnimationFrame(draw);
}

function draw(now) {
  frame=0;
  const t=motion?Math.max(0,Math.min(1,(now-motion.start)/motion.duration)):1;
  view.draw(route,profile.color,motion,t);
  if(!motion) return;
  if(t<1){ repaint();return; }
  motion=undefined;
  refresh();
  if(route.stars && !get('menu').open) showResult();
}

function layout() {
  view.resize(C.levels[route.level]);
  for(const button of get('targets').children){
    const [x,y]=view.points[Number(button.dataset.index)];
    button.style.left=x+'px';
    button.style.top=(y+5)+'px';
  }
  repaint();
}

function refresh() {
  const level=C.levels[route.level];
  get('number').textContent=String(route.level+1).padStart(2,'0');
  get('title').textContent=level.name;
  get('wood').textContent=route.wood+' wood';
  const options=C.options(route);
  get('hint').textContent=route.stars?'Lighthouse lit.':motion?'':options.some(o=>o.available)?'Tap an island to build.':'Undo to change course.';
  get('undo').hidden=route.path.length===1||!!route.stars||!!motion;
  get('receipt').hidden=!route.stars||!!motion;
  const targets=get('targets');
  targets.replaceChildren();
  if(!motion) for(const {index,cost,available} of options) {
    const kind=level.nodes[index][2];
    const label=kind==='goal'?'Lighthouse':kind==='star'?'Beacon '+index:'Island '+index;
    const button=document.createElement('button');
    button.className='node';
    button.dataset.index=index;
    button.textContent=cost;
    button.setAttribute('aria-label',label+' · '+cost+' wood');
    button.disabled=!available;
    button.onclick=()=>buildTo(index);
    targets.append(button);
  }
  layout();
}

function travel(from,to,adding) {
  motion={from,to,adding,start:performance.now(),duration:reducedMotion?1:580};
  refresh();
}

function buildTo(index) {
  if(motion) return;
  const from=C.current(route);
  if(!C.extend(route,index)) return;
  host.start();
  if(route.stars) {
    profile.best[route.level]=Math.max(profile.best[route.level],route.stars);
    persist();
    host.save();
    host.end();
  } else persist();
  const kind=C.levels[route.level].nodes[index][2];
  chime(kind==='goal'?'goal':kind==='star'?'beacon':'bridge');
  travel(from,index,true);
}

function undoBridge() {
  if(motion) return;
  const from=C.current(route);
  if(!C.undo(route)) return;
  host.start();
  persist();
  chime('undo');
  travel(from,C.current(route),false);
}

function choose(index) {
  if(!route.stars) host.end();
  host.prepare();
  route=C.newRoute(index);
  motion=undefined;
  persist();
  refresh();
}

function showResult() {
  if(!route.stars||get('result').open||get('menu').open) return;
  const level=C.levels[route.level];
  const lit=route.path.filter(i=>level.nodes[i][2]==='star').length;
  const max=level.nodes.filter(node=>node[2]==='star').length;
  get('stars').textContent='★'.repeat(route.stars)+'☆'.repeat(3-route.stars);
  get('score').textContent=lit+'/'+max+' lit · '+route.wood+' wood left';
  get('next').textContent=route.level===C.levels.length-1?'Islands →':'Next →';
  get('result').showModal();
}

function fillMenu() {
  get('menuTitle').textContent='Islands · '+C.total(profile)+'/24 ★';
  get('par').textContent='★ Light all beacons · ★ Save '+C.levels[route.level].reserve+' wood';
  get('sound').textContent=profile.mute?'Sound off':'Sound on';
  get('sound').setAttribute('aria-pressed',String(!profile.mute));
  const list=get('routes');
  list.replaceChildren();
  C.levels.forEach((level,index)=>{
    const button=document.createElement('button');
    button.className='route';
    button.disabled=!C.unlocked(profile,index);
    const name=document.createElement('span'), score=document.createElement('small');
    name.textContent=(index+1)+'. '+level.name;
    score.textContent=profile.best[index]?'★'.repeat(profile.best[index]):button.disabled?'Locked':index===route.level?'Here':'Open';
    button.append(name,score);
    button.onclick=()=>{
      get('menu').close();
      if(route.level!==index) choose(index);
    };
    list.append(button);
  });
  const palette=get('palette');
  palette.replaceChildren();
  C.colors.forEach((color,index)=>{
    const button=document.createElement('button');
    button.style.setProperty('--coat',color);
    button.disabled=!C.colorAllowed(profile,index);
    button.textContent=button.disabled?'·':'◈';
    button.setAttribute('aria-label',['Coral coat','Teal coat','Lilac coat'][index]);
    button.title=button.disabled?[0,8,16][index]+' stars':button.getAttribute('aria-label');
    button.setAttribute('aria-pressed',String(profile.color===index));
    button.onclick=()=>{profile.color=index;persist();repaint();fillMenu();};
    palette.append(button);
  });
  const support=host?.support(), perks=get('perks');
  const hints=[];
  if(support?.like) hints.push('GameWave like: teal coat.');
  if(support?.comment) hints.push('GameWave comment: lilac coat.');
  perks.textContent=hints.join(' ');
  perks.hidden=!hints.length;
}

function showMenu() {
  fillMenu();
  if(!get('menu').open) get('menu').showModal();
}

get('menuOpen').onclick=showMenu;
get('closeMenu').onclick=()=>get('menu').close();
get('restart').onclick=()=>{get('menu').close();choose(route.level);};
get('sound').onclick=()=>{profile.mute=!profile.mute;persist();fillMenu();};
get('undo').onclick=undoBridge;
get('receipt').onclick=showResult;
get('closeResult').onclick=()=>get('result').close();
get('next').onclick=()=>{
  get('result').close();
  if(route.level<C.levels.length-1) choose(route.level+1);
  else showMenu();
};
new ResizeObserver(layout).observe(get('board'));
window.addEventListener('pagehide',()=>host.stop());
window.addEventListener('pageshow',event=>{if(event.persisted) host=attachHost();});
host=attachHost();
refresh();
