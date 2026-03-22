// ===========================================================
// DivisoresScene.js — "Arcos Divisores"
// Minijuego para practicar divisibilidad con 2,3,5,7.
// Estilo coherente con JerarquiaScene / RestasScene / TablasScene.
// ===========================================================

/* --------------------------------------------------------------------------- */
/*  CONFIGURACIÓN GLOBAL                                                       */
/* --------------------------------------------------------------------------- */
const MAX_LIVES = 5;
const KEY_SHOOT = " ";
const GHOST_SPEED = 30;
let MAX_NUMBER = 2; //icrementará segun la ronda

class NewPlayer extends Sprite {
  constructor(x = 0, y = 0) {
    // Ajusta el tamaño de acuerdo con tu spritesheet real
    super(x, y, 120, 120, "#ffffff00");

    /* ─ Estado y físicas ─────────────────────────────────────────────────── */
    this.speed = 5;
    this.bullets = [];
    this.isShooting = false;
    this.score = 0;
    this.lives = MAX_LIVES;
    this.power = 100;

    this.moving = false; // visible para la escena

    /*  Animación  */
    this.state = "idle"; // idle | walk | shot | hit | dead
    this.facing = "right"; // right | left
    this.frame = 0;
    this.frameElapsed = 0;
    this.frameInterval = 80; // ms
    this.isDying = false; // Nueva propiedad para controlar la animación de muerte
    this.deathAnimationComplete = false; // Nueva propiedad para saber cuando termina la animación

    this.sprites = null;
  }

  /* Carga los spritesheets y define filas / columnas por estado */
  /* ---------- Cargar spritesheets ------------- */
  _loadSprites() {
    const A = this.scene?.game?.assets;
    if (!A || typeof A.getImage !== "function") return null;

    const sheet = (key, rows, cols) => {
      const img = A.getImage(key);
      return { img, rows, cols, fw: null, fh: null };
    };

    const s = {
      idle: sheet("idle", 3, 7),
      walk: sheet("walk", 3, 8),
      shot: sheet("shot", 2, 4),
      hit: sheet("hit", 2, 7),
      dead: sheet("dead", 3, 4),
    };

    // Calcula frame sizes SOLO si la imagen existe y ya está cargada
    Object.values(s).forEach((t) => {
      if (!t.img) return;
      if (t.img.complete && t.img.naturalWidth > 0) {
        t.fw = t.img.width / t.cols;
        t.fh = t.img.height / t.rows;
      } else {
        t.img.onload = () => {
          t.fw = t.img.width / t.cols;
          t.fh = t.img.height / t.rows;
        };
      }
    });

    return s;
  }

  /* ----------------------------------------------------------------------- */
  /*  Actualización                                                          */
  /* ----------------------------------------------------------------------- */
  update(dt) {
    const input = this.scene.game.input;
    let moving = false;

    // Si el jugador está muriendo, solo procesar la animación
    if (this.isDying) {
      this.frameElapsed += dt * 1000;
      if (this.frameElapsed >= this.frameInterval) {
        this.frameElapsed = 0;
        const { cols, rows } = this.sprites.dead;
        const totalFrames = cols * rows;

        if (this.frame < totalFrames - 1) {
          this.frame++;
        } else {
          this.deathAnimationComplete = true;
          this.scene._finishGame();
        }
      }
      return;
    }

    // Si el jugador está vivo, procesar el movimiento normal
    if (this.lives <= 0 && !this.isDying) {
      this.isDying = true;
      this.state = "dead";
      this.frame = 0;
      return;
    }

    if (input.isDown(KEY_LEFT) && this.x > 0) {
      this.x -= this.speed;
      this.facing = "right";
      moving = true;
    }
    if (
      input.isDown(KEY_RIGHT) &&
      this.x < this.scene.levelWidth - this.width
    ) {
      this.x += this.speed;
      this.facing = "right";
      moving = true;
    }
    if (input.isDown(KEY_UP) && this.y > 250) {
      this.y -= this.speed;
      moving = true;
    }
    if (input.isDown(KEY_DOWN) && this.y < 550) {
      this.y += this.speed;
      moving = true;
    }

    /* Disparo */
    if (input.isDown(KEY_SHOOT)) this._shoot();

    // cooldown de golpe (invulnerabilidad breve)
    if (this._hitCooldown && this._hitCooldown > 0) this._hitCooldown -= dt;

    /* Estado de animación */
    if (this.lives <= 0) this.state = "dead";
    else if (this._hitCooldown && this._hitCooldown > 0) this.state = "hit";
    else if (this.isShooting) this.state = "shot";
    else if (moving) this.state = "walk";
    else this.state = "idle";

    /* Avance de frame */
    this.frameElapsed += dt * 1000;
    if (this.frameElapsed >= this.frameInterval) {
      this.frameElapsed = 0;
      // Datos de la animación actual
      const { cols, rows } = this.sprites[this.state];
      // Nº total de celdas del sprite-sheet
      const totalFrames = cols * rows;
      // Avance circular
      this.frame = (this.frame + 1) % totalFrames;
    }

    /* Balas */
    const cam = this.scene.camera;
    const margen = 50; // píxeles extra fuera de la vista
    this.bullets = this.bullets.filter((b) => {
      b.x += b.speed * dt;
      return b.x + b.width > cam.x - margen && b.x < cam.x + cam.width + margen;
    });
  }

  /* Disparo */
  _shoot() {
    if (this.isShooting) return;
    this.isShooting = true;
    this.bullets.push({
      x: this.x + (this.facing === "right" ? this.width : -5),
      y: this.y + this.height / 2 + 5,
      width: 5,
      height: 10,
      speed: 720, // px/segundo (en vez de 12 por frame)
    });
    setTimeout(() => (this.isShooting = false), 100);
  }

  /* Orbes */
  applyOrbEffect(orb) {
    const v = orb.value;
    switch (orb.operation) {
      case "+":
        this.power += v;
        break;
      case "-":
        this.power -= v;
        break;
      case "×":
        this.power *= v;
        break;
      case "/":
        this.power = Math.floor(this.power / v);
        break;
    }
    this.power = Math.max(1, Math.min(this.power, 9999)); // 1 … 9999
  }

  /* Dibujado */
  draw(ctx) {
    if (!this.sprites) return;
    const spr = this.sprites[this.state];
    if (!spr || !spr.img || !spr.fw) return;

    const { cols } = this.sprites[this.state];

    const col = this.frame % cols; // 0 … cols-1
    const row = Math.floor(this.frame / cols); // 0 … rows-1
    if (!spr.fw) return; // hoja aún sin cargar

    ctx.save();
    ctx.drawImage(
      spr.img, // imagen del sprite-sheet
      col * spr.fw, // sx
      row * spr.fh, // sy
      spr.fw,
      spr.fh,
      this.x,
      this.y,
      this.width,
      this.height,
    );

    ctx.restore();

    /* Balas */
    ctx.fillStyle = `hsl(${Math.min(120, this.power)}, 100%, 50%)`;
    this.bullets.forEach((b) => ctx.fillRect(b.x, b.y, b.width, b.height));
  }
}

class FactorPlayer extends NewPlayer {
  constructor(scene, x, y) {
    super(x, y);
    this.scene = scene;

    this.allowedFactors = [1, 2, 3, 5, 7];
    this.currentFactor = 2;
  }

  update(dt) {
    const input = this.scene.game.input;
    const keys = input.keys || {};
    const isJustPressed = (k) => keys[k] && !this.scene._prevKeys[k];

    // Cambiar arco con 2,3,5,7 (solo flanco)
    if (isJustPressed("1")) this._setFactor(1);
    if (isJustPressed("2")) this._setFactor(2);
    if (isJustPressed("3")) this._setFactor(3);
    if (isJustPressed("5")) this._setFactor(5);
    if (isJustPressed("7")) this._setFactor(7);

    super.update(dt);
  }

  _setFactor(f) {
    if (this.currentFactor === f) return;
    if (!this.allowedFactors.includes(f)) return;
    this.currentFactor = f;
    // Sonidito opcional al cambiar, si quieres:
    // this.scene.playSfx("sfx_match", { volume: 0.25 });
  }

  _shoot() {
    if (this.isShooting) return;
    this.isShooting = true;

    const factor = this.currentFactor;
    const dir = this.facing === "right" ? 1 : -1;

    this.bullets.push({
      x: this.x + (dir > 0 ? this.width : -8),
      y: this.y + this.height / 2 + 5,
      width: 10,
      height: 14,
      speed: 720, // px/s
      factor,
    });

    // sonido coherente
    this.scene.playSfx(this.scene.sfxShot, { volume: 0.45 });

    setTimeout(() => (this.isShooting = false), 120);
  }
}

////////////////////////////////////////////////////////////////////////////
class NumberEnemy extends Sprite {
  constructor(scene, x, y, value) {
    super(x, y, 64, 64, "#4caf50");
    this.scene = scene;
    this.value = value;

    // ✅ velocidad en px/segundo (no por frame)
    this.speed = GHOST_SPEED; // <-- ajusta: 70..120 suele ir bien
    this.opacity = 1;
    this.pulseT = Math.random() * Math.PI * 2;

    // ✅ sprite del fantasma
    this.ghost = null;

    // (Opcional) si tu sprite tiene transparencia y quieres halo suave
    this.drawHalo = true;
  }

  update(dt) {
    this.pulseT += dt * 3;

    // ✅ mover hacia la izquierda usando dt
    this.x -= this.speed * dt;

    const cam = this.scene?.camera ?? { x: 0, y: 0 };
    if (this.x + this.width < cam.x - 80) {
      this.scene._onEnemyEscaped(this);
      this.scene.remove(this);
    }
  }

  draw(ctx) {
    const cam = this.scene?.camera ?? { x: 0, y: 0 };
    const cx = this.x - cam.x;
    const cy = this.y - cam.y;

    const img = this.scene?.game?.assets?.getImage("ghost");

    ctx.save();
    ctx.globalAlpha = this.opacity;

    // halo leve (opcional)
    const pulse = 0.06 * Math.sin(this.pulseT) + 1;
    if (this.drawHalo) {
      ctx.fillStyle = "rgba(180, 220, 255, 0.12)";
      ctx.beginPath();
      ctx.arc(
        cx + this.width / 2,
        cy + this.height / 2,
        (this.width / 2) * pulse + 10,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }

    // ✅ sprite (fallback a círculo si no carga)
    if (img) {
      const w = this.width * 1.05 * pulse;
      const h = this.height * 1.05 * pulse;
      ctx.drawImage(
        img,
        cx + (this.width - w) / 2,
        cy + (this.height - h) / 2,
        w,
        h,
      );
    } else {
      // fallback
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(
        cx + this.width / 2,
        cy + this.height / 2,
        (this.width / 2) * pulse,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }

    // número encima
    ctx.fillStyle = "#000000ff";
    ctx.font = "26px Arial"; // +4 px
    ctx.lineWidth = 4; // contorno más fuerte
    ctx.strokeStyle = "rgba(0,0,0,0.7)";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeText(this.value, cx + this.width / 2, cy + this.height / 2);
    ctx.fillText(this.value, cx + this.width / 2, cy + this.height / 2);

    ctx.restore();
  }
}

////////////////////////////////////////////////////////////////////
class DivisoresScene extends Scene {
  constructor(game) {
    super(game);
    this.type = "DivisoresScene";

    // Estado general (formato estándar)
    this.state = "intro"; // "intro" | "playing" | "finished"
    this.gameFinished = false;
    this.exitDelay = 0;
    this.message = "";
    this.sheetsReward = 0;
    this.win = false;
    this.levelWidth = 1200;
    this.minSpawnGap = 500;
    this.maxLives = MAX_LIVES;
    this.scorePerKill = 10;

    // Métricas / reglas
    this.score = 0;
    this.correct = 0;
    this.escaped = 0;

    // Condiciones de victoria/derrota (ajustables)
    this.maxEscapes = 5;
    this.goalCorrect = 30; // ahora se “completa” con 30
    this.tutorialSpawns = 10; // primeros 10 fantasmas fáciles
    this.spawnedCount = 0;
    this.easyValues = [2, 3, 4, 5, 7, 8, 9, 11, 13, 16];

    // Spawning
    this.spawnTimer = 0;
    this.spawnInterval = 2.2; // s (se ajusta por dificultad)
    this.enemySpeedBase = 90; // px/s
    this.tutorialEnemySpeed = 55;

    // Lanes (posiciones Y)
    this.lanes = [310, 370, 430, 490, 550];

    // Entidades
    this.player = null;
    this.enemies = [];
    this.bgImage = null;

    // Input previo (formato estándar)
    this._prevKeys = {};

    // Sonidos coherentes con tu “ecosistema”
    this.sfxCorrect = "sfx_match";
    this.sfxWrong = "sfx_error";
    this.sfxKill = "sfx_choque";
    this.sfxWin = "sfx_win";
    this.sfxShot = "sfx_ok";

    // Nombre NPC (por consistencia, por si luego lo usas en historia)
    this.npcName = "Maestro de Arcos Divisores";
  }

  /* ====================== Utilidad de sonidos ======================= */
  playSfx(key, options = {}) {
    if (!key) return;
    const assets = this.game.assets;
    if (!assets || typeof assets.playSound !== "function") return;
    assets.playSound(key, options);
  }

  /* ============================ CICLO DE VIDA ============================ */
  init() {
    if (window.MN_setLeafHUDVisible) window.MN_setLeafHUDVisible(false);
    // Icono de teclado
    if (window.MN_setInputMode) MN_setInputMode("keyboard");

    // Reset estándar
    this.state = "intro";
    this.gameFinished = false;
    this.exitDelay = 0;
    this.message = "";
    this.sheetsReward = 0;
    this.win = false;

    this.score = 0;
    this.correct = 0;
    this.escaped = 0;

    this.spawnTimer = 0;
    this.spawnedCount = 0;

    this.enemies = [];
    this._prevKeys = {};

    // Fondo (si luego agregas una key de assets, aquí lo enchufas)
    const A = this.game.assets;
    this.bgImage = (A && A.getImage && A.getImage("mn_bg_divisores")) || null;

    // Cámara (igual que tus otros minijuegos)
    if (this.camera && this.game.canvas) {
      this.camera.x = 0;
      this.camera.y = 0;
      this.camera.setBounds(
        0,
        0,
        this.game.canvas.width,
        this.game.canvas.height,
      );
    }

    // Crear jugador (usamos tu Player base)
    const startX = 110;
    const startY = this.game.canvas.height / 2 - 80;
    this.player = new FactorPlayer(this, startX, startY);
    this.player.lives = this.maxLives;
    this.player.sprites = this.player._loadSprites();
    if (!this.player.sprites) {
      console.warn("Player sprites no cargados. Revisa assets keys.");
    }

    this.add(this.player, "player");
  }

  destroy() {
    this.clearAll();
  }

  /* ============================= UPDATE ============================ */
  update(dt) {
    super.update(dt);

    const input = this.game.input;
    const keys = input.keys || {};
    const isJustPressed = (k) => keys[k] && !this._prevKeys[k];

    // ----- Juego terminado -----
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

    // ----- Intro -----
    if (this.state === "intro") {
      if (isJustPressed("Enter") || isJustPressed(" ")) {
        this.state = "playing";
      }
      this._prevKeys = { ...keys };
      return;
    }

    // ----- Playing -----
    if (this.state === "playing") {
      // Spawner
      this.spawnTimer += dt;
      const interval = this._getSpawnInterval();
      if (this.spawnTimer >= interval) {
        this.spawnTimer = 0;
        this._spawnEnemy();
      }

      // Colisiones bala-enemigo
      this._handleCollisions();

      // bajar i-frames
      this._playerIFrames = Math.max(0, (this._playerIFrames || 0) - dt);

      // choque jugador-enemigo
      this._handlePlayerEnemyCollisions();

      // Condiciones de fin
      if (this._checkEndConditions()) {
        this._prevKeys = { ...keys };
        return;
      }

      // Escape para reiniciar en test
      if (isJustPressed("Escape")) {
        this.init();
      }
    }

    this._prevKeys = { ...keys };
  }

  /* ============================= DRAW ============================ */
  draw(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    // --- FONDO
    const bg = this.game.assets.getImage("bg_divisores");
    if (bg) {
      // Escalado tipo "cover"
      const scale = Math.max(W / bg.width, H / bg.height);
      const bw = bg.width * scale;
      const bh = bg.height * scale;
      const bx = (W - bw) / 2;
      const by = (H - bh) / 2;
      ctx.drawImage(bg, bx, by, bw, bh);
    } else {
      // fallback si no carga
      ctx.fillStyle = "#1a0f1f";
      ctx.fillRect(0, 0, W, H);
    }

    // Capa oscura sutil como en Restas/Tablas
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, 0, W, H);

    // Entidades
    super.draw(ctx);

    // HUD propio (no depende de overlay HTML)
    this._drawHUD(ctx);

    // overlays de estado
    if (this.state === "intro") this._drawIntro(ctx);
    if (this.state === "finished") this._drawEndMessage(ctx);
  }

  _drawHUD(ctx) {
    const W = this.game.canvas.width;
    ctx.save();

    // Corazones
    const lives = this.player ? this.player.lives : 0;
    const max = this.maxLives || 3;
    const heartSize = 16;
    const baseX = 80;
    const baseY = 31;

    for (let i = 0; i < max; i++) {
      const x = baseX + i * (heartSize + 6);
      const y = baseY;
      ctx.fillStyle = i < lives ? "#ff4b5c" : "#5b2b35";
      this._drawHeart(ctx, x, y, heartSize);
    }

    ctx.restore();

    // Tipo de bala (arriba-derecha)
    if (this.player && this.player.currentFactor != null) {
      const f = this.player.currentFactor;
      const label = f === 1 ? "1★" : String(f);

      const x = this.game.canvas.width - 60;
      const y = 235;

      ctx.save();
      ctx.globalAlpha = 0.95;

      // fondo
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.beginPath();
      ctx.roundRect(x - 45, y - 22, 90, 44, 10);
      ctx.fill();

      // texto
      ctx.fillStyle = "#ffffff";
      ctx.font = "14px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Bala", x, y - 8);

      ctx.font = "18px Arial";
      ctx.fillText(label, x, y + 10);

      ctx.restore();
    }

    // Eliminados / meta
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.font = "16px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`Eliminados: ${this.correct}/${this.goalCorrect}`, 80, 55);
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
    ctx.fillText("Divisores Primos", W / 2, H * 0.25);

    ctx.font = "18px Arial";
    ctx.fillText("Los fantasmas traen un número.", W / 2, H * 0.38);
    ctx.fillText(
      "Selecciona el tipo de bala con 2, 3, 5 ó 7.",
      W / 2,
      H * 0.44,
    );
    ctx.fillText(
      "Tecla 1: bala especial para rematar cuando el número ya no tiene divisor 2,3,5,7.",
      W / 2,
      H * 0.5,
    );
    ctx.fillText("Dispara SOLO si tu bala divide al número.", W / 2, H * 0.56);

    ctx.fillText(
      `Ganas al llegar a ${this.goalCorrect} aciertos.`,
      W / 2,
      H * 0.62,
    );
    ctx.fillText(`Pierdes si se escapan ${this.maxEscapes}.`, W / 2, H * 0.7);

    ctx.font = "18px Arial";
    ctx.fillText("Pulsa ENTER o ESPACIO para comenzar.", W / 2, H * 0.8);
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

  /* ========================== LÓGICA ========================== */
  _getSpawnInterval() {
    // baja lentamente con dificultad (cap)
    const minInterval = 0.7;
    const interval = this.spawnInterval;
    return Math.max(minInterval, interval);
  }

  _getEnemySpeed() {
    if (this.spawnedCount < this.tutorialSpawns) {
      return this.tutorialEnemySpeed; // primeros 10
    }
    return this.enemySpeedBase; // resto del juego
  }

  _randomEnemyValue() {
    // Prefacio: 10 fantasmas fáciles para entrar en ritmo
    if (this.spawnedCount < this.tutorialSpawns) {
      const a = this.easyValues;
      return a[Math.floor(Math.random() * a.length)];
    }

    // Luego: tu lógica normal
    const candidates = [];
    for (let n = 4; n <= MAX_NUMBER; n++) {
      if (n % 2 === 0 || n % 3 === 0 || n % 5 === 0 || n % 7 === 0) {
        candidates.push(n);
      }
    }
    return candidates[Math.floor(Math.random() * candidates.length)] || 6;
  }

  _spawnEnemy() {
    const W = this.game.canvas.width;

    // ✅ Evita spawnear si el último enemigo está muy cerca del borde derecho
    const last = this.enemies[this.enemies.length - 1];
    if (last && W + 80 - last.x < this.minSpawnGap) return;

    const laneY = this.lanes[Math.floor(Math.random() * this.lanes.length)];
    MAX_NUMBER += 2;    
    const value = this._randomEnemyValue();

    const e = new NumberEnemy(this, W + 80, laneY, value);
    e.speed = this._getEnemySpeed();

    this.enemies.push(e);
    this.add(e, "enemies");
    this.spawnedCount++;
  }

  _onEnemyEscaped(enemy) {
    if (this.gameFinished) return;
    this.escaped++;
    this.player.lives--;

    this.playSfx(this.sfxWrong, { volume: 0.5 });
    this._checkEndConditions();
  }

  _handleCollisions() {
    if (!this.player || !Array.isArray(this.player.bullets)) return;

    const bullets = this.player.bullets;

    this.enemies = this.enemies.filter((enemy) => {
      let alive = true;

      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];

        const hit =
          b.x < enemy.x + enemy.width &&
          b.x + b.width > enemy.x &&
          b.y < enemy.y + enemy.height &&
          b.y + b.height > enemy.y;

        if (!hit) continue;

        // quitar bala
        bullets.splice(i, 1);

        const factor =
          b.factor || (this.player ? this.player.currentFactor : 2);

        // ✅ aplicar lógica nueva (divide o multiplica)
        alive = this._applyHitToEnemy(enemy, factor);

        // una bala solo afecta a un enemigo
        break;
      }

      return alive;
    });
  }

  _checkEndConditions() {
    if (this.gameFinished) return true;

    if (this.correct >= this.goalCorrect) {
      this._finishGame(false);
      return true;
    }

    if (this.escaped >= this.maxEscapes) {
      this._finishGame(true);
      return true;
    }

    if (this.player.lives <= 0) {
      this._finishGame(true);
      return true;
    }

    return false;
  }

  _drawHeart(ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + s / 4);
    ctx.bezierCurveTo(x, y, x - s / 2, y, x - s / 2, y + s / 4);
    ctx.bezierCurveTo(x - s / 2, y + s / 2, x, y + s * 0.8, x, y + s);
    ctx.bezierCurveTo(
      x,
      y + s * 0.8,
      x + s / 2,
      y + s / 2,
      x + s / 2,
      y + s / 4,
    );
    ctx.bezierCurveTo(x + s / 2, y, x, y, x, y + s / 4);
    ctx.fill();
  }

  _applyHitToEnemy(enemy, factor) {
    // factor normal 2/3/5/7
    if (factor === 1) {
      // bala especial: si no es divisible por 2/3/5/7, “remata”
      const allowed = [2, 3, 5, 7];
      const hasAllowedDivisor = allowed.some((f) => enemy.value % f === 0);

      if (!hasAllowedDivisor) {
        // remate: lo llevas a 1 en un disparo (equivale a dividir por sí mismo si es primo)
        enemy.value = 1;
      } else {
        // si todavía tiene divisor permitido, puedes decidir:
        // A) no hacer nada (para “no desperdiciar”)
        // B) tratarlo como “factor 2” por defecto
        // Yo recomiendo A:
        this.playSfx(this.sfxWrong, { volume: 0.25 });
        return true;
      }
    } else if (!factor || factor < 2) {
      factor = 2;
    }

    if (enemy.value % factor === 0) {
      enemy.value = Math.floor(enemy.value / factor);
      this.playSfx(this.sfxCorrect, { volume: 0.55 });

      if (enemy.value <= 1) {
        this.correct++;
        this.score += this.scorePerKill;
        this.remove(enemy);
        return false;
      }
      return true;
    } else {
      enemy.value = enemy.value * factor;
      this.playSfx(this.sfxWrong, { volume: 0.35 });
      return true;
    }
  }

  _handlePlayerEnemyCollisions() {
    if (!this.player) return;

    // invulnerabilidad breve
    this._playerIFrames = this._playerIFrames || 0;
    if (this._playerIFrames > 0) return;

    const px = this.player.x,
      py = this.player.y,
      pw = this.player.width,
      ph = this.player.height;

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];

      const hit =
        px < e.x + e.width &&
        px + pw > e.x &&
        py < e.y + e.height &&
        py + ph > e.y;

      if (!hit) continue;

      // castigo: pierde vida y el fantasma se va
      this.player.lives--;
      this.playSfx(this.sfxWrong, { volume: 0.5 });

      this.remove(e);
      this.enemies.splice(i, 1);

      // i-frames para evitar doble castigo instantáneo
      this._playerIFrames = 0.6; // segundos
      break;
    }
  }

  _finishGame(failed = false) {
    if (this.gameFinished) return;

    this.gameFinished = true;
    this.state = "finished";
    this.exitDelay = 0.5;
    this.win = !failed;

    // Tier (estilo Restas/Tablas: 0/1/2)
    // - 2: gana (>= goalCorrect)
    // - 1: 50% del objetivo o más
    // - 0: menos
    const ratio = this.goalCorrect > 0 ? this.correct / this.goalCorrect : 0;
    let tier = 0;
    if (!failed && ratio >= 0.8) tier = 2;
    else if (ratio >= 0.5) tier = 1;

    let gained = 0;
    if (window.MN_reportMinigameTier) {
      gained = MN_reportMinigameTier("eratostenes_divisores", tier);
    }
    this.sheetsReward = gained;

    if (failed) {
      this.message =
        "Los monstruos te superaron...\n" +
        `Aciertos: ${this.correct} |  Escapados: ${this.escaped}\n` +
        `Hojas ganadas: ${gained}.`;
      this.playSfx(this.sfxWrong, { volume: 0.7 });
    } else {
      this.message =
        "¡Dominaste los arcos divisores!\n" +
        `Aciertos: ${this.correct} |  Escapados: ${this.escaped}\n` +
        `Hojas ganadas: ${gained}.`;
      this.playSfx(this.sfxWin, { volume: 0.7 });
    }

    if (this.game && this.game.events) {
      this.game.events.emit("divisores_done", {
        win: !failed,
        correct: this.correct,
        escaped: this.escaped,
        lives: this.player.lives,
        tier,
        sheetsReward: gained,
        failed,
      });
    }
  }
}

window.DivisoresScene = DivisoresScene;
