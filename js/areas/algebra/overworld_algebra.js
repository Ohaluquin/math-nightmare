(function () {
  class OverworldAlgebraScene extends CoreScene {
    constructor(game, nivelIndex = 0) {
      super(game, nivelIndex);
      this.npcs = [];
      this.worldObjects = [];
      this._initialized = false;
      this.bgSpeedFactor = 0;
      this._lastGeometriaUnlocked = undefined;
      this.depthScaleMinY = 230;
      this.depthScaleMaxY = 480;
      this.depthScaleFar = 0.74;
      this.depthScaleNear = 1;
    }

    init() {
      if (!this._initialized) {
        super.init();
        this._buildNPCs();
        this._buildWorldObjects();
        this._initialized = true;
      }

      this.game.assets?.playMusic?.("bgm_algebra", { loop: true, volume: 0.2 });
      window.MN_openPendingSheetReward?.();

      const hint = document.getElementById("hint");
      if (hint) hint.textContent = "";

      this._ensurePlayer();

      const unlockedNow = !!window.MN_STATE?.flags?.geometriaUnlocked;
      if (this._lastGeometriaUnlocked === undefined) {
        this._lastGeometriaUnlocked = unlockedNow;
      } else if (unlockedNow !== this._lastGeometriaUnlocked) {
        this._lastGeometriaUnlocked = unlockedNow;
        if (typeof this.removeGroup === "function") {
          this.removeGroup("npcs");
        } else {
          for (const old of this.npcs || []) this.remove?.(old);
        }
        this._buildNPCs();
      }

      if (window.MN_setLeafHUDVisible) {
        window.MN_setLeafHUDVisible(true);
      }
      window.MN_updateLeafHUD?.();

      if (!window.MN_STATE?.flags?.tutorialAlgebraShown) {
        window.MN_STATE.flags = window.MN_STATE.flags || {};
        window.MN_STATE.flags.tutorialAlgebraShown = true;

        const overlay = document.getElementById("gameOverlay");
        const msg = document.getElementById("gameMessage");
        if (overlay && msg) {
          msg.innerHTML = "Moverse: Flechas<br>Hablar con NPCs: E";
          overlay.classList.add("show");
          setTimeout(() => overlay.classList.remove("show"), 2500);
        }
      }
    }

    draw(ctx) {
      const actors = this.layers.get("actors");
      if (actors) {
        actors.sort((a, b) => {
          const ay = (a.y || 0) + (a.height || 0);
          const by = (b.y || 0) + (b.height || 0);
          return ay - by;
        });
      }

      super.draw(ctx);
    }

    update(dt) {
      super.update(dt);
      if (this.player) {
        window.MN_storeCheckpoint?.("algebra", {
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
      return (
        this.depthScaleFar + (this.depthScaleNear - this.depthScaleFar) * t
      );
    }

    _buildNPCs() {
      this.npcs = [];
      const geometriaUnlocked = !!window.MN_STATE?.flags?.geometriaUnlocked;
      const sofiaPos = geometriaUnlocked
        ? { x: 6050, y: 420 }
        : { x: 520, y: 320 };
      const sofiaStoryKey = geometriaUnlocked
        ? "npc_sofia_geometria_gate"
        : "npc_sofia_algebra";

      this.npcs.push(
        this._createStoryNPC({
          x: sofiaPos.x,
          y: sofiaPos.y,
          w: 80,
          h: 120,
          name: "Sofia",
          spriteKey: "ch_sofia",
          storyKey: sofiaStoryKey,
        }),
      );

      this.npcs.push(
        this._createMinigameNPC({
          x: 1200,
          y: 430,
          w: 80,
          h: 120,
          name: "Felipon el Confundido",
          spriteKey: "ch_felipon",
          storyKey: "npc_felipon_conceptos",
          minigameKey: "anagrama",
          sceneKey: "anagrama",
          assetsManifest: window.MN_ASSETS_ANAGRAMA || [],
        }),
      );

      this.npcs.push(
        this._createMinigameNPC({
          x: 1700,
          y: 220,
          w: 80,
          h: 130,
          name: "Bodeguero",
          spriteKey: "ch_bodeguero",
          storyKey: "npc_bodeguero_balanza",
          minigameKey: "balanza",
          sceneKey: "balanza",
          assetsManifest: window.MN_ASSETS_BALANZA || [],
        }),
      );

      this.npcs.push(
        this._createMinigameNPC({
          x: 2200,
          y: 450,
          w: 85,
          h: 135,
          name: "Brahmagupta",
          spriteKey: "ch_brahmagupta",
          storyKey: "npc_brahmagupta_enigmas",
          minigameKey: "brahmagupta_enigmas",
          sceneKey: "brahmagupta_enigmas",
          assetsManifest: window.MN_ASSETS_BRAHMAGUPTA || [],
        }),
      );

      this.npcs.push(
        this._createMinigameNPC({
          x: 2800,
          y: 220,
          w: 60,
          h: 100,
          name: "Mateo",
          spriteKey: "ch_mateo",
          storyKey: "npc_tadeo_terminos_semejantes",
          minigameKey: "incrementos",
          sceneKey: "incrementos",
          assetsManifest: window.MN_ASSETS_TERMINOS_SEMEJANTES || [],
        }),
      );

      this.npcs.push(
        this._createMinigameNPC({
          x: 3400,
          y: 430,
          w: 85,
          h: 135,
          name: "Silvano el Guía",
          spriteKey: "ch_silvano",
          storyKey: "npc_silvano_lenguaje_natural",
          minigameKey: "lenguaje_natural",
          sceneKey: "lenguaje_natural",
          assetsManifest: window.MN_ASSETS_LENGUAJE_NATURAL || [],
        }),
      );

      this.npcs.push(
        this._createMinigameNPC({
          x: 4000,
          y: 280,
          w: 80,
          h: 120,
          name: "Ariadna",
          spriteKey: "ch_ariadna",
          storyKey: "npc_ariadna_sustitucion_laberinto",
          minigameKey: "algebra_sustitucion_laberinto",
          sceneKey: "algebra_sustitucion_laberinto",
          assetsManifest: window.MN_ASSETS_SUSTITUCION_MINOTAURO || [],
        }),
      );

      this.npcs.push(
        this._createMinigameNPC({
          x: 4600,
          y: 260,
          w: 78,
          h: 118,
          name: "Howdin",
          spriteKey: "ch_howdin",
          storyKey: "npc_howdin_cerrajero",
          minigameKey: "despejes",
          sceneKey: "despejes",
          assetsManifest: window.MN_ASSETS_DESPEJES || [],
        }),
      );

      this.npcs.push(
        this._createBossAlJuarizmiNPC({
          x: 5200,
          y: 460,
          w: 85,
          h: 140,
          name: "Al-Juarismi",
          spriteKey: "ch_aljuarismi",
          storyKey: "npc_aljuarismi_balanceo",
          minigameKey: "balanceo_ecuaciones",
          sceneKey: "balanceo_ecuaciones",
          assetsManifest: window.MN_ASSETS_BALANCEO_ECUACIONES || [],
        }),
      );

      this.npcs.push(
        this._createMinigameNPC({
          x: 5800,
          y: 230,
          w: 75,
          h: 115,
          name: "Clara",
          spriteKey: "ch_clara",
          storyKey: "npc_clara_modelar",
          minigameKey: "modelar",
          sceneKey: "modelar",
          assetsManifest: window.MN_ASSETS_MODELAR || [],
        }),
      );

      for (const npc of this.npcs) {
        this.add(npc, "actors", "npcs");
      }
    }

    _buildWorldObjects() {
      this.worldObjects = [
        new WorldObject(1460, 570, 250, 120, {
          name: "Roca",
          spriteKey: "obj_roca",
          footWidthRatio: 0.5,
          footHeight: 14,
        }),
        new WorldObject(2050, 550, 220, 100, {
          name: "Arbusto",
          spriteKey: "obj_arbusto",
          footWidthRatio: 0.45,
          footHeight: 14,
        }),
        new WorldObject(2470, 320, 150, 50, {
          name: "Flores",
          spriteKey: "obj_flores",
          footWidthRatio: 0.38,
          footHeight: 12,
        }),
        new WorldObject(3060, 570, 300, 120, {
          name: "Roca",
          spriteKey: "obj_roca",
          footWidthRatio: 0.5,
          footHeight: 14,
        }),
        new WorldObject(3500, 240, 200, 70, {
          name: "Arbusto",
          spriteKey: "obj_arbusto",
          footWidthRatio: 0.45,
          footHeight: 14,
        }),
        new WorldObject(4120, 260, 180, 80, {
          name: "Arbusto",
          spriteKey: "obj_arbusto",
          footWidthRatio: 0.45,
          footHeight: 14,
        }),
        new WorldObject(4800, 525, 140, 60, {
          name: "Arbusto",
          spriteKey: "obj_flores",
          footWidthRatio: 0.45,
          footHeight: 14,
        }),
        new WorldObject(5100, 350, 90, 115, {
          name: "Letrero",
          spriteKey: "obj_letrero",
          footWidthRatio: 0.32,
          footHeight: 14,
        }),
        new WorldObject(5650, 470, 200, 80, {
          name: "Roca",
          spriteKey: "obj_roca",
          footWidthRatio: 0.52,
          footHeight: 14,
        }),
      ];

      for (const obj of this.worldObjects) {
        this.add(obj, "actors", "worldObjects");
      }
    }

    _createStoryNPC({ x, y, w, h, name, spriteKey, storyKey }) {
      const regNPCs = window.MN_REGISTRY?.npcs || {};
      const router = window.MN_APP?.router;

      return new NPC(x, y, w, h, {
        name,
        spriteKey,
        onInteract: () => {
          const storyEntry = regNPCs[storyKey];
          if (!storyEntry?.story || !router?.pushNovela) return;

          window.MN_markStorySeen?.(storyKey);
          router.pushNovela(storyEntry.story, storyEntry.assets || {}, {
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
                const nextArea = href.includes("geometria")
                  ? "geometria"
                  : href.includes("algebra")
                    ? "algebra"
                    : window.MN_STATE.area || "algebra";
                window.MN_STATE.area = nextArea;
                window.MN_stageCurrentStateForNavigation?.(nextArea);
                window.location.href = action.href;
                return true;
              }

              return false;
            },
          });
        },
      });
    }

    _getAlgebraSheetKeys() {
      return Array.from(
        new Set(
          Object.entries(window.MN_SHEETS_REWARD || {})
            .filter(([_, rewardMap]) =>
              Object.values(rewardMap || {}).some(
                (sheetKey) =>
                  typeof sheetKey === "string" &&
                  sheetKey.startsWith("sheet_algebra_"),
              ),
            )
            .flatMap(([_, rewardMap]) => Object.values(rewardMap || {}))
            .filter(
              (sheetKey) =>
                typeof sheetKey === "string" &&
                sheetKey.startsWith("sheet_algebra_"),
            ),
        ),
      );
    }

    _countUnlockedAlgebraSheets() {
      const unlocked = window.MN_STATE?.sheetsUnlocked || [];
      const algebraKeys = this._getAlgebraSheetKeys();
      return algebraKeys.filter((key) => unlocked.includes(key)).length;
    }

    _createBossAlJuarizmiNPC({
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

      const pickBossScene = () => {
        const algebraSheets = this._countUnlockedAlgebraSheets();
        const totalAlgebraSheets = this._getAlgebraSheetKeys().length;
        if (algebraSheets >= totalAlgebraSheets) return "aljuarismi_perfecto";
        if (algebraSheets >= 6) return "aljuarismi_aprobado";
        if (algebraSheets >= 5) return "aljuarismi_reto";
        return "aljuarismi_bloqueado";
      };

      return new NPC(x, y, w, h, {
        name,
        spriteKey,
        getLabelInfo: () => this._getNPCLabelInfo(name, minigameKey),
        onInteract: (npc, player, scene) => {
          const storyEntry = regNPCs[storyKey];
          const miniEntry = regMinigames[minigameKey];
          if (!miniEntry || !storyEntry?.story) {
            console.warn(
              `[Overworld Algebra] Boss '${minigameKey}' no registrado correctamente.`,
            );
            return;
          }

          const bossStory = {
            ...storyEntry.story,
            start: pickBossScene(),
          };

          const launchMinigame = async () => {
            const manifest = [
              ...(assetsManifest || []),
              ...(window.MN_ASSETS_SFX_CORE || []),
            ];
            await Promise.all(
              manifest.map((a) => scene.game.assets.loadAsset(a)),
            );
            scene.game.sceneManager.switch(finalSceneKey);
          };

          const refreshNPCsForUnlock = () => {
            this._lastGeometriaUnlocked =
              !!window.MN_STATE?.flags?.geometriaUnlocked;
            if (typeof this.removeGroup === "function") {
              this.removeGroup("npcs");
            } else {
              for (const old of this.npcs || []) this.remove?.(old);
            }
            this._buildNPCs();
            window.MN_updateLeafHUD?.();
            window.MN_updateProgressHUD?.();
          };

          const launchBookBindScene = () => {
            const closureEntry = regNPCs["npc_algebra_cierre"];
            if (!closureEntry?.story || !router?.pushNovela) {
              window.MN_STATE.flags = window.MN_STATE.flags || {};
              window.MN_STATE.flags.geometriaUnlocked = true;
              window.MN_STATE.flags.algebraBookBound = true;
              refreshNPCsForUnlock();
              return;
            }

            router.pushNovela(closureEntry.story, closureEntry.assets || {}, {
              onExit: () => {
                window.MN_STATE.flags = window.MN_STATE.flags || {};
                window.MN_STATE.flags.geometriaUnlocked = true;
                window.MN_STATE.flags.algebraBookBound = true;
                refreshNPCsForUnlock();
              },
            });
          };

          const r = router || window.MN_APP?.router;
          if (!r || typeof r.pushNovela !== "function") {
            launchMinigame();
            return;
          }

          const algebraSheets = this._countUnlockedAlgebraSheets();
          const flags = (window.MN_STATE.flags = window.MN_STATE.flags || {});
          const bookBound = !!flags.algebraBookBound;

          let onExit = null;
          if (algebraSheets >= 6 && !bookBound)
            onExit = () => launchBookBindScene();
          else onExit = () => launchMinigame();

          r.pushNovela(bossStory, storyEntry.assets || {}, {
            skipMode: "exit",
            onExit,
          });
        },
      });
    }

    _createMinigameNPC({
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

      return new NPC(x, y, w, h, {
        name,
        spriteKey,
        getLabelInfo: () => this._getNPCLabelInfo(name, minigameKey),
        onInteract: async (npc, player, scene) => {
          const storyEntry = storyKey ? regNPCs[storyKey] : null;
          const miniEntry = regMinigames[minigameKey];
          if (!miniEntry) {
            console.warn(
              `[Overworld Algebra] Minijuego '${minigameKey}' no registrado.`,
            );
            return;
          }

          const launchMinigame = async () => {
            const manifest = [
              ...(assetsManifest || []),
              ...(window.MN_ASSETS_SFX_CORE || []),
            ];

            await Promise.all(
              manifest.map((a) => scene.game.assets.loadAsset(a)),
            );
            scene.game.sceneManager.switch(finalSceneKey);
          };

          if (storyEntry && !window.MN_isStorySeen?.(storyKey)) {
            window.MN_markStorySeen?.(storyKey);
            const r = router || window.MN_APP?.router;
            if (!r || typeof r.pushNovela !== "function") {
              launchMinigame();
              return;
            }
            r.pushNovela(storyEntry.story, storyEntry.assets || {}, {
              onExit: launchMinigame,
            });
            return;
          }

          launchMinigame();
        },
      });
    }

    _getNPCLabelInfo(name, minigameKey) {
      const rewardMap = window.MN_SHEETS_REWARD?.[minigameKey] || null;
      const state = window.MN_STATE || {};
      const unlocked = state.sheetsUnlocked || [];
      const rewardKeys = rewardMap
        ? Array.from(new Set(Object.values(rewardMap).filter(Boolean)))
        : [];
      const earned = rewardKeys.filter((key) => unlocked.includes(key)).length;
      const total = rewardKeys.length;
      const skillMap = {
        anagrama: "Conceptos algebraicos",
        balanza: "Equilibrio e igualdad",
        brahmagupta_enigmas: "Enigmas del número",
        lenguaje_natural: "Traduccion algebraica",
        algebra_sustitucion_laberinto: "Sustitucion y evaluacion",
        incrementos: "Terminos semejantes",
        despejes: "Despeje de ecuaciones",
        balanceo_ecuaciones: "Resolucion de ecuaciones",
        modelar: "Modelado algebraico",
      };

      return {
        title: name,
        subtitle: skillMap[minigameKey] || "Habilidad algebraica",
        leafEarned: earned,
        leafTotal: total,
        leafDisplayMode: "iconsOnly",
      };
    }

    _ensurePlayer() {
      if (!this.player) {
        const checkpoint = window.MN_getCheckpoint?.("algebra");
        const startX =
          typeof checkpoint?.playerX === "number" ? checkpoint.playerX : 120;
        const startY =
          typeof checkpoint?.playerY === "number" ? checkpoint.playerY : 360;
        this.player = new Player(startX, startY);
        this.add(this.player, "actors", "player");
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

  window.OverworldAlgebraScene = OverworldAlgebraScene;
})();
