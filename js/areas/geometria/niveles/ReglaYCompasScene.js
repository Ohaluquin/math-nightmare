// js/areas/geometria/niveles/ReglaYCompasScene.js
// ===========================================================
// ReglaYCompasScene - "Regla y Compás"
// - Ordenar pasos de construcción (con distractores).
// - Al ejecutar, se visualiza la construccion paso a paso.
// - 3 retos, 2 vidas.
// ===========================================================

class ReglaYCompasScene extends Scene {
  constructor(game, options = {}) {
    super(game);

    this.state = "intro"; // intro | playing | finished
    this.mode = "arrange"; // arrange | complete
    this.gameFinished = false;
    this.exitDelay = 0;
    this.win = false;
    this.message = "";
    this.sheetsReward = 0;

    this.options = options;
    this.reviewMode = !!options.reviewMode;
    this.maxErrors = options.maxErrors ?? 2;
    this.errors = 0;

    this.challengeIndex = 0;
    this.challengeCatalog = this._buildChallenges();
    this.totalChallenges = options.totalChallenges ?? 3;
    this.challenges = [];
    this.current = null;

    this.poolSteps = [];
    this.selectedSteps = [];
    this.statusText = "";

    this.execTimer = 0;
    this.execStepVisible = 0;
    this.execStepDuration = 0.8;
    this.execDoneDelay = 0;

    this.poolRects = [];
    this.selectedRects = [];

    this._prevKeys = {
      Enter: false,
      " ": false,
      Escape: false,
      ArrowLeft: false,
      ArrowRight: false,
    };
    this._prevMouseDown = false;

    this.layout = {
      left: { x: 52, y: 148, w: 420, h: 512 },
      right: { x: 494, y: 148, w: 474, h: 512 },
    };

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

    this.state = this.reviewMode ? "playing" : "intro";
    this.mode = "arrange";
    this.gameFinished = false;
    this.exitDelay = 0;
    this.win = false;
    this.message = "";
    this.sheetsReward = 0;

    this.errors = 0;
    this.challengeIndex = 0;
    this.statusText = "";

    this.challenges = this.reviewMode
      ? (this.challengeCatalog || []).slice()
      : this._pickChallenges(this.totalChallenges);
    this.totalChallenges = this.challenges.length;
    this._loadChallenge(0);
    if (this.reviewMode) this._enableReviewForCurrentChallenge();

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

    const commitInputs = () => {
      for (const k of Object.keys(this._prevKeys))
        this._prevKeys[k] = isDown(k);
      this._prevMouseDown = !!mouse.down;
    };

    if (this.gameFinished) {
      if (this.exitDelay > 0) {
        this.exitDelay -= dt;
        commitInputs();
        return;
      }

      if (isJustPressed("Enter") || isJustPressed(" ") || mouseJustPressed) {
        window.MN_setInputMode?.(null);
        window.MN_setLeafHUDVisible?.(true);
        window.MN_APP?.toOverworld?.();
      }
      commitInputs();
      return;
    }

    if (isJustPressed("Escape")) {
      window.MN_setInputMode?.(null);
      window.MN_setLeafHUDVisible?.(true);
      window.MN_APP?.toOverworld?.();
      commitInputs();
      return;
    }

    if (this.state === "intro") {
      if (isJustPressed("Enter") || isJustPressed(" ") || mouseJustPressed) {
        this.state = "playing";
        this.playSfx(this.sfxPage, { volume: 0.5 });
      }
      commitInputs();
      return;
    }

    if (this.state === "playing") {
      if (this.reviewMode) {
        if (
          isJustPressed("ArrowRight") ||
          isJustPressed("Enter") ||
          isJustPressed(" ")
        ) {
          this._goToReviewChallenge(this.challengeIndex + 1);
        } else if (isJustPressed("ArrowLeft")) {
          this._goToReviewChallenge(this.challengeIndex - 1);
        }
      } else if (this.mode === "arrange" && mouseJustPressed) {
        this._handleArrangeClick(mouse.x, mouse.y);
      } else if (this.mode === "complete") {
        this._updateCompletion(dt);
      }
    }

    commitInputs();
  }

  _loadChallenge(index) {
    this.current = this.challenges[index] || null;
    if (!this.current) return;

    this.mode = "arrange";
    this.execTimer = 0;
    this.execStepVisible = 0;
    this.execDoneDelay = 0;

    this.selectedSteps = [];
    this.poolSteps = this._shuffle(
      this.current.expectedSteps
        .concat(this.current.distractors)
        .map((text, i) => ({
          id: `${index}_${i}_${text}`,
          text,
        })),
    );
    this.statusText = "Elige el siguiente paso correcto.";
  }

  _enableReviewForCurrentChallenge() {
    if (!this.current) return;
    this.mode = "review";
    this.selectedSteps = this.current.expectedSteps.map((text, i) => ({
      id: `review_${this.challengeIndex}_${i}_${text}`,
      text,
    }));
    this.poolSteps = this.current.distractors.map((text, i) => ({
      id: `review_pool_${this.challengeIndex}_${i}_${text}`,
      text,
    }));
    this.execStepVisible = this.current.expectedSteps.length;
    this.execDoneDelay = 0;
    this.statusText = `Modo prueba: ${this.challengeIndex + 1}/${this.totalChallenges}. Flechas para cambiar.`;
  }

  _goToReviewChallenge(index) {
    if (!this.challenges.length) return;
    const nextIndex = Math.max(0, Math.min(index, this.challenges.length - 1));
    if (nextIndex === this.challengeIndex) return;
    this.challengeIndex = nextIndex;
    this._loadChallenge(this.challengeIndex);
    this._enableReviewForCurrentChallenge();
    this.playSfx(this.sfxPage, { volume: 0.45 });
  }

  _handleArrangeClick(mx, my) {
    for (let i = 0; i < this.selectedRects.length; i++) {
      const r = this.selectedRects[i];
      if (!this._isPointInRect(mx, my, r.rect)) continue;
      this.statusText = "Esos pasos ya fueron confirmados.";
      return;
    }

    for (let i = 0; i < this.poolRects.length; i++) {
      const r = this.poolRects[i];
      if (!this._isPointInRect(mx, my, r.rect)) continue;
      this._tryAdvanceWithStep(i);
      return;
    }
  }

  _tryAdvanceWithStep(poolIndex) {
    const step = this.poolSteps[poolIndex];
    const expected = this.current?.expectedSteps?.[this.execStepVisible];
    if (!step || !expected) return;

    if (step.text !== expected) {
      this.errors += 1;
      this.playSfx(this.sfxWrong, { volume: 0.7 });
      this.statusText = "Ese no es el siguiente paso. Pierdes una vida.";
      if (this.errors >= this.maxErrors) this._finishGame(true);
      return;
    }

    this.playSfx(this.sfxCorrect, { volume: 0.65 });
    const confirmed = this.poolSteps.splice(poolIndex, 1)[0];
    this.selectedSteps.push(confirmed);
    this.execStepVisible += 1;

    if (this.execStepVisible >= this.current.expectedSteps.length) {
      this.mode = "complete";
      this.execDoneDelay = 0;
      this.statusText = "Construcción completa.";
      return;
    }

    this.playSfx(this.sfxPage, { volume: 0.45 });
    this.statusText = `Correcto. Paso ${this.execStepVisible + 1} de ${this.current.expectedSteps.length}.`;
  }

  _updateCompletion(dt) {
    this.execDoneDelay += dt;
    if (this.execDoneDelay >= 0.9) this._advanceChallenge();
  }

  _advanceChallenge() {
    if (this.challengeIndex + 1 >= this.totalChallenges) {
      this._finishGame(false);
      return;
    }

    this.playSfx(this.sfxWin, { volume: 0.7 });
    this.challengeIndex += 1;
    this._loadChallenge(this.challengeIndex);
    this.statusText = "Construcción correcta. Siguiente reto.";
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
      gained = window.MN_reportMinigameTier("regla_y_compas", tier);
    }
    this.sheetsReward = gained;

    const solved = failed ? this.challengeIndex : this.totalChallenges;
    if (this.win) {
      this.message =
        "Reto superado.\n" +
        `Construcciones completadas: ${solved}/${this.totalChallenges}\n` +
        `Errores: ${this.errors}/${this.maxErrors}\n` +
        `Hojas ganadas: ${gained}.`;
      this.playSfx(this.sfxWin, { volume: 0.7 });
    } else {
      this.message =
        "Te quedaste sin vidas.\n" +
        `Construcciones completadas: ${solved}/${this.totalChallenges}\n` +
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
      this._drawFrame(ctx, W, H);
      this._drawHeader(ctx, W);
      this._drawPanels(ctx);
      this._drawStepAreas(ctx);
      this._drawConstructionPanel(ctx);
      return;
    }

    if (this.state === "finished") {
      this._drawEndMessage(ctx, W, H);
    }
  }

  _drawBackground(ctx, W, H) {
    const bgImage = this.game.assets?.getImage?.("bg_regla_y_compas");
    if (bgImage) {
      ctx.drawImage(bgImage, 0, 0, W, H);
      return;
    }

    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#0a0f1d");
    g.addColorStop(1, "#151f3a");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  _drawFrame(ctx, W, H) {
    this._roundRect(ctx, 150, 54, W - 300, 94, 18, "rgba(15,18,32,0.82)");
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(225,232,255,0.28)";
    ctx.stroke();
  }

  _drawHUD(ctx) {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.62)";
    ctx.fillRect(16, 12, 330, 37);
    ctx.strokeStyle = "#7aa7ff";
    ctx.lineWidth = 2;
    ctx.strokeRect(16, 12, 330, 37);

    ctx.font = "16px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(
      `Reto: ${Math.min(this.challengeIndex + 1, this.totalChallenges)}/${this.totalChallenges}`,
      28,
      30,
    );
    ctx.fillText("Vidas:", 190, 30);
    const lives = Math.max(0, this.maxErrors - this.errors);
    for (let i = 0; i < this.maxErrors; i++) {
      ctx.fillStyle = i < lives ? "#ff4d6d" : "rgba(255,255,255,0.25)";
      this._drawHeart(ctx, 244 + i * 20, 21, 13);
    }
    ctx.restore();
  }

  _drawIntro(ctx, W, H) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    this._roundRect(ctx, 145, 138, W - 290, 338, 22, "rgba(15,18,32,0.74)");
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(225,232,255,0.24)";
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 36px Arial";
    ctx.fillText("Regla y Compás", W / 2, H * 0.26);

    ctx.font = "20px Arial";
    ctx.fillStyle = "#d8e6ff";
    ctx.fillText(
      "Elige paso a paso el siguiente movimiento correcto.",
      W / 2,
      H * 0.38,
    );
    ctx.fillText("Habra distractores para confundirte.", W / 2, H * 0.44);
    ctx.fillText(
      "Si aciertas, la construcción avanza. Si fallas, pierdes una vida.",
      W / 2,
      H * 0.5,
    );
    ctx.fillText("Completa 3 retos con maximo 2 errores.", W / 2, H * 0.56);

    ctx.fillStyle = "#ffffff";
    ctx.fillText("Pulsa ENTER o clic para comenzar.", W / 2, H * 0.66);
    ctx.restore();
  }

  _drawHeader(ctx, W) {
    if (!this.current) return;
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#eef2ff";
    ctx.font = "bold 28px Arial";
    ctx.fillText(this.current.title, W * 0.5, 84);
    ctx.font = "18px Arial";
    ctx.fillStyle = "#d8e6ff";
    const promptLines = this._wrapTextLines(ctx, this.current.prompt, 2, 700);
    const lineHeight = 22;
    const startY = promptLines.length > 1 ? 108 : 114;
    for (let i = 0; i < promptLines.length; i++) {
      ctx.fillText(promptLines[i], W * 0.5, startY + i * lineHeight);
    }
    ctx.restore();
  }

  _drawPanels(ctx) {
    this._roundRect(
      ctx,
      this.layout.left.x,
      this.layout.left.y,
      this.layout.left.w,
      this.layout.left.h,
      16,
      "rgba(21,26,46,0.96)",
    );
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.stroke();

    this._roundRect(
      ctx,
      this.layout.right.x,
      this.layout.right.y,
      this.layout.right.w,
      this.layout.right.h,
      16,
      "rgba(21,26,46,0.96)",
    );
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.stroke();
  }

  _drawStepAreas(ctx) {
    const L = this.layout.left;

    this.poolRects = [];
    this.selectedRects = [];
    const poolRowH = 52;
    const selectedRowH = 44;
    const topY = L.y + 48;
    const gap = 38;
    const poolRows = Math.max(1, this.poolSteps.length);
    const selectedRows = Math.max(1, this.selectedSteps.length);
    const poolHeight = Math.max(100, 44 + poolRows * poolRowH);
    const selectedY = topY + poolHeight + gap;
    const selectedHeight = Math.max(74, L.y + L.h - selectedY - 14);

    ctx.save();
    ctx.textAlign = "center";
    ctx.fillStyle = "#dce7ff";
    ctx.font = "bold 19px Arial";
    ctx.fillText("Pasos Disponibles", L.x + L.w * 0.5, L.y + 30);
    ctx.fillText("Secuencia Actual", L.x + L.w * 0.5, selectedY - 18);
    ctx.restore();

    const poolBox = { x: L.x + 14, y: topY, w: L.w - 28, h: poolHeight };
    const selectedBox = {
      x: L.x + 14,
      y: selectedY,
      w: L.w - 28,
      h: selectedHeight,
    };
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.fillRect(poolBox.x, poolBox.y, poolBox.w, poolBox.h);
    ctx.fillRect(selectedBox.x, selectedBox.y, selectedBox.w, selectedBox.h);
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.strokeRect(poolBox.x, poolBox.y, poolBox.w, poolBox.h);
    ctx.strokeRect(selectedBox.x, selectedBox.y, selectedBox.w, selectedBox.h);

    ctx.textAlign = "left";
    ctx.fillStyle = "#a9b8df";
    ctx.font = "15px Arial";
    ctx.fillText("Toca el paso que sigue", poolBox.x + 10, poolBox.y + 18);
    ctx.fillText(
      "Pasos correctos confirmados",
      selectedBox.x + 10,
      selectedBox.y + 18,
    );

    this.poolRects = this._drawStepList(
      ctx,
      this.poolSteps,
      poolBox.x + 8,
      poolBox.y + 30,
      poolBox.w - 16,
      poolRowH,
      false,
      poolBox.h - 36,
    );

    this.selectedRects = this._drawStepList(
      ctx,
      this.selectedSteps,
      selectedBox.x + 8,
      selectedBox.y + 30,
      selectedBox.w - 16,
      selectedRowH,
      true,
      selectedBox.h - 36,
    );
  }

  _drawConstructionPanel(ctx) {
    const p = this.layout.right;
    const view = { x: p.x + 18, y: p.y + 42, w: p.w - 36, h: p.h - 64 };

    ctx.save();
    ctx.textAlign = "center";
    ctx.fillStyle = "#dce7ff";
    ctx.font = "bold 20px Arial";
    ctx.fillText("Vista de Construcción", p.x + p.w * 0.5, p.y + 30);

    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.fillRect(view.x, view.y, view.w, view.h);
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.strokeRect(view.x, view.y, view.w, view.h);

    this._drawConstruction(ctx, this.current?.id, view, this.execStepVisible);

    ctx.font = "16px Arial";
    ctx.fillStyle = "#a9b8df";
    const stepMsg =
      this.execStepVisible >= this.current.expectedSteps.length
        ? "Construcción terminada"
        : `Paso ${this.execStepVisible} / ${this.current.expectedSteps.length}`;
    ctx.fillText(stepMsg, p.x + p.w * 0.5, p.y + p.h - 12);
    ctx.restore();
  }

  _drawStatusBar(ctx, W) {
    const x = 45;
    const y = 626;
    const w = W - 90;
    const h = 34;

    this._roundRect(ctx, x, y, w, h, 10, "rgba(6,9,18,0.92)");
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#eef2ff";
    ctx.font = "17px Arial";
    ctx.fillText(this.statusText || "", x + w * 0.5, y + h * 0.52);
  }

  _wrapTextLines(ctx, text, maxLines, maxWidth) {
    const words = String(text || "")
      .split(/\s+/)
      .filter(Boolean);
    if (!words.length) return [""];

    const lines = [];
    let current = words[0];

    for (let i = 1; i < words.length; i++) {
      const next = `${current} ${words[i]}`;
      if (ctx.measureText(next).width <= maxWidth) {
        current = next;
        continue;
      }

      lines.push(current);
      current = words[i];

      if (lines.length === maxLines - 1) {
        break;
      }
    }

    const consumedWords = lines.join(" ").split(/\s+/).filter(Boolean).length;
    const remaining = words.slice(consumedWords);
    if (remaining.length) {
      lines.push(remaining.join(" "));
    } else if (current) {
      lines.push(current);
    }

    return lines.slice(0, maxLines);
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

  _drawConstruction(ctx, id, view, steps) {
    const kind = this.current?.drawType || id;
    if (!kind) return;
    if (kind === "mediatriz") this._drawMediatriz(ctx, view, steps);
    else if (kind === "bisectriz") this._drawBisectriz(ctx, view, steps);
    else if (kind === "equilatero") this._drawEquilatero(ctx, view, steps);
    else if (kind === "paralela") this._drawParalela(ctx, view, steps);
    else if (kind === "perpendicular_punto")
      this._drawPerpendicularPunto(ctx, view, steps);
    else if (kind === "perpendicular_externo")
      this._drawPerpendicularExterno(ctx, view, steps);
    else if (kind === "hexagono") this._drawHexagono(ctx, view, steps);
    else if (kind === "copia_segmento")
      this._drawCopiaSegmento(ctx, view, steps);
    else if (kind === "angulo_60") this._drawAngulo60(ctx, view, steps);
    else if (kind === "triangulo_isosceles")
      this._drawTrianguloIsosceles(ctx, view, steps);
    else this._drawMediatriz(ctx, view, steps);
  }

  _drawMediatriz(ctx, view, steps) {
    const A = { x: view.x + 110, y: view.y + 250 };
    const B = { x: view.x + 340, y: view.y + 220 };
    const r = 170;
    const intersections = this._circleIntersections(A, r, B, r);
    const I1 =
      intersections.length >= 2
        ? intersections.reduce(
            (best, p) => (p.y < best.y ? p : best),
            intersections[0],
          )
        : { x: view.x + 210, y: view.y + 120 };
    const I2 =
      intersections.length >= 2
        ? intersections.reduce(
            (best, p) => (p.y > best.y ? p : best),
            intersections[0],
          )
        : { x: view.x + 250, y: view.y + 340 };

    if (steps >= 1) this._drawSegment(ctx, A, B, "#e6efff", 3);
    if (steps >= 2) this._drawCompasArcToward(ctx, A, B, r, 1.06, "#7bdff2", 2);
    if (steps >= 3) this._drawCompasArcToward(ctx, B, A, r, 1.06, "#7bdff2", 2);
    if (steps >= 4) this._drawSegment(ctx, I1, I2, "#ffd166", 3);

    this._drawPoint(ctx, A.x, A.y, 4, "#ffffff");
    this._drawPoint(ctx, B.x, B.y, 4, "#ffffff");
    this._label(ctx, "A", A.x - 12, A.y - 10);
    this._label(ctx, "B", B.x + 10, B.y - 6);
  }

  _drawBisectriz(ctx, view, steps) {
    const O = { x: view.x + 180, y: view.y + 270 };
    const A = { x: view.x + 380, y: view.y + 260 };
    const B = { x: view.x + 270, y: view.y + 90 };
    const firstArcRadius = 125;
    const c1 = this._pointAlongRay(O, A, firstArcRadius);
    const c2 = this._pointAlongRay(O, B, firstArcRadius);
    const intersections = this._circleIntersections(c1, 88, c2, 88);
    const T =
      intersections.length > 0
        ? intersections.reduce(
            (best, p) =>
              Math.hypot(p.x - O.x, p.y - O.y) <
              Math.hypot(best.x - O.x, best.y - O.y)
                ? p
                : best,
            intersections[0],
          )
        : { x: view.x + 255, y: view.y + 210 };
    const rayEnd = this._pointAlongRay(O, T, 210);
    
    this._drawSegment(ctx, O, A, "#e6efff", 3);
    this._drawSegment(ctx, O, B, "#e6efff", 3);    
    if (steps >= 1)
      this._drawArc(ctx, O.x, O.y, firstArcRadius, -1.1, 0.05, "#7bdff2", 2);
    if (steps >= 2) {
      this._drawCompasArcToward(ctx, c1, c2, 88, 0.95, "#7bdff2", 2);
      this._drawCompasArcToward(ctx, c2, c1, 88, 0.95, "#7bdff2", 2);
    }
    if (steps >= 3) this._drawSegment(ctx, O, rayEnd, "#ffd166", 3);

    this._drawPoint(ctx, O.x, O.y, 4, "#ffffff");
    this._label(ctx, "O", O.x - 12, O.y + 16);
    if (steps >= 1) {
      this._drawPoint(ctx, c1.x, c1.y, 4, "#ffffff");
      this._drawPoint(ctx, c2.x, c2.y, 4, "#ffffff");
      this._label(ctx, "P", c1.x + 8, c1.y + 12);
      this._label(ctx, "Q", c2.x - 12, c2.y - 8);
    }
  }

  _drawEquilatero(ctx, view, steps) {
    const A = { x: view.x + 140, y: view.y + 300 };
    const B = { x: view.x + 360, y: view.y + 300 };
    const r = 220;
    const intersections = this._circleIntersections(A, r, B, r);
    const C =
      intersections.length >= 2
        ? intersections.reduce(
            (best, p) => (p.y < best.y ? p : best),
            intersections[0],
          )
        : { x: view.x + 250, y: view.y + 110 };

    if (steps >= 1) this._drawSegment(ctx, A, B, "#e6efff", 3);
    if (steps >= 2) this._drawCompasArcToward(ctx, A, B, r, 1.22, "#7bdff2", 2);
    if (steps >= 3) this._drawCompasArcToward(ctx, B, A, r, 1.22, "#7bdff2", 2);
    if (steps >= 4) {
      this._drawSegment(ctx, A, C, "#ffd166", 3);
      this._drawSegment(ctx, B, C, "#ffd166", 3);
    }

    this._drawPoint(ctx, A.x, A.y, 4, "#ffffff");
    this._drawPoint(ctx, B.x, B.y, 4, "#ffffff");
    this._label(ctx, "A", A.x - 12, A.y + 12);
    this._label(ctx, "B", B.x + 10, B.y + 12);
    if (steps >= 4) this._label(ctx, "C", C.x + 2, C.y - 23);
  }

  _drawParalela(ctx, view, steps) {
    const A = { x: view.x + 90, y: view.y + 280 };
    const B = { x: view.x + 390, y: view.y + 240 };
    const P = { x: view.x + 170, y: view.y + 130 };
    const lineDir = { x: B.x - A.x, y: B.y - A.y };
    const secantDir = { x: 86, y: 122 };
    const secantLen = Math.hypot(secantDir.x, secantDir.y);
    const secantUnit = {
      x: secantDir.x / secantLen,
      y: secantDir.y / secantLen,
    };
    const S = this._lineIntersection(A, B, P, {
      x: P.x + secantUnit.x * 200,
      y: P.y + secantUnit.y * 200,
    }) || { x: view.x + 255, y: view.y + 252 };
    const copiedEnd = {
      x: P.x + lineDir.x,
      y: P.y + lineDir.y,
    };
    const sourceArcRadius = 70;
    const sourceArcStart = Math.atan2(P.y - S.y, P.x - S.x);
    const sourceArcEnd = Math.atan2(B.y - S.y, B.x - S.x);
    const sourceArcSweep = this._minorArcSweep(sourceArcStart, sourceArcEnd);
    const copiedArcStart = Math.atan2(S.y - P.y, S.x - P.x);
    const copiedArcEnd = copiedArcStart + sourceArcSweep;
    const copiedDir = {
      x: Math.cos(copiedArcEnd),
      y: Math.sin(copiedArcEnd),
    };
    const copiedRayLength = Math.hypot(lineDir.x, lineDir.y);
    const copiedLineEnd = {
      x: P.x + copiedDir.x * copiedRayLength,
      y: P.y + copiedDir.y * copiedRayLength,
    };
    const copiedStart = {
      x: P.x - copiedDir.x * copiedRayLength * 0.7,
      y: P.y - copiedDir.y * copiedRayLength * 0.7,
    };

    if (steps >= 1) this._drawSegment(ctx, A, B, "#e6efff", 3);
    if (steps >= 2) this._drawSegment(ctx, P, S, "#7bdff2", 2);
    if (steps >= 3)
      this._drawMinorArc(
        ctx,
        S.x,
        S.y,
        sourceArcRadius,
        sourceArcStart,
        sourceArcEnd,
        "#7bdff2",
        2,
      );
    if (steps >= 4)
      this._drawMinorArc(
        ctx,
        P.x,
        P.y,
        sourceArcRadius,
        copiedArcStart,
        copiedArcEnd,
        "#7bdff2",
        2,
      );
    if (steps >= 5)
      this._drawSegment(ctx, copiedStart, copiedLineEnd, "#ffd166", 3);

    if (steps >= 1) this._drawPoint(ctx, P.x, P.y, 4, "#ffffff");
    if (steps >= 2) this._drawPoint(ctx, S.x, S.y, 3, "#7bdff2");
    if (steps >= 1) this._label(ctx, "P", P.x - 10, P.y - 12);
    if (steps >= 2) this._label(ctx, "A", S.x - 14, S.y + 18);
    if (steps >= 1) this._label(ctx, "r", B.x + 6, B.y - 6);
  }

  _drawPerpendicularPunto(ctx, view, steps) {
    const A = { x: view.x + 90, y: view.y + 240 };
    const B = { x: view.x + 390, y: view.y + 240 };
    const P = { x: view.x + 220, y: view.y + 240 };
    const A1 = { x: view.x + 155, y: view.y + 240 };
    const B1 = { x: view.x + 285, y: view.y + 240 };
    const intersections = this._circleIntersections(A1, 132, B1, 132);
    const Q =
      intersections.length >= 2
        ? intersections.reduce(
            (best, p) => (p.y < best.y ? p : best),
            intersections[0],
          )
        : { x: view.x + 220, y: view.y + 120 };
    const lineTop = this._pointAlongRay(P, Q, 180);
    const lineBottom = this._pointAlongRay(
      P,
      { x: P.x - (Q.x - P.x), y: P.y - (Q.y - P.y) },
      70,
    );

    if (steps >= 1) this._drawSegment(ctx, A, B, "#e6efff", 3);
    if (steps >= 2) {
      this._drawPoint(ctx, A1.x, A1.y, 4, "#7bdff2");
      this._drawPoint(ctx, B1.x, B1.y, 4, "#7bdff2");
    }
    if (steps >= 3) {
      this._drawCompasArcToward(ctx, A1, B1, 132, 1.12, "#7bdff2", 2);
      this._drawCompasArcToward(ctx, B1, A1, 132, 1.12, "#7bdff2", 2);
    }
    if (steps >= 4) this._drawSegment(ctx, lineBottom, lineTop, "#ffd166", 3);

    if (steps >= 1) this._drawPoint(ctx, P.x, P.y, 4, "#ffffff");
    if (steps >= 3) this._drawPoint(ctx, Q.x, Q.y, 3, "#7bdff2");
    if (steps >= 2) this._label(ctx, "A", A1.x - 12, A1.y + 16);
    if (steps >= 2) this._label(ctx, "B", B1.x + 8, B1.y + 16);
    if (steps >= 1)this._label(ctx, "P", P.x - 10, P.y + 16);
    if (steps >= 3) this._label(ctx, "Q", Q.x + 8, Q.y - 12);
  }

  _drawPerpendicularExterno(ctx, view, steps) {
    const A = { x: view.x + 90, y: view.y + 290 };
    const B = { x: view.x + 390, y: view.y + 260 };
    const P = { x: view.x + 240, y: view.y + 120 };
    const lineHits = this._lineCircleIntersections(A, B, P, 175);
    const sortedLineHits =
      lineHits.length >= 2
        ? lineHits.slice().sort((p1, p2) => p1.x - p2.x)
        : null;
    const C1 = sortedLineHits
      ? sortedLineHits[0]
      : { x: view.x + 170, y: view.y + 282 };
    const C2 = sortedLineHits
      ? sortedLineHits[1]
      : { x: view.x + 318, y: view.y + 267 };
    const arcIntersections = this._circleIntersections(C1, 120, C2, 120);
    const Q =
      arcIntersections.length >= 2
        ? arcIntersections.reduce(
            (best, p) => (p.y > best.y ? p : best),
            arcIntersections[0],
          )
        : { x: view.x + 245, y: view.y + 356 };

    if (steps >= 1) this._drawSegment(ctx, A, B, "#e6efff", 3);
    if (steps >= 2)
      this._drawCompasArcToward(
        ctx,
        P,
        { x: view.x + 260, y: view.y + 280 },
        175,
        0.5,
        "#7bdff2",
        2,
      );
    if (steps >= 3) {
      this._drawCompasArcToward(ctx, C1, C2, 120, 0.95, "#7bdff2", 2);
      this._drawCompasArcToward(ctx, C2, C1, 120, 0.95, "#7bdff2", 2);
    }
    if (steps >= 4) this._drawSegment(ctx, P, Q, "#ffd166", 3);

    if (steps >= 1) this._drawPoint(ctx, P.x, P.y, 4, "#ffffff");
    if (steps >= 2) {
      this._drawPoint(ctx, C1.x, C1.y, 4, "#ffffff");
      this._drawPoint(ctx, C2.x, C2.y, 4, "#ffffff");
      this._label(ctx, "A", C1.x - 12, C1.y + 16);
      this._label(ctx, "B", C2.x + 8, C2.y + 16);
    }
    if (steps >= 1) this._label(ctx, "P", P.x - 10, P.y - 12);
    if (steps >= 3) {
      this._drawPoint(ctx, Q.x, Q.y, 3, "#7bdff2");
      this._label(ctx, "Q", Q.x + 8, Q.y);
    }
  }

  _drawHexagono(ctx, view, steps) {
    const O = { x: view.x + 240, y: view.y + 220 };
    const r = 110;
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (Math.PI * 2 * i) / 6;
      pts.push({ x: O.x + Math.cos(a) * r, y: O.y + Math.sin(a) * r });
    }
    if (steps >= 1)
      this._drawArc(ctx, O.x, O.y, r, 0, Math.PI * 2, "#7bdff2", 2);
    if (steps >= 2) this._drawPoint(ctx, pts[0].x, pts[0].y, 4, "#ffffff");
    if (steps >= 3)
      for (const p of pts) this._drawPoint(ctx, p.x, p.y, 3, "#7bdff2");
    if (steps >= 4) {
      for (let i = 0; i < 6; i++) {
        this._drawSegment(ctx, pts[i], pts[(i + 1) % 6], "#ffd166", 3);
      }
    }
    if (steps >= 1) this._drawPoint(ctx, O.x, O.y, 3, "#ffffff");
    if (steps >= 2) this._label(ctx, "A", pts[0].x + 8, pts[0].y - 8);
    if (steps >= 1) this._label(ctx, "O", O.x + 8, O.y - 6);
  }

  _drawCopiaSegmento(ctx, view, steps) {
    const A = { x: view.x + 90, y: view.y + 130 };
    const B = { x: view.x + 240, y: view.y + 130 };
    const P = { x: view.x + 120, y: view.y + 300 };
    const rayEnd = { x: view.x + 390, y: view.y + 270 };
    const segmentLen = Math.hypot(B.x - A.x, B.y - A.y);
    const Q = this._pointAlongRay(P, rayEnd, segmentLen);

    this._drawSegment(ctx, A, B, "#9eb4ff", 2);
    this._label(ctx, "AB", A.x + 70, A.y - 14);
    if (steps >= 1) this._drawSegment(ctx, P, rayEnd, "#e6efff", 3);
    if (steps >= 2)
      this._drawCompasArcToward(ctx, A, B, segmentLen, 0.55, "#7bdff2", 2);
    if (steps >= 3)
      this._drawCompasArcToward(ctx, P, Q, segmentLen, 0.55, "#7bdff2", 2);
    if (steps >= 4) this._drawSegment(ctx, P, Q, "#ffd166", 3);

    this._drawPoint(ctx, A.x, A.y, 4, "#ffffff");
    this._drawPoint(ctx, B.x, B.y, 4, "#ffffff");
    if (steps >= 1) this._drawPoint(ctx, P.x, P.y, 4, "#ffffff");
    if (steps >= 3) this._drawPoint(ctx, Q.x, Q.y, 3, "#7bdff2");
    this._label(ctx, "A", A.x - 12, A.y + 16);
    this._label(ctx, "B", B.x + 8, B.y + 16);
    if (steps >= 1) this._label(ctx, "P", P.x - 12, P.y + 16);
  }

  _drawAngulo60(ctx, view, steps) {
    const O = { x: view.x + 150, y: view.y + 280 };
    const A = { x: view.x + 330, y: view.y + 280 };
    const r = Math.hypot(A.x - O.x, A.y - O.y);
    const intersections = this._circleIntersections(O, r, A, r);
    const B =
      intersections.length >= 2
        ? intersections.reduce(
            (best, p) => (p.y < best.y ? p : best),
            intersections[0],
          )
        : { x: view.x + 240, y: view.y + 124 };
    const arcOA = Math.atan2(A.y - O.y, A.x - O.x);
    const arcOB = Math.atan2(B.y -1 - O.y, B.x -1 - O.x);
    const arcAO = Math.atan2(O.y - A.y, O.x - A.x);
    const arcAB = Math.atan2(B.y - A.y, B.x - A.x);

    if (steps >= 1) this._drawSegment(ctx, O, A, "#e6efff", 3);
    if (steps >= 2)
      this._drawMinorArc(ctx, O.x, O.y, r, arcOB, arcOA, "#7bdff2", 2);
    if (steps >= 3)
      this._drawMinorArc(ctx, A.x, A.y, r, arcAO, arcAB, "#7bdff2", 2);
    if (steps >= 4) this._drawSegment(ctx, O, B, "#ffd166", 3);

    if (steps >= 1) this._drawPoint(ctx, O.x, O.y, 4, "#ffffff");
    if (steps >= 2) this._drawPoint(ctx, A.x, A.y, 4, "#ffffff");
    if (steps >= 3) this._drawPoint(ctx, B.x, B.y, 3, "#7bdff2");
    if (steps >= 1) this._label(ctx, "O", O.x - 12, O.y + 16);
    if (steps >= 2) this._label(ctx, "A", A.x + 8, A.y + 16);
    if (steps >= 3) this._label(ctx, "B", B.x + 8, B.y - 12);
  }

  _drawTrianguloIsosceles(ctx, view, steps) {
    const A = { x: view.x + 130, y: view.y + 300 };
    const B = { x: view.x + 350, y: view.y + 300 };
    const r = 170;
    const intersections = this._circleIntersections(A, r, B, r);
    const C =
      intersections.length >= 2
        ? intersections.reduce(
            (best, p) => (p.y < best.y ? p : best),
            intersections[0],
          )
        : { x: view.x + 240, y: view.y + 150 };

    if (steps >= 1) this._drawSegment(ctx, A, B, "#e6efff", 3);
    if (steps >= 2) this._drawCompasArcToward(ctx, A, B, r, 0.9, "#7bdff2", 2);
    if (steps >= 3) this._drawCompasArcToward(ctx, B, A, r, 0.9, "#7bdff2", 2);
    if (steps >= 4) {
      this._drawSegment(ctx, A, C, "#ffd166", 3);
      this._drawSegment(ctx, B, C, "#ffd166", 3);
    }

    this._drawPoint(ctx, A.x, A.y, 4, "#ffffff");
    this._drawPoint(ctx, B.x, B.y, 4, "#ffffff");
    if (steps >= 4) this._drawPoint(ctx, C.x, C.y, 3, "#7bdff2");
    this._label(ctx, "A", A.x - 12, A.y + 16);
    this._label(ctx, "B", B.x + 8, B.y + 16);
    if (steps >= 4) this._label(ctx, "C", C.x + 8, C.y - 12);
  }

  _drawStepList(
    ctx,
    steps,
    x,
    y,
    w,
    h,
    selected,
    maxHeight = Number.POSITIVE_INFINITY,
  ) {
    const rects = [];
    for (let i = 0; i < steps.length; i++) {
      const yy = y + i * h;
      if (yy + h > y + maxHeight) break;
      const r = { x, y: yy, w, h: h - 4 };
      rects.push({ rect: r, step: steps[i] });

      ctx.fillStyle = selected
        ? "rgba(123,223,242,0.18)"
        : "rgba(255,255,255,0.08)";
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = selected
        ? "rgba(123,223,242,0.45)"
        : "rgba(255,255,255,0.18)";
      ctx.strokeRect(r.x, r.y, r.w, r.h);

      ctx.fillStyle = "#eef2ff";
      ctx.font = "14px Arial";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      const label = selected ? `${i + 1}. ${steps[i].text}` : steps[i].text;
      this._drawWrappedClampedText(
        ctx,
        label,
        r.x + 8,
        r.y + 8,
        r.w - 14,
        2,
        16,
      );
    }
    return rects;
  }

  _drawButton(ctx, rect, text, enabled) {
    ctx.save();
    ctx.fillStyle = enabled
      ? "rgba(123,223,242,0.22)"
      : "rgba(255,255,255,0.08)";
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeStyle = enabled
      ? "rgba(123,223,242,0.9)"
      : "rgba(255,255,255,0.22)";
    ctx.lineWidth = 2;
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = enabled ? "#eaf5ff" : "#9aa7c8";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, rect.x + rect.w * 0.5, rect.y + rect.h * 0.55);
    ctx.restore();
  }

  _buildChallenges() {
    return [
      {
        id: "mediatriz",
        drawType: "mediatriz",
        difficulty: "easy",
        title: "Mediatriz de un Segmento",
        prompt: "Ordena el procedimiento para construir la mediatriz de AB.",
        expectedSteps: [
          "Traza el segmento AB.",
          "Con centro en A, dibuja un arco mayor a la mitad de AB.",
          "Con centro en B y el mismo radio, dibuja otro arco que corte al anterior.",
          "Une los puntos de intersección de los arcos.",
        ],
        distractors: [
          "Une A y B con el punto de intersección superior.",
          "Abre el compás con una longitud menor a la mitad de AB.",
        ],
      },
      {
        id: "bisectriz",
        drawType: "bisectriz",
        difficulty: "medium",
        title: "Bisectriz de un Ángulo",
        prompt:
          "Ordena el procedimiento para construir la bisectriz de un ángulo.",
        expectedSteps: [          
          "Con centro en O, dibuja un arco que corte ambos lados del ángulo.",
          "Desde esos dos cortes, dibuja arcos de igual radio que se crucen.",
          "Une O con el punto de cruce de esos arcos.",
        ],
        distractors: [
          "Une los puntos de intersección de los arcos.",
          "Traza una semirrecta de origen O.",
        ],
      },
      {
        id: "equilatero",
        drawType: "equilatero",
        difficulty: "easy",
        title: "Triángulo Equilatero sobre AB",
        prompt:
          "Ordena el procedimiento para construir un triángulo equilatero sobre AB.",
        expectedSteps: [
          "Traza el segmento AB.",
          "Con centro en A y radio AB, dibuja un arco.",
          "Con centro en B y radio AB, dibuja otro arco que lo interseque.",
          "Une A y B con el punto de intersección superior.",
        ],
        distractors: [
          "Traza una perpendicular por B al segmento AB.",
          "Une los puntos de intersección de los arcos.",
        ],
      },
      {
        id: "paralela_punto",
        drawType: "paralela",
        difficulty: "medium",
        title: "Paralela por un Punto",
        prompt:
          "Ordena el procedimiento para copiar en P el ángulo que forma una secante con r y asi trazar una paralela.",
        expectedSteps: [
          "Traza la recta r y marca el punto P fuera de ella.",
          "Dibuja una secante por P que corte a r en A.",
          "Con centro en A, dibuja un arco que corte a la recta r y a la secante.",
          "Con centro en P, dibuja un arco con la misma abertura para trasladar el ángulo.",
          "Traza por P la recta que define el ángulo copiado.",
        ],
        distractors: [
          "Dibuja un círculo con centro en P y radio cualquiera.",
          "Une P con el punto medio de la recta r.",
        ],
      },
      {
        id: "perpendicular_punto",
        drawType: "perpendicular_punto",
        difficulty: "easy",
        title: "Perpendicular por un Punto",
        prompt:
          "Ordena el procedimiento para trazar una perpendicular a r por un punto P sobre r.",
        expectedSteps: [
          "Traza la recta r y marca el punto P sobre ella.",
          "Con centro en P, marca dos puntos A y B equidistantes sobre r.",
          "Con centros A y B, traza arcos de igual radio que se crucen.",
          "Une P con el punto de cruce de los arcos.",
        ],
        distractors: [
          "Dibuja una recta paralela a r por P.",
          "Une A y B con el punto de intersección superior.",
        ],
      },
      {
        id: "perpendicular_externo",
        drawType: "perpendicular_externo",
        difficulty: "hard",
        title: "Perpendicular desde Punto Externo",
        prompt:
          "Ordena el procedimiento para bajar una perpendicular desde P a la recta r.",
        expectedSteps: [
          "Traza la recta r y marca un punto externo P.",
          "Con centro en P, dibuja un arco que corte a r en A y B.",
          "Con centros A y B, dibuja arcos que se crucen en Q.",
          "Traza la recta PQ para obtener la perpendicular.",
        ],
        distractors: [
          "Une A y B con el punto P.",
          "Traza por Q una recta paralela a r.",
        ],
      },
      {
        id: "hexagono_regular",
        drawType: "hexagono",
        difficulty: "hard",
        title: "Hexagono Regular",
        prompt:
          "Ordena el procedimiento para construir un hexágono regular con compás y regla.",
        expectedSteps: [
          "Dibuja una circunferencia de centro O.",
          "Marca un punto A sobre la circunferencia.",
          "Con el radio de la circunferencia, marca seis puntos consecutivos sobre ella.",
          "Une los seis puntos consecutivos para formar el hexagono.",
        ],
        distractors: [
          "Une solo tres puntos alternados para formar un triángulo.",
          "Duplica el radio antes de marcar los puntos.",
        ],
      },
      {
        id: "copia_segmento",
        drawType: "copia_segmento",
        difficulty: "easy",
        title: "Copia de Segmento",
        prompt:
          "Ordena el procedimiento para copiar un segmento AB desde un punto P.",
        expectedSteps: [
          "Traza una semirrecta de origen P.",
          "Abre el compás con la longitud del segmento AB.",
          "Con centro en P, marca sobre la semirrecta el punto Q con esa abertura.",
        ],
        distractors: [
          "Dibuja una circunferencia de centro P.",
          "Traza la mediatriz de AB antes de copiarlo.",
        ],
      },
      {
        id: "punto_medio",
        drawType: "mediatriz",
        difficulty: "medium",
        title: "Punto Medio de un Segmento",
        prompt: "Ordena el procedimiento para hallar el punto medio de AB.",
        expectedSteps: [
          "Traza el segmento AB.",
          "Con centro en A, dibuja arcos de radio mayor que la mitad del segmento AB.",
          "Con centro en B y el mismo radio, dibuja arcos que corten a los anteriores.",
          "Une los cruces y marca su intersección con AB como punto medio.",
        ],
        distractors: [
          "Traza una paralela por A al segmento AB.",
          "Duplica la longitud AB para ubicar el punto medio.",
        ],
      },
      {
        id: "angulo_60",
        drawType: "angulo_60",
        difficulty: "medium",
        title: "Ángulo de 60 Grados",
        prompt:
          "Ordena el procedimiento para construir un ángulo de 60 grados desde una semirrecta.",
        expectedSteps: [
          "Traza una semirrecta de origen O.",
          "Con centro en O, dibuja un arco que corte la semirrecta en A.",
          "Con centro en A y mismo radio, marca sobre el arco el punto B.",
          "Une O con B para formar el ángulo de 60 grados.",
        ],
        distractors: [
          "Traza una perpendicular por A a la semirrecta.",
          "Une los puntos de intersección.",
        ],
      },
      {
        id: "triangulo_isosceles_base",
        drawType: "triangulo_isosceles",
        difficulty: "hard",
        title: "Triángulo Isósceles sobre Base AB",
        prompt:
          "Ordena el procedimiento para construir un triángulo isósceles sobre AB.",
        expectedSteps: [
          "Traza el segmento base AB.",
          "Con centro en A, dibuja un arco de radio elegido.",
          "Con centro en B y el mismo radio, dibuja un arco que corte al anterior.",
          "Une A y B con el punto de intersección de los arcos.",
        ],
        distractors: [
          "Une los puntos de intersección de los arcos.",
          "Con centro en A, dibuja un arco de radio menor a la mitad de AB.",
        ],
      },
    ];
  }

  _pickChallenges(n) {
    const all = this._getUniqueChallenges();
    const target = Math.max(1, Math.min(n, all.length));
    const selected = [];

    const easy = this._shuffle(all.filter((c) => c.difficulty === "easy"));
    const medium = this._shuffle(all.filter((c) => c.difficulty === "medium"));
    const hard = this._shuffle(all.filter((c) => c.difficulty === "hard"));

    const takeOne = (bucket) => {
      if (!bucket.length || selected.length >= target) return;
      const item = bucket.pop();
      if (!selected.includes(item)) selected.push(item);
    };

    // Balance por defecto para partidas de 3: 1 facil + 1 medio + 1 dificil.
    // Si faltan de algun nivel, se rellena mas abajo con lo que haya.
    takeOne(easy);
    if (target >= 2) takeOne(medium);
    if (target >= 3) takeOne(hard);

    const remaining = this._shuffle(all.filter((c) => !selected.includes(c)));
    while (selected.length < target && remaining.length > 0) {
      selected.push(remaining.pop());
    }

    // Garantia minima: al menos 1 facil cuando existan faciles en catalogo.
    if (
      easy.length + selected.filter((c) => c.difficulty === "easy").length >
      0
    ) {
      const hasEasy = selected.some((c) => c.difficulty === "easy");
      if (!hasEasy) {
        const easyFromAll = all.find((c) => c.difficulty === "easy");
        if (easyFromAll && selected.length > 0) selected[0] = easyFromAll;
      }
    }

    return this._shuffle(selected);
  }

  _getUniqueChallenges() {
    const all = Array.isArray(this.challengeCatalog) ? this.challengeCatalog : [];
    const seen = new Set();
    return all.filter((challenge) => {
      if (!challenge) return false;
      const signature = [
        challenge.title || "",
        challenge.prompt || "",
        challenge.difficulty || "",
        ...(Array.isArray(challenge.expectedSteps) ? challenge.expectedSteps : []),
      ].join("||");
      if (seen.has(signature)) return false;
      seen.add(signature);
      return true;
    });
  }

  _isSequenceValid(challengeId, order) {
    const expected = this.current?.expectedSteps || [];
    if (order.length !== expected.length) return false;

    const sortedOrder = order.slice().sort().join("|");
    const sortedExpected = expected.slice().sort().join("|");
    if (sortedOrder !== sortedExpected) return false;

    return expected.every((step, i) => order[i] === step);
  }

  _drawClampedText(ctx, text, x, y, maxWidth) {
    let out = text;
    while (ctx.measureText(out).width > maxWidth && out.length > 3) {
      out = out.slice(0, -2);
    }
    if (out !== text) out = `${out}...`;
    ctx.fillText(out, x, y);
  }

  _drawWrappedClampedText(
    ctx,
    text,
    x,
    y,
    maxWidth,
    maxLines = 2,
    lineHeight = 16,
  ) {
    const lines = this._wrapTextLines(ctx, text, maxLines, maxWidth);
    for (let i = 0; i < lines.length; i++) {
      const lineText =
        ctx.measureText(lines[i]).width > maxWidth
          ? this._getClampedLine(ctx, lines[i], maxWidth)
          : lines[i];
      ctx.fillText(lineText, x, y + i * lineHeight);
    }
  }

  _getClampedLine(ctx, text, maxWidth) {
    let out = text;
    while (ctx.measureText(`${out}...`).width > maxWidth && out.length > 3) {
      out = out.slice(0, -2);
    }
    return out !== text ? `${out}...` : out;
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

  _pointAlongRay(origin, through, distance) {
    const dx = through.x - origin.x;
    const dy = through.y - origin.y;
    const len = Math.hypot(dx, dy);
    if (len < 1e-6) return { x: origin.x, y: origin.y };
    const s = distance / len;
    return { x: origin.x + dx * s, y: origin.y + dy * s };
  }

  _circleIntersections(c1, r1, c2, r2) {
    const dx = c2.x - c1.x;
    const dy = c2.y - c1.y;
    const d = Math.hypot(dx, dy);
    if (d < 1e-6) return [];
    if (d > r1 + r2 + 1e-6) return [];
    if (d < Math.abs(r1 - r2) - 1e-6) return [];

    const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
    const h2 = r1 * r1 - a * a;
    if (h2 < -1e-6) return [];
    const h = Math.sqrt(Math.max(0, h2));

    const xm = c1.x + (a * dx) / d;
    const ym = c1.y + (a * dy) / d;
    const rx = (-dy * h) / d;
    const ry = (dx * h) / d;

    if (h < 1e-6) return [{ x: xm, y: ym }];
    return [
      { x: xm + rx, y: ym + ry },
      { x: xm - rx, y: ym - ry },
    ];
  }

  _lineCircleIntersections(p1, p2, center, radius) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const fx = p1.x - center.x;
    const fy = p1.y - center.y;

    const a = dx * dx + dy * dy;
    if (a < 1e-6) return [];
    const b = 2 * (fx * dx + fy * dy);
    const c = fx * fx + fy * fy - radius * radius;
    const disc = b * b - 4 * a * c;
    if (disc < -1e-6) return [];

    const sqrtDisc = Math.sqrt(Math.max(0, disc));
    const t1 = (-b - sqrtDisc) / (2 * a);
    const t2 = (-b + sqrtDisc) / (2 * a);

    if (Math.abs(t1 - t2) < 1e-6) {
      return [{ x: p1.x + dx * t1, y: p1.y + dy * t1 }];
    }
    return [
      { x: p1.x + dx * t1, y: p1.y + dy * t1 },
      { x: p1.x + dx * t2, y: p1.y + dy * t2 },
    ];
  }

  _lineIntersection(a1, a2, b1, b2) {
    const dax = a2.x - a1.x;
    const day = a2.y - a1.y;
    const dbx = b2.x - b1.x;
    const dby = b2.y - b1.y;
    const det = dax * dby - day * dbx;
    if (Math.abs(det) < 1e-6) return null;

    const dx = b1.x - a1.x;
    const dy = b1.y - a1.y;
    const t = (dx * dby - dy * dbx) / det;
    return {
      x: a1.x + dax * t,
      y: a1.y + day * t,
    };
  }

  _drawSegment(ctx, p1, p2, stroke, width) {
    ctx.save();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    ctx.restore();
  }

  _drawArc(ctx, cx, cy, r, a1, a2, stroke, width) {
    ctx.save();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.arc(cx, cy, r, a1, a2);
    ctx.stroke();
    ctx.restore();
  }

  _drawMinorArc(ctx, cx, cy, r, a1, a2, stroke, width) {
    const tau = Math.PI * 2;
    let start = a1;
    let end = a2;
    while (end - start > Math.PI) end -= tau;
    while (end - start < -Math.PI) end += tau;
    this._drawArc(ctx, cx, cy, r, start, end, stroke, width);
  }

  _minorArcSweep(a1, a2) {
    const tau = Math.PI * 2;
    let sweep = a2 - a1;
    while (sweep > Math.PI) sweep -= tau;
    while (sweep < -Math.PI) sweep += tau;
    return sweep;
  }

  _drawArcPair(ctx, center, r, stroke) {
    this._drawArc(ctx, center.x, center.y, r, -1.2, -0.2, stroke, 2);
    this._drawArc(ctx, center.x, center.y, r, 0.25, 1.25, stroke, 2);
  }

  _drawCompasArcToward(ctx, center, toward, r, spread, stroke, width) {
    const base = Math.atan2(toward.y - center.y, toward.x - center.x);
    this._drawArc(
      ctx,
      center.x,
      center.y,
      r,
      base - spread,
      base + spread,
      stroke,
      width,
    );
  }

  _drawPoint(ctx, x, y, radius, fill) {
    ctx.save();
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _label(ctx, text, x, y) {
    ctx.save();
    ctx.font = "15px Arial";
    ctx.fillStyle = "#dce7ff";
    ctx.fillText(text, x, y);
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
}

window.ReglaYCompasScene = ReglaYCompasScene;
