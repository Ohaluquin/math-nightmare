// assets/geometria/data/assets_geometria.js
const MATHNM_ASSETS = [
  { type: "image", key: "pl_idle", src: "assets/general/images/player/idle.png" },
  { type: "image", key: "pl_walk", src: "assets/general/images/player/walk.png" },
  { type: "image", key: "pl_dead", src: "assets/general/images/player/dead.png" },

  { type: "audio", key: "text_blip", src: "assets/general/sounds/sfx/text_blip.mp3" },
  { type: "audio", key: "bgm_geometria", src: "assets/general/music/bgm_geometria.mp3" },
  { type: "video", key: "vid_intro", src: "assets/general/videos/mn_intro.mp4" },
  { type: "video", key: "vid_cierre", src: "assets/general/videos/mn_cierre_geometria.mp4" },
  { type: "video", key: "vid_final", src: "assets/general/videos/mn_final.mp4" },

  { type: "image", key: "title_bg", src: "assets/general/images/ui/title_bg.png" },
  { type: "image", key: "ui_mouse", src: "assets/general/images/ui/icon_mouse.png" },
  { type: "image", key: "ui_keyboard", src: "assets/general/images/ui/icon_keyboard.png" },
  { type: "image", key: "ui_leaf", src: "assets/general/images/ui/leaf.png" },
  { type: "image", key: "ui_book", src: "assets/general/images/ui/libro.webp" },
  { type: "image", key: "obj_arbusto", src: "assets/general/images/objects/arbusto.png" },
  { type: "image", key: "obj_letrero", src: "assets/general/images/objects/letrero.png" },
  { type: "image", key: "obj_roca", src: "assets/general/images/objects/roca.png" },
  { type: "image", key: "ch_nico", src: "assets/aritmetica/npcs/nico.png" },
  { type: "image", key: "ch_sofia", src: "assets/aritmetica/npcs/sofia.png" },
  { type: "image", key: "ch_lucero", src: "assets/geometria/npcs/lucero.png" },
  { type: "image", key: "ch_rey", src: "assets/geometria/npcs/Euclides.png" },
  { type: "image", key: "ch_ulises", src: "assets/geometria/npcs/pirata.png" },
  { type: "image", key: "ch_gemela1", src: "assets/geometria/npcs/Lia.png" },
  { type: "image", key: "ch_gemela2", src: "assets/geometria/npcs/Mia.png" },
  { type: "image", key: "ch_judy", src: "assets/geometria/npcs/judy.png" },
  { type: "image", key: "ch_arquitecto", src: "assets/geometria/npcs/arquitecto.png" },
  { type: "image", key: "ch_topografo", src: "assets/geometria/npcs/topografo.png" },
  { type: "image", key: "ch_descartes", src: "assets/geometria/npcs/descartes.png" },
  { type: "image", key: "ch_galileo", src: "assets/aritmetica/npcs/galileo.png" },
  { type: "image", key: "ch_aprendiz", src: "assets/geometria/npcs/aprendiz.png" },
  { type: "image", key: "ch_euclides", src: "assets/geometria/npcs/euclides.png" },
  { type: "image", key: "ch_pitagoras", src: "assets/geometria/npcs/pitagoras.png" },
  { type: "image", key: "bg_overworld_geometria", src: "assets/geometria/backgrounds/bg_geometria.webp" },
  { type: "image", key: "bg_ruinas", src: "assets/geometria/backgrounds/ruinas.webp" },
  { type: "image", key: "bg_academia", src: "assets/geometria/backgrounds/academia.webp" },
  { type: "image", key: "bg_huerto", src: "assets/geometria/backgrounds/huerto.webp" },
  { type: "image", key: "bg_puerto", src: "assets/geometria/backgrounds/puerto.webp" },
  { type: "image", key: "bg_jardin", src: "assets/geometria/backgrounds/jardin.webp" },
  { type: "image", key: "bg_observatorio", src: "assets/geometria/backgrounds/observatorio.webp" },
  { type: "image", key: "bg_obra", src: "assets/geometria/backgrounds/obra.webp" },
  { type: "image", key: "bg_descartes_torre", src: "assets/geometria/backgrounds/torre.webp" },
  { type: "image", key: "bg_partenon", src: "assets/geometria/backgrounds/partenon.webp" },
  { type: "image", key: "bg_sofia", src: "assets/geometria/backgrounds/bg_sofia.webp" },
  { type: "image", key: "bg_castillo", src: "assets/geometria/backgrounds/castillo.webp" },
  { type: "image", key: "bg_tangram_sombra", src: "assets/geometria/minijuegos/tangram/sombra.webp" },
  { type: "image", key: "bg_deduccion_castillo", src: "assets/geometria/minijuegos/deduce/estudio_castillo.webp" },
  { type: "image", key: "bg_angulos_oceano", src: "assets/geometria/minijuegos/angulos/oceano.webp" },
  { type: "image", key: "obj_angulos_barco", src: "assets/geometria/minijuegos/angulos/barco.webp" },
  { type: "image", key: "obj_angulos_isla", src: "assets/geometria/minijuegos/angulos/Isla.webp" },
  { type: "image", key: "ui_angulos_pergamino", src: "assets/geometria/minijuegos/angulos/pergamino.webp" },
  { type: "image", key: "bg_isosceles_reto", src: "assets/geometria/minijuegos/isosceles/reto.webp" },
  { type: "image", key: "bg_angulos_ecuaciones_cielo", src: "assets/geometria/minijuegos/observatorio/Cielo.webp" },
  { type: "image", key: "bg_poligonos_plano", src: "assets/geometria/minijuegos/poligonos/plano.webp" },
  { type: "image", key: "bg_topografo_huerto", src: "assets/geometria/minijuegos/topografo/huerto.webp" },
];
window.MATHNM_ASSETS = MATHNM_ASSETS;

window.MN_ASSETS_SFX_CORE = [
  { type: "audio", key: "sfx_ok", src: "assets/general/sounds/sfx/ok_sound.mp3" },
  { type: "audio", key: "sfx_match", src: "assets/general/sounds/sfx/match.mp3" },
  { type: "audio", key: "sfx_win", src: "assets/general/sounds/sfx/win.mp3" },
  { type: "audio", key: "sfx_error", src: "assets/general/sounds/sfx/error_sound.mp3" },
  { type: "audio", key: "sfx_change_page", src: "assets/general/sounds/sfx/change_page.mp3" },
  { type: "audio", key: "sfx_choque", src: "assets/general/sounds/sfx/choque.mp3" },
  { type: "audio", key: "sfx_loose", src: "assets/general/sounds/sfx/loose.mp3" },
  { type: "audio", key: "sfx_steps", src: "assets/general/sounds/sfx/steps.mp3" },
  { type: "audio", key: "sfx_explosion", src: "assets/general/sounds/sfx/explosion.wav" },
  { type: "audio", key: "sfx_rugido", src: "assets/general/sounds/sfx/rugido.mp3" },
];

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
  { type: "image", key: "sheet_poligonos", src: "assets/geometria/hojas/6_Polígonos_regulares.webp" },
  { type: "image", key: "sheet_perimetro", src: "assets/geometria/hojas/7_perimetro.webp" },
  { type: "image", key: "sheet_areas", src: "assets/geometria/hojas/7_areas.webp" },
  { type: "image", key: "sheet_cartesiano", src: "assets/geometria/hojas/8_plano_cartesiano.webp" },
  { type: "image", key: "sheet_graficas", src: "assets/geometria/hojas/9_graficas.webp" },
  { type: "image", key: "sheet_regla_y_compas", src: "assets/geometria/hojas/10_regla_y_compas.webp" },
  { type: "image", key: "sheet_pitagoras", src: "assets/geometria/hojas/11_Pitagoras.webp" },
];

window.MN_ASSETS_CONGRUENCIA = [];
window.MN_ASSETS_DEDUCCION = [];

// Placeholders por escena para poder extender assets por minijuego mas adelante.
window.MN_ASSETS_ANGULOS = [];
window.MN_ASSETS_ISOSCELES = [];
window.MN_ASSETS_ANGULOS_ECUACIONES = [];
window.MN_ASSETS_POLIGONOS = [];
window.MN_ASSETS_PERIMETRO = [];
window.MN_ASSETS_AREAS = [];
window.MN_ASSETS_CARTESIANO = [
  { type: "image", key: "bg_cartesiano_oceano", src: "assets/geometria/minijuegos/cartesiano/oceano.webp" },
  { type: "image", key: "bg_cartesiano_torre", src: "assets/geometria/minijuegos/cartesiano/torre.webp" },
  { type: "image", key: "obj_cartesiano_barco", src: "assets/geometria/minijuegos/cartesiano/barco.webp" },
  { type: "image", key: "obj_cartesiano_barco_impactado", src: "assets/geometria/minijuegos/cartesiano/barco_en_llamas.webp" },
  { type: "image", key: "fx_cartesiano_explosion", src: "assets/geometria/minijuegos/cartesiano/explosion.webp" },
  { type: "image", key: "fx_cartesiano_salpicadura", src: "assets/geometria/minijuegos/cartesiano/salpicadura.webp" },
];
window.MN_ASSETS_GRAFICAS = [
  { type: "image", key: "bg_cartesiano_torre", src: "assets/geometria/minijuegos/cartesiano/torre.webp" },
];
window.MN_ASSETS_PRUEBA_Y_ERROR = [];
window.MN_ASSETS_PROBLEMAS = [];
window.MN_ASSETS_REGLA_Y_COMPAS = [
  { type: "image", key: "bg_regla_y_compas", src: "assets/geometria/minijuegos/reglaYcompas/background.webp" },
];
window.MN_ASSETS_PROBLEMAS = [
  { type: "image", key: "bg_problemas_euclides", src: "assets/geometria/minijuegos/euclides/background.webp" },
];
