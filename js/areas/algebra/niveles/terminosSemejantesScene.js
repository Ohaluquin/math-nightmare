// ===========================================================
// términosSemejantesScene.js - "Términos semejantes"
// Inspirado en TablasScene (meteoritos desde punto de fuga)
// - 3 niveles por corrida
// - Cada nivel presenta 3 expresiones para simplificar
// - Se elige la simplificacion correcta entre 4 opciones
// - Opciones clicables (mouse) o con teclas 1-4
// ===========================================================

/* ===========================================================
   Starfield
=========================================================== */
class Starfield {
  constructor(width, height, count = 80, centerX = null, centerY = null) {
    this.width = width;
    this.height = height;
    this.centerX = centerX ?? width / 2;
    this.centerY = centerY ?? height * 0.4;
    this.maxR = Math.max(width, height) * 0.7;

    this.stars = [];
    for (let i = 0; i < count; i++) this.stars.push(this._randomStar(true));
  }

  _randomStar(startNearCenter = false) {
    const angle = Math.random() * Math.PI * 2;
    const r = startNearCenter
      ? Math.random() * 10
      : Math.random() * this.maxR * 0.3;
    return {
      angle,
      r,
      speed: 40 + Math.random() * 80,
      baseSize: 0.8 + Math.random() * 1.7,
    };
  }

  update(dt) {
    for (const s of this.stars) {
      s.r += s.speed * dt;
      if (s.r > this.maxR) Object.assign(s, this._randomStar(true));
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = "#000010";
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.fillStyle = "#ffffff";

    for (const s of this.stars) {
      const t = s.r / this.maxR;
      const x = this.centerX + Math.cos(s.angle) * s.r;
      const y = this.centerY + Math.sin(s.angle) * s.r;
      const size = s.baseSize * (0.5 + 1.8 * t);
      const alpha = 0.25 + 0.75 * t;

      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }
}

/* ===========================================================
   ExplosionSprite
=========================================================== */
class ExplosionSprite extends Sprite {
  constructor(scene, x, y) {
    const A = scene.game.assets;
    const img = A ? A.getImage("mn_semejantes_explosion") : null;

    const frameCols = 2;
    const frameRows = 4;
    const frameCount = frameCols * frameRows;
    const frameWidth = img ? img.width / frameCols : 64;
    const frameHeight = img ? img.height / frameRows : 64;

    super(x, y, frameWidth, frameHeight, "#00000000");
    this.scene = scene;
    this.image = img;
    this.frameCols = frameCols;
    this.frameRows = frameRows;
    this.frameCount = frameCount;
    this.frame = 0;
    this.frameTime = 0.07;
    this.timer = 0;
  }

  update(dt) {
    this.timer += dt;
    while (this.timer >= this.frameTime) {
      this.timer -= this.frameTime;
      this.frame++;
      if (this.frame >= this.frameCount) {
        this.scene.remove(this);
        break;
      }
    }
  }

  draw(ctx) {
    if (!this.image) return;

    const cam = this.scene?.camera ?? { x: 0, y: 0 };
    const cx = this.x - cam.x;
    const cy = this.y - cam.y;
    const fw = this.width;
    const fh = this.height;
    const col = this.frame % this.frameCols;
    const row = Math.floor(this.frame / this.frameCols);
    const sx = col * fw;
    const sy = row * fh;

    ctx.save();
    ctx.drawImage(this.image, sx, sy, fw, fh, cx - fw / 2, cy - fh / 2, fw, fh);
    ctx.restore();
  }
}

/* ===========================================================
   ShipSprite
=========================================================== */
class ShipSprite extends Sprite {
  constructor(scene, x, y) {
    const A = scene.game.assets;
    const img = A ? A.getImage("mn_semejantes_nave") : null;
    const frameCols = 3;
    const frameRows = 3;
    const frameWidth = img ? img.width / frameCols : 128;
    const frameHeight = img ? img.height / frameRows : 128;

    super(x, y, frameWidth, frameHeight, "#00000000");
    this.scene = scene;
    this.image = img;
    this.frameCols = frameCols;
    this.frameRows = frameRows;
    this.frameCount = frameCols * frameRows;
    this.maxFrame = this.frameCount - 1;
    this.frame = 0;
    this.frameTimer = 0;
    this.frameStep = 0.045;
    this.moveSpeed = 360;
    this.facing = -1;
    this.margin = 120;
  }

  update(dt) {
    if (!this.scene || !this.image) return;

    const input = this.scene.game.input;
    const leftDown =
      input.isDown("ArrowLeft") ||
      input.isDown("KeyA") ||
      input.isDown("a") ||
      input.isDown("A");
    const rightDown =
      input.isDown("ArrowRight") ||
      input.isDown("KeyD") ||
      input.isDown("d") ||
      input.isDown("D");

    let moveDir = 0;
    if (leftDown && !rightDown) moveDir = -1;
    else if (rightDown && !leftDown) moveDir = 1;

    if (
      this.scene.state === "playing" &&
      this.scene.transitionTime <= 0 &&
      moveDir !== 0
    ) {
      this.facing = moveDir;
      this.x += moveDir * this.moveSpeed * dt;
    }

    const W = this.scene.game.canvas.width;
    const minX = this.margin;
    const maxX = W - this.margin;
    this.x = Math.max(minX, Math.min(maxX, this.x));

    this.frameTimer += dt;
    while (this.frameTimer >= this.frameStep) {
      this.frameTimer -= this.frameStep;
      if (
        moveDir !== 0 &&
        this.scene.state === "playing" &&
        this.scene.transitionTime <= 0
      ) {
        if (this.frame < this.maxFrame) this.frame++;
      } else if (this.frame > 0) {
        this.frame--;
      }
    }
  }

  draw(ctx) {
    if (!this.image) return;

    const col = this.frame % this.frameCols;
    const row = Math.floor(this.frame / this.frameCols);
    const sx = col * this.width;
    const sy = row * this.height;
    const dw = 172;
    const dh = 172;

    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.facing > 0) ctx.scale(-1, 1);
    ctx.drawImage(
      this.image,
      sx,
      sy,
      this.width,
      this.height,
      -dw / 2,
      -dh / 2,
      dw,
      dh,
    );
    ctx.restore();
  }
}

/* ===========================================================
   LaserShot
=========================================================== */
class LaserShot extends Sprite {
  constructor(scene, x, y) {
    const A = scene.game.assets;
    const img = A ? A.getImage("mn_semejantes_rayo") : null;
    const frameCols = 3;
    const frameRows = 2;
    const frameWidth = img ? img.width / frameCols : 64;
    const frameHeight = img ? img.height / frameRows : 96;

    super(x, y, 32, 110, "#00000000");
    this.scene = scene;
    this.image = img;
    this.frameCols = frameCols;
    this.frameRows = frameRows;
    this.frameCount = frameCols * frameRows;
    this.frame = 0;
    this.frameTimer = 0;
    this.frameStep = 0.04;
    this.speed = 860;
    this.halfWidth = this.width / 2;
    this.halfHeight = this.height / 2;
    this.sourceWidth = frameWidth;
    this.sourceHeight = frameHeight;
    this.hit = false;
  }

  update(dt) {
    if (this.hit) return;

    this.y -= this.speed * dt;

    this.frameTimer += dt;
    while (this.frameTimer >= this.frameStep) {
      this.frameTimer -= this.frameStep;
      this.frame = (this.frame + 1) % this.frameCount;
    }

    if (this.y + this.halfHeight < 0) {
      this.scene._removeShot(this);
      return;
    }

    if (!this.scene.waveActive || this.scene.waveLock) return;

    for (const meteor of this.scene.meteors) {
      if (!meteor) continue;
      if (this._hitsMeteor(meteor)) {
        this.hit = true;
        this.scene._onShotMeteor(this, meteor);
        return;
      }
    }
  }

  _hitsMeteor(meteor) {
    return (
      this.x - this.halfWidth < meteor.x + meteor.width / 2 &&
      this.x + this.halfWidth > meteor.x - meteor.width / 2 &&
      this.y - this.halfHeight < meteor.y + meteor.height / 2 &&
      this.y + this.halfHeight > meteor.y - meteor.height / 2
    );
  }

  draw(ctx) {
    if (!this.image) return;

    const col = this.frame % this.frameCols;
    const row = Math.floor(this.frame / this.frameCols);
    const sx = col * this.sourceWidth;
    const sy = row * this.sourceHeight;

    ctx.save();
    ctx.drawImage(
      this.image,
      sx,
      sy,
      this.sourceWidth,
      this.sourceHeight,
      this.x - this.width / 2,
      this.y - this.height / 2,
      this.width,
      this.height,
    );
    ctx.restore();
  }
}

/* ===========================================================
   Helpers
=========================================================== */
function poly(a2 = 0, a1 = 0, a0 = 0) {
  return { a2, a1, a0 };
}

function eqPoly(P, Q) {
  return P.a2 === Q.a2 && P.a1 === Q.a1 && P.a0 === Q.a0;
}

function clonePoly(P) {
  return { a2: P.a2, a1: P.a1, a0: P.a0 };
}

function fmtPoly(P) {
  const parts = [];

  const pushTerm = (coef, label, isFirst) => {
    if (coef === 0) return;
    const sign = coef < 0 ? "-" : isFirst ? "" : "+";
    const abs = Math.abs(coef);

    let body = "";
    if (label === "") {
      body = String(abs);
    } else if (abs === 1) {
      body = label;
    } else {
      body = `${abs}${label}`;
    }

    parts.push(`${sign} ${body}`.trim());
  };

  pushTerm(P.a2, "x^2", parts.length === 0);
  pushTerm(P.a1, "x", parts.length === 0);
  pushTerm(P.a0, "", parts.length === 0);

  if (parts.length === 0) return "0";
  return parts.join(" ").replace(/\+\s-\s/g, "- ");
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function randNonZeroInt(min, max) {
  let n = 0;
  while (n === 0) n = randInt(min, max);
  return n;
}

function signJoin(value) {
  return value >= 0 ? `+ ${value}` : `- ${Math.abs(value)}`;
}

function formatSignedTerm(coef, label = "") {
  if (coef === 0) return null;
  const abs = Math.abs(coef);
  const body = label
    ? abs === 1
      ? label
      : `${abs}${label}`
    : String(abs);
  return { sign: coef < 0 ? -1 : 1, body };
}

function joinOrderedTerms(terms) {
  const filtered = terms.filter(Boolean);
  if (!filtered.length) return "0";
  return filtered
    .map((term, idx) => {
      if (idx === 0) return term.sign < 0 ? `- ${term.body}` : term.body;
      return `${term.sign < 0 ? "-" : "+"} ${term.body}`;
    })
    .join(" ");
}

function buildPromptFromPattern(terms, patterns) {
  const pattern = pick(patterns);
  return joinOrderedTerms(pattern.map((idx) => terms[idx]));
}

function uniquePolys(list) {
  const out = [];
  for (const item of list) {
    if (!out.some((other) => eqPoly(other, item))) out.push(item);
  }
  return out;
}

function buildDistractors(correct, variants) {
  return uniquePolys(
    variants
      .map((variant) => variant(correct))
      .filter((candidate) => !eqPoly(candidate, correct)),
  ).slice(0, 3);
}

function makeRound1Exercise() {
  const a = randInt(2, 7);
  const b = randInt(-6, 6);
  const c = randNonZeroInt(-5, 5);
  const d = randInt(-6, 6);
  const answer = poly(0, a + c, b + d);
  const prompt = buildPromptFromPattern(
    [
      formatSignedTerm(a, "x"),
      formatSignedTerm(b),
      formatSignedTerm(c, "x"),
      formatSignedTerm(d),
    ],
    [
      [0, 1, 2, 3],
      [0, 1, 3, 2],
      [0, 2, 1, 3],
      [1, 0, 3, 2],
    ],
  );

  return {
    prompt,
    answer,
    distractors: buildDistractors(answer, [
      () => poly(0, a + Math.abs(c), b + d),
      () => poly(0, a + c, b - d),
      () => poly(0, a + b + c + d, 0),
      () => poly(0, a, b + c + d),
    ]),
  };
}

function makeRound2Exercise() {
  const ax = randInt(2, 8);
  const bx = randNonZeroInt(-6, 6);
  const c = randInt(-8, 8);
  const d = randInt(-8, 8);
  const answer = poly(0, ax + bx, c + d);
  const prompt = buildPromptFromPattern(
    [
      formatSignedTerm(ax, "x"),
      formatSignedTerm(c),
      formatSignedTerm(bx, "x"),
      formatSignedTerm(d),
    ],
    [
      [0, 1, 2, 3],
      [0, 1, 3, 2],
      [1, 0, 3, 2],
      [1, 0, 2, 3],
      [0, 2, 1, 3],
    ],
  );

  return {
    prompt,
    answer,
    distractors: buildDistractors(answer, [
      () => poly(0, ax + Math.abs(bx), c + d),
      () => poly(0, ax + bx, c - d),
      () => poly(0, ax + bx + c + d, 0),
      () => poly(0, ax - bx, c + d),
    ]),
  };
}

function makeRound3Exercise() {
  const mode = randInt(0, 2);

  if (mode === 0) {
    const a = randInt(2, 8);
    const b = randInt(1, 8);
    const c = randInt(-7, 7);
    const answer = poly(0, a - b, -c);
    return {
      prompt: `${a}x - (${b}x ${signJoin(c)})`,
      answer,
      distractors: buildDistractors(answer, [
        () => poly(0, a + b, c),
        () => poly(0, a - b, c),
        () => poly(0, a + b, -c),
        () => poly(0, a, -c),
      ]),
    };
  }

  if (mode === 1) {
    const a = randInt(2, 7);
    const b = randInt(-6, 6);
    const c = randInt(2, 7);
    const d = randInt(-6, 6);
    const answer = poly(0, -(a + c), -(b + d));
    return {
      prompt: `-(${a}x ${signJoin(b)}) - (${c}x ${signJoin(d)})`,
      answer,
      distractors: buildDistractors(answer, [
        () => poly(0, -a + c, -(b + d)), // no cambia el signo del segundo x
        () => poly(0, a + c, -(b + d)), // ignora el menos externo del primer paréntesis
        () => poly(0, -(a + c), b - d), // error típico con las constantes
        () => poly(0, -a - c, -b + d), // no cambia el signo de d
      ]),
    };
  }

  const a = randInt(2, 8);
  const b = randInt(1, a - 1);
  const c = randInt(1, 6);
  const k = randInt(-6, 6);
  const answer = poly(0, a - b, k + c);
  return {
    prompt: `${a}x ${signJoin(k)} - (${b}x - ${c})`,
    answer,
    distractors: buildDistractors(answer, [
      () => poly(0, a - b, k - c), // no cambia el signo de c
      () => poly(0, a + b, k + c), // no cambia el signo de bx
      () => poly(0, a + b, k - c), // no cambia ninguno
      () => poly(0, a - b, k), // olvida sumar c
    ]),
  };
}

const TERM_TEMPLATES = {
  1: [makeRound1Exercise],
  2: [makeRound2Exercise],
  3: [makeRound3Exercise],
};

function buildExercisesForRound(round, count = 3) {
  const factories = TERM_TEMPLATES[round] || [];
  const out = [];
  const seenPrompts = new Set();
  let guard = 0;

  while (out.length < count && guard < 100) {
    guard++;
    const factory = pick(factories);
    if (!factory) break;
    const exercise = factory();
    if (!exercise || seenPrompts.has(exercise.prompt)) continue;
    seenPrompts.add(exercise.prompt);
    out.push(exercise);
  }

  while (out.length < count && out.length > 0) {
    const clone = {
      prompt: out[out.length - 1].prompt,
      answer: clonePoly(out[out.length - 1].answer),
      distractors: out[out.length - 1].distractors.map((d) => clonePoly(d)),
    };
    out.push(clone);
  }

  return out;
}

/* ===========================================================
   ChoiceMeteor
=========================================================== */
class ChoiceMeteor extends Sprite {
  constructor(
    scene,
    id,
    targetX,
    targetY,
    optionPoly,
    speedNorm,
    startX,
    startY,
  ) {
    const spawnX = startX ?? scene.vanishX;
    const spawnY = startY ?? scene.vanishY;
    super(spawnX, spawnY, 120, 120, "#00000000");
    this.scene = scene;
    this.id = id;
    this.option = optionPoly;
    this.exprStr = fmtPoly(optionPoly);
    this.text = this.exprStr;
    this.startX = startX;
    this.startY = startY;
    this.targetX = targetX;
    this.targetY = targetY;
    this.baseSize = 52;
    this.progress = 0;
    this.speedNorm = speedNorm;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = Math.random() * 0.8 - 0.4;
    this.missed = false;
    this.width = this.height = this.baseSize * 0.55;

    const A = this.scene.game.assets;
    this.image = A ? A.getImage("mn_semejantes_meteor") : null;
  }

  update(dt) {
    this.rotation += this.rotationSpeed * dt;
    this.progress += this.speedNorm * dt;

    const t = Math.min(this.progress, 1);
    const eased = t * t * t;
    const sx = this.startX ?? this.scene.vanishX;
    const sy = this.startY ?? this.scene.vanishY;

    this.x = sx + (this.targetX - sx) * eased;
    this.y = sy + (this.targetY - sy) * eased;

    const scale = 0.55 + 1.35 * eased;
    this.width = this.height = this.baseSize * scale;

    if (t >= 1 && !this.missed) this.missed = true;
  }

  draw(ctx) {
    const cam = this.scene?.camera ?? { x: 0, y: 0 };
    const cx = this.x - cam.x;
    const cy = this.y - cam.y;
    const danger = Math.max(0, Math.min(1, this.progress));
    const pulse = 0.55 + 0.45 * Math.sin(Date.now() * (0.008 + danger * 0.02));
    const auraRadius =
      Math.max(this.width, this.height) * (0.72 + danger * 0.42 + pulse * 0.14);

    ctx.save();

    const aura = ctx.createRadialGradient(
      cx,
      cy,
      this.width * 0.1,
      cx,
      cy,
      auraRadius,
    );
    aura.addColorStop(
      0,
      `rgba(255,120,80,${0.15 + danger * 0.16 + pulse * 0.06})`,
    );
    aura.addColorStop(
      0.55,
      `rgba(255,40,20,${0.16 + danger * 0.22 + pulse * 0.08})`,
    );
    aura.addColorStop(1, "rgba(255,0,0,0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(cx, cy, auraRadius, 0, Math.PI * 2);
    ctx.fill();

    if (this.image) {
      ctx.translate(cx, cy);
      ctx.rotate(this.rotation);
      ctx.drawImage(
        this.image,
        -this.width / 2,
        -this.height / 2,
        this.width,
        this.height,
      );
    }

    ctx.restore();

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 16px monospace";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#081521";
    ctx.fillStyle = "#f4fbff";
    ctx.strokeText(this.text, cx, cy);
    ctx.fillText(this.text, cx, cy);
    ctx.restore();
  }

  hitTest(px, py) {
    const cam = this.scene?.camera ?? { x: 0, y: 0 };
    const cx = this.x - cam.x;
    const cy = this.y - cam.y;
    const left = cx - this.width / 2;
    const top = cy - this.height / 2;
    return (
      px >= left &&
      px <= left + this.width &&
      py >= top &&
      py <= top + this.height
    );
  }
}

/* ===========================================================
   TerminosSemejantesScene
=========================================================== */
class TerminosSemejantesScene extends Scene {
  constructor(game, options = {}) {
    super(game);

    this.state = "intro";
    this.gameFinished = false;
    this.exitDelay = 0;
    this.win = false;
    this.message = "";
    this.sheetsReward = 0;

    this.configMaxLives = options.maxLives ?? 3;
    this.lives = this.configMaxLives;
    this.streak = 0;
    this.score = 0;

    this.round = 1;
    this.correctInRound = 0;
    this.totalCorrect = 0;
    this.currentExerciseIndex = 0;
    this.currentExercise = null;
    this.roundExercises = [];
    this.currentPrompt = "0";
    this.correctAnswer = poly(0, 0, 0);

    this.optionsPerWave = 4;
    this.waveActive = false;
    this.waveLock = false;
    this.meteors = [];
    this.shots = [];

    this.spawnTimer = 0;
    this.spawnInterval = 0.25;
    this.waveDelayTimer = 0;
    this.globalDifficulty = 0;
    this.shotCooldown = 0;
    this.shotCooldownMax = 2;

    this.starfield = null;
    this.cockpitImage = null;
    this.ship = null;
    this.vanishX = 0;
    this.vanishY = 0;

    this.shakeTime = 0;
    this.shakeDuration = 0.35;
    this.shakeIntensity = 10;

    this._prevKeys = {
      Enter: false,
      " ": false,
      Escape: false,
    };
    this._prevMouseDown = false;

    this.transitionTime = 0;
    this.transitionMsg = "";
    this.flashAlpha = 0;
  }

  _setCurrentExercise(exercise) {
    this.currentExercise = exercise;
    this.currentPrompt = exercise.prompt;
    this.correctAnswer = clonePoly(exercise.answer);
  }

  playSfx(key, options = {}) {
    if (!key) return;
    const assets = this.game.assets;
    if (!assets || typeof assets.playSound !== "function") return;
    assets.playSound(key, options);
  }

  init() {
    if (window.MN_setLeafHUDVisible) window.MN_setLeafHUDVisible(false);
    if (window.MN_setInputMode) window.MN_setInputMode("keyboard");

    this.state = "intro";
    this.gameFinished = false;
    this.exitDelay = 0;
    this.win = false;
    this.message = "";
    this.sheetsReward = 0;

    this.lives = this.configMaxLives;
    this.streak = 0;
    this.score = 0;

    this.round = 1;
    this.correctInRound = 0;
    this.totalCorrect = 0;
    this.currentExerciseIndex = 0;
    this.currentExercise = null;
    this.roundExercises = [];
    this.currentPrompt = "0";
    this.correctAnswer = poly(0, 0, 0);

    this.waveActive = false;
    this.waveLock = false;
    this.spawnTimer = 0;
    this.waveDelayTimer = 0;
    this.globalDifficulty = 0;
    this.shotCooldown = 0;

    this.meteors = [];
    this.shots = [];
    this.clearAll?.();

    this._prevMouseDown = false;
    for (const k of Object.keys(this._prevKeys)) this._prevKeys[k] = false;

    const W = this.game.canvas.width;
    const H = this.game.canvas.height;
    this.vanishX = W / 2;
    this.vanishY = -H * 0.18;
    this.starfield = new Starfield(W, H, 90, this.vanishX, this.vanishY);

    const A = this.game.assets;
    this.cockpitImage = A ? A.getImage("mn_tablas_cockpit") : null;
    this.ship = new ShipSprite(this, W / 2, H * 0.82);
    this.add(this.ship, "ship");

    this._startRound(1);
  }

  destroy() {
    this._clearWave(true);
  }

  _meteorHitsShip(meteor) {
    if (!this.ship) return false;

    const shipW = 110;
    const shipH = 78;
    const shipLeft = this.ship.x - shipW / 2;
    const shipTop = this.ship.y - shipH / 2;
    const meteorLeft = meteor.x - meteor.width / 2;
    const meteorTop = meteor.y - meteor.height / 2;

    return (
      meteorLeft < shipLeft + shipW &&
      meteorLeft + meteor.width > shipLeft &&
      meteorTop < shipTop + shipH &&
      meteorTop + meteor.height > shipTop
    );
  }

  update(dt) {
    super.update(dt);

    const input = this.game.input;
    const keys = input.keys || {};
    const isDown = (key) => !!keys[key];
    const isJustPressed = (key) => isDown(key) && !this._prevKeys[key];
    const commitKeys = () => {
      for (const k of Object.keys(this._prevKeys))
        this._prevKeys[k] = isDown(k);
    };

    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
      if (this.shakeTime < 0) this.shakeTime = 0;
    }
    if (this.shotCooldown > 0) {
      this.shotCooldown -= dt;
      if (this.shotCooldown < 0) this.shotCooldown = 0;
    }

    if (this.gameFinished) {
      if (this.exitDelay > 0) {
        this.exitDelay -= dt;
        commitKeys();
        return;
      }

      const wantsExit =
        input.isDown("Enter") ||
        input.isDown(" ") ||
        (input.mouse && input.mouse.down);

      if (wantsExit) window.MN_APP?.toOverworld?.();
      commitKeys();
      return;
    }

    if (this.state === "intro") {
      if (isJustPressed("Enter") || isJustPressed(" ")) this.state = "playing";
      commitKeys();
      return;
    }

    if (this.starfield) this.starfield.update(dt);

    if (this.state === "playing") {
      if (this.transitionTime > 0) {
        this.transitionTime -= dt;
        if (this.transitionTime < 0) this.transitionTime = 0;
        this.flashAlpha = Math.max(0, this.flashAlpha - dt * 1.2);
        commitKeys();
        return;
      }

      if (!this.waveActive) {
        if (this.waveDelayTimer > 0) {
          this.waveDelayTimer -= dt;
        } else {
          this.spawnTimer += dt;
          if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this._spawnWave();
          }
        }
      }

      if (this.waveActive && this.meteors.length > 0) {
        let failedMeteor = null;
        let hitShip = false;
        for (const m of this.meteors) {
          if (m.missed) {
            failedMeteor = m;
            break;
          }
          if (this._meteorHitsShip(m)) {
            failedMeteor = m;
            hitShip = true;
            break;
          }
        }
        if (failedMeteor && !this.waveLock)
          this._onWaveFailed(failedMeteor, hitShip);
      }

      if (!this.waveLock && this.waveActive && isJustPressed(" "))
        this._fireShot();

      if (isJustPressed("Escape")) window.MN_APP?.toOverworld?.();

      if (this.lives <= 0) {
        this.win = false;
        this._finishGame(true);
      }
    }

    commitKeys();
  }

  draw(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    ctx.save();

    if (this.shakeTime > 0) {
      const t = this.shakeTime / this.shakeDuration;
      const intensity = this.shakeIntensity * t;
      const dx = (Math.random() * 2 - 1) * intensity;
      const dy = (Math.random() * 2 - 1) * intensity;
      ctx.translate(dx, dy);
    }

    if (this.starfield) this.starfield.draw(ctx);
    else {
      ctx.fillStyle = "#050515";
      ctx.fillRect(0, 0, W, H);
    }

    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, 0, W, H);

    super.draw(ctx);

    if (this.cockpitImage) ctx.drawImage(this.cockpitImage, 0, 0, W, H);

    this._drawHUD(ctx);
    if (this.flashAlpha > 0) {
      ctx.save();
      ctx.fillStyle = `rgba(255,255,255,${this.flashAlpha})`;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    if (this.transitionTime > 0) {
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";
      ctx.font = "30px Arial";
      ctx.fillText(this.transitionMsg, W / 2, H * 0.28);
      ctx.restore();
    }

    if (this.state === "intro") this._drawIntro(ctx);
    if (this.state === "finished") this._drawEndMessage(ctx);

    ctx.restore();
  }

  _drawHUD(ctx) {
    const W = this.game.canvas.width;
    const promptPanelW = Math.min(620, W * 0.72);
    const promptPanelH = 86;
    const promptPanelX = (W - promptPanelW) / 2;
    const promptPanelY = 22;

    ctx.save();
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#dbe9ff";

    ctx.fillStyle = "rgba(8, 14, 24, 0.82)";
    ctx.fillRect(promptPanelX, promptPanelY, promptPanelW, promptPanelH);
    ctx.strokeStyle = "rgba(236, 220, 170, 0.9)";
    ctx.lineWidth = 2;
    ctx.strokeRect(promptPanelX, promptPanelY, promptPanelW, promptPanelH);

    ctx.textAlign = "center";
    ctx.fillStyle = "#f7e7b2";
    ctx.font = "bold 16px Arial";
    ctx.fillText(
      `Nivel ${this.round}  -  Simplifica la expresión`,
      W / 2,
      promptPanelY + 22,
    );

    ctx.fillStyle = "#f8fbff";
    ctx.font = "bold 30px monospace";
    ctx.fillText(this.currentPrompt, W / 2, promptPanelY + 56);

    const heartSize = 17;
    const heartBaseX = 28;
    const heartBaseY = 26;

    ctx.textAlign = "left";
    ctx.fillStyle = "#dbe9ff";
    ctx.font = "bold 16px Arial";
    ctx.fillText("Vidas:", heartBaseX, heartBaseY + 8);

    for (let i = 0; i < this.configMaxLives; i++) {
      const x = heartBaseX + 76 + i * (heartSize + 10);
      const active = i < this.lives;
      ctx.fillStyle = active ? "#ff4b5c" : "#5b2b35";
      this._drawHeart(ctx, x, heartBaseY, heartSize);
    }

    const barX = heartBaseX;
    const barY = heartBaseY + 34;
    const barW = 132;
    const barH = 12;
    const charge =
      this.shotCooldownMax > 0
        ? 1 - Math.max(0, Math.min(1, this.shotCooldown / this.shotCooldownMax))
        : 1;

    ctx.fillStyle = "rgba(12, 20, 34, 0.9)";
    ctx.fillRect(barX, barY, barW, barH);
    ctx.strokeStyle = "rgba(210, 228, 255, 0.65)";
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barW, barH);

    ctx.fillStyle = charge >= 1 ? "#7cf29a" : "#58c7ff";
    ctx.fillRect(barX + 2, barY + 2, (barW - 4) * charge, barH - 4);

    ctx.restore();
  }

  _drawHeart(ctx, x, y, size) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.32);
    ctx.bezierCurveTo(x, y, x - size * 0.5, y, x - size * 0.5, y + size * 0.32);
    ctx.bezierCurveTo(
      x - size * 0.5,
      y + size * 0.62,
      x,
      y + size * 0.88,
      x,
      y + size,
    );
    ctx.bezierCurveTo(
      x,
      y + size * 0.88,
      x + size * 0.5,
      y + size * 0.62,
      x + size * 0.5,
      y + size * 0.32,
    );
    ctx.bezierCurveTo(x + size * 0.5, y, x, y, x, y + size * 0.32);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  _drawIntro(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";

    ctx.font = "34px Arial";
    ctx.fillText("Términos semejantes", W / 2, H * 0.22);

    ctx.font = "18px Arial";
    ctx.fillText(
      "Simplifica la expresión combinando términos semejantes.",
      W / 2,
      H * 0.34,
    );
    ctx.fillText(
      "Dispara en vertical con ESPACIO al meteorito correcto.",
      W / 2,
      H * 0.46,
    );
    ctx.fillText(
      "Mueve la nave con flechas izquierda/derecha o A/D.",
      W / 2,
      H * 0.52,
    );

    ctx.font = "18px Arial";
    ctx.fillText("Pulsa ENTER o ESPACIO para comenzar.", W / 2, H * 0.64);
    ctx.restore();
  }

  _drawEndMessage(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "32px Arial";
    ctx.fillStyle = this.win ? "#a5ff7b" : "#ffaaaa";

    const lines = this.message.split("\n");
    let y = H * 0.3;
    for (const line of lines) {
      ctx.fillText(line, W / 2, y);
      y += 30;
    }

    ctx.font = "18px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Pulsa ENTER, ESPACIO o haz clic para volver.", W / 2, y + 20);
    ctx.restore();
  }

  _startRound(roundNumber) {
    this.round = roundNumber;
    this.correctInRound = 0;
    this.currentExerciseIndex = 0;
    this.lives = this.configMaxLives;
    this.roundExercises = buildExercisesForRound(this.round, 3);
    this._setCurrentExercise(this.roundExercises[0]);

    this._clearWave(true);
    this.waveActive = false;
    this.waveLock = false;
    this.spawnTimer = this.spawnInterval;
    this.waveDelayTimer = 0;
    this.transitionTime = 0;
    this.transitionMsg = "";
    this.flashAlpha = 0;
  }

  _advanceExercise() {
    this.currentExerciseIndex++;

    if (this.currentExerciseIndex >= this.roundExercises.length) {
      if (this.round < 3) {
        this._startRound(this.round + 1);
      } else {
        this.win = true;
        this._finishGame(false);
      }
      return;
    }

    this._setCurrentExercise(this.roundExercises[this.currentExerciseIndex]);
    this.spawnTimer = this.spawnInterval;
    this.waveDelayTimer = 0;
    this.transitionTime = 0;
    this.transitionMsg = "";
    this.flashAlpha = 0;
  }

  _fireShot() {
    if (
      !this.ship ||
      this.shotCooldown > 0 ||
      this.waveLock ||
      !this.waveActive
    )
      return;

    const shot = new LaserShot(this, this.ship.x, this.ship.y - 88);
    this.shots.push(shot);
    this.add(shot, "shots");
    this.shotCooldown = this.shotCooldownMax;
    this.playSfx("sfx_semejantes_shot", { volume: 0.55 });
  }

  _removeShot(shot) {
    const idx = this.shots.indexOf(shot);
    if (idx >= 0) this.shots.splice(idx, 1);
    try {
      this.remove(shot);
    } catch (_) {}
  }

  _onShotMeteor(shot, meteor) {
    this._removeShot(shot);
    this._selectMeteor(meteor);
  }

  _spawnWave() {
    this._clearWave(true);

    const options = this._buildOptions(
      this.currentExercise,
      this.correctAnswer,
      this.optionsPerWave,
    );
    shuffle(options);

    const W = this.game.canvas.width;
    const H = this.game.canvas.height;
    const yImpact = H * 0.78;
    const xCenters = [W * 0.13, W * 0.37, W * 0.63, W * 0.87];

    const baseSpeed = 0.14;
    const diff =
      (this.round - 1) * 0.03 +
      (this.correctInRound / 3) * 0.02 +
      this.globalDifficulty;
    const speedNorm = Math.min(baseSpeed + diff, 0.75) / 3;

    this.meteors = [];
    const startSpreadX = W * 0.3;
    const startY = this.vanishY + 10;
    const startXs = [
      this.vanishX - startSpreadX,
      this.vanishX - startSpreadX * 0.33,
      this.vanishX + startSpreadX * 0.33,
      this.vanishX + startSpreadX,
    ];

    for (let i = 0; i < this.optionsPerWave; i++) {
      const id = i + 1;
      const meteor = new ChoiceMeteor(
        this,
        id,
        xCenters[i],
        yImpact,
        options[i],
        speedNorm,
        startXs[i],
        startY,
      );

      this.meteors.push(meteor);
      this.add(meteor, "problems");
    }

    this.waveActive = true;
    this.waveLock = false;
  }

  _buildOptions(exercise, correct, count) {
    const out = [clonePoly(correct)];
    const candidates = [...(exercise?.distractors ?? [])];

    // Respaldo por si alguna lista manual quedara corta en el futuro.
    candidates.push(
      poly(correct.a2, correct.a1 + pick([-2, -1, 1, 2]), correct.a0),
    );
    candidates.push(
      poly(correct.a2, correct.a1, correct.a0 + pick([-2, -1, 1, 2])),
    );

    shuffle(candidates);

    const seen = (P) => out.some((Q) => eqPoly(P, Q));
    for (const candidate of candidates) {
      if (out.length >= count) break;
      if (!seen(candidate)) out.push(candidate);
    }

    while (out.length < count) {
      const fallback = clonePoly(correct);
      const which = pick(["a2", "a1", "a0"]);
      fallback[which] += pick([-3, -2, -1, 1, 2, 3]);
      if (!seen(fallback)) out.push(fallback);
    }

    return out.slice(0, count);
  }

  _selectMeteor(meteor) {
    if (this.waveLock) return;
    this.waveLock = true;

    const isCorrect = eqPoly(meteor.option, this.correctAnswer);

    if (isCorrect) {
      for (const current of this.meteors) {
        this.add(new ExplosionSprite(this, current.x, current.y), "effects");
      }
      this.playSfx("sfx_explosion", { volume: 0.6 });
      this.streak++;
      this.score += Math.pow(2, Math.min(this.streak - 1, 6));
      this.correctInRound++;
      this.totalCorrect++;
      this.globalDifficulty += 0.01;

      this._clearWave(false);
      this.waveActive = false;
      this.waveLock = false;
      this._advanceExercise();
      return;
    }

    this.add(new ExplosionSprite(this, meteor.x, meteor.y), "effects");
    this.playSfx("sfx_explosion", { volume: 0.45 });
    try {
      this.remove(meteor);
    } catch (_) {}
    this.meteors = this.meteors.filter((m) => m !== meteor);
    this.waveActive = this.meteors.length > 0;
    this.waveLock = false;
  }

  _onWaveFailed(meteor = null, hitShip = false) {
    this.waveLock = true;
    this.playSfx("sfx_choque", { volume: 0.6 });
    if (meteor) {
      const impactX = hitShip && this.ship ? this.ship.x : meteor.x;
      const impactY =
        hitShip && this.ship ? this.ship.y - 18 : this.game.canvas.height - 58;
      this.add(new ExplosionSprite(this, impactX, impactY), "effects");
    }
    this.lives--;
    this.streak = 0;
    this.shakeTime = this.shakeDuration;
    this._clearWave(false);
    this.waveActive = false;
    this.waveLock = false;
  }

  _clearWave() {
    for (const shot of this.shots) {
      try {
        this.remove(shot);
      } catch (_) {}
    }
    this.shots = [];

    for (const m of this.meteors) {
      try {
        this.remove(m);
      } catch (_) {}
    }
    this.meteors = [];
  }

  _finishGame(failed = false) {
    if (this.gameFinished) return;

    this.gameFinished = true;
    this.state = "finished";
    this.exitDelay = 0.5;

    let tier = 0;
    if (!failed) tier = 1;

    let gained = 0;
    if (window.MN_reportMinigameTier) {
      gained = window.MN_reportMinigameTier("incrementos", tier);
    }
    this.sheetsReward = gained;

    if (failed) {
      this.message =
        "Te falto un poco...\n" +
        `Aciertos: ${this.totalCorrect}/9\n` +
        `Hojas ganadas: ${gained}.`;
    } else {
      this.message =
        "Dominaste los términos semejantes.\n" +
        "Simplificaste expresiones con precisión.\n" +
        `Hojas ganadas: ${gained}.`;
      this.playSfx("sfx_win", { volume: 0.7 });
    }

    if (this.game && this.game.events) {
      this.game.events.emit("incrementos_done", {
        win: !failed,
        round: this.round,
        correctInRound: this.correctInRound,
        totalCorrect: this.totalCorrect,
        streakMax: null,
        tier,
        sheetsReward: gained,
        failed,
      });
    }
  }

  _startTransition(msg, seconds = 1) {
    this.transitionTime = seconds;
    this.transitionMsg = msg;
    this.flashAlpha = 0.35;
    this._clearWave(true);
    this.waveActive = false;
    this.waveLock = false;
    this.spawnTimer = 0;
    this.waveDelayTimer = 0;
  }
}

window.TerminosSemejantesScene = TerminosSemejantesScene;
