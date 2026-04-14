// js/areas/geometria/niveles/areasScene.js
// ===========================================================
// AreasScene - "Areas y perimetros"
// 3 problemas por corrida:
//  - Ronda 1: perímetro.
//  - Ronda 2: área.
//  - Ronda 3: mixta (pide área y perímetro de la misma figura).
//
// Respuesta: escribir el valor numerico solicitado y enviar con ENTER.
// Estructura/UI alineada con escenas previas.
// ===========================================================

class AreasScene extends Scene {
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
    this.answerInput = "";
    this.answerFeedback = "";
    this.showGuideTips = false;
    this.guideTipsUsed = false;
    this._guideToggleRect = null;
    this.questionTimeLimit = options.questionTimeLimit ?? 120;
    this.questionTimeLeft = this.questionTimeLimit;

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
    this.showGuideTips = false;
    this.guideTipsUsed = false;
    this._guideToggleRect = null;
    this.questionTimeLeft = this.questionTimeLimit;
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
        this.errors++;
        this.playSfx(this.sfxWrong, { volume: 0.7 });
        this.answerInput = "";
        this.answerFeedback = "Se acabo el tiempo para esta ronda.";

        if (this.errors >= this.maxErrors) {
          this._finishGame(true);
        } else {
          this.questionTimeLeft = this.questionTimeLimit;
        }
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
      mouseJustPressed &&
      !this.guideTipsUsed &&
      this._isPointInRect(mouse.x, mouse.y, this._guideToggleRect)
    ) {
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
    if (this.answerInput.length >= 4) return;
    if (this.answerInput === "0") this.answerInput = d;
    else this.answerInput += d;
    this.answerFeedback = "";
  }

  _submitAnswer() {
    if (!this.current) return;
    if (!this.answerInput.trim()) {
        this.answerFeedback = "Escribe el valor solicitado.";
      return;
    }

    const chosen = Number.parseInt(this.answerInput, 10);
    if (!Number.isFinite(chosen)) {
      this.answerFeedback = "Valor invalido.";
      return;
    }

    const expected = this.current?.answerSteps?.[this.current.answerStepIndex || 0];
    const answerValue = expected?.value ?? this.current.answerValue;

    if (chosen === answerValue) {
      this.playSfx(this.sfxCorrect, { volume: 0.6 });

      if (this.current?.measureKind === "mixed") {
        const nextStep = (this.current.answerStepIndex || 0) + 1;
        if (nextStep < (this.current.answerSteps?.length || 0)) {
          this.current.answerStepIndex = nextStep;
          this.answerInput = "";
          this.answerFeedback = "Bien. Ahora calcula la otra medida.";
          return;
        }
      }

      if (this.problemIndex + 1 >= this.totalProblems) {
        this._finishGame(false);
      } else {
        this.problemIndex++;
        this._setCurrentProblem(this.problemIndex);
      }
      return;
    }

    this.errors++;
    this.playSfx(this.sfxWrong, { volume: 0.7 });
    this.answerInput = "";
    this.answerFeedback = "Respuesta incorrecta. Intenta otra vez.";

    if (this.errors >= this.maxErrors) {
      this._finishGame(true);
    }
  }

  // =======================================================
  // PROBLEMAS
  // =======================================================
  _buildRunProblems() {
    return [
      this._genPerimeterProblem(5),
      this._genAreaProblem(6),
      this._genMixedProblem(),
    ];
  }

  _setCurrentProblem(index) {
    this.current = this.problems[index] || null;
    if (this.current && this.current.measureKind === "mixed") {
      this.current.answerStepIndex = 0;
    }
    this.answerInput = "";
    this.answerFeedback = "";
    this.showGuideTips = false;
    this.questionTimeLeft = this.questionTimeLimit;
  }

  _pickPythagoreanPair() {
    const pairs = [
      { r: 3, hs: 4, diag: 5 },
      { r: 6, hs: 8, diag: 10 },
      { r: 5, hs: 12, diag: 13 },
    ];
    return pairs[this._randInt(0, pairs.length - 1)];
  }

  _genPerimeterProblem(vertexCount = 5, mixed = false) {
    const tri = this._pickPythagoreanPair();

    if (vertexCount === 6) {
      const w = this._randInt(4, 8);
      const seg = this._randInt(2, 6);
      const drop = this._randInt(2, 6);
      const h = tri.hs + drop;
      const top = w + seg;
      const base = top + tri.r;
      const perimeter = base + tri.diag + seg + drop + w + h;

      return {
        type: "composite",
        measureKind: "perimeter",
        prompt: mixed
          ? "Ronda mixta: calcula el perímetro total de la figura."
          : "Calcula el perímetro total de la figura compuesta.",
        guideTip: "Suma los lados del contorno. Si lo necesitas, identifica primero el triángulo rectángulo.",
        answerValue: perimeter,
        answerPrefix: "P",
        answerTitle: "Escribe el perímetro total y pulsa ENTER",
        dims: { variant: 6, w, seg, r: tri.r, hs: tri.hs, diag: tri.diag, drop, h, top, base },
        givenText: "Medidas dadas en unidades.",
      };
    }

    const top = this._randInt(7, 12);
    const drop = this._randInt(2, 6);
    const h = tri.hs + drop;
    const base = top + tri.r;
    const perimeter = base + tri.diag + drop + top + h;

    return {
      type: "composite",
      measureKind: "perimeter",
      prompt: mixed
        ? "Ronda mixta: calcula el perímetro total de la figura."
        : "Calcula el perímetro total de la figura compuesta.",
      guideTip: "Recorre solo el borde exterior. El lado inclinado pertenece a un triángulo rectángulo.",
      answerValue: perimeter,
      answerPrefix: "P",
      answerTitle: "Escribe el perímetro total y pulsa ENTER",
      dims: { variant: 5, top, hs: tri.hs, diag: tri.diag, drop, r: tri.r, h, base },
      givenText: "Medidas dadas en unidades.",
    };
  }

  _genAreaProblem(vertexCount = 5, mixed = false) {
    if (vertexCount === 6) {
      let w;
      let seg;
      let r;
      let hs;
      let drop;
      let h;
      let top;
      let base;
      let area;

      do {
        w = this._randInt(4, 8);
        seg = this._randInt(2, 5);
        r = this._randInt(2, 5);
        hs = this._randInt(3, 6);
        drop = this._randInt(2, 4);
        h = hs + drop;
        top = w + seg;
        base = top + r;
        area = w * h + seg * hs + (r * hs) / 2;
      } while ((r * hs) % 2 !== 0 || area > 130);

      return {
        type: "composite",
        measureKind: "area",
        prompt: mixed
          ? "Ronda mixta: calcula el área total de la figura."
          : "Calcula el área total de la figura compuesta.",
        guideTip: "Divide la figura en rectángulos y triángulos rectángulos; luego suma las áreas parciales.",
        answerValue: area,
        answerPrefix: "A",
        answerTitle: "Escribe el área total y pulsa ENTER",
        dims: { variant: 6, w, seg, r, hs, drop, h, top, base },
        givenText: "Medidas dadas en unidades.",
      };
    }

    let top;
    let r;
    let hs;
    let drop;
    let h;
    let base;
    let area;

    do {
      top = this._randInt(7, 11);
      r = this._randInt(2, 5);
      hs = this._randInt(3, 6);
      drop = this._randInt(2, 4);
      h = hs + drop;
      base = top + r;
      area = top * h + (r * hs) / 2;
    } while ((r * hs) % 2 !== 0 || area > 130);

    return {
      type: "composite",
      measureKind: "area",
      prompt: mixed
        ? "Ronda mixta: calcula el área total de la figura."
        : "Calcula el área total de la figura compuesta.",
      guideTip: "Divide la figura en rectángulos y triángulos rectángulos; luego suma las áreas parciales.",
      answerValue: area,
      answerPrefix: "A",
      answerTitle: "Escribe el área total y pulsa ENTER",
      dims: { variant: 5, top, hs, drop, r, h, base },
      givenText: "Medidas dadas en unidades.",
    };
  }

  _genMixedProblem() {
    const variant = this._pick([5, 6]);
    const perimeterProblem = this._genPerimeterProblem(variant, true);
    const areaValue = this._computeAreaFromDims(perimeterProblem.dims);
    const startsWithArea = this._pick([true, false]);
    const steps = startsWithArea
      ? [
          { kind: "area", value: areaValue, prefix: "A", title: "Escribe el área total y pulsa ENTER" },
          { kind: "perimeter", value: perimeterProblem.answerValue, prefix: "P", title: "Ahora escribe el perímetro total y pulsa ENTER" },
        ]
      : [
          { kind: "perimeter", value: perimeterProblem.answerValue, prefix: "P", title: "Escribe el perímetro total y pulsa ENTER" },
          { kind: "area", value: areaValue, prefix: "A", title: "Ahora escribe el área total y pulsa ENTER" },
        ];

    return {
      type: "composite",
      measureKind: "mixed",
      prompt: "Ronda mixta: calcula el área y el perímetro de la misma figura.",
      guideTip: "Usa la misma descomposición para obtener el área y el mismo contorno para reunir el perímetro.",
      answerSteps: steps,
      answerStepIndex: 0,
      dims: perimeterProblem.dims,
      givenText: "Medidas dadas en unidades.",
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

    const solvedProblems = this.problemIndex + (failed ? 0 : 1);
    const tier = solvedProblems >= this.totalProblems ? 2 : solvedProblems >= 2 ? 1 : 0;
    let gained = 0;
    if (window.MN_reportMinigameTier) {
      gained = window.MN_reportMinigameTier("areas", tier);
    }
    this.sheetsReward = gained;

    if (this.win) {
      this.message =
        "¡Bien!\n" +
        "Resolviste problemas de áreas y perímetros.\n" +
        `Aciertos: ${solvedProblems}/${this.totalProblems}\n` +
        `Errores: ${this.errors}/${this.maxErrors}\n` +
        `Hojas ganadas: ${gained}.`;
      this.playSfx(this.sfxWin, { volume: 0.7 });
    } else {
      this.message =
        "Te falto un poco...\n" +
        "Vuelve a intentarlo.\n" +
        `Aciertos: ${solvedProblems}/${this.totalProblems}\n` +
        `Errores: ${this.errors}/${this.maxErrors}\n` +
        `Hojas ganadas: ${gained}.`;
      this.playSfx(this.sfxLose, { volume: 0.7 });
    }

      this.game?.events?.emit?.("areas_done", {
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
    const bg = this.game.assets?.getImage?.("bg_topografo_huerto")
      || this.game.assets?.getImage?.("bg_huerto");

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
      if (!this.guideTipsUsed) this._drawGuideToggle(ctx);
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
    ctx.fillRect(16, 12, 402, 44);
    ctx.strokeStyle = "#7aa7ff";
    ctx.lineWidth = 2;
    ctx.strokeRect(16, 12, 402, 44);

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
    ctx.fillStyle = secondsLeft <= 20 ? "#ffd36b" : "#ffffff";
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

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "#ffffff";
    ctx.font = "34px Arial";
    ctx.fillText("Áreas y perímetros", W / 2, H * 0.28);

    ctx.font = "18px Arial";
    ctx.fillStyle = "#d8e6ff";
    ctx.fillText("Resuelve 3 problemas para ganar.", W / 2, H * 0.40);
    ctx.fillText("Rondas: perímetro, área y una ronda mixta.", W / 2, H * 0.46);
    ctx.fillText("Tienes 120 segundos por ronda.", W / 2, H * 0.52);
    ctx.fillText("Observa la figura y escribe el valor solicitado.", W / 2, H * 0.58);

    ctx.fillStyle = "#ffffff";
    ctx.fillText("Pulsa ENTER o ESPACIO para comenzar.", W / 2, H * 0.70);
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
    const W = this.game.canvas.width;
    const x = W - 180;
    const y = 72;
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
    ctx.fillText("Mostrar tip", x + w * 0.5, y + h * 0.5);
    ctx.restore();
  }

  _drawGuidePanel(ctx) {
    const tip = this.current?.guideTip;
    if (!tip) return;

    const W = this.game.canvas.width;
    const boxW = Math.min(720, W * 0.84);
    const x = (W - boxW) * 0.5;
    const y = 172;
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
    this._wrapText(ctx, tip, x + boxW * 0.5, y + 14, boxW - 24, 22);
    ctx.restore();
  }

  _drawFigure(ctx) {
    const P = this.current;
    if (!P) return;

    this._drawCompositeFigure(ctx, P);
  }

  _drawCompositeFigure(ctx, problem) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;
    const d = problem?.dims || { variant: 5, top: 10, hs: 4, drop: 3, r: 4, h: 7, base: 14 };

    const U =
      d.variant === 6
        ? [
            [0, 0],
            [d.base, 0],
            [d.top, d.hs],
            [d.w, d.hs],
            [d.w, d.h],
            [0, d.h],
          ]
        : [
            [0, 0],
            [d.base, 0],
            [d.top, d.hs],
            [d.top, d.h],
            [0, d.h],
          ];

    const us = U.map((p) => p[0]);
    const vs = U.map((p) => p[1]);
    const minU = Math.min(...us);
    const maxU = Math.max(...us);
    const minV = Math.min(...vs);
    const maxV = Math.max(...vs);
    const shapeWUnits = Math.max(1, maxU - minU);
    const shapeHUnits = Math.max(1, maxV - minV);

    // Zona central para que la figura no invada HUD/titulo/input.
    const drawZone = {
      x: W * 0.10,
      y: H * 0.30,
      w: W * 0.80,
      h: H * 0.37,
    };

    const unit = Math.min(drawZone.w / shapeWUnits, drawZone.h / shapeHUnits);
    const drawW = shapeWUnits * unit;
    const drawH = shapeHUnits * unit;
    const ox = drawZone.x + (drawZone.w - drawW) * 0.5;
    const oy = drawZone.y + (drawZone.h - drawH) * 0.5;
    const toScreen = (u, v) => ({
      x: ox + (u - minU) * unit,
      y: oy + drawH - (v - minV) * unit,
    });
    const P = U.map(([u, v]) => toScreen(u, v));

    ctx.strokeStyle = "#e6efff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(P[0].x, P[0].y);
    for (let i = 1; i < P.length; i++) ctx.lineTo(P[i].x, P[i].y);
    ctx.closePath();
    ctx.stroke();

    ctx.font = "18px Arial";
    ctx.fillStyle = "#d9e8ff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (this.showGuideTips) {
      this._strokeText(ctx, String(d.hs), P[2].x + 22, (P[2].y + P[1].y) * 0.5);
      this._strokeText(ctx, String(d.r), (P[1].x + P[2].x) * 0.5, P[1].y - 18);

      const auxX = P[2].x;
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.setLineDash([7, 6]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(auxX, P[2].y);
      ctx.lineTo(auxX, P[1].y);
      ctx.stroke();
      ctx.restore();
    }

    // Etiquetas de medidas.
    this._strokeText(ctx, String(d.base), (P[0].x + P[1].x) * 0.5, P[0].y + 26);
    this._strokeText(ctx, String(d.h), P[0].x - 20, (P[0].y + P[P.length - 1].y) * 0.5);

    if (d.variant === 6) {
      this._strokeText(ctx, String(d.w), (P[5].x + P[4].x) * 0.5, P[5].y - 16);
      this._strokeText(ctx, String(d.seg), (P[3].x + P[2].x) * 0.5, P[3].y - 16);
      this._strokeText(ctx, String(d.drop), P[4].x + 18, (P[4].y + P[3].y) * 0.5);
    } else {
      this._strokeText(ctx, String(d.top), (P[4].x + P[3].x) * 0.5, P[4].y - 16);
      this._strokeText(ctx, String(d.drop), P[3].x + 18, (P[3].y + P[2].y) * 0.5);
    }

    const currentStep = problem?.measureKind === "mixed"
      ? problem?.answerSteps?.[problem?.answerStepIndex || 0]
      : null;
    const mark =
      problem?.measureKind === "perimeter"
        ? "P = ?"
        : problem?.measureKind === "area"
          ? "A = ?"
          : `${currentStep?.prefix || "?"} = ?`;
    this._strokeText(ctx, mark, W * 0.5, oy + drawH * 0.56);
  }

  _drawAnswerInput(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;
    const boxW = Math.min(420, W * 0.56);
    const boxH = 58;
    const x = (W - boxW) * 0.5;
    const y = H * 0.80;

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "#ffffff";
    ctx.font = "18px Arial";
    const currentStep = this.current?.measureKind === "mixed"
      ? this.current?.answerSteps?.[this.current?.answerStepIndex || 0]
      : null;
    ctx.fillText(
      currentStep?.title || this.current?.answerTitle || "Escribe el valor y pulsa ENTER",
      W * 0.5,
      y - 28,
    );

    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(x, y, boxW, boxH);
    ctx.strokeStyle = "rgba(122,167,255,0.8)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, boxW, boxH);

    const blinkOn = Math.floor(Date.now() / 450) % 2 === 0;
    const caret = blinkOn ? "|" : " ";
    const prefix = currentStep?.prefix || this.current?.answerPrefix || "x";
    const text = this.answerInput ? `${prefix} = ${this.answerInput}${caret}` : `${prefix} = ${caret}`;
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

  _computeAreaFromDims(d) {
    if (!d) return 0;
    if (d.variant === 6) {
      return d.w * d.h + d.seg * d.hs + (d.r * d.hs) / 2;
    }
    return d.top * d.h + (d.r * d.hs) / 2;
  }

  _pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  _isPointInRect(px, py, r) {
    if (!r) return false;
    return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
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
}

window.AreasScene = AreasScene;



