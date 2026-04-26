// ===========================================================
// sustituirYEvaluarScene.js
// Minijuego Álgebra: Sustitución y evaluación (Laberinto del Minotauro)
// Motor: motor2D.js (Scene)
//
// - 3 rondas por corrida
// - Ecuación/opciones se revelan SOLO al presionar ENTER
// - Error: spawnea otro minotauro (hasta un máximo)
// - Minotauros lentos (tiempo para pensar)
// - Movimiento suave (tween) manteniendo lógica por grilla
// - Sonidos y cierre estilo Math Nightmare
// ===========================================================

class SustituirYEvaluarScene extends Scene {
  constructor(game, opts = {}) {
    super(game);

    // -------------------- Ciclo MN --------------------
    this.state = "intro"; // intro | playing | round_end | finished
    this.gameFinished = false;
    this.exitDelay = 0;
    this.message = "";
    this.win = false;

    // Rondas
    this.roundIndex = 0;
    this.roundsPerRun = opts.roundsPerRun ?? 3;
    this.correctCount = 0;
    this.sheetsReward = 0;
    this.runMazes = [];

    // -------------------- Laberinto (grid) --------------------
    this.tile = opts.tile ?? 30; // con zoom 3 se ve bien
    // Subdivide solo la lógica de movimiento; el laberinto se dibuja con su grilla original.
    this.mazeScale = Math.max(1, opts.mazeScale ?? 4);
    this.subTile = this.tile / this.mazeScale;
    this.grid = null; // array[r][c] con "1" muro, "0" suelo
    this.rows = 0;
    this.cols = 0;
    this.moveRows = 0;
    this.moveCols = 0;

    this.playerCell = { r: 0, c: 0 };
    this.playerSpawn = { r: 0, c: 0 };
    this.playerNode = { r: 0, c: 0 };
    this.playerSpawnNode = { r: 0, c: 0 };
    this.exitCell = { r: 0, c: 0 };
    this.exitZone = [];
    this.choices = {}; // {A:{r,c},B:{},C:{},D:{}}
    this.choiceZones = { A: [], B: [], C: [], D: [] };

    // Spawn original del minotauro (para spawnear extras)
    this.minoSpawn = { r: 0, c: 0 };

    // Player sprite
    this.playerSprite = {
      direction: "front",
      facing: "right",
      frame: 0,
      speed: 0.05,
      timer: 0,
      sheets: {
        front: { key: "minotauro_player_front", cols: 16, rows: 1, img: null, w: 0, h: 0 },
        back: { key: "minotauro_player_back", cols: 8, rows: 2, img: null, w: 0, h: 0 },
        side: { key: "minotauro_player_side", cols: 6, rows: 2, img: null, w: 0, h: 0 },
      },
    };

    // Minotauro sprite
    this.minoSprite = {
      frame: 0,
      speed: 0.14,
      timer: 0,
      sheets: {
        front: { key: "minotauro_enemy_front", cols: 15, rows: 1, img: null, w: 0, h: 0 },
        back: { key: "minotauro_enemy_back", cols: 6, rows: 3, img: null, w: 0, h: 0 },
        side: { key: "minotauro_enemy_side", cols: 5, rows: 3, img: null, w: 0, h: 0 },
      },
    };

    // -------------------- Movimiento (suave) --------------------
    this._moveBuffer = null; // última dirección pedida durante el tween
    this._moveHold = null; // opcional: para mantener dirección
    this.playerPos = { x: 0, y: 0 };
    this.playerMove = {
      active: false,
      t: 0,
      dur: (opts.playerMoveDur ?? 0.2) / this.mazeScale,
      fromX: 0,
      fromY: 0,
      toX: 0,
      toY: 0,
    };

    this._moveCooldown = 0;
    this._moveEvery = 0.08;

    // Minotauros (varios)
    this.minos = []; // [{cell:{r,c}, pos:{x,y}, move:{...}, timer:0}]
    this._minoBaseEvery = (opts.minoEvery ?? 1.2) / this.mazeScale; // conserva velocidad global al escalar
    this._minoEvery = this._minoBaseEvery;
    this._minoMaxCount = opts.minoMaxCount ?? 5;
    this._minoSpawnCooldown = opts.minoSpawnCooldown ?? 4;
    this._minoSpawnCooldownTimer = 0;

    // Arranque sin trampa
    this.revealed = false; // ecuación/opciones visibles
    this.minoActive = false; // se mueven o no
    this.minoStartDelay = 0; // segundos

    // -------------------- Pregunta --------------------
    this.question = null; // { exprStr, x, answer, typicalWrong() }
    this.optionValues = {}; // {A:...,B:...,C:...,D:...}
    this.correctLetter = "A";
    this.exitOpen = false;

    // -------------------- UI --------------------
    this.showQuestion = true;

    // -------------------- Input prev --------------------
    this._prevKeys = {};

    // -------------------- Sonidos (ecosistema MN) --------------------
    this.sfxCorrect = "sfx_match";
    this.sfxWrong = "sfx_error";
    this.sfxOpen = "sfx_ok";
    this.sfxSpawn = "sfx_choque";
    this.sfxWin = "sfx_win";
    this.sfxRugido = "sfx_rugido";

    // Cámara
    this._camTarget = null;
    this.camera.followLerp = 0.4;

    // Zoom del juego (motor2D lo aplica en Game.render)
    this._zoom = opts.zoom ?? 4;
    this._previousZoom = null;

    // Fondo opcional
    this.bgImageKey = opts.bgImageKey ?? null;
    this.bgImage = null;

    // Feedback visual
    this.visualClock = 0;
    this.spawnFlash = 0;
    this.exitFlash = 0;
    this.dangerLevel = 0;
    this.wallLamps = [];
    this.fogLayers = [];
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
    if (window.MN_setLeafHUDVisible) window.MN_setLeafHUDVisible(false);
    if (window.MN_setInputMode) MN_setInputMode("keyboard");

    // Fondo
    const A = this.game.assets;
    this.bgImage =
      (this.bgImageKey && A && A.getImage && A.getImage(this.bgImageKey)) ||
      null;

    this._loadDirectionalSheets(this.playerSprite);
    this._loadDirectionalSheets(this.minoSprite);

    // Reset run
    this.state = "intro";
    this.gameFinished = false;
    this.exitDelay = 0;
    this.message = "";
    this.win = false;

    this.roundIndex = 0;
    this.correctCount = 0;
    this.sheetsReward = 0;
    this.runMazes = [];
    this.visualClock = 0;
    this.spawnFlash = 0;
    this.exitFlash = 0;
    this.dangerLevel = 0;
    this.wallLamps = [];
    this.fogLayers = [];

    // Cargar laberinto desde data global (sin fetch)
    // Esperado: window.ALGEBRA_LABERINTOS = [{id, matriz:["0101...", ...] o matriz:[[...]]}, ...]
    const list =
      (window.ALGEBRA_LABERINTOS && Array.isArray(window.ALGEBRA_LABERINTOS)
        ? window.ALGEBRA_LABERINTOS
        : []) || [];
    this.runMazes = this._pickRunMazes(list, this.roundsPerRun);
    this._loadMazeForRound(this.roundIndex);

    // Guarda el zoom previo para restaurarlo al salir del minijuego.
    this._previousZoom = this.game?.zoom ?? 1;

    // Set zoom real del motor
    if (typeof this.game.setZoom === "function") {
      this.game.setZoom(this._zoom);
    } else {
      // compat
      this.game.zoom = this._zoom;
    }

    // Cámara bounds
    const w = this.cols * this.tile;
    const h = this.rows * this.tile;
    this.camera.setBounds(0, 0, w, h);
    if (this.camera.updateDimensionsFromZoom)
      this.camera.updateDimensionsFromZoom();
    if (this.camera.setDeadZone) this.camera.setDeadZone(0, 0);

    // Primera ronda
    this._setupRound();
  }

  destroy() {
    this._stopMinoSteps();
    if (typeof this.game?.setZoom === "function") {
      this.game.setZoom(this._previousZoom ?? 1);
    } else if (this.game) {
      this.game.zoom = this._previousZoom ?? 1;
    }
    this.clearAll?.();
  }

  /* ============================ Laberinto ============================ */
  _fallbackMaze() {
    // Un mini laberinto 16x10 para no romper si falta data
    return {
      id: "fallback",
      matriz: [
        "11111111111111111",
        "1J000000000000001",
        "10111101111111101",
        "10000001000000001",
        "10111001011111101",
        "1000A0000B0000001",
        "11101111111011001",
        "1000000C0000D10E1",
        "10111101111111101",
        "1M000000000000001",
        "11111111111111111",
      ],
    };
  }

  _normalizeMatrix(matriz) {
    // Acepta array de strings o array de arrays
    if (!matriz || !matriz.length) throw new Error("matriz vacía");

    if (typeof matriz[0] === "string") {
      return matriz.map((row) => row.split(""));
    }

    // Asumimos ya viene como [][ ] de chars
    return matriz;
  }

  _pickRunMazes(list, count) {
    if (!Array.isArray(list) || list.length === 0) {
      return Array.from({ length: count }, (_, idx) => ({
        ...this._fallbackMaze(),
        id: `fallback_${idx + 1}`,
      }));
    }

    const shuffled = [...list];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const out = [];
    for (let i = 0; i < count; i++) {
      out.push(shuffled[i % shuffled.length]);
    }
    return out;
  }

  _loadMazeForRound(roundIndex) {
    const maze =
      this.runMazes[roundIndex] ||
      this.runMazes[roundIndex % Math.max(1, this.runMazes.length)] ||
      this._fallbackMaze();

    this._loadMazeFromMatrix(maze.matriz);

    const w = this.cols * this.tile;
    const h = this.rows * this.tile;
    this.camera.setBounds(0, 0, w, h);
    if (this.camera.updateDimensionsFromZoom) {
      this.camera.updateDimensionsFromZoom();
    }
    if (this.camera.setDeadZone) this.camera.setDeadZone(0, 0);
  }

  _loadMazeFromMatrix(matriz) {
    this.grid = this._normalizeMatrix(matriz);
    this.rows = this.grid.length;
    this.cols = this.grid[0]?.length ?? 0;
    this.moveRows = this.rows * this.mazeScale;
    this.moveCols = this.cols * this.mazeScale;

    const find = (ch) => {
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          if (this.grid[r][c] === ch) return { r, c };
        }
      }
      return null;
    };

    const J = find("J");
    const M = find("M");
    const E = find("E");
    const A = find("A");
    const B = find("B");
    const C = find("C");
    const D = find("D");

    if (!J || !M || !E || !A || !B || !C || !D) {
      throw new Error("Faltan letras J/M/A/B/C/D/E en el laberinto");
    }

    this.playerSpawn = { ...J };
    this.playerCell = { ...this.playerSpawn };
    this.playerSpawnNode = this._cellToNode(this.playerSpawn);
    this.playerNode = { ...this.playerSpawnNode };
    this.minoSpawn = { ...M };
    this.exitCell = { ...E };
    this.choices = { A, B, C, D };
    this.exitZone = [{ ...E }];
    this.choiceZones = { A: [{ ...A }], B: [{ ...B }], C: [{ ...C }], D: [{ ...D }] };

    // Normaliza: letras NO deben quedar como muro (ni como letras en colisión)
    const clear = (cell) => {
      if (!cell) return;
      this.grid[cell.r][cell.c] = "0";
    };
    clear(J);
    clear(M);
    clear(E);
    clear(A);
    clear(B);
    clear(C);
    clear(D);

    this.wallLamps = this._buildWallLamps();
    this.fogLayers = this._buildFogLayers();
  }

  _isWall(r, c) {
    if (r < 0 || c < 0 || r >= this.rows || c >= this.cols) return true;
    return this.grid[r][c] === "1";
  }

  _cellToPx(cell) {
    return { x: cell.c * this.tile, y: cell.r * this.tile };
  }

  _cellToNode(cell) {
    const offset = Math.floor(this.mazeScale / 2);
    return {
      r: cell.r * this.mazeScale + offset,
      c: cell.c * this.mazeScale + offset,
    };
  }

  _nodeToCell(node) {
    return {
      r: Math.max(0, Math.min(this.rows - 1, Math.floor(node.r / this.mazeScale))),
      c: Math.max(0, Math.min(this.cols - 1, Math.floor(node.c / this.mazeScale))),
    };
  }

  _nodeToPx(node) {
    return { x: node.c * this.subTile, y: node.r * this.subTile };
  }

  _isWallNode(r, c) {
    if (r < 0 || c < 0 || r >= this.moveRows || c >= this.moveCols) return true;
    const cell = this._nodeToCell({ r, c });
    return this._isWall(cell.r, cell.c);
  }

  _isCellInZone(cell, zone) {
    return !!zone?.some((z) => z.r === cell.r && z.c === cell.c);
  }

  _getZoneRect(zone, fallbackCell) {
    const cells = zone?.length ? zone : fallbackCell ? [fallbackCell] : [];
    if (!cells.length) return null;
    let minR = Infinity;
    let maxR = -Infinity;
    let minC = Infinity;
    let maxC = -Infinity;
    for (const cell of cells) {
      if (cell.r < minR) minR = cell.r;
      if (cell.r > maxR) maxR = cell.r;
      if (cell.c < minC) minC = cell.c;
      if (cell.c > maxC) maxC = cell.c;
    }
    return {
      x: minC * this.tile,
      y: minR * this.tile,
      w: (maxC - minC + 1) * this.tile,
      h: (maxR - minR + 1) * this.tile,
    };
  }

  _buildWallLamps() {
    const corners = [
      { r: 1, c: 1, side: "left" },
      { r: 1, c: this.cols - 2, side: "right" },
      { r: this.rows - 2, c: 1, side: "left" },
      { r: this.rows - 2, c: this.cols - 2, side: "right" },
    ];

    return corners.map((lamp, index) => ({
      ...lamp,
      seed: (lamp.r * 17 + lamp.c * 31 + index * 13) * 0.11,
    }));
  }

  _buildFogLayers() {
    return [
      {
        x: this.cols * this.tile * 0.22,
        y: this.rows * this.tile * 0.28,
        radius: this.tile * 3.8,
        alpha: 0.07,
        drift: 0.35,
        speed: 0.32,
      },
      {
        x: this.cols * this.tile * 0.56,
        y: this.rows * this.tile * 0.52,
        radius: this.tile * 4.6,
        alpha: 0.06,
        drift: 0.45,
        speed: 0.24,
      },
      {
        x: this.cols * this.tile * 0.8,
        y: this.rows * this.tile * 0.76,
        radius: this.tile * 3.2,
        alpha: 0.05,
        drift: 0.3,
        speed: 0.4,
      },
    ];
  }

  _syncPlayerPosToCell() {
    this.playerNode = { ...this.playerSpawnNode };
    this.playerCell = this._nodeToCell(this.playerNode);
    const p = this._nodeToPx(this.playerNode);
    this.playerPos.x = p.x;
    this.playerPos.y = p.y;
    this.playerMove.active = false;
    this.playerSprite.direction = "front";
    this.playerSprite.facing = "right";
    this.playerSprite.frame = 0;
    this.playerSprite.timer = 0;
  }

  _makeMino(cell) {
    const node = this._cellToNode(cell);
    const p = this._nodeToPx(node);

    // que el tween dure casi todo el intervalo entre pasos
    const dur = Math.max(0.08, this._minoEvery * 0.8);

    return {
      cell: { ...cell },
      node: { ...node },
      pos: { x: p.x, y: p.y },
      move: {
        active: false,
        t: 0,
        dur,
        fromX: p.x,
        fromY: p.y,
        toX: p.x,
        toY: p.y,
      },
      timer: 0,
      direction: "front",
      facing: "right",
    };
  }

  _centerCameraOnPlayer() {
    const p = this._nodeToPx(this.playerNode);
    this._camTarget = this._camTarget || {
      x: p.x,
      y: p.y,
      width: this.subTile,
      height: this.subTile,
    };
    this._camTarget.x = p.x;
    this._camTarget.y = p.y;
    this.camera.follow(this._camTarget, this.camera.followLerp ?? 1, 0, 0);
    if (this.camera.setDeadZone) this.camera.setDeadZone(0, 0);
  }

  /* ============================ Preguntas ============================ */
  _randInt(a, b) {
    return Math.floor(Math.random() * (b - a + 1)) + a;
  }

  _newQuestion() {
    // Plantillas controladas para resultados manejables
    const x = this._randInt(-5, 5);
    const a = this._randInt(-9, 9);
    const b = this._randInt(2, 4);
    const c = this._randInt(2, 6);
    const d = this._randInt(1, 9);

    const templates = [
      // a + b(c x - d)
      () => ({
        exprStr: `${a} + ${b}(${c}x - ${d})`,
        evalFn: (xv) => a + b * (c * xv - d),
        typicalWrong: (xv) => a + b * c * xv - d,
      }),
      // a + b(c x + d)
      () => ({
        exprStr: `${a} + ${b}(${c}x + ${d})`,
        evalFn: (xv) => a + b * (c * xv + d),
        typicalWrong: (xv) => a + b * c * xv + d,
      }),
      // b(c - d x) + a
      () => ({
        exprStr: `${b}(${c} - ${d}x) + ${a}`,
        evalFn: (xv) => b * (c - d * xv) + a,
        typicalWrong: (xv) => b * c - d * xv + a,
      }),
      // b(d x - c) + a
      () => ({
        exprStr: `${b}(${d}x - ${c}) + ${a}`,
        evalFn: (xv) => b * (d * xv - c) + a,
        typicalWrong: (xv) => b * d * xv - c + a,
      }),
    ];

    for (let tries = 0; tries < 40; tries++) {
      const t = templates[this._randInt(0, templates.length - 1)]();
      const ans = t.evalFn(x);
      if (Number.isInteger(ans) && Math.abs(ans) <= 60) {
        return {
          x,
          exprStr: t.exprStr,
          answer: ans,
          typicalWrong: () => t.typicalWrong(x),
        };
      }
    }

    // fallback
    const exprStr = `3 + 2(5x - 7)`;
    const answer = 3 + 2 * (5 * x - 7);
    return { x, exprStr, answer, typicalWrong: () => 3 + 2 * 5 * x - 7 };
  }

  _buildOptions(answer, typicalWrongFn) {
    const vals = new Set([answer]);

    const wrong1 = typicalWrongFn();
    if (Number.isFinite(wrong1) && wrong1 !== answer) vals.add(wrong1);

    while (vals.size < 4) {
      const delta = this._randInt(1, 8) * (Math.random() < 0.5 ? -1 : 1);
      vals.add(answer + delta);
    }

    const arr = Array.from(vals);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    const letters = ["A", "B", "C", "D"];
    const opt = {};
    let correctLetter = "A";

    for (let i = 0; i < 4; i++) {
      opt[letters[i]] = arr[i];
      if (arr[i] === answer) correctLetter = letters[i];
    }

    return { opt, correctLetter };
  }

  /* ============================ BFS persecución ============================ */
  _buildDistanceMapFromPlayer() {
    const dist = Array.from({ length: this.moveRows }, () =>
      Array(this.moveCols).fill(-1),
    );
    const q = [];
    let head = 0;
    const { r: sr, c: sc } = this.playerNode;
    dist[sr][sc] = 0;
    q.push({ r: sr, c: sc });

    const dirs = [
      { dr: -1, dc: 0 },
      { dr: 1, dc: 0 },
      { dr: 0, dc: -1 },
      { dr: 0, dc: 1 },
    ];

    while (head < q.length) {
      const cur = q[head++];
      const cd = dist[cur.r][cur.c];
      for (const d of dirs) {
        const nr = cur.r + d.dr;
        const nc = cur.c + d.dc;
        if (this._isWallNode(nr, nc)) continue;
        if (dist[nr][nc] !== -1) continue;
        dist[nr][nc] = cd + 1;
        q.push({ r: nr, c: nc });
      }
    }

    return dist;
  }

  _minoStepOne(mino, dist) {
    const { r, c } = mino.node;

    const dirs = [
      { dr: -1, dc: 0 },
      { dr: 1, dc: 0 },
      { dr: 0, dc: -1 },
      { dr: 0, dc: 1 },
    ];

    let best = null;
    let bestD = Infinity;

    for (const d of dirs) {
      const nr = r + d.dr;
      const nc = c + d.dc;

      if (this._isWallNode(nr, nc)) continue;

      const dd = dist[nr]?.[nc];
      if (dd >= 0 && dd < bestD) {
        bestD = dd;
        best = { r: nr, c: nc };
      }
    }

    if (!best) return;

    // actualiza lógica
    this._applyMoveDirection(mino, { dr: best.r - r, dc: best.c - c });
    mino.node = best;
    mino.cell = this._nodeToCell(best);

    // inicia tween visual
    const to = this._nodeToPx(best);
    this._startTween(mino.pos, mino.move, to.x, to.y);
  }

  _spawnExtraMinotaur() {
    if (this.minos.length >= this._minoMaxCount) return false;
    if (this._minoSpawnCooldownTimer > 0) return false;
    this.minos.push(this._makeMino(this.minoSpawn));
    this._minoSpawnCooldownTimer = this._minoSpawnCooldown;
    return true;
  }

  _lerp(a, b, t) {
    return a + (b - a) * t;
  }

  /* ============================ Rondas ============================ */
  _setupRound() {
    this._loadMazeForRound(this.roundIndex);

    // Reset por ronda
    this.exitOpen = false;
    this.revealed = false;
    this.minoActive = false;
    this.minoStartDelay = 0;

    // Pregunta y opciones
    this.question = this._newQuestion();
    const built = this._buildOptions(
      this.question.answer,
      this.question.typicalWrong,
    );
    this.optionValues = built.opt;
    this.correctLetter = built.correctLetter;

    // Posición inicial del jugador
    // Nota: playerCell se toma del lugar donde estaba J en el mapa original,
    // pero como normalizamos letras a "0", aquí simplemente usamos el cell guardado.
    // (Si quieres re-ubicar J en cada ronda, habría que conservar su spawn.)
    this._syncPlayerPosToCell();
    this._moveCooldown = 0;

    // Minotauros
    this._minoEvery = this._minoBaseEvery;
    this._minoSpawnCooldownTimer = 0;
    this.minos = [this._makeMino(this.minoSpawn)];

    // Cámara
    this._centerCameraOnPlayer();

    // Estado
    this.state = "intro";
    this.gameFinished = false;
    this.exitDelay = 0;
  }

  _endRound(winRound, reasonText) {
    this._stopMinoSteps();

    // Actualiza conteos
    if (winRound) this.correctCount++;

    this.state = "round_end";
    this.roundEndTimer = 0.9;
    this.roundEndText =
      reasonText || (winRound ? "¡Ronda superada!" : "Ronda fallida...");

    // Sonido inmediato
    if (winRound) this.playSfx(this.sfxCorrect, { volume: 0.55 });
    else this.playSfx(this.sfxRugido, { volume: 0.6 });

    this.roundIndex++;

    // Si ya acabó la corrida completa, preparar final
    if (this.roundIndex >= this.roundsPerRun) {
      this._finishRun();
    }
  }

  _finishRun() {
    // Determina tier por aciertos
    let tier = 0;
    if (this.correctCount >= this.roundsPerRun) tier = 2;
    else if (this.correctCount >= Math.ceil(this.roundsPerRun * 0.67)) tier = 1;

    let gained = 0;
    if (window.MN_reportMinigameTier) {
      gained = MN_reportMinigameTier("algebra_sustitucion_laberinto", tier);
    }
    this.sheetsReward = gained;

    this.win = this.correctCount >= Math.ceil(this.roundsPerRun * 0.67);

    this.message =
      `Rondas: ${this.correctCount}/${this.roundsPerRun}\n` +
      `Hojas ganadas: ${gained}.`;

    this.state = "finished";
    this.gameFinished = true;
    this.exitDelay = 0.6;

    this.playSfx(this.win ? this.sfxWin : this.sfxRugido, { volume: 0.7 });

    this.game?.events?.emit?.("sustitucion_laberinto_done", {
      win: this.win,
      correct: this.correctCount,
      rounds: this.roundsPerRun,
      tier,
      sheetsReward: gained,
    });
  }

  /* ============================ INPUT HELPERS ============================ */
  _keyDown(k) {
    return !!this.game.input?.keys?.[k];
  }

  _justPressed(k) {
    const now = !!this.game.input?.keys?.[k];
    const prev = !!this._prevKeys[k];
    return now && !prev;
  }

  _loadDirectionalSheets(sprite) {
    if (!sprite?.sheets) return;
    for (const sheet of Object.values(sprite.sheets)) {
      sheet.img = this.game.assets.getImage(sheet.key);
      if (sheet.img) {
        sheet.w = sheet.img.width / sheet.cols;
        sheet.h = sheet.img.height / sheet.rows;
      }
    }
  }

  _getActiveSheet(sprite, direction = sprite?.direction) {
    if (!sprite?.sheets) return null;
    return (
      sprite.sheets[direction] ||
      sprite.sheets.front ||
      Object.values(sprite.sheets).find((sheet) => sheet?.img) ||
      null
    );
  }

  _getActiveFrameRect(sprite, direction = sprite?.direction) {
    const sheet = this._getActiveSheet(sprite, direction);
    if (!sheet?.img || !sheet.cols || !sheet.rows) return null;
    const totalFrames = sheet.cols * sheet.rows;
    const frame = ((sprite.frame % totalFrames) + totalFrames) % totalFrames;
    return {
      img: sheet.img,
      sx: (frame % sheet.cols) * sheet.w,
      sy: Math.floor(frame / sheet.cols) * sheet.h,
      sw: sheet.w,
      sh: sheet.h,
    };
  }

  _setSpriteDirection(sprite, direction, facing = sprite?.facing || "right") {
    if (!sprite) return;
    if (sprite.direction !== direction) {
      sprite.direction = direction;
      sprite.frame = 0;
      sprite.timer = 0;
    }
    sprite.facing = facing;
  }

  _applyMoveDirection(sprite, move) {
    if (!sprite || !move) return;
    if (move.dr < 0) return this._setSpriteDirection(sprite, "back");
    if (move.dr > 0) return this._setSpriteDirection(sprite, "front");
    if (move.dc < 0) return this._setSpriteDirection(sprite, "side", "left");
    if (move.dc > 0) return this._setSpriteDirection(sprite, "side", "right");
  }

  _tickSpriteAnimation(sprite, dt) {
    const sheet = this._getActiveSheet(sprite);
    if (!sheet?.img) return;
    const totalFrames = sheet.cols * sheet.rows;
    if (totalFrames <= 0) return;
    sprite.timer += dt;
    if (sprite.timer >= sprite.speed) {
      sprite.timer = 0;
      sprite.frame = (sprite.frame + 1) % totalFrames;
    }
  }

  _drawAnimatedSprite(ctx, frameRect, dx, dy, dw, dh, facing = "right") {
    if (!frameRect?.img) return;
    if (facing === "right") {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(
        frameRect.img,
        frameRect.sx,
        frameRect.sy,
        frameRect.sw,
        frameRect.sh,
        -dx - dw,
        dy,
        dw,
        dh,
      );
      ctx.restore();
      return;
    }

    ctx.drawImage(
      frameRect.img,
      frameRect.sx,
      frameRect.sy,
      frameRect.sw,
      frameRect.sh,
      dx,
      dy,
      dw,
      dh,
    );
  }

  /* ============================ UPDATE ============================ */
  update(dt) {
    this.visualClock += dt;
    this.spawnFlash = Math.max(0, this.spawnFlash - dt);
    this.exitFlash = Math.max(0, this.exitFlash - dt);
    this.dangerLevel = Math.max(0, this.dangerLevel - dt * 0.6);
    this._minoSpawnCooldownTimer = Math.max(0, this._minoSpawnCooldownTimer - dt);

    const input = this.game.input;
    const keys = input.keys || {};

    // Terminado
    if (this.state === "finished") {
      this.camera.update();
      if (this.exitDelay > 0) {
        this.exitDelay -= dt;
        this._prevKeys = { ...keys };
        return;
      }

      const wantsExit =
        input.isDown("Enter") ||
        input.isDown(" ") ||
        (input.mouse && input.mouse.down);

      if (wantsExit) {
        window.MN_APP?.toOverworld?.();
      }

      this._prevKeys = { ...keys };
      return;
    }

    // Fin de ronda (pausa corta)
    if (this.state === "round_end") {
      this.camera.update();
      this.roundEndTimer -= dt;
      if (this.roundEndTimer <= 0) {
        if (this.roundIndex < this.roundsPerRun) {
          this._setupRound();
        }
      }
      this._prevKeys = { ...keys };
      return;
    }

    // Intro
    if (this.state === "intro") {
      this.camera.update();
      if (this._justPressed("Enter") || this._justPressed(" ")) {
        this.state = "playing";
        this.revealed = true;

        // retardo para que el jugador arranque
        this.minoActive = false;
        this.minoStartDelay = 0.85;
        this._startMinoSteps();
      }
      this._prevKeys = { ...keys };
      return;
    }

    // Playing
    if (this.state === "playing") {
      const distToPlayer = this.minoActive
        ? this._buildDistanceMapFromPlayer()
        : null;
      if (distToPlayer) this.dangerLevel = this._computeDangerLevel(distToPlayer);
      this._updateMinoSteps(distToPlayer);

      // Activación con retardo
      if (!this.minoActive) {
        this.minoStartDelay -= dt;
        if (this.minoStartDelay <= 0) {
          this.minoActive = true;
          for (const m of this.minos) m.timer = 0;
        }
      }

      // =============================
      // Animación sprites (solo visual)
      // =============================
      this._tickSpriteAnimation(this.playerSprite, dt);
      this._tickSpriteAnimation(this.minoSprite, dt);

      // =============================
      // Tweens (suavidad)
      // =============================
      // Player tween
      this._updateTween(this.playerPos, this.playerMove, dt);
      if (this._camTarget) {
        // Sigue la posición interpolada real para evitar sensación de tirón.
        this._camTarget.x = this.playerPos.x;
        this._camTarget.y = this.playerPos.y;
      }

      // Minotauros tween (SIEMPRE, estén activos o no)
      for (const m of this.minos) {
        this._updateTween(m.pos, m.move, dt);
      }

      // =============================
      // Movimiento jugador (suave + buffer)
      // =============================
      const heldMove = this._readMoveHeld();

      // Mientras se mueve, captura intención (buffer)
      if (this.playerMove.active) {
        // Buffer "vivo": si se suelta la tecla, se limpia y evita el paso extra.
        this._moveBuffer = heldMove;
      } else {
        // Solo conserva el buffer si la dirección sigue sostenida al terminar el tween.
        const keepBufferedMove =
          this._moveBuffer &&
          heldMove &&
          this._moveBuffer.dr === heldMove.dr &&
          this._moveBuffer.dc === heldMove.dc
            ? this._moveBuffer
            : null;
        const move = keepBufferedMove || heldMove || this._readMovePressed();
        this._moveBuffer = null;

        if (move) {
          const nr = this.playerNode.r + move.dr;
          const nc = this.playerNode.c + move.dc;

          if (!this._isWallNode(nr, nc)) {
            this._applyMoveDirection(this.playerSprite, move);
            this.playerNode = { r: nr, c: nc };
            this.playerCell = this._nodeToCell(this.playerNode);

            const to = this._nodeToPx(this.playerNode);
            this._startTween(this.playerPos, this.playerMove, to.x, to.y);

            this._checkChoiceOrExit();
          }
        }
      }

      // =============================
      // IA Minotauros (deciden paso SOLO si no están en tween)
      // =============================
      if (this.minoActive) {
        for (const m of this.minos) {
          m.timer += dt;

          // decidir paso solo si ya terminó el tween anterior
          if (!m.move.active && m.timer >= this._minoEvery) {
            m.timer = 0;
            this._minoStepOne(m, distToPlayer); // aquí debes iniciar tween con _startTween
          }
        }
      }

      // =============================
      // Captura (por celda, consistente)
      // =============================
      for (const m of this.minos) {
        if (m.node.r === this.playerNode.r && m.node.c === this.playerNode.c) {
          this.playSfx(this.sfxRugido, { volume: 0.55 });
          this._endRound(false, "¡El Minotauro te alcanzó!");
          break;
        }
      }
      this.camera.update();
    }

    this._prevKeys = { ...keys };
  }

  _readMovePressed() {
    const up =
      this._justPressed("ArrowUp") ||
      this._justPressed("w") ||
      this._justPressed("W");
    const down =
      this._justPressed("ArrowDown") ||
      this._justPressed("s") ||
      this._justPressed("S");
    const left =
      this._justPressed("ArrowLeft") ||
      this._justPressed("a") ||
      this._justPressed("A");
    const right =
      this._justPressed("ArrowRight") ||
      this._justPressed("d") ||
      this._justPressed("D");

    if (up) return { dr: -1, dc: 0 };
    if (down) return { dr: 1, dc: 0 };
    if (left) return { dr: 0, dc: -1 };
    if (right) return { dr: 0, dc: 1 };
    return null;
  }

  _readMoveHeld() {
    const up =
      this._keyDown("ArrowUp") || this._keyDown("w") || this._keyDown("W");
    const down =
      this._keyDown("ArrowDown") || this._keyDown("s") || this._keyDown("S");
    const left =
      this._keyDown("ArrowLeft") || this._keyDown("a") || this._keyDown("A");
    const right =
      this._keyDown("ArrowRight") || this._keyDown("d") || this._keyDown("D");

    if (up) return { dr: -1, dc: 0 };
    if (down) return { dr: 1, dc: 0 };
    if (left) return { dr: 0, dc: -1 };
    if (right) return { dr: 0, dc: 1 };
    return null;
  }

  _checkChoiceOrExit() {
    // Puertas A–D
    for (const letter of ["A", "B", "C", "D"]) {
      const zone = this.choiceZones[letter];
      if (this._isCellInZone(this.playerCell, zone)) {
        if (!this.revealed) return; // por seguridad

        if (letter === this.correctLetter) {
          if (!this.exitOpen) {
            this.exitOpen = true;
            this.exitFlash = 0.9;
            this.playSfx(this.sfxOpen, { volume: 0.55 });
          }
        } else {
          // castigo: spawnea otro minotauro (no aceleramos)
          this.playSfx(this.sfxWrong, { volume: 0.5 });
          const spawned = this._spawnExtraMinotaur();
          this.spawnFlash = 0.45;
          if (spawned) this.playSfx(this.sfxSpawn, { volume: 0.45 });
        }
        return;
      }
    }

    // Salida
    if (this.exitOpen && this._isCellInZone(this.playerCell, this.exitZone)) {
      this._endRound(true, "¡Escapaste del laberinto!");
    }
  }

  _getHorizontalSpriteOffset(sprite, baseWidth) {
    if (!sprite || sprite.direction !== "side") return 0;
    const bias = baseWidth * 0.12;
    return sprite.facing === "left" ? bias : -bias;
  }

  /* ============================ Tween helpers ============================ */
  _startTween(pos, move, toX, toY) {
    move.active = true;
    move.t = 0;
    move.fromX = pos.x;
    move.fromY = pos.y;
    move.toX = toX;
    move.toY = toY;
  }

  _updateTween(pos, move, dt) {
    if (!move.active) return;

    move.t += dt;
    let t = Math.min(1, move.t / move.dur);

    // ease in-out (smoothstep)
    t = t * t * (3 - 2 * t);

    pos.x = move.fromX + (move.toX - move.fromX) * t;
    pos.y = move.fromY + (move.toY - move.fromY) * t;

    if (move.t >= move.dur) {
      move.active = false;
      pos.x = move.toX;
      pos.y = move.toY;
    }
  }

  _computeDangerLevel(dist) {
    let dMin = Infinity;
    for (const m of this.minos) {
      const d = dist[m.node.r]?.[m.node.c];
      if (typeof d === "number" && d >= 0 && d < dMin) dMin = d;
    }
    if (!isFinite(dMin)) return 0;
    const near = 2 * this.mazeScale;
    const far = 12 * this.mazeScale;
    const t = (far - dMin) / (far - near);
    return Math.max(0, Math.min(1, t));
  }

  _drawFloorTile(ctx, x, y, r, c) {
    const hueShift = ((r + c) % 3) * 4;
    const grad = ctx.createLinearGradient(x, y, x + this.tile, y + this.tile);
    grad.addColorStop(0, `hsl(${212 + hueShift} 26% 9%)`);
    grad.addColorStop(1, `hsl(${224 + hueShift} 24% 5%)`);
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, this.tile, this.tile);

    ctx.strokeStyle = "rgba(210, 225, 255, 0.08)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, this.tile - 1, this.tile - 1);

    ctx.fillStyle = "rgba(255,255,255,0.018)";
    ctx.fillRect(x + 2, y + 2, this.tile - 4, Math.max(2, this.tile * 0.08));

    if ((r + c) % 5 === 0) {
      ctx.fillStyle = "rgba(255,255,255,0.02)";
      ctx.fillRect(
        x + this.tile * 0.2,
        y + this.tile * 0.62,
        this.tile * 0.12,
        this.tile * 0.12,
      );
    }
  }

  _drawWallTile(ctx, x, y, r, c) {
    const hueShift = ((r * 7 + c * 3) % 4) * 3;
    const grad = ctx.createLinearGradient(x, y, x + this.tile, y + this.tile);
    grad.addColorStop(0, `hsl(${246 + hueShift} 32% 30%)`);
    grad.addColorStop(0.55, `hsl(${238 + hueShift} 28% 21%)`);
    grad.addColorStop(1, `hsl(${228 + hueShift} 24% 11%)`);
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, this.tile, this.tile);

    ctx.fillStyle = "rgba(255,255,255,0.16)";
    ctx.fillRect(x, y, this.tile, Math.max(4, this.tile * 0.14));
    ctx.fillRect(x, y, Math.max(4, this.tile * 0.12), this.tile);

    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(x + this.tile * 0.82, y, this.tile * 0.18, this.tile);
    ctx.fillRect(x, y + this.tile * 0.82, this.tile, this.tile * 0.18);

    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + this.tile * 0.2, y + this.tile * 0.35);
    ctx.lineTo(x + this.tile * 0.8, y + this.tile * 0.35);
    ctx.moveTo(x + this.tile * 0.28, y + this.tile * 0.64);
    ctx.lineTo(x + this.tile * 0.72, y + this.tile * 0.64);
    ctx.stroke();
  }

  _drawChoiceDoor(ctx, letter, cell) {
    const zone = this.choiceZones[letter];
    const rect = this._getZoneRect(zone, cell);
    if (!rect) return;
    const isNear =
      zone?.some(
        (doorCell) =>
          Math.abs(doorCell.r - this.playerCell.r) +
            Math.abs(doorCell.c - this.playerCell.c) <=
          1,
      ) ?? false;
    const pulse = 0.5 + 0.5 * Math.sin(this.visualClock * 4 + letter.charCodeAt(0));
    const glow = isNear ? 0.22 + 0.18 * pulse : 0.08;
    const x = rect.x;
    const y = rect.y;
    const w = rect.w;
    const h = rect.h;

    ctx.save();
    ctx.shadowColor = `rgba(255, 180, 90, ${glow})`;
    ctx.shadowBlur = this.tile * (isNear ? 0.9 : 0.35);
    const doorGrad = ctx.createLinearGradient(x, y, x, y + h);
    doorGrad.addColorStop(0, "#6c4a2b");
    doorGrad.addColorStop(0.55, "#4a2d1d");
    doorGrad.addColorStop(1, "#27160f");
    ctx.fillStyle = doorGrad;
    ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
    ctx.restore();

    ctx.fillStyle = "rgba(255, 233, 180, 0.20)";
    ctx.fillRect(x + w * 0.14, y + h * 0.12, w * 0.72, Math.max(4, h * 0.12));

    ctx.strokeStyle = "#d4b27a";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);

    ctx.strokeStyle = "rgba(0,0,0,0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.5, y + h * 0.16);
    ctx.lineTo(x + w * 0.5, y + h * 0.84);
    ctx.stroke();

    const label = this.revealed ? String(this.optionValues[letter]) : "?";
    ctx.fillStyle = "#f6ecd4";
    ctx.font = `bold ${Math.floor(Math.min(w, h) * 0.42)}px Georgia`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x + w / 2, y + h * 0.56);

  }

  _drawExitGate(ctx) {
    const rect = this._getZoneRect(this.exitZone, this.exitCell);
    if (!rect) return;
    const pulse = 0.5 + 0.5 * Math.sin(this.visualClock * 5.2);
    const openBoost = this.exitOpen ? 0.35 + pulse * 0.35 + this.exitFlash * 0.6 : 0;

    ctx.save();
    if (this.exitOpen) {
      ctx.shadowColor = `rgba(130, 255, 175, ${0.35 + openBoost * 0.35})`;
      ctx.shadowBlur = this.tile * (1 + openBoost);
    }
    const frameGrad = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    frameGrad.addColorStop(0, this.exitOpen ? "#315f45" : "#403f46");
    frameGrad.addColorStop(1, this.exitOpen ? "#173224" : "#1b1b20");
    ctx.fillStyle = frameGrad;
    ctx.fillRect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2);
    ctx.restore();

    if (this.exitOpen) {
      const gateGrad = ctx.createRadialGradient(
        rect.x + rect.w / 2,
        rect.y + rect.h / 2,
        Math.min(rect.w, rect.h) * 0.15,
        rect.x + rect.w / 2,
        rect.y + rect.h / 2,
        Math.max(rect.w, rect.h) * 0.72,
      );
      gateGrad.addColorStop(0, `rgba(206, 255, 212, ${0.9 - pulse * 0.18})`);
      gateGrad.addColorStop(0.55, `rgba(90, 220, 150, ${0.45 + pulse * 0.15})`);
      gateGrad.addColorStop(1, "rgba(40, 120, 80, 0.05)");
      ctx.fillStyle = gateGrad;
      ctx.fillRect(
        rect.x - rect.w * 0.15,
        rect.y - rect.h * 0.15,
        rect.w * 1.3,
        rect.h * 1.3,
      );
    }

    ctx.strokeStyle = this.exitOpen ? "#b9ffd4" : "#8d8c94";
    ctx.lineWidth = 2;
    ctx.strokeRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);

    ctx.fillStyle = this.exitOpen ? "#ebfff0" : "#a0a0aa";
    ctx.font = `bold ${Math.floor(Math.min(rect.w, rect.h) * 0.52)}px Georgia`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("E", rect.x + rect.w / 2, rect.y + rect.h / 2);
  }

  _drawEntityShadow(
    ctx,
    x,
    y,
    w,
    h,
    alpha = 0.24,
    yFactor = 1.12,
    wFactor = 0.24,
    hFactor = 0.02,
  ) {
    ctx.save();
    ctx.fillStyle = `rgba(0,0,0,${alpha})`;
    ctx.beginPath();
    ctx.ellipse(
      x + w / 2,
      y + h * yFactor,
      w * wFactor,
      h * hFactor,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.restore();
  }

  _drawVignette(ctx, width, height) {
    if (!Number.isFinite(width) || width <= 0)
      width = this.game?.canvas?.width || 1024;
    if (!Number.isFinite(height) || height <= 0)
      height = this.game?.canvas?.height || 576;
    const vignette = ctx.createRadialGradient(
      width * 0.5,
      height * 0.46,
      width * 0.18,
      width * 0.5,
      height * 0.5,
      width * 0.78,
    );
    const dangerBoost = this.dangerLevel * 0.22 + this.spawnFlash * 0.24;
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(0.68, `rgba(7, 10, 16, ${0.12 + dangerBoost * 0.25})`);
    vignette.addColorStop(1, `rgba(4, 5, 10, ${0.5 + dangerBoost})`);
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
  }

  _drawWallLamp(ctx, lamp) {
    const x = lamp.c * this.tile;
    const y = lamp.r * this.tile;
    const pulse = 0.5 + 0.5 * Math.sin(this.visualClock * 3.2 + lamp.seed);
    const glow = 0.18 + pulse * 0.14;
    const mountX =
      x + (lamp.side === "left" ? this.tile * 0.28 : this.tile * 0.72);
    const mountY = y + this.tile * 0.26;

    ctx.save();
    const aura = ctx.createRadialGradient(
      mountX,
      mountY + this.tile * 0.18,
      this.tile * 0.05,
      mountX,
      mountY + this.tile * 0.34,
      this.tile * 1.35,
    );
    aura.addColorStop(0, `rgba(255, 218, 140, ${0.18 + glow * 0.6})`);
    aura.addColorStop(0.45, `rgba(255, 152, 70, ${0.1 + glow * 0.35})`);
    aura.addColorStop(1, "rgba(255, 120, 40, 0)");
    ctx.fillStyle = aura;
    ctx.fillRect(
      x - this.tile * 0.7,
      y - this.tile * 0.2,
      this.tile * 2.4,
      this.tile * 2.2,
    );

    ctx.fillStyle = "rgba(28, 19, 14, 0.85)";
    ctx.fillRect(
      mountX - this.tile * 0.04,
      mountY - this.tile * 0.1,
      this.tile * 0.08,
      this.tile * 0.26,
    );
    ctx.fillRect(
      mountX - this.tile * 0.14,
      mountY - this.tile * 0.02,
      this.tile * 0.28,
      this.tile * 0.05,
    );

    const flame = ctx.createLinearGradient(
      mountX,
      mountY,
      mountX,
      mountY + this.tile * 0.34,
    );
    flame.addColorStop(0, "#fff4c4");
    flame.addColorStop(0.35, "#ffd36a");
    flame.addColorStop(1, "#d35a1f");
    ctx.fillStyle = flame;
    ctx.beginPath();
    ctx.moveTo(mountX, mountY);
    ctx.quadraticCurveTo(
      mountX + this.tile * 0.12 * Math.sin(this.visualClock * 7 + lamp.seed),
      mountY + this.tile * 0.12,
      mountX,
      mountY + this.tile * 0.3,
    );
    ctx.quadraticCurveTo(
      mountX - this.tile * 0.12,
      mountY + this.tile * 0.14,
      mountX,
      mountY,
    );
    ctx.fill();
    ctx.restore();
  }

  _drawFog(ctx) {
    if (!this.fogLayers?.length) return;

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (const fog of this.fogLayers) {
      const driftX = Math.sin(this.visualClock * fog.speed) * this.tile * fog.drift;
      const driftY =
        Math.cos(this.visualClock * (fog.speed * 0.7)) * this.tile * (fog.drift * 0.45);
      const grad = ctx.createRadialGradient(
        fog.x + driftX,
        fog.y + driftY,
        fog.radius * 0.15,
        fog.x + driftX,
        fog.y + driftY,
        fog.radius,
      );
      grad.addColorStop(0, `rgba(180, 215, 235, ${fog.alpha})`);
      grad.addColorStop(0.5, `rgba(120, 145, 170, ${fog.alpha * 0.52})`);
      grad.addColorStop(1, "rgba(70, 90, 110, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(
        fog.x + driftX - fog.radius,
        fog.y + driftY - fog.radius,
        fog.radius * 2,
        fog.radius * 2,
      );
    }

    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = `rgba(120, 145, 165, ${0.03 + this.dangerLevel * 0.015})`;
    ctx.fillRect(0, 0, this.cols * this.tile, this.rows * this.tile);
    ctx.restore();
  }

  _drawProgressPips(ctx, x, y) {
    for (let i = 0; i < this.roundsPerRun; i++) {
      const done = i < this.correctCount;
      const active = i === Math.min(this.roundIndex, this.roundsPerRun - 1);
      ctx.beginPath();
      ctx.arc(x + i * 18, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = done ? "#b8ffbf" : active ? "#ffdd9a" : "#5e6775";
      ctx.fill();
      if (active && !done) {
        ctx.strokeStyle = "#fff1bf";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
  }

  _drawPanel(ctx, x, y, w, h, accent = "#d0c08a") {
    ctx.save();
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, "rgba(24, 28, 38, 0.93)");
    grad.addColorStop(1, "rgba(10, 12, 18, 0.93)");
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    ctx.strokeStyle = "rgba(255,255,255,0.07)";
    ctx.strokeRect(x + 6, y + 6, w - 12, h - 12);
    ctx.restore();
  }

  /* ============================ DRAW ============================ */
  draw(ctx) {
    // Fondo
    ctx.save();
    if (this.bgImage) {
      // si tienes un bg, lo estiras al mundo
      ctx.drawImage(
        this.bgImage,
        0,
        0,
        this.cols * this.tile,
        this.rows * this.tile,
      );
    } else {
      ctx.fillStyle = "#0b0b10";
      ctx.fillRect(0, 0, this.cols * this.tile, this.rows * this.tile);
    }
    ctx.restore();

    // Laberinto
    if (this.grid) {
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          const v = this.grid[r][c];
          const x = c * this.tile;
          const y = r * this.tile;

          if (v === "1") this._drawWallTile(ctx, x, y, r, c);
          else this._drawFloorTile(ctx, x, y, r, c);
        }
      }

      // Puertas A–D
      for (const letter of ["A", "B", "C", "D"]) {
        const cell = this.choices[letter];
        if (!cell) continue;
        this._drawChoiceDoor(ctx, letter, cell);
      }

      for (const lamp of this.wallLamps) {
        this._drawWallLamp(ctx, lamp);
      }

      // Salida E
      ctx.save();
      this._drawExitGate(ctx);
      ctx.restore();

      // Jugador (placeholder)
      const ps = this.playerSprite;
      const playerFrame = this._getActiveFrameRect(ps);
      if (playerFrame) {
        const playerWidth = this.tile * 0.68;
        const playerHeight = this.tile * 0.74;
        const playerOffsetX = this._getHorizontalSpriteOffset(ps, playerWidth);
        const playerDrawX = Math.round(this.playerPos.x - playerWidth * 0.5);
        const playerDrawY = Math.round(this.playerPos.y - playerHeight * 0.72);
        this._drawEntityShadow(
          ctx,
          this.playerPos.x - this.tile * 0.18,
          this.playerPos.y + this.tile * 0.08,
          this.tile * 0.36,
          this.tile * 0.16,
          0.14,
          1.08,
          0.3,
          0.018,
        );

        this._drawAnimatedSprite(
          ctx,
          playerFrame,
          playerDrawX + playerOffsetX,
          playerDrawY,
          playerWidth,
          playerHeight,
          ps.facing,
        );
      }

      const ms = this.minoSprite;
      for (const m of this.minos) {
        const minoFrame = this._getActiveFrameRect(ms, m.direction);
        if (!minoFrame) continue;
        const minoWidth = this.tile * 0.88;
        const minoHeight = this.tile * 1.02;
        const minoOffsetX = this._getHorizontalSpriteOffset(m, minoWidth);
        const minoDrawX = Math.round(m.pos.x - minoWidth * 0.5);
        const minoDrawY = Math.round(m.pos.y - minoHeight * 0.7);
        const menace = 0.14 + this.dangerLevel * 0.28 + this.spawnFlash * 0.35;
        this._drawEntityShadow(
          ctx,
          m.pos.x - this.tile * 0.2,
          m.pos.y + this.tile * 0.04,
          this.tile * 0.4,
          this.tile * 0.2,
          0.28,
          0.98,
          0.22,
          0.016,
        );
        ctx.save();
        ctx.shadowColor = `rgba(200, 70, 60, ${menace})`;
        ctx.shadowBlur =
          this.tile * (0.25 + this.dangerLevel * 0.8 + this.spawnFlash * 0.8);

        this._drawAnimatedSprite(
          ctx,
          minoFrame,
          minoDrawX + minoOffsetX,
          minoDrawY,
          minoWidth,
          minoHeight,
          m.facing,
        );
        ctx.restore();
      }

      this._drawFog(ctx);
    }

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    this._drawVignette(ctx, this.game.canvas.width, this.game.canvas.height);
    this._drawHUD(ctx);
    ctx.restore();
  }

  _drawHUD(ctx) {
    const W = this.game?.canvas?.width || 960;
    const roundText = `Ronda ${Math.min(this.roundIndex + 1, this.roundsPerRun)}/${this.roundsPerRun}`;
    const panelX = 36;
    const panelY = 10;
    const panelW = Math.min(760, W - panelX * 2 - 70);
    this._drawPanel(ctx, panelX, panelY, panelW, 42, "#d4c08c");
    ctx.save();
    ctx.fillStyle = "#e8edf6";
    ctx.font = "bold 20px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const textX = panelX + 16;
    const textY = panelY + 22;
    const roundX = panelX + panelW - 112;
    const pipsX = panelX + panelW - 74;

    if (this.revealed && this.question && this.showQuestion) {
      ctx.fillText(
        `${this.question.exprStr}   con x = ${this.question.x}`,
        textX,
        textY,
      );
    } else {
      ctx.fillText(`${roundText}`, textX, textY);
    }
    ctx.fillStyle = "#d7deea";
    ctx.font = "bold 15px Georgia";
    ctx.textAlign = "right";
    ctx.fillText(roundText, roundX, textY);
    this._drawProgressPips(ctx, pipsX, panelY + 19);
    ctx.textAlign = "left";
    ctx.restore();

    // Intro overlay
    if (this.state === "intro") {
      ctx.save();
      this._drawPanel(ctx, 190, 202, 640, 205, "#e1c487");
      ctx.fillStyle = "#fff3d8";
      ctx.font = "bold 28px Georgia";
      ctx.textAlign = "center";
      ctx.fillText("El laberinto del Minotauro", 510, 246);
      ctx.fillStyle = "#e5edf7";
      ctx.font = "18px Georgia";
      ctx.fillText(
        "Sustituye y evalúa mientras escapas del Minotauro.",
        510,
        288,
      );
      ctx.fillText(
        "Elige la puerta con el resultado correcto para abrir la salida E.",
        510,
        318,
      );
      ctx.fillStyle = "#9fb5c8";
      ctx.font = "16px Georgia";
      ctx.fillText("Si eliges mal, aparecera otro minotauro.", 510, 348);
      ctx.fillStyle = "#c8ffcf";
      ctx.font = "bold 22px Georgia";
      ctx.fillText("Presiona ENTER para comenzar", 510, 382);
      ctx.textAlign = "left";
      ctx.restore();
    }

    // Round end overlay
    if (this.state === "round_end") {
      ctx.save();
      this._drawPanel(
        ctx,
        254,
        228,
        512,
        162,
        this.roundEndText?.includes("Escapaste") ? "#b7efba" : "#ef9d93",
      );
      ctx.fillStyle = "#f6efe0";
      ctx.font = "bold 26px Georgia";
      ctx.textAlign = "center";
      ctx.fillText(this.roundEndText || "", 510, 294);
      ctx.font = "17px Georgia";
      ctx.fillStyle = "#cfd7e2";
      ctx.fillText(
        `Aciertos: ${this.correctCount}/${this.roundsPerRun}`,
        510,
        334,
      );
      this._drawProgressPips(ctx, 493, 358);
      ctx.textAlign = "left";
      ctx.restore();
    }

    // Finished overlay
    if (this.state === "finished") {
      ctx.save();
      this._drawPanel(
        ctx,
        244,
        202,
        532,
        228,
        this.win ? "#b9ffb9" : "#ffb0b0",
      );

      ctx.fillStyle = this.win ? "#b9ffb9" : "#ffb0b0";
      ctx.font = "bold 30px Georgia";
      ctx.textAlign = "center";
      ctx.fillText(this.win ? "COMPLETADO" : "NO COMPLETADO", 510, 252);

      ctx.fillStyle = "#eef3fb";
      ctx.font = "17px Georgia";
      const lines = (this.message || "").split("\n");
      let y = 300;
      for (const line of lines) {
        ctx.fillText(line, 510, y);
        y += 22;
      }

      this._drawProgressPips(ctx, 493, 352);
      ctx.fillStyle = "#cbd2db";
      ctx.font = "16px Georgia";
      ctx.fillText("Enter o Espacio para volver", 510, 398);
      ctx.textAlign = "left";
      ctx.restore();
    }
  }

  _startMinoSteps() {
    const base =
      this.game.assets.getSound?.("sfx_steps") ||
      this.game.assets.sounds?.["sfx_steps"];
    if (!base) return;

    // instancia persistente
    this._minoSteps = base.cloneNode();
    this._minoSteps.loop = true;
    this._minoSteps.currentTime = 0;
    this._minoSteps.volume = 0;
    this._minoSteps.play().catch(() => {});
  }

  _stopMinoSteps() {
    if (!this._minoSteps) return;
    try {
      this._minoSteps.pause();
      this._minoSteps.currentTime = 0;
    } catch {}
    this._minoSteps = null;
  }

  _updateMinoSteps(dist) {
    if (!this._minoSteps) return;

    // si no está activo el minotauro o no estamos jugando, silencio
    if (this.state !== "playing" || !this.minoActive || !this.minos?.length) {
      this._minoSteps.volume = 0;
      return;
    }

    // Dist-map se calcula una sola vez en update y se inyecta aquí.
    if (!dist) {
      this._minoSteps.volume = 0;
      return;
    }

    let dMin = Infinity;
    for (const m of this.minos) {
      const d = dist[m.node.r]?.[m.node.c];
      if (typeof d === "number" && d >= 0 && d < dMin) dMin = d;
    }
    if (!isFinite(dMin)) {
      this._minoSteps.volume = 0;
      return;
    }

    // mapeo distancia -> volumen
    const dNear = 1 * this.mazeScale; // muy cerca
    const dFar = 14 * this.mazeScale; // lejos
    let t = (dFar - dMin) / (dFar - dNear); // 1 cerca, 0 lejos
    t = Math.max(0, Math.min(1, t));

    // volumen final
    const master = this.game.assets?.masterVolume ?? 1;
    this._minoSteps.volume = (0.03 + 0.6 * t) * master;

    // opcional: pasos un poco “más tensos” cuando está cerca
    this._minoSteps.playbackRate = 0.95 + 0.25 * t;
  }
}

window.SustituirYEvaluarScene = SustituirYEvaluarScene;
