// ===========================================================
// EscribaScene.js — UN SOLO CORRAL visible,
// rondas extendidas y dibujo dinámico de números.
// v3.6:
//  - Límite de errores por ronda (3).
//  - Reporta nivel máximo alcanzado al terminar.
//  - Mantiene ajustes de muescas/maya/egipcio y tiempo.
//  - NUEVO: Pantalla de introducción tipo RestasScene.
// ===========================================================

const ESCRIBA_ROUNDS = [
  // Muescas solo (conteo puro)
  { id: 1, timeLimit: 60, min: 3, max: 7, count: 5, systems: ["muescas"] },
  { id: 2, timeLimit: 60, min: 5, max: 10, count: 5, systems: ["muescas"] },
  { id: 3, timeLimit: 70, min: 11, max: 20, count: 5, systems: ["muescas"] },

  // Un sistema antiguo por ronda
  { id: 4, timeLimit: 75, min: 1, max: 19, count: 5, systems: ["egipcio"] },
  { id: 5, timeLimit: 75, min: 1, max: 19, count: 5, systems: ["romano"] },
  { id: 6, timeLimit: 80, min: 1, max: 19, count: 5, systems: ["maya"] },

  // Mezclados
  {
    id: 7,
    timeLimit: 85,
    min: 1,
    max: 19,
    count: 5,
    systems: ["muescas", "egipcio", "romano", "maya"],
  },
  {
    id: 8,
    timeLimit: 90,
    min: 10,
    max: 25,
    count: 5,
    systems: ["muescas", "egipcio", "romano", "maya"],
  },
];

// Máx. errores permitidos por ronda
const ESCRIBA_MAX_ERRORS_PER_ROUND = 3;

// Imágenes del sistema egipcio compartidas en el módulo
let ESCRIBA_IMG_EGYPT_1 = null;
let ESCRIBA_IMG_EGYPT_10 = null;
let ESCRIBA_chiken = null;

// -----------------------------------------------------------
// HELPERS
// -----------------------------------------------------------
function distinctRandom(min, max, count) {
  const vals = [];
  const total = max - min + 1;
  const needed = Math.min(count, total);
  while (vals.length < needed) {
    const n = Math.floor(Math.random() * (max - min + 1)) + min;
    if (!vals.includes(n)) vals.push(n);
  }
  return vals;
}

function rectOverlap(a, b) {
  return !(
    a.x + a.width < b.x ||
    a.x > b.x + b.width ||
    a.y + a.height < b.y ||
    a.y > b.y + b.height
  );
}

function pointInside(r, x, y) {
  return x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height;
}

// -----------------------------------------------------------
// DIBUJO DE SISTEMAS NUMÉRICOS
// -----------------------------------------------------------

// 1) MUESCAS (unario agrupado en 5) — margen izquierdo reducido
function drawMuescas(ctx, value, x, y, w, h) {
  ctx.save();
  ctx.strokeStyle = "#222";
  ctx.lineWidth = 2;

  const grupos = Math.floor(value / 5);
  const resto = value % 5;

  const baseY = y + h * 0.25;
  const topY = y + h * 0.8;

  const marginX = w * 0.05;
  let cursorX = x + marginX;

  const groupWidth = w * 0.16;
  const spacingFactor = groupWidth / 5;

  for (let g = 0; g < grupos; g++) {
    for (let i = 0; i < 4; i++) {
      const lx = cursorX + (i + 0.4) * spacingFactor;
      ctx.beginPath();
      ctx.moveTo(lx, baseY);
      ctx.lineTo(lx, topY);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.moveTo(cursorX + spacingFactor * 0.3, topY);
    ctx.lineTo(cursorX + spacingFactor * 4.2, baseY);
    ctx.stroke();

    cursorX += groupWidth + 3;
  }

  if (resto > 0) {
    const singleSpacing = 7;
    const totalWidth = (resto - 1) * singleSpacing;
    let startX = cursorX + 4;

    if (startX + totalWidth > x + w - marginX) {
      startX = x + w - marginX - totalWidth;
    }

    for (let i = 0; i < resto; i++) {
      const lx = startX + i * singleSpacing;
      ctx.beginPath();
      ctx.moveTo(lx, baseY);
      ctx.lineTo(lx, topY);
      ctx.stroke();
    }
  }

  ctx.restore();
}

// 2) EGIPCIO (decimal, usando 1 y 10) — grid dinámico
function drawEgypt(ctx, value, x, y, w, h) {
  ctx.save();

  const decenas = Math.floor(value / 10);
  const unidades = value % 10;
  const symbolCount = decenas + unidades;

  if (symbolCount === 0) {
    ctx.restore();
    return;
  }

  const maxCols = 6;
  const cols = Math.min(symbolCount, maxCols);
  const rows = Math.ceil(symbolCount / maxCols);

  const cellW = w / cols;
  const cellH = h / rows;

  const totalWidth = cols * cellW;
  const totalHeight = rows * cellH;
  const offsetX = x + (w - totalWidth) / 2;
  const offsetY = y + (h - totalHeight) / 2;

  let index = 0;
  const img10 = ESCRIBA_IMG_EGYPT_10;
  const img1 = ESCRIBA_IMG_EGYPT_1;

  for (let i = 0; i < decenas; i++) {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const sx = offsetX + col * cellW + cellW * 0.1;
    const sy = offsetY + row * cellH + cellH * 0.1;
    const dw = cellW * 0.8;
    const dh = cellH * 0.8;

    if (img10 && img10.complete && img10.width > 0) {
      ctx.drawImage(img10, sx, sy, dw, dh);
    } else {
      ctx.strokeStyle = "#888";
      ctx.strokeRect(sx, sy, dw, dh);
    }
    index++;
  }

  for (let i = 0; i < unidades; i++) {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const sx = offsetX + col * cellW + cellW * 0.1;
    const sy = offsetY + row * cellH + cellH * 0.1;
    const dw = cellW * 0.8;
    const dh = cellH * 0.8;

    if (img1 && img1.complete && img1.width > 0) {
      ctx.drawImage(img1, sx, sy, dw, dh);
    } else {
      ctx.strokeStyle = "#888";
      ctx.strokeRect(sx, sy, dw, dh);
    }
    index++;
  }

  ctx.restore();
}

// 3) ROMANO
function toRoman(n) {
  const R = [
    ["M", 1000],
    ["CM", 900],
    ["D", 500],
    ["CD", 400],
    ["C", 100],
    ["XC", 90],
    ["L", 50],
    ["XL", 40],
    ["X", 10],
    ["IX", 9],
    ["V", 5],
    ["IV", 4],
    ["I", 1],
  ];
  let s = "";
  for (const [sym, val] of R) {
    while (n >= val) {
      s += sym;
      n -= val;
    }
  }
  return s;
}

function drawRoman(ctx, value, x, y, w, h) {
  ctx.save();
  const text = toRoman(value);
  ctx.fillStyle = "#111";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "28px 'Times New Roman', serif";
  ctx.fillText(text, x + w / 2, y + h / 2);
  ctx.restore();
}

function drawMaya(ctx, value, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = "#111";

  const alto = Math.floor(value / 20);
  const bajo = value % 20;

  const centerX = x + w / 2;
  const baseY = y + h * 0.88;
  const levelH = h * 0.45;

  // 🔹 Nivel inferior (unidades)
  if (bajo === 0) {
    drawMayaZero(ctx, centerX, baseY);
  } else {
    drawMayaLevel(ctx, bajo, centerX, baseY);
  }

  // 🔹 Nivel superior (veintenas)
  if (alto > 0) {
    if (alto === 0) {
      drawMayaZero(ctx, centerX, baseY - levelH);
    } else {
      drawMayaLevel(ctx, alto, centerX, baseY - levelH);
    }
  }

  ctx.restore();
}

function drawMayaLevel(ctx, val, cx, baseY) {
  ctx.save();
  const bars = Math.floor(val / 5);
  const dots = val % 5;

  const bw = 50;
  const bh = 8;
  const barGap = 6;

  for (let i = 0; i < bars; i++) {
    const y = baseY - i * (bh + barGap);
    ctx.fillRect(cx - bw / 2, y - bh, bw, bh);
  }

  const dotsY = baseY - bars * (bh + barGap) - 16;
  const spacing = 14;
  const totalW = (dots - 1) * spacing;
  const startX = cx - totalW / 2;

  for (let i = 0; i < dots; i++) {
    const dx = startX + i * spacing;
    ctx.beginPath();
    ctx.arc(dx, dotsY, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawMayaZero(ctx, cx, baseY) {
  ctx.save();
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 3;
  const w = 34;
  const h = 18;
  ctx.beginPath();
  ctx.ellipse(cx, baseY - h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// -----------------------------------------------------------
// SPRITES: LabelToken, Corral, PassButton
// -----------------------------------------------------------
class LabelToken extends Sprite {
  constructor(x, y, w, h, value, system) {
    super(x, y, w, h, "#fff");
    this.value = value;
    this.system = system;
    this.homeX = x;
    this.homeY = y;
    this.locked = false;
    this.removed = false;
  }

  reset() {
    this.x = this.homeX;
    this.y = this.homeY;
  }

  draw(ctx) {
    if (this.removed) return;

    ctx.save();
    ctx.fillStyle = this.locked ? "#d6fdd6" : "#ffffff";
    ctx.strokeStyle = this.locked ? "#2a7a2a" : "#444";
    ctx.lineWidth = 2;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.strokeRect(this.x, this.y, this.width, this.height);

    const pad = 6;
    const ix = this.x + pad;
    const iy = this.y + pad;
    const iw = this.width - pad * 2;
    const ih = this.height - pad * 2;

    switch (this.system) {
      case "muescas":
        drawMuescas(ctx, this.value, ix, iy, iw, ih);
        break;
      case "egipcio":
        drawEgypt(ctx, this.value, ix, iy, iw, ih);
        break;
      case "romano":
        drawRoman(ctx, this.value, ix, iy, iw, ih);
        break;
      case "maya":
        drawMaya(ctx, this.value, ix, iy, iw, ih);
        break;
    }
    ctx.restore();
  }
}

class Corral extends Sprite {
  constructor(x, y, w, h, value) {
    super(x, y, w, h, "#eed2a2");
    this.value = value;
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = "#eed2a2";
    ctx.strokeStyle = "#8b5a2b";
    ctx.lineWidth = 3;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.strokeRect(this.x, this.y, this.width, this.height);

    const rows = 3;
    const cols = Math.ceil(this.value / rows);
    const cellW = this.width / cols;
    const cellH = (this.height - 20) / rows;
    const celda = Math.min(cellW, cellH);
    let k = 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (k >= this.value) break;
        const cx = this.x + c * cellW + cellW / 2;
        const cy = this.y + 20 + r * cellH + cellH / 2;
        if (ESCRIBA_chiken) {
          ctx.drawImage(
            ESCRIBA_chiken,
            cx - celda / 2,
            cy - celda / 2,
            celda,
            celda
          );
        } else {
          // fallback simple
          ctx.fillStyle = "#fff7cc";
          ctx.beginPath();
          ctx.arc(cx, cy, celda / 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
        k++;
      }
    }
    ctx.restore();
  }
}

class PassButton extends Sprite {
  constructor(x, y, w, h) {
    super(x, y, w, h, "#fff");
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#555";
    ctx.lineWidth = 2;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.strokeRect(this.x, this.y, this.width, this.height);

    ctx.fillStyle = "#333";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Pasar", this.x + this.width / 2, this.y + this.height / 2);

    ctx.restore();
  }
}

// -----------------------------------------------------------
// ESCENA PRINCIPAL
// -----------------------------------------------------------
class EscribaScene extends Scene {
  constructor(game) {
    super(game);

    // "intro" | "playing"
    this.state = "intro";

    this.roundIndex = 0;
    this.completedRounds = 0;
    this.timeRemaining = 0;

    this.queue = [];
    this.currentValue = null;
    this.corral = null;
    this.labels = [];

    this.dragged = null;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;
    this._prevMouseDown = false;
    this._prevKeys = {};

    this.passButton = null;
    this.message = "";
    this.roundFinished = false;
    this.gameFinished = false;
    this.exitDelay = 0; // pequeño delay para que no se salga en el mismo frame

    this.errorsInRound = 0;
    this.maxLevelReached = 1;

    this.sfxCorrect = "sfx_match";
    this.sfxWrong = "sfx_error";
    this.sfxPass = "sfx_change_page";
    this.sfxRound = "sfx_win";
  }

  playSfx(key, options = {}) {
    if (!key) return;
    const assets = this.game.assets;
    if (!assets || typeof assets.playSound !== "function") return;
    assets.playSound(key, options);
  }

  init() {
    const assets = this.game.assets;
    if (window.MN_setLeafHUDVisible) {
      window.MN_setLeafHUDVisible(false);
    }

    if (assets && typeof assets.getImage === "function") {
      ESCRIBA_IMG_EGYPT_1 = assets.getImage("egypt_1") || null;
      ESCRIBA_IMG_EGYPT_10 = assets.getImage("egypt_10") || null;
      ESCRIBA_chiken = assets.getImage("chiken") || null;
    } else {
    }

    this.camera.x = 0;
    this.camera.y = 0;
    this.camera.setBounds(
      0,
      0,
      this.game.canvas.width,
      this.game.canvas.height
    );

    this.state = "intro";
    this._prevKeys = {};
    if (window.MN_setInputMode) MN_setInputMode("mouse");
    this._loadRound(0);
  }

  _loadRound(index) {
    this.roundIndex = index;
    const R = ESCRIBA_ROUNDS[index];
    if (!R) {
      this._finishGame(false);
      return;
    }

    // 🔹 LIMPIAR TODOS LOS SPRITES DE LA RONDA ANTERIOR
    if (this.objects && this.objects.size) {
      for (const obj of Array.from(this.objects)) {
        this.remove(obj); // Scene.remove limpia objects, layers y groups
      }
    }

    // 🔹 Resetear referencias de lógica interna
    this.labels = [];
    this.queue = [];
    this.corral = null;
    this.dragged = null;
    this.passButton = null;
    this.roundFinished = false;
    this.message = "";
    this.gameFinished = false;

    this.timeRemaining = R.timeLimit;
    this.errorsInRound = 0;

    const currentLevel = index + 1;
    if (currentLevel > this.maxLevelReached) {
      this.maxLevelReached = currentLevel;
    }

    const values = distinctRandom(R.min, R.max, R.count);
    this.queue = values.slice();

    const cw = 440;
    const ch = 300;
    const cx = (this.game.canvas.width - cw) / 2;
    const cy = 40;
    const firstValue = this.queue[0];
    this.corral = new Corral(cx, cy, cw, ch, firstValue);
    this.currentValue = firstValue;
    this.add(this.corral, "corral");

    const lw = 190;
    const lh = 90;
    const gap = 10;
    const totalW = values.length * lw + (values.length - 1) * gap;
    let startX = (this.game.canvas.width - totalW) / 2;
    const ly = this.game.canvas.height - lh - 70;

    const systems = R.systems;
    const shuffled = values.slice().sort(() => Math.random() - 0.5);

    shuffled.forEach((val, i) => {
      const sys = systems[i % systems.length];
      const lab = new LabelToken(startX + i * (lw + gap), ly, lw, lh, val, sys);
      this.labels.push(lab);
      this.add(lab, "label");
    });

    const pbW = 100;
    const pbH = 40;
    const pbX = this.game.canvas.width - pbW - 20;
    const pbY = this.game.canvas.height - pbH - 20;
    this.passButton = new PassButton(pbX, pbY, pbW, pbH);
    this.add(this.passButton, "ui");
  }

  _setNextCorralFromQueue() {
    if (this.queue.length === 0) {
      this.currentValue = null;
      this.corral.value = 0;
      return;
    }
    this.currentValue = this.queue[0];
    this.corral.value = this.currentValue;
  }

  _passCurrentCorral() {
    if (this.queue.length <= 1) {
      this.message = "Solo queda este corral.";
      return;
    }
    const first = this.queue.shift();
    this.queue.push(first);
    this._setNextCorralFromQueue();
    this.message = "El escriba mueve este corral al final de la fila.";
    this.playSfx(this.sfxPass);
  }

  _onCorrectMatch() {
    this.queue.shift();
    this.playSfx(this.sfxCorrect);

    if (this.queue.length === 0) {
      this._endRound(true);
    } else {
      this._setNextCorralFromQueue();
      this.message = "¡Exacto! Pasemos al siguiente corral.";
    }
  }

  _endRound(success, reason = "normal") {
    if (this.roundFinished) return;
    this.roundFinished = true;

    if (success) {
      this.completedRounds++;
      this.message = "Has completado todos los corrales de esta ronda.";
      this.playSfx(this.sfxRound);
    } else {
      if (reason === "timeout") {
        this.message = "El tiempo se ha agotado. Vuelve a intentarlo.";
      } else if (reason === "errors") {
        this.message = "Has cometido demasiados errores en esta ronda.";
      } else {
        this.message = "Has fallado esta ronda.";
      }
      this.playSfx(this.sfxWrong);
    }

    setTimeout(() => {
      if (success) {
        const nextIndex = this.roundIndex + 1;
        if (nextIndex < ESCRIBA_ROUNDS.length) {
          this._loadRound(nextIndex);
        } else {
          this._finishGame(false);
        }
      } else {
        this._finishGame(true);
      }
    }, 1200);
  }

  update(dt) {
    super.update(dt);

    const input = this.game.input;
    const mouse = input.mouse || { down: false };
    const mouseDown = mouse.down;
    const watchedKeys = ["Enter", " ", "Space", "Spacebar", "Escape"];
    const keys = {};
    for (const key of watchedKeys) keys[key] = !!input.isDown(key);
    const isJustPressed = (key) => keys[key] && !this._prevKeys[key];

    // 🔹 Juego ya terminó: esperar salida
    if (this.gameFinished) {
      if (this.exitDelay > 0) {
        this.exitDelay -= dt;
        this._prevKeys = { ...keys };
        this._prevMouseDown = mouseDown;
        return;
      }

      const wantsExit =
        input.isDown("Enter") ||
        input.isDown(" ") ||
        input.isDown("Space") ||
        input.isDown("Spacebar") ||
        input.isDown("Escape") ||
        mouseDown;

      if (wantsExit) {
        window.MN_APP?.toOverworld?.();
      }

      this._prevKeys = { ...keys };
      this._prevMouseDown = mouseDown;
      return;
    }

    // 🔹 INTRO: solo mostramos instrucciones, no corre el tiempo ni hay arrastre
    if (this.state === "intro") {
      if (
        isJustPressed("Enter") ||
        isJustPressed(" ") ||
        isJustPressed("Space") ||
        isJustPressed("Spacebar") ||
        mouseDown
      ) {
        this.state = "playing";
      }
      this._prevKeys = { ...keys };
      this._prevMouseDown = mouseDown;      
      return;
    }

    if (isJustPressed("Escape")) {
      window.MN_APP?.toOverworld?.();
      this._prevKeys = { ...keys };
      this._prevMouseDown = mouseDown;
      return;
    }

    // 🔹 A partir de aquí: estado "playing"
    if (!this.roundFinished) {
      this.timeRemaining -= dt;
      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0;
        this._endRound(false, "timeout");
      }
    }

    if (mouseDown && !this._prevMouseDown && !this.roundFinished) {
      if (this.passButton && pointInside(this.passButton, mouse.x, mouse.y)) {
        this._passCurrentCorral();
      } else {
        for (let i = this.labels.length - 1; i >= 0; i--) {
          const lab = this.labels[i];
          if (lab.locked || lab.removed) continue;
          if (pointInside(lab, mouse.x, mouse.y)) {
            this.dragged = lab;
            this.dragOffsetX = mouse.x - lab.x;
            this.dragOffsetY = mouse.y - lab.y;
            break;
          }
        }
      }
    }

    if (mouseDown && this.dragged && !this.roundFinished) {
      this.dragged.x = mouse.x - this.dragOffsetX;
      this.dragged.y = mouse.y - this.dragOffsetY;
    }

    if (!mouseDown && this._prevMouseDown && this.dragged) {
      const lab = this.dragged;
      let placed = false;

      if (this.corral && this.currentValue != null) {
        if (rectOverlap(lab, this.corral)) {
          if (lab.value === this.currentValue) {
            lab.locked = true;
            lab.removed = true;
            lab.x = -1000;
            lab.y = -1000;
            this._onCorrectMatch();
          } else {
            lab.reset();
            this.errorsInRound++;
            const remaining = ESCRIBA_MAX_ERRORS_PER_ROUND - this.errorsInRound;

            if (this.errorsInRound >= ESCRIBA_MAX_ERRORS_PER_ROUND) {
              this._endRound(false, "errors");
            } else {
              this.message = `No exactamente... Te quedan ${remaining} intento(s).`;
              this.playSfx(this.sfxWrong);
            }
          }
          placed = true;
        }
      }

      if (!placed) {
        lab.reset();
      }

      this.dragged = null;
    }

    this._prevKeys = { ...keys };
    this._prevMouseDown = mouseDown;
  }

  _drawIntro(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    const panelW = Math.min(560, W * 0.8);
    const panelH = 220;
    const X = (W - panelW) / 2;
    const Y = (H - panelH) / 2;

    ctx.save();

    // Fondo semitransparente
    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    ctx.fillRect(X, Y, panelW, panelH);

    ctx.strokeStyle = "#ffeb3b";
    ctx.lineWidth = 2;
    ctx.strokeRect(X, Y, panelW, panelH);

    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    ctx.font = "26px Arial";
    ctx.fillStyle = "#ffe082";
    ctx.fillText("El Escriba de los Corrales", W / 2, Y + 16);

    ctx.font = "16px Arial";
    ctx.fillStyle = "#ffffff";

    const lines = [
      "Cada corral tiene cierto número de gallinas.",
      "Arrastra la tarjeta que representa ese número hasta el corral.",
      "Verás distintos sistemas: muescas, numeración egipcia, romana y maya.",
      "Si un corral se complica, usa el botón PASAR para dejarlo al final.",
      "Tienes tiempo limitado y solo 3 errores por ronda.",
    ];

    let textY = Y + 54;
    const lineH = 22;
    for (const line of lines) {
      ctx.fillText(line, W / 2, textY);
      textY += lineH;
    }

    ctx.font = "18px Arial";
    ctx.fillStyle = "#ffeb3b";
    ctx.fillText(
      "Pulsa ENTER, ESPACIO o haz clic para comenzar.",
      W / 2,
      Y + panelH - 36
    );    
    ctx.restore();
  }

  draw(ctx) {
    ctx.fillStyle = "#f5f1e5";
    ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);

    super.draw(ctx);

    ctx.save();
    ctx.fillStyle = "#000";
    ctx.font = "18px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    ctx.fillText(
      `Ronda: ${this.roundIndex + 1} / ${ESCRIBA_ROUNDS.length}`,
      16,
      12
    );
    ctx.fillText(`Tiempo: ${Math.ceil(this.timeRemaining)}s`, 16, 36);

    if (this.message) {
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.font = "16px Arial";
      const lines = this.message.split("\n");
      const baseY = this.game.canvas.height - 8;
      for (let i = 0; i < lines.length; i++) {
        ctx.fillText(
          lines[i],
          this.game.canvas.width / 2,
          baseY - (lines.length - 1 - i) * 20
        );
      }
    }

    if (this.gameFinished) {
      ctx.fillStyle = "#222";
      ctx.font = "20px Arial";
      ctx.textAlign = "center";
      ctx.fillText(
        "Pulsa ENTER, ESPACIO o haz clic para volver al mercado.",
        this.game.canvas.width / 2,
        this.game.canvas.height - 240
      );
    }

    ctx.restore();

    // 🔹 Intro overlay encima de todo mientras el estado sea "intro"
    if (!this.gameFinished && this.state === "intro") {
      this._drawIntro(ctx);
    }
  }

  _finishGame(failed = false) {
    if (this.gameFinished) return;
    this.gameFinished = true;
    this.exitDelay = 0.5;

    // 🔹 Cálculo de tier según máximo nivel alcanzado
    let tier = 0; // 0, 1
    if (this.maxLevelReached >= 4) tier = 1;
    if (this.maxLevelReached >= ESCRIBA_ROUNDS.length) tier = 2;

    let gained = 0;
    if (window.MN_reportMinigameTier) {
      gained = MN_reportMinigameTier("escriba_muescas", tier);
    }

    this.message =
      `Has terminado la prueba del escriba.\n` +
      `Nivel máximo alcanzado: ${this.maxLevelReached}.\n` +
      `Hojas ganadas en esta partida: ${gained}.`;

    if (this.game && this.game.events) {
      this.game.events.emit("escriba_done", {
        completedRounds: this.completedRounds,
        totalRounds: ESCRIBA_ROUNDS.length,
        maxLevelReached: this.maxLevelReached,
        sheetsReward: gained,
        failed,
      });
    }
  }

  destroy() {
    this.clearAll();
    this.queue = [];
    this.labels = [];
    this.corral = null;
  }
}

window.EscribaScene = EscribaScene;
