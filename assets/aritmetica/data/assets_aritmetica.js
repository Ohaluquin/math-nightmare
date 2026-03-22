// assets/aritmetica/data/assets_aritmetica.js
const MATHNM_ASSETS = [
  { type: "image", key: "pl_idle", src: "assets/general/images/player/idle.png" },
  { type: "image", key: "pl_walk", src: "assets/general/images/player/walk.png" },  
  { type: "image", key: "pl_dead", src: "assets/general/images/player/dead.png" },  

  // BACKGROUNDS DE OVERWORLD Y NOVELA
  { type: "image", key: "mn_bg_intro", src: "assets/aritmetica/backgrounds/mn_bg_intro.png" },  
  { type: "image", key: "mn_bg_arit",   src: "assets/aritmetica/backgrounds/bg_arit.png" },
  { type: "image", key: "bg_sofia", src: "assets/aritmetica/backgrounds/bg_sofia.png" },
  { type: "image", key: "bg_escriba", src: "assets/aritmetica/backgrounds/bg_escriba.png" },  
  { type: "image", key: "bg_caja_rapida", src: "assets/aritmetica/backgrounds/bg_cajaRapida.png" },  
  { type: "image", key: "bg_sumas", src: "assets/aritmetica/backgrounds/bg_sumas.png" },
  { type: "image", key: "bg_leonardo", src: "assets/aritmetica/backgrounds/bg_leonardo.png" },
  { type: "image", key: "bg_galileo", src: "assets/aritmetica/backgrounds/bg_galileo.png" }, 
  { type: "image", key: "bg_luciernagas", src: "assets/aritmetica/backgrounds/bg_bosque.png" },  
  { type: "image", key: "bg_mina", src: "assets/aritmetica/backgrounds/bg_mineros.png" },
  { type: "image", key: "bg_classroom", src: "assets/aritmetica/backgrounds/bg_classroom.png" },
  { type: "image", key: "bg_general", src: "assets/aritmetica/backgrounds/bg_general.png" },
  { type: "image", key: "bg_divisores", src: "assets/aritmetica/backgrounds/bg_divisores.png" },
  
  // NPCS
  { type: "image", key: "ch_nico", src: "assets/aritmetica/npcs/nico.png" },
  { type: "image", key: "ch_sofia",  src: "assets/aritmetica/npcs/sofia.png" },  
  { type: "image", key: "ch_escriba", src: "assets/aritmetica/npcs/escriba.png" },
  { type: "image", key: "ch_mercader", src: "assets/aritmetica/npcs/mercader.png" },
  { type: "image", key: "ch_escaleraSumas", src: "assets/aritmetica/npcs/escaleraSumas.png" },  
  { type: "image", key: "ch_guardian", src: "assets/aritmetica/npcs/restaLuciernagas.png" },  
  { type: "image", key: "ch_minero", src: "assets/aritmetica/npcs/minero.png" },
  { type: "image", key: "ch_galileo", src: "assets/aritmetica/npcs/galileo.png" },
  { type: "image", key: "ch_armonia", src: "assets/aritmetica/npcs/armonia.png" },
  { type: "image", key: "ch_chaman", src: "assets/aritmetica/npcs/chaman.png" },
  { type: "image", key: "ch_general", src: "assets/aritmetica/npcs/generalSignos.png" },      
  { type: "image", key: "ch_eratostenes", src: "assets/aritmetica/npcs/eratostenes.png" },  
  { type: "image", key: "ch_leonardo", src: "assets/aritmetica/npcs/fibonacci.png" },  

  // SFX for overworld y novela
  { type: "audio", key: "text_blip", src: "assets/general/sounds/sfx/text_blip.mp3" },
  
  // MUSIC
  { type: "audio", key: "bgm_overworld", src: "assets/aritmetica/music/bgm_overworld.mp3" },
  { type: "audio", key: "bgm_quiet",    src: "assets/aritmetica/music/bgm_quiet.mp3" },    

  // VIDEOS
  { type: "video", key: "vid_intro", src: "assets/general/videos/mn_intro.mp4" },
  { type: "video", key: "vid_galileo", src: "assets/aritmetica/videos/mn_galileo.mp4" },
  { type: "video", key: "vid_cierre", src: "assets/aritmetica/videos/mn_cierre.mp4" },

  // ========== UI ==========
  { type: "image", key: "title_bg", src: "assets/general/images/ui/title_bg.png" },   
  { type: "image", key: "ui_mouse", src: "assets/general/images/ui/icon_mouse.png" },   
  { type: "image", key: "ui_keyboard", src: "assets/general/images/ui/icon_keyboard.png" },   
  { type: "image", key: "ui_leaf", src: "assets/general/images/ui/leaf.png" },   
  { type: "image", key: "obj_barril", src: "assets/general/images/objects/barril.png" },
  { type: "image", key: "obj_cajas", src: "assets/general/images/objects/cajas.png" },
  { type: "image", key: "obj_tronco", src: "assets/general/images/objects/tronco.png" },
];
window.MATHNM_ASSETS = MATHNM_ASSETS;

// ================== HOJAS (LIBRO DE CONOCIMIENTO) ==================
window.MN_ASSETS_SHEETS = [
  { type: "image", key: "sheet_numero", src: "assets/aritmetica/hojas/1_El_numero.png" },
  { type: "image", key: "sheet_contar", src: "assets/aritmetica/hojas/1_Contar.png" },
  { type: "image", key: "sheet_operaciones", src: "assets/aritmetica/hojas/2_Las_operaciones_para_entender_el_mundo.png" },
  { type: "image", key: "sheet_aldea", src: "assets/aritmetica/hojas/2_Relato_de_un_dia_en_la_Aldea.png" },
  { type: "image", key: "sheet_sistema_decimal", src: "assets/aritmetica/hojas/3_Sistema_Decimal.png" },
  { type: "image", key: "sheet_suma", src: "assets/aritmetica/hojas/3_Suma.png" },  
  { type: "image", key: "sheet_resta", src: "assets/aritmetica/hojas/4_Resta.png" },  
  { type: "image", key: "sheet_cero", src: "assets/aritmetica/hojas/4_El_Cero.png" },    
  { type: "image", key: "sheet_multiplicacion", src: "assets/aritmetica/hojas/5_Multiplicacion.png" },
  { type: "image", key: "sheet_dos_caras", src: "assets/aritmetica/hojas/5_Dos_caras_de_la_misma_moneda.png" },
  { type: "image", key: "sheet_division", src: "assets/aritmetica/hojas/6_Algoritmo_de_la_division.png" },          
  { type: "image", key: "sheet_al_juarizmi", src: "assets/aritmetica/hojas/7_Al_juarizmi.png" },  
  { type: "image", key: "sheet_negativos", src: "assets/aritmetica/hojas/8_Los_negativos.png" },
  { type: "image", key: "sheet_misteriosos", src: "assets/aritmetica/hojas/9_Numeros_misteriosos.png" },  
  { type: "image", key: "sheet_primos", src: "assets/aritmetica/hojas/9_Numeros_primos.png" },
  { type: "image", key: "sheet_leonardo", src: "assets/aritmetica/hojas/10_Leonardo_de_Pisa.png" },
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
  { type: "image", key: "egypt_1",  src: "assets/aritmetica/minijuegos/escriba/egy_1.png" },
  { type: "image", key: "egypt_10", src: "assets/aritmetica/minijuegos/escriba/egy_10.png" },
  { type: "image", key: "chiken", src: "assets/aritmetica/minijuegos/escriba/chiken.png" },  
];

window.MN_ASSETS_CAJA_RAPIDA = [
  { type: "image", key: "npc_face_happy", src: "assets/aritmetica/minijuegos/caja/face_happy.png",},
  { type: "image", key: "npc_face_upset", src: "assets/aritmetica/minijuegos/caja/face_upset.png",},            
  { type: "image", key: "npc_face_angry", src: "assets/aritmetica/minijuegos/caja/face_angry.png",},            
  { type: "image", key: "npc_beard_1", src: "assets/aritmetica/minijuegos/caja/beard1.png",},      
  { type: "image", key: "npc_beard_2", src: "assets/aritmetica/minijuegos/caja/beard2.png",},      
  { type: "image", key: "npc_body_0", src: "assets/aritmetica/minijuegos/caja/body1.png",},      
  { type: "image", key: "npc_body_1", src: "assets/aritmetica/minijuegos/caja/body2.png",},      
  { type: "image", key: "npc_body_2", src: "assets/aritmetica/minijuegos/caja/body3.png",},      
  { type: "image", key: "npc_hair_0", src: "assets/aritmetica/minijuegos/caja/hair01.png",},      
  { type: "image", key: "npc_hair_1", src: "assets/aritmetica/minijuegos/caja/hair02.png",},
  { type: "image", key: "npc_hair_2", src: "assets/aritmetica/minijuegos/caja/hair03.png",},
  { type: "image", key: "npc_hair_3", src: "assets/aritmetica/minijuegos/caja/hair04.png",},
  { type: "image", key: "npc_hair_4", src: "assets/aritmetica/minijuegos/caja/hair05.png",},
  { type: "image", key: "npc_hair_5", src: "assets/aritmetica/minijuegos/caja/hair06.png",},
  { type: "image", key: "npc_hair_6", src: "assets/aritmetica/minijuegos/caja/hair07.png",},
  { type: "image", key: "npc_hair_7", src: "assets/aritmetica/minijuegos/caja/hair08.png",},
  { type: "image", key: "npc_hair_8", src: "assets/aritmetica/minijuegos/caja/hair09.png",},
  { type: "image", key: "npc_hair_9", src: "assets/aritmetica/minijuegos/caja/hair10.png",},
  { type: "image", key: "npc_hair_10", src: "assets/aritmetica/minijuegos/caja/hair11.png",},  
  { type: "image", key: "cr_item_1", src: "assets/aritmetica/minijuegos/caja/item_1.png",},      
  { type: "image", key: "cr_item_2", src: "assets/aritmetica/minijuegos/caja/item_2.png",},      
  { type: "image", key: "cr_item_3", src: "assets/aritmetica/minijuegos/caja/item_3.png",},      
  { type: "image", key: "cr_item_5", src: "assets/aritmetica/minijuegos/caja/item_5.png",},      
  { type: "image", key: "cr_item_10", src: "assets/aritmetica/minijuegos/caja/item_10.png",},      
  { type: "image", key: "bg_caja_rapida", src: "assets/aritmetica/minijuegos/caja/caja_rapida_tienda.png",},   
];

window.MN_ASSETS_ESCALERA_SUMAS = [  
  { type: "image", key: "player_ahogado", src: "assets/aritmetica/minijuegos/escalera/ahogado.png" },
  { type: "image", key: "mn_bg_sumas", src: "assets/aritmetica/minijuegos/escalera/bg_sumas.png" },  
  { type: "image", key: "npc_guardian_sumas", src: "assets/aritmetica/minijuegos/escalera/DonTadeo.png" },
];

window.MN_ASSETS_RESTAS_LUCIERNAGAS = [
  { type: "image", key: "mn_bg_restas", src: "assets/aritmetica/minijuegos/restas/bg_bosque.png" },
  { type: "image", key: "hunter", src: "assets/aritmetica/minijuegos/restas/hunter.png" },  
];

window.MN_ASSETS_ELEVADOR = [
  { type: "image", key: "bg_elevador", src: "assets/aritmetica/minijuegos/division/bg_mina.png",},    
  { type: "image", key: "spr_monster", src: "assets/aritmetica/minijuegos/division/baby_monster.png" },    
];

window.MN_ASSETS_ARMONIA_DIVISION = [
  { type: "image", key: "bg_karaoke", src: "assets/aritmetica/minijuegos/armonia/bg_karaoke.png" },
  { type: "audio", key: "bgm_armonia_division", src: "assets/aritmetica/minijuegos/armonia/Aluquin_Math_nightmare.mp3" },
];

window.MN_ASSETS_GALILEO_TABLAS = [
  { type: "image", key: "mn_meteor", src: "assets/aritmetica/minijuegos/tablas/meteoro.png",},  
  { type: "image", key: "mn_explosion", src: "assets/aritmetica/minijuegos/tablas/explosion.png",},
  { type: "image", key: "mn_tablas_cockpit", src: "assets/aritmetica/minijuegos/tablas/nave.png",},
];

window.MN_ASSETS_CHAMAN_JERARQUIA = [
  { type: "image", key: "scared", src: "assets/aritmetica/minijuegos/jerarquia/scared.png",},
  { type: "image", key: "monster", src: "assets/aritmetica/minijuegos/jerarquia/walk_monster.png",},
  { type: "image", key: "mn_classroom_bg", src: "assets/aritmetica/minijuegos/jerarquia/bg_classroom.png",},
];

window.MN_ASSETS_GENERAL_SIGNOS = [
  { type: "image", key: "mn_bg_signos", src: "assets/aritmetica/minijuegos/signos/bg_battlefield.png",},    
  { type: "image", key: "idle", src: "assets/aritmetica/minijuegos/signos/idle.png" },
  { type: "image", key: "walk", src: "assets/aritmetica/minijuegos/signos/walk.png" },
  { type: "image", key: "dead", src: "assets/aritmetica/minijuegos/signos/dead.png" },
];

window.MN_ASSETS_DIVISORES = [
  { type: "image", key: "bg_divisores", src: "assets/aritmetica/minijuegos/divisores/bg_divisores.png",},      
  { type: "image", key: "ghost", src: "assets/aritmetica/minijuegos/divisores/ghost.png",},
  { type: "image", key: "idle", src: "assets/aritmetica/minijuegos/divisores/idle.png",},
  { type: "image", key: "walk", src: "assets/aritmetica/minijuegos/divisores/walk.png",},
  { type: "image", key: "dead", src: "assets/aritmetica/minijuegos/divisores/dead.png",},
  { type: "image", key: "shot", src: "assets/aritmetica/minijuegos/divisores/shot.png",},  
  { type: "image", key: "hit", src: "assets/aritmetica/minijuegos/divisores/hit.png",},
];

window.MN_ASSETS_RAZONAMIENTO = [
  { type: "image", key: "bg_razonamiento", src: "assets/aritmetica/backgrounds/bg_board.png",},        
];
