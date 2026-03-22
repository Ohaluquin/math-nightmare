window.MN_awardSheetsForProgress = function (minigameId, prevTier, newTier) {
  const map = window.MN_SHEETS_REWARD?.[minigameId];
  if (!map) return 0;
  const keys = [];
  for (let t = prevTier + 1; t <= newTier; t++) {
    const k = map[t];
    if (k) keys.push(k);
  }
  if (keys.length) return window.MN_unlockSheets(keys);
  return 0;
};

window.MN_updateLeafHUD = function () {
  const hud = document.getElementById("leaf-hud");
  if (!hud) return;
  hud.innerHTML = "";
  const unlocked = window.MN_STATE.sheetsUnlocked || [];
  const game = window.MN_APP?.game;
  if (!game) return;
  const leafImg = game.assets.getImage("ui_leaf");
  if (!leafImg) {
    console.warn("[HUD] ui_leaf no cargado en assets");
    return;
  }
  for (let i = 0; i < unlocked.length; i++) {
    const img = document.createElement("img");
    img.src = leafImg.src;
    img.className = "leaf-icon";
    img.dataset.index = i;
    img.addEventListener("click", () => {
      const k = unlocked[i];
      window.MN_openUnlockedBookAtKey(k);
    });
    hud.appendChild(img);
  }
};


// tier: 0, 1 o 2 (o más si algún minijuego futuro lo requiere)
window.MN_reportMinigameTier = function (minigameId, tier) {
  const reg = window.MN_REGISTRY?.minigames || {};
  const entry = reg[minigameId];
  // Máximo permitido por configuración del minijuego (ej. 2 hojas)
  const maxSheets =
    entry && typeof entry.sheets === "number" ? entry.sheets : 2;
  // Normalizar tier al rango [0, maxSheets]
  tier = Math.max(0, Math.min(tier | 0, maxSheets));
  const state = window.MN_STATE || (window.MN_STATE = {});
  state.minigames = state.minigames || {};
  state.sheets = state.sheets || 0;
  // Registro del minijuego
  const record =
    state.minigames[minigameId] ||
    (state.minigames[minigameId] = { bestTier: 0 });
  const prevTier = record.bestTier || 0;
  // Sólo ganamos hojas si esta partida sube la bandera máxima
  const gained = Math.max(0, tier - prevTier);
  record.bestTier = Math.max(prevTier, tier);
  state.sheets += gained;
  if (gained) {
    // traduce el progreso a hojas concretas (keys) y las mete a pendingSheets
    window.MN_awardSheetsForProgress(minigameId, prevTier, record.bestTier);
  }
  if (gained && window.MN_updateLeafHUD) MN_updateLeafHUD();
  return gained; // por si el minijuego quiere mostrarlo en el mensaje final
};

window.MN_openUnlockedBookAtKey = function (sheetKey) {
  const unlocked = window.MN_STATE?.sheetsUnlocked || [];
  const idx = Math.max(0, unlocked.indexOf(sheetKey));
  window.MN_BOOK = window.MN_BOOK || { index: 0, catalog: [] };
  window.MN_BOOK.catalog = unlocked;
  window.MN_BOOK.index = idx;
  const k = unlocked[idx];
  if (k) window.MN_openSheetByKey(k);
  window.MN_updateBookNav?.();
};

window.MN_openUnlockedBook = function () {
  const unlocked = window.MN_STATE?.sheetsUnlocked || [];
  window.MN_BOOK = window.MN_BOOK || { index: 0, catalog: [] };
  window.MN_BOOK.catalog = unlocked;
  const idx = Math.max(
    0,
    Math.min(window.MN_BOOK.index || 0, unlocked.length - 1)
  );
  window.MN_BOOK.index = idx;
  const k = unlocked[idx];
  if (k) window.MN_openSheetByKey(k);
  window.MN_updateBookNav?.();
};

window.MN_openPendingSheetReward = function () {
  const k = window.MN_STATE?.pendingSheets?.[0];
  if (!k) return false;
  window.MN_openUnlockedBookAtKey(k);
  return true;
};

window.MN_unlockSheets = function (sheetKeys) {
  const state = window.MN_STATE || (window.MN_STATE = {});
  state.sheetsUnlocked ||= [];
  state.pendingSheets ||= [];
  const newly = [];
  for (const k of sheetKeys) {
    if (!state.sheetsUnlocked.includes(k)) {
      state.sheetsUnlocked.push(k);
      newly.push(k);
    }
  }
  for (const k of newly) {
    if (!state.pendingSheets.includes(k)) state.pendingSheets.push(k);
  }
  if (window.MN_updateLeafHUD) window.MN_updateLeafHUD();
  return newly.length;
};

window.MN_BOOK = window.MN_BOOK || { index: 0 };

////////////////////////// PARA EL MODAL DE LAS HOJAS
(function () {
  const state = {
    scale: 1,
    x: 0,
    y: 0,
    dragging: false,
    px: 0,
    py: 0,
    startX: 0,
    startY: 0,
  };

  const Z_MIN = 1;
  const Z_MAX = 4;
  const Z_STEP = 1.15; // rueda/botón
  const PAN_STEP = 40; // flechas/botones
  const PAN_HOLD_MS = 16; // ~60fps

  function MN_clearPendingSheets() {
    if (window.MN_STATE?.pendingSheets) {
      window.MN_STATE.pendingSheets.length = 0;
    }
  }

  function MN_closeSheetModal() {
    document.getElementById("sheet-modal")?.classList.add("hidden");
    MN_clearPendingSheets();
  }

  function getEls() {
    return {
      view: document.getElementById("sheet-viewport"),
      img: document.getElementById("sheet-img"),
    };
  }

  function clampPan() {
    const { view, img } = getEls();
    if (!view || !img) return;

    const vw = view.clientWidth;
    const vh = view.clientHeight;

    const iw = img.offsetWidth * state.scale;
    const ih = img.offsetHeight * state.scale;

    // X
    if (iw <= vw) {
      // si cabe, céntralo (solo X)
      state.x = (vw - iw) / 2;
    } else {
      const minX = vw - iw;
      const maxX = 0;
      state.x = Math.max(minX, Math.min(maxX, state.x));
    }

    // Y (solo restringir para que no se vaya arriba)
    if (ih <= vh) {
      // tú dijiste que Y te gusta, así que aquí puedes dejarlo fijo o centrar si quieres
      state.y = Math.min(0, Math.max(vh - ih, state.y)); // evita huecos arriba/abajo
    } else {
      const minY = vh - ih;
      const maxY = 0; // NO permitir que suba y desaparezca
      state.y = Math.max(minY, Math.min(maxY, state.y));
    }
  }

  function apply() {
    const { img } = getEls();
    if (!img) return;
    img.style.transformOrigin = "0 0"; // Asegura que tu fórmula sea consistente
    clampPan(); // 1) clamp primero
    // 2) luego dibuja
    img.style.transform = `translate(${state.x}px, ${state.y}px) scale(${state.scale})`;
  }

  function zoomByFactor(factor, anchorX = null, anchorY = null) {
    const { view } = getEls();
    if (!view) return;
    // Si no hay anchor, usamos el centro del viewport
    if (anchorX == null || anchorY == null) {
      anchorX = view.clientWidth / 2;
      anchorY = view.clientHeight / 2;
    }
    setZoom(state.scale * factor, anchorX, anchorY);
  }

  function setZoom(newZoom, anchorX = null, anchorY = null) {
    const { view, img } = getEls();
    if (!view || !img || !img.naturalWidth) return;
    const old = state.scale;
    const nz = Math.max(Z_MIN, Math.min(Z_MAX, newZoom));
    if (nz === old) return;
    if (anchorX != null && anchorY != null) {
      // Convertir anchor (pantalla) -> coordenada del contenido
      const contentX = (anchorX - state.x) / old;
      const contentY = (anchorY - state.y) / old;
      state.scale = nz;
      // Reposicionar para que ese mismo punto del contenido quede bajo el cursor
      state.x = anchorX - contentX * state.scale;
      state.y = anchorY - contentY * state.scale;
    } else {
      state.scale = nz;
    }
    apply();
  }

  function pan(dx, dy) {
    state.x += dx;
    state.y += dy;
    apply();
  }

  window.MN_resetSheetView = function () {
    const { view, img } = getEls();
    if (!view || !img) return;
    state.scale = 1;
    // Esperar a que el <img> tenga layout (por si acaba de cambiar src)
    if (!img.complete) {
      img.onload = () => window.MN_resetSheetView();
      return;
    }
    const vw = view.clientWidth;
    const baseW = img.offsetWidth; // ignora transforms
    const iw = baseW * state.scale;
    state.x = (vw - iw) / 2; // centrado horizontal real
    apply();
  };

  function bindHold(btn, fn) {
    if (!btn) return;
    let t = null;
    const start = (e) => {
      e.preventDefault();
      fn();
      t = setInterval(fn, PAN_HOLD_MS);
    };
    const stop = () => {
      if (t) clearInterval(t);
      t = null;
    };
    btn.addEventListener("mousedown", start);
    btn.addEventListener("touchstart", start, { passive: false });
    window.addEventListener("mouseup", stop);
    window.addEventListener("touchend", stop);
    window.addEventListener("touchcancel", stop);
    btn.addEventListener("mouseleave", stop);
  }

  function MN_getActiveBookCatalog() {
    // Prioridad: catálogo del libro actual (por ejemplo, unlocked)
    const bookCat = window.MN_BOOK?.catalog;
    if (Array.isArray(bookCat) && bookCat.length) return bookCat;
    // Fallback: catálogo global (libro completo)
    return [];
  }

  window.MN_updateBookNav = function () {
    const catalog = MN_getActiveBookCatalog();
    const idx = window.MN_BOOK?.index || 0;
    const prev = document.getElementById("sheet-prev");
    const next = document.getElementById("sheet-next");
    if (prev) prev.disabled = idx <= 0;
    if (next) next.disabled = idx >= catalog.length - 1;
  };

  document.addEventListener("DOMContentLoaded", () => {
    const { view, img } = getEls();
    const modal = document.getElementById("sheet-modal");
    if (!view || !img || !modal) return;

    // Cuando cambie la hoja, reset
    const obs = new MutationObserver(() => window.MN_resetSheetView());
    obs.observe(img, { attributes: true, attributeFilter: ["src"] });

    // Bloquear drag nativo
    img.addEventListener("dragstart", (e) => e.preventDefault());
    view.addEventListener("dragstart", (e) => e.preventDefault());

    // Pointer events (pan)
    view.addEventListener("pointerdown", (e) => {
      state.dragging = true;
      view.classList.add("dragging");
      state.px = e.clientX;
      state.py = e.clientY;
      state.startX = state.x;
      state.startY = state.y;
      view.setPointerCapture(e.pointerId);
    });

    view.addEventListener("pointermove", (e) => {
      if (!state.dragging) return;
      const dx = e.clientX - state.px;
      const dy = e.clientY - state.py;
      state.x = state.startX + dx;
      state.y = state.startY + dy;
      apply();
    });

    view.addEventListener("pointerup", (e) => {
      state.dragging = false;
      view.classList.remove("dragging");
      try {
        view.releasePointerCapture(e.pointerId);
      } catch (_) {}
    });

    view.addEventListener("pointercancel", () => {
      state.dragging = false;
      view.classList.remove("dragging");
    });

    view.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? Z_STEP : 1 / Z_STEP;
        const rect = view.getBoundingClientRect();
        const ax = e.clientX - rect.left;
        const ay = e.clientY - rect.top;
        zoomByFactor(factor, ax, ay);
      },
      { passive: false }
    );

    // doble click toggle
    view.addEventListener("dblclick", () => {
      if (state.scale < 1.4) setZoom(2.5, 80, 80);
      else window.MN_resetSheetView();
    });

    // Botones zoom
    const zin = document.getElementById("sheet-zoom-in");
    const zout = document.getElementById("sheet-zoom-out");
    const reset = document.getElementById("sheet-reset");
    zin && zin.addEventListener("click", () => zoomByFactor(Z_STEP));
    zout && zout.addEventListener("click", () => zoomByFactor(1 / Z_STEP));
    reset && reset.addEventListener("click", () => window.MN_resetSheetView());

    // Botones mover (con hold)
    bindHold(document.getElementById("sheet-left"), () => pan(+PAN_STEP, 0));
    bindHold(document.getElementById("sheet-right"), () => pan(-PAN_STEP, 0));
    bindHold(document.getElementById("sheet-up"), () => pan(0, +PAN_STEP));
    bindHold(document.getElementById("sheet-down"), () => pan(0, -PAN_STEP));

    // Prev / Next (modo libro)
    document.getElementById("sheet-prev")?.addEventListener("click", () => {
      const catalog = MN_getActiveBookCatalog();
      window.MN_BOOK = window.MN_BOOK || { index: 0, catalog: [] };

      window.MN_BOOK.index = Math.max(0, (window.MN_BOOK.index || 0) - 1);
      const k = catalog[window.MN_BOOK.index];
      if (k) window.MN_openSheetByKey(k);

      window.MN_updateBookNav();
    });

    document.getElementById("sheet-next")?.addEventListener("click", () => {
      const catalog = MN_getActiveBookCatalog();
      window.MN_BOOK = window.MN_BOOK || { index: 0, catalog: [] };

      window.MN_BOOK.index = Math.min(
        catalog.length - 1,
        (window.MN_BOOK.index || 0) + 1
      );
      const k = catalog[window.MN_BOOK.index];
      if (k) window.MN_openSheetByKey(k);

      window.MN_updateBookNav();
    });

    // Cerrar con X
    document
      .getElementById("sheet-close")
      ?.addEventListener("click", MN_closeSheetModal);

    // Cerrar click en backdrop
    modal.addEventListener("click", (e) => {
      if (e.target && e.target.id === "sheet-modal") MN_closeSheetModal();
    });

    // Teclado (solo si el modal está abierto)
    window.addEventListener("keydown", (e) => {
      if (modal.classList.contains("hidden")) return;

      if (e.key === "Escape") {
        MN_closeSheetModal();
        return;
      }

      if (e.key === "ArrowLeft") {
        pan(+PAN_STEP, 0);
        e.preventDefault();
      }
      if (e.key === "ArrowRight") {
        pan(-PAN_STEP, 0);
        e.preventDefault();
      }
      if (e.key === "ArrowUp") {
        pan(0, +PAN_STEP);
        e.preventDefault();
      }
      if (e.key === "ArrowDown") {
        pan(0, -PAN_STEP);
        e.preventDefault();
      }

      if (e.key === "+" || e.key === "=") setZoom(state.scale * Z_STEP);
      if (e.key === "-" || e.key === "_") setZoom(state.scale / Z_STEP);
      if (e.key === "0") window.MN_resetSheetView();
    });
  });
})();
