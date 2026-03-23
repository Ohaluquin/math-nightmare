// historia_algebra.js - Historia de la zona de Algebra de Math Nightmare
window.MN_PLAYER_NAME = "Nico";

const MN_ALGEBRA_STORY_SCALE_MULTIPLIERS = {
  ch_nico: 1.45,
  ch_sofia: 1.45,
  default: 1.55,
};

function MN_scaleAlgebraStoryCharacters(characters) {
  if (!Array.isArray(characters) || characters.__mnStoryScaled) return;

  characters.forEach((character) => {
    if (!character || typeof character.scale !== "number") return;
    const multiplier =
      MN_ALGEBRA_STORY_SCALE_MULTIPLIERS[character.image] ??
      MN_ALGEBRA_STORY_SCALE_MULTIPLIERS.default;

    character.scale = Number((character.scale * multiplier).toFixed(3));
  });

  Object.defineProperty(characters, "__mnStoryScaled", {
    value: true,
    enumerable: false,
    configurable: false,
    writable: false,
  });
}

function MN_scaleAlgebraStory(story) {
  if (!story || !story.scenes) return;
  Object.values(story.scenes).forEach((scene) => {
    MN_scaleAlgebraStoryCharacters(scene?.characters);
  });
}

const MN_SOFIA_ALGEBRA_CHARACTERS = [
  {
    image: "ch_nico",
    x: 300,
    y: 540,
    scale: 0.9,
    flipX: false,
    name: "Nico",
  },
  {
    image: "ch_sofia",
    x: 600,
    y: 530,
    scale: 0.6,
    flipX: false,
    name: "Sofia",
  },
];

const MN_SOFIA_ALGEBRA_TOPICS = [
  {
    id: "felipon",
    label: "Felipon el Confundido",
    page: 1,
    helpSheetKey: "sheet_algebra_1",
    mechanic:
      "Ordena las letras para reconstruir conceptos del algebra. No se trata de calcular, sino de reconocer el vocabulario correcto antes de que la confusion avance.",
    tip:
      "Fijate en palabras base como variable, constante, coeficiente o expresion. Si reconoces el concepto, despues sera mas facil interpretar ejercicios algebraicos.",
  },
  {
    id: "bodeguero",
    label: "Bodeguero",
    page: 1,
    helpSheetKey: "sheet_algebra_2",
    mechanic:
      "Observa la balanza y realiza acciones que mantengan el equilibrio. Si quitas o agregas algo en un lado, debes hacer lo mismo en el otro.",
    tip:
      "La idea central es la igualdad. Una ecuacion sigue siendo verdadera solo si ambos lados se transforman de manera equivalente.",
  },
  {
    id: "brahmagupta",
    label: "Brahmagupta",
    page: 1,
    helpSheetKey: "sheet_algebra_3",
    mechanic:
      "Lee el enigma con calma, identifica la cantidad desconocida y elige el numero que satisface las relaciones descritas.",
    tip:
      "No adivines. Primero traduce lo que cambia, lo que permanece y como se relacionan las cantidades; despues busca el numero oculto.",
  },
  {
    id: "silvano",
    label: "Silvano el Guia",
    page: 1,
    helpSheetKey: "sheet_algebra_4",
    mechanic:
      "Debes interpretar correctamente instrucciones y expresiones para tomar el camino adecuado. Leer rapido suele llevar al error.",
    tip:
      "Palabras como doble, mitad, suma o diferencia cambian por completo el significado. Traduce cada frase con precision antes de decidir.",
  },
  {
    id: "ariadna",
    label: "Ariadna",
    page: 1,
    helpSheetKey: "sheet_algebra_5",
    mechanic:
      "Sustituye el valor de la variable y resuelve respetando signos, parentesis y jerarquia de operaciones para avanzar por el laberinto.",
    tip:
      "Haz una cosa a la vez: sustituir bien, conservar signos y luego operar en orden. La prisa suele romper el procedimiento.",
  },
  {
    id: "mateo",
    label: "Mateo",
    page: 2,
    helpSheetKey: "sheet_algebra_6",
    mechanic:
      "Clasifica y junta terminos semejantes. Solo pueden combinarse los que tienen la misma parte literal o ambos son constantes.",
    tip:
      "Mira la letra y su exponente antes del numero. Primero decide si los terminos son semejantes; despues suma o resta coeficientes.",
  },
  {
    id: "howdin",
    label: "Howdin",
    page: 2,
    helpSheetKey: "sheet_algebra_7",
    mechanic:
      "Abre puertas haciendo el movimiento correcto para aislar la incognita. Cada accion debe acercarte a dejarla sola.",
    tip:
      "Piensa en capas: quita primero lo que estorba mas por fuera y avanza paso a paso sin romper la igualdad.",
  },
  {
    id: "aljuarismi",
    label: "Al-Juarismi",
    page: 2,
    helpSheetKey: "sheet_algebra_8",
    mechanic:
      "Distribuye, simplifica, mueve terminos y resuelve sin perder el equilibrio. Si dudas demasiado, la presion de la pesadilla aumenta.",
    tip:
      "No intentes hacerlo todo de golpe. Busca siempre el siguiente paso valido: distribuir, combinar, mover o despejar.",
  },
  {
    id: "clara",
    label: "Clara",
    page: 2,
    helpSheetKey: "sheet_algebra_9",
    mechanic:
      "Primero eliges la ecuacion que modela la situacion y despues resuelves su resultado. Si fallas, repites la misma situacion.",
    tip:
      "Antes de calcular, decide que representa la variable, que cantidades cambian y cual es la relacion entre ellas.",
  },
];

function MN_buildSofiaAlgebraStory() {
  const scenes = {
    sofia_menu: {
      title: "Sofia",
      background: "bg_sofia",
      music: "bgm_quiet",
      characters: MN_SOFIA_ALGEBRA_CHARACTERS,
      dialogs: [
        {
          speaker: "Sofia",
          text: "Hola. Aqui puedo ayudarte a entender que se trabaja en Algebra o darte ayuda puntual para cualquier reto.",
          stage: { focus: "Sofia" },
          choices: [
            {
              text: "Explicame el area de Algebra",
              next: "sofia_algebra",
            },
            {
              text: "Necesito ayuda con un minijuego",
              next: "sofia_help_menu_1",
            },
            { text: "Adios.", action: { type: "CLOSE_NOVELA" } },
          ],
        },
      ],
    },
    sofia_algebra: {
      title: "Area de Algebra",
      background: "bg_sofia",
      music: "bgm_quiet",
      characters: MN_SOFIA_ALGEBRA_CHARACTERS,
      dialogs: [
        {
          speaker: "Sofia",
          text: "En Algebra empiezas a usar letras para representar cantidades desconocidas o cambiantes.",
          stage: { focus: "Sofia" },
        },
        {
          speaker: "Sofia",
          text: "Aqui practicas conceptos, equilibrio, traduccion de frases, sustitucion, terminos semejantes, despejes, resolucion de ecuaciones y modelado.",
        },
        {
          speaker: "Sofia",
          text: "La idea no es memorizar trucos sueltos, sino entender relaciones entre cantidades y expresarlas con claridad.",
        },
        {
          speaker: "Sofia",
          text: "Si te atoras en un reto, usa mi ayuda por minijuego. Te dire que hacer, que habilidad se trabaja y que hoja consultar.",
          choices: [
            {
              text: "Quiero ayuda con un minijuego",
              next: "sofia_help_menu_1",
            },
            { text: "Volver con Sofia", next: "sofia_menu" },
          ],
        },
      ],
    },
    sofia_help_menu_1: {
      title: "Ayuda de Sofia",
      background: "bg_sofia",
      music: "bgm_quiet",
      characters: MN_SOFIA_ALGEBRA_CHARACTERS,
      dialogs: [
        {
          speaker: "Sofia",
          text: "Dime con cual reto de Algebra necesitas apoyo.",
          stage: { focus: "Sofia" },
          choices: [],
        },
      ],
    },
    sofia_help_menu_2: {
      title: "Ayuda de Sofia",
      background: "bg_sofia",
      music: "bgm_quiet",
      characters: MN_SOFIA_ALGEBRA_CHARACTERS,
      dialogs: [
        {
          speaker: "Sofia",
          text: "Aqui estan los retos restantes. Elige uno y te ayudo.",
          stage: { focus: "Sofia" },
          choices: [],
        },
      ],
    },
    exit: {
      title: "Exit de Sofia",
      music: "bgm_overworld",
      dialogs: [],
    },
  };

  const page1Choices = scenes.sofia_help_menu_1.dialogs[0].choices;
  const page2Choices = scenes.sofia_help_menu_2.dialogs[0].choices;

  MN_SOFIA_ALGEBRA_TOPICS.forEach((topic) => {
    const sceneKey = `sofia_help_${topic.id}`;
    const mechanicKey = `${sceneKey}_mechanic`;
    const tipKey = `${sceneKey}_tip`;
    const chooseMenu = topic.page === 1 ? "sofia_help_menu_1" : "sofia_help_menu_2";

    scenes[sceneKey] = {
      title: topic.label,
      background: "bg_sofia",
      music: "bgm_quiet",
      characters: MN_SOFIA_ALGEBRA_CHARACTERS,
      dialogs: [
        {
          speaker: "Sofia",
          text: "Que ayuda necesitas en este reto?",
          choices: [
            { text: "Mecanica del juego", next: mechanicKey },
            { text: "Consejo matematico", next: tipKey },
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
            { text: "Adios.", action: { type: "CLOSE_NOVELA" } },
          ],
        },
      ],
    };

    scenes[mechanicKey] = {
      title: `${topic.label} - Mecanica`,
      background: "bg_sofia",
      music: "bgm_quiet",
      characters: MN_SOFIA_ALGEBRA_CHARACTERS,
      dialogs: [
        {
          speaker: "Sofia",
          text: topic.mechanic,
          stage: { focus: "Sofia" },
          choices: [
            { text: "Volver al submenu", next: sceneKey },
            { text: "Elegir otro minijuego", next: chooseMenu },
            { text: "Adios.", action: { type: "CLOSE_NOVELA" } },
          ],
        },
      ],
    };

    scenes[tipKey] = {
      title: `${topic.label} - Consejo`,
      background: "bg_sofia",
      music: "bgm_quiet",
      characters: MN_SOFIA_ALGEBRA_CHARACTERS,
      dialogs: [
        {
          speaker: "Sofia",
          text: topic.tip,
          stage: { focus: "Sofia" },
          choices: [
            { text: "Volver al submenu", next: sceneKey },
            { text: "Elegir otro minijuego", next: chooseMenu },
            { text: "Adios.", action: { type: "CLOSE_NOVELA" } },
          ],
        },
      ],
    };

    const menuChoice = { text: topic.label, next: sceneKey };
    if (topic.page === 1) page1Choices.push(menuChoice);
    else page2Choices.push(menuChoice);
  });

  page1Choices.push({ text: "Ver mas minijuegos", next: "sofia_help_menu_2" });
  page1Choices.push({ text: "Adios.", action: { type: "CLOSE_NOVELA" } });
  page2Choices.push({
    text: "Ver minijuegos anteriores",
    next: "sofia_help_menu_1",
  });
  page2Choices.push({ text: "Adios.", action: { type: "CLOSE_NOVELA" } });

  return {
    start: "sofia_menu",
    order: Object.keys(scenes),
    scenes,
  };
}

window.SOFIA_ALGEBRA_STORY = MN_buildSofiaAlgebraStory();

window.FELIPON_CONCEPTOS_STORY = {
  start: "felipon_intro",
  order: ["felipon_intro"],
  scenes: {
    felipon_intro: {
      title: "Felipón el confundido",
      background: "bg_felipon_biblioteca",
      music: "bgm_quiet",
      characters: [
        {
          image: "ch_nico",
          x: 390,
          y: 620,
          scale: 0.8,
          flipX: false,
          name: "Nico",
        },
        {
          image: "ch_felipon",
          x: 730,
          y: 620,
          scale: 0.44,
          flipX: false,
          name: "Felipón",
        },
      ],
      dialogs: [
        {
          speaker: "Felipón",
          text: "¡Ay no... otra vez!",
          stage: { focus: "Felipón" },
        },
        {
          speaker: "Nico",
          text: "¿Qué pasa?",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Felipón",
          text: "Estoy tratando de estudiar álgebra... pero siento que las palabras se me enredan.",
          stage: { focus: "Felipón" },
        },
        {
          speaker: "Felipón",
          text: "Variable... constante... coeficiente... expresión...",
        },
        {
          speaker: "Felipón",
          text: "Las repito y las repito, pero a veces siento que solo estoy diciendo sonidos raros.",
        },
        {
          speaker: "Felipón",
          text: "Mira... yo sé que algo estoy haciendo mal.",
        },
        {
          speaker: "Felipón",
          text: "Veo la x y pienso en multiplicar... pero luego me dicen que no siempre significa eso.",
        },
        {
          speaker: "Felipón",
          text: "Y cuando aparece un menos, siento que me está ordenando restar.",
        },
        {
          speaker: "Felipón",
          text: "Pero después resulta que a veces solo indica que algo es negativo...",
        },
        {
          speaker: "Felipón",
          text: "o que un término ya trae su propio signo.",
        },
        {
          speaker: "Nico",
          text: "Tal vez todavía estás viendo esos símbolos como en la primaria.",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Nico",
          text: "Pero en álgebra no siempre son órdenes.",
        },
        {
          speaker: "Nico",
          text: "A veces solo indican qué representa una cantidad.",
        },
        {
          speaker: "Felipón",
          text: "¡Eso! ¡Eso es justo lo que me confunde!",
          stage: { focus: "Felipón" },
        },
        {
          speaker: "Felipón",
          text: "Las palabras y los símbolos están ahí... pero siento que no hablo el idioma del álgebra.",
        },
        {
          speaker: "Felipón",
          text: "Y para empeorar las cosas... la pesadilla también llegó a esta biblioteca.",
        },
        {
          speaker: "Felipón",
          text: "Las letras de los conceptos se mezclaron...",
        },
        {
          speaker: "Felipón",
          text: "y ahora las palabras están completamente desordenadas.",
        },
        {
          speaker: "Felipón",
          text: "Si no logro reconocer estos conceptos... nunca entenderé los problemas.",
        },
        {
          speaker: "Felipón",
          text: "Tal vez tú puedas reconstruirlos.",
        },
        {
          speaker: "Felipón",
          text: "Mira las letras con cuidado... y descubre qué palabra forman.",
        },
        {
          speaker: "Felipón",
          text: "Cada palabra correcta nos devolverá un concepto del álgebra.",
        },
        {
          speaker: "Felipón",
          text: "Pero si te equivocas... la confusión seguirá creciendo.",
        },
        {
          speaker: "Felipón",
          text: "Vamos... ayudemos a poner en orden el lenguaje del álgebra.",
        },
      ],
    },
  },
};

window.BODEGUERO_BALANZA_STORY = {
  start: "bodega_intro",
  order: ["bodega_intro"],
  scenes: {
    bodega_intro: {
      title: "La Bodega del Equilibrio",
      background: "bg_bodega_exterior",
      music: "bgm_quiet",
      characters: [
        {
          image: "ch_nico",
          x: 280,
          y: 560,
          scale: 0.8,
          flipX: false,
          name: "Nico",
        },
        {
          image: "ch_bodeguero",
          x: 620,
          y: 520,
          scale: 0.56,
          flipX: false,
          name: "Bodeguero",
        },
      ],
      dialogs: [
        {
          speaker: "Bodeguero",
          text: "¡Hola! Bienvenido a la bodega.",
          stage: { focus: "Bodeguero" },
        },
        {
          speaker: "Bodeguero",
          text: "Desde aquí salen mercancías hacia muchas ciudades.",
        },
        {
          speaker: "Bodeguero",
          text: "Mi trabajo es preparar las cargas para las carrozas.",
        },
        {
          speaker: "Bodeguero",
          text: "Si una carroza queda demasiado pesada de un lado...",
        },
        {
          speaker: "Bodeguero",
          text: "puede romperse una rueda o incluso volcar en el camino.",
        },
        {
          speaker: "Nico",
          text: "Entonces todo tiene que quedar bien equilibrado.",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Bodeguero",
          text: "Exactamente.",
          stage: { focus: "Bodeguero" },
        },
        {
          speaker: "Bodeguero",
          text: "Por eso uso esta balanza.",
        },
        {
          speaker: "Bodeguero",
          text: "Si los dos lados se equilibran, significa que pesan lo mismo.",
        },
        {
          speaker: "Bodeguero",
          text: "Pero aquí hay otro problema...",
        },
        {
          speaker: "Bodeguero",
          text: "Muchas cajas y costales llegan sin ninguna etiqueta.",
        },
        {
          speaker: "Bodeguero",
          text: "No sabemos exactamente cuánto pesa cada cosa.",
        },
        {
          speaker: "Nico",
          text: "Entonces… ¿cómo descubres su peso?",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Bodeguero",
          text: "Observando el equilibrio.",
          stage: { focus: "Bodeguero" },
        },
        {
          speaker: "Bodeguero",
          text: "Si quito algo de un lado...",
        },
        {
          speaker: "Bodeguero",
          text: "debo quitar lo mismo del otro lado.",
        },
        {
          speaker: "Bodeguero",
          text: "Solo así la balanza sigue diciendo la verdad.",
        },
        {
          speaker: "Bodeguero",
          text: "Con paciencia podemos descubrir el peso de cualquier cosa.",
        },
        {
          speaker: "Bodeguero",
          text: "¿Te gustaría intentarlo?",
        },
      ],
    },
  },
};

window.BRAHMAGUPTA_ENIGMAS_STORY = {
  start: "brahmagupta_intro",
  order: ["brahmagupta_intro"],
  scenes: {
    brahmagupta_intro: {
      title: "Brahmagupta",
      background: "bg_brahmagupta_exterior",
      music: "bgm_quiet",
      characters: [
        {
          image: "ch_nico",
          x: 280,
          y: 560,
          scale: 0.8,
          flipX: false,
          name: "Nico",
        },
        {
          image: "ch_brahmagupta",
          x: 620,
          y: 520,
          scale: 0.56,
          flipX: false,
          name: "Brahmagupta",
        },
      ],
      dialogs: [
        {
          speaker: "Brahmagupta",
          text: "Hola! Soy Brahmagupta, astrónomo y matemático de la India.",
          stage: { focus: "Brahmagupta" },
        },
        {
          speaker: "Brahmagupta",
          text: "He dedicado mucho tiempo a estudiar números, relaciones y cantidades que no se muestran a simple vista.",
        },
        {
          speaker: "Brahmagupta",
          text: "Muchos creen que un enigma numérico se resuelve adivinando.",
          stage: { focus: "Brahmagupta" },
        },
        {
          speaker: "Brahmagupta",
          text: "Yo no.",
        },
        {
          speaker: "Brahmagupta",
          text: "Primero nombro la cantidad desconocida.",
        },
        {
          speaker: "Brahmagupta",
          text: "Luego escucho con atención: qué se suma, qué se quita, qué se multiplica, qué permanece igual.",
        },
        {
          speaker: "Brahmagupta",
          text: "Cuando el lenguaje se ordena, el número deja de esconderse.",
        },
        {
          speaker: "Nico",
          text: "Entonces no basta con calcular... primero hay que entender lo que el enigma está diciendo.",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Brahmagupta",
          text: "Así es.",
          stage: { focus: "Brahmagupta" },
        },
        {
          speaker: "Brahmagupta",
          text: "A veces el número está oculto, pero la relación entre las cantidades está a la vista.",
        },
        {
          speaker: "Brahmagupta",
          text: "Si logras expresarla con claridad, podrás descubrirlo.",
        },
        {
          speaker: "Brahmagupta",
          text: "Te presentaré tres enigmas. Escucha bien sus palabras y encuentra el número que esconden.",
        },
      ],
    },
  },
};

window.SILVANO_LENGUAJE_NATURAL_STORY = {
  start: "silvano_intro",
  order: ["silvano_intro"],
  scenes: {
    silvano_intro: {
      title: "Silvano el Guía",
      background: "bg_bosque_entrada",
      music: "bgm_quiet",
      characters: [
        {
          image: "ch_nico",
          x: 280,
          y: 560,
          scale: 0.8,
          flipX: false,
          name: "Nico",
        },
        {
          image: "ch_silvano",
          x: 620,
          y: 520,
          scale: 0.56,
          flipX: false,
          name: "Silvano",
        },
      ],
      dialogs: [
        {
          speaker: "Silvano",
          text: "Detente un momento.",
          stage: { focus: "Silvano" },
        },
        {
          speaker: "Silvano",
          text: "Ese sendero conduce al Bosque Perdido.",
        },
        {
          speaker: "Silvano",
          text: "No es un lugar para quien lee deprisa o entiende a medias.",
        },
        {
          speaker: "Nico",
          text: "¿Tan peligroso es?",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Silvano",
          text: "Más de lo que parece.",
          stage: { focus: "Silvano" },
        },
        {
          speaker: "Silvano",
          text: "Allá dentro hay señales, advertencias y pistas para avanzar.",
        },
        {
          speaker: "Silvano",
          text: "Pero si interpretas mal una sola instrucción...",
        },
        {
          speaker: "Silvano",
          text: "puedes apartarte del camino y perderte entre los árboles.",
        },
        {
          speaker: "Silvano",
          text: "Y muy en lo profundo habita algo que no conviene encontrar.",
        },
        {
          speaker: "Nico",
          text: "Entonces no basta con caminar. Hay que entender exactamente lo que dicen las indicaciones.",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Silvano",
          text: "Exactamente.",
          stage: { focus: "Silvano" },
        },
        {
          speaker: "Silvano",
          text: "En otros lugares, leer mal solo te hace perder tiempo.",
        },
        {
          speaker: "Silvano",
          text: "En este bosque, leer mal puede hacerte perder el rumbo.",
        },
        {
          speaker: "Silvano",
          text: "Muchos creen que una frase se entiende por intuición.",
        },
        {
          speaker: "Silvano",
          text: "Pero aquí debes escuchar con cuidado qué cantidad se suma, cuál se duplica, qué parte depende de cuál.",
        },
        {
          speaker: "Silvano",
          text: "Si cambias el sentido de una expresión, cambias también el camino.",
        },
        {
          speaker: "Nico",
          text: "Entonces este bosque pone a prueba si de verdad sabemos traducir bien las instrucciones.",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Silvano",
          text: "Así es.",
          stage: { focus: "Silvano" },
        },
        {
          speaker: "Silvano",
          text: "No voy a detenerte si decides entrar.",
        },
        {
          speaker: "Silvano",
          text: "Pero tampoco voy a guiarte paso por paso.",
        },
        {
          speaker: "Silvano",
          text: "Si logras atravesarlo sin perderte, habrás demostrado que sabes leer con precisión.",
        },
        {
          speaker: "Silvano",
          text: "Y entonces te entregaré una hoja.",
        },
        {
          speaker: "Nico",
          text: "Entiendo... primero debo aprender a seguir bien el lenguaje del camino.",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Silvano",
          text: "Entra si estás listo.",
          stage: { focus: "Silvano" },
        },
        {
          speaker: "Silvano",
          text: "Lee con cuidado. Piensa antes de elegir.",
        },
        {
          speaker: "Silvano",
          text: "En el Bosque Perdido, una instrucción mal entendida puede llevarte justo hacia la pesadilla.",
        },
      ],
    },
  },
};

window.ARIADNA_SUSTITUIR_EVALUAR_STORY = {
  start: "ariadna_intro",
  order: ["ariadna_intro"],
  scenes: {
    ariadna_intro: {
      title: "Ariadna",
      background: "bg_laberinto_entrada",
      music: "bgm_quiet",
      characters: [
        {
          image: "ch_nico",
          x: 280,
          y: 560,
          scale: 0.8,
          flipX: false,
          name: "Nico",
        },
        {
          image: "ch_ariadna",
          x: 620,
          y: 520,
          scale: 0.56,
          flipX: false,
          name: "Ariadna",
        },
      ],
      dialogs: [
        {
          speaker: "Ariadna",
          text: "Detente un momento.",
          stage: { focus: "Ariadna" },
        },
        {
          speaker: "Ariadna",
          text: "Lo que sigue no es una habilidad nueva, pero sí una prueba más difícil.",
        },
        {
          speaker: "Nico",
          text: "¿Más difícil? ¿Por qué?",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Ariadna",
          text: "Porque aquí se junta todo lo que ya has practicado por separado.",
          stage: { focus: "Ariadna" },
        },
        {
          speaker: "Ariadna",
          text: "Operaciones. Signos. Paréntesis. Jerarquía.",
        },
        {
          speaker: "Ariadna",
          text: "Y además, la sustitución correcta de una variable por su valor.",
        },
        {
          speaker: "Nico",
          text: "Entonces no basta con hacer cuentas rápido.",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Ariadna",
          text: "Exactamente.",
          stage: { focus: "Ariadna" },
        },
        {
          speaker: "Ariadna",
          text: "Muchos se pierden porque creen que aquí todo se resuelve corriendo o adivinando.",
        },
        {
          speaker: "Ariadna",
          text: "Pero no es así.",
        },
        {
          speaker: "Ariadna",
          text: "Primero debes sustituir con cuidado.",
        },
        {
          speaker: "Ariadna",
          text: "Después respetar los signos.",
        },
        {
          speaker: "Ariadna",
          text: "Y finalmente seguir el orden de las operaciones sin romperlo.",
        },
        {
          speaker: "Nico",
          text: "Como si hubiera que seguir un hilo para no perderse.",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Ariadna",
          text: "Sí.",
          stage: { focus: "Ariadna" },
        },
        {
          speaker: "Ariadna",
          text: "Mi hilo no sirve solo para encontrar la salida.",
        },
        {
          speaker: "Ariadna",
          text: "También sirve para recordar el procedimiento correcto.",
        },
        {
          speaker: "Ariadna",
          text: "Si lo sigues, cada paso tiene sentido.",
        },
        {
          speaker: "Ariadna",
          text: "Si lo sueltas, la prisa y la confusión harán el resto.",
        },
        {
          speaker: "Nico",
          text: "Entonces esta prueba no es solo de valor...",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Nico",
          text: "también es de atención y de orden.",
        },
        {
          speaker: "Ariadna",
          text: "Así es.",
          stage: { focus: "Ariadna" },
        },
        {
          speaker: "Ariadna",
          text: "Avanza con calma, pero piensa con precisión.",
        },
        {
          speaker: "Ariadna",
          text: "Ese será tu verdadero hilo.",
        },
      ],
    },
  },
};

window.MATEO_CLASIFICADOR_STORY = {
  start: "mateo_intro",
  order: ["mateo_intro"],
  scenes: {
    mateo_intro: {
      title: "Mateo el astronauta",
      background: "bg_mateo_exterior",
      music: "bgm_quiet",
      characters: [
        {
          image: "ch_nico",
          x: 280,
          y: 560,
          scale: 0.8,
          flipX: false,
          name: "Nico",
        },
        {
          image: "ch_mateo",
          x: 620,
          y: 520,
          scale: 0.4,
          flipX: false,
          name: "Mateo",
        },
      ],
      dialogs: [
        {
          speaker: "Mateo",
          text: "¡Hola! Soy Mateo.",
          stage: { focus: "Mateo" },
        },
        {
          speaker: "Mateo",
          text: "¿Quieres jugar conmigo?",
        },
        {
          speaker: "Mateo",
          text: "Estoy jugando a los astronautas.",
        },
        {
          speaker: "Mateo",
          text: "Cuando los astronautas tienen problemas en el espacio...",
        },
        {
          speaker: "Mateo",
          text: "tienen que resolverlos con lo que tengan a la mano.",
        },
        {
          speaker: "Mateo",
          text: "Por eso me hice este traje.",
        },
        {
          speaker: "Mateo",
          text: "Usé botellas, cartón y mucha cinta adhesiva.",
        },
        {
          speaker: "Nico",
          text: "Parece un traje espacial de verdad.",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Mateo",
          text: "¡Gracias!",
          stage: { focus: "Mateo" },
        },
        {
          speaker: "Mateo",
          text: "Pero ahora tenemos una misión.",
        },
        {
          speaker: "Mateo",
          text: "Debemos explorar el espacio y recoger todo lo que encontremos.",
        },
        {
          speaker: "Mateo",
          text: "Pero hay un problema...",
        },
        {
          speaker: "Mateo",
          text: "todo está mezclado y desordenado.",
        },
        {
          speaker: "Mateo",
          text: "Así que debemos clasificar las cosas y juntarlas correctamente.",
        },
        {
          speaker: "Mateo",
          text: "Si logramos organizarlas bien, la misión será un éxito.",
        },
        {
          speaker: "Mateo",
          text: "¿Quieres ayudarme?",
        },
        {
          speaker: "Mateo",
          text: "¡Es muy divertido!",
        },
      ],
    },
  },
};

window.HOWDIN_CERRAJERO_STORY = {
  start: "howdin_intro",
  order: ["howdin_intro"],
  scenes: {
    howdin_intro: {
      title: "Howdin el cerrajero",
      background: "bg_mazmorra",
      music: "bgm_quiet",
      characters: [
        {
          image: "ch_nico",
          x: 280,
          y: 560,
          scale: 0.8,
          flipX: false,
          name: "Nico",
        },
        {
          image: "ch_howdin",
          x: 620,
          y: 520,
          scale: 0.56,
          flipX: false,
          name: "Howdin",
        },
      ],
      dialogs: [
        {
          speaker: "Howdin",
          text: "Muchos intentan forzar estas puertas… pero así no se abren.",
          stage: { focus: "Howdin" },
        },
        {
          speaker: "Nico",
          text: "¿Entonces cómo se abren?",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Howdin",
          text: "Cada cerradura tiene un mecanismo. Si presionas la pieza correcta… el candado se abre.",
        },
        {
          speaker: "Howdin",
          text: "Las ecuaciones funcionan igual.",
        },
        {
          speaker: "Howdin",
          text: "En este pasillo encontrarás cinco puertas cerradas.",
        },
        {
          speaker: "Howdin",
          text: "Para abrirlas tendrás que ejecutar la combinación correcta.",
        },
        {
          speaker: "Howdin",
          text: "Un número está atrapado detrás de otros… como un mecanismo oculto.",
        },
        {
          speaker: "Howdin",
          text: "Si sabes retirar el obstáculo correcto en cada paso, la cerradura cede…",
        },
        {
          speaker: "Howdin",
          text: "…y la incógnita queda libre.",
        },
        {
          speaker: "Howdin",
          text: "Cruza el pasillo y abre las cinco puertas.",
        },
        {
          speaker: "Howdin",
          text: "No necesitas fuerza.",
        },
        {
          speaker: "Howdin",
          text: "Solo saber cómo liberar la incógnita.",
        },
      ],
    },
  },
};

window.ALJUARISMI_BALANCEO_STORY = {
  start: "aljuarismi_intro",
  order: ["aljuarismi_intro"],
  scenes: {
    aljuarismi_intro: {
      title: "Al-Juarismi",
      background: "bg_aljuarizmi",
      music: "bgm_quiet",
      characters: [
        {
          image: "ch_nico",
          x: 280,
          y: 560,
          scale: 0.8,
          flipX: false,
          name: "Nico",
        },
        {
          image: "ch_aljuarismi",
          x: 620,
          y: 520,
          scale: 0.56,
          flipX: false,
          name: "Al-Juarismi",
        },
      ],
      dialogs: [
        {
          speaker: "Al-Juarismi",
          text: "No avances todavía.",
          stage: { focus: "Al-Juarismi" },
        },
        {
          speaker: "Al-Juarismi",
          text: "He visto lo que ocurre cuando alguien enfrenta una ecuación sin orden.",
        },
        {
          speaker: "Nico",
          text: "A veces... no sé por dónde empezar.",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Al-Juarismi",
          text: "No es falta de conocimiento.",
        },
        {
          speaker: "Al-Juarismi",
          text: "Es falta de estructura.",
        },
        {
          speaker: "Al-Juarismi",
          text: "Mira esto.",
        },
        {
          speaker: "Al-Juarismi",
          text: "Una ecuación es como una balanza en equilibrio.",
        },
        {
          speaker: "Al-Juarismi",
          text: "Si mueves algo de un lado… debes hacer lo mismo en el otro.",
        },
        {
          speaker: "Al-Juarismi",
          text: "Si no respetas ese equilibrio… todo se rompe.",
        },
        {
          speaker: "Nico",
          text: "Entonces no es solo hacer operaciones...",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Al-Juarismi",
          text: "Exactamente.",
        },
        {
          speaker: "Al-Juarismi",
          text: "En mi tiempo lo llamamos al-jabr y al-muqabala.",
        },
        {
          speaker: "Al-Juarismi",
          text: "Restaurar lo que falta… y equilibrar lo que sobra.",
        },
        {
          speaker: "Al-Juarismi",
          text: "Mover términos. Simplificar. Ordenar.",
        },
        {
          speaker: "Al-Juarismi",
          text: "Cada paso tiene un propósito.",
        },
        {
          speaker: "Al-Juarismi",
          text: "Pero aquí ocurre algo más...",
        },
        {
          speaker: "Al-Juarismi",
          text: "Cuando dudas demasiado… el tiempo se detiene.",
        },
        {
          speaker: "Al-Juarismi",
          text: "Y la pesadilla avanza.",
        },
        {
          speaker: "Al-Juarismi",
          text: "Tu cuerpo se vuelve pesado… como si te convirtieras en piedra.",
        },
        {
          speaker: "Nico",
          text: "Entonces tengo que pensar rápido… pero con orden.",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Al-Juarismi",
          text: "No rápido.",
        },
        {
          speaker: "Al-Juarismi",
          text: "Claro.",
        },
        {
          speaker: "Al-Juarismi",
          text: "Si entiendes el siguiente paso… el resto sigue.",
        },
        {
          speaker: "Al-Juarismi",
          text: "Te daré tres ecuaciones.",
        },
        {
          speaker: "Al-Juarismi",
          text: "No busques adivinar.",
        },
        {
          speaker: "Al-Juarismi",
          text: "Mantén el equilibrio… y la incógnita se liberará.",
        },
      ],
    },
  },
};
window.ALJUARISMI_BALANCEO_STORY = {
  start: "aljuarismi_intro",
  order: ["aljuarismi_intro"],
  scenes: {
    aljuarismi_intro: {
      title: "Al-Juarismi",
      background: "bg_aljuarizmi",
      music: "bgm_quiet",
      characters: [
        {
          image: "ch_nico",
          x: 280,
          y: 560,
          scale: 0.8,
          flipX: false,
          name: "Nico",
        },
        {
          image: "ch_aljuarismi",
          x: 620,
          y: 520,
          scale: 0.56,
          flipX: false,
          name: "Al-Juarismi",
        },
      ],
      dialogs: [
        {
          speaker: "Al-Juarismi",
          text: "Te he estado observando.",
          stage: { focus: "Al-Juarismi" },
        },
        {
          speaker: "Al-Juarismi",
          text: "No es que no sepas resolver ecuaciones... es que a veces te quedas inmóvil.",
        },
        {
          speaker: "Nico",
          text: "Es que... cuando veo tantos símbolos no sé qué hacer primero.",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Al-Juarismi",
          text: "Eso tiene nombre. Se llama desorden.",
        },
        {
          speaker: "Al-Juarismi",
          text: "En mi tierra lo llamamos al-jabr y al-muqabala.",
        },
        {
          speaker: "Nico",
          text: "¿Qué significa eso?",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Al-Juarismi",
          text: "Restaurar lo que falta... y equilibrar lo que sobra.",
        },
        {
          speaker: "Al-Juarismi",
          text: "Una ecuación es una balanza. Si tocas un lado, debes tocar el otro.",
        },
        {
          speaker: "Al-Juarismi",
          text: "Si un término estorba, muévelo. Si dos son semejantes, únelos.",
        },
        {
          speaker: "Al-Juarismi",
          text: "Pero si no sabes qué hacer... te petrificas.",
        },
        {
          speaker: "Al-Juarismi",
          text: "Aquí tu miedo se convierte en piedra. Tu color se desvanece.",
        },
        {
          speaker: "Al-Juarismi",
          text: "No porque la ecuación sea imposible... sino porque dudas del siguiente paso.",
        },
        {
          speaker: "Al-Juarismi",
          text: "Te daré tres ecuaciones.",
        },
        {
          speaker: "Al-Juarismi",
          text: "No basta con resolver una. Debes demostrar que entiendes el procedimiento.",
        },
        {
          speaker: "Al-Juarismi",
          text: "Si tardas demasiado, la pesadilla avanzará.",
        },
        {
          speaker: "Al-Juarismi",
          text: "Pero si mantienes el orden... el equilibrio te devolverá el color.",
        },
        {
          speaker: "Al-Juarismi",
          text: "¿Practicarás primero... o enfrentarás el desafío real?",
        },
      ],
    },
  },
};

window.CLARA_MODELACION_STORY = {
  start: "clara_intro",
  order: ["clara_intro"],
  scenes: {
    clara_intro: {
      title: "Clara",
      background: "bg_clara_mercado",
      music: "bgm_quiet",
      characters: [
        {
          image: "ch_nico",
          x: 280,
          y: 560,
          scale: 0.8,
          flipX: false,
          name: "Nico",
        },
        {
          image: "ch_clara",
          x: 620,
          y: 520,
          scale: 0.56,
          flipX: false,
          name: "Clara",
        },
      ],
      dialogs: [
        {
          speaker: "Clara",
          text: "Espera… antes de avanzar.",
          stage: { focus: "Clara" },
        },
        {
          speaker: "Clara",
          text: "Aquí no basta con hacer cuentas.",
        },
        {
          speaker: "Nico",
          text: "¿Entonces qué hay que hacer?",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Clara",
          text: "Entender lo que realmente está pasando.",
        },
        {
          speaker: "Clara",
          text: "Mira a tu alrededor.",
        },
        {
          speaker: "Clara",
          text: "Precios. Cantidades. Cambios.",
        },
        {
          speaker: "Clara",
          text: "Todo está relacionado… pero no siempre es evidente.",
        },
        {
          speaker: "Nico",
          text: "A veces leo el problema… pero no sé cómo empezar.",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Clara",
          text: "Eso es porque intentas resolver… antes de entender.",
        },
        {
          speaker: "Clara",
          text: "Primero hay que decidir qué representa cada cosa.",
        },
        {
          speaker: "Clara",
          text: "¿Qué cambia?",
        },
        {
          speaker: "Clara",
          text: "¿Qué se mantiene?",
        },
        {
          speaker: "Clara",
          text: "¿Qué depende de qué?",
        },
        {
          speaker: "Clara",
          text: "Si ves esas relaciones… la ecuación aparece sola.",
        },
        {
          speaker: "Nico",
          text: "Entonces modelar es como traducir la situación.",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Clara",
          text: "Exactamente.",
        },
        {
          speaker: "Clara",
          text: "Pero cuidado…",
        },
        {
          speaker: "Clara",
          text: "Si interpretas mal una relación… todo el resultado será incorrecto.",
        },
        {
          speaker: "Clara",
          text: "Aquí la pesadilla no está en los números…",
        },
        {
          speaker: "Clara",
          text: "está en las interpretaciones equivocadas.",
        },
        {
          speaker: "Clara",
          text: "Te mostraré varias situaciones.",
        },
        {
          speaker: "Clara",
          text: "No empieces calculando.",
        },
        {
          speaker: "Clara",
          text: "Primero entiende qué está pasando.",
        },
        {
          speaker: "Clara",
          text: "Después… exprésalo con una ecuación.",
        },
        {
          speaker: "Clara",
          text: "Si lo haces bien… todo tendrá sentido.",
        },
      ],
    },
  },
};

window.ALJUARISMI_BALANCEO_STORY = {
  start: "aljuarismi_bloqueado",
  order: [
    "aljuarismi_bloqueado",
    "aljuarismi_reto",
    "aljuarismi_aprobado",
    "aljuarismi_perfecto",
    "exit",
  ],
  scenes: {
    aljuarismi_bloqueado: {
      title: "Al-Juarismi",
      background: "bg_aljuarizmi",
      music: "bgm_quiet",
      characters: [
        {
          image: "ch_nico",
          x: 280,
          y: 560,
          scale: 0.8,
          flipX: false,
          name: "Nico",
        },
        {
          image: "ch_aljuarismi",
          x: 620,
          y: 520,
          scale: 0.56,
          flipX: false,
          name: "Al-Juarismi",
        },
      ],
      dialogs: [
        {
          speaker: "Al-Juarismi",
          text: "Aun no has reunido suficientes hojas del Libro del Algebra. Antes de enfrentarme, debes demostrar dominio en los otros retos.",
          stage: { focus: "Al-Juarismi" },
        },
        {
          speaker: "Al-Juarismi",
          text: "Cuando tengas al menos cinco hojas, vuelve. Entonces sabre que ya puedes sostener el equilibrio de una ecuacion completa.",
          stage: { focus: "Al-Juarismi" },
          next: "exit",
        },
      ],
    },
    aljuarismi_reto: {
      title: "Al-Juarismi",
      background: "bg_aljuarizmi",
      music: "bgm_quiet",
      characters: [
        {
          image: "ch_nico",
          x: 280,
          y: 560,
          scale: 0.8,
          flipX: false,
          name: "Nico",
        },
        {
          image: "ch_aljuarismi",
          x: 620,
          y: 520,
          scale: 0.56,
          flipX: false,
          name: "Al-Juarismi",
        },
      ],
      dialogs: [
        {
          speaker: "Al-Juarismi",
          text: "Ya casi completas lo necesario. Has reunido suficientes hojas para llegar hasta mi puerta, pero todavia falta una prueba final.",
          stage: { focus: "Al-Juarismi" },
        },
        {
          speaker: "Al-Juarismi",
          text: "Si mantienes el orden y resuelves con claridad, te entregare la hoja que falta para cerrar este libro y abrir el paso hacia Geometria.",
          stage: { focus: "Al-Juarismi" },
        },
        {
          speaker: "Nico",
          text: "Entiendo. No se trata solo de llegar hasta aqui, sino de demostrar que puedo sostener el procedimiento completo.",
          stage: { focus: "Nico" },
          next: "exit",
        },
      ],
    },
    aljuarismi_aprobado: {
      title: "Al-Juarismi",
      background: "bg_aljuarizmi",
      music: "bgm_quiet",
      characters: [
        {
          image: "ch_nico",
          x: 280,
          y: 560,
          scale: 0.8,
          flipX: false,
          name: "Nico",
        },
        {
          image: "ch_aljuarismi",
          x: 620,
          y: 520,
          scale: 0.56,
          flipX: false,
          name: "Al-Juarismi",
        },
      ],
      dialogs: [
        {
          speaker: "Al-Juarismi",
          text: "Veo que ya reuniste al menos seis hojas del Libro del Algebra. Con eso basta para encuadernarlo y abrir el camino a la Geometria.",
          stage: { focus: "Al-Juarismi" },
        },
        {
          speaker: "Al-Juarismi",
          text: "Si aun quedan desafios pendientes, puedes seguir enfrentandolos. No por necesidad, sino para afinar tu mirada matematica.",
          stage: { focus: "Al-Juarismi" },
        },
        {
          speaker: "Nico",
          text: "Entonces el camino ya puede abrirse, pero aun puedo volver para terminar el libro completo.",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Al-Juarismi",
          text: "Exactamente. Habla con Sofia cuando estes listo para dar el siguiente paso.",
          stage: { focus: "Al-Juarismi" },
          next: "exit",
        },
      ],
    },
    aljuarismi_perfecto: {
      title: "Al-Juarismi",
      background: "bg_aljuarizmi",
      music: "bgm_quiet",
      characters: [
        {
          image: "ch_nico",
          x: 280,
          y: 560,
          scale: 0.8,
          flipX: false,
          name: "Nico",
        },
        {
          image: "ch_aljuarismi",
          x: 620,
          y: 520,
          scale: 0.56,
          flipX: false,
          name: "Al-Juarismi",
        },
      ],
      dialogs: [
        {
          speaker: "Al-Juarismi",
          text: "Excelente. Has reunido todas las hojas del Libro del Algebra, incluida la mia. Eso significa que no solo resolviste: comprendiste.",
          stage: { focus: "Al-Juarismi" },
        },
        {
          speaker: "Al-Juarismi",
          text: "El orden, el equilibrio y la claridad ya forman parte de tu manera de pensar. Esa sera tu mejor herramienta en Geometria.",
          stage: { focus: "Al-Juarismi" },
        },
        {
          speaker: "Al-Juarismi",
          text: "Habla con Sofia cuando quieras partir. Y si deseas practicar de nuevo, aqui seguire.",
          stage: { focus: "Al-Juarismi" },
          next: "exit",
        },
      ],
    },
    exit: {
      title: "Exit de Al-Juarismi",
      music: "bgm_overworld",
      dialogs: [],
    },
  },
};

window.ALJUARISMI_CIERRE_STORY = {
  start: "cierre",
  order: ["cierre", "exit"],
  scenes: {
    cierre: {
      title: "Cierre de Algebra",
      background: "bg_aljuarizmi",
      music: "bgm_quiet",
      characters: [
        {
          image: "ch_nico",
          x: 280,
          y: 560,
          scale: 0.8,
          flipX: false,
          name: "Nico",
        },
        {
          image: "ch_aljuarismi",
          x: 620,
          y: 520,
          scale: 0.56,
          flipX: false,
          name: "Al-Juarismi",
        },
      ],
      dialogs: [
        {
          speaker: "Al-Juarismi",
          text: "Bien. Con estas hojas, el Libro del Algebra ya puede cerrarse.",
        },
        {
          speaker: "Al-Juarismi",
          text: "Habla con Sofia. Ella te guiara hacia el Area de Geometria cuando decidas continuar.",
          next: "exit",
        },
      ],
    },
    exit: {
      title: "Exit",
      music: "bgm_overworld",
      dialogs: [],
    },
  },
};

window.SOFIA_GEOMETRIA_GATE_STORY = {
  start: "sofia_gate",
  order: ["sofia_gate", "exit"],
  scenes: {
    sofia_gate: {
      title: "Sofia",
      background: "bg_sofia",
      music: "bgm_quiet",
      characters: [
        {
          image: "ch_nico",
          x: 300,
          y: 540,
          scale: 0.9,
          flipX: false,
          name: "Nico",
        },
        {
          image: "ch_sofia",
          x: 600,
          y: 530,
          scale: 0.6,
          flipX: false,
          name: "Sofia",
        },
      ],
      dialogs: [
        {
          speaker: "Sofia",
          text: "Lo lograste. Al-Juarismi ya encuaderno el Libro del Algebra.",
          stage: { focus: "Sofia" },
        },
        {
          speaker: "Sofia",
          text: "Estas listo para partir al Area de Geometria?",
          stage: { focus: "Sofia" },
          choices: [
            {
              text: "Si. Llevame a Geometria.",
              action: { type: "NAVIGATE", href: "geometria.html" },
            },
            {
              text: "No todavia. Quiero terminar cosas aqui.",
              next: "exit",
            },
          ],
        },
      ],
    },
    exit: {
      title: "Exit",
      music: "bgm_overworld",
      dialogs: [],
    },
  },
};

[
  window.SOFIA_ALGEBRA_STORY,
  window.FELIPON_CONCEPTOS_STORY,
  window.BODEGUERO_BALANZA_STORY,
  window.BRAHMAGUPTA_ENIGMAS_STORY,
  window.SILVANO_LENGUAJE_NATURAL_STORY,
  window.ARIADNA_SUSTITUIR_EVALUAR_STORY,
  window.MATEO_CLASIFICADOR_STORY,
  window.HOWDIN_CERRAJERO_STORY,
  window.ALJUARISMI_BALANCEO_STORY,
  window.CLARA_MODELACION_STORY,
  window.ALJUARISMI_CIERRE_STORY,
  window.SOFIA_GEOMETRIA_GATE_STORY,
].forEach(MN_scaleAlgebraStory);
