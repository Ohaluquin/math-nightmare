// js/areas/geometria/niveles/cartesianoScene.js
// ===========================================================
// CartesianoScene - "Plano Cartesiano"
// - Se genera un punto aleatorio (x, y).
// - Debes seleccionarlo correctamente con el mouse.
// - Ganas con 10 aciertos, pierdes con 3 errores.
// ===========================================================

class CartesianoScene extends Scene {
  constructor(game, options = {}) {
    super(game);

    // Estado general
    this.state = "intro"; // intro | playing | impact | finished
    this.gameFinished = false;
    this.exitDelay = 0;
    this.win = false;
    this.message = "";
    this.sheetsReward = 0;

    // Config
    this.options = options;
    this.maxLives = options.maxLives ?? 3;
    this.targetHits = options.targetHits ?? 10;
    this.gridLimit = options.gridLimit ?? 8;
    this.turnTimeLimit = options.turnTimeLimit ?? 10;

    // Progreso
    this.hits = 0;
    this.errors = 0;

    // Ronda actual
    this.currentTarget = null; // {x, y}
    this.lastClick = null; // {x, y, correct, ttl}
    this.statusText = "";
    this.impactState = null;
    this.timeLeft = this.turnTimeLimit;
    this.shakeTime = 0;
    this.shakeDuration = 0.5;
    this.shakeIntensity = 14;
    this.towerBlast = null;

    // Input edge tracking
    this._prevKeys = {
      Enter: false,
      " ": false,
      Escape: false,
    };
    this._prevMouseDown = false;

    // Geometria del tablero
    this.board = {
      x: 188,
      y: 130,
      w: 644,
      h: 500,
      pad: 40,
    };

    // Sonidos
    this.sfxCorrect = options.sfxCorrect ?? "sfx_match";
    this.sfxWrong = options.sfxWrong ?? "sfx_error";
    this.sfxWin = options.sfxWin ?? "sfx_win";
    this.sfxLose = options.sfxLose ?? null;
    this.sfxPage = options.sfxPage ?? "sfx_change_page";
    this.sfxExplosion = options.sfxExplosion ?? "sfx_explosion";
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

    this.hits = 0;
    this.errors = 0;
    this.lastClick = null;
    this.statusText = "";
    this.impactState = null;
    this.timeLeft = this.turnTimeLimit;
    this.shakeTime = 0;
    this.towerBlast = null;
    this.currentTarget = this._genTarget(null);

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
      for (const k of Object.keys(this._prevKeys)) this._prevKeys[k] = isDown(k);
      this._prevMouseDown = !!mouse.down;
    };

    if (this.lastClick) {
      this.lastClick.ttl -= dt;
      if (this.lastClick.ttl <= 0) this.lastClick = null;
    }

    if (this.shakeTime > 0) {
      this.shakeTime = Math.max(0, this.shakeTime - dt);
    }

    if (this.towerBlast) {
      this.towerBlast.timer += dt;
      if (this.towerBlast.timer >= this.towerBlast.duration) this.towerBlast = null;
    }

    if (this.state === "impact") {
      this._updateImpact(dt);
      commitInputs();
      return;
    }

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
      this.timeLeft = Math.max(0, this.timeLeft - dt);
      if (this.timeLeft <= 0) {
        this._handleTurnTimeout();
        commitInputs();
        return;
      }
      if (mouseJustPressed) this._handleBoardClick(mouse.x, mouse.y);
      commitInputs();
      return;
    }

    commitInputs();
  }

  _handleBoardClick(mx, my) {
    const snap = this._screenToGrid(mx, my);
    if (!snap) {
      this.statusText = "Haz clic dentro del plano.";
      return;
    }

    if (snap.distance > 18) {
      this.statusText = "Haz clic mas cerca de una interseccion.";
      return;
    }

    const correct =
      snap.gx === this.currentTarget.x && snap.gy === this.currentTarget.y;

    this.lastClick = { x: snap.sx, y: snap.sy, correct, ttl: 0.8 };

    if (correct) {
      this.hits += 1;
      this.statusText = `Correcto: (${snap.gx}, ${snap.gy})`;
      this.playSfx(this.sfxCorrect, { volume: 0.6 });
      this._beginImpactSequence(true, snap, this.hits >= this.targetHits);
      return;
    }

    this.errors += 1;
    this.statusText =
      `Incorrecto. Elegiste (${snap.gx}, ${snap.gy}) y era (${this.currentTarget.x}, ${this.currentTarget.y}).`;
    this.playSfx(this.sfxWrong, { volume: 0.7 });
    this._beginImpactSequence(false, snap, this.errors >= this.maxLives);
  }

  _handleTurnTimeout() {
    this.errors += 1;
    this.statusText =
      `Se acabo el tiempo. El barco estaba en (${this.currentTarget.x}, ${this.currentTarget.y}).`;
    this.playSfx(this.sfxWrong, { volume: 0.75 });
    this._beginImpactSequence(false, this.currentTarget, this.errors >= this.maxLives, "tower");
  }

  _beginImpactSequence(correct, snap, endsGame = false, missStyle = "water") {
    this.state = "impact";
    this.impactState = {
      correct,
      endsGame,
      missStyle,
      timer: 0,
      duration: correct ? 2.5 : 2.2,
      splashScale: 0.45,
      nextTarget: endsGame ? null : this._genTarget(this.currentTarget),
      selectedPoint: { x: snap.gx, y: snap.gy },
      targetPoint: this.currentTarget ? { ...this.currentTarget } : null,
    };

    if (correct) {
      this.playSfx(this.sfxExplosion, { volume: 0.68 });
    } else if (missStyle === "tower") {
      this.shakeTime = this.shakeDuration;
      this.towerBlast = { timer: 0, duration: Math.max(1.1, this.shakeDuration) };
      this.playSfx(this.sfxExplosion, { volume: 0.68 });
    }
  }

  _updateImpact(dt) {
    if (!this.impactState) return;

    const impact = this.impactState;
    impact.timer += dt;
    impact.splashScale = Math.min(1.3, impact.splashScale + dt * 0.85);

    if (impact.timer < impact.duration) return;

    const shouldFinish = impact.endsGame;
    const success = impact.correct;

    this.currentTarget = impact.nextTarget;
    this.impactState = null;
    if (!shouldFinish && !success && impact.missStyle === "tower") {
      this.towerBlast = null;
    }

    if (shouldFinish) {
      this._finishGame(!success);
      return;
    }

    this.timeLeft = this.turnTimeLimit;
    this.state = "playing";
  }

  _genTarget(prev) {
    const lim = this.gridLimit;
    let x = 0;
    let y = 0;
    let guard = 0;
    do {
      x = this._randInt(-lim, lim);
      y = this._randInt(-lim, lim);
      guard += 1;
      if (guard > 200) break;
    } while (
      (x === 0 && y === 0) ||
      (prev && prev.x === x && prev.y === y)
    );

    return { x, y };
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
      gained = window.MN_reportMinigameTier("cartesiano", tier);
    }
    this.sheetsReward = gained;

    if (this.win) {
      this.message =
        "Reto superado.\n" +
        `Aciertos: ${this.hits}/${this.targetHits}\n` +
        `Vidas restantes: ${Math.max(0, this.maxLives - this.errors)}\n` +
        `Hojas ganadas: ${gained}.`;
      this.playSfx(this.sfxWin, { volume: 0.7 });
    } else {
      this.shakeTime = this.shakeDuration;
      this.towerBlast = { timer: 0, duration: 1.2 };
      this.playSfx(this.sfxExplosion, { volume: 0.72 });
      this.message =
        "Te quedaste sin vidas.\n" +
        `Aciertos: ${this.hits}/${this.targetHits}\n` +
        `Errores: ${this.errors}/${this.maxLives}\n` +
        `Hojas ganadas: ${gained}.`;
    }
  }

  draw(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    if (this.state === "intro") {
      this._drawBackground(ctx, W, H);
      this._drawIntro(ctx, W, H);
      return;
    }

    ctx.save();
    if (this.shakeTime > 0) {
      const t = this.shakeTime / this.shakeDuration;
      const intensity = this.shakeIntensity * t;
      ctx.translate(
        (Math.random() * 2 - 1) * intensity,
        (Math.random() * 2 - 1) * intensity,
      );
    }

    this._drawBackground(ctx, W, H);
    this._drawHUD(ctx);

    if (this.state === "playing") {
      this._drawPrompt(ctx, W);
      this._drawBoardPanel(ctx);
      this._drawCartesianGrid(ctx);
      this._drawTargetText(ctx, W);
      this._drawClickMarker(ctx);
      this._drawStatusBar(ctx, W);
      return;
    }

    if (this.state === "impact") {
      this._drawPrompt(ctx, W);
      this._drawBoardPanel(ctx);
      this._drawCartesianGrid(ctx);
      this._drawTargetText(ctx, W);
      this._drawClickMarker(ctx);
      this._drawStatusBar(ctx, W);
      this._drawImpactOverlay(ctx, W, H);
      return;
    }

    if (this.state === "finished") {
      this._drawEndMessage(ctx, W, H);
    }

    ctx.restore();
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
    ctx.globalAlpha = 0.06;
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
    ctx.fillRect(16, 12, 320, 58);
    ctx.strokeStyle = "#7aa7ff";
    ctx.lineWidth = 2;
    ctx.strokeRect(16, 12, 320, 58);

    ctx.font = "16px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`Aciertos: ${this.hits}/${this.targetHits}`, 28, 34);
    ctx.fillText("Vidas:", 182, 34);
    ctx.fillStyle = this.timeLeft <= 3 ? "#ff9b9b" : "#dff7ff";
    ctx.fillText(`Tiempo: ${Math.ceil(this.timeLeft)}s`, 28, 53);

    const lives = Math.max(0, this.maxLives - this.errors);
    for (let i = 0; i < this.maxLives; i++) {
      ctx.fillStyle = i < lives ? "#ff4d6d" : "rgba(255,255,255,0.25)";
      this._drawHeart(ctx, 236 + i * 20, 25, 13);
    }
    ctx.restore();
  }

  _drawIntro(ctx, W, H) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    this._roundRect(
      ctx,
      W * 0.2,
      H * 0.2,
      W * 0.6,
      H * 0.48,
      18,
      "rgba(7, 10, 20, 0.82)",
    );
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(225,232,255,0.24)";
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 38px Arial";
    ctx.fillText("La artillería cartesiana", W / 2, H * 0.26);

    ctx.font = "20px Arial";
    ctx.fillStyle = "#d8e6ff";
    ctx.fillText("Ubica puntos en el plano usando el mouse.", W / 2, H * 0.38);
    ctx.fillText("Consigue 10 aciertos antes de perder tus 3 vidas.", W / 2, H * 0.44);
    ctx.fillText("Haz clic cerca de la intersección correcta.", W / 2, H * 0.50);

    ctx.fillStyle = "#ffffff";
    ctx.fillText("Pulsa ENTER o clic para comenzar.", W / 2, H * 0.62);
    ctx.restore();
  }

  _drawPrompt(ctx, W) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.fillStyle = "#eef2ff";
    ctx.font = "bold 30px Arial";
    ctx.fillText("La artillería cartesiana", W * 0.5, 82);
    ctx.restore();
  }

  _drawBoardPanel(ctx) {
    this._roundRect(
      ctx,
      this.board.x,
      this.board.y,
      this.board.w,
      this.board.h,
      16,
      "rgba(21,26,46,0.76)",
    );
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.stroke();
  }

  _drawCartesianGrid(ctx) {
    const lim = this.gridLimit;
    const step = this._gridStep();
    const origin = this._origin();

    const left = origin.x - lim * step;
    const right = origin.x + lim * step;
    const top = origin.y - lim * step;
    const bottom = origin.y + lim * step;

    ctx.save();

    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.lineWidth = 1;
    for (let i = -lim; i <= lim; i++) {
      const x = origin.x + i * step;
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x, bottom);
      ctx.stroke();
    }
    for (let j = -lim; j <= lim; j++) {
      const y = origin.y - j * step;
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
      ctx.stroke();
    }

    ctx.strokeStyle = "#d5e4ff";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(left, origin.y);
    ctx.lineTo(right, origin.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(origin.x, top);
    ctx.lineTo(origin.x, bottom);
    ctx.stroke();

    this._drawAxisArrow(ctx, right, origin.y, 1, 0);
    this._drawAxisArrow(ctx, origin.x, top, 0, -1);

    ctx.font = "14px Arial";
    ctx.fillStyle = "#dbe8ff";
    ctx.textAlign = "center";
    for (let i = -lim; i <= lim; i++) {
      if (i === 0) continue;
      const x = origin.x + i * step;
      ctx.fillText(String(i), x, origin.y + 18);
    }
    ctx.textAlign = "right";
    for (let j = -lim; j <= lim; j++) {
      if (j === 0) continue;
      const y = origin.y - j * step;
      ctx.fillText(String(j), origin.x - 8, y + 5);
    }

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.fillText("x", right + 12, origin.y + 4);
    ctx.fillText("y", origin.x + 8, top - 8);

    ctx.restore();
  }

  _drawTargetText(ctx, W) {
    if (!this.currentTarget) return;
    const t = this.currentTarget;
    ctx.save();
    this._roundRect(
      ctx,
      W * 0.5 - 198,
      92,
      396,
      42,
      12,
      "rgba(6, 10, 20, 0.68)",
    );
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(123, 223, 242, 0.35)";
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.fillStyle = "#7bdff2";
    ctx.font = "bold 24px Arial";
    ctx.fillText(`Selecciona el punto (${t.x}, ${t.y})`, W * 0.5, 114);
    ctx.restore();
  }

  _drawClickMarker(ctx) {
    if (!this.lastClick) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, this.lastClick.ttl / 0.8));
    ctx.strokeStyle = this.lastClick.correct ? "#63d471" : "#ef233c";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(this.lastClick.x, this.lastClick.y, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  _drawStatusBar(ctx, W) {
    const x = 74;
    const y = 644;
    const w = W - 148;
    const h = 28;

    this._roundRect(ctx, x, y, w, h, 9, "rgba(6,9,18,0.92)");
    ctx.lineWidth = 1.3;
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#eef2ff";
    ctx.font = "16px Arial";
    ctx.fillText(
      this.statusText || "Clic izquierdo para seleccionar un punto.",
      x + w * 0.5,
      y + h * 0.52,
    );
  }

  _drawEndMessage(ctx, W, H) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (!this.win && this.towerBlast) {
      this._drawTowerExplosion(ctx, W, H);
    }

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
    ctx.fillText("Pulsa ENTER o clic para volver.", W / 2, 460);
    ctx.restore();
  }

  _drawTowerExplosion(ctx, W, H) {
    const progress = Math.min(1, this.towerBlast.timer / this.towerBlast.duration);

    ctx.save();
    ctx.fillStyle = `rgba(255, 120, 64, ${0.1 * (1 - progress)})`;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  _drawImpactOverlay(ctx, W, H) {
    if (!this.impactState) return;

    const impact = this.impactState;
    if (!impact.correct && impact.missStyle === "tower") {
      ctx.save();
      ctx.fillStyle = "rgba(3, 5, 12, 0.38)";
      ctx.fillRect(0, 0, W, H);
      if (this.towerBlast) {
        this._drawTowerExplosion(ctx, W, H);
      }
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#f5fbff";
      ctx.font = "bold 28px Arial";
      ctx.fillText("No hubo tiempo para disparar", W * 0.5, H * 0.2);
      ctx.font = "20px Arial";
      ctx.fillStyle = "#e6efff";
      ctx.fillText(
        `La torre fue alcanzada mientras el blanco estaba en (${impact.targetPoint.x}, ${impact.targetPoint.y}).`,
        W * 0.5,
        H * 0.27,
      );
      ctx.restore();
      return;
    }

    const assets = this.game.assets;
    const ocean = assets?.getImage?.("bg_cartesiano_oceano");
    const ship = assets?.getImage?.("obj_cartesiano_barco");
    const burningShip = assets?.getImage?.("obj_cartesiano_barco_impactado");
    const explosion = assets?.getImage?.("fx_cartesiano_explosion");
    const splash = assets?.getImage?.("fx_cartesiano_salpicadura");

    const panelW = 640;
    const panelH = 360;
    const panelX = (W - panelW) * 0.5;
    const panelY = (H - panelH) * 0.5;
    const progress = Math.min(1, impact.timer / impact.duration);
    const shipX = panelX + panelW * 0.56;
    const shipY = panelY + panelH * 0.57;
    const shipW = 220;
    const shipH = 132;

    ctx.save();
    ctx.fillStyle = "rgba(3, 5, 12, 0.72)";
    ctx.fillRect(0, 0, W, H);

    this._roundRect(ctx, panelX, panelY, panelW, panelH, 18, "rgba(7, 14, 29, 0.96)");
    ctx.lineWidth = 2;
    ctx.strokeStyle = impact.correct ? "rgba(255, 173, 66, 0.9)" : "rgba(124, 196, 255, 0.9)";
    ctx.stroke();

    if (ocean) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(panelX + 18, panelY);
      ctx.arcTo(panelX + panelW, panelY, panelX + panelW, panelY + panelH, 18);
      ctx.arcTo(panelX + panelW, panelY + panelH, panelX, panelY + panelH, 18);
      ctx.arcTo(panelX, panelY + panelH, panelX, panelY, 18);
      ctx.arcTo(panelX, panelY, panelX + panelW, panelY, 18);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(ocean, panelX, panelY, panelW, panelH);
      ctx.restore();
    } else {
      const g = ctx.createLinearGradient(0, panelY, 0, panelY + panelH);
      g.addColorStop(0, "#78c3f2");
      g.addColorStop(0.52, "#2b79b4");
      g.addColorStop(1, "#14324a");
      ctx.fillStyle = g;
      ctx.fillRect(panelX, panelY, panelW, panelH);
    }

    if (impact.correct) {
      const shipImg = progress < 0.18 ? ship : (burningShip || ship);
      if (shipImg) {
        this._drawCoverImage(ctx, shipImg, shipX - shipW * 0.5, shipY - shipH * 0.5, shipW, shipH);
      }
      if (explosion && progress < 0.8) {
        this._drawSpriteSheetFrame(
          ctx,
          explosion,
          panelX + panelW * 0.54 + 30,
          panelY + panelH * 0.48 + 50,
          2,
          4,
          progress / 0.8,
          168,
          168,
        );
      }
    } else if (splash) {
      const splashSize = 124 * (0.85 + impact.splashScale * 0.6);
      ctx.save();
      ctx.globalAlpha = Math.max(0.18, 1 - progress * 0.82);
      this._drawContainImage(
        ctx,
        splash,
        shipX - splashSize * 0.5,
        shipY - splashSize * 0.42,
        splashSize,
        splashSize,
      );
      ctx.restore();
    } else {
      ctx.save();
      ctx.globalAlpha = 0.85 - progress * 0.4;
      ctx.strokeStyle = "#d7f2ff";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(shipX, shipY, 34 + progress * 28, Math.PI, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.fillStyle = "rgba(5, 9, 18, 0.62)";
    ctx.fillRect(panelX, panelY, panelW, 54);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#f5fbff";
    ctx.font = "bold 24px Arial";
    ctx.fillText(
      impact.correct ? "Impacto directo" : "El disparo cayo al agua",
      panelX + panelW * 0.5,
      panelY + 28,
    );

    ctx.font = "18px Arial";
    ctx.fillStyle = "#e6efff";
    const detail = impact.correct
      ? `Barco alcanzado en (${impact.targetPoint.x}, ${impact.targetPoint.y}).`
      : `Marcaste (${impact.selectedPoint.x}, ${impact.selectedPoint.y}) y el barco estaba en (${impact.targetPoint.x}, ${impact.targetPoint.y}).`;
    ctx.fillText(detail, panelX + panelW * 0.5, panelY + panelH - 34);
    ctx.restore();
  }

  _drawCoverImage(ctx, img, x, y, w, h) {
    if (!img) return;
    const scale = Math.max(w / img.width, h / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    const dx = x + (w - dw) * 0.5;
    const dy = y + (h - dh) * 0.5;
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  _drawContainImage(ctx, img, x, y, w, h) {
    if (!img) return;
    const scale = Math.min(w / img.width, h / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    const dx = x + (w - dw) * 0.5;
    const dy = y + (h - dh) * 0.5;
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  _drawSpriteSheetFrame(ctx, img, cx, cy, cols, rows, progress, drawW, drawH) {
    if (!img) return;
    const totalFrames = cols * rows;
    const frame = Math.min(totalFrames - 1, Math.floor(progress * totalFrames));
    const fw = img.width / cols;
    const fh = img.height / rows;
    const sx = (frame % cols) * fw;
    const sy = Math.floor(frame / cols) * fh;
    ctx.drawImage(img, sx, sy, fw, fh, cx - drawW * 0.5, cy - drawH * 0.5, drawW, drawH);
  }

  _origin() {
    return {
      x: this.board.x + this.board.w * 0.5,
      y: this.board.y + this.board.h * 0.5 + 10,
    };
  }

  _gridStep() {
    const usable = Math.min(this.board.w - this.board.pad * 2, this.board.h - this.board.pad * 2);
    return usable / (this.gridLimit * 2);
  }

  _screenToGrid(px, py) {
    const origin = this._origin();
    const step = this._gridStep();
    const lim = this.gridLimit;

    const gxFloat = (px - origin.x) / step;
    const gyFloat = -(py - origin.y) / step;

    const gx = Math.round(gxFloat);
    const gy = Math.round(gyFloat);

    if (gx < -lim || gx > lim || gy < -lim || gy > lim) return null;

    const sx = origin.x + gx * step;
    const sy = origin.y - gy * step;
    const distance = Math.hypot(px - sx, py - sy);

    return { gx, gy, sx, sy, distance };
  }

  _drawAxisArrow(ctx, x, y, dx, dy) {
    const size = 8;
    ctx.save();
    ctx.fillStyle = "#d5e4ff";
    ctx.beginPath();
    if (dx === 1) {
      ctx.moveTo(x + 1, y);
      ctx.lineTo(x - size, y - size * 0.55);
      ctx.lineTo(x - size, y + size * 0.55);
    } else {
      ctx.moveTo(x, y - 1);
      ctx.lineTo(x - size * 0.55, y + size);
      ctx.lineTo(x + size * 0.55, y + size);
    }
    ctx.closePath();
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

  _randInt(a, b) {
    return a + Math.floor(Math.random() * (b - a + 1));
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

window.CartesianoScene = CartesianoScene;
