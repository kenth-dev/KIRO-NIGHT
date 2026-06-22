// Flappy Kiro - Enhanced Physics & Game Systems
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreBar = document.getElementById('score-bar');

// ============================================================
// PHYSICS CONSTANTS
// ============================================================
const PHYSICS = {
  gravity: 0.35,
  jumpForce: -6.8,
  terminalVelocityDown: 10,
  terminalVelocityUp: -9,
  momentumDamping: 0.98,
  interpolationFactor: 0.15
};

// ============================================================
// OBSTACLE GENERATION CONSTANTS
// ============================================================
const OBSTACLE = {
  pipeWidth: 60,
  baseGap: 160,
  minGap: 110,
  gapShrinkRate: 2,          // gap shrinks by this every 10 points
  baseSpeed: 2.5,
  maxSpeed: 5.5,
  speedIncreaseRate: 0.15,   // speed increase per 5 points
  spawnInterval: 1600,       // ms between pipe spawns
  minTopHeight: 70,
  minBottomSpace: 70
};

// ============================================================
// GAME STATE
// ============================================================
let gameState = 'menu'; // menu, playing, paused, gameover
let score = 0;
let highScore = parseInt(localStorage.getItem('flappyKiroHigh') || '0');
let lastPipeSpawn = 0;
let currentSpeed = OBSTACLE.baseSpeed;
let currentGap = OBSTACLE.baseGap;
let deltaTime = 0;
let lastFrameTime = performance.now();
let frameCount = 0;

// Invincibility
let invincible = false;
let invincibilityTimer = 0;
const INVINCIBILITY_DURATION = 60; // frames

// Screen shake
let shakeIntensity = 0;
let shakeDuration = 0;

// Score popup
let scorePopups = [];

// ============================================================
// GHOST CHARACTER
// ============================================================
const ghost = {
  x: 100,
  y: 320,
  width: 40,
  height: 40,
  velocity: 0,
  targetVelocity: 0,
  rotation: 0,
  // Hitbox inset (tighter than sprite for fair collision)
  hitboxInset: {
    top: 8,
    bottom: 6,
    left: 10,
    right: 10
  }
};

// ============================================================
// PARTICLES
// ============================================================
let particles = [];

function spawnTrailParticle() {
  particles.push({
    x: ghost.x + ghost.width * 0.3,
    y: ghost.y + ghost.height / 2 + (Math.random() - 0.5) * 10,
    vx: -1 - Math.random() * 1.5,
    vy: (Math.random() - 0.5) * 0.8,
    life: 1.0,
    decay: 0.02 + Math.random() * 0.02,
    size: 3 + Math.random() * 4,
    color: `hsl(${200 + Math.random() * 40}, 80%, 85%)`
  });
}

function spawnJumpBurst() {
  for (let i = 0; i < 6; i++) {
    particles.push({
      x: ghost.x + ghost.width / 2 + (Math.random() - 0.5) * 10,
      y: ghost.y + ghost.height,
      vx: (Math.random() - 0.5) * 2,
      vy: 1 + Math.random() * 2,
      life: 1.0,
      decay: 0.04 + Math.random() * 0.02,
      size: 2 + Math.random() * 3,
      color: 'rgba(255,255,255,0.9)'
    });
  }
}

function spawnCollisionBurst() {
  for (let i = 0; i < 15; i++) {
    const angle = (Math.PI * 2 * i) / 15;
    particles.push({
      x: ghost.x + ghost.width / 2,
      y: ghost.y + ghost.height / 2,
      vx: Math.cos(angle) * (2 + Math.random() * 3),
      vy: Math.sin(angle) * (2 + Math.random() * 3),
      life: 1.0,
      decay: 0.025 + Math.random() * 0.02,
      size: 4 + Math.random() * 5,
      color: `hsl(${0 + Math.random() * 40}, 90%, 60%)`
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= p.decay;
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

function drawParticles() {
  particles.forEach(p => {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

// ============================================================
// ASSETS
// ============================================================
const ghostImg = new Image();
ghostImg.src = 'assets/ghosty.png';

const jumpSound = new Audio('assets/jump.wav');
const gameOverSound = new Audio('assets/game_over.wav');

// Score sound - generate a quick beep with Web Audio API
let audioCtx = null;
function playScoreSound() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    osc.frequency.setValueAtTime(1100, audioCtx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.15);
  } catch (e) {}
}

function playSound(sound) {
  try {
    sound.currentTime = 0;
    sound.play();
  } catch (e) {}
}

// ============================================================
// PIPES
// ============================================================
let pipes = [];

function spawnPipe() {
  const gap = currentGap;
  const minTop = OBSTACLE.minTopHeight;
  const maxTop = canvas.height - gap - OBSTACLE.minBottomSpace;
  const topHeight = minTop + Math.random() * (maxTop - minTop);

  pipes.push({
    x: canvas.width,
    topHeight: topHeight,
    bottomY: topHeight + gap,
    scored: false
  });
}

// ============================================================
// CLOUDS (parallax layers)
// ============================================================
let clouds = [];
function initClouds() {
  clouds = [];
  // Back layer
  for (let i = 0; i < 4; i++) {
    clouds.push({
      x: Math.random() * canvas.width,
      y: Math.random() * (canvas.height * 0.5),
      width: 40 + Math.random() * 50,
      height: 20 + Math.random() * 12,
      speed: 0.2 + Math.random() * 0.3,
      opacity: 0.25 + Math.random() * 0.1
    });
  }
  // Mid layer
  for (let i = 0; i < 3; i++) {
    clouds.push({
      x: Math.random() * canvas.width,
      y: Math.random() * (canvas.height * 0.6),
      width: 70 + Math.random() * 60,
      height: 28 + Math.random() * 16,
      speed: 0.5 + Math.random() * 0.4,
      opacity: 0.4 + Math.random() * 0.15
    });
  }
  // Front layer
  for (let i = 0; i < 3; i++) {
    clouds.push({
      x: Math.random() * canvas.width,
      y: Math.random() * (canvas.height * 0.65),
      width: 100 + Math.random() * 80,
      height: 35 + Math.random() * 20,
      speed: 0.8 + Math.random() * 0.6,
      opacity: 0.55 + Math.random() * 0.15
    });
  }
}
initClouds();

// ============================================================
// DRAWING FUNCTIONS
// ============================================================

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#87CEEB');
  gradient.addColorStop(1, '#B0E0E6');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle sketch lines
  ctx.strokeStyle = 'rgba(100, 180, 220, 0.3)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 15; i++) {
    ctx.beginPath();
    const y = (frameCount * 0.2 + i * 45) % canvas.height;
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y + (Math.sin(frameCount * 0.01 + i) * 8));
    ctx.stroke();
  }

  // Clouds
  clouds.forEach(cloud => {
    ctx.fillStyle = `rgba(255, 255, 255, ${cloud.opacity})`;
    ctx.beginPath();
    ctx.roundRect(cloud.x, cloud.y, cloud.width, cloud.height, 15);
    ctx.fill();
  });
}

function updateClouds() {
  clouds.forEach(cloud => {
    cloud.x -= cloud.speed;
    if (cloud.x + cloud.width < 0) {
      cloud.x = canvas.width + 10;
      cloud.y = Math.random() * (canvas.height * 0.6);
    }
  });
}

function drawPipe(x, y, height, isTop) {
  const bodyGradient = ctx.createLinearGradient(x, 0, x + OBSTACLE.pipeWidth, 0);
  bodyGradient.addColorStop(0, '#2E8B2E');
  bodyGradient.addColorStop(0.5, '#3CB043');
  bodyGradient.addColorStop(1, '#2E7D2E');
  ctx.fillStyle = bodyGradient;

  if (isTop) {
    ctx.fillRect(x, 0, OBSTACLE.pipeWidth, height);
    // Cap
    ctx.fillStyle = '#1B5E1B';
    ctx.fillRect(x - 5, height - 22, OBSTACLE.pipeWidth + 10, 22);
    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(x + 8, 0, 8, height - 22);
  } else {
    ctx.fillRect(x, y, OBSTACLE.pipeWidth, height);
    // Cap
    ctx.fillStyle = '#1B5E1B';
    ctx.fillRect(x - 5, y, OBSTACLE.pipeWidth + 10, 22);
    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(x + 8, y + 22, 8, height - 22);
  }
}

function drawGhost() {
  ctx.save();
  ctx.translate(ghost.x + ghost.width / 2, ghost.y + ghost.height / 2);

  // Smooth rotation based on velocity
  const targetRotation = Math.min(Math.max(ghost.velocity * 4, -25), 70);
  ghost.rotation += (targetRotation - ghost.rotation) * PHYSICS.interpolationFactor;
  ctx.rotate((ghost.rotation * Math.PI) / 180);

  // Invincibility flash
  if (invincible && Math.floor(invincibilityTimer / 4) % 2 === 0) {
    ctx.globalAlpha = 0.5;
  }

  if (ghostImg.complete && ghostImg.naturalWidth > 0) {
    ctx.drawImage(ghostImg, -ghost.width / 2, -ghost.height / 2, ghost.width, ghost.height);
  } else {
    // Fallback ghost
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, -5, 15, Math.PI, 0);
    ctx.lineTo(15, 10);
    ctx.lineTo(10, 5);
    ctx.lineTo(5, 10);
    ctx.lineTo(0, 5);
    ctx.lineTo(-5, 10);
    ctx.lineTo(-10, 5);
    ctx.lineTo(-15, 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-5, -5, 3, 0, Math.PI * 2);
    ctx.arc(5, -5, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}

// Score popups
function spawnScorePopup(x, y, text) {
  scorePopups.push({
    x, y,
    text: text,
    life: 1.0,
    decay: 0.02,
    vy: -1.5
  });
}

function updateScorePopups() {
  for (let i = scorePopups.length - 1; i >= 0; i--) {
    const p = scorePopups[i];
    p.y += p.vy;
    p.life -= p.decay;
    if (p.life <= 0) scorePopups.splice(i, 1);
  }
}

function drawScorePopups() {
  scorePopups.forEach(p => {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px Courier New';
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 3;
    ctx.strokeText(p.text, p.x, p.y);
    ctx.fillText(p.text, p.x, p.y);
  });
  ctx.globalAlpha = 1;
}

// ============================================================
// SCREEN SHAKE
// ============================================================
function triggerShake(intensity, duration) {
  shakeIntensity = intensity;
  shakeDuration = duration;
}

function applyShake() {
  if (shakeDuration > 0) {
    const dx = (Math.random() - 0.5) * shakeIntensity * 2;
    const dy = (Math.random() - 0.5) * shakeIntensity * 2;
    ctx.translate(dx, dy);
    shakeDuration--;
    shakeIntensity *= 0.9;
  }
}

// ============================================================
// COLLISION DETECTION
// ============================================================
function getGhostHitbox() {
  return {
    left: ghost.x + ghost.hitboxInset.left,
    right: ghost.x + ghost.width - ghost.hitboxInset.right,
    top: ghost.y + ghost.hitboxInset.top,
    bottom: ghost.y + ghost.height - ghost.hitboxInset.bottom
  };
}

function checkCollision() {
  if (invincible) return false;

  const hb = getGhostHitbox();

  // Ground and ceiling
  if (hb.bottom > canvas.height) return true;
  if (hb.top < 0) return true;

  // Pipes - precise hitbox check
  for (const pipe of pipes) {
    const pipeLeft = pipe.x;
    const pipeRight = pipe.x + OBSTACLE.pipeWidth;

    // Check horizontal overlap
    if (hb.right > pipeLeft && hb.left < pipeRight) {
      // Top pipe collision
      if (hb.top < pipe.topHeight) return true;
      // Bottom pipe collision
      if (hb.bottom > pipe.bottomY) return true;
    }

    // Also check cap collision (caps are wider)
    const capLeft = pipe.x - 5;
    const capRight = pipe.x + OBSTACLE.pipeWidth + 5;

    if (hb.right > capLeft && hb.left < capRight) {
      // Top cap area
      if (hb.top < pipe.topHeight && hb.bottom > pipe.topHeight - 22) return true;
      // Bottom cap area
      if (hb.bottom > pipe.bottomY && hb.top < pipe.bottomY + 22) return true;
    }
  }

  return false;
}

// ============================================================
// PROGRESSIVE DIFFICULTY
// ============================================================
function updateDifficulty() {
  // Speed increases every 5 points
  currentSpeed = Math.min(
    OBSTACLE.baseSpeed + Math.floor(score / 5) * OBSTACLE.speedIncreaseRate,
    OBSTACLE.maxSpeed
  );

  // Gap shrinks every 10 points
  currentGap = Math.max(
    OBSTACLE.baseGap - Math.floor(score / 10) * OBSTACLE.gapShrinkRate,
    OBSTACLE.minGap
  );
}

// ============================================================
// UPDATE LOGIC
// ============================================================
function update() {
  frameCount++;

  if (gameState === 'playing') {
    // Ghost physics with momentum and interpolation
    ghost.velocity += PHYSICS.gravity;
    ghost.velocity *= PHYSICS.momentumDamping;

    // Terminal velocity clamp
    ghost.velocity = Math.max(PHYSICS.terminalVelocityUp, Math.min(ghost.velocity, PHYSICS.terminalVelocityDown));

    // Smooth movement interpolation
    ghost.y += ghost.velocity;

    // Trail particles while playing
    if (frameCount % 3 === 0) {
      spawnTrailParticle();
    }

    // Update pipes
    for (let i = pipes.length - 1; i >= 0; i--) {
      pipes[i].x -= currentSpeed;

      // Score when passing pipe
      if (!pipes[i].scored && pipes[i].x + OBSTACLE.pipeWidth < ghost.x) {
        pipes[i].scored = true;
        score++;
        updateDifficulty();
        playScoreSound();
        spawnScorePopup(ghost.x + ghost.width, ghost.y, `+1`);
        updateScoreDisplay();
      }

      // Remove off-screen pipes
      if (pipes[i].x + OBSTACLE.pipeWidth < -20) {
        pipes.splice(i, 1);
      }
    }

    // Spawn pipes at interval
    const now = Date.now();
    if (now - lastPipeSpawn > OBSTACLE.spawnInterval) {
      spawnPipe();
      lastPipeSpawn = now;
    }

    // Invincibility timer
    if (invincible) {
      invincibilityTimer--;
      if (invincibilityTimer <= 0) {
        invincible = false;
      }
    }

    // Collision
    if (checkCollision()) {
      handleCollision();
    }
  }

  // Always update visual elements
  updateClouds();
  updateParticles();
  updateScorePopups();
}

function handleCollision() {
  gameState = 'gameover';
  spawnCollisionBurst();
  triggerShake(8, 20);
  playSound(gameOverSound);

  if (score > highScore) {
    highScore = score;
    localStorage.setItem('flappyKiroHigh', highScore.toString());
  }
  updateScoreDisplay();
}

// ============================================================
// DRAW FRAME
// ============================================================
function draw() {
  ctx.save();
  applyShake();

  drawBackground();

  // Pipes
  pipes.forEach(pipe => {
    drawPipe(pipe.x, 0, pipe.topHeight, true);
    drawPipe(pipe.x, pipe.bottomY, canvas.height - pipe.bottomY, false);
  });

  // Particles behind ghost
  drawParticles();

  // Ghost
  drawGhost();

  // Score popups
  drawScorePopups();

  // In-game score display
  if (gameState === 'playing') {
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = 'bold 48px Courier New';
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 4;
    ctx.strokeText(score, canvas.width / 2, 60);
    ctx.fillText(score, canvas.width / 2, 60);
  }

  // Overlays
  if (gameState === 'menu') drawMenuScreen();
  else if (gameState === 'paused') drawPauseScreen();
  else if (gameState === 'gameover') drawGameOverScreen();

  ctx.restore();
}

// ============================================================
// UI SCREENS
// ============================================================

function drawMenuScreen() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  // Animated gradient overlay
  const overlayGrad = ctx.createRadialGradient(cx, cy - 40, 50, cx, cy, canvas.height * 0.7);
  overlayGrad.addColorStop(0, 'rgba(10, 15, 40, 0.25)');
  overlayGrad.addColorStop(1, 'rgba(10, 15, 40, 0.65)');
  ctx.fillStyle = overlayGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Floating ghost mini-ghosts in background
  const time = frameCount * 0.02;
  ctx.globalAlpha = 0.12;
  for (let i = 0; i < 5; i++) {
    const gx = cx + Math.sin(time + i * 1.3) * 160;
    const gy = cy + Math.cos(time * 0.7 + i * 2) * 120;
    const gs = 20 + i * 5;
    if (ghostImg.complete && ghostImg.naturalWidth > 0) {
      ctx.drawImage(ghostImg, gx - gs / 2, gy - gs / 2, gs, gs);
    }
  }
  ctx.globalAlpha = 1;

  // Title with shadow and glow
  const titleY = cy - 110;
  ctx.textAlign = 'center';

  // Glow
  ctx.shadowColor = 'rgba(135, 206, 235, 0.6)';
  ctx.shadowBlur = 20;
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 44px Courier New';
  ctx.fillText('FLAPPY', cx, titleY);
  ctx.fillStyle = '#a0e8ff';
  ctx.font = 'bold 44px Courier New';
  ctx.fillText('KIRO', cx, titleY + 48);
  ctx.shadowBlur = 0;

  // Main ghost character — breathing animation
  const breathe = Math.sin(frameCount * 0.04) * 6;
  const ghostSize = 64;
  const ghostY = cy - 20 + breathe;
  if (ghostImg.complete && ghostImg.naturalWidth > 0) {
    // Soft glow circle behind ghost
    const glowGrad = ctx.createRadialGradient(cx, ghostY + ghostSize / 2, 5, cx, ghostY + ghostSize / 2, ghostSize);
    glowGrad.addColorStop(0, 'rgba(255,255,255,0.2)');
    glowGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(cx, ghostY + ghostSize / 2, ghostSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.drawImage(ghostImg, cx - ghostSize / 2, ghostY, ghostSize, ghostSize);
  }

  // High score badge
  if (highScore > 0) {
    const badgeY = cy + 60;
    ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
    ctx.beginPath();
    ctx.roundRect(cx - 80, badgeY - 16, 160, 32, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(cx - 80, badgeY - 16, 160, 32, 12);
    ctx.stroke();
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 16px Courier New';
    ctx.fillText(`★ Best: ${highScore} ★`, cx, badgeY + 5);
  }

  // Controls section
  const ctrlY = cy + 110;
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '13px Courier New';
  ctx.fillText('SPACE / CLICK to flap  •  P to pause', cx, ctrlY);

  // Pulsing start prompt
  const pulse = 0.55 + Math.sin(frameCount * 0.07) * 0.4;
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px Courier New';
  ctx.fillText('[ TAP TO START ]', cx, ctrlY + 45);
  ctx.globalAlpha = 1;

  // Decorative bottom pipes hint
  const pipeHintAlpha = 0.2 + Math.sin(frameCount * 0.03) * 0.08;
  ctx.globalAlpha = pipeHintAlpha;
  drawPipe(60, canvas.height - 100, 100, false);
  drawPipe(canvas.width - 120, canvas.height - 140, 140, false);
  ctx.globalAlpha = 1;
}

function drawPauseScreen() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 36px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2 - 20);

  ctx.font = '18px Courier New';
  ctx.fillText('Press P or Space to Resume', canvas.width / 2, canvas.height / 2 + 30);
}

function drawGameOverScreen() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  // Panel background
  const panelW = 280;
  const panelH = 220;
  ctx.fillStyle = 'rgba(30, 30, 50, 0.85)';
  ctx.beginPath();
  ctx.roundRect(cx - panelW / 2, cy - panelH / 2 - 20, panelW, panelH, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(cx - panelW / 2, cy - panelH / 2 - 20, panelW, panelH, 16);
  ctx.stroke();

  // Title
  ctx.fillStyle = '#ff5555';
  ctx.font = 'bold 32px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', cx, cy - 65);

  // Divider
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 90, cy - 45);
  ctx.lineTo(cx + 90, cy - 45);
  ctx.stroke();

  // Score
  ctx.fillStyle = '#fff';
  ctx.font = '20px Courier New';
  ctx.fillText(`Score: ${score}`, cx, cy - 15);

  // High score
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 20px Courier New';
  ctx.fillText(`Best: ${highScore}`, cx, cy + 20);

  // New high score indicator
  if (score === highScore && score > 0) {
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 14px Courier New';
    ctx.fillText('★ NEW RECORD ★', cx, cy + 50);
  }

  // Restart prompt with pulsing opacity
  const pulse = 0.5 + Math.sin(frameCount * 0.06) * 0.3;
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#fff';
  ctx.font = '14px Courier New';
  ctx.fillText('Space / Click to Restart', cx, cy + 80);
  ctx.globalAlpha = 1;
}

// ============================================================
// SCORE DISPLAY
// ============================================================
function updateScoreDisplay() {
  scoreBar.textContent = `Score: ${score} | High: ${highScore}`;
}

// ============================================================
// INPUT - JUMP / PAUSE
// ============================================================
function jump() {
  if (gameState === 'menu') {
    startGame();
  } else if (gameState === 'playing') {
    ghost.velocity = PHYSICS.jumpForce;
    spawnJumpBurst();
    playSound(jumpSound);
  } else if (gameState === 'gameover') {
    resetGame();
  } else if (gameState === 'paused') {
    gameState = 'playing';
  }
}

function togglePause() {
  if (gameState === 'playing') {
    gameState = 'paused';
  } else if (gameState === 'paused') {
    gameState = 'playing';
  }
}

function startGame() {
  gameState = 'playing';
  ghost.velocity = PHYSICS.jumpForce;
  lastPipeSpawn = Date.now();
  spawnJumpBurst();
  playSound(jumpSound);
}

function resetGame() {
  ghost.y = canvas.height / 2;
  ghost.velocity = 0;
  ghost.rotation = 0;
  pipes = [];
  particles = [];
  scorePopups = [];
  score = 0;
  currentSpeed = OBSTACLE.baseSpeed;
  currentGap = OBSTACLE.baseGap;
  invincible = false;
  invincibilityTimer = 0;
  shakeIntensity = 0;
  shakeDuration = 0;
  gameState = 'menu';
  updateScoreDisplay();
}

// ============================================================
// EVENT LISTENERS
// ============================================================
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    e.preventDefault();
    jump();
  } else if (e.code === 'KeyP' || e.code === 'Escape') {
    e.preventDefault();
    togglePause();
  }
});

canvas.addEventListener('click', () => jump());
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); jump(); });

// ============================================================
// GAME LOOP
// ============================================================
function gameLoop(timestamp) {
  deltaTime = timestamp - lastFrameTime;
  lastFrameTime = timestamp;

  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// Initialize
updateScoreDisplay();
requestAnimationFrame(gameLoop);
