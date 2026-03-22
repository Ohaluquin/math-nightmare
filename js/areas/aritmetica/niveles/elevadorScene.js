// elevadorScene.js
// Mini-juego: "Elevador y contrapeso" para practicar divisiones como equilibrio
// Requiere motor2D.js (Game, Scene, Sprite, etc.) ya cargado.

const ASM_CONFIRM_KEY = "Enter";

/* -------------------------------------------------------------------------- */
/*  CLASE: SardinaMonster        */
/* -------------------------------------------------------------------------- */

class SardinaMonster extends Sprite {
  constructor(x, y, radius, weight) {
    super(x, y, radius * 2, radius * 2, "#7cf");
    this.radius = radius;
    this.weight = weight;

    this.homeX = x;
    this.homeY = y;

    this.loaded = false;

    // offset relativo al elevador cuando está cargado
    this.anchor = null; // { dx, dy }

    // física de caída
    this.falling = false;
    this.vx = 0;
    this.vy = 0;

    // estado visual
    this.upsideDown = false; // si quedó de cabeza tras caer
    this.animT = 0; // reloj para pataleo
  }

  _resetVisualState() {
    this.upsideDown = false;
    this.animT = 0;
  }

  resetPosition() {
    this.x = this.homeX;
    this.y = this.homeY;

    this.loaded = false;
    this.anchor = null;

    this.falling = false;
    this.vx = 0;
    this.vy = 0;

    this._resetVisualState();
  }

  anchorToElevator(elevator) {
    this.loaded = true;

    this.falling = false;
    this.vx = 0;
    this.vy = 0;

    this._resetVisualState();

    this.anchor = {
      dx: this.x - elevator.x,
      dy: this.y - elevator.y,
    };
  }

  dropToFloor(initialKickX = 0) {
    this.loaded = false;
    this.anchor = null;

    this.falling = true;
    this.vx = initialKickX;
    this.vy = -120;

    // aún no está de cabeza: eso pasa al “aterrizar”
    this.upsideDown = false;
    this.animT = 0;
  }

  update(dt) {
    if (this.loaded) {
      this.animT = 0;
      return;
    }

    // reloj de animación (sirve para pataleo cuando está upsideDown)
    this.animT += dt;

    if (this.falling) {
      const g = 1200;
      this.vy += g * dt;

      this.x += this.vx * dt;
      this.y += this.vy * dt;

      // fricción leve
      this.vx *= Math.pow(0.985, dt * 60);

      // tocar piso
      const floorY = this.scene?.groundY ?? null;
      if (floorY != null) {
        const bottom = this.y + this.radius * 2;
        if (bottom >= floorY) {
          this.y = floorY - this.radius * 2;

          this.falling = false;
          this.vx = 0;
          this.vy = 0;

          // aquí sí: queda de cabeza y empieza pataleo
          this.upsideDown = true;
          this.animT = 0;
        }
      }
    }
  }

  draw(ctx) {
    const cam = this.scene?.camera ?? { x: 0, y: 0 };
    const cx = this.x + this.radius - cam.x;
    const cy = this.y + this.radius - cam.y;

    const img = this.scene?.game?.assets?.getImage("spr_monster");

    // parámetros visuales
    let rot = 0;
    let squashY = 1;

    if (this.upsideDown) {
      // pataleo: un balanceo visible + “squash”
      const t = this.animT;
      rot = Math.PI + Math.sin(t * 10) * 0.22; // más notorio
      squashY = 1 + Math.sin(t * 16) * 0.1; // respiración/pataleo
    }

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.scale(1, squashY);
    ctx.translate(-cx, -cy);

    // dibuja sprite (o fallback círculo)
    if (img) {
      const size = this.radius * 2.2;
      ctx.drawImage(img, cx - size / 2, cy - size / 2, size, size);
    } else {
      ctx.fillStyle = this.loaded ? "#ffdd55" : this.color;
      ctx.beginPath();
      ctx.arc(cx, cy, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // número en la “panza” (blanco, un poco abajo del centro)
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.font = `${Math.max(14, this.radius * 0.8)}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeStyle = "rgba(0,0,0,0.55)";
    ctx.lineWidth = 3;

    const bellyY = cy + this.radius * 0.25; // abajo del centro
    ctx.strokeText(String(this.weight), cx, bellyY);
    ctx.fillText(String(this.weight), cx, bellyY);
    ctx.restore();

    ctx.restore();
  }
}

/* -------------------------------------------------------------------------- */
/*  CLASE: SardinaLever (palanca visible)                                      */
/* -------------------------------------------------------------------------- */

class SardinaLever extends Sprite {
  constructor(x, y) {
    super(x, y, 80, 90, "#0000");
    this.pulled = false;
    this.anim = 0;
  }

  pull() {
    this.pulled = true;
    this.anim = 0;
  }
  release() {
    this.pulled = false;
    this.anim = 0;
  }

  update(dt) {
    this.anim += dt;
  }

  draw(ctx) {
    const cam = this.scene?.camera ?? { x: 0, y: 0 };
    const x = this.x - cam.x;
    const y = this.y - cam.y;

    ctx.save();

    // base
    ctx.fillStyle = "#666";
    ctx.fillRect(x + 10, y + 65, 60, 12);

    // poste
    ctx.fillStyle = "#777";
    ctx.fillRect(x + 38, y + 30, 6, 40);

    // brazo
    const angle = this.pulled ? -0.9 : -0.35;
    ctx.translate(x + 41, y + 34);
    ctx.rotate(angle);
    ctx.fillStyle = "#caa44a";
    ctx.fillRect(0, -3, 40, 6);

    // perilla
    ctx.beginPath();
    ctx.fillStyle = "#e8d07a";
    ctx.arc(40, 0, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // etiqueta
    ctx.save();
    ctx.fillStyle = "#fff";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("ENTER", x + 40, y + 86);
    ctx.restore();
  }

  containsPoint(wx, wy) {
    return (
      wx >= this.x &&
      wx <= this.x + this.width &&
      wy >= this.y &&
      wy <= this.y + this.height
    );
  }
}

/* -------------------------------------------------------------------------- */
/*  CLASE: SardinaElevator (cabina con velocidad variable)                     */
/* -------------------------------------------------------------------------- */

class SardinaElevator extends Sprite {
  constructor(x, baseY, w, h) {
    super(x, baseY, w, h, "#2e5fbf");
    this.baseY = baseY;

    this.topY = 140;

    this.state = "idle"; // idle | moving | over_shake | under_fast | fall | success_hold
    this.t = 0;

    this.speed = 260; // se ajusta al evaluar
    this.targetY = baseY;

    this.reachedTop = false;
  }

  resetToBase() {
    this.y = this.baseY;
    this.targetY = this.baseY;
    this.state = "idle";
    this.t = 0;
    this.speed = 260;
    this.reachedTop = false;
  }

  startMoveUp(targetY, speed, mode) {
    this.targetY = targetY;
    this.speed = speed;
    this.state = mode; // "moving" (éxito) o "under_fast"
    this.t = 0;
    this.reachedTop = false;
  }

  setOverShake() {
    this.state = "over_shake";
    this.t = 0;
  }

  startFall() {
    this.state = "fall";
    this.t = 0;
  }

  update(dt) {
    this.t += dt;

    if (this.state === "moving" || this.state === "under_fast") {
      // subir hacia targetY
      const dy = this.targetY - this.y;
      const step = Math.sign(dy) * Math.min(Math.abs(dy), this.speed * dt);
      this.y += step;

      if (Math.abs(this.y - this.targetY) < 0.5) {
        this.y = this.targetY;
        this.reachedTop = true;

        if (this.state === "moving") {
          this.state = "success_hold"; // se queda arriba un momento
          this.t = 0;
        } else {
          // under_fast: si llega arriba (o casi) lo consideramos “peligroso”
          this.startFall();
        }
      }
    }

    if (this.state === "fall") {
      // cae rápido de regreso
      const fallSpeed = 620;
      this.y += fallSpeed * dt;
      if (this.y >= this.baseY) {
        this.y = this.baseY;
        this.state = "idle";
      }
    }

    // over_shake y success_hold solo animan visualmente (sin mover y)
  }

  draw(ctx) {
    const cam = this.scene?.camera ?? { x: 0, y: 0 };
    let x = this.x - cam.x;
    let y = this.y - cam.y;

    ctx.save();

    if (this.state === "over_shake") {
      const shakeX = Math.sin(this.t * 35) * 3;
      const shakeY = Math.sin(this.t * 25) * 2;
      x += shakeX;
      y += shakeY;
    }

    // Cabina
    ctx.fillStyle = "#2e5fbf";
    ctx.fillRect(x, y, this.width, this.height);

    // Ventana
    ctx.fillStyle = "#cde6ff";
    ctx.fillRect(x + 18, y + 15, this.width - 36, this.height * 0.35);

    // Piso
    ctx.fillStyle = "#17306b";
    ctx.fillRect(x, y + this.height - 18, this.width, 18);

    // Texto
    ctx.fillStyle = "#fff";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("ELEVADOR", x + this.width / 2, y + this.height * 0.72);

    ctx.restore();
  }
}

/* -------------------------------------------------------------------------- */
/*  CLASE: Contrapeso visible)                                                */
/* -------------------------------------------------------------------------- */

class SardinaCounterweight extends Sprite {
  constructor(x, baseY, w, h) {
    super(x, baseY, w, h, "#555");
    this.baseY = baseY;
    this.value = 0;
  }

  draw(ctx) {
    const cam = this.scene?.camera ?? { x: 0, y: 0 };
    const x = this.x - cam.x;
    const y = this.y - cam.y;

    ctx.save();
    ctx.fillStyle = "#555";
    ctx.fillRect(x, y, this.width, this.height);

    ctx.strokeStyle = "#777";
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(x + 6, y + 10 + i * 12);
      ctx.lineTo(x + this.width - 6, y + 4 + i * 12);
      ctx.stroke();
    }

    ctx.fillStyle = "#fff";
    ctx.font = "22px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(this.value), x + this.width / 2, y + this.height / 2);

    ctx.restore();
  }
}

/* -------------------------------------------------------------------------- */
/*  ESCENA: ElevadorScene (Elevador/Contrapeso)                             */
/* -------------------------------------------------------------------------- */

class elevadorScene extends Scene {
  constructor(game) {
    super(game);

    this.round = 1;
    this.maxRounds = 10;
    this.level = null;

    this.elevator = null;
    this.counterweight = null;
    this.lever = null;

    this.monsters = [];

    this.prevConfirmDown = false;
    this.lastResult = null;

    // para piso
    this.groundY = 0;

    // Guardar “carga actual” para el movimiento acoplado
    this.currentLoad = 0;

    this.state = "intro"; // intro | playing | success | fail
    this.TIME_LIMIT = 30;
    this.timeLeft = this.TIME_LIMIT;

    this.totalRounds = 10;
    this.currentRound = 0;

    this.halfRewardGiven = false;
    this.timerActive = false;

    this.gameFinished = false;
    this.exitDelay = 0;
    this.win = false;
    this.message = "";
    this.sheetsReward = 0;

    this.prevStartDown = false; // para edge del click/enter en intro/finish
    this.prevMouseDownUI = false;

    // SFX keys (consistentes con el resto del proyecto)
    this.sfxPass = "sfx_change_page";
    this.sfxAction = "sfx_ok";
    this.sfxCorrect = "sfx_match";
    this.sfxWrong = "sfx_error";
    this.sfxDrop = "sfx_explosion";
    this.sfxFinish = "sfx_win";

    this.shakeT = 0;
    this.shakeMag = 0;
    this.prevOpKey = null;

    // Vidas / errores permitidos
    this.maxMistakes = 5;
    this.mistakesLeft = 5;
  }

  playSfx(key, options = {}) {
    if (!key) return;
    const assets = this.game.assets;
    if (!assets || typeof assets.playSound !== "function") return;
    assets.playSound(key, options);
  }

  init() {    
    if (window.MN_setLeafHUDVisible) window.MN_setLeafHUDVisible(false);    
    if (window.MN_setInputMode) MN_setInputMode("mouse");
    this.camera.x = 0;
    this.camera.y = 0;
    this.camera.setBounds(
      0,
      0,
      this.game.canvas.width,
      this.game.canvas.height
    );

    this.state = "intro";
    this.timerActive = false;
    this.gameFinished = false;
    this.exitDelay = 0;
    this.message = "";
    this.sheetsReward = 0;

    this.round = 1;
    this.maxRounds = 10;

    this.mistakesLeft = this.maxMistakes;

    this._createWorld();
    this._createMonsters();
    this._nextRound(); // genera primer nivel + resetea todo
  }

  /* ------------------------------ Random level ----------------------------- */
  _startGame() {
    this.state = "playing";
    this.timerActive = true;
    this.timeLeft = this.TIME_LIMIT;
    this.currentRound = 0;
    this.halfRewardGiven = false;   

    this.playSfx(this.sfxPass);
    this._nextRound();
  }

  _nextRound() {
    this.level = this._generateRandomLevel();
    this._applyLevelToMonsters();
    this._resetRoundVisuals();
    this.timeLeft = this.TIME_LIMIT;
  }

  _randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  _generateRandomLevel() {
    const r = this.round; // 1..10

    //while (true) {
    let dMin, dMax, qMin, qMax;

    if (r <= 3) {
      dMin = 3;
      dMax = 5;
      qMin = 3;
      qMax = 7;
    } else if (r <= 7) {
      dMin = 6;
      dMax = 8;
      qMin = 3;
      qMax = 9;
    } else {
      dMin = 7;
      dMax = 12;
      qMin = 6;
      qMax = 11;
    }

    while (true) {
      const divisor = this._randInt(dMin, dMax);
      const q = this._randInt(qMin, qMax);
      const dividendo = divisor * q;

      // Mantener rango si lo quieres (opcional)
      if (dividendo < 15 || dividendo > 100) continue;
      if (r >= 8 && (divisor === 10 || q === 10)) continue;

      const opKey = `${dividendo}/${divisor}`;
      if (opKey === this.prevOpKey) continue;
      this.prevOpKey = opKey;
      return { dividendo, divisor, maxMonsters: 12 };
    }
  }

  _applyLevelToMonsters() {
    this.monsters.forEach((m) => {
      m.weight = this.level.divisor;
      m.resetPosition();
    });
  }

  _resetRoundVisuals() {
    this.lastResult = null;
    this.currentLoad = 0;

    this.elevator?.resetToBase();
    this.lever?.release();

    if (this.counterweight) {
      this.counterweight.value = this.level.dividendo;
      // reposiciona contrapeso al base
      this.counterweight.y = this.counterweight.baseY;
    }
  }

  _startNextRound() {
    if (this.round >= this.maxRounds) {
      this._finishGame(false);
      return;
    }
    this.round += 1;
    this._nextRound();
  }

  /* ------------------------------ World build ------------------------------ */

  _createWorld() {
    const canvas = this.game.canvas;

    // suelo
    this.groundY = canvas.height * 0.8;

    // Elevador (lo movemos a la derecha para dar espacio)
    const elevW = 220;
    const elevH = 130;

    const elevX = canvas.width * 0.45; // <-- antes 0.28, ahora más a la derecha
    const elevBaseY = this.groundY - elevH;

    this.elevator = new SardinaElevator(elevX, elevBaseY, elevW, elevH);
    this.add(this.elevator, "elevator");

    // Contrapeso (derecha)
    const cwW = 110;
    const cwH = 110;
    const cwX = canvas.width * 0.74;
    const cwBaseY = canvas.height * 0.3;

    this.counterweight = new SardinaCounterweight(cwX, cwBaseY, cwW, cwH);
    this.add(this.counterweight, "counterweight");

    // Palanca visible (abajo-derecha)
    this.lever = new SardinaLever(canvas.width * 0.84, canvas.height * 0.7);
    this.add(this.lever, "lever");
  }

  _createMonsters() {
    this.monsters.length = 0;
    const canvas = this.game.canvas;
    const radius = 26;

    const cols = 4;
    const spacingX = radius * 2.5;
    const spacingY = radius * 2.5;

    const startX = canvas.width * 0.05;
    const startY = canvas.height * 0.68;

    const max = this.level?.maxMonsters ?? 12;

    for (let i = 0; i < max; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * spacingX;
      const y = startY + row * spacingY;

      const m = new SardinaMonster(x, y, radius, this.level?.divisor ?? 3);
      this.monsters.push(m);
      this.add(m, "monsters");
    }
  }

  _findMonsterUnderMouse(mx, my) {
    for (let i = this.monsters.length - 1; i >= 0; i--) {
      const m = this.monsters[i];
      const r = m.radius;
      const cx = m.x + r;
      const cy = m.y + r;
      const dx = mx - cx;
      const dy = my - cy;
      if (dx * dx + dy * dy <= r * r) return m;
    }
    return null;
  }

  /* ----------------------------- Evaluation logic -------------------------- */

  _getLoadedCount() {
    return this.monsters.filter((m) => m.loaded).length;
  }

  _evaluateLoad() {
    const loadedCount = this._getLoadedCount();
    const carga = loadedCount * this.level.divisor;
    const objetivo = this.level.dividendo;

    this.currentLoad = carga;

    let result;
    if (carga === objetivo) result = "success";
    else if (carga > objetivo) result = "over";
    else result = "under";

    this.lastResult = result;
    this.lever.pull();

    // Velocidad depende de la diferencia
    const diff = Math.abs(objetivo - carga);

    // Ajustes (puedes tunear)
    const baseSpeed = 220;
    const speed = baseSpeed + diff * 8; // más diferencia, más rápido

    if (result === "success") {
      this.playSfx(this.sfxCorrect);
      // subir suave (diff=0) y al llegar arriba, pasa de ronda
      this.elevator.startMoveUp(this.elevator.topY, baseSpeed, "moving");
    } else if (result === "over") {
      this.playSfx(this.sfxWrong);
      this.elevator.setOverShake(); // Tiembla pero no sube
      this._consumeMistake();
    } else {
      this.playSfx(this.sfxWrong);
      this._dropLoadedMonsters(); // UNDER: sube demasiado rápido y los monstritos se caen
      this.elevator.startMoveUp(this.elevator.topY - 30, speed, "under_fast");
      this._consumeMistake();
    }

    const hint = document.getElementById("hint");
    if (hint) {
      if (result === "success") hint.textContent = "¡Equilibrio perfecto! ✅";
      else if (result === "over")
        hint.textContent = "Demasiado peso. Tiembla y no sube. ❌";
      else
        hint.textContent =
          "Muy poco peso. Sube demasiado rápido… ¡y se caen! ❌";
    }
  }

  _consumeMistake() {
    this.mistakesLeft -= 1;
    if (this.mistakesLeft <= 0) {
      this.mistakesLeft = 0;
      this._finishGame(true, "Los monstritos ya no confían en el elevador.");
    }
  }

  _dropLoadedMonsters() {
    this.playSfx(this.sfxDrop);
    this.shakeT = 0.3; // duración
    this.shakeMag = 6; // intensidad

    // Los que estaban cargados salen disparados “hacia afuera” y caen al piso
    // (así se ve claro que “no estaban seguros” por subir demasiado rápido)
    const e = this.elevator;
    let k = 0;

    for (const m of this.monsters) {
      if (!m.loaded) continue;

      // colócalos justo donde está el elevador para que se note la caída
      if (m.anchor) {
        m.x = e.x + m.anchor.dx;
        m.y = e.y + m.anchor.dy;
      }

      // alternar empujes para que no caigan todos igual
      const kick = (k % 2 === 0 ? -1 : 1) * (120 + k * 10);
      m.dropToFloor(kick);
      k++;
    }
  }

  _updateConfirmKey() {
    if (this.state !== "playing" || this.gameFinished) return;

    const confirmDown = this.game.input.isDown(ASM_CONFIRM_KEY);
    if (confirmDown && !this.prevConfirmDown) {
      this._evaluateLoad();
    }
    this.prevConfirmDown = confirmDown;
  }

  /* ----------------------------- Coupled motion ---------------------------- */

  _updateAnchoredMonstersAndFloor() {
    const e = this.elevator;

    // 1) Monstritos anclados siguen al elevador
    for (const m of this.monsters) {
      if (m.loaded && m.anchor) {
        m.x = e.x + m.anchor.dx;
        m.y = e.y + m.anchor.dy;
      }
    }

    // 2) “Piso”: detener caída cuando tocan suelo (y rebotito mínimo)
    for (const m of this.monsters) {
      if (!m.falling) continue;
      const bottom = m.y + m.radius * 2;
      if (bottom >= this.groundY) {
        m.y = this.groundY - m.radius * 2;
        m.falling = false;
        m.vx = 0;
        m.vy = 0;
      }
    }
  }

  _updateCounterweightCoupling() {
    if (!this.counterweight || !this.elevator) return;

    // Cuando el elevador sube (y disminuye), el contrapeso baja (y aumenta)
    const delta = this.elevator.baseY - this.elevator.y;
    this.counterweight.y = this.counterweight.baseY + delta;
  }

  _updateSuccessFlow() {
    // Si éxito: al sostener arriba un momento mínimo, siguiente ronda
    if (!this.elevator) return;
    if (this.lastResult !== "success") return;

    if (this.elevator.state === "success_hold" && this.elevator.t > 0.25) {
      this._startNextRound();
    }
  }

  /* ----------------------------------- HUD -------------------------------- */

  update(dt) {
    // --------------------------------------------------
    // 1) TIMER (solo en playing)
    // --------------------------------------------------
    if (this.state === "playing" && this.timerActive) {
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this._consumeMistake();
        this.timeLeft = this.TIME_LIMIT;
        return;
      }
    }

    // --- shake timer (DEBE ir en update con dt real) ---
    if (this.shakeT > 0) {
      this.shakeT = Math.max(0, this.shakeT - dt);
    }

    const input = this.game.input;
    const mouseDown = !!input.mouse.down;

    // --------------------------------------------------
    // 2) MousePressed para UI (palanca)
    // --------------------------------------------------
    const mousePressedUI = mouseDown && !this.prevMouseDownUI;
    this.prevMouseDownUI = mouseDown;

    if (this.state === "playing" && mousePressedUI) {
      const p = this._mouseToWorld();

      if (this.lever && this.lever.containsPoint(p.x, p.y)) {
        this._evaluateLoad();
      } else {
        const m = this._findMonsterUnderMouse(p.x, p.y);
        if (m) {
          if (m.loaded) {
            m.resetPosition();
            this.playSfx(this.sfxPass);
          } else {
            const ok = this._snapMonsterToElevator(m);
            if (ok) this.playSfx(this.sfxAction);
          }
        }
      }
    }

    // --------------------------------------------------
    // 3) StartPressed SOLO para intro / finish
    // --------------------------------------------------
    const startDown = input.isDown(" ") || mouseDown;

    const startPressed = startDown && !this.prevStartDown;
    this.prevStartDown = startDown;

    // --------------------------------------------------
    // 4) FINISHED
    // --------------------------------------------------
    if (this.gameFinished) {
      if (this.exitDelay > 0) {
        this.exitDelay -= dt;
        return;
      }
      if (startPressed) {
        window.MN_APP?.toOverworld?.();
      }
      return;
    }

    // --------------------------------------------------
    // 5) INTRO
    // --------------------------------------------------
    if (this.state === "intro") {
      if (startPressed) {
        this._startGame();
      }
      return;
    }

    // --------------------------------------------------
    // 7) UPDATE normal del motor
    // --------------------------------------------------
    super.update(dt);

    // ENTER sigue funcionando
    this._updateConfirmKey();

    // Movimiento acoplado
    this._updateCounterweightCoupling();
    this._updateAnchoredMonstersAndFloor();

    // Flujo de éxito / siguiente ronda
    this._updateSuccessFlow();
  }

  draw(ctx) {
    const canvas = this.game.canvas;

    // --- Fondo (sin shake, se ve más limpio) ---
    ctx.save();
    const bg = this.game.assets.getImage("bg_elevador");
    if (bg) {
      ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = "#101018";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.restore();

    // --- Calcula shake ---
    let shakeX = 0,
      shakeY = 0;
    if (this.shakeT > 0) {
      shakeX = (Math.random() * 2 - 1) * (this.shakeMag ?? 0);
      shakeY = (Math.random() * 2 - 1) * (this.shakeMag ?? 0);
    }

    // --- Dibuja TODO el mundo con shake (suelo, cables, sprites) ---
    ctx.save();
    ctx.translate(shakeX, shakeY);

    // Cables
    ctx.strokeStyle = "#777";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(this.elevator.x + this.elevator.width / 2, this.elevator.y);
    ctx.lineTo(this.elevator.x + this.elevator.width / 2, 60);
    ctx.lineTo(this.counterweight.x + this.counterweight.width / 2, 60);
    ctx.lineTo(
      this.counterweight.x + this.counterweight.width / 2,
      this.counterweight.y
    );
    ctx.stroke();

    // OBJETOS (elevador, contrapeso, palanca, monstruos)
    super.draw(ctx);

    ctx.restore();

    // --- HUD (sin shake) ---
    ctx.save();
    ctx.fillStyle = "#fff";
    ctx.font = "20px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`Ronda ${this.round}/${this.maxRounds}`, 20, 14);
    this._drawMistakes(ctx);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = "#fff";
    ctx.font = "18px Arial";
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillText(`Tiempo: ${Math.ceil(this.timeLeft)}s`, canvas.width - 20, 94);
    ctx.restore();

    // Panels (sin shake)
    if (this.state === "intro") this._drawIntro(ctx);
    if (this.gameFinished) this._drawFinish(ctx);
  }

  _drawIntro(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    const panelW = Math.min(560, W * 0.8);
    const panelH = 220;
    const X = (W - panelW) / 2;
    const Y = (H - panelH) / 2;

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(X, Y, panelW, panelH);

    ctx.strokeStyle = "#ffeb3b";
    ctx.lineWidth = 2;
    ctx.strokeRect(X, Y, panelW, panelH);

    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    ctx.font = "26px Arial";
    ctx.fillStyle = "#ffe082";
    ctx.fillText("El Elevador del Contrapeso", W / 2, Y + 16);

    ctx.font = "16px Arial";
    ctx.fillStyle = "#ffffff";
    const lines = [
      "Haz click en los monstritos para subirlos al elevador.",
      "La cifra del contrapeso es el total que debes igualar.",
      "Pulsa ENTER para activar la palanca.",
      "Si falta peso: sube muy rápido y se caen.",
      "Si sobra peso: no sube.",
      `Tienes ${this.TIME_LIMIT} segundos por ronda.`,
    ];

    let ty = Y + 54;
    for (const line of lines) {
      ctx.fillText(line, W / 2, ty);
      ty += 22;
    }

    ctx.font = "18px Arial";
    ctx.fillStyle = "#ffeb3b";
    ctx.fillText(
      "Pulsa ESPACIO o haz clic para comenzar.",
      W / 2,
      Y + panelH - 36
    );    
    ctx.restore();
  }

  _drawFinish(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    const panelW = Math.min(560, W * 0.82);
    const panelH = 200;
    const X = (W - panelW) / 2;
    const Y = (H - panelH) / 2;

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.70)";
    ctx.fillRect(X, Y, panelW, panelH);

    ctx.strokeStyle = this.win ? "#8bc34a" : "#ff5252";
    ctx.lineWidth = 2;
    ctx.strokeRect(X, Y, panelW, panelH);

    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    ctx.font = "26px Arial";
    ctx.fillStyle = this.win ? "#c8e6c9" : "#ff8a80";
    ctx.fillText(this.win ? "¡Nivel superado!" : "Fallaste…", W / 2, Y + 16);

    ctx.font = "16px Arial";
    ctx.fillStyle = "#ffffff";

    const lines = (this.message || "").split("\n").filter(Boolean);
    let ty = Y + 56;
    for (const line of lines.slice(0, 4)) {
      ctx.fillText(line, W / 2, ty);
      ty += 22;
    }

    ctx.font = "18px Arial";
    ctx.fillStyle = "#ffeb3b";
    ctx.fillText("Pulsa ESPACIO o clic para volver.", W / 2, Y + panelH - 36);    
    ctx.restore();
  }

  _drawMistakes(ctx) {
    ctx.save();
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.font = "16px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Errores:", 20, 42);

    const heartSize = 18;
    for (let i = 0; i < this.maxMistakes; i++) {
      const x = 90 + i * (heartSize + 6);
      const y = 40;
      ctx.fillStyle = i < this.mistakesLeft ? "#ff4b5c" : "#4a1f26";
      this._drawHeart(ctx, x, y, heartSize);
    }
    ctx.restore();
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
      y + s / 4
    );
    ctx.bezierCurveTo(x + s / 2, y, x, y, x, y + s / 4);
    ctx.fill();
  }

  _getElevatorSlots() {
    const e = this.elevator;

    // margen interno (ajústalo para que se vean bien)
    const padX = 16;
    const padY = 18;

    // número de columnas/filas de monstruitos dentro del elevador
    const cols = 4;
    const rows = 3;

    const cellW = (e.width - padX * 2) / cols;
    const cellH = (e.height - padY * 2) / rows;

    const slots = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        slots.push({
          x: e.x + padX + c * cellW + cellW / 2,
          y: e.y + padY + r * cellH + cellH / 2,
        });
      }
    }
    return slots;
  }

  _findFreeSlot() {
    const slots = this._getElevatorSlots();

    // marca slots ocupados (por monstruos loaded)
    const occupied = new Array(slots.length).fill(false);

    for (const m of this.monsters) {
      if (!m.loaded || !m.anchor) continue;

      // reconstruye la posición actual del monstruo anclado
      const mx = this.elevator.x + m.anchor.dx + m.radius;
      const my = this.elevator.y + m.anchor.dy + m.radius;

      // slot más cercano
      let bestI = -1;
      let bestD = Infinity;
      for (let i = 0; i < slots.length; i++) {
        const dx = mx - slots[i].x;
        const dy = my - slots[i].y;
        const d = dx * dx + dy * dy;
        if (d < bestD) {
          bestD = d;
          bestI = i;
        }
      }
      if (bestI >= 0) occupied[bestI] = true;
    }

    for (let i = 0; i < occupied.length; i++) {
      if (!occupied[i]) return { slotIndex: i, pos: slots[i] };
    }
    return null;
  }

  _snapMonsterToElevator(m) {
    const free = this._findFreeSlot();
    if (!free) {
      this.playSfx(this.sfxWrong);
      return false;
    }

    const { x, y } = free.pos;

    // coloca por esquina superior izquierda (porque tu sprite usa x,y como esquina)
    m.x = x - m.radius;
    m.y = y - m.radius;
    m.upsideDown = false;
    m.falling = false;
    m.anchorToElevator(this.elevator);
    return true;
  }

  _mouseToWorld() {
    const m = this.game.input.mouse;
    const z = this.game.zoom || 1;
    return {
      x: m.x / z + this.camera.x,
      y: m.y / z + this.camera.y,
    };
  }

  destroy() {
    const hint = document.getElementById("hint");
    if (hint) hint.textContent = "";
    this.clearAll();
  }

  _finishGame(failed = false, reason = "") {
    if (this.gameFinished) return;

    this.gameFinished = true;
    this.state = "finished";
    this.exitDelay = 0.5;
    this.win = !failed;

    // tier: 1 hoja por todo
    // roundsCompleted = round-1 (porque round empieza en 1)
    const roundsCompleted = Math.max(0, this.round - 1);

    let tier = 0;
    if (!failed) tier = 1;

    let gained = 0;
    if (window.MN_reportMinigameTier) {
      gained = MN_reportMinigameTier("mineros_division", tier);
    }
    this.sheetsReward = gained;

    if (failed) {
      this.playSfx(this.sfxWrong);
      this.message =
        "El elevador se descontroló...\n" +
        (reason ? reason + "\n" : "") +
        `Llegaste a ${roundsCompleted}/10.\n` +
        `Hojas ganadas: ${gained}.`;
    } else {
      this.playSfx(this.sfxFinish);
      this.message =
        "¡Equilibrio perfecto!\n" +
        `Completaste ${roundsCompleted}/10.\n` +
        `Hojas ganadas: ${gained}.`;
    }

    // Evento para overworld
    if (this.game && this.game.events) {
      this.game.events.emit("divisiones_done", {
        win: !failed,
        roundsCompleted,
        tier,
        sheetsReward: gained,
        failed,
      });
    }
  }
}

window.ElevadorScene = elevadorScene;
