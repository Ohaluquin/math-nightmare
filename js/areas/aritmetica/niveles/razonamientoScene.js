// ===========================================================
// RazonamientoScene.js — Leonardo de Pisa (Problemas de Comercio)
// Minijuego de razonamiento aritmético (modelación ligera).
// - 10 plantillas de problemas, parametrizables
// - En cada partida salen 3 problemas al azar (familias distintas)
// - Con tiempo global largo (por defecto 10 minutos) para no presionar
// - Recompensas por aciertos (3/3 = 2 hojas, 2/3 = 1 hoja)
// Inspirado en el formato de SumasScene / RestasScene / TablasScene.
// ===========================================================

class RazonamientoScene extends Scene {
  constructor(game, options = {}) {
    super(game);

    // ---------------- Config ----------------
    this.options = options;
    this.timeLimitSec = options.timeLimitSec ?? 600; // 10 min por defecto (puedes poner 300 si quieres 5 min)
    this.problemsPerRun = 4;

    // ---------------- Estado ----------------
    this.state = "intro"; // intro | playing | finished
    this.gameFinished = false;
    this.exitDelay = 0;
    this.win = false;
    this.message = "";
    this.sheetsReward = 0;

    this.timeLeft = this.timeLimitSec;

    // Progreso de problemas
    this.templates = this._buildTemplates();
    this.selectedProblems = [];
    this.problemIndex = 0;
    this.currentProblem = null;
    this.correctCount = 0;

    // Entrada
    this.inputValue = "";
    this.maxAnswerLength = 6;

    // Feedback breve
    this.flash = null; // { text, color, t }
    this.flashDuration = 0.8;

    // UI / Arte
    this.bgImage = null;
    this.npcName = "Leonardo de Pisa";
    this.npcPortraitKey = options.npcPortraitKey ?? "npc_guardian_razonamiento"; // opcional

    // Input previo
    this._prevKeys = {};
    this._prevMouseDown = false;

    // Tips (ocultos por defecto; se activan con toggle)
    this.showGuideTips = false;
    this._guideToggleRect = null;
  }

  // =======================================================
  // INIT / DESTROY
  // =======================================================
  init() {
    if (window.MN_setLeafHUDVisible) window.MN_setLeafHUDVisible(false);
    // Icono de mouse en la esquina
    if (window.MN_setInputMode) MN_setInputMode("keyboard");

    this.state = "intro";
    this.gameFinished = false;
    this.exitDelay = 0;
    this.win = false;
    this.message = "";
    this.sheetsReward = 0;

    this.timeLeft = this.timeLimitSec;

    this.problemIndex = 0;
    this.correctCount = 0;
    this.inputValue = "";
    this.flash = null;
    this.showGuideTips = false;
    this._guideToggleRect = null;

    const A = this.game.assets;
    this.bgImage = (A && A.getImage("bg_razonamiento")) || null;

    this.selectedProblems = this._pickProblemsByDifficulty(this.templates);
    this.currentProblem = this.selectedProblems[0] || null;

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

    this._prevKeys = {};
    const mouse = this.game?.input?.mouse;
    this._prevMouseDown = !!mouse?.down;
  }

  destroy() {
    this.clearAll();
    this.selectedProblems = [];
    this.currentProblem = null;
  }

  // =======================================================
  // UPDATE
  // =======================================================
  update(dt) {
    super.update(dt);

    const input = this.game.input;
    const keys = input.keys || {};
    const mouse = input.mouse || { down: false, x: 0, y: 0 };
    const isJustPressed = (k) => keys[k] && !this._prevKeys[k];
    const justClicked = mouse.down && !this._prevMouseDown;

    // ------------- Terminado: esperar salida -------------
    if (this.gameFinished) {
      if (this.exitDelay > 0) {
        this.exitDelay -= dt;
        this._prevKeys = { ...keys };
        this._prevMouseDown = mouse.down;
        return;
      }
      const wantsExit =
        input.isDown("Enter") || input.isDown(" ") || mouse.down;

      if (wantsExit) {
        window.MN_APP?.toOverworld?.();
      }

      this._prevKeys = { ...keys };
      this._prevMouseDown = mouse.down;
      return;
    }

    // ------------- Intro -------------
    if (this.state === "intro") {
      if (isJustPressed("Enter") || isJustPressed(" ")) {
        this.state = "playing";
      }
      this._prevKeys = { ...keys };
      this._prevMouseDown = mouse.down;
      return;
    }

    // ------------- Playing -------------
    if (this.state === "playing") {
      if (
        justClicked &&
        this._isPointInRect(mouse.x, mouse.y, this._guideToggleRect)
      ) {
        this.showGuideTips = !this.showGuideTips;
      }

      // Timer global largo
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this._finishByTimeout();
        this._prevKeys = { ...keys };
        this._prevMouseDown = mouse.down;
        return;
      }

      // Flash feedback
      if (this.flash) {
        this.flash.t += dt;
        if (this.flash.t >= this.flashDuration) this.flash = null;
      }

      // Reinicio rápido (modo práctica)
      if (isJustPressed("Escape")) {
        this.init();
        this._prevKeys = { ...keys };
        this._prevMouseDown = mouse.down;
        return;
      }

      // Entrada numérica
      for (let d = 0; d <= 9; d++) {
        const k = String(d);
        if (isJustPressed(k)) {
          if (this.inputValue.length < this.maxAnswerLength) {
            // evitar ceros a la izquierda tipo "000"
            if (this.inputValue === "0") this.inputValue = "";
            this.inputValue += k;
          }
        }
      }

      // Negativo opcional (por si algún día lo quieres)
      if (isJustPressed("-")) {
        if (this.inputValue.length === 0) this.inputValue = "-";
      }

      if (isJustPressed("Backspace")) {
        this.inputValue = this.inputValue.slice(0, -1);
      }

      if (isJustPressed("Enter")) {
        this._submitAnswer();
      }
    }

    this._prevKeys = { ...keys };
    this._prevMouseDown = mouse.down;
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
      ctx.fillStyle = "#050514";
      ctx.fillRect(0, 0, W, H);
    }

    // Oscurecer un poco para leer el panel
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, W, H);

    // HUD
    this._drawHUD(ctx);

    // Intro / Playing / Finished
    if (this.state === "intro") {
      this._drawIntro(ctx);
    } else if (this.state === "playing") {
      this._drawProblemPanel(ctx);
      this._drawGuideToggle(ctx);
      if (this.showGuideTips) this._drawGuidePanel(ctx);
      this._drawInputPanel(ctx);
      this._drawFlash(ctx);
    } else if (this.state === "finished") {
      this._drawEndMessage(ctx);
    }
  }

  _drawHUD(ctx) {
    const W = this.game.canvas.width;

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(15, 15, 160, 60);
    ctx.strokeStyle = "#ffd54f";
    ctx.lineWidth = 2;
    ctx.strokeRect(15, 15, 160, 60);

    ctx.font = "16px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    const mm = Math.floor(this.timeLeft / 60);
    const ss = Math.floor(this.timeLeft % 60);
    const timeStr = `${mm}:${String(ss).padStart(2, "0")}`;

    ctx.fillText(
      `Problema: ${Math.min(this.problemIndex + 1, this.problemsPerRun)}/${
        this.problemsPerRun
      }`,
      25,
      22,
    );

    ctx.fillStyle = this.timeLeft <= 30 ? "#ff8a80" : "#c8e6c9";
    ctx.fillText(`Tiempo: ${timeStr}`, 25, 48);

    ctx.restore();
  }

  _drawIntro(ctx) {
    const { width: W, height: H } = this.game.canvas;

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "#ffffff";
    ctx.font = "34px Arial";
    ctx.fillText("Leonardo de Pisa", W / 2, H * 0.22);

    ctx.font = "20px Arial";
    ctx.fillText("Problemas de razonamiento aritmético", W / 2, H * 0.3);

    const lines = [
      "Responderás 4 problemas (con guía gradual)",
      "Tienes tiempo suficiente: piensa y calcula con calma.",
      "Usa el teclado numérico. ENTER confirma. BACKSPACE borra.",
    ];
    ctx.font = "18px Arial";
    let y = H * 0.42;
    for (const line of lines) {
      ctx.fillText(line, W / 2, y);
      y += 28;
    }

    ctx.font = "18px Arial";
    ctx.fillText("Pulsa ENTER o ESPACIO para comenzar.", W / 2, H * 0.72);
    ctx.restore();
  }

  _drawProblemPanel(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    const panelW = Math.min(820, W * 0.86);
    const panelH = Math.min(340, H * 0.3);
    const X = (W - panelW) / 2;
    const Y = H * 0.25;

    // Fondo del panel
    const grad = ctx.createLinearGradient(0, Y, 0, Y + panelH);
    grad.addColorStop(0, "rgba(30, 40, 80, 0.92)");
    grad.addColorStop(1, "rgba(12, 16, 40, 0.92)");
    ctx.fillStyle = grad;
    ctx.fillRect(X, Y, panelW, panelH);

    ctx.strokeStyle = "rgba(255, 213, 79, 0.85)";
    ctx.lineWidth = 2;
    ctx.strokeRect(X, Y, panelW, panelH);

    // Título
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.font = "32px Arial";
    ctx.fillStyle = "#ffd54f";
    const fam = this.currentProblem?.familyLabel
      ? ` — ${this.currentProblem.familyLabel}`
      : "";
    ctx.fillText(`Problema ${this.problemIndex + 1}${fam}`, W / 2, Y + 20);
    ctx.restore();

    // Texto del problema (wrap)
    const text = this.currentProblem?.text ?? "…";
    ctx.save();
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#ffffff";
    ctx.font = "24px Arial";

    // Guardamos el rect del panel para dibujar la “voz interna” fuera,
    // sin estorbar el texto del problema.
    this._lastProblemPanel = { X, Y, W: panelW, H: panelH };

    const padding = 36;
    const textX = X + padding;
    const textY = Y + 66;
    const maxWidth = panelW - padding * 2;
    const lineHeight = 24;

    this._wrapText(ctx, text, textX, textY, maxWidth, lineHeight, 10);

    ctx.restore();
  }

  _drawGuideToggle(ctx) {
    const W = this.game.canvas.width;
    const lines = this._getGuideLines();
    const hasGuide = Array.isArray(lines) && lines.length > 0;

    const btnW = 150;
    const btnH = 36;
    const fallbackX = W - btnW - 28;
    const fallbackY = 92;

    const x = this._lastProblemPanel
      ? this._lastProblemPanel.X + this._lastProblemPanel.W - btnW - 14
      : fallbackX;
    const y = this._lastProblemPanel
      ? this._lastProblemPanel.Y + 14
      : fallbackY;

    this._guideToggleRect = hasGuide ? { x, y, w: btnW, h: btnH } : null;

    ctx.save();
    ctx.fillStyle = hasGuide ? "rgba(0, 0, 0, 0.5)" : "rgba(30, 30, 30, 0.35)";
    ctx.fillRect(x, y, btnW, btnH);

    ctx.strokeStyle = hasGuide
      ? "rgba(255, 213, 79, 0.75)"
      : "rgba(180, 180, 180, 0.45)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, btnW, btnH);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "16px Arial";
    ctx.fillStyle = hasGuide ? "#e3f2fd" : "rgba(220, 220, 220, 0.8)";

    let label = "Sin tips";
    if (hasGuide) label = this.showGuideTips ? "Ocultar tips" : "Mostrar tips";
    ctx.fillText(label, x + btnW / 2, y + btnH / 2);

    ctx.restore();
  }

  _drawInputPanel(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    const panelW = Math.min(520, W * 0.7);
    const panelH = 120;
    const X = (W - panelW) / 2;
    const Y = H - panelH - 30;

    ctx.save();
    ctx.fillStyle = "rgba(0,0,20,0.45)";
    ctx.fillRect(X, Y, panelW, panelH);

    ctx.strokeStyle = "rgba(255, 245, 180, 0.35)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(X, Y, panelW, panelH);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font = "16px Arial";
    ctx.fillStyle = "#c8e6c9";
    ctx.fillText("Escribe tu respuesta y presiona ENTER", W / 2, Y + 28);

    ctx.font = "34px monospace";
    ctx.fillStyle = "#ffffff";
    const v = this.inputValue === "" ? "…" : this.inputValue;
    ctx.fillText(v, W / 2, Y + 74);

    ctx.restore();
  }

  _drawFlash(ctx) {
    if (!this.flash) return;
    const W = this.game.canvas.width;

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "22px Arial";
    ctx.fillStyle = this.flash.color;
    ctx.fillText(this.flash.text, W / 2, 150);
    ctx.restore();
  }

  _drawGuidePanel(ctx) {
    const lines = this._getGuideLines();
    if (!lines || !lines.length) return;

    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    // Intentamos colocar la “voz interna” en el espacio ENTRE el panel del problema y el panel de entrada,
    // para que nunca empuje ni tape el texto del problema.
    const inputPanelH = 120;
    const inputY = H - inputPanelH - 30;

    const baseY = this._lastProblemPanel
      ? this._lastProblemPanel.Y + this._lastProblemPanel.H + 14
      : Math.floor(H * 0.62);

    const maxY = inputY - 12;
    const available = maxY - baseY;

    // Si no hay espacio, preferimos no dibujar nada (mejor limpio que estorbar).
    if (available < 44) return;

    const boxW = Math.min(760, W * 0.82);
    const boxX = (W - boxW) / 2;

    // Ajuste de líneas a lo que quepa
    const lh = 18;
    const pad = 14;
    const maxLines = Math.max(1, Math.floor((available - pad * 2) / lh));
    const drawLines = lines.slice(0, maxLines);
    const boxH = Math.min(available, drawLines.length * lh + pad * 2);

    this._drawInnerVoiceBox(ctx, drawLines, boxX, baseY, boxW, boxH, lh, pad);
  }

  _drawInnerVoiceBox(ctx, lines, x, y, w, h, lh = 18, pad = 14) {
    if (!lines || !lines.length) return;

    ctx.save();

    // Fondo sutil: se lee, pero no compite con el panel del problema.
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fillRect(x, y, w, h);

    ctx.strokeStyle = "rgba(255, 213, 79, 0.22)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);

    ctx.font = "16px Arial";
    ctx.fillStyle = "rgba(200, 220, 255, 0.92)";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    let ty = y + pad;
    const tx = x + pad;

    for (const line of lines) {
      if (ty + lh > y + h - pad + 1) break;
      ctx.fillText(line, tx, ty);
      ty += lh;
    }

    ctx.restore();
  }

  // =======================================================
  // GUÍAS (voz interna de Leonardo)
  // =======================================================
  _getGuideLines() {
    const p = this.currentProblem;
    if (!p) return [];
    const genericGuide = [
      "🧠 Guía genérica: identifica qué te están preguntando exactamente.",
      "🧠 Separa los datos importantes y decide qué debes calcular primero.",
      "🧠 Si ayuda, haz un dibujo, esquema o lista para ordenar la información.",
      "🧠 Prueba un caso concreto o un número pequeño para entender mejor el problema.",
      "🧠 Revisa si tu resultado final realmente responde la pregunta.",
    ];

    // Problema 4 (extra) siempre va sin guía (guideMode="none")
    if (p.guideMode === "none") return [];

    // Dificultad 2: guía específica (micro-preguntas) por tipo de problema
    if (p.guideMode === "full") {
      const lines = Array.isArray(p.guide) ? p.guide : null;
      if (lines && lines.length) return lines.slice(0, 4);
      // fallback genérico (por si alguna plantilla no trae guide)
      return genericGuide;
    }

    // Dificultad 3: ritual metacognitivo general
    if (p.guideMode === "ritual") {
      return genericGuide;
    }

    return [];
  }

  _drawEndMessage(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font = "34px Arial";
    ctx.fillStyle = this.win ? "#a5ff7b" : "#ffaaaa";

    const lines = this.message.split("\n");
    let y = H * 0.3;
    for (const line of lines) {
      ctx.fillText(line, W / 2, y);
      y += 32;
    }

    ctx.font = "18px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Pulsa ENTER, ESPACIO o haz clic para volver.", W / 2, y + 18);

    ctx.restore();
  }

  // =======================================================
  // LÓGICA DE RESPUESTA
  // =======================================================
  _submitAnswer() {
    if (!this.currentProblem) return;

    if (!this.inputValue || this.inputValue === "-") return;

    const val = parseInt(this.inputValue, 10);
    if (Number.isNaN(val)) {
      this.inputValue = "";
      return;
    }

    const ok = val === this.currentProblem.answer;

    if (ok) {
      this.correctCount++;
      this._flash("¡Correcto!", "#a5ff7b");
      this._playSfx("sfx_match", { volume: 0.6 });
    } else {
      this._flash(`Incorrecto. Era ${this.currentProblem.answer}.`, "#ffaaaa");
      this._playSfx("sfx_error", { volume: 0.7 });
    }

    this.inputValue = "";

    // siguiente problema con pequeño delay (sin bloquear update)
    this._advanceAfter(0.9);
  }

  _advanceAfter(seconds) {
    // Si hay setTimeout disponible (navegador), lo usamos.
    // Esto está alineado con el estilo usado en RestasScene para delays.
    setTimeout(
      () => {
        if (this.gameFinished) return;
        this.problemIndex++;
        if (this.problemIndex >= this.selectedProblems.length) {
          this._finishGame(false);
          return;
        }
        this.currentProblem = this.selectedProblems[this.problemIndex];
      },
      Math.max(0, seconds * 1000),
    );
  }

  _finishByTimeout() {
    // Si se acabó el tiempo, terminamos igual, pero marcamos "failed".
    this._finishGame(true);
  }

  _flash(text, color) {
    this.flash = { text, color, t: 0 };
  }

  _playSfx(key, options = {}) {
    const A = this.game.assets;
    if (!A || typeof A.playSound !== "function") return;
    A.playSound(key, options);
  }

  // =======================================================
  // BANCO DE PLANTILLAS
  // =======================================================
  _buildTemplates() {
    const t = [];

    // Helpers
    const ri = (a, b) => this._randInt(a, b);
    const pick = (arr) => arr[ri(0, arr.length - 1)];

    // --- Catálogos de artículos por contexto (evita combinaciones raras como "bultos de cuadernos") ---
    // Idea: cada plantilla elige SOLO de un pool compatible con su unidad (cajas, bultos, gruesa, etc.).
    const ITEM_POOLS = {
      // Cosas razonables "por caja" con muchas unidades
      caja: ["naranjas", "manzanas", "toronjas", "peras", "ciruelas"],
      // Cosas que suenan bien en "paquete de N ..."
      paquete: ["yogurts", "galletas", "caramelos", "plumas", "marcadores"],
      // Tienda en singular masculino (para frases tipo "Un ___ cuesta...")
      tienda_masc: ["cuaderno", "lápiz", "marcador", "borrador", "pegamento"],
      // Tienda en plural (para frases tipo "Sofía compró N ___...")
      tienda_plural: ["cuadernos", "libretas", "plumas", "chocolates", "galletas"],
      // Granel en bultos (transporte)
      bultos: ["frijol", "arroz", "maíz", "harina", "azúcar"],
      // Unidad "gruesa" (144) suena más natural en ferretería
      gruesa: ["tornillos", "clavos", "botones", "canicas"],
      // Para problema de dos productos (precio unitario con descarte)
      comida: ["quesadilla", "taco", "torta", "empanada"],
      bebida: ["refresco", "jugo", "agua", "leche", "café"],
    };

    const pickFrom = (poolName) => {
      const arr = ITEM_POOLS[poolName] || ITEM_POOLS.tienda_plural;
      return pick(arr);
    };

    const pickTwoDistinctFrom = (poolName) => {
      const arr = ITEM_POOLS[poolName] || ITEM_POOLS.tienda_plural;
      const a = pick(arr);
      let b = pick(arr);
      let tries = 0;
      while (b === a && tries++ < 10) b = pick(arr);
      return [a, b];
    };

    // Par cruzado (ej: comida + bebida) para que el problema "dos productos" siempre tenga sentido.
    const pickPair = (poolA, poolB) => {
      const a = pickFrom(poolA);
      const b = pickFrom(poolB);
      // por seguridad si accidentalmente coinciden
      if (a === b) return [a, pickFrom(poolB)];
      return [a, b];
    };

    // 1) Huevos por caja (multiplicación directa grande)
    t.push({
      id: "huevos_cajas",
      familyLabel: "Cajas de huevos",
      difficulty: 1,
      guide: [
        "🧠 ¿Cuántas hay en UNA caja?",
        "🧠 ¿Cuántas cajas se enviaron?",
        "🧠 ¿Qué operación debemos usar para calcular el total?",
      ],
      generate: () => {
        const item = pickFrom("caja");
        const unitsPerBox = pick([60, 80, 100, 120, 140]);
        const boxes = ri(8, 18);
        const total = unitsPerBox * boxes;
        return {
          text:
            `Una caja de ${item} contiene ${unitsPerBox} ${item}. ` +
            `Un granjero envió ${boxes} cajas. ` +
            `¿Cuántas ${item} fueron enviadas?`,
          answer: total,
        };
      },
    });

    // 2) Ritmo constante (piezas por hora)
    t.push({
      id: "ritmo",
      familyLabel: "Ritmo",
      difficulty: 1,
      guide: [
        "🧠 ¿Cuántas piezas se producen por hora?",
        "🧠 ¿Cuántas horas trabaja la máquina?",
        "🧠 ¿Qué operación debemos usar para calcular el total?",
      ],
      generate: () => {
        const rate = pick([6, 8, 10, 12, 16, 20]);
        const H = ri(2, 8);
        return {
          text:
            `Una máquina produce ${rate} piezas por hora. ` +
            `Si trabaja durante ${H} horas, ¿cuántas piezas produce?`,
          answer: rate * H,
        };
      },
    });

    // 3) Precio individual (paquete / unitario)
    t.push({
      id: "precio_individual",
      familyLabel: "Precio individual",
      difficulty: 1,
      guide: [
        "🧠 ¿Cuánto cuesta el paquete?",
        "🧠 ¿Cuántos artículos tiene el paquete?",
        "🧠 ¿Qué operación debemos usar para calcular el precio de uno?",
      ],
      generate: () => {
        const item = pickFrom("paquete");
        const N = pick([4, 6, 8, 10, 12]);
        const unit = ri(8, 24);
        const T = N * unit;
        return {
          text:
            `Un paquete de ${N} ${item} cuesta $${T}. ` +
            `¿Cuánto cuesta cada uno?`,
          answer: unit,
        };
      },
    });

    // 4) Cambio simple
    t.push({
      id: "cambio_simple",
      familyLabel: "Cambio simple",
      difficulty: 1,
      guide: [
        "🧠 ¿Cuánto dinero pagaste?",
        "🧠 ¿Cuánto te tienen que cobrar?",
        "🧠 ¿Qué operación debemos usar para calcular el cambio?",
      ],
      generate: () => {
        const item = pickFrom("tienda_masc");
        const B = pick([50, 100, 200]);
        const P = ri(8, 38);
        const C = B - P;
        return {
          text:
            `Un ${item} cuesta $${P} si pagas con un billete de $${B}. ` +
            `¿Cuánto debes recibir de cambio?`,
          answer: C,
        };
      },
    });

    // 5) Compra con cambio
    t.push({
      id: "cambio",
      familyLabel: "Cambio",
      difficulty: 2,
      guide: [
        "🧠 Primero averigua cuánto cuesta todo lo que compró.",
        "🧠 Ahora mira con cuánto pagó: ¿qué cantidad falta para llegar a ese billete?",
      ],
      generate: () => {
        const item = pickFrom("tienda_plural");
        const N = ri(2, 8);
        const C = pick([6, 8, 10, 12, 15, 20, 24]);
        const cost = C * N;

        // Pagos realistas (billetes)
        const bills = [50, 100, 200, 500];
        const candidates = bills.filter((b) => b >= cost);
        const P = candidates.length ? pick(candidates) : 500;

        const change = P - cost;

        return {
          text:
            `Sofía compró ${N} ${item} que cuestan $${C} cada uno. ` +
            `Si pagó con $${P}, ¿cuánto recibió de cambio?`,
          answer: change,
        };
      },
    });

    // 6) Docenas de lápices (convertir y luego restar)
    // “Tenía X docenas, le quedaron Y lápices. ¿Cuántos vendió?”
    t.push({
      id: "docenas_lapices_vendidos",
      familyLabel: "Docenas",
      difficulty: 2,
      guide: [
        "🧠 Primero averigua cuántos lápices había al inicio (usa que 1 docena son 12).",
        "🧠 Ahora compara ese total con los lápices que quedaron: ¿cuántos se fueron?",
      ],
      generate: () => {
        const item = pick(["lápices", "marcadores"]); 
        const dozens = ri(20, 80); // docenas al inicio
        const initial = dozens * 12;

        // Para que sea “limpio”, hacemos que lo que quedó sea múltiplo de 12 o un número típico.
        const leftOptions = [24, 36, 48, 60, 72, 84, 96, 108, 120, 75];
        let left = pick(leftOptions);
        // Asegurar que left < initial
        if (left >= initial) left = 24;
        const sold = initial - left;

        return {
          text:
            `La cooperativa tenía ${dozens} docenas de ${item} y le quedaron ${left} ${item}. ` +
            `¿Cuántos ${item} se vendieron?`,
          answer: sold,
        };
      },
    });

    // 7) Gasto fijo
    t.push({
      id: "gasto_fijo",
      familyLabel: "Gasto fijo",
      difficulty: 2,
      guide: [
        "🧠 Primero averigua cuánto gastó en total en esos días.",
        "🧠 Después usa ese gasto total para decidir cuánto le quedó.",
      ],
      generate: () => {
        const D = ri(3, 9);
        const G = pick([5, 8, 10, 12, 15]);
        const left = ri(10, 60);
        const M = left + G * D;
        return {
          text:
            `José tenía $${M} ahorrados. Gastó $${G} cada día durante ${D} días. ` +
            `¿Cuánto dinero le quedó?`,
          answer: left,
        };
      },
    });

    // 8) Empaquetado: docena por caja + sobrante (2 preguntas: empacaron / había)
    // En el juego solo pedimos UNA respuesta, aquí pedimos "¿Cuántas había?".
    t.push({
      id: "manzanas_docenas_cajas",
      familyLabel: "Empaquetado",
      difficulty: 2,
      guide: [
        "🧠 Primero averigua cuántas unidades quedaron dentro de las cajas (docena = 12).",
        "🧠 Luego piensa qué pasa si a lo empacado le agregas lo que sobró.",
      ],
      generate: () => {
        const item = pick(["naranjas", "manzanas", "peras", "toronjas"]); 
        const boxes = ri(8, 20);
        const perBox = 12;
        const leftover = ri(1, 11); // sobran menos de una docena
        const packed = boxes * perBox;
        const totalHad = packed + leftover;

        return {
          text:
            `Empacamos ${item} colocando una docena en cada caja. ` +
            `Se llenaron ${boxes} cajas y sobraron ${leftover} ${item}. ` +
            `¿Cuántas ${item} hay en total?`,
          answer: totalHad,
        };
      },
    });

    // 9) Gruesa de naranjas: cajas vendidas (2 pasos: cajas que quedan × 144)
    t.push({
      id: "gruesa_naranjas_quedaron",
      familyLabel: "Gruesa",
      difficulty: 2,
      guide: [
        "🧠 Primero averigua cuántas cajas quedaron sin vender.",
        "🧠 Ahora convierte cajas a unidades usando que una gruesa equivale a 144.",
      ],
      generate: () => {
        const item = pickFrom("gruesa");
        const totalBoxes = ri(6, 12);
        const soldBoxes = ri(1, Math.min(5, totalBoxes - 1));
        const leftBoxes = totalBoxes - soldBoxes;
        const orangesPerBox = 144;
        const answer = leftBoxes * orangesPerBox;

        return {
          text:
            `En la tienda había ${totalBoxes} cajas con una gruesa de ${item} cada una. ` +
            `Se vendieron ${soldBoxes} cajas. ` +
            `¿Cuántas unidades de ${item} quedaron, si una gruesa es igual a 144 unidades?`,
          answer,
        };
      },
    });

    // 10) Dos tipos de transporte: 2 productos + suma
    t.push({
      id: "bultos_camiones_camionetas",
      familyLabel: "Dos totales",
      difficulty: 2,
      guide: [
        "🧠 Primero calcula cuántos bultos trajeron los camiones.",
        "🧠 Luego, calcula cuántos bultos trajeron las camionetas.",
        "🧠 Usa ambos resultados para obtener el total.",
      ],
      generate: () => {
        const item = pickFrom("bultos");
        const trucks = ri(12, 30);
        const perTruck = pick([40, 45, 50, 55, 60]);
        const vans = ri(2, 8);
        const perVan = pick([20, 25, 30, 35]);

        const total = trucks * perTruck + vans * perVan;

        return {
          text:
            `Un comerciante envió ${item} a un almacén: ${trucks} camiones con ${perTruck} bultos cada uno, ` +
            `y ${vans} camionetas con ${perVan} bultos cada una. ` +
            `¿Cuántos bultos envió en total?`,
          answer: total,
        };
      },
    });

    // 11) Precio unitario con descarte (dos productos)
    t.push({
      id: "precio_unitario",
      familyLabel: "Precio unitario",
      difficulty: 2,
      guide: [
        "🧠 Primero calcula cuánto se pagó SOLO por las bebidas.",
        "🧠 ¿Y entonces cuánto fue de la comida?",
        "🧠 Si ese es el total y sabemos cuántas fueron, ¿cuánto cuesta UNA?",
      ],
      generate: () => {
        let [itemA, itemB] = pickPair("comida","bebida");
        // a veces invertimos el orden para variar
        if (Math.random() < 0.35) [itemA, itemB] = [itemB, itemA];
        const X = ri(3, 9);
        const Y = ri(2, 4);
        const R = pick([5, 8, 10, 12]);
        const price = ri(10, 24);
        const total = price * X + R * Y;
        return {
          text:
            `Luis y Ana compraron ${X} ${itemA}s y ${Y} ${itemB}s. ` +
            `Pagaron $${total} en total. ` +
            `Si cada ${itemB} cuesta $${R}, ¿cuánto cuesta cada ${itemA}?`,
          answer: price,
        };
      },
    });

    // 12) Reparto equitativo (pregunta sobrante)
    t.push({
      id: "reparto_igual",
      familyLabel: "Reparto",
      difficulty: 2,
      guide: [
        "🧠 Primero calculamos cuántos chocolates se reparten para que todos reciban la misma cantidad.",
        "🧠 Lo que queda sin repartir es el sobrante.",
      ],
      generate: () => {
        const P = pick([3, 4, 5, 6]);
        const per = ri(4, 14);
        const residuo = ri(1, P - 1);
        const T = P * per + residuo;
        return {
          text:
            `Se repartieron ${T} chocolates a ${P} niños, ` +
            `y todos recibieron la misma cantidad para que no se pelearan. ` +
            `¿Cuántos chocolates sobraron?`,
          answer: residuo,
        };
      },
    });

    // 13) Diferencia de cantidades (dos personas)
    t.push({
      id: "diferencia",
      familyLabel: "Diferencia",
      difficulty: 2,
      guide: [
        "🧠 Si a Ana le quitamos las monedas “extra”, ¿cuántas quedan en total?",
        "🧠 Si ahora ambos tienen lo mismo, ¿cuánto tiene cada uno?",
      ],
      generate: () => {
        const base = ri(8, 30);
        const D = pick([4, 6, 8, 10, 12]);
        const T = base + (base + D);
        return {
          text:
            `Ana tiene ${D} monedas más que Luis. ` +
            `Entre los dos tienen ${T} monedas. ` +
            `¿Cuántas monedas tiene Luis?`,
          answer: base,
        };
      },
    });

    // 14) Viaje: distancia = velocidad * tiempo
    t.push({
      id: "viaje",
      familyLabel: "Viaje",
      difficulty: 2,
      guide: [
        "🧠 Primero averigua cuántos km recorre en un día.",
        "🧠 Si repite lo mismo cada día, ¿cómo obtienes lo de todos los días?",
      ],
      generate: () => {
        const V = pick([3, 4, 5, 6, 8, 10]);
        const T = ri(2, 9);
        const D = ri(2, 5);
        return {
          text:
            `Un viajero camina a ${V} km por hora durante ${T} horas diariamente. ` +
            `¿Qué distancia recorre en ${D} días?`,
          answer: V * T * D,
        };
      },
    });

    // 15) Ahorro para meta (exacto)
    t.push({
      id: "ahorro_meta",
      familyLabel: "Ahorro",
      difficulty: 2,
      guide: [
        "🧠 Primero calculamos cuánto le falta para llegar al costo de los tenis.",
        "🧠 Luego cuántos días necesita para completar lo que falta según lo que ahorra diario.",
      ],
      generate: () => {
        const days = ri(10, 60);
        const daily = pick([10, 12, 15, 20, 24, 25, 30, 40]);
        const have = pick([50, 100, 200, 300, 400, 500, 600]);
        const goal = have + daily * days;

        return {
          text:
            `José quiere comprar unos tenis que cuestan $${goal}. ` +
            `Actualmente tiene $${have} y puede ahorrar $${daily} diarios. ` +
            `¿Cuántos días tardará en juntar lo suficiente?`,
          answer: days,
        };
      },
    });

    // 16) Producción con desperdicio por lote
    t.push({
      id: "desperdicio",
      familyLabel: "Desperdicio",
      difficulty: 2,
      guide: [
        "🧠 Primero averigua cuántos lotes se hicieron.",
        "🧠 Luego averigua cuántas piezas se desperdician en total.",
        "🧠 Con eso, decide cuántas piezas útiles quedan.",
      ],
      generate: () => {
        const L = pick([5, 6, 8, 10]);
        const lots = ri(2, 8);
        const X = L * lots;
        const D = pick([2, 3, 4]);
        const good = X - lots * D;
        return {
          text:
            `Se producen ${X} piezas en lotes de ${L}. ` +
            `En cada lote se desperdician ${D} piezas. ` +
            `¿Cuántas piezas útiles quedan?`,
          answer: good,
        };
      },
    });

    // 17) Hormigas (punto medio)
    t.push({
      id: "hormigas_punto_medio",
      familyLabel: "Hormigas",
      difficulty: 2,
      guide: [
        "🧠 Calculamos la distancia que las separa.",
        "🧠 Luego la distancia que cada una debe caminar para encontrarse en el punto medio.",
        "🧠 Finalmente, desde la hormiga A avanzamos la distancia que debe caminar.",
      ],
      generate: () => {
        // asegurar paridad para que el punto medio sea entero
        const X = ri(10, 80);
        const delta = pick([10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30]);
        const Y = X + delta; // delta par => misma paridad
        const P = (X + Y) / 2;

        return {
          text:
            `Dos hormigas están en una recta numérica: la hormiga A está en ${X} y la B en ${Y}. ` +
            `Caminan para encontrarse justo en el punto medio. ¿En qué posición se encuentran?`,
          answer: P,
        };
      },
    });

    // 18) Hormigas (doble distancia)
    t.push({
      id: "hormigas_doble_distancia",
      familyLabel: "Hormigas",
      difficulty: 3,
      generate: () => {
        const X = ri(10, 60);
        const d = pick([6, 7, 8, 9, 10, 11, 12, 13, 14, 15]); // distancia entre 1 y 2
        const Y = X + d;
        const P = X + 3 * d; // más adelante

        return {
          text:
            `Tres hormigas caminan en la recta numérica. ` +
            `La primera se detiene en ${X} y la segunda en ${Y}. ` +
            `La tercera se detiene más adelante, en un punto tal que la distancia ` +
            `entre ella y la segunda es el doble de la distancia entre las otras dos. ` +
            `¿En qué punto se detuvo la tercera hormiga?`,
          answer: P,
        };
      },
    });

    t.push({
      id: "panes_leche_balance",
      familyLabel: "Dos totales",
      difficulty: 3,
      generate: () => {
        const pan = ri(5, 12); // pan barato
        const leche = ri(13, 25); // leche más cara

        const T1 = 2 * pan + leche;
        const T2 = 5 * pan + leche;

        return {
          text:
            `Martín iba a comprar 2 panes y 1 leche por $${T1}. ` +
            `Pero decidió llevar 3 panes más, y le cobraron $${T2}. ` +
            `¿Cuánto cuesta la leche?`,
          answer: leche,
        };
      },
    });

    t.push({
      id: "reparto_proporcional_trabajo",
      familyLabel: "Reparto proporcional",
      difficulty: 3,
      generate: () => {
        const A = ri(6, 20); // horas base
        const b = pick([2, 3, 4, 5, 6, 8]); // horas extra de Saúl
        const hS = A + b;
        const hJ = A;
        const totalHoras = hS + hJ; // 2A + b

        // pago por hora entero para que el reparto sea exacto
        const X = pick([10, 12, 15, 20, 25, 30, 40]);
        const totalPago = X * totalHoras;
        const pagoS = X * hS;

        return {
          text:
            `Saúl y Martín hicieron un trabajo y les pagaron $${totalPago} en total. ` +
            `Saúl trabajó ${hS} horas y Martín ${hJ} horas. ` +
            `Si el pago se reparte proporcionalmente a las horas trabajadas, ` +
            `¿cuánto recibe Saúl?`,
          answer: pagoS,
        };
      },
    });

    return t;
  }

  _pickProblemsByDifficulty(templates) {
    // Elegimos 4 problemas:
    //  - 1 de dificultad 1 (de una operación)
    //  - 1 de dificultad 2 (GUÍA ESPECÍFICA por tipo de problema)
    //  - 1 de dificultad 3 (RITUAL metacognitivo general)
    //  - 1 extra de dificultad 2 o 3 (SIN GUÍA)
    const byDiff = { 1: [], 2: [], 3: [] };
    for (const tpl of templates) {
      const d = tpl.difficulty ?? 2;
      if (!byDiff[d]) byDiff[d] = [];
      byDiff[d].push(tpl);
    }

    const chosen = [];
    const usedTemplateIds = new Set();

    const pickTpl = (arr) => {
      if (!arr.length) return null;

      const previousId = chosen.length
        ? chosen[chosen.length - 1].templateId
        : null;

      const preferred = arr.filter(
        (tpl) => !usedTemplateIds.has(tpl.id) && tpl.id !== previousId,
      );
      if (preferred.length) {
        return preferred[this._randInt(0, preferred.length - 1)];
      }

      const nonConsecutive = arr.filter((tpl) => tpl.id !== previousId);
      if (nonConsecutive.length) {
        return nonConsecutive[this._randInt(0, nonConsecutive.length - 1)];
      }

      return arr[this._randInt(0, arr.length - 1)];
    };

    const buildProblem = (tpl, difficulty, guideMode, guide) => {
      if (!tpl) return null;
      const p = tpl.generate();
      p.templateId = tpl.id ?? null;
      p.difficulty = difficulty;
      p.guideMode = guideMode;
      p.guide = guide;
      if (tpl.id) usedTemplateIds.add(tpl.id);
      return p;
    };

    // --- 1) Dificultad 1 ---
    if (byDiff[1]?.length) {
      const tpl = pickTpl(byDiff[1]);
      const p = buildProblem(
        tpl,
        1,
        "full",
        Array.isArray(tpl?.guide) ? tpl.guide.slice(0) : null,
      );
      if (p) chosen.push(p);
    }

    // --- 2) Dificultad 2 (guía completa) ---
    if (byDiff[2]?.length) {
      const tpl = pickTpl(byDiff[2]);
      const p = buildProblem(
        tpl,
        2,
        "full",
        Array.isArray(tpl?.guide) ? tpl.guide.slice(0) : null,
      );
      if (p) chosen.push(p);
    }

    // --- 3) Dificultad 3 (ritual) ---
    if (byDiff[3]?.length) {
      const tpl = pickTpl(byDiff[3]);
      const p = buildProblem(tpl, 3, "ritual", null);
      if (p) chosen.push(p);
    }

    // --- 4) Extra (dificultad 2 o 3, SIN GUÍA) ---
    const pool = [...(byDiff[2] || []), ...(byDiff[3] || [])];
    if (pool.length) {
      const tpl = pickTpl(pool);
      const p = buildProblem(tpl, tpl?.difficulty ?? 2, "none", null);
      if (p) chosen.push(p);
    }

    // En caso raro de que falten plantillas y salgan menos de 4, rellenamos con lo que haya.
    while (chosen.length < this.problemsPerRun) {
      const fallbackPool = [
        ...(byDiff[1] || []),
        ...(byDiff[2] || []),
        ...(byDiff[3] || []),
      ];
      if (!fallbackPool.length) break;
      const tpl = pickTpl(fallbackPool);
      const p = buildProblem(tpl, tpl?.difficulty ?? 2, "none", null);
      if (!p) break;
      chosen.push(p);
    }

    return chosen.slice(0, this.problemsPerRun);
  }

  // =======================================================
  // UTILIDADES
  // =======================================================
  _randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  _shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  _wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 999) {
    // Soporta saltos de línea explícitos \n
    const paragraphs = String(text).split("\n");
    let lineCount = 0;

    for (const para of paragraphs) {
      const words = para.split(" ");
      let line = "";
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + " ";
        const w = ctx.measureText(testLine).width;

        if (w > maxWidth && i > 0) {
          ctx.fillText(line.trim(), x, y);
          y += lineHeight;
          line = words[i] + " ";
          lineCount++;
          if (lineCount >= maxLines) return;
        } else {
          line = testLine;
        }
      }
      if (line.trim() !== "") {
        ctx.fillText(line.trim(), x, y);
        y += lineHeight;
        lineCount++;
        if (lineCount >= maxLines) return;
      }
    }
  }

  _isPointInRect(px, py, r) {
    if (!r) return false;
    return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
  }

  _finishGame(failed = false) {
    if (this.gameFinished) return;

    this.gameFinished = true;
    this.state = "finished";
    this.exitDelay = 0.5;

    // Recompensa por desempeño
    let tier = 0;
    if (this.correctCount >= 4) tier = 2;
    else if (this.correctCount >= 2) tier = 1;

    let gained = 0;
    if (window.MN_reportMinigameTier) {
      gained = MN_reportMinigameTier("leonardo_razonamiento", tier);
    }
    this.sheetsReward = gained;

    // Mensaje final
    if (failed) {
      this.win = false;
      this.message =
        "Se acabó el tiempo.\n" +
        `Aciertos: ${this.correctCount}/${this.problemsPerRun}.\n` +
        `Hojas ganadas: ${gained}.`;
    } else {
      this.win = this.correctCount >= 3;
      const head = this.win
        ? "¡Buen juicio mercantil!"
        : "Necesitas más práctica.";
      this.message =
        `${head}\n` +
        `Aciertos: ${this.correctCount}/${this.problemsPerRun}.\n` +
        `Hojas ganadas: ${gained}.`;
    }

    // Sonidos finales
    if (this.win) this._playSfx("sfx_win", { volume: 0.7 });
    else this._playSfx("sfx_error", { volume: 0.65 });

    // Evento para overworld
    if (this.game && this.game.events) {
      this.game.events.emit("razonamiento_done", {
        win: this.win,
        correct: this.correctCount,
        total: this.problemsPerRun,
        tier,
        sheetsReward: gained,
        failed,
        timeLimitSec: this.timeLimitSec,
      });
    }
  }
}

window.RazonamientoScene = RazonamientoScene;
