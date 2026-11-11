(() => {
"use strict";
const canvas=document.getElementById("game"),ctx=canvas.getContext("2d");
const W=240,H=360;
const $=id=>document.getElementById(id);
const screens=[...document.querySelectorAll(".screen")];
const defaults={coins:0,best:0,xp:0,breath:0,focus:0,skin:"red",games:0};
function load(){
  try{return {...defaults,...JSON.parse(localStorage.getItem("kk2-profile")||"{}")};}
  catch{return {...defaults};}
}
let profile=load();
const game={mode:"menu",score:0,time:5,side:1,segments:[],last:0,anim:0,shake:0,earned:0,toastTimer:0};
const colors={red:"#d83f43",blue:"#3b6cba",green:"#38815b",gold:"#d2a332"};
function save(){localStorage.setItem("kk2-profile",JSON.stringify(profile));updateProfile();}
function showScreen(id){
  screens.forEach(s=>s.classList.toggle("active",s.id===id));
  const playing=game.mode==="playing";
  $("left-button").disabled=!playing;$("right-button").disabled=!playing;
}
function updateHud(){
  $("score").textContent=game.score;$("best").textContent=profile.best;$("coins").textContent=profile.coins;
  $("dojo-coins").textContent=profile.coins;$("breath-level").textContent="Niv. "+profile.breath;
  $("focus-level").textContent="Niv. "+profile.focus;
  $("profile-best").textContent=profile.best;$("profile-xp").textContent=profile.xp+" XP";
  $("rank-name").textContent=profile.xp<100?"Débutant":profile.xp<500?"Disciple":profile.xp<1500?"Combattant":"Maître";
  $("avatar").style.background=colors[profile.skin]||colors.red;
  document.querySelectorAll(".skin").forEach(b=>b.classList.toggle("selected",b.dataset.skin===profile.skin));
}
function toast(message){
  const el=$("toast");el.textContent=message;el.classList.add("show");
  clearTimeout(game.toastTimer);game.toastTimer=setTimeout(()=>el.classList.remove("show"),1500);
}
function rand(){return Math.random()<.5?-1:1;}
function makeSegment(y,side=rand(),kind="branch"){return {y,side,kind};}
function resetGame(){
  game.mode="playing";game.score=0;game.time=5+profile.breath*.35;game.side=1;game.anim=0;game.shake=0;game.earned=0;
  game.segments=[];
  for(let i=0;i<9;i++)game.segments.push(makeSegment(0,rand(),i<7?"branch":"clear"));
  updateHud();$("timer-fill").style.transform="scaleX(1)";showScreen("");
  screens.forEach(s=>s.classList.remove("active"));
  game.last=performance.now();
}
function start(){resetGame();}
function endGame(reason){
  if(game.mode!=="playing")return;
  game.mode="over";
  const multiplier=1+profile.focus*.12;
  game.earned=Math.floor(game.score/5*multiplier);
  profile.coins+=game.earned;profile.xp+=game.score;profile.games++;
  if(game.score>profile.best)profile.best=game.score;
  save();
  $("result-title").textContent=reason==="branch"?"TOUCHÉ !":"TEMPS ÉCOULÉ";
  $("result-score").textContent=game.score;$("result-copy").textContent=game.score>=profile.best?"Nouveau record personnel !":"Encore quelques frappes pour progresser.";
  $("earned-coins").textContent=game.earned;showScreen("over-screen");
}
function chop(side){
  if(game.mode!=="playing")return;
  game.side=side;game.anim=.16;
  const current=game.segments[0];
  if(current&&current.kind==="branch"&&current.side===side){game.shake=8;endGame("branch");return;}
  game.score+=10;
  game.time=Math.min(7,game.time+.34);
  game.segments.shift();
  const last=game.segments[game.segments.length-1];
  let nextSide=rand();
  // Avoid long, unfair sequences while retaining alternating branch patterns.
  if(last&&last.kind==="branch"&&Math.random()<.25)nextSide=-last.side;
  game.segments.push(makeSegment((last?.y??H)+34,nextSide,Math.random()<.82?"branch":"clear"));
  game.shake=2;updateHud();
}
function pause(){
  if(game.mode!=="playing")return;
  game.mode="paused";showScreen("pause-screen");
}
function resume(){
  if(game.mode!=="paused")return;
  game.mode="playing";game.last=performance.now();showScreen("");
}
function pixelRect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function drawBackground(){
  pixelRect(0,0,W,H,"#54263a");
  pixelRect(0,0,W,58,"#351d35");
  // Distant dojo roofs and warm lantern-lit sky.
  pixelRect(0,58,W,108,"#8b3b46");pixelRect(0,166,W,70,"#d17b4d");
  pixelRect(12,92,48,4,"#f4b45d");pixelRect(18,96,36,22,"#613046");
  pixelRect(180,80,48,4,"#f4b45d");pixelRect(186,84,36,28,"#613046");
  pixelRect(0,234,W,126,"#3b2532");
  for(let x=0;x<W;x+=24){pixelRect(x,230,2,130,"#5b3440");}
  pixelRect(0,300,W,60,"#2a1b2b");
  pixelRect(0,296,W,4,"#b76b4a");
  // Lanterns
  pixelRect(22,120,7,15,"#f6b34e");pixelRect(21,117,9,3,"#f7d47a");
  pixelRect(207,112,7,15,"#f6b34e");pixelRect(206,109,9,3,"#f7d47a");
}
function drawTree(){
  // Chunky pixel-art trunk and visible cut marks.
  pixelRect(104,45,32,315,"#6d3d2c");
  pixelRect(108,45,8,315,"#9a5a36");pixelRect(124,45,7,315,"#4c2b2b");
  for(let y=58;y<360;y+=28){pixelRect(111,y,3,10,"#c17b48");pixelRect(126,y+9,3,7,"#35232a");}
  pixelRect(98,42,44,8,"#bd7945");pixelRect(102,38,36,5,"#e0a05a");
  // fresh cut face
  pixelRect(109,38,22,4,"#e7b976");
  game.segments.forEach((s,i)=>{
    const y=245-i*28;
    if(s.kind!=="branch"||y<-18||y>H+12)return;
    const left=s.side<0;
    if(left){pixelRect(56,y,48,9,"#75412d");pixelRect(56,y-7,8,15,"#9a5b38");pixelRect(48,y-9,8,5,"#d58a4c");}
    else{pixelRect(136,y,48,9,"#75412d");pixelRect(184,y-7,8,15,"#9a5b38");pixelRect(192,y-9,8,5,"#d58a4c");}
    pixelRect(left?58:184,y+8,14,3,"#422832");
  });
}
function drawNinja(){
  const x=game.side<0?70:170;
  const y=268;
  const suit=colors[profile.skin]||colors.red;
  const swing=game.anim>0?Math.sin((game.anim/.16)*Math.PI)*9:0;
  // shadow, legs, gi body, belt, head, hair and headband
  pixelRect(x-13,y+38,30,5,"#211923");
  pixelRect(x-8,y+27,7,15,"#29232b");pixelRect(x+5,y+27,7,15,"#29232b");
  pixelRect(x-12,y+8,27,24,suit);pixelRect(x-15,y+11,8,17,suit);pixelRect(x+11,y+11,8,17,suit);
  pixelRect(x-13,y+20,28,4,"#f0d9b8");pixelRect(x-1,y+20,4,4,"#2a2027");
  pixelRect(x-8,y-11,20,20,"#e8b58b");
  pixelRect(x-9,y-14,22,8,"#28202a");pixelRect(x-8,y-5,20,3,"#e7bd73");
  pixelRect(x-4,y-2,2,2,"#2b2028");pixelRect(x+5,y-2,2,2,"#2b2028");
  // arm extended toward trunk on each strike
  if(game.side<0){pixelRect(x+7,y+12,13+swing,6,suit);pixelRect(x+17+swing,y+11,6,7,"#e8b58b");}
  else{pixelRect(x-20-swing,y+12,13,6,suit);pixelRect(x-25-swing,y+11,6,7,"#e8b58b");}
  pixelRect(x-12,y+40,13,4,"#1b1720");pixelRect(x+3,y+40,13,4,"#1b1720");
}
function drawEffects(){
  if(game.shake>0)game.shake=Math.max(0,game.shake-.6);
}
function render(now){
  const dt=Math.min(50,now-game.last||16);game.last=now;
  if(game.mode==="playing"){
    game.time-=dt/1000*(1+game.score/900);
    game.anim=Math.max(0,game.anim-dt/1000);
  
    $("timer-fill").style.transform="scaleX("+Math.max(0,game.time/(5+profile.breath*.35))+")";
    if(game.time<=0)endGame("time");
  }
  ctx.save();
  if(game.shake>0)ctx.translate((Math.random()-.5)*game.shake,(Math.random()-.5)*game.shake);
  drawBackground();drawTree();drawNinja();drawEffects();
  ctx.restore();
  requestAnimationFrame(render);
}
function buyUpgrade(key,cost){
  if(profile.coins<cost){toast("Pas assez de pièces");return;}
  profile.coins-=cost;profile[key]++;
  save();toast("Entraînement amélioré !");
}
$("play-button").addEventListener("click",start);
$("retry-button").addEventListener("click",start);
$("resume-button").addEventListener("click",resume);
$("quit-button").addEventListener("click",()=>{game.mode="menu";showScreen("home-screen");});
$("left-button").addEventListener("pointerdown",e=>{e.preventDefault();chop(-1);});
$("right-button").addEventListener("pointerdown",e=>{e.preventDefault();chop(1);});
$("buy-breath").addEventListener("click",()=>buyUpgrade("breath",50+profile.breath*35));
$("buy-focus").addEventListener("click",()=>buyUpgrade("focus",75+profile.focus*50));
$("home-button").addEventListener("click",()=>{if(game.mode==="playing")pause();else showScreen("home-screen");});
document.querySelectorAll("[data-screen]").forEach(b=>b.addEventListener("click",()=>{showScreen(b.dataset.screen);updateProfile();}));
$("skins").addEventListener("click",e=>{
  const b=e.target.closest("[data-skin]");if(!b)return;
  if(b.dataset.skin==="gold"){toast("Kimono doré bientôt disponible");return;}
  profile.skin=b.dataset.skin;save();
});
function updateProfile(){updateHud();}
window.addEventListener("keydown",e=>{
  if(e.key==="ArrowLeft"||e.key.toLowerCase()==="a"){e.preventDefault();chop(-1);}
  if(e.key==="ArrowRight"||e.key.toLowerCase()==="d"){e.preventDefault();chop(1);}
  if(e.key==="Escape"){if(game.mode==="playing")pause();else if(game.mode==="paused")resume();}
});
document.addEventListener("visibilitychange",()=>{if(document.hidden&&game.mode==="playing")pause();});
updateHud();showScreen("home-screen");requestAnimationFrame(render);
})();