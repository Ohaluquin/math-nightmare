// js/areas/geometria/niveles/angulosScene.js
// ===========================================================
// AngulosScene - "Ángulos Básicos"
// 3 problemas por corrida (sin ecuaciones):
//  1) Relaciones de ángulos (complementarios/suplementarios/opuestos por el vértice)
//  2) Otra relación de ángulos (distinta a la primera)
//  3) Triángulo: dados 2 ángulos, hallar el tercero
//
// Respuesta: escribir valor numérico y enviar con ENTER.
// Estructura/UI alineada con AngulosEcuacionesScene.
// ===========================================================

class AngulosScene extends Scene {
  constructor(game, options = {}) {
    super(game);

    // ----------------- Estado general -----------------
    this.state = "intro"; // "intro" | "sailing" | "playing" | "revealing" | "finished"
    this.gameFinished = false;
    this.exitDelay = 0;
    this.win = false;
    this.message = "";
    this.sheetsReward = 0;
    this.finishHoldDuration = options.finishHoldDuration ?? 4;

    // ----------------- Config -----------------
    this.options = options;
    this.maxErrors = options.maxErrors ?? 2;
    this.errors = 0;

    // ----------------- Progreso -----------------
    this.problemIndex = 0; // 0..2
    this.totalProblems = 6;
    this.problems = [];

    // ----------------- Problema actual -----------------
    this.current = null;
    this.answerInput = "";
    this.answerFeedback = "";
    this.showGuideTips = false;
    this.guideTipConsumed = false;
    this._guideToggleRect = null;
    this.questionTimeLimit = options.questionTimeLimit ?? 60;
    this.questionTimeLeft = this.questionTimeLimit;
    this.rewardSheetOpened = false;

    // ----------------- Capa narrativa -----------------
    this.travelTimer = 0;
    this.travelDuration = 1.8;
    this.travelMessage = "";
    this.revealTimer = 0;
    this.revealDuration = 2.2;
    this.islandReveal = 0;
    this.oceanOffset = 0;
    this.boatBobTime = 0;
    this.shakeTime = 0;
    this.shakeDuration = 0.42;
    this.shakeIntensity = 12;

    // ----------------- Input edge tracking -----------------
    this._prevKeys = {
      Enter: false,
      " ": false,
      Backspace: false,
      "0": false,
      "1": false,
      "2": false,
      "3": false,
      "4": false,
      "5": false,
      "6": false,
      "7": false,
      "8": false,
      "9": false,
      Numpad0: false,
      Numpad1: false,
      Numpad2: false,
      Numpad3: false,
      Numpad4: false,
      Numpad5: false,
      Numpad6: false,
      Numpad7: false,
      Numpad8: false,
      Numpad9: false,
      Escape: false,
    };
    this._prevMouseDown = false;

    // ----------------- Sonidos -----------------
    this.sfxCorrect = options.sfxCorrect ?? "sfx_match";
    this.sfxWrong = options.sfxWrong ?? "sfx_error";
    this.sfxCrash = options.sfxCrash ?? "sfx_choque";
    this.sfxWin = options.sfxWin ?? "sfx_win";
    this.sfxLose = options.sfxLose ?? "sfx_rugido";
    this.sfxPage = options.sfxPage ?? "sfx_change_page";
  }

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
    window.MN_setLeafHUDVisible?.(false);
    window.MN_setInputMode?.("mouse");

    this.state = "intro";
    this.gameFinished = false;
    this.exitDelay = 0;
    this.win = false;
    this.message = "";
    this.sheetsReward = 0;

    this.errors = 0;
    this.problemIndex = 0;

    this.problems = this._buildRunProblems();
    this._setCurrentProblem(0);

    this._prevMouseDown = false;
    for (const k of Object.keys(this._prevKeys)) this._prevKeys[k] = false;

    this.answerInput = "";
    this.answerFeedback = "";
    this.showGuideTips = false;
    this.guideTipConsumed = false;
    this._guideToggleRect = null;
    this.travelTimer = 0;
    this.travelMessage = "";
    this.revealTimer = 0;
    this.islandReveal = 0;
    this.oceanOffset = 0;
    this.boatBobTime = 0;
    this.shakeTime = 0;
    this.rewardSheetOpened = false;
  }

  destroy() {
    this.clearAll?.();
  }

  // =======================================================
  // UPDATE
  // =======================================================
  update(dt) {
    super.update(dt);

    this.oceanOffset += dt;
    this.boatBobTime += dt;
    if (this.shakeTime > 0) this.shakeTime = Math.max(0, this.shakeTime - dt);

    const input = this.game.input;
    const keys = input.keys || {};
    const isDown = (key) => !!keys[key];
    const isJustPressed = (key) => isDown(key) && !this._prevKeys[key];

    const commitKeys = () => {
      for (const k of Object.keys(this._prevKeys)) this._prevKeys[k] = isDown(k);
    };

    if (this.gameFinished) {
      if (this.exitDelay > 0) {
        this.exitDelay -= dt;
        commitKeys();
        return;
      }
      this._completeExitFlow();
      commitKeys();
      return;
    }

    if (this.state === "intro") {
      const mouse = input.mouse || { down: false };
      const mouseJustPressed = mouse.down && !this._prevMouseDown;
      this._prevMouseDown = mouse.down;

      if (isJustPressed("Enter") || isJustPressed(" ") || mouseJustPressed) {
        this._beginTravel("Sigues el mapa y ajustas el rumbo del barco...");
        this.playSfx(this.sfxPage, { volume: 0.5 });
      }
      commitKeys();
      return;
    }

    if (this.state === "sailing") {
      this.travelTimer -= dt;
      if (this.travelTimer <= 0) {
        this.state = "playing";
        this.travelMessage = "";
      }
      commitKeys();
      return;
    }

    if (this.state === "revealing") {
      this.revealTimer = Math.max(0, this.revealTimer - dt);
      const progress = 1 - this.revealTimer / this.revealDuration;
      this.islandReveal = Math.max(this.islandReveal, Math.min(1, progress));
      if (this.revealTimer <= 0) {
        this._finishGame(false);
      }
      commitKeys();
      return;
    }

    if (isJustPressed("Escape")) {
      window.MN_APP?.toOverworld?.();
      commitKeys();
      return;
    }

    if (this.state === "playing") {
      this.questionTimeLeft = Math.max(0, this.questionTimeLeft - dt);
      if (this.questionTimeLeft <= 0) {
        this._registerMistake("El tiempo se agoto. Corrige el rumbo.");
        commitKeys();
        return;
      }
      this._updatePlaying(input, isJustPressed);
    }

    commitKeys();
  }

  _updatePlaying(input, isJustPressed) {
    const mouse = input.mouse || { down: false, x: 0, y: 0 };
    const mouseJustPressed = mouse.down && !this._prevMouseDown;

    if (
      !this.guideTipConsumed &&
      mouseJustPressed &&
      this._isPointInRect(mouse.x, mouse.y, this._guideToggleRect)
    ) {
      this.guideTipConsumed = true;
      this.showGuideTips = true;
      this._guideToggleRect = null;
    }

    for (let d = 0; d <= 9; d++) {
      if (isJustPressed(String(d)) || isJustPressed(`Numpad${d}`)) {
        this._appendDigit(String(d));
      }
    }

    if (isJustPressed("Backspace")) {
      this.answerInput = this.answerInput.slice(0, -1);
      this.answerFeedback = "";
    }

    if (isJustPressed("Enter")) {
      this._submitAnswer();
    }

    this._prevMouseDown = mouse.down;
  }

  _appendDigit(d) {
    if (this.answerInput.length >= 3) return;
    if (this.answerInput === "0") this.answerInput = d;
    else this.answerInput += d;
    this.answerFeedback = "";
  }

  _submitAnswer() {
    if (!this.current) return;
    if (!this.answerInput.trim()) {
      this.answerFeedback = "Escribe un valor para x.";
      return;
    }

    const chosen = Number.parseInt(this.answerInput, 10);
    if (!Number.isFinite(chosen)) {
      this.answerFeedback = "Valor inválido.";
      return;
    }

    const correct = this.current?.answerValue;

    if (chosen === correct) {
      this.playSfx(this.sfxCorrect, { volume: 0.6 });

      if (this.problemIndex + 1 >= this.totalProblems) {
        this.state = "revealing";
        this.revealTimer = this.revealDuration;
        this.islandReveal = 0.08;
        this.answerFeedback = "";
        this.playSfx(this.sfxWin, { volume: 0.65 });
      } else {
        this.problemIndex++;
        this._setCurrentProblem(this.problemIndex);
        this._beginTravel(`Navegas hacia el siguiente punto del mapa (${this.problemIndex + 1}/${this.totalProblems}).`);
      }
      return;
    }

    this._registerMistake("El barco roza unas rocas. Corrige el rumbo.");
  }

  // =======================================================
  // LÓGICA: problemas
  // =======================================================
  _buildRunProblems() {
    const relationKinds = this._shuffle(["complementary", "supplementary", "vertical_opposite"]);

    return [
      this._genRelationProblem(relationKinds[0]),
      this._genRelationProblem(relationKinds[1]),
      this._genRelationProblem(relationKinds[2]),
      this._genTriangleThirdProblem(),
      this._genTriangleThirdProblem(),
      this._genTriangleThirdProblem(),
    ];
  }

  _setCurrentProblem(index) {
    this.current = this.problems[index] || null;
    this.answerInput = "";
    this.answerFeedback = "";
    this.showGuideTips = false;
    this._guideToggleRect = null;
    this.questionTimeLeft = this.questionTimeLimit;
  }

  _registerMistake(message) {
    this.errors++;
    this.playSfx(this.sfxCrash, { volume: 0.72 });
    this.shakeTime = this.shakeDuration;
    this.answerInput = "";
    this.answerFeedback = message;

    if (this.errors >= this.maxErrors) {
      this._finishGame(true);
      return;
    }

    this.questionTimeLeft = this.questionTimeLimit;
  }

  _genRelationProblem(kind) {
    if (kind === "complementary") {
      const known = this._randInt(18, 72);
      return {
        type: "relation",
        relation: "complementary",
        prompt: "El mapa marca un cambio de rumbo. Observa la figura y halla x.",
        guideTip: "Si el giro total es recto, los ángulos complementarios suman 90°.",
        knownAngle: known,
        answerValue: 90 - known,
      };
    }

    if (kind === "supplementary") {
      const known = this._randInt(35, 145);
      return {
        type: "relation",
        relation: "supplementary",
        prompt: "El pergamino indica un viraje sobre una linea recta. Halla x.",
        guideTip: "En un trayecto recto, los ángulos suplementarios suman 180°.",
        knownAngle: known,
        answerValue: 180 - known,
      };
    }

    // vertical_opposite
    const known = this._randInt(35, 145);
    return {
      type: "relation",
      relation: "vertical_opposite",
      prompt: "Dos rutas se cruzan en el mapa. Observa la figura y halla x.",
      guideTip: "Los ángulos opuestos por el vértice siempre miden lo mismo.",
      knownAngle: known,
      answerValue: known,
    };
  }

  _genTriangleThirdProblem() {
    const a = this._randInt(28, 88);
    const bMin = 24;
    const bMax = Math.min(94, 146 - a);
    if (bMin > bMax) return this._genTriangleThirdProblem();

    const b = this._randInt(bMin, bMax);
    const c = 180 - a - b;
    if (c < 24 || c > 118) return this._genTriangleThirdProblem();

    return {
      type: "triangle_third",
      prompt: "El mapa forma un triángulo entre tres puntos. Calcula x.",
      guideTip: "La suma de los ángulos internos de un triángulo es 180°.",
      knownA: a,
      knownB: b,
      answerValue: c,
    };
  }

  // =======================================================
  // FIN DEL JUEGO
  // =======================================================
  _finishGame(failed = false) {
    if (this.gameFinished) return;

    this.gameFinished = true;
    this.state = "finished";
    this.exitDelay = this.finishHoldDuration;
    this.win = !failed;

    const tier = failed ? 0 : 1;
    let gained = 0;
    if (window.MN_reportMinigameTier) {
      gained = window.MN_reportMinigameTier("angulos", tier);
    }
    this.sheetsReward = gained;

    if (failed) this.shakeTime = this.shakeDuration;

    if (this.win) {
      this.message =
        "La isla del tesoro aparecio en el horizonte.\n" +
        "Resolviste los seis dilemas del mapa.\n" +
        `Errores: ${this.errors}/${this.maxErrors}\n` +
        `Hojas ganadas: ${gained}.`;
    } else {
      this.message =
        "El barco se hundio entre las rocas.\n" +
        "No lograste llegar a la isla.\n" +
        `Errores: ${this.errors}/${this.maxErrors}\n` +
        `Hojas ganadas: ${gained}.`;
      this.playSfx(this.sfxLose, { volume: 0.7 });
    }

    this.game?.events?.emit?.("angulos_done", {
      win: this.win,
      tier,
      sheetsReward: gained,
      failed,
    });
  }

  _completeExitFlow() {
    if (this.rewardSheetOpened) return;

    window.MN_setInputMode?.(null);
    window.MN_setLeafHUDVisible?.(true);

    if (this.win && this.sheetsReward > 0 && typeof window.MN_openPendingSheetReward === "function") {
      this.rewardSheetOpened = true;
      window.MN_onSheetModalClosed = () => {
        window.MN_setInputMode?.(null);
        window.MN_setLeafHUDVisible?.(true);
        window.MN_APP?.toOverworld?.();
      };
      window.MN_openPendingSheetReward();
      return;
    }

    this.rewardSheetOpened = true;
    window.MN_APP?.toOverworld?.();
  }

  // =======================================================
  // DRAW
  // =======================================================
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

    this._drawOceanBackground(ctx, W, H);
    this._drawIsland(ctx, W, H);

    if (this.state === "intro") {
      this._drawBoat(ctx, W, H);
      this._drawIntro(ctx);
      ctx.restore();
      return;
    }

    if (this.state === "sailing") {
      this._drawBoat(ctx, W, H);
      this._drawHUD(ctx);
      this._drawTravelOverlay(ctx);
      ctx.restore();
      return;
    }

    if (this.state === "playing" || this.state === "revealing") {
      this._drawBoat(ctx, W, H);
      this._drawHUD(ctx);
      this._drawPergaminoStage(ctx);
      if (this.state === "revealing") this._drawTreasureReveal(ctx);
      ctx.restore();
      return;
    }

    if (this.state === "finished") {
      this._drawBoat(ctx, W, H);
      this._drawHUD(ctx);
      this._drawEndMessage(ctx);
    }
    ctx.restore();
  }

  _drawHUD(ctx) {
    ctx.save();
    ctx.fillStyle = "rgba(8,14,28,0.5)";
    ctx.fillRect(16, 12, 468, 48);

    ctx.strokeStyle = "#7aa7ff";
    ctx.lineWidth = 2;
    ctx.strokeRect(16, 12, 468, 48);

    ctx.font = "16px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    const p = Math.min(this.problemIndex + 1, this.totalProblems);
    ctx.fillText(`Pergamino: ${p}/${this.totalProblems}`, 28, 36);
    const lives = Math.max(0, this.maxErrors - this.errors);
    ctx.fillText("Vidas:", 188, 36);
    for (let i = 0; i < this.maxErrors; i++) {
      ctx.fillStyle = i < lives ? "#ff4d6d" : "rgba(255,255,255,0.25)";
      this._drawHeart(ctx, 250 + i * 20, 27, 13);
    }
    const secondsLeft = Math.max(0, Math.ceil(this.questionTimeLeft));
    ctx.fillStyle = secondsLeft <= 7 ? "#ffd36b" : "#ffffff";
    ctx.fillText(`Tiempo: ${secondsLeft}s`, 320, 36);
    ctx.restore();
  }

  _drawHeart(ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + s / 4);
    ctx.bezierCurveTo(x, y, x - s / 2, y, x - s / 2, y + s / 4);
    ctx.bezierCurveTo(x - s / 2, y + s / 2, x, y + s * 0.8, x, y + s);
    ctx.bezierCurveTo(x, y + s * 0.8, x + s / 2, y + s / 2, x + s / 2, y + s / 4);
    ctx.bezierCurveTo(x + s / 2, y, x, y, x, y + s / 4);
    ctx.fill();
  }
  _drawIntro(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "#ffffff";
    ctx.font = "34px Arial";
    ctx.fillText("Rumbo por angulos", W / 2, H * 0.23);

    ctx.font = "18px Arial";
    ctx.fillStyle = "#d8e6ff";
    ctx.fillText("Eres un aprendiz de navegante pirata en busca del tesoro.", W / 2, H * 0.36);
    ctx.fillText("El mapa te entrega 6 pergaminos con dilemas sobre angulos.", W / 2, H * 0.42);
    ctx.fillText("Resuelvelos para corregir el rumbo del barco y llegar a la isla.", W / 2, H * 0.48);
    ctx.fillText("Solo tienes 2 vidas: si chocas demasiado, el barco se hunde.", W / 2, H * 0.54);
    ctx.fillText("Cada pergamino te da 60 segundos para responder.", W / 2, H * 0.60);

    ctx.fillStyle = "#ffffff";
    ctx.fillText("Pulsa ENTER o ESPACIO para zarpar.", W / 2, H * 0.70);
    ctx.restore();
  }

  _drawOceanBackground(ctx, W, H) {
    const bg = this.game.assets?.getImage?.("bg_angulos_oceano");
    const swell = Math.sin(this.boatBobTime * 1.4) * 10;
    const travelWindow = 6;
    if (bg) {
      const scale = (H / Math.max(1, bg.height)) * 1.06;
      const tileW = bg.width * scale;
      const driftAmplitude = tileW * (this.state === "sailing" ? 0.16 : 0.08);
      const phase = (this.oceanOffset % (travelWindow * 2)) / travelWindow;
      const drift =
        phase < 1
          ? -driftAmplitude + phase * driftAmplitude * 2
          : driftAmplitude - (phase - 1) * driftAmplitude * 2;
      const offset = (((drift % tileW) + tileW) % tileW);
      for (let x = -offset; x < W + tileW; x += tileW) {
        ctx.drawImage(bg, x, -18 + swell, tileW, H + 36);
      }
    } else {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#466b9e");
      g.addColorStop(0.45, "#2c5f88");
      g.addColorStop(1, "#163e5a");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    ctx.fillStyle = "rgba(5,10,18,0.24)";
    ctx.fillRect(0, 0, W, H);
  }

  _drawIsland(ctx, W, H) {
    const show = this.state === "revealing" || (this.state === "finished" && this.win);
    if (!show) return;

    const p = Math.max(0, Math.min(1, this.islandReveal || (this.win ? 1 : 0)));
    const islandImg = this.game.assets?.getImage?.("obj_angulos_isla");
    const cx = W * 0.78;
    const baseY = H * 0.49;

    ctx.save();
    ctx.globalAlpha = 0.22 + p * 0.78;

    if (islandImg) {
      const appearScale = 0.08 + p * 0.92;
      const targetW = 440;
      const targetH = targetW * (islandImg.height / Math.max(1, islandImg.width));
      const drawW = targetW * appearScale;
      const drawH = targetH * appearScale;
      const centerX = cx - targetW * 0.5;
      const centerY = baseY + 10;
      const x = centerX - drawW * 0.5;
      const y = centerY - drawH * 0.5;

      ctx.drawImage(islandImg, x, y, drawW, drawH);
    } else {
      const islandW = 220 + p * 140;
      const islandH = 34 + p * 82;
      const x = cx - islandW / 2;
      const y = baseY - islandH;

      ctx.fillStyle = "#253a23";
      ctx.beginPath();
      ctx.moveTo(x, baseY);
      ctx.quadraticCurveTo(cx - islandW * 0.18, y + islandH * 0.12, cx, y);
      ctx.quadraticCurveTo(cx + islandW * 0.22, y + islandH * 0.2, x + islandW, baseY);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  _drawBoat(ctx, W, H) {
    const boat = this.game.assets?.getImage?.("obj_angulos_barco");
    const bob = Math.sin(this.boatBobTime * 2.1) * 5;
    const tiltAmplitude = this.state === "sailing" ? 0.045 : 0.026;
    const tilt = Math.sin(this.boatBobTime * 1.7) * tiltAmplitude;

    if (boat) {
      const scale = Math.max(W / Math.max(1, boat.width), H / Math.max(1, boat.height));
      const w = boat.width * scale;
      const h = boat.height * scale;
      const x = (W - w) * 0.5;
      const y = H - h + bob + 10;

      ctx.save();
      ctx.globalAlpha = 0.98;
      ctx.translate(x + w * 0.5, y + h * 0.62);
      ctx.rotate(tilt);
      ctx.drawImage(boat, -w * 0.5, -h * 0.62, w, h);
      ctx.restore();

      ctx.save();
      const deckFade = ctx.createLinearGradient(0, H * 0.64, 0, H);
      deckFade.addColorStop(0, "rgba(10,12,18,0)");
      deckFade.addColorStop(1, "rgba(10,12,18,0.18)");
      ctx.fillStyle = deckFade;
      ctx.fillRect(0, H * 0.6, W, H * 0.4);
      ctx.restore();
    } else {
      ctx.save();
      const x = W * 0.18;
      const y = H * 0.68 + bob;
      ctx.translate(x - 10, y + 12);
      ctx.rotate(tilt);
      ctx.fillStyle = "#53371f";
      ctx.beginPath();
      ctx.moveTo(-80, -12);
      ctx.lineTo(80, -12);
      ctx.lineTo(54, 20);
      ctx.lineTo(-52, 20);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  _drawPergaminoStage(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;
    const pw = 760;
    const ph = 520;
    const x = (W - pw) * 0.5;
    const y = 108;

    const parchment = this.game.assets?.getImage?.("ui_angulos_pergamino");
    ctx.save();
    if (parchment) {
      ctx.drawImage(parchment, x, y, pw, ph);
    } else {
      ctx.fillStyle = "rgba(230,210,166,0.93)";
      ctx.fillRect(x, y, pw, ph);
      ctx.strokeStyle = "rgba(92,67,28,0.9)";
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, pw, ph);
    }

    ctx.fillStyle = "rgba(59,37,12,0.2)";
    ctx.fillRect(x + 26, y + 26, pw - 52, ph - 52);
    ctx.restore();

    this._drawPrompt(ctx);
    if (!this.guideTipConsumed) this._drawGuideToggle(ctx);
    if (this.showGuideTips) this._drawGuidePanel(ctx);
    this._drawFigure(ctx);
    this._drawAnswerInput(ctx);
  }

  _drawTravelOverlay(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;
    const boxW = 560;
    const boxH = 110;
    const x = (W - boxW) * 0.5;
    const y = H * 0.16;

    ctx.save();
    ctx.fillStyle = "rgba(7,12,22,0.56)";
    ctx.fillRect(x, y, boxW, boxH);
    ctx.strokeStyle = "rgba(185,220,255,0.4)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, boxW, boxH);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#eef6ff";
    ctx.font = "bold 28px Arial";
    ctx.fillText("Navegando...", W / 2, y + 34);
    ctx.font = "18px Arial";
    ctx.fillStyle = "#d8e6ff";
    this._wrapText(ctx, this.travelMessage, W / 2, y + 58, boxW - 40, 24);
    ctx.restore();
  }

  _drawTreasureReveal(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(7,12,22,0.42)";
    ctx.fillRect(210, 110, W - 420, 72);
    ctx.strokeStyle = "rgba(255,228,140,0.6)";
    ctx.lineWidth = 2;
    ctx.strokeRect(210, 110, W - 420, 72);
    ctx.font = "bold 28px Arial";
    ctx.fillStyle = "#ffe99f";
    ctx.fillText("La isla del tesoro aparece en el horizonte", W / 2, 146);
    ctx.restore();
  }

  _drawPrompt(ctx) {
    const W = this.game.canvas.width;

    ctx.save();
    ctx.textAlign = "center";
    ctx.fillStyle = "#3b2812";
    ctx.font = "bold 23px Arial";
    this._wrapText(ctx, this.current?.prompt || "", W / 2, 150, 620, 28);
    ctx.restore();
  }

  _drawGuideToggle(ctx) {
    const W = this.game.canvas.width;
    const x = W - 224;
    const y = 144;
    const w = 176;
    const h = 36;
    this._guideToggleRect = { x, y, w, h };

    ctx.save();
    ctx.fillStyle = "rgba(90,62,24,0.18)";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "rgba(92,67,28,0.78)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    ctx.font = "16px Arial";
    ctx.fillStyle = "#3d2b17";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.showGuideTips ? "Ocultar tips" : "Mostrar tips", x + w * 0.5, y + h * 0.5);
    ctx.restore();
  }

  _drawGuidePanel(ctx) {
    const tip = this.current?.guideTip;
    if (!tip) return;

    const W = this.game.canvas.width;
    const boxW = 620;
    const x = (W - boxW) * 0.5;
    const y = 214;
    const h = 64;

    ctx.save();
    ctx.fillStyle = "rgba(132,99,48,0.2)";
    ctx.fillRect(x, y, boxW, h);
    ctx.strokeStyle = "rgba(92,67,28,0.66)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, boxW, h);
    ctx.font = "17px Arial";
    ctx.fillStyle = "#3c2810";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    this._wrapText(ctx, tip, x + boxW * 0.5, y + 14, boxW - 24, 22);
    ctx.restore();
  }

  _drawFigure(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;
    const cx = W * 0.5;
    const cy = H * 0.49 + 50;

    const t = this.current?.type;
    if (t === "relation") this._drawRelationFigure(ctx, cx, cy);
    else if (t === "triangle_third") this._drawTriangleThirdFigure(ctx, cx, cy);
  }

  _drawRelationFigure(ctx, cx, cy) {
    const P = this.current;
    if (!P) return;

    if (P.relation === "complementary") {
      this._drawComplementary(ctx, cx, cy, P.knownAngle);
      return;
    }
    if (P.relation === "supplementary") {
      this._drawSupplementary(ctx, cx, cy, P.knownAngle);
      return;
    }
    this._drawVerticalOpposite(ctx, cx, cy, P.knownAngle);
  }

  _drawComplementary(ctx, cx, cy, known) {
    const O = { x: cx - 10, y: cy + 45 };
    const r = 130;
    const aUp = -Math.PI / 2;
    const aRight = 0;
    const aSplit = aUp + (known * Math.PI) / 180;

    // Rayos
    ctx.strokeStyle = "#e6efff";
    ctx.lineWidth = 4;
    this._ray(ctx, O, aUp, r + 40);
    this._ray(ctx, O, aRight, r + 40);
    this._ray(ctx, O, aSplit, r + 24);

    // Ángulos
    this._drawAngleSlice(ctx, O, aUp, aSplit, 62, "hsla(68,88%,65%,0.23)", "hsla(68,92%,72%,0.95)");
    this._drawAngleSlice(ctx, O, aSplit, aRight, 62, "hsla(350,88%,65%,0.23)", "hsla(350,92%,72%,0.95)");

    // Etiquetas
    this._angleLabel(ctx, O, aUp, aSplit, `${known}°`, 94);
    this._angleLabel(ctx, O, aSplit, aRight, "x°", 94);

    // Marcador de 90° anclado a los rayos vertical y horizontal.
    this._drawRightAngleMarker(ctx, O, 16);

    ctx.fillStyle = "#e6efff";
    ctx.beginPath();
    ctx.arc(O.x, O.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawSupplementary(ctx, cx, cy, known) {
    const O = { x: cx, y: cy + 38 };
    const r = 150;
    const aLeft = -Math.PI;
    const aRight = 0;
    const aSplit = aLeft + (known * Math.PI) / 180;

    // Línea recta base
    ctx.strokeStyle = "#e6efff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(O.x - 220, O.y);
    ctx.lineTo(O.x + 220, O.y);
    ctx.stroke();

    // Rayo divisor
    this._ray(ctx, O, aSplit, r);

    // Ángulos
    this._drawAngleSlice(ctx, O, aLeft, aSplit, 66, "hsla(60,88%,65%,0.23)", "hsla(60,92%,72%,0.95)");
    this._drawAngleSlice(ctx, O, aSplit, aRight, 66, "hsla(342,88%,65%,0.23)", "hsla(342,92%,72%,0.95)");

    // Etiquetas
    this._angleLabel(ctx, O, aLeft, aSplit, `${known}°`, 98);
    this._angleLabel(ctx, O, aSplit, aRight, "x°", 98);

    ctx.fillStyle = "#e6efff";
    ctx.beginPath();
    ctx.arc(O.x, O.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawVerticalOpposite(ctx, cx, cy, known) {
    const O = { x: cx, y: cy + 28 };
    const r = 72;

    const acute = known <= 90 ? known : 180 - known;
    const alpha = (acute * Math.PI) / 180;

    // Dos rectas que se cruzan: una horizontal y otra inclinada alpha.
    const lineA = 0;
    const lineB = alpha;
    this._lineThrough(ctx, O, lineA, 220);
    this._lineThrough(ctx, O, lineB, 220);

    // Ángulos opuestos por el vértice (agudos u obtusos según "known").
    if (known <= 90) {
      // Par agudo opuesto.
      this._drawAngleSlice(ctx, O, lineA, lineB, r, "hsla(60,88%,65%,0.23)", "hsla(60,92%,72%,0.95)");
      this._drawAngleSlice(ctx, O, lineA + Math.PI, lineB + Math.PI, r, "hsla(345,88%,65%,0.23)", "hsla(345,92%,72%,0.95)");
      this._angleLabel(ctx, O, lineA, lineB, `${known}°`, 102);
      this._angleLabel(ctx, O, lineA + Math.PI, lineB + Math.PI, "x°", 102);
    } else {
      // Par obtuso opuesto.
      this._drawAngleSlice(ctx, O, lineB, lineA + Math.PI, r, "hsla(60,88%,65%,0.23)", "hsla(60,92%,72%,0.95)");
      this._drawAngleSlice(ctx, O, lineB + Math.PI, lineA + Math.PI * 2, r, "hsla(345,88%,65%,0.23)", "hsla(345,92%,72%,0.95)");
      this._angleLabel(ctx, O, lineB, lineA + Math.PI, `${known}°`, 102);
      this._angleLabel(ctx, O, lineB + Math.PI, lineA + Math.PI * 2, "x°", 102);
    }

    ctx.fillStyle = "#e6efff";
    ctx.beginPath();
    ctx.arc(O.x, O.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawTriangleThirdFigure(ctx, cx, cy) {
    const P = this.current;
    const Adeg = P.answerValue;
    const Bdeg = P.knownA;
    const Cdeg = P.knownB;
    const parchmentTop = 108;
    const minTriangleTop = parchmentTop + 34;

    const toRad = (deg) => (deg * Math.PI) / 180;
    const cross = (u, v) => u.x * v.y - u.y * v.x;

    let A;
    let B;
    let C;
    {
      const baseLen = 300;
      const baseY = cy + 132;
      B = { x: cx - baseLen / 2, y: baseY };
      C = { x: cx + baseLen / 2, y: baseY };

      const dB = { x: Math.cos(toRad(Bdeg)), y: -Math.sin(toRad(Bdeg)) };
      const dC = { x: -Math.cos(toRad(Cdeg)), y: -Math.sin(toRad(Cdeg)) };
      const den = cross(dB, dC);
      if (Math.abs(den) > 1e-6) {
        const CB = { x: C.x - B.x, y: C.y - B.y };
        const tB = cross(CB, dC) / den;
        A = { x: B.x + dB.x * tB, y: B.y + dB.y * tB };
      }
    }

    if (!A || !Number.isFinite(A.x) || !Number.isFinite(A.y)) {
      A = { x: cx, y: cy - 145 };
      B = { x: cx - 170, y: cy + 140 };
      C = { x: cx + 170, y: cy + 140 };
    }

    if (A.y < minTriangleTop) {
      const baseMid = { x: (B.x + C.x) * 0.5, y: (B.y + C.y) * 0.5 };
      const currentHeight = baseMid.y - A.y;
      const allowedHeight = Math.max(24, baseMid.y - minTriangleTop);
      if (currentHeight > allowedHeight && currentHeight > 0) {
        const scale = allowedHeight / currentHeight;
        const scalePoint = (pt) => ({
          x: baseMid.x + (pt.x - baseMid.x) * scale,
          y: baseMid.y + (pt.y - baseMid.y) * scale,
        });
        A = scalePoint(A);
        B = scalePoint(B);
        C = scalePoint(C);
      }
    }

    ctx.strokeStyle = "#e6efff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
    ctx.lineTo(C.x, C.y);
    ctx.closePath();
    ctx.stroke();

    // Etiquetas: A es x°, B y C son conocidas.
    ctx.font = "24px Arial";
    ctx.fillStyle = "#ffe082";
    this._strokeText(ctx, "x°", A.x, A.y + 44);
    this._strokeText(ctx, `${Bdeg}°`, B.x + 48, B.y - 28);
    this._strokeText(ctx, `${Cdeg}°`, C.x - 58, C.y - 28);
  }

  _drawAnswerInput(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;
    const boxW = Math.min(420, W * 0.56);
    const boxH = 58;
    const x = (W - boxW) * 0.5;
    const y = H * 0.77 + 50;

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "#3d2a15";
    ctx.font = "18px Arial";
    ctx.fillText("Escribe el valor de x y pulsa ENTER", W * 0.5, y - 28);

    ctx.fillStyle = "rgba(255,247,223,0.68)";
    ctx.fillRect(x, y, boxW, boxH);
    ctx.strokeStyle = "rgba(92,67,28,0.8)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, boxW, boxH);

    const blinkOn = Math.floor(Date.now() / 450) % 2 === 0;
    const caret = blinkOn ? "|" : " ";
    const text = this.answerInput ? `x = ${this.answerInput}${caret}` : `x = ${caret}`;
    ctx.font = "30px Arial";
    ctx.fillStyle = "#2f2011";
    ctx.fillText(text, W * 0.5, y + boxH * 0.5);

    if (this.answerFeedback) {
      ctx.font = "18px Arial";
      ctx.fillStyle = "#5a241a";
      ctx.fillText(this.answerFeedback, W * 0.5, y + boxH + 28);
    }

    ctx.restore();
  }

  _drawEndMessage(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "rgba(7,12,22,0.62)";
    ctx.fillRect(176, 170, W - 352, 250);
    ctx.strokeStyle = this.win ? "rgba(255,231,160,0.7)" : "rgba(255,140,140,0.7)";
    ctx.lineWidth = 2;
    ctx.strokeRect(176, 170, W - 352, 250);

    ctx.font = "32px Arial";
    ctx.fillStyle = this.win ? "#fff0a6" : "#ffb1b1";

    const lines = (this.message || "").split("\n");
    let y = H * 0.34;
    for (const line of lines) {
      ctx.fillText(line, W / 2, y);
      y += 30;
    }

    ctx.font = "18px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Pulsa ENTER, ESPACIO o clic para volver.", W / 2, y + 22);

    ctx.restore();
  }

  _beginTravel(message) {
    this.state = "sailing";
    this.travelTimer = this.travelDuration;
    this.travelMessage = message || "El barco avanza hacia la siguiente marca del mapa.";
    this.answerFeedback = "";
    this.showGuideTips = false;
  }

  // =======================================================
  // Helpers
  // =======================================================
  _randInt(a, b) {
    return a + Math.floor(Math.random() * (b - a + 1));
  }

  _pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  _shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  _isPointInRect(px, py, r) {
    if (!r) return false;
    return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
  }

  _wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    if (!text) return;
    const words = String(text).split(" ");
    let line = "";
    let yy = y;

    ctx.textBaseline = "top";
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const testWidth = ctx.measureText(testLine).width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line.trim(), x, yy);
        line = words[n] + " ";
        yy += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), x, yy);
  }

  _strokeText(ctx, text, x, y) {
    ctx.save();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(0,0,0,0.75)";
    ctx.strokeText(String(text), x, y);
    ctx.fillStyle = ctx.fillStyle || "#ffffff";
    ctx.fillText(String(text), x, y);
    ctx.restore();
  }

  _ray(ctx, O, angle, len) {
    ctx.beginPath();
    ctx.moveTo(O.x, O.y);
    ctx.lineTo(O.x + Math.cos(angle) * len, O.y + Math.sin(angle) * len);
    ctx.stroke();
  }

  _lineThrough(ctx, O, angle, halfLen) {
    ctx.strokeStyle = "#e6efff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(O.x - Math.cos(angle) * halfLen, O.y - Math.sin(angle) * halfLen);
    ctx.lineTo(O.x + Math.cos(angle) * halfLen, O.y + Math.sin(angle) * halfLen);
    ctx.stroke();
  }

  _drawRightAngleMarker(ctx, O, size = 16) {
    // Esquina del ángulo recto entre rayo hacia arriba y rayo hacia la derecha.
    ctx.save();
    ctx.strokeStyle = "rgba(230,239,255,0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(O.x + size, O.y);
    ctx.lineTo(O.x + size, O.y - size);
    ctx.lineTo(O.x, O.y - size);
    ctx.stroke();
    ctx.restore();
  }

  _drawAngleSlice(ctx, O, start, end, radius, fill, stroke) {
    let a1 = start;
    let a2 = end;
    const TAU = Math.PI * 2;
    let diff = (a2 - a1 + TAU) % TAU;
    if (diff > Math.PI) {
      [a1, a2] = [a2, a1];
      diff = TAU - diff;
    }

    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(O.x, O.y);
    ctx.arc(O.x, O.y, radius, a1, a1 + diff, false);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = stroke;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(O.x, O.y, radius, a1, a1 + diff, false);
    ctx.stroke();
  }

  _angleLabel(ctx, O, start, end, text, radius) {
    const TAU = Math.PI * 2;
    let a1 = start;
    let a2 = end;
    let diff = (a2 - a1 + TAU) % TAU;
    if (diff > Math.PI) {
      [a1, a2] = [a2, a1];
      diff = TAU - diff;
    }
    const mid = a1 + diff * 0.5;

    ctx.font = "18px Arial";
    ctx.fillStyle = "#ffe082";
    ctx.textAlign = "center";
    this._strokeText(ctx, text, O.x + Math.cos(mid) * radius, O.y + Math.sin(mid) * radius);
  }
}

window.AngulosScene = AngulosScene;





