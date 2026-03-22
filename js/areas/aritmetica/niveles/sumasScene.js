/**  *********************************************************************
 *  SumasScene.js - Version mejorada visualmente (Quick-Wins)
 *  - Fondo con coherencia
 *  - HUD en caja
 *  - Panel con estilo
 *  - Agua con gradiente y ondas
 *  - Preparado para sprite del jugador en la escalera
 *  ********************************************************************* */

class SumasScene extends Scene {
  constructor(game, options = {}) {
    super(game);

    /* ---------------- SXISTS TODO LO ANTSRIOR ---------------- */
    /* NO BORRO NADA DE LA LOGICA, SOLO AGREGO COSAS VISUALES   */

    this.mode = options.mode || "timed";

    this.nivelActual = 1;
    this.totalNiveles = 10;
    this.racha = 0;
    this.rachaObjetivo = 5;
    this.erroresNivel = 0;
    this.erroresMaximos = 3;
    this.nivelMaximoAlcanzado = 1;

    this.preguntaActual = null;
    this.entradaActual = "";
    this.ultimoResultadoCorrecto = null;
    this.ultimoResultadoIncorrecto = null;
    this.ultimaRazonSrror = "";

    this.tiempoGlobalPorNivel = 45;
    this.tiempoGlobalRestante = this.tiempoGlobalPorNivel;
    this.totalDrownTime = this.tiempoGlobalPorNivel * this.totalNiveles;
    this.elapsedWaterTime = 0;

    this._prevKeys = {};
    this.stateMachine = null;

    this.bgImage = null;

    this.gameFinished = false;
    this.exitDelay = 0;
    this.sheetsReward = 0;
    this.message = "";

    /* ------------------ NUSVO: ANIMACIONSS -------------------- */
    this.levelUpAnim = 0; // 0 a 1
    this.prevStep = 0;

    /* ------------------ NUSVO: OLAS Y BURBUJAS ---------------- */
    this.time = 0;
    this.drownAnimTime = 0;

    this.npcPortraitKey = "npc_guardian_sumas";
    this.npcName = "Guardian";

    /* ------------------ HINTS --------------------------------- */
    this.tipsPorNivel = {
      1: "Empieza desde el número mayor y cuenta los pasos del menor.",
      2: "Saber que unos números se complementan para formar decenas es muy útil.",
      3: "Al sumar, los números se pueden agrupar de distintas formas: 13+9 = 19+3",
      4: "Sumar múltiplos de 10 es muy fácil, verdad?",
      5: "Sumar de a 5 es muy útil, son todos los dedos de una mano.",
      6: "A 6 lo puedes ver como 5+1, es una suma de a 5 pero con ajuste.",
      7: "A 9 lo puedes ver como 10-1, es una suma de a 10 pero con ajuste hacia atras.",
      8: "Separar decenas y unidades, tambien facilita los calculos.",
      9: "Hay muchas formas de sumar, usa la que prefieras, siempre y cuando lo hagas bien.",
      10: "Cuando son muchos números, agrupa números para formar decenas.",
    };
  }

  /* ============================================================
   *            INIT - SELECCION DE FONDO CONSISTENTE
   * ============================================================ */
  init() {
    if (window.MN_setLeafHUDVisible) window.MN_setLeafHUDVisible(false);    
    if (window.MN_setInputMode) MN_setInputMode("keyboard");
    this.gameFinished = false;
    this.exitDelay = 0;

    /* ------------------ FONDO ESTILO JERARQUIA ---------------- */
    const A = this.game.assets;
    this.bgImage = A.getImage("mn_bg_sumas");

    this._reiniciarEscalera();

    if (this.camera && this.game.canvas) {
      this.camera.x = 0;
      this.camera.y = 0;
      this.camera.setBounds(
        0,
        0,
        this.game.canvas.width,
        this.game.canvas.height
      );
    }

    this.stateMachine = new StateMachine({
      initial: "intro",
      states: {
        intro: { onEnter: () => {} },
        playing: {
          onEnter: () => {
            this._empezarNivel(1);
          },
        },
        success: {
          onEnter: () => {
            this._finishGame(false);
          },
        },
        gameover: {
          onEnter: () => {
            this._finishGame(true);
          },
        },
      },
    });
  }

  /* ============================================================
   *                        UPDATS
   * ============================================================ */
  update(dt) {
    super.update(dt);

    this.time += dt;

    const input = this.game.input;

    // Si ya termino el minijuego, solo esperamos a salir
    if (this.gameFinished) {
      if (this.exitDelay > 0) {
        this.exitDelay -= dt;
        return;
      }
      const wantsExit =
        input.isDown("Enter") ||
        input.isDown(" ") ||
        (input.mouse && input.mouse.down);

      if (wantsExit) {
        window.MN_APP?.toOverworld?.();
      }

      return;
    }

    const currentKeys = input.keys || {};
    const isJustPressed = (key) => currentKeys[key] && !this._prevKeys[key];
    const estado = this.stateMachine.current;

    // ------------------------------------------------------------------
    // INTRO
    // ------------------------------------------------------------------
    if (estado === "intro") {
      if (isJustPressed("Enter") || isJustPressed(" ")) {
        this.stateMachine.transition("playing");        
      }
    }

    // ------------------------------------------------------------------
    // PLAYING
    // ------------------------------------------------------------------
    else if (estado === "playing") {
      // Tiempo global (modo timed)
      if (this.mode === "timed" && this.tiempoGlobalRestante > 0) {
        this.tiempoGlobalRestante -= dt;

        if (this.tiempoGlobalRestante <= 10 && this.tiempoGlobalRestante > 9) {
          this._playSound("sumas_warning");
        }

        if (this.tiempoGlobalRestante <= 0) {
          this.tiempoGlobalRestante = 0;
          this.ultimaRazonSrror = "timeout_global";
          this.nivelMaximoAlcanzado = Math.max(
            this.nivelMaximoAlcanzado,
            this.nivelActual
          );
          this.stateMachine.transition("gameover");
        }
      }
      this.elapsedWaterTime += dt;

      const inDrownWarning =
        this.mode === "timed" &&
        this.tiempoGlobalRestante > 0 &&
        this.tiempoGlobalRestante <= 10;
      if (inDrownWarning) this.drownAnimTime += dt;
      else this.drownAnimTime = 0;

      // Entrada numerica
      for (let d = 0; d <= 9; d++) {
        const key = String(d);
        if (isJustPressed(key)) {
          if (this.entradaActual.length < 3) {
            this.entradaActual += key;
          }
        }
      }

      // Borrar ultimo digito
      if (isJustPressed("Backspace")) {
        this.entradaActual = this.entradaActual.slice(0, -1);
      }

      // Confirmar respuesta
      if (isJustPressed("Enter")) {
        if (this.entradaActual.trim() !== "") {
          const valor = parseInt(this.entradaActual, 10);
          if (!Number.isNaN(valor)) {
            this._verificarRespuesta(valor);
          }
          this.entradaActual = "";
        }
      }

      // ESC: salir al overworld
      if (isJustPressed("Escape")) {
        window.MN_APP?.toOverworld?.();
      }
    }

    // ------------------------------------------------------------------
    // SUCCESS / GAMEOVER
    // (la salida la maneja gameFinished arriba)
    // ------------------------------------------------------------------
    else if (estado === "success" || estado === "gameover") {
      if (isJustPressed("Enter") || isJustPressed(" ")) {
        // Volver a empezar el reto
        this._reiniciarEscalera();
        this.stateMachine.transition("intro");
      }
    }

    // Animacion de subir escalon
    if (this.levelUpAnim > 0) {
      this.levelUpAnim -= dt * 3;
      if (this.levelUpAnim < 0) this.levelUpAnim = 0;
    }

    this._prevKeys = { ...currentKeys };
  }

  /* ============================================================
   *                        DRAW
   * ============================================================ */
  draw(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    /* ------------------ FONDO ------------------ */
    if (this.bgImage) {
      const img = this.bgImage;
      const scale = Math.max(W / img.width, H / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
    } else {
      ctx.fillStyle = "#0a0a1a";
      ctx.fillRect(0, 0, W, H);
    }

    /* Capa oscura */
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, W, H);

    /* HUD bonito */
    this._drawHUDBox(ctx);

    /* Agua + escalera */
    this._dibujarInundacionBonita(ctx);
    this._dibujarNPC(ctx);

    /* Panel y estado */
    const st = this.stateMachine.current;
    if (st === "intro") this._dibujarIntro(ctx);
    else if (st === "playing") this._dibujarPreguntaPanel(ctx);
    else this._dibujarFin(ctx, st === "success");
  }

  /* ============================================================
   *               HUD CON CAJA Y MARCO (ESTILO JERARQUIA)
   * ============================================================ */
  _drawHUDBox(ctx) {
    const W = this.game.canvas.width;

    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(15, 15, 260, 110);

    ctx.strokeStyle = "#66ccff";
    ctx.lineWidth = 2;
    ctx.strokeRect(15, 15, 260, 110);

    ctx.fillStyle = "#fff";
    ctx.font = "17px Arial";

    ctx.textAlign = "left";
    ctx.fillText(`Nivel: ${this.nivelActual}/${this.totalNiveles}`, 25, 35);
    ctx.fillText(`Racha: ${this.racha}/5`, 25, 60);
    ctx.fillText(`Errores: ${this.erroresNivel}/3`, 25, 85);

    if (this.mode === "timed") {
      const t = Math.max(0, Math.floor(this.tiempoGlobalRestante));
      const m = Math.floor(t / 60);
      const s = t % 60;
      ctx.fillStyle = t <= 15 ? "#ff8080" : "#ffffff";
      ctx.fillText(`Tiempo: ${m}:${s.toString().padStart(2, "0")}`, 25, 110);
    }
  }

  _dibujarNPC(ctx) {
    const { width, height } = this.game.canvas;
    const tip = this.tipsPorNivel[this.nivelActual];

    const boxWidth = Math.min(420, width * 0.6);
    const boxHeight = 110;
    const boxX = 30;
    const boxY = height - boxHeight - 30;

    // Fondo del cuadro de dialogo
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    ctx.strokeStyle = "#66ccff";
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

    // Retrato
    const portraitSize = boxHeight - 20;
    const portraitX = boxX + 10;
    const portraitY = boxY + 10;

    const portrait = this.game.assets.getImage(this.npcPortraitKey);
    if (portrait) {
      ctx.drawImage(portrait, portraitX, portraitY, portraitSize, portraitSize);
    } else {
      // Fallback simple
      ctx.fillStyle = "#444";
      ctx.fillRect(portraitX, portraitY, portraitSize, portraitSize);
      ctx.fillStyle = "#fff";
      ctx.font = "14px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        "NPC",
        portraitX + portraitSize / 2,
        portraitY + portraitSize / 2
      );
    }

    // Nombre + tip
    const textX = portraitX + portraitSize + 10;
    const textY = boxY + 24;

    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    ctx.fillStyle = "#ffcc66";
    ctx.font = "16px sans-serif";
    ctx.fillText(this.npcName, textX, textY);

    if (tip) {
      ctx.fillStyle = "#dde5ff";
      ctx.font = "14px sans-serif";

      // Partir el tip en 2 lineas maximo (wrap sencillo)
      const maxWidth = boxWidth - (textX - boxX) - 15;
      const words = tip.split(" ");
      let line = "";
      let lineY = textY + 22;

      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + " ";
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && i > 0) {
          ctx.fillText(line, textX, lineY);
          line = words[i] + " ";
          lineY += 18;
        } else {
          line = testLine;
        }
      }
      if (line.trim() !== "") {
        ctx.fillText(line, textX, lineY);
      }
    }
  }

  /* ============================================================
   *                    PANEL BONITO DE PREGUNTA
   * ============================================================ */
  _dibujarPreguntaPanel(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;
    const panelW = Math.min(700, W * 0.45);
    const panelH = 200;
    const X = (W - panelW) / 2;
    const Y = H * 0.38;

    /* Fondo con gradiente */
    const grad = ctx.createLinearGradient(0, Y, 0, Y + panelH);
    grad.addColorStop(0, "rgba(30,40,80,0.95)");
    grad.addColorStop(1, "rgba(15,20,50,0.95)");
    ctx.fillStyle = grad;
    ctx.fillRect(X, Y, panelW, panelH);

    ctx.strokeStyle = "#66ccff";
    ctx.lineWidth = 2;
    ctx.strokeRect(X, Y, panelW, panelH);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    /* Titulo del nivel */
    ctx.font = "20px Arial";
    ctx.fillStyle = "#ffcc66";
    ctx.fillText(`Nivel ${this.nivelActual}`, W / 2, Y + 25);

    /* Pregunta */
    ctx.fillStyle = "#ffffff";
    ctx.font = "36px Arial";
    const txt = this.preguntaActual ? this.preguntaActual.texto : "...";
    ctx.fillText(txt, W / 2, Y + 80);

    /* Entrada */
    ctx.font = "32px monospace";
    ctx.fillStyle = "#ffffaa";
    ctx.fillText(
      this.entradaActual === "" ? "..." : this.entradaActual,
      W / 2,
      Y + 140
    );
  }

  /* ============================================================
   *                     FIN - MISMO ESTILO
   * ============================================================ */
  _dibujarFin(ctx, exito) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font = "38px Arial";
    ctx.fillStyle = exito ? "#aaffaa" : "#ffaaaa";
    ctx.fillText(
      exito ? "Escapaste de la inundacion!" : "Te alcanzo el agua...",
      W / 2,
      H * 0.3
    );

    ctx.fillStyle = "#ffffff";
    ctx.font = "22px Arial";
    ctx.fillText(
      `Nivel maximo: ${this.nivelMaximoAlcanzado}/10`,
      W / 2,
      H * 0.4
    );
    ctx.fillText(`Hojas ganadas: ${this.sheetsReward}`, W / 2, H * 0.47);

    ctx.font = "18px Arial";
    ctx.fillText("Pulsa ENTER/ESPACIO para regresar", W / 2, H * 0.56);
  }

  /* ============================================================
   *           AGUA BONITA: DEGRADADO + OLAS ANIMADAS
   * ============================================================ */
  _dibujarInundacionBonita(ctx) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    let ratio = 0;
    if (this.mode === "timed") {
      const maxT = this.totalDrownTime; // 600 s
      const t = Math.min(this.elapsedWaterTime, maxT);
      ratio = t / maxT; // 0 -> 1. Con ratio=0.3, el agua cubre hasta el nivel 3
    }
    const top = H - ratio * (H * 0.9);

    /* Agua gradiente */
    const g = ctx.createLinearGradient(0, top, 0, H);
    g.addColorStop(0, "rgba(80,120,220,0.65)");
    g.addColorStop(1, "rgba(20,40,120,0.9)");
    ctx.fillStyle = g;
    ctx.fillRect(0, top, W, H - top);

    /* Olas */
    ctx.beginPath();
    for (let x = 0; x <= W; x += 20) {
      const y = top + Math.sin(x / 35 + this.time * 3) * 3;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = "rgba(220,240,255,0.9)";
    ctx.lineWidth = 2;
    ctx.stroke();

    /* Escalera + Nico */
    this._dibujarEscaleraConNico(ctx, top);
  }

  /* ============================================================
   *        ESCALERA VISUAL + ANIMACION + SPRITE DEL NINO
   * ============================================================ */
  _dibujarEscaleraConNico(ctx, aguaTop) {
    const W = this.game.canvas.width;
    const H = this.game.canvas.height;

    const X = W - 100;
    const Y = H * 0.1;
    const Wd = 70;
    const Hd = H * 0.9;
    const steps = this.totalNiveles;

    /* Madera oscura */
    ctx.fillStyle = "rgba(60, 40, 30, 0.7)";
    ctx.fillRect(X, Y, Wd, Hd);
    ctx.strokeStyle = "#000";
    ctx.strokeRect(X, Y, Wd, Hd);

    const sh = Hd / steps;

    /* Lineas de escalon */
    ctx.strokeStyle = "#aa8855";
    ctx.lineWidth = 2;
    for (let i = 0; i <= steps; i++) {
      const lineY = Y + Hd - i * sh;
      ctx.beginPath();
      ctx.moveTo(X, lineY);
      ctx.lineTo(X + Wd, lineY);
      ctx.stroke();
    }

    /* Posicion del personaje */
    let idx = this.nivelActual - 1;
    let prev = this.prevStep;
    let f = this.levelUpAnim > 0 ? 1 - this.levelUpAnim : 1;

    const stepCurrent = Y + Hd - (idx + 1) * sh + sh * 0.1;
    const stepPrev = Y + Hd - (prev + 1) * sh + sh * 0.1;
    const Yinterp = stepPrev + (stepCurrent - stepPrev) * f;

    const avatarH = sh * 0.9;
    const avatarW = Wd * 0.6;
    const avatarX = X + (Wd - avatarW) / 2;

    /* Sprite del jugador */
    const inDrownWarning =
      this.mode === "timed" &&
      this.tiempoGlobalRestante > 0 &&
      this.tiempoGlobalRestante <= 10;
    const inPreDrownJump =
      this.mode === "timed" &&
      this.tiempoGlobalRestante > 10 &&
      this.tiempoGlobalRestante <= 15;
    const drownSprite = this.game.assets.getImage("player_ahogado");
    let drawY = Yinterp;

    if (inPreDrownJump) {
      const jumpWave = Math.max(0, Math.sin(this.time * 12));
      const jumpAmp = Math.max(3, sh * 0.18);
      drawY -= jumpWave * jumpAmp;
    }

    if (drownSprite) {
      const cols = 8;
      const frameW = Math.floor(drownSprite.width / cols);
      const frameH = drownSprite.height;
      const fps = 10;
      let frame = 0;
      if (inDrownWarning) {
        // En peligro: animar solo 1..7 y reservar 0 como pose normal.
        frame = 1 + (Math.floor(this.drownAnimTime * fps) % (cols - 1));
      }
      const sx = frame * frameW;
      ctx.drawImage(
        drownSprite,
        sx,
        0,
        frameW,
        frameH,
        avatarX,
        drawY,
        avatarW,
        avatarH
      );
    } else {
      /* Fallback */
      ctx.fillStyle = "#ffffaa";
      ctx.fillRect(avatarX, drawY, avatarW, avatarH);
    }
  }

  destroy() {
    this.clearAll();
  }

  /* --------------------------------------------------------------------- */
  /*  DIBUJO: Intro, HUD, Pregunta, Fin, Inundacion                        */
  /* --------------------------------------------------------------------- */

  _dibujarIntro(ctx) {
    const { width, height } = this.game.canvas;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.font = "36px sans-serif";
    ctx.fillText("Escalera de Sumas", width / 2, height * 0.25);

    ctx.font = "20px sans-serif";
    ctx.fillText(
      "Sube los 10 niveles de sumas mentales, antes que el agua te alcance.",
      width / 2,
      height * 0.4
    );
    ctx.fillText(
      "Cada nivel: 5 aciertos seguidos, máximo 3 errores.",
      width / 2,
      height * 0.46
    );
    ctx.font = "18px sans-serif";
    ctx.fillText(
      "Usa las teclas numéricas para responder.",
      width / 2,
      height * 0.64
    );
    ctx.fillText(
      "Pulsa ENTER o ESPACIO para comenzar.",
      width / 2,
      height * 0.7
    );    
  }

  /* --------------------------------------------------------------------- */
  /*  LOGICA DEL JUEGO                                                     */
  /* --------------------------------------------------------------------- */

  _reiniciarEscalera() {
    this.nivelActual = 1;
    this.nivelMaximoAlcanzado = 1;
    this.racha = 0;
    this.erroresNivel = 0;
    this.preguntaActual = null;
    this.entradaActual = "";
    this.ultimoResultadoCorrecto = null;
    this.ultimoResultadoIncorrecto = null;
    this.ultimaRazonSrror = "";
    if (this.mode === "timed") {
      this.tiempoGlobalRestante = this.tiempoGlobalPorNivel;
      this.elapsedWaterTime = 0;
    }
    this.drownAnimTime = 0;
  }

  _empezarNivel(nivel) {
    // Nuevo: preparar animacion de cambio de escalon
    this.prevStep = this.nivelActual - 1;
    if (this.prevStep < 0) this.prevStep = 0;
    this.levelUpAnim = 1;

    this.nivelActual = nivel;
    this.racha = 0;
    this.erroresNivel = 0;
    this.ultimoResultadoCorrecto = null;
    this.ultimoResultadoIncorrecto = null;
    this.ultimaRazonSrror = "";

    // Tiempo global acumulativo en modo "timed"
    if (this.mode === "timed") {
      if (nivel > 1) {
        // Subes un peldano: ganas otros 60 s
        this.tiempoGlobalRestante += this.tiempoGlobalPorNivel;
        this._playSound("sfx_match");
      }
    }

    this._generarPregunta();
  }

  _generarPregunta() {
    const nivel = this.nivelActual;
    let pregunta = null;

    switch (nivel) {
      case 1:
        pregunta = this._genNivel1();
        break;
      case 2:
        pregunta = this._genNivel2();
        break;
      case 3:
        pregunta = this._genNivel3();
        break;
      case 4:
        pregunta = this._genNivel4();
        break;
      case 5:
        pregunta = this._genNivel5();
        break;
      case 6:
        pregunta = this._genNivel6();
        break;
      case 7:
        pregunta = this._genNivel7();
        break;
      case 8:
        pregunta = this._genNivel8();
        break;
      case 9:
        pregunta = this._genNivel9();
        break;
      case 10:
        pregunta = this._genNivel10();
        break;
      default:
        pregunta = this._genNivel1();
        break;
    }

    this.preguntaActual = pregunta;
    this.entradaActual = "";
  }

  _verificarRespuesta(valor) {
    if (!this.preguntaActual) return;
    const correcta = this.preguntaActual.respuesta;
    if (valor === correcta) {
      this._manejarAcierto();
    } else {
      this._manejarSrror("wrong");
    }
  }

  _manejarAcierto() {
    this.racha++;
    this.ultimoResultadoCorrecto = this.preguntaActual.respuesta;
    this.ultimoResultadoIncorrecto = null;
    this.ultimaRazonSrror = "";
    this._playSound("sfx_ok");

    if (this.racha >= this.rachaObjetivo) {
      this.nivelMaximoAlcanzado = Math.max(
        this.nivelMaximoAlcanzado,
        this.nivelActual
      );

      if (this.nivelActual >= this.totalNiveles) {
        // Termina con exito -> StateMachine disparara _finishGame(false)
        this.stateMachine.transition("success");
      } else {
        this._empezarNivel(this.nivelActual + 1);
      }
    } else {
      this._generarPregunta();
    }
  }

  _manejarSrror(razon = "wrong") {
    this.erroresNivel++;
    this.racha = 0;
    this.ultimoResultadoCorrecto = null;
    this.ultimoResultadoIncorrecto = this.preguntaActual
      ? this.preguntaActual.respuesta
      : null;
    this.ultimaRazonSrror = razon;
    this._playSound("sfx_error");

    if (this.erroresNivel >= this.erroresMaximos) {
      this.nivelMaximoAlcanzado = Math.max(
        this.nivelMaximoAlcanzado,
        this.nivelActual
      );
      this.stateMachine.transition("gameover");
    } else {
      this._generarPregunta();
    }
  }

  _emitirResultado(exito) {
    // Callback generico opcional
    if (typeof window.onSumasFinished === "function") {
      window.onSumasFinished({
        exito,
        modo: this.mode,
        nivelMaximoAlcanzado: this.nivelMaximoAlcanzado,
        totalNiveles: this.totalNiveles,
      });
    }
  }

  /* --------------------------------------------------------------------- */
  /*  Generacion de preguntas (los 10 niveles)                             */
  /* --------------------------------------------------------------------- */

  // Nivel 1 - Sumas menores a 10
  _genNivel1() {
    let a, b;
    while (true) {
      a = this._randInt(1, 8);
      b = this._randInt(1, 8);
      const s = a + b;
      if (s >= 3 && s <= 9) break;
    }
    return this._makePregunta([a, b]);
  }

  // Nivel 2 - Alcanzar la siguiente decena: base + faltante
  _genNivel2() {
    let base, add;
    while (true) {
      base = this._randInt(11, 98);
      if (base % 10 === 0) continue;
      const faltante = 10 - (base % 10);
      add = faltante;
      if (add >= 1 && add <= 9 && base + add <= 100) break;
    }
    return this._makePregunta([base, add]);
  }

  // Nivel 3 - Numero de dos digitos + (1 a 5)
  _genNivel3() {
    const base = this._randInt(10, 89);
    const add = this._randInt(1, 5);
    return this._makePregunta([base, add]);
  }

  // Nivel 4 - Multiplos de 10: x+10, x+20, x+30
  _genNivel4() {
    const opciones = [10, 20, 30];
    let base, add;
    while (true) {
      base = this._randInt(10, 90);
      add = opciones[this._randInt(0, opciones.length - 1)];
      if (base + add <= 120) break;
    }
    return this._makePregunta([base, add]);
  }

  // Nivel 5 - Multiplos de 5: x+5, x+15, x+25
  _genNivel5() {
    const opciones = [5, 15, 25];
    let base, add;
    while (true) {
      base = this._randInt(10, 90);
      add = opciones[this._randInt(0, opciones.length - 1)];
      if (base + add <= 120) break;
    }
    return this._makePregunta([base, add]);
  }

  // Nivel 6 - +6 y +7
  _genNivel6() {
    const opciones = [6, 7];
    let base, add;
    while (true) {
      base = this._randInt(10, 90);
      add = opciones[this._randInt(0, opciones.length - 1)];
      if (base + add <= 120) break;
    }
    return this._makePregunta([base, add]);
  }

  // Nivel 7 - +8 y +9
  _genNivel7() {
    const opciones = [8, 9];
    let base, add;
    while (true) {
      base = this._randInt(10, 90);
      add = opciones[this._randInt(0, opciones.length - 1)];
      if (base + add <= 120) break;
    }
    return this._makePregunta([base, add]);
  }

  // Nivel 8 - Descomponer en decenas y unidades
  _genNivel8() {
    let a, b;
    while (true) {
      a = this._randInt(10, 89);
      b = this._randInt(10, 89);
      const s = a + b;
      if (s >= 40 && s <= 150) break;
    }
    return this._makePregunta([a, b]);
  }

  // Nivel 9 - Mezcla general <100
  _genNivel9() {
    const tipo = this._randInt(1, 4);
    let pregunta;

    switch (tipo) {
      case 1:
        pregunta = this._genNivel2();
        break;
      case 2:
        pregunta = this._genNivel5();
        break;
      case 3:
        pregunta = this._genNivel6();
        break;
      case 4:
      default: {
        let a, b;
        while (true) {
          a = this._randInt(10, 70);
          b = this._randInt(10, 70);
          const s = a + b;
          if (s <= 120) break;
        }
        pregunta = this._makePregunta([a, b]);
        break;
      }
    }
    if (pregunta.respuesta > 150) {
      return this._genNivel9();
    }
    return pregunta;
  }

  // Nivel 10 - Sumas multiples (4-5 numeros)
  _genNivel10() {
    const tipo = this._randInt(1, 2);
    let operands = [];

    if (tipo === 1) {
      const count = this._randInt(4, 5);
      for (let i = 0; i < count; i++) {
        operands.push(this._randInt(1, 9));
      }
    } else {
      const decenasCount = this._randInt(2, 3);
      for (let i = 0; i < decenasCount; i++) {
        operands.push(this._randInt(1, 9) * 10);
      }
      const extrasCount = this._randInt(2, 3);
      for (let i = 0; i < extrasCount; i++) {
        operands.push(this._randInt(1, 9));
      }
    }

    const sum = operands.reduce((acc, n) => acc + n, 0);
    if (sum > 200) {
      return this._genNivel10();
    }
    return this._makePregunta(operands);
  }

  /* --------------------------------------------------------------------- */
  /*  Utilidades                                                           */
  /* --------------------------------------------------------------------- */

  _makePregunta(operands) {
    const texto = operands.join(" + ") + " = ?";
    const respuesta = operands.reduce((acc, n) => acc + n, 0);
    return { operands, texto, respuesta };
  }

  _randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  _playSound(key) {
    if (!this.game || !this.game.assets) return;
    if (typeof this.game.assets.playSound === "function") {
      this.game.assets.playSound(key);
    } else if (typeof this.game.assets.getAudio === "function") {
      const audio = this.game.assets.getAudio(key);
      if (audio && typeof audio.play === "function") {
        audio.play();
      }
    }
  }

  _finishGame(failed = false) {
    if (this.gameFinished) return;
    this.gameFinished = true;
    this.exitDelay = 0.5;

    const exito = !failed;
    const superoTodo = exito && this.nivelMaximoAlcanzado >= this.totalNiveles;

    // Tier para MN_reportMinigameTier:
    //  - 0: no hoja (fallo o no llego a nivel 6)
    //  - 1: llego al menos a nivel 6 pero no completo los 10 niveles (solo modo "timed")
    //  - 2: completo los 10 niveles en modo "timed"
    let tier = 0;

    if (!failed && this.mode === "timed") {
      tier = 2; // 2 hojas
    } else if (this.nivelMaximoAlcanzado >= 6) {
      tier = 1; // 1 hoja
    }

    let gained = 0;
    if (window.MN_reportMinigameTier) {
      gained = MN_reportMinigameTier("escalera_sumas", tier);
    }
    this.sheetsReward = gained;

    // Mensaje de cabecera segun resultado
    let header;
    if (superoTodo) {
      header = "Has completado la Escalera de Sumas.\n";
    } else if (failed) {
      header =
        this.ultimaRazonSrror === "timeout_global"
          ? "Te alcanzó el agua en la Escalera de Sumas.\n"
          : "Has fallado en la Escalera de Sumas.\n";
    } else {
      header = "Has terminado la Escalera de Sumas.\n";
    }

    this.message =
      header +
      `Nivel maximo alcanzado: ${this.nivelMaximoAlcanzado}/${this.totalNiveles}.\n` +
      `Hojas ganadas en esta partida: ${gained}.`;

    // Sonidos finales
    if (exito) {
      this._playSound("sfx_win");
    } else {
      this._playSound("sumas_fail");
    }

    // Callback generico
    this._emitirResultado(exito);

    // Evento para overworld (estilo escriba/jerarquia)
    if (this.game && this.game.events) {
      this.game.events.emit("sumas_done", {
        exito,
        modo: this.mode,
        nivelMaximoAlcanzado: this.nivelMaximoAlcanzado,
        totalNiveles: this.totalNiveles,
        tier,
        sheetsReward: gained,
        failed,
      });
    }
  }
}




