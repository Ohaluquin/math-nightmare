(function () {
  const DEBUG_STORAGE_KEY = "mnTouchControlsDebug";
  const DESKTOP_STORAGE_KEY = "mnTouchControlsDesktop";
  const MOBILE_VISIBILITY_STORAGE_KEY = "mnTouchControlsMobileVisible";
  const DEBUG_QUERY_KEY = "touchcontrols";
  const sceneProfiles = new Map();

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
        { type: "tap", className: "touch-btn touch-btn--confirm", keyMap: "Enter", keyId: "Enter", label: "ENTER" },
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
        { type: "tap", className: "touch-btn touch-btn--decimal", keyMap: ".", keyId: ".", label: "." },
        { type: "tap", className: "touch-btn touch-btn--minus", keyMap: "-,Subtract,NumpadSubtract", keyId: "-", label: "-" },
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

  function readDesktopFlag() {
    try {
      return window.localStorage?.getItem(DESKTOP_STORAGE_KEY) === "1";
    } catch (_) {
      return false;
    }
  }

  function readMobileVisibilityFlag() {
    try {
      return window.localStorage?.getItem(MOBILE_VISIBILITY_STORAGE_KEY) !== "0";
    } catch (_) {
      return true;
    }
  }

  let debugEnabled = readDebugFlag();
  let desktopEnabled = readDesktopFlag();
  let activeApi = null;

  function isEnabled() {
    return isTouchDevice();
  }

  function persistDebugFlag(enabled) {
    try {
      if (enabled) window.localStorage?.setItem(DEBUG_STORAGE_KEY, "1");
      else window.localStorage?.removeItem(DEBUG_STORAGE_KEY);
    } catch (_) {}
  }

  function persistDesktopFlag(enabled) {
    try {
      if (enabled) window.localStorage?.setItem(DESKTOP_STORAGE_KEY, "1");
      else window.localStorage?.removeItem(DESKTOP_STORAGE_KEY);
    } catch (_) {}
  }

  function persistMobileVisibilityFlag(enabled) {
    try {
      if (enabled) window.localStorage?.removeItem(MOBILE_VISIBILITY_STORAGE_KEY);
      else window.localStorage?.setItem(MOBILE_VISIBILITY_STORAGE_KEY, "0");
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
        <div class="${config.panelClass}" data-touch-panel="${name}" aria-hidden="${ariaHidden}">
          ${itemsMarkup}
        </div>
      </div>
    `;
  }

  function renderControls(root) {
    if (!root || root.dataset.touchControlsBuilt === "true") return;

    root.innerHTML = `
      <div class="touch-controls__desktop-launch">
        <button class="touch-desktop-toggle" type="button" data-touch-desktop-toggle="true" aria-pressed="false">
          Touch
        </button>
      </div>
      <div class="touch-controls__shell" data-touch-shell="true">
        ${buildGroupMarkup("movement", GROUP_DEFS.movement)}
        <div class="touch-controls__rail touch-controls__rail--right">
          ${buildGroupMarkup("actions", GROUP_DEFS.actions)}
          ${buildGroupMarkup("numpad", GROUP_DEFS.numpad)}
        </div>
      </div>
    `;

    root.dataset.touchControlsBuilt = "true";
  }

  function createBaseProfile(sceneKey) {
    const isOverworld = !!sceneKey && sceneKey.startsWith("overworld");

    return {
      movement: isOverworld,
      actions: !!sceneKey && sceneKey !== "title" && sceneKey !== "novela",
      numpad: false,
      layout: "default",
      movementKeys: null,
      actionKeys: null,
      numpadKeys: null,
      actionLabels: null,
      variant: isOverworld ? "overworld" : null,
      showMovementToggle: true,
      showActionToggle: true,
      expanded: {
        movement: isOverworld,
        actions: true,
        numpad: false,
      },
    };
  }

  function getRegisteredProfile(sceneKey) {
    if (!sceneKey) return null;
    return sceneProfiles.get(sceneKey) || null;
  }

  function getTouchProfile(sceneKey, override = null) {
    const profile = createBaseProfile(sceneKey);
    if (profile.movement) {
      profile.actions = true;
      profile.actionKeys = ["e"];
    }

    const registered = getRegisteredProfile(sceneKey);
    if (registered) {
      if (typeof registered.movement === "boolean") profile.movement = registered.movement;
      if (typeof registered.actions === "boolean") profile.actions = registered.actions;
      if (typeof registered.numpad === "boolean") profile.numpad = registered.numpad;
      if (typeof registered.layout === "string") profile.layout = registered.layout;
      if (typeof registered.variant === "string") profile.variant = registered.variant;
      if (Array.isArray(registered.movementKeys)) profile.movementKeys = registered.movementKeys;
      if (Array.isArray(registered.actionKeys)) profile.actionKeys = registered.actionKeys;
      if (Array.isArray(registered.numpadKeys)) profile.numpadKeys = registered.numpadKeys;
      if (typeof registered.showMovementToggle === "boolean") {
        profile.showMovementToggle = registered.showMovementToggle;
      }
      if (typeof registered.showActionToggle === "boolean") {
        profile.showActionToggle = registered.showActionToggle;
      }
      if (registered.actionLabels && typeof registered.actionLabels === "object") {
        profile.actionLabels = registered.actionLabels;
      }
      if (registered.expanded && typeof registered.expanded === "object") {
        if (typeof registered.expanded.movement === "boolean") {
          profile.expanded.movement = registered.expanded.movement;
        }
        if (typeof registered.expanded.actions === "boolean") {
          profile.expanded.actions = registered.expanded.actions;
        }
        if (typeof registered.expanded.numpad === "boolean") {
          profile.expanded.numpad = registered.expanded.numpad;
        }
      }
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
      movementKeys: Array.isArray(override.movementKeys)
        ? override.movementKeys
        : profile.movementKeys,
      actionKeys: Array.isArray(override.actionKeys)
        ? override.actionKeys
        : profile.actionKeys,
      actionLabels:
        override.actionLabels && typeof override.actionLabels === "object"
          ? override.actionLabels
          : profile.actionLabels,
      numpadKeys: Array.isArray(override.numpadKeys)
        ? override.numpadKeys
        : profile.numpadKeys,
      variant:
        typeof override.variant === "string" ? override.variant : profile.variant,
      showMovementToggle:
        typeof override.showMovementToggle === "boolean"
          ? override.showMovementToggle
          : profile.showMovementToggle,
      showActionToggle:
        typeof override.showActionToggle === "boolean"
          ? override.showActionToggle
          : profile.showActionToggle,
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
    const desktopToggle = root.querySelector('[data-touch-desktop-toggle="true"]');
    const controlsShell = root.querySelector('[data-touch-shell="true"]');
    const dirButtons = root.querySelectorAll("[data-touch-key]");
    const tapButtons = root.querySelectorAll("[data-touch-tap-key]");
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
      visible: !root.classList.contains("hidden"),
      desktopEnabled,
      mobileControlsVisible: readMobileVisibilityFlag(),
      expanded: {
        movement: true,
        actions: true,
        numpad: false,
      },
    };

    const syncDesktopMode = () => {
      const desktopMode = !isTouchDevice();
      const showVisibilityToggle = state.visible && (isTouchDevice() || (desktopMode && !debugEnabled));
      const showControls =
        state.visible &&
        (desktopMode ? debugEnabled || state.desktopEnabled : state.mobileControlsVisible);

      root.classList.toggle("touch-controls--desktop-mode", desktopMode);
      root.classList.toggle("touch-controls--desktop-active", desktopMode && showControls);
      root.classList.toggle("touch-controls--mobile-hidden", !desktopMode && !showControls);
      controlsShell?.classList.toggle("hidden", !showControls);

      if (desktopToggle) {
        desktopToggle.textContent = desktopMode ? (showControls ? "Ocultar touch" : "Mostrar touch") : "";
        desktopToggle.setAttribute(
          "aria-label",
          showControls ? "Ocultar controles touch" : "Mostrar controles touch"
        );
        desktopToggle.setAttribute("aria-pressed", showControls ? "true" : "false");
      }

      root.setAttribute(
        "aria-hidden",
        state.visible && (showControls || showVisibilityToggle) ? "false" : "true"
      );
    };

    const setDesktopEnabled = (enabled, options = {}) => {
      state.desktopEnabled = !!enabled;
      desktopEnabled = state.desktopEnabled;
      if (options.persist !== false) persistDesktopFlag(state.desktopEnabled);
      if (!state.desktopEnabled) releaseAllDirections();
      syncDesktopMode();
      if (state.visible && (debugEnabled || state.desktopEnabled || isTouchDevice())) {
        applyProfile();
      }
    };

    const setMobileControlsVisible = (visible, options = {}) => {
      state.mobileControlsVisible = !!visible;
      if (options.persist !== false) persistMobileVisibilityFlag(state.mobileControlsVisible);
      if (!state.mobileControlsVisible) releaseAllDirections();
      syncDesktopMode();
      if (state.visible && state.mobileControlsVisible) applyProfile();
    };

    const setPanelExpanded = (name, expanded) => {
      state.expanded[name] = !!expanded;
      const panel = panels[name];
      if (panel) {
        panel.classList.toggle("is-collapsed", !expanded);
        panel.setAttribute("aria-hidden", expanded ? "false" : "true");
      }
    };

    const setGroupVisible = (name, visible) => {
      const wrap = wrappers[name];
      if (!wrap) return;
      wrap.classList.toggle("hidden", !visible);
      setPanelExpanded(name, !!visible);
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

    const setAllowedDirectionKeys = (buttons, allowedKeys) => {
      const allowed = Array.isArray(allowedKeys) ? new Set(allowedKeys) : null;
      buttons.forEach((btn) => {
        const key = btn.dataset.touchKey || "";
        const visible = !allowed || allowed.has(key);
        btn.classList.toggle("hidden", !visible);
      });
    };

    const applyProfile = (sceneKey = game.sceneManager?.currentKey) => {
      const profile = getTouchProfile(sceneKey, state.override);
      const isMinigame =
        !!sceneKey &&
        sceneKey !== "title" &&
        sceneKey !== "novela" &&
        !String(sceneKey).startsWith("overworld");
      const isNumpadOnly = !!profile.numpad && !profile.movement && !profile.actions;
      const variants = ["overworld", "escriba", "quick-numpad", "eratostenes", "horizontal-move"];
      variants.forEach((name) => {
        root.classList.toggle(`touch-controls--${name}`, profile.variant === name);
      });
      root.classList.toggle("touch-controls--minigame", isMinigame);
      root.classList.toggle("touch-controls--numpad-only", isNumpadOnly);
      setLayout(profile.layout || "default");
      setAllowedDirectionKeys(dirButtons, profile.movementKeys || null);
      setAllowedTapKeys(actionButtons, profile.actionKeys || null);
      setAllowedTapKeys(numpadButtons, profile.numpadKeys || null);
      const defaultActionLabels = {
        Enter: "ENTER",
        _SPACE_: "Espacio",
        Escape: "ESC",
        e: "Hablar",
      };
      Object.entries(actionButtonsByKey).forEach(([key, btn]) => {
        btn.textContent = profile.actionLabels?.[key] || defaultActionLabels[key] || btn.textContent;
      });
      setGroupVisible("movement", profile.movement);
      setGroupVisible("actions", profile.actions);
      setGroupVisible("numpad", profile.numpad);

      if (profile.movement) setPanelExpanded("movement", true);
      if (profile.actions) setPanelExpanded("actions", true);
      if (profile.numpad) setPanelExpanded("numpad", true);
      syncDesktopMode();
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
    desktopToggle?.addEventListener("click", (event) => {
      event.preventDefault();
      if (isTouchDevice()) {
        setMobileControlsVisible(!state.mobileControlsVisible);
      } else {
        setDesktopEnabled(!state.desktopEnabled);
      }
    });
    window.addEventListener("resize", syncDesktopMode);

    return {
      applyProfile,
      setOverride(override = null) {
        state.override = override;
        applyProfile();
      },
      setVisible(visible) {
        const nextVisible = !!visible;
        state.visible = nextVisible;
        root.classList.toggle("hidden", !nextVisible);
        if (!nextVisible) releaseAllDirections();
        if (nextVisible) applyProfile();
        else syncDesktopMode();
      },
      setDesktopEnabled,
      isDesktopEnabled() {
        return !!state.desktopEnabled;
      },
    };
  }

  function initTouchControls(game) {
    const root = document.getElementById("mnTouchControls");
    if (!root || !game?.input) return null;
    if (activeApi) return activeApi;

    renderControls(root);
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
    if (!root) return;
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
    registerProfiles(profiles = {}) {
      Object.entries(profiles).forEach(([sceneKey, profile]) => {
        if (!sceneKey || !profile || typeof profile !== "object") return;
        sceneProfiles.set(sceneKey, profile);
      });
    },
  };

  document.addEventListener("DOMContentLoaded", () => {
    syncDebugClass();
  });
})();
