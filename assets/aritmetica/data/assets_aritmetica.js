// assets/aritmetica/data/assets_aritmetica.js
const MATHNM_ASSETS = [
  { type: "image", key: "pl_idle", src: "assets/general/images/player/idle.webp" },
  { type: "image", key: "pl_walk", src: "assets/general/images/player/walk.webp" },  
  { type: "image", key: "pl_dead", src: "assets/general/images/player/dead.webp" },  

  // BACKGROUNDS DE OVERWORLD Y NOVELA
  { type: "image", key: "mn_bg_intro", src: "assets/aritmetica/backgrounds/mn_bg_intro.webp" },  
  { type: "image", key: "mn_bg_arit",   src: "assets/aritmetica/backgrounds/bg_arit.webp" },
  { type: "image", key: "bg_sofia", src: "assets/aritmetica/backgrounds/bg_sofia.webp" },
  { type: "image", key: "bg_escriba", src: "assets/aritmetica/backgrounds/bg_escriba.webp" },  
  { type: "image", key: "bg_caja_rapida", src: "assets/aritmetica/backgrounds/bg_cajaRapida.webp" },  
  { type: "image", key: "bg_sumas", src: "assets/aritmetica/backgrounds/bg_sumas.webp" },
  { type: "image", key: "bg_leonardo", src: "assets/aritmetica/backgrounds/bg_leonardo.webp" },
  { type: "image", key: "bg_galileo", src: "assets/aritmetica/backgrounds/bg_galileo.webp" }, 
  { type: "image", key: "bg_luciernagas", src: "assets/aritmetica/backgrounds/bg_bosque.webp" },  
  { type: "image", key: "bg_mina", src: "assets/aritmetica/backgrounds/bg_mineros.webp" },
  { type: "image", key: "bg_classroom", src: "assets/aritmetica/backgrounds/bg_classroom.webp" },
  { type: "image", key: "bg_general", src: "assets/aritmetica/backgrounds/bg_general.webp" },
  { type: "image", key: "bg_divisores", src: "assets/aritmetica/backgrounds/bg_divisores.webp" },
  
  // NPCS
  { type: "image", key: "ch_nico", src: "assets/aritmetica/npcs/nico.webp" },
  { type: "image", key: "ch_sofia",  src: "assets/aritmetica/npcs/sofia.webp" },  
  { type: "image", key: "ch_escriba", src: "assets/aritmetica/npcs/escriba.webp" },
  { type: "image", key: "ch_mercader", src: "assets/aritmetica/npcs/mercader.webp" },
  { type: "image", key: "ch_escaleraSumas", src: "assets/aritmetica/npcs/escaleraSumas.webp" },  
  { type: "image", key: "ch_guardian", src: "assets/aritmetica/npcs/restaLuciernagas.webp" },  
  { type: "image", key: "ch_minero", src: "assets/aritmetica/npcs/minero.webp" },
  { type: "image", key: "ch_galileo", src: "assets/aritmetica/npcs/galileo.webp" },
  { type: "image", key: "ch_armonia", src: "assets/aritmetica/npcs/armonia.webp" },
  { type: "image", key: "ch_chaman", src: "assets/aritmetica/npcs/chaman.webp" },
  { type: "image", key: "ch_general", src: "assets/aritmetica/npcs/generalSignos.webp" },      
  { type: "image", key: "ch_eratostenes", src: "assets/aritmetica/npcs/eratostenes.webp" },  
  { type: "image", key: "ch_leonardo", src: "assets/aritmetica/npcs/fibonacci.webp" },  

  // SFX for overworld y novela
  { type: "audio", key: "text_blip", src: "assets/general/sounds/sfx/text_blip.mp3" },
  
  // MUSIC
  { type: "audio", key: "bgm_overworld", src: "assets/general/music/bgm_overworld.mp3" },
  { type: "audio", key: "bgm_quiet",    src: "assets/general/music/bgm_quiet.mp3" },    

  // VIDEOS
  { type: "video", key: "vid_intro", src: "assets/general/videos/mn_intro.mp4" },
  { type: "video", key: "vid_galileo", src: "assets/general/videos/mn_galileo.mp4" },
  { type: "video", key: "vid_cierre", src: "assets/general/videos/mn_cierre_aritmetica.mp4" },

  // ========== UI ==========
  { type: "image", key: "title_bg", src: "assets/general/images/ui/title_bg.webp" },   
  { type: "image", key: "ui_mouse", src: "assets/general/images/ui/icon_mouse.webp" },   
  { type: "image", key: "ui_keyboard", src: "assets/general/images/ui/icon_keyboard.webp" },   
  { type: "image", key: "ui_leaf", src: "assets/general/images/ui/leaf.webp" },   
  { type: "image", key: "ui_book", src: "assets/general/images/ui/libro.webp" },
  { type: "image", key: "obj_barril", src: "assets/general/images/objects/barril.webp" },
  { type: "image", key: "obj_cajas", src: "assets/general/images/objects/cajas.webp" },
  { type: "image", key: "obj_tronco", src: "assets/general/images/objects/tronco.webp" },
];
window.MATHNM_ASSETS = MATHNM_ASSETS;

// ================== HOJAS (LIBRO DE CONOCIMIENTO) ==================
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
  { type: "image", key: "sheet_igualdad", src: "assets/geometria/hojas/1_igualdad.webp" },
  { type: "image", key: "sheet_deduccion", src: "assets/geometria/hojas/2_deducir.webp" },
  { type: "image", key: "sheet_demostracion", src: "assets/geometria/hojas/2_Demostracion.webp" },
  { type: "image", key: "sheet_angulos", src: "assets/geometria/hojas/3_angulos.webp" },
  { type: "image", key: "sheet_isosceles", src: "assets/geometria/hojas/4_isosceles.webp" },
  { type: "image", key: "sheet_angulos_ecuaciones", src: "assets/geometria/hojas/5_angulos_ecuaciones.webp" },
  { type: "image", key: "sheet_poligonos", src: "assets/geometria/hojas/6_PolÃ­gonos_regulares.webp" },
  { type: "image", key: "sheet_perimetro", src: "assets/geometria/hojas/7_perimetro.webp" },
  { type: "image", key: "sheet_areas", src: "assets/geometria/hojas/7_areas.webp" },
  { type: "image", key: "sheet_cartesiano", src: "assets/geometria/hojas/8_plano_cartesiano.webp" },
  { type: "image", key: "sheet_graficas", src: "assets/geometria/hojas/9_graficas.webp" },
  { type: "image", key: "sheet_regla_y_compas", src: "assets/geometria/hojas/10_regla_y_compas.webp" },
  { type: "image", key: "sheet_euclides", src: "assets/geometria/hojas/11_Euclides.webp" },
  { type: "image", key: "sheet_mas_alla_figuras", src: "assets/geometria/hojas/11_Mas_all_de_las_figuras.webp" },
];

// ASSETS para los minijuegos
window.MN_ASSETS_SFX_CORE = [
  { type: "audio", key: "sfx_ok",        src: "assets/general/sounds/sfx/ok_sound.mp3" },
  { type: "audio", key: "sfx_match",        src: "assets/general/sounds/sfx/match.mp3" },
  { type: "audio", key: "sfx_win",          src: "assets/general/sounds/sfx/win.mp3" },
  { type: "audio", key: "sfx_error",        src: "assets/general/sounds/sfx/error_sound.mp3" },
  { type: "audio", key: "sfx_change_page",  src: "assets/general/sounds/sfx/change_page.mp3" },  
  { type: "audio", key: "sfx_choque",  src: "assets/general/sounds/sfx/choque.mp3" },
  { type: "audio", key: "sfx_explosion",  src: "assets/general/sounds/sfx/explosion.wav" }, 
];

window.MN_ASSETS_ESCRIBA_MUESCAS = [
  { type: "image", key: "egypt_1",  src: "assets/aritmetica/minijuegos/escriba/egy_1.webp" },
  { type: "image", key: "egypt_10", src: "assets/aritmetica/minijuegos/escriba/egy_10.webp" },
  { type: "image", key: "chiken", src: "assets/aritmetica/minijuegos/escriba/chiken.webp" },  
];

window.MN_ASSETS_CAJA_RAPIDA = [
  { type: "image", key: "npc_face_happy", src: "assets/aritmetica/minijuegos/caja/face_happy.webp",},
  { type: "image", key: "npc_face_upset", src: "assets/aritmetica/minijuegos/caja/face_upset.webp",},            
  { type: "image", key: "npc_face_angry", src: "assets/aritmetica/minijuegos/caja/face_angry.webp",},            
  { type: "image", key: "npc_beard_1", src: "assets/aritmetica/minijuegos/caja/beard1.webp",},      
  { type: "image", key: "npc_beard_2", src: "assets/aritmetica/minijuegos/caja/beard2.webp",},      
  { type: "image", key: "npc_body_0", src: "assets/aritmetica/minijuegos/caja/body1.webp",},      
  { type: "image", key: "npc_body_1", src: "assets/aritmetica/minijuegos/caja/body2.webp",},      
  { type: "image", key: "npc_body_2", src: "assets/aritmetica/minijuegos/caja/body3.webp",},      
  { type: "image", key: "npc_hair_0", src: "assets/aritmetica/minijuegos/caja/hair01.webp",},      
  { type: "image", key: "npc_hair_1", src: "assets/aritmetica/minijuegos/caja/hair02.webp",},
  { type: "image", key: "npc_hair_2", src: "assets/aritmetica/minijuegos/caja/hair03.webp",},
  { type: "image", key: "npc_hair_3", src: "assets/aritmetica/minijuegos/caja/hair04.webp",},
  { type: "image", key: "npc_hair_4", src: "assets/aritmetica/minijuegos/caja/hair05.webp",},
  { type: "image", key: "npc_hair_5", src: "assets/aritmetica/minijuegos/caja/hair06.webp",},
  { type: "image", key: "npc_hair_6", src: "assets/aritmetica/minijuegos/caja/hair07.webp",},
  { type: "image", key: "npc_hair_7", src: "assets/aritmetica/minijuegos/caja/hair08.webp",},
  { type: "image", key: "npc_hair_8", src: "assets/aritmetica/minijuegos/caja/hair09.webp",},
  { type: "image", key: "npc_hair_9", src: "assets/aritmetica/minijuegos/caja/hair10.webp",},
  { type: "image", key: "npc_hair_10", src: "assets/aritmetica/minijuegos/caja/hair11.webp",},  
  { type: "image", key: "cr_item_1", src: "assets/aritmetica/minijuegos/caja/item_1.webp",},      
  { type: "image", key: "cr_item_2", src: "assets/aritmetica/minijuegos/caja/item_2.webp",},      
  { type: "image", key: "cr_item_3", src: "assets/aritmetica/minijuegos/caja/item_3.webp",},      
  { type: "image", key: "cr_item_5", src: "assets/aritmetica/minijuegos/caja/item_5.webp",},      
  { type: "image", key: "cr_item_10", src: "assets/aritmetica/minijuegos/caja/item_10.webp",},      
  { type: "image", key: "bg_caja_rapida", src: "assets/aritmetica/minijuegos/caja/caja_rapida_tienda.webp",},   
];

window.MN_ASSETS_ESCALERA_SUMAS = [  
  { type: "image", key: "player_ahogado", src: "assets/aritmetica/minijuegos/escalera/ahogado.webp" },
  { type: "image", key: "mn_bg_sumas", src: "assets/aritmetica/minijuegos/escalera/bg_sumas.webp" },  
  { type: "image", key: "npc_guardian_sumas", src: "assets/aritmetica/minijuegos/escalera/DonTadeo.webp" },
];

window.MN_ASSETS_RESTAS_LUCIERNAGAS = [
  { type: "image", key: "mn_bg_restas", src: "assets/aritmetica/minijuegos/restas/bg_bosque.webp" },
  { type: "image", key: "hunter", src: "assets/aritmetica/minijuegos/restas/hunter.webp" },  
];

window.MN_ASSETS_ELEVADOR = [
  { type: "image", key: "bg_elevador", src: "assets/aritmetica/minijuegos/division/bg_mina.webp",},    
  { type: "image", key: "spr_monster", src: "assets/aritmetica/minijuegos/division/baby_monster.webp" },    
];

window.MN_ASSETS_ARMONIA_DIVISION = [
  { type: "image", key: "bg_karaoke", src: "assets/aritmetica/minijuegos/armonia/bg_karaoke.webp" },
  { type: "audio", key: "bgm_armonia_division", src: "assets/aritmetica/minijuegos/armonia/Aluquin_Math_nightmare.mp3" },
];

window.MN_ASSETS_GALILEO_TABLAS = [
  { type: "image", key: "mn_meteor", src: "assets/aritmetica/minijuegos/tablas/meteoro.webp",},  
  { type: "image", key: "mn_explosion", src: "assets/aritmetica/minijuegos/tablas/explosion.webp",},
  { type: "image", key: "mn_tablas_cockpit", src: "assets/aritmetica/minijuegos/tablas/nave.webp",},
];

window.MN_ASSETS_CHAMAN_JERARQUIA = [
  { type: "image", key: "scared", src: "assets/aritmetica/minijuegos/jerarquia/scared.webp",},
  { type: "image", key: "monster", src: "assets/aritmetica/minijuegos/jerarquia/walk_monster.webp",},
  { type: "image", key: "mn_classroom_bg", src: "assets/aritmetica/minijuegos/jerarquia/bg_classroom.webp",},
];

window.MN_ASSETS_GENERAL_SIGNOS = [
  { type: "image", key: "mn_bg_signos", src: "assets/aritmetica/minijuegos/signos/bg_battlefield.webp",},    
  { type: "image", key: "idle", src: "assets/aritmetica/minijuegos/signos/idle.webp" },
  { type: "image", key: "walk", src: "assets/aritmetica/minijuegos/signos/walk.webp" },
  { type: "image", key: "dead", src: "assets/aritmetica/minijuegos/signos/dead.webp" },
];

window.MN_ASSETS_DIVISORES = [
  { type: "image", key: "bg_divisores", src: "assets/aritmetica/minijuegos/divisores/bg_divisores.webp",},      
  { type: "image", key: "ghost", src: "assets/aritmetica/minijuegos/divisores/ghost.webp",},
  { type: "image", key: "idle", src: "assets/aritmetica/minijuegos/divisores/idle.webp",},
  { type: "image", key: "walk", src: "assets/aritmetica/minijuegos/divisores/walk.webp",},
  { type: "image", key: "dead", src: "assets/aritmetica/minijuegos/divisores/dead.webp",},
  { type: "image", key: "shot", src: "assets/aritmetica/minijuegos/divisores/shot.webp",},  
  { type: "image", key: "hit", src: "assets/aritmetica/minijuegos/divisores/hit.webp",},
];

window.MN_ASSETS_RAZONAMIENTO = [
  { type: "image", key: "bg_razonamiento", src: "assets/aritmetica/minijuegos/razonamiento/bg_board.webp",},        
];
