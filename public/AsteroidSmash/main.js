// Retro Space Defense - main.js
// All visuals are code-generated pixel art drawn on the canvas.
'use strict';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
// --- Simple WebAudio SFX manager (code-generated sounds, no external files) ---
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
let masterGain = null;
const SFX = {
  init(){
    if(audioCtx) return;
    audioCtx = new AudioCtx();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 1;
    masterGain.connect(audioCtx.destination);
  },
  resume(){ if(audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); },
  toggleMute(){ if(!audioCtx) this.init(); masterGain.gain.value = masterGain.gain.value ? 0 : 1; },
  playShot(){
    this.init(); const t = audioCtx.currentTime;
    const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(1200, t);
    g.gain.setValueAtTime(0.001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
    o.connect(g); g.connect(masterGain);
    o.start(t); o.frequency.exponentialRampToValueAtTime(420, t + 0.12);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    o.stop(t + 0.3);
  },
  playExplosion(){
    this.init(); const t = audioCtx.currentTime;
    // noise burst
    const dur = 0.6;
    const bufferSize = audioCtx.sampleRate * dur;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for(let i=0;i<bufferSize;i++) data[i] = (Math.random()*2 -1) * Math.pow(1 - i/bufferSize, 2);
    const noise = audioCtx.createBufferSource(); noise.buffer = buffer;
    const noiseFilter = audioCtx.createBiquadFilter(); noiseFilter.type = 'bandpass'; noiseFilter.frequency.setValueAtTime(800, t);
    const ng = audioCtx.createGain(); ng.gain.setValueAtTime(0.6, t); ng.gain.exponentialRampToValueAtTime(0.001, t + dur);
    noise.connect(noiseFilter); noiseFilter.connect(ng); ng.connect(masterGain);
    noise.start(t); noise.stop(t + dur + 0.02);
    // low boom
    const o = audioCtx.createOscillator(); const og = audioCtx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(180, t);
    og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime(0.6, t + 0.02);
    o.connect(og); og.connect(masterGain);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.5);
    og.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.start(t); o.stop(t + dur + 0.02);
  },
  playHit(){
    this.init(); const t = audioCtx.currentTime;
    const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(260, t);
    g.gain.setValueAtTime(0.001, t); g.gain.exponentialRampToValueAtTime(0.28, t + 0.01);
    o.connect(g); g.connect(masterGain);
    o.frequency.exponentialRampToValueAtTime(120, t + 0.25);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    o.start(t); o.stop(t + 0.45);
  }
};
// ---------------------------------------------------------------------------
// Optional assets loader: place PNGs in c:\asteroid game\assets\ with names
// ship.png, asteroid.png, heart.png, earth.png to override code-drawn visuals.
const assets = {};
function loadAssets(list, cb){
  let toLoad = list.length;
  if(toLoad === 0){ cb && cb(); return; }
  for(const name of list){
    const img = new Image();
    img.onload = ()=>{ assets[name] = img; toLoad--; if(toLoad===0) cb && cb(); };
    img.onerror = ()=>{ toLoad--; if(toLoad===0) cb && cb(); };
    img.src = `assets/${name}.png`;
  }
}

// Logical resolution (small, pixel-art friendly) using a landscape 16:9 base
// Fullscreen: game scales to fill entire viewport
const LOGICAL_WIDTH = 320;
const LOGICAL_HEIGHT = 180;
let PIXEL_SCALE = 2; // will be recalculated on resize to an integer >=1

let DPR = Math.max(1, window.devicePixelRatio || 1);

function resizeCanvas(){
  DPR = Math.max(1, window.devicePixelRatio || 1);
  // Use 100% of viewport for fullscreen
  const maxCSSW = window.innerWidth;
  const maxCSSH = window.innerHeight;
  // choose largest integer pixel scale that fits the logical resolution into maxCSSW/H
  const scaleW = Math.floor(maxCSSW / LOGICAL_WIDTH);
  const scaleH = Math.floor(maxCSSH / LOGICAL_HEIGHT);
  const scale = Math.max(1, Math.min(scaleW || 1, scaleH || 1));
  PIXEL_SCALE = scale;
  // set actual canvas (pixel) size using DPR for crispness
  canvas.width = LOGICAL_WIDTH * PIXEL_SCALE * DPR;
  canvas.height = LOGICAL_HEIGHT * PIXEL_SCALE * DPR;
  // set CSS size to fill viewport completely
  canvas.style.width = maxCSSW + 'px';
  canvas.style.height = maxCSSH + 'px';
  ctx.setTransform(DPR,0,0,DPR,0,0);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Utility pixel-draw helpers (work in logical pixels, then multiplied by PIXEL_SCALE)
function px(x){return x * PIXEL_SCALE;}
function drawPixelRect(x,y,w,h,color){
  ctx.fillStyle = color;
  ctx.fillRect(px(x), px(y), px(w), px(h));
}
function drawPixelCircle(cx,cy,r,color){
  ctx.fillStyle = color;
  // draw circle scaled to pixels
  ctx.beginPath();
  ctx.arc(px(cx), px(cy), px(r), 0, Math.PI*2);
  ctx.fill();
}
function drawText(text,x,y,color,size=6,align='left'){
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${size * PIXEL_SCALE * 1.1}px monospace`;
  ctx.textAlign = align;
  ctx.fillText(text, px(x), px(y));
  ctx.restore();
}

// draw wrapped text centered within a max logical width (logical pixels)
function drawWrappedText(text, x, y, maxWidthLogical, color, size=6, align='center', lineHeight=1.2){
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${size * PIXEL_SCALE * 1.1}px monospace`;
  const maxWpx = px(maxWidthLogical);
  const words = text.split(' ');
  let line = '';
  const lines = [];
  for(const w of words){
    const test = line ? line + ' ' + w : w;
    const metrics = ctx.measureText(test);
    if(metrics.width > maxWpx && line){
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if(line) lines.push(line);
  // draw each line
  ctx.textAlign = align;
  const baseX = px(x);
  const lineH = size * lineHeight; // logical pixels per line
  for(let i=0;i<lines.length;i++){
    ctx.fillText(lines[i], baseX, px(y + i * lineH));
  }
  ctx.restore();
  return lines.length;
}

// Game state
let keys = {};
let player;
let missiles = [];
let asteroids = [];
let particles = [];
let stars = [];
let spawnTimer = 0;
let spawnInterval = 700; // ms
let lastTime = performance.now();
let score = 0;
let hearts = 3;
let highScore = 0;
let gameOver = false;
let gameStarted = false; // Track if game has been started by pressing Play
let isInvincible = false; // Track invincibility state
let invincibilityTimer = 0;
const INVINCIBILITY_DURATION = 5000; // 5 seconds
let earthSeed = 0; // deterministic seed for earth noise
let earthThreshold = 0.3; // computed threshold so that ~30% becomes land

// Canvas-based, independent game-over fact rotation with fade animation
let gameOverFactIndex = 0;
let gameOverFactNextChange = 0;
let gameOverFactOpacity = 0;
let gameOverFactFadingIn = true;
const FACT_FADE_SPEED = 0.03; // Fade speed per frame

function startCanvasGameOverFacts(){
  gameOverFactIndex = Math.floor(Math.random() * FUN_FACTS.length);
  gameOverFactNextChange = performance.now() + 5000 + Math.floor(Math.random()*2000);
  gameOverFactOpacity = 0;
  gameOverFactFadingIn = true;
}
function stopCanvasGameOverFacts(){ 
  gameOverFactNextChange = 0; 
  gameOverFactOpacity = 0;
  gameOverFactFadingIn = true;
}
// Earth height kept proportional to the logical height
const EARTH_HEIGHT = Math.max(10, Math.round(LOGICAL_HEIGHT * 0.09)); // ~9% of height (~16 for 180px)

function init(){
  player = {
    x: LOGICAL_WIDTH/2,
    y: LOGICAL_HEIGHT - EARTH_HEIGHT - 10,
    w: 11,
    h: 6,
    speed: 80, // logical pixels per second
    shootCooldown: 0,
  };
  missiles = [];
  asteroids = [];
  particles = [];
  score = 0;
  hearts = 3;
  gameOver = false;
  gameStarted = false; // Don't mark as started until Play button is pressed
  isInvincible = false;
  invincibilityTimer = 0;
  spawnTimer = 0;
  initStars();
  // try loading optional PNG assets (no error if missing)
  loadAssets(['ship','asteroid','heart','earth'], ()=>{/* assets ready if provided */});
  // deterministic seed for earth generation so landmasses don't flicker
  earthSeed = Math.floor(Math.random() * 0x7fffffff);
  // compute threshold so that roughly 30% of the hemisphere is land
  computeEarthThreshold(0.30);
}

// compute a threshold for earth land coverage using the same noise sampler
function computeEarthThreshold(targetFraction){
  // reuse parameters from drawEarth
  const centerX = LOGICAL_WIDTH/2;
  const yRadius = 60;
  const xRadius = Math.round(LOGICAL_WIDTH/2) + 28;
  const vals = [];
  // local rnd/noise matching drawEarth
  function rndLocal(x){
    let v = (x ^ earthSeed) >>> 0;
    v = (v + 0x6D2B79F5) >>> 0;
    v = Math.imul(v ^ (v >>> 15), 1 | v) >>> 0;
    return (v >>> 0) / 4294967295;
  }
  function noiseLocal(nx, ny){
    const ix = Math.floor(nx), iy = Math.floor(ny);
    const fx = nx - ix, fy = ny - iy;
    const a = rndLocal(ix + iy*57);
    const b = rndLocal(ix+1 + iy*57);
    const c = rndLocal(ix + (iy+1)*57);
    const d = rndLocal(ix+1 + (iy+1)*57);
    const lerp = (u,v,t) => u + (v-u) * t;
    const u = lerp(a,b,fx);
    const v = lerp(c,d,fx);
    return lerp(u,v,fy);
  }
  // sample the hemisphere with a stride to save time
  for(let yy = -yRadius; yy<=0; yy+=2){
    const row = Math.floor(xRadius * Math.sqrt(1 - (yy*yy) / (yRadius*yRadius)));
    for(let xx = -row; xx<=row; xx+=2){
      const pxX = Math.round(centerX + xx);
      const pxY = Math.round( ( (player && player.y) ? Math.round(player.y + 10) : (LOGICAL_HEIGHT - EARTH_HEIGHT + 10) ) + yy - yRadius);
      const s1 = noiseLocal(pxX * 0.06, pxY * 0.06);
      const s2 = noiseLocal(pxX * 0.12, pxY * 0.12) * 0.6;
      const s3 = noiseLocal(pxX * 0.28, pxY * 0.28) * 0.3;
      const v = s1 * 0.7 + s2 + s3;
      const vNorm = v / 1.6;
      vals.push(vNorm);
    }
  }
  if(vals.length === 0){ earthThreshold = 0.3; return; }
  vals.sort((a,b)=>a-b);
  // threshold such that approximately targetFraction of samples are above it
  const idx = Math.floor((1 - targetFraction) * vals.length);
  earthThreshold = vals[ Math.min(Math.max(0, idx), vals.length - 1) ];
}

function initStars(){
  stars = [];
  for(let i=0;i<60;i++){
    stars.push({x: Math.random()*LOGICAL_WIDTH, y: Math.random()*LOGICAL_HEIGHT, s: Math.random()*1.5+0.5, tw: Math.random()*1000});
  }
}

function spawnAsteroid(){
  // asteroid radius proportional to logical size (reduced further to make asteroids smaller)
  const minR = Math.max(2, Math.round(LOGICAL_WIDTH * 0.02));
  const maxR = Math.max(minR + 1, Math.round(LOGICAL_WIDTH * 0.045));
  const r = Math.floor(Math.random() * (maxR - minR + 1)) + minR;
  const x = r + Math.random() * (LOGICAL_WIDTH - r*2);
  // keep speeds similar but give a slight size-based variation
  const speed = Math.max(8, 12 + Math.random()*24 - (r * 0.6)); // Balanced speed (8-36)
  asteroids.push({x,y: -r, r, speed, angle: Math.random()*Math.PI*2, rotSpeed: (Math.random()-0.5)*1.2});
}

function update(dt){
  if(gameOver || !gameStarted) return;

  // Player movement (A/D keys)
  if(keys['a']) player.x -= player.speed * dt;
  if(keys['d']) player.x += player.speed * dt;
  // clamp
  player.x = Math.max(player.w/2, Math.min(LOGICAL_WIDTH - player.w/2, player.x));

  // Shooting
  player.shootCooldown -= dt*1000;
  if(keys[' '] && player.shootCooldown <= 0){
    shoot();
    player.shootCooldown = 180; // ms
  }

  // Missiles
  for(let i=missiles.length-1;i>=0;i--){
    missiles[i].y -= missiles[i].speed * dt;
    if(missiles[i].y < -4) missiles.splice(i,1);
  }

  // Asteroids
  for(let i=asteroids.length-1;i>=0;i--){
    const a = asteroids[i];
    a.y += a.speed * dt;
    a.angle += a.rotSpeed * dt;

    // Check collision with earth (only when game has started and player is not invincible)
    if(a.y + a.r >= LOGICAL_HEIGHT - EARTH_HEIGHT){
      // hit earth (only register if game started and not invincible)
      if (gameStarted && !isInvincible) {
        hearts--;
      }
      // explosion particles
      createExplosion(a.x, LOGICAL_HEIGHT - EARTH_HEIGHT, Math.min(12, Math.floor(a.r*4)), '#ff8b6b');
      try{ SFX.playExplosion(); }catch(e){}
      asteroids.splice(i,1);
      if(hearts <= 0 && gameStarted){
        // GAME OVER - show timed quiz button
        gameOver = true;
        saveHighScore(score);
        stopCanvasGameOverFacts(); // Stop any previous rotation
        showGameOverWithQuiz();
      }
      continue;
    }

    // Check collision with missiles
    for(let j=missiles.length-1;j>=0;j--){
      if(rectCircleCollide(missiles[j], a)){
        // destroy both
        score += Math.max(10, Math.floor((10 - a.r) * 2) + 5);
        createExplosion(a.x, a.y, Math.min(18, Math.floor(a.r*6)), '#ffd166');
        try{ SFX.playHit(); }catch(e){}
        asteroids.splice(i,1);
        missiles.splice(j,1);
        break;
      }
    }
  }

  // Particles
  for(let i=particles.length-1;i>=0;i--){
    const p = particles[i];
    p.life -= dt*1000;
    if(p.life <= 0){ particles.splice(i,1); continue; }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += p.g * dt;
  }

  // Spawn logic (only when game is started)
  if (gameStarted) {
    spawnTimer -= dt*1000;
    if(spawnTimer <= 0){
      spawnAsteroid();
      spawnTimer = 600 + Math.random()*1000; // Balanced spawn rate (600-1600ms)
    }
  }

  // Stars twinkle
  for(let s of stars){
    s.tw -= dt*1000;
    if(s.tw <= 0){ s.tw = 500 + Math.random()*1000; s.s = Math.random()*1.6+0.4; }
  }
  
  // Update invincibility timer
  if (isInvincible) {
    invincibilityTimer += dt * 1000;
    if (invincibilityTimer >= INVINCIBILITY_DURATION) {
      isInvincible = false;
      invincibilityTimer = 0;
    }
  }
}

function rectCircleCollide(rect, circle){
  // rect: {x,y,w,h}, circle: {x,y,r}
  const rx = rect.x - rect.w/2;
  const ry = rect.y - rect.h/2;
  const closestX = clamp(circle.x, rx, rx + rect.w);
  const closestY = clamp(circle.y, ry, ry + rect.h);
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  return (dx*dx + dy*dy) < (circle.r * circle.r);
}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}

function shoot(){
  // limit active missiles
  if(missiles.length > 4) return;
  missiles.push({x: player.x, y: player.y - player.h/2 -1, w:2, h:6, speed: 180});
  try{ SFX.playShot(); }catch(e){}
}

function createExplosion(x,y,count,color){
  for(let i=0;i<count;i++){
    const angle = Math.random()*Math.PI*2;
    const speed = Math.random()*40 + 20;
    particles.push({x,y,vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed - 20, g: 60, life: 400 + Math.random()*400, col: color, size: Math.random()*2+0.8});
  }
}

function draw(){
  // Clear (fill space)
  ctx.fillStyle = '#000';
  ctx.fillRect(0,0,px(LOGICAL_WIDTH), px(LOGICAL_HEIGHT));

  // Stars
  // subtle drift and twinkle for stars
  for(let s of stars){
    const drift = Math.sin((Date.now() + s.tw) * 0.0006 + s.x) * 0.2;
    const sy = s.y + drift;
    const shade = Math.floor(200 + s.s*30).toString(16).padStart(2,'0');
    const col = `#${shade}${shade}ff`;
    drawPixelRect(s.x, sy, s.s, s.s, col);
  }

  // Earth (pixelated band)
  // Earth (large pixel hemisphere drawn visually; collision still uses EARTH_HEIGHT)
  drawEarth();

  // Missiles
  for(let m of missiles){
    // main missile body (red laser)
    drawPixelRect(m.x - m.w/2, m.y - m.h/2, m.w, m.h, '#ff5252');
    // glowing tip and slight pulse (red)
    const pulse = 0.6 + 0.4 * Math.sin(Date.now() * 0.02 + m.x);
    const glowCol = `rgba(255,100,100,${pulse})`;
    ctx.fillStyle = glowCol;
    ctx.fillRect(px(m.x - 2), px(m.y - m.h/2 -2), px(4), px(2));
    // small bright pixel
    drawPixelRect(m.x - 1, m.y - m.h/2 -1, 1, 1, '#fff1f1');
  }

  // Asteroids (pixel-art textured)
  for(let a of asteroids){
    drawAsteroid(a);
  }

  // Player ship (simple pixel ship) centered at player.x
  drawShip(player.x, player.y);
  // thruster flame (visual only) - let drawThruster compute correct Y
  drawThruster(player.x, player.y);

  // Particles
  for(let p of particles){
    drawPixelRect(p.x, p.y, p.size, p.size, p.col);
  }

  // subtle scanlines overlay to look retro (thin horizontal lines)
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  for(let y=0;y<LOGICAL_HEIGHT; y+=2){
    ctx.fillRect(px(0), px(y), px(LOGICAL_WIDTH), px(1));
  }

  // HUD: hearts (top-left) and score (top-right)
  // Hearts - only show remaining hearts (they disappear when Earth is hit by meteors)
  for(let i=0;i<hearts;i++){
    const hx = 4 + i*8;
    const hy = 6;
    drawHeart(hx, hy, '#ff6b6b');
  }
  // Score
  drawText(`SCORE ${score}`, LOGICAL_WIDTH - 6, 10, '#9ef3ff', 6, 'right');
  
  // Invincibility indicator
  if (isInvincible && gameStarted) {
    const timeLeft = Math.ceil((INVINCIBILITY_DURATION - invincibilityTimer) / 1000);
    drawText(`INVINCIBLE: ${timeLeft}s`, LOGICAL_WIDTH / 2, 10, '#5ef2ff', 5, 'center');
  }

  // Instructions: show controls with icons description
  drawText('Move: ARROW KEYS / A & D', 4, 18, '#bfefff', 5, 'left');
  drawText('Shoot: SPACE / LEFT CLICK', 4, 24, '#bfefff', 5, 'left');

  // Game Over overlay - only show when quiz popup is not active
  if(gameOver && !gameOverScreenActive){
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(px(10), px(80), px(LOGICAL_WIDTH-20), px(80));
    // Layout: compute even vertical spacing (40-60 CSS px) converted to logical coords
    const overlayTop = 80;
    const overlayH = 80;
    // determine CSS px spacing target based on actual canvas size, clamp to [40,60]
    const canvasCssH = canvas.clientHeight || (LOGICAL_HEIGHT * PIXEL_SCALE);
    let spacingCss = Math.round(canvasCssH * 0.12);
    spacingCss = Math.max(40, Math.min(60, spacingCss));
    // convert spacing to logical pixels (approx)
    const spacingLogical = Math.max(4, Math.round(spacingCss / PIXEL_SCALE));

    // Font size hierarchy (logical font sizes)
    const titleSize = 9;   // largest
    const finalSize = 6;   // medium
    const didYouKnowSize = 5; // medium-small
    const factSize = 4;    // small
    const restartSize = 4; // small
    const factLineHeight = 1.1;

    // prepare fact lines and ensure rotation timing with fade animation
    let factLines = 0;
    if(gameOverFactNextChange > 0){
      const now = performance.now();
      if(now >= gameOverFactNextChange){
        // Fade out current fact
        if(gameOverFactOpacity > 0){
          gameOverFactFadingIn = false;
          gameOverFactOpacity = Math.max(0, gameOverFactOpacity - FACT_FADE_SPEED * 2);
        } else {
          // Change to next fact and start fading in
          gameOverFactIndex = (gameOverFactIndex + 1) % FUN_FACTS.length;
          gameOverFactNextChange = now + 5000 + Math.floor(Math.random()*2000);
          gameOverFactFadingIn = true;
        }
      } else {
        // Fade in current fact
        if(gameOverFactFadingIn && gameOverFactOpacity < 1){
          gameOverFactOpacity = Math.min(1, gameOverFactOpacity + FACT_FADE_SPEED);
        }
      }
      
      const factText = FUN_FACTS[gameOverFactIndex];
      // measure wrapped lines but don't draw yet; drawWrappedText returns the line count
      // we'll draw in sequence after computing layout
      factLines = drawWrappedText(factText, LOGICAL_WIDTH/2, -9999, LOGICAL_WIDTH - 40, '#ffd166', factSize, 'center', factLineHeight);
    }

    // compute heights (logical) of each group
    const titleH = titleSize; // approx logical pixels
    const finalH = finalSize;
    const didYouKnowH = gameOverFactNextChange > 0 ? didYouKnowSize : 0;
    const factH = Math.max(0, factLines) * (factSize * factLineHeight);
    const restartH = restartSize;

    const groups = gameOverFactNextChange > 0 ? 5 : 3; // title, final, [didyouknow, fact,] restart
    const totalContentH = titleH + finalH + didYouKnowH + factH + restartH + spacingLogical * (groups - 1);

    // compute start Y (centered inside overlay rect)
    const startY = overlayTop + Math.round((overlayH - totalContentH) / 2);

    // draw elements in order with even spacing
    let cursorY = startY;
    drawText('ASTEROID SMASH', LOGICAL_WIDTH/2, cursorY + titleH/2, '#ffd166', titleSize, 'center');
    cursorY += titleH + spacingLogical;

    const isNewHighScore = score >= highScore && score > 0;
    const scoreText = isNewHighScore ? `NEW HIGH SCORE: ${score}!` : `FINAL SCORE: ${score}`;
    drawText(scoreText, LOGICAL_WIDTH/2, cursorY + finalH/2, isNewHighScore ? '#5ef2ff' : '#ffd166', finalSize, 'center');
    cursorY += finalH + spacingLogical;

    // now draw the "Did you know?" label and fact block (may be multiple lines)
    if(gameOverFactNextChange > 0){
      // Draw "Did you know?" label (always visible)
      drawText('Did you know?', LOGICAL_WIDTH/2, cursorY + didYouKnowH/2, '#5ef2ff', didYouKnowSize, 'center');
      cursorY += didYouKnowH + Math.max(2, Math.floor(spacingLogical * 0.3)); // Small gap between label and fact
      
      // Draw the fact text with fade animation
      const factText = FUN_FACTS[gameOverFactIndex];
      ctx.save();
      ctx.globalAlpha = gameOverFactOpacity;
      // drawWrappedText expects y as top-of-first-line; use cursorY
      drawWrappedText(factText, LOGICAL_WIDTH/2, cursorY, LOGICAL_WIDTH - 40, '#ffd166', factSize, 'center', factLineHeight);
      ctx.restore();
    }
    cursorY += factH + spacingLogical;

    drawText('PRESS R TO RESTART | E FOR MENU', LOGICAL_WIDTH/2, cursorY + restartH/2, '#5ef2ff', restartSize, 'center');
  }
}

function drawShip(cx, cy){
  // Apply blinking effect during invincibility
  if (isInvincible) {
    const blinkRate = Math.floor(Date.now() / 100) % 2;
    if (blinkRate === 0) {
      ctx.globalAlpha = 0.3;
    }
  }
  
  // larger attachment-style ship (red/white), scaled visually
  const scale = 2.5; // visual scale factor (larger for wider logical resolution)
  // if an external ship image is provided, draw it centered; prefer image assets
  if(assets['ship']){
    const img = assets['ship'];
    const w = img.width / PIXEL_SCALE;
    const h = img.height / PIXEL_SCALE;
    ctx.drawImage(img, px(Math.round(cx - w/2)), px(Math.round(cy - h/2)), px(w), px(h));
    ctx.globalAlpha = 1.0; // Reset alpha
    return;
  }
  const pattern = [
    {x:0,y:-3,c:'#8b2b2b'},
    {x:-1,y:-2,c:'#ffffff'},{x:0,y:-2,c:'#ffffff'},{x:1,y:-2,c:'#ffffff'},
    {x:-2,y:-1,c:'#ff9f9f'},{x:-1,y:-1,c:'#ffffff'},{x:0,y:-1,c:'#ffffff'},{x:1,y:-1,c:'#ffffff'},{x:2,y:-1,c:'#ff9f9f'},
    {x:-3,y:0,c:'#b22f2f'},{x:-2,y:0,c:'#ff9f1c'},{x:-1,y:0,c:'#ffffff'},{x:0,y:0,c:'#ffffff'},{x:1,y:0,c:'#ffffff'},{x:2,y:0,c:'#ff9f1c'},{x:3,y:0,c:'#b22f2f'},
    {x:-2,y:1,c:'#b22f2f'},{x:-1,y:1,c:'#ff4f4f'},{x:0,y:1,c:'#ff4f4f'},{x:1,y:1,c:'#ff4f4f'},{x:2,y:1,c:'#b22f2f'},
    {x:0,y:2,c:'#ffb86b'}
  ];
  // draw scaled pixels (visual only: doesn't change player.w/h collision)
  for(let p of pattern){
    const sx = Math.round(cx + p.x * scale);
    const sy = Math.round(cy + p.y * scale);
    const size = Math.max(1, Math.round(scale));
    drawPixelRect(sx, sy, size, size, p.c);
  }
  ctx.globalAlpha = 1.0; // Reset alpha
}

function drawThruster(cx, cy){
  // simple flickering flame under the ship (visual only)
  // If an external ship image is present, position thruster slightly below the image center
  let baseY = cy + 3;
  let offsets = [-1, 0, 1];
  if(assets['ship']){
    const img = assets['ship'];
    // image is in canvas pixels; compute logical half-height and width
    const imgH = (img.height / PIXEL_SCALE);
    const imgW = (img.width / PIXEL_SCALE);
    // thruster appears in the middle of the png, so push it down toward bottom
    baseY = cy + Math.round(imgH / 3);
    // compute side engine offsets from the image width
    const dx = Math.max(1, Math.round(imgW / 5));
    offsets = [-dx, 0, dx];
  }
  const t = Date.now() * 0.01;
  // Draw a flickering flame for each engine (left, center, right)
  for(let ei=0; ei<offsets.length; ei++){
    const ex = offsets[ei];
    // Slightly shorter flames and reduced horizontal jitter for a tighter look
    const flick = Math.floor(1 + Math.abs(Math.sin(t + ei)) * 2);
    for(let i=0;i<flick;i++){
      const ox = Math.round(cx + ex + (Math.random()*2-1) * 1);
      const oy = Math.round(baseY + i);
      const col = i % 2 === 0 ? '#ffb86b' : '#ff6b6b';
      drawPixelRect(ox, oy, 1, 1, col);
    }
  }
}

function drawHeart(x,y,color){
  // More heart-shaped pixel art (5x5-ish) with light highlight
  const pattern = [
    {x:1,y:0,c:color},{x:2,y:0,c:color},{x:4,y:0,c:color},{x:5,y:0,c:color},
    {x:0,y:1,c:color},{x:3,y:1,c:color},{x:6,y:1,c:color},
    {x:0,y:2,c:color},{x:6,y:2,c:color},
    {x:1,y:3,c:color},{x:2,y:3,c:color},{x:3,y:3,c:color},{x:4,y:3,c:color},{x:5,y:3,c:color},
    // highlight
    {x:2,y:1,c:'#ffd6d6'},{x:3,y:2,c:'#ffd6d6'}
  ];
  // allow PNG heart override
  if(assets['heart']){
    const img = assets['heart'];
    ctx.drawImage(img, px(x), px(y), px(7), px(7));
    return;
  }
  for(const p of pattern){
    drawPixelRect(x + p.x, y + p.y, 1, 1, p.c);
  }
}

// Draw a large pixel hemisphere Earth at the bottom for visual effect (non-colliding)
function drawEarth(){
  const centerX = LOGICAL_WIDTH/2;
  // compute radii proportionally to logical resolution
  const yRadius = Math.round(LOGICAL_HEIGHT * 0.33); // about one third of logical height
  const xRadius = Math.round(LOGICAL_WIDTH * 0.55); // wide hemisphere across bottom
  // Position the hemisphere so its top sits a bit below the player's ship (visual only)
  const topBelowShip = (player && player.y) ? Math.round(player.y + 10) : (LOGICAL_HEIGHT - EARTH_HEIGHT + 10);
  const baseY = topBelowShip + 2 * yRadius; // compute base such that top = topBelowShip
  // simple palette
  const ocean = '#2c6fa8';
  const land = '#63a33f';
  const shore = '#4f8b2f';
  // deterministic pseudo-random (32-bit) using seed
  function rnd(x){
    let v = (x ^ earthSeed) >>> 0;
    v = (v + 0x6D2B79F5) >>> 0;
    v = Math.imul(v ^ (v >>> 15), 1 | v) >>> 0;
    return (v >>> 0) / 4294967295;
  }
  // smooth value noise
  function noise(nx, ny){
    const ix = Math.floor(nx), iy = Math.floor(ny);
    const fx = nx - ix, fy = ny - iy;
    const a = rnd(ix + iy*57);
    const b = rnd(ix+1 + iy*57);
    const c = rnd(ix + (iy+1)*57);
    const d = rnd(ix+1 + (iy+1)*57);
    const lerp = (u,v,t) => u + (v-u) * t;
    const u = lerp(a,b,fx);
    const v = lerp(c,d,fx);
    return lerp(u,v,fy);
  }
  // If user provided an earth image, draw it stretched across the bottom
  if(assets['earth']){
    const img = assets['earth'];
    // desired draw width equals 2*xRadius, height equals yRadius
    const drawW = xRadius * 2;
    const drawH = yRadius;
    ctx.drawImage(img, px(centerX - drawW/2), px(baseY - drawH), px(drawW), px(drawH));
    return;
  }

  // layered deterministic noise to create static landmasses
  for(let yy = -yRadius; yy<=0; yy++){
    const row = Math.floor(xRadius * Math.sqrt(1 - (yy*yy) / (yRadius*yRadius)));
    for(let xx = -row; xx<=row; xx++){
      const pxX = Math.round(centerX + xx);
      const pxY = Math.round(baseY + yy - yRadius);
      // sample noise at a few scales
      const s1 = noise(pxX * 0.06, pxY * 0.06);
      const s2 = noise(pxX * 0.12, pxY * 0.12) * 0.6;
      const s3 = noise(pxX * 0.28, pxY * 0.28) * 0.3;
      // normalize by the maximum possible contribution (0.7 + 0.6 + 0.3 = 1.6)
      const v = s1 * 0.7 + s2 + s3;
  const vNorm = v / 1.6;
  // use computed earthThreshold to reach target land coverage
  const col = vNorm > earthThreshold ? land : ocean;
      drawPixelRect(pxX, pxY, 1, 1, col);
    }
  }
  // rim
  for(let x=centerX - xRadius; x<=centerX + xRadius; x+=1){
    const yy = Math.round(baseY - yRadius - 1);
    drawPixelRect(x, yy, 1, 1, shore);
  }
}

// Draw a textured asteroid using a small pixel template scaled to radius
function drawAsteroid(a){
  // choose a base palette of browns/oranges
  // prefer PNG asteroid if supplied (draw centered and scaled)
  if(assets['asteroid']){
    const img = assets['asteroid'];
    const s = (a.r*2) / (img.width / PIXEL_SCALE);
    const w = img.width / PIXEL_SCALE * s;
    const h = img.height / PIXEL_SCALE * s;
    ctx.drawImage(img, px(Math.round(a.x - w/2)), px(Math.round(a.y - h/2)), px(w), px(h));
    return;
  }
  const palette = ['#d67a40','#c85b36','#b2402a','#8b2f22','#5a1d16'];
  const ox = Math.round(a.x);
  const oy = Math.round(a.y);
  const r = Math.max(3, Math.round(a.r));

  // We'll use a simple diamond-shaped pixel map for a circular feel
  for(let yy = -r; yy<=r; yy++){
    const rowWidth = Math.floor(Math.sqrt(r*r - yy*yy));
    for(let xx = -rowWidth; xx<=rowWidth; xx++){
      // shade based on position to simulate lighting
      const nx = xx + r;
      const ny = yy + r;
      const shadeIdx = Math.floor(((nx + ny) / (r*2)) * (palette.length - 1));
      const col = palette[ clamp(shadeIdx, 0, palette.length-1) ];
      drawPixelRect(ox + xx, oy + yy, 1, 1, col);
    }
  }

  // add darker rim for depth
  for(let t=0;t<2;t++){
    const angle = t * Math.PI/3 + (a.angle || 0);
    const pxOff = Math.round(Math.cos(angle) * (r - 1));
    const pyOff = Math.round(Math.sin(angle) * (r - 1));
    drawPixelRect(ox + pxOff, oy + pyOff, 1, 1, '#3f1f12');
  }

  // subtle crater shadows (non-colliding detail)
  const craterCount = Math.max(1, Math.floor(r/2));
  for(let i=0;i<craterCount;i++){
    const cx = Math.round(ox + (Math.random()*2-1) * (r-2));
    const cy = Math.round(oy + (Math.random()*2-1) * (r-2));
    drawPixelRect(cx, cy, 1, 1, '#6b2f1f');
    drawPixelRect(cx+1, cy+1, 1, 1, '#8b3f27');
  }
}

// drawEarth already exists; add image override handling in it
// (we'll simply draw the provided earth image stretched across the bottom)

function loop(now){
  const dt = Math.min(0.05, (now - lastTime)/1000);
  lastTime = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

// Input
// Input (normalize keys to lowercase so CapsLock/Shift doesn't change behavior)
window.addEventListener('keydown', (e)=>{
  const k = (e.key || '').toString().toLowerCase();
  // initialize/resume audio on first user interaction (some browsers require gesture)
  try{ SFX.init(); SFX.resume(); }catch(e){}
  if(k === 'm'){
    try{ SFX.toggleMute(); }catch(e){}
  }
  if(k === 'r'){
    if(gameOver) {
      saveHighScore(score);
      closeQuiz();
      stopCanvasGameOverFacts(); // Stop fact rotation when restarting
      init();
      gameStarted = true; // Make sure game starts after restart
    }
  }
  if(k === 'e'){
    if(gameOver) {
      saveHighScore(score);
      closeQuiz();
      stopCanvasGameOverFacts(); // Stop fact rotation
      init();
      gameStarted = false; // Don't start game, just show menu
      // Show the menu
      const menu = document.getElementById('menuOverlay');
      if(menu) {
        menu.style.display = 'flex';
        startFactRotation('menuFact'); // Restart menu fact rotation
      }
    }
  }
  // Support arrow keys for movement
  if(k === 'arrowleft') keys['a'] = true;
  if(k === 'arrowright') keys['d'] = true;
  
  keys[k] = true;
  // prevent default for space to avoid page scrolling
  if(k === ' ') e.preventDefault();
});
window.addEventListener('keyup', (e)=>{ 
  const k = (e.key || '').toString().toLowerCase();
  if(k === 'arrowleft') keys['a'] = false;
  if(k === 'arrowright') keys['d'] = false;
  keys[k] = false;
});

// Mouse click to shoot
canvas.addEventListener('click', (e) => {
  if (!gameStarted || gameOver) return;
  try { SFX.init(); SFX.resume(); } catch(e) {}
  if (player.shootCooldown <= 0) {
    shoot();
    player.shootCooldown = 180;
  }
});

// Start
init();
requestAnimationFrame(loop);

// Menu wiring (DOM may not exist if script loaded earlier)
window.addEventListener('load', ()=>{
  const menu = document.getElementById('menuOverlay');
  const play = document.getElementById('playBtn');
  const exit = document.getElementById('exitBtn');
  if(play) play.addEventListener('click', ()=>{
    // hide menu and (re)start game
    if(menu) menu.style.display = 'none';
    init();
    gameStarted = true; // Set to true AFTER init() to properly start the game
    // resume audio if needed
    try{ SFX.init(); SFX.resume(); }catch(e){}
  });
  if(exit) exit.addEventListener('click', ()=>{
    // try to close the tab; many browsers block this if not opened by script
    try{ window.close(); }
    catch(e){ alert('Close the tab using Ctrl+W (or close window).'); }
  });
});

// --- Fun facts rotating feature ---
const FUN_FACTS = [
  'Asteroids are leftover rock from the solar system\'s formation, mostly found between Mars and Jupiter.',
  'The asteroid belt contains millions of objects, but their total mass is less than the Moon\'s.',
  'Ceres is the largest object in the asteroid belt and is classified as a dwarf planet (~940 km across).',
  'Some asteroids are \"rubble piles\": loose collections of rock held together by gravity.',
  'Near-Earth asteroids occasionally cross our path — these are monitored for impact risk.',
  'Meteorites are pieces of asteroids or comets that survive passage through Earth\'s atmosphere.',
  'Jupiter\'s gravity helped shape the asteroid belt and creates gaps called Kirkwood gaps.',
  'Trojans are asteroids that share a planet\'s orbit near stable Lagrange points.',
  'Missions like OSIRIS-REx and Hayabusa returned samples from asteroids Bennu and Ryugu.',
  'Many asteroids have tiny moons — gravity works at every size in space.',
  'Asteroid speeds relative to Earth are typically tens of kilometers per second.',
  'Some primitive asteroids contain water-rich minerals and organic molecules.',
  'Metal-rich asteroids contain nickel and iron — potential targets for future mining.',
  'Large impacts have shaped Earth\'s history; one likely caused the dinosaur extinction ~66 million years ago.',
  'Space is mostly empty: asteroids are far apart, so collisions are rare on human timescales.'
];
let factIndex = 0;
let factTimer = null;
function showFactIn(element){
  if(!element) return;
  // choose next fact sequentially for variety
  factIndex = (factIndex + 1) % FUN_FACTS.length;
  element.textContent = FUN_FACTS[factIndex];
  element.classList.remove('visible');
  // trigger fade in after a tick
  requestAnimationFrame(()=>{ element.classList.add('visible'); });
}
function startFactRotation(containerId){
  const el = document.getElementById(containerId);
  if(!el) return;
  // show immediately
  showFactIn(el);
  // clear any previous timer
  if(factTimer) clearInterval(factTimer);
  // rotate every 5-7 seconds randomly
  factTimer = setInterval(()=>{
    // fade out then change text then fade in
    el.classList.remove('visible');
    setTimeout(()=> showFactIn(el), 300);
  }, 5000 + Math.floor(Math.random()*2000));
}
function stopFactRotation(){ if(factTimer) clearInterval(factTimer); factTimer = null; }

// --- Space Quiz Questions for Kids ---
const QUIZ_QUESTIONS = [
  {
    question: "What is the largest planet in our solar system?",
    answers: ["Jupiter", "Saturn", "Earth", "Mars"],
    correct: 0
  },
  {
    question: "How many planets are in our solar system?",
    answers: ["7", "8", "9", "10"],
    correct: 1
  },
  {
    question: "What is the closest star to Earth?",
    answers: ["Alpha Centauri", "Sirius", "The Sun", "Polaris"],
    correct: 2
  },
  {
    question: "Which planet is known as the 'Red Planet'?",
    answers: ["Venus", "Mars", "Jupiter", "Mercury"],
    correct: 1
  },
  {
    question: "What is the name of Earth's natural satellite?",
    answers: ["Luna (The Moon)", "Titan", "Europa", "Phobos"],
    correct: 0
  },
  {
    question: "Which planet has the most moons?",
    answers: ["Jupiter", "Saturn", "Mars", "Neptune"],
    correct: 1
  },
  {
    question: "What is the hottest planet in our solar system?",
    answers: ["Mercury", "Venus", "Mars", "Jupiter"],
    correct: 1
  },
  {
    question: "What do we call a group of stars that form a pattern?",
    answers: ["Galaxy", "Constellation", "Nebula", "Comet"],
    correct: 1
  },
  {
    question: "How long does it take Earth to orbit the Sun?",
    answers: ["24 hours", "30 days", "365 days", "12 months exactly"],
    correct: 2
  },
  {
    question: "What is a shooting star actually?",
    answers: ["A falling star", "A meteor", "A comet", "A satellite"],
    correct: 1
  },
  {
    question: "Which planet is famous for its beautiful rings?",
    answers: ["Jupiter", "Uranus", "Saturn", "Neptune"],
    correct: 2
  },
  {
    question: "What is the galaxy that contains our solar system?",
    answers: ["Andromeda", "Milky Way", "Whirlpool", "Sombrero"],
    correct: 1
  },
  {
    question: "What is the smallest planet in our solar system?",
    answers: ["Mars", "Mercury", "Venus", "Pluto"],
    correct: 1
  },
  {
    question: "What causes the seasons on Earth?",
    answers: ["Distance from Sun", "Earth's tilt", "Solar flares", "Moon phases"],
    correct: 1
  },
  {
    question: "What is the name of the first human to walk on the Moon?",
    answers: ["Buzz Aldrin", "Neil Armstrong", "Yuri Gagarin", "John Glenn"],
    correct: 1
  },
  {
    question: "Which planet spins on its side?",
    answers: ["Saturn", "Neptune", "Uranus", "Jupiter"],
    correct: 2
  },
  {
    question: "What do we call the path a planet takes around the Sun?",
    answers: ["Rotation", "Orbit", "Revolution", "Axis"],
    correct: 1
  },
  {
    question: "What is the Great Red Spot on Jupiter?",
    answers: ["A crater", "A giant storm", "A mountain", "A volcano"],
    correct: 1
  },
  {
    question: "How many Earth days does it take the Moon to orbit Earth?",
    answers: ["7 days", "14 days", "27-28 days", "30 days"],
    correct: 2
  },
  {
    question: "What is the center of our solar system?",
    answers: ["Earth", "Jupiter", "The Sun", "The Moon"],
    correct: 2
  }
];

// --- High Score Management ---
function loadHighScore() {
  try {
    const saved = localStorage.getItem('asteroidSmashHighScore');
    if (saved) {
      highScore = parseInt(saved, 10) || 0;
    }
  } catch (e) {
    console.warn('Could not load high score:', e);
  }
  updateHighScoreDisplay();
}

function saveHighScore(newScore) {
  if (newScore > highScore) {
    highScore = newScore;
    try {
      localStorage.setItem('asteroidSmashHighScore', highScore.toString());
    } catch (e) {
      console.warn('Could not save high score:', e);
    }
    updateHighScoreDisplay();
  }
}

function updateHighScoreDisplay() {
  const highScoreEl = document.getElementById('highScoreText');
  if (highScoreEl) {
    highScoreEl.textContent = `High Score: ${highScore}`;
  }
}

// --- Quiz System ---
let quizActive = false;
let currentQuizQuestion = null;
let quizCountdown = 5; // 5 seconds to press the button
let quizCountdownInterval = null;
let gameOverScreenActive = false;

function showGameOverWithQuiz() {
  gameOverScreenActive = true;
  quizCountdown = 5;
  
  const overlay = document.getElementById('quizOverlay');
  const gameOverTitle = document.getElementById('gameOverTitle');
  const quizTimer = document.getElementById('quizTimer');
  const quizTimerBtn = document.getElementById('quizTimerBtn');
  const quizTitle = document.getElementById('quizTitle');
  const quizSubtitle = document.getElementById('quizSubtitle');
  const questionEl = document.getElementById('quizQuestion');
  const answersEl = document.getElementById('quizAnswers');
  const feedbackEl = document.getElementById('quizFeedback');
  
  if (!overlay || !gameOverTitle || !quizTimer || !quizTimerBtn) return;
  
  // Show game over screen
  overlay.style.display = 'flex';
  gameOverTitle.style.display = 'block';
  quizTimer.style.display = 'block';
  questionEl.style.display = 'none';
  answersEl.style.display = 'none';
  feedbackEl.style.display = 'none';
  
  // Update timer button
  quizTimerBtn.textContent = `Answer Quiz for Extra Life (${quizCountdown}s)`;
  quizTimerBtn.disabled = false;
  quizTimerBtn.className = 'quiz-timer-btn';
  
  // Clear any previous countdown
  if (quizCountdownInterval) {
    clearInterval(quizCountdownInterval);
  }
  
  // Start countdown
  quizCountdownInterval = setInterval(() => {
    quizCountdown--;
    if (quizCountdown <= 0) {
      clearInterval(quizCountdownInterval);
      gameOverScreenActive = false; // Allow canvas game over to show
      // Hide the overlay after 5 seconds
      overlay.style.display = 'none';
      // Start the canvas game over facts rotation
      startCanvasGameOverFacts();
    } else {
      quizTimerBtn.textContent = `Answer Quiz for Extra Life (${quizCountdown}s)`;
    }
  }, 1000);
  
  // Button click handler
  quizTimerBtn.onclick = () => {
    if (quizCountdown > 0) {
      clearInterval(quizCountdownInterval);
      showQuiz();
    }
  };
}

function showQuiz() {
  if (quizActive) return;
  quizActive = true;
  gameOverScreenActive = false;
  
  // Pick a random question
  currentQuizQuestion = QUIZ_QUESTIONS[Math.floor(Math.random() * QUIZ_QUESTIONS.length)];
  
  const overlay = document.getElementById('quizOverlay');
  const gameOverTitle = document.getElementById('gameOverTitle');
  const quizTimer = document.getElementById('quizTimer');
  const quizTitle = document.getElementById('quizTitle');
  const quizSubtitle = document.getElementById('quizSubtitle');
  const questionEl = document.getElementById('quizQuestion');
  const answersEl = document.getElementById('quizAnswers');
  const feedbackEl = document.getElementById('quizFeedback');
  
  if (!overlay || !questionEl || !answersEl || !feedbackEl) return;
  
  // Hide game over screen, show quiz
  gameOverTitle.style.display = 'none';
  quizTimer.style.display = 'none';
  questionEl.style.display = 'block';
  answersEl.style.display = 'flex';
  feedbackEl.style.display = 'block';
  
  // Set question
  questionEl.textContent = currentQuizQuestion.question;
  
  // Clear previous answers and feedback
  answersEl.innerHTML = '';
  feedbackEl.textContent = '';
  feedbackEl.className = 'quiz-feedback';
  
  // Create answer buttons
  currentQuizQuestion.answers.forEach((answer, index) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-answer-btn';
    btn.textContent = `${String.fromCharCode(65 + index)}. ${answer}`;
    btn.onclick = () => handleQuizAnswer(index, btn);
    answersEl.appendChild(btn);
  });
}

function handleQuizAnswer(selectedIndex, button) {
  const answersEl = document.getElementById('quizAnswers');
  const feedbackEl = document.getElementById('quizFeedback');
  const allButtons = answersEl.querySelectorAll('.quiz-answer-btn');
  
  // Disable all buttons
  allButtons.forEach(btn => btn.disabled = true);
  
  const isCorrect = selectedIndex === currentQuizQuestion.correct;
  
  if (isCorrect) {
    // Correct answer!
    button.classList.add('correct');
    const encouragements = [
      'Excellent! You earned an extra heart!',
      'Nice work! +1 Heart!',
      'Great job! Extra life earned!',
      'Well done! You got it right!',
      'Awesome! +1 Heart!'
    ];
    const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
    feedbackEl.textContent = randomEncouragement;
    feedbackEl.className = 'quiz-feedback correct-feedback';
    
    // Give player an extra heart and invincibility
    hearts = Math.min(hearts + 1, 5); // Cap at 5 hearts max
    isInvincible = true;
    invincibilityTimer = 0;
    gameOver = false;
    
    // Close quiz after 2 seconds and resume game
    setTimeout(() => {
      closeQuiz();
    }, 2000);
    
  } else {
    // Wrong answer
    button.classList.add('incorrect');
    allButtons[currentQuizQuestion.correct].classList.add('correct');
    feedbackEl.textContent = `Not quite! The correct answer was: ${currentQuizQuestion.answers[currentQuizQuestion.correct]}`;
    feedbackEl.className = 'quiz-feedback incorrect-feedback';
    
    // Save high score
    saveHighScore(score);
    
    // Close quiz after 2 seconds and show canvas game over screen with facts
    setTimeout(() => {
      closeQuiz();
      gameOverScreenActive = false; // Show canvas game over
      startCanvasGameOverFacts(); // Start fact rotation
    }, 2000);
  }
}

function closeQuiz() {
  quizActive = false;
  gameOverScreenActive = false;
  if (quizCountdownInterval) {
    clearInterval(quizCountdownInterval);
    quizCountdownInterval = null;
  }
  const overlay = document.getElementById('quizOverlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}

// Start rotating facts on the menu when the page loads
window.addEventListener('load', ()=>{
  // Load high score
  loadHighScore();
  
  startFactRotation('menuFact');
  // start the canvas-based game-over fact rotation now that FUN_FACTS exists
  startCanvasGameOverFacts();
});

// When game over, show the fact inside the game-over overlay if present
function showGameOverFact(){
  const overlay = document.querySelector('.menu-overlay');
  if(!overlay) return;
  // ensure menuFact exists in DOM (we added it to index.html)
  const el = document.getElementById('menuFact');
  if(el){ showFactIn(el); }
}
