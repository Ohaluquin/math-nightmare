// ===========================================================
// LenguajeNaturalScene.js — "Traducción Algebraica"
// Minijuego: convertir enunciado (lenguaje natural) -> expresión.
// - 6 opciones (1 correcta + 5 distractores típicos)
// - Meta: 5 aciertos CONSECUTIVOS (como pediste)
// - Validación: prueba por sustitución para evitar equivalencias
// - Scene mínima estilo GeneralSignosScene (sin narrativa/animaciones)
// ===========================================================

class LenguajeNaturalScene extends Scene {
  constructor(game) {
    super(game);

    // ----------------- Estado general -----------------
    this.state = "intro"; // "intro" | "playing" | "finished"
    this.phase = "question"; // "question" | "feedback_correct" | "feedback_wrong"
    this.gameFinished = false;
    this.exitDelay = 0;
    this.message = "";
    this.sheetsReward = 0;
    this.win = false;

    // ----------------- Pregunta actual -----------------
    this.statement = "";
    this.options = []; // [{ expr, label }, ...]
    this.correctIndex = 0;

    // Progreso
    this.totalQuestions = 10;
    this.phaseSplit = 5;      // primeras 5 fáciles
    this.questionIndex = 0;
    this.correctCount = 0;    
    this.usedQuestionKeys = new Set();
    this.usedTemplateIds = new Set();

    // Errores permitidos
    this.maxErrors = 3;
    this.errors = 0;

    // Tiempo
    this.timeLimit = 180;
    this.timeLeft = this.timeLimit;

    // Feedback
    this.feedbackTimer = 0;
    this.feedbackText = "";
    this.feedbackMinDuration = 1.1;

    // Input / UI hexagonal
    this.optionRects = [];
    this.optionHexRadius = 94;
    this.centerHexRadius = 108;
    this.hexYScale = 0.88;
    this.playerAnchor = { x: 0, y: 0 };
    this.neighborOffsets = [];
    this.activeNeighborIds = [0, 1, 2, 3, 4, 5];
    this.optionToNeighbor = [0, 1, 2, 3, 4, 5];
    this.floorOffset = { x: 0, y: 0 };
    this.hoverIndex = -1;
    this._prevKeys = {};
    this.prevMouseDown = false;
    this.selectedIndex = -1;
    this.selectionAnim = {
      active: false,
      index: -1,
      t: 0,
      duration: 0.38,
      fromOffset: { x: 0, y: 0 },
      toOffset: { x: 0, y: 0 },
    };
    this.sceneTime = 0;

    // Sonidos (si ya existen en assets)
    this.sfxCorrect = "sfx_match";
    this.sfxWrong = "sfx_steps";
    this.sfxWin = "sfx_win";
    this.sfxPage = "sfx_change_page";
    this.sfxLose = "sfx_rugido";

    // Fondo opcional
    this.bgImage = null;
    this.playerWalkImg = null;
    this.playerWalk = {
      frame: 0,
      cols: 16,
      rows: 1,
      w: 0,
      h: 0,
      timer: 0,
      speed: 0.06,
    };

    this.threatLevel = 0;
    this.threatPulse = 0;
    this.threatAdvance = 0;

    // Config de templates
    this.varName = "x";
    this.difficulty = 1; // puedes subirlo luego

    // Plantillas base (10)
    this.templates = this._buildTemplates();
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
    if (window.MN_setLeafHUDVisible) window.MN_setLeafHUDVisible(false);
    if (window.MN_setInputMode) MN_setInputMode("mouse");

    this.gameFinished = false;
    this.exitDelay = 0;
    this.message = "";
    this.sheetsReward = 0;
    this.win = false;

    this.state = "intro";
    this.phase = "question";
    this.questionIndex = 0;
    this.correctCount = 0;
    this.usedQuestionKeys = new Set();
    this.usedTemplateIds = new Set();
    this.errors = 0;

    this.timeLeft = this.timeLimit;

    this.feedbackTimer = 0;
    this.feedbackText = "";
    this.selectedIndex = -1;
    this.selectionAnim.active = false;
    this.selectionAnim.index = -1;
    this.selectionAnim.t = 0;
    this.selectionAnim.fromOffset.x = 0;
    this.selectionAnim.fromOffset.y = 0;
    this.selectionAnim.toOffset.x = 0;
    this.selectionAnim.toOffset.y = 0;
    this.floorOffset.x = 0;
    this.floorOffset.y = 0;
    this.sceneTime = 0;
    this.threatLevel = 0;
    this.threatPulse = 0;
    this.threatAdvance = 0;

    this._computeOptionLayout();
    this._prevKeys = {};
    this.prevMouseDown = false;

    const A = this.game.assets;
    this.bgImage =
      (A && A.getImage && A.getImage("bg_lenguaje_natural")) ||
      (A && A.getImage && A.getImage("mn_bg_signos")) ||
      null;

    this.playerWalkImg = (A && A.getImage && A.getImage("player")) || null;
    if (this.playerWalkImg) {
      this.playerWalk.w = this.playerWalkImg.width / this.playerWalk.cols;
      this.playerWalk.h = this.playerWalkImg.height / this.playerWalk.rows;
    }
  }

  destroy() {
    this.clearAll?.();
  }

  _computeOptionLayout() {
    const canvas = this.game.canvas;
    const w = canvas.width;
    const h = canvas.height;
    const cx = w * 0.5;
    const cy = h * 0.5;
    this.playerAnchor = { x: cx, y: cy };
    const r = this.optionHexRadius;
    const dx = r * 1.5;
    const hexH = r * 0.8660254 * this.hexYScale;
    const dyShort = hexH;
    const dyLong = hexH * 2;
    this.neighborOffsets = [
      { x: dx, y: dyShort },
      { x: dx, y: -dyShort },
      { x: 0, y: -dyLong },
      { x: -dx, y: -dyShort },
      { x: -dx, y: dyShort },
      { x: 0, y: dyLong },
    ];

    this.optionRects = new Array(6).fill(0).map(() => ({
      x: 0,
      y: 0,
      w: this.optionHexRadius * 2,
      h: this.optionHexRadius * 1.72 * this.hexYScale,
    }));
  }

  // =======================================================
  // UPDATE
  // =======================================================
  update(dt) {
    super.update(dt);
    this.sceneTime += dt;

    const input = this.game.input;
    const keys = input.keys || {};
    const isJustPressed = (key) => keys[key] && !this._prevKeys[key];

    // Juego terminado
    if (this.gameFinished) {
      if (this.exitDelay > 0) {
        this.exitDelay -= dt;
        this._prevKeys = { ...keys };
        return;
      }
      const wantsExit =
        input.isDown("Enter") ||
        input.isDown(" ") ||
        (input.mouse && input.mouse.down);

      if (wantsExit) window.MN_APP?.toOverworld?.();
      this._prevKeys = { ...keys };
      return;
    }

    // Intro
    if (this.state === "intro") {
      const mouse = input.mouse || { down: false };
      const mouseJustPressed = mouse.down && !this.prevMouseDown;
      if (isJustPressed("Enter") || isJustPressed(" ") || mouseJustPressed) {
        this.state = "playing";
        this.playSfx(this.sfxPage, { volume: 0.5 });
        this._newQuestion();
      }
      this.prevMouseDown = mouse.down;
      this._prevKeys = { ...keys };
      return;
    }

    // Playing
    if (this.state === "playing") {
      this._updatePlaying(dt, input, keys, isJustPressed);
    }

    this._prevKeys = { ...keys };
  }

  _updatePlaying(dt, input, keys, isJustPressed) {
    const mouse = input.mouse || { x: 0, y: 0, down: false };
    this.hoverIndex = -1;
    for (let i = 0; i < this.options.length; i++) {
      const p = this._getOptionDisplayPos(i);
      const r = this.optionHexRadius * this._getHexScaleByY(p.y);
      if (this._pointInHex(mouse.x, mouse.y, p.x, p.y, r)) {
        this.hoverIndex = i;
        break;
      }
    }

    const justClicked = mouse.down && !this.prevMouseDown;
    this.prevMouseDown = mouse.down;

    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this._finishGame(true);
      return;
    }

    const isSelecting = this.selectionAnim.active;
    if (isSelecting) {
      this.selectionAnim.t += dt;
      const k = Math.min(1, this.selectionAnim.t / this.selectionAnim.duration);
      this.floorOffset.x =
        this.selectionAnim.fromOffset.x +
        (this.selectionAnim.toOffset.x - this.selectionAnim.fromOffset.x) * k;
      this.floorOffset.y =
        this.selectionAnim.fromOffset.y +
        (this.selectionAnim.toOffset.y - this.selectionAnim.fromOffset.y) * k;
      if (k >= 1) {
        const index = this.selectionAnim.index;
        this.selectionAnim.active = false;
        this.selectionAnim.t = this.selectionAnim.duration;
        this._handleAnswer(index);
      }
    } else if (this.phase === "question") {
      if (justClicked && this.hoverIndex !== -1) this._startSelection(this.hoverIndex);
      if (isJustPressed("1")) this._startSelection(0);
      else if (isJustPressed("2")) this._startSelection(1);
      else if (isJustPressed("3")) this._startSelection(2);
      else if (isJustPressed("4")) this._startSelection(3);
      else if (isJustPressed("5")) this._startSelection(4);
      else if (isJustPressed("6")) this._startSelection(5);
    }

    if (this.phase === "feedback_wrong") {
      this.threatPulse += dt * 5.5;
      this.threatAdvance = Math.min(1, this.threatAdvance + dt * 1.1);
    } else {
      this.threatPulse += dt * 2.2;
      this.threatAdvance = Math.max(0, this.threatAdvance - dt * 0.7);
    }

    if (this.phase === "feedback_correct" || this.phase === "feedback_wrong") {
      this.feedbackTimer += dt;
      if (this.feedbackTimer >= this.feedbackMinDuration) {
        if (this.phase === "feedback_wrong") {
          if (this.errors >= this.maxErrors) this._finishGame(true);
          else this._newQuestion();
        } else {
          if (this.correctCount >= this.totalQuestions) return;
          this._newQuestion();
        }
      }
    }

    if (this.playerWalkImg) {
      this.playerWalk.timer += dt;
      if (this.playerWalk.timer >= this.playerWalk.speed) {
        this.playerWalk.timer = 0;
        this.playerWalk.frame = (this.playerWalk.frame + 1) % this.playerWalk.cols;
      }
    }
  }

  // =======================================================
  // LÓGICA DEL MINIJUEGO
  // =======================================================
  _newQuestion() {
    this.phase = "question";
    this.feedbackTimer = 0;
    this.feedbackText = "";
    this.selectedIndex = -1;
    this.selectionAnim.active = false;
    this.selectionAnim.index = -1;
    this.selectionAnim.t = 0;
    this.floorOffset.x = 0;
    this.floorOffset.y = 0;
    if (this.questionIndex > 0) this.playSfx(this.sfxPage, { volume: 0.4 });

    const diff = this.questionIndex < this.phaseSplit ? 1 : 2;
    const pool = this.templates.filter(
      (t) => (t.difficulty || 1) === diff && !this.usedTemplateIds.has(t.id),
    );
    if (!pool.length) return;

    let statement = "";
    let correct = "";
    let distractorsRaw = [];
    let foundUnique = false;

    // Reintenta para evitar repetir preguntas dentro de la corrida actual.
    for (let attempt = 0; attempt < 120; attempt++) {
      const tpl = pool[Math.floor(Math.random() * pool.length)];
      const b = this._randInt(2, 9);
      const k = this._randInt(2, 4); // para "k veces"
      const n = this._randInt(7, 20); // constantes variables para algunas plantillas
      const kWide = this._randInt(4, 8); // para plantillas avanzadas con k variable
      const nWide = this._randInt(4, 8); // para plantillas avanzadas con n variable
      const x = this.varName;
      const params = { x, b, k, n, kWide, nWide };

      statement = this._pickStatement(tpl, params);
      if (!statement) continue;
      if (statement.includes("(") || statement.includes(")")) continue;

      correct = tpl.makeCorrect(params);
      const key = `${diff}|${statement}|${correct}`;
      if (this.usedQuestionKeys.has(key)) continue;

      this.usedQuestionKeys.add(key);
      this.usedTemplateIds.add(tpl.id);
      distractorsRaw = tpl.makeDistractors({ ...params, correct });
      foundUnique = true;
      break;
    }

    if (!foundUnique) return;

    // Filtrar/validar distractores
    const distractors = this._buildValidDistractors(correct, distractorsRaw);

    // Si por alguna razón fallan distractores, caemos a opciones más “suaves”
    while (distractors.length < 5) {
      const fallback = this._fallbackDistractor(correct, distractors);
      if (!fallback) break;
      distractors.push(fallback);
    }
    if (distractors.length < 5) {
      const extra = this._buildExtraDistractors(correct, distractors, 5 - distractors.length);
      distractors.push(...extra);
    }

    const all = [correct, ...distractors.slice(0, 5)];

    // Shuffle y correctIndex
    let correctIndex = 0;
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = all[i];
      all[i] = all[j];
      all[j] = tmp;
    }
    correctIndex = all.indexOf(correct);

    this.statement = statement;
    this.options = all.map((expr) => ({ expr, label: this._formatExprForDisplay(expr) }));
    this.correctIndex = correctIndex;
    this._rollActiveNeighborSlots();
  }

  _rollActiveNeighborSlots() {
    const ids = [0, 1, 2, 3, 4, 5];
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = ids[i];
      ids[i] = ids[j];
      ids[j] = tmp;
    }
    this.activeNeighborIds = ids.slice(0, 6);
    const perm = [0, 1, 2, 3, 4, 5];
    for (let i = perm.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = perm[i];
      perm[i] = perm[j];
      perm[j] = tmp;
    }
    this.optionToNeighbor = perm.map((k) => this.activeNeighborIds[k]);
  }

  _buildExtraDistractors(correct, existing, needCount) {
    const out = [];
    const seen = new Set(existing);
    const tryPush = (cand) => {
      if (!cand || seen.has(cand) || cand === correct) return false;
      if (!this._isValidExpr(cand) || this._equivalentByTests(correct, cand)) return false;
      seen.add(cand);
      out.push(cand);
      return true;
    };

    const base = String(correct || "");
    const attemptsMax = 240;
    for (let attempt = 0; attempt < attemptsMax && out.length < needCount; attempt++) {
      const b = this._randInt(2, 9);
      const k = this._randInt(2, 5);
      const mode = attempt % 9;
      let cand = "";

      if (mode === 0) cand = base.replace("+", "-");
      else if (mode === 1) cand = base.replace("-", "+");
      else if (mode === 2) cand = base.replace(/(\d+)\*x/i, `${k}*x`);
      else if (mode === 3) cand = base.replace(/x\s*([+-])\s*(\d+)/i, `${b} $1 x`);
      else if (mode === 4) cand = base.includes("*") ? `${base} + ${b}` : `${k}*x + ${b}`;
      else if (mode === 5) cand = base.includes("/") ? `${base} * 2` : `${base}/2`;
      else if (mode === 6) cand = `${k}*x - ${b}`;
      else if (mode === 7) cand = `${k}*(x + ${b})`;
      else cand = `${k}*(${base})`;

      tryPush(cand);
    }
    for (let attempt = 0; attempt < attemptsMax && out.length < needCount; attempt++) {
      const a = this._randInt(2, 9);
      const b = this._randInt(2, 9);
      const s = Math.random() < 0.5 ? "+" : "-";
      tryPush(`${a}*x ${s} ${b}`);
      tryPush(`${a}*(x ${s} ${b})`);
      tryPush(`(x ${s} ${b})/${a}`);
    }
    return out.slice(0, needCount);
  }

  _getNeighborPosById(neighborId) {
    const n = this.neighborOffsets[neighborId] || { x: 0, y: 0 };
    return {
      x: this.playerAnchor.x + this.floorOffset.x + n.x,
      y: this.playerAnchor.y + this.floorOffset.y + n.y,
    };
  }

  _startSelection(index) {
    if (this.phase !== "question") return;
    if (index < 0 || index >= this.options.length) return;
    this.selectedIndex = index;
    this.selectionAnim.active = true;
    this.selectionAnim.index = index;
    this.selectionAnim.t = 0;
    this.selectionAnim.fromOffset.x = this.floorOffset.x;
    this.selectionAnim.fromOffset.y = this.floorOffset.y;
    const neighborId = this.optionToNeighbor[index];
    const n = this.neighborOffsets[neighborId] || { x: 0, y: 0 };
    this.selectionAnim.toOffset.x = -n.x;
    this.selectionAnim.toOffset.y = -n.y;
  }

  _selectionProgress() {
    if (!this.selectionAnim.active) return 0;
    return Math.min(1, this.selectionAnim.t / this.selectionAnim.duration);
  }

  _pointInHex(px, py, cx, cy, r) {
    const dx = Math.abs(px - cx);
    const dy = Math.abs(py - cy);
    const h = r * 0.8660254 * this.hexYScale;
    if (dx > r || dy > h) return false;
    return dy <= h - 0.57735 * dx;
  }

  _getOptionDisplayPos(i) {
    const neighborId = this.optionToNeighbor[i];
    const p = this._getNeighborPosById(neighborId);
    if (this.selectionAnim.active) return p;
    const bob = Math.sin(this.sceneTime * 2 + i * 1.1) * 2.5;
    return { x: p.x, y: p.y + bob };
  }

  _getCenterTilePos() {
    return {
      x: this.playerAnchor.x + this.floorOffset.x,
      y: this.playerAnchor.y + this.floorOffset.y,
    };
  }

  _getHexScaleByY(y) {
    const centerY = this._getCenterTilePos().y;
    const span = this.optionHexRadius * 2.2;
    const d = Math.max(-1, Math.min(1, (y - centerY) / span));
    return 1 + d * 0.12; // perspectiva: +/-12% (arriba mas pequeno, abajo mas grande)
  }

  _handleAnswer(index) {
    if (this.phase !== "question") return;
    if (index < 0 || index >= this.options.length) return;
    this.selectionAnim.active = false;
    this.selectedIndex = index;

    const chosen = this.options[index].expr;
    const correct = this.options[this.correctIndex].expr;

    if (chosen === correct) {
      this.correctCount++;
      this.feedbackText = "¡Correcto!";
      this.phase = "feedback_correct";
      this.playSfx(this.sfxCorrect, { volume: 0.6 });
    } else {
      this.feedbackText = "Incorrecto.";
      this.phase = "feedback_wrong";
      this.errors++;
      this.threatLevel = Math.min(this.maxErrors, this.errors);
      this.threatAdvance = 0;
      this.playSfx(this.sfxWrong, { volume: 0.65 });
    }

    this.questionIndex++;

    if (this.correctCount >= this.totalQuestions || this.errors >= this.maxErrors) {
      const failed = this.errors >= this.maxErrors;
      this._finishGame(failed);
      return;
    }
  }
  // =======================================================
  // VALIDACIÓN MATEMÁTICA DE OPCIONES
  // =======================================================
  _buildValidDistractors(correct, candidates) {
    const out = [];
    const seen = new Set();

    for (const cand of candidates) {
      if (!cand) continue;
      if (cand === correct) continue;
      if (seen.has(cand)) continue;

      // Debe ser evaluable y NO equivalente a la correcta
      if (this._isValidExpr(cand) && !this._equivalentByTests(correct, cand)) {
        seen.add(cand);
        out.push(cand);
      }
      if (out.length >= 3) break;
    }
    return out;
  }

  _fallbackDistractor(correct, existing) {
    // Distractor genérico: cambiar + por - o viceversa (si aplica)
    // Solo si no queda equivalente.
    const tries = [];

    if (correct.includes("+")) tries.push(correct.replace("+", "-"));
    if (correct.includes("-")) tries.push(correct.replace("-", "+"));

    // insertar paréntesis “trampa” si hay suma
    if (correct.includes("+") && !correct.includes("(")) {
      // x+7 -> 2*(x+7) no siempre aplica; aquí solo un fallback simple:
      // x+7 -> x+(7) (casi igual visual, pero igual matemáticamente, así que no sirve)
      // Mejor: (x)+7 no sirve. Dejamos nada.
    }

    for (const t of tries) {
      if (existing.includes(t)) continue;
      if (this._isValidExpr(t) && !this._equivalentByTests(correct, t)) return t;
    }
    return null;
  }

  _equivalentByTests(exprA, exprB) {
    // pruebas por sustitución: suficiente para evitar equivalencias accidentales
    const tests = [-3, -1, 0, 2, 5, 7];
    for (const xVal of tests) {
      const a = this._evalExpr(exprA, xVal);
      const b = this._evalExpr(exprB, xVal);
      if (!Number.isFinite(a) || !Number.isFinite(b)) return false; // si rompe, no consideramos equivalente
      if (Math.abs(a - b) > 1e-9) return false;
    }
    return true;
  }

  _isValidExpr(expr) {
    try {
      const v = this._evalExpr(expr, 2);
      return Number.isFinite(v);
    } catch {
      return false;
    }
  }

  // =======================================================
  // PARSER/EVAL SEGURO (sin eval)
  // Soporta: números, x, + - * /, paréntesis, y multiplicación implícita "2x" o "2(x+1)"
  // =======================================================
  _evalExpr(expr, xVal) {
    const tokens = this._tokenize(expr, xVal);
    const rpn = this._toRPN(tokens);
    return this._evalRPN(rpn);
  }

  _tokenize(expr, xVal) {
    // 1) normaliza: quita espacios, cambia '×' por '*'
    let s = (expr || "").replace(/\s+/g, "").replace(/×/g, "*");

    // 2) reemplaza variable x por valor (como token numérico)
    // pero OJO: para manejar "2x" hacemos tokenización por letras
    const tokens = [];
    let i = 0;

    const pushOp = (op) => tokens.push({ type: "op", value: op });
    const pushNum = (num) => tokens.push({ type: "num", value: num });

    const isDigit = (c) => c >= "0" && c <= "9";

    while (i < s.length) {
      const c = s[i];

      // Paréntesis
      if (c === "(" || c === ")") {
        tokens.push({ type: "paren", value: c });
        i++;
        continue;
      }

      // Operadores
      if (c === "+" || c === "-" || c === "*" || c === "/") {
        pushOp(c);
        i++;
        continue;
      }

      // Variable x
      if (c === "x" || c === "X") {
        // multiplicación implícita: ...num x  o ... ) x
        const prev = tokens[tokens.length - 1];
        if (prev && (prev.type === "num" || (prev.type === "paren" && prev.value === ")"))) {
          pushOp("*");
        }
        pushNum(Number(xVal));
        i++;
        continue;
      }

      // Número (entero)
      if (isDigit(c)) {
        let j = i;
        while (j < s.length && isDigit(s[j])) j++;
        const n = Number(s.slice(i, j));

        // multiplicación implícita: ... ) 2  o ... x 2 (ya x se vuelve num)
        const prev = tokens[tokens.length - 1];
        if (prev && (prev.type === "num" || (prev.type === "paren" && prev.value === ")"))) {
          // ojo: esto haría "22" como "2*2" si hubiera pegado números, pero no ocurre porque se parsea completo
        }

        pushNum(n);
        i = j;

        // multiplicación implícita: "2(" => insert '*'
        if (s[i] === "(") {
          pushOp("*");
        }
        continue;
      }

      throw new Error("Token inválido en expr: " + expr);
    }

    // Manejo de menos unary: convertimos "-a" al inicio o tras operador/paréntesis "(" en (0 - a)
    const fixed = [];
    for (let k = 0; k < tokens.length; k++) {
      const t = tokens[k];
      if (t.type === "op" && t.value === "-") {
        const prev = fixed[fixed.length - 1];
        const isUnary = !prev || (prev.type === "op") || (prev.type === "paren" && prev.value === "(");
        if (isUnary) {
          fixed.push({ type: "num", value: 0 });
          fixed.push({ type: "op", value: "-" });
          continue;
        }
      }
      fixed.push(t);
    }

    return fixed;
  }

  _toRPN(tokens) {
    const output = [];
    const stack = [];

    const prec = { "+": 1, "-": 1, "*": 2, "/": 2 };
    const isLeftAssoc = () => true;

    for (const t of tokens) {
      if (t.type === "num") {
        output.push(t);
      } else if (t.type === "op") {
        while (stack.length) {
          const top = stack[stack.length - 1];
          if (top.type === "op" && (prec[top.value] > prec[t.value] ||
              (prec[top.value] === prec[t.value] && isLeftAssoc(t.value)))) {
            output.push(stack.pop());
          } else break;
        }
        stack.push(t);
      } else if (t.type === "paren" && t.value === "(") {
        stack.push(t);
      } else if (t.type === "paren" && t.value === ")") {
        while (stack.length && !(stack[stack.length - 1].type === "paren" && stack[stack.length - 1].value === "(")) {
          output.push(stack.pop());
        }
        if (!stack.length) throw new Error("Paréntesis desbalanceados");
        stack.pop(); // pop "("
      }
    }

    while (stack.length) {
      const t = stack.pop();
      if (t.type === "paren") throw new Error("Paréntesis desbalanceados");
      output.push(t);
    }

    return output;
  }

  _evalRPN(rpn) {
    const st = [];
    for (const t of rpn) {
      if (t.type === "num") st.push(t.value);
      else if (t.type === "op") {
        const b = st.pop();
        const a = st.pop();
        if (a === undefined || b === undefined) throw new Error("Expresión inválida");
        if (t.value === "+") st.push(a + b);
        else if (t.value === "-") st.push(a - b);
        else if (t.value === "*") st.push(a * b);
        else if (t.value === "/") st.push(a / b);
        else throw new Error("Op inválido");
      }
    }
    if (st.length !== 1) throw new Error("Expresión inválida");
    return st[0];
  }

// =======================================================
// TEMPLATES (2 dificultades, con enunciados equivalentes)
// - difficulty: 1 -> preguntas 1..5
// - difficulty: 2 -> preguntas 6..10
// =======================================================
_buildTemplates() {
  return [
    // =========================
    // DIFICULTAD 1 (1..5)
    // =========================

    // x + b
    {
      id: "D1_add_b",
      difficulty: 1,
      statements: [
        ({ b }) => `A un número agrégale ${b}.`,
        ({ b }) => `A un número súmale ${b}.`,
        ({ b }) => `La suma de un número y ${b}.`,
        ({ b }) => `Un número aumentado en ${b}.`,
        ({ b }) => `Un número más ${b}.`,
      ],
      makeCorrect: ({ x, b }) => `${x} + ${b}`,
      makeDistractors: ({ x, k, b }) => [
        `${x} - ${b}`,
        `2*${x} + ${b}`,
        `${k} + ${b}`,
      ],
    },

    // x - b (diagnóstico de orden, buenísimo)
    {
      id: "D1_x_minus_b",
      difficulty: 1,
      statements: [
        ({ b }) => `A un número réstale ${b}.`,
        ({ b }) => `A un número quítale ${b}.`,
        ({ b }) => `Un número menos ${b}.`,
        ({ b }) => `La diferencia entre un número y ${b}.`,
        ({ b }) => `Un número disminuido en ${b}.`,
      ],
      makeCorrect: ({ x, b }) => `${x} - ${b}`,
      makeDistractors: ({ x, b }) => [
        `${b} - ${x}`,     // error típico de “buscar el número”
        `${x} + ${b}`,
        `(${x} - ${b})/2`,
      ],
    },

    // 2x
    {
      id: "D1_double",
      difficulty: 1,
      statements: [
        () => `El doble de un número.`,
        () => `Dos veces un número.`,
        () => `El producto de 2 y un número.`,
      ],
      makeCorrect: ({ x }) => `2*${x}`,
      makeDistractors: ({ x }) => [
        `${x}/2`,
        `${x} + 2`,
        `2 + ${x}`, // equivalente a x+2 (tu validador la filtra si la pones como distractor equivalente en suma; aquí no es equivalente a 2x)
      ],
    },

    // 3x
    {
      id: "D1_triple",
      difficulty: 1,
      statements: [
        () => `El triple de un número.`,
        () => `Tres veces un número.`,
        () => `El producto de 3 y un número.`,
      ],
      makeCorrect: ({ x }) => `3*${x}`,
      makeDistractors: ({ x }) => [
        `${x}/3`,
        `${x} + 3`,
        `3 + ${x}`,
      ],
    },

    // nx con n aleatoria entre 4 y 9
    {
      id: "D1_n_times",
      difficulty: 1,
      statements: [
        ({ n }) => `${n} veces un número.`,
        ({ n }) => `El producto de ${n} y un número.`,
        ({ n }) => `Multiplica un número por ${n}.`,
      ],
      makeCorrect: ({ x, n }) => `${n}*${x}`,
      makeDistractors: ({ x, n }) => [
        `${x}/${n}`,
        `${x} + ${n}`,
        `${n} + ${x}`,
      ],
    },

    // kx + b (k en {2..5})
    {
      id: "D1_kx_plus_b",
      difficulty: 1,
      statements: [        
        ({ k, b }) => `${k} veces un número y después súmale ${b}.`,
        ({ k, b }) => `Al producto de ${k} y un número agrégale ${b}.`,
        ({ k, b }) => `La suma de ${k} veces un número y ${b}.`,
        ({ k, b }) => `${k} veces un número, más ${b}.`,
      ],
      makeCorrect: ({ x, k, b }) => `${k}*${x} + ${b}`,
      makeDistractors: ({ x, k, b }) => [
        `${k}*(${x} + ${b})`, // paréntesis mal
        `${k}*${x} - ${b}`,   // signo mal
        `${x} + ${k}*${b}`,   // duplica b
      ],
    },

    // =========================
    // DIFICULTAD 2 (6..10)
    // =========================

    // 2x - b
    {
      id: "D2_double_minus_b",
      difficulty: 2,
      statements: [
        ({ b }) => `Al doble de un número réstale ${b}.`,
        ({ b }) => `Al doble de un número quítale ${b}.`,
        ({ b }) => `El doble de un número, menos ${b}.`,
        ({ b }) => `La diferencia del doble de un número y ${b}.`,
      ],
      makeCorrect: ({ x, b }) => `2*${x} - ${b}`,
      makeDistractors: ({ x, b }) => [
        `${b} - 2*${x}`,     // invierte orden
        `2*(${x} - ${b})`,   // mete paréntesis
        `2*${x} + ${b}`,     // signo mal
      ],
    },

    // 2(x + b)
    {
      id: "D2_double_of_sum",
      difficulty: 2,
      statements: [
        ({ b }) => `El doble de la suma de un número y ${b}.`,
        ({ b }) => `Duplica la suma de un número y ${b}.`,
        ({ b }) => `Dos veces la suma de un número y ${b}.`, 
      ],
      makeCorrect: ({ x, b }) => `2*(${x} + ${b})`,
      makeDistractors: ({ x, b }) => [
        `2*${x} + ${b}`,     // olvida paréntesis
        `${x} + 2*${b}`,     // duplica b
        `(${x} + ${b})/2`,   // doble ↔ mitad
      ],
    },

    // (x + b)/2
    {
      id: "D2_half_of_sum",
      difficulty: 2,
      statements: [
        ({ b }) => `La mitad de la suma de un número y ${b}.`,
        ({ b }) => `Divide entre 2 la suma de un número y ${b}.`,
        ({ b }) => `El cociente de la suma de un número y ${b}, entre 2.`,
      ],
      makeCorrect: ({ x, b }) => `(${x} + ${b})/2`,
      makeDistractors: ({ x, b }) => [
        `${x}/2 + ${b}`,     // solo divide x
        `${x} + ${b}/2`,     // solo divide b
        `2*(${x} + ${b})`,   // inversa
      ],
    },

    // n - 2x (orden explícito)
    {
      id: "D2_7_minus_double_x",
      difficulty: 2,
      statements: [
        ({ n }) => `A ${n} réstale el doble de un número.`,
        ({ n }) => `A ${n} quítale el doble de un número.`,
        ({ n }) => `${n} menos el doble de un número.`,
      ],
      makeCorrect: ({ x, n }) => `${n} - 2*${x}`,
      makeDistractors: ({ x, n }) => [
        `2*${x} - ${n}`,     // orden invertido
        `${n} + 2*${x}`,     // signo mal
        `2*(${n} - ${x})`,   // paréntesis mal aplicado
      ],
    },

    // 5(x - b)
    {
      id: "D2_five_times_difference",
      difficulty: 2,
      statements: [
        ({ b }) => `Cinco veces la diferencia entre un número y ${b}.`,
        ({ b }) => `Multiplica por 5 la diferencia entre un número y ${b}.`,
        ({ b }) => `El quíntuple de (un número menos ${b}).`,
      ],
      makeCorrect: ({ x, b }) => `5*(${x} - ${b})`,
      makeDistractors: ({ x, b }) => [
        `5*${x} - ${b}`,     // sin paréntesis
        `5*(${x} + ${b})`,   // signo mal
        `(${x} - ${b})/5`,   // inversa
      ],
    },

    // n(kx + b)
    {
      id: "D2_n_times_kx_plus_b",
      difficulty: 2,
      statements: [
        ({ nWide, kWide, b }) => `${nWide} veces la suma de ${kWide} veces un número y ${b}.`,
        ({ nWide, kWide, b }) => `Multiplica por ${nWide} la suma de ${kWide} veces un número y ${b}.`,
        ({ nWide, kWide, b }) => `El producto de ${nWide} y la suma de ${kWide} veces un número con ${b}.`,
      ],
      makeCorrect: ({ x, nWide, kWide, b }) => `${nWide}*(${kWide}*${x} + ${b})`,
      makeDistractors: ({ x, nWide, kWide, b }) => [
        `${nWide}*${kWide}*${x} + ${b}`,       // no distribuye a b
        `${nWide}*(${kWide}*${x} - ${b})`,     // signo mal
        `${kWide}*(${nWide}*${x} + ${b})`,     // confunde qué multiplica a qué
      ],
    },

    // 2(3x - b)
    {
      id: "D2_double_of_difference_triple_x_and_b",
      difficulty: 2,
      statements: [
        ({ b }) => `El doble de la diferencia del triple de un número y ${b}.`,
        ({ b }) => `Dos veces la diferencia entre el triple de un número y ${b}.`,
        ({ b }) => `Multiplica por 2 la diferencia del triple de un número y ${b}.`,
      ],
      makeCorrect: ({ x, b }) => `2*(3*${x} - ${b})`,
      makeDistractors: ({ x, b }) => [
        `2*3*${x} - ${b}`,     // no distribuye a b
        `2*(3*${x} + ${b})`,   // signo mal
        `(3*${x} - ${b})/2`,   // inversa
      ],
    },
  ];
}

_pickStatement(tpl, params) {
  if (tpl.statements && tpl.statements.length) {
    const candidates = tpl.statements
      .map((f) => f(params))
      .filter((s) => !!s && !s.includes("(") && !s.includes(")"));
    if (!candidates.length) return "";
    return candidates[Math.floor(Math.random() * candidates.length)];
  }
  // compatibilidad por si algún template viejo aún trae makeStatement
  if (typeof tpl.makeStatement === "function") {
    const s = tpl.makeStatement(params) || "";
    if (s.includes("(") || s.includes(")")) return "";
    return s;
  }
  return "";
}


  // =======================================================
  // FIN DEL JUEGO
  // =======================================================
  _finishGame(failed = false) {
    if (this.gameFinished) return;
    this.gameFinished = true;
    this.state = "finished";
    this.exitDelay = 0.5;

    this.win = !failed && (this.correctCount >= this.totalQuestions) && (this.errors < this.maxErrors);

    // Tier (simple por ahora)
    const tier = failed ? 0 : 1;

    let gained = 0;
    if (window.MN_reportMinigameTier) {
      gained = MN_reportMinigameTier("lenguaje_natural", tier);
    }
    this.sheetsReward = gained;

    if (this.win) {
      this.message =
        "¡Dominaste la traducción algebraica!\n" +
        `Aciertos: ${this.correctCount}/${this.totalQuestions}.\n` +
        `Errores: ${this.errors}/${this.maxErrors}.\n` +
        `Hojas ganadas: ${gained}.`;
      this.playSfx(this.sfxWin, { volume: 0.7 });
    } else {
      this.message =
        "Aún necesitas practicar un poco más.\n" +
        `Aciertos: ${this.correctCount}/${this.totalQuestions}.\n` +
        `Errores: ${this.errors}/${this.maxErrors}.\n` +        
        `Hojas ganadas: ${gained}.`;
      this.playSfx(this.sfxLose, { volume: 0.7 });
    }

    this.game?.events?.emit?.("lenguaje_natural_done", {
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

    // Fondo
    if (this.bgImage) {
      const img = this.bgImage;
      const scale = Math.max(W / img.width, H / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
    } else {
      ctx.fillStyle = "#061018";
      ctx.fillRect(0, 0, W, H);
    }

    // Capa oscura
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, W, H);

    this._drawHUD(ctx);

    if (this.state === "intro") {
      this._drawIntro(ctx);
      return;
    }

    if (this.state === "playing") {
      this._drawStatement(ctx);
      this._drawThreatEyes(ctx);
      this._drawOptions(ctx);
      this._drawPlayer(ctx);

      if (this.phase === "feedback_correct" || this.phase === "feedback_wrong") {
        this._drawFeedback(ctx);
      }
      return;
    }

    if (this.state === "finished") {
      this._drawEndMessage(ctx);
    }
  }

  _drawHUD(ctx) {
    const W = this.game.canvas.width;

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(15, 10, 190, 35);

    ctx.strokeStyle = "#ffcc66";
    ctx.lineWidth = 2;
    ctx.strokeRect(15, 10, 190, 35);

    ctx.font = "16px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";

    // Tiempo
    const t = Math.max(0, Math.floor(this.timeLeft));
    const min = Math.floor(t / 60);
    const sec = t % 60;
    const secStr = sec < 10 ? "0" + sec : "" + sec;
    ctx.fillText(`Tiempo: ${min}:${secStr}`, 25, 32);

    ctx.restore();
  }

  _drawIntro(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";

    ctx.font = "32px Arial";
    ctx.fillText("Traducción Algebraica", W / 2, H * 0.3);

    ctx.font = "18px Arial";
    ctx.fillText("Lee el enunciado y elige la expresión correcta.", W / 2, H * 0.42);
    ctx.fillText("Consigue 10 aciertos.", W / 2, H * 0.48);
    ctx.fillText("Con 3 errores, la amenaza te alcanza.", W / 2, H * 0.54);

    ctx.font = "18px Arial";
    ctx.fillText("Pulsa ENTER o ESPACIO para comenzar.", W / 2, H * 0.64);

    ctx.restore();
  }

  _drawStatement(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    ctx.save();
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";

    ctx.font = "24px Arial";
    this._wrapText(ctx, this.statement, W / 2, H * 0.11, W * 0.82, 28);

    ctx.restore();
  }

  _drawPlayer(ctx) {
    const cx = this.playerAnchor.x;
    const cy = this.playerAnchor.y + 12;

    ctx.save();
    if (this.playerWalkImg && this.playerWalk.w > 0 && this.playerWalk.h > 0) {
      const fw = this.playerWalk.w;
      const fh = this.playerWalk.h;
      const sx = this.playerWalk.frame * fw;
      const scale = 0.49;
      const dw = fw * scale;
      const dh = fh * scale;
      ctx.drawImage(
        this.playerWalkImg,
        sx,
        0,
        fw,
        fh,
        cx - dw * 0.5,
        cy - dh * 0.68,
        dw,
        dh,
      );
    } else {
      ctx.fillStyle = "#d7e8ff";
      ctx.beginPath();
      ctx.arc(cx, cy - 13, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#4464a8";
      ctx.fillRect(cx - 11, cy - 1, 22, 31);
    }
    ctx.restore();
  }

  _drawHexTile(ctx, x, y, r, fill, stroke, alpha = 1) {
    const h = r * 0.8660254 * this.hexYScale;
    const topHalf = r * 0.475;    // línea superior ligeramente más corta
    const bottomHalf = r * 0.525; // línea inferior 5% más larga
    const traceHex = () => {
      ctx.beginPath();
      ctx.moveTo(x - r, y);
      ctx.lineTo(x - topHalf, y - h);
      ctx.lineTo(x + topHalf, y - h);
      ctx.lineTo(x + r, y);
      ctx.lineTo(x + bottomHalf, y + h);
      ctx.lineTo(x - bottomHalf, y + h);
      ctx.closePath();
    };

    ctx.save();
    ctx.globalAlpha = alpha;

    // Sombra suave para separar capas y dar profundidad.
    ctx.shadowColor = "rgba(0,0,0,0.34)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 5;
    traceHex();
    ctx.fillStyle = fill;
    ctx.fill();

    // Desactiva sombra para detalles internos limpios.
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Gradiente de profundidad: más oscuro arriba (lejos), más claro abajo (cerca).
    traceHex();
    ctx.clip();
    const depthGrad = ctx.createLinearGradient(0, y - h, 0, y + h);
    depthGrad.addColorStop(0, "rgba(0,0,0,0.18)");
    depthGrad.addColorStop(0.52, "rgba(255,255,255,0.05)");
    depthGrad.addColorStop(1, "rgba(255,255,255,0.20)");
    ctx.fillStyle = depthGrad;
    ctx.fillRect(x - r * 1.1, y - h - 2, r * 2.2, h * 2 + 4);

    traceHex();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  _drawThreatEyes(ctx) {
    if (this.threatLevel <= 0 && this.phase !== "feedback_wrong") return;

    const W = this.game.canvas.width;
    const H = this.game.canvas.height;
    const level = Math.max(this.threatLevel, this.phase === "feedback_wrong" ? 1 : 0);
    const baseByLevel = [0.0, 0.205, 0.41];
    const idx = Math.max(0, Math.min(baseByLevel.length - 1, level - 1));
    const approach = Math.min(1, baseByLevel[idx] + this.threatAdvance * 0.08);
    const centerX = W * (0.72 - 0.22 * approach);
    const y = H * (0.2 + 0.28 * approach);
    const eyeGap = 52 + 10 * approach;
    const eyeR = 6 + 18 * approach + Math.sin(this.threatPulse) * 1.2;
    const auraR = 85 + 210 * approach;

    ctx.save();
    const grad = ctx.createRadialGradient(centerX, y, eyeR, centerX, y, auraR);
    grad.addColorStop(0, "rgba(180,20,10,0.18)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    const glow = 0.55 + 0.35 * Math.sin(this.threatPulse * 1.2);
    ctx.fillStyle = `rgba(255,50,30,${glow})`;
    ctx.beginPath();
    ctx.ellipse(centerX - eyeGap * 0.5, y, eyeR * 1.2, eyeR, 0, 0, Math.PI * 2);
    ctx.ellipse(centerX + eyeGap * 0.5, y, eyeR * 1.2, eyeR, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,220,180,0.85)";
    ctx.beginPath();
    ctx.arc(centerX - eyeGap * 0.5 + eyeR * 0.35, y - eyeR * 0.15, eyeR * 0.24, 0, Math.PI * 2);
    ctx.arc(centerX + eyeGap * 0.5 + eyeR * 0.35, y - eyeR * 0.15, eyeR * 0.24, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawOptions(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;
    const selIndex = this.selectionAnim.active ? this.selectionAnim.index : this.selectedIndex;
    const inQuestion = this.phase === "question";
    const center = this._getCenterTilePos();
    ctx.save();
    ctx.font = "18px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    this._drawHexTile(ctx, center.x, center.y, this.centerHexRadius, "rgba(58,72,98,0.56)", "#d9e6ff", 1);

    for (let nid = 0; nid < this.neighborOffsets.length; nid++) {
      const pos = this._getNeighborPosById(nid);
      const tileR = this.optionHexRadius * this._getHexScaleByY(pos.y);
      const farDark = selIndex !== -1 && this.optionToNeighbor[selIndex] !== nid;
      const fill = "rgba(24,38,66,0.54)";
      const stroke = "#d6e5ff";
      const alpha = farDark ? 0.14 : 1;
      this._drawHexTile(ctx, pos.x, pos.y, tileR, fill, stroke, alpha);
    }

    for (let i = 0; i < this.options.length; i++) {
      const opt = this.options[i];
      const pos = this._getOptionDisplayPos(i);
      const tileR = this.optionHexRadius * this._getHexScaleByY(pos.y);
      const isHover = inQuestion && !this.selectionAnim.active && i === this.hoverIndex;
      const farDark = selIndex !== -1 && i !== selIndex;
      const stroke = isHover ? "#ffffff" : "#d5e2ff";
      this._drawHexTile(ctx, pos.x, pos.y, tileR, "rgba(44,64,108,0.78)", stroke, farDark ? 0.4 : 1);

      ctx.fillStyle = farDark ? "#94a0ba" : "#ffffff";
      ctx.font = "19px Arial";
      this._wrapText(ctx, opt.label, pos.x, pos.y - 10, tileR * 1.4, 22);

      const keyX = pos.x - tileR * 0.58;
      const keyY = pos.y - tileR * 0.42;
      const keyR = tileR * 0.16;
      ctx.beginPath();
      ctx.fillStyle = farDark ? "rgba(73,86,112,0.82)" : "rgba(228,238,255,0.92)";
      ctx.arc(keyX, keyY, keyR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = farDark ? "rgba(122,138,170,0.85)" : "rgba(52,73,120,0.95)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.font = "14px Arial";
      ctx.fillStyle = farDark ? "#d0d8e9" : "#2a3e69";
      ctx.fillText((i + 1).toString(), keyX, keyY + 0.5);
    }

    const vignette = ctx.createRadialGradient(
      this.playerAnchor.x,
      this.playerAnchor.y,
      120,
      this.playerAnchor.x,
      this.playerAnchor.y,
      Math.max(W, H) * 0.75,
    );
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.46)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);

    ctx.font = "16px Arial";
    ctx.fillStyle = "#dce4f2";
    ctx.fillText("Elige una loseta vecina: teclas 1–6 o clic.", W / 2, H - 20);
    ctx.restore();
  }

  _drawFeedback(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "24px Arial";
    ctx.fillStyle = this.phase === "feedback_correct" ? "#a5ff7b" : "#ffd54f";
    ctx.fillText(this.feedbackText, W / 2, H * 0.25);
    ctx.restore();
  }

  _drawEndMessage(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const lines = this.message.split("\n");
    ctx.font = "30px Arial";
    ctx.fillStyle = this.win ? "#a5ff7b" : "#ffaaaa";

    let y = H * 0.32;
    for (const line of lines) {
      ctx.fillText(line, W / 2, y);
      y += 32;
    }

    ctx.font = "18px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Pulsa ENTER, ESPACIO o clic para volver.", W / 2, y + 24);

    ctx.restore();
  }

  _wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    if (!text) return;
    const words = text.split(" ");
    let line = "";
    let yy = y;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const testWidth = ctx.measureText(testLine).width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, yy);
        line = words[n] + " ";
        yy += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, yy);
  }

  _randInt(a, b) {
    return a + Math.floor(Math.random() * (b - a + 1));
  }

  _formatExprForDisplay(expr) {
    if (!expr) return "";
    let s = String(expr);
    // 2*x -> 2x, 3*X -> 3X
    s = s.replace(/(\d+)\s*\*\s*([xX])/g, "$1$2");
    // 2*(x+3) -> 2(x+3)
    s = s.replace(/(\d+)\s*\*\s*\(/g, "$1(");
    return s;
  }
}

window.LenguajeNaturalScene = LenguajeNaturalScene;
