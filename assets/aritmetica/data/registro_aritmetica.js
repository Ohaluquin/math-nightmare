// assets/aritmetica/data/registro_area.js
// - Recompensas + Registro de NPCs/Minijuegos (solo Aritmética)

window.MN_SHEETS_REWARD = {
  escriba_muescas: { 1: "sheet_numero", 2: "sheet_contar" },
  caja_rapida: { 1: "sheet_operaciones" }, 
  escalera_sumas: { 1: "sheet_suma", 2: "sheet_sistema_decimal" },
  restas_luciernagas: { 1: "sheet_resta" },
  mineros_division: { 1: "sheet_cero" },
  armonia_division: { 1: "sheet_division" },  
  galileo_tablas: { 1: "sheet_multiplicacion", 2: "sheet_dos_caras" },
  chaman_jerarquia: { 1: "sheet_al_juarizmi" },
  general_signos: { 1: "sheet_negativos" },
  eratostenes_divisores: { 1: "sheet_misteriosos", 2: "sheet_primos" },
  leonardo_razonamiento: { 1: "sheet_aldea", 2: "sheet_leonardo" },
};

// ================== REGISTRO EN MN_REGISTRY ==================
window.MN_REGISTRY = window.MN_REGISTRY || {};
MN_REGISTRY.npcs = MN_REGISTRY.npcs || {};
MN_REGISTRY.minigames = MN_REGISTRY.minigames || {};
MN_REGISTRY.areas = MN_REGISTRY.areas || {};
MN_REGISTRY.areas.aritmetica =
  MN_REGISTRY.areas.aritmetica || { npcs: {}, minigames: {} };

// Intro global (botón inicio)
MN_REGISTRY.intro = { story: window.MN_STORY };

// Sofía
MN_REGISTRY.npcs["npc_sofia_intro"] = {
  story: window.SOFIA_STORY,
  area: "general",
  role: "guia",
};

MN_REGISTRY.npcs["npc_sofia_algebra_gate"] = {
  story: window.SOFIA_ALGEBRA_GATE_STORY,
  area: "aritmetica",
  role: "guia",
};

// NPCs Aritmética
MN_REGISTRY.npcs["npc_escriba_muescas"] = {
  story: window.ESCRIBA_MUESCAS_STORY,
  area: "aritmetica",
  role: "npc",
};

MN_REGISTRY.npcs["npc_caja_rapida"] = {
  story: window.CAJA_RAPIDA_STORY,
  area: "aritmetica",
  role: "npc",
};

MN_REGISTRY.npcs["npc_escalera_sumas"] = {
  story: window.ESCALERA_SUMAS_STORY,
  area: "aritmetica",
  role: "npc",
};

MN_REGISTRY.npcs["npc_restas_luciernagas"] = {
  story: window.GUARDIAN_LUCIERNAGAS_STORY,
  area: "aritmetica",
  role: "npc",
};

MN_REGISTRY.npcs["npc_mineros"] = {
  story: window.MINEROS_STORY,
  area: "aritmetica",
  role: "npc",
};

MN_REGISTRY.npcs["npc_galileo"] = {
  story: window.GALILEO_TABLAS_STORY,
  area: "aritmetica",
  role: "npc",
};

MN_REGISTRY.npcs["npc_armonia"] = {
  story: window.ARMONIA_DIVISION_STORY,
  area: "aritmetica",
  role: "npc",
};

MN_REGISTRY.npcs["npc_chaman_jerarquia"] = {
  story: window.CHAMAN_JERARQUIA_STORY,
  area: "aritmetica",
  role: "npc",
};

MN_REGISTRY.npcs["npc_general"] = {
  story: window.GENERAL_SIGNOS_STORY,
  area: "aritmetica",
  role: "npc",
};

MN_REGISTRY.npcs["npc_eratostenes"] = {
  story: window.ERATOSTENES_STORY,
  area: "aritmetica",
  role: "npc",
};

MN_REGISTRY.npcs["npc_leonardo_pisa"] = {
  story: window.LEONARDO_PISA_STORY,
  area: "aritmetica",
  role: "boss",
};

// Cierre de aritmética (si lo usas)
MN_REGISTRY.npcs["npc_aritmetica_cierre"] = {
  story: window.LEONARDO_CIERRE_STORY,
  area: "aritmetica",
  role: "boss",
};

// ================== MINIJUEGOS ==================

MN_REGISTRY.minigames["escriba_muescas"] = {
  id: "escriba_muescas",
  factory: (game) => new EscribaScene(game),
  sheets: 2,
};

MN_REGISTRY.minigames["caja_rapida"] = {
  id: "caja_rapida",
  factory: (game) => new CajaRapidaScene(game),
  sheets: 1,
};

MN_REGISTRY.minigames["escalera_sumas"] = {
  id: "escalera_sumas",
  factory: (game) => new SumasScene(game),
  sheets: 2,
};

MN_REGISTRY.minigames["restas_luciernagas"] = {
  id: "restas_luciernagas",
  factory: (game) => new RestasScene(game),
  sheets: 1,
};

MN_REGISTRY.minigames["mineros_division"] = {
  id: "mineros_division",
  factory: (game) => new ElevadorScene(game),
  sheets: 1,
};

MN_REGISTRY.minigames["galileo_tablas"] = {
  id: "galileo_tablas",
  factory: (game) => new TablasScene(game),
  sheets: 2,
};

MN_REGISTRY.minigames["armonia_division"] = {
  id: "armonia_division",
  factory: (game) => new ArmoniaScene(game),
  sheets: 1,
};

MN_REGISTRY.minigames["chaman_jerarquia"] = {
  id: "chaman_jerarquia",
  factory: (game) => new JerarquiaScene(game),
  sheets: 1,
};

MN_REGISTRY.minigames["general_signos"] = {
  id: "general_signos",
  factory: (game) => new GeneralSignosScene(game),
  sheets: 1,
};

MN_REGISTRY.minigames["eratostenes_divisores"] = {
  id: "eratostenes_divisores",
  factory: (game) => new DivisoresScene(game),
  sheets: 2,
};

MN_REGISTRY.minigames["leonardo_razonamiento"] = {
  id: "leonardo_razonamiento",
  factory: (game) => new RazonamientoScene(game),
  sheets: 2,
};
