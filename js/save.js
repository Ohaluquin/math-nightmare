// js/registro_core.js
// - Estado base + Save/Load (core, se carga en todos los HTML)

window.MN_STATE = window.MN_STATE || {};

const MN_SAVE_SCHEMA = "MN_SAVE_V1";
const MN_PENDING_IMPORT_KEY = "MN_PENDING_IMPORT_V1";

window.MN_createInitialState = function (overrides = {}) {
  return {
    nivelActual: 0,
    puntajeTotal: 0,
    flags: {},
    sheets: 0,
    minigames: {},
    sheetsUnlocked: [],
    pendingSheets: [],
    seenStories: {},
    checkpoints: {},
    area: "aritmetica",
    ...overrides,
  };
};

window.MN_normalizeState = function (rawState) {
  const raw = rawState && typeof rawState === "object" ? rawState : {};
  const state = window.MN_createInitialState({
    nivelActual:
      typeof raw.nivelActual === "number" ? raw.nivelActual : 0,
    puntajeTotal:
      typeof raw.puntajeTotal === "number" ? raw.puntajeTotal : 0,
    flags: raw.flags && typeof raw.flags === "object" ? { ...raw.flags } : {},
    sheets:
      typeof raw.sheets === "number" && Number.isFinite(raw.sheets)
        ? raw.sheets
        : 0,
    minigames:
      raw.minigames && typeof raw.minigames === "object"
        ? { ...raw.minigames }
        : {},
    area:
      typeof raw.area === "string" && raw.area.trim()
        ? raw.area.trim().toLowerCase()
        : "aritmetica",
  });

  state.sheetsUnlocked = Array.from(
    new Set(
      Array.isArray(raw.sheetsUnlocked)
        ? raw.sheetsUnlocked.filter((key) => typeof key === "string" && key.trim())
        : [],
    ),
  );

  state.pendingSheets = Array.from(
    new Set(
      Array.isArray(raw.pendingSheets)
        ? raw.pendingSheets.filter(
            (key) =>
              typeof key === "string" &&
              key.trim() &&
              state.sheetsUnlocked.includes(key),
          )
        : [],
    ),
  );

  state.seenStories =
    raw.seenStories && typeof raw.seenStories === "object"
      ? Object.fromEntries(
          Object.entries(raw.seenStories).filter(
            ([key, value]) => typeof key === "string" && !!value,
          ),
        )
      : {};

  state.checkpoints =
    raw.checkpoints && typeof raw.checkpoints === "object"
      ? Object.fromEntries(
          Object.entries(raw.checkpoints)
            .filter(
              ([key, value]) =>
                typeof key === "string" && value && typeof value === "object",
            )
            .map(([key, value]) => [
              key,
              {
                scene:
                  typeof value.scene === "string" && value.scene.trim()
                    ? value.scene
                    : "overworld",
                playerX:
                  typeof value.playerX === "number" &&
                  Number.isFinite(value.playerX)
                    ? value.playerX
                    : undefined,
                playerY:
                  typeof value.playerY === "number" &&
                  Number.isFinite(value.playerY)
                    ? value.playerY
                    : undefined,
                updatedAt:
                  typeof value.updatedAt === "number" &&
                  Number.isFinite(value.updatedAt)
                    ? value.updatedAt
                    : undefined,
              },
            ]),
        )
      : {};

  if (!["aritmetica", "algebra", "geometria"].includes(state.area)) {
    state.area = "aritmetica";
  }

  state.sheets = Math.max(state.sheets, state.sheetsUnlocked.length);
  return state;
};

window.MN_replaceState = function (nextState) {
  const normalized = window.MN_normalizeState(nextState);
  const target =
    window.MN_STATE && typeof window.MN_STATE === "object"
      ? window.MN_STATE
      : {};

  for (const key of Object.keys(target)) delete target[key];
  Object.assign(target, normalized);

  window.MN_STATE = target;
  if (window.MN_APP) window.MN_APP.state = target;
  return target;
};

window.MN_markStorySeen = function (storyKey) {
  if (!storyKey) return;
  const state =
    window.MN_STATE || (window.MN_STATE = window.MN_createInitialState());
  state.seenStories = state.seenStories || {};
  state.seenStories[storyKey] = true;
  const entry = window.MN_REGISTRY?.npcs?.[storyKey];
  if (entry) entry._seen = true;
};

window.MN_isStorySeen = function (storyKey) {
  if (!storyKey) return false;
  return !!window.MN_STATE?.seenStories?.[storyKey];
};

window.MN_syncSeenStoriesToRegistry = function () {
  const seenStories = window.MN_STATE?.seenStories || {};
  const npcs = window.MN_REGISTRY?.npcs || {};
  Object.entries(npcs).forEach(([storyKey, entry]) => {
    if (!entry || typeof entry !== "object") return;
    entry._seen = !!seenStories[storyKey];
  });
};

window.MN_storeCheckpoint = function (area, checkpoint = {}) {
  if (!area) return;
  const state =
    window.MN_STATE || (window.MN_STATE = window.MN_createInitialState());
  state.checkpoints = state.checkpoints || {};
  state.checkpoints[area] = {
    ...(state.checkpoints[area] || {}),
    ...checkpoint,
    updatedAt: Date.now(),
  };
};

window.MN_getCheckpoint = function (area) {
  if (!area) return null;
  return window.MN_STATE?.checkpoints?.[area] || null;
};

window.MN_stageImportedSave = function (data) {
  try {
    window.sessionStorage?.setItem(MN_PENDING_IMPORT_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.warn("[Save] No se pudo preparar el cambio de pagina:", error);
    return false;
  }
};

window.MN_consumeStagedImportedSave = function () {
  try {
    const raw = window.sessionStorage?.getItem(MN_PENDING_IMPORT_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(MN_PENDING_IMPORT_KEY);
    const data = JSON.parse(raw);
    if (!data || data.schema !== MN_SAVE_SCHEMA) return null;
    data.state = window.MN_normalizeState(data.state);
    return data;
  } catch (error) {
    console.warn("[Save] No se pudo recuperar el guardado pendiente:", error);
    return null;
  }
};

window.MN_stageCurrentStateForNavigation = function (nextArea = null) {
  const nextState = window.MN_normalizeState({
    ...(window.MN_STATE || {}),
    area:
      typeof nextArea === "string" && nextArea.trim()
        ? nextArea.trim().toLowerCase()
        : window.MN_STATE?.area || "aritmetica",
  });

  return window.MN_stageImportedSave?.({
    schema: MN_SAVE_SCHEMA,
    student: window.MN_BOOT?.student || "",
    group: window.MN_BOOT?.group || "",
    state: nextState,
  }) || false;
};

window.MN_replaceState(window.MN_STATE);

// ===================== SAVE / LOAD =====================

window.MN_exportSave = function ({
  student = "",
  group = "",
  notes = "",
} = {}) {
  const payload = {
    schema: MN_SAVE_SCHEMA,
    createdAt: new Date().toISOString(),
    appVersion: window.MN_APP?.version || "unknown",
    student,
    group,
    notes,
    state: window.MN_normalizeState(window.MN_STATE || {}),
  };

  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json" });

  const safe = (s) =>
    (s || "")
      .toString()
      .trim()
      .replace(/[^\w\-]+/g, "_")
      .slice(0, 40) || "save";

  const filenameParts = ["MN"];
  if (student && student.trim()) filenameParts.push(safe(student));
  else if (group && group.trim()) filenameParts.push(safe(group));
  else filenameParts.push("save");
  filenameParts.push(new Date().toISOString().slice(0, 10));
  const filename = `${filenameParts.join("_")}.mnsave.json`;

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  return filename;
};

window.MN_importSaveFromFile = function (file) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error("No file"));

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);

        if (!data || data.schema !== MN_SAVE_SCHEMA) {
          throw new Error("Archivo de guardado invalido (schema).");
        }
        if (!data.state || typeof data.state !== "object") {
          throw new Error("Archivo invalido (state).");
        }

        data.state = window.MN_replaceState(data.state);
        window.MN_syncSeenStoriesToRegistry?.();

        resolve(data);
      } catch (e) {
        reject(e);
      }
    };

    reader.readAsText(file, "utf-8");
  });
};

window.MN_pickAndImport = function () {
  const input = document.getElementById("mnImport");
  if (!input) return;

  input.value = "";
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;

    try {
      await window.MN_importSaveFromFile(file);
    } catch (e) {
      alert("Error al cargar: " + e.message);
    }
  };
  input.click();
};
