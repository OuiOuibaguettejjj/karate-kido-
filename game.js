(() => {
  "use strict";
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayCopy = document.getElementById("overlay-copy");
  const startButton = document.getElementById("start-button");
  const countdownEl = document.getElementById("countdown");
  const W = canvas.width, H = canvas.height;
  const state = {
    mode: "menu", score: 0, best: Number(localStorage.getItem("kk2-best") || 0),
    side: -1, speed: 1, chops: 0, branchRows: [], lastTime: 0, swing: 0,
    particles: [], shake: 0
  };
  bestEl.textContent = state.best;

  function reset() {
    state.mode = "playing"; state.score = 0; state.side = -1; state.speed = 1;
    state.chops = 0; state.swing = 0; state.particles = []; state.shake = 0;
    state.branchRows = [];
    for (let i = 0; i < 7; i++) state.branchRows.push({y: 105 + i * 105, side: Math.random() < .5 ? -1 : 1, active: i < 4});
    scoreEl.textContent = "0";
    overlay.hidden = true;
  }
  function start() {
    reset();
    let n = 3; countdownEl.hidden = false; countdownEl.textContent = n;
    const tick = () => {
      n--;
      if (n > 0) { countdownEl.textContent = n; setTimeout(tick, 550); }
      else { countdownEl.hidden = true; state.lastTime = performance.now(); }
    };
    setTimeout(tick, 550);
  }
  function endGame() {
    if (state.mode !== "playing") return;
    state.mode = "over";
    if (state.score > state.best) {
      state.best = state.score; localStorage.setItem("kk2-best", String(state.best));
      bestEl.textContent = state.best;
    }
    overlayTitle.textContent = "FIN DE PARTIE";
    overlayCopy.textContent = "Score : " + state.score + " — Record : " + state.best + ". Recommence pour battre ton record.";
    startButton.textContent = "REJOUER";
    overlay.hidden = false;
  }
  function chop(side) {
    if (state.mode !== "playing" || !countdownEl.hidden) return;
    state.side = side; state.swing = 1; state.chops++;
    const row = state.branchRows[0];
    if (row && row.active && row.side === side) { endGame(); return; }
    state.score++;
    scoreEl.textContent = state.score;
    state.speed = Math.min(2.7, 1 + state.score * .008);
    state.particles.push({x: W/2, y: 370, life: 1, side});
    state.branchRows.forEach(r => r.y += 8 + state.speed * 2);
    if (state.branchRows[0].y > 480) {
      state.branchRows.shift();
      const lastY = state.branchRows[state.branchRows.length - 1].y;
      const lastSide = state.branchRows[state.branchRows.length - 1].side;
      const newSide = Math.random() < .5 ? -1 : 1;
      state.branchRows.push({y: lastY - 105, side: newSide, active: Math.random() < Math.min(.88, .52 + state.score / 300)});
    }
  }
  function roundRect(x,y,w,h,r,fill) {
    ctx.fillStyle=fill;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();
  }
  function drawBackground() {
    const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,"#8fc0d0");sky.addColorStop(.65,"#d4d5b6");sky.addColorStop(1,"#879b72");
    ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
    ctx.fillStyle="#e7d7aa";ctx.globalAlpha=.65;ctx.beginPath();ctx.arc(380,105,48,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    ctx.fillStyle="#6c927b";ctx.beginPath();ctx.moveTo(0,340);ctx.quadraticCurveTo(110,270,220,340);ctx.quadraticCurveTo(360,255,480,340);ctx.lineTo(480,510);ctx.lineTo(0,510);ctx.fill();
    ctx.fillStyle="#718b62";ctx.fillRect(0,500,W,220);
    for(let i=0;i<11;i++){const x=(i*57+18)%W;ctx.fillStyle=i%2?"#597954":"#66855c";ctx.beginPath();ctx.arc(x,470+(i%3)*13,35,Math.PI,0);ctx.fill();}
    ctx.fillStyle="#b4a17d";ctx.fillRect(0,560,W,160);
  }
  function drawTree() {
    // Tronc central et coupe visible
    const bark=ctx.createLinearGradient(190,0,290,0);bark.addColorStop(0,"#684027");bark.addColorStop(.5,"#a66c3e");bark.addColorStop(1,"#70452b");
    roundRect(197,30,86,570,13,bark);
    ctx.strokeStyle="#d19a62";ctx.lineWidth=3;
    for(let y=65;y<590;y+=54){ctx.beginPath();ctx.moveTo(210,y);ctx.quadraticCurveTo(238,y-12,270,y+3);ctx.stroke();}
    ctx.fillStyle="#d8a66e";ctx.beginPath();ctx.ellipse(240,30,43,12,0,0,Math.PI*2);ctx.fill();
    state.branchRows.forEach(r=>{
      if(!r.active)return;
      const y=r.y;
      ctx.save();ctx.translate(240,y);ctx.scale(r.side,1);
      ctx.fillStyle="#81512f";ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(92,-18);ctx.lineTo(100,-4);ctx.lineTo(0,14);ctx.closePath();ctx.fill();
      ctx.fillStyle="#a66d42";ctx.beginPath();ctx.moveTo(83,-17);ctx.lineTo(102,-44);ctx.lineTo(112,-39);ctx.lineTo(100,-4);ctx.closePath();ctx.fill();
      ctx.restore();
    });
  }
  function drawFighter() {
    const x=state.side<0?135:345, y=450;
    const lean=state.swing?Math.sin(state.swing*Math.PI)*12:0;
    ctx.save();ctx.translate(x,y);ctx.rotate(state.side<0?.05:-.05);
    // Ombre
    ctx.fillStyle="#263b36aa";ctx.beginPath();ctx.ellipse(0,74,47,11,0,0,Math.PI*2);ctx.fill();
    // jambes
    ctx.strokeStyle="#20252a";ctx.lineWidth=17;ctx.lineCap="round";
    ctx.beginPath();ctx.moveTo(-8,35);ctx.lineTo(-18,70);ctx.moveTo(11,35);ctx.lineTo(25,68);ctx.stroke();
    // pantalon / kimono
    ctx.fillStyle="#f1eee2";ctx.beginPath();ctx.moveTo(-24,-7);ctx.lineTo(24,-7);ctx.lineTo(29,42);ctx.lineTo(-28,42);ctx.closePath();ctx.fill();
    // torse
    ctx.fillStyle="#f4f0e4";ctx.beginPath();ctx.moveTo(-25,-68);ctx.lineTo(25,-68);ctx.lineTo(30,-5);ctx.lineTo(-30,-5);ctx.closePath();ctx.fill();
    ctx.strokeStyle="#b7b2a4";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-65);ctx.lineTo(5,-9);ctx.lineTo(23,-58);ctx.stroke();
    // ceinture
    ctx.fillStyle="#25282a";ctx.fillRect(-28,-16,56,8);ctx.fillRect(7,-8,7,22);
    // tête et bandeau
    ctx.fillStyle="#d99f75";ctx.beginPath();ctx.arc(0,-87,21,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#272b30";ctx.beginPath();ctx.arc(0,-95,21,Math.PI,Math.PI*2);ctx.fill();
    ctx.fillStyle="#bd3f36";ctx.fillRect(-20,-91,40,6);
    // bras et poings
    ctx.strokeStyle="#f2eee2";ctx.lineWidth=14;ctx.lineCap="round";
    ctx.beginPath();ctx.moveTo(-22,-57);ctx.lineTo(state.side<0?-50-lean:-12,-40);ctx.moveTo(22,-57);ctx.lineTo(state.side<0?12:50+lean,-40);ctx.stroke();
    ctx.fillStyle="#d99f75";ctx.beginPath();ctx.arc(state.side<0?-50-lean:50+lean,-40,9,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
  function drawEffects(dt) {
    state.particles=state.particles.filter(p=>p.life>0);
    state.particles.forEach(p=>{p.life-=dt*.0018;ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle="#f5d37c";ctx.beginPath();ctx.arc(p.x+(Math.random()-.5)*25,p.y+(Math.random()-.5)*30,3+Math.random()*3,0,Math.PI*2);ctx.fill();});
    ctx.globalAlpha=1;
  }
  function render(now) {
    const dt=Math.min(40,now-state.lastTime);state.lastTime=now;
    if(state.mode==="playing" && countdownEl.hidden){
      state.swing=Math.max(0,state.swing-dt*.006);
      state.branchRows.forEach(r=>r.y+=dt*.045*state.speed);
      if(state.branchRows[0] && state.branchRows[0].y>560){
        state.branchRows.shift();
        const last=state.branchRows[state.branchRows.length-1];
        state.branchRows.push({y:last.y-105,side:Math.random()<.5?-1:1,active:Math.random()<.62});
      }
    }
    drawBackground();drawTree();drawFighter();drawEffects(dt);
    requestAnimationFrame(render);
  }
  document.getElementById("left-button").addEventListener("pointerdown",e=>{e.preventDefault();chop(-1);});
  document.getElementById("right-button").addEventListener("pointerdown",e=>{e.preventDefault();chop(1);});
  canvas.addEventListener("pointerdown",e=>{const r=canvas.getBoundingClientRect();chop(e.clientX<r.left+r.width/2?-1:1);});
  window.addEventListener("keydown",e=>{if(e.key==="ArrowLeft"||e.key.toLowerCase()==="a")chop(-1);if(e.key==="ArrowRight"||e.key.toLowerCase()==="d")chop(1);if((e.key===" "||e.key==="Enter")&&state.mode!=="playing")start();});
  startButton.addEventListener("click",start);
  requestAnimationFrame(render);
})();