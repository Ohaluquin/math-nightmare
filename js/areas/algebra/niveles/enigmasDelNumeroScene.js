// js/areas/algebra/niveles/enigmasDelNumeroScene.js
class EnigmasDelNumeroScene extends RazonamientoScene {
  constructor(game, options = {}) {
    super(game, options);
    this.npcName = "Brahmagupta";
    this.problemsPerRun = 3;
    this.maxLives = options.maxLives ?? 3;
    this.lives = this.maxLives;

    this.inputShakeT = 0;
    this.inputGlowT = 0;
    this.inputGlowColor = "#a5ff7b";
    this.solveCard = null; // { ok, equation, solution, t }
    this.awaitingNextProblem = false;
  }

  init() {
    super.init();
    this.bgImage = this.game?.assets?.getImage?.("bg_brahmagupta") || this.bgImage;
    this.lives = this.maxLives;
    this.inputShakeT = 0;
    this.inputGlowT = 0;
    this.inputGlowColor = "#a5ff7b";
    this.solveCard = null;
    this.awaitingNextProblem = false;
  }

  update(dt) {
    if (this.inputShakeT > 0) this.inputShakeT = Math.max(0, this.inputShakeT - dt);
    if (this.inputGlowT > 0) this.inputGlowT = Math.max(0, this.inputGlowT - dt);
    if (this.solveCard) this.solveCard.t += dt;
    super.update(dt);
  }

  _buildTemplates() {
    const t = [];
    const ri = (a, b) => this._randInt(a, b);
    const pick = (arr) => arr[ri(0, arr.length - 1)];

    // NIVEL 1
    t.push({
      id: "n1_x_mas_a",
      familyLabel: "Nivel 1 - Suma",
      difficulty: 1,
      generate: () => {
        const x = ri(2, 20);
        const a = ri(2, 15);
        const b = x + a;
        return {
          text: `La suma de un número y ${a} es ${b}. ¿Cuál es el número?`,
          answer: x,
          equation: `x + ${a} = ${b}`,
        };
      },
    });

    t.push({
      id: "n1_x_menos_a",
      familyLabel: "Nivel 1 - Resta",
      difficulty: 1,
      generate: () => {
        const a = ri(2, 15);
        const b = ri(2, 20);
        const x = a + b;
        return {
          text: `Si a un número le quitas ${a}, obtienes ${b}. ¿Cuál es el número?`,
          answer: x,
          equation: `x - ${a} = ${b}`,
        };
      },
    });

    t.push({
      id: "n1_a_menos_x",
      familyLabel: "Nivel 1 - Resta invertida",
      difficulty: 1,
      generate: () => {
        const x = ri(2, 20);
        const b = ri(2, 15);
        const a = x + b;
        return {
          text: `Si a ${a} le quitas un número, queda ${b}. ¿Cuál es ese número?`,
          answer: x,
          equation: `${a} - x = ${b}`,
        };
      },
    });

    t.push({
      id: "n1_ax_igual_b",
      familyLabel: "Nivel 1 - Multiplicación",
      difficulty: 1,
      generate: () => {
        const a = pick([2, 3, 4, 5, 6, 7, 8, 9]);
        const x = ri(2, 12);
        const b = a * x;
        return {
          text: `${a} veces un número es ${b}. ¿Cuál es el número?`,
          answer: x,
          equation: `${a}x = ${b}`,
        };
      },
    });

    t.push({
      id: "n1_x_div_a",
      familyLabel: "Nivel 1 - División",
      difficulty: 1,
      generate: () => {
        const a = pick([2, 3, 4, 5, 6, 7, 8, 9, 10]);
        const b = ri(2, 12);
        const x = a * b;
        return {
          text: `Un número dividido entre ${a} es ${b}. ¿Cuál es el número?`,
          answer: x,
          equation: `x / ${a} = ${b}`,
        };
      },
    });

    t.push({
      id: "n1_a_div_x",
      familyLabel: "Nivel 1 - División invertida",
      difficulty: 1,
      generate: () => {
        const b = pick([2, 3, 4, 5, 6]);
        const x = ri(2, 12);
        const a = b * x;
        return {
          text: `Si ${a} se divide entre un número, el resultado es ${b}. ¿Cuál es ese número?`,
          answer: x,
          equation: `${a} / x = ${b}`,
        };
      },
    });

    // NIVEL 2
    t.push({
      id: "n2_ax_mas_b",
      familyLabel: "Nivel 2 - Lineal",
      difficulty: 2,
      generate: () => {
        const a = pick([2, 3, 4, 5, 6]);
        const x = ri(2, 12);
        const b = ri(1, 15);
        const c = a * x + b;
        return {
          text: `Si al producto de un número por ${a} se le agregan ${b}, da ${c}. ¿Cuál es el número?`,
          answer: x,
          equation: `${a}x + ${b} = ${c}`,
        };
      },
    });

    t.push({
      id: "n2_ax_menos_b",
      familyLabel: "Nivel 2 - Lineal",
      difficulty: 2,
      generate: () => {
        const a = pick([2, 3, 4, 5, 6]);
        const x = ri(2, 12);
        const b = ri(1, 15);
        const c = a * x - b;
        if (c <= 0) {
          const b2 = ri(1, Math.max(1, a * x - 1));
          return {
            text: `Si al producto de un número por ${a} se le quitan ${b2}, da ${a * x - b2}. ¿Cuál es el número?`,
            answer: x,
            equation: `${a}x - ${b2} = ${a * x - b2}`,
          };
        }
        return {
          text: `Si al producto de un número por ${a} se le quitan ${b}, da ${c}. ¿Cuál es el número?`,
          answer: x,
          equation: `${a}x - ${b} = ${c}`,
        };
      },
    });

    t.push({
      id: "n2_a_por_x_mas_b",
      familyLabel: "Nivel 2 - Paréntesis",
      difficulty: 2,
      generate: () => {
        const a = pick([2, 3, 4, 5, 6]);
        const x = ri(2, 12);
        const b = ri(1, 10);
        const c = a * (x + b);
        return {
          text: `Si sumas ${b} a un número y luego multiplicas el resultado por ${a}, obtienes ${c}. ¿Cuál es el número?`,
          answer: x,
          equation: `${a}(x + ${b}) = ${c}`,
        };
      },
    });

    t.push({
      id: "n2_a_por_x_menos_b",
      familyLabel: "Nivel 2 - Paréntesis",
      difficulty: 2,
      generate: () => {
        const a = pick([2, 3, 4, 5, 6]);
        const b = ri(1, 8);
        const x = ri(b + 2, b + 14);
        const c = a * (x - b);
        return {
          text: `Si a un número le restas ${b} y luego multiplicas el resultado por ${a}, obtienes ${c}. ¿Cuál es el número?`,
          answer: x,
          equation: `${a}(x - ${b}) = ${c}`,
        };
      },
    });

    t.push({
      id: "n2_x_div_a_mas_b",
      familyLabel: "Nivel 2 - División + suma",
      difficulty: 2,
      generate: () => {
        const a = pick([2, 3, 4, 5, 6, 8, 10]);
        const b = ri(1, 10);
        const q = ri(2, 12);
        const x = a * q;
        const c = q + b;
        return {
          text: `Si un número se divide entre ${a} y al resultado se le suma ${b}, se obtiene ${c}. ¿Cuál es el número?`,
          answer: x,
          equation: `x / ${a} + ${b} = ${c}`,
        };
      },
    });

    t.push({
      id: "n2_x_mas_b_div_a",
      familyLabel: "Nivel 2 - División con paréntesis",
      difficulty: 2,
      generate: () => {
        const a = pick([2, 3, 4, 5, 6]);
        const b = ri(1, 12);
        const c = ri(2, 12);
        const x = a * c - b;
        return {
          text: `Si a un número le sumas ${b} y luego divides entre ${a}, obtienes ${c}. ¿Cuál es el número?`,
          answer: x,
          equation: `(x + ${b}) / ${a} = ${c}`,
        };
      },
    });

    // NIVEL 3
    t.push({
      id: "n3_equivalencia_canon",
      familyLabel: "Nivel 3 - Equivalencia",
      difficulty: 3,
      generate: () => {
        const x = ri(2, 12);
        const a = pick([2, 3, 4, 5, 6, 7]);
        let c = Math.random() < 0.2 ? 1 : pick([2, 3, 4, 5, 6]);
        if (c === a) c = 1;
        const b = ri(1, 12);
        let d = a * x + b - c * x;
        if (d === 0) d = pick([2, 3, 4, -2, -3, -4]);

        const rhs =
          c === 1
            ? d >= 0
              ? `sumarle ${d} a ese número`
              : `restarle ${Math.abs(d)} a ese número`
            : d >= 0
              ? `multiplicarlo por ${c} y luego sumarle ${d}`
              : `multiplicarlo por ${c} y luego restarle ${Math.abs(d)}`;

        return {
          text: `El producto de un número por ${a}, más ${b}, da lo mismo que ${rhs}. ¿Cuál es el número?`,
          answer: x,
          equation: `${a}x + ${b} = ${c}x ${d >= 0 ? `+ ${d}` : `- ${Math.abs(d)}`}`,
        };
      },
    });

    return t;
  }

  _drawIntro(ctx) {
    const { width: W, height: H } = this.game.canvas;

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "#ffffff";
    ctx.font = "34px Arial";
    ctx.fillText("Brahmagupta", W / 2, H * 0.2);

    ctx.font = "20px Arial";
    ctx.fillStyle = "#ffd54f";
    ctx.fillText("Los enigmas del número", W / 2, H * 0.275);

    ctx.font = "18px Arial";
    ctx.fillStyle = "#e8e8e8";
    ctx.fillText(
      "Encuentra el número que hace verdadera la igualdad.",
      W / 2,
      H * 0.335,
    );

    const lines = [
      "Responderás 3 enigmas de distinta dificultad.",      
      "Escribe tu respuesta y presiona ENTER.",
    ];

    ctx.font = "18px Arial";
    ctx.fillStyle = "#ffffff";
    let y = H * 0.44;
    for (const line of lines) {
      ctx.fillText(line, W / 2, y);
      y += 28;
    }

    ctx.font = "18px Arial";
    ctx.fillStyle = "#c8e6c9";
    ctx.fillText("Pulsa ENTER o ESPACIO para comenzar.", W / 2, H * 0.74);

    ctx.restore();
  }

  // Brahmagupta no usa tips/guía visual.
  _drawGuideToggle(_ctx) {
    this._guideToggleRect = null;
    this.showGuideTips = false;
  }

  _getGuideLines() {
    return [];
  }

  _drawProblemPanel(ctx) {
    super._drawProblemPanel(ctx);
    if (this.solveCard) this._drawEquivalentCard(ctx);
  }

  _drawHUD(ctx) {
    const W = this.game.canvas.width;
    const boxX = 15;
    const boxY = 15;
    const boxW = 372;
    const boxH = 60;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = "#ffd54f";
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.font = "16px Arial";
    ctx.fillStyle = "#ffffff";

    const mm = Math.floor(this.timeLeft / 60);
    const ss = Math.floor(this.timeLeft % 60);
    const timeStr = `${mm}:${String(ss).padStart(2, "0")}`;

    ctx.fillText(
      `Problema: ${Math.min(this.problemIndex + 1, this.problemsPerRun)}/${this.problemsPerRun}`,
      boxX + 10,
      boxY + 7,
    );

    ctx.fillStyle = this.timeLeft <= 30 ? "#ff8a80" : "#c8e6c9";
    ctx.fillText(`Tiempo: ${timeStr}`, boxX + 10, boxY + 33);

    ctx.fillStyle = "#dbe9ff";
    ctx.fillText("Vidas:", boxX + 178, boxY + 20);
    for (let i = 0; i < this.maxLives; i++) {
      ctx.fillStyle = i < this.lives ? "#ff4b5c" : "rgba(255,255,255,0.22)";
      this._drawHeart(ctx, boxX + 238 + i * 20, boxY + 20, 13);
    }

    ctx.restore();
  }

  _drawEquivalentCard(ctx) {
    if (!this._lastProblemPanel || !this.solveCard) return;

    const panel = this._lastProblemPanel;
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;
    const inputY = H - 120 - 30;

    const cardW = Math.min(760, W * 0.82);
    const x = (W - cardW) / 2;
    const y = panel.Y + panel.H + 12;
    const maxH = Math.max(0, inputY - y - 10);
    if (maxH < 72) return;
    const cardH = Math.min(106, maxH);

    const a = Math.max(0.35, Math.min(1, this.solveCard.t / 0.25));
    const stroke = this.solveCard.ok
      ? `rgba(130, 255, 165, ${0.8 * a})`
      : `rgba(255, 160, 160, ${0.8 * a})`;
    const fg = this.solveCard.ok ? "#dcffe7" : "#ffe0e0";

    ctx.save();
    ctx.fillStyle = `rgba(0,0,0,${0.66 * a})`;
    ctx.fillRect(x, y, cardW, cardH);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, cardW, cardH);

    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = fg;
    ctx.font = "18px Arial";
    ctx.fillText("Ecuación equivalente", x + cardW / 2, y + 10);

    ctx.font = "23px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(this.solveCard.equation, x + cardW / 2, y + 40);

    ctx.font = "17px Arial";
    ctx.fillStyle = fg;
    ctx.fillText(this.solveCard.solution, x + cardW / 2, y + 74);
    ctx.restore();
  }

  _drawInputPanel(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    const panelW = Math.min(520, W * 0.7);
    const panelH = 120;
    const X = (W - panelW) / 2;
    const Y = H - panelH - 30;

    const shakeAmp = this.inputShakeT > 0 ? 5 * (this.inputShakeT / 0.2) : 0;
    const shakeX = shakeAmp > 0 ? Math.sin(Date.now() * 0.075) * shakeAmp : 0;
    const glowA = Math.max(0, Math.min(1, this.inputGlowT / 0.28));

    ctx.save();
    if (shakeX) ctx.translate(shakeX, 0);
    ctx.fillStyle = "rgba(0,0,20,0.45)";
    ctx.fillRect(X, Y, panelW, panelH);

    const glowStroke =
      this.inputGlowColor === "#a5ff7b"
        ? `rgba(165,255,123,${0.7 * glowA})`
        : `rgba(255,140,140,${0.75 * glowA})`;
    ctx.strokeStyle = glowA > 0 ? glowStroke : "rgba(255, 245, 180, 0.35)";
    ctx.lineWidth = glowA > 0 ? 2.5 : 1.5;
    ctx.strokeRect(X, Y, panelW, panelH);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "16px Arial";
    ctx.fillStyle = "#c8e6c9";
    ctx.fillText(
      this.awaitingNextProblem
        ? "Comprobando equivalencia..."
        : "Escribe tu respuesta y presiona ENTER",
      W / 2,
      Y + 28,
    );

    ctx.font = "34px monospace";
    ctx.fillStyle = "#ffffff";
    const v = this.inputValue === "" ? "…" : this.inputValue;
    ctx.fillText(v, W / 2, Y + 74);
    ctx.restore();
  }

  _submitAnswer() {
    if (!this.currentProblem) return;
    if (this.awaitingNextProblem) return;
    if (!this.inputValue || this.inputValue === "-") return;

    const val = parseInt(this.inputValue, 10);
    if (Number.isNaN(val)) {
      this.inputValue = "";
      this.inputShakeT = 0.2;
      this.inputGlowT = 0.24;
      this.inputGlowColor = "#ff8a80";
      return;
    }

    const ok = val === this.currentProblem.answer;
    if (ok) {
      this.correctCount++;
      this._flash("¡Correcto!", "#a5ff7b");
      this._playSfx("sfx_match", { volume: 0.6 });
      this.inputGlowColor = "#a5ff7b";
      this.inputGlowT = 0.28;
    } else {
      this.lives = Math.max(0, this.lives - 1);
      this._flash(
        this.lives > 0
          ? `Incorrecto. Te quedan ${this.lives} ${this.lives === 1 ? "vida" : "vidas"}.`
          : "Incorrecto. Te quedaste sin vidas.",
        "#ffaaaa",
      );
      this._playSfx("sfx_error", { volume: 0.7 });
      this.inputShakeT = 0.2;
      this.inputGlowColor = "#ff8a80";
      this.inputGlowT = 0.3;
      this.inputValue = "";
      this.awaitingNextProblem = false;
      this.solveCard = null;
      if (this.lives <= 0) this._finishGame(true, "lives");
      return;
    }

    const equation = this.currentProblem.equation || "x = ?";
    this.solveCard = {
      ok,
      equation,
      solution: `Solución: x = ${this.currentProblem.answer}`,
      t: 0,
    };

    this.inputValue = "";
    this.awaitingNextProblem = true;
    this._advanceAfter(2.4);
  }

  _advanceAfter(seconds) {
    setTimeout(
      () => {
        if (this.gameFinished) return;

        this.problemIndex++;
        this.awaitingNextProblem = false;
        this.solveCard = null;

        if (this.problemIndex >= this.selectedProblems.length) {
          this._finishGame(false);
          return;
        }
        this.currentProblem = this.selectedProblems[this.problemIndex];
      },
      Math.max(0, seconds * 1000),
    );
  }

  _finishGame(failed = false, reason = failed ? "timeout" : "completed") {
    if (this.gameFinished) return;

    this.gameFinished = true;
    this.state = "finished";
    this.exitDelay = 0.5;

    const solvedAll = this.correctCount >= this.problemsPerRun;
    const tier = solvedAll ? 1 : 0;

    let gained = 0;
    if (window.MN_reportMinigameTier) {
      gained = MN_reportMinigameTier("brahmagupta_enigmas", tier);
    }
    this.sheetsReward = gained;

    if (reason === "lives") {
      this.win = false;
      this.message =
        "Los enigmas te derrotaron por ahora.\n" +
        `Resolviste ${this.correctCount}/${this.problemsPerRun}.\n` +
        `Hojas ganadas: ${gained}.`;
    } else if (failed) {
      this.win = false;
      this.message =
        "Se acabó el tiempo.\n" +
        `Resolviste ${this.correctCount}/${this.problemsPerRun}.\n` +
        `Hojas ganadas: ${gained}.`;
    } else {
      this.win = solvedAll;
      const head = this.win
        ? "¡Has descifrado el número!"
        : "Aún no está claro. Intenta de nuevo.";
      this.message =
        `${head}\n` +
        `Resolviste ${this.correctCount}/${this.problemsPerRun}.\n` +
        `Hojas ganadas: ${gained}.`;
    }

    if (this.win) this._playSfx("sfx_win", { volume: 0.7 });
    else this._playSfx("sfx_error", { volume: 0.65 });

    if (this.game && this.game.events) {
      this.game.events.emit("brahmagupta_done", {
        win: this.win,
        correct: this.correctCount,
        total: this.problemsPerRun,
        tier,
        sheetsReward: gained,
        failed,
        reason,
        lives: this.lives,
        timeLimitSec: this.timeLimitSec,
      });
    }
  }

  _drawHeart(ctx, x, y, s) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.3);
    ctx.bezierCurveTo(x, y, x - s * 0.5, y, x - s * 0.5, y + s * 0.3);
    ctx.bezierCurveTo(x - s * 0.5, y + s * 0.6, x, y + s * 0.86, x, y + s);
    ctx.bezierCurveTo(x, y + s * 0.86, x + s * 0.5, y + s * 0.6, x + s * 0.5, y + s * 0.3);
    ctx.bezierCurveTo(x + s * 0.5, y, x, y, x, y + s * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
