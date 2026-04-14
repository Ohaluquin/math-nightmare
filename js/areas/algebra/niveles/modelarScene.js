// ===========================================================
// modelarScene.js "Pincha el Globo" (Modelado + Resolución)
// Minijuego (Math Nightmare):
//   Fase 1: elegir el PLANTEAMIENTO (ecuación correcta) entre 4 globos.
//   Fase 2: resolver la ecuación (respuesta correcta) entre 4 globos.
// Reglas:
//   - Sin pistas ni feedback textual (solo tensión + consecuencias).
//   - 5 vidas.
//   - 3 problemas por partida (se eligen al azar de 10 templates).
//   - Si fallas, el globo revienta, pierdes 1 vida y repites el MISMO problema/fase.
//   - Si aciertas Fase 1, se revela la ecuación arriba y pasas a Fase 2.
//   - Si aciertas Fase 2, avanzas al siguiente problema.
// ===========================================================

class ModelarScene extends Scene {
  constructor(game) {
    super(game);

    // Estados: intro | playing | transition | finished
    this.state = "intro";

    // Subfase: model | solve
    this.stage = "model";

    // Progreso
    this.maxLives = 3;
    this.lives = this.maxLives;
    this.totalRounds = 3;
    this.roundIndex = 0; // 0..totalRounds-1
    this.roundMistakes = 0;
    this.runAnswers = [];

    // Ronda actual
    this.round = null; // { text, model:{options,correctIndex,correctEq}, solve:{options,correctIndex,answer}, revealedEq }

    // UI
    this.bgImage = null;
    this.balloonFont = "18px Arial";
    this.titleFont = "26px Arial";
    this.textFont = "20px Arial";
    this.smallFont = "16px Arial";

    // Balloons
    this.balloons = []; // [{x,y,r,label,isCorrect,isPopped,popT,wiggle,kind}]
    this.hoverIndex = -1;

    // Animaciones
    this.sceneT = 0;
    this.transitionT = 0;
    this.transitionDur = 0.55;

    this.particles = []; // explosion particles

    // Input edges
    this.prevMouseDown = false;
    this._prevKeys = {};

    // Audio (opcionales; ajusta nombres a tu pack)
    this.sfxPop = "sfx_pop";
    this.sfxBoom = "sfx_explosion";
    this.sfxOk = "sfx_match";
    this.sfxWin = "sfx_win";
    this.sfxLose = "sfx_loose";
    this.sfxPage = "sfx_change_page";

    // Templates
    this.templates = this._buildTemplates();
    this.runTemplates = []; // 3 elegidos al inicio

    // Fin
    this.gameFinished = false;
    this.exitDelay = 0;
    this.win = false;
    this.message = "";
    this.sheetsReward = 0;
  }

  playSfx(key, options = {}) {
    if (!key) return;
    const assets = this.game.assets;
    if (!assets || typeof assets.playSound !== "function") return;
    try { assets.playSound(key, options); } catch (_) {}
  }

  init() {
    if (window.MN_setLeafHUDVisible) window.MN_setLeafHUDVisible(false);
    if (window.MN_setInputMode) MN_setInputMode("mouse");

    this.state = "intro";
    this.stage = "model";
    this.lives = this.maxLives;
    this.roundIndex = 0;
    this.round = null;
    this.balloons = [];
    this.hoverIndex = -1;
    this.particles = [];
    this.sceneT = 0;
    this.transitionT = 0;

    this.gameFinished = false;
    this.exitDelay = 0;
    this.win = false;
    this.message = "";
    this.sheetsReward = 0;

    this.prevMouseDown = false;
    this._prevKeys = {};
    this.roundMistakes = 0;
    this.runAnswers = Array(this.totalRounds).fill(null);

    const A = this.game.assets;
    this.bgImage =
      (A && A.getImage && A.getImage("bg_modelar")) ||
      (A && A.getImage && A.getImage("mn_bg_signos")) ||
      (A && A.getImage && A.getImage("bg_lenguaje_natural")) ||
      null;

    this.runTemplates = this._pickN(this.templates, this.totalRounds);
  }

  destroy() {
    this.clearAll?.();
  }

  update(dt) {
    super.update(dt);
    this.sceneT += dt;

    const input = this.game.input;
    const keys = input.keys || {};
    const isJustPressed = (k) => keys[k] && !this._prevKeys[k];

    // Fin
    if (this.gameFinished) {
      if (this.exitDelay > 0) {
        this.exitDelay -= dt;
        this._prevKeys = { ...keys };
        return;
      }
      const wantsExit =
        input.isDown("Enter") || input.isDown(" ") || (input.mouse && input.mouse.down);
      if (wantsExit) window.MN_APP?.toOverworld?.();
      this._prevKeys = { ...keys };
      return;
    }

    const mouse = input.mouse || { x: 0, y: 0, down: false };
    this.hoverIndex = this._hitBalloonIndex(mouse.x, mouse.y);

    const justClicked = mouse.down && !this.prevMouseDown;
    this.prevMouseDown = mouse.down;

    // Intro
    if (this.state === "intro") {
      if (isJustPressed("Enter") || isJustPressed(" ") || justClicked) {
        this.playSfx(this.sfxPage, { volume: 0.5 });
        this._startRun();
      }
      this._updateParticles(dt);
      this._prevKeys = { ...keys };
      return;
    }

    // Transition
    if (this.state === "transition") {
      this.transitionT += dt;
      this._updateBalloons(dt);
      this._updateParticles(dt);
      if (this.transitionT >= this.transitionDur) {
        this.transitionT = 0;
        this.state = "playing";
        this._spawnBalloonsForStage();
      }
      this._prevKeys = { ...keys };
      return;
    }

    // Playing
    if (this.state === "playing") {
      if (justClicked && this.hoverIndex !== -1) {
        this._popBalloon(this.hoverIndex);
      }
      this._updateBalloons(dt);
      this._updateParticles(dt);
    }

    this._prevKeys = { ...keys };
  }

  _updateBalloons(dt) {
    for (const b of this.balloons) {
      if (b.isPopped) b.popT = Math.min(1, b.popT + dt * 2.6);
      b.wiggle += dt;
    }
  }

  _updateParticles(dt) {
    if (!this.particles.length) return;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.vy += 180 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  _startRun() {
    this.state = "playing";
    this.roundIndex = 0;
    this.lives = this.maxLives;
    this.runAnswers = Array(this.totalRounds).fill(null);
    this._loadRound(this.roundIndex);
    this.stage = "model";
    this._spawnBalloonsForStage();
  }

  _loadRound(idx) {
    const tpl = this.runTemplates[idx];
    const usedAnswers = new Set(
      this.runAnswers
        .filter((ans, answerIdx) => answerIdx !== idx && Number.isFinite(ans)),
    );
    let generated = tpl.make();
    for (let tries = 0; tries < 24; tries++) {
      const answer = generated?.solve?.answer;
      if (!usedAnswers.has(answer)) break;
      generated = tpl.make();
    }
    this.round = generated;
    this.runAnswers[idx] = this.round?.solve?.answer ?? null;
    this.round.revealedEq = false;
    this.roundMistakes = 0;
  }

  _swapCurrentRoundTemplate() {
    const current = this.runTemplates[this.roundIndex];
    if (!current) return;
    const usedIds = new Set(
      this.runTemplates
        .map((tpl, idx) => (idx === this.roundIndex ? null : tpl?.id))
        .filter(Boolean),
    );
    const candidates = this.templates.filter(
      (tpl) => tpl && tpl.id !== current.id && !usedIds.has(tpl.id),
    );
    if (!candidates.length) return;
    const next = candidates[(Math.random() * candidates.length) | 0];
    this.runTemplates[this.roundIndex] = next;
    this.runAnswers[this.roundIndex] = null;
  }

  _spawnBalloonsForStage() {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    const cx = W * 0.5;
    const cy = H * 0.57;

    const spacingX = Math.min(260, W * 0.28);
    const spacingY = Math.min(190, H * 0.22);
    const r = Math.min(64, Math.max(52, Math.floor(Math.min(W, H) * 0.075)));

    const topOffsetX = spacingX * 0.5;
    const bottomOffsetX = spacingX * 0.72;
    const pts = [
      { x: cx - topOffsetX, y: cy - spacingY * 0.5 },
      { x: cx + topOffsetX, y: cy - spacingY * 0.5 },
      { x: cx - bottomOffsetX, y: cy + spacingY * 0.5 },
      { x: cx + bottomOffsetX, y: cy + spacingY * 0.5 },
    ];

    const stageData = this.stage === "model" ? this.round.model : this.round.solve;

    this.balloons = pts.map((p, i) => {
      const isCorrect = i === stageData.correctIndex;
      return {
        x: p.x,
        y: p.y,
        r,
        label: stageData.options[i],
        isCorrect,
        isPopped: false,
        popT: 0,
        wiggle: Math.random() * 10,
        kind: this.stage,
      };
    });
  }

  _popBalloon(index) {
    const b = this.balloons[index];
    if (!b || b.isPopped) return;

    b.isPopped = true;
    b.popT = 0;

    this._spawnExplosion(b.x, b.y, b.isCorrect ? 14 : 26);

    if (b.isCorrect) this.playSfx(this.sfxOk, { volume: 0.55 });
    else this.playSfx(this.sfxBoom, { volume: 0.65 });

    if (!b.isCorrect) {
      this.roundMistakes += 1;
      this.lives -= 1;
      if (this.lives <= 0) {
        this.lives = 0;
        this._finishGame(true);
      } else if (this.roundMistakes >= 1) {
        this.stage = "model";
        this._swapCurrentRoundTemplate();
        this._loadRound(this.roundIndex);
        this.state = "transition";
        this.transitionT = 0;
      }
      return; // reinicia la ronda actual tras el error
    }

    // Correcto
    if (this.stage === "model") {
      this.round.revealedEq = true;
      this.stage = "solve";
      this.state = "transition";
      this.transitionT = 0;
      this.playSfx(this.sfxPage, { volume: 0.35 });
      return;
    }

    // stage === solve
    if (this.roundIndex < this.totalRounds - 1) {
      this.roundIndex += 1;
      this._loadRound(this.roundIndex);
      this.stage = "model";
      this.state = "transition";
      this.transitionT = 0;
      this.playSfx(this.sfxPage, { volume: 0.35 });
      return;
    }

    this._finishGame(false);
  }

  _finishGame(failed) {
    if (this.gameFinished) return;

    this.gameFinished = true;
    this.state = "finished";
    this.exitDelay = 0.55;
    this.win = !failed;

    const tier = failed ? 0 : 1;
    let gained = 0;
    if (window.MN_reportMinigameTier) gained = MN_reportMinigameTier("modelar", tier);
    this.sheetsReward = gained;

    if (this.win) {
      this.playSfx(this.sfxWin, { volume: 0.7 });
      this.message =
        "¡Sobreviviste al modelado!\n" +
        `Rondas: ${this.totalRounds}/${this.totalRounds}.\n` +
        `Vidas restantes: ${this.lives}/${this.maxLives}.\n` +
        `Hojas ganadas: ${gained}.`;
    } else {
      this.playSfx(this.sfxLose, { volume: 0.6 });
      this.message =
        "Fallaste¦\n" +
        `Llegaste a: ${this.roundIndex + 1}/${this.totalRounds}.\n` +
        `Hojas ganadas: ${gained}.`;
    }

    try {
      this.game?.events?.emit?.("modelar_done", {
        win: this.win,
        tier,
        sheetsReward: gained,
        failed,
      });
    } catch (_) {}
  }

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
      ctx.fillStyle = "#081018";
      ctx.fillRect(0, 0, W, H);
    }

    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, W, H);

    this._drawHUD(ctx);

    if (this.state === "intro") {
      this._drawIntro(ctx);
      this._drawParticles(ctx);
      return;
    }

    this._drawStatement(ctx);
    this._drawStageLabel(ctx);
    this._drawBalloons(ctx);
    this._drawParticles(ctx);

    if (this.gameFinished) this._drawEndMessage(ctx);
  }

  _drawHUD(ctx) {
    const W = this.game.canvas.width;

    ctx.save();
    for (let i = 0; i < this.maxLives; i++) {
      const x = 20 + i * 26;
      const y = 18;
      this._drawHeart(ctx, x, y, 20, i < this.lives ? "#ff4b5c" : "#3a1a1f");
    }

    ctx.font = this.smallFont;
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillText(`Problema: ${Math.min(this.roundIndex + 1, this.totalRounds)}/${this.totalRounds}`, W - 18, 16);
    ctx.restore();
  }
  _drawIntro(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font = this.titleFont;
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Pincha el Globo", W / 2, H * 0.28);

    ctx.font = this.textFont;
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.fillText("1) Elige el planteamiento correcto.", W / 2, H * 0.40);
    ctx.fillText("2) Resuelve la ecuación.", W / 2, H * 0.47);

    ctx.font = this.smallFont;
    ctx.fillStyle = "rgba(255,255,255,0.86)";
    ctx.fillText("Tienes 3 vidas y solo 1 error por ronda.", W / 2, H * 0.58);
    ctx.fillText(
      "Si fallas, explota un globo, pierdes una vida y reinicias la ronda.",
      W / 2,
      H * 0.63,
    );
    ctx.fillText("Pulsa ENTER, ESPACIO o clic para comenzar.", W / 2, H * 0.72);

    ctx.restore();
  }

  _drawStatement(ctx) {
    if (!this.round) return;
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;
    const statementY = H * 0.11 + 20;
    const boxW = W * 0.88;
    const boxH = 92;
    const boxX = (W - boxW) / 2;
    const boxY = statementY - 24;

    ctx.save();
    ctx.textAlign = "center";

    ctx.fillStyle = "rgba(6, 10, 18, 0.82)";
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.font = this.textFont;
    ctx.fillStyle = "#ffffff";
    this._wrapText(ctx, this.round.text, W / 2, statementY, W * 0.86, 26);

    if (this.round.revealedEq) {
      ctx.font = "22px Arial";
      ctx.fillStyle = "rgba(255,235,59,0.95)";
      ctx.fillText(this.round.model.correctEq, W / 2, H * 0.24);
    }

    ctx.restore();
  }

  _drawStageLabel(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const label = this.stage === "model" ? "Fase 1: Plantea" : "Fase 2: Resuelve";
    ctx.font = "18px Arial";
    ctx.fillStyle = "rgba(220,230,255,0.95)";
    ctx.fillText(label, W / 2, H * 0.31);

    ctx.restore();
  }

  _drawBalloons(ctx) {
    if (!this.balloons.length) return;
    ctx.save();
    for (let i = 0; i < this.balloons.length; i++) {
      const b = this.balloons[i];
      const isHover = i === this.hoverIndex && !b.isPopped && this.state === "playing";
      this._drawBalloon(ctx, b, isHover);
    }
    ctx.restore();
  }

  _drawBalloon(ctx, b, isHover) {
    const t = b.wiggle;
    const wob = Math.sin(t * 2.2) * 2.5;
    const x = b.x + wob;
    const y = b.y + Math.cos(t * 1.7) * 1.8;

    // cuerda
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y + b.r);
    ctx.quadraticCurveTo(x + wob * 2, y + b.r + 50, x, y + b.r + 110);
    ctx.stroke();
    ctx.restore();

    // reventado
    if (b.isPopped) {
      const k = b.popT;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - k);
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, b.r * (1 - k * 0.35), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      return;
    }

    // globo
    const g = ctx.createRadialGradient(x - b.r * 0.35, y - b.r * 0.35, b.r * 0.2, x, y, b.r);
    g.addColorStop(0, "rgba(255,255,255,0.92)");
    g.addColorStop(0.12, "rgba(255,120,120,0.95)");
    g.addColorStop(1, "rgba(180,30,50,0.92)");

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.40)";
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 8;

    ctx.beginPath();
    ctx.ellipse(x, y, b.r * 0.92, b.r, 0, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();

    ctx.shadowColor = "transparent";
    ctx.strokeStyle = isHover ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.45)";
    ctx.lineWidth = isHover ? 3 : 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(x - b.r * 0.32, y - b.r * 0.25, b.r * 0.16, b.r * 0.26, -0.2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fill();

    ctx.font = this.balloonFont;
    ctx.fillStyle = "rgba(255,255,255,0.98)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const maxW = b.r * 1.55;
    this._wrapText(ctx, b.label, x, y, maxW, 20);

    ctx.restore();
  }

  _drawParticles(ctx) {
    if (!this.particles.length) return;
    ctx.save();
    for (const p of this.particles) {
      const a = Math.max(0, Math.min(1, p.life / p.life0));
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  _drawEndMessage(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const panelW = Math.min(700, W * 0.88);
    const panelH = 220;
    const x = (W - panelW) / 2;
    const y = (H - panelH) / 2;

    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillRect(x, y, panelW, panelH);
    ctx.strokeStyle = this.win ? "rgba(150,255,150,0.8)" : "rgba(255,120,120,0.8)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, panelW, panelH);

    ctx.font = "28px Arial";
    ctx.fillStyle = this.win ? "rgba(180,255,180,0.95)" : "rgba(255,170,170,0.95)";
    ctx.fillText(this.win ? "¡Bien!" : "Game Over", W / 2, y + 42);

    ctx.font = this.smallFont;
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    const lines = (this.message || "").split("\n").filter(Boolean);
    let yy = y + 86;
    for (const line of lines.slice(0, 5)) {
      ctx.fillText(line, W / 2, yy);
      yy += 24;
    }

    ctx.fillStyle = "rgba(255,235,59,0.9)";
    ctx.fillText("Pulsa ENTER, ESPACIO o clic para volver.", W / 2, y + panelH - 28);

    ctx.restore();
  }

  _hitBalloonIndex(px, py) {
    for (let i = 0; i < this.balloons.length; i++) {
      const b = this.balloons[i];
      const dx = px - b.x;
      const dy = py - b.y;
      if (!b.isPopped && dx * dx + dy * dy <= b.r * b.r) return i;
    }
    return -1;
  }

  _spawnExplosion(x, y, count) {
    const cols = [
      "rgba(255,220,120,1)",
      "rgba(255,120,120,1)",
      "rgba(255,255,255,1)",
      "rgba(255,180,80,1)",
    ];
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = 120 + Math.random() * 260;
      const vx = Math.cos(ang) * sp;
      const vy = Math.sin(ang) * sp - 120;
      const life0 = 0.35 + Math.random() * 0.45;
      this.particles.push({
        x, y, vx, vy,
        r: 2 + Math.random() * 4,
        life: life0,
        life0,
        color: cols[(Math.random() * cols.length) | 0],
      });
    }
  }

  _wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    if (!text) return;
    const words = String(text).split(" ");
    let line = "";
    let yy = y;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const w = ctx.measureText(testLine).width;
      if (w > maxWidth && n > 0) {
        ctx.fillText(line.trim(), x, yy);
        line = words[n] + " ";
        yy += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), x, yy);
  }

  _drawHeart(ctx, x, y, s, fillStyle) {
    ctx.save();
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    ctx.moveTo(x, y + s / 4);
    ctx.bezierCurveTo(x, y, x - s / 2, y, x - s / 2, y + s / 4);
    ctx.bezierCurveTo(x - s / 2, y + s / 2, x, y + s * 0.8, x, y + s);
    ctx.bezierCurveTo(x, y + s * 0.8, x + s / 2, y + s / 2, x + s / 2, y + s / 4);
    ctx.bezierCurveTo(x + s / 2, y, x, y, x, y + s / 4);
    ctx.fill();
    ctx.restore();
  }

  _pickN(arr, n) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a.slice(0, Math.min(n, a.length));
  }

  _buildTemplates() {
    const pick = (a) => a[(Math.random() * a.length) | 0];
    const ri = (a, b) => a + ((Math.random() * (b - a + 1)) | 0);

    const shuffleWithCorrect = (correct, distractors) => {
      const all = [correct, ...distractors];
      for (let i = all.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        [all[i], all[j]] = [all[j], all[i]];
      }
      return { options: all, correctIndex: all.indexOf(correct) };
    };

    const shuffleAnswers = (answer, distractors) => {
      const all = [answer, ...distractors];
      for (let i = all.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        [all[i], all[j]] = [all[j], all[i]];
      }
      return { options: all.map(String), correctIndex: all.indexOf(answer) };
    };

    return [
      {
        id: "ahorro_igualan",
        make: () => {
          let A0 = 0;
          let Ad = 0;
          let B0 = 0;
          let Bd = 0;
          let x = 0;
          for (let tries = 0; tries < 40; tries++) {
            A0 = pick([120, 150, 180, 200, 220, 240, 260]);
            Ad = pick([18, 20, 22, 24, 25, 27, 30]);
            Bd = pick([6, 8, 10, 12, 14, 15, 16]);
            if (Ad <= Bd) continue;
            x = ri(6, 18);
            B0 = A0 + (Ad - Bd) * x;
            if (B0 >= 220 && B0 <= 620 && B0 !== A0) break;
          }
          const text =
            `José tiene $${A0} y ahorra $${Ad} al dí­a. ` +
            `Martí­n tiene $${B0} y ahorra $${Bd} al dí­a. ` +
            `¿Después de cuántos dí­as tendrán la misma cantidad?`;

          const correctEq = `${A0} + ${Ad}x = ${B0} + ${Bd}x`;
          const { options, correctIndex } = shuffleWithCorrect(correctEq, [
            `${A0} + ${Ad}x = ${B0} + ${Ad}x`,
            `${A0} + ${Bd}x = ${B0} + ${Ad}x`,
            `${B0} + ${Bd}x = ${A0} + ${Bd}x`,
          ]);

          const ans = x | 0;
          const { options: ansOps, correctIndex: ansIdx } =
            shuffleAnswers(ans, [ans - 2, ans - 1, ans + 1]);

          return { text, model: { options, correctIndex, correctEq }, solve: { options: ansOps, correctIndex: ansIdx, answer: ans } };
        },
      },

      {
        id: "impresiones_igualan",
        make: () => {
          let f1 = 0;
          let p1 = 0;
          let f2 = 0;
          let p2 = 0;
          let x = 0;
          for (let tries = 0; tries < 40; tries++) {
            p1 = pick([2, 3, 4, 5]);
            p2 = pick([4, 5, 6, 7]);
            if (p2 <= p1) continue;
            f2 = pick([10, 15, 20, 25, 30, 35]);
            x = ri(5, 18);
            f1 = f2 + (p2 - p1) * x;
            if (f1 >= 25 && f1 <= 95) break;
          }
          const text =
            `Copisterí­a A cobra $${f1} de cuota fija y $${p1} por hoja. ` +
            `Copisterí­a B cobra $${f2} de cuota fija y $${p2} por hoja. ` +
            `¿Cuántas hojas hacen que el costo sea igual?`;

          const correctEq = `${f1} + ${p1}x = ${f2} + ${p2}x`;
          const { options, correctIndex } = shuffleWithCorrect(correctEq, [
            `${f1} + ${p2}x = ${f2} + ${p1}x`,
            `${f1} + ${p1}x = ${f2} + ${p1}x`,
            `${f1}x + ${p1} = ${f2}x + ${p2}`,
          ]);

          const ans = x | 0;
          const { options: ansOps, correctIndex: ansIdx } =
            shuffleAnswers(ans, [ans - 1, ans + 1, ans + 10]);

          return { text, model: { options, correctIndex, correctEq }, solve: { options: ansOps, correctIndex: ansIdx, answer: ans } };
        },
      },

      {
        id: "taxi_km",
        make: () => {
          const band = pick([20, 25, 30]);
          const p = pick([10, 12, 14]);
          const km = ri(4, 9);
          const T = band + p * km;
          const text = `Un taxi cobra $${band} de banderazo y $${p} por kilómetro. Pagaste $${T}. ¿Cuántos km recorriste?`;

          const correctEq = `${band} + ${p}x = ${T}`;
          const { options, correctIndex } = shuffleWithCorrect(correctEq, [
            `${p}(x + ${band}) = ${T}`,
            `${band}x + ${p} = ${T}`,
            `${band} - ${p}x = ${T}`,
          ]);

          const ans = km;
          const { options: ansOps, correctIndex: ansIdx } =
            shuffleAnswers(ans, [ans - 1, ans + 1, ans + 2]);

          return { text, model: { options, correctIndex, correctEq }, solve: { options: ansOps, correctIndex: ansIdx, answer: ans } };
        },
      },

      {
        id: "cine_boletos",
        make: () => {
          const p = pick([55, 60, 65]);
          const f = pick([100, 120, 140]);
          const x = ri(2, 6);
          const T = p * x + f;
          const text = `Cada boleto cuesta $${p} y además compraron un combo de $${f}. Pagaron $${T}. ¿Cuántos boletos compraron?`;

          const correctEq = `${p}x + ${f} = ${T}`;
          const { options, correctIndex } = shuffleWithCorrect(correctEq, [
            `${p}(x + ${f}) = ${T}`,
            `${f}x + ${p} = ${T}`,
            `${p}x - ${f} = ${T}`,
          ]);

          const ans = x;
          const { options: ansOps, correctIndex: ansIdx } =
            shuffleAnswers(ans, [ans - 1, ans + 1, ans + 2]);

          return { text, model: { options, correctIndex, correctEq }, solve: { options: ansOps, correctIndex: ansIdx, answer: ans } };
        },
      },

      {
        id: "ahorro_semanal",
        make: () => {
          const f = pick([50, 80, 100, 120]);
          const p = pick([20, 25, 30, 40]);
          const x = ri(3, 10);
          const T = f + p * x;
          const text = `Ana tení­a $${f} y ahorra $${p} por semana. Después tiene $${T}. ¿Cuántas semanas pasaron?`;

          const correctEq = `${f} + ${p}x = ${T}`;
          const { options, correctIndex } = shuffleWithCorrect(correctEq, [
            `${p} + ${f}x = ${T}`,
            `${p}(x + ${f}) = ${T}`,
            `${f} - ${p}x = ${T}`,
          ]);

          const ans = x;
          const { options: ansOps, correctIndex: ansIdx } =
            shuffleAnswers(ans, [ans - 2, ans - 1, ans + 1]);

          return { text, model: { options, correctIndex, correctEq }, solve: { options: ansOps, correctIndex: ansIdx, answer: ans } };
        },
      },

      {
        id: "descuento_unitario",
        make: () => {
          const p = pick([40, 45, 50]);
          const d = pick([5, 10]);
          const x = ri(3, 8);
          const T = (p - d) * x;
          const item = pick(["cuadernos", "plumas", "boletos"]);
          const text = `Cada ${item.slice(0, -1)} cuesta $${p}, pero te descuentan $${d} por cada uno. Pagaste $${T}. ¿Cuántos ${item} compraste?`;

          const correctEq = `(${p} - ${d})x = ${T}`;
          const { options, correctIndex } = shuffleWithCorrect(correctEq, [
            `${p}x - ${d} = ${T}`,
            `${p} - ${d}x = ${T}`,
            `${p}x + ${d} = ${T}`,
          ]);

          const ans = x;
          const { options: ansOps, correctIndex: ansIdx } =
            shuffleAnswers(ans, [ans - 1, ans + 1, ans + 3]);

          return { text, model: { options, correctIndex, correctEq }, solve: { options: ansOps, correctIndex: ansIdx, answer: ans } };
        },
      },

      {
        id: "botellas",
        make: () => {
          const start = pick([40, 50, 60]);
          const rate = pick([6, 8, 10]);
          const x = ri(6, 14);
          const T = start + rate * x;
          const text = `Una máquina ya llenó ${start} botellas y llena ${rate} por minuto. ¿Cuántos minutos necesita para llegar a ${T} botellas?`;

          const correctEq = `${start} + ${rate}x = ${T}`;
          const { options, correctIndex } = shuffleWithCorrect(correctEq, [
            `${rate}x + ${T} = ${start}`,
            `${start}x + ${rate} = ${T}`,
            `${start} - ${rate}x = ${T}`,
          ]);

          const ans = x;
          const { options: ansOps, correctIndex: ansIdx } =
            shuffleAnswers(ans, [ans - 1, ans + 1, ans + 2]);

          return { text, model: { options, correctIndex, correctEq }, solve: { options: ansOps, correctIndex: ansIdx, answer: ans } };
        },
      },

      {
        id: "plan_mensual",
        make: () => {
          const f = pick([99, 149, 199]);
          const p = pick([20, 25, 30]);
          const x = ri(2, 8);
          const T = f + p * x;
          const text = `Un plan cuesta $${f} al mes y cobra $${p} por cada GB extra. Este mes pagaste $${T}. ¿Cuántos GB extra consumiste?`;

          const correctEq = `${f} + ${p}x = ${T}`;
          const { options, correctIndex } = shuffleWithCorrect(correctEq, [
            `${p}(x + ${f}) = ${T}`,
            `${f}x + ${p} = ${T}`,
            `${f} - ${p}x = ${T}`,
          ]);

          const ans = x;
          const { options: ansOps, correctIndex: ansIdx } =
            shuffleAnswers(ans, [ans - 2, ans - 1, ans + 1]);

          return { text, model: { options, correctIndex, correctEq }, solve: { options: ansOps, correctIndex: ansIdx, answer: ans } };
        },
      },

      {
        id: "entrada_boletos",
        make: () => {
          const entry = pick([20, 30, 40]);
          const p = pick([10, 12, 15]);
          const x = ri(5, 12);
          const T = entry + p * x;
          const text = `En una kermés, cada boleto cuesta $${p} y además pagas $${entry} de entrada. Te cobraron $${T}. ¿Cuántos boletos compraste?`;

          const correctEq = `${p}x + ${entry} = ${T}`;
          const { options, correctIndex } = shuffleWithCorrect(correctEq, [
            `${p}(x + ${entry}) = ${T}`,
            `${entry}x + ${p} = ${T}`,
            `${p}x - ${entry} = ${T}`,
          ]);

          const ans = x;
          const { options: ansOps, correctIndex: ansIdx } =
            shuffleAnswers(ans, [ans - 1, ans + 1, ans + 4]);

          return { text, model: { options, correctIndex, correctEq }, solve: { options: ansOps, correctIndex: ansIdx, answer: ans } };
        },
      },

      {
        id: "carrera_doble",
        make: () => {
          const name = pick(["Raúl", "Sofí­a", "Diana", "Mateo", "Valeria", "Hugo", "Camila", "Bruno"]);
          const factor = pick([2, 3]);
          const factorText = factor === 2 ? "el doble" : "el triple";
          const before = ri(3, 17);
          const place = before + 1;
          const N = (factor + 1) * before + 1;
          const text = `${N} niños participaron en una carrera. Los que llegaron detrás de ${name} fueron ${factorText} de los que llegaron antes. ¿En qué lugar llegó ${name}?`;

          const correctEq = `x + 1 + ${factor}x = ${N}`;
          const { options, correctIndex } = shuffleWithCorrect(correctEq, [
            `x + ${factor}x = ${N}`,
            `x + 1 + ${factor - 1}x = ${N}`,
            `x + 1 + ${factor}x = ${N - 1}`,
          ]);

          const ans = place;
          const { options: ansOps, correctIndex: ansIdx } =
            shuffleAnswers(ans, [ans - 1, ans + 1, ans + 2]);

          return { text, model: { options, correctIndex, correctEq }, solve: { options: ansOps, correctIndex: ansIdx, answer: ans } };
        },
      },
    ];
  }
}

window.ModelarScene = ModelarScene;
