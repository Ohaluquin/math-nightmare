// ===========================================================
// TablasScene.js - Lluvia de Meteoritos de Multiplicaciones
// Niveles:
//
//  1: tabla 2
//  2: tabla 3
//  3: tabla 4
//  4: tabla 5
//  5: tablas 0-5
//  6: tabla 6
//  7: tabla 7
//  8: tabla 8
//  9: tabla 9
// 10: tablas 6-9
// 11+: MODO INFINITO (sin limite, velocidad creciente)
//
// Cada nivel 1-10 tiene 5 ejercicios distintos (50 en total).
// Las hojas se calculan solo con esos 50. El modo infinito es extra.
// ===========================================================
// ===========================================================
// Starfield: fondo de estrellas en movimiento
// ===========================================================
// ===========================================================
// Starfield: estrellas que salen de un punto de fuga (warp)
// ===========================================================
class Starfield {
  constructor(width, height, count = 80, centerX = null, centerY = null) {
    this.width = width;
    this.height = height;
    this.centerX = centerX ?? width / 2;
    // un poco mas arriba del centro, para que parezca que miras hacia afuera
    this.centerY = centerY ?? height * 0.4;
    this.maxR = Math.max(width, height) * 0.7;

    this.stars = [];
    for (let i = 0; i < count; i++) {
      this.stars.push(this._randomStar(true));
    }
  }

  _randomStar(startNearCenter = false) {
    const angle = Math.random() * Math.PI * 2;
    let r;
    if (startNearCenter) {
      r = Math.random() * 10; // muy cerquita del punto de fuga
    } else {
      r = Math.random() * this.maxR * 0.3; // algo mas separado
    }
    return {
      angle,
      r,
      // este "speed" es radial
      speed: 40 + Math.random() * 80,
      baseSize: 0.8 + Math.random() * 1.7,
    };
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.centerX = width / 2;
    this.centerY = height * 0.4;
    this.maxR = Math.max(width, height) * 0.7;
  }

  update(dt) {
    for (const s of this.stars) {
      s.r += s.speed * dt;
      if (s.r > this.maxR) {
        Object.assign(s, this._randomStar(true));
      }
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = "#000010";
    ctx.fillRect(0, 0, this.width, this.height);

    for (const s of this.stars) {
      const t = s.r / this.maxR; // 0 -> cerca del centro, 1 -> borde
      const x = this.centerX + Math.cos(s.angle) * s.r;
      const y = this.centerY + Math.sin(s.angle) * s.r;

      const size = s.baseSize * (0.5 + 1.8 * t);
      const alpha = 0.25 + 0.75 * t;

      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }
}

class TablaProblem extends Sprite {
  constructor(scene, targetX, targetY, factorA, factorB, speedNorm) {
    // el tamano se recalcula cada frame; aqui solo ponemos algo base
    super(targetX, targetY, 96, 96, "#00000000");
    this.scene = scene;
    this.factorA = factorA;
    this.factorB = factorB;
    this.answer = factorA * factorB;
    this.text = `${factorA}×${factorB}`;

    this.baseSize = 52; // tamano "medio" del meteorito
    this.progress = 0; // 0 -> punto de fuga, 1 -> impacto en la nave
    this.speedNorm = speedNorm; // que tan rapido avanza (proporcion por segundo)
    this.missed = false;

    this.targetX = targetX;
    this.targetY = targetY;

    const A = this.scene.game.assets;
    this.image = A ? A.getImage("mn_meteor") : null;

    this.rotation = Math.random() * Math.PI * 2; // rotacion inicial aleatoria
    this.rotationSpeed = Math.random() * 0.8 - 0.4; // entre -0.4 y +0.4 radianes/seg
  }

  update(dt) {
    this.rotation += this.rotationSpeed * dt;

    // progreso normalizado (0 -> 1)
    this.progress += this.speedNorm * dt;

    // clamp
    const t = Math.min(this.progress, 1.0);

    // Easing: abre mas lento al principio, mas rapido al final.
    // Puedes probar t*t (suave) o t*t*t (todavia mas tiempo cerca del punto de fuga).
    const eased = t * t * t; // prueba tambien: const eased = t * t * t;

    const cx0 = this.scene.vanishX;
    const cy0 = this.scene.vanishY;

    // Interpolamos usando el valor "eased"
    this.x = cx0 + (this.targetX - cx0) * eased;
    this.y = cy0 + (this.targetY - cy0) * eased;

    const scale = 0.3 + 1.7 * eased;
    this.width = this.height = this.baseSize * scale;

    if (t >= 1 && !this.missed) {
      this.missed = true; // ya llego al cristal
    }
  }

  draw(ctx) {
    const cam = this.scene?.camera ?? { x: 0, y: 0 };
    const cx = this.x - cam.x;
    const cy = this.y - cam.y;
    const w = this.width;
    const h = this.height;

    ctx.save();

    if (this.image) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(this.rotation);
      ctx.drawImage(this.image, -w / 2, -h / 2, w, h);
      ctx.restore();
    } else {
      ctx.fillStyle = "#553322";
      ctx.beginPath();
      ctx.arc(cx, cy, w / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // operacion encima
    ctx.fillStyle = "#fff8c0";
    ctx.font = "22px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeStyle = "rgba(0,0,0,0.7)";
    ctx.lineWidth = 3;
    ctx.strokeText(this.text, cx, cy);
    ctx.fillText(this.text, cx, cy);

    ctx.restore();
  }
}

// ===========================================================
// ExplosionSprite: animacion de explosion para meteoritos
// (suponiendo spritesheet de 2 columnas x 4 filas = 8 frames)
// ===========================================================
class ExplosionSprite extends Sprite {
  constructor(scene, x, y) {
    const A = scene.game.assets;
    const img = A ? A.getImage("mn_explosion") : null;

    // tamanos aproximados; ajusta si tu sheet es mas grande/pequeno
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
    this.frameTime = 0.07; // segundos por frame
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

// ===========================================================
// ESCENA PRINCIPAL - Lluvia de Meteoritos de Multiplicaciones
// ===========================================================
class TablasScene extends Scene {
  constructor(game, options = {}) {
    super(game);

    // Rango de factores (0 a 10 por defecto)
    this.minFactor = options.minFactor ?? 0;
    this.maxFactor = options.maxFactor ?? 10;

    // Spawn y dificultad base
    this.spawnIntervalBase = options.spawnInterval ?? 5.0;
    this.baseSpeed = options.baseSpeed ?? 30;

    // Estructura de niveles "core"
    this.exercisesPerLevel = 5;
    this.totalLevelsCore = 10;
    this.totalExercisesCore = this.exercisesPerLevel * this.totalLevelsCore; // 50

    // Modo infinito
    this.allowInfinite = false;
    this.infiniteMode = false;

    // Dificultad global (va subiendo gradualmente)
    this.globalDifficulty = 0; // aumenta con cada meteorito resuelto

    // ---------- Estado del minijuego ----------
    this.state = "intro"; // "intro" | "playing" | "finished"
    this.gameFinished = false;
    this.exitDelay = 0;
    this.message = "";
    this.sheetsReward = 0;
    this.win = false;

    // Nivel actual y cola de ejercicios del nivel
    this.level = 1;
    this.currentLevelIndex = 0; // 0..9
    this.problemsQueue = [];
    this.usedCombos = new Set();

    // Metricas
    this.score = 0;
    this.streak = 0;
    this.maxStreak = 0;
    this.lives = options.maxLives ?? 3;
    this.maxLives = 8;
    this.solvedCore = 0; // aciertos dentro de los niveles 1-10
    this.solvedCount = 0; // aciertos totales (incluye infinito)
    this.missedCount = 0;
    this.totalSpawned = 0;

    // Spawn dinamico
    this.spawnTimer = 0;

    // Entrada
    this.currentAnswer = "";
    this.maxAnswerLength = 3;

    // Problemas activos
    this.problems = [];

    // Input previo
    this._prevKeys = {};

    // Sonidos
    this.sfxCorrect = "sfx_explosion";
    this.sfxWrong = "sfx_error";
    this.sfxWin = "sfx_win";
    this.sfxExtraLife = "sfx_match";
    this.sfxMiss = "sfx_choque";

    this.time = 0;
    this.npcName = "Guardiana de Meteoritos";

    //background
    this.starfield = null;
    this.cockpitImage = null;

    //shake
    this.shakeTime = 0;
    this.shakeDuration = 0.35;
    this.shakeIntensity = 10;
  }

  // Sonido
  playSfx(key, options = {}) {
    if (!key) return;
    const assets = this.game.assets;
    if (!assets || typeof assets.playSound !== "function") return;
    assets.playSound(key, options);
  }

  // =======================================================
  // INIT / DESTROY
  // =======================================================
  init() {
    if (window.MN_setLeafHUDVisible) window.MN_setLeafHUDVisible(false);
    if (window.MN_setInputMode) MN_setInputMode("keyboard");
    this.state = "intro";
    this.gameFinished = false;
    this.exitDelay = 0;
    this.message = "";
    this.sheetsReward = 0;
    this.win = false;

    this.level = 1;
    this.currentLevelIndex = 0;
    this.problemsQueue = [];
    this.usedCombos = new Set();

    this.score = 0;
    this.streak = 0;
    this.maxStreak = 0;
    this.lives = 3;
    this.solvedCore = 0;
    this.solvedCount = 0;
    this.missedCount = 0;
    this.totalSpawned = 0;
    this.spawnTimer = 0;
    this.currentAnswer = "";
    this.problems = [];
    this.time = 0;
    this._prevKeys = {};
    this.infiniteMode = false;
    this.globalDifficulty = 0;

    const A = this.game.assets;
    this.cockpitImage = A ? A.getImage("mn_tablas_cockpit") : null;

    if (this.camera && this.game.canvas) {
      this.camera.x = 0;
      this.camera.y = 0;
      this.camera.setBounds(
        0,
        0,
        this.game.canvas.width,
        this.game.canvas.height
      );
    }

    // Starfield
    const w = this.game.canvas.width;
    const h = this.game.canvas.height;
    this.vanishX = w / 2;
    this.vanishY = h * 0.4;
    this.starfield = new Starfield(w, h, 90, this.vanishX, this.vanishY);

    // Primer nivel
    this._startLevel(1);
  }

  destroy() {
    this.clearAll();
    this.problems = [];
    this.problemsQueue = [];
  }

  // =======================================================
  // UPDATE
  // =======================================================
  update(dt) {
    super.update(dt);
    this.time += dt;

    const input = this.game.input;
    const keys = input.keys || {};
    const isJustPressed = (key) => keys[key] && !this._prevKeys[key];

    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
      if (this.shakeTime < 0) this.shakeTime = 0;
    }

    // Juego terminado
    if (this.gameFinished) {
      if (this.exitDelay > 0) {
        this.exitDelay -= dt;
        this._prevKeys = { ...keys };
        return;
      }

      const wantsExit =
        input.isDown("Enter") ||
        input.isDown(" ") ||
        (input.mouse && input.mouse.down);

      if (wantsExit) {
        window.MN_APP?.toOverworld?.();
      }

      this._prevKeys = { ...keys };
      return;
    }

    // Intro
    if (this.state === "intro") {
      if (isJustPressed("Enter") || isJustPressed(" ")) {
        this.state = "playing";        
      }
      this._prevKeys = { ...keys };
      return;
    }

    if (this.starfield) {
      this.starfield.update(dt);
    }

    // Playing
    if (this.state === "playing") {
      // --- Spawner ---
      this.spawnTimer += dt;
      const currentSpawnInterval = this._getCurrentSpawnInterval();
      if (this.spawnTimer >= currentSpawnInterval) {
        this.spawnTimer = 0;
        if (this.infiniteMode) {
          this._spawnProblemInfinite();
        } else {
          this._spawnProblemFromQueue();
        }
      }

      // Revisar problemas perdidos
      this.problems = this.problems.filter((p) => {
        if (p.missed) {
          this._onProblemMissed(p);
          this.remove(p);
          return false;
        }
        return true;
      });

      // Entrada numerica
      for (let d = 0; d <= 9; d++) {
        const key = String(d);
        if (isJustPressed(key)) {
          if (this.currentAnswer.length < this.maxAnswerLength) {
            this.currentAnswer += key;
          }
        }
      }

      if (isJustPressed("Backspace")) {
        this.currentAnswer = this.currentAnswer.slice(0, -1);
      }

      if (isJustPressed("Enter")) {
        this._checkAnswer();
      }

      if (isJustPressed("Escape")) {
        window.MN_APP?.toOverworld?.();
      }

      // Fin por vidas?
      if (this._checkEndConditions()) {
        this._prevKeys = { ...keys };
        return;
      }

      // Fin de nivel (solo en core)?
      if (!this.infiniteMode) {
        this._checkLevelProgress();
      }
    }

    this._prevKeys = { ...keys };
  }

  // =======================================================
  // DRAW
  // =======================================================
  draw(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    ctx.save();

    // si hay shake, aplicamos una pequena traslacion aleatoria
    if (this.shakeTime > 0) {
      const t = this.shakeTime / this.shakeDuration; // 1 -> 0
      const intensity = this.shakeIntensity * t;
      const dx = (Math.random() * 2 - 1) * intensity;
      const dy = (Math.random() * 2 - 1) * intensity;
      ctx.translate(dx, dy);
    }

    // Capa 1: estrellas
    if (this.starfield) {
      this.starfield.draw(ctx);
    } else {
      ctx.fillStyle = "#050515";
      ctx.fillRect(0, 0, W, H);
    }

    // Oscurecer un poco el interior
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, 0, W, H);

    // Capa 2: meteoritos, explosiones, etc.
    super.draw(ctx);

    // Capa 3: cabina de la nave
    if (this.cockpitImage) {
      ctx.drawImage(this.cockpitImage, 0, 0, W, H);
    }

    // Capa 4: HUD en la consola (panel inferior)
    this._drawHUD(ctx);

    // Capa 5: mensajes de intro / fin, por encima de todo
    if (this.state === "intro") {
      this._drawIntro(ctx);
    }
    if (this.state === "finished") {
      this._drawEndMessage(ctx);
    }
  }

  _drawHUD(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    // Zona de la consola inferior (ajusta estos coeficientes si hace falta)
    const consoleTop = H * 0.73;
    const consoleBottom = H * 0.97;
    const consoleCenterY = (consoleTop + consoleBottom) / 2;

    ctx.save();
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#dbe9ff";

    // --------- Area izquierda: nivel y vidas ---------
    ctx.textAlign = "left";
    ctx.font = "14px Arial";

    const leftX = W * 0.13;
    ctx.fillText(
      this.infiniteMode
        ? "Nivel: ∞ (infinito)"
        : `Nivel: ${this.level}/${this.totalLevelsCore}`,
      leftX + 4,
      consoleTop + 70
    );
    ctx.fillText(`Vidas: ${this.lives}`, leftX, consoleTop + 100);

    // --------- Area derecha: racha y pistas ---------
    ctx.textAlign = "right";
    const rightX = W * 0.75;

    ctx.fillText(`Puntos: ${this.score}`, rightX, consoleTop + 72);
    ctx.fillText(`Racha: ${this.streak}`, rightX + 2, consoleTop + 100);

    // --------- Pantalla central de la consola ---------
    // La usamos como "monitor" de puntos y respuesta actual
    const screenX = W * 0.46;
    ctx.textAlign = "center";
    ctx.font = "18px monospace";
    const ans = this.currentAnswer === "" ? "..." : this.currentAnswer;
    ctx.fillText(`Respuesta: ${ans}`, screenX, consoleCenterY);

    ctx.restore();
  }

  _drawIntro(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";

    ctx.font = "32px Arial";
    ctx.fillText("Lluvia de Meteoritos de Multiplicaciones", W / 2, H * 0.22);

    ctx.font = "18px Arial";
    ctx.fillText(
      "Estas cruzando una lluvia de meteoritos numéricos.",
      W / 2,
      H * 0.34
    );
    ctx.fillText(
      "Cada meteorito trae una multiplicación: resuelvela antes de que te choque.",
      W / 2,
      H * 0.4
    );
    ctx.fillText(
      "Hay 10 niveles, cada uno con 5 ejercicios distintos.",
      W / 2,
      H * 0.46
    );
    ctx.fillText(
      "Cada 5 aciertos seguidos, ganas 1 vida. Si un meteorito te choca, pierdes una vida.",
      W / 2,
      H * 0.52
    );

    ctx.font = "18px Arial";
    ctx.fillText("Pulsa ENTER o ESPACIO para comenzar.", W / 2, H * 0.66);    
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

  // =======================================================
  // LOGICA DE NIVELES Y DIFICULTAD
  // =======================================================
  _getCurrentSpawnInterval() {
    // A menor intervalo = mas rapido caen
    const minInterval = 0.6;
    const difficulty = this.level - 1 + this.globalDifficulty;
    const interval = this.spawnIntervalBase - 0.08 * difficulty;
    return Math.max(minInterval, interval);
  }

  _getCurrentSpeed() {
    // A mayor dificultad, mas rapido caen los meteoritos
    const difficulty = this.level - 1 + this.globalDifficulty;
    return this.baseSpeed + 8 * difficulty;
  }

  _startLevel(levelNumber) {
    this.infiniteMode = false;
    this.level = levelNumber;
    this.currentLevelIndex = levelNumber - 1;
    this.spawnTimer = 0;
    this.problemsQueue = [];
    this.usedCombos = new Set();

    this.problemsQueue = this._buildLevelProblems(levelNumber);
  }

  _startInfiniteMode() {
    this.infiniteMode = true;
    this.level = 11; // se muestra como "∞" en el HUD
    this.spawnTimer = 0;
    this.problemsQueue = [];
    this.usedCombos = new Set();
  }

  _buildLevelProblems(levelNumber) {
    const tables = this._getTablesForLevel(levelNumber);
    const minB = this.minFactor;
    const maxB = this.maxFactor;

    const combos = [];
    for (const a of tables) {
      for (let b = minB; b <= maxB; b++) {
        combos.push({ a, b });
      }
    }

    this._shuffleArray(combos);
    const selected = combos.slice(0, this.exercisesPerLevel);
    const result = [];
    for (const c of selected) {
      const key = `${c.a}x${c.b}`;
      this.usedCombos.add(key);
      result.push(c);
    }
    return result;
  }

  _getTablesForLevel(levelNumber) {
    switch (levelNumber) {
      case 1:
        return [2];
      case 2:
        return [3];
      case 3:
        return [4];
      case 4:
        return [5];
      case 5:
        return [2, 3, 4, 5];
      case 6:
        return [6];
      case 7:
        return [7];
      case 8:
        return [8];
      case 9:
        return [9];
      case 10:
        return [6, 7, 8, 9];
      default:
        return [2, 3, 4, 5, 6, 7, 8, 9];
    }
  }

  _spawnProblemFromQueue() {
    if (this.problemsQueue.length === 0) return;

    const combo = this.problemsQueue.shift();
    const w = this.game.canvas.width;
    const h = this.game.canvas.height;

    const spread = w * 0.15;
    const impactX = this.vanishX + (Math.random() * 2 - 1) * spread;
    const impactY = h * 0.8;

    const baseSpeed = 0.12;
    const diffFactor = 0.01;
    let speedNorm =
      baseSpeed + diffFactor * (this.level - 1 + this.globalDifficulty);
    speedNorm = Math.min(speedNorm, 0.9);

    const p = new TablaProblem(
      this,
      impactX,
      impactY,
      combo.a,
      combo.b,
      speedNorm
    );

    this.problems.push(p);
    this.add(p, "problems");
    this.totalSpawned++;
    this.globalDifficulty += 0.01;
  }

  _spawnProblemInfinite() {
    const tables = [2, 3, 4, 5, 6, 7, 8, 9];
    const a = tables[Math.floor(Math.random() * tables.length)];
    const b =
      Math.floor(Math.random() * (this.maxFactor - this.minFactor + 1)) +
      this.minFactor;

    const w = this.game.canvas.width;
    const h = this.game.canvas.height;

    const spread = w * 0.15;
    const impactX = this.vanishX + (Math.random() * 2 - 1) * spread;
    const impactY = h * 0.8;

    const baseSpeed = 0.12;
    const diffFactor = 0.04;
    let speedNorm =
      baseSpeed + diffFactor * (this.level - 1 + this.globalDifficulty);
    speedNorm = Math.min(speedNorm, 0.9);

    const p = new TablaProblem(this, impactX, impactY, a, b, speedNorm);

    this.problems.push(p);
    this.add(p, "problems");
    this.totalSpawned++;
    this.globalDifficulty += 0.01;
  }

  _checkLevelProgress() {
    if (
      this.problemsQueue.length === 0 &&
      this.problems.length === 0 &&
      !this.gameFinished
    ) {
      // Terminaste un nivel "core"
      if (this.level < this.totalLevelsCore && this.lives > 0) {
        this._startLevel(this.level + 1);
      } else if (this.level >= this.totalLevelsCore && this.lives > 0) {
        // Has terminado los 10 niveles: activar modo infinito si esta permitido
        if (this.allowInfinite) {
          this._startInfiniteMode();
        } else {
          this.win = true;
          this._finishGame(false);
        }
      }
    }
  }

  _checkEndConditions() {
    if (this.lives <= 0) {
      this.win = false;
      this._finishGame(true);
      return true;
    }
    return false;
  }

  // =======================================================
  // RESPUESTAS Y PUNTUACION
  // =======================================================
  _checkAnswer() {
    if (!this.currentAnswer) return;
    const val = parseInt(this.currentAnswer, 10);
    if (Number.isNaN(val)) {
      this.currentAnswer = "";
      return;
    }

    // Buscar el meteorito con esa respuesta, priorizando los mas altos
    let matchedIndex = -1;
    let bestY = Infinity;

    for (let i = 0; i < this.problems.length; i++) {
      const p = this.problems[i];
      if (p.answer === val) {
        if (p.y < bestY) {
          bestY = p.y;
          matchedIndex = i;
        }
      }
    }

    if (matchedIndex !== -1) {
      const p = this.problems[matchedIndex];
      this._onCorrectAnswer(p, matchedIndex);
    } else {
      this.streak = 0;
    }

    this.currentAnswer = "";
  }

  _onCorrectAnswer(problem, index) {
    this.remove(problem);
    this.problems.splice(index, 1);

    // Explosion en la posicion del meteorito
    const explosion = new ExplosionSprite(this, problem.x, problem.y);
    this.add(explosion, "effects");

    this.streak++;
    if (this.streak > this.maxStreak) this.maxStreak = this.streak;

    // Puntos (potencias de 2, cap para que no se dispare demasiado)
    const points = Math.pow(2, Math.min(this.streak - 1, 6));
    this.score += points;
    this.solvedCount++;
    if (!this.infiniteMode && this.solvedCore < this.totalExercisesCore) {
      this.solvedCore++;
    }

    // Aumentar dificultad global tambien al acertar
    this.globalDifficulty += 0.01;

    // Cada racha de 5 da 1 vida extra (hasta maxLives)
    if (this.streak > 0 && this.streak % 10 === 0) {
      if (this.lives < this.maxLives) {
        this.lives++;
        this.playSfx(this.sfxExtraLife, { volume: 0.6 });
      }
    } else {
      this.playSfx(this.sfxCorrect, { volume: 0.6 });
    }
  }

  _onProblemMissed(problem) {
    this.missedCount++;
    this.lives--;
    this.streak = 0;
    this.globalDifficulty -= 0.03;
    this.playSfx(this.sfxMiss, { volume: 0.6 });
    // activar sacudida
    this.shakeTime = this.shakeDuration;
  }

  // =======================================================
  // FIN DEL JUEGO Y RECOMPENSA
  // =======================================================
  _finishGame(failed = false) {
    if (this.gameFinished) return;
    this.gameFinished = true;
    this.state = "finished";
    this.exitDelay = 0.5;

    let tier = 0;
    if (!failed) {
      tier = 2;
    } else if (this.solvedCore >= 30) {
      tier = 1;
    }

    let gained = 0;
    if (window.MN_reportMinigameTier) {
      gained = MN_reportMinigameTier("galileo_tablas", tier);
    }
    this.sheetsReward = gained;

    if (failed) {
      this.message =
        "Demasiados meteoritos te chocaron...\n" +
        `Acertaste ${this.solvedCore} de ${this.totalExercisesCore} ejercicios.\n` +
        `Hojas ganadas: ${gained}.`;
      this.playSfx(this.sfxWrong, { volume: 0.7 });
    } else {
      this.message =
        "¡Has sobrevivido a la lluvia de multiplicaciones!\n" +
        `Acertaste ${this.solvedCore} de ${this.totalExercisesCore} ejercicios.\n` +
        `Hojas ganadas: ${gained}.`;
      this.playSfx(this.sfxWin, { volume: 0.7 });
    }

    if (this.game && this.game.events) {
      this.game.events.emit("tablas_done", {
        win: !failed,
        solvedCore: this.solvedCore,
        solvedTotal: this.solvedCount,
        missed: this.missedCount,
        totalSpawned: this.totalSpawned,
        maxStreak: this.maxStreak,
        tier,
        sheetsReward: gained,
        failed,
        infiniteModeReached: this.infiniteMode,
      });
    }
  }

  // =======================================================
  // UTILIDADES
  // =======================================================
  _shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
}

window.TablasScene = TablasScene;


