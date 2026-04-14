// assets/algebra/data/registro_algebra.js
// Registro basico del area de Algebra

window.MN_SHEETS_REWARD = window.MN_SHEETS_REWARD || {};
window.MN_SHEETS_REWARD.anagrama = {
  1: "sheet_algebra_1",
};
window.MN_SHEETS_REWARD.balanza = {
  1: "sheet_algebra_2",
};
window.MN_SHEETS_REWARD.brahmagupta_enigmas = {
  1: "sheet_algebra_3",
};
window.MN_SHEETS_REWARD.incrementos = {
  1: "sheet_algebra_4",
};
window.MN_SHEETS_REWARD.lenguaje_natural = {
  1: "sheet_algebra_5",
};
window.MN_SHEETS_REWARD.algebra_sustitucion_laberinto = {
  1: "sheet_algebra_6",
};
window.MN_SHEETS_REWARD.despejes = {
  1: "sheet_algebra_7",
};
window.MN_SHEETS_REWARD.balanceo_ecuaciones = {
  1: "sheet_algebra_8",
};
window.MN_SHEETS_REWARD.modelar = {
  1: "sheet_algebra_9",
};

window.MN_REGISTRY = window.MN_REGISTRY || {};
MN_REGISTRY.npcs = MN_REGISTRY.npcs || {};
MN_REGISTRY.minigames = MN_REGISTRY.minigames || {};
MN_REGISTRY.areas = MN_REGISTRY.areas || {};
MN_REGISTRY.areas.algebra =
  MN_REGISTRY.areas.algebra || { intro: null, npcs: {}, minigames: {} };

if (window.ALJUARISMI_BALANCEO_STORY) {
  MN_REGISTRY.npcs["npc_aljuarismi_balanceo"] = {
    story: window.ALJUARISMI_BALANCEO_STORY,
    area: "algebra",
    role: "boss",
  };

  MN_REGISTRY.areas.algebra.npcs["npc_aljuarismi_balanceo"] =
    MN_REGISTRY.npcs["npc_aljuarismi_balanceo"];
}

if (window.ALJUARISMI_CIERRE_STORY) {
  MN_REGISTRY.npcs["npc_algebra_cierre"] = {
    story: window.ALJUARISMI_CIERRE_STORY,
    area: "algebra",
    role: "boss",
  };

  MN_REGISTRY.areas.algebra.npcs["npc_algebra_cierre"] =
    MN_REGISTRY.npcs["npc_algebra_cierre"];
}

if (window.SOFIA_ALGEBRA_STORY) {
  MN_REGISTRY.npcs["npc_sofia_algebra"] = {
    story: window.SOFIA_ALGEBRA_STORY,
    area: "algebra",
    role: "guia",
  };

  MN_REGISTRY.areas.algebra.npcs["npc_sofia_algebra"] =
    MN_REGISTRY.npcs["npc_sofia_algebra"];
}

if (window.SOFIA_GEOMETRIA_GATE_STORY) {
  MN_REGISTRY.npcs["npc_sofia_geometria_gate"] = {
    story: window.SOFIA_GEOMETRIA_GATE_STORY,
    area: "algebra",
    role: "guia",
  };

  MN_REGISTRY.areas.algebra.npcs["npc_sofia_geometria_gate"] =
    MN_REGISTRY.npcs["npc_sofia_geometria_gate"];
}

if (window.FELIPON_CONCEPTOS_STORY) {
  MN_REGISTRY.npcs["npc_felipon_conceptos"] = {
    story: window.FELIPON_CONCEPTOS_STORY,
    area: "algebra",
    role: "guia",
  };

  MN_REGISTRY.areas.algebra.npcs["npc_felipon_conceptos"] =
    MN_REGISTRY.npcs["npc_felipon_conceptos"];
}

if (window.BODEGUERO_BALANZA_STORY) {
  MN_REGISTRY.npcs["npc_bodeguero_balanza"] = {
    story: window.BODEGUERO_BALANZA_STORY,
    area: "algebra",
    role: "guia",
  };

  MN_REGISTRY.areas.algebra.npcs["npc_bodeguero_balanza"] =
    MN_REGISTRY.npcs["npc_bodeguero_balanza"];
}

if (window.BRAHMAGUPTA_ENIGMAS_STORY) {
  MN_REGISTRY.npcs["npc_brahmagupta_enigmas"] = {
    story: window.BRAHMAGUPTA_ENIGMAS_STORY,
    area: "algebra",
    role: "guia",
  };

  MN_REGISTRY.areas.algebra.npcs["npc_brahmagupta_enigmas"] =
    MN_REGISTRY.npcs["npc_brahmagupta_enigmas"];
}

if (window.SILVANO_LENGUAJE_NATURAL_STORY) {
  MN_REGISTRY.npcs["npc_silvano_lenguaje_natural"] = {
    story: window.SILVANO_LENGUAJE_NATURAL_STORY,
    area: "algebra",
    role: "guia",
  };

  MN_REGISTRY.areas.algebra.npcs["npc_silvano_lenguaje_natural"] =
    MN_REGISTRY.npcs["npc_silvano_lenguaje_natural"];
}

if (window.ARIADNA_SUSTITUIR_EVALUAR_STORY) {
  MN_REGISTRY.npcs["npc_ariadna_sustitucion_laberinto"] = {
    story: window.ARIADNA_SUSTITUIR_EVALUAR_STORY,
    area: "algebra",
    role: "guia",
  };

  MN_REGISTRY.areas.algebra.npcs["npc_ariadna_sustitucion_laberinto"] =
    MN_REGISTRY.npcs["npc_ariadna_sustitucion_laberinto"];
}

if (window.TADEO_TERMINOS_SEMEJANTES_STORY || window.MATEO_CLASIFICADOR_STORY) {
  MN_REGISTRY.npcs["npc_tadeo_terminos_semejantes"] = {
    story:
      window.TADEO_TERMINOS_SEMEJANTES_STORY || window.MATEO_CLASIFICADOR_STORY,
    area: "algebra",
    role: "guia",
  };

  MN_REGISTRY.areas.algebra.npcs["npc_tadeo_terminos_semejantes"] =
    MN_REGISTRY.npcs["npc_tadeo_terminos_semejantes"];
}

if (window.HOWDIN_CERRAJERO_STORY) {
  MN_REGISTRY.npcs["npc_howdin_cerrajero"] = {
    story: window.HOWDIN_CERRAJERO_STORY,
    area: "algebra",
    role: "guia",
  };

  MN_REGISTRY.areas.algebra.npcs["npc_howdin_cerrajero"] =
    MN_REGISTRY.npcs["npc_howdin_cerrajero"];
}

if (window.CLARA_MODELACION_STORY) {
  MN_REGISTRY.npcs["npc_clara_modelar"] = {
    story: window.CLARA_MODELACION_STORY,
    area: "algebra",
    role: "guia",
  };

  MN_REGISTRY.areas.algebra.npcs["npc_clara_modelar"] =
    MN_REGISTRY.npcs["npc_clara_modelar"];
}

const ALGEBRA_MINIGAMES = {
  balanceo_ecuaciones: {
    id: "balanceo_ecuaciones",
    factory: (game) => new ResolverEcuacionesScene(game),
    sheets: 2,
  },
  balanza: {
    id: "balanza",
    factory: (game) => new BalanzaScene(game),
    sheets: 1,
  },
  algebra_sustitucion_laberinto: {
    id: "algebra_sustitucion_laberinto",
    factory: (game) => new SustituirYEvaluarScene(game),
    sheets: 2,
  },
  despejes: {
    id: "despejes",
    factory: (game) => new DespejesScene(game),
    sheets: 1,
  },
  brahmagupta_enigmas: {
    id: "brahmagupta_enigmas",
    factory: (game) => new EnigmasDelNumeroScene(game),
    sheets: 1,
  },
  lenguaje_natural: {
    id: "lenguaje_natural",
    factory: (game) => new LenguajeNaturalScene(game),
    sheets: 1,
  },
  incrementos: {
    id: "incrementos",
    factory: (game) => new TerminosSemejantesScene(game),
    sheets: 1,
  },
  modelar: {
    id: "modelar",
    factory: (game) => new ModelarScene(game),
    sheets: 2,
  },
  anagrama: {
    id: "anagrama",
    factory: (game) => new ConceptosAlgebraicosScene(game),
    sheets: 1,
  },
};

for (const [key, entry] of Object.entries(ALGEBRA_MINIGAMES)) {
  MN_REGISTRY.minigames[key] = entry;
  MN_REGISTRY.areas.algebra.minigames[key] = entry;
}
