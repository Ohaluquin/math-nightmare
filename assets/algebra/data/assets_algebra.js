// assets/algebra/data/assets_algebra.js
const MATHNM_ASSETS = [
  { type: "image", key: "pl_idle", src: "assets/general/images/player/idle.png" },
  { type: "image", key: "pl_walk", src: "assets/general/images/player/walk.png" },  
  { type: "image", key: "pl_dead", src: "assets/general/images/player/dead.png" },  
  { type: "image", key: "mn_bg_arit", src: "assets/algebra/backgrounds/bg_algebra.webp" },
  { type: "image", key: "ch_nico", src: "assets/aritmetica/npcs/nico.png" },
  { type: "image", key: "ch_sofia", src: "assets/algebra/npcs/sofia.webp" },
  { type: "image", key: "ch_felipon", src: "assets/algebra/npcs/felipon.webp" },
  { type: "image", key: "ch_bodeguero", src: "assets/algebra/npcs/bodeguero.webp" },
  { type: "image", key: "ch_brahmagupta", src: "assets/algebra/npcs/brahmagupta.webp" },
  { type: "image", key: "ch_silvano", src: "assets/algebra/npcs/guia.webp" },
  { type: "image", key: "ch_ariadna", src: "assets/algebra/npcs/ariadna.webp" },
  { type: "image", key: "ch_tadeo", src: "assets/algebra/npcs/astronauta.webp" },
  { type: "image", key: "ch_mateo", src: "assets/algebra/npcs/astronauta.webp" },
  { type: "image", key: "ch_howdin", src: "assets/algebra/npcs/howdin.webp" },
  { type: "image", key: "ch_aljuarismi", src: "assets/algebra/npcs/al_juarizmi.webp" },
  { type: "image", key: "ch_clara", src: "assets/algebra/npcs/clara.webp" },
  { type: "image", key: "bg_felipon_biblioteca", src: "assets/algebra/backgrounds/biblioteca.webp" },
  { type: "image", key: "bg_sofia", src: "assets/algebra/backgrounds/bg_sofia.webp" },
  { type: "image", key: "bg_bodega_exterior", src: "assets/algebra/backgrounds/bodega.webp" },
  { type: "image", key: "bg_brahmagupta_exterior", src: "assets/algebra/backgrounds/templo.webp" },
  { type: "image", key: "bg_bosque_entrada", src: "assets/algebra/backgrounds/bosque.webp" },
  { type: "image", key: "bg_jardin", src: "assets/algebra/backgrounds/jardin.webp" },  
  { type: "image", key: "bg_laberinto_entrada", src: "assets/algebra/backgrounds/laberinto.webp" },
  { type: "image", key: "bg_mazmorra", src: "assets/algebra/backgrounds/mazmorra.webp" },
  { type: "image", key: "bg_palacio", src: "assets/algebra/backgrounds/palacio.webp" },
  { type: "image", key: "bg_feria", src: "assets/algebra/backgrounds/feria.webp" },

  // SFX for overworld y novela
  { type: "audio", key: "text_blip", src: "assets/general/sounds/sfx/text_blip.mp3" },

  // MUSIC
  { type: "audio", key: "bgm_overworld", src: "assets/general/music/bgm_overworld.mp3" },
  { type: "audio", key: "bgm_algebra", src: "assets/general/music/bgm_algebra.mp3" },
  { type: "audio", key: "bgm_quiet", src: "assets/general/music/bgm_quiet.mp3" },

  // VIDEOS
  { type: "video", key: "vid_intro", src: "assets/general/videos/mn_intro.mp4" },
  { type: "video", key: "vid_cierre", src: "assets/general/videos/mn_cierre_algebra.mp4" },

  // ========== UI ==========
  { type: "image", key: "title_bg", src: "assets/general/images/ui/title_bg.png" },   
  { type: "image", key: "ui_mouse", src: "assets/general/images/ui/icon_mouse.png" },   
  { type: "image", key: "ui_keyboard", src: "assets/general/images/ui/icon_keyboard.png" },   
  { type: "image", key: "ui_leaf", src: "assets/general/images/ui/leaf.png" },   
  { type: "image", key: "ui_book", src: "assets/general/images/ui/libro.webp" },
  { type: "image", key: "obj_arbusto", src: "assets/general/images/objects/arbusto.png" },
  { type: "image", key: "obj_roca", src: "assets/general/images/objects/roca.png" },
  { type: "image", key: "obj_flores", src: "assets/general/images/objects/flores.png" },
  { type: "image", key: "obj_letrero", src: "assets/general/images/objects/letrero.png" },
];
window.MATHNM_ASSETS = MATHNM_ASSETS;

window.MN_ASSETS_SHEETS = [
  { type: "image", key: "sheet_numero", src: "assets/aritmetica/hojas/1_El_numero.webp" },
  { type: "image", key: "sheet_contar", src: "assets/aritmetica/hojas/1_Contar.webp" },
  { type: "image", key: "sheet_operaciones", src: "assets/aritmetica/hojas/2_Las_operaciones_para_entender_el_mundo.webp" },
  { type: "image", key: "sheet_aldea", src: "assets/aritmetica/hojas/2_Relato_de_un_dia_en_la_Aldea.webp" },
  { type: "image", key: "sheet_sistema_decimal", src: "assets/aritmetica/hojas/3_Sistema_Decimal.webp" },
  { type: "image", key: "sheet_suma", src: "assets/aritmetica/hojas/3_Suma.webp" },
  { type: "image", key: "sheet_resta", src: "assets/aritmetica/hojas/4_Resta.webp" },
  { type: "image", key: "sheet_cero", src: "assets/aritmetica/hojas/4_El_Cero.webp" },
  { type: "image", key: "sheet_multiplicacion", src: "assets/aritmetica/hojas/5_Multiplicacion.webp" },
  { type: "image", key: "sheet_dos_caras", src: "assets/aritmetica/hojas/5_Dos_caras_de_la_misma_moneda.webp" },
  { type: "image", key: "sheet_division", src: "assets/aritmetica/hojas/6_Algoritmo_de_la_division.webp" },
  { type: "image", key: "sheet_al_juarizmi", src: "assets/aritmetica/hojas/7_Al_juarizmi.webp" },
  { type: "image", key: "sheet_negativos", src: "assets/aritmetica/hojas/8_Los_negativos.webp" },
  { type: "image", key: "sheet_misteriosos", src: "assets/aritmetica/hojas/9_Numeros_misteriosos.webp" },
  { type: "image", key: "sheet_primos", src: "assets/aritmetica/hojas/9_Numeros_primos.webp" },
  { type: "image", key: "sheet_leonardo", src: "assets/aritmetica/hojas/10_Leonardo_de_Pisa.webp" },
  { type: "image", key: "sheet_algebra_1", src: "assets/algebra/hojas/1_algebra.webp" },
  { type: "image", key: "sheet_algebra_2", src: "assets/algebra/hojas/2_restaurar_y_equilibrar.webp" },
  { type: "image", key: "sheet_algebra_3", src: "assets/algebra/hojas/3_brahmagupta.webp" },
  { type: "image", key: "sheet_algebra_4", src: "assets/algebra/hojas/4_terminos_semejantes.webp" },
  { type: "image", key: "sheet_algebra_5", src: "assets/algebra/hojas/5_lenguaje_natural.webp" },
  { type: "image", key: "sheet_algebra_6", src: "assets/algebra/hojas/6_sustituir_y_evaluar.webp" },
  { type: "image", key: "sheet_algebra_7", src: "assets/algebra/hojas/7_despejes.webp" },
  { type: "image", key: "sheet_algebra_8", src: "assets/algebra/hojas/8_al_juarizmi.webp" },
  { type: "image", key: "sheet_algebra_9", src: "assets/algebra/hojas/9_modelado.webp" },  
];

// ASSETS para los minijuegos
window.MN_ASSETS_SFX_CORE = [
  { type: "audio", key: "sfx_ok",        src: "assets/general/sounds/sfx/ok_sound.mp3" },
  { type: "audio", key: "sfx_match",        src: "assets/general/sounds/sfx/match.mp3" },
  { type: "audio", key: "sfx_win",          src: "assets/general/sounds/sfx/win.mp3" },
  { type: "audio", key: "sfx_error",        src: "assets/general/sounds/sfx/error_sound.mp3" },
  { type: "audio", key: "sfx_change_page",  src: "assets/general/sounds/sfx/change_page.mp3" },  
  { type: "audio", key: "sfx_choque",  src: "assets/general/sounds/sfx/choque.mp3" },
  { type: "audio", key: "sfx_steps",  src: "assets/general/sounds/sfx/steps.mp3" },
  { type: "audio", key: "sfx_explosion",  src: "assets/general/sounds/sfx/explosion.wav" }, 
  { type: "audio", key: "sfx_loose",  src: "assets/general/sounds/sfx/loose.mp3" },
  { type: "audio", key: "sfx_rugido",  src: "assets/general/sounds/sfx/rugido.mp3" }, 
];

window.MN_ASSETS_BALANZA = [
  { type: "image", key: "bg_almacen", src: "assets/algebra/minijuegos/balanza/bg_almacen.webp" },  
];

window.MN_ASSETS_BALANCEO_ECUACIONES = [
  { type: "image", key: "bg_aljuarizmi", src: "assets/algebra/minijuegos/balanceoEcuacion/bg_aljuarizmi.webp" },  
];

window.MN_ASSETS_SUSTITUCION_MINOTAURO = [
  { type: "image", key: "minotauro_player_front", src: "assets/algebra/minijuegos/minotauro/player_front.webp" },
  { type: "image", key: "minotauro_player_back", src: "assets/algebra/minijuegos/minotauro/player_back.webp" },
  { type: "image", key: "minotauro_player_side", src: "assets/algebra/minijuegos/minotauro/player_side.webp" },
  { type: "image", key: "minotauro_enemy_front", src: "assets/algebra/minijuegos/minotauro/minotauro_front.webp" },
  { type: "image", key: "minotauro_enemy_back", src: "assets/algebra/minijuegos/minotauro/minotauro_back.webp" },
  { type: "image", key: "minotauro_enemy_side", src: "assets/algebra/minijuegos/minotauro/minotauro_side.webp" },
];

window.MN_ASSETS_DESPEJES = [
  { type: "image", key: "bg_despejes_pasillo", src: "assets/algebra/minijuegos/despejes/pasillo.webp" },
  { type: "image", key: "bg_despejes_pasillo2", src: "assets/algebra/minijuegos/despejes/pasillo2.webp" },
];

window.MN_ASSETS_MODELAR = [
  { type: "image", key: "bg_modelar", src: "assets/algebra/backgrounds/feria.webp" },
];

window.MN_ASSETS_BRAHMAGUPTA = [
  { type: "image", key: "bg_brahmagupta", src: "assets/algebra/minijuegos/brahmagupta/brahmagupta.webp" },
];

window.MN_ASSETS_LENGUAJE_NATURAL = [
  { type: "image", key: "bg_lenguaje_natural", src: "assets/algebra/minijuegos/lenguajeNatural/lenguaje.webp" },
  { type: "image", key: "player", src: "assets/algebra/minijuegos/lenguajeNatural/walk.webp" },
];

window.MN_ASSETS_ANAGRAMA = [
  { type: "image", key: "bg_anagramas", src: "assets/algebra/minijuegos/anagramas/bg_anagramas.webp" },
];

window.MN_ASSETS_TERMINOS_SEMEJANTES = [
  { type: "image", key: "mn_semejantes_meteor", src: "assets/algebra/minijuegos/semejantes/meteoro.webp" },
  { type: "image", key: "mn_semejantes_explosion", src: "assets/algebra/minijuegos/semejantes/explosion.webp" },
  { type: "image", key: "mn_semejantes_nave", src: "assets/algebra/minijuegos/semejantes/nave.webp" },
  { type: "image", key: "mn_semejantes_rayo", src: "assets/algebra/minijuegos/semejantes/rayo.webp" },
  { type: "audio", key: "sfx_semejantes_shot", src: "assets/general/sounds/sfx/shot.wav" },
];
