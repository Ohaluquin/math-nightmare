// overworld.js – Overworld de Math Nightmare con NPCs, novela y minijuegos
(function () {
  class OverworldScene extends CoreScene {
    constructor(game, nivelIndex = 0) {
      super(game, nivelIndex);
      this.npcs = [];
      this.worldObjects = [];
      this._initialized = false;
      this.bgSpeedFactor = 0;
      this._lastAlgebraUnlocked = undefined;
      this.depthScaleMinY = 230;
      this.depthScaleMaxY = 480;
      this.depthScaleFar = 0.74;
      this.depthScaleNear = 1;
    }

    init() {
      // Solo la primera vez que entramos al overworld
      if (!this._initialized) {
        super.init(); // Lógica base de GameScene (jugador, cámara, HUD, fondo, etc.)
        this._buildNPCs(); // Construir NPCs SOLO una vez
        this._buildWorldObjects();
        this._initialized = true;
      }

      this.game.assets?.playMusic?.("bgm_overworld", { loop: true, volume: 0.2 });
      window.MN_openPendingSheetReward?.();

      // Cada vez que volvemos al overworld:
      // Limpiar mensaje contextual
      const hint = document.getElementById("hint");
      if (hint) hint.textContent = "";

      // Asegurar jugador (si existe lo reposiciona, si no lo crea)
      this._ensurePlayer();

      // ✅ Si cambia el desbloqueo de Álgebra, reconstruir NPCs (mover Sofía / cambiar diálogos)
      const unlockedNow = !!window.MN_STATE?.flags?.algebraUnlocked;
      if (this._lastAlgebraUnlocked === undefined) {
        this._lastAlgebraUnlocked = unlockedNow;
      } else if (unlockedNow !== this._lastAlgebraUnlocked) {
        this._lastAlgebraUnlocked = unlockedNow;

        // Quitar NPCs previos y volver a crearlos
        if (typeof this.removeGroup === "function") {
          this.removeGroup("npcs");
        } else {
          // Fallback: intentar remover a mano
          for (const old of this.npcs || []) this.remove?.(old);
        }
        this._buildNPCs();
      }

      if (window.MN_setLeafHUDVisible) {
        window.MN_setLeafHUDVisible(true);
      }
      window.MN_updateLeafHUD?.();

      if (!MN_STATE.flags.tutorialShown) {
        MN_STATE.flags.tutorialShown = true;

        const overlay = document.getElementById("gameOverlay");
        const msg = document.getElementById("gameMessage");

        msg.innerHTML = "Moverse: ← → ↑ ↓<br>" + 'Hablar con NPCs: "e" o "E"';

        overlay.classList.add("show");

        setTimeout(() => {
          overlay.classList.remove("show");
        }, 3000);
      }
    }

    draw(ctx) {
      // 1) Ordenar la layer "actors" por la posición de los pies
      const actors = this.layers.get("actors");
      if (actors) {
        actors.sort((a, b) => {
          const ay = (a.y ?? 0) + (a.height ?? 0);
          const by = (b.y ?? 0) + (b.height ?? 0);
          return ay - by;
        });
      }

      // 2) Dibujar todo normalmente
      super.draw(ctx);
    }

    update(dt) {
      super.update(dt);
      if (this.player) {
        window.MN_storeCheckpoint?.("aritmetica", {
          scene: "overworld",
          playerX: this.player.x,
          playerY: this.player.y,
        });
      }
    }

    getEntityDepthScale(entity) {
      if (!(entity instanceof Player)) return 1;
      const footY = (entity?.y || 0) + (entity?.height || 0);
      const minY = this.depthScaleMinY;
      const maxY = this.depthScaleMaxY;
      if (maxY <= minY) return this.depthScaleNear;
      const t = Math.max(0, Math.min(1, (footY - minY) / (maxY - minY)));
      return this.depthScaleFar + (this.depthScaleNear - this.depthScaleFar) * t;
    }

    // ---------------------------------------------------------------------
    // NPCs
    _buildNPCs() {
      this.npcs = [];

      // Sofía -------------------------------------------------------------
      const algebraUnlocked = !!window.MN_STATE?.flags?.algebraUnlocked;

      // Posición normal vs posición “umbral” (ajusta a tu mapa)
      const sofiaPos = algebraUnlocked
        ? { x: 5650, y: 320 } // salida al álgebra
        : { x: 520, y: 320 };

      const sofiaStoryKey = algebraUnlocked
        ? "npc_sofia_algebra_gate"
        : "npc_sofia_intro";

      const sofia = this._createStoryNPC({
        x: sofiaPos.x,
        y: sofiaPos.y,
        w: 75,
        h: 130,
        name: "Sofía",
        spriteKey: "ch_sofia",
        storyKey: sofiaStoryKey,
      });
      this.npcs.push(sofia);

      // Escriba -----------------------------------------------------------
      const escriba = this._createMinigameNPC({
        x: 1400,
        y: 220,
        w: 70,
        h: 135,
        name: "Escriba",
        spriteKey: "ch_escriba",
        storyKey: "npc_escriba_muescas",
        minigameKey: "escriba_muescas", // clave en MN_REGISTRY.minigames
        sceneKey: "escriba_muescas", // nombre de escena registrada
        assetsManifest: MN_ASSETS_ESCRIBA_MUESCAS, // assets del minijuego
      });
      this.npcs.push(escriba);

      // Caja Rápida --------------------------------------------------
      const caja = this._createMinigameNPC({
        x: 1750,
        y: 480,
        w: 80,
        h: 140,
        name: "Mercader",
        spriteKey: "ch_mercader",
        storyKey: "npc_caja_rapida",
        minigameKey: "caja_rapida",
        sceneKey: "caja_rapida",
        assetsManifest: MN_ASSETS_CAJA_RAPIDA,
      });
      this.npcs.push(caja);

      // Don Marino -----------------------------------------------------------
      const anciano = this._createMinigameNPC({
        x: 2000,
        y: 230,
        w: 75,
        h: 125,
        name: "Don Marino",
        spriteKey: "ch_escaleraSumas",
        storyKey: "npc_escalera_sumas",
        minigameKey: "escalera_sumas", // clave en MN_REGISTRY.minigames
        sceneKey: "escalera_sumas", // nombre de escena registrada
        assetsManifest: MN_ASSETS_ESCALERA_SUMAS, // assets del minijuego
      });
      this.npcs.push(anciano);

      // Galileo / Tablas ------------------------------------------------
      const galileo = this._createMinigameNPC({
        x: 2800,
        y: 435,
        w: 80,
        h: 145,
        name: "Galileo Galilei",
        spriteKey: "ch_galileo",
        storyKey: "npc_galileo",
        minigameKey: "galileo_tablas",
        sceneKey: "galileo_tablas",
        assetsManifest: MN_ASSETS_GALILEO_TABLAS,
      });
      this.npcs.push(galileo);

      // Guardian del Sendero -----------------------------------------------------------
      const guardian = this._createMinigameNPC({
        x: 3200,
        y: 200,
        w: 90,
        h: 155,
        name: "Guardian del Sendero",
        spriteKey: "ch_guardian",
        storyKey: "npc_restas_luciernagas",
        minigameKey: "restas_luciernagas", // clave en MN_REGISTRY.minigames
        sceneKey: "restas_luciernagas", // nombre de escena registrada
        assetsManifest: MN_ASSETS_RESTAS_LUCIERNAGAS, // assets del minijuego
      });
      this.npcs.push(guardian);

      // Mineros / Elevador ------------------------------------------
      const mineros = this._createMinigameNPC({
        x: 3800,
        y: 220,
        w: 100,
        h: 160,
        name: "Bruno",
        spriteKey: "ch_minero",
        storyKey: "npc_mineros",
        minigameKey: "mineros_division",
        sceneKey: "mineros_division",
        assetsManifest: MN_ASSETS_ELEVADOR,
      });
      this.npcs.push(mineros);

      // Armonia / Division ------------------------------------------------
      const armonia = this._createMinigameNPC({
        x: 4200,
        y: 435,
        w: 85,
        h: 135,
        name: "Armonia",
        spriteKey: "ch_armonia",
        storyKey: "npc_armonia",
        minigameKey: "armonia_division",
        sceneKey: "armonia_division",
        assetsManifest: MN_ASSETS_ARMONIA_DIVISION,
      });
      this.npcs.push(armonia);

      // Chamán / Jerarquía ------------------------------------------------
      const chaman = this._createMinigameNPC({
        x: 4700,
        y: 470,
        w: 100,
        h: 150,
        name: "Chamán de la Jerarquía",
        spriteKey: "ch_chaman",
        storyKey: "npc_chaman_jerarquia",
        minigameKey: "chaman_jerarquia", // o "jerarquia", según lo hayas registrado
        sceneKey: "chaman_jerarquia", // mismo nombre que uses en sceneManager
        assetsManifest: MN_ASSETS_CHAMAN_JERARQUIA, // define este manifest con los assets del minijuego
      });
      this.npcs.push(chaman);

      // General / Signos ------------------------------------------------
      const general = this._createMinigameNPC({
        x: 5300,
        y: 260,
        w: 130,
        h: 180,
        name: "General de los Signos",
        spriteKey: "ch_general",
        storyKey: "npc_general",
        minigameKey: "general_signos",
        sceneKey: "general_signos",
        assetsManifest: MN_ASSETS_GENERAL_SIGNOS,
      });
      this.npcs.push(general);

      // Eratóstenes / Divisores -------------------------------------
      const erato = this._createMinigameNPC({
        x: 6100,
        y: 360,
        w: 90,
        h: 150,
        name: "Eratóstenes",
        spriteKey: "ch_eratostenes",
        storyKey: "npc_eratostenes",
        minigameKey: "eratostenes_divisores",
        sceneKey: "eratostenes_divisores",
        assetsManifest: MN_ASSETS_DIVISORES,
      });
      this.npcs.push(erato);

      // Boss Leonardo / Fibonacci -------------------------------------
      const leo = this._createBossLeonardoNPC({
        x: 2400,
        y: 320,
        w: 95,
        h: 155,
        name: "Leonardo de Pisa",
        spriteKey: "ch_leonardo",
        storyKey: "npc_leonardo_pisa",
        minigameKey: "leonardo_razonamiento",
        sceneKey: "leonardo_razonamiento",
        assetsManifest: MN_ASSETS_RAZONAMIENTO,
      });
      this.npcs.push(leo);

      // Añadir NPCs a la escena
      for (const npc of this.npcs) {
        this.add(npc, "actors", "npcs");
      }
    }

    _buildWorldObjects() {
      this.worldObjects = [
        new WorldObject(1250, 300, 130, 120, {
          name: "Barril",
          spriteKey: "obj_barril",
          footWidthRatio: 0.42,
          footHeight: 14,
        }),
        new WorldObject(2220, 300, 125, 110, {
          name: "Cajas",
          spriteKey: "obj_cajas",
          footWidthRatio: 0.5,
          footHeight: 16,
        }),
        new WorldObject(5800, 360, 180, 80, {
          name: "Tronco",
          spriteKey: "obj_tronco",
          footWidthRatio: 0.58,
          footHeight: 12,
        }),
      ];

      for (const obj of this.worldObjects) {
        this.add(obj, "actors", "worldObjects");
      }
    }

    // NPC que solo lanza una escena de novela
    _createStoryNPC({ x, y, w, h, name, spriteKey, storyKey }) {
      const router = window.MN_APP?.router;
      const regNPCs = window.MN_REGISTRY?.npcs || {};

      return new NPC(x, y, w, h, {
        name,
        spriteKey,
        onInteract: (npc, player, scene) => {
          const storyEntry = regNPCs[storyKey];

          if (!storyEntry) {
            console.warn(
              `[Overworld] NPC '${name}' no tiene entrada '${storyKey}' en MN_REGISTRY.npcs`,
            );
            return;
          }

          window.MN_markStorySeen?.(storyKey);

          const r = router || window.MN_APP?.router;
          if (!r || typeof r.pushNovela !== "function") {
            console.warn("[Overworld] router.pushNovela no está disponible");
            return;
          }

          const opts = {
            onAction: (action) => {
              if (action?.type === "CLOSE_NOVELA") {
                window.MN_APP?.router?.popNovela?.();
                return true;
              }

              if (action?.type === "OPEN_SHEET" && action.sheetKey) {
                window.MN_openSheetByKey?.(action.sheetKey);
                return false;
              }

              if (action?.type === "NAVIGATE" && action.href) {
                window.MN_STATE = window.MN_STATE || {};
                const href = String(action.href).toLowerCase();
                const nextArea = href.includes("algebra")
                  ? "algebra"
                  : window.MN_STATE.area || "aritmetica";
                window.MN_STATE.area = nextArea;
                window.MN_stageCurrentStateForNavigation?.(nextArea);
                window.location.href = action.href;
                return true;
              }

              return false;
            },
          };

          r.pushNovela(storyEntry.story, storyEntry.assets, opts);
        },
      });
    }

    // NPC que lanza novela (la primera vez) + minijuego
    _createMinigameNPC({
      x,
      y,
      w,
      h,
      name,
      spriteKey,
      storyKey, // clave en MN_REGISTRY.npcs (puede ser null si no quieres novela)
      minigameKey, // clave en MN_REGISTRY.minigames
      sceneKey, // nombre de escena en sceneManager (si no se pasa, usa minigameKey)
      assetsManifest, // arreglo de assets del minijuego (ej. MN_ASSETS_ESCRIBA)
    }) {
      const router = window.MN_APP?.router;
      const regNPCs = window.MN_REGISTRY?.npcs || {};
      const regMinigames = window.MN_REGISTRY?.minigames || {};

      const finalSceneKey = sceneKey || minigameKey;

      return new NPC(x, y, w, h, {
        name,
        spriteKey,
        getLabelInfo: () => this._getNPCLabelInfo(name, minigameKey),

        onInteract: (npc, player, scene) => {
          const storyEntry = storyKey ? regNPCs[storyKey] : null;
          const miniEntry = regMinigames[minigameKey];

          if (!miniEntry) {
            console.warn(
              `[Overworld] Minijuego '${minigameKey}' no está registrado en MN_REGISTRY.minigames`,
            );
            return;
          }

          const launchMinigame = async () => {
            const manifest = [...assetsManifest, ...MN_ASSETS_SFX_CORE];
            await Promise.all(
              manifest.map((a) => scene.game.assets.loadAsset(a)),
            );
            scene.game.sceneManager.switch(finalSceneKey);
          };

          // Si hay historia y no se ha visto, primero novela
          if (storyEntry && !window.MN_isStorySeen?.(storyKey)) {
            window.MN_markStorySeen?.(storyKey);

            const r = router || window.MN_APP?.router;
            if (!r || typeof r.pushNovela !== "function") {
              console.warn(
                "[Overworld] router.pushNovela no está disponible, lanzando minijuego directo.",
              );
              launchMinigame();
              return;
            }

            r.pushNovela(storyEntry.story, storyEntry.assets, {
              onExit: launchMinigame,
            });
            return;
          }

          // Veces siguientes (o sin historia): ir directo al minijuego
          launchMinigame();
        },
      });
    }

    _createBossLeonardoNPC({
      x,
      y,
      w,
      h,
      name,
      spriteKey,
      storyKey,
      minigameKey,
      sceneKey,
      assetsManifest,
    }) {
      const router = window.MN_APP?.router;
      const regNPCs = window.MN_REGISTRY?.npcs || {};
      const regMinigames = window.MN_REGISTRY?.minigames || {};
      const finalSceneKey = sceneKey || minigameKey;

      const pickLeonardoScene = () => {
        const sheets = window.MN_STATE?.sheets || 0;
        if (sheets >= 16) return "leonardo_perfecto";
        if (sheets >= 11) return "leonardo_aprobado";
        if (sheets >= 10) return "leonardo_reto";
        return "leonardo_bloqueado";
      };

      const ensureAlgebraUnlockedIfNeeded = () => {
        const sheets = window.MN_STATE?.sheets || 0;
        if (sheets >= 11) {
          window.MN_STATE.flags = window.MN_STATE.flags || {};
          window.MN_STATE.flags.algebraUnlocked = true;
        }
      };

      return new NPC(x, y, w, h, {
        name,
        spriteKey,
        getLabelInfo: () => this._getNPCLabelInfo(name, minigameKey),
        onInteract: (npc, player, scene) => {
          const storyEntry = regNPCs[storyKey];
          const miniEntry = regMinigames[minigameKey];
          if (!miniEntry) {
            console.warn(
              `[Overworld] Minijuego '${minigameKey}' no está registrado en MN_REGISTRY.minigames`,
            );
            return;
          }

          // 1) Escoge qué escena mostrar
          const startScene = pickLeonardoScene();

          // 2) Construye un "story view" temporal sin mutar el original
          const bossStory = {
            ...storyEntry.story,
            start: startScene,
          };

          const launchMinigame = async () => {
            const manifest = [...assetsManifest, ...MN_ASSETS_SFX_CORE];
            await Promise.all(
              manifest.map((a) => scene.game.assets.loadAsset(a)),
            );
            scene.game.sceneManager.switch(finalSceneKey);
          };

          const refreshNPCsForUnlock = () => {
            this._lastAlgebraUnlocked = !!window.MN_STATE?.flags?.algebraUnlocked;
            if (typeof this.removeGroup === "function") {
              this.removeGroup("npcs");
            } else {
              for (const old of this.npcs || []) this.remove?.(old);
            }
            this._buildNPCs();
            window.MN_updateLeafHUD?.();
            window.MN_updateProgressHUD?.();

            if (this.player && window.MN_STATE?.flags?.algebraUnlocked) {
              this.player.x = 5480;
              this.player.y = 360;
              this.player.prevX = this.player.x;
              this.player.prevY = this.player.y;
              this.centerCameraOnPlayer?.();
            }
          };

          const r = router || window.MN_APP?.router;
          if (!r || typeof r.pushNovela !== "function") {
            ensureAlgebraUnlockedIfNeeded();
            launchMinigame();
            return;
          }

          // 3) Decide qué pasa al salir
          const sheets = window.MN_STATE?.sheets || 0;
          const flags = (window.MN_STATE.flags = window.MN_STATE.flags || {});
          const bookBound = !!flags.aritmeticaBookBound;

          // Cinemática (cierre) al llegar a 10+ hojas, solo una vez
          const launchBookBindCinematic = () => {
            console.log("Video de cierre lanzado");
            const cinematicEntry = regNPCs["npc_aritmetica_cierre"];
            const r2 = router || window.MN_APP?.router;
            if (!r2 || typeof r2.pushNovela !== "function") return;

            // Si no está registrada la cinemática, al menos marcar flags
            if (!cinematicEntry) {
              flags.algebraUnlocked = true;
              flags.aritmeticaBookBound = true;
              refreshNPCsForUnlock();
              return;
            }

            r2.pushNovela(cinematicEntry.story, cinematicEntry.assets, {
              onExit: () => {
                flags.algebraUnlocked = true;
                flags.aritmeticaBookBound = true;
                refreshNPCsForUnlock();
              },
            });
          };

          let onExit = null;
          if (sheets >= 11 && !bookBound) {
            onExit = () => launchBookBindCinematic();
          } else {
            onExit = () => launchMinigame();            
          }

          const novelaOpts = { skipMode: "exit" };
          if (onExit) novelaOpts.onExit = onExit;
          r.pushNovela(bossStory, storyEntry.assets, novelaOpts);
        },
      });
    }

    _getNPCLabelInfo(name, minigameKey) {
      const rewardMap = window.MN_SHEETS_REWARD?.[minigameKey] || null;
      const unlocked = window.MN_STATE?.sheetsUnlocked || [];
      const rewardKeys = rewardMap
        ? Array.from(new Set(Object.values(rewardMap).filter(Boolean)))
        : [];
      const earned = rewardKeys.filter((key) => unlocked.includes(key)).length;
      const total = rewardKeys.length;
      const skillMap = {
        escriba_muescas: "Conteo y numeracion",
        caja_rapida: "Calculo mental con dinero",
        escalera_sumas: "Sumas mentales",
        galileo_tablas: "Tablas de multiplicar",
        restas_luciernagas: "Restas en la recta numerica",
        mineros_division: "Division como reparto",
        armonia_division: "Division larga",
        chaman_jerarquia: "Jerarquia de operaciones",
        general_signos: "Ley de signos",
        eratostenes_divisores: "Divisibilidad",
        leonardo_razonamiento: "Razonamiento aritmetico",
      };

      return {
        title: name,
        subtitle: skillMap[minigameKey] || "Habilidad aritmetica",
        leafEarned: earned,
        leafTotal: total,
        leafDisplayMode: "iconsOnly",
      };
    }

    // ---------------------------------------------------------------------
    // Asegurar que haya un player válido en el overworld
    // ---------------------------------------------------------------------
    _ensurePlayer() {
      if (!this.player) {
        const checkpoint = window.MN_getCheckpoint?.("aritmetica");
        const startX =
          typeof checkpoint?.playerX === "number" ? checkpoint.playerX : 120;
        const startY =
          typeof checkpoint?.playerY === "number" ? checkpoint.playerY : 360;
        try {
          this.player = new Player(startX, startY);
          this.add(this.player, "actors", "player");
        } catch (e) {
          try {
            const p = new Sprite(startX, startY, 40, 60, "#4caf50");
            this.player = p;
            this.add(p, "player");
          } catch (_) {}
        }
      } else {
        if (typeof this.player.x !== "number") this.player.x = 120;
        if (typeof this.player.y !== "number") this.player.y = 360;
      }

      this.player.onCollision = (other) => {
        if (other?.blocksPlayer) {
          this.player.x = this.player.prevX;
          this.player.y = this.player.prevY;
        }
      };
    }
  }

  window.OverworldScene = OverworldScene;
})();
