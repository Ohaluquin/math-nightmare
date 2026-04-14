// js/areas/geometria/niveles/congruenciaScene.js
// ===========================================================
// TangramScene - Puzzle de traslacion con piezas de Pitagoras
//
// - Las piezas iniciales aparecen desordenadas.
// - Hay 5 objetivos tipo tangram.
// - Solo se usan traslaciones.
// Controles:
//  - Mouse: arrastrar piezas
//  - Enter: comenzar / continuar
//  - Escape: salir
// ===========================================================

class TangramScene extends Scene {
  constructor(game, options = {}) {
    super(game);

    this.state = "intro"; // intro | playing | feedback | finished
    this.win = false;
    this.gameFinished = false;
    this.message = "";
    this.sheetsReward = options.sheetsReward ?? 1;
    this.timeLimitSeconds = options.timeLimitSeconds ?? 60;
    this.startLives = options.startLives ?? 2;
    this.lives = this.startLives;
    this.timeRemaining = this.timeLimitSeconds;
    this.roundTimedOut = false;
    this.feedbackDuration = options.feedbackDuration ?? 2;
    this.stateTimer = 0;
    this.lastCountdownSecond = Math.ceil(this.timeRemaining);

    this.problemIndex = 0;
    this.score = 0;
    this.palette = {
      bgTop: "#0a0f1d",
      bgBottom: "#151f3a",
      panel: "rgba(15,18,32,0.02)",
      panel2: "rgba(21,26,46,0.14)",
      border: "rgba(225,232,255,0.28)",
      soft: "#afbbdf",
      accent: "#7bdff2",
      good: "#63d471",
      warn: "#ffd166",
      ink: "#eef2ff",
      pieceOutline: "rgba(255,255,255,0.40)",
      targetSilhouetteFill: "#111316",
      targetSilhouetteStroke: "rgba(0,0,0,0.78)",
      selected: "#ffe29a",
      shadow: "rgba(0,0,0,0.35)",
      guide: "rgba(255,255,255,0.14)",
      stoneLight: "#8e939d",
      stoneMid: "#646a75",
      stoneDark: "#363b43",
      stoneCrack: "rgba(20,22,28,0.52)",
    };

    this.pieceColors = {
      white: "#ff9f1c",
      gray: "#8b5cf6",
      blue: "#36b8ff",
      yellow: "#ffe600",
      red: "#ff3152",
      green: "#41d05f",
    };

    this.pieceNames = {
      white: "triangulo",
      gray: "gris",
      blue: "azul",
      yellow: "amarillo",
      red: "rojo",
      green: "verde",
    };

    this.startPanel = { x: 50, y: 150, w: 430, h: 500 };
    this.goalPanel = { x: 540, y: 150, w: 430, h: 500 };

    this.drag = null;
    this.selectedPiece = -1;
    this.showGuideTips = false;
    this.tipsUsed = false;
    this._tipsToggleRect = null;

    this._prevMouseDown = false;
    this._prevEnterDown = false;

    this.challengeDefs = this._buildChallenges();
    this.maxProblems =
      options.maxProblems ?? Object.keys(this.challengeDefs).length;
    this.currentSet = [];
    this.currentShapeIndex = 0;
    this.currentShapeKey = null;

    this.pieces = [];
  }

  init() {
    this.problemIndex = 0;
    this.score = 0;
    this.lives = this.startLives;
    this.state = "intro";
    this.win = false;
    this.gameFinished = false;
    this.message = "";
    this.timeRemaining = this.timeLimitSeconds;
    this.roundTimedOut = false;
    this.stateTimer = 0;
    this.lastCountdownSecond = Math.ceil(this.timeRemaining);

    this.drag = null;
    this.selectedPiece = -1;
    this.showGuideTips = false;
    this.tipsUsed = false;
    this._tipsToggleRect = null;

    this._prevMouseDown = !!this.game.input?.mouse?.down;
    this._prevEnterDown = false;

    this.currentSet = this._shuffle(Object.keys(this.challengeDefs)).slice(
      0,
      Math.min(this.maxProblems, Object.keys(this.challengeDefs).length),
    );

    this.currentShapeIndex = 0;
    this.currentShapeKey = this.currentSet[this.currentShapeIndex];
    this._loadCurrentShape();

    window.MN_setLeafHUDVisible?.(false);
    window.MN_setInputMode?.("mouse");
  }

  // =========================================================
  // Definiciones
  // =========================================================
  _buildChallenges() {
    const pieces = [
      {
        id: 0,
        key: "white",
        points: [
          [-118.833, 41.816],
          [157.167, 41.816],
          [-38.333, -83.634],
        ],
      },
      {
        id: 1,
        key: "gray",
        points: [
          [102.976, -22.476],
          [22.476, 102.976],
          [-102.976, 22.476],
          [-22.476, -102.976],
        ],
      },
      {
        id: 2,
        key: "blue",
        points: [
          [43.256, 74.619],
          [43.256, -63.381],
          [8.232, -85.857],
          [-94.744, 74.619],
        ],
      },
      {
        id: 3,
        key: "yellow",
        points: [
          [63.381, 43.256],
          [85.857, 8.232],
          [-74.619, -94.744],
          [-74.619, 43.256],
        ],
      },
      {
        id: 4,
        key: "red",
        points: [
          [-8.232, 85.857],
          [94.744, -74.619],
          [-43.256, -74.619],
          [-43.256, 63.381],
        ],
      },
      {
        id: 5,
        key: "green",
        points: [
          [74.619, -43.256],
          [-63.381, -43.256],
          [-85.857, -8.232],
          [74.619, 94.744],
        ],
      },
    ];

    // Objetivo 1: la figura que antes era la "base" validada contigo
    const caracolTargets = {
      triangulo: { x: 638.833, y: 428.184 },
      gris: { x: 497.524, y: 367.024 },
      azul: { x: 717.718, y: 234.907 },
      amarillo: { x: 835.593, y: 266.268 },
      rojo: { x: 804.232, y: 384.143 },
      verde: { x: 686.357, y: 352.782 },
    };

    // Objetivo 2: la "casa"
    const casaTargets = {
      triangulo: { x: 738.833, y: 208.184 },
      gris: { x: 758.0, y: 388.0 },
      azul: { x: 852.744, y: 451.381 },
      amarillo: { x: 694.619, y: 482.744 },
      rojo: { x: 663.256, y: 324.619 },
      verde: { x: 821.381, y: 293.256 },
    };

    const rezar = {
      triangulo: { x: 672.189, y: 544.297 },
      gris: { x: 810.848, y: 203.13 },
      azul: { x: 788.519, y: 369.75 },
      amarillo: { x: 709.292, y: 274.707 },
      rojo: { x: 676.824, y: 393.851 },
      verde: { x: 756.577, y: 489.364 },
    };

    const canon = {
      triangulo: { x: 742.779, y: 264.377 },
      gris: { x: 851.888, y: 183.6 },
      azul: { x: 593.165, y: 430.941 },
      amarillo: { x: 710.933, y: 462.188 },
      rojo: { x: 804.232, y: 384.143 },
      verde: { x: 686.357, y: 352.782 },
    };

    const bird = {
      triangulo: { x: 712.624, y: 516.245 },
      gris: { x: 732.8, y: 279.169 },
      azul: { x: 828.688, y: 343.961 },
      amarillo: { x: 634.403, y: 352.89 },
      rojo: { x: 601.574, y: 472.507 },
      verde: { x: 796.502, y: 463.167 },
    };

    const vela = {
      triangulo: { x: 721.438, y: 558.618 },
      gris: { x: 682.8, y: 229.169 },
      azul: { x: 658.83, y: 397.091 },
      amarillo: { x: 776.599, y: 429.639 },
      rojo: { x: 571.76, y: 383.435 },
      verde: { x: 789.41, y: 343.545 },
    };

    const chino = {
      triangulo: { x: 719.885, y: 251 },
      gris: { x: 597.397, y: 434.969 },
      azul: { x: 696.588, y: 494.737 },
      amarillo: { x: 817.639, y: 527.286 },
      rojo: { x: 781.888, y: 369.114 },
      verde: { x: 663.004, y: 338 },
    };

    const perro = {
      triangulo: { x: 653.716, y: 271.07 },
      gris: { x: 607.577, y: 497.476 },
      azul: { x: 727.789, y: 527.404 },
      amarillo: { x: 847.803, y: 559.295 },
      rojo: { x: 719.54, y: 388.064 },
      verde: { x: 598.896, y: 355.763 },
    };

    const challenges = {
      caracol: {
        title: "Caracol",
        prompt: "Reacomoda las piezas para formar el caracol.",
        explanation:
          "Las mismas piezas pueden formar distintas figuras si solo cambias su posicion.",
        silhouette: [],
        targets: caracolTargets,
        pieces,
      },
      casa: {
        title: "Casa",
        prompt: "Reacomoda las piezas para formar la casa.",
        explanation:
          "Trasladar piezas congruentes no cambia su area total, solo la forma que percibes.",
        silhouette: [],
        targets: casaTargets,
        pieces,
      },
      rezar: {
        title: "Rezar",
        prompt: "Reacomoda las piezas para formar la figura de rezar.",
        explanation:
          "Una nueva silueta tambien se puede crear con las mismas piezas congruentes.",
        silhouette: [],
        targets: rezar,
        pieces,
      },
      canon: {
        title: "Canon",
        prompt: "Reacomoda las piezas para formar el canon.",
        explanation:
          "Cambiar la posicion de las piezas transforma la figura sin alterar el area.",
        silhouette: [],
        targets: canon,
        pieces,
      },
      bird: {
        title: "Bird",
        prompt: "Reacomoda las piezas para formar el pajaro.",
        explanation:
          "La congruencia permite reconocer que todas las figuras usan exactamente las mismas piezas.",
        silhouette: [],
        targets: bird,
        pieces,
      },
      vela: {
        title: "Vela",
        prompt: "Reacomoda las piezas para formar la vela.",
        explanation:
          "La misma coleccion de piezas se puede reorganizar para una figura totalmente distinta.",
        silhouette: [],
        targets: vela,
        pieces,
      },
      chino: {
        title: "Chino",
        prompt: "Reacomoda las piezas para formar la figura chino.",
        explanation:
          "Este reto refuerza visualizacion espacial usando solo traslaciones de piezas congruentes.",
        silhouette: [],
        targets: chino,
        pieces,
      },
      perro: {
        title: "Perro",
        prompt: "Reacomoda las piezas para formar el perro.",
        explanation:
          "Las mismas piezas permiten nuevas siluetas cuando reconoces relaciones de congruencia.",
        silhouette: [],
        targets: perro,
        pieces,
      },
    };

    this._fitChallengesIntoGoalPanel(challenges);
    return challenges;
  }

  get currentShape() {
    return this.challengeDefs[this.currentShapeKey];
  }

  _loadCurrentShape() {
    const shape = this.currentShape;
    const scatter = this._buildScatterPositions();

    this.pieces = shape.pieces.map((shapePiece, i) => ({
      id: shapePiece.id,
      key: shapePiece.key,
      points: shapePiece.points.map((p) => [p[0], p[1]]),
      x: scatter[i].x,
      y: scatter[i].y,
      angle: 0,
      locked: false,
    }));

    this._fitPiecesIntoStartPanel();

    this.drag = null;
    this.selectedPiece = -1;
    this.showGuideTips = false;
    this.timeRemaining = this.timeLimitSeconds;
    this.roundTimedOut = false;
    this.stateTimer = 0;
    this.lastCountdownSecond = Math.ceil(this.timeRemaining);
  }

  _buildScatterPositions() {
    // Piezas desordenadas en el panel izquierdo
    return [
      { x: 166, y: 286 }, // white
      { x: 313, y: 272 }, // gray
      { x: 164, y: 458 }, // blue
      { x: 318, y: 492 }, // yellow
      { x: 266, y: 388 }, // red
      { x: 120, y: 390 }, // green
    ];
  }

  _fitChallengesIntoGoalPanel(challenges) {
    for (const challenge of Object.values(challenges)) {
      this._fitChallengeTargetsIntoGoalPanel(challenge);
    }
  }

  _fitChallengeTargetsIntoGoalPanel(challenge) {
    const paddingX = 22;
    const paddingTop = 56;
    const paddingBottom = 20;
    const minX = this.goalPanel.x + paddingX;
    const maxX = this.goalPanel.x + this.goalPanel.w - paddingX;
    const minY = this.goalPanel.y + paddingTop;
    const maxY = this.goalPanel.y + this.goalPanel.h - paddingBottom;
    const bounds = this._getTargetBounds(challenge);

    const targetWidth = bounds.maxX - bounds.minX;
    const targetHeight = bounds.maxY - bounds.minY;

    let dx = 0;
    let dy = 0;

    if (targetWidth > maxX - minX) {
      dx = (minX + maxX - bounds.minX - bounds.maxX) * 0.5;
    } else if (bounds.minX < minX) {
      dx = minX - bounds.minX;
    } else if (bounds.maxX > maxX) {
      dx = maxX - bounds.maxX;
    }

    if (targetHeight > maxY - minY) {
      dy = (minY + maxY - bounds.minY - bounds.maxY) * 0.5;
    } else if (bounds.minY < minY) {
      dy = minY - bounds.minY;
    } else if (bounds.maxY > maxY) {
      dy = maxY - bounds.maxY;
    }

    if (dx === 0 && dy === 0) return;

    for (const target of Object.values(challenge.targets)) {
      target.x += dx;
      target.y += dy;
    }
  }

  _fitPiecesIntoStartPanel() {
    const paddingX = 22;
    const paddingTop = 56;
    const paddingBottom = 20;
    const minX = this.startPanel.x + paddingX;
    const maxX = this.startPanel.x + this.startPanel.w - paddingX;
    const minY = this.startPanel.y + paddingTop;
    const maxY = this.startPanel.y + this.startPanel.h - paddingBottom;

    for (const piece of this.pieces) {
      const bounds = this._getLocalBounds(piece.points);
      const allowedMinX = minX - bounds.minX;
      const allowedMaxX = maxX - bounds.maxX;
      const allowedMinY = minY - bounds.minY;
      const allowedMaxY = maxY - bounds.maxY;

      piece.x = Math.min(Math.max(piece.x, allowedMinX), allowedMaxX);
      piece.y = Math.min(Math.max(piece.y, allowedMinY), allowedMaxY);
    }
  }

  _getLocalBounds(points) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const [x, y] of points) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }

    return { minX, minY, maxX, maxY };
  }

  _getTargetBounds(challenge) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const piece of challenge.pieces) {
      const target = challenge.targets[this.pieceNames[piece.key]];
      if (!target) continue;

      const bounds = this._getLocalBounds(piece.points);
      const pieceMinX = target.x + bounds.minX;
      const pieceMaxX = target.x + bounds.maxX;
      const pieceMinY = target.y + bounds.minY;
      const pieceMaxY = target.y + bounds.maxY;

      if (pieceMinX < minX) minX = pieceMinX;
      if (pieceMaxX > maxX) maxX = pieceMaxX;
      if (pieceMinY < minY) minY = pieceMinY;
      if (pieceMaxY > maxY) maxY = pieceMaxY;
    }

    return { minX, minY, maxX, maxY };
  }

  // =========================================================
  // Update
  // =========================================================
  update(dt) {
    const input = this.game.input;
    const mouse = input.mouse || { x: 0, y: 0, down: false };
    const mouseDown = !!mouse.down;
    const mouseJustPressed = mouseDown && !this._prevMouseDown;
    const mouseJustReleased = !mouseDown && this._prevMouseDown;

    if (input.isDown("Escape")) {
      this._exitScene();
      this._prevMouseDown = mouseDown;
      return;
    }

    if (this.state === "intro") {
      if (this._justPressedEnter()) this.state = "playing";
      this._prevMouseDown = mouseDown;
      return;
    }

    if (this.state === "playing") {
      this._updateCountdown(dt);
      this.timeRemaining = Math.max(0, this.timeRemaining - dt);
      if (this.timeRemaining <= 0) {
        this._handleTimeExpired();
        this._prevMouseDown = mouseDown;
        return;
      }

      if (
        mouseJustPressed &&
        this._isPointInRect(mouse.x, mouse.y, this._tipsToggleRect)
      ) {
        this.showGuideTips = true;
        this.tipsUsed = true;
        this._tipsToggleRect = null;
        this._prevMouseDown = mouseDown;
        return;
      }

      if (mouseJustPressed) this._tryStartDrag(mouse.x, mouse.y);
      if (this.drag && mouseDown) this._updateDrag(mouse.x, mouse.y);
      if (this.drag && mouseJustReleased) this._endDrag();

      this._checkSolved();

      this._prevMouseDown = mouseDown;
      return;
    }

    if (this.state === "feedback") {
      this.stateTimer += dt;
      if (this.stateTimer >= this.feedbackDuration) {
        this._advanceAfterFeedback();
      }
      this._prevMouseDown = mouseDown;
      return;
    }

    if (this.state === "finished") {
      this.stateTimer += dt;
      if (this.stateTimer >= this.feedbackDuration) this._completeAndExit();
      this._prevMouseDown = mouseDown;
    }
  }

  _justPressedEnter() {
    const down = this.game.input.isDown("Enter");
    const pressed = down && !this._prevEnterDown;
    this._prevEnterDown = down;
    return pressed;
  }

  _updateCountdown(dt) {
    const nextRemaining = Math.max(0, this.timeRemaining - dt);
    const nextSecond = Math.ceil(nextRemaining);

    while (this.lastCountdownSecond > nextSecond) {
      this.lastCountdownSecond -= 1;
      if (this._shouldPlayCountdownTick(this.lastCountdownSecond)) {
        this._playSfx("sfx_steps", { volume: 0.35 });
      }
    }
  }

  _shouldPlayCountdownTick(second) {
    if (second <= 0) return false;
    if (second > 40) return second % 3 === 0;
    if (second > 20) return second % 2 === 0;
    return true;
  }

  _playSfx(key, options = {}) {
    const assets = this.game?.assets;
    if (!assets || typeof assets.playSound !== "function") return;
    assets.playSound(key, options);
  }

  // =========================================================
  // Drag / snap
  // =========================================================
  _tryStartDrag(mx, my) {
    const idx = this._findTopPieceAt(mx, my);
    if (idx < 0) {
      this.selectedPiece = -1;
      return;
    }

    const piece = this.pieces[idx];
    if (piece.locked) return;

    this.selectedPiece = idx;
    this.drag = {
      pieceIndex: idx,
      offsetX: mx - piece.x,
      offsetY: my - piece.y,
    };

    this._bringPieceToFront(idx);
  }

  _updateDrag(mx, my) {
    if (!this.drag) return;
    const piece = this.pieces[this.drag.pieceIndex];
    if (!piece || piece.locked) return;

    piece.x = mx - this.drag.offsetX;
    piece.y = my - this.drag.offsetY;
  }

  _endDrag() {
    if (!this.drag) return;
    const piece = this.pieces[this.drag.pieceIndex];
    this.drag = null;
    if (!piece) return;

    this._trySnapToGoal(piece);
  }

  _trySnapToGoal(piece) {
    const target = this._getTargetForPiece(piece.key);
    if (!target) return;

    const d = Math.hypot(piece.x - target.x, piece.y - target.y);

    if (d <= 34) {
      piece.x = target.x;
      piece.y = target.y;
      piece.angle = 0;
      piece.locked = true;
    }
  }

  _getTargetForPiece(pieceKey) {
    const name = this.pieceNames[pieceKey];
    return this.currentShape.targets[name] || null;
  }

  _checkSolved() {
    if (this.state !== "playing" || this.pieces.length === 0) return;
    for (let i = 0; i < this.pieces.length; i++) {
      if (!this.pieces[i].locked) return;
    }
    this.message = "Completaste la figura.";
    this.score += 1;
    this.roundTimedOut = false;
    this.stateTimer = 0;
    this._playSfx("sfx_win", { volume: 0.7 });
    this.state = "feedback";
    this.drag = null;
  }

  _handleTimeExpired() {
    if (this.state !== "playing") return;
    this.timeRemaining = 0;
    this.roundTimedOut = true;
    this.lives = Math.max(0, this.lives - 1);
    this.message = "Tiempo agotado.";
    this.drag = null;
    this.selectedPiece = -1;
    this.stateTimer = 0;
    this._playSfx("sfx_error", { volume: 0.7 });
    this.state = "feedback";
  }

  _advanceAfterFeedback() {
    const outOfLives = this.lives <= 0;
    const lastShape = this.currentShapeIndex >= this.currentSet.length - 1;

    if (outOfLives || lastShape) {
      this.state = "finished";
      this.win = this.score >= Math.max(1, this.currentSet.length - 1);
      this.gameFinished = true;
      this.message = this.win
        ? "Superaste el reto de sombras."
        : outOfLives
          ? "Te quedaste sin vidas."
          : "No alcanzaste a completar la ultima silueta.";
      this.stateTimer = 0;
      return;
    }

    this.currentShapeIndex += 1;
    this.currentShapeKey = this.currentSet[this.currentShapeIndex];
    this._loadCurrentShape();
    this.state = "playing";
  }

  _bringPieceToFront(index) {
    if (index < 0 || index >= this.pieces.length) return;
    const [piece] = this.pieces.splice(index, 1);
    this.pieces.push(piece);
    this.selectedPiece = this.pieces.length - 1;
    if (this.drag) this.drag.pieceIndex = this.selectedPiece;
  }

  _findTopPieceAt(mx, my) {
    for (let i = this.pieces.length - 1; i >= 0; i--) {
      const piece = this.pieces[i];
      if (piece.locked) continue;
      const poly = this._getWorldPolygon(piece);
      if (this._pointInPolygon(mx, my, poly)) return i;
    }
    return -1;
  }

  _getWorldPolygon(piece) {
    const c = Math.cos(piece.angle);
    const s = Math.sin(piece.angle);
    const out = [];
    for (let i = 0; i < piece.points.length; i++) {
      const p = piece.points[i];
      out.push({
        x: piece.x + p[0] * c - p[1] * s,
        y: piece.y + p[0] * s + p[1] * c,
      });
    }
    return out;
  }

  _pointInPolygon(px, py, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i].x;
      const yi = poly[i].y;
      const xj = poly[j].x;
      const yj = poly[j].y;
      const intersect =
        yi > py !== yj > py &&
        px < ((xj - xi) * (py - yi)) / (yj - yi || 0.000001) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  // =========================================================
  // Draw
  // =========================================================
  draw(ctx) {
    this._drawBackground(ctx);
    this._drawFrame(ctx);

    if (this.state === "intro") {
      this._drawIntro(ctx);
      return;
    }

    if (this.state === "playing" || this.state === "feedback") {
      this._drawHUD(ctx);
      this._drawPanels(ctx);
      this._drawTipsToggle(ctx);
      this._drawGoalSilhouette(ctx);
      if (this.showGuideTips) this._drawGoalSubdivisions(ctx);
      this._drawPieces(ctx);
      if (this.state === "feedback") this._drawFeedback(ctx);
      return;
    }

    if (this.state === "finished") {
      this._drawFinished(ctx);
    }
  }

  _drawBackground(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;
    const bg = this.game?.assets?.getImage?.("bg_tangram_sombra");

    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, this.palette.bgTop);
    g.addColorStop(1, this.palette.bgBottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    if (bg) {
      ctx.save();
      ctx.globalAlpha = 0.58;
      ctx.drawImage(bg, 0, 0, W, H);
      ctx.restore();
    }

    ctx.save();
    ctx.fillStyle = "rgba(8, 12, 22, 0.12)";
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

  }

  _drawFrame(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;
    this._roundRect(ctx, 26, 22, W - 52, H - 44, 18, this.palette.panel);
    ctx.lineWidth = 2;
    ctx.strokeStyle = this.palette.border;
    ctx.stroke();
  }

  _drawIntro(ctx) {
    const W = this.game.canvas.width;

    ctx.textAlign = "center";
    ctx.fillStyle = this.palette.ink;
    ctx.font = "bold 38px Arial";
    ctx.fillText("Sombras congruentes", W / 2, 124);

    ctx.fillStyle = this.palette.warn;
    ctx.font = "22px Arial";
    ctx.fillText("Piezas de Pitagoras", W / 2, 162);

    const lines = [
      "Las piezas aparecen desordenadas a la izquierda.",
      "Debes trasladarlas para reconstruir la figura objetivo.",
      "",
      "Cada ronda muestra una silueta diferente construida",
      "con las mismas piezas del tangram.",
      "Tienes 60 segundos para completar cada figura.",
      "Dispones de 2 vidas para toda la ronda.",
      "Puedes usar 'Mostrar tips' una sola vez en toda la partida.",
      "",
      "Controles:",
      "Mouse arrastrar piezas",
      "Enter comenzar | Escape salir",
    ];

    ctx.fillStyle = this.palette.soft;
    ctx.font = "22px Arial";
    let y = 220;
    for (const line of lines) {
      ctx.fillText(line, W / 2, y);
      y += 31;
    }

    ctx.fillStyle = this.palette.accent;
    ctx.font = "bold 24px Arial";
    ctx.fillText("Presiona ENTER para comenzar", W / 2, 618);
  }

  _drawHUD(ctx) {
    const W = this.game.canvas.width;
    const rightInfoX = W - 332;

    ctx.textAlign = "center";
    ctx.fillStyle = this.palette.ink;
    ctx.font = "bold 30px Arial";
    ctx.fillText("Sombras congruentes", W / 2, 60);

    ctx.textAlign = "left";
    ctx.fillStyle = this.palette.soft;
    ctx.font = "20px Arial";
    ctx.fillText(
      `Figura ${this.currentShapeIndex + 1} / ${this.currentSet.length}`,
      52,
      86,
    );

    const heartSize = 16;
    const heartBaseX = 84;
    const heartBaseY = 102;
    for (let i = 0; i < this.startLives; i++) {
      const x = heartBaseX + i * (heartSize + 8);
      ctx.fillStyle = i < this.lives ? "#ff4b5c" : "#5b2b35";
      this._drawHeart(ctx, x, heartBaseY, heartSize);
    }

    ctx.fillStyle = this.palette.warn;
    ctx.font = "bold 22px Arial";
    ctx.fillText(`Tiempo: ${Math.ceil(this.timeRemaining)}s`, rightInfoX, 74);

    ctx.fillStyle = this.palette.soft;
    ctx.font = "20px Arial";
    ctx.fillText(`Resueltos: ${this.score}`, rightInfoX, 102);

    ctx.textAlign = "left";
    ctx.fillStyle = this.palette.ink;
    ctx.font = "19px Arial";
    ctx.fillText("Reacomoda las piezas antes de que se acabe el tiempo.", 52, 142);
  }

  _drawPanels(ctx) {
    this._roundRect(
      ctx,
      this.startPanel.x,
      this.startPanel.y,
      this.startPanel.w,
      this.startPanel.h,
      16,
      this.palette.panel2,
    );
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.stroke();

    this._roundRect(
      ctx,
      this.goalPanel.x,
      this.goalPanel.y,
      this.goalPanel.w,
      this.goalPanel.h,
      16,
      this.palette.panel2,
    );
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.font = "bold 21px Arial";

    ctx.fillStyle = this.palette.soft;
    ctx.fillText(
      "Piezas",
      this.startPanel.x + this.startPanel.w / 2,
      this.startPanel.y + 32,
    );

    ctx.fillStyle = this.palette.accent;
    ctx.fillText(
      "Silueta",
      this.goalPanel.x + this.goalPanel.w / 2,
      this.goalPanel.y + 32,
    );
  }

  _drawGoalSilhouette(ctx) {
    const shape = this.currentShape;
    const pieceDefs = shape.pieces;

    for (let i = 0; i < pieceDefs.length; i++) {
      const def = pieceDefs[i];
      const target = shape.targets[this.pieceNames[def.key]];
      this._drawStaticPolygon(
        ctx,
        def.points,
        target.x,
        target.y,
        0,
        this.palette.targetSilhouetteFill,
        this.palette.targetSilhouetteFill,
        5,
        1,
      );
    }
  }

  _drawGoalSubdivisions(ctx) {
    const shape = this.currentShape;
    const pieceDefs = shape.pieces;

    for (let i = 0; i < pieceDefs.length; i++) {
      const def = pieceDefs[i];
      const target = shape.targets[this.pieceNames[def.key]];
      this._drawStaticPolygon(
        ctx,
        def.points,
        target.x,
        target.y,
        0,
        this.pieceColors[def.key],
        "rgba(255,255,255,0.92)",
        2,
        0.38,
      );
    }
  }

  _drawPieces(ctx) {
    for (let i = 0; i < this.pieces.length; i++) {
      const piece = this.pieces[i];
      const selected = i === this.selectedPiece;

      const fill = this.pieceColors[piece.key];
      const stroke = piece.locked
        ? "rgba(54, 58, 66, 0.82)"
        : selected
          ? this.palette.selected
          : this.palette.pieceOutline;

      this._drawPiecePolygon(ctx, piece, fill, stroke, piece.locked ? 2 : 2);
    }
  }

  _drawTipsToggle(ctx) {
    if (this.tipsUsed) {
      this._tipsToggleRect = null;
      return;
    }

    const W = this.game.canvas.width;
    const x = W - 336;
    const y = 118;
    const w = 150;
    const h = 34;
    this._tipsToggleRect = { x, y, w, h };

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.26)";
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

  _drawFeedback(ctx) {
    this._roundRect(ctx, 112, 538, 796, 98, 14, "rgba(7,10,20,0.68)");
    ctx.lineWidth = 2;
    ctx.strokeStyle = this.roundTimedOut ? this.palette.warn : this.palette.good;
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.fillStyle = this.roundTimedOut ? this.palette.warn : this.palette.good;
    ctx.font = "bold 25px Arial";
    ctx.fillText(
      this.roundTimedOut ? "Tiempo agotado" : "Figura completada",
      134,
      572,
    );

    ctx.fillStyle = this.palette.ink;
    ctx.font = "19px Arial";
    ctx.fillText(
      this.roundTimedOut
        ? `Pierdes una vida. Quedan ${this.lives}. Siguiente silueta en 2 s.`
        : this.currentShape.explanation,
      134,
      602,
    );

    ctx.textAlign = "right";
    ctx.fillStyle = this.palette.accent;
    ctx.font = "bold 20px Arial";
    ctx.fillText("Cambio automatico...", 884, 602);
  }

  _drawFinished(ctx) {
    const W = this.game.canvas.width;

    ctx.textAlign = "center";
    ctx.fillStyle = this.win ? this.palette.good : this.palette.warn;
    ctx.font = "bold 40px Arial";
    ctx.fillText(this.win ? "Reto superado" : "Reto completado", W / 2, 138);

    ctx.fillStyle = this.palette.ink;
    ctx.font = "26px Arial";
    ctx.fillText(
      `Figuras completadas: ${this.score} / ${this.currentSet.length}`,
      W / 2,
      192,
    );

    this._roundRect(ctx, 112, 244, 796, 244, 18, this.palette.panel2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.stroke();

    const lines = [
      this.win
        ? "Lograste reconocer al menos 7 de las 8 sombras."
        : "Necesitas reconocer al menos 7 de las 8 sombras.",
      "Las mismas piezas pueden formar distintas figuras",
      "sin cambiar el area total.",
      "",
      "Este modo entrena visualizacion espacial con tangram.",
      this.win ? "Ganaste la hoja de este reto." : "Intentalo de nuevo para ganar la hoja.",
    ];

    ctx.fillStyle = this.palette.soft;
    ctx.font = "24px Arial";
    let y = 292;
    for (const line of lines) {
      ctx.fillText(line, W / 2, y);
      y += 34;
    }

    ctx.fillStyle = this.palette.accent;
    ctx.font = "bold 24px Arial";
    ctx.fillText("Volviendo al mapa...", W / 2, 566);
  }

  // =========================================================
  // Helpers draw
  // =========================================================
  _drawPiecePolygon(ctx, piece, fill, stroke, lineW) {
    const poly = this._getWorldPolygon(piece);

    ctx.save();
    ctx.shadowColor = this.palette.shadow;
    ctx.shadowBlur = 8;

    ctx.beginPath();
    ctx.moveTo(poly[0].x, poly[0].y);
    for (let i = 1; i < poly.length; i++) {
      ctx.lineTo(poly[i].x, poly[i].y);
    }
    ctx.closePath();

    ctx.fillStyle = piece.locked
      ? this._createStoneFill(ctx, poly)
      : this._createPieceFill(ctx, poly, fill);
    ctx.fill();
    this._drawPieceTexture(ctx, poly, piece);

    ctx.shadowBlur = 0;
    ctx.lineWidth = lineW;
    ctx.strokeStyle = stroke;
    ctx.stroke();

    ctx.restore();
  }

  _createPieceFill(ctx, poly, baseColor) {
    const bounds = this._getPolygonBounds(poly);
    const g = ctx.createLinearGradient(
      bounds.minX,
      bounds.minY,
      bounds.maxX,
      bounds.maxY,
    );
    g.addColorStop(0, this._mixColor(baseColor, "#ffffff", 0.26));
    g.addColorStop(0.52, baseColor);
    g.addColorStop(1, this._mixColor(baseColor, "#0f1422", 0.28));
    return g;
  }

  _createStoneFill(ctx, poly) {
    const bounds = this._getPolygonBounds(poly);
    const g = ctx.createLinearGradient(
      bounds.minX,
      bounds.minY,
      bounds.maxX,
      bounds.maxY,
    );
    g.addColorStop(0, this.palette.stoneLight);
    g.addColorStop(0.45, this.palette.stoneMid);
    g.addColorStop(1, this.palette.stoneDark);
    return g;
  }

  _drawPieceTexture(ctx, poly, piece) {
    const bounds = this._getPolygonBounds(poly);
    const seed = piece.id + (piece.locked ? 10 : 0);

    ctx.save();
    ctx.clip();

    if (piece.locked) {
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      for (let i = 0; i < 7; i++) {
        const x = bounds.minX + (((seed * 17 + i * 29) % 100) / 100) * (bounds.maxX - bounds.minX);
        const y = bounds.minY + (((seed * 23 + i * 31) % 100) / 100) * (bounds.maxY - bounds.minY);
        ctx.fillRect(x, y, 3, 3);
      }
    } else {
      const shine = ctx.createLinearGradient(
        bounds.minX,
        bounds.minY,
        bounds.minX,
        bounds.maxY,
      );
      shine.addColorStop(0, "rgba(255,255,255,0.18)");
      shine.addColorStop(0.55, "rgba(255,255,255,0.04)");
      shine.addColorStop(1, "rgba(0,0,0,0.08)");
      ctx.fillStyle = shine;
      ctx.fillRect(
        bounds.minX,
        bounds.minY,
        bounds.maxX - bounds.minX,
        bounds.maxY - bounds.minY,
      );
    }

    ctx.restore();
  }

  _getPolygonBounds(poly) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const p of poly) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }

    return { minX, minY, maxX, maxY };
  }

  _mixColor(hexA, hexB, t) {
    const a = this._hexToRgb(hexA);
    const b = this._hexToRgb(hexB);
    const mix = (v1, v2) => Math.round(v1 + (v2 - v1) * t);
    return `rgb(${mix(a.r, b.r)}, ${mix(a.g, b.g)}, ${mix(a.b, b.b)})`;
  }

  _hexToRgb(hex) {
    const clean = String(hex).replace("#", "");
    const full =
      clean.length === 3
        ? clean
            .split("")
            .map((c) => c + c)
            .join("")
        : clean;
    return {
      r: parseInt(full.slice(0, 2), 16),
      g: parseInt(full.slice(2, 4), 16),
      b: parseInt(full.slice(4, 6), 16),
    };
  }

  _drawStaticPolygon(
    ctx,
    points,
    x,
    y,
    angle,
    fill,
    stroke,
    lineW,
    alpha = 1,
    textureMode = "none",
  ) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);

    ctx.save();
    ctx.globalAlpha = alpha;

    ctx.beginPath();
    ctx.moveTo(
      x + points[0][0] * c - points[0][1] * s,
      y + points[0][0] * s + points[0][1] * c,
    );

    for (let i = 1; i < points.length; i++) {
      const px = x + points[i][0] * c - points[i][1] * s;
      const py = y + points[i][0] * s + points[i][1] * c;
      ctx.lineTo(px, py);
    }

    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();

    if (textureMode !== "none") {
      const poly = points.map((p) => ({
        x: x + p[0] * c - p[1] * s,
        y: y + p[0] * s + p[1] * c,
      }));
      this._drawPieceTexture(ctx, poly, { id: 0, locked: textureMode === "stone" });
    }

    if (lineW > 0) {
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.lineWidth = lineW;
      ctx.strokeStyle = stroke;
      ctx.stroke();
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
      y + s / 4,
    );
    ctx.bezierCurveTo(x + s / 2, y, x, y, x, y + s / 4);
    ctx.fill();
  }

  _roundRect(ctx, x, y, w, h, r, fillStyle) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }

  _isPointInRect(px, py, r) {
    if (!r) return false;
    return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
  }

  _shuffle(arr) {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  // =========================================================
  // Exit
  // =========================================================
  _completeAndExit() {
    let gained = 0;
    if (this.win && typeof window.MN_reportMinigameTier === "function") {
      gained = window.MN_reportMinigameTier("congruencia", 1);
    }
    this.sheetsReward = gained;

    if (window.MN_STATE) {
      window.MN_STATE.minigames = window.MN_STATE.minigames || {};
      window.MN_STATE.minigames.congruencia = {
        completed: true,
        score: this.score,
        win: this.win,
        sheetsReward: gained,
      };
    }

    if (window.MN_updateLeafHUD) window.MN_updateLeafHUD();
    this._exitScene();
  }

  _exitScene() {
    window.MN_setInputMode?.(null);
    window.MN_setLeafHUDVisible?.(true);

    try {
      if (window.MN_APP?.toOverworld) window.MN_APP.toOverworld();
    } catch (e) {
      console.warn("No se pudo volver al overworld desde TangramScene.", e);
    }
  }
}

window.TangramScene = TangramScene;
window.CongruenciaScene = TangramScene;
