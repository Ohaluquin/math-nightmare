// Núcleo de la novela gráfica — usa ADRUCE_STORY y ADRUCE_ASSETS
// === Añade esto cerca de la clase NovelaScene (reemplaza tu versión si quieres) ===
class NovelaScene extends Scene {
  constructor(game, story, assetsManifest, options = {}) {
    super(game);
    this.story = story;
    this.assetsManifest = assetsManifest;
    this.currentSceneKey = story.start || Object.keys(story.scenes)[0];
    this.dialogIndex = 0;
    this.isTyping = false;
    this._typingInterval = null;
    this.currentText = "";
    this.fadeAlpha = 0;
    this.isFading = false;
    this.background = null;
    this._pan = 0;
    this._playedIntro = Object.create(null);
    this.pendingChoices = null;
    this.options = options || {};
    this.skipMode = this.options.skipMode || "next";
    this._isActive = false;
    // "next" (comportamiento actual) | "exit"

    // personajes en escena (array de {name, imageKey, x, y, scale, flipX, alpha})
    this.characters = [];
  }

  init() {
    this._isActive = true;
    this.dialogBox = document.getElementById("dialog-box");
    this.speakerElement = document.getElementById("speaker");
    this.messageElement = document.getElementById("message");
    this.continueButton = document.getElementById("continue-btn");
    this.choicesRoot = document.getElementById("choices-root");
    this.skipButton = document.getElementById("skip-dialog-btn");

    // Guardamos las funciones para poder quitarlas luego
    this._onContinueClick = (e) => {
      e.stopPropagation(); // evita que el click burbujee al canvas
      this.nextDialog();
    };
    this._onCanvasClick = () => {
      this.nextDialog();
    };
    this._onSkipClick = (e) => {      
      e.stopPropagation();      
      if (this.skipMode === "exit") { // Saltar = Salir de la novela
        this._exitNovela(); 
        return;
      }      
      this.skipToNextStop();
    };

    this.continueButton.addEventListener("click", this._onContinueClick);
    this.game.canvas.addEventListener("click", this._onCanvasClick);
    if (this.skipButton) {
      this.skipButton.addEventListener("click", this._onSkipClick);
    }
    if (window.MN_setLeafHUDVisible) {
      window.MN_setLeafHUDVisible(false);
    }
    window.MN_setInputMode?.(null);

    this.dialogBox.classList.remove("hidden");
    this.showScene(this.currentSceneKey);
    // Seleccionar el botón Continuar al entrar a la novela
    setTimeout(() => {
      if (this.continueButton && this.continueButton.style.display !== "none") {
        this.continueButton.focus();
      }
    }, 0);
    this._startIdle();
  }

  showScene(key) {
    if (!this._isActive) return;
    this.currentSceneKey = key;
    const scene = this.story.scenes[key];
    if (!scene) return;

    this.startFadeOut(() => {
      if (!this._isActive) return;
      this.dialogIndex = 0;
      this.choicesRoot.innerHTML = "";

      // fondo
      const bgImg = this.game.assets.getImage(scene.background);
      this.background = { img: bgImg };

      // personajes iniciales de la escena (opcionales)
      this.characters = (scene.characters || []).map((c) => ({
        name: c.name,
        imageKey: c.image, // clave de asset (ej: "ch_taron_neutro")
        x: c.x ?? 600,
        y: c.y ?? 360,
        scale: c.scale ?? 1,
        flipX: !!c.flipX,
        alpha: typeof c.alpha === "number" ? c.alpha : 1,
      }));

      this.startFadeIn();

      // 🔸 Música de escena:
      // Si hay introVideo pendiente, NO arrancamos música todavía.
      const hasPendingIntro = !!scene.introVideo && !this._playedIntro[key];
      if (!hasPendingIntro && scene.music && this.game.assets.playMusic) {
        this.game.assets.playMusic(scene.music, { loop: true, volume: 0.2 });
      }
    });

    // --- Video de introducción (si existe y aún no se ha reproducido) ---
    if (scene && scene.introVideo && !this._playedIntro[key]) {
      this._playedIntro[key] = true;

      // cancelar tipeo abierto
      if (this._typingInterval) {
        clearInterval(this._typingInterval);
        this._typingInterval = null;
      }
      this.isTyping = false;
      this.choicesRoot.innerHTML = "";
      this.continueButton.style.display = "none";
      this.skipButton.style.display = "none";

      this._playVideo(scene.introVideo, {
        autoplay: true,
        onEnd: () => {
          // al terminar el video, arrancamos la música de la escena (ahora sí)
          if (scene.music && this.game.assets.playMusic) {
            this.game.assets.playMusic(scene.music, {
              loop: true,
              volume: 0.2,
            });
          }
          scene.introVideo = null;
          this.showDialog(0);
          this.continueButton.focus();
        },
      });
      return;
    }

    // Si no hay introVideo, o ya se reprodujo, arranca el diálogo 0
    if (!scene.introVideo || this._playedIntro[key]) {
      this.showDialog(0);
    }
  }

  // === utilidades para “direcciones” en cada diálogo ===
  _findChar(name) {
    return this.characters.find((ch) => ch.name === name);
  }

  _applyStage(stage) {
    if (!stage) return;

    // util seguro para audio
    const _playSfx = (key, opts = {}) => {
      try {
        const snd = this.game.assets.getSound
          ? this.game.assets.getSound(key)
          : this.game.assets.sounds
          ? this.game.assets.sounds[key]
          : null;
        if (snd) this.game.assets.playSound(key, opts);
      } catch (e) {
        /* no-op */
      }
    };

    // === set: { name, image } → cambiar sprite ===
    if (stage.set) {
      const { name, image } = stage.set;
      const ch = this._findChar(name);
      if (ch && image) ch.imageKey = image;
    }

    // === move: { name, x, y, t } → mover; si t existe, hace tween ===
    if (stage.move) {
      const { name, x, y, t } = stage.move;
      const ch = this._findChar(name);
      if (ch) {
        if (!t || t <= 0) {
          if (x != null) ch.x = x;
          if (y != null) ch.y = y;
        } else {
          // tween suave
          const x0 = ch.x,
            y0 = ch.y;
          const tx = x != null ? x : x0;
          const ty = y != null ? y : y0;
          const t0 = performance.now();
          const dur = t;

          const step = (now) => {
            const p = Math.min(1, (now - t0) / dur);
            const ease = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p; // easeInOutQuad
            ch.x = x0 + (tx - x0) * ease;
            ch.y = y0 + (ty - y0) * ease;
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      }
    }

    // === focus: "Nombre" → resalta un personaje ===
    if (stage.focus) {
      if (Array.isArray(stage.focus)) {
        const set = new Set(stage.focus);
        this.characters.forEach((ch) => {
          if (set.has(ch.name)) ch.alpha = 1; // no tocamos a los demás (Taron sigue en 0)
        });
      } else {
        const who = stage.focus;
        this.characters.forEach(
          (ch) => (ch.alpha = ch.name === who ? 1 : 0.55)
        );
      }
    }

    // === show: aparece un personaje si no existe ===
    if (stage.show) {
      const s = stage.show;
      const exists = this._findChar(s.name);
      if (!exists) {
        this.characters.push({
          name: s.name,
          imageKey: s.image,
          x: s.x ?? 600,
          y: s.y ?? 360,
          scale: s.scale ?? 1,
          flipX: !!s.flipX,
          alpha: typeof s.alpha === "number" ? s.alpha : 1,
        });
      }
    }

    // === hide: desaparece por nombre ===
    if (stage.hide) {
      const toHide = Array.isArray(stage.hide) ? stage.hide : [stage.hide];
      this.characters = this.characters.filter(
        (ch) => !toHide.includes(ch.name)
      );
    }

    // === sfx: reproducir sonido (seguro, sin .has) ===
    if (stage.sfx) {
      _playSfx(stage.sfx, { volume: stage.sfxVol ?? 0.9 });
    }

    // === music: cambiar música/volumen (opcional) ===
    //   music puede ser string o { key, volume, loop }
    if (stage.music) {
      const m = stage.music;
      const key = typeof m === "string" ? m : m.key;
      if (key && this.game.assets.playMusic) {
        this.game.assets.playMusic(key, {
          loop: typeof m === "object" && "loop" in m ? m.loop : true,
          volume: typeof m === "object" && "volume" in m ? m.volume : 0.2,
        });
      }
    }

    // === shake: sacudida de cámara/canvas (opcional) ===
    if (stage.shake) {
      const strength = Number(stage.shake) || 6;
      const dur = Number(stage.shakeDur) || 300;
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        if (p >= 1) {
          this.game.canvas.style.transform = "";
          return;
        }
        const k = 1 - p; // decae
        const dx = (Math.random() * 2 - 1) * strength * k;
        const dy = (Math.random() * 2 - 1) * strength * 0.6 * k;
        this.game.canvas.style.transform = `translate(${dx}px, ${dy}px)`;
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }

    // === path: mueve en múltiples segmentos con tween y acciones opcionales ===
    // stage.path = { name, points:[{x,y,t,scale,alpha}], hideAtEnd?, sfxEach? }
    if (stage.path) {
      const {
        name,
        points = [],
        hideAtEnd = true,
        sfxEach = null,
      } = stage.path;
      const ch = this._findChar(name);
      if (ch && points.length) {
        const run = (i = 0) => {
          if (i >= points.length) {
            if (hideAtEnd) {
              const idx = this.characters.findIndex((c) => c.name === name);
              if (idx >= 0) this.characters.splice(idx, 1);
            }
            return;
          }
          const p = points[i];
          // reproducir sfx por segmento (opcional)
          if (sfxEach) {
            try {
              const snd = this.game.assets.getSound
                ? this.game.assets.getSound(sfxEach)
                : this.game.assets.sounds
                ? this.game.assets.sounds[sfxEach]
                : null;
              if (snd) this.game.assets.playSound(sfxEach, { volume: 0.6 });
            } catch (e) {}
          }
          // tween posición/escala/alpha
          const x0 = ch.x,
            y0 = ch.y,
            s0 = ch.scale ?? 1,
            a0 = typeof ch.alpha === "number" ? ch.alpha : 1;
          const tx = p.x ?? x0,
            ty = p.y ?? y0,
            ts = p.scale ?? s0,
            ta = p.alpha ?? a0;
          const t0 = performance.now(),
            dur = Math.max(16, p.t ?? 280);

          const step = (now) => {
            const u = Math.min(1, (now - t0) / dur);
            const ease = u < 0.5 ? 2 * u * u : -1 + (4 - 2 * u) * u; // easeInOutQuad
            ch.x = x0 + (tx - x0) * ease;
            ch.y = y0 + (ty - y0) * ease;
            ch.scale = s0 + (ts - s0) * ease;
            ch.alpha = a0 + (ta - a0) * ease;
            if (u < 1) requestAnimationFrame(step);
            else run(i + 1);
          };
          requestAnimationFrame(step);
        };
        run(0);
      }
    }
  }

  _startIdle() {
    const amp = 0.008;
    const speed = 2600;
    const t0 = performance.now();

    const step = (now) => {
      const s = Math.sin(((now - t0) / speed) * Math.PI * 2) * amp;
      this.characters.forEach((ch) => (ch._idleScaleOffset = s));
      this._idleRaf = requestAnimationFrame(step);
    };

    this._idleRaf = requestAnimationFrame(step);
  }

  showDialog(index) {
    if (!this._isActive) return;
    const scene = this.story.scenes[this.currentSceneKey];
    if (!scene) return;
    if (this.dialogBox) {
      this.dialogBox.classList.remove("hidden");
    }
    const dialog = scene.dialogs[index];
    if (!dialog) {
      // ¿hay outro de esta escena?
      if (scene.outroVideo) {
        this.isTyping = false;
        this.choicesRoot && (this.choicesRoot.innerHTML = "");
        this.continueButton && (this.continueButton.style.display = "none");

        this._playVideo(scene.outroVideo, {
          autoplay: true,
          onEnd: () => {
            if (scene.nextScene) this.showScene(scene.nextScene);
            else this.gotoNextNarrative();
          },
        });
        return;
      }

      // sin outro: continuar flujo normal
      if (scene.nextScene) {
        this.showScene(scene.nextScene);
      } else {
        this.gotoNextNarrative();
      }
      return;
    }

    // UI base
    this.choicesRoot.innerHTML = "";
    this.pendingChoices = null;
    this.dialogIndex = index;
    this.currentText = dialog.text || "";
    this.isTyping = true;
    this.messageElement.textContent = "";
    this.speakerElement.textContent = dialog.speaker || "";

    // “direcciones” (cambio de sprite, movimiento, sfx, etc.)
    this._applyStage(dialog.stage);

    // focus visual al hablante
    this._focusBySpeaker(dialog.speaker);

    // opciones
    if (dialog.choices && dialog.choices.length) {
      // Guardamos las opciones, no las mostramos todavía
      this.pendingChoices = dialog.choices;
      // Ocultamos el botón mientras
      this.continueButton.style.display = "none";
      this.skipButton.style.display = "none";
      this.skipButton.disabled = true;
    } else {
      //no hay opciones, hacemos los botones visibles
      this.continueButton.style.display = "inline-block";
      this.skipButton.style.display = "inline-block";
      this.skipButton.disabled = false;
    }

    // limpia interval anterior
    if (this._typingInterval) {
      clearInterval(this._typingInterval);
      this._typingInterval = null;
    }

    // si no hay texto, no hagas tipeo (=> sin blip)
    if (!this.currentText || this.currentText.length === 0) {
      this.isTyping = false;
      this.messageElement.textContent = "";
      return;
    }

    let i = 0;
    let lastBeep = 0;
    const BEEP_EVERY = 2;
    const BEEP_MIN_MS = 45;

    this._typingInterval = setInterval(() => {
      if (i < this.currentText.length) {
        const ch = this.currentText[i++];
        this.messageElement.textContent += ch;

        // blip (opcional: silenciar si hay cutscene)
        try {
          const snd = this.game.assets.getSound
            ? this.game.assets.getSound("text_blip")
            : this.game.assets.sounds
            ? this.game.assets.sounds["text_blip"]
            : null;
          if (snd) {
            const now = performance.now();
            if (i % BEEP_EVERY === 0 && now - lastBeep > BEEP_MIN_MS) {
              this.game.assets.playSound("text_blip", { volume: 0.15 });
              lastBeep = now;
            }
          }
        } catch (_) {}
      } else {
        this.isTyping = false;
        clearInterval(this._typingInterval);
        this._typingInterval = null;

        // 🔥 SI HAY OPCIONES, MOSTRARLAS AHORA
        if (this.pendingChoices) {
          this.renderChoices(this.pendingChoices);
          this.pendingChoices = null;
        }
      }
    }, 30);
  }

  // Resalta al hablante (alpha 1) y baja el resto (0.6) con un tween corto
  _focusBySpeaker(name) {
    // No tocar alphas si no hay nombre, si es blanco, o si es "Narrador"
    if (!name || !name.trim() || name.trim() === "Narrador") return;

    const exists = this.characters.some((c) => c.name === name);
    if (!exists) return; // si no existe ese personaje, no tocar alphas

    this.characters.forEach((c) => {
      const target = c.name === name ? 1 : 0.6;
      this.animateCharacterAlpha(c, target, 160);
    });
  }

  // Tween de alpha simple (sin depender de motor/tween externo)
  animateCharacterAlpha(char, targetAlpha = 1, duration = 160) {
    const start = typeof char.alpha === "number" ? char.alpha : 1;
    const delta = targetAlpha - start;
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      char.alpha = start + delta * p;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  _resolveVideoSrc(maybeKeyOrUrl) {
    // Si ya es una ruta, la regresamos tal cual
    if (!maybeKeyOrUrl || typeof maybeKeyOrUrl !== "string")
      return maybeKeyOrUrl;
    if (
      maybeKeyOrUrl.includes("/") ||
      maybeKeyOrUrl.endsWith(".mp4") ||
      maybeKeyOrUrl.startsWith("http")
    ) {
      return maybeKeyOrUrl;
    }

    // Si es key, buscamos en el AssetLoader
    const a = this.game?.assets;
    // Si implementaste getVideo()
    if (a && typeof a.getVideo === "function") {
      const src = a.getVideo(maybeKeyOrUrl);
      if (src) return src;
    }
    // Si guardas videos en a.videos
    if (a && a.videos && a.videos[maybeKeyOrUrl]) {
      return a.videos[maybeKeyOrUrl];
    }

    // fallback: lo dejamos igual (se verá rápido en consola si falla)
    return maybeKeyOrUrl;
  }

  _playVideo(src, { autoplay = true, onEnd = null } = {}) {
    const overlay = document.getElementById("video-overlay");
    const vid = document.getElementById("cutscene");
    const skip = document.getElementById("skip-video");
    if (!overlay || !vid) return Promise.resolve();

    // 🔇 Guardar volumen maestro y silenciar TODO el audio del juego
    let prevMasterVolume = null;
    if (
      this.game &&
      this.game.assets &&
      typeof this.game.assets.setMasterVolume === "function"
    ) {
      prevMasterVolume = this.game.assets.masterVolume ?? 1;
      this.game.assets.setMasterVolume(0);
    }

    // (Opcional) intentar detener la música de fondo por si acaso
    if (this.game && this.game.assets && this.game.assets.stopMusic) {
      this.game.assets.stopMusic();
    }

    return new Promise((res) => {
      const end = () => {
        vid.pause();
        vid.src = ""; // libera recurso
        overlay.classList.add("hidden");
        vid.onended = null;
        if (skip) skip.onclick = null;

        // 🔊 Restaurar volumen maestro
        if (
          prevMasterVolume !== null &&
          this.game &&
          this.game.assets &&
          typeof this.game.assets.setMasterVolume === "function"
        ) {
          this.game.assets.setMasterVolume(prevMasterVolume);
        }

        onEnd && onEnd();
        res();
      };

      if (skip) skip.onclick = end;
      vid.onended = end;

      overlay.classList.remove("hidden");
      const resolved = this._resolveVideoSrc(src);
      vid.src = resolved;

      if (autoplay) {
        vid.play().catch(() => {
          // Si el navegador bloquea autoplay, ya hubo un click previo (Start),
          // normalmente eso lo desbloquea; si no, se puede pedir otro click.
        });
      }
    });
  }

  draw(ctx) {
    const pan = Math.sin(performance.now() / 3000) * 8; // ±8 px en 3s
    this._pan = pan;
    if (this.background?.img) {
      ctx.drawImage(
        this.background.img,
        pan,
        0,
        this.game.canvas.width,
        this.game.canvas.height
      );
    } else {
      ctx.fillStyle = "#0b0b0c";
      ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);
    }
    // personajes (muevelos -pan*0.15 para parallax relativo)
    this.characters.forEach((ch) => {
      const img = this.game.assets.getImage(ch.imageKey);
      if (!img) return;
      const baseScale = ch.scale ?? 1;
      const osc = ch._idleScaleOffset ?? 0;
      const sc = baseScale * (1 + osc);
      const w = img.width * sc,
        h = img.height * sc;
      const parx = this._pan * -0.15; // un poquito en contra
      ctx.save();
      ctx.globalAlpha = ch.alpha ?? 1;
      if (ch.flipX) {
        ctx.translate(ch.x + w / 2, ch.y);
        ctx.scale(-1, 1);
        ctx.translate(-(ch.x + w / 2), -ch.y);
      }
      ctx.drawImage(img, ch.x + parx - w / 2, ch.y - h, w, h);
      ctx.restore();
    });
    if (this.isFading) {
      ctx.fillStyle = `rgba(0,0,0,${this.fadeAlpha})`;
      ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);
    }
    super.draw(ctx);
  }

  renderChoices(choices) {
    const container = document.createElement("div");
    container.className = "choices-container";

    choices.forEach((choice) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn";
      btn.textContent = choice.text;

      btn.addEventListener("click", (e) => {
        e.stopPropagation();

        // Limpiar estado de la escena actual
        this.pendingChoices = null;
        this.choicesRoot.innerHTML = "";
        this.isTyping = false;
        if (this._typingInterval) {
          clearInterval(this._typingInterval);
          this._typingInterval = null;
        }

        // ✅ 1) Acción genérica (si existe)
        if (
          choice.action &&
          this.options &&
          typeof this.options.onAction === "function"
        ) {
          const handled = this.options.onAction(choice.action, {
            story: this.story,
            sceneKey: this.currentSceneKey,
            choice,
          });

          // Si el handler se encargó, no seguimos
          if (handled) return;
        }

        // ✅ 2) Flujo normal: ir a la siguiente escena (si existe)
        if (choice.next) {
          this.showScene(choice.next);
          return;
        }

        // ✅ 3) Si no hay next y no se manejó action, no hacemos nada.
        // (Opcional: podrías hacer un console.warn aquí.)
      });

      container.appendChild(btn);
    });

    this.choicesRoot.appendChild(container);
  }

  gotoNextNarrative() {
    const order = this.story.order || Object.keys(this.story.scenes);
    const idx = order.indexOf(this.currentSceneKey);
    if (idx >= 0 && idx < order.length - 1) {
      this.showScene(order[idx + 1]);
    } else {
      this._exitNovela(); // en vez de sólo ocultar
      // this.dialogBox.classList.add("hidden");
    }
  }

  _exitNovela() {
    this._isActive = false;
    this.isTyping = false;
    this.pendingChoices = null;
    if (this._typingInterval) {
      clearInterval(this._typingInterval);
      this._typingInterval = null;
    }

    // ocultar UI
    if (this.dialogBox) this.dialogBox.classList.add("hidden");
    if (this.speakerElement) this.speakerElement.textContent = "";
    if (this.messageElement) this.messageElement.textContent = "";
    if (this.choicesRoot) this.choicesRoot.innerHTML = "";
    if (this.continueButton) this.continueButton.style.display = "inline-block";
    if (this.skipButton) {
      this.skipButton.style.display = "inline-block";
      this.skipButton.disabled = false;
    }

    // restaurar HUD si aplica
    if (window.MN_setLeafHUDVisible) window.MN_setLeafHUDVisible(true);

    // notificar al router (si lo tienes colgado en MN_APP)
    try {
      const r = window.MN_APP?.router;
      if (r && typeof r.popNovela === "function") {
        r.popNovela();
        return;
      }
    } catch (_) {}

    // fallback: al overworld
    try {
      if (window.MN_APP?.toOverworld) window.MN_APP.toOverworld();
    } catch (_) {}
  }

  nextDialog() {
    // 1) Si está escribiendo, terminar el tipeo sin avanzar
    if (this.isTyping) {
      this.messageElement.textContent = this.currentText;
      this.isTyping = false;
      if (this._typingInterval) {
        clearInterval(this._typingInterval);
        this._typingInterval = null;
      }

      // si al terminar de escribir había opciones pendientes, mostrarlas ahora
      if (this.pendingChoices) {
        this.renderChoices(this.pendingChoices);
        this.pendingChoices = null;
      }
      return;
    }

    const scene = this.story.scenes[this.currentSceneKey];
    if (!scene) return;

    // 2) Si este diálogo define next explícito, obedecerlo
    const currentDlg = scene.dialogs?.[this.dialogIndex];
    const forcedNext = currentDlg?.next;

    if (forcedNext) {
      // "exit" = salir
      if (forcedNext === "exit" || forcedNext === "__exit__") {
        this._exitNovela();
        return;
      }
      // salto a otra escena
      this.showScene(forcedNext);
      return;
    }

    // 3) Si no hay next explícito, avanzar normal
    this.showDialog(this.dialogIndex + 1);
  }

  skipToNextStop() {
    const scene = this.story.scenes[this.currentSceneKey];
    if (!scene || !scene.dialogs) return;

    // Aseguramos que no quede tipeo colgando
    if (this.isTyping) {
      this.isTyping = false;
      if (this._typingInterval) {
        clearInterval(this._typingInterval);
        this._typingInterval = null;
      }
    }

    let idx = this.dialogIndex;

    while (true) {
      idx++;
      const dlg = scene.dialogs[idx];

      // 🔚 Fin de los diálogos de la escena
      if (!dlg) {
        // Delegamos en showDialog para que haga outroVideo / nextScene / gotoNextNarrative
        this.showDialog(idx);
        return;
      }

      // 🧭 Llegamos a una decisión: detener aquí
      if (dlg.choices && dlg.choices.length) {
        this.showDialog(idx);
        return;
      }

      // ⏩ Diálogo intermedio sin decisiones:
      // aplicamos solo las direcciones de escena para que el estado visual avance,
      // pero sin mostrar texto ni esperar interacción.
      this._applyStage(dlg.stage);
      this._focusBySpeaker(dlg.speaker);

      // y seguimos al siguiente diálogo
    }
  }

  startFadeOut(callback) {
    this.isFading = true;
    this.fadeAlpha = 0;
    const step = () => {
      this.fadeAlpha += 0.06;
      if (this.fadeAlpha >= 1) {
        this.fadeAlpha = 1;
        this.isFading = false;
        callback && callback();
      } else {
        requestAnimationFrame(step);
      }
    };
    step();
  }

  startFadeIn() {
    this.isFading = true;
    this.fadeAlpha = 1;
    const step = () => {
      this.fadeAlpha -= 0.06;
      if (this.fadeAlpha <= 0) {
        this.fadeAlpha = 0;
        this.isFading = false;
      } else {
        requestAnimationFrame(step);
      }
    };
    step();
  }

  destroy() {
    this._isActive = false;
    // Quitar listeners de botón y canvas
    if (this.continueButton && this._onContinueClick) {
      this.continueButton.removeEventListener("click", this._onContinueClick);
      this._onContinueClick = null;
    }
    if (this.game && this.game.canvas && this._onCanvasClick) {
      this.game.canvas.removeEventListener("click", this._onCanvasClick);
      this._onCanvasClick = null;
    }
    if (this.skipButton && this._onSkipClick) {
      this.skipButton.removeEventListener("click", this._onSkipClick);
      this._onSkipClick = null;
    }

    // Cancelar el intervalo de tipeo si sigue vivo
    if (this._typingInterval) {
      clearInterval(this._typingInterval);
      this._typingInterval = null;
    }

    // 🔇 Al salir de la novela, detener la música de fondo de la novela
    if (this.game && this.game.assets && this.game.assets.stopMusic) {
      this.game.assets.stopMusic();
    }

    if (this._idleRaf) {
      cancelAnimationFrame(this._idleRaf);
      this._idleRaf = null;
    }

    if (this.dialogBox) this.dialogBox.classList.add("hidden");
    if (this.speakerElement) this.speakerElement.textContent = "";
    if (this.messageElement) this.messageElement.textContent = "";
    if (this.choicesRoot) this.choicesRoot.innerHTML = "";
  }
}
