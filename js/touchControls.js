(function () {
  const DEBUG_STORAGE_KEY = "mnTouchControlsDebug";
  const DEBUG_QUERY_KEY = "touchcontrols";

  const NUMERIC_TOUCH_SCENES = new Set([
    "caja_rapida",
    "escalera_sumas",
    "restas_luciernagas",
    "galileo_tablas",
    "leonardo_razonamiento",
    "eratostenes_divisores",
  ]);

  const QUICK_NUMPAD_SCENES = new Set([
    "caja_rapida",
    "escalera_sumas",
    "galileo_tablas",
    "leonardo_razonamiento",
    "restas_luciernagas",
  ]);

  const ESC_ONLY_SCENES = new Set([
    "armonia_division",
    "chaman_jerarquia",
    "general_signos",
  ]);

  const OK_ESC_SCENES = new Set(["mineros_division"]);

  const GROUP_DEFS = {
    movement: {
      wrapClass: "touch-controls__cluster touch-controls__cluster--left",
      toggleLabel: "Mover",
      panelClass: "touch-panel touch-panel--dpad",
      items: [
        { type: "hold", className: "touch-btn touch-btn--up", key: "ArrowUp", label: "Arriba" },
        { type: "hold", className: "touch-btn touch-btn--left", key: "ArrowLeft", label: "Izq." },
        { type: "hold", className: "touch-btn touch-btn--right", key: "ArrowRight", label: "Der." },
        { type: "hold", className: "touch-btn touch-btn--down", key: "ArrowDown", label: "Abajo" },
      ],
    },
    actions: {
      wrapClass: "touch-controls__cluster",
      toggleLabel: "Acciones",
      panelClass: "touch-panel touch-panel--actions",
      items: [
        { type: "tap", className: "touch-btn touch-btn--action", keyMap: "e,E,KeyE", keyId: "e", label: "Hablar" },
        { type: "tap", className: "touch-btn touch-btn--space", keyMap: "_SPACE_,Space,Spacebar", keyId: "_SPACE_", label: "Espacio" },
        { type: "tap", className: "touch-btn touch-btn--confirm", keyMap: "Enter", keyId: "Enter", label: "OK" },
        { type: "tap", className: "touch-btn touch-btn--escape", keyMap: "Escape", keyId: "Escape", label: "ESC" },
      ],
    },
    numpad: {
      wrapClass: "touch-controls__cluster",
      toggleLabel: "123",
      panelClass: "touch-panel touch-panel--numpad is-collapsed",
      ariaHidden: "true",
      items: [
        { type: "tap", className: "touch-btn", keyMap: "1", keyId: "1", label: "1" },
        { type: "tap", className: "touch-btn", keyMap: "2", keyId: "2", label: "2" },
        { type: "tap", className: "touch-btn", keyMap: "3", keyId: "3", label: "3" },
        { type: "tap", className: "touch-btn", keyMap: "4", keyId: "4", label: "4" },
        { type: "tap", className: "touch-btn", keyMap: "5", keyId: "5", label: "5" },
        { type: "tap", className: "touch-btn", keyMap: "6", keyId: "6", label: "6" },
        { type: "tap", className: "touch-btn", keyMap: "7", keyId: "7", label: "7" },
        { type: "tap", className: "touch-btn", keyMap: "8", keyId: "8", label: "8" },
        { type: "tap", className: "touch-btn", keyMap: "9", keyId: "9", label: "9" },
        { type: "tap", className: "touch-btn touch-btn--zero", keyMap: "0", keyId: "0", label: "0" },
        { type: "tap", className: "touch-btn touch-btn--backspace", keyMap: "Backspace", keyId: "Backspace", label: "Borrar" },
        { type: "tap", className: "touch-btn touch-btn--enter", keyMap: "Enter", keyId: "Enter", label: "Enter" },
      ],
    },
  };

  function isTouchDevice() {
    return (
      window.matchMedia?.("(pointer: coarse)")?.matches ||
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0
    );
  }

  function readDebugFlag() {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.has(DEBUG_QUERY_KEY)) {
        const value = params.get(DEBUG_QUERY_KEY);
        return value !== "0" && value !== "false";
      }
    } catch (_) {}

    try {
      return window.localStorage?.getItem(DEBUG_STORAGE_KEY) === "1";
    } catch (_) {
      return false;
    }
  }

  let debugEnabled = readDebugFlag();
  let activeApi = null;

  function isEnabled() {
    return isTouchDevice() || debugEnabled;
  }

  function persistDebugFlag(enabled) {
    try {
      if (enabled) window.localStorage?.setItem(DEBUG_STORAGE_KEY, "1");
      else window.localStorage?.removeItem(DEBUG_STORAGE_KEY);
    } catch (_) {}
  }

  function syncDebugClass() {
    document.body.classList.toggle("mn-touch-debug", !!debugEnabled);
  }

  function buildButtonMarkup(item) {
    const attrs =
      item.type === "hold"
        ? `data-touch-key="${item.key}"`
        : `data-touch-tap-key="${item.keyMap}" data-touch-key-id="${item.keyId}"`;

    return `<button class="${item.className}" type="button" ${attrs}>${item.label}</button>`;
  }

  function buildGroupMarkup(name, config) {
    const itemsMarkup = config.items.map(buildButtonMarkup).join("");
    const ariaHidden = config.ariaHidden || "false";
    return `
      <div class="${config.wrapClass}" data-touch-group-wrap="${name}">
        <button class="touch-toggle" type="button" data-touch-toggle="${name}" aria-expanded="true">${config.toggleLabel}</button>
        <div class="${config.panelClass}" data-touch-panel="${name}" aria-hidden="${ariaHidden}">
          ${itemsMarkup}
        </div>
      </div>
    `;
  }

  function renderControls(root) {
    if (!root || root.dataset.touchControlsBuilt === "true") return;

    root.innerHTML = `
      ${buildGroupMarkup("movement", GROUP_DEFS.movement)}
      <div class="touch-controls__rail touch-controls__rail--right">
        ${buildGroupMarkup("actions", GROUP_DEFS.actions)}
        ${buildGroupMarkup("numpad", GROUP_DEFS.numpad)}
      </div>
    `;

    root.dataset.touchControlsBuilt = "true";
  }

  function isNumericTouchScene(sceneKey) {
    return NUMERIC_TOUCH_SCENES.has(sceneKey);
  }

  function isQuickNumpadScene(sceneKey) {
    return QUICK_NUMPAD_SCENES.has(sceneKey);
  }

  function isEscOnlyScene(sceneKey) {
    return ESC_ONLY_SCENES.has(sceneKey);
  }

  function isOkEscScene(sceneKey) {
    return OK_ESC_SCENES.has(sceneKey);
  }

  function isEratostenesScene(sceneKey) {
    return sceneKey === "eratostenes_divisores";
  }

  function createBaseProfile(sceneKey) {
    const isOverworld = !!sceneKey && sceneKey.startsWith("overworld");
    const isNumeric = isNumericTouchScene(sceneKey);

    return {
      movement: isOverworld,
      actions: !!sceneKey && sceneKey !== "title" && sceneKey !== "novela",
      numpad: isNumeric,
      layout: !isOverworld && isNumeric ? "split" : "default",
      actionKeys: null,
      numpadKeys: null,
      expanded: {
        movement: isOverworld,
        actions: true,
        numpad: isNumeric,
      },
    };
  }

  function getTouchProfile(sceneKey, override = null) {
    const profile = createBaseProfile(sceneKey);

    if (profile.movement) {
      profile.actions = true;
      profile.actionKeys = ["e"];
    }

    if (sceneKey === "escriba_muescas") {
      profile.actions = true;
      profile.actionKeys = ["Escape"];
      profile.numpad = false;
      profile.layout = "default";
    }

    if (isEscOnlyScene(sceneKey)) {
      profile.movement = false;
      profile.actions = true;
      profile.actionKeys = ["Escape"];
      profile.numpad = false;
      profile.layout = "default";
    }

    if (isOkEscScene(sceneKey)) {
      profile.movement = false;
      profile.actions = true;
      profile.actionKeys = ["Enter", "Escape"];
      profile.numpad = false;
      profile.layout = "default";
    }

    if (QUICK_NUMPAD_SCENES.has(sceneKey)) {
      profile.movement = false;
      profile.actions = true;
      profile.actionKeys = ["Escape"];
      profile.numpad = true;
      profile.layout = "split";
      profile.expanded.numpad = true;
    }

    if (sceneKey === "eratostenes_divisores") {
      profile.movement = true;
      profile.actions = true;
      profile.numpad = true;
      profile.layout = "triad";
      profile.actionKeys = ["_SPACE_", "Escape"];
      profile.numpadKeys = ["1", "2", "3", "5", "7"];
      profile.expanded.movement = true;
    }

    if (!override || typeof override !== "object") return profile;

    return {
      movement:
        typeof override.movement === "boolean"
          ? override.movement
          : profile.movement,
      actions:
        typeof override.actions === "boolean" ? override.actions : profile.actions,
      numpad:
        typeof override.numpad === "boolean" ? override.numpad : profile.numpad,
      layout:
        typeof override.layout === "string" ? override.layout : profile.layout,
      actionKeys: Array.isArray(override.actionKeys)
        ? override.actionKeys
        : profile.actionKeys,
      numpadKeys: Array.isArray(override.numpadKeys)
        ? override.numpadKeys
        : profile.numpadKeys,
      expanded: {
        movement:
          typeof override.expanded?.movement === "boolean"
            ? override.expanded.movement
            : profile.expanded.movement,
        actions:
          typeof override.expanded?.actions === "boolean"
            ? override.expanded.actions
            : profile.expanded.actions,
        numpad:
          typeof override.expanded?.numpad === "boolean"
            ? override.expanded.numpad
            : profile.expanded.numpad,
      },
    };
  }

  function createControlApi(game, root) {
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
    const actionButtons = root.querySelectorAll(
      '[data-touch-panel="actions"] [data-touch-tap-key]'
    );
    const actionButtonsByKey = {};
    actionButtons.forEach((btn) => {
      const key = btn.dataset.touchKeyId;
      if (key) actionButtonsByKey[key] = btn;
    });
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

    const setAllowedTapKeys = (buttons, allowedKeys) => {
      const allowed = Array.isArray(allowedKeys) ? new Set(allowedKeys) : null;
      buttons.forEach((btn) => {
        const primaryKey =
          btn.dataset.touchKeyId || btn.dataset.touchTapKey?.split(",")?.[0] || "";
        const visible = !allowed || allowed.has(primaryKey);
        btn.classList.toggle("hidden", !visible);
      });
    };

    const applyProfile = (sceneKey = game.sceneManager?.currentKey) => {
      const profile = getTouchProfile(sceneKey, state.override);
      root.classList.toggle(
        "touch-controls--overworld",
        !!sceneKey && sceneKey.startsWith("overworld")
      );
      root.classList.toggle(
        "touch-controls--escriba",
        sceneKey === "escriba_muescas"
      );
      root.classList.toggle(
        "touch-controls--quick-numpad",
        isQuickNumpadScene(sceneKey)
      );
      root.classList.toggle(
        "touch-controls--eratostenes",
        isEratostenesScene(sceneKey)
      );
      setLayout(profile.layout || "default");
      setAllowedTapKeys(actionButtons, profile.actionKeys || null);
      setAllowedTapKeys(numpadButtons, profile.numpadKeys || null);
      if (actionButtonsByKey.Enter) {
        actionButtonsByKey.Enter.textContent = "OK";
      }
      if (actionButtonsByKey._SPACE_) {
        actionButtonsByKey._SPACE_.textContent = isEratostenesScene(sceneKey)
          ? "DISPARO"
          : "Espacio";
      }
      setGroupVisible("movement", profile.movement);
      setGroupVisible("actions", profile.actions);
      setGroupVisible("numpad", profile.numpad);

      if (profile.movement) setPanelExpanded("movement", profile.expanded.movement);
      if (profile.actions) setPanelExpanded("actions", profile.expanded.actions);
      if (profile.numpad) setPanelExpanded("numpad", profile.expanded.numpad);
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

    const visibilityHandler = () => {
      if (document.hidden) releaseAllDirections();
    };

    window.addEventListener("blur", releaseAllDirections);
    document.addEventListener("visibilitychange", visibilityHandler);

    return {
      applyProfile,
      setOverride(override = null) {
        state.override = override;
        applyProfile();
      },
      setVisible(visible) {
        const nextVisible = !!visible;
        root.classList.toggle("hidden", !visible);
        root.setAttribute("aria-hidden", visible ? "false" : "true");
        if (nextVisible) applyProfile();
      },
    };
  }

  function initTouchControls(game) {
    const root = document.getElementById("mnTouchControls");
    if (!root || !game?.input) return null;
    if (activeApi) return activeApi;

    renderControls(root);
    if (!isEnabled()) return null;

    activeApi = createControlApi(game, root);

    window.MN_configureTouchControls = function (override = null) {
      activeApi?.setOverride(override);
    };

    window.MN_refreshTouchControls = function (sceneKey) {
      activeApi?.applyProfile(sceneKey);
    };

    activeApi.applyProfile();
    if (debugEnabled) {
      activeApi.setVisible(true);
    }
    return activeApi;
  }

  function setTouchControlsVisible(visible) {
    const root = document.getElementById("mnTouchControls");
    if (!root || !isEnabled()) return;
    if (activeApi) {
      activeApi.setVisible(visible);
      return;
    }
    root.classList.toggle("hidden", !visible);
    root.setAttribute("aria-hidden", visible ? "false" : "true");
  }

  function enableDebug(enabled, options = {}) {
    debugEnabled = !!enabled;
    if (options.persist !== false) persistDebugFlag(debugEnabled);
    syncDebugClass();
    if (debugEnabled && !activeApi && window.MN_GAME) {
      initTouchControls(window.MN_GAME);
    }
    if (debugEnabled) {
      activeApi?.setVisible(true);
    }
    if (!debugEnabled && !isTouchDevice()) {
      activeApi?.setVisible(false);
    }
    window.MN_refreshTouchControls?.(window.MN_GAME?.sceneManager?.currentKey);
    return debugEnabled;
  }

  window.MN_TOUCH_CONTROLS = {
    getProfile: getTouchProfile,
    init: initTouchControls,
    setVisible: setTouchControlsVisible,
    isEnabled,
    isTouchDevice,
    enableDebug,
  };

  document.addEventListener("DOMContentLoaded", () => {
    syncDebugClass();
  });
})();
