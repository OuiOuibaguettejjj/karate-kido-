(() => {
"use strict";
const canvas=document.getElementById("game"),ctx=canvas.getContext("2d");
const W=240,H=360,$=id=>document.getElementById(id);
const screens=[...document.querySelectorAll(".screen")];
const defaults={coins:0,best:0,xp:0,breath:0,focus:0,skin:"red",games:0};
function load(){
  try{return {...defaults,...JSON.parse(localStorage.getItem("kk2-profile")||"{}")};}
  catch{return {...defaults};}
}
let profile=load();
const game={mode:"menu",score:0,time:5,side:1,segments:[],last:0,anim:0,shake:0,earned:0,combo:0,multiplier:1,particles:[],floaters:[],toastTimer:0};
const suits={red:"#d94b40",blue:"#4a78c2",green:"#4b9364",gold:"#d9a62f"};
function save(){localStorage.setItem("kk2-profile",JSON.stringify(profile));updateProfile();}
function showScreen(id){
  screens.forEach(s=>s.classList.toggle("active",s.id===id));
  const playing=game.mode==="playing";
  $("left-button").disabled=!playing;$("right-button").disabled=!playing;
}
function updateHud(){
  $("score").textContent=game.score;$("best").textContent=profile.best;$("coins").textContent=profile.coins;
  $("multiplier").textContent="x"+game.multiplier.toFixed(1);
  $("dojo-coins").textContent=profile.coins;$("breath-level").textContent="Niv. "+profile.breath;
  $("focus-level").textContent="Niv. "+profile.focus;
  $("buy-breath").textContent="AMÉLIORER · "+(50+profile.breath*35);
  $("buy-focus").textContent="AMÉLIORER · "+(75+profile.focus*50);
  $("profile-best").textContent=profile.best;$("profile-xp").textContent=profile.xp+" XP";
  $("rank-name").textContent=profile.xp<100?"Débutant":profile.xp<500?"Disciple":profile.xp<1500?"Combattant":"Maître";
  $("avatar").style.background=suits[profile.skin]||suits.red;
  document.querySelectorAll(".skin").forEach(b=>b.classList.toggle("selected",b.dataset.skin===profile.skin));
}
function toast(message){
  const el=$("toast");el.textContent=message;el.classList.add("show");
  clearTimeout(game.toastTimer);game.toastTimer=setTimeout(()=>el.classList.remove("show"),1500);
}
function rand(){return Math.random()<.5?-1:1;}
function makeSegment(side=rand(),kind="branch"){return {side,kind};}
function resetGame(){
  game.mode="playing";game.score=0;game.time=5+profile.breath*.35;game.side=1;game.anim=0;game.shake=0;
  game.earned=0;game.combo=0;game.multiplier=1;game.particles=[];game.floaters=[];
  game.segments=[];
  for(let i=0;i<9;i++)game.segments.push(makeSegment(i===0?1:rand(),i<8?"branch":"clear"));
  updateHud();$("timer-fill").style.transform="scaleX(1)";showScreen("");
  screens.forEach(s=>s.classList.remove("active"));
  game.last=performance.now();
}
function start(){resetGame();}
function endGame(reason){
  if(game.mode!=="playing")return;
  game.mode="over";
  const newRecord=game.score>profile.best;
  game.earned=Math.floor(game.score/5*(1+profile.focus*.12));
  profile.coins+=game.earned;profile.xp+=game.score;profile.games++;
  if(newRecord)profile.best=game.score;
  save();
  $("result-title").textContent=newRecord?"NOUVEAU RECORD !":reason==="branch"?"TOUCHÉ !":"TEMPS ÉCOULÉ";
  $("result-score").textContent=game.score;
  $("result-copy").textContent=newRecord?"Tu as battu ton record personnel !":"Encore quelques frappes pour progresser.";
  $("earned-coins").textContent=game.earned;showScreen("over-screen");
}
function addSplinters(){
  for(let i=0;i<9;i++)game.particles.push({
    x:120+(Math.random()-.5)*20,y:244+(Math.random()-.5)*15,
    vx:(Math.random()-.5)*110,vy:-35-Math.random()*95,
    life:.45+Math.random()*.3,size:2+Math.random()*4
  });
}
function chop(side){
  if(game.mode!=="playing")return;
  game.side=side;game.anim=.2;
  const current=game.segments[0];
  if(current&&current.kind==="branch"&&current.side===side){game.shake=8;endGame("branch");return;}
  game.combo++;
  game.multiplier=Math.min(2.5,1+Math.floor(game.combo/3)*.1);
  const points=Math.round(10*game.multiplier);
  game.score+=points;game.time=Math.min(7,game.time+.32);
  game.segments.shift();
  const last=game.segments[game.segments.length-1];
  let nextSide=rand();
  if(last&&last.kind==="branch"&&Math.random()<.25)nextSide=-last.side;
  game.segments.push(makeSegment(nextSide,Math.random()<.88?"branch":"clear"));
  game.floaters.push({text:"+"+points,x:120,y:210,life:.85});
  addSplinters();game.shake=2;updateHud();
}
function pause(){
  if(game.mode!=="playing")return;
  game.mode="paused";showScreen("pause-screen");
}
function resume(){
  if(game.mode!=="paused")return;
  game.mode="playing";game.last=performance.now();showScreen("");
}
function rect(x,y,w,h,color){
  ctx.fillStyle=color;ctx.fillRect(x,y,w,h);
}
function drawTorii(x,y,scale,alpha){
  ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);ctx.scale(scale,scale);
  rect(-5,0,8,90,"#40243a");rect(49,0,8,90,"#40243a");
  rect(-15,8,78,8,"#4b263b");rect(-20,0,88,8,"#633044");
  rect(-8,18,64,4,"#7b3b45");
  ctx.restore();
}
function drawBonsai(x,y,scale){
  ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
  ctx.strokeStyle="#40263a";ctx.lineWidth=7;ctx.lineCap="round";
  ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(4,-24);ctx.lineTo(-8,-39);ctx.stroke();
  ctx.fillStyle="#39243a";
  [[-10,-42,19],[9,-34,17],[-2,-53,15]].forEach(([cx,cy,r])=>{ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();});
  ctx.restore();
}
function drawBackground(){
  const sky=ctx.createLinearGradient(0,0,0,H);
  sky.addColorStop(0,"#76507c");sky.addColorStop(.42,"#d17b82");sky.addColorStop(.73,"#f1a16b");sky.addColorStop(1,"#553044");
  rect(0,0,W,H,sky);
  ctx.fillStyle="#f6b46d";ctx.beginPath();ctx.arc(120,137,61,0,Math.PI*2);ctx.fill();
  rect(0,198,W,44,"#713b50");
  drawTorii(22,82,.72,.65);drawTorii(174,71,.9,.58);drawTorii(91,95,.52,.32);
  drawBonsai(24,251,1.05);drawBonsai(218,246,.9);
  rect(0,279,W,81,"#39263a");
  rect(0,291,W,5,"#805044");
  // warm ground reflections
  rect(18,315,34,2,"#a65f53");rect(158,327,46,2,"#8b514e");rect(85,340,24,2,"#9b5c51");
  // distant roof lines
  rect(0,222,W,3,"#593248");rect(0,231,W,2,"#8a4b53");
}
function drawPlank(side,y){
  const left=side<0;
  ctx.save();
  ctx.translate(120,y);
  if(left)ctx.scale(-1,1);
  const wood=ctx.createLinearGradient(0,-8,0,12);
  wood.addColorStop(0,"#e0a35f");wood.addColorStop(.35,"#a95e3b");wood.addColorStop(1,"#6f3a31");
  ctx.fillStyle=wood;ctx.beginPath();ctx.moveTo(0,-5);ctx.lineTo(54,-5);ctx.lineTo(60,-1);ctx.lineTo(56,8);ctx.lineTo(0,7);ctx.closePath();ctx.fill();
  ctx.fillStyle="#f0bd78";ctx.fillRect(8,-4,39,2);
  ctx.fillStyle="#60372f";ctx.fillRect(17,2,18,2);
  ctx.fillStyle="#d48b4f";ctx.fillRect(51,-2,6,6);
  ctx.restore();
}
function drawTree(){
  const bark=ctx.createLinearGradient(98,0,143,0);
  bark.addColorStop(0,"#60382f");bark.addColorStop(.2,"#a45d3b");bark.addColorStop(.55,"#c27b49");bark.addColorStop(.8,"#875039");bark.addColorStop(1,"#4d2d30");
  rect(99,33,42,327,bark);
  rect(104,34,4,326,"#d18a51");rect(133,34,3,326,"#573332");
  for(let y=47;y<350;y+=29){
    ctx.strokeStyle="#70402f";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(112,y);ctx.quadraticCurveTo(120,y+5,127,y-1);ctx.stroke();
    ctx.strokeStyle="#df9a5a";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(107,y+10);ctx.lineTo(111,y+13);ctx.stroke();
  }
  // exposed cut top
  ctx.fillStyle="#dba36b";ctx.beginPath();ctx.ellipse(120,34,21,6,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#f1c58b";ctx.beginPath();ctx.ellipse(120,34,15,3.5,0,0,Math.PI*2);ctx.fill();
  game.segments.forEach((s,i)=>{
    const y=245-i*28;
    if(s.kind!=="branch"||y<-18||y>H+10)return;
    drawPlank(s.side,y);
  });
}
function drawNinja(){
  const x=game.side<0?70:170,y=270,suit=suits[profile.skin]||suits.red;
  const punch=game.anim>0?Math.sin((game.anim/.2)*Math.PI):0;
  const dir=game.side<0?1:-1;
  ctx.save();ctx.translate(x,y);
  // shadow and feet
  ctx.fillStyle="#271a2c66";ctx.beginPath();ctx.ellipse(0,43,24,6,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#35232c";ctx.beginPath();ctx.ellipse(-7,39,9,4,-.15,0,Math.PI*2);ctx.ellipse(9,39,9,4,.15,0,Math.PI*2);ctx.fill();
  // legs
  ctx.fillStyle="#edbd38";ctx.beginPath();ctx.moveTo(-12,10);ctx.lineTo(12,10);ctx.lineTo(17,36);ctx.lineTo(3,37);ctx.lineTo(-2,23);ctx.lineTo(-7,37);ctx.lineTo(-18,35);ctx.closePath();ctx.fill();
  ctx.strokeStyle="#a96d2d";ctx.lineWidth=1.5;ctx.stroke();
  // torso gi
  ctx.fillStyle=suit;ctx.beginPath();ctx.moveTo(-13,-22);ctx.lineTo(12,-22);ctx.lineTo(17,12);ctx.lineTo(-17,12);ctx.closePath();ctx.fill();
  ctx.strokeStyle="#8d552c";ctx.lineWidth=1.4;ctx.stroke();
  // gi lapels
  ctx.fillStyle="#ffe16b";ctx.beginPath();ctx.moveTo(-8,-21);ctx.lineTo(2,-4);ctx.lineTo(9,-22);ctx.lineTo(3,-25);ctx.closePath();ctx.fill();
  ctx.strokeStyle="#b87931";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-8,-21);ctx.lineTo(2,-4);ctx.stroke();
  // purple belt
  ctx.fillStyle="#673b83";ctx.fillRect(-16,3,32,5);ctx.fillRect(5,7,5,12);
  ctx.fillStyle="#9c6bb2";ctx.fillRect(-14,3,28,2);
  // neck and face
  ctx.fillStyle="#d99062";ctx.fillRect(-5,-31,10,9);
  ctx.fillStyle="#e7a575";ctx.beginPath();ctx.ellipse(0,-39,11,13,0,0,Math.PI*2);ctx.fill();
  // black hair and purple headband
  ctx.fillStyle="#241c2a";ctx.beginPath();ctx.arc(0,-43,12,Math.PI,Math.PI*2);ctx.lineTo(12,-38);ctx.lineTo(7,-34);ctx.lineTo(-11,-35);ctx.closePath();ctx.fill();
  ctx.fillStyle="#623b84";ctx.fillRect(-11,-42,22,3);
  ctx.fillStyle="#241c2a";ctx.fillRect(-5,-39,2,2);ctx.fillRect(5,-39,2,2);
  // rear arm
  ctx.strokeStyle=suit;ctx.lineWidth=8;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(-10,-16);ctx.lineTo(-20,-3);ctx.stroke();
  ctx.fillStyle="#e7a575";ctx.beginPath();ctx.arc(-21,-2,4,0,Math.PI*2);ctx.fill();
  // punching arm toward the trunk
  ctx.strokeStyle=suit;ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(10,-16);ctx.lineTo(dir*(17+18*punch),-7-5*punch);ctx.stroke();
  ctx.fillStyle="#e7a575";ctx.beginPath();ctx.arc(dir*(19+18*punch),-7-5*punch,5,0,Math.PI*2);ctx.fill();
  // sleeve seam
  ctx.strokeStyle="#fff0a4";ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(10,-16);ctx.lineTo(dir*16,-12);ctx.stroke();
  ctx.restore();
}
function drawEffects(dt){
  game.particles=game.particles.filter(p=>p.life>0);
  game.particles.forEach(p=>{
    p.x+=p.vx*dt/1000;p.y+=p.vy*dt/1000;p.vy+=240*dt/1000;p.life-=dt/1000;
    ctx.globalAlpha=Math.max(0,p.life*1.5);ctx.fillStyle="#f2c07a";ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.vx*.01);
    ctx.fillRect(-p.size/2,-p.size/2,p.size*1.8,p.size);ctx.restore();
  });
  game.floaters=game.floaters.filter(f=>f.life>0);
  game.floaters.forEach(f=>{
    f.y-=dt*.035;f.life-=dt/1000;
    ctx.globalAlpha=Math.max(0,f.life);ctx.fillStyle="#fff1a1";ctx.font="bold 17px Arial";ctx.textAlign="center";
    ctx.shadowColor="#693343";ctx.shadowBlur=4;ctx.fillText(f.text,f.x,f.y);ctx.shadowBlur=0;
  });
  ctx.globalAlpha=1;
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
  if(game.shake>0){ctx.translate((Math.random()-.5)*game.shake,(Math.random()-.5)*game.shake);game.shake=Math.max(0,game.shake-dt*.035);}
  drawBackground();drawTree();drawNinja();drawEffects(dt);
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