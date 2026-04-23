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
    scale: 1,
    flipX: false,
    name: "Sofia",
  },
];

const MN_SOFIA_ALGEBRA_TOPICS = [
  {
    id: "felipon",
    label: "Felipón el Confundido",
    page: 1,
    helpSheetKey: "sheet_algebra_1",
    mechanic:
      "Ordena las letras para reconstruir conceptos del álgebra. No se trata de calcular, sino de reconocer el vocabulario correcto antes de que la confusión avance.",
    tip:
      "Fíjate en palabras base como variable, constante, coeficiente o expresión. Si reconoces el concepto, después será más fácil interpretar ejercicios algebraicos.",
  },
  {
    id: "bodeguero",
    label: "Bodeguero",
    page: 1,
    helpSheetKey: "sheet_algebra_2",
    mechanic:
      "Observa la balanza y realiza acciones que mantengan el equilibrio. Si quitas o agregas algo en un lado, debes hacer lo mismo en el otro.",
    tip:
      "La idea central es la igualdad. Una ecuación sigue siendo verdadera solo si ambos lados se transforman de manera equivalente.",
  },
  {
    id: "brahmagupta",
    label: "Brahmagupta",
    page: 1,
    helpSheetKey: "sheet_algebra_3",
    mechanic:
      "Lee el enigma con calma, identifica la cantidad desconocida y elige el número que satisface las relaciones descritas.",
    tip:
      "No adivines. Primero traduce lo que cambia, lo que permanece y cómo se relacionan las cantidades; después busca el número oculto.",
  },
  {
    id: "mateo",
    label: "Mateo",
    page: 1,
    helpSheetKey: "sheet_algebra_4",
    mechanic:
      "Clasifica y junta términos semejantes. Solo pueden combinarse los que tienen la misma parte literal o ambos son constantes.",
    tip:
      "Mira la letra y su exponente antes del número. Primero decide si los términos son semejantes; después suma o resta coeficientes.",
  },
  {
    id: "silvano",
    label: "Silvano el Guía",
    page: 1,
    helpSheetKey: "sheet_algebra_5",
    mechanic:
      "Debes interpretar correctamente instrucciones y expresiones para tomar el camino adecuado. Leer rápido suele llevar al error.",
    tip:
      "Palabras como doble, mitad, suma o diferencia cambian por completo el significado. Traduce cada frase con precisión antes de decidir.",
  },
  {
    id: "ariadna",
    label: "Ariadna",
    page: 1,
    helpSheetKey: "sheet_algebra_6",
    mechanic:
      "Sustituye el valor de la variable y resuelve respetando signos, paréntesis y jerarquía de operaciones para avanzar por el laberinto.",
    tip:
      "Haz una cosa a la vez: sustituir bien, conservar signos y luego operar en orden. La prisa suele romper el procedimiento.",
  },
  {
    id: "howdin",
    label: "Howdin",
    page: 2,
    helpSheetKey: "sheet_algebra_7",
    mechanic:
      "Abre puertas haciendo el movimiento correcto para aislar la incógnita. Cada acción debe acercarte a dejarla sola.",
    tip:
      "Piensa en capas: quita primero lo que estorba más por fuera y avanza paso a paso sin romper la igualdad.",
  },
  {
    id: "aljuarismi",
    label: "Al-Juarismi",
    page: 2,
    helpSheetKey: "sheet_algebra_8",
    mechanic:
      "Distribuye, simplifica, mueve términos y resuelve sin perder el equilibrio. Si dudas demasiado, la presión de la pesadilla aumenta.",
    tip:
      "No intentes hacerlo todo de golpe. Busca siempre el siguiente paso válido: distribuir, combinar, mover o despejar.",
  },
  {
    id: "clara",
    label: "Clara",
    page: 2,
    helpSheetKey: "sheet_algebra_9",
    mechanic:
      "Primero eliges la ecuación que modela la situación y después resuelves su resultado. Si fallas, repites la misma situación.",
    tip:
      "Antes de calcular, decide qué representa la variable, qué cantidades cambian y cuál es la relación entre ellas.",
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
          text: "Hola. Aquí puedo ayudarte a entender qué se trabaja en Álgebra o darte ayuda puntual para cualquier reto.",
          stage: { focus: "Sofia" },
          choices: [
            {
              text: "Explícame el área de Álgebra",
              next: "sofia_algebra",
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
    sofia_algebra: {
      title: "Área de Álgebra",
      background: "bg_sofia",
      music: "bgm_quiet",
      characters: MN_SOFIA_ALGEBRA_CHARACTERS,
      dialogs: [
        {
          speaker: "Sofia",
          text: "En Álgebra empiezas a usar letras para representar cantidades desconocidas o cambiantes.",
          stage: { focus: "Sofia" },
        },
        {
          speaker: "Sofia",
          text: "Aquí practicas conceptos, equilibrio, traducción de frases, sustitución, términos semejantes, despejes, resolución de ecuaciones y modelado.",
        },
        {
          speaker: "Sofia",
          text: "La idea no es memorizar trucos sueltos, sino entender relaciones entre cantidades y expresarlas con claridad.",
        },
        {
          speaker: "Sofia",
          text: "Si te atoras en un reto, usa mi ayuda por minijuego. Te diré qué hacer, qué habilidad se trabaja y qué hoja consultar.",
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
      characters: MN_SOFIA_ALGEBRA_CHARACTERS,
      dialogs: [
        {
          speaker: "Sofia",
          text: "Dime con cuál reto de Álgebra necesitas apoyo.",
          stage: { focus: "Sofia" },
          choices: [],
        },
      ],
    },
    sofia_help_menu_2: {
      title: "Ayuda de Sofía",
      background: "bg_sofia",
      music: "bgm_quiet",
      characters: MN_SOFIA_ALGEBRA_CHARACTERS,
      dialogs: [
        {
          speaker: "Sofia",
          text: "Aquí están los retos restantes. Elige uno y te ayudo.",
          stage: { focus: "Sofia" },
          choices: [],
        },
      ],
    },
    exit: {
      title: "Salida de Sofía",
      music: "bgm_algebra",
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
            { text: "Adiós.", action: { type: "CLOSE_NOVELA" } },
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
            { text: "Adiós.", action: { type: "CLOSE_NOVELA" } },
          ],
        },
      ],
    };

    const menuChoice = { text: topic.label, next: sceneKey };
    if (topic.page === 1) page1Choices.push(menuChoice);
    else page2Choices.push(menuChoice);
  });

  page1Choices.push({ text: "Ver mas minijuegos", next: "sofia_help_menu_2" });
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
          scale: 1,
          flipX: false,
          name: "Nico",
        },
        {
          image: "ch_felipon",
          x: 730,
          y: 620,
          scale: 0.9,
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
          text: "Término... producto... constante... coeficiente... expresión...",
        },
        {
          speaker: "Felipón",
          text: "Las repito y las repito, pero a veces siento que solo estoy diciendo sonidos raros.",
        },
        {
          speaker: "Felipón",
          text: "Las escucho en clase, pero cuando veo un ejercicio ya no sé qué significan.",
        },
        {
          speaker: "Felipón",
          text: "Veo la x y pienso en multiplicar... pero luego me dicen que ya no significa eso.",
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
          text: "o peor... a veces veo dos signos menos y resulta que el resultado termina siendo una suma.",
        },
        {
          speaker: "Nico",
          text: "Tal vez todavía estás viendo esos símbolos como en la primaria.",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Nico",
          text: "Pero en álgebra esos símbolos no siempre te dicen 'haz esto ahora'. A veces forman parte de lo que estás describiendo.",
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
          text: "Si recuperamos esas palabras, tal vez la biblioteca vuelva a tener sentido.",
        },
        {
          speaker: "Felipón",
          text: "Y también nosotros...",
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
          scale: 0.9,
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
          text: "Mi trabajo es preparar las cargas para que todo quede bien acomodado.",
        },
        {
          speaker: "Bodeguero",
          text: "Si una carroza queda más pesada de un lado que del otro...",
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
          text: "Pero aquí hay un problema...",
        },
        {
          speaker: "Bodeguero",
          text: "Algunas cajas y costales llegan sin etiqueta.",
        },
        {
          speaker: "Bodeguero",
          text: "No sabemos exactamente cuánto pesa cada cosa.",
        },
        {
          speaker: "Nico",
          text: "Entonces... ¿cómo descubres su peso?",
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
          text: "Con paciencia, podemos descubrir el peso de cualquier costal.",
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
          scale: 0.8,
          flipX: false,
          name: "Brahmagupta",
        },
      ],
      dialogs: [
        {
          speaker: "Brahmagupta",
          text: "Saludos. Soy Brahmagupta, estudioso de los astros, de los números y de las relaciones que no siempre se muestran a simple vista.",
          stage: { focus: "Brahmagupta" },
        },
        {
          speaker: "Brahmagupta",
          text: "Muchos creen que un enigma numérico se resuelve adivinando.",
        },
        {
          speaker: "Brahmagupta",
          text: "Yo no.",
        },
        {
          speaker: "Brahmagupta",
          text: "Cuando una cantidad se esconde, no desaparece. Solo deja de mostrarse con claridad.",
        },
        {
          speaker: "Brahmagupta",
          text: "Por eso, lo primero es nombrarla.",
        },
        {
          speaker: "Brahmagupta",
          text: "Después hay que escuchar con atención lo que el problema dice: qué se suma, qué se quita, qué se multiplica, qué permanece igual.",
        },
        {
          speaker: "Brahmagupta",
          text: "Si entiendes la relación entre las cantidades, el número deja de ocultarse.",
        },
        {
          speaker: "Nico",
          text: "Entonces no basta con calcular... primero hay que entender lo que el enigma realmente está diciendo.",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Brahmagupta",
          text: "Así es.",
          stage: { focus: "Brahmagupta" },
        },
        {
          speaker: "Brahmagupta",
          text: "A veces el número permanece oculto, pero la relación entre las cantidades está a la vista.",
        },
        {
          speaker: "Brahmagupta",
          text: "Si logras expresarla con claridad, podrás encontrarlo.",
        },
        {
          speaker: "Brahmagupta",
          text: "Te presentaré tres enigmas.",
        },
        {
          speaker: "Brahmagupta",
          text: "Escucha con cuidado sus palabras... y descubre el número que esconden.",
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
      background: "bg_jardin",
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
          scale: 0.7,
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
          text: "Estoy preparando una misión espacial muy importante.",
        },
        {
          speaker: "Nico",
          text: "¿De verdad vas a ir al espacio?",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Mateo",
          text: "Bueno... todavía no.",
          stage: { focus: "Mateo" },
        },
        {
          speaker: "Mateo",
          text: "Pero ya tengo el traje, el casco y la misión.",
        },
        {
          speaker: "Mateo",
          text: "El problema es que todo se revolvió.",
        },
        {
          speaker: "Mateo",
          text: "Las piezas, las muestras y los paquetes quedaron mezclados como si la nave hubiera pasado por una tormenta.",
        },
        {
          speaker: "Nico",
          text: "Entonces solo hay que volver a juntarlos, ¿no?",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Mateo",
          text: "Sí... pero no de cualquier manera.",
          stage: { focus: "Mateo" },
        },
        {
          speaker: "Mateo",
          text: "Algunas cosas se parecen, pero no pertenecen al mismo grupo.",
        },
        {
          speaker: "Mateo",
          text: "Si mezclas piezas distintas solo porque tienen algo en común, al final todo sale mal.",
        },
        {
          speaker: "Mateo",
          text: "Para ordenarlo bien, hay que fijarse en qué tipo de objeto es exactamente cada uno.",
        },
        {
          speaker: "Nico",
          text: "Como si no bastara con mirar rápido... hay que ver si realmente son del mismo tipo.",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Mateo",
          text: "¡Exacto!",
          stage: { focus: "Mateo" },
        },
        {
          speaker: "Mateo",
          text: "En esta misión solo pueden juntarse los que son verdaderamente semejantes.",
        },
        {
          speaker: "Mateo",
          text: "Los que tienen la misma parte literal van en el mismo compartimento.",
        },
        {
          speaker: "Mateo",
          text: "Los que no, se quedan separados.",
        },
        {
          speaker: "Mateo",
          text: "¿Me ayudas a clasificar todo antes de que la nave despegue?",
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
          scale: 0.9,
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
          scale: 0.8,
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
          scale: 0.9,
          flipX: false,
          name: "Howdin",
        },
      ],
      dialogs: [
        {
          speaker: "Howdin",
          text: "Muchos creen que una puerta cerrada se vence con fuerza.",
          stage: { focus: "Howdin" },
        },
        {
          speaker: "Howdin",
          text: "Por eso golpean, empujan o prueban cualquier cosa... y fracasan.",
        },
        {
          speaker: "Nico",
          text: "Entonces, ¿cómo se abre una cerradura como esta?",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Howdin",
          text: "Entendiendo su mecanismo.",
          stage: { focus: "Howdin" },
        },
        {
          speaker: "Howdin",
          text: "Cada pieza que estorba debe retirarse en el momento correcto.",
        },
        {
          speaker: "Howdin",
          text: "Si mueves algo que no debes, la cerradura sigue bloqueada.",
        },
        {
          speaker: "Howdin",
          text: "Las ecuaciones se parecen más a una cerradura de lo que imaginas.",
        },
        {
          speaker: "Howdin",
          text: "La incógnita está ahí, pero queda atrapada detrás de números, operaciones y símbolos.",
        },
        {
          speaker: "Nico",
          text: "Entonces no se trata de hacer cualquier operación...",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Howdin",
          text: "Exactamente.",
          stage: { focus: "Howdin" },
        },
        {
          speaker: "Howdin",
          text: "Debes elegir el movimiento que realmente la libere.",
        },
        {
          speaker: "Howdin",
          text: "Un paso correcto abre el mecanismo.",
        },
        {
          speaker: "Howdin",
          text: "Un paso inútil solo te hace perder tiempo.",
        },
        {
          speaker: "Howdin",
          text: "En este pasillo encontrarás varias puertas cerradas.",
        },
        {
          speaker: "Howdin",
          text: "Si entiendes qué estorba primero y qué debe quitarse después, podrás abrirlas una a una.",
        },
        {
          speaker: "Howdin",
          text: "No necesitas fuerza.",
        },
        {
          speaker: "Howdin",
          text: "Necesitas orden... y saber cómo dejar sola a la incógnita.",
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
      background: "bg_palacio",
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
          scale: 0.9,
          flipX: false,
          name: "Al-Juarismi",
        },
      ],
      dialogs: [
        {
          speaker: "Al-Juarismi",
          text: "Te doy la bienvenida. Soy Al-Juarismi, custodio de esta area. Veo que todavia no has reunido las 6 hojas necesarias para abrir el paso a Geometria.",
          stage: { focus: "Al-Juarismi" },
        },
        {
          speaker: "Al-Juarismi",
          text: "Vuelve cuando las tengas y yo mismo abrire el camino. Mientras tanto, demuestrame que tu procedimiento y tus habilidades siguen en orden.",
          stage: { focus: "Al-Juarismi" },
          next: "exit",
        },
      ],
    },
    aljuarismi_reto: {
      title: "Al-Juarismi",
      background: "bg_palacio",
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
          scale: 0.9,
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
      background: "bg_palacio",
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
          scale: 0.9,
          flipX: false,
          name: "Al-Juarismi",
        },
      ],
      dialogs: [
        {
          speaker: "Al-Juarismi",
          text: "Veo que ya reuniste al menos seis hojas del Libro del Álgebra. Con eso basta para encuadernarlo y abrir el camino a la Geometría.",
          stage: { focus: "Al-Juarismi" },
        },
        {
          speaker: "Al-Juarismi",
          text: "Si aún quedan desafios pendientes, puedes seguir enfrentándolos. No por necesidad, sino para afinar tu mirada matemática.",
          stage: { focus: "Al-Juarismi" },
        },
        {
          speaker: "Nico",
          text: "Entonces el camino ya puede abrirse, pero aún puedo volver para terminar el libro completo.",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Al-Juarismi",
          text: "Exactamente. Habla con Sofía cuando estes listo para dar el siguiente paso.",
          stage: { focus: "Al-Juarismi" },
          next: "exit",
        },
      ],
    },
    aljuarismi_perfecto: {
      title: "Al-Juarismi",
      background: "bg_palacio",
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
          scale: 0.9,
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
          text: "Habla con Sofía cuando quieras partir. Y si deseas practicar de nuevo, aqui seguire.",
          stage: { focus: "Al-Juarismi" },
          next: "exit",
        },
      ],
    },
    exit: {
      title: "Exit de Al-Juarismi",
      music: "bgm_algebra",
      dialogs: [],
    },
  },
};

window.ALJUARISMI_CIERRE_STORY = {
  start: "cierre",
  order: ["cierre", "exit"],
  scenes: {
    cierre: {
      introVideo: "vid_cierre",
      title: "Cierre de Álgebra",
      background: "bg_palacio",
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
          scale: 0.9,
          flipX: false,
          name: "Al-Juarismi",
        },
      ],
      dialogs: [
        {
          speaker: "Al-Juarismi",
          text: "Bien. Con estas hojas, el Libro del Álgebra ya puede cerrarse.",
        },
        {
          speaker: "Al-Juarismi",
          text: "Habla con Sofía. Ella te guiará hacia el Área de Geometría cuando decidas continuar.",
          next: "exit",
        },
      ],
    },
    exit: {
      title: "Exit",
      music: "bgm_algebra",
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
          scale: 1,
          flipX: false,
          name: "Sofia",
        },
      ],
      dialogs: [
        {
          speaker: "Sofia",
          text: "Lo lograste. Al-Juarismi ya encuadernó el Libro del Álgebra.",
          stage: { focus: "Sofia" },
        },
        {
          speaker: "Sofia",
          text: "¿Estás listo para partir al Área de Geometría?",
          stage: { focus: "Sofia" },
          choices: [
            {
              text: "Sí. Llévame a Geometría.",
              action: { type: "NAVIGATE", href: "geometria.html" },
            },
            {
              text: "No todavía. Quiero terminar cosas aquí.",
              next: "exit",
            },
          ],
        },
      ],
    },
    exit: {
      title: "Exit",
      music: "bgm_algebra",
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
