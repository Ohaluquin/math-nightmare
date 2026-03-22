// ===========================================================
// CajaRapidaScene.js - "Caja Rapida del Mercader"
// - Estilo coherente con JerarquiaScene / RestasScene / TablasScene
// - state: "intro" | "playing" | "finished"
// - salida: Enter/Espacio/clic
// - recompensa: MN_reportMinigameTier("caja_rapida", tier)
// ===========================================================
class CajaRapidaScene extends Scene {
  constructor(game) {
    super(game);

    // Estado general del minijuego (coherente con tus otras escenas)
    this.state = "intro";
    this.gameFinished = false;
    this.exitDelay = 0;
    this.message = "";
    this.sheetsReward = 0;
    this.win = false;

    // Sonidos (mismos nombres que sueles usar)
    this.sfxCorrect = "sfx_match";
    this.sfxWrong = "sfx_error";
    this.sfxWin = "sfx_win";

    // Reputacion (vidas)
    this.maxReputation = 5;
    this.reputation = 5;

    // Stock inicial (ajustable)
    this.initialStock = {
      1: 17,
      2: 17,
      3: 15,
      5: 12,
      10: 10,
    };

    // --- NPC por capas (tus assets reales) ---
    this.npcVariator = new NPCVariator({
      headsCount: 11,
      bodiesCount: 3,
      beardsCount: 3, // incluye "sin barba"
      maxPerCycle: 4,
    });

    // cliente actual (capas)
    this.npc = null;

    // keys de expresiones (tu dijiste: happy, upset, angry)
    this.faceKeys = {
      happy: "npc_face_happy",
      upset: "npc_face_upset",
      angry: "npc_face_angry",
    };

    // --- Como se llaman tus imagenes (AJUSTA SOLO AQUI) ---
    this.keyHeadHair = (i) => `npc_hair_${i}`; // 0..10
    this.keyBody = (i) => `npc_body_${i}`; // 0..2
    this.keyBeard = (i) => `npc_beard_${i}`; // 0..2 (donde uno es "sin barba" PNG vacio o transparente)

    this.itemSpriteByPrice = {
      1: "cr_item_1",
      2: "cr_item_2",
      3: "cr_item_3",
      5: "cr_item_5",
      10: "cr_item_10",
    };

    // Pedido actual
    this.stock = {};
    this.customerIndex = 0;
    this.customersServed = 0;

    this.currentOrder = null; // [{price, qty}]
    this.currentTotal = 0;

    // Tiempo / paciencia del cliente. Se calcula en funcion _getTimeLimit
    this.timeLimit = 0;
    this.timeLeft = 0;

    // Entrada del jugador (teclado)
    this.inputValue = "";
    this.maxAnswerLength = 5;
    this._prevKeys = {};
    this._prevMouseDown = false;

    // Feedback breve
    this.lastResult = null; // "ok" | "fail" | "timeout" | null

    // Nombre (por si luego lo usas en HUD/novela)
    this.npcName = "Mercader";
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
    // coherente con tus escenas: ocultar HUD de hojas durante minijuego
    if (window.MN_setLeafHUDVisible) window.MN_setLeafHUDVisible(false);
    // Icono de teclado
    if (window.MN_setInputMode) MN_setInputMode("keyboard");

    this.state = "intro";
    this.gameFinished = false;
    this.exitDelay = 0;
    this.message = "";
    this.sheetsReward = 0;
    this.win = false;

    this.reputation = this.maxReputation;

    this.stock = { ...this.initialStock };
    this.customerIndex = 0;
    this.customersServed = 0;

    this.currentOrder = null;
    this.currentTotal = 0;
    this.inputValue = "";
    this.lastResult = null;

    this._prevKeys = {};
    const mouse = this.game?.input?.mouse;
    this._prevMouseDown = !!mouse?.down;

    // Camara fija como en tus otros minijuegos
    if (this.camera && this.game.canvas) {
      this.camera.x = 0;
      this.camera.y = 0;
      this.camera.setBounds(
        0,
        0,
        this.game.canvas.width,
        this.game.canvas.height
      );
    }
  }

  destroy() {
    this.clearAll();
    // No hay sprites persistentes; solo aseguramos limpiar referencias
    this.currentOrder = null;
    this.currentTotal = 0;
  }

  // =======================================================
  // UPDATE
  // =======================================================
  update(dt) {
    super.update(dt);

    const input = this.game.input;
    const keys = input.keys || {};
    const mouse = input.mouse || { down: false };
    const isJustPressed = (k) => keys[k] && !this._prevKeys[k];

    // ----------------- Juego terminado -----------------
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

    // ----------------- INTRO -----------------
    if (this.state === "intro") {
      if (
        isJustPressed("Enter") ||
        isJustPressed(" ") ||
        (mouse.down && !this._prevMouseDown)
      ) {
        this.state = "playing";
        this._startNextCustomer();
      }

      this._prevKeys = { ...keys };
      this._prevMouseDown = mouse.down;
      return;
    }

    // ----------------- PLAYING -----------------
    if (this.state === "playing") {
      // Timer del cliente
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this._onTimeout();
      }

      // Entrada numerica (como Restas/Tablas)
      for (let d = 0; d <= 9; d++) {
        const k = String(d);
        if (isJustPressed(k)) {
          if (this.inputValue.length < this.maxAnswerLength) {
            // Evita que empiece con ceros infinitos (opcional)
            if (this.inputValue.length === 0 && k === "0") {
              // permitir "0" solo si quieres; aqui lo permitimos
            }
            this.inputValue += k;
          }
        }
      }

      if (isJustPressed("Backspace")) {
        this.inputValue = this.inputValue.slice(0, -1);
      }

      if (isJustPressed("Enter")) {
        this._submitAnswer();
      }

      if (isJustPressed("Escape")) {
        window.MN_APP?.toOverworld?.();
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

    // --- FONDO DE LA TIENDA ---
    const bg = this.game.assets.getImage("bg_caja_rapida");
    if (bg) {
      // Escalado tipo "cover"
      const scale = Math.max(W / bg.width, H / bg.height);
      const bw = bg.width * scale;
      const bh = bg.height * scale;
      const bx = (W - bw) / 2;
      const by = (H - bh) / 2;
      ctx.drawImage(bg, bx, by, bw, bh);
    } else {
      // fallback si no carga
      ctx.fillStyle = "#1a0f1f";
      ctx.fillRect(0, 0, W, H);
    }

    // HUD + UI
    this._drawTitle(ctx);
    this._drawStockPanel(ctx);
    this._drawReputation(ctx);
    this._drawCustomerPanel(ctx);
    this._drawInputPanel(ctx);

    if (this.state === "intro") {
      this._drawIntro(ctx);
    }

    if (this.state === "finished") {
      this._drawEndMessage(ctx);
    }
  }

  _drawTitle(ctx) {
    const W = this.game.canvas.width;
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.font = "26px Arial";
    ctx.fillStyle = "#ffe082";
    ctx.fillText("Caja Rápida del Mercader", W / 2, 18);
    ctx.restore();
  }

  _drawStockPanel(ctx) {
    const W = this.game.canvas.width;
    const x = W * 0.9;
    const y = 100;
    const w = W * 0.09;
    const h = 150;

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "rgba(255,235,59,0.6)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = "#ffffff";
    ctx.font = "16px Arial";
    ctx.fillText("Stock", x + 12, y + 15);

    const prices = [1, 2, 3, 5, 10];
    ctx.font = "15px Arial";
    let yy = y + 40;
    for (const p of prices) {
      const qty = this.stock[p] ?? 0;
      ctx.fillStyle = qty > 0 ? "#dbe9ff" : "#ff8a80";
      ctx.fillText(`${p} -> ${qty}`, x + 18, yy);
      yy += 22;
    }

    ctx.restore();
  }

  _drawReputation(ctx) {
    const W = this.game.canvas.width;

    ctx.save();
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.font = "16px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Reputación:", 22, 70);

    // Corazones (como HUD simple)
    const heartSize = 18;
    for (let i = 0; i < this.maxReputation; i++) {
      const x = 22 + 100 + i * (heartSize + 6);
      const y = 68;
      ctx.fillStyle = i < this.reputation ? "#ff4b5c" : "#5b2b35";
      this._drawHeart(ctx, x, y, heartSize);
    }
    ctx.restore();
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
      y + s / 4
    );
    ctx.bezierCurveTo(x + s / 2, y, x, y, x, y + s / 4);
    ctx.fill();
  }

  _drawCustomerPanel(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    const cx = W * 0.5;
    const cy = H * 0.35;

    // Mood SOLO depende del tiempo (sin variables nuevas)
    const ratio = this.timeLimit > 0 ? this.timeLeft / this.timeLimit : 0;
    let mood = "happy";
    if (ratio <= 0.33) mood = "angry";
    else if (ratio <= 0.66) mood = "upset";

    this._drawNPC(ctx, cx, cy, 0.75, mood);

    // Bocadillo / pedido
    const panelW = Math.min(820, W * 0.62);
    const panelH = 260;
    const X = (W - panelW) / 2;
    const Y = 200;

    // Tiempo/paciencia
    ctx.font = "16px Arial";
    const t = Math.max(0, this.timeLeft);
    ctx.fillStyle = t <= 5 ? "#ff8a80" : "#c8e6c9";
    ctx.fillText(`Tiempo: ${t.toFixed(1)} s`, X + panelW - 150, Y + 14);

    ctx.font = "16px Arial";
    ctx.fillStyle = "#dbe9ff";

    if (this.currentOrder && this.currentOrder.length) {
      let baseX = X + 40;
      const baseY = Y + 215;
      const groupSpacing = 150; // separacion entre distintos productos

      this.currentOrder.forEach((item, index) => {
        const key = this.itemSpriteByPrice[item.price];
        const img = this.game.assets?.getImage?.(key);

        const gx = baseX + index * groupSpacing;
        const gy = baseY;

        if (img) {
          this._drawRepeatedItems(ctx, img, item.price, gx, gy, item.qty);
        } else {
          // fallback simple si no hay sprite
          for (let i = 0; i < item.qty; i++) {
            ctx.fillStyle = "rgba(255,255,255,0.25)";
            ctx.fillRect(gx + i * 30, gy, 24, 24);
            this._drawLabel(ctx, `$${item.price}`, gx + i * 30 + 12, gy - 10);
          }
        }
      });
    }
    ctx.restore();
  }

  _drawInputPanel(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    const panelW = Math.min(560, W * 0.7);
    const panelH = 120;
    const X = (W - panelW) / 2;
    const Y = H * 0.8;

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(X, Y, panelW, panelH);
    ctx.strokeStyle = "rgba(255,235,59,0.45)";
    ctx.lineWidth = 2;
    ctx.strokeRect(X, Y, panelW, panelH);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font = "18px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Escribe el TOTAL y presiona ENTER", W / 2, Y + 30);

    ctx.font = "34px monospace";
    ctx.fillStyle = "#ffe082";
    const txt = this.inputValue === "" ? "..." : this.inputValue;
    ctx.fillText(txt, W / 2, Y + 72);

    ctx.font = "14px Arial";
    ctx.fillStyle = "#dbe9ff";
    ctx.fillText(
      "Backspace = borrar - Escape = volver al overworld",
      W / 2,
      Y + 102
    );

    ctx.restore();
  }

  _drawIntro(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Panel
    const panelW = Math.min(640, W * 0.85);
    const panelH = 260;
    const X = (W - panelW) / 2;
    const Y = (H - panelH) / 2;

    ctx.fillStyle = "rgba(0,0,0,0.72)";
    ctx.fillRect(X, Y, panelW, panelH);
    ctx.strokeStyle = "#ffeb3b";
    ctx.lineWidth = 2;
    ctx.strokeRect(X, Y, panelW, panelH);

    ctx.font = "26px Arial";
    ctx.fillStyle = "#ffe082";
    ctx.fillText("Caja Rápida", W / 2, Y + 36);

    ctx.font = "18px Arial";
    ctx.fillStyle = "#ffffff";
    const lines = [
      "Atiende a los clientes del mercader.",
      "Cada uno pide varios artículos con precio fijo: 1, 2, 3, 5 y 10.",
      "Calcula el TOTAL rápido y cobra exacto.",
      "Si te equivocas o tardas demasiado, pierdes reputación.",
      "Si vendes todo el stock, ganas.",
    ];
    let yy = Y + 80;
    for (const line of lines) {
      ctx.fillText(line, W / 2, yy);
      yy += 24;
    }

    ctx.fillStyle = "#ffeb3b";
    ctx.fillText(
      "Pulsa ENTER, ESPACIO o clic para comenzar.",
      W / 2,
      Y + panelH - 34
    );

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

    const lines = this.message.split("\n");
    let y = H * 0.32;
    for (const line of lines) {
      ctx.fillText(line, W / 2, y);
      y += 30;
    }

    ctx.font = "18px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Pulsa ENTER, ESPACIO o haz clic para volver.", W / 2, y + 18);

    ctx.restore();
  }

  _drawNPC(ctx, x, y, scale, mood) {
    if (!this.npc) return;

    const assets = this.game.assets;

    const imgHeadHair = assets?.getImage?.(this.keyHeadHair(this.npc.headHair));
    const imgBody = assets?.getImage?.(this.keyBody(this.npc.body));
    const imgBeard = assets?.getImage?.(this.keyBeard(this.npc.beard));
    const imgFace = assets?.getImage?.(this.faceKeys[mood]);

    // Tu orden (tal cual lo pediste):
    // cabeza/peinado, cuerpo, barba, expresion
    this._drawSpriteCentered(ctx, imgHeadHair, x, y, scale);
    this._drawSpriteCentered(ctx, imgBody, x, y, scale);
    this._drawSpriteCentered(ctx, imgBeard, x, y, scale);
    this._drawSpriteCentered(ctx, imgFace, x, y, scale);
  }

  // =======================================================
  // LOGICA PRINCIPAL
  // =======================================================

  _startNextCustomer() {
    // Ya no hay stock?
    if (!this._hasAnyStock()) {
      this._onWin();
      return;
    }

    this.customerIndex += 1;
    this.lastResult = null;

    // Dificultad para este cliente
    const maxDistinct = this._getMaxDistinctProducts(this.customerIndex);
    const [minItems, maxItems] = this._getTotalItemsRange(this.customerIndex);
    this.timeLimit = this._getTimeLimit(this.customerIndex);
    this.timeLeft = this.timeLimit;

    // Generar pedido
    const order = this._generateOrder(maxDistinct, minItems, maxItems);
    if (!order || order.length === 0) {
      this._onWin();
      return;
    }

    this.currentOrder = order;
    this.currentTotal = order.reduce((acc, it) => acc + it.price * it.qty, 0);
    this.inputValue = "";
    this.npc = this.npcVariator.next();
  }

  _submitAnswer() {
    if (!this.currentOrder) return;
    if (!this.inputValue) return;

    const val = parseInt(this.inputValue, 10);
    if (Number.isNaN(val)) {
      this.inputValue = "";
      return;
    }

    if (val === this.currentTotal) {
      this._onCorrect();
    } else {
      this._onWrong();
    }

    this.inputValue = "";
  }

  _onCorrect() {
    // Restar stock
    for (const it of this.currentOrder) {
      this.stock[it.price] = Math.max(0, (this.stock[it.price] ?? 0) - it.qty);
    }

    this.customersServed += 1;
    this.lastResult = "ok";
    this.playSfx(this.sfxCorrect, { volume: 0.6 });

    // siguiente cliente
    this._startNextCustomer();
  }

  _onWrong() {
    this.reputation -= 1;
    this.lastResult = "fail";
    this.playSfx(this.sfxWrong, { volume: 0.6 });

    if (this.reputation <= 0) {
      this.reputation = 0;
      this._finishGame(true);
      return;
    }

    this._startNextCustomer();
  }

  _onTimeout() {
    // Evita doble castigo si ya termino
    if (this.gameFinished || this.state !== "playing") return;

    this.reputation -= 1;
    this.lastResult = "timeout";
    this.playSfx(this.sfxWrong, { volume: 0.6 });

    if (this.reputation <= 0) {
      this.reputation = 0;
      this._finishGame(true);
      return;
    }

    this._startNextCustomer();
  }

  _onWin() {
    this.win = true;
    this._finishGame(false);
  }

  // =======================================================
  // DIFICULTAD (tabla facil de editar)
  // =======================================================

  _getMaxDistinctProducts(customerIndex) {
    const pattern = [2, 2, 3, 3, 4, 4, 4, 5, 5];
    if (customerIndex - 1 < pattern.length) return pattern[customerIndex - 1];
    return 4;
  }

  _getTotalItemsRange(customerIndex) {
    // cantidad total de articulos del pedido (sube gradual)
    if (customerIndex <= 2) return [3, 4];
    if (customerIndex <= 4) return [4, 5];
    if (customerIndex <= 6) return [5, 6];
    if (customerIndex <= 8) return [6, 7];
    return [7, 10];
  }

  _getTimeLimit(customerIndex) {
    // paciencia: baja poco a poco
    if (customerIndex <= 3) return 45;
    if (customerIndex <= 6) return 40;
    if (customerIndex <= 10) return 35;
    return 30;
  }

  // =======================================================
  // GENERACION DE PEDIDOS (siempre valido con stock)
  // =======================================================

  _hasAnyStock() {
    return Object.values(this.stock).some((q) => q > 0);
  }

  _generateOrder(maxDistinct, minItems, maxItems) {
    // Productos disponibles
    const products = Object.entries(this.stock)
      .filter(([price, qty]) => qty > 0)
      .map(([price, qty]) => ({ price: Number(price), stock: qty }));

    if (products.length === 0) return null;

    const totalAvailable = products.reduce((acc, p) => acc + p.stock, 0);
    if (totalAvailable <= 0) return null;

    const distinctLimit = Math.min(maxDistinct, products.length);

    // clamp items al stock real
    const maxI = Math.min(maxItems, totalAvailable);
    const minI = Math.min(minItems, maxI);
    const totalItems = this._randInt(minI, maxI);

    // Seleccionar precios distintos (hasta distinctLimit)
    // (pero el pedido puede terminar usando menos si el stock aprieta)
    const shuffled = [...products];
    this._shuffleArray(shuffled);
    const chosen = shuffled.slice(0, distinctLimit);

    // Repartir totalItems entre chosen, respetando stock
    const orderMap = new Map(); // price -> qty
    let remaining = totalItems;

    while (remaining > 0) {
      // candidatos con stock restante
      const candidates = chosen.filter((p) => {
        const used = orderMap.get(p.price) || 0;
        return used < p.stock;
      });
      if (candidates.length === 0) break;

      const p = candidates[this._randInt(0, candidates.length - 1)];
      const used = orderMap.get(p.price) || 0;
      orderMap.set(p.price, used + 1);
      remaining--;
    }

    if (orderMap.size === 0) return null;

    return [...orderMap.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([price, qty]) => ({ price, qty }));
  }

  _randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  _shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  _drawSpriteCentered(ctx, img, cx, cy, scale = 1) {
    if (!img) return { w: 0, h: 0 };
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
    return { w, h };
  }

  _drawLabel(ctx, text, x, y, scale = 1) {
    ctx.save();
    ctx.font = `${18 * scale}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // contorno para legibilidad
    ctx.lineWidth = 5 * scale;
    ctx.strokeStyle = "rgba(0,0,0,0.75)";
    ctx.strokeText(text, x, y);

    ctx.fillStyle = "#ffe082";
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  _drawRepeatedItems(ctx, img, price, startX, startY, qty) {
    const scaleBoost = 1.2;
    const scale = 0.4 * scaleBoost;
    const spacing = 42; // distancia entre sprites
    const maxPerRow = 3; // mÃ¡x por fila

    for (let i = 0; i < qty; i++) {
      const row = Math.floor(i / maxPerRow);
      const col = i % maxPerRow;

      const cx = startX + col * spacing;
      const cy = startY + row * spacing;

      // sprite
      this._drawSpriteCentered(ctx, img, cx, cy, scale);

      // etiqueta de precio encima (como monstruos)
      this._drawLabel(ctx, `$${price}`, cx, cy - 35, scaleBoost);
    }
  }

  // =======================================================
  // FIN DEL JUEGO Y RECOMPENSA (mismo patron que tus escenas)
  // =======================================================
  _finishGame(failed = false) {
    if (this.gameFinished) return;

    this.gameFinished = true;
    this.state = "finished";
    this.exitDelay = 0.5;

    let tier = 0;
    if (!failed) {
      tier = 1;    
    }

    let gained = 0;
    if (window.MN_reportMinigameTier) {
      gained = MN_reportMinigameTier("caja_rapida", tier);
    }
    this.sheetsReward = gained;

    if (failed) {
      this.message =
        "Te quedaste sin reputación...\n" +
        `Atendidos: ${this.customersServed}.\n` +
        `Hojas ganadas: ${gained}.`;
    } else {
      this.message =
        "¡Vendiste todo el stock!\n" +
        `Atendidos: ${this.customersServed}.\n` +
        `Hojas ganadas: ${gained}.`;
      this.playSfx(this.sfxWin, { volume: 0.7 });
    }

    // Evento opcional, por si lo escuchas en overworld
    if (this.game && this.game.events) {
      this.game.events.emit("caja_rapida_done", {
        win: !failed,
        customersServed: this.customersServed,
        tier,
        sheetsReward: gained,
        failed,
      });
    }
  }
}

// ===========================================================
// NPCVariator: genera combinaciones con "ciclo" de peinados
// - No repite peinado hasta consumir los 11
// - No usa mas de N veces el mismo cuerpo/barba dentro del ciclo
// ===========================================================
class NPCVariator {
  constructor({ headsCount, bodiesCount, beardsCount, maxPerCycle = 4 }) {
    this.headsCount = headsCount; // 11
    this.bodiesCount = bodiesCount; // 3
    this.beardsCount = beardsCount; // 3 (incluye "sin barba" como uno de ellos)
    this.maxPerCycle = maxPerCycle; // 4 (tu regla)

    this._newCycle();
  }

  _newCycle() {
    this.headBag = Array.from({ length: this.headsCount }, (_, i) => i);
    this._shuffle(this.headBag);

    this.bodyUsed = Array(this.bodiesCount).fill(0);
    this.beardUsed = Array(this.beardsCount).fill(0);
  }

  next() {
    if (this.headBag.length === 0) this._newCycle();

    const headHair = this.headBag.pop();
    const body = this._pickWithCap(this.bodyUsed, this.maxPerCycle);
    const beard = this._pickWithCap(this.beardUsed, this.maxPerCycle);

    return { headHair, body, beard };
  }

  _pickWithCap(usedArr, cap) {
    const candidates = [];
    for (let i = 0; i < usedArr.length; i++) {
      if (usedArr[i] < cap) candidates.push(i);
    }

    // si se lleno (raro pero posible en edge cases), reinicia contadores
    if (candidates.length === 0) {
      for (let i = 0; i < usedArr.length; i++) usedArr[i] = 0;
      for (let i = 0; i < usedArr.length; i++) candidates.push(i);
    }

    const pick = candidates[(Math.random() * candidates.length) | 0];
    usedArr[pick] += 1;
    return pick;
  }

  _shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [a[i], a[j]] = [a[j], a[i]];
    }
  }
}

window.CajaRapidaScene = CajaRapidaScene;




