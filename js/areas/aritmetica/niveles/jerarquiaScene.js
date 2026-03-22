// JerarquiaScene.js
// Minijuego: Jerarquía de Operaciones con monstruos come-números.
// Depende de motor2D.js (Scene, Game, AssetLoader, spawnHitFX, etc.).

class JerarquiaScene extends Scene {
  constructor(game) {
    super(game);
    this.type = "JerarquiaScene";

    this.state = "intro";
    // Configuración de la horda
    this.totalMonsters = 10;
    this.baseMonsterSpeed = 40; // píxeles/seg
    this.safeX = 150; // si el monstruo llega aquí, pierdes

    // Estado
    this.monsters = []; // { x, exprRoot, extraSpeed? }
    this.currentMonsterIndex = 0;
    this.currentExpr = null;
    this.errors = 0;
    this.maxErrors = 3;
    this.gameOver = false;
    this.win = false;

    // Tiempo
    this.time = 0;
    this.errorCooldown = 1.0; // seg bloqueado tras error
    this.inputLockedUntil = 0;

    // Tokens de expresión (para clic)
    this._lastTokens = [];

    // Clic de mouse (flanco)
    this._prevMouseDown = false;

    // Sonidos (los mismos nombres que usas en EscribaScene)
    this.sfxCorrect = "sfx_match";
    this.sfxWrong = "sfx_error";
    this.sfxKill = "hit_sfx";
    this.sfxRound = "sfx_win";

    // Protagonista asustado
    this.playerImg = null;
    this.playerX = this.safeX - 100; // un poco a la izquierda de la línea de seguridad
    this.playerY = 0; // se define bien en init()
    this.playerShakeTime = 0;
    this.playerShakeAmp = 2; // intensidad del temblor

    // Sprite sheet monster
    this.monsterImage = null;
    // Tamaño de cada frame
    this.monsterFrameW = 512;
    this.monsterFrameH = 512;
    this.monsterCols = 7;
    this.monsterRows = 2;
    this.monsterTotalFrames = this.monsterCols * this.monsterRows;
    this.monsterFrameIndex = 0;
    this.monsterAnimTimer = 0;
    this.monsterAnimSpeed = 0.12; // segundos por frame aprox.

    // Estado de fin de minijuego (para Math Nightmare)
    this.gameFinished = false;
    this.exitDelay = 0;
    this.sheetsReward = 0;
    this.message = "";
  }

  /* ====================== Utilidad de sonidos ======================= */

  playSfx(key, options = {}) {
    if (!key) return;
    const assets = this.game.assets;
    if (!assets || typeof assets.playSound !== "function") return;
    assets.playSound(key, options);
  }

  /* ============================ CICLO DE VIDA ============================ */
  init() {
    if (window.MN_setLeafHUDVisible) {
      window.MN_setLeafHUDVisible(false);
    }
    // Icono de mouse en la esquina
    if (window.MN_setInputMode) MN_setInputMode("mouse");
    const assets = this.game.assets;

    // 🔹 RESETEO COMPLETO DE ESTADO
    this.gameFinished = false;
    this.gameOver = false;
    this.win = false;

    this.exitDelay = 0;
    this.sheetsReward = 0;
    this.message = "";

    this.time = 0;
    this.inputLockedUntil = 0;
    this.errors = 0;
    this.currentMonsterIndex = 0;
    this._prevMouseDown = false;

    // 🔹 Estado de inicio
    this.state = "intro";

    // 🔹 Cargar sprite del niño asustado
    if (assets && typeof assets.getImage === "function") {
      this.playerImg = assets.getImage("scared") || null;
    }

    // Colocar al niño cerca del suelo
    const h = this._getHeight();
    this.playerY = h - 20; // se ajusta luego visualmente si hace falta

    // Sprite monster (por si recargamos assets)
    if (assets && typeof assets.getImage === "function") {
      this.monsterImage = assets.getImage("monster") || null;
    }
    this._syncMonsterSheetMetrics();

    // Cámara
    this.camera.x = 0;
    this.camera.y = 0;
    this.camera.setBounds(
      0,
      0,
      this.game.canvas.width,
      this.game.canvas.height
    );

    // 🔹 Horda nueva
    this._initMonsters();
  }

  destroy() {
    this.clearAll();
    this.monsters = [];
    this._lastTokens = [];
  }

  /* ==================== Inicialización de la horda ====================== */

  _initMonsters() {
    this.monsters = [];
    this.currentMonsterIndex = 0;
    this.currentExpr = null;
    this.errors = 0;

    const w = this._getWidth();
    for (let i = 0; i < this.totalMonsters; i++) {
      const spacing = 260;
      const x = w + i * spacing;
      const exprRoot = this._generateRandomExpressionAST();
      this.monsters.push({ x, exprRoot, extraSpeed: 0 });
    }

    if (this.monsters.length > 0) {
      this.currentExpr = this.monsters[0].exprRoot;
    }
  }

  /* ============================= UPDATE/DRAW ============================ */

  update(dt) {
    const input = this.game.input;

    // 🔹 Cuando YA terminó el minijuego
    if (this.gameFinished) {
      if (this.exitDelay > 0) {
        this.exitDelay -= dt;
        return;
      }

      const wantsExit =
        input.isDown("Enter") ||
        input.isDown(" ") ||
        this.game.input.mouse.down;

      if (wantsExit) {
        window.MN_APP?.toOverworld?.();
      }

      return;
    }

    // 🔹 INTRO: solo mostramos instrucciones, no se mueven monstruos
    if (this.state === "intro") {
      const mouse = input.mouse || { down: false };

      const wantsStart =
        input.isDown("Enter") || input.isDown(" ") || mouse.down;

      if (wantsStart) {
        this.state = "playing";
        this.time = 0;
        this.inputLockedUntil = 0;
        this.errors = 0;        
      }

      this._prevMouseDown = mouse.down;
      return; // 👈 no seguimos con la lógica normal
    }

    // 🔹 Juego normal
    if (this.gameOver) return; // opcional: si lo usas para congelar justo al morir

    this.time += dt;
    this.playerShakeTime += dt;

    // Animación del monster
    if (this.monsterImage) {
      this.monsterAnimTimer += dt;
      if (this.monsterAnimTimer >= this.monsterAnimSpeed) {
        this.monsterAnimTimer = 0;
        this.monsterFrameIndex =
          (this.monsterFrameIndex + 1) % this.monsterTotalFrames;
      }
    }

    // Mover monstruos hacia la izquierda
    this._updateMonsters(dt);

    // ¿Monstruo actual resuelto?
    if (this.currentExpr && this._isSingleNumber(this.currentExpr)) {
      this._defeatCurrentMonster();
    }

    // ¿Monstruo actual llegó a la línea segura?
    const m = this._getCurrentMonster();
    if (m && m.x <= this.safeX && !this.gameOver) {
      this._onLose("Un monstruo te alcanzó.");
    }

    // Input de mouse (clic en operador)
    const mouse = this.game.input.mouse;
    const mouseDown = mouse.down;

    if (mouseDown && !this._prevMouseDown) {
      this._handlePointerDown(mouse.x, mouse.y);
    }

    this._prevMouseDown = mouseDown;
  }

  draw(ctx) {
    const w = this._getWidth();
    const h = this._getHeight();

    // Fondo
    const bg = this.game.assets.getImage("mn_classroom_bg");
    if (bg) ctx.drawImage(bg, 0, 0, w, h);
    else {
      ctx.fillStyle = "#050814";
      ctx.fillRect(0, 0, w, h);
    }

    // Título
    ctx.fillStyle = "#ff5555";
    ctx.font = "24px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Jerarquía de Operaciones", w / 2, 40);

    // Info
    ctx.textAlign = "left";
    ctx.font = "16px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(
      `Monstruo: ${Math.min(
        this.currentMonsterIndex + 1,
        this.totalMonsters
      )}/${this.totalMonsters}`,
      20,
      70
    );
    ctx.fillText(`Errores: ${this.errors}/${this.maxErrors}`, 20, 90);

    if (this.time < this.inputLockedUntil) {
      ctx.fillStyle = "#ffaaaa";
      ctx.fillText("¡Error! Concéntrate...", 20, 130);
    } else if (!this.gameOver) {
      ctx.fillStyle = "#a5ff7b";
      ctx.fillText("Haz clic en la operación que va AHORA.", 20, 130);
    }

    if (this.gameOver) {
      ctx.textAlign = "center";
      ctx.font = "28px Arial";
      ctx.fillStyle = this.win ? "#a5ff7b" : "#ffaaaa";
      const lines = this.message.split("\n");
      let y = h / 2 - 20;
      for (const line of lines) {
        ctx.fillText(line, w / 2, y);
        y += 28;
      }

      ctx.font = "18px Arial";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("Pulsa ENTER, ESPACIO o clic para continuar", w / 2, y + 20);
    }

    // Monstruos
    this._renderMonsters(ctx);

    // Niño asustado
    this._renderPlayer(ctx);

    // Expresión del monstruo activo
    this._renderCurrentExpression(ctx);

    // 🔹 Intro overlay encima de todo mientras el estado sea "intro"
    if (!this.gameFinished && this.state === "intro") {
      this._drawIntro(ctx);
    }
  }

  _drawIntro(ctx) {
    const W = this._getWidth();
    const H = this._getHeight();

    const panelW = Math.min(600, W * 0.85);
    const panelH = 240;
    const X = (W - panelW) / 2;
    const Y = (H - panelH) / 2;

    ctx.save();

    // Fondo semitransparente
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(X, Y, panelW, panelH);

    ctx.strokeStyle = "#ffeb3b";
    ctx.lineWidth = 2;
    ctx.strokeRect(X, Y, panelW, panelH);

    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    ctx.font = "24px Arial";
    ctx.fillStyle = "#ffe082";
    ctx.fillText("Jerarquía de Operaciones", W / 2, Y + 16);

    ctx.font = "18px Arial";
    ctx.fillStyle = "#ffffff";

    const lines = [
      "Una horda de monstruos viene hacia ti.",
      "Cada monstruo representa la expresión que ves arriba.",
      "Haz clic en la parte que se resuelve PRIMERO,",
      "siguiendo la jerarquía de operaciones:",
      "paréntesis → potencias → multiplicación/división → sumas/restas.",
      "Pierdes con 3 errores o si un monstruo te alcanza.",
    ];

    let textY = Y + 54;
    const lineH = 20;
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

  /* ======================== Entrada de usuario ========================= */

  _handlePointerDown(px, py) {
    if (this.gameOver) return;
    if (!this.currentExpr) return;
    if (this.time < this.inputLockedUntil) return;

    const tokens = this._lastTokens || [];
    const opTokens = tokens.filter((t) => t.kind === "op" && t.node);

    let clickedToken = null;
    for (const tok of opTokens) {
      if (
        px >= tok.x &&
        px <= tok.x + tok.width &&
        py <= tok.y &&
        py >= tok.y - tok.height
      ) {
        clickedToken = tok;
        break;
      }
    }

    if (!clickedToken) return;

    const clickedNode = clickedToken.node;
    const correctNode = this._findNextOperation(this.currentExpr);
    if (!correctNode) return;

    if (clickedNode === correctNode) {
      // ACIERTO
      this._onCorrectHit();
      this._applyOperation(correctNode);
    } else {
      // ERROR
      this.errors++;
      this.inputLockedUntil = this.time + this.errorCooldown;

      const m = this._getCurrentMonster();
      if (m) m.extraSpeed += 10;

      this.playSfx(this.sfxWrong, { volume: 0.5 });

      if (this.errors >= this.maxErrors) {
        this._onLose("Demasiados errores.");
      }
    }
  }

  _renderPlayer(ctx) {
    if (!this.playerImg) return;

    const img = this.playerImg;
    const w = img.width;
    const h = img.height;

    // Escalado para que no se vea enorme
    const targetHeight = 160; // alto deseado del personaje en pantalla
    const scale = Math.min(1, targetHeight / h);

    // Temblor vertical
    const shakeY = Math.sin(this.playerShakeTime * 20) * this.playerShakeAmp;

    const x = this.playerX;
    const y = this.playerY + shakeY;

    ctx.save();
    ctx.translate(x, y);

    const drawW = w * scale;
    const drawH = h * scale;

    // Lo dibujamos apoyado en el suelo (desde los pies hacia arriba)
    ctx.drawImage(
      img,
      -drawW / 2, // centrado en X
      -drawH, // pies en y
      drawW,
      drawH
    );

    ctx.restore();
  }

  /* ============================= Monstruos ============================= */
  _updateMonsters(dt) {
    for (let i = this.currentMonsterIndex; i < this.monsters.length; i++) {
      const m = this.monsters[i];
      const speed = this.baseMonsterSpeed + (m.extraSpeed || 0);
      m.x -= speed * dt;
    }
  }

  _getMonsterRenderInfo(index) {
    const m = this.monsters[index];
    if (!m) return null;

    const h = this._getHeight();
    const baseY = h - 20;
    const idx = index - this.currentMonsterIndex;

    const scale = this._monsterScale(m.exprRoot);
    const w = 80 * scale;
    const hBox = 80 * scale;
    const y = baseY - idx * 20 - hBox / 2;

    return { x: m.x, y, w, h: hBox, scale };
  }

  _renderMonsters(ctx) {
    for (let i = this.currentMonsterIndex; i < this.monsters.length; i++) {
      const info = this._getMonsterRenderInfo(i);
      if (!info) continue;

      ctx.save();
      ctx.translate(info.x, info.y);

      if (this.monsterImage) {
        // Cálculo del frame actual
        const frame = this.monsterFrameIndex;
        const fw = this.monsterFrameW;
        const fh = this.monsterFrameH;
        const cols = this.monsterCols;

        const sx = (frame % cols) * fw;
        const sy = Math.floor(frame / cols) * fh;

        ctx.drawImage(
          this.monsterImage,
          sx,
          sy,
          fw,
          fh,
          -info.w / 2,
          -info.h / 2,
          info.w,
          info.h
        );
      } else {
        // Fallback: rectángulo
        ctx.fillStyle = i === this.currentMonsterIndex ? "#ff3333" : "#4444aa";
        ctx.beginPath();
        ctx.rect(-info.w / 2, -info.h / 2, info.w, info.h);
        ctx.fill();

        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(-info.w / 4, -info.h / 4, 6, 0, Math.PI * 2);
        ctx.arc(info.w / 4, -info.h / 4, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  _syncMonsterSheetMetrics() {
    if (!this.monsterImage || !this.monsterCols || !this.monsterRows) return;

    const frameW = Math.floor(this.monsterImage.width / this.monsterCols);
    const frameH = Math.floor(this.monsterImage.height / this.monsterRows);

    if (frameW > 0) this.monsterFrameW = frameW;
    if (frameH > 0) this.monsterFrameH = frameH;
    this.monsterTotalFrames = this.monsterCols * this.monsterRows;
  }
  _monsterScale(exprRoot) {
    const complexity = this._expressionComplexity(exprRoot);
    const minScale = 0.4;
    const maxScale = 6.0;
    const normalized = Math.min(complexity / 6, 1); // 6 operaciones ~ tamaño completo
    return minScale + (maxScale - minScale) * normalized;
  }

  _expressionComplexity(node) {
    if (!node) return 0;
    if (node.type === "num") return 0;
    if (node.type === "group") return this._expressionComplexity(node.inner);
    if (node.type === "pow") {
      return (
        1 +
        this._expressionComplexity(node.base) +
        this._expressionComplexity(node.exp)
      );
    }
    if (node.type === "bin") {
      return (
        1 +
        this._expressionComplexity(node.left) +
        this._expressionComplexity(node.right)
      );
    }
    return 0;
  }

  _getCurrentMonster() {
    if (
      this.currentMonsterIndex < 0 ||
      this.currentMonsterIndex >= this.monsters.length
    ) {
      return null;
    }
    return this.monsters[this.currentMonsterIndex];
  }

  _defeatCurrentMonster() {
    const m = this._getCurrentMonster();
    if (!m) return;

    const info = this._getMonsterRenderInfo(this.currentMonsterIndex);
    if (info && typeof spawnHitFX === "function") {
      spawnHitFX(this, info.x, info.y, info.w * 1.2, info.h * 1.2);
    }
    this.playSfx(this.sfxKill, { volume: 0.7 });

    this.currentMonsterIndex++;

    if (this.currentMonsterIndex >= this.monsters.length) {
      this._onWin();
      return;
    }

    this.currentExpr = this.monsters[this.currentMonsterIndex].exprRoot;
  }

  _onCorrectHit() {
    const info = this._getMonsterRenderInfo(this.currentMonsterIndex);
    if (info && typeof spawnHitFX === "function") {
      spawnHitFX(this, info.x, info.y, info.w * 0.8, info.h * 0.8);
    }
    this.playSfx(this.sfxCorrect, { volume: 0.5 });
  }

  _onWin() {
    this.win = true;
    this._finishGame(false);
  }

  _onLose(_reason) {
    this.win = false;
    this._finishGame(true);
  }

  /* ======================= AST y generación ============================ */

  _num(v) {
    return { type: "num", value: v, parent: null };
  }

  _bin(op, left, right) {
    const node = { type: "bin", op, left, right, parent: null };
    left.parent = node;
    right.parent = node;
    return node;
  }

  _pow(base, exp) {
    const node = { type: "pow", base, exp, parent: null };
    base.parent = node;
    exp.parent = node;
    return node;
  }

  _group(inner) {
    const node = { type: "group", inner, parent: null };
    inner.parent = node;
    return node;
  }

  _rndInt(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  _rndChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // Patrones:
  // 1) A ± B(C ± D)
  // 2) A(B ± C) ± D
  // 3) A ± B(C[D] ± E)
  // 4) A ± B(C ± D[E])
  // 5) B(C ± D[E]) ± A
  _generateRandomExpressionAST() {
    const pattern = this._rndInt(1, 5);

    const A = this._num(this._rndInt(3, 20));
    const B = this._num(this._rndInt(2, 9));
    const C = this._num(this._rndInt(2, 9));
    const D = this._num(this._rndInt(2, 9));
    const E = this._num(this._rndInt(1, 9));

    const plusMinus = () => this._rndChoice(["+", "-"]);

    // Usamos exponentes solo cuando aparecen corchetes [ ]
    const maybeExponent = (n) => {
      if (Math.random() < 0.4) {
        const exp = this._num(this._rndInt(2, 3)); // cuadrado o cubo
        return this._pow(n, exp);
      }
      return n;
    };

    let root;

    switch (pattern) {
      case 1: {
        // 1) A ± B(C ± D)
        //    A ± B * (C ± D)
        const innerSum = this._bin(plusMinus(), C, D);
        const paren = this._group(innerSum);
        const right = this._bin("*", B, paren);
        root = this._bin(plusMinus(), A, right);
        break;
      }

      case 2: {
        // 2) A(B ± C) ± D
        //    A * (B ± C) ± D
        const inner = this._group(this._bin(plusMinus(), B, C));
        const left = this._bin("*", A, inner);
        root = this._bin(plusMinus(), left, D);
        break;
      }

      case 3: {
        // 3) A ± B(C[D] ± E)
        //    C[D] -> C * (D^?);   B * ( C * D^? ± E )
        const dExp = maybeExponent(D);
        const cTimesD = this._bin("*", C, dExp);
        const innerSum = this._bin(plusMinus(), cTimesD, E);
        const paren = this._group(innerSum);
        const right = this._bin("*", B, paren);
        root = this._bin(plusMinus(), A, right);
        break;
      }

      case 4: {
        // 4) A ± B(C ± D[E])
        //    D[E] -> D^?;   B * ( C ± D^? )
        const dPow = maybeExponent(D);
        const innerSum = this._bin(plusMinus(), C, dPow);
        const paren = this._group(innerSum);
        const right = this._bin("*", B, paren);
        root = this._bin(plusMinus(), A, right);
        break;
      }

      case 5: {
        // 5) B(C ± D[E]) ± A
        //    D[E] -> D^?;   B * ( C ± D^? ) ± A
        const dPow = maybeExponent(D);
        const innerSum = this._bin(plusMinus(), C, dPow);
        const paren = this._group(innerSum);
        const left = this._bin("*", B, paren);
        root = this._bin(plusMinus(), left, A);
        break;
      }
    }

    return this._simplifyGroups(root);
  }

  _isSingleNumber(node) {
    return node && node.type === "num";
  }

  /* ================ Jerarquía y aplicación de operaciones ============== */

  _findNextOperation(node) {
    if (!node) return null;

    if (node.type === "group") {
      return this._findNextOperation(node.inner);
    }

    if (node.type === "pow") {
      const opBase = this._findNextOperation(node.base);
      if (opBase) return opBase;
      const opExp = this._findNextOperation(node.exp);
      if (opExp) return opExp;

      if (node.base.type === "num" && node.exp.type === "num") {
        return node;
      }
      return null;
    }

    if (node.type === "bin") {
      const opLeft = this._findNextOperation(node.left);
      if (opLeft) return opLeft;
      const opRight = this._findNextOperation(node.right);
      if (opRight) return opRight;

      if (node.left.type === "num" && node.right.type === "num") {
        return node;
      }
      return null;
    }

    return null; // num
  }

  _applyOperation(opNode) {
    if (!opNode) return;

    let value = 0;

    if (opNode.type === "pow") {
      const base = opNode.base.value;
      const exp = opNode.exp.value;
      value = Math.pow(base, exp);
    } else if (opNode.type === "bin") {
      const a = opNode.left.value;
      const b = opNode.right.value;
      switch (opNode.op) {
        case "+":
          value = a + b;
          break;
        case "-":
          value = a - b;
          break;
        case "*":
          value = a * b;
          break;
        case "/":
          value = a / b;
          break;
        default:
          return;
      }
    } else {
      return;
    }

    const parent = opNode.parent;
    const newNode = this._num(value);

    if (!parent) {
      this.currentExpr = newNode;
    } else if (parent.type === "bin") {
      if (parent.left === opNode) parent.left = newNode;
      else parent.right = newNode;
      newNode.parent = parent;
    } else if (parent.type === "group") {
      parent.inner = newNode;
      newNode.parent = parent;
    } else if (parent.type === "pow") {
      if (parent.base === opNode) parent.base = newNode;
      else parent.exp = newNode;
      newNode.parent = parent;
    }

    const root = this._getRoot(newNode);
    this.currentExpr = this._simplifyGroups(root);
    const m = this._getCurrentMonster();
    if (m) m.exprRoot = this.currentExpr;
  }

  _getRoot(node) {
    let n = node;
    while (n && n.parent) n = n.parent;
    return n;
  }

  _simplifyGroups(node) {
    if (!node) return node;

    if (node.type === "group") {
      node.inner = this._simplifyGroups(node.inner);
      if (node.inner.type === "num") {
        const parent = node.parent;
        const inner = node.inner;
        inner.parent = parent;

        if (!parent) return inner;

        if (parent.type === "bin") {
          if (parent.left === node) parent.left = inner;
          else if (parent.right === node) parent.right = inner;
        } else if (parent.type === "pow") {
          if (parent.base === node) parent.base = inner;
          else if (parent.exp === node) parent.exp = inner;
        }
        return inner;
      }
      return node;
    }

    if (node.type === "pow") {
      node.base = this._simplifyGroups(node.base);
      node.exp = this._simplifyGroups(node.exp);
      return node;
    }

    if (node.type === "bin") {
      node.left = this._simplifyGroups(node.left);
      node.right = this._simplifyGroups(node.right);
      return node;
    }

    return node; // num
  }

  /* =================== Formato / dibujo de expresión ==================== */

  _renderCurrentExpression(ctx) {
    if (!this.currentExpr) return;

    const y = 200;
    const tokens = this._formatExpression(this.currentExpr, ctx, y);
    this._lastTokens = tokens;

    for (const tok of tokens) {
      ctx.font = tok.font;
      ctx.fillStyle = tok.kind === "op" ? "#ffd966" : "#ffffff";
      ctx.fillText(tok.text, tok.x, tok.y);
    }
  }

  _formatExpression(root, ctx, baseY) {
    const tokens = [];
    const font = "28px Arial";
    ctx.font = font;

    const pushToken = (text, kind, node) => {
      const width = ctx.measureText(text).width;
      const height = 28;
      tokens.push({ text, kind, node, width, height, font, x: 0, y: baseY });
    };

    const walk = (node) => {
      if (!node) return;
      if (node.type === "num") {
        pushToken(String(node.value), "num", null);
        return;
      }
      if (node.type === "group") {
        pushToken("(", "paren", null);
        walk(node.inner);
        pushToken(")", "paren", null);
        return;
      }
      if (node.type === "pow") {
        walk(node.base);
        pushToken("^", "op", node);
        walk(node.exp);
        return;
      }
      if (node.type === "bin") {
        walk(node.left);
        let sym;
        if (node.op === "*") sym = " × ";
        else if (node.op === "/") sym = " ÷ ";
        else sym = ` ${node.op} `;
        pushToken(sym, "op", node);
        walk(node.right);
        return;
      }
    };

    walk(root);

    const gap = 2;
    let totalWidth =
      tokens.reduce((s, t) => s + t.width, 0) + gap * (tokens.length - 1);
    let x = (this._getWidth() - totalWidth) / 2;

    for (const tok of tokens) {
      tok.x = x;
      tok.y = baseY;
      x += tok.width + gap;
    }

    return tokens;
  }

  /* ======================= Utilidades de tamaño ========================= */

  _getWidth() {
    if (this.game && this.game.width) return this.game.width;
    if (this.game && this.game.canvas) return this.game.canvas.width;
    if (this.game && this.game.ctx && this.game.ctx.canvas)
      return this.game.ctx.canvas.width;
    return 800;
  }

  _getHeight() {
    if (this.game && this.game.height) return this.game.height;
    if (this.game && this.game.canvas) return this.game.canvas.height;
    if (this.game && this.game.ctx && this.game.ctx.canvas)
      return this.game.ctx.canvas.height;
    return 600;
  }

  _finishGame(failed = false) {
    if (this.gameFinished) return;

    this.gameFinished = true;
    this.gameOver = true; // para que draw muestre el mensaje final
    this.exitDelay = 0.5; // pequeño delay antes de salir o reiniciar

    // 🔹 Recompensa: 1 hoja si completas la horda, 0 si pierdes
    const tier = failed ? 0 : 1;

    let gained = 0;
    if (window.MN_reportMinigameTier) {
      // Math Nightmare se encarga de sumar hojas y mostrar HUD
      gained = MN_reportMinigameTier("chaman_jerarquia", tier);
    }

    this.sheetsReward = gained;

    // Mensaje para mostrar en pantalla
    if (failed) {
      this.message = "Pesadilla numérica...\n" + `Hojas ganadas: ${gained}.`;
    } else {
      this.message = "¡Superaste a la horda!\n" + `Hojas ganadas: ${gained}.`;
    }

    // Evento opcional, por si lo quieres escuchar en overworld.js
    if (this.game && this.game.events) {
      this.game.events.emit("chaman_jerarquia_done", {
        win: !failed,
        sheetsReward: gained,
        failed,
      });
    }
  }
}

window.JerarquiaScene = JerarquiaScene;


