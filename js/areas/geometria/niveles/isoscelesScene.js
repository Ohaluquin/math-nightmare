// js/areas/geometria/niveles/isoscelesScene.js
// ===========================================================
// IsoscelesScene - "Triángulo Isósceles"
// 3 problemas por corrida:
//  - Triángulo isósceles con un lado extendido (4 ángulos: A,B,C y exterior E)
//  - Se da 1 ángulo al azar y se piden los otros 3 (x, y, z)
//
// Respuesta: tres campos numéricos (x, y, z) y ENTER para enviar.
// Estructura/UI alineada con AngulosScene / AngulosEcuacionesScene.
// ===========================================================

class IsoscelesScene extends Scene {
  constructor(game, options = {}) {
    super(game);

    // ----------------- Estado general -----------------
    this.state = "intro";
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

    // ----------------- Problema actual -----------------
    this.current = null;
    this.answerInputs = { x: "", y: "", z: "" };
    this.answerStatus = { x: null, y: null, z: null }; // null | true | false
    this.activeVar = "x";
    this.answerFeedback = "";
    this.inputRects = {};
    this.questionTimeLimit = options.questionTimeLimit ?? 60;
    this.questionTimeLeft = this.questionTimeLimit;

    // Tips
    this.showGuideTips = false;
    this.guideTipsUsed = false;
    this._guideToggleRect = null;

    // ----------------- Input edge tracking -----------------
    this._prevKeys = {
      Enter: false,
      " ": false,
      Backspace: false,
      Tab: false,
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

    // Sonidos
    this.sfxCorrect = options.sfxCorrect ?? "sfx_match";
    this.sfxWrong = options.sfxWrong ?? "sfx_error";
    this.sfxWin = options.sfxWin ?? "sfx_win";
    this.sfxLose = options.sfxLose ?? "sfx_loose";
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
        this._registerMistake("Se agotó el tiempo para este triángulo.");
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

    if (mouseJustPressed) {
      if (!this.guideTipsUsed && this._isPointInRect(mouse.x, mouse.y, this._guideToggleRect)) {
        this.showGuideTips = true;
        this.guideTipsUsed = true;
      }

      for (const v of ["x", "y", "z"]) {
        if (this._isPointInRect(mouse.x, mouse.y, this.inputRects[v])) {
          this.activeVar = v;
          break;
        }
      }
    }

    for (let d = 0; d <= 9; d++) {
      if (isJustPressed(String(d)) || isJustPressed(`Numpad${d}`)) {
        this._appendDigit(this.activeVar, String(d));
      }
    }

    if (isJustPressed("Backspace")) {
      this.answerInputs[this.activeVar] = this.answerInputs[this.activeVar].slice(0, -1);
      this.answerStatus[this.activeVar] = null;
      this.answerFeedback = "";
    }

    if (isJustPressed("Tab")) {
      this._cycleActiveVar();
    }

    if (isJustPressed("Enter")) {
      this._submitAnswers();
    }

    this._prevMouseDown = mouse.down;
  }

  _appendDigit(v, d) {
    const curr = this.answerInputs[v] || "";
    if (curr.length >= 3) return;
    this.answerInputs[v] = curr === "0" ? d : curr + d;
    this.answerStatus[v] = null;
    this.answerFeedback = "";
  }

  _cycleActiveVar() {
    if (this.activeVar === "x") this.activeVar = "y";
    else if (this.activeVar === "y") this.activeVar = "z";
    else this.activeVar = "x";
  }

  _submitAnswers() {
    if (!this.current) return;

    const required = ["x", "y", "z"];
    for (const v of required) {
      if (!String(this.answerInputs[v] || "").trim()) {
        this.answerFeedback = "Completa x, y y z.";
        this.activeVar = v;
        return;
      }
    }

    const parsed = {};
    for (const v of required) {
      const n = Number.parseInt(this.answerInputs[v], 10);
      if (!Number.isFinite(n)) {
        this.answerFeedback = "Valor inválido.";
        this.activeVar = v;
        return;
      }
      parsed[v] = n;
    }

    const ans = this.current.answers;
    for (const v of required) {
      this.answerStatus[v] = parsed[v] === ans[v];
    }
    const ok = required.every((v) => this.answerStatus[v] === true);

    if (ok) {
      this.playSfx(this.sfxCorrect, { volume: 0.6 });
      if (this.problemIndex + 1 >= this.totalProblems) {
        this._finishGame(false);
      } else {
        this.problemIndex++;
        this._setCurrentProblem(this.problemIndex);
      }
      return;
    }

    const good = required.filter((v) => this.answerStatus[v]);
    const bad = required.filter((v) => !this.answerStatus[v]);
    const goodTxt = good.length ? `Correctas: ${good.join(", ")}.` : "";
    const badTxt = bad.length ? ` Revisa: ${bad.join(", ")}.` : "";
    this._registerMistake(`${goodTxt}${badTxt}`.trim());
  }

  // =======================================================
  // PROBLEMAS
  // =======================================================
  _buildRunProblems() {
    const givenOrder = this._shuffle(["A", "B", "C", "E"]).slice(0, 3);
    return givenOrder.map((k) => this._genIsoscelesProblem(k));
  }

  _setCurrentProblem(index) {
    this.current = this.problems[index] || null;
    this.answerInputs = { x: "", y: "", z: "" };
    this.answerStatus = { x: null, y: null, z: null };
    this.activeVar = "x";
    this.answerFeedback = "";
    this.inputRects = {};
    this.questionTimeLeft = this.questionTimeLimit;
    this.showGuideTips = false;
  }

  _registerMistake(message) {
    this.errors++;
    this.playSfx(this.sfxWrong, { volume: 0.7 });
    this.answerFeedback = message;
    this.answerStatus = { ...this.answerStatus };

    if (this.errors >= this.maxErrors) {
      this._finishGame(true);
      return;
    }

    this.questionTimeLeft = this.questionTimeLimit;
  }

  _genIsoscelesProblem(givenKey) {
    // Convención:
    // - Lado extendido siempre es BC (horizontal), con exterior E en C.
    // Casos:
    // 1) AB = AC  -> B = C (iguales en la base)
    // 2) BC = AC  -> C distinto (junto al exterior), A = B
    // 3) BC = AB  -> B distinto, A = C (C igual y junto al exterior)
    const caseType = this._pick([1, 2, 3]);
    const angles = this._buildCaseAngles(caseType);

    const allKeys = ["A", "B", "C", "E"];
    const unknownKeys = allKeys.filter((k) => k !== givenKey);

    const vars = ["x", "y", "z"];
    const labels = {};
    const answers = {};

    labels[givenKey] = `${angles[givenKey]}°`;
    for (let i = 0; i < unknownKeys.length; i++) {
      const key = unknownKeys[i];
      const v = vars[i];
      labels[key] = `${v}°`;
      answers[v] = angles[key];
    }

    return {
      type: "isosceles_extended",
      prompt: "Se da un ángulo. Calcula x, y y z.",
      guideTip:
        "En un triángulo isósceles, los ángulos opuestos a los lados iguales son iguales.",
      givenKey,
      angles,
      labels,
      answers,
      caseType,
    };
  }

  // =======================================================
  // FIN
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
      gained = window.MN_reportMinigameTier("isosceles", tier);
    }
    this.sheetsReward = gained;

    if (this.win) {
      this.message =
        "¡Bien!\n" +
        "Resolviste triángulos isósceles con lado extendido.\n" +
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

    this.game?.events?.emit?.("isosceles_done", {
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
    const bg = this.game.assets?.getImage?.("bg_isosceles_reto");

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

    ctx.fillStyle = "rgba(0,0,0,0.35)";
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
      this._drawAnswerInputs(ctx);
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
    ctx.fillText("Triángulo Isósceles", W / 2, H * 0.27);

    ctx.font = "18px Arial";
    ctx.fillStyle = "#d8e6ff";
    ctx.fillText("En cada figura se da 1 ángulo y debes calcular 3.", W / 2, H * 0.40);
    ctx.fillText("Responde x, y, z y pulsa ENTER.", W / 2, H * 0.46);
    ctx.fillText("Tips opcionales con el botón superior.", W / 2, H * 0.52);

    ctx.fillStyle = "#ffffff";
    ctx.fillText("Pulsa ENTER o ESPACIO para comenzar.", W / 2, H * 0.64);
    ctx.restore();
  }

  _drawPrompt(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    ctx.save();
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = "22px Arial";
    this._wrapText(ctx, this.current?.prompt || "", W / 2, H * 0.12, W * 0.86, 26);
    ctx.restore();
  }

  _drawGuideToggle(ctx) {
    if (this.guideTipsUsed) {
      this._guideToggleRect = null;
      return;
    }

    const W = this.game.canvas.width;
    const x = W - 180;
    const y = 104;
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
    ctx.fillText("Mostrar tips", x + w * 0.5, y + h * 0.5);
    ctx.restore();
  }

  _drawGuidePanel(ctx) {
    const tip = this.current?.guideTip;
    if (!tip) return;

    const W = this.game.canvas.width;
    const boxW = Math.min(700, W * 0.8);
    const x = (W - boxW) * 0.5;
    const y = 152;
    const h = 58;

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
    this._wrapText(ctx, tip, x + boxW * 0.5, y + 14, boxW - 26, 22);
    ctx.restore();
  }

  _drawFigure(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;
    const cx = W * 0.5;
    const cy = H * 0.45;
    const P = this.current;
    if (!P) return;

    const pts = this._buildIsoscelesPoints(cx, cy, P);
    const { A, B, C, D } = pts;

    // Triángulo + extensión
    ctx.strokeStyle = "#e6efff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
    ctx.lineTo(C.x, C.y);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(C.x, C.y);
    ctx.lineTo(D.x, D.y);
    ctx.stroke();

    // Marcas de congruencia según el caso.
    if (P.caseType === 1) {
      this._drawEqualSideMark(ctx, A, B, 0.5, 11);
      this._drawEqualSideMark(ctx, A, C, 0.5, 11);
    } else if (P.caseType === 2) {
      this._drawEqualSideMark(ctx, B, C, 0.45, 11);
      this._drawEqualSideMark(ctx, A, C, 0.55, 11);
    } else {
      this._drawEqualSideMark(ctx, B, C, 0.55, 11);
      this._drawEqualSideMark(ctx, A, B, 0.45, 11);
    }

    // Ángulos: A, B, C y exterior E (en C con CD)
    const aAB = this._angleOf(A, B);
    const aAC = this._angleOf(A, C);
    const aBA = this._angleOf(B, A);
    const aBC = this._angleOf(B, C);
    const aCB = this._angleOf(C, B);
    const aCA = this._angleOf(C, A);
    const aCD = this._angleOf(C, D);

    this._drawLabeledAngle(ctx, A, aAB, aAC, P.labels.A, P.givenKey === "A", 52, 84);
    this._drawLabeledAngle(ctx, B, aBC, aBA, P.labels.B, P.givenKey === "B", 50, 82);
    this._drawLabeledAngle(ctx, C, aCB, aCA, P.labels.C, P.givenKey === "C", 50, 82);
    this._drawLabeledAngle(ctx, C, aCA, aCD, P.labels.E, P.givenKey === "E", 68, 102);

    // Punto central en C para claridad visual exterior
    ctx.fillStyle = "#e6efff";
    ctx.beginPath();
    ctx.arc(C.x, C.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawLabeledAngle(ctx, O, start, end, text, isGiven, radius, labelRadius) {
    const fill = isGiven ? "hsla(68,88%,62%,0.24)" : "hsla(342,88%,62%,0.22)";
    const stroke = isGiven ? "hsla(68,92%,72%,0.96)" : "hsla(342,92%,72%,0.94)";
    this._drawAngleSlice(ctx, O, start, end, radius, fill, stroke);

    ctx.font = "20px Arial";
    ctx.fillStyle = "#ffe082";
    ctx.textAlign = "center";
    this._angleLabel(ctx, O, start, end, text, labelRadius);
  }

  _drawAnswerInputs(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    const boxW = Math.min(180, W * 0.23);
    const boxH = 58;
    const gap = 18;
    const totalW = boxW * 3 + gap * 2;
    const startX = (W - totalW) * 0.5;
    const y = H * 0.76;

    this.inputRects = {
      x: { x: startX, y, w: boxW, h: boxH },
      y: { x: startX + boxW + gap, y, w: boxW, h: boxH },
      z: { x: startX + (boxW + gap) * 2, y, w: boxW, h: boxH },
    };

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "#ffffff";
    ctx.font = "18px Arial";
    ctx.fillText("Completa x, y, z y pulsa ENTER", W * 0.5, y - 28);

    const drawBox = (v) => {
      const r = this.inputRects[v];
      const active = this.activeVar === v;
      const status = this.answerStatus[v];
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(r.x, r.y, r.w, r.h);
      if (status === true) ctx.strokeStyle = "#8dff9e";
      else if (status === false) ctx.strokeStyle = "#ff9fa0";
      else ctx.strokeStyle = active ? "#ffffff" : "rgba(122,167,255,0.85)";
      ctx.lineWidth = active ? 2.5 : 2;
      ctx.strokeRect(r.x, r.y, r.w, r.h);

      const blinkOn = Math.floor(Date.now() / 450) % 2 === 0;
      const caret = active && blinkOn ? "|" : "";
      const val = this.answerInputs[v] || "";
      const label = `${v} = ${val}${caret}`;

      ctx.font = "30px Arial";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(label, r.x + r.w * 0.5, r.y + r.h * 0.5);
    };

    drawBox("x");
    drawBox("y");
    drawBox("z");

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

  _angleOf(P, Q) {
    return Math.atan2(Q.y - P.y, Q.x - P.x);
  }

  _buildIsoscelesPoints(cx, cy, P) {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const caseType = P.caseType || 1;
    const L = 340;

    // BC es siempre horizontal (lado extendido).
    let B = { x: cx - L / 2, y: cy + 118 };
    let C = { x: cx + L / 2, y: cy + 118 };
    let A = { x: cx, y: cy - 150 };

    if (caseType === 1) {
      // AB = AC, base BC.
      const beta = toRad(P.angles.B);
      const h = (L * 0.5) * Math.tan(beta);
      A = { x: cx, y: B.y - h };
    } else if (caseType === 2) {
      // BC = AC, vértice distinto en C.
      const alpha = toRad(P.angles.C);
      A = {
        x: C.x - Math.cos(alpha) * L,
        y: C.y - Math.sin(alpha) * L,
      };
    } else {
      // BC = AB, vértice distinto en B.
      const alpha = toRad(P.angles.B);
      A = {
        x: B.x + Math.cos(alpha) * L,
        y: B.y - Math.sin(alpha) * L,
      };
    }

    // Extensión horizontal desde C.
    let D = { x: C.x + 150, y: C.y };

    // Reencuadre para mantener la figura clara.
    const minX = Math.min(A.x, B.x, C.x, D.x);
    const maxX = Math.max(A.x, B.x, C.x, D.x);
    const minY = Math.min(A.y, B.y, C.y, D.y);
    const maxY = Math.max(A.y, B.y, C.y, D.y);
    const w = Math.max(1, maxX - minX);
    const h = Math.max(1, maxY - minY);
    const maxW = 500;
    const maxH = 300;
    const s = Math.min(maxW / w, maxH / h, 1.0);

    const center = { x: (minX + maxX) * 0.5, y: (minY + maxY) * 0.5 };
    const target = { x: cx, y: cy + 12 };
    const fit = (p) => ({
      x: target.x + (p.x - center.x) * s,
      y: target.y + (p.y - center.y) * s,
    });

    A = fit(A);
    B = fit(B);
    C = fit(C);
    D = fit(D);

    return { A, B, C, D };
  }

  _buildCaseAngles(caseType) {
    // Devuelve A,B,C,E como enteros según el caso.
    if (caseType === 1) {
      // B = C
      const beta = this._randInt(26, 56);
      return {
        A: 180 - 2 * beta,
        B: beta,
        C: beta,
        E: 180 - beta,
      };
    }

    if (caseType === 2) {
      // C distinto; A = B.
      let alpha = this._randInt(44, 104);
      if (alpha % 2 !== 0) alpha += 1;
      const beta = (180 - alpha) / 2;
      return {
        A: beta,
        B: beta,
        C: alpha,
        E: 180 - alpha,
      };
    }

    // caseType === 3
    // B distinto; A = C.
    let alpha = this._randInt(44, 104);
    if (alpha % 2 !== 0) alpha += 1;
    const beta = (180 - alpha) / 2;
    return {
      A: beta,
      B: alpha,
      C: beta,
      E: 180 - beta,
    };
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

  _drawEqualSideMark(ctx, P1, P2, t = 0.5, markLen = 10) {
    // Dibuja una pequeña línea perpendicular al lado para indicar igualdad.
    const mx = P1.x + (P2.x - P1.x) * t;
    const my = P1.y + (P2.y - P1.y) * t;
    const dx = P2.x - P1.x;
    const dy = P2.y - P1.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;

    ctx.save();
    ctx.strokeStyle = "#ffe082";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(mx - nx * markLen * 0.5, my - ny * markLen * 0.5);
    ctx.lineTo(mx + nx * markLen * 0.5, my + ny * markLen * 0.5);
    ctx.stroke();
    ctx.restore();
  }

  _angleLabel(ctx, O, start, end, text, radius) {
    let a1 = start;
    let a2 = end;
    const TAU = Math.PI * 2;
    let diff = (a2 - a1 + TAU) % TAU;
    if (diff > Math.PI) {
      [a1, a2] = [a2, a1];
      diff = TAU - diff;
    }
    const mid = a1 + diff * 0.5;
    this._strokeText(ctx, text, O.x + Math.cos(mid) * radius, O.y + Math.sin(mid) * radius);
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
}

window.IsoscelesScene = IsoscelesScene;





