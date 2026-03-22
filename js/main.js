// main.js – Bootstrap de Math Nightmare con pantalla de título + intro
(function () {
  function initGlobals(game, router) {
    const MN_STATE = window.MN_STATE || {
      nivelActual: 0,
      puntajeTotal: 0,
      flags: {},
      sheets: 0,
      minigames: {},
      sheetsUnlocked: [],
      pendingSheets: [],
      // ✅ nuevo: área actual (aritmetica hoy, algebra mañana)
      area: window.MN_STATE?.area || "aritmetica",
    };

    window.MN_STATE = MN_STATE;
    window.MN_APP = { game, router, state: MN_STATE };

    const iconBox = document.getElementById("input-mode-icon");
    const iconImg = document.getElementById("input-mode-img");

    window.MN_setInputMode = function (mode) {
      if (!iconBox || !iconImg) return;
      if (!mode) {
        iconBox.classList.add("hidden");
        return;
      }
      const game = window.MN_APP?.game;
      if (!game) return;
      let key = null;
      if (mode === "mouse") key = "ui_mouse";
      else if (mode === "keyboard") key = "ui_keyboard";
      if (!key) {
        iconBox.classList.add("hidden");
        return;
      }
      const img = game.assets.getImage(key);
      if (!img) {
        console.warn(`[HUD] Asset ${key} no cargado`);
        iconBox.classList.add("hidden");
        return;
      }
      iconImg.src = img.src;
      iconBox.classList.remove("hidden");
    };

    MN_setInputMode(null);

    // --- HUD de hojas: mostrar / ocultar de forma global ---
    const leafHUD = document.getElementById("leaf-hud");
    function setLeafHUDVisible(visible) {
      if (!leafHUD) return;
      leafHUD.style.display = visible ? "flex" : "none";
    }
    window.MN_setLeafHUDVisible = setLeafHUDVisible;
    setLeafHUDVisible(false);

    // --- API de navegación de alto nivel ---
    MN_APP.toOverworld = function () {
      window.MN_setInputMode?.(null);
      const area = window.MN_AREA;
      const startKey =
        (area &&
          typeof area.getOverworldKey === "function" &&
          area.getOverworldKey()) ||
        "overworld";
      game.sceneManager.switch(startKey);
    };

    MN_APP.toAccion = function (nivelIndex) {
      const index =
        typeof nivelIndex === "number" ? nivelIndex : MN_STATE.nivelActual || 0;
      MN_STATE.nivelActual = index;

      const escenaAccion = new GameScene(game, index);
      router.replace("accion", escenaAccion);
    };

    MN_APP.toNovela = function (entryKey, opts = {}) {
      // ✅ ahora puede ser por área (MN_REGISTRY global o por área)
      const entry =
        window.MN_REGISTRY?.npcs?.[entryKey] ||
        window.MN_REGISTRY?.areas?.[MN_STATE.area]?.npcs?.[entryKey];

      if (!entry) {
        console.warn(
          `[MathNightmare] Entrada de NPC "${entryKey}" no encontrada en registry`
        );
        return;
      }
      router.pushNovela(entry.story, entry.assets, opts);
    };

    // --- Guardado ---
    const saveBtn = document.getElementById("mnSaveBtn");
    function setSaveVisible(visible) {
      if (!saveBtn) return;
      saveBtn.classList.toggle("hidden", !visible);
    }
    window.MN_setSaveVisible = setSaveVisible;
    setSaveVisible(false);

    if (saveBtn) {
      saveBtn.onclick = () => {
        if (window.MN_BOOT?.saveMode !== "file") return;

        if (!window.MN_BOOT.student) {
          const s = prompt(
            "Nombre o ID del alumno/a (para nombrar el archivo):",
            ""
          );
          if (s) window.MN_BOOT.student = s.trim();
        }
        if (!window.MN_BOOT.group) {
          const g = prompt("Grupo (opcional):", "");
          if (g) window.MN_BOOT.group = g.trim();
        }

        if (typeof window.MN_exportSave === "function") {
          window.MN_exportSave({
            student: window.MN_BOOT.student || "",
            group: window.MN_BOOT.group || "",
          });
        } else {
          alert("MN_exportSave no está disponible.");
        }
      };
    }
  }

  window.MN_BOOT = {
    saveMode: "none", // "file" | "none"
    student: "",
    group: "",
  };

  function MN_hideMenu() {
    const el = document.getElementById("mnStartMenu");
    if (el) el.style.display = "none";
    const meta = document.querySelector(".startMeta");
    if (meta) meta.style.display = "none";
  }

  function MN_setAboutModal(open) {
    const modal = document.getElementById("mnAboutModal");
    if (!modal) return;
    modal.classList.toggle("hidden", !open);
    modal.setAttribute("aria-hidden", open ? "false" : "true");
  }

  function MN_isTouchDevice() {
    return (
      window.matchMedia?.("(pointer: coarse)")?.matches ||
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0
    );
  }

  function MN_isPortraitTouchLayout() {
    return (
      MN_isTouchDevice() &&
      !!window.matchMedia?.("(orientation: portrait)")?.matches
    );
  }

  function MN_syncViewportMode() {
    document.body.classList.toggle("mn-touch-device", MN_isTouchDevice());
    document.body.classList.toggle(
      "mn-mobile-portrait",
      MN_isPortraitTouchLayout()
    );
  }

  function MN_setLoadingState(visible, message = "Cargando juego...") {
    const overlay = document.getElementById("mnLoadingOverlay");
    const messageEl = document.getElementById("mnLoadingMessage");
    if (messageEl) messageEl.textContent = message;
    if (!overlay) return;
    overlay.classList.toggle("hidden", !visible);
    overlay.setAttribute("aria-hidden", visible ? "false" : "true");
  }

  const MN_NUMERIC_TOUCH_SCENES = new Set([
    "caja_rapida",
    "escalera_sumas",
    "restas_luciernagas",
    "galileo_tablas",
    "leonardo_razonamiento",
    "eratostenes_divisores",
  ]);

  function MN_isNumericTouchScene(sceneKey) {
    return MN_NUMERIC_TOUCH_SCENES.has(sceneKey);
  }

  function MN_getTouchProfile(sceneKey, override = null) {
    const isOverworld = !!sceneKey && sceneKey.startsWith("overworld");
    const isNumeric = MN_isNumericTouchScene(sceneKey);
    const base = {
      movement: isOverworld,
      actions: !!sceneKey && sceneKey !== "title" && sceneKey !== "novela",
      numpad: isNumeric,
      layout: !isOverworld && isNumeric ? "split" : "default",
      numpadKeys: null,
      expanded: {
        movement: isOverworld,
        actions: true,
        numpad: isNumeric,
      },
    };

    if (sceneKey === "eratostenes_divisores") {
      base.movement = true;
      base.actions = true;
      base.numpad = true;
      base.layout = "triad";
      base.numpadKeys = ["1", "2", "3", "5", "7", "Enter"];
    }

    if (sceneKey === "caja_rapida") {
      base.layout = "split";
    }

    if (!override || typeof override !== "object") return base;

    return {
      movement:
        typeof override.movement === "boolean"
          ? override.movement
          : base.movement,
      actions:
        typeof override.actions === "boolean" ? override.actions : base.actions,
      numpad:
        typeof override.numpad === "boolean" ? override.numpad : base.numpad,
      layout:
        typeof override.layout === "string" ? override.layout : base.layout,
      numpadKeys: Array.isArray(override.numpadKeys)
        ? override.numpadKeys
        : base.numpadKeys,
      expanded: {
        movement:
          typeof override.expanded?.movement === "boolean"
            ? override.expanded.movement
            : base.expanded.movement,
        actions:
          typeof override.expanded?.actions === "boolean"
            ? override.expanded.actions
            : base.expanded.actions,
        numpad:
          typeof override.expanded?.numpad === "boolean"
            ? override.expanded.numpad
            : base.expanded.numpad,
      },
    };
  }

  function MN_initTouchControls(game) {
    const root = document.getElementById("mnTouchControls");
    if (!root || !game?.input || !MN_isTouchDevice()) return;

    const input = game.input;
    const dirButtons = root.querySelectorAll("[data-touch-key]");
    const tapButtons = root.querySelectorAll("[data-touch-tap-key]");
    const toggleButtons = root.querySelectorAll("[data-touch-toggle]");
    const wrappers = {
      movement: root.querySelector('[data-touch-group-wrap="movement"]'),
      actions: root.querySelector('[data-touch-group-wrap="actions"]'),
      numpad: root.querySelector('[data-touch-group-wrap="numpad"]'),
    };
    const panels = {
      movement: root.querySelector('[data-touch-panel="movement"]'),
      actions: root.querySelector('[data-touch-panel="actions"]'),
      numpad: root.querySelector('[data-touch-panel="numpad"]'),
    };
    const numpadButtons = root.querySelectorAll(
      '[data-touch-panel="numpad"] [data-touch-tap-key]'
    );
    const state = {
      override: null,
      expanded: {
        movement: true,
        actions: true,
        numpad: false,
      },
    };

    const setPanelExpanded = (name, expanded) => {
      state.expanded[name] = !!expanded;
      const panel = panels[name];
      const toggle = root.querySelector(`[data-touch-toggle="${name}"]`);
      if (panel) {
        panel.classList.toggle("is-collapsed", !expanded);
        panel.setAttribute("aria-hidden", expanded ? "false" : "true");
      }
      if (toggle) {
        toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
      }
    };

    const setGroupVisible = (name, visible) => {
      const wrap = wrappers[name];
      if (!wrap) return;
      wrap.classList.toggle("hidden", !visible);
      if (!visible) setPanelExpanded(name, false);
    };

    const setLayout = (layout) => {
      root.classList.toggle("touch-controls--split", layout === "split");
      root.classList.toggle("touch-controls--triad", layout === "triad");
    };

    const setNumpadKeys = (allowedKeys) => {
      const allowed = Array.isArray(allowedKeys) ? new Set(allowedKeys) : null;
      numpadButtons.forEach((btn) => {
        const primaryKey = btn.dataset.touchTapKey?.split(",")?.[0] || "";
        const visible = !allowed || allowed.has(primaryKey);
        btn.classList.toggle("hidden", !visible);
      });
    };

    const applyProfile = (sceneKey = game.sceneManager?.currentKey) => {
      const profile = MN_getTouchProfile(sceneKey, state.override);
      setLayout(profile.layout || "default");
      setNumpadKeys(profile.numpadKeys || null);
      setGroupVisible("movement", profile.movement);
      setGroupVisible("actions", profile.actions);
      setGroupVisible("numpad", profile.numpad);

      if (profile.movement) {
        setPanelExpanded("movement", profile.expanded.movement);
      }
      if (profile.actions) {
        setPanelExpanded("actions", profile.expanded.actions);
      }
      if (profile.numpad) {
        setPanelExpanded("numpad", profile.expanded.numpad);
      }
    };

    const releaseAllDirections = () => {
      dirButtons.forEach((btn) => {
        const key = btn.dataset.touchKey;
        if (key) input.setVirtualKey(key, false);
        btn.classList.remove("is-pressed");
      });
    };

    dirButtons.forEach((btn) => {
      const key = btn.dataset.touchKey;
      if (!key) return;

      const press = (event) => {
        event.preventDefault();
        input.setVirtualKey(key, true);
        btn.classList.add("is-pressed");
      };

      const release = (event) => {
        event.preventDefault();
        input.setVirtualKey(key, false);
        btn.classList.remove("is-pressed");
      };

      btn.addEventListener("pointerdown", press);
      btn.addEventListener("pointerup", release);
      btn.addEventListener("pointercancel", release);
      btn.addEventListener("pointerleave", release);
    });

    toggleButtons.forEach((btn) => {
      const name = btn.dataset.touchToggle;
      if (!name) return;

      btn.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        btn.classList.add("is-pressed");
      });

      btn.addEventListener("pointerup", (event) => {
        event.preventDefault();
        btn.classList.remove("is-pressed");
        setPanelExpanded(name, !state.expanded[name]);
      });

      btn.addEventListener("pointercancel", () => {
        btn.classList.remove("is-pressed");
      });
    });

    tapButtons.forEach((btn) => {
      const keyMap = btn.dataset.touchTapKey;
      if (!keyMap) return;
      const keys = keyMap
        .split(",")
        .map((key) => key.trim())
        .filter(Boolean)
        .map((key) => (key === "_SPACE_" ? " " : key));

      btn.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        btn.classList.add("is-pressed");
      });

      btn.addEventListener("pointerup", (event) => {
        event.preventDefault();
        btn.classList.remove("is-pressed");
        input.tapVirtualKeys(keys);
      });

      btn.addEventListener("pointercancel", () => {
        btn.classList.remove("is-pressed");
      });
    });

    window.MN_configureTouchControls = function (override = null) {
      state.override = override;
      applyProfile();
    };

    window.MN_refreshTouchControls = function (sceneKey) {
      applyProfile(sceneKey);
    };

    window.addEventListener("blur", releaseAllDirections);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) releaseAllDirections();
    });

    applyProfile();
  }

  function MN_setTouchControlsVisible(visible) {
    const root = document.getElementById("mnTouchControls");
    if (!root || !MN_isTouchDevice()) return;
    const nextVisible = !!visible;
    root.classList.toggle("hidden", !visible);
    root.setAttribute("aria-hidden", visible ? "false" : "true");
    if (nextVisible) {
      window.MN_refreshTouchControls?.();
    }
  }

  function MN_resetState() {
    window.MN_STATE = {
      nivelActual: 0,
      puntajeTotal: 0,
      flags: {},
      sheets: 0,
      minigames: {},
      sheetsUnlocked: [],
      pendingSheets: [],
      area: window.MN_STATE?.area || "aritmetica", // ✅ persistir área si ya estaba
    };
    if (window.MN_APP) window.MN_APP.state = window.MN_STATE;
    if (window.MN_updateLeafHUD) window.MN_updateLeafHUD();
  }

  async function MN_startFlow() {
    window.MN_setSaveVisible?.(false);
    MN_hideMenu();
    MN_setTouchControlsVisible(true);
    if (typeof window.MN_APP.startNewGame === "function") {
      window.MN_APP.startNewGame();
    }
  }

  const btnNew = document.getElementById("mnBtnNew");
  const btnAbout = document.getElementById("mnBtnAbout");
  const aboutClose = document.getElementById("mnAboutClose");
  const aboutModal = document.getElementById("mnAboutModal");
  const btnGuest = document.getElementById("mnBtnGuest");
  const btnLoad = document.getElementById("mnBtnLoad");

  if (btnNew) btnNew.onclick = () => {
    window.MN_BOOT.saveMode = "none";
    MN_resetState();
    MN_startFlow();
  };

  if (btnAbout) btnAbout.onclick = () => MN_setAboutModal(true);
  if (aboutClose) aboutClose.onclick = () => MN_setAboutModal(false);
  if (aboutModal) {
    aboutModal.addEventListener("click", (event) => {
      if (event.target?.dataset?.closeAbout === "true") {
        MN_setAboutModal(false);
      }
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      MN_setAboutModal(false);
    }
  });

  if (btnGuest) btnGuest.onclick = () => {
    window.MN_BOOT.saveMode = "none";
    MN_resetState();
    MN_startFlow();
  };

  if (btnLoad) btnLoad.onclick = () => {
    const input = document.getElementById("mnImport");
    input.value = "";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const data = await window.MN_importSaveFromFile(file);
        window.MN_BOOT.saveMode = "file";
        window.MN_BOOT.student = data.student || "";
        window.MN_BOOT.group = data.group || "";
        // si guardas el área en el save, respétala:
        if (data.state?.area) window.MN_STATE.area = data.state.area;
        MN_startFlow();
      } catch (e) {
        alert("Error al cargar: " + e.message);
      }
    };
    if (window.MN_updateLeafHUD) window.MN_updateLeafHUD();
    window.MN_APP.state = window.MN_STATE;
    input.click();
  };

  function startMathNightmare() {
    MN_syncViewportMode();
    MN_setLoadingState(
      true,
      "Cargando juego... En móvil puede tardar unos segundos."
    );
    const canvas = document.getElementById("gameCanvas");
    if (!canvas) {
      console.error("[MathNightmare] No se encontró el canvas #gameCanvas");
      MN_setLoadingState(true, "No se pudo iniciar el juego.");
      return;
    }

    const game = new Game("gameCanvas", 1020, 680, 60);
    window.MN_GAME = game;
    const router = new SceneRouter(game);
    MN_initTouchControls(game);

    const originalSceneSwitch = game.sceneManager.switch.bind(game.sceneManager);
    game.sceneManager.switch = function (name) {
      const didSwitch = originalSceneSwitch(name);
      if (didSwitch) window.MN_refreshTouchControls?.(game.sceneManager.currentKey);
      return didSwitch;
    };

    initGlobals(game, router);

    // Manifest desde assets.js (const MATHNM_ASSETS)
    const manifest = [
      ...(window.MATHNM_ASSETS || []),
      ...(window.MN_ASSETS_SHEETS || []),
    ];

    game
      .start(manifest)
      .then(() => {
        MN_setLoadingState(false);

        // 1) Escenas base (siempre)
        const titleScene = new TitleScene(game);
        game.sceneManager.register("title", titleScene);

        // 2) Registrar área actual (aritmetica hoy)
        if (!window.MN_AREA || typeof window.MN_AREA.register !== "function") {
          MN_setLoadingState(true, "Falta configurar el área actual del juego.");
          console.error(
            "[MathNightmare] MN_AREA no está definido o no tiene register(game). " +
              "Asegúrate de cargar js/areas/<area>/area.js en index.html antes de main.js"
          );
          return;
        }

        window.MN_AREA.register(game, router);

        // 3) Empezar en título

        // 4) Nueva partida: intro del área -> overworld del área
        window.MN_APP.startNewGame = function () {
          const area = window.MN_AREA;

          // tomar intro del área (preferente), si no, usar global
          const introEntry =
            (area &&
              typeof area.getIntroEntry === "function" &&
              area.getIntroEntry()) ||
            window.MN_REGISTRY?.intro;

          if (introEntry && introEntry.story) {
            router.pushNovela(introEntry.story, introEntry.assets || {}, {
              onExit: () => window.MN_APP.toOverworld(),
            });
          } else {
            console.warn(
              "[MathNightmare] No se encontró intro del área; saltando directo al overworld."
            );
            window.MN_APP.toOverworld();
          }
        };

        // 3) Inicio normal vs inicio directo (sin menu/titulo/intro)
        const skipStartMenu = !!window.MN_PAGE_CONFIG?.skipStartMenu;
        if (skipStartMenu) {
          MN_hideMenu();
          window.MN_BOOT.saveMode = "none";
          MN_setTouchControlsVisible(true);
          window.MN_APP.toOverworld();
        } else {
          MN_setTouchControlsVisible(false);
          game.sceneManager.switch("title");
        }
      })
      .catch((err) => {
        MN_setLoadingState(true, "Hubo un problema al cargar el juego.");
        console.error("[MathNightmare] Error al iniciar el juego:", err);
      });
  }

  // API: abrir hoja por key (el visor maneja navegación/zoom/close)
  window.MN_openSheetByKey = function (sheetKey) {
    const modal = document.getElementById("sheet-modal");
    const img = document.getElementById("sheet-img");
    if (!modal || !img) return;

    const asset = window.MN_GAME?.assets?.getImage(sheetKey);
    if (!asset) {
      console.warn("Hoja no encontrada:", sheetKey);
      return;
    }

    img.src = asset.src;
    modal.classList.remove("hidden");
    window.MN_resetSheetView?.();
    window.MN_updateBookNav?.();
  };

  window.addEventListener("resize", MN_syncViewportMode);
  window.addEventListener("orientationchange", MN_syncViewportMode);

  document.addEventListener("DOMContentLoaded", startMathNightmare);
})();
