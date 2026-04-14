// js/areas/geometria/niveles/graficasScene.js
// ===========================================================
// GraficasScene - "Gráficas Lineales"
// - Se genera una ecuación de la forma ax + by = c.
// - b pertenece a {2, -2, 4, -4, 5, -5}.
    // - Primero resuelve x = -1, 0 y 1.
    // - Luego se oculta la ecuacion y extrapola un valor entre x = 3 y 6.
// - Al acertar, el punto se dibuja en el plano.
// - Son 2 rectas por partida (la segunda es mas dificil).
// - Gana al completar 8 puntos, pierde con 3 errores.
// ===========================================================

class GraficasScene extends Scene {
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
    this.options = options;
    this.maxErrors = options.maxErrors ?? 3;
    this.roundTimeLimit = options.roundTimeLimit ?? 60;
    this.roundClearDelay = options.roundClearDelay ?? 2;
    this.errors = 0;
    this.timeLeft = this.roundTimeLimit;
    this.roundTransition = null;

    // Ejercicio
    this.baseXValues = [-1, 0, 1];
    this.hiddenXChoices = [3, 4, 5, 6];
    this.xValues = [-1, 0, 1, 3];
    this.totalRounds = options.totalRounds ?? 2;
    this.currentRound = 0;
    this.completedPoints = 0;
    this.currentIndex = 0;
    this.tableRows = [];
    this.line = null; // {a,b,c,m,n}

    // Entrada
    this.answerInput = "";
    this.answerFeedback = "";

    // Input edge tracking
    this._prevKeys = {
      Enter: false,
      " ": false,
      Escape: false,
      Backspace: false,
      "-": false,
      NumpadSubtract: false,
      "0": false,
      "1": false,
      "2": false,
      "3": false,
      "4": false,
      "5": false,
      "6": false,
      "7": false,
      "8": false,
      "9": false,
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

    // Geometría paneles
    this.tablePanel = { x: 60, y: 160, w: 300, h: 370 };
    this.graphPanel = { x: 440, y: 160, w: 470, h: 420 };
    this.graphLimit = 7;
    this.graphOriginOffsetX = -48;

    // Sonidos
    this.sfxCorrect = options.sfxCorrect ?? "sfx_match";
    this.sfxWrong = options.sfxWrong ?? "sfx_error";
    this.sfxWin = options.sfxWin ?? "sfx_win";
    this.sfxLose = options.sfxLose ?? "sfx_loose";
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

    this.errors = 0;
    this.timeLeft = this.roundTimeLimit;
    this.roundTransition = null;
    this.currentRound = 0;
    this.completedPoints = 0;
    this.currentIndex = 0;
    this.answerInput = "";
    this.answerFeedback = "";

    this._startRound(0);

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
    const mouse = input.mouse || { x: 0, y: 0, down: false };
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

    if (isJustPressed("Escape")) {
      window.MN_setInputMode?.(null);
      window.MN_setLeafHUDVisible?.(true);
      window.MN_APP?.toOverworld?.();
      commitKeys();
      return;
    }

    if (this.state === "intro") {
      if (isJustPressed("Enter") || isJustPressed(" ") || mouseJustPressed) {
        this.state = "playing";
        this.playSfx(this.sfxPage, { volume: 0.5 });
      }
      commitKeys();
      return;
    }

    if (this.state === "playing") {
      if (this.roundTransition) {
        this._updateRoundTransition(dt);
        commitKeys();
        return;
      }

      this.timeLeft = Math.max(0, this.timeLeft - dt);
      if (this.timeLeft <= 0) {
        this._handleRoundTimeout();
        commitKeys();
        return;
      }

      this._updatePlaying(isJustPressed, mouseJustPressed, mouse.x, mouse.y);
    }

    commitKeys();
  }

  _updatePlaying(isJustPressed, mouseJustPressed, mouseX, mouseY) {
    for (let d = 0; d <= 9; d++) {
      if (isJustPressed(String(d)) || isJustPressed(`Numpad${d}`)) {
        this._appendDigit(String(d));
      }
    }

    if (isJustPressed("-") || isJustPressed("NumpadSubtract")) {
      this._toggleSign();
    }

    if (isJustPressed("Backspace")) {
      this.answerInput = this.answerInput.slice(0, -1);
      this.answerFeedback = "";
    }

    if (isJustPressed("Enter")) {
      this._submitAnswer();
    }

    if (mouseJustPressed) {
      this._handleGraphClick(mouseX, mouseY);
    }
  }

  _appendDigit(d) {
    if (this.answerInput.length >= 4) return;
    if (this.answerInput === "0") this.answerInput = d;
    else this.answerInput += d;
    this.answerFeedback = "";
  }

  _toggleSign() {
    if (!this.answerInput) {
      this.answerInput = "-";
      return;
    }
    if (this.answerInput.startsWith("-")) this.answerInput = this.answerInput.slice(1);
    else this.answerInput = `-${this.answerInput}`;
    this.answerFeedback = "";
  }

  _submitAnswer() {
    const raw = this.answerInput.trim();
    if (!raw || raw === "-") {
      this.answerFeedback = "Escribe un valor entero para y.";
      return;
    }

    const chosen = Number.parseInt(raw, 10);
    if (!Number.isFinite(chosen)) {
      this.answerFeedback = "Valor inválido.";
      return;
    }

    this._handleChosenY(chosen);
  }

  _handleChosenY(chosen) {
    const row = this.tableRows[this.currentIndex];
    if (!row) return;

    if (chosen === row.y) {
      row.answered = true;
      row.value = chosen;
      this.currentIndex += 1;
      this.completedPoints += 1;
      this.answerInput = "";
      this.answerFeedback =
        this.currentIndex === this.baseXValues.length && this.currentIndex < this.tableRows.length
          ? "Correcto. Ahora sigue el patron sin ver la ecuacion."
          : "Correcto.";
      this.playSfx(this.sfxCorrect, { volume: 0.6 });

      if (this.currentIndex >= this.tableRows.length) {
        const finishedAllRounds = this.currentRound + 1 >= this.totalRounds;
        this.answerFeedback = finishedAllRounds
          ? "Recta completada. Observa la grafica..."
          : `Recta ${this.currentRound + 1} completada. Observa la grafica...`;
        this.playSfx(this.sfxWin, { volume: 0.55 });
        this._beginRoundTransition(finishedAllRounds);
      }
      return;
    }

    this.errors += 1;
    this.answerInput = "";
    this.answerFeedback = `Incorrecto: para x=${row.x}, y no es ${chosen}.`;
    this.playSfx(this.sfxWrong, { volume: 0.7 });

    if (this.errors >= this.maxErrors) {
      this._finishGame(true);
    }
  }

  _handleGraphClick(mx, my) {
    if (!this._isPointInRect(mx, my, this.graphPanel)) return;

    const snap = this._screenToGraphGrid(mx, my);
    if (!snap) {
      this.answerFeedback = "Haz clic dentro del plano.";
      return;
    }

    if (snap.distance > 16) {
      this.answerFeedback = "Haz clic mas cerca de una interseccion.";
      return;
    }

    const row = this.tableRows[this.currentIndex];
    if (!row) return;

    if (snap.gx !== row.x) {
      this.answerFeedback = `Para esta fila debes marcar un punto con x = ${row.x}.`;
      return;
    }

    this.answerInput = String(snap.gy);
    this._handleChosenY(snap.gy);
  }

  _handleRoundTimeout() {
    this.errors += 1;
    this.answerInput = "";
    this.answerFeedback = "Se acabo el tiempo para esta recta.";
    this.playSfx(this.sfxWrong, { volume: 0.7 });

    if (this.errors >= this.maxErrors) {
      this._finishGame(true);
      return;
    }

    this.timeLeft = this.roundTimeLimit;
  }

  _beginRoundTransition(finishedAllRounds) {
    this.roundTransition = {
      timer: this.roundClearDelay,
      finishedAllRounds,
    };
  }

  _updateRoundTransition(dt) {
    if (!this.roundTransition) return;

    this.roundTransition.timer -= dt;
    if (this.roundTransition.timer > 0) return;

    const { finishedAllRounds } = this.roundTransition;
    this.roundTransition = null;

    if (finishedAllRounds) {
      this._finishGame(false);
      return;
    }

    this.currentRound += 1;
    this._startRound(this.currentRound);
    this.answerFeedback = "Nueva recta lista. Continua con la tabla.";
    this.playSfx(this.sfxPage, { volume: 0.5 });
  }

  _finishGame(failed = false) {
    if (this.gameFinished) return;

    this.gameFinished = true;
    this.state = "finished";
    this.exitDelay = 0.45;
    this.win = !failed;

    const tier = failed ? 0 : 1;
    let gained = 0;
    if (window.MN_reportMinigameTier) {
      gained = window.MN_reportMinigameTier("graficas", tier);
    }
    this.sheetsReward = gained;

    const totalPoints = this.totalRounds * this.xValues.length;
    if (this.win) {
      this.message =
        "Reto superado.\n" +
        `Puntos correctos: ${this.completedPoints}/${totalPoints}\n` +
        `Errores: ${this.errors}/${this.maxErrors}\n` +
        `Hojas ganadas: ${gained}.`;
      this.playSfx(this.sfxWin, { volume: 0.7 });
    } else {
      this.message =
        "Te quedaste sin vidas.\n" +
        `Puntos correctos: ${this.completedPoints}/${totalPoints}\n` +
        `Errores: ${this.errors}/${this.maxErrors}\n` +
        `Hojas ganadas: ${gained}.`;
      this.playSfx(this.sfxLose, { volume: 0.7 });
    }
  }

  draw(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    this._drawBackground(ctx, W, H);
    this._drawHUD(ctx);

    if (this.state === "intro") {
      this._drawIntro(ctx, W, H);
      return;
    }

    if (this.state === "playing") {
      this._drawEquation(ctx, W);
      this._drawPanels(ctx);
      this._drawTable(ctx);
      this._drawGraph(ctx);
      this._drawInputBar(ctx, W);
      return;
    }

    if (this.state === "finished") {
      this._drawEndMessage(ctx, W, H);
    }
  }

  _drawBackground(ctx, W, H) {
    const tower = this.game.assets?.getImage?.("bg_cartesiano_torre");
    if (tower) {
      this._drawCoverImage(ctx, tower, 0, 0, W, H);
    } else {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#0a0f1d");
      g.addColorStop(1, "#151f3a");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    ctx.save();
    ctx.globalAlpha = 0.08;
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
    this._roundRect(ctx, 26, 22, W - 52, H - 44, 18, "rgba(15,18,32,0.9)");
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(225,232,255,0.28)";
    ctx.stroke();
  }

  _drawHUD(ctx) {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.62)";
    ctx.fillRect(16, 12, 470, 52);
    ctx.strokeStyle = "#7aa7ff";
    ctx.lineWidth = 2;
    ctx.strokeRect(16, 12, 470, 52);

    ctx.font = "16px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const totalPoints = this.totalRounds * this.xValues.length;
    ctx.fillText(`Puntos: ${this.completedPoints}/${totalPoints}`, 28, 30);
    ctx.fillText(`Recta: ${this.currentRound + 1}/${this.totalRounds}`, 28, 48);
    ctx.fillText(`Tiempo: ${Math.ceil(this.timeLeft)}s`, 226, 30);
    ctx.fillText("Vidas:", 362, 30);

    const lives = Math.max(0, this.maxErrors - this.errors);
    for (let i = 0; i < this.maxErrors; i++) {
      ctx.fillStyle = i < lives ? "#ff4d6d" : "rgba(255,255,255,0.25)";
      this._drawHeart(ctx, 416 + i * 20, 21, 13);
    }
    ctx.restore();
  }

  _drawIntro(ctx, W, H) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 36px Arial";
    ctx.fillText("Gráficas Lineales", W / 2, H * 0.26);

    ctx.font = "20px Arial";
    ctx.fillStyle = "#d8e6ff";
    ctx.fillText("Resuelve la tabla de valores de una ecuación lineal.", W / 2, H * 0.38);
    ctx.fillText("Para cada x, escribe y con teclado o marca el punto correcto con clic.", W / 2, H * 0.44);
    ctx.fillText("Cada recta tiene 60 segundos y cada acierto dibuja un punto en el plano.", W / 2, H * 0.50);
    ctx.fillText("Completa 2 rectas de 4 puntos antes de perder 3 vidas.", W / 2, H * 0.56);

    ctx.fillStyle = "#ffffff";
    ctx.fillText("Pulsa ENTER o ESPACIO para comenzar.", W / 2, H * 0.66);
    ctx.restore();
  }

  _drawEquation(ctx, W) {
    if (!this.line) return;
    const patternPhase = this.currentIndex >= this.baseXValues.length;
    const eq = this._formatEquation(this.line.a, this.line.b, this.line.c);

    ctx.save();
    ctx.textAlign = "center";
    ctx.fillStyle = "#eef2ff";
    ctx.font = "bold 30px Arial";
    ctx.fillText("Gráficas", W * 0.5, 74);

    ctx.font = "bold 28px Arial";
    ctx.fillStyle = patternPhase ? "#ffd166" : "#7bdff2";
    ctx.fillText(patternPhase ? "Ecuacion oculta: sigue el patron" : eq, W * 0.5, 112);

    ctx.font = "18px Arial";
    ctx.fillStyle = "#d8e6ff";
    ctx.fillText(
      patternPhase
        ? "Ultimo punto: calcula el patron sin ver la ecuacion"
        : this.currentRound === 0
          ? "Recta 1 (base)"
          : "Recta 2 (desafio)",
      W * 0.5,
      138,
    );
    ctx.restore();
  }

  _drawPanels(ctx) {
    this._roundRect(
      ctx,
      this.tablePanel.x,
      this.tablePanel.y,
      this.tablePanel.w,
      this.tablePanel.h,
      16,
      "rgba(21,26,46,0.96)",
    );
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.stroke();

    this._roundRect(
      ctx,
      this.graphPanel.x,
      this.graphPanel.y,
      this.graphPanel.w,
      this.graphPanel.h,
      16,
      "rgba(21,26,46,0.96)",
    );
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.stroke();
  }

  _drawTable(ctx) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.fillStyle = "#dce7ff";
    ctx.font = "bold 22px Arial";
    ctx.fillText("Tabla (x, y)", this.tablePanel.x + this.tablePanel.w * 0.5, this.tablePanel.y + 34);

    const rowH = 62;
    const top = this.tablePanel.y + 70;
    const colX = this.tablePanel.x + 44;
    const colY = this.tablePanel.x + 174;
    const colState = this.tablePanel.x + 256;

    ctx.font = "bold 18px Arial";
    ctx.fillStyle = "#a9b8df";
    ctx.fillText("x", colX, top);
    ctx.fillText("y", colY, top);
    ctx.fillText("estado", colState, top);

    for (let i = 0; i < this.tableRows.length; i++) {
      const row = this.tableRows[i];
      const y = top + 44 + i * rowH;

      ctx.fillStyle = i === this.currentIndex ? "rgba(123,223,242,0.20)" : "rgba(255,255,255,0.05)";
      ctx.fillRect(this.tablePanel.x + 18, y - 25, this.tablePanel.w - 36, 42);

      ctx.font = "20px Arial";
      ctx.fillStyle = "#eef2ff";
      ctx.fillText(String(row.x), colX, y);

      const yText = row.answered
        ? String(row.value)
        : i === this.currentIndex
          ? "?"
          : "-";
      ctx.fillText(yText, colY, y);

      ctx.font = "16px Arial";
      if (row.answered) ctx.fillStyle = "#63d471";
      else if (i === this.currentIndex) ctx.fillStyle = "#ffd166";
      else ctx.fillStyle = "#8f9fca";
      ctx.fillText(row.answered ? "ok" : i === this.currentIndex ? "actual" : "pendiente", colState, y);
    }
    ctx.restore();
  }

  _drawGraph(ctx) {
    const lim = this.graphLimit;
    const area = this._graphArea();
    const step = area.size / (lim * 2);
    const { x: ox, y: oy } = this._graphOrigin(area);
    const visibleX = this._visibleGraphXRange();
    const visibleY = this._visibleGraphYRange();

    ctx.save();

    // Cuadrícula
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.lineWidth = 1;
    for (let i = Math.max(-lim, visibleX.min); i <= Math.min(lim, visibleX.max); i++) {
      const x = ox + i * step;
      ctx.beginPath();
      ctx.moveTo(x, area.y);
      ctx.lineTo(x, area.y + area.size);
      ctx.stroke();
    }
    for (let j = Math.max(-lim, visibleY.min); j <= Math.min(lim, visibleY.max); j++) {
      const y = oy - j * step;
      ctx.beginPath();
      ctx.moveTo(area.x, y);
      ctx.lineTo(area.x + area.size, y);
      ctx.stroke();
    }

    // Ejes
    ctx.strokeStyle = "#d5e4ff";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(area.x, oy);
    ctx.lineTo(area.x + area.size, oy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ox, area.y);
    ctx.lineTo(ox, area.y + area.size);
    ctx.stroke();

    // Etiquetas
    ctx.font = "13px Arial";
    ctx.fillStyle = "#dbe8ff";
    ctx.textAlign = "center";
    for (let i = Math.max(-lim, visibleX.min); i <= Math.min(lim, visibleX.max); i++) {
      if (i === 0) continue;
      const x = ox + i * step;
      ctx.fillText(String(i), x, oy + 16);
    }
    ctx.textAlign = "right";
    for (let j = Math.max(-lim, visibleY.min); j <= Math.min(lim, visibleY.max); j++) {
      if (j === 0) continue;
      const y = oy - j * step;
      ctx.fillText(String(j), ox - 8, y + 4);
    }

    // Puntos acertados
    const solved = this.tableRows.filter((r) => r.answered);
    solved.sort((a, b) => a.x - b.x);

    if (solved.length >= 2) {
      ctx.strokeStyle = "rgba(123,223,242,0.75)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i < solved.length; i++) {
        const p = this._toGraphPixel(solved[i].x, solved[i].y, area, lim);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }

    for (const r of solved) {
      const p = this._toGraphPixel(r.x, r.y, area, lim);
      this._drawPoint(ctx, p.x, p.y, 6, "#63d471");
      ctx.fillStyle = "#dff8e3";
      ctx.font = "14px Arial";
      ctx.textAlign = "left";
      ctx.fillText(`(${r.x},${r.y})`, p.x + 8, p.y - 8);
    }

    ctx.restore();
  }

  _drawInputBar(ctx, W) {
    const current = this.tableRows[this.currentIndex];
    const barX = 72;
    const barY = 602;
    const barW = W - 144;
    const barH = 58;

    this._roundRect(ctx, barX, barY, barW, barH, 12, "rgba(6,9,18,0.92)");
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.stroke();

    ctx.save();
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#eef2ff";
    ctx.font = "18px Arial";

    const prompt = current
      ? this.currentIndex >= this.baseXValues.length
        ? `Sin ecuacion: para x = ${current.x}, sigue el patron y responde:`
        : `Para x = ${current.x}, escribe y o haz clic en el punto correcto:`
      : "Tabla completa.";
    ctx.fillText(prompt, barX + 16, barY + 20);

    const blinkOn = Math.floor(Date.now() / 450) % 2 === 0;
    const caret = blinkOn ? "|" : " ";
    const answer = this.answerInput || "";
    ctx.font = "bold 25px Arial";
    ctx.fillStyle = "#7bdff2";
    ctx.fillText(`y = ${answer}${caret}`, barX + 16, barY + 44);

    if (this.answerFeedback) {
      const isPositive =
        this.answerFeedback.startsWith("Correcto") ||
        this.answerFeedback.startsWith("Recta") ||
        this.answerFeedback.startsWith("Nueva");
      ctx.textAlign = "right";
      ctx.font = "16px Arial";
      ctx.fillStyle = isPositive ? "#63d471" : "#ffd2d2";
      ctx.fillText(this.answerFeedback, barX + barW - 16, barY + 44);
    }
    ctx.restore();
  }

  _drawEndMessage(ctx, W, H) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    this._roundRect(ctx, 152, 184, W - 304, 308, 18, "rgba(7,10,20,0.96)");
    ctx.lineWidth = 2;
    ctx.strokeStyle = this.win ? "#63d471" : "#ef233c";
    ctx.stroke();

    ctx.font = "bold 38px Arial";
    ctx.fillStyle = this.win ? "#63d471" : "#ffd166";
    ctx.fillText(this.win ? "Reto superado" : "Reto fallido", W / 2, 244);

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

  _graphArea() {
    const pad = 26;
    const size = Math.min(this.graphPanel.w - pad * 2, this.graphPanel.h - pad * 2);
    return {
      x: this.graphPanel.x + (this.graphPanel.w - size) * 0.5,
      y: this.graphPanel.y + (this.graphPanel.h - size) * 0.5 + 8,
      size,
    };
  }

  _graphOrigin(area) {
    return {
      x: area.x + area.size * 0.5 + this.graphOriginOffsetX,
      y: area.y + area.size * 0.5,
    };
  }

  _visibleGraphXRange() {
    const area = this._graphArea();
    const step = area.size / (this.graphLimit * 2);
    const { x: ox } = this._graphOrigin(area);
    const minX = Math.ceil((area.x - ox) / step);
    const maxX = Math.floor((area.x + area.size - ox) / step);
    return { min: minX, max: maxX };
  }

  _visibleGraphYRange() {
    const area = this._graphArea();
    const step = area.size / (this.graphLimit * 2);
    const { y: oy } = this._graphOrigin(area);
    const minY = Math.ceil((oy - (area.y + area.size)) / step);
    const maxY = Math.floor((oy - area.y) / step);
    return { min: minY, max: maxY };
  }

  _toGraphPixel(x, y, area, lim) {
    const step = area.size / (lim * 2);
    const { x: ox, y: oy } = this._graphOrigin(area);
    return { x: ox + x * step, y: oy - y * step };
  }

  _screenToGraphGrid(px, py) {
    const area = this._graphArea();
    const lim = this.graphLimit;
    const step = area.size / (lim * 2);
    const { x: ox, y: oy } = this._graphOrigin(area);

    const gxFloat = (px - ox) / step;
    const gyFloat = -(py - oy) / step;

    const gx = Math.round(gxFloat);
    const gy = Math.round(gyFloat);

    if (gx < -lim || gx > lim || gy < -lim || gy > lim) return null;

    const sx = ox + gx * step;
    const sy = oy - gy * step;
    const distance = Math.hypot(px - sx, py - sy);

    return { gx, gy, sx, sy, distance };
  }

  _formatEquation(a, b, c) {
    const aPart = `${a}x`;
    const bPart = b >= 0 ? ` + ${b}y` : ` - ${Math.abs(b)}y`;
    return `${aPart}${bPart} = ${c}`;
  }

  _startRound(roundIndex) {
    this.currentIndex = 0;
    this.answerInput = "";
    this.answerFeedback = "";
    this.timeLeft = this.roundTimeLimit;
    const visibleX = this._visibleGraphXRange();
    const hiddenChoices = this.hiddenXChoices.filter(
      (x) => x >= visibleX.min && x <= visibleX.max,
    );
    const hiddenX = this._pick(hiddenChoices.length ? hiddenChoices : [3]);
    this.xValues = [...this.baseXValues, hiddenX];
    this.line = this._buildLineExercise(roundIndex);
    this.tableRows = this.xValues.map((x) => ({
      x,
      y: this.line.m * x + this.line.n,
      answered: false,
      value: null,
    }));
  }

  _buildLineExercise(roundIndex = 0) {
    const isHard = roundIndex >= 1;
    const bChoices = isHard ? [2, -2, 4, -4, 5, -5] : [2, -2, 4, -4];
    const mChoices = isHard
      ? [-2, -1, 1, 2]
      : [-1, 1, 2];
    const yLimit = 7;

    for (let attempt = 0; attempt < 240; attempt++) {
      const b = this._pick(bChoices);
      const m = this._pick(mChoices);
      const nRange = this._intersectNRange(m, this.xValues, -yLimit, yLimit);
      if (!nRange) continue;

      const n = this._randInt(nRange.min, nRange.max);
      const a = -m * b;
      const c = n * b;

      if (a === 0) continue;
      if (Math.abs(a) > 30 || Math.abs(c) > 50) continue;

      return { a, b, c, m, n };
    }

    // Fallback estable por dificultad
    if (isHard) return { a: -4, b: 4, c: -8, m: 1, n: -2 };
    return { a: -2, b: 2, c: 2, m: 1, n: 1 };
  }

  _intersectNRange(m, xs, yMin, yMax) {
    let lo = -999;
    let hi = 999;
    for (const x of xs) {
      lo = Math.max(lo, yMin - m * x);
      hi = Math.min(hi, yMax - m * x);
    }
    const min = Math.ceil(lo);
    const max = Math.floor(hi);
    if (min > max) return null;
    return { min, max };
  }

  _drawPoint(ctx, x, y, radius, fill) {
    ctx.save();
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
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

  _pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  _randInt(a, b) {
    return a + Math.floor(Math.random() * (b - a + 1));
  }

  _isPointInRect(px, py, rect) {
    if (!rect) return false;
    return (
      px >= rect.x &&
      px <= rect.x + rect.w &&
      py >= rect.y &&
      py <= rect.y + rect.h
    );
  }

  _drawIntro(ctx, W, H) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    this._roundRect(
      ctx,
      W * 0.18,
      H * 0.24 - 30,
      W * 0.64,
      H * 0.40 + 60,
      18,
      "rgba(7, 10, 20, 0.74)",
    );
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(225,232,255,0.22)";
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 36px Arial";
    ctx.fillText("Graficas y patrones", W / 2, H * 0.26);

    ctx.font = "20px Arial";
    ctx.fillStyle = "#d8e6ff";
    ctx.fillText("Resuelve primero los valores de x = -1, 0 y 1.", W / 2, H * 0.38);
    ctx.fillText("Luego la ecuacion se oculta y debes hallar un ultimo punto por patron.", W / 2, H * 0.44);
    ctx.fillText("Puedes responder con teclado o marcando el punto correcto con clic.", W / 2, H * 0.50);
    ctx.fillText("Completa 2 rectas de 4 puntos antes de perder 3 vidas.", W / 2, H * 0.56);

    ctx.fillStyle = "#ffffff";
    ctx.fillText("Pulsa ENTER o ESPACIO para comenzar.", W / 2, H * 0.66);
    ctx.restore();
  }

  _drawEquation(ctx, W) {
    if (!this.line) return;
    const patternPhase = this.currentIndex >= this.baseXValues.length;
    const eq = this._formatEquation(this.line.a, this.line.b, this.line.c);

    ctx.save();
    this._roundRect(
      ctx,
      W * 0.5 - 260,
      72,
      520,
      98,
      16,
      "rgba(7, 10, 20, 0.74)",
    );
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(225,232,255,0.20)";
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.fillStyle = "#eef2ff";
    ctx.font = "bold 30px Arial";
    ctx.fillText("Graficas y patrones", W * 0.5, 104);

    ctx.font = "bold 28px Arial";
    ctx.fillStyle = patternPhase ? "#ffd166" : "#7bdff2";
    ctx.fillText(patternPhase ? "Ecuacion oculta: sigue el patron" : eq, W * 0.5, 142);
    ctx.restore();
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

  _drawCoverImage(ctx, img, x, y, w, h) {
    if (!img) return;
    const sw = img.naturalWidth || img.width || w;
    const sh = img.naturalHeight || img.height || h;
    if (!sw || !sh) {
      ctx.drawImage(img, x, y, w, h);
      return;
    }

    const scale = Math.max(w / sw, h / sh);
    const dw = sw * scale;
    const dh = sh * scale;
    const dx = x + (w - dw) * 0.5;
    const dy = y + (h - dh) * 0.5;
    ctx.drawImage(img, dx, dy, dw, dh);
  }
}

window.GraficasScene = GraficasScene;
