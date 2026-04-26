const MN_SOFIA_GEOMETRIA_CHARACTERS = [
  {
    image: "ch_nico",
    x: 400,
    y: 560,
    scale: 0.9,
    flipX: false,
    name: "Nico",
  },
  {
    image: "ch_sofia",
    x: 600,
    y: 540,
    scale: 1,
    flipX: false,
    name: "Sofía",
  },
];

const MN_SOFIA_GEOMETRIA_TOPICS = [
  {
    id: "lucero",
    label: "Lucero",
    page: 1,
    helpSheetKey: "sheet_igualdad",
    mechanic:
      "Debes observar figuras y decidir si conservan la misma forma y tamaño aunque cambien de posición. La clave es reconocer congruencia y composición espacial.",
    tip: "No te fijes solo en cómo se ve la silueta a primera vista. Compara lados, ángulos y la manera en que las piezas pueden reacomodarse sin cambiar la figura.",
  },
  {
    id: "rey",
    label: "Euclides",
    page: 1,
    helpSheetKey: "sheet_deduccion",
    mechanic:
      "Aquí debes leer pistas geométricas y sacar conclusiones válidas. Algunas opciones suenan razonables, pero solo una se sigue de los datos dados.",
    tip: "Pregunta siempre qué sabes con certeza y que solo estás suponiendo. En geometría, demostrar vale más que intuir.",
  },
  {
    id: "ulises",
    label: "Ulises",
    page: 1,
    helpSheetKey: "sheet_angulos",
    mechanic:
      "Tienes que identificar, comparar o calcular ángulos a partir de giros, cruces y referencias visuales. El reto es leer bien la abertura y sus relaciones.",
    tip: "Ubica si los ángulos son agudos, rectos, obtusos o llanos antes de calcular. Esa clasificación ya te da una pista fuerte sobre el resultado.",
  },
  {
    id: "gemelas",
    label: "Lia y Mia",
    page: 1,
    helpSheetKey: "sheet_isosceles",
    mechanic:
      "Debes usar las propiedades del triángulo isosceles para decidir qué afirmaciones o pasos son correctos dentro de la construcción o el razonamiento.",
    tip: "Si dos lados son iguales, los ángulos de la base también lo son. Esa relación suele ser la puerta para resolver casi todo el ejercicio.",
  },
  {
    id: "judy",
    label: "Judy",
    page: 1,
    helpSheetKey: "sheet_angulos_ecuaciones",
    mechanic:
      "Este reto mezcla relaciones entre ángulos con ecuaciones sencillas. Primero identificas la relación geométrica y después encuentras el valor desconocido.",
    tip: "No empieces despejando sin traducir la figura. Antes decide si son suplementarios, complementarios, opuestos por el vértice o correspondientes.",
  },
  {
    id: "arquitecto",
    label: "Arquitecto",
    page: 1,
    helpSheetKey: "sheet_poligonos",
    mechanic:
      "Tienes que reconocer propiedades de polígonos, especialmente regulares, y usar esas propiedades para elegir la respuesta o el paso correcto.",
    tip: "Fíjate en cuantas veces se repite el mismo ángulo o lado. Cuando una figura es regular, esa simetría te permite anticipar muchas relaciones.",
  },
  {
    id: "topógrafo",
    label: "Topógrafo",
    page: 2,
    helpSheetKey: "sheet_areas",
    mechanic:
      "Aquí trabajas con medidas del terreno: a veces perímetro, a veces área. El reto es identificar primero qué magnitud te están pidiendo.",
    tip: "Perímetro mide borde; área mide superficie. Si mezclas esas dos ideas, aunque operes bien, terminarás contestando otra cosa.",
  },
  {
    id: "descartes",
    label: "Descartes",
    page: 2,
    helpSheetKey: "sheet_cartesiano",
    mechanic:
      "Debes ubicar puntos en el plano cartesiano y leer coordenadas con precisión. El orden y el signo importan en cada movimiento.",
    tip: "Recuerda: primero avanzas en x y después en y. Si cambias el orden, llegas a otro punto completamente distinto.",
  },
  {
    id: "galileo",
    label: "Galileo",
    page: 2,
    helpSheetKey: "sheet_graficas",
    mechanic:
      "En este reto interpretas gráficas y relaciones visuales entre variables. No basta con ver una línea: hay que leer que cambia y cómo cambia.",
    tip: "Observa tendencia, puntos clave y comparaciones. Una gráfica cuenta una historia, y tu trabajo es traducirla correctamente.",
  },
  {
    id: "aprendiz",
    label: "Aprendiz",
    page: 2,
    helpSheetKey: "sheet_regla_y_compas",
    mechanic:
      "Debes ordenar correctamente los pasos de una construcción con regla y compás. Avanzas solo si respetas la lógica del procedimiento geométrico.",
    tip: "Piensa en dependencias: un paso solo puede venir después de que sus puntos, arcos o intersecciones ya existen.",
  },
  {
    id: "pitagoras",
    label: "Pitágoras",
    page: 2,
    helpSheetKey: "sheet_pitagoras",
    mechanic:
      "La prueba final combina varias ideas de Geometría. No se trata de aplicar una fórmula aislada, sino de decidir qué concepto usar en cada situación.",
    tip: "Si un problema te abruma, sepáralo: qué tipo de figura hay, qué dato se conoce, qué propiedad conecta esos datos y qué es exactamente lo que piden.",
  },
];

function MN_buildSofiaGeometriaStory() {
  const scenes = {
    sofia_menu: {
      title: "Sofía",
      background: "bg_sofia",
      music: "bgm_quiet",
      characters: MN_SOFIA_GEOMETRIA_CHARACTERS,
      dialogs: [
        {
          speaker: "Sofía",
          text: "Hola. Aquí puedo ayudarte a entender qué se trabaja en Geometría o darte apoyo puntual para cualquier reto.",
          stage: { focus: "Sofía" },
          choices: [
            {
              text: "Explícame el área de Geometría",
              next: "sofia_geometria",
            },
            {
              text: "Necesito ayuda con un minijuego",
              next: "sofia_help_menu_1",
            },
            { text: "Adiós.", action: { type: "CLOSE_NOVELA" } },
          ],
        },
      ],
    },
    sofia_geometria: {
      title: "Área de Geometría",
      background: "bg_sofia",
      music: "bgm_quiet",
      characters: MN_SOFIA_GEOMETRIA_CHARACTERS,
      dialogs: [
        {
          speaker: "Sofía",
          text: "En Geometría aprendes a observar figuras, comparar formas, medir relaciones y justificar por qué algo es verdadero.",
          stage: { focus: "Sofía" },
        },
        {
          speaker: "Sofía",
          text: "Aquí practicas congruencia, deducción, ángulos, triángulos, polígonos, medición, plano cartesiano, gráficas y construcciones con regla y compás.",
        },
        {
          speaker: "Sofía",
          text: "La meta no es solo reconocer dibujos, sino descubrir las reglas que conectan puntos, lados, giros, medidas y demostraciones.",
        },
        {
          speaker: "Sofía",
          text: "Si te atoras, usa mi ayuda por minijuego. Te diré cómo se juega, qué idea matemática entrena y qué hoja consultar.",
          choices: [
            {
              text: "Quiero ayuda con un minijuego",
              next: "sofia_help_menu_1",
            },
            { text: "Volver con Sofía", next: "sofia_menu" },
          ],
        },
      ],
    },
    sofia_help_menu_1: {
      title: "Ayuda de Sofía",
      background: "bg_sofia",
      music: "bgm_quiet",
      characters: MN_SOFIA_GEOMETRIA_CHARACTERS,
      dialogs: [
        {
          speaker: "Sofía",
          text: "Dime con cuál reto de Geometría necesitas apoyo.",
          stage: { focus: "Sofía" },
          choices: [],
        },
      ],
    },
    sofia_help_menu_2: {
      title: "Ayuda de Sofía",
      background: "bg_sofia",
      music: "bgm_quiet",
      characters: MN_SOFIA_GEOMETRIA_CHARACTERS,
      dialogs: [
        {
          speaker: "Sofía",
          text: "Aquí están los retos restantes. Elige uno y te ayudo.",
          stage: { focus: "Sofía" },
          choices: [],
        },
      ],
    },
    exit: {
      title: "Exit de Sofía",
      music: "bgm_overworld",
      dialogs: [],
    },
  };

  const page1Choices = scenes.sofia_help_menu_1.dialogs[0].choices;
  const page2Choices = scenes.sofia_help_menu_2.dialogs[0].choices;

  MN_SOFIA_GEOMETRIA_TOPICS.forEach((topic) => {
    const sceneKey = `sofia_help_${topic.id}`;
    const mechanicKey = `${sceneKey}_mechanic`;
    const tipKey = `${sceneKey}_tip`;
    const chooseMenu =
      topic.page === 1 ? "sofia_help_menu_1" : "sofia_help_menu_2";

    scenes[sceneKey] = {
      title: topic.label,
      background: "bg_sofia",
      music: "bgm_quiet",
      characters: MN_SOFIA_GEOMETRIA_CHARACTERS,
      dialogs: [
        {
          speaker: "Sofía",
          text: "¿Qué ayuda necesitas en este reto?",
          choices: [
            { text: "Mecánica del juego", next: mechanicKey },
            { text: "Consejo matemático", next: tipKey },
            {
              text: "Ver hoja relacionada",
              action: {
                type: "OPEN_SHEET",
                sheetKey: topic.helpSheetKey,
                mode: "consult",
              },
              next: sceneKey,
            },
            { text: "Elegir otro minijuego", next: chooseMenu },
            { text: "Adiós.", action: { type: "CLOSE_NOVELA" } },
          ],
        },
      ],
    };

    scenes[mechanicKey] = {
      title: `${topic.label} - Mecánica`,
      background: "bg_sofia",
      music: "bgm_quiet",
      characters: MN_SOFIA_GEOMETRIA_CHARACTERS,
      dialogs: [
        {
          speaker: "Sofía",
          text: topic.mechanic,
          stage: { focus: "Sofía" },
          choices: [
            { text: "Volver al submenú", next: sceneKey },
            { text: "Elegir otro minijuego", next: chooseMenu },
            { text: "Adiós.", action: { type: "CLOSE_NOVELA" } },
          ],
        },
      ],
    };

    scenes[tipKey] = {
      title: `${topic.label} - Consejo`,
      background: "bg_sofia",
      music: "bgm_quiet",
      characters: MN_SOFIA_GEOMETRIA_CHARACTERS,
      dialogs: [
        {
          speaker: "Sofía",
          text: topic.tip,
          stage: { focus: "Sofía" },
          choices: [
            { text: "Volver al submenú", next: sceneKey },
            { text: "Elegir otro minijuego", next: chooseMenu },
            { text: "Adiós.", action: { type: "CLOSE_NOVELA" } },
          ],
        },
      ],
    };

    const menuChoice = { text: topic.label, next: sceneKey };
    if (topic.page === 1) page1Choices.push(menuChoice);
    else page2Choices.push(menuChoice);
  });

  page1Choices.push({ text: "Ver más minijuegos", next: "sofia_help_menu_2" });
  page1Choices.push({ text: "Adiós.", action: { type: "CLOSE_NOVELA" } });
  page2Choices.push({
    text: "Ver minijuegos anteriores",
    next: "sofia_help_menu_1",
  });
  page2Choices.push({ text: "Adiós.", action: { type: "CLOSE_NOVELA" } });

  return {
    start: "sofia_menu",
    order: Object.keys(scenes),
    scenes,
  };
}

window.SOFIA_GEOMETRIA_STORY = MN_buildSofiaGeometriaStory();

window.LUCERO_SOMBRAS_TANGRAM_STORY = {
  start: "lucero_intro",
  order: ["lucero_intro"],
  scenes: {
    lucero_intro: {
      title: "Lucero",
      background: "bg_ruinas",
      music: "bgm_quiet",
      characters: [
        {
          image: "ch_nico",
          x: 280,
          y: 560,
          scale: 0.9,
          flipX: false,
          name: "Nico",
        },
        {
          image: "ch_lucero",
          x: 620,
          y: 520,
          scale: 1,
          flipX: false,
          name: "Lucero",
        },
      ],
      dialogs: [
        {
          speaker: "Lucero",
          text: "Espera… no avances todavía.",
          stage: { focus: "Lucero" },
        },
        {
          speaker: "Lucero",
          text: "Cuando la luz se mueve… las sombras también cambian.",
        },
        {
          speaker: "Lucero",
          text: "A veces puedo reconocer lo que estoy viendo…",
        },
        {
          speaker: "Lucero",
          text: "pero otras veces… no estoy segura de qué es.",
        },
        {
          speaker: "Nico",
          text: "¿Solo son sombras, no?",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Lucero",
          text: "Eso pensé al principio.",
          stage: { focus: "Lucero" },
        },
        {
          speaker: "Lucero",
          text: "Pero luego empecé a notar algo extraño…",
        },
        {
          speaker: "Lucero",
          text: "Las mismas cosas pueden generar sombras distintas.",
        },
        {
          speaker: "Lucero",
          text: "Depende de cómo estén colocadas…",
        },
        {
          speaker: "Lucero",
          text: "de cómo encajan entre sí.",
        },
        {
          speaker: "Lucero",
          text: "A veces parece una figura completamente diferente…",
        },
        {
          speaker: "Lucero",
          text: "pero en realidad… no lo es.",
        },
        {
          speaker: "Nico",
          text: "Entonces… ¿la sombra engaña?",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Lucero",
          text: "Solo si miras rápido.",
          stage: { focus: "Lucero" },
        },
        {
          speaker: "Lucero",
          text: "Si observas con cuidado… puedes descubrir cómo está hecha.",
        },
        {
          speaker: "Lucero",
          text: "Las piezas no cambian…",
        },
        {
          speaker: "Lucero",
          text: "solo su posición.",
        },
        {
          speaker: "Lucero",
          text: "Si logras ordenarlas correctamente…",
        },
        {
          speaker: "Lucero",
          text: "la sombra deja de confundirte.",
        },
        {
          speaker: "Lucero",
          text: "Inténtalo.",
        },
      ],
    },
  },
};

window.EUCLIDES_DEDUCCION_STORY = {
  start: "euclides_intro",
  order: ["euclides_intro"],
  scenes: {
    euclides_intro: {
      title: "Euclides",
      background: "bg_academia",
      music: "bgm_quiet",
      characters: [
        {
          image: "ch_nico",
          x: 280,
          y: 560,
          scale: 0.9,
          flipX: false,
          name: "Nico",
        },
        {
          image: "ch_euclides",
          x: 620,
          y: 520,
          scale: 1.1,
          flipX: false,
          name: "Euclides",
        },
      ],
      dialogs: [
        {
          speaker: "Nico",
          text: "¿Eres tú quien cuida la entrada a Geometría?",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Euclides",
          text: "No cuido una puerta. Cuido una forma de pensar.",
          stage: { focus: "Euclides" },
        },
        {
          speaker: "Euclides",
          text: "Muchos creen que la geometría consiste en mirar figuras y adivinar lo que parecen decir.",
        },
        {
          speaker: "Euclides",
          text: "Pero una figura no habla por sí sola. Hay que interrogarla con orden.",
        },
        {
          speaker: "Nico",
          text: "¿Y cómo se hace eso?",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Euclides",
          text: "Distinguiendo lo que sabes de lo que solo imaginas.",
          stage: { focus: "Euclides" },
        },
        {
          speaker: "Euclides",
          text: "Cada pista bien usada elimina errores. Cada relación bien entendida acerca a la conclusión.",
        },
        {
          speaker: "Euclides",
          text: "Aquí no avanzarás probando al azar.",
        },
        {
          speaker: "Euclides",
          text: "No hay camino real hacia la geometría.",
        },
        {
          speaker: "Nico",
          text: "Entonces tendré que pensar cada intento... y usarlo para deducir.",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Euclides",
          text: "Exactamente.",
          stage: { focus: "Euclides" },
        },
        {
          speaker: "Euclides",
          text: "Te daré un reto sencillo en apariencia.",
        },
        {
          speaker: "Euclides",
          text: "No lo vencerás por suerte, sino descartando posibilidades y sosteniendo solo lo que realmente se sigue de las pistas.",
        },
        {
          speaker: "Euclides",
          text: "Si puedes hacerlo, habrás dado tu primer paso verdadero en Geometría.",
        },
      ],
    },
  },
};

window.ULISES_ANGULOS_STORY = {
  start: "ulises_intro",
  order: ["ulises_intro"],
  scenes: {
    ulises_intro: {
      title: "Ulises",
      background: "bg_puerto",
      music: "bgm_quiet",
      characters: [
        {
          image: "ch_nico",
          x: 280,
          y: 620,
          scale: 0.9,
          flipX: false,
          name: "Nico",
        },
        {
          image: "ch_ulises",
          x: 620,
          y: 620,
          scale: 1.2,
          flipX: false,
          name: "Ulises",
        },
      ],
      dialogs: [
        {
          speaker: "Ulises",
          text: "¡Justo a tiempo!",
          stage: { focus: "Ulises" },
        },
        {
          speaker: "Ulises",
          text: "Estoy a punto de zarpar… pero hay un pequeño problema.",
        },
        {
          speaker: "Nico",
          text: "¿Qué pasó?",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Ulises",
          text: "Tengo el mapa… tengo la brújula…",
          stage: { focus: "Ulises" },
        },
        {
          speaker: "Ulises",
          text: "pero si me equivoco en los ángulos…",
        },
        {
          speaker: "Ulises",
          text: "puedo terminar muy lejos de donde quiero ir.",
        },
        {
          speaker: "Nico",
          text: "¿Tan grave es?",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Ulises",
          text: "En el mar, un pequeño error…",
          stage: { focus: "Ulises" },
        },
        {
          speaker: "Ulises",
          text: "se convierte en un gran problema.",
        },
        {
          speaker: "Ulises",
          text: "Si giro de más…",
        },
        {
          speaker: "Ulises",
          text: "puedo perder el rumbo.",
        },
        {
          speaker: "Ulises",
          text: "Si giro de menos…",
        },
        {
          speaker: "Ulises",
          text: "puedo terminar contra las rocas.",
        },
        {
          speaker: "Nico",
          text: "Entonces necesitas medir bien cada giro.",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Ulises",
          text: "Exacto.",
          stage: { focus: "Ulises" },
        },
        {
          speaker: "Ulises",
          text: "Cada cambio de dirección es un ángulo.",
        },
        {
          speaker: "Ulises",
          text: "Y si entiendo cómo funcionan…",
        },
        {
          speaker: "Ulises",
          text: "puedo navegar con precisión.",
        },
        {
          speaker: "Ulises",
          text: "¿Te gustaría intentarlo?",
        },
        {
          speaker: "Ulises",
          text: "Necesito a alguien que calcule bien los rumbos.",
        },
        {
          speaker: "Ulises",
          text: "Porque si fallamos…",
        },
        {
          speaker: "Ulises",
          text: "no llegamos a la isla.",
        },
      ],
    },
  },
};

window.GEMELAS_ISOSCELES_STORY = {
  start: "gemelas_intro",
  order: ["gemelas_intro"],
  scenes: {
    gemelas_intro: {
      title: "Las Gemelas",
      background: "bg_jardin",
      music: "bgm_quiet",
      characters: [
        {
          image: "ch_nico",
          x: 280,
          y: 560,
          scale: 0.9,
          flipX: false,
          name: "Nico",
        },
        {
          image: "ch_gemela1",
          x: 560,
          y: 520,
          scale: 1,
          flipX: false,
          name: "Lia",
        },
        {
          image: "ch_gemela2",
          x: 650,
          y: 520,
          scale: 1,
          flipX: true,
          name: "Mia",
        },
      ],
      dialogs: [
        {
          speaker: "Lia",
          text: "Nosotras siempre estamos en equilibrio.",
          stage: { focus: "Lia" },
        },
        {
          speaker: "Mia",
          text: "Si una se mueve… la otra también.",
          stage: { focus: "Mia" },
        },
        {
          speaker: "Nico",
          text: "¿Siempre hacen lo mismo?",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Lia",
          text: "No es coincidencia.",
          stage: { focus: "Lia" },
        },
        {
          speaker: "Mia",
          text: "Es una relación.",
          stage: { focus: "Mia" },
        },
        {
          speaker: "Lia",
          text: "Cuando dos partes son iguales…",
        },
        {
          speaker: "Mia",
          text: "otras también lo serán.",
        },
        {
          speaker: "Lia",
          text: "Por eso nos gusta jugar este reto con alguien diferente.",
          stage: { focus: "Lia" },
        },
        {
          speaker: "Mia",
          text: "Dos iguales… y uno distinto.",
          stage: { focus: "Mia" },
        },
        {
          speaker: "Nico",
          text: "¿Y qué tengo que hacer?",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Lia",
          text: "Observar con cuidado.",
          stage: { focus: "Lia" },
        },
        {
          speaker: "Mia",
          text: "Distinguir qué partes son iguales.",
          stage: { focus: "Mia" },
        },
        {
          speaker: "Lia",
          text: "Y decidir qué propiedad usar en cada parte.",
          stage: { focus: "Lia" },
        },
        {
          speaker: "Mia",
          text: "Si dos lados son iguales…",
          stage: { focus: "Mia" },
        },
        {
          speaker: "Lia",
          text: "los ángulos opuestos también lo son.",
        },
        {
          speaker: "Mia",
          text: "No necesitas verlo todo de inmediato…",
        },
        {
          speaker: "Lia",
          text: "solo reconocer lo que se repite.",
        },
        {
          speaker: "Nico",
          text: "Entonces puedo encontrar lo que falta.",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Lia",
          text: "Sí.",
          stage: { focus: "Lia" },
        },
        {
          speaker: "Mia",
          text: "Y cuando te acostumbras…",
          stage: { focus: "Mia" },
        },
        {
          speaker: "Lia",
          text: "empieza a parecer fácil.",
          stage: { focus: "Lia" },
        },
      ],
    },
  },
};

window.ANGULOS_ECUACIONES_STORY = {
  start: "judy_intro",
  order: ["judy_intro"],
  scenes: {
    judy_intro: {
      title: "La Astrónoma",
      background: "bg_observatorio",
      music: "bgm_mistery",
      characters: [
        {
          image: "ch_nico",
          x: 280,
          y: 560,
          scale: 0.9,
          flipX: false,
          name: "Nico",
        },
        {
          image: "ch_judy",
          x: 600,
          y: 520,
          scale: 1,
          flipX: true,
          name: "Judy",
        },
      ],
      dialogs: [
        {
          speaker: "Nico",
          text: "¿Qué estás observando?",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Judy",
          text: "Algo que no puedo ver directamente.",
          stage: { focus: "Judy" },
        },
        {
          speaker: "Nico",
          text: "¿Entonces cómo sabes que está ahí?",
        },
        {
          speaker: "Judy",
          text: "Porque estoy recibiendo tres señales…",
        },
        {
          speaker: "Judy",
          text: "pero no están alineadas.",
        },
        {
          speaker: "Nico",
          text: "¿Señales?",
        },
        {
          speaker: "Judy",
          text: "Sí. Son débiles, pero están ahí.",
        },
        {
          speaker: "Judy",
          text: "Los ángulos y sus relaciones dicen más de lo que parece.",
        },
        {
          speaker: "Judy",
          text: "Si conoces algunos… puedes descubrir los demás.",
        },
        {
          speaker: "Nico",
          text: "¿Cómo completar lo que falta?",
        },
        {
          speaker: "Judy",
          text: "Exacto.",
        },
        {
          speaker: "Judy",
          text: "A veces no tienes todos los datos…",
        },
        {
          speaker: "Judy",
          text: "pero las relaciones siempre están ahí.",
        },
        {
          speaker: "Nico",
          text: "Entonces no es adivinar…",
        },
        {
          speaker: "Judy",
          text: "Es deducir lo que debe ser cierto.",
        },
        {
          speaker: "Judy",
          text: "Si encontramos cada valor de x…",
        },
        {
          speaker: "Judy",
          text: "podremos alinear una señal a la vez.",
        },
        {
          speaker: "Judy",
          text: "Y si logramos alinear las tres…",
        },
        {
          speaker: "Judy",
          text: "tal vez descubramos qué intentan decirnos.",
        },
        {
          speaker: "Nico",
          text: "Quiero intentarlo.",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Judy",
          text: "Entonces observa bien…",
        },
        {
          speaker: "Judy",
          text: "y completa lo que falta.",
        },
      ],
    },
  },
};

window.ARQUITECTO_POLIGONOS_STORY = {
  start: "arquitecto_intro",
  order: ["arquitecto_intro"],
  scenes: {
    arquitecto_intro: {
      title: "Arquitecto",
      background: "bg_obra",
      music: "bgm_quiet",
      characters: [
        {
          image: "ch_nico",
          x: 280,
          y: 560,
          scale: 0.9,
          flipX: false,
          name: "Nico",
        },
        {
          image: "ch_arquitecto",
          x: 620,
          y: 520,
          scale: 1,
          flipX: false,
          name: "Darian",
        },
      ],
      dialogs: [
        {
          speaker: "Nico",
          text: "¿Qué estás construyendo?",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Darian",
          text: "Una estructura que solo puede sostenerse si cada parte sigue el mismo orden.",
          stage: { focus: "Darian" },
        },
        {
          speaker: "Nico",
          text: "¿Tienes que medir todo una y otra vez?",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Darian",
          text: "No, si entiendes el patrón.",
          stage: { focus: "Darian" },
        },
        {
          speaker: "Darian",
          text: "Cuando una figura es regular, sus lados y sus ángulos repiten una misma regla.",
        },
        {
          speaker: "Darian",
          text: "Y cuando hay simetría, una parte te ayuda a prever las demás.",
        },
        {
          speaker: "Nico",
          text: "Entonces no se trata solo de mirar la figura... sino de descubrir qué se repite en ella.",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Darian",
          text: "Exactamente.",
          stage: { focus: "Darian" },
        },
        {
          speaker: "Darian",
          text: "Muchos ven un polígono y solo cuentan lados.",
        },
        {
          speaker: "Darian",
          text: "Pero si observas bien, también puedes reconocer regularidad, simetría y relaciones que vuelven predecible la forma.",
        },
        {
          speaker: "Darian",
          text: "Eso es lo que permite diseñar, anticipar y construir con precisión.",
        },
        {
          speaker: "Nico",
          text: "Entonces, si entiendo la regla de la figura, puedo encontrar lo que falta.",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Darian",
          text: "Así es.",
          stage: { focus: "Darian" },
        },
        {
          speaker: "Darian",
          text: "Vamos a comprobar si puedes reconocer el orden oculto en cada polígono.",
        },
      ],
    },
  },
};

window.AREAS_STORY = {
  start: "nilo_intro",
  order: ["nilo_intro"],
  scenes: {
    nilo_intro: {
      title: "El Topógrafo",
      background: "bg_huerto",
      music: "bgm_quiet",
      characters: [
        {
          image: "ch_nico",
          x: 280,
          y: 560,
          scale: 0.9,
          flipX: false,
          name: "Nico",
        },
        {
          image: "ch_topografo",
          x: 600,
          y: 520,
          scale: 1,
          flipX: true,
          name: "Topógrafo",
        },
      ],
      dialogs: [
        {
          speaker: "Topógrafo",
          text: "El río lo cubre todo cada año.",
          stage: { focus: "Topógrafo" },
        },
        {
          speaker: "Topógrafo",
          text: "Cuando el agua baja… ya no hay límites.",
        },
        {
          speaker: "Nico",
          text: "¿Entonces cómo saben qué terreno es de cada quien?",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Topógrafo",
          text: "Midiendo.",
        },
        {
          speaker: "Topógrafo",
          text: "Primero los bordes…",
        },
        {
          speaker: "Topógrafo",
          text: "eso es el perímetro.",
        },
        {
          speaker: "Topógrafo",
          text: "Luego lo que hay dentro…",
        },
        {
          speaker: "Topógrafo",
          text: "eso es el área.",
        },
        {
          speaker: "Topógrafo",
          text: "De eso depende cuánto debe pagar cada persona.",
        },
        {
          speaker: "Nico",
          text: "¿El impuesto depende del tamaño del terreno?",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Topógrafo",
          text: "Exacto.",
        },
        {
          speaker: "Nico",
          text: "Entonces… no basta con ver la figura.",
        },
        {
          speaker: "Topógrafo",
          text: "No.",
        },
        {
          speaker: "Topógrafo",
          text: "Debes entenderla.",
        },
        {
          speaker: "Topógrafo",
          text: "Dividirla… reconstruirla… medirla.",
        },
        {
          speaker: "Nico",
          text: "Quiero intentarlo.",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Topógrafo",
          text: "Entonces empieza por los límites…",
        },
        {
          speaker: "Topógrafo",
          text: "y después ve hacia el interior.",
        },
      ],
    },
  },
};

window.DESCARTES_STORY = {
  start: "descartes_intro",
  order: ["descartes_intro"],
  scenes: {
    descartes_intro: {
      title: "La torre de Descartes",
      background: "bg_descartes_torre",
      music: "bgm_quiet",
      characters: [
        {
          image: "ch_nico",
          x: 330,
          y: 550,
          scale: 0.7,
          flipX: false,
          name: "Nico",
        },
        {
          image: "ch_descartes",
          x: 530,
          y: 520,
          scale: 0.9,
          flipX: false,
          name: "Descartes",
        },
      ],
      dialogs: [
        {
          speaker: "Nico",
          text: "Qué lugar tan extraño... desde aquí se ve todo el mar.",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Descartes",
          text: "Y, sin embargo, ver no basta.",
          stage: { focus: "Descartes" },
        },
        {
          speaker: "Descartes",
          text: "Cuando un barco aparece en el horizonte, muchos intentan decir dónde está... pero hablan con demasiada imprecisión.",
          stage: { focus: "Descartes" },
        },
        {
          speaker: "Descartes",
          text: 'Dicen "más a la derecha", "un poco arriba", "cerca de aquella nube"... y para entonces ya es tarde.',
          stage: { focus: "Descartes" },
        },
        {
          speaker: "Nico",
          text: "Entonces, ¿cómo sabes exactamente dónde disparar?",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Descartes",
          text: "Con orden. Con ejes. Con números.",
          stage: { focus: "Descartes" },
        },
        {
          speaker: "Descartes",
          text: "Si imaginamos el espacio como una red, cada punto puede nombrarse con precisión mediante dos valores.",
          stage: { focus: "Descartes" },
        },
        {
          speaker: "Descartes",
          text: "Primero uno para avanzar a lo largo del eje horizontal, y luego otro para subir o bajar en el vertical.",
          stage: { focus: "Descartes" },
        },
        {
          speaker: "Nico",
          text: "¿Cómo dar una dirección exacta?",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Descartes",
          text: "Exactamente. Y en esta torre, una dirección exacta puede decidirlo todo.",
          stage: { focus: "Descartes" },
        },
        {
          speaker: "Descartes",
          text: "Te diré una coordenada. Tú deberás ubicarla antes de que el blanco cambie de posición.",
          stage: { focus: "Descartes" },
        },
        {
          speaker: "Descartes",
          text: "Recuerda: primero la posición horizontal, después la vertical. Si confundes el orden, fallarás.",
          stage: { focus: "Descartes" },
        },
        {
          speaker: "Nico",
          text: "Entiendo... entonces no se trata solo de mirar, sino de ubicar con precisión.",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Descartes",
          text: "Así es. Preparémonos. La torre necesita una mente atenta.",
          stage: { focus: "Descartes" },
        },
      ],
    },
  },
};

window.GALILEO_GRAFICAS_STORY = {
  start: "galileo_intro",
  order: ["galileo_intro"],
  scenes: {
    galileo_intro: {
      title: "Galileo",
      background: "bg_descartes_torre",
      music: "bgm_quiet",
      characters: [
        {
          image: "ch_nico",
          x: 330,
          y: 550,
          scale: 0.7,
          flipX: false,
          name: "Nico",
        },
        {
          image: "ch_galileo",
          x: 555,
          y: 520,
          scale: 0.8,
          flipX: false,
          name: "Galileo",
        },
      ],
      dialogs: [
        {
          speaker: "Galileo",
          text: "Mira la torre, Nico. Desde aquí todo parece moverse con orden.",
          stage: { focus: "Galileo" },
        },
        {
          speaker: "Nico",
          text: "Veo puntos, alturas... pero todavía no entiendo qué relación tienen.",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Galileo",
          text: "Cuando una magnitud cambia junto con otra, no basta con mirar números sueltos.",
          stage: { focus: "Galileo" },
        },
        {
          speaker: "Galileo",
          text: "Hay que observar el patrón que forman.",
        },
        {
          speaker: "Galileo",
          text: "Si colocas varios puntos en el plano, la regularidad empieza a revelarse.",
        },
        {
          speaker: "Nico",
          text: "Entonces una gráfica no solo dibuja datos... tambien cuenta cómo cambian.",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Galileo",
          text: "Exacto. Primero verás la regla. Luego tendrás que continuarla sin verla.",
          stage: { focus: "Galileo" },
        },
        {
          speaker: "Galileo",
          text: "Si entiendes el patrón de la recta, podrás anticipar el siguiente punto.",
        },
        {
          speaker: "Nico",
          text: "Listo. Quiero probar si de verdad puedo leer esa regularidad.",
          stage: { focus: "Nico" },
        },
      ],
    },
  },
};

window.EVARISTO_TRAZOS_STORY = {
  start: "evaristo_intro",
  order: ["evaristo_intro"],
  scenes: {
    evaristo_intro: {
      title: "Evaristo, aprendiz pitagórico",
      background: "bg_partenon",
      music: "bgm_quiet",
      characters: [
        {
          image: "ch_nico",
          x: 350,
          y: 520,
          scale: 1,
          flipX: false,
          name: "Nico",
        },
        {
          image: "ch_aprendiz",
          x: 620,
          y: 520,
          scale: 1.1,
          flipX: false,
          name: "Evaristo",
        },
      ],
      dialogs: [
        {
          speaker: "Evaristo",
          text: "Detente ahí.",
          stage: { focus: "Evaristo" },
        },
        {
          speaker: "Evaristo",
          text: "Si quieres llegar ante Pitágoras, primero debes demostrar que sabes construir con orden.",
        },
        {
          speaker: "Nico",
          text: "¿Tú eres uno de sus alumnos?",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Evaristo",
          text: "Soy Evaristo, miembro de la escuela pitagórica.",
          stage: { focus: "Evaristo" },
        },
        {
          speaker: "Evaristo",
          text: "Aquí no basta con mirar una figura y decir que la entiendes.",
        },
        {
          speaker: "Evaristo",
          text: "Hay que saber trazarla, paso a paso, sin romper el orden del procedimiento.",
        },
        {
          speaker: "Nico",
          text: "Entonces no se trata solo de llegar al resultado.",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Evaristo",
          text: "Exactamente.",
          stage: { focus: "Evaristo" },
        },
        {
          speaker: "Evaristo",
          text: "Cada línea debe aparecer cuando corresponde.",
        },
        {
          speaker: "Evaristo",
          text: "Cada intersección debe nacer de lo que ya fue construido.",
        },
        {
          speaker: "Evaristo",
          text: "Si alteras el orden, el trazo puede parecer correcto...",
        },
        {
          speaker: "Evaristo",
          text: "pero ya no demuestra nada.",
        },
        {
          speaker: "Nico",
          text: "Entonces construir bien también es una forma de razonar.",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Evaristo",
          text: "Así es.",
          stage: { focus: "Evaristo" },
        },
        {
          speaker: "Evaristo",
          text: "En nuestra escuela, el pentagrama recuerda que el orden y la proporción no son adornos: son señales de comprensión.",
        },
        {
          speaker: "Evaristo",
          text: "Toma la regla y el compás.",
        },
        {
          speaker: "Evaristo",
          text: "Si puedes seguir la lógica de la construcción, habrás dado un paso más cerca del maestro.",
        },
      ],
    },
  },
};

window.PITAGORAS_PROBLEMAS_STORY = {
  start: "pitagoras_bloqueado",
  order: [
    "pitagoras_bloqueado",
    "pitagoras_reto",
    "pitagoras_aprobado",
    "pitagoras_perfecto",
    "exit",
  ],
  scenes: {
    pitagoras_bloqueado: {
      title: "Pitágoras",
      background: "bg_partenon",
      music: "bgm_quiet",
      characters: [
        {
          image: "ch_nico",
          x: 360,
          y: 560,
          scale: 0.9,
          flipX: false,
          name: "Nico",
        },
        {
          image: "ch_pitagoras",
          x: 670,
          y: 520,
          scale: 1.2,
          flipX: false,
          name: "Pitágoras",
        },
      ],
      dialogs: [
        {
          speaker: "Pitágoras",
          text: "Has avanzado, pero todavía no has reunido las 10 hojas necesarias del Libro de Geometría.",
          stage: { focus: "Pitágoras" },
        },
        {
          speaker: "Pitágoras",
          text: "Antes de la prueba final, necesito ver que ya sabes mirar más allá de la figura y reconocer las relaciones que la sostienen.",
        },
        {
          speaker: "Pitágoras",
          text: "Vuelve cuando tus trazos, tus ángulos y tus razonamientos hablen con más claridad.",
          stage: { focus: "Pitágoras" },
          next: "exit",
        },
      ],
    },
    pitagoras_reto: {
      title: "Pitágoras",
      background: "bg_partenon",
      music: "bgm_quiet",
      characters: [
        {
          image: "ch_nico",
          x: 360,
          y: 560,
          scale: 0.9,
          flipX: false,
          name: "Nico",
        },
        {
          image: "ch_pitagoras",
          x: 670,
          y: 520,
          scale: 1.2,
          flipX: false,
          name: "Pitágoras",
        },
      ],
      dialogs: [
        {
          speaker: "Pitágoras",
          text: "Ahora sí. Ya reuniste las 10 hojas necesarias para llegar a la prueba final.",
          stage: { focus: "Pitágoras" },
        },
        {
          speaker: "Pitágoras",
          text: "Has trabajado con figuras, giros, medidas, construcciones y relaciones.",
        },
        {
          speaker: "Pitágoras",
          text: "Pero el último paso no consiste en recordar temas por separado.",
        },
        {
          speaker: "Pitágoras",
          text: "Consiste en descubrir qué relación gobierna cada problema y qué idea permite sostener la respuesta.",
        },
        {
          speaker: "Nico",
          text: "Entonces ya no basta con reconocer una figura o aplicar una fórmula aislada.",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Pitágoras",
          text: "Exactamente.",
          stage: { focus: "Pitágoras" },
        },
        {
          speaker: "Pitágoras",
          text: "En nuestra escuela buscamos orden, proporción y armonía incluso donde otros solo ven líneas, números o dibujos.",
        },
        {
          speaker: "Pitágoras",
          text: "Si logras reconocer esas relaciones y defender tus conclusiones, habrás demostrado que sabes pensar con Geometría.",
        },
        {
          speaker: "Nico",
          text: "Estoy listo. Quiero enfrentar la prueba final.",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Pitágoras",
          text: "Entonces observa con atención, razona con firmeza y no confundas intuición con evidencia.",
          stage: { focus: "Pitágoras" },
          next: "exit",
        },
      ],
    },
    pitagoras_aprobado: {
      title: "Pitágoras",
      background: "bg_partenon",
      music: "bgm_quiet",
      characters: [
        {
          image: "ch_nico",
          x: 360,
          y: 560,
          scale: 0.9,
          flipX: false,
          name: "Nico",
        },
        {
          image: "ch_pitagoras",
          x: 670,
          y: 520,
          scale: 1.2,
          flipX: false,
          name: "Pitágoras",
        },
      ],
      dialogs: [
        {
          speaker: "Pitágoras",
          text: "Veo que ya has superado mi prueba y reunido lo necesario para cerrar este libro.",
          stage: { focus: "Pitágoras" },
        },
        {
          speaker: "Pitágoras",
          text: "Eso significa que tus respuestas ya no dependen solo de la intuición: empiezan a sostenerse por relaciones que comprendes.",
        },
        {
          speaker: "Nico",
          text: "Entonces aún puedo seguir practicando... aunque ya haya demostrado lo esencial.",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Pitágoras",
          text: "Claro. Una verdad geométrica no se agota la primera vez que se comprende.",
          stage: { focus: "Pitágoras" },
        },
        {
          speaker: "Pitágoras",
          text: "Cada regreso permite verla con más profundidad.",
          next: "exit",
        },
      ],
    },
    pitagoras_perfecto: {
      title: "Pitágoras",
      background: "bg_partenon",
      music: "bgm_quiet",
      characters: [
        {
          image: "ch_nico",
          x: 360,
          y: 560,
          scale: 0.9,
          flipX: false,
          name: "Nico",
        },
        {
          image: "ch_pitagoras",
          x: 670,
          y: 520,
          scale: 1.2,
          flipX: false,
          name: "Pitágoras",
        },
      ],
      dialogs: [
        {
          speaker: "Pitágoras",
          text: "Excelente. No solo venciste la prueba final: completaste toda la ruta de Geometría con verdadera constancia.",
          stage: { focus: "Pitágoras" },
        },
        {
          speaker: "Pitágoras",
          text: "Ahora ya no miras las figuras como simples formas. Empiezas a reconocer las relaciones que las ordenan.",
        },
        {
          speaker: "Pitágoras",
          text: "Ese es el verdadero triunfo: descubrir que la razón también puede habitar en lo que parece solo dibujo, medida o trazo.",
          stage: { focus: "Pitágoras" },
        },
        {
          speaker: "Pitágoras",
          text: "Si deseas volver a intentarlo, hazlo no por necesidad... sino por dominio.",
          next: "exit",
        },
      ],
    },
    exit: {
      title: "Exit de Pitágoras",
      music: "bgm_overworld",
      dialogs: [],
    },
  },
};

window.PITAGORAS_CIERRE_STORY = {
  start: "cierre",
  order: ["cierre", "exit"],
  scenes: {
    cierre: {
      title: "Cierre de Geometría",
      background: "bg_partenon",
      music: "bgm_quiet",
      introVideo: "vid_cierre",
      characters: [
        {
          image: "ch_nico",
          x: 360,
          y: 560,
          scale: 0.9,
          flipX: false,
          name: "Nico",
        },
        {
          image: "ch_pitagoras",
          x: 670,
          y: 520,
          scale: 1.2,
          flipX: false,
          name: "Pitágoras",
        },
      ],
      dialogs: [
        {
          speaker: "Pitágoras",
          text: "Con estas hojas, el Libro de Geometría puede cerrarse.",
          stage: { focus: "Pitágoras" },
        },
        {
          speaker: "Pitágoras",
          text: "Has llegado al final de esta ruta no por azar, sino aprendiendo a reconocer relaciones, sostener razones y mirar más allá de la apariencia.",
        },
        {
          speaker: "Pitágoras",
          text: "Lo que sigue ya no es otra lección. Es el cierre del camino que viniste a recorrer.",
          next: "exit",
        },
      ],
    },
    exit: {
      title: "Exit de Pitágoras",
      music: "bgm_overworld",
      dialogs: [],
    },
  },
};

window.SOFIA_CASTILLO_READY_STORY = {
  start: "sofia_ready",
  order: ["sofia_ready", "exit"],
  scenes: {
    sofia_ready: {
      title: "Sofia",
      background: "bg_sofia",
      music: "bgm_quiet",
      characters: MN_SOFIA_GEOMETRIA_CHARACTERS,
      dialogs: [
        {
          speaker: "Sofía",
          text: "Lo lograste. Pitágoras ya encuadernó el Libro de Geometría.",
          stage: { focus: "Sofía" },
        },
        {
          speaker: "Sofía",
          text: "El camino al castillo por fin está abierto",
          stage: { focus: "Sofia" },
        },
        {
          speaker: "Sofia",
          text: "Estas listo para irte del área de Geometría o todavia hay retos que quieres hacer?",
          stage: { focus: "Sofia" },
          choices: [
            {
              text: "Ya estoy listo para irme.",
              action: { type: "PUSH_STORY", storyKey: "npc_sofia_castillo_final" },
            },
            {
              text: "Todavia quiero hacer más retos.",
              next: "exit",
            },
          ],
        },
      ],
    },
    exit: {
      title: "Exit de Sofia",
      music: "bgm_overworld",
      dialogs: [],
    },
  },
};

window.SOFIA_CASTILLO_FINAL_STORY = {
  start: "sofia_gate",
  order: ["sofia_gate", "final_video", "exit"],
  scenes: {
    sofia_gate: {
      title: "Sofía",
      background: "bg_castillo",
      music: "bgm_quiet",
      characters: MN_SOFIA_GEOMETRIA_CHARACTERS,
      dialogs: [
        {
          speaker: "Nico",
          text: "Sofía... la puerta está abierta.",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Sofia",
          text: "Sí. El castillo reconoció los libros que reuniste.",
          stage: { focus: "Sofia" },
        },
        {
          speaker: "Nico",
          text: "¿Entonces ese era el camino desde el principio?",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Sofia",
          text: "No exactamente. La puerta siempre estuvo ahí. Lo que faltaba era que pudieras llegar hasta ella.",
          stage: { focus: "Sofia" },
        },
        {
          speaker: "Nico",
          text: "Siento como si algo me estuviera llamando del otro lado.",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Sofia",
          text: "Entonces vamos, no lo hagas esperar.",
          stage: { focus: "Sofia" },
        },
        {
          speaker: "Nico",
          text: "¿Vendrás conmigo?",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Sofia",
          text: "Hasta aquí puedo acompañarte. La puerta tienes que cruzarla tú.",
          stage: { focus: "Sofia" },
        },
        {
          speaker: "Nico",
          text: "Gracias, Sofía.",
          stage: { focus: "Nico" },
        },        
      ],
    },

    final_video: {
      title: "Final",
      background: "bg_castillo",
      music: "bgm_quiet",
      introVideo: "vid_final",
      videoEndAction: { type: "NAVIGATE", href: "index.html" },
      characters: [],
      dialogs: [],
    },

    exit: {
      title: "Exit de Sofía",
      music: "bgm_overworld",
      dialogs: [],
    },
  },
};