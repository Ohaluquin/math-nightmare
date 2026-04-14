(function () {
  class OverworldGeometriaScene extends CoreScene {
    constructor(game, nivelIndex = 0) {
      super(game, nivelIndex);
      this.npcs = [];
      this.worldObjects = [];
      this._initialized = false;
      const bg = this.game.assets?.getImage?.("bg_overworld_geometria");
      if (bg) {
        this.backgroundImage = bg;
        this.bgReady = true;
        this.bgScale = this.game.canvas.height / bg.height;
        this.bgWidth = 3 * bg.width;
      }
      this.bgSpeedFactor = 0;
      this._lastGameCompleted = undefined;
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

      this.game.assets?.playMusic?.("bgm_geometria", { loop: true, volume: 0.2 });
      window.MN_openPendingSheetReward?.();

      const hint = document.getElementById("hint");
      if (hint) hint.textContent = "";

      this._ensurePlayer();

      const completedNow = !!window.MN_STATE?.flags?.gameCompleted;
      if (this._lastGameCompleted === undefined) {
        this._lastGameCompleted = completedNow;
      } else if (completedNow !== this._lastGameCompleted) {
        this._lastGameCompleted = completedNow;
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

      if (!window.MN_STATE?.flags?.tutorialGeometriaShown) {
        window.MN_STATE.flags = window.MN_STATE.flags || {};
        window.MN_STATE.flags.tutorialGeometriaShown = true;

        const overlay = document.getElementById("gameOverlay");
        const msg = document.getElementById("gameMessage");
        if (overlay && msg) {
          msg.innerHTML =
            "Geometria: habla con NPCs para iniciar retos.<br>Controles: Flechas + E";
          overlay.classList.add("show");
          setTimeout(() => overlay.classList.remove("show"), 2600);
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
        window.MN_storeCheckpoint?.("geometria", {
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
      const gameCompleted = !!window.MN_STATE?.flags?.gameCompleted;
      const sofiaPos = gameCompleted
        ? { x: 320, y: 260 }
        : { x: 520, y: 320 };
      const sofiaStoryKey = gameCompleted
        ? "npc_sofia_castillo_ready"
        : "npc_sofia_geometria";

      this.npcs.push(
        this._createStoryNPC({
          x: sofiaPos.x,
          y: sofiaPos.y,
          w: 75,
          h: 130,
          name: "Sofia",
          spriteKey: "ch_sofia",
          storyKey: sofiaStoryKey,
        }),
      );

      const defs = [
        {
          key: "congruencia",
          name: "Lucero",
          x: 900,
          y: 460,
          w: 78,
          h: 132,
          spriteKey: "ch_lucero",
          storyKey: "npc_lucero_congruencia",
          assetsManifest: window.MN_ASSETS_CONGRUENCIA || [],
        },
        {
          key: "deduccion",
          name: "Euclides",
          x: 1420,
          y: 230,
          w: 95,
          h: 152,
          spriteKey: "ch_euclides",
          storyKey: "npc_rey_deduccion",
          assetsManifest: window.MN_ASSETS_DEDUCCION || [],
        },
        {
          key: "angulos",
          name: "Ulises",
          x: 2040,
          y: 460,
          w: 90,
          h: 148,
          spriteKey: "ch_ulises",
          storyKey: "npc_ulises_angulos",
          assetsManifest: window.MN_ASSETS_ANGULOS || [],
        },
        {
          key: "isosceles",
          name: "Lia",
          x: 2705,
          y: 330,
          w: 84,
          h: 135,
          spriteKey: "ch_gemela1",
          storyKey: "npc_gemelas_isosceles",
          assetsManifest: window.MN_ASSETS_ISOSCELES || [],
        },
        {
          key: "isosceles",
          name: "Mia",
          x: 2830,
          y: 330,
          w: 84,
          h: 135,
          spriteKey: "ch_gemela2",
          storyKey: "npc_gemelas_isosceles",
          assetsManifest: window.MN_ASSETS_ISOSCELES || [],
        },
        {
          key: "angulos_ecuaciones",
          name: "Judy",
          x: 3450,
          y: 260,
          w: 88,
          h: 146,
          spriteKey: "ch_judy",
          storyKey: "npc_judy_angulos_ecuaciones",
          assetsManifest: window.MN_ASSETS_ANGULOS_ECUACIONES || [],
        },
        {
          key: "poligonos",
          name: "Arquitecto",
          x: 4005,
          y: 430,
          w: 88,
          h: 156,
          spriteKey: "ch_arquitecto",
          storyKey: "npc_arquitecto_poligonos",
          assetsManifest: window.MN_ASSETS_POLIGONOS || [],
        },
        {
          key: "areas",
          name: "Topografo",
          x: 4620,
          y: 260,
          w: 88,
          h: 146,
          spriteKey: "ch_topografo",
          storyKey: "npc_topografo_areas",
          assetsManifest: window.MN_ASSETS_AREAS || [],
        },
        {
          key: "cartesiano",
          name: "Descartes",
          x: 5135,
          y: 330,
          w: 88,
          h: 156,
          spriteKey: "ch_descartes",
          storyKey: "npc_descartes_cartesiano",
          assetsManifest: window.MN_ASSETS_CARTESIANO || [],
        },
        {
          key: "graficas",
          name: "Galileo",
          x: 5425,
          y: 260,
          w: 95,
          h: 130,
          spriteKey: "ch_galileo",
          storyKey: "npc_galileo_graficas",
          assetsManifest: window.MN_ASSETS_GRAFICAS || [],
        },
        {
          key: "regla_y_compas",
          name: "Aprendiz",
          x: 5770,
          y: 460,
          w: 88,
          h: 146,
          spriteKey: "ch_aprendiz",
          storyKey: "npc_aprendiz_regla_y_compas",
          assetsManifest: window.MN_ASSETS_REGLA_Y_COMPAS || [],
        },
        {
          key: "problemas",
          name: "Pitagoras",
          x: 6120,
          y: 230,
          w: 92,
          h: 150,
          spriteKey: "ch_pitagoras",
          storyKey: "npc_pitagoras_problemas",
          assetsManifest: window.MN_ASSETS_PROBLEMAS || [],
        },
      ];

      for (const d of defs) {
        const createNpc =
          d.key === "problemas"
            ? this._createBossEuclidesNPC.bind(this)
            : this._createMinigameNPC.bind(this);
        this.npcs.push(
          createNpc({
            x: d.x,
            y: d.y,
            w: d.w || 95,
            h: d.h || 140,
            name: d.name,
            spriteKey: d.spriteKey || null,
            storyKey: d.storyKey || null,
            minigameKey: d.key,
            sceneKey: d.key,
            assetsManifest: d.assetsManifest || [],
          }),
        );
      }

      for (const npc of this.npcs) {
        this.add(npc, "actors", "npcs");
      }
    }

    _buildWorldObjects() {
      this.worldObjects = [
        new WorldObject(760, 450, 120, 90, {
          name: "Arbusto",
          spriteKey: "obj_arbusto",
          footWidthRatio: 0.42,
          footHeight: 14,
        }),
        new WorldObject(1440, 520, 80, 65, {
          name: "Roca",
          spriteKey: "obj_roca",
          footWidthRatio: 0.55,
          footHeight: 12,
        }),
        new WorldObject(3240, 470, 105, 85, {
          name: "Roca",
          spriteKey: "obj_roca",
          footWidthRatio: 0.55,
          footHeight: 12,
        }),
        new WorldObject(3590, 405, 85, 65, {
          name: "Roca",
          spriteKey: "obj_roca",
          footWidthRatio: 0.55,
          footHeight: 12,
        }),
        new WorldObject(4680, 255, 92, 118, {
          name: "Letrero",
          spriteKey: "obj_letrero",
          footWidthRatio: 0.32,
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
      const handleStoryAction = (action) => {
        if (action?.type === "CLOSE_NOVELA") {
          window.MN_APP?.router?.popNovela?.();
          return true;
        }

        if (action?.type === "PUSH_STORY" && action.storyKey) {
          const nextStoryEntry = regNPCs[action.storyKey];
          if (!nextStoryEntry?.story || !router?.pushNovela) return false;
          window.MN_APP?.router?.popNovela?.();
          setTimeout(() => {
            router.pushNovela(nextStoryEntry.story, nextStoryEntry.assets || {}, {
              onAction: handleStoryAction,
            });
          }, 0);
          return true;
        }

        if (action?.type === "OPEN_SHEET" && action.sheetKey) {
          window.MN_openSheetByKey?.(action.sheetKey);
          return false;
        }

        if (action?.type === "NAVIGATE" && action.href) {
          const href = String(action.href).toLowerCase();
          if (href.includes("index.html")) {
            try {
              window.sessionStorage?.removeItem?.("MN_PENDING_IMPORT_V1");
            } catch (_) {}
            window.location.href = action.href;
            return true;
          }

          window.MN_STATE = window.MN_STATE || {};
          const nextArea = href.includes("geometria")
            ? "geometria"
            : href.includes("algebra")
              ? "algebra"
              : window.MN_STATE.area || "geometria";
          window.MN_STATE.area = nextArea;
          window.MN_stageCurrentStateForNavigation?.(nextArea);
          window.location.href = action.href;
          return true;
        }

        return false;
      };

      return new NPC(x, y, w, h, {
        name,
        spriteKey,
        onInteract: () => {
          const storyEntry = regNPCs[storyKey];
          if (!storyEntry?.story || !router?.pushNovela) return;

          window.MN_markStorySeen?.(storyKey);
          router.pushNovela(storyEntry.story, storyEntry.assets || {}, {
            onAction: handleStoryAction,
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
      spriteKey = null,
      storyKey = null,
      minigameKey,
      sceneKey,
      assetsManifest,
    }) {
      const router = window.MN_APP?.router;
      const regNPCs = window.MN_REGISTRY?.npcs || {};
      const finalSceneKey = sceneKey || minigameKey;

      return new NPC(x, y, w, h, {
        name,
        spriteKey,
        getLabelInfo: () => this._getNPCLabelInfo(name, minigameKey),
        onInteract: async (npc, player, scene) => {
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

          const storyEntry = storyKey ? regNPCs[storyKey] : null;
          if (storyEntry?.story && !window.MN_isStorySeen?.(storyKey)) {
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

    _createBossEuclidesNPC({
      x,
      y,
      w,
      h,
      name,
      spriteKey = null,
      storyKey = null,
      minigameKey,
      sceneKey,
      assetsManifest,
    }) {
      const router = window.MN_APP?.router;
      const regNPCs = window.MN_REGISTRY?.npcs || {};
      const finalSceneKey = sceneKey || minigameKey;

      const pickBossScene = () => {
        const unlockedSheets = this._countUnlockedGeometrySheets();
        const bestTier =
          window.MN_STATE?.minigames?.[minigameKey]?.bestTier || 0;
        if (bestTier >= 2) return "pitagoras_perfecto";
        if (bestTier >= 1) return "pitagoras_aprobado";
        if (unlockedSheets >= 10) return "pitagoras_reto";
        return "pitagoras_bloqueado";
      };

      return new NPC(x, y, w, h, {
        name,
        spriteKey,
        getLabelInfo: () => this._getNPCLabelInfo(name, minigameKey),
        onInteract: async (npc, player, scene) => {
          const storyEntry = storyKey ? regNPCs[storyKey] : null;

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

          const r = router || window.MN_APP?.router;
          if (!storyEntry?.story || !r || typeof r.pushNovela !== "function") {
            launchMinigame();
            return;
          }

          const bossStory = {
            ...storyEntry.story,
            start: pickBossScene(),
          };

          const flags = (window.MN_STATE.flags = window.MN_STATE.flags || {});
          const bookBound = !!flags.geometriaBookBound;
          const bestTier =
            window.MN_STATE?.minigames?.[minigameKey]?.bestTier || 0;

          const refreshAfterBookBind = () => {
            this._lastGameCompleted = !!flags.gameCompleted;
            if (typeof this.removeGroup === "function") {
              this.removeGroup("npcs");
            } else {
              for (const old of this.npcs || []) this.remove?.(old);
            }
            this._buildNPCs();
            window.MN_updateLeafHUD?.();
            window.MN_updateProgressHUD?.();
            if (this.player && flags.gameCompleted) {
              this.player.x = 5840;
              this.player.y = 360;
              this.player.prevX = this.player.x;
              this.player.prevY = this.player.y;
              this.centerCameraOnPlayer?.();
            }
          };

          const launchClosureScene = () => {
            const closureEntry = regNPCs["npc_geometria_cierre"];
            if (!closureEntry?.story || !r?.pushNovela) {
              flags.geometriaBookBound = true;
              flags.gameCompleted = true;
              refreshAfterBookBind();
              return;
            }

            r.pushNovela(closureEntry.story, closureEntry.assets || {}, {
              onExit: () => {
                flags.geometriaBookBound = true;
                flags.gameCompleted = true;
                refreshAfterBookBind();
              },
            });
          };

          const onExit =
            bestTier >= 1 && !bookBound
              ? () => launchClosureScene()
              : () => launchMinigame();

          r.pushNovela(bossStory, storyEntry.assets || {}, {
            skipMode: "exit",
            onExit,
          });
        },
      });
    }

    _countUnlockedGeometrySheets() {
      const unlocked = new Set(window.MN_STATE?.sheetsUnlocked || []);
      const minigameKeys = [
        "congruencia",
        "deduccion",
        "angulos",
        "isosceles",
        "angulos_ecuaciones",
        "poligonos",
        "areas",
        "cartesiano",
        "graficas",
        "regla_y_compas",
        "problemas",
      ];

      const rewardKeys = new Set();
      for (const key of minigameKeys) {
        const rewards = window.MN_SHEETS_REWARD?.[key];
        if (!rewards) continue;
        for (const sheetKey of Object.values(rewards)) {
          if (typeof sheetKey === "string" && sheetKey.trim()) {
            rewardKeys.add(sheetKey);
          }
        }
      }

      let count = 0;
      for (const sheetKey of rewardKeys) {
        if (unlocked.has(sheetKey)) count += 1;
      }
      return count;
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
        congruencia: "Congruencia y composicion espacial",
        deduccion: "Deduccion",
        angulos: "Medida de angulos",
        isosceles: "Triangulos isosceles",
        angulos_ecuaciones: "Angulos con ecuaciones",
        poligonos: "Propiedades de poligonos",
        perimetro: "Calculo de areas y perimetros",
        areas: "Calculo de areas y perimetros",
        cartesiano: "Plano cartesiano",
        graficas: "Lectura de graficas",
        regla_y_compas: "Construcciones geometricas",
        problemas: "Resolucion de problemas",
      };

      return {
        title: name,
        subtitle: skillMap[minigameKey] || "Habilidad geometrica",
        leafEarned: earned,
        leafTotal: total,
        leafDisplayMode: "iconsOnly",
      };
    }

    _ensurePlayer() {
      if (!this.player) {
        const checkpoint = window.MN_getCheckpoint?.("geometria");
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

  window.OverworldGeometriaScene = OverworldGeometriaScene;
})();
