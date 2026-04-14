// js/areas/geometria/niveles/problemasScene.js
// ===========================================================
// ProblemasScene - "Problemas de Geometría"
// 3 problemas por corrida:
//  - 1 de dificultad 1
//  - 1 de dificultad 2
//  - 1 de dificultad 3
//
// Primera version del minijuego integrador del área de geometría.
// La idea es que cada plantilla tenga su propio drawDiagram y que
// el juego combine razonamiento visual, áreas, perímetros y ángulos.
// ===========================================================

class ProblemasScene extends Scene {
  constructor(game, options = {}) {
    super(game);

    // ----------------- Estado general -----------------
    this.state = "intro";
    this.gameFinished = false;
    this.exitDelay = 0;
    this.win = false;
    this.message = "";
    this.sheetsReward = 0;

    // ----------------- Config -----------------
    this.options = options;
    this.maxErrors = options.maxErrors ?? 3;
    this.errors = 0;

    // ----------------- Progreso -----------------
    this.problemIndex = 0;
    this.totalProblems = 3;
    this.problems = [];

    // ----------------- Problema actual -----------------
    this.current = null;
    this.answerInput = "";
    this.answerFeedback = "";

    // ----------------- Input edge tracking -----------------
    this._prevKeys = {
      Enter: false,
      " ": false,
      Backspace: false,
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
      ".": false,
      ",": false,
      NumpadDecimal: false,
      Decimal: false,
      Escape: false,
    };
    this._prevMouseDown = false;

    // ----------------- Sonidos -----------------
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

  // =======================================================
  // INIT / DESTROY
  // =======================================================
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
    this.problemIndex = 0;
    this.problems = this._buildRunProblems();
    this.totalProblems = this.problems.length;
    this._setCurrentProblem(0);

    this._prevMouseDown = false;
    for (const k of Object.keys(this._prevKeys)) this._prevKeys[k] = false;

    this.answerInput = "";
    this.answerFeedback = "";
  }

  destroy() {
    this.clearAll?.();
  }

  // =======================================================
  // UPDATE
  // =======================================================
  update(dt) {
    super.update(dt);

    const input = this.game.input;
    const keys = input.keys || {};
    const isDown = (key) => !!keys[key];
    const isJustPressed = (key) => isDown(key) && !this._prevKeys[key];

    const commitKeys = () => {
      for (const k of Object.keys(this._prevKeys)) this._prevKeys[k] = isDown(k);
    };

    if (this.gameFinished) {
      if (this.exitDelay > 0) {
        this.exitDelay -= dt;
        commitKeys();
        return;
      }
      const wantsExit =
        input.isDown("Enter") ||
        input.isDown(" ") ||
        (input.mouse && input.mouse.down);

      if (wantsExit) {
        window.MN_setInputMode?.(null);
        window.MN_setLeafHUDVisible?.(true);
        window.MN_APP?.toOverworld?.();
      }
      commitKeys();
      return;
    }

    if (this.state === "intro") {
      const mouse = input.mouse || { down: false };
      const mouseJustPressed = mouse.down && !this._prevMouseDown;
      this._prevMouseDown = mouse.down;

      if (isJustPressed("Enter") || isJustPressed(" ") || mouseJustPressed) {
        this.state = "playing";
        this.playSfx(this.sfxPage, { volume: 0.5 });
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
      this._updatePlaying(input, isJustPressed);
    }

    commitKeys();
  }

  _updatePlaying(input, isJustPressed) {
    const mouse = input.mouse || { down: false, x: 0, y: 0 };

    for (let d = 0; d <= 9; d++) {
      if (isJustPressed(String(d)) || isJustPressed(`Numpad${d}`)) {
        this._appendDigit(String(d));
      }
    }

    if (
      isJustPressed(".") ||
      isJustPressed(",") ||
      isJustPressed("NumpadDecimal") ||
      isJustPressed("Decimal")
    ) {
      this._appendDecimalSeparator();
    }

    if (isJustPressed("Backspace")) {
      this.answerInput = this.answerInput.slice(0, -1);
      this.answerFeedback = "";
    }

    if (isJustPressed("Enter")) {
      this._submitAnswer();
    }

    this._prevMouseDown = mouse.down;
  }

  _appendDigit(d) {
    if (this.answerInput.length >= 10) return;
    if (this.answerInput === "0") this.answerInput = d;
    else this.answerInput += d;
    this.answerFeedback = "";
  }

  _appendDecimalSeparator() {
    if (this.answerInput.length >= 10) return;
    if (this.answerInput.includes(".")) return;
    if (!this.answerInput) this.answerInput = "0.";
    else this.answerInput += ".";
    this.answerFeedback = "";
  }

  _submitAnswer() {
    if (!this.current) return;
    if (!this.answerInput.trim()) {
      this.answerFeedback = "Escribe una respuesta numerica.";
      return;
    }

    const normalized = this.answerInput.replace(",", ".");
    const chosen = Number.parseFloat(normalized);
    if (!Number.isFinite(chosen)) {
      this.answerFeedback = "Valor invalido.";
      return;
    }

    const EPS = this.current.eps ?? 0.05;
    if (Math.abs(chosen - this.current.answerValue) <= EPS) {
      this.playSfx(this.sfxCorrect, { volume: 0.6 });
      if (this.problemIndex + 1 >= this.totalProblems) {
        this._finishGame(false);
      } else {
        this.problemIndex++;
        this._setCurrentProblem(this.problemIndex);
      }
      return;
    }

    this.errors++;
    this.playSfx(this.sfxWrong, { volume: 0.7 });
    this.answerInput = "";
    this.answerFeedback = "Respuesta incorrecta. Intenta otra vez.";

    if (this.errors >= this.maxErrors) {
      this._finishGame(true);
    }
  }

  // =======================================================
  // PROBLEMAS
  // =======================================================
  _buildRunProblems() {
    const d1 = this._pick([
      () => this._genClockProblem(),
      () => this._genIsoscelesHeightProblem(),
      () => this._genSquarePerimeterFromAreaProblem(),
      () => this._genPerpendicularAngleProblem(),
    ])();

    const d2 = this._pick([
      () => this._genHouseAreaProblem(),
      () => this._genTwoCirclesShadedProblem(),
      () => this._genTwoCirclesDiagonalShadedProblem(),
      () => this._genEquilateralAngleProblem(),
      () => this._genSplitShadedAreaProblem(),
      () => this._genEquilateralTransversalProblem(),
    ])();

    const d3 = this._pick([
      () => this._genStarPerimeterProblem(),
      () => this._genPythagoreanShadedAreaProblem(),
      () => this._genParallelIsoscelesAngleProblem(),
    ])();

    return [d1, d2, d3];
  }

  _setCurrentProblem(index) {
    this.current = this.problems[index] || null;
    this.answerInput = "";
    this.answerFeedback = "";
  }

  _genClockProblem() {
    const hour = this._randInt(1, 11);
    const angle = Math.min(hour * 30, 360 - hour * 30);

    return {
      type: "clock_angle",
      difficulty: 1,
      prompt: `Que angulo menor forman las manecillas del reloj a las ${hour}:00?`,
      guideTip: "Entre cada numero del reloj hay 30 grados. Busca siempre el angulo menor.",
      answerValue: angle,
      eps: 0.01,
      data: { hour },
      answerLabel: "angulo",
    };
  }

  _genIsoscelesHeightProblem() {
    const triples = [
      { halfBase: 3, height: 4, side: 5, scales: [1, 2] },
      { halfBase: 9, height: 12, side: 15, scales: [1, 2] },
      { halfBase: 12, height: 16, side: 20, scales: [1] },
      { halfBase: 5, height: 12, side: 13, scales: [1, 2] },
      { halfBase: 8, height: 15, side: 17, scales: [1, 2] },
      { halfBase: 7, height: 24, side: 25, scales: [1] },
    ];
    const t = this._pick(triples);
    const scale = this._pick(t.scales);
    const halfBase = t.halfBase * scale;
    const height = t.height * scale;
    const side = t.side * scale;
    const base = halfBase * 2;

    return {
      type: "isosceles_height",
      difficulty: 1,
      prompt: `Un triángulo isósceles tiene lados iguales de ${side} y base ${base}. Calcula su altura.`,
      guideTip: "La altura en un triángulo isósceles biseca la base y forma dos triángulos rectángulos congruentes.",
      answerValue: height,
      eps: 0.01,
      data: { side, base, halfBase, height },
      answerLabel: "h",
    };
  }

  _genSquarePerimeterFromAreaProblem() {
    const side = this._randInt(3, 12);
    const area = side * side;
    const perimeter = side * 4;

    return {
      type: "square_perimeter_from_area",
      difficulty: 1,
      prompt: `El área de un cuadrado es ${area}. Cuál es su perímetro?`,
      guideTip: "Si el área del cuadrado es lado por lado, primero hallas el lado y luego multiplicas por 4.",
      answerValue: perimeter,
      eps: 0.01,
      data: { side, area },
      answerLabel: "P",
    };
  }

  _genPerpendicularAngleProblem() {
    const obtuseAngle = this._randInt(102, 148);
    const acuteAngle = 180 - obtuseAngle;
    const k = 90 - acuteAngle;

    return {
      type: "perpendicular_angle",
      difficulty: 1,
      prompt:
        `En la figura, la recta vertical es perpendicular a la horizontal. ` +
        `Si el ángulo obtuso con la base mide ${obtuseAngle}°, calcula k.`,
      guideTip:
        "Primero halla el ángulo agudo que forma la diagonal con la base. Luego usa que vertical y horizontal forman 90°.",
      answerValue: k,
      eps: 0.01,
      data: { obtuseAngle, acuteAngle, k },
      answerLabel: "k",
    };
  }

  _genHouseAreaProblem() {
    const roofTriples = [
      { halfBase: 3, roofHeight: 4, side: 5 },
      { halfBase: 9, roofHeight: 12, side: 15 },
      { halfBase: 12, roofHeight: 16, side: 20 },
      { halfBase: 5, roofHeight: 12, side: 13 },
      { halfBase: 8, roofHeight: 15, side: 17 },
      { halfBase: 7, roofHeight: 24, side: 25 },
    ];
    const t = this._pick(roofTriples);
    const width = t.halfBase * 2;
    const wallHeight = this._pick([6, 8, 10, 12]);
    const area = width * wallHeight + (width * t.roofHeight) / 2;

    return {
      type: "house_area",
      difficulty: 2,
      prompt:
        `La figura representa una casa formada por un rectángulo y un techo ióosceles. ` +
        `El ancho de la casa es ${width}, la altura del rectángulo es ${wallHeight} y los lados iguales del techo miden ${t.side}. ` +
        `Calcula el área total.`,
      guideTip:
        "Primero calcula la altura del techo usando que su altura parte la base en dos partes iguales. Luego suma área del rectángulo y del triángulo.",
      answerValue: área,
      eps: 0.01,
      data: {
        width,
        wallHeight,
        roofSide: t.side,
        halfBase: t.halfBase,
        roofHeight: t.roofHeight,
      },
      answerLabel: "A",
    };
  }

  _genTwoCirclesShadedProblem() {
    const r = this._pick([2, 3, 4, 5, 6, 7]);
    const rectW = 4 * r;
    const rectH = 2 * r;
    const rectArea = rectW * rectH;
    const circlesArea = 2 * 3.14 * r * r;
    const shaded = Number((rectArea - circlesArea).toFixed(2));

    return {
      type: "two_circles_shaded",
      difficulty: 2,
      prompt:
        `En el rectángulo se inscriben dos circulos iguales, tangentes entre si y a los lados del rectángulo. ` +
        `Si el radio de cada círculo es ${r}, calcula el área sombreada fuera de los círculos. Usa pi = 3.14.`,
      guideTip: "El área sombreada es el área del rectángulo menos el área de los dos círculos.",
      answerValue: shaded,
      eps: 0.06,
      data: { r, rectW, rectH },
      answerLabel: "A sombreada",
    };
  }

  _genTwoCirclesDiagonalShadedProblem() {
    const r = this._pick([2, 3, 4, 5, 6, 7]);
    const rectW = 4 * r;
    const rectH = 2 * r;
    const lineStartX = 0;
    const circles = [
      { x: r, y: r, r },
      { x: 3 * r, y: r, r },
    ];
    const shaded = this._estimateDiagonalShadedArea(rectW, rectH, circles, lineStartX);

    return {
      type: "two_circles_diagonal_shaded",
      difficulty: 2,
      prompt:
        `En un rectángulo de base ${rectW} y altura ${rectH} se inscriben dos círculos iguales de radio ${r}. ` +
        `Se traza la diagonal oblicua mostrada en la figura hasta la esquina inferior derecha. ` +
        `Calcula el área sombreada. Usa pi = 3.14.`,
      guideTip: "La región sombreada es la parte del rectángulo que queda del lado sombreado de la diagonal y fuera de los dos círculos.",
      answerValue: shaded,
      eps: 0.08,
      data: { r, rectW, rectH, circles, lineStartX },
      answerLabel: "A",
    };
  }

  _genEquilateralAngleProblem() {
    const exteriorAngle = this._randInt(50, 90);
    const x = 150 - exteriorAngle;

    return {
      type: "equilateral_angle_chain",
      difficulty: 2,
      prompt:
        `En la figura, el triángulo marcado es equilátero y el ángulo exterior indicado mide ${exteriorAngle}°. ` +
        `Calcula el valor de x.`,
      guideTip:
        "En un triángulo equilátero todos los ángulos miden 60°. Usa eso y luego la perpendicular para deducir x.",
      answerValue: x,
      eps: 0.01,
      data: { exteriorAngle, x },
      answerLabel: "x",
    };
  }

  _genSplitShadedAreaProblem() {
    const width = this._pick([4, 5, 6, 7, 8]);
    const height = this._pick([2, 3, 4, 5, 6]);
    const topHeight = this._pick([3, 4, 5, 6]);
    const rightBase = this._pick([2, 3, 4, 5]);
    const rectArea = width * height;
    const shadedArea = Number((((width * topHeight) / 2) + ((rightBase * height) / 2)).toFixed(2));

    return {
      type: "split_shaded_area",
      difficulty: 2,
      prompt:
        `La figura tiene un rectángulo central de área ${rectArea}. ` +
        `La base del rectángulo mide ${width}. ` +
        `La región sombreada se forma con dos triángulos: uno arriba con altura ${topHeight} y otro a la derecha con base ${rightBase}. ` +
        `Calcula el área sombreada total.`,
      guideTip:
        "Usa el área y la base del rectángulo para hallar su altura. Luego suma las áreas de los dos triángulos.",
      answerValue: shadedArea,
      eps: 0.01,
      data: { width, height, topHeight, rightBase, rectArea },
      answerLabel: "A",
    };
  }

  _genEquilateralTransversalProblem() {
    const leftExteriorAngle = this._randInt(95, 120); 
    const x = leftExteriorAngle - 60;

    return {
      type: "equilateral_transversal",
      difficulty: 2,
      prompt:
        `En la figura, el triángulo es equilátero y la recta roja lo corta en dos lados. ` +
        `Si el ángulo indicado a la izquierda mide ${leftExteriorAngle}°, calcula x.`,
      guideTip:
        "En un triángulo equilátero todos los angulos miden 60°. Usa el ángulo interior que forma la transversal en el lado izquierdo y luego el correspondiente en el lado derecho.",
      answerValue: x,
      eps: 0.01,
      data: { leftExteriorAngle, x },
      answerLabel: "x",
    };
  }

  _genStarPerimeterProblem() {
    const r = this._pick([2, 3, 4, 5, 6, 7]);
    const squareSide = 4 * r;
    const perimeter = 8 * squareSide;

    return {
      type: "star_perimeter",
      difficulty: 3,
      prompt:
        `Un cuadrado contiene 4 círculos iguales de radio ${r}, acomodados 2 x 2, tangentes entre si y al cuadrado. ` +
        `Sobre cada lado del cuadrado se construye un triángulo equilátero hacia afuera. Calcula el perímetro exterior de la estrella.`,
      guideTip:
        "Primero deduce el lado del cuadrado. Luego observa que el perímetro exterior esta formado por 8 lados de triángulos equiláteros.",
      answerValue: perimeter,
      eps: 0.01,
      data: { r, squareSide },
      answerLabel: "P",
    };
  }

  _genPythagoreanShadedAreaProblem() {
    const families = [
      { a: 3, h: 4, c: 5, scales: [2, 3, 4] },
      { a: 9, h: 12, c: 15, scales: [1, 2] },
      { a: 12, h: 16, c: 20, scales: [1] },
      { a: 5, h: 12, c: 13, scales: [1, 2] },
      { a: 8, h: 15, c: 17, scales: [1, 2] },
      { a: 7, h: 24, c: 25, scales: [1] },
    ];
    const family = this._pick(families);
    const scale = this._pick(family.scales);
    const leftBase = family.a * scale;
    const height = family.h * scale;
    const slantedSide = family.c * scale;
    const topWidth = this._pick([4, 6, 8].map((n) => n * scale));
    const totalBase = leftBase + topWidth;
    const shadedArea = (topWidth * height) / 2;

    return {
      type: "pythagorean_shaded_area",
      difficulty: 3,
      prompt:
        `La base total de la figura mide ${totalBase}, el lado inclinado izquierdo mide ${slantedSide} y el segmento superior mide ${topWidth}. ` +
        `Calcula el área sombreada.`,
      guideTip:
        "Primero usa la terna pitagórica para hallar la altura del bloque. Luego calcula el área del triángulo sombreado con base y altura.",
      answerValue: shadedArea,
      eps: 0.01,
      data: { leftBase, height, slantedSide, topWidth, totalBase, shadedArea },
      answerLabel: "A",
    };
  }

  _genParallelIsoscelesAngleProblem() {
    const variants = [
      { parallelAngle: 36, leftSplitAngle: 12 },
      { parallelAngle: 42, leftSplitAngle: 12 },
      { parallelAngle: 42, leftSplitAngle: 18 },
      { parallelAngle: 48, leftSplitAngle: 12 },
      { parallelAngle: 48, leftSplitAngle: 18 },
      { parallelAngle: 54, leftSplitAngle: 12 },
    ];
    const choice = this._pick(variants);
    const parallelAngle = choice.parallelAngle;
    const leftSplitAngle = choice.leftSplitAngle;
    const baseAngle = parallelAngle + leftSplitAngle;
    const leftExteriorAngle = 180 - baseAngle;
    const x = 180 - 2 * baseAngle;

    return {
      type: "parallel_isosceles_angle",
      difficulty: 3,
      prompt:
        `Las rectas A y B son paralelas. El ángulo marcado sobre la recta B mide ${parallelAngle}° ` +
        `y el ángulo exterior del vertice izquierdo del triangulo mide ${leftExteriorAngle}°. ` +
        `El triángulo con marcas es isósceles. Calcula el valor de x en el vertice del triángulo.`,
      guideTip:
        "Usa las paralelas para reconocer el ángulo correspondiente de la transversal. Luego usa que el angulo exterior y el angulo interior de la base son suplementarios, y finalmente halla x en el isósceles.",
      answerValue: x,
      eps: 0.01,
      data: { parallelAngle, leftExteriorAngle, baseAngle, x },
      answerLabel: "x",
    };
  }

  // =======================================================
  // FIN DEL JUEGO
  // =======================================================
  _finishGame(failed = false) {
    if (this.gameFinished) return;

    this.gameFinished = true;
    this.state = "finished";
    this.exitDelay = 0.45;
    this.win = !failed;

    const solvedCount = failed
      ? Math.min(this.problemIndex, this.totalProblems)
      : this.totalProblems;
    const tier =
      solvedCount >= 3 ? 2
      : solvedCount >= 2 ? 1
      : 0;
    let gained = 0;
    if (window.MN_reportMinigameTier) {
      gained = window.MN_reportMinigameTier("problemas", tier);
    }
    this.sheetsReward = gained;

    if (this.win) {
      this.message =
        "Bien!\n" +
        "Resolviste problemas integradores de geometría.\n" +
        `Errores: ${this.errors}/${this.maxErrors}\n` +
        `Hojas ganadas: ${gained}.`;
      this.playSfx(this.sfxWin, { volume: 0.7 });
    } else {
      this.message =
        "Te falto un poco...\n" +
        "Vuelve a intentarlo.\n" +
        `Errores: ${this.errors}/${this.maxErrors}\n` +
        `Hojas ganadas: ${gained}.`;
      this.playSfx(this.sfxLose, { volume: 0.7 });
    }

    this.game?.events?.emit?.("problemas_done", {
      win: this.win,
      tier,
      sheetsReward: gained,
      failed,
    });
  }

  // =======================================================
  // DRAW
  // =======================================================
  draw(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    this._drawBackground(ctx, W, H);

    this._drawHUD(ctx);

    if (this.state === "intro") {
      this._drawIntro(ctx);
      return;
    }

    if (this.state === "playing") {
      this._drawPromptPanel(ctx, W, H);
      this._drawFigurePanel(ctx, W, H);
      this._drawPrompt(ctx);
      this._drawFigure(ctx);
      this._drawAnswerInput(ctx);
      return;
    }

    if (this.state === "finished") {
      this._drawEndMessage(ctx);
    }
  }

  _drawHUD(ctx) {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(16, 12, 360, 44);
    ctx.strokeStyle = "#7aa7ff";
    ctx.lineWidth = 2;
    ctx.strokeRect(16, 12, 360, 44);

    ctx.font = "16px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    const p = Math.min(this.problemIndex + 1, this.totalProblems);
    ctx.fillText(`Problema: ${p}/${this.totalProblems}`, 28, 34);

    const diff = this.current?.difficulty ?? 1;
    ctx.fillText(`Nivel: ${diff}`, 150, 34);

    const lives = Math.max(0, this.maxErrors - this.errors);
    ctx.fillText("Vidas:", 235, 34);
    for (let i = 0; i < this.maxErrors; i++) {
      ctx.fillStyle = i < lives ? "#ff4d6d" : "rgba(255,255,255,0.25)";
      this._drawHeart(ctx, 291 + i * 20, 25, 13);
    }
    ctx.restore();
  }

  _drawBackground(ctx, W, H) {
    const bg = this.game.assets?.getImage?.("bg_problemas_euclides");
    if (bg) {
      ctx.drawImage(bg, 0, 0, W, H);
    } else {
      ctx.fillStyle = "#070c16";
      ctx.fillRect(0, 0, W, H);
    }

    ctx.fillStyle = "rgba(5, 10, 18, 0.42)";
    ctx.fillRect(0, 0, W, H);
  }

  _getPromptPanelRect(W, H) {
    return {
      x: 68,
      y: 74,
      w: Math.max(720, W - 176),
      h: 104,
    };
  }

  _getFigurePanelRect(W, H) {
    return {
      x: W * 0.17,
      y: H * 0.21 + 50,
      w: W * 0.66,
      h: H * 0.44 + 90,
    };
  }

  _drawPromptPanel(ctx, W, H) {
    this._drawGlassPanel(ctx, this._getPromptPanelRect(W, H), {
      fill: "rgba(6, 12, 24, 0.76)",
      stroke: "rgba(170, 214, 255, 0.72)",
    });
  }

  _drawFigurePanel(ctx, W, H) {
    this._drawGlassPanel(ctx, this._getFigurePanelRect(W, H), {
      fill: "rgba(6, 12, 24, 0.62)",
      stroke: "rgba(170, 214, 255, 0.58)",
    });
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

  _drawIntro(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "#ffffff";
    ctx.font = "34px Arial";
    ctx.fillText("Problemas de Geometría", W / 2, H * 0.27);

    ctx.font = "18px Arial";
    ctx.fillStyle = "#d8e6ff";
    ctx.fillText("Este es el reto integrador del area de geometría.", W / 2, H * 0.39);
    ctx.fillText("Resolveras 3 problemas.", W / 2, H * 0.45);
    ctx.fillText("Observa la figura, deduce lo necesario y escribe la respuesta.", W / 2, H * 0.51);
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Pulsa ENTER o ESPACIO para comenzar.", W / 2, H * 0.63);
    ctx.restore();
  }

  _drawPrompt(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;
    const promptY = H * 0.11 + 15;
    const promptBox = this._getPromptPanelRect(W, H);

    ctx.save();
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = "21px Arial";
    this._wrapText(
      ctx,
      this.current?.prompt || "",
      promptBox.x + promptBox.w * 0.5,
      promptY,
      promptBox.w - 44,
      25,
    );
    ctx.restore();
  }

  _drawFigure(ctx) {
    const P = this.current;
    if (!P) return;

    switch (P.type) {
      case "clock_angle":
        this._drawClockProblem(ctx, P);
        break;
      case "isosceles_height":
        this._drawIsoscelesHeightProblem(ctx, P);
        break;
      case "square_perimeter_from_area":
        this._drawSquarePerimeterFromAreaProblem(ctx, P);
        break;
      case "perpendicular_angle":
        this._drawPerpendicularAngleProblem(ctx, P);
        break;
      case "house_area":
        this._drawHouseAreaProblem(ctx, P);
        break;
      case "two_circles_shaded":
        this._drawTwoCirclesProblem(ctx, P);
        break;
      case "two_circles_diagonal_shaded":
        this._drawTwoCirclesDiagonalProblem(ctx, P);
        break;
      case "equilateral_angle_chain":
        this._drawEquilateralAngleProblem(ctx, P);
        break;
      case "split_shaded_area":
        this._drawSplitShadedAreaProblem(ctx, P);
        break;
      case "equilateral_transversal":
        this._drawEquilateralTransversalProblem(ctx, P);
        break;
      case "pythagorean_shaded_area":
        this._drawPythagoreanShadedAreaProblem(ctx, P);
        break;
      case "parallel_isosceles_angle":
        this._drawParallelIsoscelesAngleProblem(ctx, P);
        break;
      case "star_perimeter":
        this._drawStarPerimeterProblem(ctx, P);
        break;
    }
  }

  _drawClockProblem(ctx, problem) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;
    const cx = W * 0.5;
    const cy = H * 0.47 + 20;
    const r = Math.min(W, H) * 0.16;
    const hour = problem.data.hour;

    ctx.save();
    ctx.strokeStyle = "#e6efff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 12; i++) {
      const a = -Math.PI / 2 + i * (Math.PI / 6);
      const x1 = cx + Math.cos(a) * (r - 10);
      const y1 = cy + Math.sin(a) * (r - 10);
      const x2 = cx + Math.cos(a) * r;
      const y2 = cy + Math.sin(a) * r;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      const labelX = cx + Math.cos(a) * (r - 28);
      const labelY = cy + Math.sin(a) * (r - 28);
      const n = i === 0 ? 12 : i;
      ctx.font = "20px Arial";
      ctx.fillStyle = "#d9e8ff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(n), labelX, labelY);
    }

    // minutero a las 12
    ctx.strokeStyle = "#7dd3fc";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy - r + 22);
    ctx.stroke();

    // horario
    const ah = -Math.PI / 2 + hour * (Math.PI / 6);
    ctx.strokeStyle = "#ffe082";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(ah) * (r * 0.60), cy + Math.sin(ah) * (r * 0.60));
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fill();

    const smallerHour = hour <= 6 ? hour : 12 - hour;
    const a1 = -Math.PI / 2;
    const a2 = -Math.PI / 2 + smallerHour * (Math.PI / 6) * (hour <= 6 ? 1 : -1);
    this._drawAngleArc(ctx, cx, cy, r * 0.38, a1, a2, "rgba(255,120,120,0.25)", "#ffb3b3");

    ctx.restore();
  }

  _drawIsoscelesHeightProblem(ctx, problem) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;
    const cx = W * 0.5;
    const cy = H * 0.49 + 20;
    const basePx = 300;
    const heightPx = 210;

    const A = { x: cx, y: cy - heightPx * 0.55 };
    const B = { x: cx - basePx * 0.5, y: cy + heightPx * 0.45 };
    const C = { x: cx + basePx * 0.5, y: cy + heightPx * 0.45 };
    const M = { x: cx, y: B.y };
    const d = problem.data;

    ctx.save();
    ctx.strokeStyle = "#e6efff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
    ctx.lineTo(C.x, C.y);
    ctx.closePath();
    ctx.stroke();

    ctx.save();
    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(M.x, M.y);
    ctx.stroke();
    ctx.restore();

    this._drawRightAngle(ctx, M.x, M.y, 18, "up-right");
    this._drawEqualSideMark(ctx, A, B, 0.5, 11);
    this._drawEqualSideMark(ctx, A, C, 0.5, 11);

    ctx.font = "22px Arial";
    ctx.fillStyle = "#d9e8ff";
    this._strokeText(ctx, String(d.side), (A.x + B.x) * 0.5 - 35, (A.y + B.y) * 0.5);
    this._strokeText(ctx, String(d.side), (A.x + C.x) * 0.5 + 12, (A.y + C.y) * 0.5);
    this._strokeText(ctx, String(d.base), cx, B.y + 28);
    ctx.restore();
  }

  _drawSquarePerimeterFromAreaProblem(ctx, problem) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;
    const d = problem.data;
    const size = Math.min(W, H) * 0.24;
    const x = W * 0.5 - size * 0.5;
    const y = H * 0.36;

    ctx.save();
    ctx.strokeStyle = "#e6efff";
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, size, size);

    ctx.font = "26px Arial";
    ctx.fillStyle = "#d9e8ff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    this._strokeText(ctx, `${d.area}`, x + size * 0.5, y + size * 0.5);
    ctx.restore();
  }

  _drawPerpendicularAngleProblem(ctx, problem) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;
    const d = problem.data;

    const origin = { x: W * 0.52, y: H * 0.69 };
    const verticalTop = { x: origin.x, y: H * 0.28 };
    const horizontalLeft = { x: W * 0.16, y: origin.y };
    const horizontalRight = { x: W * 0.82, y: origin.y };
    const angle = d.acuteAngle * Math.PI / 180;
    const tanAngle = Math.max(0.001, Math.tan(angle));
    const preferredKY = H * 0.43;
    const preferredRunToBase = (origin.y - preferredKY) / tanAngle;
    const maxBaseX = Math.min(horizontalRight.x - 84, W - 130);
    const maxRunByRight = Math.max(48, maxBaseX - origin.x);
    const maxRunByTop = (origin.y - (verticalTop.y + 24)) / tanAngle;
    const runToBase = Math.min(preferredRunToBase, maxRunByRight, maxRunByTop);
    const kPoint = { x: origin.x, y: origin.y - runToBase * tanAngle };
    const baseCross = { x: kPoint.x + runToBase, y: origin.y };
    const upperExtend = Math.min(W, H) * 0.18;
    const diagTop = {
      x: kPoint.x - Math.cos(angle) * upperExtend,
      y: kPoint.y - Math.sin(angle) * upperExtend,
    };
    const diagBottom = {
      x: baseCross.x + Math.cos(angle) * 22,
      y: baseCross.y + Math.sin(angle) * 22,
    };

    ctx.save();
    ctx.strokeStyle = "#e6efff";
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.moveTo(horizontalLeft.x, horizontalLeft.y);
    ctx.lineTo(horizontalRight.x, horizontalRight.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(verticalTop.x, verticalTop.y);
    ctx.lineTo(origin.x, origin.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(diagTop.x, diagTop.y);
    ctx.lineTo(diagBottom.x, diagBottom.y);
    ctx.stroke();

    this._drawRightAngle(ctx, origin.x, origin.y, 18, "up-right");
    this._drawAngleArc(
      ctx,
      baseCross.x,
      baseCross.y,
      60,
      angle - Math.PI,
      0,
      "rgba(255,120,120,0.22)",
      "#ffb3b3",
    );
    this._drawAngleArc(
      ctx,
      kPoint.x,
      kPoint.y,
      44,
      Math.PI + angle,
      Math.PI * 1.5,
      "rgba(255,220,120,0.16)",
      "#ffe082",
    );

    ctx.font = "28px Arial";
    ctx.fillStyle = "#ffffff";
    this._strokeText(ctx, `${d.obtuseAngle}°`, baseCross.x + 58, baseCross.y - 22);
    this._strokeText(ctx, "k", kPoint.x + 18, kPoint.y - 22);
    ctx.restore();
  }

  _drawHouseAreaProblem(ctx, problem) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;
    const d = problem.data;

    const zone = { x: W * 0.22, y: H * 0.30 + 20, w: W * 0.56, h: H * 0.34 };
    const unit = Math.min(zone.w / d.width, zone.h / (d.wallHeight + d.roofHeight));
    const drawW = d.width * unit;
    const drawH = (d.wallHeight + d.roofHeight) * unit;
    const ox = zone.x + (zone.w - drawW) * 0.5;
    const oy = zone.y + (zone.h - drawH) * 0.5 + drawH;

    const toScreen = (u, v) => ({ x: ox + u * unit, y: oy - v * unit });

    const BL = toScreen(0, 0);
    const BR = toScreen(d.width, 0);
    const TL = toScreen(0, d.wallHeight);
    const TR = toScreen(d.width, d.wallHeight);
    const ROOF = toScreen(d.width / 2, d.wallHeight + d.roofHeight);
    const MID = toScreen(d.width / 2, d.wallHeight);

    ctx.save();
    ctx.strokeStyle = "#e6efff";
    ctx.lineWidth = 4;

    // Rectangulo
    ctx.beginPath();
    ctx.moveTo(BL.x, BL.y);
    ctx.lineTo(BR.x, BR.y);
    ctx.lineTo(TR.x, TR.y);
    ctx.lineTo(TL.x, TL.y);
    ctx.closePath();
    ctx.stroke();

    // Techo
    ctx.beginPath();
    ctx.moveTo(TL.x, TL.y);
    ctx.lineTo(ROOF.x, ROOF.y);
    ctx.lineTo(TR.x, TR.y);
    ctx.stroke();

    ctx.save();
    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ROOF.x, ROOF.y);
    ctx.lineTo(MID.x, MID.y);
    ctx.stroke();
    ctx.restore();

    this._drawRightAngle(ctx, MID.x, MID.y, 16, "up-right");
    this._drawEqualSideMark(ctx, TL, ROOF, 0.55, 11);
    this._drawEqualSideMark(ctx, TR, ROOF, 0.45, 11);

    ctx.font = "21px Arial";
    ctx.fillStyle = "#d9e8ff";
    this._strokeText(ctx, String(d.width), (BL.x + BR.x) * 0.5, BL.y + 26);
    this._strokeText(ctx, String(d.wallHeight), BL.x - 34, (BL.y + TL.y) * 0.5);
    this._strokeText(ctx, String(d.roofSide), (TL.x + ROOF.x) * 0.5 - 25, (TL.y + ROOF.y) * 0.5 - 6);
    this._strokeText(ctx, String(d.roofSide), (TR.x + ROOF.x) * 0.5 + 10, (TR.y + ROOF.y) * 0.5 - 6);
    ctx.restore();
  }

  _drawTwoCirclesProblem(ctx, problem) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;
    const d = problem.data;

    const zone = { x: W * 0.20, y: H * 0.31 + 20, w: W * 0.60, h: H * 0.28 };
    const unit = Math.min(zone.w / d.rectW, zone.h / d.rectH);
    const drawW = d.rectW * unit;
    const drawH = d.rectH * unit;
    const ox = zone.x + (zone.w - drawW) * 0.5;
    const oy = zone.y + (zone.h - drawH) * 0.5;
    const rr = d.r * unit;

    ctx.save();
    ctx.fillStyle = "rgba(255, 90, 90, 0.18)";
    ctx.fillRect(ox, oy, drawW, drawH);
    ctx.strokeStyle = "#e6efff";
    ctx.lineWidth = 4;
    ctx.strokeRect(ox, oy, drawW, drawH);

    const c1 = { x: ox + rr, y: oy + rr };
    const c2 = { x: ox + 3 * rr, y: oy + rr };

    ctx.fillStyle = "#070c16";
    ctx.beginPath();
    ctx.arc(c1.x, c1.y, rr, 0, Math.PI * 2);
    ctx.arc(c2.x, c2.y, rr, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#e6efff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(c1.x, c1.y, rr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(c2.x, c2.y, rr, 0, Math.PI * 2);
    ctx.stroke();

    // radio en el primer circulo
    ctx.strokeStyle = "#ffe082";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(c1.x, c1.y);
    ctx.lineTo(c1.x + rr, c1.y);
    ctx.stroke();

    ctx.font = "22px Arial";
    ctx.fillStyle = "#d9e8ff";
    this._strokeText(ctx, `r = ${d.r}`, c1.x + rr * 0.52, c1.y - 16);
    ctx.restore();
  }

  _drawTwoCirclesDiagonalProblem(ctx, problem) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;
    const d = problem.data;

    const zone = { x: W * 0.20, y: H * 0.31 + 20, w: W * 0.60, h: H * 0.28 };
    const unit = Math.min(zone.w / d.rectW, zone.h / d.rectH);
    const drawW = d.rectW * unit;
    const drawH = d.rectH * unit;
    const ox = zone.x + (zone.w - drawW) * 0.5;
    const oy = zone.y + (zone.h - drawH) * 0.5;
    const rr = d.r * unit;
    const lineStart = { x: ox + d.lineStartX * unit, y: oy };
    const lineEnd = { x: ox + drawW, y: oy + drawH };

    const c1 = { x: ox + rr, y: oy + rr };
    const c2 = { x: ox + 3 * rr, y: oy + rr };

    ctx.save();

    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(lineStart.x, lineStart.y);
    ctx.lineTo(lineEnd.x, lineEnd.y);
    ctx.lineTo(ox, oy + drawH);
    ctx.closePath();
    ctx.fillStyle = "rgba(255, 90, 90, 0.18)";
    ctx.fill();

    ctx.fillStyle = "#070c16";
    ctx.beginPath();
    ctx.arc(c1.x, c1.y, rr, 0, Math.PI * 2);
    ctx.arc(c2.x, c2.y, rr, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#e6efff";
    ctx.lineWidth = 4;
    ctx.strokeRect(ox, oy, drawW, drawH);

    ctx.strokeStyle = "rgba(255, 210, 120, 0.9)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(lineStart.x, lineStart.y);
    ctx.lineTo(lineEnd.x, lineEnd.y);
    ctx.stroke();

    ctx.strokeStyle = "#e6efff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(c1.x, c1.y, rr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(c2.x, c2.y, rr, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "#ffe082";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(c1.x, c1.y);
    ctx.lineTo(c1.x + rr, c1.y);
    ctx.stroke();

    ctx.font = "22px Arial";
    ctx.fillStyle = "#d9e8ff";
    this._strokeText(ctx, `r = ${d.r}`, c1.x + rr * 0.52, c1.y - 16);
    ctx.restore();
  }

  _drawEquilateralAngleProblem(ctx, problem) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;
    const d = problem.data;

    const basePoint = { x: W * 0.56, y: H * 0.79 };
    const extRad = d.exteriorAngle * Math.PI / 180;
    const xRad = d.x * Math.PI / 180;
    const sharedAngle = Math.PI - extRad;
    const sharedPoint = {
      x: basePoint.x + Math.cos(sharedAngle) * Math.min(W, H) * 0.27,
      y: basePoint.y - Math.sin(sharedAngle) * Math.min(W, H) * 0.27,
    };
    const topPoint = {
      x: sharedPoint.x + Math.cos(sharedAngle) * Math.min(W, H) * 0.27,
      y: sharedPoint.y - Math.sin(sharedAngle) * Math.min(W, H) * 0.27,
    };
    const eqAngle = sharedAngle + Math.PI / 3;
    const eqSide = Math.min(W, H) * 0.27;
    const leftPoint = {
      x: sharedPoint.x + Math.cos(eqAngle) * eqSide,
      y: sharedPoint.y - Math.sin(eqAngle) * eqSide,
    };

    const lowerRayAngle = eqAngle + Math.PI;
    const lowerRayDir = { x: Math.cos(lowerRayAngle), y: -Math.sin(lowerRayAngle) };
    const rightRayDir = { x: Math.cos(xRad), y: -Math.sin(xRad) };
    const cross = (ax, ay, bx, by) => (ax * by) - (ay * bx);
    const deltaX = basePoint.x - sharedPoint.x;
    const deltaY = basePoint.y - sharedPoint.y;
    const det = cross(lowerRayDir.x, lowerRayDir.y, rightRayDir.x, rightRayDir.y) || 1e-6;
    const t = cross(deltaX, deltaY, rightRayDir.x, rightRayDir.y) / det;
    const rightCorner = {
      x: sharedPoint.x + lowerRayDir.x * t,
      y: sharedPoint.y + lowerRayDir.y * t,
    };

    const rightMarkSize = 18;
    const toBaseLen = Math.hypot(basePoint.x - rightCorner.x, basePoint.y - rightCorner.y) || 1;
    const toSharedLen = Math.hypot(sharedPoint.x - rightCorner.x, sharedPoint.y - rightCorner.y) || 1;
    const uBase = {
      x: (basePoint.x - rightCorner.x) / toBaseLen,
      y: (basePoint.y - rightCorner.y) / toBaseLen,
    };
    const uShared = {
      x: (sharedPoint.x - rightCorner.x) / toSharedLen,
      y: (sharedPoint.y - rightCorner.y) / toSharedLen,
    };
    const canvasSharedAngle = (Math.PI * 2) - sharedAngle;
    const canvasXAngle = (Math.PI * 2) - xRad;

    ctx.save();
    ctx.strokeStyle = "#e6efff";
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.moveTo(44, basePoint.y);
    ctx.lineTo(W - 44, basePoint.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(leftPoint.x, leftPoint.y);
    ctx.lineTo(topPoint.x, topPoint.y);
    ctx.lineTo(sharedPoint.x, sharedPoint.y);
    ctx.lineTo(leftPoint.x, leftPoint.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(topPoint.x, topPoint.y);
    ctx.lineTo(basePoint.x, basePoint.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(leftPoint.x, leftPoint.y);
    ctx.lineTo(rightCorner.x, rightCorner.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(rightCorner.x, rightCorner.y);
    ctx.lineTo(basePoint.x, basePoint.y);
    ctx.stroke();

    ctx.fillStyle = "#e6efff";
    for (const p of [leftPoint, topPoint, sharedPoint, rightCorner, basePoint]) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    this._drawEqualSideMark(ctx, leftPoint, topPoint, 0.45, 14);
    this._drawEqualSideMark(ctx, topPoint, sharedPoint, 0.5, 14);
    this._drawEqualSideMark(ctx, leftPoint, sharedPoint, 0.52, 14);

    ctx.strokeStyle = "#ffe082";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(rightCorner.x, rightCorner.y);
    ctx.lineTo(
      rightCorner.x + uBase.x * rightMarkSize,
      rightCorner.y + uBase.y * rightMarkSize,
    );
    ctx.lineTo(
      rightCorner.x + uBase.x * rightMarkSize + uShared.x * rightMarkSize,
      rightCorner.y + uBase.y * rightMarkSize + uShared.y * rightMarkSize,
    );
    ctx.lineTo(
      rightCorner.x + uShared.x * rightMarkSize,
      rightCorner.y + uShared.y * rightMarkSize,
    );
    ctx.stroke();

    this._drawAngleArc(
      ctx,
      basePoint.x,
      basePoint.y,
      52,
      Math.PI,
      canvasSharedAngle,
      "rgba(255,120,120,0.24)",
      "#ffb3b3",
    );
    this._drawAngleArc(
      ctx,
      basePoint.x,
      basePoint.y,
      56,
      canvasXAngle,
      Math.PI * 2,
      "rgba(255,220,120,0.18)",
      "#ffe082",
    );

    ctx.font = "26px Arial";
    ctx.fillStyle = "#ffffff";
    this._strokeText(ctx, `${d.exteriorAngle}°`, basePoint.x - 92, basePoint.y - 38);
    this._strokeText(ctx, "x", basePoint.x + 62, basePoint.y - 34);
    ctx.restore();
  }

  _drawSplitShadedAreaProblem(ctx, problem) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;
    const d = problem.data;

    const zone = { x: W * 0.24 + 50, y: H * 0.29 + 50, w: W * 0.46, h: H * 0.34 };
    const totalW = d.width + d.rightBase;
    const totalH = d.height + d.topHeight;
    const unit = Math.min(zone.w / totalW, zone.h / totalH);
    const ox = zone.x + (zone.w - totalW * unit) * 0.5;
    const oy = zone.y + (zone.h - totalH * unit) * 0.5 + totalH * unit;

    const BL = { x: ox, y: oy };
    const BR = { x: ox + d.width * unit, y: oy };
    const TL = { x: ox, y: oy - d.height * unit };
    const TR = { x: ox + d.width * unit, y: oy - d.height * unit };
    const TOP = { x: ox, y: oy - (d.height + d.topHeight) * unit };
    const RIGHT = { x: ox + (d.width + d.rightBase) * unit, y: oy };

    ctx.save();
    ctx.lineWidth = 4;

    ctx.fillStyle = "rgba(255, 90, 90, 0.22)";
    ctx.beginPath();
    ctx.moveTo(TOP.x, TOP.y);
    ctx.lineTo(TL.x, TL.y);
    ctx.lineTo(TR.x, TR.y);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(TR.x, TR.y);
    ctx.lineTo(BR.x, BR.y);
    ctx.lineTo(RIGHT.x, RIGHT.y);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#e6efff";
    ctx.beginPath();
    ctx.moveTo(BL.x, BL.y);
    ctx.lineTo(TL.x, TL.y);
    ctx.lineTo(TOP.x, TOP.y);
    ctx.lineTo(TR.x, TR.y);
    ctx.lineTo(RIGHT.x, RIGHT.y);
    ctx.lineTo(BR.x, BR.y);
    ctx.lineTo(BL.x, BL.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(TL.x, TL.y);
    ctx.lineTo(TR.x, TR.y);
    ctx.lineTo(BR.x, BR.y);
    ctx.lineTo(BL.x, BL.y);
    ctx.closePath();
    ctx.stroke();

    ctx.font = "24px Arial";
    ctx.fillStyle = "#d9e8ff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    this._strokeText(ctx, `${d.rectArea}`, ox + d.width * unit * 0.5, oy - d.height * unit * 0.5);
    this._strokeText(ctx, `${d.width}`, (BL.x + BR.x) * 0.5, BR.y + 26);
    this._strokeText(ctx, `${d.topHeight}`, TL.x - 26, (TOP.y + TL.y) * 0.5);
    this._strokeText(ctx, `${d.rightBase}`, (BR.x + RIGHT.x) * 0.5, BR.y + 26);
    ctx.restore();
  }

  _drawEquilateralTransversalProblem(ctx, problem) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;
    const d = problem.data;

    const side = Math.min(W, H) * 0.34;
    const baseY = H * 0.69;
    const left = { x: W * 0.32 + 50, y: baseY };
    const right = { x: left.x + side, y: baseY };
    const top = {
      x: (left.x + right.x) * 0.5,
      y: baseY - side * Math.sqrt(3) / 2,
    };

    const tLeft = 0.58;
    const tRight = 0.48;
    const pLeft = {
      x: left.x + (top.x - left.x) * tLeft,
      y: left.y + (top.y - left.y) * tLeft,
    };
    const pRight = {
      x: top.x + (right.x - top.x) * tRight,
      y: top.y + (right.y - top.y) * tRight,
    };
    const lineVec = { x: pRight.x - pLeft.x, y: pRight.y - pLeft.y };
    const lineLen = Math.hypot(lineVec.x, lineVec.y) || 1;
    const ux = lineVec.x / lineLen;
    const uy = lineVec.y / lineLen;
    const extend = side * 0.42;
    const lineStart = { x: pLeft.x - ux * extend, y: pLeft.y - uy * extend };
    const lineEnd = { x: pRight.x + ux * extend, y: pRight.y + uy * extend };

    ctx.save();
    ctx.strokeStyle = "#e6efff";
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.moveTo(left.x, left.y);
    ctx.lineTo(top.x, top.y);
    ctx.lineTo(right.x, right.y);
    ctx.closePath();
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 90, 120, 0.95)";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(lineStart.x, lineStart.y);
    ctx.lineTo(lineEnd.x, lineEnd.y);
    ctx.stroke();

    this._drawEqualSideMark(ctx, left, top, 0.5, 14);
    this._drawEqualSideMark(ctx, top, right, 0.5, 14);
    this._drawEqualSideMark(ctx, left, right, 0.5, 14);

    this._drawAngleArc(
      ctx,
      pLeft.x,
      pLeft.y,
      42,
      Math.atan2(top.y - pLeft.y, top.x - pLeft.x),
      Math.atan2(lineStart.y - pLeft.y, lineStart.x - pLeft.x),
      "rgba(255,120,120,0.18)",
      "#ffb3b3",
    );

    this._drawAngleArc(
      ctx,
      pRight.x,
      pRight.y,
      40,
      Math.atan2(lineEnd.y - pRight.y, lineEnd.x - pRight.x),
      Math.atan2(right.y - pRight.y, right.x - pRight.x),
      "rgba(255,120,120,0.14)",
      "#ffb3b3",
    );

    ctx.font = "30px Arial";
    ctx.fillStyle = "#ffffff";
    this._strokeText(ctx, `${d.leftExteriorAngle}°`, pLeft.x - 60, pLeft.y - 48);
    this._strokeText(ctx, "x", pRight.x + 42, pRight.y + 44);
    ctx.restore();
  }

  _drawPythagoreanShadedAreaProblem(ctx, problem) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;
    const d = problem.data;

    const zone = { x: W * 0.18, y: H * 0.26 + 50, w: W * 0.64, h: H * 0.42 };
    const totalW = d.totalBase;
    const totalH = d.height;
    const unit = Math.min(zone.w / totalW, zone.h / totalH);
    const ox = zone.x + (zone.w - totalW * unit) * 0.5;
    const oy = zone.y + (zone.h - totalH * unit) * 0.5 + totalH * unit;

    const BL = { x: ox, y: oy };
    const BM = { x: ox + d.leftBase * unit, y: oy };
    const BR = { x: ox + d.totalBase * unit, y: oy };
    const TOP = { x: BM.x, y: oy - d.height * unit };
    const TR = { x: BR.x, y: TOP.y };

    ctx.save();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#e6efff";

    ctx.fillStyle = "rgba(99, 212, 113, 0.45)";
    ctx.beginPath();
    ctx.moveTo(TOP.x, TOP.y);
    ctx.lineTo(TR.x, TR.y);
    ctx.lineTo(BR.x, BR.y);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(BL.x, BL.y);
    ctx.lineTo(TOP.x, TOP.y);
    ctx.lineTo(TR.x, TR.y);
    ctx.lineTo(BR.x, BR.y);
    ctx.lineTo(BL.x, BL.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(TOP.x, TOP.y);
    ctx.lineTo(BM.x, BM.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(TOP.x, TOP.y);
    ctx.lineTo(BR.x, BR.y);
    ctx.stroke();

    ctx.font = "24px Arial";
    ctx.fillStyle = "#d9e8ff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    this._strokeText(ctx, `${d.totalBase}`, (BL.x + BR.x) * 0.5, oy + 28);
    this._strokeText(ctx, `${d.slantedSide}`, (BL.x + TOP.x) * 0.5 - 24, (BL.y + TOP.y) * 0.5);
    this._strokeText(ctx, `${d.topWidth}`, (TOP.x + TR.x) * 0.5, TOP.y - 26);
    ctx.restore();
  }

  _drawParallelIsoscelesAngleProblem(ctx, problem) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;
    const d = problem.data;
    const normalizeAngle = (a) => {
      let angle = a % (Math.PI * 2);
      if (angle < 0) angle += Math.PI * 2;
      return angle;
    };

    const topY = H * 0.34;
    const bottomY = H * 0.74;
    const leftTop = { x: W * 0.34 + 100, y: topY };
    const baseAngleRad = d.baseAngle * Math.PI / 180;
    const parallelAngleRad = d.parallelAngle * Math.PI / 180;
    const vertexY = H * 0.56;
    const riseToVertex = vertexY - topY;
    const runToVertex = riseToVertex / Math.max(0.001, Math.tan(baseAngleRad));
    const vertex = { x: leftTop.x + runToVertex, y: vertexY };
    const rightTop = { x: vertex.x + runToVertex, y: topY };
    const riseToBottom = bottomY - topY;
    const runToBottom = riseToBottom / Math.max(0.001, Math.tan(parallelAngleRad));
    const bottomCross = { x: leftTop.x + runToBottom, y: bottomY };
    const transversalDir = {
      x: bottomCross.x - leftTop.x,
      y: bottomCross.y - leftTop.y,
    };
    const transversalLen = Math.hypot(transversalDir.x, transversalDir.y) || 1;
    const ux = transversalDir.x / transversalLen;
    const uy = transversalDir.y / transversalLen;
    const topExtend = 96;
    const bottomExtend = 34;
    const transversalStart = {
      x: leftTop.x - ux * topExtend,
      y: leftTop.y - uy * topExtend,
    };
    const transversalEnd = {
      x: bottomCross.x + ux * bottomExtend,
      y: bottomCross.y + uy * bottomExtend,
    };

    ctx.save();
    ctx.lineWidth = 4;

    ctx.strokeStyle = "#7c4dff";
    ctx.beginPath();
    ctx.moveTo(56, topY);
    ctx.lineTo(W - 56, topY);
    ctx.stroke();

    ctx.strokeStyle = "#7131f1";
    ctx.beginPath();
    ctx.moveTo(56, bottomY);
    ctx.lineTo(W - 56, bottomY);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 80, 80, 0.95)";
    ctx.beginPath();
    ctx.moveTo(transversalStart.x, transversalStart.y);
    ctx.lineTo(transversalEnd.x, transversalEnd.y);
    ctx.stroke();

    ctx.strokeStyle = "#e6efff";
    ctx.beginPath();
    ctx.moveTo(vertex.x, vertex.y);
    ctx.lineTo(leftTop.x, leftTop.y);
    ctx.moveTo(vertex.x, vertex.y);
    ctx.lineTo(rightTop.x, rightTop.y);
    ctx.stroke();

    this._drawEqualSideMark(ctx, vertex, leftTop, 0.5, 14);
    this._drawEqualSideMark(ctx, vertex, rightTop, 0.5, 14);

    const leftAngleA = Math.atan2(leftTop.y - vertex.y, leftTop.x - vertex.x);
    const rightAngleA = Math.atan2(rightTop.y - vertex.y, rightTop.x - vertex.x);
    this._drawAngleArc(
      ctx,
      vertex.x,
      vertex.y,
      36,
      leftAngleA,
      rightAngleA,
      "rgba(170, 140, 255, 0.20)",
      "#c7b5ff",
    );

    const bottomLeftRayA = Math.PI;
    const bottomTransversalA = normalizeAngle(
      Math.atan2(leftTop.y - bottomCross.y, leftTop.x - bottomCross.x),
    );
    this._drawAngleArc(
      ctx,
      bottomCross.x,
      bottomCross.y,
      42,
      bottomLeftRayA,
      bottomTransversalA,
      "rgba(170, 140, 255, 0.15)",
      "#c7b5ff",
    );

    const leftSideA = normalizeAngle(
      Math.atan2(vertex.y - leftTop.y, vertex.x - leftTop.x),
    );
    this._drawAngleArc(
      ctx,
      leftTop.x,
      leftTop.y,
      42,
      leftSideA,
      Math.PI,
      "rgba(255, 210, 120, 0.16)",
      "#ffe082",
    );

    ctx.font = "28px Arial";
    ctx.fillStyle = "#ffffff";
    this._strokeText(ctx, `${d.parallelAngle}°`, bottomCross.x - 82, bottomCross.y - 26);
    this._strokeText(ctx, `${d.leftExteriorAngle}°`, leftTop.x - 84, leftTop.y + 42);
    this._strokeText(ctx, "x", vertex.x - 12, vertex.y - 46);
    ctx.fillStyle = "#ffffff";
    ctx.font = "22px Arial";
    this._strokeText(ctx, "A", W - 38, topY - 8);
    this._strokeText(ctx, "B", W - 38, bottomY - 8);
    ctx.restore();
  }

  _drawStarPerimeterProblem(ctx, problem) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;
    const d = problem.data;

    const zone = { x: W * 0.24, y: H * 0.26 + 90, w: W * 0.52, h: H * 0.40 };
    const marginUnits = d.squareSide * 0.866;
    const totalUnits = d.squareSide + 2 * marginUnits;
    const unit = Math.min(zone.w / totalUnits, zone.h / totalUnits);
    const drawTotal = totalUnits * unit;
    const ox = zone.x + (zone.w - drawTotal) * 0.5 + marginUnits * unit;
    const oy = zone.y + (zone.h - drawTotal) * 0.5 + marginUnits * unit;

    const s = d.squareSide * unit;
    const x0 = ox;
    const y0 = oy;
    const x1 = x0 + s;
    const y1 = y0 + s;

    const TL = { x: x0, y: y0 };
    const TR = { x: x1, y: y0 };
    const BR = { x: x1, y: y1 };
    const BL = { x: x0, y: y1 };
    const TOP = { x: (x0 + x1) * 0.5, y: y0 - s * Math.sqrt(3) / 2 };
    const RIGHT = { x: x1 + s * Math.sqrt(3) / 2, y: (y0 + y1) * 0.5 };
    const BOTTOM = { x: (x0 + x1) * 0.5, y: y1 + s * Math.sqrt(3) / 2 };
    const LEFT = { x: x0 - s * Math.sqrt(3) / 2, y: (y0 + y1) * 0.5 };

    ctx.save();
    ctx.strokeStyle = "#e6efff";
    ctx.lineWidth = 4;

    // Cuadrado
    ctx.strokeRect(x0, y0, s, s);

    // Triangulos equilateros hacia afuera
    ctx.beginPath();
    ctx.moveTo(TL.x, TL.y);
    ctx.lineTo(TOP.x, TOP.y);
    ctx.lineTo(TR.x, TR.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(TR.x, TR.y);
    ctx.lineTo(RIGHT.x, RIGHT.y);
    ctx.lineTo(BR.x, BR.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(BL.x, BL.y);
    ctx.lineTo(BOTTOM.x, BOTTOM.y);
    ctx.lineTo(BR.x, BR.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(TL.x, TL.y);
    ctx.lineTo(LEFT.x, LEFT.y);
    ctx.lineTo(BL.x, BL.y);
    ctx.stroke();

    // 4 circulos internos
    const rr = (s / 4);
    const centers = [
      { x: x0 + rr, y: y0 + rr },
      { x: x0 + 3 * rr, y: y0 + rr },
      { x: x0 + rr, y: y0 + 3 * rr },
      { x: x0 + 3 * rr, y: y0 + 3 * rr },
    ];

    for (const c of centers) {
      ctx.beginPath();
      ctx.arc(c.x, c.y, rr, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Radio marcado en el circulo superior izquierdo
    ctx.strokeStyle = "#ffe082";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centers[0].x, centers[0].y);
    ctx.lineTo(centers[0].x + rr, centers[0].y);
    ctx.stroke();

    ctx.font = "21px Arial";
    ctx.fillStyle = "#d9e8ff";
    this._strokeText(ctx, `${d.r}`, centers[0].x, centers[0].y - 4);
    ctx.restore();
  }

  _drawAnswerInput(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;
    const boxW = Math.min(430, W * 0.58);
    const boxH = 58;
    const x = (W - boxW) * 0.5;
    const y = H * 0.81 + 20;

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(x, y, boxW, boxH);
    ctx.strokeStyle = "rgba(122,167,255,0.8)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, boxW, boxH);

    const blinkOn = Math.floor(Date.now() / 450) % 2 === 0;
    const caret = blinkOn ? "|" : " ";
    const label = this.current?.answerLabel || "R";
    const text = this.answerInput ? `${label} = ${this.answerInput}${caret}` : `${label} = ${caret}`;
    ctx.font = "30px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(text, W * 0.5, y + boxH * 0.5);

    ctx.fillStyle = "#ffffff";
    ctx.font = "18px Arial";
    ctx.fillText("Escribe la respuesta numerica y pulsa ENTER", W * 0.5, y + boxH + 26);

    if (this.answerFeedback) {
      ctx.font = "18px Arial";
      ctx.fillStyle = "#ffd2d2";
      ctx.fillText(this.answerFeedback, W * 0.5, y + boxH + 54);
    }

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

    const lines = (this.message || "").split("\n");
    let y = H * 0.32;
    for (const line of lines) {
      ctx.fillText(line, W / 2, y);
      y += 30;
    }

    ctx.font = "18px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Pulsa ENTER, ESPACIO o clic para volver.", W / 2, y + 22);
    ctx.restore();
  }

  // =======================================================
  // HELPERS
  // =======================================================
  _randInt(a, b) {
    return a + Math.floor(Math.random() * (b - a + 1));
  }

  _pick(arr) {
    return arr[this._randInt(0, arr.length - 1)];
  }

  _isPointInRect(px, py, r) {
    if (!r) return false;
    return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
  }

  _wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    if (!text) return;
    const words = String(text).split(" ");
    let line = "";
    let yy = y;

    ctx.textBaseline = "top";
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + " ";
      const testWidth = ctx.measureText(testLine).width;
      if (testWidth > maxWidth && i > 0) {
        ctx.fillText(line.trim(), x, yy);
        line = words[i] + " ";
        yy += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), x, yy);
  }

  _strokeText(ctx, text, x, y) {
    ctx.save();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(0,0,0,0.75)";
    ctx.strokeText(String(text), x, y);
    ctx.fillStyle = ctx.fillStyle || "#ffffff";
    ctx.fillText(String(text), x, y);
    ctx.restore();
  }

  _drawGlassPanel(ctx, rect, options = {}) {
    if (!rect) return;
    const radius = options.radius ?? 22;
    ctx.save();
    ctx.beginPath();
    this._roundedRectPath(ctx, rect.x, rect.y, rect.w, rect.h, radius);
    ctx.fillStyle = options.fill || "rgba(10, 16, 28, 0.72)";
    ctx.fill();
    ctx.lineWidth = options.lineWidth ?? 2;
    ctx.strokeStyle = options.stroke || "rgba(140, 190, 255, 0.65)";
    ctx.stroke();
    ctx.restore();
  }

  _roundedRectPath(ctx, x, y, w, h, r) {
    const radius = Math.max(0, Math.min(r, Math.min(w, h) * 0.5));
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
  }

  _estimateDiagonalShadedArea(rectW, rectH, circles, lineStartX = 0) {
    const steps = 4000;
    const dx = rectW / steps;
    let area = 0;
    const lineRun = Math.max(1e-6, rectW - lineStartX);

    for (let i = 0; i < steps; i++) {
      const x = (i + 0.5) * dx;
      const lineY = (rectH / lineRun) * (x - lineStartX);
      const shadeMinY = Math.max(0, lineY);
      let shadedHeight = Math.max(0, rectH - shadeMinY);

      for (const circle of circles) {
        const xFromCenter = x - circle.x;
        if (Math.abs(xFromCenter) > circle.r) continue;
        const ySpan = Math.sqrt(circle.r * circle.r - xFromCenter * xFromCenter);
        const yMin = circle.y - ySpan;
        const yMax = circle.y + ySpan;
        const overlap = Math.max(0, Math.min(rectH, yMax) - Math.max(shadeMinY, yMin));
        shadedHeight -= overlap;
      }

      area += Math.max(0, shadedHeight) * dx;
    }

    return Number(area.toFixed(2));
  }

  _drawAngleArc(ctx, cx, cy, r, start, end, fill, stroke) {
    let a1 = start;
    let a2 = end;
    if (a2 < a1) [a1, a2] = [a2, a1];

    ctx.save();
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, a1, a2, false);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = stroke;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, r, a1, a2, false);
    ctx.stroke();
    ctx.restore();
  }

  _drawEqualSideMark(ctx, P1, P2, t = 0.5, markLen = 10) {
    const mx = P1.x + (P2.x - P1.x) * t;
    const my = P1.y + (P2.y - P1.y) * t;
    const dx = P2.x - P1.x;
    const dy = P2.y - P1.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;

    ctx.save();
    ctx.strokeStyle = "#ffe082";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(mx - nx * markLen * 0.5, my - ny * markLen * 0.5);
    ctx.lineTo(mx + nx * markLen * 0.5, my + ny * markLen * 0.5);
    ctx.stroke();
    ctx.restore();
  }

  _drawRightAngle(ctx, x, y, size = 16, mode = "up-right") {
    ctx.save();
    ctx.strokeStyle = "#ffe082";
    ctx.lineWidth = 3;
    ctx.beginPath();

    if (mode === "up-right") {
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - size);
      ctx.lineTo(x + size, y - size);
      ctx.lineTo(x + size, y);
    }

    ctx.stroke();
    ctx.restore();
  }

  _drawRightAngleAtSegment(ctx, corner, segmentAngle, size = 18) {
    const perpAngle = segmentAngle + Math.PI / 2;
    const ax = Math.cos(segmentAngle) * size;
    const ay = -Math.sin(segmentAngle) * size;
    const bx = Math.cos(perpAngle) * size;
    const by = -Math.sin(perpAngle) * size;

    ctx.save();
    ctx.strokeStyle = "#ffe082";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(corner.x, corner.y);
    ctx.lineTo(corner.x - ax, corner.y - ay);
    ctx.lineTo(corner.x - ax + bx, corner.y - ay + by);
    ctx.lineTo(corner.x + bx, corner.y + by);
    ctx.stroke();
    ctx.restore();
  }
}

window.ProblemasScene = ProblemasScene;
