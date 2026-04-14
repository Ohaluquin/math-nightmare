// js/areas/geometria/niveles/angulosEcuacionesScene.js
// ===========================================================
// AngulosEcuacionesScene - "Ángulos y ecuaciones"
// 3 problemas por corrida (dificultad ascendente):
//  1) Suma de ángulos (180° o 360°) con expresiones ax+b -> halla x
//  2) Triángulo (ángulos internos) con expresiones ax+b -> halla x
//  3) Paralelas con transversal (correspondientes iguales) -> halla x
//
// Respuesta: escribir valor de x y enviar con ENTER.
// Estructura/estilo inspirado en escenas previas (intro/playing/finished, HUD, etc.).
// ===========================================================

class AngulosEcuacionesScene extends Scene {
  constructor(game, options = {}) {
    super(game);

    // ----------------- Estado general -----------------
    this.state = "intro"; // "intro" | "playing" | "finished"
    this.gameFinished = false;
    this.exitDelay = 0;
    this.win = false;
    this.message = "";
    this.sheetsReward = 0;

    // ----------------- Config -----------------
    this.options = options;
    this.maxErrors = options.maxErrors ?? 3;
    this.errors = 0;

    // ----------------- Progreso -----------------
    this.problemIndex = 0; // 0..2
    this.totalProblems = 3;
    this.problems = [];

    // ----------------- Problema actual -----------------
    this.current = null; // { type, xValue, prompt, ... }
    this.answerInput = "";
    this.answerFeedback = "";
    this.showGuideTips = false;
    this.guideTipConsumed = false;
    this._guideToggleRect = null;
    this.questionTimeLimit = options.questionTimeLimit ?? 60;
    this.questionTimeLeft = this.questionTimeLimit;
    this.roundTransitionTimer = 0;
    this.roundTransitionMode = null;

    // ----------------- Constelación narrativa -----------------
    this.constellation = null;
    this.constellationTime = 0;

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

    // ----------------- Sonidos (si existen en assets) -----------------
    this.sfxCorrect = options.sfxCorrect ?? "sfx_match";
    this.sfxWrong = options.sfxWrong ?? "sfx_error";
    this.sfxWin = options.sfxWin ?? "sfx_win";
    this.sfxLose = options.sfxLose ?? "sfx_rugido";
    this.sfxPage = options.sfxPage ?? "sfx_change_page";
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

    // Build 3 problems (ascending difficulty)
    this.problems = this._buildRunProblems();

    this._setCurrentProblem(0);

    // reset input edge state
    this._prevMouseDown = false;
    for (const k of Object.keys(this._prevKeys)) this._prevKeys[k] = false;

    this.answerInput = "";
    this.answerFeedback = "";
    this.showGuideTips = false;
    this.guideTipConsumed = false;
    this._guideToggleRect = null;
    this.questionTimeLeft = this.questionTimeLimit;
    this.roundTransitionTimer = 0;
    this.roundTransitionMode = null;
    this.constellationTime = 0;
    this.constellation = this._createConstellation();
  }

  destroy() {
    this.clearAll?.();
  }

  // =======================================================
  // UPDATE
  // =======================================================
  update(dt) {
    super.update(dt);
    this.constellationTime += dt;
    this._updateConstellation(dt);

    const input = this.game.input;
    const keys = input.keys || {};
    const isDown = (key) => !!keys[key];
    const isJustPressed = (key) => isDown(key) && !this._prevKeys[key];

    const commitKeys = () => {
      for (const k of Object.keys(this._prevKeys)) this._prevKeys[k] = isDown(k);
    };

    // Terminado
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

      if (wantsExit) {
        window.MN_setInputMode?.(null);
        window.MN_setLeafHUDVisible?.(true);
        window.MN_APP?.toOverworld?.();
      }
      commitKeys();
      return;
    }

    // Intro
    if (this.state === "intro") {
      const mouse = input.mouse || { down: false };
      const mouseJustPressed = mouse.down && !this._prevMouseDown;
      this._prevMouseDown = mouse.down;

      if (isJustPressed("Enter") || isJustPressed(" ") || mouseJustPressed) {
        this.state = "playing";
        this.playSfx(this.sfxPage, { volume: 0.5 });
      }
      commitKeys();
      return;
    }

    // Escape para reiniciar (opcional)
    if (isJustPressed("Escape")) {
      window.MN_APP?.toOverworld?.();
      commitKeys();
      return;
    }

    // Playing
    if (this.state === "playing") {
      if (this.roundTransitionTimer > 0) {
        this.roundTransitionTimer = Math.max(0, this.roundTransitionTimer - dt);
        if (this.roundTransitionTimer <= 0) {
          if (this.roundTransitionMode === "finish") {
            this.roundTransitionMode = null;
            this._finishGame(false);
          } else if (this.roundTransitionMode === "next") {
            this.roundTransitionMode = null;
            this.problemIndex++;
            this._setCurrentProblem(this.problemIndex);
          }
        }
        commitKeys();
        return;
      }

      this.questionTimeLeft = Math.max(0, this.questionTimeLeft - dt);
      if (this.questionTimeLeft <= 0) {
        this._registerMistake("Se acabo el tiempo para este problema.");
        commitKeys();
        return;
      }
      this._updatePlaying(input, isJustPressed);
    }

    commitKeys();
  }

  _updatePlaying(input, isJustPressed) {
    const mouse = input.mouse || { down: false };
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
      if (isJustPressed(String(d))) {
        this._appendDigit(String(d));
      }
      if (isJustPressed(`Numpad${d}`)) {
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

    const correct = this.current?.xValue;

    if (chosen === correct) {
      this.playSfx(this.sfxCorrect, { volume: 0.6 });
      this._revealConstellationSegment(this.problemIndex);
      this.answerInput = "";
      this.answerFeedback =
        this.problemIndex + 1 >= this.totalProblems
          ? "La constelación está completa..."
          : "Un fragmento de la constelación empieza a ordenarse...";

      // Avanza al siguiente problema o termina
      if (this.problemIndex + 1 >= this.totalProblems) {
        this.roundTransitionMode = "finish";
        this.roundTransitionTimer = 1.1;
      } else {
        this.roundTransitionMode = "next";
        this.roundTransitionTimer = 0.9;
      }
      return;
    }

    // Incorrecto
    this._registerMistake("Respuesta incorrecta. Intenta otra vez.");
  }

  // =======================================================
  // LÓGICA: construir problemas de la corrida
  // =======================================================
  _buildRunProblems() {
    // Orden fijo como pediste:
    // 1) suma de ángulos (180 o 360)
    // 2) triángulo
    // 3) paralelas
    return [
      this._genAngleSumProblem(),
      this._genTriangleProblem(),
      this._genParallelProblem(),
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
    this.playSfx(this.sfxWrong, { volume: 0.7 });
    this.answerInput = "";
    this.answerFeedback = message;

    if (this.errors >= this.maxErrors) {
      this._finishGame(true);
      return;
    }

    this.questionTimeLeft = this.questionTimeLimit;
  }

  // -----------------
  // Generadores de problemas (parametrizados)
  // -----------------
  _genAngleSumProblem() {
    // Primer problema: 180° (recta) o 360° (alrededor de un punto)
    // dividido en 2/3/4 ángulos con expresiones ax+b.
    const totalAngle = this._pick([180, 180, 360, 360]);
    const parts = this._pick([2, 3, 3, 4]); // favorece 3

    const a = [];
    for (let i = 0; i < parts; i++) a.push(this._randInt(1, 4));
    const sumA = a.reduce((s, v) => s + v, 0);

    // Acota x para que b_i salgan en rango útil y positivos.
    const minBsach = totalAngle === 360 ? 10 : 8;
    const maxBsach = totalAngle === 360 ? 120 : 95;
    const minTargetB = parts * minBsach;
    const maxTargetB = parts * maxBsach;

    // targetB = totalAngle - sumA*x
    const xMin = Math.max(2, Math.ceil((totalAngle - maxTargetB) / sumA));
    const xMax = Math.min(40, Math.floor((totalAngle - minTargetB) / sumA));
    if (xMin > xMax) return this._genAngleSumProblem();

    const x = this._randInt(xMin, xMax);
    const targetB = totalAngle - x * sumA;
    if (targetB < minTargetB || targetB > maxTargetB) return this._genAngleSumProblem();

    const b = this._splitPositive(targetB, parts, minBsach, maxBsach);

    const exprs = [];
    const vals = [];
    for (let i = 0; i < parts; i++) {
      const ai = a[i];
      const bi = b[i];
      exprs.push(this._fmtAxB(ai, bi));
      vals.push(ai * x + bi);
    }

    const sum = vals.reduce((s, v) => s + v, 0);
    if (sum !== totalAngle) return this._genAngleSumProblem();
    const minVisibleAngle = totalAngle === 360 ? 16 : 14;
    if (vals.some((v) => v < minVisibleAngle)) return this._genAngleSumProblem();

    const prompt =
      totalAngle === 180
        ? "Observa la recta y halla x."
        : "Observa la figura alrededor del punto y halla x.";
    const guideTip =
      totalAngle === 180
        ? "En una recta, los ángulos adyacentes suman 180°."
        : "Los ángulos alrededor de un punto suman 360°.";

    return {
      type: "angle_sum",
      totalAngle,
      xValue: x,
      prompt,
      guideTip,
      exprs,
      vals,
      parts,
    };
  }

  _genTriangleProblem() {
    // Triángulo: ángulos internos suman 180
    const x = this._randInt(6, 25);

    // 3 expresiones
    const a = [this._randInt(1, 4), this._randInt(1, 4), this._randInt(1, 4)];
    const sumA = a[0] + a[1] + a[2];

    const targetB = 180 - x * sumA;
    if (targetB < 30) return this._genTriangleProblem();

    const b = this._splitPositive(targetB, 3, 5, 85);

    const exprs = [];
    const vals = [];
    for (let i = 0; i < 3; i++) {
      exprs.push(this._fmtAxB(a[i], b[i]));
      vals.push(a[i] * x + b[i]);
    }

    const sum = vals[0] + vals[1] + vals[2];
    if (sum !== 180) return this._genTriangleProblem();

    // Triángulos "bonitos": evita ángulos extremos y formas muy aguadas.
    if (vals.some((v) => v < 24 || v > 128)) return this._genTriangleProblem();
    const s = vals.map((deg) => Math.sin((deg * Math.PI) / 180));
    const minS = Math.min(...s);
    const maxS = Math.max(...s);
    if (minS <= 0 || maxS / minS > 2.6) return this._genTriangleProblem();

    return {
      type: "triangle",
      xValue: x,
      prompt: "Observa el triángulo y halla x.",
      guideTip: "La suma de los ángulos internos de un triángulo es 180°.",
      exprs,
      vals,
    };
  }

  _genParallelProblem() {
    // Dos paralelas con transversal.
    // Casos: correspondientes, alternos internos, opuestos por el vértice,
    // y colaterales internos (suplementarios).
    const x = this._randInt(6, 30);
    const relationType = this._pick([
      "corresponding",
      "alternate_interior",
      "vertical_opposite",
      "same_side_interior",
    ]);
    const relationMode = relationType === "same_side_interior" ? "supplementary" : "equal";

    const a1 = this._randInt(1, 4);
    const a2 = this._randInt(1, 4);
    if (relationMode === "equal" && a1 === a2) return this._genParallelProblem();

    let angleA;
    let angleB;
    if (relationMode === "equal") {
      angleA = this._randInt(34, 146);
      angleB = angleA;
    } else {
      // Colaterales internos: uno obtuso y otro agudo para que sea claro visualmente.
      angleA = this._randInt(100, 150);
      angleB = 180 - angleA;
    }

    const b1 = angleA - a1 * x;
    const b2 = angleB - a2 * x;
    if (b1 < -40 || b1 > 80 || b2 < -40 || b2 > 80) return this._genParallelProblem();

    const exprA = this._fmtAxB(a1, b1);
    const exprB = this._fmtAxB(a2, b2);
    if (exprA === exprB) return this._genParallelProblem();

    const vA = a1 * x + b1;
    const vB = a2 * x + b2;
    if (vA !== angleA || vB !== angleB) return this._genParallelProblem();

    if (relationMode === "equal") {
      if (vA !== vB) return this._genParallelProblem();
      const den = a1 - a2;
      const num = b2 - b1;
      if (den === 0) return this._genParallelProblem();
      if (num % den !== 0) return this._genParallelProblem();
      if (num / den !== x) return this._genParallelProblem();
    } else {
      if (vA + vB !== 180) return this._genParallelProblem();
      const den = a1 + a2;
      const num = 180 - (b1 + b2);
      if (den === 0) return this._genParallelProblem();
      if (num % den !== 0) return this._genParallelProblem();
      if (num / den !== x) return this._genParallelProblem();
    }

    let prompt = "Observa las paralelas y halla x.";
    let guideTip = "Ángulos correspondientes son iguales.";
    if (relationType === "alternate_interior") {
      guideTip = "Ángulos alternos internos son iguales.";
    } else if (relationType === "vertical_opposite") {
      guideTip = "Ángulos opuestos por el vértice son iguales.";
    } else if (relationType === "same_side_interior") {
      guideTip = "Ángulos colaterales internos suman 180°.";
    }

    return {
      type: "parallel",
      xValue: x,
      prompt,
      guideTip,
      exprA,
      exprB,
      angleA,
      angleB,
      relation: relationType,
      relationMode,
    };
  }

  // =======================================================
  // FIN DsL JUsGO
  // =======================================================
  _finishGame(failed = false) {
    if (this.gameFinished) return;

    this.gameFinished = true;
    this.state = "finished";
    this.exitDelay = 0.45;

    this.win = !failed;

    // Tier simple (ajústalo a tu economía)
    const tier = failed ? 0 : 1;

    let gained = 0;
    if (window.MN_reportMinigameTier) {
      gained = window.MN_reportMinigameTier("angulos_ecuaciones", tier);
    }
    this.sheetsReward = gained;

    if (this.win) {
      this.message =
        "¡Bien!\n" +
        "Descifraste las señales y restauraste la constelación.\n" +
        `Errores: ${this.errors}/${this.maxErrors}\n` +
        `Hojas ganadas: ${gained}.`;
      this.playSfx(this.sfxWin, { volume: 0.7 });
    } else {
      this.message =
        "Te faltó un poco...\n" +
        "Vuelve a intentarlo.\n" +
        `Errores: ${this.errors}/${this.maxErrors}\n` +
        `Hojas ganadas: ${gained}.`;
      this.playSfx(this.sfxLose, { volume: 0.7 });
    }

    this.game?.events?.emit?.("angulos_ecuaciones_done", {
      win: this.win,
      tier,
      sheetsReward: gained,
      failed,
    });
  }

  // =======================================================
  // DRAW
  // =======================================================
  draw(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;
    const bg = this.game.assets?.getImage?.("bg_angulos_ecuaciones_cielo");

    if (bg) {
      const scale = Math.max(W / Math.max(1, bg.width), H / Math.max(1, bg.height));
      const w = bg.width * scale;
      const h = bg.height * scale;
      const x = (W - w) * 0.5;
      const y = (H - h) * 0.5;
      ctx.drawImage(bg, x, y, w, h);
    } else {
      ctx.fillStyle = "#070c16";
      ctx.fillRect(0, 0, W, H);
    }
    // capa oscura
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, 0, W, H);

    this._drawConstellation(ctx);

    this._drawHUD(ctx);

    if (this.state === "intro") {
      this._drawIntro(ctx);
      return;
    }

    if (this.state === "playing") {
      this._drawPrompt(ctx);
      if (!this.guideTipConsumed) this._drawGuideToggle(ctx);
      if (this.showGuideTips) this._drawGuidePanel(ctx);
      this._drawFigure(ctx);
      this._drawAnswerInput(ctx);
      return;
    }

    if (this.state === "finished") {
      this._drawEndMessage(ctx);
      return;
    }
  }

  _drawHUD(ctx) {
    const W = this.game.canvas.width;

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(16, 12, 390, 44);

    ctx.strokeStyle = "#7aa7ff";
    ctx.lineWidth = 2;
    ctx.strokeRect(16, 12, 390, 44);

    ctx.font = "16px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    const p = Math.min(this.problemIndex + 1, this.totalProblems);
    ctx.fillText(`Problema: ${p}/${this.totalProblems}`, 28, 34);
    const lives = Math.max(0, this.maxErrors - this.errors);
    ctx.fillText("Vidas:", 170, 34);
    for (let i = 0; i < this.maxErrors; i++) {
      ctx.fillStyle = i < lives ? "#ff4d6d" : "rgba(255,255,255,0.25)";
      this._drawHeart(ctx, 226 + i * 20, 25, 13);
    }
    const secondsLeft = Math.max(0, Math.ceil(this.questionTimeLeft));
    ctx.fillStyle = secondsLeft <= 10 ? "#ffd36b" : "#ffffff";
    ctx.fillText(`Tiempo: ${secondsLeft}s`, 300, 34);

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
    const panelW = Math.min(760, W * 0.72);
    const panelH = 328;
    const panelX = (W - panelW) * 0.5;
    const panelY = H * 0.22;

    ctx.save();
    this._drawUIPanel(ctx, panelX, panelY, panelW, panelH, 0.84);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "#ffffff";
    ctx.font = "34px Arial";
    ctx.fillText("Ángulos y ecuaciones", W / 2, panelY + 54);

    ctx.font = "18px Arial";
    ctx.fillStyle = "#d8e6ff";
    ctx.fillText("Resuelve 3 problemas para ganar.", W / 2, panelY + 116);
    ctx.fillText("Escribe el valor de x y pulsa ENTER.", W / 2, panelY + 162);
    ctx.fillText("Tienes 60 segundos por ronda.", W / 2, panelY + 208);
    ctx.fillText("Cada solución ordena una parte de la constelación.", W / 2, panelY + 254);
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Pulsa ENTER o ESPACIO para comenzar.", W / 2, panelY + panelH - 26);

    ctx.restore();
  }

  _drawPrompt(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;
    const boxW = Math.min(W * 0.84, 760);
    const boxH = 58;
    const x = (W - boxW) * 0.5;
    const y = H * 0.12 - 16;

    ctx.save();
    this._drawUIPanel(ctx, x, y, boxW, boxH, 0.88);

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = "22px Arial";
    this._wrapText(ctx, this.current?.prompt || "", W / 2, y + 12, boxW - 28, 26);
    ctx.restore();
  }

  _drawFigure(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    const cx = W * 0.5;
    const cy = H * 0.44;

    ctx.save();

    const t = this.current?.type;

    if (t === "angle_sum" || t === "line180") this._drawAngleSum(ctx, cx, cy);
    else if (t === "triangle") this._drawTriangle(ctx, cx, cy);
    else if (t === "parallel") this._drawParallels(ctx, cx, cy);

    ctx.restore();
  }
  _drawAngleSum(ctx, cx, cy) {
    const P = this.current;
    const totalAngle = P.totalAngle || 180;
    const parts = P.parts || (P.exprs?.length ?? 3);
    const values = Array.isArray(P.vals) && P.vals.length === parts
      ? P.vals.slice()
      : new Array(parts).fill(totalAngle / parts);

    const totalValue = values.reduce((s, v) => s + v, 0);
    if (!totalValue) return;

    const radius = totalAngle === 360 ? 160 : 170;
    const labelRadius = totalAngle === 360 ? 106 : 120;

    // 180°: semicírculo superior; 360°: vuelta completa.
    let startAngle = totalAngle === 180 ? -Math.PI : -Math.PI / 2;
    const radiansPerUnit = totalAngle === 180 ? Math.PI / totalValue : (Math.PI * 2) / totalValue;

    // Línea base para el caso de recta (180°).
    if (totalAngle === 180) {
      ctx.strokeStyle = "#e6efff";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx - 240, cy);
      ctx.lineTo(cx + 240, cy);
      ctx.stroke();
    }

    // Sectores proporcionales: la abertura visual coincide con cada expresión.
    for (let i = 0; i < parts; i++) {
      const delta = values[i] * radiansPerUnit;
      const end = startAngle + delta;
      const hue = (i * 65) % 360;

      ctx.fillStyle = `hsla(${hue}, 85%, 62%, 0.18)`;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, end, false);
      ctx.closePath();
      ctx.fill();

      // Arco interno para reforzar visualmente la abertura.
      ctx.strokeStyle = `hsla(${hue}, 90%, 70%, 0.9)`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.58, startAngle, end, false);
      ctx.stroke();

      // Etiqueta al centro del sector.
      const mid = startAngle + delta * 0.5;
      const lx = cx + Math.cos(mid) * labelRadius;
      const ly = cy + Math.sin(mid) * labelRadius;
      ctx.font = "18px Arial";
      ctx.fillStyle = "#ffe082";
      ctx.textAlign = "center";
      this._strokeText(ctx, P.exprs[i], lx, ly);

      startAngle = end;
    }

    // Rayos frontera reales según los valores (incluye inicio y fin).
    let cursor = totalAngle === 180 ? -Math.PI : -Math.PI / 2;
    for (let i = 0; i <= parts; i++) {
      const rx = cx + Math.cos(cursor) * radius;
      const ry = cy + Math.sin(cursor) * radius;
      ctx.strokeStyle = "rgba(230,239,255,0.9)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(rx, ry);
      ctx.stroke();

      if (i < parts) cursor += values[i] * radiansPerUnit;
    }

    // Punto central y leyenda.
    ctx.fillStyle = "#e6efff";
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fill();

    // La pista principal ya se muestra en el panel de tips.
  }

  _drawTriangle(ctx, cx, cy) {
    const P = this.current;
    const vals = Array.isArray(P.vals) ? P.vals : null;

    // Construye un triángulo cuya forma respete los ángulos reales del problema.
    // Mapeo: exprs[0] en A (arriba), exprs[1] en B (izq), exprs[2] en C (der).
    const toRad = (deg) => (deg * Math.PI) / 180;
    const cross = (u, v) => u.x * v.y - u.y * v.x;
    const length = (u) => Math.hypot(u.x, u.y);
    const normalize = (u) => {
      const len = Math.hypot(u.x, u.y) || 1;
      return { x: u.x / len, y: u.y / len };
    };

    let A;
    let B;
    let C;

    if (vals && vals.length === 3) {
      const angB = vals[1];
      const angC = vals[2];

      // Base horizontal.
      const baseLen = 300;
      const baseY = cy + 132;
      B = { x: cx - baseLen / 2, y: baseY };
      C = { x: cx + baseLen / 2, y: baseY };

      // Rayos BA y CA en sistema canvas (y hacia abajo).
      const dB = { x: Math.cos(toRad(angB)), y: -Math.sin(toRad(angB)) };
      const dC = { x: -Math.cos(toRad(angC)), y: -Math.sin(toRad(angC)) };

      const denom = cross(dB, dC);
      if (Math.abs(denom) > 1e-6) {
        const CB = { x: C.x - B.x, y: C.y - B.y };
        const tB = cross(CB, dC) / denom;
        A = { x: B.x + dB.x * tB, y: B.y + dB.y * tB };
      }
    }

    // Fallback seguro si algo numérico falla.
    if (!A || !B || !C || !Number.isFinite(A.x) || !Number.isFinite(A.y)) {
      A = { x: cx, y: cy - 150 };
      B = { x: cx - 170, y: cy + 140 };
      C = { x: cx + 170, y: cy + 140 };
    }

    // Escala/centra para mantener legibilidad en el área de dibujo.
    const minX = Math.min(A.x, B.x, C.x);
    const maxX = Math.max(A.x, B.x, C.x);
    const minY = Math.min(A.y, B.y, C.y);
    const maxY = Math.max(A.y, B.y, C.y);
    const w = Math.max(1, maxX - minX);
    const h = Math.max(1, maxY - minY);
    const maxW = 380;
    const maxH = 300;
    const s = Math.min(maxW / w, maxH / h, 1.15);

    const g = {
      x: (A.x + B.x + C.x) / 3,
      y: (A.y + B.y + C.y) / 3,
    };
    const targetG = { x: cx, y: cy + 38 };
    const transform = (p) => ({
      x: targetG.x + (p.x - g.x) * s,
      y: targetG.y + (p.y - g.y) * s,
    });

    A = transform(A);
    B = transform(B);
    C = transform(C);

    ctx.strokeStyle = "#e6efff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
    ctx.lineTo(C.x, C.y);
    ctx.closePath();
    ctx.stroke();

    // Etiquetas cerca de vértices
    ctx.font = "18px Arial";
    ctx.fillStyle = "#ffe082";
    ctx.textAlign = "center";

    // Incenter para empujar etiquetas hacia adentro y evitar encimar líneas.
    const a = length({ x: B.x - C.x, y: B.y - C.y }); // opuesto a A
    const b = length({ x: A.x - C.x, y: A.y - C.y }); // opuesto a B
    const c = length({ x: A.x - B.x, y: A.y - B.y }); // opuesto a C
    const sum = a + b + c || 1;
    const I = {
      x: (a * A.x + b * B.x + c * C.x) / sum,
      y: (a * A.y + b * B.y + c * C.y) / sum,
    };

    const labelFromVertex = (V, text, dist = 38) => {
      const dir = normalize({ x: I.x - V.x, y: I.y - V.y });
      this._strokeText(ctx, text, V.x + dir.x * dist, V.y + dir.y * dist);
    };

    labelFromVertex(A, P.exprs[0], 44);
    labelFromVertex(B, P.exprs[1], 42);
    labelFromVertex(C, P.exprs[2], 42);
  }

  _drawParallels(ctx, cx, cy) {
    const P = this.current;

    // Dos paralelas horizontales
    ctx.strokeStyle = "#e6efff";
    ctx.lineWidth = 4;

    const y1 = cy - 90;
    const y2 = cy + 90;

    ctx.beginPath();
    ctx.moveTo(cx - 240, y1);
    ctx.lineTo(cx + 240, y1);
    ctx.moveTo(cx - 240, y2);
    ctx.lineTo(cx + 240, y2);
    ctx.stroke();

    // Transversal: su inclinación se ajusta al valor angular para que la abertura
    // marcada sea proporcional al ángulo del problema.
    const rawA = Math.max(20, Math.min(160, P.angleA ?? P.angleValue ?? 60));
    const rawB = Math.max(20, Math.min(160, P.angleB ?? rawA));
    const acuteAngle = rawA <= 90 ? rawA : 180 - rawA;
    const theta = (acuteAngle * Math.PI) / 180;
    const dir = { x: Math.cos(theta), y: -Math.sin(theta) }; // hacia arriba-derecha
    const center = { x: cx + 15, y: cy };
    const halfLen = 280;
    const tA = { x: center.x - dir.x * halfLen, y: center.y - dir.y * halfLen };
    const tB = { x: center.x + dir.x * halfLen, y: center.y + dir.y * halfLen };

    ctx.strokeStyle = "rgba(230,239,255,0.8)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(tA.x, tA.y);
    ctx.lineTo(tB.x, tB.y);
    ctx.stroke();

    // Intersecciones de la transversal con cada paralela.
    const xAtY = (y) => center.x + ((y - center.y) / dir.y) * dir.x;
    const I1 = { x: xAtY(y1), y: y1 };
    const I2 = { x: xAtY(y2), y: y2 };

    const TAU = Math.PI * 2;
    const normAng = (a) => {
      let out = a;
      while (out <= -Math.PI) out += TAU;
      while (out > Math.PI) out -= TAU;
      return out;
    };
    const drawMarkedAngle = (O, aRay1, aRay2, label, hueShift = 0) => {
      let a1 = aRay1;
      let a2 = aRay2;
      let diff = (a2 - a1 + TAU) % TAU;
      if (diff > Math.PI) {
        [a1, a2] = [a2, a1];
        diff = TAU - diff;
      }
      const mid = normAng(a1 + diff * 0.5);
      const r = 34;

      ctx.fillStyle = `hsla(${42 + hueShift}, 95%, 62%, 0.22)`;
      ctx.beginPath();
      ctx.moveTo(O.x, O.y);
      ctx.arc(O.x, O.y, r, a1, a1 + diff, false);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = `hsla(${42 + hueShift}, 98%, 72%, 0.95)`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(O.x, O.y, r, a1, a1 + diff, false);
      ctx.stroke();

      const lx = O.x + Math.cos(mid) * (r + 28);
      const ly = O.y + Math.sin(mid) * (r + 28);
      ctx.font = "18px Arial";
      ctx.fillStyle = "#ffe082";
      ctx.textAlign = "center";
      this._strokeText(ctx, label, lx, ly);
    };

    const aRight = 0;
    const aLeft = Math.PI;
    const aUp = -theta;
    const aDown = Math.PI - theta;
    const isObtuseA = rawA > 90;
    const isObtuseB = rawB > 90;

    // Selección de ángulos según relación.
    if (P.relation === "alternate_interior") {
      // Top interior y bottom interior en lados opuestos.
      if (!isObtuseA) drawMarkedAngle(I1, aLeft, aDown, P.exprA, 0);
      else drawMarkedAngle(I1, aRight, aDown, P.exprA, 0);

      if (!isObtuseB) drawMarkedAngle(I2, aRight, aUp, P.exprB, 30);
      else drawMarkedAngle(I2, aLeft, aUp, P.exprB, 30);
    } else if (P.relation === "vertical_opposite") {
      // Mismo vértice (intersección superior), ángulos opuestos.
      if (!isObtuseA) {
        drawMarkedAngle(I1, aRight, aUp, P.exprA, 0);
        drawMarkedAngle(I1, aLeft, aDown, P.exprB, 30);
      } else {
        drawMarkedAngle(I1, aLeft, aUp, P.exprA, 0);
        drawMarkedAngle(I1, aRight, aDown, P.exprB, 30);
      }
    } else if (P.relation === "same_side_interior") {
      // Colaterales internos del mismo lado (derecho): top interior-right + bottom interior-right.
      drawMarkedAngle(I1, aRight, aDown, P.exprA, 0); // obtuso
      drawMarkedAngle(I2, aRight, aUp, P.exprB, 30);  // agudo
    } else {
      // Correspondientes (misma posición relativa en ambas intersecciones).
      if (!isObtuseA) drawMarkedAngle(I1, aRight, aUp, P.exprA, 0);
      else drawMarkedAngle(I1, aLeft, aUp, P.exprA, 0);

      if (!isObtuseB) drawMarkedAngle(I2, aRight, aUp, P.exprB, 30);
      else drawMarkedAngle(I2, aLeft, aUp, P.exprB, 30);
    }

    // La pista principal ya se muestra en el panel de tips.
  }

  _drawGuideToggle(ctx) {
    const W = this.game.canvas.width;
    const x = W - 180;
    const y = 98;
    const w = 156;
    const h = 34;
    this._guideToggleRect = { x, y, w, h };

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.48)";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "#7aa7ff";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    ctx.font = "16px Arial";
    ctx.fillStyle = "#eaf1ff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.showGuideTips ? "Ocultar tips" : "Mostrar tips", x + w * 0.5, y + h * 0.5);
    ctx.restore();
  }

  _drawGuidePanel(ctx) {
    const tip = this.current?.guideTip;
    if (!tip) return;

    const W = this.game.canvas.width;
    const boxW = Math.min(620, W * 0.76);
    const x = (W - boxW) * 0.5;
    const y = 184;
    const h = 56;

    ctx.save();
    ctx.fillStyle = "rgba(11,18,36,0.82)";
    ctx.fillRect(x, y, boxW, h);
    ctx.strokeStyle = "rgba(122,167,255,0.75)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, boxW, h);
    ctx.font = "17px Arial";
    ctx.fillStyle = "#d9e8ff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    this._wrapText(ctx, tip, x + boxW * 0.5, y + 14, boxW - 24, 22);
    ctx.restore();
  }

  _drawConstellation(ctx) {
    const data = this.constellation;
    if (!data) return;

    const W = this.game.canvas.width;
    const H = this.game.canvas.height;
    const box = {
      x: W * 0.12,
      y: H * 0.14,
      w: W * 0.76,
      h: H * 0.42,
    };
    ctx.save();

    const glow = ctx.createRadialGradient(
      box.x + box.w * 0.5,
      box.y + box.h * 0.46,
      10,
      box.x + box.w * 0.5,
      box.y + box.h * 0.46,
      box.w * 0.62,
    );
    glow.addColorStop(0, "rgba(78, 120, 255, 0.12)");
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(box.x - 30, box.y - 20, box.w + 60, box.h + 40);

    for (const star of data.backgroundStars) {
      const phase = this.constellationTime * star.speed + star.phase;
      const pulse = 0.55 + 0.45 * Math.sin(phase);
      const x = box.x + star.x * box.w;
      const y = box.y + star.y * box.h;
      const r = star.size * (0.85 + pulse * 0.45);
      ctx.fillStyle = `rgba(220,235,255,${0.12 + pulse * 0.28})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const points = data.points.map((p) => ({
      x: box.x + p.x * box.w,
      y: box.y + p.y * box.h,
      segment: p.segment,
    }));

    for (const edge of data.edges) {
      const a = points[edge[0]];
      const b = points[edge[1]];
      const p = Math.min(data.segmentProgress[a.segment], data.segmentProgress[b.segment]);
      const alpha = 0.08 + p * 0.78;
      const width = 1.2 + p * 2.2;
      ctx.strokeStyle = `rgba(123, 196, 255, ${alpha})`;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      const progress = data.segmentProgress[pt.segment];
      const pulse = 0.55 + 0.45 * Math.sin(this.constellationTime * 2.2 + data.starSeeds[i]);
      const radius = 2.2 + progress * 1.9 + pulse * 0.9;
      const glowR = radius * (2.1 + progress * 0.9);
      ctx.fillStyle = `rgba(118, 192, 255, ${0.10 + progress * 0.22})`;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, glowR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${0.48 + progress * 0.42})`;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  _drawAnswerInput(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;
    const boxW = Math.min(420, W * 0.56);
    const boxH = 58;
    const x = (W - boxW) * 0.5;
    const y = H * 0.76;
    const panelW = Math.min(560, W * 0.66);
    const panelX = (W - panelW) * 0.5;
    const panelY = y - 64;
    const panelH = 160;

    ctx.save();
    this._drawUIPanel(ctx, panelX, panelY, panelW, panelH, 0.82);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Título
    ctx.fillStyle = "#ffffff";
    ctx.font = "18px Arial";
    ctx.fillText("Escribe el valor de x y pulsa ENTER", W * 0.5, y - 28);

    this._drawUIPanel(ctx, x, y, boxW, boxH, 0.9);

    const blinkOn = Math.floor(Date.now() / 450) % 2 === 0;
    const caret = blinkOn ? "|" : " ";
    const text = this.answerInput ? `x = ${this.answerInput}${caret}` : `x = ${caret}`;
    ctx.font = "30px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(text, W * 0.5, y + boxH * 0.5);

    if (this.answerFeedback) {
      ctx.font = "18px Arial";
      ctx.fillStyle = "#ffd2d2";
      ctx.fillText(this.answerFeedback, W * 0.5, y + boxH + 28);
    } else {
      ctx.font = "15px Arial";
      ctx.fillStyle = "#c7d9ff";
      ctx.fillText("Puedes usar teclado normal o numérico. Backspace borra.", W * 0.5, y + boxH + 24);
    }

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

    const lines = (this.message || "").split("\n");
    let y = H * 0.32;
    for (const line of lines) {
      ctx.fillText(line, W / 2, y);
      y += 30;
    }

    ctx.font = "18px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Pulsa ENTER, ESPACIO o clic para volver.", W / 2, y + 22);

    ctx.restore();
  }

  // =======================================================
  // Helpers
  // =======================================================
  _randInt(a, b) {
    return a + Math.floor(Math.random() * (b - a + 1));
  }

  _createConstellation() {
    const targetPoints = [
      { x: 0.08, y: 0.64 },
      { x: 0.16, y: 0.50 },
      { x: 0.25, y: 0.36 },
      { x: 0.35, y: 0.27 },
      { x: 0.47, y: 0.20 },
      { x: 0.58, y: 0.28 },
      { x: 0.68, y: 0.42 },
      { x: 0.79, y: 0.56 },
      { x: 0.70, y: 0.70 },
      { x: 0.56, y: 0.77 },
      { x: 0.41, y: 0.74 },
      { x: 0.26, y: 0.78 },
    ];
    const segments = [
      [0, 1, 2, 3],
      [4, 5, 6, 7],
      [8, 9, 10, 11],
    ];
    const edges = [
      [0, 1], [1, 2], [2, 3],
      [3, 4], [4, 5], [5, 6], [6, 7],
      [7, 8], [8, 9], [9, 10], [10, 11],
      [2, 10], [5, 9],
    ];

    const points = targetPoints.map((p) => ({ ...p, segment: 0 }));
    const transforms = [
      { angle: 1.2, scale: 0.76, tx: -0.14, ty: 0.14 },
      { angle: -1.05, scale: 0.74, tx: 0.13, ty: 0.12 },
      { angle: 0.92, scale: 0.78, tx: -0.04, ty: -0.18 },
    ];

    segments.forEach((group, segIndex) => {
      const t = transforms[segIndex];
      const center = group.reduce(
        (acc, idx) => ({
          x: acc.x + targetPoints[idx].x,
          y: acc.y + targetPoints[idx].y,
        }),
        { x: 0, y: 0 },
      );
      center.x /= group.length;
      center.y /= group.length;

      for (let i = 0; i < group.length; i++) {
        const idx = group[i];
        const p = targetPoints[idx];
        const dx = p.x - center.x;
        const dy = p.y - center.y;
        const cos = Math.cos(t.angle);
        const sin = Math.sin(t.angle);
        const rx = (dx * cos - dy * sin) * t.scale;
        const ry = (dx * sin + dy * cos) * t.scale;
        const jitterX = (Math.random() - 0.5) * 0.04;
        const jitterY = (Math.random() - 0.5) * 0.04;
        points[idx] = {
          x: center.x + rx + t.tx + jitterX,
          y: center.y + ry + t.ty + jitterY,
          segment: segIndex,
        };
      }
    });

    const backgroundStars = Array.from({ length: 28 }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: 0.8 + Math.random() * 1.6,
      speed: 0.5 + Math.random() * 1.4,
      phase: Math.random() * Math.PI * 2,
    }));

    return {
      targetPoints,
      points,
      edges,
      segments,
      segmentProgress: [0, 0, 0],
      segmentTargets: [0, 0, 0],
      starSeeds: targetPoints.map(() => Math.random() * Math.PI * 2),
      backgroundStars,
    };
  }

  _updateConstellation(dt) {
    const data = this.constellation;
    if (!data) return;

    for (let segIndex = 0; segIndex < data.segmentTargets.length; segIndex++) {
      const current = data.segmentProgress[segIndex];
      const target = data.segmentTargets[segIndex];
      if (current >= target) continue;
      data.segmentProgress[segIndex] = Math.min(target, current + dt * 1.6);
    }

    for (let segIndex = 0; segIndex < data.segments.length; segIndex++) {
      const group = data.segments[segIndex];
      const progress = this._easeOutCubic(data.segmentProgress[segIndex]);
      for (const idx of group) {
        const start = data.points[idx];
        const target = data.targetPoints[idx];
        data.points[idx] = {
          x: start.x + (target.x - start.x) * progress,
          y: start.y + (target.y - start.y) * progress,
          segment: segIndex,
        };
      }
    }
  }

  _revealConstellationSegment(index) {
    const data = this.constellation;
    if (!data) return;
    const segIndex = Math.max(0, Math.min(data.segmentTargets.length - 1, index));
    data.segmentTargets[segIndex] = 1;
  }

  _easeOutCubic(t) {
    const clamped = Math.max(0, Math.min(1, t));
    return 1 - Math.pow(1 - clamped, 3);
  }

  _pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
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

  _isPointInRect(px, py, r) {
    if (!r) return false;
    return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
  }

  _drawUIPanel(ctx, x, y, w, h, alpha = 0.82) {
    ctx.save();
    ctx.fillStyle = `rgba(8,14,30,${alpha})`;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "rgba(122,167,255,0.84)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    ctx.restore();
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

  _fmtAxB(a, b) {
    // Devuelve string tipo "2x+5" o "3x-7" o "x+12"
    const ax = a === 1 ? "x" : `${a}x`;
    if (b === 0) return ax;
    const sign = b > 0 ? "+" : "-";
    const abs = Math.abs(b);
    return `${ax}${sign}${abs}`;
  }

  _splitPositive(total, n, minEach, maxEach) {
    // Divide total en n partes >= minEach, <= maxEach (simple + retries)
    // Garantiza enteros.
    for (let attempt = 0; attempt < 200; attempt++) {
      const parts = new Array(n).fill(minEach);
      let remaining = total - n * minEach;
      if (remaining < 0) break;

      for (let i = 0; i < n; i++) {
        if (remaining <= 0) break;
        const cap = Math.max(0, maxEach - parts[i]);
        const add = Math.min(cap, this._randInt(0, remaining));
        parts[i] += add;
        remaining -= add;
      }

      // Si sobró, distribuye
      let safe = 0;
      while (remaining > 0 && safe++ < 400) {
        const i = this._randInt(0, n - 1);
        if (parts[i] < maxEach) {
          parts[i] += 1;
          remaining -= 1;
        }
      }

      if (remaining === 0) return parts;
    }

    // Fallback: reparto uniforme
    const base = Math.floor(total / n);
    const parts = new Array(n).fill(base);
    let rem = total - base * n;
    for (let i = 0; i < n && rem > 0; i++, rem--) parts[i] += 1;
    // fuerza mínimos (si esto falla, el generador reintenta)
    for (let i = 0; i < n; i++) parts[i] = Math.max(minEach, Math.min(maxEach, parts[i]));
    return parts;
  }
}

window.AngulosEcuacionesScene = AngulosEcuacionesScene;
window.AngulosEquacionesScene = AngulosEcuacionesScene;
window.AngulosscuacionesScene = AngulosEcuacionesScene;
