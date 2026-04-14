// js/areas/geometria/niveles/poligonosScene.js
// ===========================================================
// PoligonosScene - "Polígonos Regulares"
// 3 problemas por corrida:
//  - Polígono regular de 3 a 12 lados.
//  - Orden de dificultad fijo:
//      1) ángulo central.
//      2) un ángulo del triángulo formado por centro + 2 vértices consecutivos.
//      3) ángulo interior del polígono.
//
// Respuesta: escribir valor numérico de x y enviar con ENTER.
// Estructura/UI alineada con AngulosScene / IsoscelesScene.
// ===========================================================

class PoligonosScene extends Scene {
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
    this.problemIndex = 0;
    this.totalProblems = 3;
    this.problems = [];
    this.allowedSides = [3, 4, 5, 6, 9, 10, 12];

    // ----------------- Problema actual -----------------
    this.current = null;
    this.answerInput = "";
    this.answerFeedback = "";
    this.questionTimeLimit = options.questionTimeLimit ?? 60;
    this.questionTimeLeft = this.questionTimeLimit;
    this.showGuideTips = false;
    this.guideTipsUsed = false;
    this._guideToggleRect = null;

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
    this.questionTimeLeft = this.questionTimeLimit;
    this.showGuideTips = false;
    this.guideTipsUsed = false;
    this._guideToggleRect = null;
  }

  destroy() {
    this.clearAll?.();
  }

  // =======================================================
  // UPDATE
  // =======================================================
  update(dt) {
    super.update(dt);

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

    if (isJustPressed("Escape")) {
      window.MN_APP?.toOverworld?.();
      commitKeys();
      return;
    }

    if (this.state === "playing") {
      this.questionTimeLeft = Math.max(0, this.questionTimeLeft - dt);
      if (this.questionTimeLeft <= 0) {
        this._registerMistake("Se agotó el tiempo para este polígono.");
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

    if (mouseJustPressed && !this.guideTipsUsed && this._isPointInRect(mouse.x, mouse.y, this._guideToggleRect)) {
      this.showGuideTips = true;
      this.guideTipsUsed = true;
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

    if (chosen === this.current.answerValue) {
      this.playSfx(this.sfxCorrect, { volume: 0.6 });

      if (this.problemIndex + 1 >= this.totalProblems) {
        this._finishGame(false);
      } else {
        this.problemIndex++;
        this._setCurrentProblem(this.problemIndex);
      }
      return;
    }

    this._registerMistake("Respuesta incorrecta. Intenta otra vez.");
  }

  // =======================================================
  // PROBLEMAS
  // =======================================================
  _buildRunProblems() {
    const modesInOrder = ["triangle_center", "triangle_base", "interior"];
    const sidePool = this.allowedSides.slice();
    const selected = [];

    for (let i = 0; i < modesInOrder.length && i < this.totalProblems; i++) {
      const idx = this._randInt(0, sidePool.length - 1);
      const n = sidePool[idx];
      sidePool.splice(idx, 1);
      selected.push(this._genProblem(n, modesInOrder[i]));
    }

    return selected;
  }

  _setCurrentProblem(index) {
    this.current = this.problems[index] || null;
    this.answerInput = "";
    this.answerFeedback = "";
    this.questionTimeLeft = this.questionTimeLimit;
    this.showGuideTips = false;
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

  _genProblem(n, mode) {
    const sideIndex = this._randInt(0, n - 1);

    const central = 360 / n;
    const interior = ((n - 2) * 180) / n;
    const base = (180 - central) / 2;

    if (mode === "interior") {
      return {
        type: "interior",
        n,
        sideIndex,
        prompt: "Observa el polígono regular y calcula x.",
        guideTip: "Piensa cuánto mide el ángulo que se repite en cada vértice de un polígono regular y relaciónalo con el número de lados.",
        answerValue: interior,
        givenText: `Dato: polígono regular de ${n} lados.`,
      };
    }

    if (mode === "triangle_center") {
      return {
        type: "triangle_center",
        n,
        sideIndex,
        prompt: "En el triángulo formado por el centro y dos vértices consecutivos, calcula x.",
        guideTip: "Fíjate en que el centro reparte la vuelta completa en partes iguales, una por cada lado del polígono.",
        answerValue: central,
        givenText: `Dato: polígono regular de ${n} lados.`,
      };
    }

    return {
      type: "triangle_base",
      n,
      sideIndex,
      prompt: "En el triángulo formado por el centro y dos vértices consecutivos, calcula x.",
      guideTip: "Observa que ese triángulo tiene dos lados iguales. Si identificas primero el ángulo del centro, podrás deducir los otros dos.",
      answerValue: base,
      givenText: `Dato: polígono regular de ${n} lados.`,
    };
  }

  // =======================================================
  // FIN DEL JUEGO
  // =======================================================
  _finishGame(failed = false) {
    if (this.gameFinished) return;

    this.gameFinished = true;
    this.state = "finished";
    this.exitDelay = 0.45;
    this.win = !failed;

    const tier = failed ? 0 : 1;
    let gained = 0;
    if (window.MN_reportMinigameTier) {
      gained = window.MN_reportMinigameTier("poligonos", tier);
    }
    this.sheetsReward = gained;

    if (this.win) {
      this.message =
        "¡Bien!\n" +
        "Resolviste ángulos en polígonos regulares.\n" +
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

    this.game?.events?.emit?.("poligonos_done", {
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
    const bg = this.game.assets?.getImage?.("bg_poligonos_plano");

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

    ctx.fillStyle = "rgba(0,0,0,0.42)";
    ctx.fillRect(0, 0, W, H);

    this._drawHUD(ctx);

    if (this.state === "intro") {
      this._drawIntro(ctx);
      return;
    }

    if (this.state === "playing") {
      this._drawPrompt(ctx);
      this._drawGuideToggle(ctx);
      if (this.showGuideTips) this._drawGuidePanel(ctx);
      this._drawFigure(ctx);
      this._drawAnswerInput(ctx);
      return;
    }

    if (this.state === "finished") {
      this._drawEndMessage(ctx);
    }
  }

  _drawHUD(ctx) {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(16, 12, 414, 44);
    ctx.strokeStyle = "#7aa7ff";
    ctx.lineWidth = 2;
    ctx.strokeRect(16, 12, 414, 44);

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
    ctx.fillText(`Tiempo: ${secondsLeft}s`, 306, 34);
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
    ctx.fillText("Polígonos Regulares", W / 2, H * 0.28);

    ctx.font = "18px Arial";
    ctx.fillStyle = "#d8e6ff";
    ctx.fillText("Resuelve 3 problemas para ganar.", W / 2, H * 0.40);
    ctx.fillText("Cada figura tendrá 3, 4, 5, 6, 9, 10 o 12 lados.", W / 2, H * 0.46);
    ctx.fillText("Calcula el valor de x y pulsa ENTER.", W / 2, H * 0.52);
    ctx.fillText("Cada ronda dura 60 segundos y el tip solo puede usarse una vez.", W / 2, H * 0.58);

    ctx.fillStyle = "#ffffff";
    ctx.fillText("Pulsa ENTER o ESPACIO para comenzar.", W / 2, H * 0.68);
    ctx.restore();
  }

  _drawPrompt(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    ctx.save();
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = "22px Arial";
    this._wrapText(ctx, this.current?.prompt || "", W / 2, 92, W * 0.7, 26);
    ctx.restore();
  }

  _drawGuideToggle(ctx) {
    if (this.guideTipsUsed) {
      this._guideToggleRect = null;
      return;
    }

    const W = this.game.canvas.width;
    const x = W - 210;
    const y = 118;
    const w = 170;
    const h = 36;
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
    ctx.fillText("Mostrar tips", x + w * 0.5, y + h * 0.5);
    ctx.restore();
  }

  _drawGuidePanel(ctx) {
    const tip = this.current?.guideTip;
    const givenText = this.current?.givenText;
    if (!tip && !givenText) return;

    const W = this.game.canvas.width;
    const H = this.game.canvas.height;
    const boxW = Math.min(620, W * 0.58);
    const x = (W - boxW) * 0.5;
    const y = Math.max(112, H * 0.18);
    const h = 102;
    const lines = [];
    if (givenText) lines.push(givenText);
    if (tip) lines.push(tip);

    ctx.save();
    ctx.fillStyle = "rgba(11,18,36,0.82)";
    ctx.fillRect(x, y, boxW, h);
    ctx.strokeStyle = "rgba(122,167,255,0.75)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, boxW, h);
    ctx.font = "17px Arial";
    ctx.fillStyle = "#d9e8ff";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    this._wrapText(ctx, lines.join("  "), x + boxW * 0.5, y + 16, boxW - 28, 22);
    ctx.restore();
  }

  _drawFigure(ctx) {
    const P = this.current;
    if (!P) return;

    const W = this.game.canvas.width;
    const H = this.game.canvas.height;
    const cx = W * 0.5;
    const cy = H * 0.48;

    const radius = Math.min(W * 0.18, H * 0.24, 170);
    const pts = this._buildRegularPolygon(cx, cy, radius, P.n, -Math.PI / 2);

    // Polígono base
    ctx.fillStyle = "rgba(10, 18, 34, 0.4)";
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#e6efff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.stroke();

    // Referencias de vertices seleccionados.
    const iA = P.sideIndex % P.n;
    const iB = (iA + 1) % P.n;
    const iPrev = (iA - 1 + P.n) % P.n;
    const A = pts[iA];
    const B = pts[iB];
    const Prev = pts[iPrev];
    const O = { x: cx, y: cy };

    ctx.strokeStyle = "#ffe082";
    ctx.lineWidth = 5;
    if (P.type === "interior") {
      ctx.beginPath();
      ctx.moveTo(Prev.x, Prev.y);
      ctx.lineTo(A.x, A.y);
      ctx.lineTo(B.x, B.y);
      ctx.stroke();

      this._drawPoint(ctx, A.x, A.y, 4, "#ffe082");
      ctx.font = "17px Arial";
      ctx.fillStyle = "#dbe9ff";
      ctx.textAlign = "center";
      this._strokeText(ctx, "A", A.x, A.y - 18);
    } else {
      ctx.beginPath();
      ctx.moveTo(A.x, A.y);
      ctx.lineTo(B.x, B.y);
      ctx.stroke();

      // Radios a vertices para el triangulo OAB.
      ctx.strokeStyle = "rgba(122,167,255,0.95)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(O.x, O.y);
      ctx.lineTo(A.x, A.y);
      ctx.moveTo(O.x, O.y);
      ctx.lineTo(B.x, B.y);
      ctx.stroke();

      this._drawPoint(ctx, O.x, O.y, 5, "#ffffff");
      this._drawPoint(ctx, A.x, A.y, 4, "#ffe082");
      this._drawPoint(ctx, B.x, B.y, 4, "#ffe082");

      // Etiquetas de referencia.
      ctx.font = "17px Arial";
      ctx.fillStyle = "#dbe9ff";
      ctx.textAlign = "center";
      this._strokeText(ctx, "O", O.x, O.y - 14);
      this._strokeText(ctx, "A", A.x, A.y - 18);
      this._strokeText(ctx, "B", B.x, B.y - 18);
    }

    // Ángulo consultado.
    if (P.type === "interior") {

      const next = pts[(iA + 1) % P.n];
      const a1 = this._angleOf(A, Prev);
      const a2 = this._angleOf(A, next);
      this._drawAngleSlice(ctx, A, a1, a2, 52, "hsla(342,88%,62%,0.22)", "hsla(342,92%,72%,0.94)");
      this._angleLabel(ctx, A, a1, a2, "x°", 78);
    } else if (P.type === "triangle_center") {
      const a1 = this._angleOf(O, A);
      const a2 = this._angleOf(O, B);
      this._drawAngleSlice(ctx, O, a1, a2, 52, "hsla(342,88%,62%,0.22)", "hsla(342,92%,72%,0.94)");
      this._angleLabel(ctx, O, a1, a2, "x°", 78);
    } else {
      const a1 = this._angleOf(A, O);
      const a2 = this._angleOf(A, B);
      this._drawAngleSlice(ctx, A, a1, a2, 52, "hsla(342,88%,62%,0.22)", "hsla(342,92%,72%,0.94)");
      this._angleLabel(ctx, A, a1, a2, "x°", 78);
    }
  }

  _drawAnswerInput(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;
    const boxW = Math.min(420, W * 0.56);
    const boxH = 58;
    const x = (W - boxW) * 0.5;
    const y = H * 0.78;

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "#ffffff";
    ctx.font = "18px Arial";
    ctx.fillText("Escribe el valor de x y pulsa ENTER", W * 0.5, y - 28);

    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(x, y, boxW, boxH);
    ctx.strokeStyle = "rgba(122,167,255,0.8)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, boxW, boxH);

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
  // HELPERS
  // =======================================================
  _randInt(a, b) {
    return a + Math.floor(Math.random() * (b - a + 1));
  }

  _pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  _isPointInRect(px, py, r) {
    if (!r) return false;
    return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
  }

  _angleOf(P, Q) {
    return Math.atan2(Q.y - P.y, Q.x - P.x);
  }

  _buildRegularPolygon(cx, cy, r, n, startAngle) {
    const pts = [];
    const step = (Math.PI * 2) / n;
    for (let i = 0; i < n; i++) {
      const a = startAngle + step * i;
      pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
    }
    return pts;
  }

  _drawPoint(ctx, x, y, radius, fill) {
    ctx.save();
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    if (!text) return;
    const words = String(text).split(" ");
    let line = "";
    let yy = y;

    ctx.textBaseline = "top";
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + " ";
      const testWidth = ctx.measureText(testLine).width;
      if (testWidth > maxWidth && i > 0) {
        ctx.fillText(line.trim(), x, yy);
        line = words[i] + " ";
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

window.PoligonosScene = PoligonosScene;






