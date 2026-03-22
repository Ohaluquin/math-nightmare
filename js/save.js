// js/registro_core.js
// - Estado base + Save/Load (core, se carga en todos los HTML)

window.MN_STATE = window.MN_STATE || {};

MN_STATE.flags = MN_STATE.flags || {};
MN_STATE.sheets = (typeof MN_STATE.sheets === "number") ? MN_STATE.sheets : 0;
MN_STATE.sheetsUnlocked = MN_STATE.sheetsUnlocked || [];
MN_STATE.pendingSheets = MN_STATE.pendingSheets || [];
MN_STATE.minigames = MN_STATE.minigames || {};

// ===================== SAVE / LOAD =====================

window.MN_exportSave = function ({
  student = "",
  group = "",
  notes = "",
} = {}) {
  const payload = {
    schema: "MN_SAVE_V1",
    createdAt: new Date().toISOString(),
    appVersion: window.MN_APP?.version || "unknown",
    student,
    group,
    notes,
    state: window.MN_STATE || {},
  };

  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json" });

  const safe = (s) =>
    (s || "")
      .toString()
      .trim()
      .replace(/[^\w\-]+/g, "_")
      .slice(0, 40) || "save";

  const filename = `MN_${safe(group)}_${safe(student)}_${new Date()
    .toISOString()
    .slice(0, 10)}.mnsave.json`;

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

        if (!data || data.schema !== "MN_SAVE_V1") {
          throw new Error("Archivo de guardado inválido (schema).");
        }
        if (!data.state || typeof data.state !== "object") {
          throw new Error("Archivo inválido (state).");
        }

        window.MN_STATE = data.state;
        if (window.MN_APP) window.MN_APP.state = window.MN_STATE;

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
      // Opcional: refrescar UI o volver al overworld si lo deseas
      // window.MN_APP?.router?.pop();
    } catch (e) {
      alert("Error al cargar: " + e.message);
    }
  };
  input.click();
};
