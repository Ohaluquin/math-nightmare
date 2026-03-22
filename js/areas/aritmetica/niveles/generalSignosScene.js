// ===========================================================
// GeneralSignosScene.js – El General de los Signos
// Minijuego de ley de signos en suma y multiplicación.
// - Números entre -9 y 9 (sin 0).
// - Operación aleatoria: suma o multiplicación.
// - Cuatro opciones siempre: a+b, -a-b, ab, -ab (reordenadas).
// - Objetivo: lograr 10 aciertos CONSECUTIVOS.
// - Si fallas, se muestra una animación explicativa con los
//   mismos números de la operación.
// ===========================================================

class GeneralSignosScene extends Scene {
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

    this.bgImage = null;

    // ----------------- Pregunta actual -----------------
    this.a = 0;
    this.b = 0;
    this.op = "+"; // "+" o "×"
    this.options = []; // [{ value, label, tag }, ...]
    this.correctIndex = 0;

    this.streak = 0;
    this.bestStreak = 0;
    this.targetStreak = 10;
    // ❌ Errores permitidos
    this.maxErrors = 5;
    this.errors = 0;

    // ⏱️ Tiempo límite (segundos)
    this.timeLimit = 120;
    this.timeLeft = this.timeLimit;

    // ----------------- Feedback -----------------
    this.feedbackTimer = 0;
    this.feedbackText = "";

    // ----------------- Animaciones de explicación -----------------
    this.animMode = null; // "sum" | "mul"
    this.animTime = 0;

    // Suma
    this.sumSoldiersLeft = [];
    this.sumSoldiersRight = [];
    this.sumPairsToCancel = 0;
    this.sumPairsCancelled = 0;
    this.sumRealResult = 0;

    // Multiplicación
    this.mulCols = 0;
    this.mulRows = 0;
    this.mulTotal = 0;
    this.mulCellsVisible = 0;
    this.mulRealResult = 0;

    // Multiplicación – animación basada en las columnas que ve el jugador
    this.mulSoldiersLeft = []; // ejército de a
    this.mulSoldiersRight = []; // ejército de b

    this.mulSignAInitial = 1;
    this.mulSignBInitial = 1;
    this.mulSignAEffective = 1;
    this.mulSignBEffective = 1;
    this.mulCurrentSignA = 1;
    this.mulCurrentSignB = 1;
    this.mulFinalGridSign = 1; // signo del rectángulo final

    // Tiempos de la animación de multiplicación
    this.mulMoveDuration = 1.0; // columnas → base/altura
    this.mulSignEffectDuration = 1.0; // efecto "poder del menos"
    this.mulCellDuration = 0.04; // tiempo por celda del rectángulo
    this.mulSignEffectProgress = 0; // 0–1, para animar el "poder del menos"
    this.mulSignEffectSoundPlayed = false;

    this.feedbackMinDuration = 1.0; // se ajusta en cada explicación

    // ----------------- Input -----------------
    this.optionRects = []; // [{x,y,w,h}, ...]
    this.hoverIndex = -1;
    this._prevKeys = {};
    this.prevMouseDown = false;

    // HUD / NPC
    this.npcName = "General de los Signos";

    // Sonidos
    this.sfxCorrect = "sfx_match";
    this.sfxWrong = "sfx_error";
    this.sfxWin = "sfx_win";
    this.sfxFlip = "sfx_change_page";

    this.time = 0;

    // Suma – conteo de sobrevivientes
    this.sumCountingList = []; // soldados que quedan al final
    this.sumCountingIndex = 0; // cuántos ya hemos “contado”

    // ========= Progreso tipo "Juego del Calamar" =========
    this.maxSoldiers = 5; // tres intentos
    this.activeSoldier = 0; // índice del soldado actual (0,1,2)
    // La posición del soldado la tomamos de this.streak (racha)

    // ========= Sprite del soldado del camino =========
    // Usaremos 3 estados: idle, walk, dead
    this.pathSoldierSprites = null; // se inicializa en _initPathSoldierSprites()
    this.pathSoldierState = "idle"; // "idle" | "walk" | "dead"
    this.pathSoldierStateTime = 0;
    this.pathSoldierDuration = 0;
    this.pathSoldierFromStep = 0; // índice de casilla origen (0..steps-1)
    this.pathSoldierToStep = 0; // índice de casilla destino (0..steps-1)
    this.pathSoldierDeadHold = 0;
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
    if (window.MN_setLeafHUDVisible) {
      window.MN_setLeafHUDVisible(false);
    }
    if (window.MN_setInputMode) MN_setInputMode("mouse");

    this.gameFinished = false;
    this.exitDelay = 0;
    this.message = "";
    this.sheetsReward = 0;
    this.win = false;

    this.state = "intro";
    this.phase = "question";
    this.streak = 0;
    this.activeSoldier = 0;
    this.bestStreak = 0;
    this.errors = 0;
    this.timeLeft = this.timeLimit;

    this.feedbackTimer = 0;
    this.feedbackText = "";

    this.animMode = null;
    this.animTime = 0;

    // Suma
    this.sumSoldiersLeft = [];
    this.sumSoldiersRight = [];
    this.sumPairsToCancel = 0;
    this.sumPairsCancelled = 0;
    this.sumRealResult = 0;
    this.sumCountingList = [];
    this.sumCountingIndex = 0;

    // Multiplicación
    this.mulCols = 0;
    this.mulRows = 0;
    this.mulTotal = 0;
    this.mulCellsVisible = 0;
    this.mulRealResult = 0;
    this.mulSoldiersLeft = [];
    this.mulSoldiersRight = [];
    this.mulSignAInitial = 1;
    this.mulSignBInitial = 1;
    this.mulSignAEffective = 1;
    this.mulSignBEffective = 1;
    this.mulCurrentSignA = 1;
    this.mulCurrentSignB = 1;
    this.mulFinalGridSign = 1;
    this.mulSignEffectProgress = 0;
    this.mulSignEffectSoundPlayed = false;

    this.feedbackMinDuration = 2.0;
    this.time = 0;

    // ========= Estado del soldado del camino =========
    this.pathSoldierState = "idle";
    this.pathSoldierStateTime = 0;
    this.pathSoldierDuration = 0;
    this.pathSoldierFromStep = 0;
    this.pathSoldierToStep = 0;
    this.pathSoldierDeadHold = 0;
    const A = this.game.assets;
    this.bgImage = (A && A.getImage("mn_bg_signos")) || null;

    if (this.camera && this.game.canvas) {
      this.camera.x = 0;
      this.camera.y = 0;
      this.camera.setBounds(
        0,
        0,
        this.game.canvas.width,
        this.game.canvas.height,
      );
    }

    // Inicializa los sprites del soldado del camino (si existen en assets)
    this._initPathSoldierSprites();
    this._computeOptionLayout();
    this._prevKeys = {};
    this.sumCountingList = [];
    this.sumCountingIndex = 0;
  }

  destroy() {
    this.clearAll();
  }

  _computeOptionLayout() {
    const canvas = this.game.canvas;
    const w = canvas.width;
    const h = canvas.height;

    const marginX = 40;
    const marginY = 40;
    const rectWidth = (w - marginX * 3) / 4.5;
    const rectHeight = 60;
    const baseYTop = h - marginY - rectHeight * 3 - 10;

    this.optionRects = [
      { x: marginX, y: baseYTop, w: rectWidth, h: rectHeight },
      { x: marginX * 2 + rectWidth, y: baseYTop, w: rectWidth, h: rectHeight },
      {
        x: marginX * 3 + 2 * rectWidth,
        y: baseYTop,
        w: rectWidth,
        h: rectHeight,
      },
      {
        x: marginX * 4 + 3 * rectWidth,
        y: baseYTop,
        w: rectWidth,
        h: rectHeight,
      },
    ];
  }

  // =======================================================
  // UPDATE
  // =======================================================
  update(dt) {
    super.update(dt);
    this.time += dt;
    // Actualiza la animación del soldado del camino
    this._updatePathSoldier(dt);
    const input = this.game.input;
    const keys = input.keys || {};
    const isJustPressed = (key) => keys[key] && !this._prevKeys[key];

    // ----------------------------------------
    // Juego ya terminado
    // ----------------------------------------
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

      if (wantsExit) {
        window.MN_APP?.toOverworld?.();
      }

      this._prevKeys = { ...keys };
      return;
    }

    // ----------------------------------------
    // INTRO
    // ----------------------------------------
    if (this.state === "intro") {
      if (isJustPressed("Enter") || isJustPressed(" ")) {
        this.state = "playing";
        this._newQuestion();
      }
      this._prevKeys = { ...keys };
      return;
    }

    // ----------------------------------------
    // PLAYING
    // ----------------------------------------
    if (this.state === "playing") {
      this._updatePlaying(dt, input, keys, isJustPressed);
    }

    this._prevKeys = { ...keys };
  }

  _updatePlaying(dt, input, keys, isJustPressed) {
    // Hover de mouse
    const mouse = input.mouse || { x: 0, y: 0, down: false };
    this.hoverIndex = -1;
    for (let i = 0; i < this.optionRects.length; i++) {
      const r = this.optionRects[i];
      if (
        mouse.x >= r.x &&
        mouse.x <= r.x + r.w &&
        mouse.y >= r.y &&
        mouse.y <= r.y + r.h
      ) {
        this.hoverIndex = i;
        break;
      }
    }

    // Click de mouse (flanco)
    const justClicked = mouse.down && !this.prevMouseDown;
    this.prevMouseDown = mouse.down;

    // ⏱️ Actualizar reloj global mientras se está jugando
    if (!this.gameFinished && this.state === "playing") {
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this._finishGame(true); // derrota por tiempo
        return;
      }
    }

    if (this.phase === "question") {
      if (justClicked && this.hoverIndex !== -1) {
        this._handleAnswer(this.hoverIndex);
      }

      // Teclas 1–4
      if (isJustPressed("1")) this._handleAnswer(0);
      else if (isJustPressed("2")) this._handleAnswer(1);
      else if (isJustPressed("3")) this._handleAnswer(2);
      else if (isJustPressed("4")) this._handleAnswer(3);
    }

    // Fases de feedback / animación (tanto correcto como incorrecto)
    if (this.phase === "feedback_correct" || this.phase === "feedback_wrong") {
      this.feedbackTimer += dt;
      this.animTime += dt;

      if (this.animMode === "sum") {
        this._updateSumAnimation(dt);
      } else if (this.animMode === "mul") {
        this._updateMulAnimation(dt);
      }

      if (this.feedbackTimer >= this.feedbackMinDuration) {
        if (this.phase === "feedback_wrong") {
          // ❌ Feedback de error: cuenta límites
          if (this.errors >= this.maxErrors) {
            this._finishGame(true); // derrota por errores
          } else {
            this._newQuestion();
          }
        } else {
          // ✅ Feedback de acierto: solo avanzamos o terminamos
          if (this.streak >= this.targetStreak) {
            this._finishGame(false);
          } else {
            this._newQuestion();
          }
        }
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
    this.animMode = null;
    this.animTime = 0;
    this.mulSignEffectSoundPlayed = false;

    // Generar hasta tener 4 resultados distintos
    const range = [
      -9, -8, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9,
    ];
    while (true) {
      this.a = range[Math.floor(Math.random() * range.length)];
      this.b = range[Math.floor(Math.random() * range.length)];
      this.op = Math.random() < 0.5 ? "+" : "×";

      const v1 = this.a + this.b; // a + b
      const v2 = -this.a - this.b; // -a - b
      const v3 = this.a * this.b; // ab
      const v4 = -(this.a * this.b); // -ab

      const vals = [v1, v2, v3, v4];
      const unique = new Set(vals);

      if (unique.size === 4) {
        const baseOptions = [
          { value: v1, tag: "a+b" },
          { value: v2, tag: "-a-b" },
          { value: v3, tag: "ab" },
          { value: v4, tag: "-ab" },
        ];

        let correctIndex = this.op === "+" ? 0 : 2;

        // Fisher–Yates manteniendo índice correcto
        for (let i = baseOptions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          const tmp = baseOptions[i];
          baseOptions[i] = baseOptions[j];
          baseOptions[j] = tmp;

          if (i === correctIndex) correctIndex = j;
          else if (j === correctIndex) correctIndex = i;
        }

        this.options = baseOptions.map((opt) => ({
          value: opt.value,
          label: opt.value > 0 ? "+" + opt.value : "" + opt.value,
          tag: opt.tag,
        }));
        this.correctIndex = correctIndex;
        break;
      }
    }
  }

  _handleAnswer(index) {
    if (this.phase !== "question") return;
    if (index < 0 || index >= this.options.length) return;

    const chosen = this.options[index];
    const realResult = this.op === "+" ? this.a + this.b : this.a * this.b;
    const prevStreak = this.streak;

    if (chosen.value === realResult) {
      // ✅ RESPUESTA CORRECTA
      this.streak++;
      if (this.streak > this.bestStreak) this.bestStreak = this.streak;

      // Animación de avance del soldado en el camino
      this._startPathAdvance(prevStreak, this.streak);

      // Preparar animación pedagógica (sum o mul) aunque haya salido bien
      this._prepareExplanationAnimation(true);

      this.phase = "feedback_correct";
      this.feedbackTimer = 0;
      this.playSfx(this.sfxCorrect, { volume: 0.6 });
    } else {
      // ❌ RESPUESTA INCORRECTA

      // Animación de muerte del soldado actual
      this._startPathDeath(prevStreak);

      this.streak = 0;
      this.errors += 1;
      this.timeLeft = this.timeLimit;

      // Preparar animación pedagógica igual que antes
      this._prepareExplanationAnimation(false);

      this.phase = "feedback_wrong";
      this.feedbackTimer = 0;
      this.playSfx(this.sfxWrong, { volume: 0.6 });

      // "Muere" el soldado actual y pasa el siguiente
      this.activeSoldier++;
      if (this.activeSoldier >= this.maxSoldiers) {
        // ya se acabaron los soldados → derrota por soldados
        this._finishGame(true);
        return;
      }
    }
  }

  _prepareExplanationAnimation(wasCorrect = false) {
    this.animTime = 0;
    const realResult = this.op === "+" ? this.a + this.b : this.a * this.b;

    if (this.op === "+") {
      this.animMode = "sum";
      this._setupSumAnimation(realResult);

      const signA = Math.sign(this.a);
      const signB = Math.sign(this.b);
      const sameSign = signA === signB && signA !== 0 && signB !== 0;

      let msg = "";
      if (sameSign) {
        msg = "Signos iguales: se SUMAN los valores y se mantiene el signo.";
      } else {
        msg =
          "Signos diferentes: se RESTAN los valores y queda el signo del número mayor.";
      }

      this.feedbackText = wasCorrect ? "¡Correcto!\n" : msg;

      // ⏱️ calcular tiempo mínimo para que se vea toda la animación
      const moveDuration = 1.0;
      const stepDuration = 0.35;
      const pairs = this.sumPairsToCancel;
      const cancelPhase = pairs * stepDuration;
      const resCount = Math.abs(this.sumRealResult);
      const revealStart = cancelPhase + 0.3;
      const revealPhase = resCount * 0.2;

      this.feedbackMinDuration = moveDuration + revealStart + revealPhase + 0.6; // pequeño colchón
    } else {
      this.animMode = "mul";
      this._setupMulAnimation(realResult);

      const negA = this.a < 0 ? 1 : 0;
      const negB = this.b < 0 ? 1 : 0;
      const totalNeg = negA + negB;

      let msg = "";
      if (totalNeg === 0) {
        msg =
          "En multiplicación, dos signos positivos dan un resultado POSITIVO.";
      } else if (totalNeg === 1) {
        msg =
          "En multiplicación, un solo signo negativo da producto NEGATIVO.";
      } else {
        msg = "En multiplicación, dos signos negativos dan resultado POSITIVO.";
      }

      this.feedbackText = wasCorrect ? "¡Correcto!\n" : msg;

      // ⏱️ tiempo mínimo para ver toda la animación de multiplicación
      const moveDuration = this.mulMoveDuration;
      const signDuration = this.mulSignEffectDuration;
      const cellDuration = this.mulCellDuration;
      const gridPhase = this.mulTotal * cellDuration;

      this.feedbackMinDuration = moveDuration + signDuration + gridPhase + 0.8; // pequeño colchón
    }
  }

  // ---------- Suma: cancelación uno a uno ----------
  // ---------- Suma: cancelación uno a uno + fila de resultado ----------
  // ---------- Suma: columnas se acercan y se unen / cancelan ----------
  // ---------- Suma: columnas se acercan; luego cancelación y conteo in situ ----------
  _setupSumAnimation(realResult) {
    this.sumSoldiersLeft = [];
    this.sumSoldiersRight = [];
    this.sumPairsCancelled = 0;
    this.sumCountingList = [];
    this.sumCountingIndex = 0;

    const signA = Math.sign(this.a);
    const signB = Math.sign(this.b);

    const countA = Math.abs(this.a);
    const countB = Math.abs(this.b);

    const canvas = this.game.canvas;
    const H = canvas.height;
    const centerY = H * 0.35;
    const spacing = 32;

    const xLeft = canvas.width * 0.3;
    const xRight = canvas.width * 0.7;
    const xCenterLeft = canvas.width * 0.5 - 20;
    const xCenterRight = canvas.width * 0.5 + 20;

    // Columna izquierda (a)
    if (countA > 0) {
      const totalHeightA = (countA - 1) * spacing;
      const startYA = centerY - totalHeightA / 2;
      for (let i = 0; i < countA; i++) {
        const y = startYA + i * spacing;
        this.sumSoldiersLeft.push({
          sign: signA,
          x: xLeft,
          y,
          startX: xLeft,
          startY: y,
          targetX: xCenterLeft,
          targetY: y,
          alive: true,
        });
      }
    }

    // Columna derecha (b)
    if (countB > 0) {
      const totalHeightB = (countB - 1) * spacing;
      const startYB = centerY - totalHeightB / 2;
      for (let i = 0; i < countB; i++) {
        const y = startYB + i * spacing;
        this.sumSoldiersRight.push({
          sign: signB,
          x: xRight,
          y,
          startX: xRight,
          startY: y,
          targetX: xCenterRight,
          targetY: y,
          alive: true,
        });
      }
    }

    // ¿Cuántos se cancelan? (solo si signos opuestos)
    const sameSign = signA === signB && signA !== 0 && signB !== 0;
    if (!sameSign && signA !== 0 && signB !== 0) {
      this.sumPairsToCancel = Math.min(countA, countB);
    } else {
      this.sumPairsToCancel = 0;
    }

    this.sumRealResult = realResult;
  }

  _updateSumAnimation(dt) {
    const signA = Math.sign(this.a);
    const signB = Math.sign(this.b);
    const sameSign = signA === signB && signA !== 0 && signB !== 0;

    const moveDuration = 1.0; // tiempo para caminar al centro
    const stepDuration = 0.35; // tiempo entre cancelaciones
    const pauseAfterCancel = 0.3; // pequeña pausa antes de contar
    const countPer = 0.25; // tiempo entre cada ficha contada

    // 1) Movimiento hacia el centro
    if (this.animTime <= moveDuration) {
      const t = this.animTime / moveDuration;
      const lerp = (a, b, t) => a + (b - a) * t;

      for (const s of this.sumSoldiersLeft) {
        s.x = lerp(s.startX, s.targetX, t);
        s.y = s.startY;
      }
      for (const s of this.sumSoldiersRight) {
        s.x = lerp(s.startX, s.targetX, t);
        s.y = s.startY;
      }
      return;
    }

    const tMove = this.animTime - moveDuration;

    // 2) Cancelación de parejas (solo si signos distintos)
    let cancelPhase = 0;
    if (!sameSign && this.sumPairsToCancel > 0) {
      const maxPairs = this.sumPairsToCancel;
      const targetPairs = Math.min(maxPairs, Math.floor(tMove / stepDuration));

      while (this.sumPairsCancelled < targetPairs) {
        const leftIdx = this.sumSoldiersLeft.findIndex((s) => s.alive);
        const rightIdx = this.sumSoldiersRight.findIndex((s) => s.alive);
        if (leftIdx === -1 || rightIdx === -1) break;
        this.sumSoldiersLeft[leftIdx].alive = false;
        this.sumSoldiersRight[rightIdx].alive = false;
        this.sumPairsCancelled++;
      }

      cancelPhase = maxPairs * stepDuration;
    }

    // 3) Preparar la lista de sobrevivientes una sola vez
    const countingStart = cancelPhase + pauseAfterCancel;
    if (tMove >= countingStart && this.sumCountingList.length === 0) {
      const survivors = [];

      for (const s of this.sumSoldiersLeft) {
        if (s.alive) survivors.push(s);
      }
      for (const s of this.sumSoldiersRight) {
        if (s.alive) survivors.push(s);
      }

      // Ordenar de arriba hacia abajo, luego por X (para que el conteo sea estable)
      survivors.sort((a, b) => (a.y !== b.y ? a.y - b.y : a.x - b.x));

      this.sumCountingList = survivors;
      this.sumCountingIndex = 0;
    }

    // 4) Contar sobrevivientes en su lugar (se les va poniendo el aro)
    if (this.sumCountingList.length > 0) {
      const tCount = tMove - countingStart;
      const targetIndex = Math.min(
        this.sumCountingList.length,
        Math.floor(tCount / countPer) + 1,
      );
      this.sumCountingIndex = targetIndex;
    }
  }

  // ---------- Multiplicación: rectángulo + volteos de signo ----------
  // ---------- Multiplicación: columnas → base/altura → poder del menos → rectángulo ----------
  _setupMulAnimation(realResult) {
    const signA = Math.sign(this.a);
    const signB = Math.sign(this.b);
    const countA = Math.abs(this.a);
    const countB = Math.abs(this.b);

    const canvas = this.game.canvas;
    const W = canvas.width;
    const H = canvas.height;

    // Columnas que ya vio el jugador (mismos parámetros que en _drawStaticSoldiers)
    const centerYStatic = H * 0.35;
    const spacingStatic = 32;
    const xLeft = W * 0.3;
    const xRight = W * 0.7;

    // Geometría del rectángulo (igual que antes, solo cambiamos el lado de la columna)
    const centerX = W * 0.5;
    const centerYRect = H * 0.45;
    const baseSpacing = 32;

    this.mulCols = Math.max(1, countA);
    this.mulRows = Math.max(1, countB);
    this.mulTotal = this.mulCols * this.mulRows;
    this.mulCellsVisible = 0;
    this.mulRealResult = realResult;

    this.mulSoldiersLeft = [];
    this.mulSoldiersRight = [];

    const cols = this.mulCols;
    const rows = this.mulRows;

    // ✅ Usamos la misma separación en X y Y
    const s = baseSpacing;

    // Punto de partida de la base (primer soldado)
    const baseX0 = centerX - ((cols + 1) * s) / 2;
    // X de la columna: justo después del último soldado de la base
    const colX = baseX0 + cols * s;

    // Punto de partida de la columna (soldado de arriba)
    const colY0 = centerYRect - ((rows + 1) * s) / 2;
    // Y de la base: justo debajo del último soldado de la columna
    const rowY = colY0 + rows * s;

    // Ejército de a: columna izquierda → fila (base)
    if (countA > 0) {
      const totalHeightA = (countA - 1) * spacingStatic;
      const startYA = centerYStatic - totalHeightA / 2;
      for (let i = 0; i < countA; i++) {
        const y = startYA + i * spacingStatic;
        this.mulSoldiersLeft.push({
          index: i,
          sign: signA,
          startX: xLeft,
          startY: y,
          x: xLeft,
          y,
          // 👉 ahora forman la base empezando en baseX0
          targetX: baseX0 + i * s,
          targetY: rowY,
        });
      }
    }

    // Ejército de b: columna derecha → columna (altura)
    if (countB > 0) {
      const totalHeightB = (countB - 1) * spacingStatic;
      const startYB = centerYStatic - totalHeightB / 2;
      for (let j = 0; j < countB; j++) {
        const y = startYB + j * spacingStatic;
        this.mulSoldiersRight.push({
          index: j,
          sign: signB,
          startX: xRight,
          startY: y,
          x: xRight,
          y,
          // 👉 ahora forman la columna empezando en colY0
          targetX: colX,
          targetY: colY0 + j * s,
        });
      }
    }

    // ----------------- Lógica de signos (poder del menos) -----------------
    this.mulSignAInitial = signA || 1;
    this.mulSignBInitial = signB || 1;

    const negA = signA < 0 ? 1 : 0;
    const negB = signB < 0 ? 1 : 0;
    const totalNeg = negA + negB;

    if (totalNeg === 0) {
      // Ambos positivos
      this.mulSignAEffective = signA || 1;
      this.mulSignBEffective = signB || 1;
      this.mulFinalGridSign = 1;
    } else if (totalNeg === 1) {
      // Un solo negativo: su "−" voltea al otro → ambos quedan negativos → producto negativo
      const finalSign = -1;
      this.mulSignAEffective = finalSign;
      this.mulSignBEffective = finalSign;
      this.mulFinalGridSign = finalSign;
    } else {
      // Dos negativos: cada uno voltea al otro → ambos quedan positivos → producto positivo
      this.mulSignAEffective = 1;
      this.mulSignBEffective = 1;
      this.mulFinalGridSign = 1;
    }

    this.mulCurrentSignA = this.mulSignAInitial;
    this.mulCurrentSignB = this.mulSignBInitial;
    this.mulSignEffectProgress = 0;
  }

  _updateMulAnimation(dt) {
    if (this.mulTotal <= 0) return;

    const moveDuration = this.mulMoveDuration;
    const signDuration = this.mulSignEffectDuration;
    const cellDuration = this.mulCellDuration;

    const t = this.animTime;

    // 1) Movimiento: columnas → base y altura
    if (t <= moveDuration) {
      const alpha = t / moveDuration;
      const lerp = (a, b, u) => a + (b - a) * u;

      for (const s of this.mulSoldiersLeft) {
        s.x = lerp(s.startX, s.targetX, alpha);
        s.y = lerp(s.startY, s.targetY, alpha);
      }
      for (const s of this.mulSoldiersRight) {
        s.x = lerp(s.startX, s.targetX, alpha);
        s.y = lerp(s.startY, s.targetY, alpha);
      }
      return;
    }

    const tAfterMove = t - moveDuration;

    // 2) Efecto del "poder del menos": aparecen los signos y voltean al rival
    if (tAfterMove <= signDuration) {
      const p = tAfterMove / signDuration;
      this.mulSignEffectProgress = p;

      if (!this.mulSignEffectSoundPlayed && p > 0.1) {
        this.mulSignEffectSoundPlayed = true;
        this.playSfx(this.sfxFlip);
      }

      // Primera mitad: se ve el poder del menos, pero aún no cambian
      if (p < 0.5) {
        this.mulCurrentSignA = this.mulSignAInitial;
        this.mulCurrentSignB = this.mulSignBInitial;
      } else {
        // Segunda mitad: ya están volteados a sus signos efectivos
        this.mulCurrentSignA = this.mulSignAEffective;
        this.mulCurrentSignB = this.mulSignBEffective;
      }
      return;
    }

    // 3) Construcción del rectángulo, celda por celda
    const tGrid = tAfterMove - signDuration;
    const newVisible = Math.min(
      this.mulTotal,
      Math.floor(tGrid / cellDuration),
    );
    this.mulCellsVisible = newVisible;
  }
  // =======================================================
  // SPRITES DEL SOLDADO DEL CAMINO
  // =======================================================

  _initPathSoldierSprites() {
    if (this.pathSoldierSprites) return;

    const A = this.game.assets;
    if (!A) return;

    // Ajusta las claves, columnas, filas y fps según tus sprites reales
    const sheet = (key, cols, rows, fps) => ({
      img: A.getImage(key),
      cols,
      rows,
      fps,
    });

    this.pathSoldierSprites = {
      idle: sheet("idle", 7, 3, 6),
      walk: sheet("walk", 8, 3, 10),
      dead: sheet("dead", 4, 3, 8),
    };
  }

  _updatePathSoldier(dt) {
    if (this.pathSoldierState === "walk" || this.pathSoldierState === "dead") {
      this.pathSoldierStateTime += dt;

      if (this.pathSoldierDuration <= 0) {
        this.pathSoldierStateTime = 0;
        if (this.pathSoldierState === "dead") {
          this.pathSoldierState = "idle";
          this.pathSoldierFromStep = 0;
          this.pathSoldierToStep = 0;
        } else {
          this.pathSoldierState = "idle";
          this.pathSoldierFromStep = this.pathSoldierToStep;
        }
        return;
      }

      if (this.pathSoldierStateTime >= this.pathSoldierDuration) {
        // Termina la animación actual
        if (this.pathSoldierStateTime >= this.pathSoldierDuration) {
          if (this.pathSoldierState === "dead") {
            // Mantenerlo tirado un rato antes de resetear
            if (this.pathSoldierDeadHold > 0) {
              this.pathSoldierDeadHold -= dt;
              return;
            }
            this.pathSoldierState = "idle";
            this.pathSoldierFromStep = 0;
            this.pathSoldierToStep = 0;
          } else {
            // Después de caminar, se queda en la casilla destino
            this.pathSoldierState = "idle";
            this.pathSoldierFromStep = this.pathSoldierToStep;
          }
          this.pathSoldierStateTime = 0;
        }
      }
    }
  }

  _startPathAdvance(prevStreak, newStreak) {
    const steps = this.targetStreak || 1;
    const clampIndex = (streak) => {
      const s = Math.max(0, Math.min(steps, streak));
      return Math.max(0, Math.min(steps - 1, s - 1));
    };

    const fromStep = clampIndex(prevStreak);
    const toStep = clampIndex(newStreak);

    if (fromStep === toStep) {
      // No hay movimiento visible, se queda idle
      this.pathSoldierState = "idle";
      this.pathSoldierStateTime = 0;
      this.pathSoldierFromStep = toStep;
      this.pathSoldierToStep = toStep;
      this.pathSoldierDuration = 0;
      return;
    }

    this.pathSoldierState = "walk";
    this.pathSoldierStateTime = 0;
    this.pathSoldierDuration = 0.35;
    this.pathSoldierFromStep = fromStep;
    this.pathSoldierToStep = toStep;
  }

  _startPathDeath(prevStreak) {
    const steps = this.targetStreak || 1;
    const clampIndex = (streak) => {
      const s = Math.max(0, Math.min(steps, streak));
      return Math.max(0, Math.min(steps - 1, s - 1));
    };

    const fromStep = clampIndex(prevStreak);

    this.pathSoldierState = "dead";
    this.pathSoldierStateTime = 0;
    this.pathSoldierDuration = 0.7;
    this.pathSoldierDeadHold = 0.5;
    this.pathSoldierFromStep = fromStep;
    this.pathSoldierToStep = fromStep;
  }

  // =======================================================
  // FIN DEL JUEGO
  // =======================================================
  _finishGame(failed = false) {
    if (this.gameFinished) return;
    this.gameFinished = true;
    this.state = "finished";
    this.exitDelay = 0.5;

    this.win = !failed && this.bestStreak >= this.targetStreak;

    // Tier:
    // 0: failed
    // 1: win
    const tier = failed ? 0 : 1;

    let gained = 0;
    if (window.MN_reportMinigameTier) {
      gained = MN_reportMinigameTier("general_signos", tier);
    }
    this.sheetsReward = gained;

    if (this.win) {
      this.message =
        "¡Has dominado la ley de signos!\n" +
        `Mejor racha: ${this.bestStreak} aciertos consecutivos.\n` +
        `Hojas ganadas: ${gained}.`;
      this.playSfx(this.sfxWin, { volume: 0.7 });
    } else {
      this.message =
        "Aún necesitas practicar un poco más.\n" +
        `Mejor racha lograda: ${this.bestStreak}.\n` +
        `Hojas ganadas: ${gained}.`;
      this.playSfx(this.sfxWrong, { volume: 0.7 });
    }

    if (this.game && this.game.events) {
      this.game.events.emit("signos_done", {
        win: this.win,
        bestStreak: this.bestStreak,
        targetStreak: this.targetStreak,
        tier,
        sheetsReward: gained,
        failed,
      });
    }
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
      ctx.fillStyle = "#040818";
      ctx.fillRect(0, 0, W, H);
    }

    // Capa oscura
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, W, H);

    // HUD
    this._drawHUD(ctx);

    // Zona central (soldados / animaciones)
    if (this.state === "playing") {
      if (this.phase === "question") {
        this._drawStaticSoldiers(ctx);
      } else if (
        this.phase === "feedback_correct" ||
        this.phase === "feedback_wrong"
      ) {
        if (this.animMode === "sum") {
          this._drawSumAnimation(ctx);
        } else if (this.animMode === "mul") {
          this._drawMulAnimation(ctx);
        } else {
          // Por seguridad, si no hay animación, dibujamos los soldados estáticos
          this._drawStaticSoldiers(ctx);
        }
      }
    }

    // Operación
    if (this.state !== "finished") {
      this._drawOperation(ctx);
      this._drawOptions(ctx);
    }

    // Mensajes
    if (this.state === "intro") {
      this._drawIntro(ctx);
    } else if (this.state === "playing") {
      if (
        this.phase === "feedback_correct" ||
        this.phase === "feedback_wrong"
      ) {
        this._drawFeedbackText(ctx);
      }
    } else if (this.state === "finished") {
      this._drawEndMessage(ctx);
    }

    this._drawSoldierPath(ctx);
  }

  _drawHUD(ctx) {
    const W = this.game.canvas.width;

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(15, 10, 120, 35);

    ctx.strokeStyle = "#ffcc66";
    ctx.lineWidth = 2;
    ctx.strokeRect(15, 10, 120, 35);

    ctx.font = "17px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";

    // ⏱️ Tiempo
    const t = Math.max(0, Math.floor(this.timeLeft));
    const min = Math.floor(t / 60);
    const sec = t % 60;
    const secStr = sec < 10 ? "0" + sec : "" + sec;
    ctx.fillText(`Tiempo: ${min}:${secStr}`, 25, 30);

    ctx.restore();
  }

  _drawOperation(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    const opText =
      this.op === "+"
        ? `${this._fmtInt(this.a)} ${this._fmtInt(this.b)}`
        : `${this._fmtInt(this.a)} (${this._fmtInt(this.b)})`;

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "32px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(opText, W / 2, H * 0.08);
    ctx.restore();
  }

  // Dibujo de soldados estáticos (ejércitos completos de a y b, enfrentados)
  _drawStaticSoldiers(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    const centerY = H * 0.35;
    const spacing = 32;

    const signA = Math.sign(this.a);
    const signB = Math.sign(this.b);
    const countA = Math.abs(this.a);
    const countB = Math.abs(this.b);

    // Columna izquierda: ejército de a
    if (countA > 0) {
      const totalHeightA = (countA - 1) * spacing;
      const startYA = centerY - totalHeightA / 2;
      const xA = W * 0.3; // un poco a la izquierda del centro

      for (let i = 0; i < countA; i++) {
        const y = startYA + i * spacing;
        this._drawSoldierIcon(ctx, xA, y, signA);
      }
    }

    // Columna derecha: ejército de b
    if (countB > 0) {
      const totalHeightB = (countB - 1) * spacing;
      const startYB = centerY - totalHeightB / 2;
      const xB = W * 0.7; // un poco a la derecha del centro

      for (let i = 0; i < countB; i++) {
        const y = startYB + i * spacing;
        this._drawSoldierIcon(ctx, xB, y, signB);
      }
    }
  }

  _drawSoldierPath(ctx) {
    const canvas = this.game.canvas;
    const W = canvas.width;
    const H = canvas.height;

    const steps = this.targetStreak; // 10 pasos para ganar
    const currentStep = Math.min(this.streak, steps); // 0..10

    // Zona inferior para el camino
    const pathY = H * 0.88; // altura del suelo de los soldados
    const pathWidth = W * 0.8; // qué tan largo es el camino
    const pathX0 = W * 0.1; // margen izquierdo
    const stepSpacing = pathWidth / (steps - 1);

    // --- Suelo / línea base ---
    ctx.save();
    ctx.strokeStyle = "#444";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(pathX0, pathY + 10);
    ctx.lineTo(pathX0 + pathWidth, pathY + 10);
    ctx.stroke();

    // --- Casillas ---
    for (let i = 0; i < steps; i++) {
      const x = pathX0 + i * stepSpacing;
      const w = 26;
      const h = 18;

      ctx.beginPath();
      ctx.rect(x - w / 2, pathY - h / 2, w, h);
      ctx.fillStyle = "rgba(40, 40, 40, 0.8)";
      ctx.fill();
      ctx.strokeStyle = "#666";
      ctx.stroke();
    }

    // --- Bandera en la meta (última casilla) ---
    const flagX = pathX0 + (steps - 1) * stepSpacing;
    const flagY = pathY - 32;

    // Palo de la bandera
    ctx.beginPath();
    ctx.moveTo(flagX, pathY);
    ctx.lineTo(flagX, flagY);
    ctx.strokeStyle = "#aaaaaa";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Tela de la bandera
    ctx.beginPath();
    ctx.moveTo(flagX, flagY);
    ctx.lineTo(flagX + 18, flagY + 6);
    ctx.lineTo(flagX, flagY + 12);
    ctx.closePath();
    ctx.fillStyle = "#ffd54f";
    ctx.fill();

    // --- Vidas (corazones) ---
    const heartY = H * 0.085;
    const heartSize = 16;

    for (let i = 0; i < this.maxSoldiers; i++) {
      const x = W * 0.06 + i * 28;

      ctx.save();

      if (i < this.activeSoldier) {
        // Corazón perdido
        ctx.fillStyle = "rgba(120,120,120,0.5)";
      } else {
        // Corazón activo o restante
        ctx.fillStyle = "#ff4d4d";
      }

      this._drawHeart(ctx, x, heartY, heartSize);

      // Resaltar el corazón actual
      if (i === this.activeSoldier) {
        ctx.strokeStyle = "rgba(255,215,0,0.7)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, heartY + heartSize * 0.55, heartSize * 0.7, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    }

    // --- Soldado activo en el camino ---

    if (this.activeSoldier < this.maxSoldiers && currentStep >= 0) {
      // Índice base según la racha actual (0..steps-1)
      const baseIndex = Math.max(-1, Math.min(steps - 1, currentStep - 1));

      // Índice interpolado según la animación (caminar / muerte)
      let stepIndex = baseIndex;
      if (
        this.pathSoldierState === "walk" ||
        this.pathSoldierState === "dead"
      ) {
        const from = this.pathSoldierFromStep;
        const to = this.pathSoldierToStep;
        const u =
          this.pathSoldierDuration > 0
            ? Math.max(
                0,
                Math.min(
                  1,
                  this.pathSoldierStateTime / this.pathSoldierDuration,
                ),
              )
            : 1;
        stepIndex = from + (to - from) * u;
      }

      const soldierX = pathX0 + stepIndex * stepSpacing;

      let soldierY = pathY - 8;

      // Pequeño efecto de caída si está "dead"
      if (this.pathSoldierState === "dead") {
        const u =
          this.pathSoldierDuration > 0
            ? Math.max(
                0,
                Math.min(
                  1,
                  this.pathSoldierStateTime / this.pathSoldierDuration,
                ),
              )
            : 1;
        soldierY += 10 * u;
      }

      this._drawPathSoldierSprite(
        ctx,
        soldierX,
        soldierY,
        this.pathSoldierState === "dead"
          ? "dead"
          : this.pathSoldierState === "walk"
            ? "walk"
            : "idle",
      );
    }

    ctx.restore();
  }

  _drawPathSoldierSprite(ctx, x, y, state) {
    // Intenta usar sprites; si falta algo, recurre al dibujo clásico
    if (!this.pathSoldierSprites) {
      this._drawPathSoldierFallback(ctx, x, y);
      return;
    }

    const group = this.pathSoldierSprites;
    const sheet =
      state === "dead"
        ? group.dead
        : state === "walk"
          ? group.walk
          : group.idle;

    if (!sheet || !sheet.img || !sheet.img.width || !sheet.img.height) {
      this._drawPathSoldierFallback(ctx, x, y);
      return;
    }

    const img = sheet.img;
    const cols = sheet.cols || 1;
    const rows = sheet.rows || 1;
    const fps = sheet.fps || 8;

    const totalFrames = Math.max(1, cols * rows);
    const frameIndex =
      totalFrames > 1 ? Math.floor(this.time * fps) % totalFrames : 0;

    const fw = img.width / cols;
    const fh = img.height / rows;
    const col = frameIndex % cols;
    const row = Math.floor(frameIndex / cols);

    const scale = 0.5; // ajusta a tu gusto
    const dw = fw * scale;
    const dh = fh * scale;

    ctx.save();
    ctx.drawImage(
      img,
      col * fw,
      row * fh,
      fw,
      fh,
      x - dw / 2,
      y - dh / 2,
      dw,
      dh,
    );
    ctx.restore();
  }

  _drawPathSoldierFallback(ctx, x, y) {
    // Versión anterior: círculo azul con casco
    // Cuerpo del soldado
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fillStyle = "#90caf9";
    ctx.fill();

    // Casco
    ctx.beginPath();
    ctx.arc(x, y - 5, 10, Math.PI, 0);
    ctx.fillStyle = "#1565c0";
    ctx.fill();
  }

  _drawSumAnimation(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;
    const centerY = H * 0.35;

    // 1) Soldados de ambos bandos en su posición actual
    for (const s of this.sumSoldiersLeft) {
      if (!s.alive) continue;
      this._drawSoldierIcon(ctx, s.x, s.y, s.sign);
    }
    for (const s of this.sumSoldiersRight) {
      if (!s.alive) continue;
      this._drawSoldierIcon(ctx, s.x, s.y, s.sign);
    }

    // 2) Aros en las fichas que ya se han "contado"
    if (this.sumCountingList.length > 0 && this.sumCountingIndex > 0) {
      ctx.save();
      ctx.strokeStyle = "#ffd54f";
      ctx.lineWidth = 3;

      for (let i = 0; i < this.sumCountingIndex; i++) {
        const s = this.sumCountingList[i];
        ctx.beginPath();
        ctx.arc(s.x, s.y, 22, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // Contador a la derecha
      if (this.sumCountingList.length > 0 && this.sumCountingIndex > 0) {
        const sign = Math.sign(this.sumRealResult);
        let signoValue = "";

        if (sign > 0) {
          signoValue = this.sumCountingIndex === 1 ? " positivo" : " positivos";
        } else if (sign < 0) {
          signoValue = this.sumCountingIndex === 1 ? " negativo" : " negativos";
        }

        ctx.save();
        ctx.font = "20px Arial";
        ctx.fillStyle = "#ffd54f";
        ctx.textAlign = "left";
        ctx.fillText(
          `Quedan ${this.sumCountingIndex}${signoValue}`,
          W * 0.6,
          centerY,
        );
        ctx.restore();
      }

      ctx.restore();
    }

    // 3) Texto del resultado numérico al final, sin mover nada
    ctx.save();
    ctx.font = "22px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText(
      `Resultado: ${this._fmtInt(this.a)} ${this._fmtInt(
        this.b,
      )} = ${this._fmtInt(this.sumRealResult)}`,
      W / 2,
      H * 0.8,
    );
    ctx.restore();
  }

  _drawMulAnimation(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;
    const centerX = W * 0.5;
    const centerYRect = H * 0.45;
    const baseSpacing = 32;

    const moveDuration = this.mulMoveDuration;
    const signDuration = this.mulSignEffectDuration;

    const t = this.animTime;
    const tAfterMove = Math.max(0, t - moveDuration);

    // ----------------- Fase 1–2: soldados (columnas → base/altura + poder del menos) -----------------
    if (this.mulCellsVisible <= 0) {
      // Dibujar soldados de a (fila/base) y b (columna/altura), usando el signo "actual"
      for (const s of this.mulSoldiersLeft) {
        this._drawSoldierIcon(ctx, s.x, s.y, this.mulCurrentSignA);
      }
      for (const s of this.mulSoldiersRight) {
        this._drawSoldierIcon(ctx, s.x, s.y, this.mulCurrentSignB);
      }

      // Efecto visual del "poder del menos" mientras dura la fase de signo
      if (tAfterMove > 0 && tAfterMove <= signDuration) {
        const p = this.mulSignEffectProgress; // 0 → 1
        const centerYStatic = H * 0.35;

        ctx.save();
        ctx.textAlign = "center";

        // Parámetros de brillo del círculo del signo
        const pulse = 0.5 + 0.5 * Math.sin(p * Math.PI * 2); // pulso 0–1
        const baseRadius = 40;
        const radius = baseRadius + 10 * pulse;

        const xA = W * 0.3;
        const yA = centerYStatic;
        const xB = W * 0.7;
        const yB = centerYStatic;

        // --- CÍRCULOS Y SIGNOS ---

        // Ejército A (izquierda)
        if (this.mulSignAInitial < 0) {
          ctx.beginPath();
          ctx.arc(xA, yA, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 80, 80, ${0.25 + 0.35 * pulse})`;
          ctx.fill();

          ctx.font = "52px Arial";
          ctx.fillStyle = `rgba(255, 240, 200, ${0.7 + 0.3 * pulse})`;
          ctx.fillText("−", xA, yA + 10);
        }

        // Ejército B (derecha)
        if (this.mulSignBInitial < 0) {
          ctx.beginPath();
          ctx.arc(xB, yB, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 80, 80, ${0.25 + 0.35 * pulse})`;
          ctx.fill();

          ctx.font = "52px Arial";
          ctx.fillStyle = `rgba(255, 240, 200, ${0.7 + 0.3 * pulse})`;
          ctx.fillText("−", xB, yB + 10);
        }

        // --- PROYECTILES (partícula que viaja) ---
        // Pequeño helper inline para dibujar una bala con trayectoria curva
        const drawProjectile = (fromX, fromY, toX, toY, arcOffset) => {
          // Desfase para que la bala no salga desde p=0 sino un poquito después
          const tProj = Math.max(0, Math.min(1, (p - 0.2) / 0.6));
          if (tProj <= 0) return;

          // Trayectoria tipo curva (Bezier cuadrática simple)
          const midX = (fromX + toX) / 2;
          const midY = (fromY + toY) / 2 + arcOffset;

          const u = tProj;
          const oneMinus = 1 - u;
          const x =
            oneMinus * oneMinus * fromX + 2 * oneMinus * u * midX + u * u * toX;
          const y =
            oneMinus * oneMinus * fromY + 2 * oneMinus * u * midY + u * u * toY;

          ctx.beginPath();
          ctx.arc(x, y, 8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 240, 200, ${0.7 + 0.3 * pulse})`;
          ctx.fill();
        };

        // Si A es negativo, dispara hacia B
        if (this.mulSignAInitial < 0) {
          drawProjectile(xA + 25, yA, xB - 25, yB, -30);
        }

        // Si B es negativo, dispara hacia A (ligeramente más abajo para que se crucen)
        if (this.mulSignBInitial < 0) {
          drawProjectile(xB - 25, yB + 10, xA + 25, yA + 10, +30);
        }

        ctx.restore();
      }

      // Texto de resultado numérico (arriba o abajo, como prefieras)
      ctx.save();
      ctx.font = "22px Arial";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.fillText(
        `Resultado: ${this._fmtInt(this.a)} ( ${this._fmtInt(
          this.b,
        )}) = ${this._fmtInt(this.mulRealResult)}`,
        W / 2,
        H * 0.8,
      );
      ctx.restore();

      return;
    }

    // ----------------- Fase 3: rectángulo formado -----------------
    const cols = this.mulCols;
    const rows = this.mulRows;
    const s = baseSpacing; // mismo paso que usan los soldados

    // Misma L que usamos para la base y la altura
    const baseX0 = centerX - ((cols + 1) * s) / 2;
    const colX = baseX0 + cols * s;

    const colY0 = centerYRect - ((rows + 1) * s) / 2;
    const rowY = colY0 + rows * s;

    // 👉 El rectángulo vive "dentro" de la L:
    //   cerca de (baseX0, colY0) hasta algo menor que
    //   (baseX0 + (cols-1)*s, colY0 + (rows-1)*s)

    const margin = s * 0.5; // separación respecto a la L
    const cellSize = s * 0.95; // cada celda un poco más chica que la separación de soldados
    const gridWidth = cols * cellSize;
    const gridHeight = rows * cellSize;

    // esquina superior izquierda del rectángulo
    const gridStartX = baseX0 - margin;
    const gridStartY = colY0 - margin;

    // Marco del rectángulo
    ctx.save();
    ctx.strokeStyle = "#888888";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      gridStartX - 4,
      gridStartY - 4,
      gridWidth + 8,
      gridHeight + 8,
    );

    // Color según signo final
    const colorPos = "#4caf50";
    const colorNeg = "#f44336";
    const fillColor = this.mulFinalGridSign >= 0 ? colorPos : colorNeg;

    // Celdas del rectángulo
    let cellsDrawn = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (cellsDrawn >= this.mulCellsVisible) break;

        const x = gridStartX + col * cellSize;
        const y = gridStartY + row * cellSize;

        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y, cellSize - 1, cellSize - 1);
        cellsDrawn++;
      }
      if (cellsDrawn >= this.mulCellsVisible) break;
    }

    ctx.restore();

    // Marco del rectángulo
    ctx.save();
    ctx.strokeStyle = "#888888";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      gridStartX - 4,
      gridStartY - 4,
      gridWidth + 8,
      gridHeight + 8,
    );

    ctx.restore();

    // Fila (a): base, desde baseX0
    for (let i = 0; i < cols; i++) {
      this._drawSoldierIcon(ctx, baseX0 + i * s, rowY, this.mulSignAEffective);
    }

    // Columna (b): altura, desde colY0
    for (let j = 0; j < rows; j++) {
      this._drawSoldierIcon(ctx, colX, colY0 + j * s, this.mulSignBEffective);
    }

    // Texto del resultado numérico
    ctx.save();
    ctx.font = "22px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText(
      `Resultado: ${this._fmtInt(this.a)} ( ${this._fmtInt(
        this.b,
      )}) = ${this._fmtInt(this.mulRealResult)}`,
      W / 2,
      H * 0.8,
    );
    ctx.restore();
  }

  _drawOptions(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    ctx.save();
    ctx.font = "20px Arial";
    ctx.textAlign = "center";

    for (let i = 0; i < this.options.length; i++) {
      const opt = this.options[i];
      const r = this.optionRects[i];

      const isHover = i === this.hoverIndex && this.phase === "question";
      let bg = "rgba(20,20,40,0.8)";
      if (isHover) bg = "rgba(60,60,120,0.9)";

      ctx.fillStyle = bg;
      ctx.fillRect(r.x, r.y, r.w, r.h);

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.strokeRect(r.x, r.y, r.w, r.h);

      ctx.fillStyle = "#ffffff";
      ctx.fillText(opt.label, r.x + r.w / 2, r.y + r.h / 2 + 6);

      // Tecla asociada 1–4
      ctx.font = "14px Arial";
      ctx.fillStyle = "#bbbbbb";
      ctx.fillText((i + 1).toString(), r.x + 18, r.y + 20);
      ctx.font = "20px Arial";
    }

    ctx.font = "16px Arial";
    ctx.fillStyle = "#dddddd";
    ctx.fillText("Usa las teclas 1–4 o haz clic en la opción.", W / 2, H - 16);

    ctx.restore();
  }

  _drawFeedbackText(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "26px Arial";
    ctx.fillStyle = "#ffd54f";
    ctx.fillText(this.feedbackText, W / 2, H * 0.15);

    ctx.font = "18px Arial";
    ctx.fillStyle = "#ffffff";
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
    ctx.fillText("El General de los Signos", W / 2, H * 0.3);

    ctx.font = "18px Arial";
    ctx.fillText(
      "Cada ronda verás dos números y una operación (+ o ×).",
      W / 2,
      H * 0.4,
    );
    ctx.fillText(
      "Tu misión es elegir el resultado correcto aplicando la ley de signos.",
      W / 2,
      H * 0.45,
    );
    ctx.fillText(
      "Logra 10 aciertos CONSECUTIVOS para superar la prueba.",
      W / 2,
      H * 0.5,
    );

    ctx.font = "18px Arial";
    ctx.fillText("Pulsa ENTER o ESPACIO para comenzar.", W / 2, H * 0.62);
    ctx.restore();
  }

  _drawEndMessage(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const lines = this.message.split("\n");
    ctx.font = "32px Arial";
    ctx.fillStyle = this.win ? "#a5ff7b" : "#ffaaaa";

    let y = H * 0.3;
    for (const line of lines) {
      ctx.fillText(line, W / 2, y);
      y += 30;
    }

    ctx.font = "18px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Pulsa ENTER, ESPACIO o haz clic para volver.", W / 2, y + 20);

    ctx.restore();
  }

  // =======================================================
  // UTILIDADES DE DIBUJO / TEXTO
  // =======================================================
  _drawSoldierIcon(ctx, x, y, sign) {
    const radius = 14;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = sign >= 0 ? "#4caf50" : "#f44336";
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "18px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const symbol = sign >= 0 ? "+" : "−";
    ctx.fillText(symbol, x, y + 1);
    ctx.textBaseline = "alphabetic";
    ctx.restore();
  }

  _fmtInt(n) {
    if (n > 0) return "+" + n;
    if (n < 0) return "" + n;
    return "0";
  }

  _wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    if (!text) return;
    const words = text.split(" ");
    let line = "";
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + " ";
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);
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

window.GeneralSignosScene = GeneralSignosScene;
