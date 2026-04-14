// js/areas/geometria/niveles/deduccionScene.js
// ===========================================================
// DeduccionScene - "Deduccion tipo Master Mind"
// Adivina un código de 3 letras (A..G, sin repetir) en un numero
// limitado de intentos.
//
// UI y flujo alineados con los niveles del area de geometria.
// ===========================================================

class DeduccionScene extends Scene {
  constructor(game, options = {}) {
    super(game);

    // Estado general
    this.state = "intro"; // intro | playing | round_transition | finished
    this.gameFinished = false;
    this.exitDelay = 0;
    this.win = false;
    this.message = "";
    this.sheetsReward = 0;

    // Config
    this.options = options;
    this.attemptLimits = options.attemptLimits ?? [8, 6, 5];
    this.maxAttempts = options.maxAttempts ?? this.attemptLimits[0] ?? 8;
    this.totalRounds = options.totalRounds ?? 3;
    this.codeLength = options.codeLength ?? 3;
    this.alphabet = options.alphabet ?? ["A", "B", "C", "D", "E", "F", "G"];

    // Juego
    this.secretCode = [];
    this.currentGuess = [];
    this.attempts = []; // { guess:string[], lettersCorrect:number, positionsCorrect:number }
    this.feedback = "";
    this.currentRound = 1;
    this.roundsSolved = 0;
    this.roundTransitionTimer = 0;
    this.roundTransitionMessage = "";

    // Input edge tracking
    this._prevKeys = {
      Enter: false,
      " ": false,
      Backspace: false,
      Escape: false,
      A: false,
      B: false,
      C: false,
      D: false,
      E: false,
      F: false,
      G: false,
    };
    this._prevMouseDown = false;

    // Layout
    this.leftPanel = { x: 60, y: 166, w: 560, h: 402 };
    this.rightPanel = { x: 640, y: 166, w: 320, h: 402 };
    this._clickRegions = [];

    // Sonidos
    this.sfxCorrect = options.sfxCorrect ?? "sfx_match";
    this.sfxWrong = options.sfxWrong ?? "sfx_error";
    this.sfxWin = options.sfxWin ?? "sfx_win";
    this.sfxLose = options.sfxLose ?? "sfx_rugido";
    this.sfxPage = options.sfxPage ?? "sfx_change_page";
  }

  playSfx(key, options = {}) {
    if (!key) return;
    const assets = this.game.assets;
    if (!assets || typeof assets.playSound !== "function") return;
    assets.playSound(key, options);
  }

  init() {
    window.MN_setLeafHUDVisible?.(false);
    window.MN_setInputMode?.("mouse");

    this.state = "intro";
    this.gameFinished = false;
    this.exitDelay = 0;
    this.win = false;
    this.message = "";
    this.sheetsReward = 0;

    this.secretCode = this._buildSecretCode();
    this.currentGuess = [];
    this.attempts = [];
    this.feedback = "";
    this.currentRound = 1;
    this.maxAttempts = this._getMaxAttemptsForRound(this.currentRound);
    this.roundsSolved = 0;
    this.roundTransitionTimer = 0;
    this.roundTransitionMessage = "";

    this._clickRegions = [];
    this._prevMouseDown = false;
    for (const k of Object.keys(this._prevKeys)) this._prevKeys[k] = false;
  }

  destroy() {
    this.clearAll?.();
  }

  update(dt) {
    super.update(dt);

    const input = this.game.input;
    const keys = input.keys || {};
    const mouse = input.mouse || { down: false, x: 0, y: 0 };
    const isDown = (key) => !!keys[key];
    const isJustPressed = (key) => isDown(key) && !this._prevKeys[key];
    const mouseJustPressed = !!mouse.down && !this._prevMouseDown;

    const commitKeys = () => {
      for (const k of Object.keys(this._prevKeys)) this._prevKeys[k] = isDown(k);
      this._prevMouseDown = !!mouse.down;
    };

    if (this.gameFinished) {
      if (this.exitDelay > 0) {
        this.exitDelay -= dt;
        commitKeys();
        return;
      }

      if (isJustPressed("Enter") || isJustPressed(" ") || mouseJustPressed) {
        window.MN_setInputMode?.(null);
        window.MN_setLeafHUDVisible?.(true);
        window.MN_APP?.toOverworld?.();
      }
      commitKeys();
      return;
    }

    if (this.state === "intro") {
      if (isJustPressed("Enter") || isJustPressed(" ") || mouseJustPressed) {
        this.state = "playing";
        this.maxAttempts = this._getMaxAttemptsForRound(this.currentRound);
        this.playSfx(this.sfxPage, { volume: 0.5 });
      }
      commitKeys();
      return;
    }

    if (this.state === "round_transition") {
      this.roundTransitionTimer -= dt;
      if (this.roundTransitionTimer <= 0) this._startNextRound();
      commitKeys();
      return;
    }

    if (isJustPressed("Escape")) {
      window.MN_APP?.toOverworld?.();
      commitKeys();
      return;
    }

    if (this.state === "playing") {
      if (mouseJustPressed) this._handleClick(mouse.x, mouse.y);

      for (const letter of this.alphabet) {
        if (isJustPressed(letter)) this._appendLetter(letter);
      }

      if (isJustPressed("Backspace")) this._removeLastLetter();

      if (isJustPressed("Enter")) this._submitGuess();
    }

    commitKeys();
  }

  _buildSecretCode() {
    const pool = [...this.alphabet];
    const code = [];
    while (code.length < this.codeLength && pool.length > 0) {
      const idx = Math.floor(Math.random() * pool.length);
      code.push(pool[idx]);
      pool.splice(idx, 1);
    }
    return code;
  }

  _getMaxAttemptsForRound(roundNumber = this.currentRound) {
    const limits = Array.isArray(this.attemptLimits) ? this.attemptLimits : [];
    const index = Math.max(0, (roundNumber | 0) - 1);
    return limits[index] ?? limits[limits.length - 1] ?? 8;
  }

  _handleClick(mx, my) {
    for (let i = this._clickRegions.length - 1; i >= 0; i--) {
      const reg = this._clickRegions[i];
      if (this._pointInRect(mx, my, reg.rect)) {
        reg.onClick?.();
        return;
      }
    }
  }

  _appendLetter(letter) {
    if (this.currentGuess.length >= this.codeLength) return;
    if (this.currentGuess.includes(letter)) {
      this.feedback = "No repitas letras en el mismo intento.";
      this.playSfx(this.sfxWrong, { volume: 0.3 });
      return;
    }

    this.currentGuess.push(letter);
    this.feedback = "";
    this.playSfx(this.sfxPage, { volume: 0.35 });
  }

  _removeLastLetter() {
    if (!this.currentGuess.length) return;
    this.currentGuess.pop();
    this.feedback = "";
    this.playSfx(this.sfxPage, { volume: 0.25 });
  }

  _submitGuess() {
    if (this.currentGuess.length !== this.codeLength) {
      this.feedback = `Completa ${this.codeLength} letras antes de enviar.`;
      this.playSfx(this.sfxWrong, { volume: 0.45 });
      return;
    }

    let lettersCorrect = 0;
    let positionsCorrect = 0;

    for (let i = 0; i < this.currentGuess.length; i++) {
      const letter = this.currentGuess[i];
      if (this.secretCode.includes(letter)) lettersCorrect++;
      if (this.secretCode[i] === letter) positionsCorrect++;
    }

    this.attempts.push({
      guess: [...this.currentGuess],
      lettersCorrect,
      positionsCorrect,
    });

    if (positionsCorrect === this.codeLength) {
      this._completeRound();
      return;
    }

    if (this.attempts.length >= this.maxAttempts) {
      this._finishGame(true);
      return;
    }

    this.currentGuess = [];
    this.feedback = `Letras correctas: ${lettersCorrect}. Posiciones correctas: ${positionsCorrect}.`;
    this.playSfx(this.sfxWrong, { volume: 0.65 });
  }

  _completeRound() {
    this.roundsSolved += 1;

    if (this.currentRound >= this.totalRounds) {
      this._finishGame(false);
      return;
    }

    this.state = "round_transition";
    this.roundTransitionTimer = 1.15;
    this.roundTransitionMessage =
      `Código ${this.currentRound} resuelto. Prepárate para la ronda ${this.currentRound + 1}.`;
    this.feedback = "";
    this.playSfx(this.sfxCorrect, { volume: 0.7 });
  }

  _startNextRound() {
    this.currentRound += 1;
    this.maxAttempts = this._getMaxAttemptsForRound(this.currentRound);
    this.secretCode = this._buildSecretCode();
    this.currentGuess = [];
    this.attempts = [];
    this.feedback = "";
    this.roundTransitionMessage = "";
    this.state = "playing";
  }

  _finishGame(failed = false) {
    if (this.gameFinished) return;

    this.gameFinished = true;
    this.state = "finished";
    this.exitDelay = 0.45;
    this.win = !failed && this.roundsSolved >= this.totalRounds;

    let tier = 0;
    if (this.roundsSolved >= this.totalRounds) tier = 2;
    else if (this.roundsSolved >= Math.max(1, this.totalRounds - 1)) tier = 1;
    let gained = 0;
    if (window.MN_reportMinigameTier) {
      gained = window.MN_reportMinigameTier("deduccion", tier);
    }
    this.sheetsReward = gained;

    const codeText = this.secretCode.join(" ");
    const tries = this.attempts.length;

    if (this.win) {
      this.message =
        "Los 3 códigos fueron deducidos.\n" +
        `Rondas superadas: ${this.roundsSolved}/${this.totalRounds}\n` +
        `Hojas ganadas: ${gained}.`;
      this.playSfx(this.sfxWin, { volume: 0.7 });
    } else if (tier >= 1) {
      this.message =
        "No descifraste los 3 códigos, pero si resolviste lo suficiente.\n" +
        `Rondas superadas: ${this.roundsSolved}/${this.totalRounds}\n` +
        `Ronda actual: ${this.currentRound}/${this.totalRounds}\n` +
        `Intentos: ${tries}/${this.maxAttempts}\n` +
        `Código secreto: ${codeText}\n` +
        `Hojas ganadas: ${gained}.`;
      this.playSfx(this.sfxWin, { volume: 0.62 });
    } else {
      this.message =
        "Te quedaste sin intentos en esta ronda.\n" +
        `Rondas superadas: ${this.roundsSolved}/${this.totalRounds}\n` +
        `Ronda actual: ${this.currentRound}/${this.totalRounds}\n` +
        `Intentos: ${tries}/${this.maxAttempts}\n` +
        `Código secreto: ${codeText}\n` +
        `Hojas ganadas: ${gained}.`;
      this.playSfx(this.sfxLose, { volume: 0.7 });
    }
  }

  draw(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    this._drawBackground(ctx, W, H);
    this._drawFrame(ctx, W, H);
    this._drawHUD(ctx, W);

    if (this.state === "intro") {
      this._drawIntro(ctx, W, H);
      return;
    }

    if (this.state === "playing" || this.state === "round_transition") {
      this._drawTitle(ctx, W);
      this._drawPanels(ctx);
      this._drawBoardPanel(ctx);
      this._drawControlPanel(ctx);
      this._drawBottomBar(ctx, W);
      if (this.state === "round_transition") this._drawRoundTransition(ctx, W, H);
      return;
    }

    if (this.state === "finished") {
      this._drawEndMessage(ctx, W, H);
    }
  }

  _drawBackground(ctx, W, H) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#0a0f1d");
    g.addColorStop(1, "#151f3a");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const bg = this.game.assets?.getImage?.("bg_deduccion_castillo");
    if (bg) {
      ctx.save();
      ctx.globalAlpha = 0.54;
      ctx.drawImage(bg, 0, 0, W, H);
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.strokeStyle = "#9eb4ff";
    for (let x = 0; x <= W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y <= H; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawFrame(ctx, W, H) {
    this._roundRect(ctx, 26, 22, W - 52, H - 44, 18, "rgba(15,18,32,0)");
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(225,232,255,0.28)";
    ctx.stroke();
  }

  _drawHUD(ctx, W) {
    const attemptsUsed = this.attempts.length;
    const attemptsLeft = Math.max(0, this.maxAttempts - attemptsUsed);

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(16, 12, 448, 52);
    ctx.strokeStyle = "#7aa7ff";
    ctx.lineWidth = 2;
    ctx.strokeRect(16, 12, 448, 52);

    ctx.font = "16px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`Intentos: ${attemptsUsed}/${this.maxAttempts}`, 28, 30);
    ctx.fillText(`Código: ${this.codeLength} letras`, 28, 48);
    ctx.fillText(`Ronda: ${this.currentRound}/${this.totalRounds}`, 170, 48);

    ctx.fillText("Restantes:", 250, 30);
    for (let i = 0; i < this.maxAttempts; i++) {
      ctx.fillStyle = i < attemptsLeft ? "#ff4d6d" : "rgba(255,255,255,0.25)";
      this._drawHeart(ctx, 338 + i * 14, 22, 10);
    }
    ctx.restore();

  }

  _drawIntro(ctx, W, H) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 38px Arial";
    ctx.fillText("El código de Euclides", W / 2, H * 0.26);

    ctx.font = "22px Arial";
    ctx.fillStyle = "#d8e6ff";
    ctx.fillText("Descubre 3 códigos secretos de 3 letras (A-G).", W / 2, H * 0.39);
    ctx.fillText("Cada intento te da pistas:", W / 2, H * 0.45);
    ctx.fillText("- Letras: cuántas están en el código", W / 2, H * 0.50);
    ctx.fillText("- Posiciones: cuántas están en el lugar correcto", W / 2, H * 0.55);
    ctx.fillText("No se trata de adivinar.", W / 2, H * 0.62);
    ctx.fillText("Usa cada resultado para descartar opciones", W / 2, H * 0.68);
    ctx.fillText("y acercarte paso a paso a la respuesta.", W / 2, H * 0.73);

    ctx.fillStyle = "#ffffff";
    ctx.fillText("Pulsa ENTER, ESPACIO o clic para comenzar.", W / 2, H * 0.83);
    ctx.restore();
  }

  _drawTitle(ctx, W) {
    ctx.save();
    ctx.textAlign = "center";

    ctx.fillStyle = "#eef2ff";
    ctx.font = "bold 30px Arial";
    ctx.fillText("El código de Euclides", W * 0.5, 94);

    ctx.font = "17px Arial";
    ctx.fillStyle = "#a9b8df";
    ctx.fillText(
      "Meta: usa las claves de cada intento para deducir los 3 códigos secretos.",
      W * 0.5,
      124,
    );

    ctx.restore();
  }

  _drawPanels(ctx) {
    this._roundRect(
      ctx,
      this.leftPanel.x,
      this.leftPanel.y,
      this.leftPanel.w,
      this.leftPanel.h,
      16,
      "rgba(21,26,46,0.16)",
    );
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.stroke();

    this._roundRect(
      ctx,
      this.rightPanel.x,
      this.rightPanel.y,
      this.rightPanel.w,
      this.rightPanel.h,
      16,
      "rgba(21,26,46,0.36)",
    );
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.stroke();
  }

  _drawBoardPanel(ctx) {
    ctx.save();
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    const x = this.leftPanel.x;
    const y = this.leftPanel.y;

    ctx.font = "bold 22px Arial";
    ctx.fillStyle = "#dce7ff";
    ctx.fillText(`Tablero de ronda ${this.currentRound}`, x + 18, y + 34);

    ctx.font = "15px Arial";
    ctx.fillStyle = "#a9b8df";
    ctx.fillText("Letras: total de letras correctas", x + 18, y + 58);
    ctx.fillText("Posiciones: letras correctas en posicion exacta", x + 18, y + 78);

    const tableX = x + 18;
    const tableY = y + 102;
    const tableW = this.leftPanel.w - 36;
    const rowH = 34;

    ctx.fillStyle = "rgba(255,255,255,0.045)";
    ctx.fillRect(tableX, tableY, tableW, rowH);

    ctx.font = "bold 14px Arial";
    ctx.fillStyle = "#d8e6ff";
    ctx.fillText("#", tableX + 10, tableY + rowH / 2 + 1);
    ctx.fillText("Código", tableX + 46, tableY + rowH / 2 + 1);
    ctx.fillText("Letras", tableX + 280, tableY + rowH / 2 + 1);
    ctx.fillText("Posiciones", tableX + 390, tableY + rowH / 2 + 1);

    for (let i = 0; i < this.maxAttempts; i++) {
      const ry = tableY + rowH + i * rowH;
      const row = this.attempts[i] || null;
      const active = i === this.attempts.length && !this.gameFinished;

      ctx.fillStyle = active ? "rgba(123,223,242,0.08)" : "rgba(255,255,255,0.018)";
      ctx.fillRect(tableX, ry, tableW, rowH - 2);

      ctx.font = "14px Arial";
      ctx.fillStyle = "#d8e6ff";
      ctx.fillText(String(i + 1), tableX + 10, ry + rowH / 2);

      if (row) {
        this._drawGuessChips(ctx, row.guess, tableX + 46, ry + 5);

        ctx.font = "bold 16px Arial";
        ctx.fillStyle = "#ffd166";
        ctx.fillText(String(row.lettersCorrect), tableX + 294, ry + rowH / 2);

        ctx.fillStyle = row.positionsCorrect === this.codeLength ? "#63d471" : "#7bdff2";
        ctx.fillText(String(row.positionsCorrect), tableX + 424, ry + rowH / 2);
      } else {
        this._drawGuessSlots(ctx, tableX + 46, ry + 5, "rgba(255,255,255,0.22)");
        ctx.font = "14px Arial";
        ctx.fillStyle = "#6b7cae";
        ctx.fillText("-", tableX + 294, ry + rowH / 2);
        ctx.fillText("-", tableX + 424, ry + rowH / 2);
      }
    }

    ctx.restore();
  }

  _drawControlPanel(ctx) {
    this._clickRegions = [];

    const x = this.rightPanel.x;
    const y = this.rightPanel.y;

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font = "bold 22px Arial";
    ctx.fillStyle = "#dce7ff";
    ctx.fillText("Controles", x + this.rightPanel.w / 2, y + 34);

    ctx.font = "15px Arial";
    ctx.fillStyle = "#a9b8df";
    ctx.fillText("Elige 3 letras distintas", x + this.rightPanel.w / 2, y + 58);

    const startX = x + 24;
    const startY = y + 80;
    const btnW = 62;
    const btnH = 46;
    const gapX = 10;
    const gapY = 10;
    const cols = 4;

    for (let i = 0; i < this.alphabet.length; i++) {
      const letter = this.alphabet[i];
      const r = Math.floor(i / cols);
      const c = i % cols;
      const bx = startX + c * (btnW + gapX);
      const by = startY + r * (btnH + gapY);
      const selected = this.currentGuess.includes(letter);
      const blocked = this.currentGuess.length >= this.codeLength && !selected;

      const fill = selected
        ? "rgba(123,223,242,0.26)"
        : blocked
          ? "rgba(255,255,255,0.05)"
          : "rgba(255,255,255,0.1)";
      this._roundRect(ctx, bx, by, btnW, btnH, 10, fill);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = selected
        ? "rgba(123,223,242,0.9)"
        : blocked
          ? "rgba(255,255,255,0.08)"
          : "rgba(255,255,255,0.18)";
      ctx.stroke();

      ctx.font = "bold 26px Arial";
      ctx.fillStyle = blocked ? "#8f9fca" : "#eef2ff";
      ctx.fillText(letter, bx + btnW / 2, by + btnH / 2 + 1);

      if (!blocked) {
        this._clickRegions.push({
          id: `letter:${letter}`,
          rect: { x: bx, y: by, w: btnW, h: btnH },
          onClick: () => this._appendLetter(letter),
        });
      }
    }

    const previewY = y + 208;
    ctx.textAlign = "left";
    ctx.font = "bold 15px Arial";
    ctx.fillStyle = "#d8e6ff";
    ctx.fillText("Intento actual:", x + 24, previewY);
    this._drawGuessSlots(ctx, x + 24, previewY + 14, "rgba(123,223,242,0.7)");
    this._drawGuessChips(ctx, this.currentGuess, x + 24, previewY + 14);

    const btnBack = { x: x + 24, y: y + 292, w: this.rightPanel.w - 48, h: 42 };
    this._roundRect(ctx, btnBack.x, btnBack.y, btnBack.w, btnBack.h, 12, "rgba(255,209,102,0.12)");
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(255,209,102,0.62)";
    ctx.stroke();
    ctx.fillStyle = "#ffd166";
    ctx.fillText("Borrar ultima (Backspace)", btnBack.x + btnBack.w / 2, btnBack.y + btnBack.h / 2 + 1);
    this._clickRegions.push({
      id: "back",
      rect: btnBack,
      onClick: () => this._removeLastLetter(),
    });

    const canSubmit = this.currentGuess.length === this.codeLength;
    const btnSubmit = { x: x + 24, y: y + 348, w: this.rightPanel.w - 48, h: 42 };
    this._roundRect(
      ctx,
      btnSubmit.x,
      btnSubmit.y,
      btnSubmit.w,
      btnSubmit.h,
      12,
      canSubmit ? "rgba(99,212,113,0.1)" : "rgba(255,255,255,0.08)",
    );
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = canSubmit ? "rgba(99,212,113,0.72)" : "rgba(255,255,255,0.24)";
    ctx.stroke();
    ctx.fillStyle = canSubmit ? "#63d471" : "#8f9fca";
    ctx.fillText("Probar código (ENTER)", btnSubmit.x + btnSubmit.w / 2, btnSubmit.y + btnSubmit.h / 2 + 1);

    if (canSubmit) {
      this._clickRegions.push({
        id: "submit",
        rect: btnSubmit,
        onClick: () => this._submitGuess(),
      });
    }

    ctx.restore();
  }

  _drawBottomBar(ctx, W) {
    const barX = 72;
    const barY = 590;
    const barW = W - 144;
    const barH = 64;

    this._roundRect(ctx, barX, barY, barW, barH, 12, "rgba(6,9,18,0.48)");
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.stroke();

    ctx.save();
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    ctx.font = "16px Arial";
    ctx.fillStyle = "#d8e6ff";
    ctx.fillText("Teclado: A-G agrega letras, Backspace borra, Enter envia.", barX + 16, barY + 22);

    ctx.font = "bold 18px Arial";
    if (this.feedback) {
      ctx.fillStyle = this.feedback.includes("correctas") ? "#ffd166" : "#d8e6ff";
      ctx.fillText(this._ellipsis(this.feedback, 92), barX + 16, barY + 46);
    } else {
      ctx.fillStyle = "#7bdff2";
      ctx.fillText("Construye tu intento y envialo.", barX + 16, barY + 46);
    }

    ctx.restore();
  }

  _drawRoundTransition(ctx, W, H) {
    ctx.save();
    this._roundRect(ctx, 190, 278, W - 380, 104, 16, "rgba(7,10,20,0.58)");
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(123,223,242,0.58)";
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#eef2ff";
    ctx.font = "bold 26px Arial";
    ctx.fillText(this.roundTransitionMessage, W / 2, H / 2);
    ctx.restore();
  }

  _drawEndMessage(ctx, W, H) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    this._roundRect(ctx, 152, 184, W - 304, 308, 18, "rgba(7,10,20,0.68)");
    ctx.lineWidth = 2;
    ctx.strokeStyle = this.win ? "#63d471" : "#ef233c";
    ctx.stroke();

    ctx.font = "bold 38px Arial";
    ctx.fillStyle = this.win ? "#63d471" : "#ffd166";
    ctx.fillText(this.win ? "Código descifrado" : "Código no resuelto", W / 2, 244);

    const lines = (this.message || "").split("\n");
    ctx.font = "24px Arial";
    ctx.fillStyle = "#eef2ff";
    let y = 302;
    for (const line of lines) {
      ctx.fillText(line, W / 2, y);
      y += 38;
    }

    ctx.font = "20px Arial";
    ctx.fillStyle = "#7bdff2";
    ctx.fillText("Pulsa ENTER, ESPACIO o clic para volver.", W / 2, 460);
    ctx.restore();
  }

  _drawGuessSlots(ctx, x, y, strokeStyle) {
    const w = 54;
    const h = 24;
    const gap = 8;

    for (let i = 0; i < this.codeLength; i++) {
      this._roundRect(ctx, x + i * (w + gap), y, w, h, 8, "rgba(255,255,255,0.04)");
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = strokeStyle;
      ctx.stroke();
    }
  }

  _drawGuessChips(ctx, guess, x, y) {
    const w = 54;
    const h = 24;
    const gap = 8;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let i = 0; i < guess.length; i++) {
      this._roundRect(ctx, x + i * (w + gap), y, w, h, 8, "rgba(123,223,242,0.2)");
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = "rgba(123,223,242,0.82)";
      ctx.stroke();

      ctx.font = "bold 17px Arial";
      ctx.fillStyle = "#eef2ff";
      ctx.fillText(guess[i], x + i * (w + gap) + w / 2, y + h / 2 + 1);
    }
  }

  _ellipsis(str, max = 64) {
    if (!str) return "";
    if (str.length <= max) return str;
    return str.slice(0, max - 1) + "...";
  }

  _pointInRect(px, py, r) {
    return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
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

  _drawHeart(ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + s / 4);
    ctx.bezierCurveTo(x, y, x - s / 2, y, x - s / 2, y + s / 4);
    ctx.bezierCurveTo(x - s / 2, y + s / 2, x, y + s * 0.8, x, y + s);
    ctx.bezierCurveTo(x, y + s * 0.8, x + s / 2, y + s / 2, x + s / 2, y + s / 4);
    ctx.bezierCurveTo(x + s / 2, y, x, y, x, y + s / 4);
    ctx.fill();
  }
}

window.DeduccionScene = DeduccionScene;
