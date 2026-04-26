// ===========================================================
// BalanzaScene.js ” "Balanzas: Cajas y Costales" (2 balanzas simultaneas)
// ===========================================================
// Minijuego VISUAL (sin negativos):
// - 3 rondas
// - 60s por ronda
// - 1 error permitido por ronda
// - Cada ronda muestra 2 balanzas al mismo tiempo (una arriba y otra abajo):
//   (A) Cajas + Kilos: deduces mentalmente el valor de la caja
//   (B) Cajas + Costales + Kilos: respondes tecleando el valor del costal
// - Arrastre: si sacas un objeto fuera, se cancela 1 igual en ambos lados
//   (solo si ese objeto existe en ambos lados).
// - La balanza solo te ayuda a simplificar; SIEMPRE debes teclear el peso del costal.
// ===========================================================

(function () {
  function rndInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function formatTime(s) {
    s = Math.max(0, Math.floor(s));
    const m = Math.floor(s / 60);
    const ss = String(s % 60).padStart(2, "0");
    return `${m}:${ss}`;
  }

  function deepCopyCounts(c) {
    return {
      box: c?.box || 0,
      sack: c?.sack || 0,
      kg: c?.kg || 0,
    };
  }

  class BalanzaScene extends Scene {
    constructor(game) {
      super(game);

      // Estado general
      this.state = "intro"; // intro | tutorial | playing | finished

      // Tutorial guiado (antes del juego real)
      this.tutorial = {
        active: false,
        step: 0,
        phase: "cancelA", // cancelA -> cancelB -> askSack -> done
        cancelsNeeded: 0,
        cancelsDone: 0,
        lockBalance: 0,
        lockType: "kg",
        askTarget: null, // "box" | "sack"
        message: "",
      };
      this.gameFinished = false;
      this.win = false;
      this.sheetsReward = 0;

      // Rondas
      this.roundIndex = 0;
      this.roundsCleared = 0;
      this.totalRounds = 3;
      this.timeLimit = 120;
      this.timeLeft = this.timeLimit;
      this.errorsThisRound = 0;
      this.maxErrorsPerRound = 1;

      // Generación oculta
      this.boxValue = 0;
      this.sackValue = 0;
      this.roundData = null; // { A:{L,R}, B:{L,R} }

      // Balanzas (conteos mutables por cancelación)
      this.countsA = {
        L: { box: 0, sack: 0, kg: 0 },
        R: { box: 0, sack: 0, kg: 0 },
      };
      this.countsB = {
        L: { box: 0, sack: 0, kg: 0 },
        R: { box: 0, sack: 0, kg: 0 },
      };

      // Input de respuesta (siempre visible)
      this.answerStr = "";
      this.answerFeedback = "";
      this.answerFeedbackTimer = 0;
      this.answerShakeT = 0;

      // Input general
      this._prevKeys = {};
      this._prevMouseDown = false;
      this._mousePos = { x: 0, y: 0 };

      // Drag
      // { balanceIdx:0|1, type, fromSide, x,y, pairDx, startX, startY, moved }
      this.drag = null;
      this.dragThreshold = 10;
      this.hoverItem = null;

      // FX
      this.cancelFx = [];
      this.roundTransitionT = 0;
      this.roundTransitionLabel = "";
      this.roundTransitionNextIndex = -1;

      // Layout
      this.ui = {
        marginTop: 60,
        centerX: 510,
        gapX: 250,
        plateW: 260,
        plateH: 16,
        itemSize: 46,
        // Balanzas (Y)
        balanceYTop: 120,
        plateYTop: 260,
        balanceYBottom: 400,
        plateYBottom: 540,
      };

      // Assets/sfx
      this.bgImage = null;
      this.sfxCancel = "sfx_match";
      this.sfxKgCancel = "sfx_ok";
      this.sfxWrong = "sfx_error";
      this.sfxWin = "sfx_win";

      // Tier
      this._roundRestarts = 0;
      this._totalMistakes = 0;

      // Botones de intro
      this._btnIntroPractice = null;
      this._btnIntroPlay = null;
    }

    // ----------------- Utilidad de sonido -----------------
    playSfx(key, options = {}) {
      if (!key) return;
      const assets = this.game.assets;
      if (!assets || typeof assets.playSound !== "function") return;
      assets.playSound(key, options);
    }

    init() {
      if (window.MN_setLeafHUDVisible) window.MN_setLeafHUDVisible(false);
      if (window.MN_setInputMode) window.MN_setInputMode("mouse");

      // Cámara fija
      if (this.camera) {
        this.camera.x = 0;
        this.camera.y = 0;
        this.camera.setBounds(
          0,
          0,
          this.game.canvas.width,
          this.game.canvas.height,
        );
        this.camera.lockX = true;
        this.camera.lockY = true;
      }

      const A = this.game.assets;
      this.bgImage = (A && (A.getImage("bg_almacen"))) || null;

      this.state = "intro";
      this.gameFinished = false;
      this.win = false;
      this.sheetsReward = 0;

      this.roundIndex = 0;
      this.roundsCleared = 0;
      this._roundRestarts = 0;
      this._totalMistakes = 0;

      this.tutorial.active = false;
      this.tutorial.step = 0;
      this.tutorial.phase = "cancelA";
      this.tutorial.cancelsNeeded = 0;
      this.tutorial.cancelsDone = 0;
      this.tutorial.lockBalance = 0;
      this.tutorial.lockType = "kg";
      this.tutorial.askTarget = null;
      this.tutorial.message = "";
      this.answerShakeT = 0;
      this.hoverItem = null;
      this.cancelFx = [];
      this.roundTransitionT = 0;
      this.roundTransitionLabel = "";
      this.roundTransitionNextIndex = -1;
    }

    destroy() {
      if (window.MN_setInputMode) window.MN_setInputMode(null);
      if (window.MN_setLeafHUDVisible) window.MN_setLeafHUDVisible(true);
    }

    // =======================================================
    // Generación de rondas
    // =======================================================

    _generateRound() {
      // Buscamos una ronda válida (sin fracciones, sin negativos, con níºmeros razonables)
      for (let tries = 0; tries < 400; tries++) {
        const boxValue = rndInt(2, 9);
        const sackValue = rndInt(4, 15);

        // ---------- Balanza A: aB + k1 = bB + k2 ----------
        let a = rndInt(1, 4);
        let b = rndInt(1, 4);
        if (a === b) continue;

        // Hacemos que a > b
        if (a < b) {
          const t = a;
          a = b;
          b = t;
        }

        const k1 = rndInt(0, 12);
        const deltaBoxes = a - b;
        const k2 = k1 + deltaBoxes * boxValue;
        if (k2 < 0 || k2 > 18) continue;

        // ---------- Balanza B: sack + mB + k3 = nB + k4 ----------
        const leftSacks = 1;
        const m = rndInt(0, 4);
        const n = rndInt(0, 4);
        if (m === n) continue;
        const k3 = rndInt(0, 12);
        const k4 = k3 + (m - n) * boxValue + leftSacks * sackValue;
        if (k4 < 0 || k4 > 22) continue;

        // Evitar demasiados objetos
        const totalA = a + b + k1 + k2;
        const totalB = leftSacks + m + n + k3 + k4;
        if (totalA > 32) continue;
        if (totalB > 34) continue;

        this.boxValue = boxValue;
        this.sackValue = sackValue;

        return {
          A: {
            L: { box: a, sack: 0, kg: k1 },
            R: { box: b, sack: 0, kg: k2 },
          },
          B: {
            L: { box: m, sack: leftSacks, kg: k3 },
            R: { box: n, sack: 0, kg: k4 },
          },
        };
      }

      // Fallback ultra simple
      this.boxValue = 5;
      this.sackValue = 7;
      return {
        A: { L: { box: 2, sack: 0, kg: 0 }, R: { box: 1, sack: 0, kg: 5 } },
        B: { L: { box: 1, sack: 1, kg: 0 }, R: { box: 3, sack: 0, kg: 3 } },
      };
    }

    _startRound(index, fresh = false) {
      this.roundIndex = index;
      this.timeLeft = this.timeLimit;
      this.errorsThisRound = 0;
      this.answerStr = "";
      this.answerFeedback = "";
      this.answerFeedbackTimer = 0;
      this.answerShakeT = 0;
      this.drag = null;
      this.hoverItem = null;
      this.cancelFx = [];

      this.roundData = this._generateRound();
      this.countsA.L = deepCopyCounts(this.roundData.A.L);
      this.countsA.R = deepCopyCounts(this.roundData.A.R);
      this.countsB.L = deepCopyCounts(this.roundData.B.L);
      this.countsB.R = deepCopyCounts(this.roundData.B.R);

      this.roundTransitionT = 0;
      this.roundTransitionLabel = "";
      this.roundTransitionNextIndex = -1;
      if (!fresh) this._roundRestarts++;
    }

    // =======================================================
    // Tutorial guiado (Práctica)
    // =======================================================

    _startTutorial() {
      // Reinicia estados generales
      this.state = "tutorial";
      this.gameFinished = false;
      this.win = false;

      // No usamos timer en práctica; dejamos mucho tiempo.
      this.timeLeft = 9999;
      this.errorsThisRound = 0;
      this.answerStr = "";
      this.answerFeedback = "";
      this.answerFeedbackTimer = 0;
      this.answerShakeT = 0;
      this.drag = null;
      this.hoverItem = null;
      this.roundTransitionT = 0;
      this.roundTransitionLabel = "";
      this.roundTransitionNextIndex = -1;

      // Fijamos valores internos (NO se muestran).
      this.boxValue = 3;
      this.sackValue = 4;

      this.tutorial.active = true;
      this.tutorial.step = 0;
      this.tutorial.phase = "cancelA";
      this._setupTutorialPhase();
    }

    _startRealGameFresh() {
      this.state = "playing";
      this.tutorial.active = false;
      this.roundIndex = 0;
      this.roundsCleared = 0;
      this._roundRestarts = 0;
      this._totalMistakes = 0;
      this._startRound(0, true);
    }

    _setupTutorialPhase() {
      // Configura las dos balanzas de acuerdo con la fase.
      const t = this.tutorial;

      // Reset de conteos
      this.countsA.L = { box: 0, sack: 0, kg: 0 };
      this.countsA.R = { box: 0, sack: 0, kg: 0 };
      this.countsB.L = { box: 0, sack: 0, kg: 0 };
      this.countsB.R = { box: 0, sack: 0, kg: 0 };

      this.answerStr = "";
      this.answerFeedback = "";
      this.answerFeedbackTimer = 0;

      if (t.phase === "cancelA") {
        // Balanza superior: 2 cajas + 3kg  vs  9kg
        this.countsA.L = { box: 2, sack: 0, kg: 3 };
        this.countsA.R = { box: 0, sack: 0, kg: 9 };

        // Balanza inferior (solo decorativa por ahora)
        this.countsB.L = { box: 0, sack: 1, kg: 7 };
        this.countsB.R = { box: 2, sack: 0, kg: 5 };

        t.cancelsNeeded = 3;
        t.cancelsDone = 0;
        t.lockBalance = 0;
        t.lockType = "kg";
        t.askTarget = null;
        t.message =
          "Práctica 1/2: Arrastra 3 veces un kilo fuera de la balanza superior (para cancelar 1kg en ambos lados).";
        return;
      }

      if (t.phase === "askBox") {
        // Ya debe estar: 2 cajas vs 6kg (si canceló 3 veces)
        // Por seguridad, forzamos el estado simplificado:
        this.countsA.L = { box: 2, sack: 0, kg: 0 };
        this.countsA.R = { box: 0, sack: 0, kg: 6 };

        // Mostramos la segunda balanza como adelanto (aíºn no interactiva)
        this.countsB.L = { box: 0, sack: 1, kg: 7 };
        this.countsB.R = { box: 2, sack: 0, kg: 5 };

        t.cancelsNeeded = 0;
        t.cancelsDone = 0;
        t.lockBalance = -1; // sin drag
        t.lockType = null;
        t.askTarget = "box";
        t.message =
          "Ahora responde: ¿cuántos kilos pesa UNA caja? Escribe el níºmero y presiona Enter.";
        return;
      }

      if (t.phase === "cancelB") {
        // Balanza superior ya resuelta (la dejamos estable)
        this.countsA.L = { box: 2, sack: 0, kg: 0 };
        this.countsA.R = { box: 0, sack: 0, kg: 6 };

        // Balanza inferior: costal + 7kg  vs  2 cajas + 5kg
        this.countsB.L = { box: 0, sack: 1, kg: 7 };
        this.countsB.R = { box: 2, sack: 0, kg: 5 };

        t.cancelsNeeded = 5;
        t.cancelsDone = 0;
        t.lockBalance = 1;
        t.lockType = "kg";
        t.askTarget = null;
        t.message =
          "Práctica 2/2: Arrastra 5 veces un kilo fuera de la balanza inferior (para cancelar 1kg en ambos lados).";
        return;
      }

      if (t.phase === "askSack") {
        // Estado simplificado: costal + 2kg  vs  2 cajas
        this.countsA.L = { box: 2, sack: 0, kg: 0 };
        this.countsA.R = { box: 0, sack: 0, kg: 6 };
        this.countsB.L = { box: 0, sack: 1, kg: 2 };
        this.countsB.R = { box: 2, sack: 0, kg: 0 };

        t.cancelsNeeded = 0;
        t.cancelsDone = 0;
        t.lockBalance = -1;
        t.lockType = null;
        t.askTarget = "sack";
        t.message =
          "Ahora responde: cuántos kilos pesa el COSTAL? (Usa lo que dedujiste de la caja). Enter para validar.";
        return;
      }

      // done
      t.message = "¡Listo! Iniciando el juego real";
    }

    _tutorialOnCancel(balanceIdx, type) {
      const t = this.tutorial;
      if (!t?.active) return;

      // Solo contamos cancelaciones que el tutorial pidió.
      if (t.lockBalance !== balanceIdx) return;
      if (t.lockType !== type) return;

      t.cancelsDone += 1;

      if (t.phase === "cancelA" && t.cancelsDone >= t.cancelsNeeded) {
        t.phase = "cancelB";
        this._setupTutorialPhase();
        return;
      }

      if (t.phase === "cancelB" && t.cancelsDone >= t.cancelsNeeded) {
        t.phase = "askSack";
        this._setupTutorialPhase();
        return;
      }

      // Actualiza el texto con progreso (sin dar el resultado)
      const remaining = Math.max(0, t.cancelsNeeded - t.cancelsDone);
      if (t.phase === "cancelA") {
        t.message =
          `Práctica 1/2: Arrastra ${remaining} vez/veces más un kilo fuera de la balanza superior.`;
      } else if (t.phase === "cancelB") {
        t.message =
          `Práctica 2/2: Arrastra ${remaining} vez/veces más un kilo fuera de la balanza inferior.`;
      }
    }

    _tutorialCheckAnswer() {
      const t = this.tutorial;
      const v = parseInt(this.answerStr, 10);
      if (!Number.isFinite(v)) {
        this.answerFeedback = "Escribe un níºmero.";
        this.answerFeedbackTimer = 1.0;
        this.answerShakeT = 0.2;
        this.playSfx(this.sfxWrong, { volume: 0.5 });
        return;
      }

      if (t.askTarget === "box") {
        if (v === this.boxValue) {
          this.playSfx(this.sfxCancel, { volume: 0.9 });
          t.phase = "cancelB";
          this._setupTutorialPhase();
          return;
        }
        this.playSfx(this.sfxWrong, { volume: 0.8 });
        this.answerFeedback = "No. Revisa la balanza superior y vuelve a intentar.";
        this.answerFeedbackTimer = 1.3;
        this.answerShakeT = 0.2;
        return;
      }

      if (t.askTarget === "sack") {
        if (v === this.sackValue) {
          this.playSfx(this.sfxWin, { volume: 0.9 });
          t.active = false;
          this._startRealGameFresh();
          return;
        }
        this.playSfx(this.sfxWrong, { volume: 0.8 });
        this.answerFeedback = "No. Simplifica y usa el valor de la caja.";
        this.answerFeedbackTimer = 1.3;
        this.answerShakeT = 0.2;
      }
    }

    // =======================================================
    // Input helpers
    // =======================================================

    _isKeyPressed(key) {
      const now = !!this.game.input.keys?.[key];
      const prev = !!this._prevKeys[key];
      return now && !prev;
    }

    _syncPrevInput() {
      const keys = this.game.input.keys || {};
      this._prevKeys = { ...keys };
      this._prevMouseDown = !!this.game.input.mouse?.down;
    }

    _updateUiFx(dt) {
      if (this.answerFeedbackTimer > 0) {
        this.answerFeedbackTimer -= dt;
        if (this.answerFeedbackTimer <= 0) this.answerFeedback = "";
      }
      if (this.answerShakeT > 0) {
        this.answerShakeT = Math.max(0, this.answerShakeT - dt);
      }

      for (let i = this.cancelFx.length - 1; i >= 0; i--) {
        this.cancelFx[i].t -= dt;
        if (this.cancelFx[i].t <= 0) this.cancelFx.splice(i, 1);
      }

      if (this.roundTransitionT > 0 && this.state === "playing") {
        this.roundTransitionT = Math.max(0, this.roundTransitionT - dt);
        if (
          this.roundTransitionT <= 0 &&
          Number.isInteger(this.roundTransitionNextIndex) &&
          this.roundTransitionNextIndex >= 0
        ) {
          const idx = this.roundTransitionNextIndex;
          this.roundTransitionNextIndex = -1;
          this._startRound(idx, true);
        }
      }
    }

    _mouseWorld() {
      const m = this.game.input.mouse || { x: 0, y: 0 };
      const z = this.game.zoom || 1;
      return {
        x: m.x / z + (this.camera?.x || 0),
        y: m.y / z + (this.camera?.y || 0),
      };
    }

    _pointInRect(x, y, r) {
      return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
    }

    _sideAtBalance(balanceIdx, pos) {
      const L = this._computePlateRect(balanceIdx, "L");
      const R = this._computePlateRect(balanceIdx, "R");
      const areaL = { x: L.x, y: L.y - 160, w: L.w, h: 220 };
      const areaR = { x: R.x, y: R.y - 160, w: R.w, h: 220 };
      if (this._pointInRect(pos.x, pos.y, areaL)) return "L";
      if (this._pointInRect(pos.x, pos.y, areaR)) return "R";
      return null;
    }

    _updateHoverItem(pos) {
      this.hoverItem = null;
      if (!(this.state === "playing" || this.state === "tutorial")) return;
      if (this.drag) return;

      const bIdx = this._whichBalance(pos);
      if (bIdx === null) return;
      const side = this._sideAtBalance(bIdx, pos);
      if (!side) return;
      const hit = this._hitItemAt(bIdx, side, pos);
      if (!hit) return;
      if (!this._canCancel(bIdx, hit.type)) return;

      this.hoverItem = { ...hit, balanceIdx: bIdx, side };
    }

    _startRoundTransition(nextIndex) {
      this.roundTransitionT = 0.55;
      this.roundTransitionNextIndex = nextIndex;
      this.roundTransitionLabel = `Ronda ${nextIndex + 1}/${this.totalRounds}`;
    }

    _hitButton(btn, mx, my) {
      if (!btn) return false;
      return (
        mx >= btn.x &&
        mx <= btn.x + btn.w &&
        my >= btn.y &&
        my <= btn.y + btn.h
      );
    }

    _layoutIntroButtons() {
      const w = 900;
      const h = 340;
      const y = 120;
      const btnW = 260;
      const btnH = 56;
      const btnY = y + h - 86;

      this._btnIntroPractice = {
        x: this.game.canvas.width / 2 - btnW - 16,
        y: btnY,
        w: btnW,
        h: btnH,
        label: "Práctica (guiada)",
      };
      this._btnIntroPlay = {
        x: this.game.canvas.width / 2 + 16,
        y: btnY,
        w: btnW,
        h: btnH,
        label: "Jugar (normal)",
      };
    }

    // =======================================================
    // Cancelación
    // =======================================================

    _getCountsByBalance(balanceIdx) {
      return balanceIdx === 0 ? this.countsA : this.countsB;
    }

    _canCancel(balanceIdx, type) {
      const C = this._getCountsByBalance(balanceIdx);
      return (C.L[type] || 0) > 0 && (C.R[type] || 0) > 0;
    }

    _cancelOne(balanceIdx, type) {
      const C = this._getCountsByBalance(balanceIdx);
      if ((C.L[type] || 0) <= 0) return false;
      if ((C.R[type] || 0) <= 0) return false;
      C.L[type] -= 1;
      C.R[type] -= 1;
      this.cancelFx.push({
        balanceIdx,
        type,
        t: 0.28,
        maxT: 0.28,
      });
      this.playSfx(
        type === "kg" || type === "box" ? this.sfxKgCancel : this.sfxCancel,
        { volume: 0.8 },
      );
      if (this.state === "tutorial") this._tutorialOnCancel(balanceIdx, type);
      return true;
    }

    // =======================================================
    // Layout por balanza
    // =======================================================

    _balanceYs(balanceIdx) {
      if (balanceIdx === 0)
        return { balanceY: this.ui.balanceYTop, plateY: this.ui.plateYTop };
      return { balanceY: this.ui.balanceYBottom, plateY: this.ui.plateYBottom };
    }

    _computePlateRect(balanceIdx, side) {
      const { centerX, gapX, plateW, plateH } = this.ui;
      const { plateY } = this._balanceYs(balanceIdx);
      const x =
        side === "L"
          ? centerX - gapX - plateW / 2
          : centerX + gapX - plateW / 2;
      const y = plateY;
      return { x, y, w: plateW, h: plateH };
    }

    _computeCancelZoneRect(balanceIdx) {
      // Zona "segura" alrededor de esa balanza: si sueltas dentro, NO cancela.
      // La hacemos chica para que sea facil soltar fuera.
      const { centerX } = this.ui;
      const { plateY } = this._balanceYs(balanceIdx);
      const top = plateY - 170;
      const bottom = plateY + 15;
      const w = 720;
      const h = Math.max(40, bottom - top);
      return { x: centerX - w / 2, y: top, w, h };
    }

    _layoutItemsForSide(sideCounts, plateRect) {
      const items = [];
      const size = this.ui.itemSize;

      const types = [
        { type: "sack", n: sideCounts.sack || 0 },
        { type: "box", n: sideCounts.box || 0 },
        { type: "kg", n: sideCounts.kg || 0 },
      ];

      const maxCols = Math.max(1, Math.floor(plateRect.w / (size + 6)));
      let col = 0;
      let row = 0;

      const baseX = plateRect.x + 10;
      const baseY = plateRect.y - size - 8;

      for (const t of types) {
        for (let i = 0; i < t.n; i++) {
          const x = baseX + col * (size + 6);
          const y = baseY - row * (size + 6);
          items.push({ type: t.type, x, y, w: size, h: size });
          col += 1;
          if (col >= maxCols) {
            col = 0;
            row += 1;
          }
        }
      }
      return items;
    }

    // =======================================================
    // Hit test / Drag
    // =======================================================

    _whichBalance(pos) {
      // Decide si el click cae en la zona de items de la balanza superior o inferior
      for (const idx of [0, 1]) {
        const L = this._computePlateRect(idx, "L");
        const R = this._computePlateRect(idx, "R");
        const areaL = { x: L.x, y: L.y - 160, w: L.w, h: 220 };
        const areaR = { x: R.x, y: R.y - 160, w: R.w, h: 220 };
        if (
          this._pointInRect(pos.x, pos.y, areaL) ||
          this._pointInRect(pos.x, pos.y, areaR)
        ) {
          return idx;
        }
      }
      return null;
    }

    _hitItemAt(balanceIdx, side, pos) {
      const counts = this._getCountsByBalance(balanceIdx);
      const plate = this._computePlateRect(balanceIdx, side);
      const items = this._layoutItemsForSide(counts[side], plate);

      // prioridad: sack > box > kg
      const priority = ["sack", "box", "kg"];
      for (const t of priority) {
        for (let i = items.length - 1; i >= 0; i--) {
          const it = items[i];
          if (it.type !== t) continue;
          if (this._pointInRect(pos.x, pos.y, it)) return it;
        }
      }
      return null;
    }

    _beginDrag(balanceIdx, hit, side, pos) {
      if (!hit) return;
      const type = hit.type;
      // Restricción de tutorial: solo permite arrastrar el objeto/pesa indicado.
      if (this.state === "tutorial" && this.tutorial?.active) {
        const t = this.tutorial;
        // Si hay un balance bloqueado, solo se puede interactuar con ese.
        if (t.lockBalance !== -1 && balanceIdx !== t.lockBalance) {
          this.playSfx(this.sfxWrong, { volume: 0.35 });
          return;
        }
        if (t.lockType && type !== t.lockType) {
          this.playSfx(this.sfxWrong, { volume: 0.35 });
          return;
        }
      }
      if (!this._canCancel(balanceIdx, type)) {
        this.playSfx(this.sfxWrong, { volume: 0.5 });
        return;
      }

      const plateThis = this._computePlateRect(balanceIdx, side);
      const otherSide = side === "L" ? "R" : "L";
      const plateOther = this._computePlateRect(balanceIdx, otherSide);
      const pairDx = plateOther.x - plateThis.x;

      this.drag = {
        balanceIdx,
        type,
        fromSide: side,
        x: pos.x,
        y: pos.y,
        pairDx,
        startX: pos.x,
        startY: pos.y,
        moved: false,
      };
    }

    _updateDrag(pos) {
      if (!this.drag) return;
      this.drag.x = pos.x;
      this.drag.y = pos.y;
      const dx = this.drag.x - this.drag.startX;
      const dy = this.drag.y - this.drag.startY;
      if (!this.drag.moved && dx * dx + dy * dy >= this.dragThreshold * this.dragThreshold) {
        this.drag.moved = true;
      }
    }

    _endDrag(pos) {
      if (!this.drag) return;
      if (!this.drag.moved) {
        this.drag = null;
        return;
      }
      const z = this._computeCancelZoneRect(this.drag.balanceIdx);
      const droppedInside = this._pointInRect(pos.x, pos.y, z);
      if (!droppedInside) {
        this._cancelOne(this.drag.balanceIdx, this.drag.type);
      }
      this.drag = null;
    }

    // =======================================================
    // Lógica principal
    // =======================================================

    update(dt) {
      super.update(dt);

      const input = this.game.input;
      const mouseDown = !!input.mouse?.down;
      const mousePressed = mouseDown && !this._prevMouseDown;
      const mouseReleased = !mouseDown && this._prevMouseDown;
      const pos = this._mouseWorld();
      this._mousePos = pos;
      this._updateUiFx(dt);
      this._updateHoverItem(pos);

      if (this.state === "intro") {
        this._layoutIntroButtons();
        if (mousePressed) {
          if (this._hitButton(this._btnIntroPractice, pos.x, pos.y)) {
            this._startTutorial();
            this._syncPrevInput();
            return;
          }
          if (this._hitButton(this._btnIntroPlay, pos.x, pos.y)) {
            this._startRealGameFresh();
            this._syncPrevInput();
            return;
          }
        }
        if (this._isKeyPressed("Enter") || this._isKeyPressed(" ")) {
          this._startRealGameFresh();
        }
        this._syncPrevInput();
        return;
      }

      if (this.state === "finished") {
        const exit =
          this._isKeyPressed("Enter") ||
          this._isKeyPressed(" ") ||
          mousePressed;
        if (exit) {
          const wantsOverworld = window.MN_APP?.toOverworld;
          if (typeof wantsOverworld === "function") {
            window.MN_APP.toOverworld();
          } else {
            const sm = this.game.sceneManager;
            if (sm?.scenes?.overworld) sm.switch("overworld");
          }
        }
        this._syncPrevInput();
        return;
      }

      if (this.state === "tutorial") {
        // Atajos íºtiles
        if (this._isKeyPressed("Escape")) {
          const wantsOverworld = window.MN_APP?.toOverworld;
          if (typeof wantsOverworld === "function") window.MN_APP.toOverworld();
          else {
            const sm = this.game.sceneManager;
            if (sm?.scenes?.overworld) sm.switch("overworld");
          }
          this._syncPrevInput();
          return;
        }

        // Drag restringido por fase
        if (mousePressed) {
          const bIdx = this._whichBalance(pos);
          if (bIdx !== null) {
            const side = this._sideAtBalance(bIdx, pos);
            if (side) {
              const hit = this._hitItemAt(bIdx, side, pos);
              this._beginDrag(bIdx, hit, side, pos);
            }
          }
        }
        if (mouseDown) this._updateDrag(pos);
        if (mouseReleased) this._endDrag(pos);

        // Input numérico (solo si está preguntando)
        const t = this.tutorial;
        const asking = !!t?.askTarget;
        if (asking) {
          const digits = "0123456789";
          for (const d of digits) {
            if (this._isKeyPressed(d)) {
              if (this.answerStr.length < 3) this.answerStr += d;
            }
          }
          for (let n = 0; n <= 9; n++) {
            const k = `Numpad${n}`;
            if (this._isKeyPressed(k)) {
              if (this.answerStr.length < 3) this.answerStr += String(n);
            }
          }
          if (this._isKeyPressed("Backspace")) this.answerStr = this.answerStr.slice(0, -1);
          if (this._isKeyPressed("Enter")) this._tutorialCheckAnswer();
        } else {
          // Si no está preguntando, Enter/Space no hacen nada (evita confusiones)
          if (this._isKeyPressed("Backspace")) this.answerStr = "";
        }

        this._syncPrevInput();
        return;
      }


      // playing
      if (this.roundTransitionT > 0) {
        this._syncPrevInput();
        return;
      }

      this.timeLeft -= dt;
      if (this.timeLeft <= 0) {
        // perder ronda por tiempo
        this.playSfx(this.sfxWrong, { volume: 0.7 });
        this._startRound(this.roundIndex, false);
        this._syncPrevInput();
        return;
      }

      // ---- Drag (en cualquiera de las 2 balanzas) ----
      if (mousePressed) {
        const bIdx = this._whichBalance(pos);
        if (bIdx !== null) {
          // decidir lado
          const side = this._sideAtBalance(bIdx, pos);
          if (side) {
            const hit = this._hitItemAt(bIdx, side, pos);
            this._beginDrag(bIdx, hit, side, pos);
          }
        }
      }

      if (mouseDown) this._updateDrag(pos);
      if (mouseReleased) this._endDrag(pos);

      // ---- Input de respuesta (siempre) ----
      const digits = "0123456789";
      for (const d of digits) {
        if (this._isKeyPressed(d)) {
          if (this.answerStr.length < 3) this.answerStr += d;
        }
      }
      for (let n = 0; n <= 9; n++) {
        const k = `Numpad${n}`;
        if (this._isKeyPressed(k)) {
          if (this.answerStr.length < 3) this.answerStr += String(n);
        }
      }

      if (this._isKeyPressed("Backspace")) {
        this.answerStr = this.answerStr.slice(0, -1);
      }

      if (this._isKeyPressed("Enter")) {
        this._checkAnswer();
      }

      this._syncPrevInput();
    }

    _checkAnswer() {
      if (this.state === "tutorial") {
        this._tutorialCheckAnswer();
        return;
      }

      const v = parseInt(this.answerStr, 10);
      if (!Number.isFinite(v)) {
        this.answerFeedback = "Escribe un numero.";
        this.answerFeedbackTimer = 1.0;
        this.answerShakeT = 0.2;
        this.playSfx(this.sfxWrong, { volume: 0.5 });
        return;
      }

      if (v === this.sackValue) {
        this.playSfx(this.sfxCancel, { volume: 0.9 });
        this.roundsCleared += 1;
        const nextIndex = this.roundsCleared;
        if (this.roundsCleared >= this.totalRounds) {
          this._finishGame();
        } else {
          this._startRoundTransition(nextIndex);
        }
      } else {
        this.errorsThisRound += 1;
        this._totalMistakes += 1;
        this.playSfx(this.sfxWrong, { volume: 0.8 });
        this.answerShakeT = 0.2;

        if (this.errorsThisRound > this.maxErrorsPerRound) {
          this.answerFeedback = "Demasiados errores. Ronda reiniciada.";
          this.answerFeedbackTimer = 1.2;
          this._startRound(this.roundIndex, false);
        } else {
          this.answerFeedback = "No. Intenta otra vez.";
          this.answerFeedbackTimer = 1.1;
        }
      }
    }

    _finishGame() {
      this.state = "finished";
      this.win = true;
      this.gameFinished = true;
      this.sheetsReward = 0;

      let tier = 1;
      if (this._roundRestarts === 0 && this._totalMistakes === 0) tier = 3;
      else if (this._roundRestarts <= 1 && this._totalMistakes <= 2) tier = 2;
      else tier = 1;

      try {
        if (typeof window.MN_reportMinigameTier === "function") {
          this.sheetsReward = window.MN_reportMinigameTier("balanza", tier);
        }
      } catch (_) {}

      this.playSfx(this.sfxWin, { volume: 0.9 });
    }

    // =======================================================
    // Render
    // =======================================================

    _drawBackground(ctx) {              
    if (this.bgImage) {    
        ctx.drawImage(this.bgImage, 0, 0, this.game.canvas.width, this.game.canvas.height,);
      } else {
        ctx.fillStyle = "#1a1a1a";
        ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);
      }
    }

    _drawTopBar(ctx) {
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, 0, this.game.canvas.width, 62);
      ctx.fillStyle = "#fff";

      ctx.font = "17px Arial";
      ctx.textAlign = "left";
      ctx.fillText(
        this.state === "tutorial"
          ? "Tiempo: -"
          : `Tiempo: ${formatTime(this.timeLeft)}`,
        18,
        28,
      );

      if (this.state !== "tutorial") {
        const remaining = this.maxErrorsPerRound - this.errorsThisRound;
        ctx.font = "15px Arial";
        ctx.fillText(`Errores: ${remaining}`, 18, 50);
      }

      ctx.font = "19px Arial";
      ctx.textAlign = "center";
      ctx.fillText(
        this.state === "tutorial"
          ? "Practica guiada"
          : `Balanzas ${this.roundIndex + 1}/${this.totalRounds}`,
        this.game.canvas.width / 2,
        30,
      );

      if (this.state === "playing") {
        const W = this.game.canvas.width;
        const barW = 220;
        const barH = 8;
        const bx = (W - barW) / 2;
        const by = 44;
        const frac = Math.max(
          0,
          Math.min(1, this.roundsCleared / this.totalRounds),
        );
        ctx.fillStyle = "rgba(255,255,255,0.20)";
        ctx.fillRect(bx, by, barW, barH);
        ctx.fillStyle = "#ffcc4d";
        ctx.fillRect(bx, by, Math.round(barW * frac), barH);
        ctx.strokeStyle = "rgba(255,255,255,0.45)";
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, barW, barH);
      }

      ctx.restore();
    }
    _drawBalance(ctx, balanceIdx, label, counts) {
      const { centerX, gapX } = this.ui;
      const { balanceY, plateY } = this._balanceYs(balanceIdx);
      const isActive = this.drag && this.drag.balanceIdx === balanceIdx;
      const hoverThisBalance =
        this.hoverItem && this.hoverItem.balanceIdx === balanceIdx;

      ctx.save();
      ctx.strokeStyle = isActive
        ? "rgba(255, 235, 120, 0.9)"
        : hoverThisBalance
          ? "rgba(240, 230, 200, 0.88)"
          : "rgba(214, 204, 204, 0.65)";
      ctx.lineWidth = isActive ? 9 : 8;

      // Poste
      ctx.beginPath();
      ctx.moveTo(centerX, balanceY - 110);
      ctx.lineTo(centerX, plateY + 10);
      ctx.stroke();

      // Barra
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(centerX - gapX, balanceY);
      ctx.lineTo(centerX + gapX, balanceY);
      ctx.stroke();

      // Cuerdas
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(centerX - gapX, balanceY);
      ctx.lineTo(centerX - gapX, plateY);
      ctx.moveTo(centerX + gapX, balanceY);
      ctx.lineTo(centerX + gapX, plateY);
      ctx.stroke();

      // Platos
      const plateL = this._computePlateRect(balanceIdx, "L");
      const plateR = this._computePlateRect(balanceIdx, "R");
      ctx.fillStyle = "rgba(220, 124, 28, 0.85)";
      ctx.fillRect(plateL.x, plateL.y, plateL.w, plateL.h);
      ctx.fillRect(plateR.x, plateR.y, plateR.w, plateR.h);

      // Etiqueta
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(18, balanceIdx === 0 ? 66 : 290, 200, 32);
      ctx.fillStyle = "#fff";
      ctx.font = "18px Arial";
      ctx.textAlign = "left";
      ctx.fillText(label, 28, balanceIdx === 0 ? 88 : 312);

      const itemsL = this._layoutItemsForSide(counts.L, plateL);
      const itemsR = this._layoutItemsForSide(counts.R, plateR);

      const drawOne = (it, highlightCancel, isHover = false) => {
        if (it.type === "box") {
          ctx.fillStyle = "#8b5a2b";
          ctx.fillRect(it.x, it.y, it.w, it.h);
          ctx.strokeStyle = "rgba(0,0,0,0.55)";
          ctx.lineWidth = 3;
          ctx.strokeRect(it.x, it.y, it.w, it.h);
          ctx.fillStyle = "rgba(255,255,255,0.85)";
          ctx.font = "16px Arial";
          ctx.textAlign = "center";
          ctx.fillText("Caja", it.x + it.w / 2, it.y + it.h / 2 + 6);
        } else if (it.type === "sack") {
          ctx.fillStyle = "#c2a26b";
          if (typeof ctx.roundRect === "function") {
            ctx.beginPath();
            ctx.roundRect(it.x, it.y, it.w, it.h, 10);
            ctx.fill();
          } else {
            ctx.fillRect(it.x, it.y, it.w, it.h);
          }
          ctx.strokeStyle = "rgba(0,0,0,0.45)";
          ctx.lineWidth = 3;
          if (typeof ctx.roundRect === "function") ctx.stroke();
          else ctx.strokeRect(it.x, it.y, it.w, it.h);
          ctx.fillStyle = "rgba(0,0,0,0.75)";
          ctx.font = "16px Arial";
          ctx.textAlign = "center";
          ctx.fillText("Costal", it.x + it.w / 2, it.y + it.h / 2 + 6);
        } else {
          ctx.fillStyle = "#9aa0a6";
          ctx.beginPath();
          ctx.arc(
            it.x + it.w / 2,
            it.y + it.h / 2,
            it.w * 0.42,
            0,
            Math.PI * 2,
          );
          ctx.fill();
          ctx.strokeStyle = "rgba(0,0,0,0.45)";
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.fillStyle = "rgba(0,0,0,0.8)";
          ctx.font = "16px Arial";
          ctx.textAlign = "center";
          ctx.fillText("1", it.x + it.w / 2, it.y + it.h / 2 + 6);
        }

        if (highlightCancel) {
          ctx.strokeStyle = "rgba(255,255,255,0.25)";
          ctx.lineWidth = 2;
          ctx.strokeRect(it.x - 2, it.y - 2, it.w + 4, it.h + 4);
        }
        if (isHover) {
          ctx.strokeStyle = "rgba(255, 235, 59, 0.92)";
          ctx.lineWidth = 3;
          ctx.strokeRect(it.x - 3, it.y - 3, it.w + 6, it.h + 6);
        }
      };

      itemsL.forEach((it) =>
        drawOne(
          it,
          this._canCancel(balanceIdx, it.type),
          !!(
            this.hoverItem &&
            this.hoverItem.balanceIdx === balanceIdx &&
            this.hoverItem.side === "L" &&
            this.hoverItem.type === it.type &&
            this.hoverItem.x === it.x &&
            this.hoverItem.y === it.y
          ),
        ),
      );
      itemsR.forEach((it) =>
        drawOne(
          it,
          this._canCancel(balanceIdx, it.type),
          !!(
            this.hoverItem &&
            this.hoverItem.balanceIdx === balanceIdx &&
            this.hoverItem.side === "R" &&
            this.hoverItem.type === it.type &&
            this.hoverItem.x === it.x &&
            this.hoverItem.y === it.y
          ),
        ),
      );

      // Drag ghost SOLO si corresponde a esta balanza
      if (this.drag && this.drag.balanceIdx === balanceIdx) {
        const size = this.ui.itemSize;
        const gx = this.drag.x - size / 2;
        const gy = this.drag.y - size / 2;

        const ghost = { type: this.drag.type, x: gx, y: gy, w: size, h: size };
        const ghostPair = {
          type: this.drag.type,
          x: gx + (this.drag.pairDx || 0),
          y: gy,
          w: size,
          h: size,
        };

        ctx.globalAlpha = 0.9;
        drawOne(ghost, true, false);
        ctx.globalAlpha = 0.55;
        drawOne(ghostPair, true, false);
        ctx.globalAlpha = 1;

        const z = this._computeCancelZoneRect(balanceIdx);
        const inside = this._pointInRect(this.drag.x, this.drag.y, z);
        const willCancel = this.drag.moved && !inside;
        ctx.strokeStyle = willCancel
          ? "rgba(136, 255, 136, 0.9)"
          : "rgba(255,255,255,0.22)";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.strokeRect(z.x, z.y, z.w, z.h);
        ctx.setLineDash([]);

        ctx.font = "14px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillStyle = willCancel
          ? "rgba(170,255,170,0.95)"
          : "rgba(255,255,255,0.82)";
        ctx.fillText(
          willCancel ? "Suelta para cancelar" : "Dentro de zona segura",
          z.x + z.w / 2,
          z.y - 8,
        );
      }

      for (const fx of this.cancelFx) {
        if (fx.balanceIdx !== balanceIdx) continue;
        const a = Math.max(0, Math.min(1, fx.t / fx.maxT));
        const rise = (1 - a) * 22;
        const leftX = centerX - gapX;
        const rightX = centerX + gapX;
        const yy = plateY - 42 - rise;
        ctx.font = "bold 24px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = `rgba(255,245,180,${0.95 * a})`;
        ctx.fillText("-1", leftX, yy);
        ctx.fillText("-1", rightX, yy);
      }

      ctx.restore();
    }

    _drawAnswerBox(ctx) {
      const w = 520;
      const h = 78;
      const x = (this.game.canvas.width - w) / 2;
      const y = this.game.canvas.height - h - 18;
      const shakeAmp = this.answerShakeT > 0 ? 6 * (this.answerShakeT / 0.2) : 0;
      const shakeX = shakeAmp > 0 ? Math.sin(Date.now() * 0.06) * shakeAmp : 0;

      ctx.save();
      if (shakeX) ctx.translate(shakeX, 0);
      ctx.fillStyle = "rgba(0,0,0,0.60)";
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle =
        this.answerShakeT > 0
          ? "rgba(255,120,120,0.95)"
          : "rgba(255,255,255,0.25)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);

      // ---- layout en una sola fila: etiqueta + input ----
      const padL = 22;
      const midY = y + h / 2 + 2;

      // Etiqueta
      const t = this.tutorial;
      const label =
        this.state === "tutorial" && t?.askTarget === "box"
          ? "Peso de UNA caja (kg):"
          : "Peso del costal (kg):";
      ctx.fillStyle = "#fff";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.font = "18px Arial";
      ctx.fillText(label, x + padL, midY);

      // Medir ancho del texto para poner el input enfrente
      const labelW = ctx.measureText(label).width;

      // Input (a la derecha de la etiqueta)
      const inW = 140;
      const inH = 42;
      const gap = 14;

      const inX = x + padL + labelW + gap;
      const inY = y + (h - inH) / 2;

      // Fondo y borde del input
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.fillRect(inX, inY, inW, inH);
      ctx.strokeStyle =
        this.answerShakeT > 0
          ? "rgba(255,150,150,0.95)"
          : "rgba(255,255,255,0.35)";
      ctx.strokeRect(inX, inY, inW, inH);

      // Texto del input (alineado a la izquierda, se ve más de formulario)
      ctx.fillStyle = "#fff";
      ctx.font = "28px Arial";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      const text = this.answerStr || "_";
      ctx.fillText(text, inX + 12, inY + inH / 2 + 1);

      // Feedback (si lo usas)
      if (this.answerFeedback) {
        ctx.fillStyle = this.answerFeedback.includes("No")
          ? "#ffd1d1"
          : "#d8ffd8";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.fillText(this.answerFeedback, x + w / 2, y - 10); // arriba del panel, para que no empuje UI
      }

      ctx.restore();
    }


    _drawTutorialMessage(ctx, msg) {
      const w = 920;
      const h = 78;
      const x = (this.game.canvas.width - w) / 2;
      const y = 0; // debajo de la barra superior

      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.62)";
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);

      ctx.fillStyle = "#fff";
      ctx.font = "18px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(msg, x + w / 2, y + h / 2);

      // Hint de teclas (sin dar respuestas)
      ctx.font = "14px Arial";
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.textAlign = "right";
      ctx.fillText("Esc: volver", x + w - 16, y + h - 16);

      ctx.restore();
    }

    _drawIntro(ctx) {
      const w = 900;
      const h = 340;
      const x = (this.game.canvas.width - w) / 2;
      const y = 120;
      this._layoutIntroButtons();

      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.65)";
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);

      ctx.fillStyle = "#fff";
      ctx.font = "26px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Balanzas: simplifica para pensar", x + w / 2, y + 52);

      ctx.font = "18px Arial";
      const lines = [
        "Deduce el peso de un costal, escrí­belo y presiona Enter.",
        "Puedes simplificar las balanzas arrastrando un objeto fuera de ella para cancelarlo.",
        "Solo puedes cancelar si ese objeto existe en ambos lados.",                
        "Tienes 120 segundos y sólo un error por ronda.",
        "Elige práctica guiada para aprender a jugar.",
      ];
      let yy = y + 92;
      for (const ln of lines) {
        ctx.fillText(ln, x + w / 2, yy);
        yy += 26;
      }

      ctx.fillStyle = "rgba(255,235,59,0.12)";
      ctx.strokeStyle = "rgba(255,235,59,0.70)";
      ctx.lineWidth = 2;
      ctx.fillRect(
        this._btnIntroPractice.x,
        this._btnIntroPractice.y,
        this._btnIntroPractice.w,
        this._btnIntroPractice.h,
      );
      ctx.strokeRect(
        this._btnIntroPractice.x,
        this._btnIntroPractice.y,
        this._btnIntroPractice.w,
        this._btnIntroPractice.h,
      );
      ctx.font = "18px Arial";
      ctx.fillStyle = "#ffeb3b";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        this._btnIntroPractice.label,
        this._btnIntroPractice.x + this._btnIntroPractice.w / 2,
        this._btnIntroPractice.y + this._btnIntroPractice.h / 2,
      );

      ctx.fillStyle = "rgba(255,255,255,0.10)";
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.fillRect(
        this._btnIntroPlay.x,
        this._btnIntroPlay.y,
        this._btnIntroPlay.w,
        this._btnIntroPlay.h,
      );
      ctx.strokeRect(
        this._btnIntroPlay.x,
        this._btnIntroPlay.y,
        this._btnIntroPlay.w,
        this._btnIntroPlay.h,
      );
      ctx.fillStyle = "#fff";
      ctx.fillText(
        this._btnIntroPlay.label,
        this._btnIntroPlay.x + this._btnIntroPlay.w / 2,
        this._btnIntroPlay.y + this._btnIntroPlay.h / 2,
      );

      ctx.restore();
    }

    _drawFinished(ctx) {
      const w = 720;
      const h = 220;
      const x = (this.game.canvas.width - w) / 2;
      const y = 200;

      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.70)";
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);

      ctx.fillStyle = "#fff";
      ctx.font = "30px Arial";
      ctx.textAlign = "center";
      ctx.fillText("¡Bien hecho!", x + w / 2, y + 70);
      ctx.font = "18px Arial";
      ctx.fillText("Presiona Enter, espacio o haz clic para volver", x + w / 2, y + 120);
      ctx.fillText(`Hojas ganadas: ${this.sheetsReward}.`, x + w / 2, y + 152);
      ctx.restore();
    }

    _drawRoundTransition(ctx) {
      if (!(this.state === "playing") || this.roundTransitionT <= 0) return;
      const a = Math.max(0, Math.min(1, this.roundTransitionT / 0.55));
      const w = 420;
      const h = 86;
      const x = (this.game.canvas.width - w) / 2;
      const y = (this.game.canvas.height - h) / 2;

      ctx.save();
      ctx.fillStyle = `rgba(0,0,0,${0.62 * a})`;
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = `rgba(255,235,120,${0.9 * a})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = `rgba(255,245,180,${a})`;
      ctx.font = "28px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(this.roundTransitionLabel || "Siguiente ronda", x + w / 2, y + h / 2);
      ctx.restore();
    }

    draw(ctx) {
      this._drawBackground(ctx);
      this._drawTopBar(ctx);

      if (this.state === "tutorial" && this.tutorial?.message) {
        this._drawTutorialMessage(ctx, this.tutorial.message);
      }


      if (this.state === "intro") {
        this._drawIntro(ctx);        
        return;
      }

      if (this.state === "finished") {
        this._drawFinished(ctx);
        return;
      }

      // playing: ambas balanzas siempre
      this._drawBalance(ctx, 0, "Balanza 1", this.countsA);
      this._drawBalance(ctx, 1, "Balanza 2", this.countsB);
      this._drawAnswerBox(ctx);
      this._drawRoundTransition(ctx);
    }
  }

  window.BalanzaScene = BalanzaScene;
})();

