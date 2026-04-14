// ===========================================================
// resolverEcuacionesScene.js  (v2 con "PrÃ¡ctica guiada")
// - Ãlgebra: balanceo con distribuciÃ³n por etapas
// - Modos: menÃº inicial => [PrÃ¡ctica guiada] o [Jugar]
// - La prÃ¡ctica guÃ­a con 1 ejemplo dirigido y es saltable.
// - Estados: menu | tutorial | playing | finished
//
// Acciones (modo juego):
//    1) Click en parÃ©ntesis principal => expande (sin multiplicar)
//    2) Click en parÃ©ntesis de producto => evalÃºa (multiplica)
//    3) Drag: solo eval. Combina semejantes al soltar sobre otro eval semejante
//    4) Drag cruzando "=" => mueve al otro lado (cambia signo)
//    5) Final: llega a kx = n (sin dividir automÃ¡tico) => pregunta valor de x
// - Vidas + tiempo, errores conceptuales restan vida
// ===========================================================

class ResolverEcuacionesScene extends Scene {
  constructor(game) {
    super(game);

    // estados: menu | tutorial | playing | finished
    this.state = "menu";
    this.bgImage = null;

    // gameplay

    this.maxLives = 2;
    // rondas (ecuaciones encadenadas)
    this.totalRounds = 3;
    this.roundIndex = 1; // 1..totalRounds

    this.lives = this.maxLives;
    this.roundIndex = 1;

    this.FONT_TERM = 30;
    this.FONT_HUD = 18;

    this.gameFinished = false;
    this.exitDelay = 0;
    this.win = false;
    this.message = "";
    this.sheetsReward = 0;

    // ecuaciÃ³n
    this.eq = null; // { left:[], right:[], solution:int }
    this.drag = null; // { term, fromSide, index, offsetX, offsetY, originX, originY }
    this.hoverTarget = null;

    // UI
    this.panelText = "";
    this.toast = "";
    this.toastT = 0;

    // layout
    this.eqY = 250;
    this.eqLeftX = 200;
    this.eqRightX = 560;
    this.eqMaxWidth = 420;
    this.eqGap = 10; // gap between terms

    // sfx (opcionales)
    this.sfxOk = "sfx_ok";
    this.sfxWrong = "sfx_error";
    this.sfxCorrect = "sfx_match";
    this.sfxWin = "sfx_win";
    this.sfxPage = "sfx_change_page";
    this.sfxGrayStep = "sfx_choque";
    this.sfxGrayTick = "sfx_steps";

    // presion "nightmare" por saltos
    this.graySteps = 3; // con 3 saltos se llega al gris total y se pierde 1 vida
    this.grayStepIndex = 0;
    this.grayJumpInterval = 9; // segundos entre saltos de gris
    this.grayJumpTimer = 0;
    this.grayJumpCueFractions = [1 / 3, 2 / 3];
    this.grayJumpCueIndex = 0;
    this.correctStreak = 0;
    this.correctStreakTarget = 5;
    this.shakeT = 0;
    this.shakeDur = 0.24;
    this.shakeMag = 9;

    // input edges
    this.prevMouseDown = false;
    this.prevStartDown = false;

    // respuesta final
    this.answerText = "";
    this.answerLocked = false; // por si luego quieres bloquear

    // tutorial
    this.tutorial = {
      step: 0,
      active: false,
      completed: false,
      pendingStartReal: false,
      pendingT: 0,
    };

    // botones (menu / tutorial)
    this._btnMenuPlay = null;
    this._btnMenuPractice = null;
    this._btnSkip = null;
  }

  // ---------- helpers ----------
  playSfx(key, options = {}) {
    if (!key) return;
    const a = this.game.assets;
    if (!a || typeof a.playSound !== "function") return;
    try {
      a.playSound(key, options);
    } catch (_) {}
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
      this.game.canvas.height,
    );

    const A = this.game.assets;
    this.bgImage = (A && A.getImage("bg_aljuarizmi")) || null;

    this.state = "menu";
    this.lives = this.maxLives;
    this.gameFinished = false;
    this.exitDelay = 0;
    this.win = false;
    this.message = "";
    this.sheetsReward = 0;

    this.toast = "";
    this.toastT = 0;

    this.answerText = "";
    this.answerLocked = false;

    this.tutorial.step = 0;
    this.tutorial.active = false;
    this.tutorial.completed = false;
    this.tutorial.pendingStartReal = false;
    this.tutorial.pendingT = 0;
    this._resetGrayStepProgress();

    // prepara ecuaciÃ³n para que se vea bonita desde el menÃº (random suave)
    this._newRound();
  }

  // ---------- equation generation ----------
  _randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  _pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // genera a + b(cx+d) = e(f+gx) + h con soluciÃ³n entera â€œbonitaâ€
  _generateNiceEquation() {
    const ks = [1, 2, 3];
    const k = this._pick(ks);

    const X = this._pick([-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6]);

    const b = this._pick([1, 2, 3, 4, 5, 6]);
    const c = this._pick([1, 2, 3, 4, 5, 6]);

    const bc = b * c;

    const sign = this._pick([1, -1]);
    const eg = bc - sign * k;

    let e = null,
      g = null;
    for (let tries = 0; tries < 80; tries++) {
      const ee = this._pick([1, 2, 3, 4, 5, 6]);
      if (eg % ee !== 0) continue;
      const gg = eg / ee;
      if (!Number.isFinite(gg)) continue;
      if (Math.abs(gg) < 1 || Math.abs(gg) > 8) continue;
      e = ee;
      g = gg;
      break;
    }
    if (e == null) {
      e = 1;
      g = eg;
    }

    const kSigned = bc - e * g;

    const d = this._pick([-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6]);
    const f = this._pick([-6, -4, -3, -2, -1, 1, 2, 3, 4, 6]);
    let a = this._pick([
      -10, -8, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 8, 10,
    ]);

    const target = kSigned * X;
    const leftConst = a + b * d;
    const rhsConstNeeded = target + leftConst;
    let h = rhsConstNeeded - e * f;

    return { a, b, c, d, e, f, g, h, kSigned, X };
  }

  _newRound() {
    const p = this._generateNiceEquation();

    const left = [];
    const right = [];

    if (p.a !== 0) left.push(this._termConst(p.a, true));
    left.push(this._termParenMain(p.b, { c: p.c, d: p.d }, "L"));

    right.push(this._termParenMain(p.e, { f: p.f, g: p.g }, "R"));
    if (p.h !== 0) right.push(this._termConst(p.h, true));

    this.eq = { left, right, solution: p.X };

    this.drag = null;
    this.hoverTarget = null;

    this.toast = "";
    this.toastT = 0;
  }

  // ---------- tutorial equation ----------
  _loadTutorialEquation() {
    // Ejemplo dirigido (simple) con soluciÃ³n entera:
    // 2 + 3(x + 1) = (4 + 2x)   => x = -1
    const left = [];
    const right = [];
    left.push(this._termConst(2, true));
    left.push(this._termParenMain(3, { c: 1, d: 1 }, "L"));
    right.push(this._termParenMain(1, { f: 4, g: 2 }, "R")); // 1(4+2x) para que el alumno vea el mismo patrÃ³n
    this.eq = { left, right, solution: -1 };

    this.drag = null;
    this.hoverTarget = null;
    this.answerText = "";
    this.answerLocked = false;

    // reset de vidas para prÃ¡ctica (mÃ¡s amable)
    this.lives = this.maxLives;
    this._resetGrayStepProgress();

    this.tutorial.step = 0;
    this.tutorial.active = true;
    this.tutorial.completed = false;
    this.tutorial.pendingStartReal = false;
    this.tutorial.pendingT = 0;

    this._setToast("Práctica: sigue las instrucciones (puedes saltar).", 1.4);
  }

  _startRealGameFresh() {
    this.tutorial.active = false;
    this.tutorial.completed = true;

    this.roundIndex = 1;
    this._newRound();
    this.lives = this.maxLives;
    this._resetGrayStepProgress();

    this.state = "playing";
    this._setToast("¡Ahora sí! Juego real.", 1.0);
    this.playSfx(this.sfxPage);
  }

  // ---------- term factories ----------
  _termConst(n, evaluated = true) {
    return {
      kind: "const",
      coef: n,
      var: null,
      raw: !evaluated,
      x: 0,
      y: 0,
      w: 0,
      h: 0,
    };
  }

  _termX(coef, evaluated = true) {
    return {
      kind: "x",
      coef,
      var: "x",
      raw: !evaluated,
      x: 0,
      y: 0,
      w: 0,
      h: 0,
    };
  }

  _termParenMain(outer, inner, sideHint) {
    return {
      kind: "mainParen",
      outer,
      inner,
      raw: true,
      sideHint,
      x: 0,
      y: 0,
      w: 0,
      h: 0,
    };
  }

  _termParenProd(outer, innerTerm) {
    return {
      kind: "prodParen",
      outer,
      innerTerm,
      raw: true,
      x: 0,
      y: 0,
      w: 0,
      h: 0,
    };
  }

  // ---------- rendering ----------
  _fmtCoef(n, { showPlus = false } = {}) {
    if (n === 0) return showPlus ? "+0" : "0";
    if (showPlus && n > 0) return `+${n}`;
    return `${n}`;
  }

  _termToString(t, { showPlus = true } = {}) {
    if (t.kind === "const") return this._fmtCoef(t.coef, { showPlus });
    if (t.kind === "x") {
      const c = t.coef;
      if (c === 1) return showPlus ? "+x" : "x";
      if (c === -1) return "-x";
      return `${this._fmtCoef(c, { showPlus })}x`;
    }
    if (t.kind === "mainParen") {
      const out = t.outer;
      if (t.sideHint === "L") {
        const c = t.inner.c;
        const d = t.inner.d;
        const inside = `${this._fmtCoef(c, { showPlus: false })}x ${d >= 0 ? "+" : "-"} ${Math.abs(d)}`;
        return `${this._fmtCoef(out, { showPlus })}(${inside})`;
      } else {
        const f = t.inner.f;
        const g = t.inner.g;
        const inside = `${f} ${g >= 0 ? "+" : "-"} ${Math.abs(g)}x`;
        return `${this._fmtCoef(out, { showPlus })}(${inside})`;
      }
    }
    if (t.kind === "prodParen") {
      const out = t.outer;
      const it = t.innerTerm;
      const innerStr =
        it.var === "x"
          ? Math.abs(it.coef) === 1
            ? "x"
            : `${Math.abs(it.coef)}x`
          : `${Math.abs(it.coef)}`;

      const innerSigned = it.coef < 0 ? `-${innerStr}` : innerStr;
      return `${this._fmtCoef(out, { showPlus })}(${innerSigned})`;
    }
    return "?";
  }

  _measureTerm(ctx, t, isFirst) {
    ctx.font = `${this.FONT_TERM}px Arial`;
    const s = this._termToString(t, { showPlus: !isFirst });
    const w = ctx.measureText(s).width;
    return { s, w, h: 40 };
  }

  _layoutSide(ctx, terms, startX, y) {
    let x = startX;
    for (let i = 0; i < terms.length; i++) {
      const t = terms[i];
      const { s, w, h } = this._measureTerm(ctx, t, i === 0);
      t._renderStr = s;
      t.w = w + 14;
      t.h = h;
      t.x = x;
      t.y = y;
      x += t.w + this.eqGap;
    }
  }

  _drawBackground(ctx) {
    if (this.bgImage) {
      ctx.drawImage(
        this.bgImage,
        0,
        0,
        this.game.canvas.width,
        this.game.canvas.height,
      );
    } else {
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);
    }
  }

  _grayAmount() {
    const steps = Math.max(1, this.graySteps | 0);
    return Math.max(0, Math.min(1, this.grayStepIndex / steps));
  }

  _resetGrayStepProgress() {
    this.grayStepIndex = 0;
    this.grayJumpTimer = 0;
    this.grayJumpCueIndex = 0;
    this.correctStreak = 0;
  }

  _onCorrectResolution() {
    this.grayJumpTimer = 0; // al responder bien, reinicia conteo al proximo salto
    this.grayJumpCueIndex = 0;
  }

  _registerCorrectAction() {
    this.grayJumpTimer = 0; // cada accion correcta reinicia la cuenta de presion
    this.grayJumpCueIndex = 0;
    this.correctStreak += 1;
    if (this.correctStreak >= this.correctStreakTarget) {
      this.correctStreak = 0;
      if (this.grayStepIndex > 0) {
        this.grayStepIndex = 0; // recupera color con la racha objetivo
        this.playSfx(this.sfxCorrect, { volume: 0.32, restart: true });
      }
    }
  }

  _advanceGrayStep() {
    this.grayStepIndex += 1;
    this.playSfx(this.sfxGrayStep, { volume: 0.28, restart: true });
    this.grayJumpCueIndex = 0;
    this.shakeT = this.shakeDur;

    if (this.grayStepIndex >= this.graySteps) {
      this._consumeLife("La pesadilla te dejo sin color.");
    }
  }

  _updateGrayStepProgress(dt) {
    if (this.gameFinished) return;
    if (!(this.state === "playing" || this.state === "tutorial")) return;

    const prevTimer = this.grayJumpTimer;
    this.grayJumpTimer += dt;
    const prevFrac = Math.max(
      0,
      Math.min(1, prevTimer / this.grayJumpInterval),
    );
    const nextFrac = Math.max(
      0,
      Math.min(1, this.grayJumpTimer / this.grayJumpInterval),
    );
    while (
      this.grayJumpCueIndex < this.grayJumpCueFractions.length &&
      prevFrac < this.grayJumpCueFractions[this.grayJumpCueIndex] &&
      nextFrac >= this.grayJumpCueFractions[this.grayJumpCueIndex]
    ) {
      this.playSfx(this.sfxGrayTick, { volume: 0.22, restart: true });
      this.grayJumpCueIndex += 1;
    }

    while (this.grayJumpTimer >= this.grayJumpInterval) {
      this.grayJumpTimer -= this.grayJumpInterval;
      this._advanceGrayStep();
      if (this.gameFinished) return;
    }
  }

  _drawNightmareAtmosphere(ctx) {
    // DesaturaciÃ³n y viÃ±eta progresivas con el tiempo (mÃ¡s gris al acercarse a 0)
    const gray = this._grayAmount(); // 0..1 (por escalones)

    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    // viÃ±eta (oscurece bordes)
    const alpha = 0.1 + 0.35 * gray;
    ctx.save();
    const g = ctx.createRadialGradient(
      W / 2,
      H / 2,
      Math.min(W, H) * 0.15,
      W / 2,
      H / 2,
      Math.max(W, H) * 0.75,
    );
    g.addColorStop(0.0, `rgba(0,0,0,0)`);
    g.addColorStop(1.0, `rgba(0,0,0,${alpha})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    // veladura gris (sutil)
    ctx.save();
    ctx.fillStyle = `rgba(180,180,180,${0.05 + 0.22 * gray})`;
    // Nota: globalCompositeOperation="saturation" no estÃ¡ garantizado en todos; si no, igual queda un "veil" suave.
    ctx.globalCompositeOperation = "saturation";
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  _drawHeart(ctx, x, y, s, fillStyle) {
    ctx.save();
    ctx.fillStyle = fillStyle;
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
    ctx.restore();
  }

  _drawHUD(ctx) {
    const W = this.game.canvas.width;

    // vidas
    ctx.save();
    for (let i = 0; i < this.maxLives; i++) {
      const x = 20 + i * 22;
      const y = 18;
      this._drawHeart(ctx, x, y, 18, i < this.lives ? "#ff4b5c" : "#4a1f26");
    }
    ctx.restore();

    // presion y ronda
    ctx.save();
    ctx.font = "18px Arial";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const nextJump = Math.max(0, this.grayJumpInterval - this.grayJumpTimer);
    ctx.fillText(`Próx. salto: ${nextJump.toFixed(1)}s`, W / 2, 18);
    ctx.textAlign = "left";
    ctx.fillText(`Ecuación: ${this.roundIndex}/${this.totalRounds}`, 20, 44);
    ctx.fillStyle =
      this.correctStreak >= this.correctStreakTarget - 1 ? "#9cff9c" : "#ffe082";
    ctx.fillText(`Racha: ${this.correctStreak}/${this.correctStreakTarget}`, 20, 66);
    ctx.restore();

    // barra de prÃ³ximo salto
    const barW = 220;
    const barH = 10;
    const bx = Math.round((W - barW) / 2);
    const by = 48;
    const frac = Math.max(
      0,
      Math.min(1, this.grayJumpTimer / this.grayJumpInterval),
    );
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.20)";
    ctx.fillRect(bx, by, barW, barH);
    ctx.fillStyle = frac > 0.8 ? "#ff6b6b" : "#ffe082";
    ctx.fillRect(bx, by, Math.round(barW * frac), barH);
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, barW, barH);
    // ticks de 3 fases (saltos que faltan para perder corazon)
    for (let i = 1; i < this.graySteps; i++) {
      const tx = bx + Math.round((i / this.graySteps) * barW);
      ctx.strokeStyle = "rgba(255,255,255,0.65)";
      ctx.beginPath();
      ctx.moveTo(tx, by - 2);
      ctx.lineTo(tx, by + barH + 2);
      ctx.stroke();
    }

    const tickY = by + barH + 6;
    const tickW = Math.floor((barW - 10) / this.graySteps);
    for (let i = 0; i < this.graySteps; i++) {
      const tx = bx + i * (tickW + 5);
      const active = i < this.grayStepIndex;
      ctx.fillStyle = active ? "#ff8a65" : "rgba(255,255,255,0.22)";
      ctx.fillRect(tx, tickY, tickW, 5);
    }
    ctx.restore();

    // toast (feedback corto)
    if (this.toastT > 0 && this.toast) {
      ctx.save();
      ctx.font = "16px Arial";
      ctx.fillStyle = "#ffe082";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(this.toast, W / 2, 70);
      ctx.restore();
    }
  }

  _drawButton(
    ctx,
    btn,
    {
      fill = "rgba(255,255,255,0.10)",
      stroke = "rgba(255,235,59,0.55)",
      text = "#fff",
    } = {},
  ) {
    if (!btn) return;
    ctx.save();
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
    ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
    ctx.font = "18px Arial";
    ctx.fillStyle = text;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2);
    ctx.restore();
  }

  _hitButton(btn, mx, my) {
    if (!btn) return false;
    return (
      mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h
    );
  }

  _drawMenu(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    const panelW = Math.min(680, W * 0.88);
    const panelH = 320;
    const X = (W - panelW) / 2;
    const Y = (H - panelH) / 2;

    // botones
    const bw = 240,
      bh = 56;
    this._btnMenuPractice = {
      x: W / 2 - bw - 14,
      y: Y + panelH - 92,
      w: bw,
      h: bh,
      label: "Práctica (guiada)",
    };
    this._btnMenuPlay = {
      x: W / 2 + 14,
      y: Y + panelH - 92,
      w: bw,
      h: bh,
      label: "Jugar (normal)",
    };

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.92)";
    ctx.fillRect(X, Y, panelW, panelH);
    ctx.strokeStyle = "#ffeb3b";
    ctx.lineWidth = 2;
    ctx.strokeRect(X, Y, panelW, panelH);

    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    ctx.font = "26px Arial";
    ctx.fillStyle = "#ffe082";
    ctx.fillText("Despeje de ecuaciones", W / 2, Y + 16);

    ctx.font = "16px Arial";
    ctx.fillStyle = "#ffffff";

    const lines = [
      "Resuelve cada ecuación y encuentra el valor de x.",
      "Recuerda el orden:",
      "- Distribuye paréntesis.",
      "- Evalúa lo que puedas.",
      "- Agrupa: peras con peras y manzanas con manzanas.",
      "- Combina términos semejantes.",
      "- Calcula x.",
    ];

    let ty = Y + 48;
    for (const line of lines) {
      ctx.fillText(line, W / 2, ty);
      ty += 22;
    }

    // botones
    this._drawButton(ctx, this._btnMenuPractice, {
      fill: "rgba(255,235,59,0.12)",
      stroke: "rgba(255,235,59,0.70)",
      text: "#ffeb3b",
    });
    this._drawButton(ctx, this._btnMenuPlay, {
      fill: "rgba(255,255,255,0.10)",
      stroke: "rgba(255,255,255,0.30)",
      text: "#ffffff",
    });

    ctx.restore();
  }

  _drawTutorialOverlay(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    // botÃ³n saltar (arriba derecha, discreto)
    this._btnSkip = {
      x: W - 180,
      y: 84,
      w: 160,
      h: 38,
      label: "Saltar práctica",
    };

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(0, 0, W, H);

    this._drawButton(ctx, this._btnSkip, {
      fill: "rgba(0,0,0,0.40)",
      stroke: "rgba(255,255,255,0.25)",
      text: "rgba(255,255,255,0.9)",
    });

    // caja de instrucciÃ³n
    const boxW = Math.min(720, W * 0.86);
    const boxH = 92;
    const x = (W - boxW) / 2;
    const y = 118;

    ctx.fillStyle = "rgba(0,0,0,0.72)";
    ctx.fillRect(x, y, boxW, boxH);
    ctx.strokeStyle = "rgba(255,235,59,0.55)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, boxW, boxH);

    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.font = "18px Arial";
    ctx.fillStyle = "#ffeb3b";

    const msg = this._tutorialMessage();
    ctx.fillText(msg.title, W / 2, y + 10);

    ctx.font = "15px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.fillText(msg.body, W / 2, y + 42);

    ctx.restore();
  }

  _tutorialMessage() {
    const s = this.tutorial.step;
    const messages = [
      {
        title: "Paso 1/8",
        body: "Haz clic en el paréntesis grande 3( ... ) del lado izquierdo para distribuir.",
      },
      {
        title: "Paso 2/8",
        body: "Ahora calcula los dos paréntesis pequeños del lado izquierdo (clic en cada uno).",
      },
      {
        title: "Paso 3/8",
        body: "Haz clic en el paréntesis grande del lado derecho 1( ... ) para distribuir.",
      },
      {
        title: "Paso 4/8",
        body: "Calcula los dos paréntesis pequeños del lado derecho (clic en cada uno).",
      },
      {
        title: "Paso 5/8",
        body: "Mueve 2x al lado izquierdo arrastrándolo y soltándolo cruzando el '=' (cambia el signo).",
      },
      {
        title: "Paso 6/8",
        body: "Combina términos semejantes: arrastra -2x sobre 3x para obtener x.",
      },
      {
        title: "Paso 7/8",
        body: "Combina 2 y 3 (arrastra 3 sobre 2) y luego mueve 5 al lado derecho.",
      },
      {
        title: "Paso 8/8",
        body: "Combina 4 y -5. Luego escribe el valor de x y presiona Enter.",
      },
    ];
    return messages[Math.min(s, messages.length - 1)];
  }

  _drawFinish(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    const panelW = Math.min(640, W * 0.86);
    const panelH = 210;
    const X = (W - panelW) / 2;
    const Y = (H - panelH) / 2;

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillRect(X, Y, panelW, panelH);

    ctx.strokeStyle = this.win ? "#8bc34a" : "#ff5252";
    ctx.lineWidth = 2;
    ctx.strokeRect(X, Y, panelW, panelH);

    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    ctx.font = "26px Arial";
    ctx.fillStyle = this.win ? "#c8e6c9" : "#ff8a80";
    ctx.fillText(this.win ? "¡Bien hecho!" : "Fallaste...", W / 2, Y + 16);

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
    ctx.fillText("Pulsa ESPACIO o clic para volver.", W / 2, Y + panelH - 38);
    ctx.restore();
  }

  _drawEquationBackplate(ctx) {
    const W = this.game.canvas.width;

    const bandH = 140;
    const bandY = this.eqY - bandH / 2;

    const bandX = 110;
    const bandW = W - bandX * 2;

    ctx.save();

    const g = ctx.createLinearGradient(0, bandY, 0, bandY + bandH);
    g.addColorStop(0.0, "rgba(0,0,0,0.00)");
    g.addColorStop(0.2, "rgba(0,0,0,0.38)");
    g.addColorStop(0.5, "rgba(0,0,0,0.52)");
    g.addColorStop(0.8, "rgba(0,0,0,0.38)");
    g.addColorStop(1.0, "rgba(0,0,0,0.00)");

    ctx.fillStyle = g;

    const r = 18;
    const x = bandX,
      y = bandY,
      w = bandW,
      h = bandH;

    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();

    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 6;

    ctx.fill();

    ctx.shadowColor = "transparent";
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 24, this.eqY);
    ctx.lineTo(x + w - 24, this.eqY);
    ctx.stroke();

    ctx.restore();
  }

  _drawEquation(ctx) {
    ctx.save();
    ctx.font = "20px Arial";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    this._drawEquationBackplate(ctx);

    // preserve drag position (layout overwrites x/y)
    let dragPos = null;
    if (this.drag && this.drag.term) {
      dragPos = { t: this.drag.term, x: this.drag.term.x, y: this.drag.term.y };
    }

    this._layoutSide(ctx, this.eq.left, this.eqLeftX, this.eqY);
    this._layoutSide(ctx, this.eq.right, this.eqRightX, this.eqY);

    if (dragPos) {
      dragPos.t.x = dragPos.x;
      dragPos.t.y = dragPos.y;
    }

    ctx.fillStyle = "#ffffff";
    ctx.fillText("=", 505, this.eqY);

    const drawSide = (arr) => {
      for (const t of arr) {
        if (this.drag && this.drag.term === t) {
          this._drawTermGhost(ctx, t, this.drag.originX, this.drag.originY);
          continue;
        }
        this._drawTermBox(ctx, t);
      }
    };

    drawSide(this.eq.left);
    drawSide(this.eq.right);

    if (this.drag && this.drag.term) {
      const t = this.drag.term;
      ctx.save();
      ctx.globalAlpha = 0.92;
      this._drawTermBox(ctx, t, true);
      ctx.restore();
    }

    ctx.restore();
  }

  _drawTermBox(ctx, t, isDragged = false) {
    const x = t.x,
      y = t.y;
    const w = t.w || 60;
    const h = t.h || 28;

    if (t.raw) {
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.strokeStyle = "rgba(255,255,255,0.22)";
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.10)";
      ctx.strokeStyle = "rgba(255,255,255,0.32)";
    }

    if (this.hoverTarget === t && !t.raw) {
      ctx.fillStyle = "rgba(255,235,59,0.12)";
      ctx.strokeStyle = "rgba(255,235,59,0.55)";
    }

    if (isDragged) {
      ctx.fillStyle = "rgba(100,181,246,0.18)";
      ctx.strokeStyle = "rgba(100,181,246,0.65)";
      ctx.shadowColor = "rgba(0,0,0,0.55)";
      ctx.shadowBlur = 14;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 10;
      ctx.globalAlpha = 0.95;
    }

    ctx.fillRect(x - 6, y - h / 2, w, h);
    ctx.strokeRect(x - 6, y - h / 2, w, h);

    ctx.fillStyle = t.raw ? "#bbbbbb" : "#ffffff";
    ctx.fillText(t._renderStr || "?", x, y);
  }

  _drawTermGhost(ctx, t, gx, gy) {
    ctx.save();
    const oldX = t.x,
      oldY = t.y;
    t.x = gx;
    t.y = gy;

    ctx.globalAlpha = 0.28;
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 6;

    this._drawTermBox(ctx, t);

    t.x = oldX;
    t.y = oldY;
    ctx.restore();
  }

  _drawAnswerBox(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    const boxW = 350;
    const boxH = 80;
    const x = (W - boxW) / 2;
    const y = H - boxH - 18;

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(x, y, boxW, boxH);

    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, boxW, boxH);

    ctx.font = "24px Arial";
    ctx.fillStyle = "#fff";
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText("x = ", x + 14, y + boxH / 2);

    ctx.fillStyle = "#ffeb3b";
    ctx.fillText(this.answerText || "...", x + 64, y + boxH / 2);

    ctx.font = "20px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.textAlign = "center";
    ctx.fillText("Enter para comprobar", x + boxW - 132, y + boxH / 2);

    ctx.restore();
  }

  _checkAnswerNow() {
    const raw = (this.answerText || "").trim();
    if (!raw) {
      this._setToast("Escribe un valor para x.", 1.0);
      return;
    }

    const v = Number(raw);
    if (!Number.isFinite(v) || !Number.isInteger(v)) {
      this._consumeLife("La respuesta debe ser un entero.");
      this.answerText = "";
      return;
    }

    const X = this.eq?.solution;

    if (v === X) {
      // Si es tutorial, NO terminamos el minijuego: pasamos al juego real.
      if (this.tutorial.active) {
        this._onCorrectResolution();
        this.playSfx(this.sfxWin);
        this._setToast(
          "¡Correcto! Práctica completada. Empieza el juego real...",
          1.4,
        );
        this.tutorial.pendingStartReal = true;
        this.tutorial.pendingT = 0.9;
        this.answerText = "";
        return;
      }
      this._onCorrectResolution();
      // Juego real: 3 ecuaciones encadenadas (misma partida)
      this.playSfx(this.sfxWin);
      if (this.roundIndex < this.totalRounds) {
        const next = this.roundIndex + 1;
        this.roundIndex = next;
        this._newRound(); // NO resetea tiempo ni vidas
        this.answerText = "";
        this._setToast(`Correcto. Ecuación ${next}/${this.totalRounds}`, 1.3);
        return;
      }

      // Ãšltima ecuaciÃ³n => victoria
      this._finishGame(false, `Correcto: x = ${X}`);
    } else {
      this._consumeLife("Incorrecto.");
      this.answerText = "";
    }
  }

  // ---------- rules ----------
  _consumeLife(reason) {
    this.lives -= 1;
    this._resetGrayStepProgress(); // al perder vida, reinicia la presion de gris
    this.playSfx(this.sfxWrong);
    this.toast = reason || "Acción inválida.";
    this.toastT = 1.1;

    if (this.lives <= 0) {
      this.lives = 0;
      this._finishGame(true, "Te quedaste sin vidas.\nVuelve a intentarlo.");
    }
  }

  _setToast(msg, t = 1.0) {
    this.toast = msg;
    this.toastT = t;
  }

  // ---------- algebra actions ----------
  _expandMainParen(side, index) {
    const arr = side === "L" ? this.eq.left : this.eq.right;
    const t = arr[index];
    if (!t || t.kind !== "mainParen") return;

    const out = t.outer;

    if (t.sideHint === "L") {
      const c = t.inner.c;
      const d = t.inner.d;

      const term1 = this._termParenProd(out, { coef: c, var: "x" });
      const term2 = this._termParenProd(out, { coef: d, var: null });

      arr.splice(index, 1, term1, term2);
    } else {
      const f = t.inner.f;
      const g = t.inner.g;

      const term1 = this._termParenProd(out, { coef: f, var: null });
      const term2 = this._termParenProd(out, { coef: g, var: "x" });

      arr.splice(index, 1, term1, term2);
    }

    this.playSfx(this.sfxOk);
    this._registerCorrectAction();
  }

  _evaluateProdParen(side, index) {
    const arr = side === "L" ? this.eq.left : this.eq.right;
    const t = arr[index];
    if (!t || t.kind !== "prodParen") return;
    if (!t.raw) return;

    const out = t.outer;
    const it = t.innerTerm;
    const coef = out * it.coef;

    const repl =
      it.var === "x" ? this._termX(coef, true) : this._termConst(coef, true);
    arr.splice(index, 1, repl);

    this.playSfx(this.sfxOk);
    this._registerCorrectAction();
  }

  _isLike(a, b) {
    if (!a || !b) return false;
    if (a.raw || b.raw) return false;
    if (a.kind === "x" && b.kind === "x") return true;
    if (a.kind === "const" && b.kind === "const") return true;
    return false;
  }

  _combineTerms(side, srcIndex, dstIndex) {
    const arr = side === "L" ? this.eq.left : this.eq.right;
    if (srcIndex === dstIndex) return false;

    const a = arr[srcIndex];
    const b = arr[dstIndex];
    if (!this._isLike(a, b)) return false;

    b.coef += a.coef;
    if (b.coef === 0) {
      const hi = Math.max(srcIndex, dstIndex);
      const lo = Math.min(srcIndex, dstIndex);
      arr.splice(hi, 1);
      arr.splice(lo, 1);
    } else {
      arr.splice(srcIndex, 1);
    }
    this.playSfx(this.sfxCorrect);
    this._registerCorrectAction();
    return true;
  }

  _moveAcrossEquals(fromSide, srcIndex) {
    const from = fromSide === "L" ? this.eq.left : this.eq.right;
    const toSide = fromSide === "L" ? "R" : "L";
    const to = toSide === "L" ? this.eq.left : this.eq.right;

    const t = from[srcIndex];
    if (!t) return false;
    if (t.raw) return false;
    if (!(t.kind === "const" || t.kind === "x")) return false;

    t.coef *= -1;

    from.splice(srcIndex, 1);
    to.push(t);

    this.playSfx(this.sfxOk);
    this._registerCorrectAction();
    return true;
  }

  // ---------- input helpers ----------
  _mouseToWorld() {
    const m = this.game.input.mouse;
    const z = this.game.zoom || 1;
    return { x: m.x / z + this.camera.x, y: m.y / z + this.camera.y };
  }

  _termHit(t, mx, my) {
    const x = t.x - 6;
    const y = t.y - t.h / 2;
    const w = t.w || 60;
    const h = t.h || 28;
    return mx >= x && mx <= x + w && my >= y && my <= y + h;
  }

  _findTermAt(mx, my, excludeTerm = null) {
    const scan = (arr, side) => {
      for (let i = arr.length - 1; i >= 0; i--) {
        const t = arr[i];
        if (excludeTerm && t === excludeTerm) continue;
        if (this._termHit(t, mx, my)) return { side, index: i, term: t };
      }
      return null;
    };
    return scan(this.eq.right, "R") || scan(this.eq.left, "L");
  }

  // ---------- tutorial step checks ----------
  _countRawProdParens(side) {
    const arr = side === "L" ? this.eq.left : this.eq.right;
    return arr.filter((t) => t.kind === "prodParen" && t.raw).length;
  }

  _hasMainParen(side) {
    const arr = side === "L" ? this.eq.left : this.eq.right;
    return arr.some((t) => t.kind === "mainParen");
  }

  _hasTermKind(side, kind, predicate = null) {
    const arr = side === "L" ? this.eq.left : this.eq.right;
    return arr.some((t) => t.kind === kind && (!predicate || predicate(t)));
  }

  _advanceTutorialIfReady() {
    const s = this.tutorial.step;

    if (s === 0) {
      // after expanding L mainParen => no mainParen on L
      if (!this._hasMainParen("L")) this.tutorial.step = 1;
      return;
    }

    if (s === 1) {
      // after evaluating two L prodParens => none raw on L of prodParen
      if (this._countRawProdParens("L") === 0) this.tutorial.step = 2;
      return;
    }

    if (s === 2) {
      if (!this._hasMainParen("R")) this.tutorial.step = 3;
      return;
    }

    if (s === 3) {
      if (this._countRawProdParens("R") === 0) this.tutorial.step = 4;
      return;
    }

    if (s === 4) {
      // want: 2x moved to L => on L exists a termX with coef -2
      if (this._hasTermKind("L", "x", (t) => t.coef === -2))
        this.tutorial.step = 5;
      return;
    }

    if (s === 5) {
      // after combining -2x with 3x => on L exists x with coef 1
      if (this._hasTermKind("L", "x", (t) => t.coef === 1))
        this.tutorial.step = 6;
      return;
    }

    if (s === 6) {
      // after combining 2 and 3 => L has const 5 AND after moving it => R has const -5 (or L no longer has 5)
      const hasL5 = this._hasTermKind("L", "const", (t) => t.coef === 5);
      const hasRMinus5 = this._hasTermKind("R", "const", (t) => t.coef === -5);
      if (!hasL5 && hasRMinus5) this.tutorial.step = 7;
      return;
    }

    if (s === 7) {
      // after combining 4 and -5 => R has const -1
      if (this._hasTermKind("R", "const", (t) => t.coef === -1)) {
        // stay on step 7, next action is typing answer; step 7 message already says it.
        // No auto-advance; answer check will transition.
      }
      return;
    }
  }

  _tutorialAllowsClickOn(hit) {
    // Limita acciones para evitar que â€œse pierdanâ€ en la prÃ¡ctica.
    // Si intentan otra cosa, damos un toast (sin quitar vida).
    const s = this.tutorial.step;
    const t = hit?.term;

    if (!t) return { ok: false, msg: "Haz clic en lo indicado." };

    // Step 0: must click mainParen on L
    if (s === 0) {
      if (hit.side === "L" && t.kind === "mainParen") return { ok: true };
      return {
        ok: false,
        msg: "En la práctica: primero distribuye 3( ... ) del lado izquierdo.",
      };
    }

    // Step 1: must click prodParen on L (raw)
    if (s === 1) {
      if (hit.side === "L" && t.kind === "prodParen" && t.raw)
        return { ok: true };
      return {
        ok: false,
        msg: "En la práctica: ahora calcula los paréntesis pequeños del lado izquierdo.",
      };
    }

    // Step 2: must click mainParen on R
    if (s === 2) {
      if (hit.side === "R" && t.kind === "mainParen") return { ok: true };
      return {
        ok: false,
        msg: "En la práctica: distribuye el paréntesis del lado derecho.",
      };
    }

    // Step 3: must click prodParen on R (raw)
    if (s === 3) {
      if (hit.side === "R" && t.kind === "prodParen" && t.raw)
        return { ok: true };
      return {
        ok: false,
        msg: "En la práctica: calcula los paréntesis pequeños del lado derecho.",
      };
    }

    // Step 4+: clicks are allowed (but still guide by toasts for wrong)
    return { ok: true };
  }

  _tutorialAllowsDragStart(hit) {
    const s = this.tutorial.step;
    const t = hit?.term;

    if (!t) return { ok: false, msg: "Selecciona un término." };

    // from step 4 onwards: allow dragging of evaluated const/x,
    // but provide gentle guidance if they try something else.
    if (s < 4)
      return {
        ok: false,
        msg: "En la práctica: primero resuelve los paréntesis (clics).",
      };

    if (t.raw) return { ok: false, msg: "Primero calcula antes de arrastrar." };
    if (!(t.kind === "const" || t.kind === "x"))
      return { ok: false, msg: "Solo puedes mover términos ya evaluados." };

    // Step 4: must start dragging the 2x from R
    if (s === 4) {
      if (hit.side === "R" && t.kind === "x" && t.coef === 2)
        return { ok: true };
      return {
        ok: false,
        msg: "En la práctica: mueve 2x del lado derecho al izquierdo.",
      };
    }

    // Step 5: must drag -2x onto 3x (we just ensure they pick -2x or 3x)
    if (s === 5) {
      if (hit.side === "L" && t.kind === "x" && (t.coef === -2 || t.coef === 3))
        return { ok: true };
      return { ok: false, msg: "En la práctica: combina -2x con 3x." };
    }

    // Step 6: combine 2 y 3 (pick 2 or 3), then move 5 (pick 5)
    if (s === 6) {
      if (
        hit.side === "L" &&
        t.kind === "const" &&
        (t.coef === 2 || t.coef === 3 || t.coef === 5)
      )
        return { ok: true };
      return {
        ok: false,
        msg: "En la práctica: combina 2 y 3, luego mueve 5 al otro lado.",
      };
    }

    // Step 7: combine 4 and -5 (pick 4 or -5)
    if (s === 7) {
      if (
        hit.side === "R" &&
        t.kind === "const" &&
        (t.coef === 4 || t.coef === -5)
      )
        return { ok: true };
      return {
        ok: false,
        msg: "En la práctica: combina 4 y -5 para obtener -1.",
      };
    }

    return { ok: true };
  }

  // ---------- main loop ----------
  update(dt) {
    const input = this.game.input;
    const mouseDown = !!input.mouse.down;

    if (this.shakeT > 0) {
      this.shakeT = Math.max(0, this.shakeT - dt);
    }

    // toast timer
    if (this.toastT > 0) this.toastT = Math.max(0, this.toastT - dt);

    // finished flow
    if (this.gameFinished) {
      if (this.exitDelay > 0) {
        this.exitDelay -= dt;
        return;
      }
      const startDown = input.isDown(" ") || mouseDown;
      const startPressed = startDown && !this.prevStartDown;
      this.prevStartDown = startDown;

      if (startPressed) window.MN_APP?.toOverworld?.();
      return;
    }

    // edge click
    const mousePressed = mouseDown && !this.prevMouseDown;
    const mouseReleased = !mouseDown && this.prevMouseDown;
    this.prevMouseDown = mouseDown;

    const p = this._mouseToWorld();

    // ----- MENU -----
    if (this.state === "menu") {
      if (mousePressed) {
        // click en botones
        if (this._hitButton(this._btnMenuPractice, p.x, p.y)) {
          this.state = "tutorial";
          this._loadTutorialEquation();
          this.playSfx(this.sfxPage);
          return;
        }
        if (this._hitButton(this._btnMenuPlay, p.x, p.y)) {
          this.state = "playing";
          this.roundIndex = 1;
          this._newRound();
          this.lives = this.maxLives;
          this._resetGrayStepProgress();
          this.tutorial.active = false;
          this.playSfx(this.sfxPage);
          this._setToast("Juego normal.", 0.9);
          return;
        }
      }
      return;
    }

    // ----- TUTORIAL pending transition to real game -----
    if (this.state === "tutorial" && this.tutorial.pendingStartReal) {
      this.tutorial.pendingT -= dt;
      if (this.tutorial.pendingT <= 0) {
        this.tutorial.pendingStartReal = false;
        this._startRealGameFresh();
      }
      // allow drawing etc; but don't process more input while transitioning
      return;
    }

    // ----- presiÃ³n por saltos -----
    if (this.state === "playing" || this.state === "tutorial") {
      this._updateGrayStepProgress(dt);
    }

    // ----- capturar teclado para respuesta -----
    if (
      (this.state === "playing" || this.state === "tutorial") &&
      !this.gameFinished
    ) {
      // Enter => comprobar
      if (input.isDown("Enter")) {
        if (!this._enterHeld) {
          this._enterHeld = true;
          this._checkAnswerNow();
        }
      } else {
        this._enterHeld = false;
      }

      // Backspace
      if (input.isDown("Backspace")) {
        if (!this._backHeld) {
          this._backHeld = true;
          this.answerText = this.answerText.slice(0, -1);
        }
      } else {
        this._backHeld = false;
      }

      // Signo negativo
      if (input.isDown("-")) {
        if (!this._minusHeld) {
          this._minusHeld = true;
          if (this.answerText.length === 0) this.answerText = "-";
        }
      } else {
        this._minusHeld = false;
      }

      // DÃ­gitos
      for (let d = 0; d <= 9; d++) {
        const k = String(d);
        if (input.isDown(k)) {
          if (!this._digitHeld) this._digitHeld = {};
          if (!this._digitHeld[k]) {
            this._digitHeld[k] = true;
            if (this.answerText === "0") this.answerText = k;
            else this.answerText += k;
            if (this.answerText.length > 4)
              this.answerText = this.answerText.slice(0, 4);
          }
        } else if (this._digitHeld) {
          this._digitHeld[k] = false;
        }
      }
    }

    // ----- Drag move -----
    if (this.drag && mouseDown) {
      const t = this.drag.term;
      t.x = p.x - this.drag.offsetX;
      t.y = p.y - this.drag.offsetY;

      this.hoverTarget = null;
      const hit = this._findTermAt(p.x, p.y, t);
      if (
        hit &&
        hit.term &&
        hit.term !== t &&
        hit.side === this.drag.fromSide
      ) {
        if (this._isLike(t, hit.term)) this.hoverTarget = hit.term;
      }
    }

    // ----- mouse pressed: click or start drag -----
    if (
      mousePressed &&
      (this.state === "playing" || this.state === "tutorial")
    ) {
      // tutorial: skip button
      if (
        this.state === "tutorial" &&
        this._hitButton(this._btnSkip, p.x, p.y)
      ) {
        this._startRealGameFresh();
        return;
      }

      const hit = this._findTermAt(p.x, p.y);
      if (!hit) return;

      const t = hit.term;

      // tutorial: gate clicks
      if (this.state === "tutorial") {
        const gate = this._tutorialAllowsClickOn(hit);
        if (!gate.ok) {
          this._setToast(gate.msg, 1.2);
          return;
        }
      }

      // click actions for parens
      if (t.kind === "mainParen") {
        this._expandMainParen(hit.side, hit.index);
        if (this.state === "tutorial") this._advanceTutorialIfReady();
        return;
      }
      if (t.kind === "prodParen" && t.raw) {
        this._evaluateProdParen(hit.side, hit.index);
        if (this.state === "tutorial") this._advanceTutorialIfReady();
        return;
      }

      // if raw or not movable, show feedback (no life loss)
      if (t.kind === "mainParen") {
        this._setToast("Primero distribuye (clic en el paréntesis).", 1.0);
        return;
      }
      if (t.kind === "prodParen" && t.raw) {
        this._setToast("Primero calcula (clic en el paréntesis).", 1.0);
        return;
      }
      if (t.raw) {
        this._setToast("Primero calcula.", 1.0);
        return;
      }
      if (!(t.kind === "const" || t.kind === "x")) {
        this._setToast("Eso no se puede mover.", 1.0);
        return;
      }

      // tutorial: gate drag start
      if (this.state === "tutorial") {
        const gateDrag = this._tutorialAllowsDragStart(hit);
        if (!gateDrag.ok) {
          this._setToast(gateDrag.msg, 1.2);
          return;
        }
      }

      // start drag
      this.drag = {
        term: t,
        fromSide: hit.side,
        index: hit.index,
        offsetX: p.x - t.x,
        offsetY: p.y - t.y,
        originX: t.x,
        originY: t.y,
      };
      this.playSfx(this.sfxOk);
      return;
    }

    // ----- mouse released: drop -----
    if (mouseReleased && this.drag) {
      const dragged = this.drag.term;
      const fromSide = this.drag.fromSide;

      const dropX = p.x;
      const over = this._findTermAt(dropX, p.y, dragged);

      // combine on same side
      if (
        over &&
        over.side === fromSide &&
        over.term &&
        over.term !== dragged
      ) {
        const arr = fromSide === "L" ? this.eq.left : this.eq.right;

        const srcIndex = arr.indexOf(dragged);
        const dstIndex = over.index;

        if (!this._isLike(dragged, over.term)) {
          this._consumeLife("No son términos semejantes.");
        } else {
          const ok = this._combineTerms(fromSide, srcIndex, dstIndex);
          if (!ok) this._consumeLife("No se pueden combinar.");
        }

        this.drag = null;
        this.hoverTarget = null;

        if (this.state === "tutorial") this._advanceTutorialIfReady();
        return;
      }

      // move across "="
      const crossToR = fromSide === "L" && dropX > 515;
      const crossToL = fromSide === "R" && dropX < 505;

      if (crossToR || crossToL) {
        const arrFrom = fromSide === "L" ? this.eq.left : this.eq.right;
        const srcIndex = arrFrom.indexOf(dragged);

        if (
          dragged.raw ||
          !(dragged.kind === "const" || dragged.kind === "x")
        ) {
          this._setToast("Primero calcula antes de mover.", 1.0);
          this.drag = null;
          this.hoverTarget = null;
          return;
        }

        const ok = this._moveAcrossEquals(fromSide, srcIndex);
        if (!ok) this._consumeLife("Movimiento inválido.");

        this.drag = null;
        this.hoverTarget = null;

        if (this.state === "tutorial") this._advanceTutorialIfReady();
        return;
      }

      // drop without action
      this.drag = null;
      this.hoverTarget = null;
      return;
    }

    super.update(dt);
  }

  draw(ctx) {
    const shake = this._getShakeOffset();

    // Fondo con desaturaciÃ³n progresiva (Nightmare) en juego/prÃ¡ctica
    const shouldTint =
      (this.state === "playing" || this.state === "tutorial") &&
      !this.gameFinished;
    ctx.save();
    ctx.translate(shake.x, shake.y);
    if (shouldTint) {
      const grayPct = Math.round(this._grayAmount() * 100);
      ctx.save();
      ctx.filter = `grayscale(${grayPct}%)`;
      this._drawBackground(ctx);
      ctx.restore();
      this._drawNightmareAtmosphere(ctx);
    } else {
      this._drawBackground(ctx);
    }

    if (this.eq) this._drawEquation(ctx);
    this._drawAnswerBox(ctx);

    if (this.state === "menu") this._drawMenu(ctx);
    if (this.state === "tutorial") this._drawTutorialOverlay(ctx);
    if (this.gameFinished) this._drawFinish(ctx);
    ctx.restore();

    // HUD siempre a color (legibilidad)
    this._drawHUD(ctx);
  }

  _getShakeOffset() {
    if (this.shakeT <= 0 || this.shakeDur <= 0) return { x: 0, y: 0 };
    const t = this.shakeT / this.shakeDur;
    const mag = this.shakeMag * t;
    return {
      x: (Math.random() * 2 - 1) * mag,
      y: (Math.random() * 2 - 1) * mag,
    };
  }

  _finishGame(failed = false, reason = "") {
    if (this.gameFinished) return;

    this.gameFinished = true;
    this.state = "finished";
    this.exitDelay = 0.45;
    this.win = !failed;

    let tier = 0;
    if (!failed) tier = 1;

    let gained = 0;
    if (window.MN_reportMinigameTier) {
      gained = MN_reportMinigameTier("balanceo_ecuaciones", tier);
    }
    this.sheetsReward = gained;

    if (failed) {
      this.playSfx(this.sfxWrong);
      this.message =
        (reason ? reason + "\n" : "") + `Hojas ganadas: ${gained}.`;
    } else {
      this.playSfx(this.sfxWin);
      this.message =
        (reason ? reason + "\n" : "") + `Hojas ganadas: ${gained}.`;
    }

    try {
      this.game?.events?.emit?.("balanceo_ecuaciones_done", {
        win: !failed,
        tier,
        sheetsReward: gained,
        failed,
      });
    } catch (_) {}
  }

  destroy() {
    this.clearAll();
  }
}

window.ResolverEcuacionesScene = ResolverEcuacionesScene;
