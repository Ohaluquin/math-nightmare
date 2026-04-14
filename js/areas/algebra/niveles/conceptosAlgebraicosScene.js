// js/areas/algebra/niveles/conceptosAlgebraicosScene.js
// ===========================================================
// ConceptosAlgebraicosScene - "Anagramas de Algebra"
// Integrado al flujo de Math Nightmare (Scene + Overworld).
// Usa palabras de assets/algebra/data/palabras.js
// ===========================================================

class ConceptosAlgebraicosScene extends Scene {
  constructor(game, options = {}) {
    super(game);

    // Estado general
    this.state = "intro"; // intro | playing | finished
    this.gameFinished = false;
    this.exitDelay = 0;
    this.win = false;
    this.message = "";
    this.sheetsReward = 0;

    // Config
    this.maxErrors = options.maxErrors ?? 3;
    this.totalRounds = options.totalRounds ?? 10;
    this.timeLimit = options.timeLimit ?? 170;
    this.passPenalty = options.passPenalty ?? 4;
    this.wrongTimePenalty = options.wrongTimePenalty ?? 1;
    this.revealHint2After = options.revealHint2After ?? 1;

    // Juego
    this.pool = [];
    this.runWords = [];
    this.current = null; // { palabra, pista1, pista2 }
    this.scrambled = "";
    this.answerInput = "";
    this.feedback = "";

    this.roundIndex = 0;
    this.solved = 0;
    this.errors = 0;
    this.timeLeft = this.timeLimit;
    this.streak = 0;
    this.score = 0;

    this.hintLevel = 1;
    this.wordMistakes = 0;

    // UI
    this.leftPanel = { x: 60, y: 160, w: 560, h: 420 };
    this.rightPanel = { x: 640, y: 160, w: 320, h: 420 };
    this._clickRegions = [];
    this.maxInputLength = 20;

    // Render assets
    this.bgImage = null;

    // Input edge tracking
    this._prevKeys = {
      Enter: false,
      Backspace: false,
      " ": false,
      Escape: false,
      A: false,
      B: false,
      C: false,
      D: false,
      E: false,
      F: false,
      G: false,
      H: false,
      I: false,
      J: false,
      K: false,
      L: false,
      M: false,
      N: false,
      O: false,
      P: false,
      Q: false,
      R: false,
      S: false,
      T: false,
      U: false,
      V: false,
      W: false,
      X: false,
      Y: false,
      Z: false,
      0: false,
      1: false,
      2: false,
      3: false,
      4: false,
      5: false,
      6: false,
      7: false,
      8: false,
      9: false,
      Numpad0: false,
      Numpad1: false,
      Numpad2: false,
      Numpad3: false,
      Numpad4: false,
      Numpad5: false,
      Numpad6: false,
      Numpad7: false,
      Numpad8: false,
      Numpad9: false,
    };
    this._prevMouseDown = false;
    this._prevLetters = {};

    // Sonidos
    this.sfxCorrect = options.sfxCorrect ?? "sfx_match";
    this.sfxWrong = options.sfxWrong ?? "sfx_error";
    this.sfxWin = options.sfxWin ?? "sfx_win";
    this.sfxLose = options.sfxLose ?? "sfx_loose";
    this.sfxPage = options.sfxPage ?? "sfx_change_page";
    this.sfxType = options.sfxType ?? "text_blip";
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

    this.roundIndex = 0;
    this.solved = 0;
    this.errors = 0;
    this.timeLeft = this.timeLimit;
    this.streak = 0;
    this.score = 0;

    this.answerInput = "";
    this.feedback = "";
    this.hintLevel = 1;
    this.wordMistakes = 0;
    this._clickRegions = [];

    this.pool = this._loadWordsPool();
    this.runWords = this._pickN(this.pool, this.totalRounds);
    this.current = null;
    this.scrambled = "";

    this._prevMouseDown = false;
    for (const k of Object.keys(this._prevKeys)) this._prevKeys[k] = false;
    for (let code = 65; code <= 90; code++) {
      const upper = String.fromCharCode(code);
      this._prevLetters[upper] = false;
    }

    const A = this.game.assets;
    this.bgImage =
      (A && A.getImage && A.getImage("bg_anagramas")) ||
      (A && A.getImage && A.getImage("bg_lenguaje_natural")) ||
      (A && A.getImage && A.getImage("mn_bg_signos")) ||
      null;
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
      for (let code = 65; code <= 90; code++) {
        const upper = String.fromCharCode(code);
        this._prevLetters[upper] = this._isLetterDown(keys, upper);
      }
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
        this.playSfx(this.sfxPage, { volume: 0.5 });
        this._nextWord();
      }
      commitKeys();
      return;
    }

    if (isJustPressed("Escape")) {
      window.MN_APP?.toOverworld?.();
      commitKeys();
      return;
    }

    if (this.state === "playing") {
      this.timeLeft = Math.max(0, this.timeLeft - dt);
      if (this.timeLeft <= 0) {
        this._finishGame(true, "Se acabo el tiempo.");
        commitKeys();
        return;
      }

      if (mouseJustPressed) this._handleClick(mouse.x, mouse.y);

      for (let code = 65; code <= 90; code++) {
        const upper = String.fromCharCode(code);
        if (this._isLetterJustPressed(keys, upper)) this._appendChar(upper.toLowerCase());
      }
      for (let d = 0; d <= 9; d++) {
        if (isJustPressed(String(d)) || isJustPressed(`Numpad${d}`)) {
          this._appendChar(String(d));
        }
      }

      if (isJustPressed("Backspace")) this._backspace();
      if (isJustPressed("Enter")) this._submitAnswer();
      if (isJustPressed(" ")) this._passWord();
    }

    commitKeys();
  }

  _loadWordsPool() {
    const packs = window.PALABRAS_PACKS || {};
    const fromPack = Array.isArray(packs.algebra) ? packs.algebra : null;
    const fallback = Array.isArray(window.PALABRAS_BASE) ? window.PALABRAS_BASE : [];
    const list = (fromPack || fallback)
      .map((item) => this._normalizeWordItem(item))
      .filter((w) => !!w.palabra && w.palabra.length >= 4);
    return list;
  }

  _normalizeWordItem(item) {
    if (typeof item === "string") {
      return { palabra: item, pista1: "", pista2: "" };
    }
    return {
      palabra: String(item?.palabra || "").trim().toLowerCase(),
      pista1: String(item?.pista1 || item?.pista || "").trim(),
      pista2: String(item?.pista2 || "").trim(),
    };
  }

  _pickN(arr, n) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, Math.min(n, copy.length));
  }

  _nextWord() {
    if (this.roundIndex >= this.totalRounds || !this.runWords.length) {
      this._finishGame(false);
      return;
    }

    const next = this.runWords.pop();
    if (!next) {
      this._finishGame(false);
      return;
    }

    this.current = next;
    this.scrambled = this._scrambleWord(next.palabra);
    this.answerInput = "";
    this.feedback = "";
    this.hintLevel = 1;
    this.wordMistakes = 0;
    this.maxInputLength = Math.max(20, String(next.palabra || "").length);
  }

  _scrambleWord(word) {
    const chars = Array.from(word);
    if (chars.length <= 1) return word;

    let out = word;
    let guard = 0;
    while (out === word && guard++ < 30) {
      for (let i = chars.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        [chars[i], chars[j]] = [chars[j], chars[i]];
      }
      out = chars.join("");
    }
    return out;
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

  _appendChar(ch) {
    if (this.answerInput.length >= this.maxInputLength) return;
    this.answerInput += ch;
    this.feedback = "";
    this.playSfx(this.sfxType, { volume: 0.28 });
  }

  _backspace() {
    if (!this.answerInput.length) return;
    this.answerInput = this.answerInput.slice(0, -1);
    this.feedback = "";
  }

  _clearInput() {
    this.answerInput = "";
    this.feedback = "";
  }

  _reshuffleCurrent() {
    if (!this.current) return;
    const prev = this.scrambled;
    let next = this._scrambleWord(this.current.palabra);
    let tries = 0;
    while (next === prev && tries++ < 6) {
      next = this._scrambleWord(this.current.palabra);
    }
    this.scrambled = next;
    this.feedback = "Letras revolvidas.";
    this.playSfx(this.sfxPage, { volume: 0.35 });
  }

  _submitAnswer() {
    if (!this.current) return;
    const val = this._normKey(this.answerInput);
    if (!val) {
      this.feedback = "Escribe tu respuesta.";
      return;
    }

    const target = this._normKey(this.current.palabra);
    if (val === target) {
      this.streak = Math.min(this.streak + 1, 5);
      const bonus = [0, 1, 2, 4, 6, 9][this.streak] || 0;
      const gained = this.current.palabra.length + bonus;
      this.score += gained;
      this.solved += 1;
      this.roundIndex += 1;

      this.feedback = `Correcto. +${gained} puntos.`;
      this.playSfx(this.sfxCorrect, { volume: 0.6 });
      this._nextWord();
      return;
    }

    this.errors += 1;
    this.wordMistakes += 1;
    this.streak = 0;
    this.timeLeft = Math.max(0, this.timeLeft - this.wrongTimePenalty);

    if (this.wordMistakes >= this.revealHint2After && this.current.pista2) {
      this.hintLevel = 2;
      this.feedback = "Incorrecto. Se desbloqueo la pista 2.";
    } else {
      this.feedback = "Incorrecto. Intenta de nuevo.";
    }

    this.playSfx(this.sfxWrong, { volume: 0.65 });

    if (this.errors >= this.maxErrors) {
      this._finishGame(true, "Te quedaste sin vidas.");
    }
  }

  _passWord() {
    if (!this.current) return;

    this.streak = 0;
    this.roundIndex += 1;
    this.timeLeft = Math.max(0, this.timeLeft - this.passPenalty);
    this.feedback = `Pasaste palabra. Era: ${this.current.palabra}.`;

    this.playSfx(this.sfxPage, { volume: 0.45 });

    if (this.timeLeft <= 0) {
      this._finishGame(true, "Se acabo el tiempo.");
      return;
    }

    this._nextWord();
  }

  _finishGame(failed = false, reason = "") {
    if (this.gameFinished) return;

    this.gameFinished = true;
    this.state = "finished";
    this.exitDelay = 0.45;
    this.win = !failed;

    const tier = failed ? 0 : 1;
    let gained = 0;
    if (window.MN_reportMinigameTier) {
      gained = window.MN_reportMinigameTier("anagrama", tier);
    }
    this.sheetsReward = gained;

    if (this.win) {
      this.message =
        "Reto completado.\n" +
        `Aciertos: ${this.solved}/${this.totalRounds}.\n` +
        `Errores: ${this.errors}/${this.maxErrors}.\n` +
        `Puntaje: ${this.score}.\n` +
        `Hojas ganadas: ${gained}.`;
      this.playSfx(this.sfxWin, { volume: 0.7 });
    } else {
      const why = reason ? `${reason}\n` : "";
      this.message =
        `${why}` +
        `Aciertos: ${this.solved}/${this.totalRounds}.\n` +
        `Errores: ${this.errors}/${this.maxErrors}.\n` +
        `Puntaje: ${this.score}.\n` +
        `Hojas ganadas: ${gained}.`;
      this.playSfx(this.sfxLose, { volume: 0.7 });
    }
  }

  draw(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    this._drawBackground(ctx, W, H);
    this._drawHUD(ctx, W);

    if (this.state === "intro") {
      this._drawIntro(ctx, W, H);
      return;
    }

    if (this.state === "playing") {
      this._clickRegions = [];
      this._drawTitle(ctx, W);
      this._drawPanels(ctx);
      this._drawWordPanel(ctx);
      this._drawControlsPanel(ctx);
      this._drawBottomBar(ctx, W);
      return;
    }

    if (this.state === "finished") {
      this._drawEndMessage(ctx, W, H);
    }
  }

  _drawBackground(ctx, W, H) {
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

    ctx.fillStyle = "rgba(0,0,0,0.58)";
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "rgba(196,220,255,0.08)";
    for (let y = 0; y <= H; y += 38) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
  }

  _drawHUD(ctx, W) {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.62)";
    ctx.fillRect(16, 12, 560, 52);
    ctx.strokeStyle = "#7aa7ff";
    ctx.lineWidth = 2;
    ctx.strokeRect(16, 12, 560, 52);

    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = "16px Arial";
    ctx.fillStyle = "#ffffff";

    ctx.fillText(`Ronda: ${Math.min(this.roundIndex + 1, this.totalRounds)}/${this.totalRounds}`, 28, 30);
    ctx.fillText(`Puntaje: ${this.score}`, 180, 30);
    ctx.fillText(`Racha: ${this.streak}`, 320, 30);
    ctx.fillText(`Tiempo: ${this.timeLeft.toFixed(1)}s`, 430, 30);

    ctx.fillText("Vidas:", 28, 48);
    const lives = Math.max(0, this.maxErrors - this.errors);
    for (let i = 0; i < this.maxErrors; i++) {
      ctx.fillStyle = i < lives ? "#ff4d6d" : "rgba(255,255,255,0.26)";
      this._drawHeart(ctx, 86 + i * 20, 40, 12);
    }

    ctx.restore();
  }

  _drawIntro(ctx, W, H) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font = "bold 40px Arial";
    ctx.fillStyle = "#dce7ff";
    ctx.fillText("Anagramas de Álgebra", W / 2, H * 0.25);

    ctx.font = "22px Arial";
    ctx.fillStyle = "#c3d4ff";
    ctx.fillText("Ordena las letras y adivina el término algebraico.", W / 2, H * 0.40);
    ctx.fillText("Si fallas se consume una vida; puedes pasar palabra con ESPACIO.", W / 2, H * 0.46);
    ctx.fillText("Usa pistas y llega al final de la ronda.", W / 2, H * 0.52);

    ctx.font = "20px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Pulsa ENTER, ESPACIO o clic para comenzar.", W / 2, H * 0.66);
    ctx.restore();
  }

  _drawTitle(ctx, W) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "bold 30px Arial";
    ctx.fillStyle = "#eef2ff";
    ctx.fillText("Anagramas", W / 2, 86);

    ctx.font = "16px Arial";
    ctx.fillStyle = "#b3c4f0";
    ctx.fillText("Area: Álgebra", W / 2, 110);
    ctx.restore();
  }

  _drawPanels(ctx) {
    this._roundRect(ctx, this.leftPanel.x, this.leftPanel.y, this.leftPanel.w, this.leftPanel.h, 16, "rgba(17,22,40,0.38)");
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.stroke();

    this._roundRect(ctx, this.rightPanel.x, this.rightPanel.y, this.rightPanel.w, this.rightPanel.h, 16, "rgba(17,22,40,0.38)");
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.stroke();
  }

  _drawWordPanel(ctx) {
    const x = this.leftPanel.x;
    const y = this.leftPanel.y;

    ctx.save();
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    ctx.font = "bold 22px Arial";
    ctx.fillStyle = "#dce7ff";
    ctx.fillText("Palabra", x + 20, y + 34);

    const hintBox = { x: x + 20, y: y + 58, w: this.leftPanel.w - 40, h: 102 };
    this._roundRect(ctx, hintBox.x, hintBox.y, hintBox.w, hintBox.h, 12, "rgba(255,255,255,0.06)");
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.stroke();

    const hintText = this._activeHintText();
    ctx.font = "bold 16px Arial";
    ctx.fillStyle = this.hintLevel === 2 ? "#ffb3b3" : "#ffd166";
    ctx.fillText(this.hintLevel === 2 ? "Pista 2" : "Pista 1", hintBox.x + 14, hintBox.y + 20);

    ctx.font = "18px Arial";
    ctx.fillStyle = "#e8eeff";
    this._drawWrappedText(ctx, hintText || "Sin pista", hintBox.x + 14, hintBox.y + 48, hintBox.w - 28, 24);

    const scrambleBox = { x: x + 20, y: y + 182, w: this.leftPanel.w - 40, h: 180 };
    this._roundRect(ctx, scrambleBox.x, scrambleBox.y, scrambleBox.w, scrambleBox.h, 12, "rgba(18,30,58,0.68)");
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(123,223,242,0.48)";
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.font = "16px Arial";
    ctx.fillStyle = "#a9b8df";
    ctx.fillText("Letras mezcladas", x + this.leftPanel.w / 2, scrambleBox.y + 26);

    ctx.font = "bold 42px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText((this.scrambled || "-").toUpperCase(), x + this.leftPanel.w / 2, scrambleBox.y + 78);

    ctx.font = "16px Arial";
    ctx.fillStyle = "#9fc0ff";
    ctx.fillText(`Longitud: ${(this.current?.palabra || "").length}`, x + this.leftPanel.w / 2, scrambleBox.y + 112);

    const letters = Array.from(this.scrambled || "");
    const answerChars = Array.from(this.answerInput || "");
    const answerCounts = {};
    for (const ch of answerChars) {
      answerCounts[ch] = (answerCounts[ch] || 0) + 1;
    }
    const tileSize = 52;
    const gap = 10;
    const padX = 16;
    const startY = scrambleBox.y + 126;
    const maxCols = Math.max(1, Math.floor((scrambleBox.w - padX * 2 + gap) / (tileSize + gap)));

    for (let i = 0; i < letters.length; i++) {
      const row = Math.floor(i / maxCols);
      const col = i % maxCols;
      const rowCount = Math.min(maxCols, letters.length - row * maxCols);
      const rowWidth = rowCount * tileSize + Math.max(0, rowCount - 1) * gap;
      const rx = scrambleBox.x + (scrambleBox.w - rowWidth) / 2 + col * (tileSize + gap);
      const ry = startY + row * (tileSize + gap);
      const rect = { x: rx, y: ry, w: tileSize, h: tileSize };
      const ch = letters[i];
      const prevSame = letters.slice(0, i).filter((letter) => letter === ch).length;
      const selectedCount = answerCounts[ch] || 0;
      const isSelected = prevSame < selectedCount;

      this._roundRect(
        ctx,
        rect.x,
        rect.y,
        rect.w,
        rect.h,
        12,
        isSelected ? "rgba(99,212,113,0.26)" : "rgba(123,223,242,0.18)",
      );
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = isSelected ? "rgba(99,212,113,0.82)" : "rgba(123,223,242,0.52)";
      ctx.stroke();

      ctx.font = "bold 28px Arial";
      ctx.fillStyle = isSelected ? "#dfffe5" : "#eef6ff";
      ctx.fillText(ch.toUpperCase(), rect.x + rect.w / 2, rect.y + rect.h / 2 + 1);

      this._clickRegions.push({
        id: `letter_${i}`,
        rect,
        onClick: () => this._appendChar(ch.toLowerCase()),
      });
    }

    ctx.restore();
  }

  _drawControlsPanel(ctx) {
    const x = this.rightPanel.x;
    const y = this.rightPanel.y;

    ctx.save();
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";

    ctx.font = "bold 22px Arial";
    ctx.fillStyle = "#dce7ff";
    ctx.fillText("Respuesta", x + this.rightPanel.w / 2, y + 34);

    const inputRect = { x: x + 20, y: y + 64, w: this.rightPanel.w - 40, h: 62 };
    this._roundRect(ctx, inputRect.x, inputRect.y, inputRect.w, inputRect.h, 12, "rgba(255,255,255,0.06)");
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(123,223,242,0.62)";
    ctx.stroke();

    const blink = Math.floor(Date.now() / 400) % 2 === 0 ? "|" : " ";
    ctx.font = "bold 28px Arial";
    ctx.fillStyle = "#eef2ff";
    ctx.fillText((this.answerInput || "") + blink, inputRect.x + inputRect.w / 2, inputRect.y + inputRect.h / 2 + 2);

    const buttons = [
      { id: "submit", label: "Enviar (ENTER)", y: 150, fill: "rgba(99,212,113,0.20)", stroke: "rgba(99,212,113,0.75)", text: "#63d471", onClick: () => this._submitAnswer() },
      { id: "shuffle", label: "Revolver", y: 204, fill: "rgba(123,223,242,0.20)", stroke: "rgba(123,223,242,0.75)", text: "#7bdff2", onClick: () => this._reshuffleCurrent() },
      { id: "clear", label: "Limpiar", y: 258, fill: "rgba(255,255,255,0.08)", stroke: "rgba(255,255,255,0.26)", text: "#dce7ff", onClick: () => this._clearInput() },
      { id: "pass", label: "Pasar (ESPACIO)", y: 312, fill: "rgba(255,209,102,0.14)", stroke: "rgba(255,209,102,0.68)", text: "#ffd166", onClick: () => this._passWord() },
      { id: "back", label: "Borrar (Backspace)", y: 366, fill: "rgba(255,255,255,0.08)", stroke: "rgba(255,255,255,0.24)", text: "#dce7ff", onClick: () => this._backspace() },
    ];

    for (const b of buttons) {
      const rect = { x: x + 20, y: y + b.y, w: this.rightPanel.w - 40, h: 42 };
      this._roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 12, b.fill);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = b.stroke;
      ctx.stroke();
      ctx.font = "bold 17px Arial";
      ctx.fillStyle = b.text;
      ctx.fillText(b.label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1);

      this._clickRegions.push({ id: b.id, rect, onClick: b.onClick });
    }

    ctx.restore();
  }

  _drawBottomBar(ctx, W) {
    const barX = 72;
    const barY = 594;
    const barW = W - 144;
    const barH = 62;

    this._roundRect(ctx, barX, barY, barW, barH, 12, "rgba(6,9,18,0.94)");
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.stroke();

    ctx.save();
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = "16px Arial";
    ctx.fillStyle = "#d8e6ff";
    ctx.fillText("Toca letras o usa teclado. ENTER envia, ESPACIO pasa, Backspace borra.", barX + 14, barY + 21);

    ctx.font = "bold 18px Arial";
    ctx.fillStyle = this.feedback.toLowerCase().includes("correcto") ? "#63d471" : "#ffd166";
    ctx.fillText(this._ellipsis(this.feedback || "Resuelve el anagrama actual.", 92), barX + 14, barY + 45);
    ctx.restore();
  }

  _drawEndMessage(ctx, W, H) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    this._roundRect(ctx, 136, 164, W - 272, 364, 18, "rgba(7,10,20,0.96)");
    ctx.lineWidth = 2;
    ctx.strokeStyle = this.win ? "#63d471" : "#ef233c";
    ctx.stroke();

    ctx.font = "bold 38px Arial";
    ctx.fillStyle = this.win ? "#63d471" : "#ffd166";
    ctx.fillText(this.win ? "Anagrama completado" : "Anagrama fallido", W / 2, 228);

    const lines = (this.message || "").split("\n");
    ctx.font = "24px Arial";
    ctx.fillStyle = "#eef2ff";
    let y = 308;
    for (const line of lines) {
      ctx.fillText(line, W / 2, y);
      y += 40;
    }

    ctx.font = "20px Arial";
    ctx.fillStyle = "#7bdff2";
    ctx.fillText("Pulsa ENTER, ESPACIO o clic para volver.", W / 2, 494);
    ctx.restore();
  }

  _activeHintText() {
    if (!this.current) return "";
    if (this.hintLevel >= 2 && this.current.pista2) return this.current.pista2;
    return this.current.pista1 || "";
  }

  _drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = String(text || "").split(/\s+/);
    let line = "";
    let yy = y;
    for (let i = 0; i < words.length; i++) {
      const test = line + words[i] + " ";
      if (ctx.measureText(test).width > maxWidth && i > 0) {
        ctx.fillText(line.trim(), x, yy);
        line = words[i] + " ";
        yy += lineHeight;
      } else {
        line = test;
      }
    }
    if (line.trim()) ctx.fillText(line.trim(), x, yy);
  }

  _ellipsis(str, max = 80) {
    if (!str) return "";
    if (str.length <= max) return str;
    return str.slice(0, max - 3) + "...";
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

  _normKey(s) {
    return String(s || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  _isLetterDown(keys, upper) {
    const lower = upper.toLowerCase();
    const codeKey = `Key${upper}`;
    return !!keys[lower] || !!keys[upper] || !!keys[codeKey];
  }

  _isLetterJustPressed(keys, upper) {
    const now = this._isLetterDown(keys, upper);
    const prev = !!this._prevLetters[upper];
    return now && !prev;
  }
}

window.ConceptosAlgebraicosScene = ConceptosAlgebraicosScene;
