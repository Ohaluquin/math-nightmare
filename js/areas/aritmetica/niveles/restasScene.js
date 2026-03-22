// ===========================================================
// RestasScene.js – El sendero de las Luciernagas
// Minijuego de restas como distancias en la recta numérica.
// ===========================================================
const altura = 200; //subir la luciernaga

class HitFX extends Sprite {
  constructor(scene, x, y) {
    super(x - 30, y - 30, 60, 60);
    this.scene = scene;
    this.time = 0;
    this.duration = 0.6; 
    this.particles = [];

    // Generar 8 partículas que saldrán en distintas direcciones
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      this.particles.push({
        x: 0,
        y: 0,
        vx: Math.cos(angle) * (40 + Math.random() * 20),
        vy: Math.sin(angle) * (40 + Math.random() * 20),
        life: 1,
      });
    }
  }

  update(dt) {
    this.time += dt;
    if (this.time >= this.duration) {
      this.scene.remove(this);
      return;
    }

    const t = this.time / this.duration;

    // actualizar partículas
    for (let p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life = 1 - t;
    }
  }

  draw(ctx) {
    const cam = this.scene?.camera ?? { x: 0, y: 0 };
    const px = this.x - cam.x;
    const py = this.y - cam.y;
    const t = this.time / this.duration;

    ctx.save();

    // halo circular
    ctx.globalAlpha = 1 - t;
    const radius = 10 + t * 30;
    const grad = ctx.createRadialGradient(
      px + this.width / 2,
      py + this.height / 2,
      1,
      px + this.width / 2,
      py + this.height / 2,
      radius,
    );
    grad.addColorStop(0, "rgba(255,255,200,0.9)");
    grad.addColorStop(1, "rgba(255,215,0,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px + this.width / 2, py + this.height / 2, radius, 0, Math.PI * 2);
    ctx.fill();

    // partículas
    for (let p of this.particles) {
      ctx.globalAlpha = p.life * 0.8;
      ctx.fillStyle = "rgba(255,255,150,1)";
      ctx.beginPath();
      ctx.arc(
        px + this.width / 2 + p.x,
        py + this.height / 2 + p.y,
        3,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }

    ctx.restore();
  }
}

class HunterSprite extends Sprite {
  constructor(x, y) {
    super(x, y, 100, 150, "#0000");

    this.image = null;

    // spritesheet 1 fila x 11 columnas
    this.sheetCols = 11;
    this.sheetRows = 1;

    this.walkAnim = null;

    // ✅ control de caminar
    this.isWalking = false;

    // ✅ offsets de dibujo (si ya estabas alineando el sprite)
    // Ajusta si lo necesitas (por ahora 0,0 es lo más estable)
    this.drawOffsetX = -70;
    this.drawOffsetY = -70;

    // ✅ punto relativo de la boca de la pistola (en porcentaje del sprite dibujado)
    this.muzzleRelX = 0.94; // 0..1
    this.muzzleRelY = 0.2; // 0..1
  }

  _ensureAnimReady() {
    if (this.walkAnim) return true;
    const assets = this.scene?.game?.assets;
    if (!assets) return false;

    this.image = assets.getImage("hunter");
    if (!this.image) return false;

    const fw = this.image.width / this.sheetCols;
    const fh = this.image.height / this.sheetRows;

    const frames = [];
    for (let i = 0; i < this.sheetCols; i++) {
      frames.push({ x: i * fw, y: 0, w: fw, h: fh });
    }

    this.walkAnim = new Animation({ frames, fps: 12, loop: true });
    return true;
  }

  // ✅ para que el disparo salga de la pistola
  getMuzzlePosition() {
    // OJO: devolvemos coordenadas en MUNDO (no con cámara)
    const mx = this.x + this.drawOffsetX + this.width * this.muzzleRelX;
    const my = this.y + this.drawOffsetY + this.height * this.muzzleRelY;

    return { x: mx, y: my };
  }

  update(dt) {
    if (!this.walkAnim) return;

    if (this.isWalking) {
      this.walkAnim.update(dt);
    } else {
      // ✅ Quieto: deja el frame 0 fijo
      // NO: this.walkAnim.frame = ...
      // SÍ:
      if (this.walkAnim.index !== 0) this.walkAnim.reset(); // index=0 y _elapsed=0
    }
  }

  draw(ctx) {
    if (!this._ensureAnimReady()) return;

    // si aún no está listo, no dibuja
    if (!this.walkAnim || !this.image) return;

    const cam = this.scene?.camera ?? { x: 0, y: 0 };
    const px = this.x - cam.x + this.drawOffsetX;
    const py = this.y - cam.y + this.drawOffsetY;

    const f = this.walkAnim.frame || this.walkAnim.frames[0];

    ctx.save();
    ctx.drawImage(
      this.image,
      f.x,
      f.y,
      f.w,
      f.h, // recorte del sheet
      px,
      py,
      this.width,
      this.height, // destino escalado
    );
    ctx.restore();
  }
}

class FireflySprite extends Sprite {
  constructor(x, y, value) {
    super(x, y, 40, 40, "#ffd54f");
    this.value = value;
    this.pulseT = Math.random() * Math.PI * 2;

    this.originalY = y;

    // 🔹 Estado de escape
    this.isEscaping = false;
    this.escapeVX = 0;
    this.escapeVY = 0;
    this.opacity = 1;
  }

  update(dt) {
    this.pulseT += dt * 3;

    if (this.isEscaping) {
      // Movimiento de escape
      this.x += this.escapeVX * dt;
      this.y += this.escapeVY * dt;

      // ligera gravedad hacia abajo
      this.escapeVY += 40 * dt;

      // desvanecer
      this.opacity -= dt * 0.8;
      if (this.opacity < 0) this.opacity = 0;
      return;
    }

    // Movimiento normal (flotando)
    this.yBase = this.originalY + Math.sin(this.pulseT * 0.8) * 8;
    this.y = this.yBase;
  }

  startEscape() {
    this.isEscaping = true;
    this.escapeVX = 130 + Math.random() * 70;
    this.escapeVY = -50 - Math.random() * 40;
  }

  draw(ctx) {
    const cam = this.scene?.camera ?? { x: 0, y: 0 };
    const px = this.x - cam.x;
    const py = this.y - cam.y;

    ctx.save();
    ctx.globalAlpha = this.opacity;

    const pulse = 0.15 * Math.sin(this.pulseT) + 1;

    // halo
    const radius = 24 * pulse;
    const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, radius);
    grad.addColorStop(0, "rgba(255, 255, 200, 1)");
    grad.addColorStop(1, "rgba(255, 215, 0, 0)");

    ctx.translate(px + this.width / 2, py + this.height / 2);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // cuerpo
    ctx.fillStyle = "#ffeb3b";
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();

    // número
    ctx.fillStyle = "#3e2723";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.value, 0, 0);

    ctx.restore();
  }
}

class ShotBubble extends Sprite {
  constructor(startX, startY, targetX, targetY, onArrive) {
    super(startX, startY, 20, 20, "#80deea");
    this.startX = startX;
    this.startY = startY;
    this.targetX = targetX;
    this.targetY = targetY;
    this.t = 0;
    this.speed = 2.5; // factor de interpolación
    this.onArrive = onArrive;
    this._done = false;
  }

  update(dt) {
    this.t += dt * this.speed;
    const p = Math.min(1, this.t);

    this.x = this.startX + (this.targetX - this.startX) * p;
    this.y =
      this.startY +
      (this.targetY - this.startY) * p -
      Math.sin(p * Math.PI) * 20; // pequeña curva

    if (p >= 1 && !this._done) {
      this._done = true;
      if (typeof this.onArrive === "function") {
        this.onArrive();
      }
      this.scene.remove(this);
    }
  }

  draw(ctx) {
    const cam = this.scene?.camera ?? { x: 0, y: 0 };
    const px = this.x - cam.x;
    const py = this.y - cam.y;

    ctx.save();
    ctx.fillStyle = "rgba(178, 235, 242, 0.9)";
    ctx.beginPath();
    ctx.arc(
      px + this.width / 2,
      py + this.height / 2,
      this.width / 2,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(0, 151, 167, 0.8)";
    ctx.stroke();
    ctx.restore();
  }
}

// ===========================================================
// ESCENA PRINCIPAL – El sendero de las luciernagas
// ===========================================================
class RestasScene extends Scene {
  constructor(game) {
    super(game);

    // Estado general del minijuego
    this.state = "intro"; // "intro" | "playing" | "finished"
    this.gameFinished = false;
    this.exitDelay = 0;
    this.message = "";
    this.sheetsReward = 0;
    this.win = false;

    // Recta numérica
    this.axisStartX = 80;
    this.axisY = 520;
    this.pixelsPerUnit = 16;
    this.maxUnits = 50;

    // Estado de ronda
    this.phase = "idle"; // "approach" | "aim" | "resolving"
    this.timeLimit = 25;
    this.remainingTime = this.timeLimit;

    this.minDistance = 5;
    this.maxDistance = 9;

    this.caughtCount = 0;
    this.escapedCount = 0;
    this.totalAttempts = 0;
    this.maxEscapes = 3;
    this.maxAttempts = 12;
    this.minToWin = 10;

    this.targetNumber = 0;
    this.hunterNumber = 0;
    this.approachStartNumber = 0;

    // Sprites
    this.hunter = null;
    this.firefly = null;

    // Entrada del jugador
    this.inputValue = "";
    this.hasShot = false;

    // Fondo
    this.bgImage = null;

    // Control de teclado
    this._prevKeys = {};

    // Pequeño reloj para efectos
    this.time = 0;

    // Sonidos coherentes con otros minijuegos
    this.sfxCorrect = "sfx_match";
    this.sfxWrong = "sfx_error";
    this.sfxShot = "hit_sfx";
    this.sfxWin = "sfx_win";

    // Nombre de NPC / guardian (por si luego dibujas un retrato)
    this.npcName = "El guardian del sendero";
  }

  // ----------------- Utilidad de sonido -----------------
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
    this.gameFinished = false;
    this.exitDelay = 0;
    this.message = "";
    this.sheetsReward = 0;
    this.win = false;

    this.state = "intro";
    this.phase = "idle";

    this.caughtCount = 0;
    this.escapedCount = 0;
    this.totalAttempts = 0;

    this.inputValue = "";
    this.time = 0;

    const A = this.game.assets;
    // Fondo: intenta uno específico, si no, usa cualquiera coherente.
    this.bgImage = (A && A.getImage("mn_bg_restas")) || null;

    // Cámara
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

    // Crear sprites principales
    const hunterX = this._valueToX(0);
    const hunterY = this.axisY - 80;
    this.hunter = new HunterSprite(this, hunterX, hunterY);
    this.add(this.hunter, "entities");

    const fireflyX = this._valueToX(20);
    const fireflyY = this.axisY - altura;
    this.firefly = new FireflySprite(fireflyX, fireflyY, 20);
    this.add(this.firefly, "entities");

    this._prevKeys = {};
  }

  destroy() {
    this.clearAll();
    this.hunter = null;
    this.firefly = null;
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

    // ----------------- Juego ya terminado -----------------
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

    // ----------------- INTRO -----------------
    if (this.state === "intro") {
      if (isJustPressed("Enter") || isJustPressed(" ")) {
        this.state = "playing";
        this._startNewRound();
      }
      this._prevKeys = { ...keys };
      return;
    }

    // ----------------- PLAYING -----------------
    if (this.state === "playing") {
      if (this.phase === "approach") {
        // Mover al cazador hasta su posición sigilosa
        const targetX = this._valueToX(this.hunterNumber);
        const speed = 160; // px/s
        if (this.hunter.x < targetX) {
          this.hunter.x += speed * dt;
          if (this.hunter.x > targetX) this.hunter.x = targetX;
        }

        if (Math.abs(this.hunter.x - targetX) < 1) {
          this.hunter.x = targetX;
          this._enterAimPhase();
        }
      } else if (this.phase === "aim") {
        // Temporizador
        this.remainingTime -= dt;
        if (this.remainingTime <= 0 && !this.hasShot) {
          this.remainingTime = 0;
          this._onTimeout();
        }

        // Entrada numérica
        for (let d = 0; d <= 9; d++) {
          const key = String(d);
          if (isJustPressed(key)) {
            if (this.inputValue.length < 3) {
              this.inputValue += key;
            }
          }
        }

        if (isJustPressed("Backspace")) {
          this.inputValue = this.inputValue.slice(0, -1);
        }

        if (isJustPressed("Enter")) {
          this._handleShoot();
        }
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

    // Fondo
    if (this.bgImage) {
      const img = this.bgImage;
      const scale = Math.max(W / img.width, H / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
    } else {
      ctx.fillStyle = "#020314";
      ctx.fillRect(0, 0, W, H);
    }

    // Capa oscura ligera
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, W, H);

    // Recta numérica
    this._drawNumberLine(ctx);

    // Sprites
    super.draw(ctx);
    this._drawHunterNumberLabel(ctx);

    // HUD
    this._drawHUD(ctx);

    if (this.state === "intro") {
      this._drawIntro(ctx);
    }

    if (this.state === "playing") {
      this._drawAimPanel(ctx);
    }

    if (this.gameFinished) {
      this._drawEndMessage(ctx);
    }
  }

  _drawNumberLine(ctx) {
    const cam = this.camera;
    const startX = this.axisStartX - cam.x;
    const endX = this.axisStartX + this.maxUnits * this.pixelsPerUnit - cam.x;
    const y = this.axisY - cam.y;

    ctx.save();
    ctx.strokeStyle = "#9a9494ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y);
    ctx.stroke();

    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    for (let i = 0; i <= this.maxUnits; i++) {
      const x = this.axisStartX + i * this.pixelsPerUnit - cam.x;
      const tickHeight = i % 5 === 0 ? 12 : 6;

      ctx.beginPath();
      ctx.moveTo(x, y - tickHeight / 2);
      ctx.lineTo(x, y + tickHeight / 2);
      ctx.strokeStyle = i % 5 === 0 ? "#d9d5d5ff" : "#727171ff";
      ctx.stroke();

      if (i % 5 === 0) {
        ctx.fillStyle = "#c9c4c4ff";
        ctx.fillText(i, x, y + 6);
      }
    }
    // Marcador del cazador en la recta
    const hx = this.axisStartX + this.hunterNumber * this.pixelsPerUnit - cam.x;
    ctx.fillStyle = "#ffeb3b";
    ctx.beginPath();
    ctx.moveTo(hx, y - 8);
    ctx.lineTo(hx - 7, y + 2);
    ctx.lineTo(hx + 7, y + 2);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  _drawHUD(ctx) {
    const W = this.game.canvas.width;

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(15, 15, 280, 70);

    ctx.strokeStyle = "#ffea00";
    ctx.lineWidth = 2;
    ctx.strokeRect(15, 15, 280, 70);

    ctx.font = "14px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(
      `Atrapadas: ${this.caughtCount} / Intentos: ${this.totalAttempts}`,
      25,
      40,
    );
    ctx.fillText(
      `Escapadas: ${this.escapedCount} / Máx: ${this.maxEscapes}`,
      25,
      60,
    );

    ctx.restore();

    // Pequeña pista en la parte superior central
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillStyle = "#fffde7";
    ctx.fillText(
      "Piensa en la DISTANCIA entre tu posición y la luciérnaga.",
      W / 2,
      18,
    );
    ctx.restore();
  }

  _drawIntro(ctx) {
    const { width: W, height: H } = this.game.canvas;

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.font = "32px Arial";
    ctx.fillText("El sendero de las luciérnagas", W / 2, H * 0.3);

    ctx.font = "18px Arial";
    ctx.fillText("Si se apagan cualquiera puede perderse.", W / 2, H * 0.4);
    ctx.fillText(
      "Acércate en silencio y dispara una burbuja con la DISTANCIA exacta.",
      W / 2,
      H * 0.45,
    );
    ctx.fillText(
      "Si fallas o tardas demasiado, la luz se perderá en la oscuridad.",
      W / 2,
      H * 0.5,
    );
    ctx.fillText(
      "Captura 10 antes de que escapen 3.",
      W / 2,
      H * 0.55,
    );

    ctx.font = "18px Arial";
    ctx.fillText("Pulsa ENTER o ESPACIO para comenzar.", W / 2, H * 0.65);
    ctx.restore();
  }

  _drawAimPanel(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    const panelW = Math.min(520, W * 0.55);
    const panelH = 100;
    const X = (W - panelW) / 2;
    const Y = H - panelH - 25; // pegado abajo

    // Fondo sutil
    ctx.fillStyle = "rgba(0, 0, 20, 0.45)";
    ctx.fillRect(X, Y, panelW, panelH);

    // Borde suave
    ctx.strokeStyle = "rgba(255, 255, 150, 0.35)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(X, Y, panelW, panelH);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Información superior
    ctx.font = "16px Arial";
    ctx.fillStyle = "#ffeb3b";
    ctx.fillText(
      `Estás en ${this.hunterNumber} — Luciérnaga en ${this.targetNumber}`,
      W / 2,
      Y + 22,
    );

    // Entrada
    ctx.font = "22px monospace";
    ctx.fillStyle = "#ffffff";
    const entrada = this.inputValue === "" ? "…" : this.inputValue;
    ctx.fillText(`Distancia: ${entrada}`, W / 2, Y + 50);

    // Tiempo restante
    const t = Math.max(0, this.remainingTime);
    ctx.font = "16px Arial";
    ctx.fillStyle = t <= 5 ? "#ff8a80" : "#c8e6c9";
    ctx.fillText(`Tiempo: ${t.toFixed(1)} s`, W / 2, Y + 78);
  }

  _drawHunterNumberLabel(ctx) {
    if (!this.hunter) return;

    const cam = this.camera ?? { x: 0, y: 0 };

    // OJO: tu sprite se dibuja con offset (px - 50, py - 40)
    const drawX = this.hunter.x - cam.x - 50;
    const drawY = this.hunter.y - cam.y - 40;

    const cx = drawX + this.hunter.width / 2; // centro del sprite dibujado
    const cy = drawY + this.hunter.height * 0.16; // “pecho” aprox

    const text = String(this.hunterNumber);

    ctx.save();
    ctx.font = "18px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // fondo tipo “badge” para que siempre se lea
    const padX = 8,
      padY = 5;
    const w = ctx.measureText(text).width + padX * 2 - 2;
    const h = 20 + padY;

    ctx.globalAlpha = 0.75;
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillRect(cx - w / 2, cy - h / 2, w, h);

    ctx.globalAlpha = 1;
    ctx.strokeStyle = "rgba(255,235,59,0.55)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx - w / 2, cy - h / 2, w, h);

    ctx.fillStyle = "#ffeb3b";
    ctx.fillText(text, cx, cy);
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
  // RONDAS Y LÓGICA
  // =======================================================
  _startNewRound() {
    if (this.state !== "playing") return;

    this._updateDifficulty();
    if (this._checkEndConditions()) return;

    this.hunter.isWalking = true;
    this.phase = "approach";
    this.hasShot = false;
    this.remainingTime = this.timeLimit;
    this.inputValue = "";

    // Generar posiciones...
    const { hunterNumber, targetNumber, approachStart } =
      this._generatePositions();
    this.hunterNumber = hunterNumber;
    this.targetNumber = targetNumber;
    this.approachStartNumber = approachStart;

    // Posicionar cazador y luciérnaga
    const hx = this._valueToX(this.approachStartNumber);
    const hy = this.axisY - 80;
    this.hunter.x = hx;
    this.hunter.y = hy;

    const tx = this._valueToX(this.targetNumber);
    const ty = this.axisY - altura;
    this.firefly.value = this.targetNumber;
    this.firefly.x = tx - this.firefly.width / 2;
    this.firefly.y = ty - this.firefly.height / 2;

    // 🔹 MUY IMPORTANTE: resetear estado de escape
    this.firefly.isEscaping = false;
    this.firefly.opacity = 1;
    this.firefly.escapeVX = 0;
    this.firefly.escapeVY = 0;
    this.firefly.originalY = this.firefly.y;
  }

  // Ajusta el rango de distancias según la ronda (totalAttempts)
  _updateDifficulty() {
    const n = this.totalAttempts + 1; // ronda 1..10
    if (n <= 2) {
      this.minDistance = 5;
      this.maxDistance = 8;
    } else if (n <= 5) {
      this.minDistance = 9;
      this.maxDistance = 15;
    } else if (n <= 8) {
      this.minDistance = 16;
      this.maxDistance = 20;
    } else {
      this.minDistance = 21;
      this.maxDistance = 40;
    }
  }

  _generatePositions() {
    const distance = this._randInt(this.minDistance, this.maxDistance);
    let hunter = this._randInt(5, 50 - distance);
    const target = hunter + distance;

    let approachStart = hunter - this._randInt(3, 7);
    if (approachStart < 0) approachStart = 0;

    return { hunterNumber: hunter, targetNumber: target, approachStart };
  }

  _enterAimPhase() {
    this.phase = "aim";
    this.remainingTime = this.timeLimit;
    this.inputValue = "";
    this.hunter.isWalking = false;
  }

  _handleShoot() {
    if (this.phase !== "aim" || this.hasShot) return;

    const val = parseInt(this.inputValue, 10);
    if (Number.isNaN(val)) {
      // Si no hay número, no disparamos
      return;
    }

    this.hasShot = true;
    this.phase = "resolving";

    const guessDistance = val;
    const needed = this.targetNumber - this.hunterNumber;
    const shotNumber = this.hunterNumber + guessDistance;

    const muzzle = this.hunter.getMuzzlePosition();
    const startX = muzzle.x - 20;
    const startY = muzzle.y;
    const targetX = this._valueToX(shotNumber);
    const targetY = this.axisY - altura - 5;

    const isHit = guessDistance === needed;

    this.playSfx(this.sfxShot, { volume: 0.5 });

    const bubble = new ShotBubble(startX, startY, targetX, targetY, () => {
      if (isHit) this._onHit();
      else this._onMiss();
    });
    this.add(bubble, "fx");
  }

  _onHit() {
    this.caughtCount++;
    this.totalAttempts++;

    this.playSfx(this.sfxCorrect, { volume: 0.6 });

    // 🔹 Efecto visual de captura
    const x = this.firefly.x + this.firefly.width / 2;
    const y = this.firefly.y + this.firefly.height / 2;
    this.add(new HitFX(this, x, y), "fx");

    // 👇 Hace que la luciérnaga desaparezca
    this.firefly.opacity = 0;

    // continuar con la siguiente ronda
    this._scheduleNextRound();
  }

  _onMiss() {
    this.escapedCount++;
    this.totalAttempts++;

    this.playSfx(this.sfxWrong, { volume: 0.6 });

    // iniciar escape
    this.firefly.startEscape();

    // esperar 0.8s antes de pasar a la siguiente ronda
    setTimeout(() => {
      this._scheduleNextRound();
    }, 800);
  }

  _onTimeout() {
    if (this.phase !== "aim") return;

    this.hasShot = true;
    this.phase = "resolving";
    this.escapedCount++;
    this.totalAttempts++;

    this.playSfx(this.sfxWrong, { volume: 0.6 });

    this.firefly.startEscape();

    setTimeout(() => {
      this._scheduleNextRound();
    }, 800);
  }

  _scheduleNextRound() {
    if (this._checkEndConditions()) return;

    // Pequeño delay antes de la siguiente ronda
    setTimeout(() => {
      this._startNewRound();
    }, 900);
  }

  _checkEndConditions() {
    // Demasiadas escapadas
    if (this.escapedCount >= this.maxEscapes) {
      this.win = false;
      this._finishGame(true);
      return true;
    }

    // Alcanzó mínimo de capturas antes de agotar intentos
    if (this.caughtCount >= this.minToWin) {
      this.win = true;
      this._finishGame(false);
      return true;
    }

    // Se acabaron los intentos
    if (this.totalAttempts >= this.maxAttempts) {
      this.win = this.caughtCount >= this.minToWin;
      this._finishGame(!this.win);
      return true;
    }

    return false;
  }

  _finishGame(failed = false) {
    if (this.gameFinished) return;
    this.gameFinished = true;
    this.state = "finished";
    this.phase = "idle";
    this.exitDelay = 0.5;

    let tier = this.win ? 1 : 0;

    let gained = 0;
    if (window.MN_reportMinigameTier) {
      gained = MN_reportMinigameTier("restas_luciernagas", tier);
    }
    this.sheetsReward = gained;

    // Mensaje final
    if (failed) {
      this.message =
        "Demasiadas luciérnagas escaparon...\n" +
        `Atrapaste ${this.caughtCount} de ${this.totalAttempts} intentos.\n` +
        `Hojas ganadas: ${gained}.`;
    } else {
      this.message =
        "¡Tenemos un sendero seguro!\n" +
        `Atrapaste ${this.caughtCount} de ${this.totalAttempts} intentos.\n` +
        `Hojas ganadas: ${gained}.`;
    }

    // Sonido final
    if (!failed) {
      this.playSfx(this.sfxWin, { volume: 0.7 });
    } else {
      this.playSfx(this.sfxWrong, { volume: 0.7 });
    }

    // Evento para overworld (estilo escriba/jerarquía/sumas)
    if (this.game && this.game.events) {
      this.game.events.emit("restas_done", {
        win: !failed,
        caught: this.caughtCount,
        escaped: this.escapedCount,
        totalAttempts: this.totalAttempts,
        tier,
        sheetsReward: gained,
        failed,
      });
    }
  }

  // =======================================================
  // UTILIDADES
  // =======================================================
  _valueToX(value) {
    return this.axisStartX + value * this.pixelsPerUnit;
  }

  _randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

window.RestasScene = RestasScene;
