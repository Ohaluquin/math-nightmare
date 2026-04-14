// js/areas/aritmetica/niveles/despejesScene.js
// ===========================================================
// DespejesScene.js — "Propiedades para Despejar"
// V1: rondas + vidas + seleccionar término + botón de propiedad + simplificar por pasos.
// Requiere: motor2D.js (Scene), assets ya cargados, estilo coherente con otros minijuegos.
// ===========================================================

// js/areas/aritmetica/niveles/despejesScene.js
// ===========================================================
// DespejesScene.js — "Propiedades para Despejar" (V1.1)
// Cambios vs V1:
//  - SIEMPRE se muestran 4 botones: addInv, mulInv, mulFactor, simplify (clicables siempre).
//  - El “timing” importa: si el botón/acción no aplica, marca error (vida menos) o warning.
//  - Inverso multiplicativo se aplica explícito (ax/a = b/a) y requiere simplificar por pasos:
//      a/a -> 1,  1x -> x   (igual que +c - c -> 0, x+0->x)
//  - Dificultad 3: casi sin guía (solo “Despeja b”) y menos hints.
// NOTA: Esta versión sigue usando “casos” como máquina de estados (sin parser general).
// ===========================================================

(function () {
  class DespejesScene extends Scene {
    constructor(game, options = {}) {
      super(game);

      this.sceneId = "despejes";
      this.minigameId = "despejes";

      // Config
      this.totalRounds = 5;
      this.livesMax = 5;

      this.ui = {
        topBarH: 72,
        panelH: 170,
        gap: 10,
      };

      // Estado
      this.roundIndex = 0;
      this.lives = this.livesMax;
      this.state = "intro"; // intro | playing | finished
      this.gameFinished = false;
      this.win = false;
      this.isPractice = false;
      this.exitDelay = 0;
      this.sheetsReward = 0;
      this.finalTier = 0;
      this.finalMessage = "";
      this._mistakesCount = 0;
      this._roundPlanDefault = [
        { difficulty: 1 },
        { difficulty: 1 },
        { difficulty: 2 },
        { difficulty: 2 },
        { difficulty: 3 },
      ];
      this._roundPlanPractice = [{ difficulty: 1 }];
      this._btnIntroPractice = null;
      this._btnIntroPlay = null;
      this._prevKeys = {};
      this._usedCaseIdsByDiff = {};
      this.roundTransitionT = 0;
      this.roundTransitionLabel = "";
      this._simplifyFxT = 0;
      this._simplifyFxText = "";
      this._doorOpenT = 0;
      this._errorFlashT = 0;
      this._shakeT = 0;
      this._inputLockT = 0;
      this.bgImage = null;
      this.bgImageNext = null;
      this._runForwardT = 0;
      this._runFxPhase = 0;
      this._runQueued = false;
      this._doorOpenDuration = 1.05;
      this._runDuration = 1.2;

      this.case = null; // caso actual
      this.stepIndex = 0; // paso actual (estado)
      this.selectedTerm = null; // término elegido (ej: "c")
      this.message = "";
      this.messageT = 0;
      this._autoNextTimer = 0;
      this._solvedThisRound = false;
      this.finished = false;

      // Auto-advance al resolver
      this._autoNextTimer = 0;
      this._solvedThisRound = false;

      // Input edge
      this._prevMouseDown = false;

      // Hitboxes UI
      this._termButtons = [];
      this._opButtons = [];

      // Ajustes por dificultad
      this._hideGuidance = false; // se activa en diff 3 (menos ayuda)
    }

    init() {
      window.MN_setLeafHUDVisible?.(false);
      this.state = "intro";
      this.gameFinished = false;
      this.finished = false;
      this.case = null;
      this.roundIndex = 0;
      this.stepIndex = 0;
      this.selectedTerm = null;
      this._mistakesCount = 0;
      this._autoNextTimer = 0;
      this._solvedThisRound = false;
      this.message = "";
      this.messageT = 0;
      this.roundTransitionT = 0;
      this.roundTransitionLabel = "";
      this._simplifyFxT = 0;
      this._simplifyFxText = "";
      this._doorOpenT = 0;
      this._errorFlashT = 0;
      this._shakeT = 0;
      this._inputLockT = 0;
      this._runForwardT = 0;
      this._runFxPhase = 0;
      this._runQueued = false;
      this.bgImage =
        this.game?.assets?.getImage?.("bg_despejes_pasillo") || null;
      this.bgImageNext =
        this.game?.assets?.getImage?.("bg_despejes_pasillo2") || null;
      this._syncPrevInput();
    }

    destroy() {
      window.MN_setLeafHUDVisible?.(true);
    }

    playSfx(key, options = {}) {
      if (!key) return;
      const assets = this.game.assets;
      if (!assets || typeof assets.playSound !== "function") return;
      assets.playSound(key, options);
    }

    _startPracticeMode() {
      this.isPractice = true;
      this.state = "playing";
      this.gameFinished = false;
      this.finished = false;
      this.win = false;
      this.exitDelay = 0;
      this.sheetsReward = 0;
      this.finalTier = 0;
      this.finalMessage = "";
      this.lives = this.livesMax;
      this._mistakesCount = 0;
      this._roundPlan = this._roundPlanPractice.slice();
      this.totalRounds = this._roundPlan.length;
      this._usedCaseIdsByDiff = {};
      this._startRound(0);
    }

    _startMainGameMode() {
      this.isPractice = false;
      this.state = "playing";
      this.gameFinished = false;
      this.finished = false;
      this.win = false;
      this.exitDelay = 0;
      this.sheetsReward = 0;
      this.finalTier = 0;
      this.finalMessage = "";
      this.lives = this.livesMax;
      this._mistakesCount = 0;
      this._roundPlan = this._roundPlanDefault.slice();
      this.totalRounds = this._roundPlan.length;
      this._usedCaseIdsByDiff = {};
      this._startRound(0);
    }

    // =========================================================
    // Catálogo de casos (máquina de estados)
    // Cada step define:
    //  - eqL, eqR
    //  - prompt (opcional, en diff 3 suele estar vacío)
    //  - terms: términos clicables sugeridos (en diff 3 se muestran igual, pero con menos texto)
    //  - goal: { op, term? }  -> si coincide, avanza al siguiente step
    //  - warn: [{ op, term?, msg }] -> válido pero no recomendado (NO avanza, NO quita vida)
    //  - valid: [{ op, term? }] -> válido pero no óptimo (NO avanza, NO quita vida)
    //  - invalidMsg: string base para invalid (quita vida)
    //  - allowNoTermFor: ["simplify"] etc.
    // =========================================================
    _casesCatalog() {
      const external = window.ALGEBRA_DESPEJES_CATALOG;
      if (Array.isArray(external) && external.length) return external;
      console.warn(
        "[Despejes] Catalogo externo no cargado (ALGEBRA_DESPEJES_CATALOG).",
      );
      return [];
    }

    _pickCaseForRound(difficulty) {
      const pool = this._casesCatalog().filter(
        (c) => c.difficulty === difficulty,
      );
      if (!pool.length) return null;

      const used = this._usedCaseIdsByDiff[difficulty] || new Set();
      let available = pool.filter((c) => !used.has(c.id));

      if (!available.length) {
        used.clear();
        available = pool.slice();
      }

      const idx = Math.floor(Math.random() * available.length);
      const picked = available[idx];
      used.add(picked.id);
      this._usedCaseIdsByDiff[difficulty] = used;
      return picked;
    }

    _startRound(i) {
      this.roundIndex = i;
      this.stepIndex = 0;
      this.selectedTerm = null;
      this.message = "";
      this.messageT = 0;
      this._solvedThisRound = false;
      this._autoNextTimer = 0;
      this.finished = false;
      this._simplifyFxT = 0;
      this._simplifyFxText = "";
      this._doorOpenT = 0;
      this._errorFlashT = 0;
      this._shakeT = 0;
      this._inputLockT = 0;
      this._runForwardT = 0;
      this._runFxPhase = 0;
      this._runQueued = false;

      const diff = this._roundPlan[i]?.difficulty || 1;
      this.case = this._pickCaseForRound(diff);

      this._hideGuidance = diff >= 3;

      this._setMsg(
        `Corredor ${i + 1} de ${this.totalRounds} (Dificultad ${diff})`,
        1.1,
      );
    }

    // =========================================================
    // Update / Input
    // =========================================================
    update(dt) {
      super.update(dt);
      const mouse = this.game.input.mouse || { down: false, x: 0, y: 0 };
      const justClick = !!mouse.down && !this._prevMouseDown;
      const enterPressed = this._isKeyPressed("Enter");
      const spacePressed = this._isKeyPressed(" ");
      const actionPressed = enterPressed || spacePressed || justClick;

      if (this.state === "intro") {
        this._layoutIntroButtons();
        if (justClick) {
          if (this._hit(mouse.x, mouse.y, this._btnIntroPractice)) {
            this._startPracticeMode();
            this._syncPrevInput();
            return;
          }
          if (this._hit(mouse.x, mouse.y, this._btnIntroPlay)) {
            this._startMainGameMode();
            this._syncPrevInput();
            return;
          }
        }
        if (enterPressed || spacePressed) {
          this._startMainGameMode();
          this._syncPrevInput();
          return;
        }
        this._syncPrevInput();
        return;
      }

      if (this.state === "finished") {
        if (this.exitDelay > 0)
          this.exitDelay = Math.max(0, this.exitDelay - dt);
        if (this.exitDelay <= 0 && actionPressed) {
          const wantsOverworld = window.MN_APP?.toOverworld;
          if (typeof wantsOverworld === "function") {
            wantsOverworld();
          } else {
            const sm = this.game.sceneManager;
            if (sm?.scenes?.overworld) sm.switch("overworld");
          }
          this._syncPrevInput();
          return;
        }
        this._syncPrevInput();
        return;
      }

      if (this.state !== "playing") {
        this._syncPrevInput();
        return;
      }

      if (this.roundTransitionT > 0) {
        this.roundTransitionT = Math.max(0, this.roundTransitionT - dt);
      }
      if (this._doorOpenT > 0) {
        const prev = this._doorOpenT;
        this._doorOpenT = Math.max(0, this._doorOpenT - dt);
        if (prev > 0 && this._doorOpenT <= 0 && this._runQueued) {
          this._runQueued = false;
          this._runForwardT = this._runDuration;
        }
      }
      if (this._runForwardT > 0) {
        this._runForwardT = Math.max(0, this._runForwardT - dt);
        this._runFxPhase += dt * 8.5;
      }
      if (this._simplifyFxT > 0) {
        this._simplifyFxT = Math.max(0, this._simplifyFxT - dt);
      }
      if (this._errorFlashT > 0) {
        this._errorFlashT = Math.max(0, this._errorFlashT - dt);
      }
      if (this._shakeT > 0) {
        this._shakeT = Math.max(0, this._shakeT - dt);
      }
      if (this._inputLockT > 0) {
        this._inputLockT = Math.max(0, this._inputLockT - dt);
      }

      // Si estamos en pausa por éxito, cuenta y avanza automático
      if (this._autoNextTimer > 0) {
        this._autoNextTimer -= dt;
        if (this._autoNextTimer <= 0) {
          this._autoNextTimer = 0;
          this.finished = false;
          this._advanceAfterSuccess();
        }
        this._syncPrevInput();
        return;
      }

      if (this.finished) {
        this._syncPrevInput();
        return;
      }

      if (this.messageT > 0) this.messageT -= dt;
      if (this._inputLockT > 0) {
        this._syncPrevInput();
        return;
      }
      if (!justClick) {
        this._syncPrevInput();
        return;
      }

      const mx = mouse.x;
      const my = mouse.y;

      // 1) Term buttons
      for (const b of this._termButtons) {
        if (this._hit(mx, my, b)) {
          this.selectedTerm = b.term;
          if (!this._hideGuidance)
            this._setMsg(`Seleccionaste: ${b.term}`, 0.55);
          this._syncPrevInput();
          return;
        }
      }

      // 2) Op buttons (siempre clicables)
      for (const b of this._opButtons) {
        if (this._hit(mx, my, b)) {
          this._applyOp(b.op);
          this._syncPrevInput();
          return;
        }
      }
      this._syncPrevInput();
    }

    // =========================================================
    // Helpers de UI (5 botones)
    //  - add: "Agregar"
    //  - remove: "Quitar"
    //  - mul: "Multiplicar por"
    //  - div: "Dividir entre"
    //  - simplify: "Simplificar"
    // =========================================================
    _uiLabel(op) {
      switch (op) {
        case "add":
          return "Agregar";
        case "remove":
          return "Quitar";
        case "mul":
          return "Multiplicar por";
        case "div":
          return "Dividir entre";
        case "simplify":
          return "Simplificar";
        default:
          return op;
      }
    }

    _goalToUIOp(step, goal) {
      if (!goal) return null;
      const op = goal.op;
      if (op === "simplify") return "simplify";
      if (op === "mulFactor") return "mul";
      if (op === "mulInv") return "div";
      if (op === "addInv") {
        // addInv representa "sumar el inverso aditivo" para anular un término.
        // Si el término aparece como "-t", el movimiento equivalente es "Agregar t".
        // Si aparece como "+t" (o positivo), el movimiento equivalente es "Quitar t".
        const t = goal.term;
        const hayMenos = this._exprHasSignedTerm(step, t, "-");
        return hayMenos ? "add" : "remove";
      }
      // fallback (por si en el futuro usas op directos de UI en casos)
      if (op === "add" || op === "remove" || op === "mul" || op === "div")
        return op;
      return null;
    }

    _exprHasSignedTerm(step, term, sign) {
      if (!term) return false;
      const hay = `${step.eqL} = ${step.eqR}`;
      // Busca "-a"/"- a" o "+a"/"+ a" en cualquier parte de la ecuacion.
      const esc = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re =
        sign === "-"
          ? new RegExp(`-\\s*${esc}(?![A-Za-z0-9_])`)
          : new RegExp(`\\+\\s*${esc}(?![A-Za-z0-9_])`);
      return re.test(hay);
    }

    _triggerSolved() {
      if (this._solvedThisRound) return;
      this._solvedThisRound = true;
      this.finished = true;

      // sonido aplausos (si existe en tu proyecto)
      try {
        window.MN_playSFX?.("applause");
        this.game?.audio?.play?.("applause");
        this.game?.sound?.play?.("applause");
      } catch (_) {}

      const logro = this.case?.objectiveText
        ? `🏆 ${this.case.objectiveText}`
        : "🏆 ¡Logro!";
      this._setMsg(`👏 Correcto. ${logro}`, 1.1);
      this._doorOpenT = this._doorOpenDuration;
      this._runQueued = true;

      // pausa breve y avance automático
      this._autoNextTimer = this._doorOpenDuration + this._runDuration + 0.05;
    }
    _applyOp(op) {
      const step = this.case.steps[this.stepIndex];
      if (!step) return;

      // Si ya está resuelto (terminal), ignora inputs y deja que avance automático
      if (step.isTerminal) {
        this._triggerSolved();
        return;
      }

      const allowNoTerm = (step.allowNoTermFor || []).includes(op);
      const term = allowNoTerm ? null : this.selectedTerm;

      // No castigues por error de interfaz (no elegir término)
      if (!allowNoTerm && !term) {
        this._setMsg("Selecciona primero un término.", 1.0);
        return;
      }

      // Camino único: SOLO la acción objetivo avanza.
      const goalUIOp = this._goalToUIOp(step, step.goal);
      const goalTerm = "term" in (step.goal || {}) ? step.goal.term : null;

      const ok =
        op === goalUIOp &&
        (goalUIOp === "simplify" || goalTerm === null || term === goalTerm);

      if (ok) {
        this.playSfx("sfx_ok", { volume: 0.7 });
        if (op === "simplify") this._startSimplifyFx(step);
        this.selectedTerm = null;
        this.stepIndex++;

        // Si el siguiente paso es terminal, dispara victoria (sin requerir botón extra)
        const nextStep = this.case.steps[this.stepIndex];
        if (nextStep?.isTerminal) {
          this._setMsg(this._hideGuidance ? "✅" : "✅ Bien.", 0.4);
          this._triggerSolved();
          return;
        }

        this._setMsg(this._hideGuidance ? "✅" : "✅ Bien.", 0.5);

        // Si se acabó el caso (por si no hay isTerminal)
        if (!nextStep) {
          this._triggerSolved();
        }
        return;
      }

      // Movimiento no óptimo pero aceptable: no quita vida
      const nonFatal = this._checkNonFatalAction(step, op, term);
      if (nonFatal) {
        this._setMsg(nonFatal, 1.4);
        return;
      }

      // Incorrecto conceptual: vida menos + feedback más claro
      const sugerencia = goalUIOp
        ? goalUIOp === "simplify"
          ? "Debías usar: Simplificar."
          : `Debías usar: ${this._uiLabel(goalUIOp)} ${goalTerm ?? ""}`.trim() +
            "."
        : "";

      const base = this._buildErrorFeedback(step, op, term, goalUIOp, goalTerm);
      this._loseLife(`${base}${sugerencia ? " " + sugerencia : ""}`);
    }

    _matchAction(a, b) {
      if (!b) return false;
      // b puede ser {op,term} o {op,term,msg}
      const bop = b.op;
      const bterm = "term" in b ? b.term : null;
      return a.op === bop && (bterm === null || a.term === bterm);
    }

    _advanceAfterSuccess() {
      if (this.roundIndex >= this.totalRounds - 1) {
        if (this.isPractice) {
          this._startMainGameMode();
          return;
        }
        this._finishGame(false);
        return;
      }
      this.roundTransitionLabel = `Corredor ${this.roundIndex + 2} de ${this.totalRounds}`;
      this.roundTransitionT = 0.9;
      this._startRound(this.roundIndex + 1);
    }

    _loseLife(msg) {
      this.lives--;
      this._mistakesCount++;
      this.selectedTerm = null;
      this.playSfx("sfx_steps", { volume: 0.35, restart: true });
      this._errorFlashT = 0.2;
      this._shakeT = 0.2;
      this._inputLockT = 1.1;
      this._errorMsgDuration = 3.2;

      this._setMsg(`❌ ${msg}`, 1.8);

      if (this.lives <= 0) {
        this._finishGame(true, "💀 GAME OVER (sin vidas)");
      }
    }

    _finishGame(failed = false, reason = "") {
      if (this.gameFinished) return;
      this.gameFinished = true;
      this.state = "finished";
      this.finished = true;
      this.exitDelay = 0.45;
      this.win = !failed;
      this.finalTier = 0;
      this.sheetsReward = 0;

      if (!failed) {
        this.finalTier = 1;
        this.playSfx("sfx_win", { volume: 0.8, restart: true });
      }

      if (
        !this.isPractice &&
        typeof window.MN_reportMinigameTier === "function"
      ) {
        this.sheetsReward = window.MN_reportMinigameTier(
          this.minigameId,
          this.finalTier,
        );
      }

      if (this.isPractice) {
        this.finalMessage =
          "Prueba completada.\n" +
          "Ahora puedes jugar Inicio para ganar hojas.";
      } else if (this.win) {
        this.finalMessage =
          `¡Minijuego completado! (${this.totalRounds}/${this.totalRounds} corredores)\n` +
          `Vidas restantes: ${this.lives}/${this.livesMax}\n` +
          `Hojas ganadas: ${this.sheetsReward}.`;
      } else {
        this.finalMessage =
          `${reason || "Partida terminada."}\n` +
          `Corredor alcanzado: ${this.roundIndex + 1}/${this.totalRounds}\n` +
          `Hojas ganadas: ${this.sheetsReward}.`;
      }
    }

    // =========================================================
    // Draw
    // =========================================================
    draw(ctx) {
      ctx.save();
      if (this.state === "playing" && this._shakeT > 0) {
        const p = Math.max(0, Math.min(1, this._shakeT / 0.2));
        const amp = 7 * p;
        const ox = (Math.random() * 2 - 1) * amp;
        const oy = (Math.random() * 2 - 1) * amp * 0.35;
        ctx.translate(ox, oy);
      }
      if (this.state === "playing" && this._runForwardT > 0) {
        const p = 1 - Math.max(0, Math.min(1, this._runForwardT / this._runDuration));
        const s = 1 + 0.11 * p;
        const cx = this.game.canvas.width * 0.5;
        const cy = this.game.canvas.height * 0.5;
        ctx.translate(cx, cy);
        ctx.scale(s, s);
        ctx.translate(-cx, -cy);
      }
      this._drawNightmareCorridor(ctx);

      if (this.state === "intro") {
        this._drawIntro(ctx);
        ctx.restore();
        return;
      }

      if (this.state === "finished") {
        this._drawFinished(ctx);
        ctx.restore();
        return;
      }

      this._drawTopBar(ctx);

      if (!this.case) {
        ctx.restore();
        return;
      }

      const step = this.case.steps[this.stepIndex];
      if (!step) {
        ctx.restore();
        return;
      }

      if (this._runForwardT > 0) {
        this._drawRunToNextDoor(ctx);
        this._drawMessage(ctx);
        this._drawErrorImpactOverlay(ctx);
        ctx.restore();
        return;
      }

      this._drawEquation(ctx, step);
      this._drawCorridorDoor(ctx, step);
      this._buildAndDrawTermPanel(ctx, step);
      this._buildAndDrawOpPanel(ctx, step);
      this._drawMessage(ctx);
      this._drawRoundTransition(ctx);
      this._drawErrorImpactOverlay(ctx);

      ctx.restore();
    }

    _layoutIntroButtons() {
      const w = 900;
      const h = 390;
      const y = 120;
      const btnW = 260;
      const btnH = 56;
      const btnY = y + h - 86;

      this._btnIntroPractice = {
        x: this.game.canvas.width / 2 - btnW - 16,
        y: btnY,
        w: btnW,
        h: btnH,
        label: "Prueba",
      };
      this._btnIntroPlay = {
        x: this.game.canvas.width / 2 + 16,
        y: btnY,
        w: btnW,
        h: btnH,
        label: "Inicio",
      };
    }

    _drawIntro(ctx) {
      const w = 900;
      const h = 390;
      const x = (this.game.canvas.width - w) / 2;
      const y = 120;
      this._layoutIntroButtons();

      ctx.fillStyle = "rgba(0,0,0,0.65)";
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);

      ctx.fillStyle = "#fff";
      ctx.font = "26px Arial";
      ctx.textAlign = "center";
      ctx.fillText("El Pasillo de las cerraduras", x + w / 2, y + 52);

      ctx.font = "18px Arial";
      const lines = [
        "Selecciona un término y luego la propiedad correcta para aislar la variable.",
        "Cuando es posible el botón 'simplificar' realiza automáticamente una operación.",
        "Avanzas paso a paso hasta despejar la variable objetivo.",
        "Tienes 5 rondas y 5 vidas para poder escapar.",
        "Prueba es una ronda guiada.",
      ];
      lines.length = 0;
      lines.push(
        "Selecciona un t\u00e9rmino y luego la propiedad correcta para aislar la variable.",
        "Cada paso correcto revela parte de la combinaci\u00f3n secreta.",
        "Cuando sea posible, el bot\u00f3n \u201cSimplificar\u201d realizar\u00e1 autom\u00e1ticamente una operaci\u00f3n.",
        "Despeja la variable objetivo para abrir cada puerta.",
        "Cruza las 5 puertas antes de perder tus 5 vidas.",
        "Prueba: una ronda guiada.",
      );
      let yy = y + 96;
      for (const ln of lines) {
        ctx.fillText(ln, x + w / 2, yy);
        yy += 26;
      }

      ctx.fillStyle = "rgba(255,235,59,0.12)";
      ctx.strokeStyle = "rgba(255,235,59,0.70)";
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
      ctx.fillStyle = "#ffeb3b";
      ctx.font = "18px Arial";
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

      ctx.font = "14px Arial";
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.textBaseline = "alphabetic";
      ctx.fillText("Enter o Espacio: Inicio", x + w / 2, y + h - 18);
    }

    _drawFinished(ctx) {
      const w = 760;
      const h = 250;
      const x = (this.game.canvas.width - w) / 2;
      const y = 185;

      ctx.fillStyle = "rgba(0,0,0,0.70)";
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);

      ctx.fillStyle = "#fff";
      ctx.font = "30px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(
        this.win ? "¡Bien hecho!" : "Partida terminada",
        x + w / 2,
        y + 58,
      );

      ctx.font = "18px Arial";
      const lines = String(this.finalMessage || "").split("\n");
      let yy = y + 104;
      for (const ln of lines) {
        if (!ln) continue;
        ctx.fillText(ln, x + w / 2, yy);
        yy += 28;
      }

      ctx.font = "16px Arial";
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fillText("Enter, Espacio o clic para volver", x + w / 2, y + h - 24);
    }

    _drawTopBar(ctx) {
      const w = this.game.canvas.width;

      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fillRect(0, 0, w, this.ui.topBarH);

      const hx0 = 26;
      const hy = 20;
      for (let i = 0; i < this.livesMax; i++) {
        ctx.fillStyle = i < this.lives ? "#ff4d6d" : "rgba(255,255,255,0.25)";
        this._drawHeart(ctx, hx0 + i * 22, hy, 16);
      }

      ctx.fillStyle = "rgba(255,255,255,0)";
      ctx.font = "700 18px Arial";
      ctx.textAlign = "left";
      ctx.fillText("Despejes — Propiedades", 18, 28);

      ctx.font = "14px Arial";
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.textAlign = "left";
      ctx.fillText(
        `Corredor: ${this.roundIndex + 1} de ${this.totalRounds}`,
        hx0 + this.livesMax * 22 + 18,
        28,
      );

      // Objetivo (siempre visible, incluso en diff 3)
      if (this.case?.objectiveText) {
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(255,255,255,0.98)";
        ctx.font = "700 22px Arial";
        ctx.fillText(this.case.objectiveText, w / 2, 52);
      }

    }

    _formatExprForDisplay(expr) {
      let s = String(expr || "");
      const trailingVarMul = /^(.*)\s*\*\s*([a-zA-Z])\s*$/;

      // Reescribe "expr * a" como "a(expr)" cuando la multiplicación final
      // es por una variable sola. Así evitamos lecturas ambiguas tipo x/a * a.
      let changed = true;
      while (changed) {
        changed = false;
        const match = s.match(trailingVarMul);
        if (match) {
          const left = String(match[1] || "").trim();
          const variable = match[2];
          if (left) {
            s = `${variable}(${left})`;
            changed = true;
          }
        }
      }
      return s;
    }

    _drawEquation(ctx, step) {
      const w = this.game.canvas.width;
      const y0 = this.ui.topBarH + 14;

      // Prompt solo si existe explícitamente en el step.
      const promptText =
        step.prompt && step.prompt.trim().length ? step.prompt : "";

      if (promptText) {
        ctx.fillStyle = "rgba(255,255,255,0.92)";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.fillText(promptText, w / 2, y0);
      }

      const boxW = w - 220;
      const boxH = 83;
      const x = (w - boxW) / 2;
      const y = y0 + 18;

      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fillRect(x, y, boxW, boxH);

      ctx.fillStyle = "#ffffff";
      ctx.font = "700 30px Consolas, monospace";
      ctx.textAlign = "center";
      const eq = `${this._formatExprForDisplay(step.eqL)}   =   ${this._formatExprForDisplay(step.eqR)}`;
      ctx.fillText(eq, w / 2, y + 57);

      // hint de selección solo fuera de diff 3
      if (!this._hideGuidance) {
        ctx.font = "14px Arial";
        ctx.fillStyle = this.selectedTerm
          ? "#ffd166"
          : "rgba(255,255,255,0.45)";
        const sel = this.selectedTerm
          ? `Término seleccionado: ${this.selectedTerm}`
          : "Elige un término (izquierda) y luego una propiedad (derecha)";
        ctx.fillText(
          this.selectedTerm
            ? `Término seleccionado: ${this.selectedTerm}`
            : "Elige un término del lado izquierdo y luego una propiedad que lo cancele del lado derecho",
          w / 2,
          y + 400,
        );
      }

      if (this._simplifyFxT > 0) {
        const a = Math.min(1, this._simplifyFxT / 2.7);
        ctx.save();
        ctx.fillStyle = `rgba(255,209,102,${0.85 * a})`;
        ctx.font = "700 18px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
          this._simplifyFxText || "Simplificación correcta",
          w / 2,
          y + 22,
        );
        ctx.restore();
      }
    }

    _buildAndDrawTermPanel(ctx, step) {
      const w = this.game.canvas.width;
      const panelY = this.game.canvas.height - this.ui.panelH;
      const panelH = this.ui.panelH;

      ctx.fillStyle = "rgba(255,255,255,0.05)";
      ctx.fillRect(0, panelY, w * 0.5, panelH);

      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = "700 14px Arial";
      ctx.textAlign = "left";
      ctx.fillText("Término", 18, panelY + 24);

      this._termButtons = [];
      const terms = (step.terms || []).slice(0, 12);

      let x = 18;
      let y = panelY + 40;
      const bw = 54,
        bh = 42,
        gap = 10;

      for (let i = 0; i < terms.length; i++) {
        const t = terms[i];
        const btn = { term: t, x, y, w: bw, h: bh };
        this._termButtons.push(btn);

        const active = this.selectedTerm === t;

        ctx.fillStyle = active
          ? "rgba(255,209,102,0.22)"
          : "rgba(255,255,255,0.08)";
        ctx.fillRect(x, y, bw, bh);

        ctx.strokeStyle = active
          ? "rgba(255,209,102,0.9)"
          : "rgba(255,255,255,0.18)";
        ctx.strokeRect(x, y, bw, bh);

        ctx.fillStyle = "#ffffff";
        ctx.font = "700 18px Consolas, monospace";
        ctx.textAlign = "center";
        ctx.fillText(String(t), x + bw / 2, y + 27);

        x += bw + gap;
        if (x + bw > w * 0.5 - 18) {
          x = 18;
          y += bh + gap;
        }
      }

      // si no hay terms, panel vacío
      if (!terms.length) {
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.font = "14px Arial";
        ctx.textAlign = "left";
        ctx.fillText(
          this._hideGuidance
            ? "—"
            : "No necesitas seleccionar término en este paso.",
          18,
          panelY + 62,
        );
      }
    }

    _buildAndDrawOpPanel(ctx, step) {
      const w = this.game.canvas.width;
      const panelY = this.game.canvas.height - this.ui.panelH;
      const panelH = this.ui.panelH;

      const x0 = w * 0.5;
      const pw = w * 0.5;

      // panel bg
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      ctx.fillRect(x0, panelY, pw, panelH);

      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = "700 14px Arial";
      ctx.textAlign = "left";
      ctx.fillText("Propiedad", x0 + 18, panelY + 24);

      // 5 botones siempre (UI)
      const ops = [
        { op: "add", label: "Agregar" },
        { op: "remove", label: "Quitar" },
        { op: "simplify", label: "Simplificar" },
        { op: "mul", label: "Multiplicar por" },
        { op: "div", label: "Dividir entre" },
      ];

      this._opButtons = [];

      const leftPad = 18;
      const topPad = 40;
      const colGap = 14;
      const rowGap = 10;

      const bh = 44;

      // Layout: 3 arriba, 2 abajo
      const row1 = ops.slice(0, 3);
      const row2 = ops.slice(3);

      const bw1 = Math.floor((pw - leftPad * 2 - colGap * 2) / 3);
      const bw2 = Math.floor((pw - leftPad * 2 - colGap) / 2);

      const drawBtn = (b, x, y, bw) => {
        const enabledVisual = this._opEnabledVisual(b.op, step);

        const btn = { op: b.op, label: b.label, x, y, w: bw, h: bh };
        this._opButtons.push(btn);

        ctx.fillStyle = enabledVisual
          ? "rgba(255,255,255,0.10)"
          : "rgba(255,255,255,0.04)";
        ctx.fillRect(x, y, bw, bh);

        ctx.strokeStyle = enabledVisual
          ? "rgba(255,255,255,0.22)"
          : "rgba(255,255,255,0.10)";
        ctx.strokeRect(x, y, bw, bh);

        ctx.fillStyle = enabledVisual ? "#ffffff" : "rgba(255,255,255,0.35)";
        ctx.font = "700 14px Arial";
        ctx.textAlign = "center";
        ctx.fillText(btn.label, x + bw / 2, y + 27);
      };

      // Row 1
      for (let i = 0; i < row1.length; i++) {
        const b = row1[i];
        const x = x0 + leftPad + i * (bw1 + colGap);
        const y = panelY + topPad;
        drawBtn(b, x, y, bw1);
      }

      // Row 2
      for (let i = 0; i < row2.length; i++) {
        const b = row2[i];
        const x = x0 + leftPad + i * (bw2 + colGap);
        const y = panelY + topPad + bh + rowGap;
        drawBtn(b, x, y, bw2);
      }      
    }

    _getStatusBaseY() {
      return this.ui.topBarH + 112;
    }

    _drawStatusBanner(ctx, text, slot, opts = {}) {
      if (!text) return;
      const w = this.game.canvas.width;
      const baseY = this._getStatusBaseY();
      const y = baseY - slot * 42;
      const boxH = opts.boxH || 36;
      const alpha = opts.alpha ?? 1;

      ctx.save();
      ctx.fillStyle = `rgba(0,0,0,${(opts.bgAlpha ?? 0.45) * alpha})`;
      ctx.fillRect(0, y - 24, w, boxH);

      if (opts.strokeAlpha) {
        ctx.strokeStyle = `rgba(255,235,120,${opts.strokeAlpha * alpha})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(0, y - 24, w, boxH);
      }

      ctx.fillStyle = opts.color || "#ffffff";
      ctx.font = opts.font || "16px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, w / 2, y - 24 + boxH / 2);
      ctx.restore();
    }

    _drawMessage(ctx) {
      if (this.messageT <= 0 || !this.message) return;
      const slot = this.roundTransitionT > 0 ? 1 : 0;
      this._drawStatusBanner(ctx, this.message, slot, {
        boxH: 36,
        bgAlpha: 0.45,
        font: "16px Arial",
        color: "#ffffff",
      });
    }

    _drawRoundTransition(ctx) {
      if (this.roundTransitionT <= 0) return;
      const a = Math.max(0, Math.min(1, this.roundTransitionT / 0.9));
      const slot = this.messageT > 0 && this.message ? 0 : 1;
      this._drawStatusBanner(
        ctx,
        this.roundTransitionLabel || "Siguiente corredor",
        slot,
        {
          boxH: 42,
          bgAlpha: 0.55,
          strokeAlpha: 0.9,
          alpha: a,
          font: "700 22px Arial",
          color: `rgba(255,245,180,${a})`,
        },
      );
    }

    _drawErrorImpactOverlay(ctx) {
      if (this._errorFlashT <= 0 || this.state !== "playing") return;
      const a = Math.max(0, Math.min(1, this._errorFlashT / 0.2));
      const w = this.game.canvas.width;
      const h = this.game.canvas.height;
      ctx.save();
      ctx.fillStyle = `rgba(0,0,0,${0.35 * a})`;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    _drawNightmareCorridor(ctx) {
      const w = this.game.canvas.width;
      const h = this.game.canvas.height;

      if (this.bgImage) {
        ctx.drawImage(this.bgImage, 0, 0, w, h);
      } else {
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, "rgba(4,5,7,0.78)");
        grad.addColorStop(0.45, "rgba(10,13,18,0.72)");
        grad.addColorStop(1, "rgba(5,6,8,0.82)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Paredes del corredor en perspectiva simple
        ctx.fillStyle = "rgba(255,255,255,0.04)";
        ctx.beginPath();
        ctx.moveTo(0, h);
        ctx.lineTo(w * 0.22, this.ui.topBarH + 10);
        ctx.lineTo(w * 0.34, this.ui.topBarH + 10);
        ctx.lineTo(w * 0.18, h);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(w, h);
        ctx.lineTo(w * 0.78, this.ui.topBarH + 10);
        ctx.lineTo(w * 0.66, this.ui.topBarH + 10);
        ctx.lineTo(w * 0.82, h);
        ctx.closePath();
        ctx.fill();

        // Lineas de piso (suaves)
        ctx.strokeStyle = "rgba(120,170,255,0.07)";
        for (let i = 0; i < 8; i++) {
          const yy = this.ui.topBarH + 120 + i * 55;
          ctx.beginPath();
          ctx.moveTo(w * 0.22, yy);
          ctx.lineTo(w * 0.78, yy);
          ctx.stroke();
        }
      }
    }

    _drawRunToNextDoor(ctx) {
      const w = this.game.canvas.width;
      const h = this.game.canvas.height;
      const p = 1 - Math.max(0, Math.min(1, this._runForwardT / this._runDuration));
      const easeOut = 1 - Math.pow(1 - p, 3);
      const isFinalDoor = this.roundIndex >= this.totalRounds - 1;
      const r = this._getMainDoorRect();
      const cx = r.x + r.w / 2;
      const cy = r.y + r.h / 2;

      // Barrido de lineas de velocidad en piso/paredes
      for (let i = 0; i < 26; i++) {
        const t = (i / 26 + this._runFxPhase) % 1;
        const y = this.ui.topBarH + 64 + Math.pow(t, 1.75) * (h - this.ui.topBarH - 88);
        const half = 12 + t * (w * 0.34);
        ctx.strokeStyle = `rgba(150,190,255,${0.06 + 0.15 * t})`;
        ctx.beginPath();
        ctx.moveTo(cx - half, y);
        ctx.lineTo(cx + half, y);
        ctx.stroke();
      }

      // La puerta recien abierta crece hacia camara
      const s = 1 + p * 2.35;
      const dw = r.w * s;
      const dh = r.h * s;
      const dx = cx - dw / 2;
      const dy = cy - dh / 2 + p * 14;

      ctx.fillStyle = "rgba(10,12,18,0.88)";
      ctx.fillRect(dx - 18, dy - 18, dw + 36, dh + 30);
      ctx.strokeStyle = "rgba(175,190,220,0.5)";
      ctx.lineWidth = 2;
      ctx.strokeRect(dx - 18, dy - 18, dw + 36, dh + 30);

      const jambW = Math.max(18, dw * 0.16);
      ctx.fillStyle = "rgba(42,52,74,0.94)";
      ctx.fillRect(dx, dy, jambW, dh);
      ctx.fillRect(dx + dw - jambW, dy, jambW, dh);
      ctx.strokeStyle = "rgba(190,205,230,0.35)";
      ctx.strokeRect(dx, dy, jambW, dh);
      ctx.strokeRect(dx + dw - jambW, dy, jambW, dh);

      // El interior inicia oscuro y se transforma en pasillo2 creciendo hasta llenar la pantalla.
      const portalStart = {
        x: dx + jambW + 4,
        y: dy + 6,
        w: Math.max(2, dw - jambW * 2 - 8),
        h: Math.max(2, dh - 12),
      };
      const portalEnd = { x: 0, y: 0, w, h };
      const portal = {
        x: portalStart.x + (portalEnd.x - portalStart.x) * easeOut,
        y: portalStart.y + (portalEnd.y - portalStart.y) * easeOut,
        w: portalStart.w + (portalEnd.w - portalStart.w) * easeOut,
        h: portalStart.h + (portalEnd.h - portalStart.h) * easeOut,
      };

      if (isFinalDoor) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(portal.x, portal.y, portal.w, portal.h);
      } else if (this.bgImageNext) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(portal.x, portal.y, portal.w, portal.h);
        ctx.clip();
        ctx.drawImage(this.bgImageNext, portal.x, portal.y, portal.w, portal.h);
        ctx.restore();
      } else {
        ctx.fillStyle = "rgba(1,2,5,0.97)";
        ctx.fillRect(portal.x, portal.y, portal.w, portal.h);
      }

      const darkA = isFinalDoor
        ? Math.max(0, 0.55 - easeOut * 0.95)
        : Math.max(0, 0.72 - easeOut * 0.95);
      if (darkA > 0) {
        ctx.fillStyle = `rgba(2,4,8,${darkA})`;
        ctx.fillRect(portal.x, portal.y, portal.w, portal.h);
      }

      // Al final "prende la luz" en el interior.
      const lightOn = Math.max(0, Math.min(1, (p - 0.7) / 0.3));
      if (lightOn > 0) {
        const g = ctx.createRadialGradient(
          portal.x + portal.w * 0.5,
          portal.y + portal.h * 0.48,
          Math.max(20, portal.w * 0.04),
          portal.x + portal.w * 0.5,
          portal.y + portal.h * 0.48,
          Math.max(80, portal.w * 0.6),
        );
        if (isFinalDoor) {
          g.addColorStop(0, `rgba(255,255,255,${0.45 + 0.45 * lightOn})`);
          g.addColorStop(0.55, `rgba(255,255,240,${0.24 + 0.34 * lightOn})`);
          g.addColorStop(1, "rgba(255,255,220,0)");
        } else {
          g.addColorStop(0, `rgba(230,248,255,${0.2 + 0.45 * lightOn})`);
          g.addColorStop(0.55, `rgba(140,210,255,${0.14 + 0.28 * lightOn})`);
          g.addColorStop(1, "rgba(120,190,255,0)");
        }
        ctx.fillStyle = g;
        ctx.fillRect(portal.x, portal.y, portal.w, portal.h);
      }

      // El marco de la puerta se desvanece mientras entramos al siguiente cuarto.
      const frameA = Math.max(0, 1 - easeOut * 1.1);
      if (frameA > 0) {
        ctx.save();
        ctx.globalAlpha = frameA;
        ctx.fillStyle = "rgba(42,52,74,0.94)";
        ctx.fillRect(dx, dy, jambW, dh);
        ctx.fillRect(dx + dw - jambW, dy, jambW, dh);
        ctx.strokeStyle = "rgba(190,205,230,0.35)";
        ctx.strokeRect(dx, dy, jambW, dh);
        ctx.strokeRect(dx + dw - jambW, dy, jambW, dh);
        ctx.restore();
      }
    }

    _drawCorridorDoor(ctx, step) {
      if (!this.case || !step) return;
      const w = this.game.canvas.width;
      const r = this._getMainDoorRect();
      const isFinalDoor = this.roundIndex >= this.totalRounds - 1;
      const x = r.x;
      const y = r.y;
      const doorW = r.w;
      const doorH = r.h;

      const totalSteps = Math.max(
        1,
        (this.case.steps || []).filter((s) => !s.isTerminal).length,
      );
      const doneSteps = Math.min(this.stepIndex, totalSteps);

      // puerta tipo elevador (dos hojas)
      const openingStarted =
        this._solvedThisRound || this._doorOpenT > 0 || this._runForwardT > 0;
      const openPct = openingStarted
        ? Math.max(0, Math.min(1, 1 - this._doorOpenT / this._doorOpenDuration))
        : 0;
      const panelGap = Math.floor(doorW * 0.42 * openPct);
      const halfW = Math.floor(doorW / 2);
      const panelW = halfW - panelGap;

      ctx.fillStyle = "rgba(40,48,62,0.95)";
      ctx.fillRect(x, y, panelW, doorH);
      ctx.fillRect(x + halfW + panelGap, y, panelW, doorH);
      ctx.strokeStyle = "rgba(180,190,210,0.35)";
      ctx.strokeRect(x, y, panelW, doorH);
      ctx.strokeRect(x + halfW + panelGap, y, panelW, doorH);

      // luz interior cuando abre
      if (openPct > 0.01) {
        const opening = {
          x: x + halfW - panelGap,
          y: y + 8,
          w: panelGap * 2,
          h: doorH - 16,
        };

        if (isFinalDoor && opening.w > 1 && opening.h > 1) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(opening.x, opening.y, opening.w, opening.h);
          const flare = ctx.createRadialGradient(
            opening.x + opening.w * 0.5,
            opening.y + opening.h * 0.48,
            Math.max(10, opening.w * 0.04),
            opening.x + opening.w * 0.5,
            opening.y + opening.h * 0.48,
            Math.max(40, opening.w * 0.75),
          );
          flare.addColorStop(0, `rgba(255,255,255,${0.35 + 0.55 * openPct})`);
          flare.addColorStop(0.7, `rgba(255,255,235,${0.16 + 0.28 * openPct})`);
          flare.addColorStop(1, "rgba(255,255,220,0)");
          ctx.fillStyle = flare;
          ctx.fillRect(opening.x, opening.y, opening.w, opening.h);
        } else if (this.bgImageNext && opening.w > 1 && opening.h > 1) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(opening.x, opening.y, opening.w, opening.h);
          ctx.clip();
          ctx.drawImage(
            this.bgImageNext,
            opening.x,
            opening.y,
            opening.w,
            opening.h,
          );
          // Empieza oscuro y se aclara conforme abre.
          ctx.fillStyle = `rgba(2,4,8,${0.72 - 0.58 * openPct})`;
          ctx.fillRect(opening.x, opening.y, opening.w, opening.h);
          ctx.restore();
        } else {
          ctx.fillStyle = `rgba(140,230,255,${0.14 + 0.22 * openPct})`;
          ctx.fillRect(opening.x, opening.y, opening.w, opening.h);
        }
      }

      // progreso por pasos (luces verdes)
      const lightY = y - 28;
      const lightR = 7;
      const span = 22;
      const startX = w / 2 - ((totalSteps - 1) * span) / 2;
      for (let i = 0; i < totalSteps; i++) {
        const on = i < doneSteps;
        ctx.beginPath();
        ctx.arc(startX + i * span, lightY, lightR, 0, Math.PI * 2);
        ctx.fillStyle = on ? "rgba(95,255,145,0.95)" : "rgba(80,95,92,0.45)";
        ctx.fill();
        if (on) {
          ctx.strokeStyle = "rgba(190,255,210,0.95)";
          ctx.stroke();
        }
      }
    }

    _getMainDoorRect() {
      const w = this.game.canvas.width;
      const top = this.ui.topBarH + 160;
      const doorW = 240; 
      const doorH = 240; 
      return { x: (w - doorW) / 2, y: top, w: doorW, h: doorH };
    }

    _opEnabledVisual(op, step) {
      if (!this.isPractice) return true;
      const goalUIOp = this._goalToUIOp(step, step?.goal);
      if (!goalUIOp) return true;
      return op === goalUIOp;
    }

    _checkNonFatalAction(step, op, term) {
      const groups = [].concat(step.warn || []).concat(step.valid || []);

      for (const item of groups) {
        const uiOp = this._goalToUIOp(step, item);
        if (!uiOp) continue;
        const needsTerm = uiOp !== "simplify";
        const itemTerm = "term" in item ? item.term : null;
        const termOk = !needsTerm || itemTerm === null || term === itemTerm;
        if (op === uiOp && termOk) {
          return (
            item.msg ||
            "Movimiento válido, pero no te acerca al despeje óptimo."
          );
        }
      }
      return null;
    }

    _buildErrorFeedback(step, op, term, goalUIOp, goalTerm) {
      if (!term && op !== "simplify") {
        return "Falta seleccionar término.";
      }
      if (goalUIOp && op !== goalUIOp) {
        if (goalUIOp === "simplify")
          return "Todavía no toca operar: primero simplifica.";
        if (goalUIOp === "mul" || goalUIOp === "div") {
          return "Primero elimina la operación externa antes de tocar términos internos.";
        }
        return (
          step.invalidMsg || "La propiedad elegida no corresponde a este paso."
        );
      }
      if (
        goalUIOp &&
        op === goalUIOp &&
        goalTerm !== null &&
        term !== goalTerm
      ) {
        return `Esa propiedad va sobre otro término, no sobre ${term}.`;
      }
      return step.invalidMsg || "Movimiento incorrecto.";
    }

    _startSimplifyFx(step) {
      this._simplifyFxT = 2.7;
      const eq = `${step?.eqL || ""} = ${step?.eqR || ""}`;
      if (/a\/a|b\/b|c\/c|d\/d|x\/x|y\/y/.test(eq)) {
        this._simplifyFxText = "Un número dividido entre sí mismo vale 1";
      } else if (/1[a-z]/i.test(eq)) {
        this._simplifyFxText = "La multiplicación ×1 se puede quitar porque no altera el valor.";
      } else if (/\+\s*0|-\s*0/.test(eq)) {
        this._simplifyFxText = "Sumar cero, no altera el valor, así que +0 se puede quitar.";
      } else if (/-\s*[a-z]\s*\+\s*[a-z]|\+\s*[a-z]\s*-\s*[a-z]/i.test(eq)) {
        this._simplifyFxText = "Términos opuestos se cancelan";
      } else {
        this._simplifyFxText = "Simplificación correcta";
      }
    }

    // =========================================================
    // Utils
    // =========================================================
    _setMsg(text, seconds = 1.2) {
      if (this._errorMsgDuration) {
        seconds = Math.max(seconds, this._errorMsgDuration);
        this._errorMsgDuration = 0;
      }
      this.message = text;
      this.messageT = seconds;
    }

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

    _hit(px, py, r) {
      return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
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
  }

  window.DespejesScene = DespejesScene;
})();
