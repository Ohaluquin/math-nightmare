// js/areas/aritmetica/niveles/armoniaScene.js
// ===========================================================
// ArmoniaScene — "Armonia de la División"
// - Muestra una división larga "a mano" (hasta centésimas).
// - Un solo error en una celda numérica.
// - El jugador hace clic en el número sospechoso.
// - Formato coherente con tus minijuegos: intro/playing/finished.
// ===========================================================

class ArmoniaScene extends Scene {
  constructor(game, options = {}) {
    super(game);

    // --- Modo contrarreloj / progreso ---
    this.startLives = 3;
    this.lives = this.startLives;
    this.totalTime = 210; // 3:30
    this.timeLeft = this.totalTime;
    this.score = 0;
    this.scoreGoal = 2000;
    this.timeToSolveMax = 10;
    this.correctStreak = 0;
    this.bestStreak = 0;
    this.totalSolved = 0;
    this.totalCorrect = 0;
    this.totalWrong = 0;
    this.difficultyStage = 1;
    this.difficultyEvery = 40;
    this._lastDifficultyStage = 1;
    this.visualizerPhase = 0;
    this.caseStartElapsed = 0;
    this.betweenDuration = 0.55;
    this.betweenTimer = 0;
    this.betweenLabel = "";
    this.betweenLabelColor = "#ffffff";
    this.milestones = [500, 1000, 1500, 2000, 2500, 3000];
    this.nextMilestoneIndex = 0;
    this.milestoneToast = "";
    this.milestoneToastTimer = 0;

    // feedback UI
    this.feedback = "";
    this.feedbackColor = "#ffef9f"; // neutro

    // Estado estándar
    this.state = "intro"; // intro | playing | between | finished
    this.gameFinished = false;
    this.exitDelay = 0;
    this.message = "";
    this.win = false;
    this.sheetsReward = 0;

    // Caso actual
    this.caseData = null; // { ..., clickableCells:[...], impostorMeta:{row,col,...} }
    this.selectedCell = null;
    this.postIt = null; // { x,y,w,h,row,col,state,vy,spin,angle,revealedToken }

    // Input
    this._prevMouseDown = false;

    // Layout
    this.pad = 28;
    this.paper = { x: 0, y: 0, w: 0, h: 0 };

    // SFX (usa las keys que ya tienes; si no existen, no truena)
    this.sfxOk = "sfx_match";
    this.sfxBad = "sfx_error";
    this.sfxWin = "sfx_win";
    this.bgmKey = options.bgmKey || "bgm_armonia_division";
    this.bgmVolume = options.bgmVolume ?? 0.32;
  }

  init() {
    this.state = "intro";
    this.gameFinished = false;
    this.exitDelay = 0;
    this.win = false;
    this.sheetsReward = 0;
    this.selectedCell = null;
    this.postIt = null;
    this._prevMouseDown = false;

    this.lives = this.startLives;
    this.timeLeft = this.totalTime;
    this.score = 0;
    this.correctStreak = 0;
    this.bestStreak = 0;
    this.totalSolved = 0;
    this.totalCorrect = 0;
    this.totalWrong = 0;
    this.difficultyStage = 1;
    this._lastDifficultyStage = 1;
    this.visualizerPhase = 0;
    this.caseStartElapsed = 0;
    this.betweenTimer = 0;
    this.betweenLabel = "";
    this.betweenLabelColor = "#ffffff";
    this.nextMilestoneIndex = 0;
    this.milestoneToast = "";
    this.milestoneToastTimer = 0;

    this.feedback = "";
    this.feedbackColor = "#ffef9f";

    window.MN_setLeafHUDVisible?.(false);
    window.MN_setInputMode?.("mouse"); // en intro

    this._buildCase();
  }

  destroy() {
    this._stopBgm();
  }

  playSfx(key, volume = 0.6) {
    try {
      this.game.assets?.playSound?.(key, { volume });
    } catch (_) {}
  }

  _startBgm() {
    try {
      const key = this.game.assets?.getSound?.(this.bgmKey)
        ? this.bgmKey
        : "bgm_quiet";
      this.game.assets?.playMusic?.(key, {
        loop: false,
        volume: this.bgmVolume,
      });
    } catch (_) {}
  }

  _stopBgm() {
    try {
      this.game.assets?.stopMusic?.();
    } catch (_) {}
  }

  update(dt) {
    super.update(dt);

    const input = this.game.input;
    const mouse = input.mouse || { down: false, x: 0, y: 0 };

    // Finished → volver
    if (this.gameFinished) {
      if (this.exitDelay > 0) {
        this.exitDelay -= dt;
        this._prevMouseDown = mouse.down;
        return;
      }
      const wantsExit =
        input.isDown("Enter") || input.isDown(" ") || mouse.down;
      if (wantsExit) {
        window.MN_setInputMode?.(null);
        window.MN_setLeafHUDVisible?.(true);
        // volver a overworld del área
        window.MN_APP?.toOverworld?.();
      }
      this._prevMouseDown = mouse.down;
      return;
    }

    // Intro → empezar
    if (this.state === "intro") {
      const wantsStart =
        input.isDown("Enter") || input.isDown(" ") || mouse.down;
      if (wantsStart) {
        this.state = "playing";
        this._startBgm();
        window.MN_setInputMode?.(null);
        this.message = "Encuentra el número incorrecto.";
      }
      this._prevMouseDown = mouse.down;
      return;
    }

    // --- timer global ---
    if ((this.state === "playing" || this.state === "between") && !this.gameFinished) {
      this.timeLeft -= dt;
      this.visualizerPhase += dt * (2.6 + Math.min(this.correctStreak, 12) * 0.16);

      const elapsed = Math.max(0, this.totalTime - this.timeLeft);
      const stage = 1 + Math.floor(elapsed / this.difficultyEvery);
      if (stage > this._lastDifficultyStage) {
        this.difficultyStage = stage;
        this._lastDifficultyStage = stage;
        this.feedback = `Nivel ${this.difficultyStage}: la dificultad aumenta.`;
        this.feedbackColor = "#ffe082";
      }

      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.win = this.score >= this.scoreGoal && this.lives > 0;
        this.message = this.win
          ? "¡Tiempo! Llegaste a la meta del caso."
          : "Tiempo agotado. El caso queda abierto.";
        this._finish(!this.win);
        this._prevMouseDown = mouse.down;
        return;
      }
    }

    if (this.milestoneToastTimer > 0) {
      this.milestoneToastTimer -= dt;
      if (this.milestoneToastTimer <= 0) {
        this.milestoneToastTimer = 0;
        this.milestoneToast = "";
      }
    }

    if (this.state === "between") {
      this.betweenTimer -= dt;
      if (this.betweenTimer <= 0) {
        this.betweenTimer = 0;
        this.betweenLabel = "";
        this.selectedCell = null;
        this.postIt = null;
        this._buildCase();
        this.state = "playing";
      }
      this._prevMouseDown = mouse.down;
      return;
    }

    if (
      this.state === "playing" &&
      (this.postIt?.state === "attached" || this.postIt?.state === "falling")
    ) {
      this._updatePostIt(dt);
      this._prevMouseDown = mouse.down;
      return;
    }

    // Playing → click en celda
    const justClick = mouse.down && !this._prevMouseDown;
    if (justClick && this.state === "playing" && this.caseData?.clickableCells) {
      const mx = mouse.x + (this.camera?.x || 0);
      const my = mouse.y + (this.camera?.y || 0);

      const hit = this.caseData.clickableCells.find(
        (c) => mx >= c.x && mx <= c.x + c.w && my >= c.y && my <= c.y + c.h,
      );

      if (hit) this._onPickCell(hit);
    }

    this._prevMouseDown = mouse.down;
  }

  _onPickCell(cell) {
    if (!this.caseData || this.state !== "playing") return;
    if (this.postIt) return;

    this.selectedCell = { row: cell.row, col: cell.col };
    const target = this.caseData.impostorMeta;

    if (
      target &&
      cell.row === target.row &&
      cell.col === target.col &&
      this.postIt == null
    ) {
      this.playSfx(this.sfxOk, 0.55);
      this._attachPostIt(cell);
      this.feedback = "Buen ojo.";
      this.feedbackColor = "#a5ff7b";
      return;
    }

    // ❌ Incorrecto
    this.playSfx(this.sfxBad, 0.6);
    this.totalWrong += 1;
    this.correctStreak = 0;
    this.lives = Math.max(0, this.lives - 1);
    this.score = Math.max(0, this.score - 70);
    this.feedback = "Ese no es el número incorrecto. -1 corazón y se rompe la racha.";
    this.feedbackColor = "#ff9aa2";

    if (this.lives <= 0) {
      this.win = false;
      this.message = "Se te acabaron los corazones.";
      this._finish(true);
      return;
    }
    this.selectedCell = null;
  }

  _attachPostIt(cell) {
    const pad = Math.max(2, Math.floor(cell.w * 0.08));
    this.postIt = {
      x: cell.x - pad,
      y: cell.y - pad,
      w: cell.w + pad * 2,
      h: cell.h + pad * 2,
      row: cell.row,
      col: cell.col,
      state: "attached",
      autoDropDelay: 0.35,
      vy: 0,
      spin: (Math.random() * 2 - 1) * 3.2,
      angle: (Math.random() * 2 - 1) * 0.05,
      revealedToken: false,
    };
  }

  _dropPostItAndReveal() {
    if (!this.postIt || this.postIt.state !== "attached") return;
    this.postIt.state = "falling";
    this.postIt.vy = 120;

    const meta = this.caseData?.impostorMeta;
    const idx = meta?.tokenIndex;
    if (
      meta &&
      Number.isInteger(idx) &&
      this.caseData?.gridTokens?.[idx] &&
      !this.postIt.revealedToken
    ) {
      this.caseData.gridTokens[idx].ch = String(meta.oldDigit);
      this.postIt.revealedToken = true;
    }
  }

  _updatePostIt(dt) {
    const p = this.postIt;
    if (!p) return;

    if (p.state === "attached") {
      p.autoDropDelay = (p.autoDropDelay || 0) - dt;
      if (p.autoDropDelay <= 0) this._dropPostItAndReveal();
      return;
    }

    if (p.state !== "falling") return;

    p.vy += 980 * dt;
    p.y += p.vy * dt;
    p.x += p.spin * 42 * dt;
    p.angle += p.spin * dt;

    if (p.y > this.paper.y + this.paper.h + 70) {
      this.postIt = null;
      this._resolveCorrectCell();
    }
  }

  _resolveCorrectCell() {
    this.totalSolved += 1;
    this.totalCorrect += 1;
    this.correctStreak += 1;
    this.bestStreak = Math.max(this.bestStreak, this.correctStreak);

    const solveTime = Math.max(0, this._elapsedTime() - this.caseStartElapsed);
    const pts = this._pointsForCorrect(solveTime);
    this.score += pts.total;
    this._checkMilestones();

    let bonusHeart = false;
    if (this.correctStreak % 3 === 0) {
      this.lives += 1;
      bonusHeart = true;
    }

    const speedTxt = pts.speedBonus > 0 ? ` (+${pts.speedBonus} veloz)` : "";
    this.feedback = bonusHeart
      ? `¡Racha x${this.correctStreak}! +${pts.total} pts${speedTxt} y +1 corazón.`
      : `¡Bien! +${pts.total} pts${speedTxt}.`;
    this.feedbackColor = "#a5ff7b";
    this._enterBetween("Numero corregido", "#a5ff7b");
  }

  _finish(failed = false) {
    if (this.gameFinished) return;
    this.gameFinished = true;
    this.state = "finished";
    this.exitDelay = 0.45;
    this._stopBgm();

    const tier = failed ? 0 : 1;

    let gained = 0;
    if (typeof window.MN_reportMinigameTier === "function") {
      gained = window.MN_reportMinigameTier("armonia_division", tier);
    }
    this.sheetsReward = gained;

    this.message += `\nPuntaje final: ${this.score}. Meta: ${this.scoreGoal}.`;
    this.message += `\nAciertos: ${this.totalCorrect} | Errores: ${this.totalWrong} | Mejor racha: ${this.bestStreak}.`;
    this.message += `\nHojas ganadas: ${gained}.`;
  }

  _elapsedTime() {
    return Math.max(0, this.totalTime - this.timeLeft);
  }

  _enterBetween(label, color = "#ffffff") {
    this.state = "between";
    this.betweenTimer = this.betweenDuration;
    this.betweenLabel = label;
    this.betweenLabelColor = color;
  }

  _checkMilestones() {
    while (
      this.nextMilestoneIndex < this.milestones.length &&
      this.score >= this.milestones[this.nextMilestoneIndex]
    ) {
      const m = this.milestones[this.nextMilestoneIndex];
      this.nextMilestoneIndex += 1;
      this.milestoneToast = `Meta alcanzada: ${m} puntos`;
      this.milestoneToastTimer = 1.0;
      this.playSfx(this.sfxOk, 0.45);
    }
  }

  draw(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    // Fondo
    const bg = this.game.assets?.getImage?.("bg_karaoke");
    if (bg) {
      const scale = Math.max(W / bg.width, H / bg.height);
      const dw = bg.width * scale;
      const dh = bg.height * scale;
      const dx = (W - dw) / 2;
      const dy = (H - dh) / 2;
      ctx.drawImage(bg, dx, dy, dw, dh);
      ctx.fillStyle = "rgba(7,10,20,0.35)";
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.fillStyle = "#070a14";
      ctx.fillRect(0, 0, W, H);
    }

    // Papel (más compacto y centrado)
    const targetW = Math.min(W * 0.82, W - this.pad * 2 - 40) * 0.74;
    const targetH = Math.min(H - 250, H * 0.68);
    this.paper.w = Math.max(520, targetW);
    this.paper.h = Math.max(430, targetH);
    this.paper.x = Math.round((W - this.paper.w) * 0.5);
    this.paper.y = Math.round(116 + (H - 720) * 0.08);

    // Marco + sombra suave
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.fillRect(this.paper.x + 8, this.paper.y + 10, this.paper.w, this.paper.h);
    ctx.fillStyle = "#f2f4f8";
    ctx.fillRect(this.paper.x, this.paper.y, this.paper.w, this.paper.h);
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 2;
    ctx.strokeRect(this.paper.x - 6, this.paper.y - 6, this.paper.w + 12, this.paper.h + 12);
    ctx.restore();

    // cuadriculado suave (tipo tu hoja)
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = "#3b73ff";
    for (let x = this.paper.x; x <= this.paper.x + this.paper.w; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, this.paper.y);
      ctx.lineTo(x, this.paper.y + this.paper.h);
      ctx.stroke();
    }
    for (let y = this.paper.y; y <= this.paper.y + this.paper.h; y += 24) {
      ctx.beginPath();
      ctx.moveTo(this.paper.x, y);
      ctx.lineTo(this.paper.x + this.paper.w, y);
      ctx.stroke();
    }
    ctx.restore();

    // Título
    ctx.fillStyle = "#ffffff";
    ctx.font = "24px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Armonia de la División", W / 2, 36);

    ctx.font = "14px Arial";
    ctx.fillStyle = "#cfe7ff";
    ctx.fillText("Haz clic en el número incorrecto.", W / 2, 58);

    if (this.state === "finished") {
      // Opcional: si quieres, NO dibujes la división detrás (se ve más limpio)
      this._drawEnd(ctx);
      return;
    }

    if (this.caseData) this._drawGridDivision(ctx);
    this._drawStreakVisualizer(ctx);

    ctx.save();
    this._drawHUD(ctx);
    ctx.restore();

    if (this.state === "between") this._drawBetweenOverlay(ctx);
    if (this.milestoneToastTimer > 0 && this.milestoneToast) this._drawMilestoneToast(ctx);
    if (this.state === "intro") this._drawIntro(ctx);
  }

  _drawBetweenOverlay(ctx) {
    const W = this.game.canvas.width;
    const w = Math.min(560, this.paper.w * 0.76);
    const h = 62;
    const x = (W - w) / 2;
    const y = this.paper.y + 28;

    ctx.save();
    ctx.fillStyle = "rgba(3,10,22,0.74)";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "rgba(240,245,255,0.45)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, w, h);

    ctx.textAlign = "center";
    ctx.font = "28px Arial";
    ctx.fillStyle = this.betweenLabelColor || "#ffffff";
    ctx.fillText(this.betweenLabel || "Siguiente caso...", W / 2, y + 35);
    ctx.restore();
  }

  _drawMilestoneToast(ctx) {
    const W = this.game.canvas.width;
    const y = this.paper.y + this.paper.h + 44;

    ctx.save();
    ctx.globalAlpha = Math.min(1, this.milestoneToastTimer * 2);
    ctx.fillStyle = "rgba(16, 36, 10, 0.88)";
    ctx.fillRect(W / 2 - 210, y, 420, 40);
    ctx.strokeStyle = "rgba(198,255,132,0.9)";
    ctx.lineWidth = 2;
    ctx.strokeRect(W / 2 - 210, y, 420, 40);
    ctx.textAlign = "center";
    ctx.font = "22px Arial";
    ctx.fillStyle = "#d9ff9b";
    ctx.fillText(this.milestoneToast, W / 2, y + 22);
    ctx.restore();
  }

  _drawIntro(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    const w = Math.min(700, W * 0.88);
    const h = 250;
    const x = (W - w) / 2;
    const y = (H - h) / 2;

    ctx.fillStyle = "rgba(0,0,0,0.72)";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "#ffe082";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffe082";
    ctx.font = "24px Arial";
    ctx.fillText("Modo detective", W / 2, y + 18);

    ctx.fillStyle = "#ffffff";
    ctx.font = "18px Arial";
    const lines = [
      "Ves una división larga como en el cuaderno.",
      "Pero hay UN número que no cuadra.",
      "Haz clic en el número incorrecto.",      
      "Suma el mayor puntaje posible mientras dure la canción.",
      "Cada error quita 1 corazón. Cada 3 aciertos seguidos ganas 1.",
      "",
      "ENTER / ESPACIO / clic para comenzar.",
    ];
    let yy = y + 60;
    for (const L of lines) {
      ctx.fillText(L, W / 2, yy);
      yy += 24;
    }
  }

  _drawEnd(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    // oscurecer un poco el papel
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(this.paper.x, this.paper.y, this.paper.w, this.paper.h);
    ctx.restore();

    ctx.save();
    ctx.textAlign = "center";

    ctx.font = "34px Arial";
    ctx.fillStyle = this.win ? "#a5ff7b" : "#ffaaaa";
    ctx.fillText(this.win ? "¡Caso cerrado!" : "Fin del caso", W / 2, H * 0.42);

    ctx.font = "22px Arial";
    ctx.fillStyle = "#ffe082";
    ctx.fillText(`Puntaje: ${this.score} / ${this.scoreGoal}`, W / 2, H * 0.42 + 48);

    ctx.font = "18px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`Mejor racha: x${this.bestStreak} | Corazones finales: ${this.lives}`, W / 2, H * 0.42 + 76);

    ctx.font = "20px Arial";
    ctx.fillStyle = "#ffe082";
    ctx.fillText(`Hojas ganadas: ${this.sheetsReward || 0}`, W / 2, H * 0.42 + 104);

    ctx.font = "18px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("ENTER / ESPACIO / clic para volver.", W / 2, H * 0.42 + 132);

    ctx.restore();
  }

  _wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = String(text || "").split(" ");
    let line = "";
    let yy = y;

    for (let i = 0; i < words.length; i++) {
      const test = line + words[i] + " ";
      if (ctx.measureText(test).width > maxWidth && i > 0) {
        ctx.fillText(line, x, yy);
        line = words[i] + " ";
        yy += lineHeight;
      } else line = test;
    }
    ctx.fillText(line, x, yy);
  }

  // =======================
  // Generación del caso
  // =======================

  _buildCase() {
    const randInt = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    let lastCaseData = null;

    for (let caseTry = 0; caseTry < 30; caseTry++) {
      // --------- Config por dificultad ---------
      const cfg = this._getDifficultyConfig
        ? this._getDifficultyConfig(this.difficultyStage || 1)
        : null;

      // --------- Elegir divisor ---------
      let divisor;
      if (cfg && cfg.divisors) {
        divisor = pick(cfg.divisors);
      } else if (cfg && cfg.divisor2Digits) {
        divisor = randInt(cfg.divisorMin ?? 10, cfg.divisorMax ?? 99);
      } else {
        // fallback: 2..9
        divisor = randInt(2, 9);
      }

      // --------- Elegir dividend ---------
      let digits = cfg?.dividendDigits ?? 2;
      let min = Math.pow(10, digits - 1);
      let max = Math.pow(10, digits) - 1;

      let dividend;
      let correct;

      // Intentamos evitar casos demasiado “tontos”:
      // - que el cociente sea 0
      // - que casi todo sean ceros por arrastre
      // - que el divisor sea mayor que el dividendo (no es malo, pero para ronda 1-2 puede confundir)
      for (let tries = 0; tries < 200; tries++) {
        dividend = randInt(min, max);

        // evita divisor > dividend al inicio para no romper ritmo
        if ((this.difficultyStage || 1) <= 2 && dividend < divisor) continue;

        correct = this._longDivisionSteps(dividend, divisor); // ENTERO, sin decimales
        const q = parseInt(correct.quotientText, 10);

        // filtra cociente 0 (demasiado trivial)
        if (q === 0) continue;

        // filtra casos donde casi todos los qd son 0 (se ven raros en cuaderno)
        const nonZeroQd = correct.steps.reduce(
          (acc, s) => acc + (s.qd !== 0 ? 1 : 0),
          0,
        );
        if ((this.difficultyStage || 1) <= 2 && nonZeroQd < 1) continue;

        break;
      }

      // --------- Construir grid (tokens + líneas + clickableRows) ---------
      const built = this._buildGridFromDivision(dividend, divisor, correct);

      // NUEVO: meter error
      const corrupted = this._introduceSingleErrorSmartGrid(built);

      lastCaseData = {
        dividend,
        divisor,
        quotientText: correct.quotientText,
        cell: built.cell,
        colBar: built.colBar,
        col0: built.col0,
        colRight: built.colRight,
        row0: built.row0,
        gridTokens: corrupted.gridTokens,
        gridLines: built.gridLines,
        clickableRows: built.clickableRows,
        impostorRow: corrupted.impostorRow,
        impostorMeta: corrupted.impostorMeta,
      };

      if (corrupted.impostorRow != null) {
        this.caseData = lastCaseData;
        this.caseStartElapsed = this._elapsedTime();
        this.selectedCell = null;
        this.postIt = null;
        this.message = `Dificultad ${this.difficultyStage}: Encuentra el número incorrecto.`;
        return;
      }
    }

    // Fallback extra para no romper el flujo.
    if (!lastCaseData) return;
    this.caseData = lastCaseData;
    this.caseStartElapsed = this._elapsedTime();
    this.selectedCell = null;
    this.postIt = null;
    this.message = `Dificultad ${this.difficultyStage}: Encuentra el número incorrecto.`;
  }

  _introduceSingleErrorSmartGrid(built) {
    // Clonar tokens (no mutar el original)
    const tokens = built.tokens.map((t) => ({ ...t }));
    const clickableRows = built.clickableRows || [];

    // Elegimos al azar una fila clicable que tenga dígitos para mutar
    const shuffled = clickableRows
      .map((r) => ({ ...r, _k: Math.random() }))
      .sort((a, b) => a._k - b._k);

    for (const pickRow of shuffled) {
      const row = pickRow.row;

      // Tokens en esa fila que sean dígitos 0-9
      const idxs = [];
      for (let i = 0; i < tokens.length; i++) {
        const ch = tokens[i].ch;
        if (tokens[i].row === row && ch >= "0" && ch <= "9") idxs.push(i);
      }
      if (!idxs.length) continue;

      // Elegir un dígito “no trivial” si se puede (evita cambiar ceros sueltos)
      let iTok = idxs[Math.floor(Math.random() * idxs.length)];
      if (idxs.length >= 2) {
        const nonZero = idxs.filter((i) => tokens[i].ch !== "0");
        if (nonZero.length)
          iTok = nonZero[Math.floor(Math.random() * nonZero.length)];
      }

      const oldD = tokens[iTok].ch.charCodeAt(0) - 48;

      // Cambiar a otro dígito (preferir +/-1 para que sea “creíble”)
      const candidates = [];
      if (oldD > 0) candidates.push(oldD - 1);
      if (oldD < 9) candidates.push(oldD + 1);
      // respaldo: cualquier otro distinto
      for (let d = 0; d <= 9; d++) if (d !== oldD) candidates.push(d);

      const newD = candidates[Math.floor(Math.random() * candidates.length)];
      tokens[iTok].ch = String(newD);

      return {
        gridTokens: tokens,
        impostorRow: row,
        impostorMeta: {
          stepIndex: pickRow.stepIndex,
          row,
          col: tokens[iTok].col,
          tokenIndex: iTok,
          oldDigit: oldD,
          newDigit: newD,
        },
      };
    }

    // Si por alguna razón no encontró fila con dígitos, no rompe el juego:
    return {
      gridTokens: tokens,
      impostorRow: null,
      impostorMeta: null,
    };
  }

  _getDifficultyConfig(stage) {
    if (stage <= 1) return { divisors: [2, 3, 4, 5], dividendDigits: 2 };
    if (stage === 2) return { divisors: [3, 4, 5, 6, 7, 8, 9], dividendDigits: 2 };
    if (stage === 3) return { divisors: [2, 3, 4, 5, 6, 7, 8, 9], dividendDigits: 3 };
    if (stage === 4)
      return {
        divisor2Digits: true,
        dividendDigits: 3,
        divisorMin: 10,
        divisorMax: 25,
      };
    if (stage === 5)
      return {
        divisor2Digits: true,
        dividendDigits: 4,
        divisorMin: 12,
        divisorMax: 60,
      };
    return {
      divisor2Digits: true,
      dividendDigits: 4,
      divisorMin: 18,
      divisorMax: 99,
    };
  }

  _buildGridFromDivision(dividend, divisor, correct) {
    const roundNum = this.difficultyStage || 1;
    let cell = 34;
    if (roundNum === 3) cell = 32;
    if (roundNum === 4) cell = 30;
    if (roundNum >= 5) cell = 28;

    const tokens = [];
    const gridLines = [];

    const dividendStr = String(dividend);
    const divisorStr = String(divisor);
    const digits = dividendStr.split("").map(Number);
    const steps = correct.steps;

    const colBar = 6;
    const col0 = colBar + 1;
    const row0 = 2;
    const rowQ = row0 - 1;

    const colRightDividend = col0 + dividendStr.length - 1;

    this._putNumber(tokens, divisorStr, colBar - 1, row0);
    this._putNumber(tokens, dividendStr, colRightDividend, row0);

    gridLines.push({ kind: "vline", col: colBar, row1: row0, row2: row0 });
    gridLines.push({
      kind: "hline",
      col1: colBar,
      col2: colRightDividend + 2,
      row: row0 - 1,
    });

    let firstUseful = 0;
    while (
      firstUseful < steps.length - 1 &&
      steps[firstUseful].qd === 0 &&
      steps[firstUseful].current < divisor
    ) {
      firstUseful++;
    }

    const qDigits = String(correct.quotientText).split("");
    const qStartCol = col0 + firstUseful;
    for (let i = 0; i < qDigits.length; i++) {
      tokens.push({ ch: qDigits[i], col: qStartCol + i, row: rowQ });
    }

    // ✅ ESTA es la variable que debe ir avanzando
    let row = row0 + 1;

    for (let i = firstUseful; i < steps.length; i++) {
      const s = steps[i];

      const currentRightCol = col0 + i;

      const prodStr = String(s.prod);
      const prodRight = currentRightCol;
      const prodLeft = prodRight - prodStr.length + 1;

      this._putMinusNumber(tokens, prodStr, prodRight, row);
      this._addHLine(gridLines, prodLeft - 1, prodRight, row);

      const isLast = i === steps.length - 1;
      const nextCurrent = isLast ? s.rem : s.rem * 10 + digits[i + 1];
      const nextStr = String(nextCurrent);

      const nextRight = isLast ? currentRightCol : col0 + i + 1;
      this._putNumber(tokens, nextStr, nextRight, row + 1);

      row += 2;
    }

    const clickableRows = [];
    row = row0 + 1;
    for (let i = firstUseful; i < steps.length; i++) {
      clickableRows.push({ stepIndex: i, row });
      clickableRows.push({ stepIndex: i, row: row + 1 });
      row += 2;
    }

    return {
      cell,
      colBar,
      col0,
      colRight: colRightDividend,
      row0,
      tokens,
      gridLines,
      clickableRows,
    };
  }

  _longDivisionSteps(dividend, divisor) {
    const digits = String(dividend).split("").map(Number);

    let current = 0;
    const steps = [];
    const q = [];

    for (let i = 0; i < digits.length; i++) {
      current = current * 10 + digits[i];

      const qd = Math.floor(current / divisor);
      const prod = qd * divisor;
      const rem = current - prod;

      steps.push({
        current,
        qd,
        prod,
        rem,
      });

      q.push(qd);
      current = rem;
    }

    // cociente entero (sin decimales)
    const quotientText = String(parseInt(q.join(""), 10));

    return { steps, quotientText };
  }

  _formatLongDivisionLines(correct, dividend, divisor) {
    const steps = correct.steps;
    const lines = [];

    // Columna base: alineamos todo a la derecha del dividendo
    const baseLen = String(dividend).length + 1;

    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];

      const prodStr = String(s.prod);
      const remStr = String(s.rem);

      const prodCol = baseLen - prodStr.length;
      const remCol = baseLen - remStr.length;

      // Renglón de resta
      lines.push({
        kind: "prod",
        text: prodStr,
        isMinus: true,
        underline: false,
        col: prodCol,
      });

      // Línea horizontal
      lines.push({
        kind: "line",
        text: "",
        isMinus: false,
        underline: true,
        col: prodCol,
      });

      // Residuo
      lines.push({
        kind: "rem",
        text: remStr,
        isMinus: false,
        underline: false,
        col: remCol,
      });
    }

    return { quotientText: correct.quotientText, lines };
  }

  _formatAsNotebook(correct, dividend, divisor) {
    // Convertimos steps en renglones “como cuaderno”:
    // producto (con -), línea, baja, etc.
    // Simplificación: por cada paso, mostramos:
    //   - prod (con -)
    //   - rem (como resultado de resta) con underline
    //
    // Para que se parezca más a tu foto, hacemos un flujo lineal de renglones.

    const lines = [];
    const steps = correct.steps;

    // Ojo: primer "current" puede ser menor que divisor en divisiones reales,
    // pero aquí ya lo resolvemos igual.

    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];
      // producto a restar
      lines.push({
        kind: "prod",
        text: String(s.prod),
        isMinus: true,
        underline: false,
        xOffset: 0,
      });

      // resultado (remanente) con línea
      lines.push({
        kind: "rem",
        text: String(s.rem),
        isMinus: false,
        underline: true,
        xOffset: 0,
      });

      // En tu foto aparece el “bajado” implícito; aquí lo omitimos como línea separada
      // para que el jugador no tenga demasiados renglones.
      // Si luego quieres, agregamos kind:"bringdown".
    }

    return { quotientText: correct.quotientText, lines };
  }

  _putNumber(tokens, numStr, colRight, row) {
    const s = String(numStr);
    for (let i = 0; i < s.length; i++) {
      tokens.push({ ch: s[s.length - 1 - i], col: colRight - i, row });
    }
  }

  _putMinusNumber(tokens, numStr, colRight, row) {
    const s = String(numStr);
    const len = s.length;

    for (let i = 0; i < len; i++) {
      tokens.push({ ch: s[len - 1 - i], col: colRight - i, row });
    }

    tokens.push({ ch: "-", col: colRight - len, row, _tightMinus: true });
  }

  _addHLine(lines, col1, col2, row) {
    lines.push({ kind: "hline", col1, col2, row });
  }

  _drawGridDivision(ctx) {
    const cell = this.caseData.cell || 30;
    const gx = this.paper.x + 120;
    const gy = this.paper.y + 80;

    const baseline = Math.round(cell * 0.78);
    const padX = Math.round(cell * 0.22);

    // líneas (uniones)
    ctx.save();
    // --- clickable rects por celda numérica (para update) ---
    this.caseData.clickableCells = [];
    const clickableRows = new Set(
      (this.caseData.clickableRows || []).map((r) => r.row),
    );

    for (const t of this.caseData.gridTokens || []) {
      if (!clickableRows.has(t.row)) continue;
      if (!(t.ch >= "0" && t.ch <= "9")) continue;

      const cx = gx + t.col * cell;
      const cy = gy + t.row * cell;
      this.caseData.clickableCells.push({
        row: t.row,
        col: t.col,
        x: cx,
        y: cy,
        w: cell,
        h: cell,
      });

      if (
        this.selectedCell &&
        this.selectedCell.row === t.row &&
        this.selectedCell.col === t.col &&
        this.state === "playing"
      ) {
        ctx.save();
        ctx.fillStyle = "rgba(255, 200, 0, 0.22)";
        ctx.fillRect(cx + 2, cy + 2, cell - 4, cell - 4);
        ctx.restore();
      }
    }

    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 3;

    for (const L of this.caseData.gridLines) {
      if (L.kind === "hline") {
        const x1 = gx + L.col1 * cell;
        const x2 = gx + (L.col2 + 1) * cell;
        const y = gy + (L.row + 1) * cell; // unión inferior del row
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y);
        ctx.stroke();
      } else if (L.kind === "vline") {
        const x = gx + L.col * cell; // unión vertical exacta
        const y1 = gy + L.row1 * cell;
        const y2 = gy + (L.row2 + 1) * cell;
        ctx.beginPath();
        ctx.moveTo(x, y1);
        ctx.lineTo(x, y2);
        ctx.stroke();
      }
    }

    // caracteres
    ctx.fillStyle = "#1a1a1a";
    ctx.font = `${Math.round(cell * 0.75)}px monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    for (const t of this.caseData.gridTokens) {
      const extra = t._tightMinus ? Math.round(cell * 0.35) : 0;
      const x = gx + t.col * cell + padX + extra;
      const y = gy + t.row * cell + baseline;
      ctx.fillText(t.ch, x, y);
    }

    this._drawPostIt(ctx);

    ctx.restore();
  }

  _drawPostIt(ctx) {
    const p = this.postIt;
    if (!p) return;

    ctx.save();
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;
    ctx.translate(cx, cy);
    ctx.rotate(p.angle || 0);
    ctx.translate(-cx, -cy);

    ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
    ctx.fillRect(p.x + 2, p.y + 3, p.w, p.h);

    ctx.fillStyle = "#ffe77f";
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.strokeStyle = "#d9b850";
    ctx.lineWidth = 1.4;
    ctx.strokeRect(p.x, p.y, p.w, p.h);

    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fillRect(p.x + 2, p.y + 2, p.w - 4, 5);

    ctx.fillStyle = "#6f5a1f";
    ctx.font = `${Math.max(10, Math.floor(p.h * 0.35))}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("POST-IT", p.x + p.w / 2, p.y + p.h / 2);

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
      y + s / 4,
    );
    ctx.bezierCurveTo(x + s / 2, y, x, y, x, y + s / 4);
    ctx.fill();
  }

  _drawHUD(ctx) {
    const W = this.game.canvas.width;
    ctx.save();
    ctx.textBaseline = "top";

    const barX = this.paper.x;
    const barY = 68;
    const barW = this.paper.w;
    const barH = 40;
    ctx.fillStyle = "rgba(8,16,32,0.74)";
    ctx.fillRect(barX, barY, barW, barH);
    ctx.strokeStyle = "rgba(163,201,255,0.35)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(barX, barY, barW, barH);

    const gap = 10;
    const cardW = (barW - gap * 5) / 4;
    const cardY = barY + 4;
    const cardH = barH - 8;
    const cardX = (i) => barX + gap + i * (cardW + gap);
    const drawCard = (i, label, value, valueColor = "#ffffff") => {
      const x = cardX(i);
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      ctx.fillRect(x, cardY, cardW, cardH);
      ctx.fillStyle = "#9cc5ff";
      ctx.font = "11px Arial";
      ctx.textAlign = "left";
      ctx.fillText(label, x + 8, cardY + 4);
      ctx.fillStyle = valueColor;
      ctx.font = "15px Arial";
      ctx.fillText(value, x + 8, cardY + 17);
    };

    drawCard(
      0,
      "TIEMPO",
      this._formatClock(this.timeLeft),
      this.timeLeft <= 12 ? "#ff8a80" : "#c8e6c9",
    );
    drawCard(1, "PUNTAJE", `${this.score} / ${this.scoreGoal}`, "#ffe082");
    drawCard(2, "RACHA", `x${this.correctStreak}  (max x${this.bestStreak})`, "#b2ebf2");
    drawCard(3, "NIVEL", `${this.difficultyStage}`, "#ffd59e");

    // Corazones en fila compacta bajo la barra
    const hx = barX + 6;
    const hy = barY + barH + 4;
    ctx.fillStyle = "#ffffff";
    ctx.font = "14px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Corazones", hx, hy);
    const s = 13;
    const shown = Math.min(this.lives, 12);
    for (let i = 0; i < shown; i++) {
      const x = hx + 78 + i * (s + 3);
      ctx.fillStyle = "#ff4b5c";
      this._drawHeart(ctx, x, hy + 1, s);
    }
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`x${this.lives}`, hx + 78 + shown * (s + 3) + 8, hy);

    // Feedback arriba del papel (centrado)
    if (this.feedback) {
      ctx.textAlign = "center";
      ctx.fillStyle = this.feedbackColor || "#ffef9f";
      ctx.font = "18px Arial";
      ctx.fillText(this.feedback, W / 2, this.paper.y + this.paper.h + 20);
    }

    ctx.restore();
  }

  _pointsForCorrect(solveTime = this.timeToSolveMax) {
    const base = 85;
    const diffBonus = this.difficultyStage * 24;
    const streakBonus = Math.min(this.correctStreak - 1, 12) * 10;
    const speedBonus = Math.floor(
      Math.max(0, (this.timeToSolveMax || 10) - solveTime) * 20,
    );
    return {
      base,
      diffBonus,
      streakBonus,
      speedBonus,
      total: base + diffBonus + streakBonus + speedBonus,
    };
  }

  _formatClock(timeSec) {
    const t = Math.max(0, Math.ceil(timeSec));
    const mm = Math.floor(t / 60);
    const ss = t % 60;
    return `${mm}:${String(ss).padStart(2, "0")}`;
  }

  _drawStreakVisualizer(ctx) {
    if (this.state !== "playing" && this.state !== "between") return;

    const streak = this.correctStreak;
    const tier = streak >= 6 ? 3 : streak >= 4 ? 2 : streak >= 2 ? 1 : 0;
    const energy = Math.min(1, 0.12 + streak * 0.14);

    const px = this.paper.x;
    const py = this.paper.y;
    const pw = this.paper.w;
    const ph = this.paper.h;

    const sideGlow = 0.08 + energy * 0.22;
    const topGlow = 0.12 + energy * 0.28;
    const bars = 24 + tier * 10;
    const barW = Math.max(4, Math.floor((pw - 16) / bars) - 1);

    ctx.save();

    // Franja superior "winamp" más visible
    const stripY = py - 28;
    const stripH = 24;
    for (let i = 0; i < bars; i++) {
      const bx = px + 8 + i * ((pw - 16) / bars);
      const mix =
        Math.sin(this.visualizerPhase * (1.1 + tier * 0.15) + i * 0.42) * 0.55 +
        Math.sin(this.visualizerPhase * 0.7 + i * 0.21) * 0.45;
      const amp = (mix * 0.5 + 0.5) * (stripH - 2) * (0.25 + energy * 0.9);
      const bh = Math.max(2, amp);
      const by = stripY + stripH - bh;
      const a = 0.28 + energy * 0.55;
      const c1 = 90 + Math.floor(80 * energy);
      const c2 = 170 + Math.floor(70 * energy);
      ctx.fillStyle = `rgba(${c1}, ${c2}, 255, ${a})`;
      ctx.fillRect(bx, by, barW, bh);
    }

    // Segunda franja inferior para que el ambiente envuelva el papel
    const lowBars = 14 + tier * 6;
    const lowW = Math.max(8, Math.floor((pw - 40) / lowBars) - 2);
    const lowY = py + ph + 5;
    for (let i = 0; i < lowBars; i++) {
      const bx = px + 20 + i * ((pw - 40) / lowBars);
      const wave = Math.sin(this.visualizerPhase * 1.4 + i * 0.7) * 0.5 + 0.5;
      const bh = 2 + wave * (5 + tier * 3);
      ctx.fillStyle = `rgba(120, 220, 255, ${0.12 + energy * 0.24})`;
      ctx.fillRect(bx, lowY, lowW, bh);
    }

    // Glow lateral más protagonista
    ctx.fillStyle = `rgba(70, 170, 255, ${sideGlow})`;
    ctx.fillRect(px - 18, py - 4, 16, ph + 8);
    ctx.fillRect(px + pw + 2, py - 4, 16, ph + 8);
    ctx.fillStyle = `rgba(80, 190, 255, ${topGlow})`;
    ctx.fillRect(px - 12, py - 16, pw + 24, 12);

    // Capa extra al subir racha
    if (tier >= 2) {
      const pulseA = 0.12 + energy * 0.18;
      for (let i = 0; i < 12 + tier * 4; i++) {
        const t = this.visualizerPhase * (0.8 + i * 0.03);
        const cx = px + (i / (7 + tier * 2)) * pw;
        const cy = py - 12 - Math.abs(Math.sin(t)) * (4 + tier * 2);
        const r = 2 + Math.abs(Math.sin(t + i)) * (1 + tier);
        ctx.fillStyle = `rgba(160, 230, 255, ${pulseA})`;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (tier >= 3) {
      ctx.strokeStyle = "rgba(170, 240, 255, 0.35)";
      ctx.lineWidth = 3;
      ctx.strokeRect(px - 8, py - 10, pw + 16, ph + 20);
    }

    ctx.restore();
  }
}

window.ArmoniaScene = ArmoniaScene;
