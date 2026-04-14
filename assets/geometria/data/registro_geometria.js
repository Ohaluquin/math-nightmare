// assets/geometria/data/registro_geometria.js
// Registro basico del area de Geometria

window.MN_SHEETS_REWARD = window.MN_SHEETS_REWARD || {};
window.MN_SHEETS_REWARD.congruencia = {
  1: "sheet_igualdad",
};
window.MN_SHEETS_REWARD.deduccion = {
  1: "sheet_deduccion",
  2: "sheet_demostracion",
};
window.MN_SHEETS_REWARD.angulos = {
  1: "sheet_angulos",
};
window.MN_SHEETS_REWARD.isosceles = {
  1: "sheet_isosceles",
};
window.MN_SHEETS_REWARD.angulos_ecuaciones = {
  1: "sheet_angulos_ecuaciones",
};
window.MN_SHEETS_REWARD.poligonos = {
  1: "sheet_poligonos",
};
window.MN_SHEETS_REWARD.areas = {
  1: "sheet_perimetro",
  2: "sheet_areas",
};
window.MN_SHEETS_REWARD.perimetro = window.MN_SHEETS_REWARD.areas;
window.MN_SHEETS_REWARD.cartesiano = {
  1: "sheet_cartesiano",
};
window.MN_SHEETS_REWARD.graficas = {
  1: "sheet_graficas",
};
window.MN_SHEETS_REWARD.regla_y_compas = {
  1: "sheet_regla_y_compas",
};
window.MN_SHEETS_REWARD.problemas = {
  1: "sheet_pitagoras",
};

window.MN_REGISTRY = window.MN_REGISTRY || {};
MN_REGISTRY.npcs = MN_REGISTRY.npcs || {};
MN_REGISTRY.minigames = MN_REGISTRY.minigames || {};
MN_REGISTRY.areas = MN_REGISTRY.areas || {};
MN_REGISTRY.areas.geometria =
  MN_REGISTRY.areas.geometria || { intro: null, npcs: {}, minigames: {} };

if (window.SOFIA_GEOMETRIA_STORY) {
  MN_REGISTRY.npcs["npc_sofia_geometria"] = {
    story: window.SOFIA_GEOMETRIA_STORY,
    area: "geometria",
    role: "npc",
  };

  MN_REGISTRY.areas.geometria.npcs["npc_sofia_geometria"] =
    MN_REGISTRY.npcs["npc_sofia_geometria"];
}

if (window.SOFIA_CASTILLO_GATE_STORY) {
  MN_REGISTRY.npcs["npc_sofia_castillo_gate"] = {
    story: window.SOFIA_CASTILLO_GATE_STORY,
    area: "geometria",
    role: "npc",
  };

  MN_REGISTRY.areas.geometria.npcs["npc_sofia_castillo_gate"] =
    MN_REGISTRY.npcs["npc_sofia_castillo_gate"];
}

if (window.SOFIA_CASTILLO_READY_STORY) {
  MN_REGISTRY.npcs["npc_sofia_castillo_ready"] = {
    story: window.SOFIA_CASTILLO_READY_STORY,
    area: "geometria",
    role: "npc",
  };

  MN_REGISTRY.areas.geometria.npcs["npc_sofia_castillo_ready"] =
    MN_REGISTRY.npcs["npc_sofia_castillo_ready"];
}

if (window.SOFIA_CASTILLO_FINAL_STORY) {
  MN_REGISTRY.npcs["npc_sofia_castillo_final"] = {
    story: window.SOFIA_CASTILLO_FINAL_STORY,
    area: "geometria",
    role: "npc",
  };

  MN_REGISTRY.areas.geometria.npcs["npc_sofia_castillo_final"] =
    MN_REGISTRY.npcs["npc_sofia_castillo_final"];
}

if (window.LUCERO_SOMBRAS_TANGRAM_STORY) {
  MN_REGISTRY.npcs["npc_lucero_congruencia"] = {
    story: window.LUCERO_SOMBRAS_TANGRAM_STORY,
    area: "geometria",
    role: "npc",
  };

  MN_REGISTRY.areas.geometria.npcs["npc_lucero_congruencia"] =
    MN_REGISTRY.npcs["npc_lucero_congruencia"];
}

if (window.EUCLIDES_DEDUCCION_STORY) {
  MN_REGISTRY.npcs["npc_rey_deduccion"] = {
    story: window.EUCLIDES_DEDUCCION_STORY,
    area: "geometria",
    role: "npc",
  };

  MN_REGISTRY.areas.geometria.npcs["npc_rey_deduccion"] =
    MN_REGISTRY.npcs["npc_rey_deduccion"];
}

if (window.ULISES_ANGULOS_STORY) {
  MN_REGISTRY.npcs["npc_ulises_angulos"] = {
    story: window.ULISES_ANGULOS_STORY,
    area: "geometria",
    role: "npc",
  };

  MN_REGISTRY.areas.geometria.npcs["npc_ulises_angulos"] =
    MN_REGISTRY.npcs["npc_ulises_angulos"];
}

if (window.GEMELAS_ISOSCELES_STORY) {
  MN_REGISTRY.npcs["npc_gemelas_isosceles"] = {
    story: window.GEMELAS_ISOSCELES_STORY,
    area: "geometria",
    role: "npc",
  };

  MN_REGISTRY.areas.geometria.npcs["npc_gemelas_isosceles"] =
    MN_REGISTRY.npcs["npc_gemelas_isosceles"];
}

if (window.ANGULOS_ECUACIONES_STORY) {
  MN_REGISTRY.npcs["npc_judy_angulos_ecuaciones"] = {
    story: window.ANGULOS_ECUACIONES_STORY,
    area: "geometria",
    role: "npc",
  };

  MN_REGISTRY.areas.geometria.npcs["npc_judy_angulos_ecuaciones"] =
    MN_REGISTRY.npcs["npc_judy_angulos_ecuaciones"];
}

if (window.ARQUITECTO_POLIGONOS_STORY) {
  MN_REGISTRY.npcs["npc_arquitecto_poligonos"] = {
    story: window.ARQUITECTO_POLIGONOS_STORY,
    area: "geometria",
    role: "npc",
  };

  MN_REGISTRY.areas.geometria.npcs["npc_arquitecto_poligonos"] =
    MN_REGISTRY.npcs["npc_arquitecto_poligonos"];
}

if (window.AREAS_STORY) {
  MN_REGISTRY.npcs["npc_topografo_areas"] = {
    story: window.AREAS_STORY,
    area: "geometria",
    role: "npc",
  };

  MN_REGISTRY.areas.geometria.npcs["npc_topografo_areas"] =
    MN_REGISTRY.npcs["npc_topografo_areas"];
}

if (window.DESCARTES_STORY) {
  MN_REGISTRY.npcs["npc_descartes_cartesiano"] = {
    story: window.DESCARTES_STORY,
    area: "geometria",
    role: "npc",
  };

  MN_REGISTRY.areas.geometria.npcs["npc_descartes_cartesiano"] =
    MN_REGISTRY.npcs["npc_descartes_cartesiano"];
}

if (window.GALILEO_GRAFICAS_STORY) {
  MN_REGISTRY.npcs["npc_galileo_graficas"] = {
    story: window.GALILEO_GRAFICAS_STORY,
    area: "geometria",
    role: "npc",
  };

  MN_REGISTRY.areas.geometria.npcs["npc_galileo_graficas"] =
    MN_REGISTRY.npcs["npc_galileo_graficas"];
}

if (window.EVARISTO_TRAZOS_STORY) {
  MN_REGISTRY.npcs["npc_aprendiz_regla_y_compas"] = {
    story: window.EVARISTO_TRAZOS_STORY,
    area: "geometria",
    role: "npc",
  };

  MN_REGISTRY.areas.geometria.npcs["npc_aprendiz_regla_y_compas"] =
    MN_REGISTRY.npcs["npc_aprendiz_regla_y_compas"];
}

if (window.PITAGORAS_PROBLEMAS_STORY) {
  MN_REGISTRY.npcs["npc_pitagoras_problemas"] = {
    story: window.PITAGORAS_PROBLEMAS_STORY,
    area: "geometria",
    role: "npc",
  };

  MN_REGISTRY.npcs["npc_euclides_problemas"] =
    MN_REGISTRY.npcs["npc_pitagoras_problemas"];

  MN_REGISTRY.areas.geometria.npcs["npc_pitagoras_problemas"] =
    MN_REGISTRY.npcs["npc_pitagoras_problemas"];
  MN_REGISTRY.areas.geometria.npcs["npc_euclides_problemas"] =
    MN_REGISTRY.npcs["npc_pitagoras_problemas"];
}

if (window.PITAGORAS_CIERRE_STORY) {
  MN_REGISTRY.npcs["npc_geometria_cierre"] = {
    story: window.PITAGORAS_CIERRE_STORY,
    area: "geometria",
    role: "npc",
  };

  MN_REGISTRY.areas.geometria.npcs["npc_geometria_cierre"] =
    MN_REGISTRY.npcs["npc_geometria_cierre"];
}

const GEOMETRIA_MINIGAMES = {
  congruencia: {
    id: "congruencia",
    factory: (game) => new (window.TangramScene || window.CongruenciaScene)(game),
    sheets: 1,
  },
  deduccion: {
    id: "deduccion",
    factory: (game) => new DeduccionScene(game),
    sheets: 2,
  },
  angulos: {
    id: "angulos",
    factory: (game) => new AngulosScene(game),
    sheets: 1,
  },
  isosceles: {
    id: "isosceles",
    factory: (game) => new IsoscelesScene(game),
    sheets: 1,
  },
  angulos_ecuaciones: {
    id: "angulos_ecuaciones",
    factory: (game) => new AngulosEcuacionesScene(game),
    sheets: 1,
  },
  poligonos: {
    id: "poligonos",
    factory: (game) => new PoligonosScene(game),
    sheets: 2,
  },
  areas: {
    id: "areas",
    factory: (game) => new AreasScene(game),
    sheets: 2,
  },
  cartesiano: {
    id: "cartesiano",
    factory: (game) => new CartesianoScene(game),
    sheets: 1,
  },
  graficas: {
    id: "graficas",
    factory: (game) => new GraficasScene(game),
    sheets: 1,
  },
  regla_y_compas: {
    id: "regla_y_compas",
    factory: (game) => new ReglaYCompasScene(game),
    sheets: 1,
  },
  problemas: {
    id: "problemas",
    factory: (game) => new ProblemasScene(game),
    sheets: 2,
  },
};

for (const [key, entry] of Object.entries(GEOMETRIA_MINIGAMES)) {
  MN_REGISTRY.minigames[key] = entry;
  MN_REGISTRY.areas.geometria.minigames[key] = entry;
}
