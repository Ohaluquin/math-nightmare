// historia_aritmetica.js - Historia principal de Math Nightmare
// Nombre fijo del protagonista
window.MN_PLAYER_NAME = "Nico";

const MN_ARITMETICA_STORY_SCALE_MULTIPLIERS = {
  ch_nico: 1.45,
  ch_sofia: 1.45,
  default: 1.55,
};

function MN_scaleAritmeticaStoryCharacters(characters) {
  if (!Array.isArray(characters) || characters.__mnStoryScaled) return;

  characters.forEach((character) => {
    if (!character || typeof character.scale !== "number") return;
    const multiplier =
      MN_ARITMETICA_STORY_SCALE_MULTIPLIERS[character.image] ??
      MN_ARITMETICA_STORY_SCALE_MULTIPLIERS.default;

    character.scale = Number((character.scale * multiplier).toFixed(3));
  });

  Object.defineProperty(characters, "__mnStoryScaled", {
    value: true,
    enumerable: false,
    configurable: false,
    writable: false,
  });
}

function MN_scaleAritmeticaStory(story) {
  if (!story || !story.scenes) return;
  Object.values(story.scenes).forEach((scene) => {
    MN_scaleAritmeticaStoryCharacters(scene?.characters);
  });
}

// ================== 1) Historia de INTRO ==================
window.MN_STORY = {
  start: "intro",
  order: ["intro", "exit"], // Intro con una escena
  scenes: {
    intro: {
      title: "Intro",
      background: "mn_bg_intro",
      music: "bgm_overworld",
      introVideo: "vid_intro",
      dialogs: [
        {
          speaker: "Nico",
          text: "¿Dónde estoy...?",
        },
        {
          speaker: "Nico",
          text: "Hace un momento estaba en mi cuarto, estudiando para el examen de matemáticas.",
        },
        {
          speaker: "Voz extraña",
          text: "Has cruzado al Reino de los Números.",
        },
        {
          speaker: "Voz extraña",
          text: "Aquí viven tus ideas sobre las matemáticas... y también tus miedos.",
        },
        {
          speaker: "Voz extraña",
          text: "Para despertar deberás llevar al castillo los 3 Libros del Conocimiento dispersos en el Reino.",
        },
        {
          speaker: "Voz extraña",
          text: "Aritmética, Álgebra y Geometría.",
        },
        {
          speaker: "Voz extraña",
          text: "Cada libro está roto en hojas: pequeños fragmentos de comprensión que guardan los habitantes de este lugar.",
        },
        {
          speaker: "Voz extraña",
          text: "Algunos aceptarán ayudarte... si demuestras que comprendes su naturaleza.",
        },
        {
          speaker: "Voz extraña",
          text: "Cuando superes sus desafíos, te darán hojas del libro. A veces una, si apenas lo logras; a veces dos, si dominas el reto.",
        },
        {
          speaker: "Voz extraña",
          text: "No necesitarás todas las hojas, pero sí las suficientes para demostrar tu valia.",
        },
        {
          speaker: "Voz extraña",
          text: "Cuando tengas suficientes hojas de un área, su guardián encuadernará el libro y abrirá un nuevo camino hacia el castillo.",
        },
        {
          speaker: "Voz extraña",
          text: "Hasta entonces, las puertas del castillo permanecerán cerradas para ti.",
        },
        {
          speaker: "Voz extraña",
          text: "Deberás iniciar por el principio...",
        },
        {
          speaker: "Voz extraña",
          text: "Cuando despiertes en el Reino de los Números podrás moverte con las teclas del teclado. Acércate a cualquier personaje y pulsa E para hablar con él.",
        },
      ],
    },
    exit: {
      title: "Exit de Intro",
      music: "bgm_overworld",
      dialogs: [],
    },
  },
};

// ================== 2) Historia de SOFÍA (guía del Reino) ==================
// ================== Sofía - Guía del Reino de los Números ==================
const MN_SOFIA_HELP_CHARACTERS = [
  {
    image: "ch_nico",
    x: 300,
    y: 540,
    scale: 0.45,
    flipX: false,
    name: "Nico",
  },
  {
    image: "ch_sofia",
    x: 600,
    y: 530,
    scale: 0.5,
    flipX: false,
    name: "Sofía",
  },
];

const MN_SOFIA_HELP_TOPICS = [
  {
    id: "escriba",
    label: "Escriba",
    page: 1,
    helpSheetKey: "sheet_contar",
    mechanic:
      "Lee bien las instrucciones. Debes contar las gallinas de cada corral, arrastrar la tarjeta correcta y soltarla dentro. Son 8 rondas de 5 corrales. Si acumulas 3 errores en una ronda, pierdes.",
    tip: "Aquí practicas conteo y representación de números. Para ganar tiempo, cuenta por grupos de 2, de 3 o de 5, y usa multiplicaciones cuando veas arreglos repetidos. Recuerda que una muesca cruzada vale 5. Más adelante aparecerán números egipcios, romanos y mayas, así que primero revisa qué significa cada símbolo.",
    sheets: [{ key: "sheet_contar", label: "Contar" }],
  },
  {
    id: "mercader",
    label: "Mercader",
    page: 1,
    helpSheetKey: "sheet_operaciones",
    mechanic:
      "El cliente coloca sobre la mesa los productos que va a comprar. Debes sumar sus precios, escribir cuánto debe pagar y confirmar con Enter. No te apresures solo porque el cliente se enoje: conviene calcular bien antes de responder.",
    tip: "Aquí practicas cálculo mental con sumas y multiplicaciones pequeñas. Suele ayudar sumar primero los números grandes y luego los pequeños, o completar dieces y cincos para hacer la cuenta más fácil.",
    sheets: [
      {
        key: "sheet_operaciones",
        label: "Las operaciones para entender el mundo",
      },
    ],
  },
  {
    id: "don_marino",
    label: "Don Marino",
    page: 1,
    helpSheetKey: "sheet_suma",
    mechanic:
      "En este reto debes resolver sumas y escribir el resultado. Para subir de nivel necesitas lograr 5 aciertos consecutivos. Cada nivel cambia un poco el tipo de suma, así que, si te atoras, fíjate bien en qué clase de cuentas te están apareciendo.",
    tip: "Aquí practicas distintos tipos de suma. El propio Don Marino te va dando consejos útiles en cada nivel, así que conviene poner atención justo en el nivel donde empiezas a equivocarte y tratar de aplicar ese tip en las siguientes cuentas.",
    sheets: [{ key: "sheet_suma", label: "Suma" }],
  },
  {
    id: "guardian",
    label: "Guardián del Sendero",
    page: 1,
    helpSheetKey: "sheet_resta",
    mechanic:
      "Fíjate en el número donde estás y en el número donde se encuentra la luciérnaga. Debes calcular cuánto falta para llegar, escribir ese número y confirmar con Enter.",
    tip: "Aquí practicas la resta como diferencia o distancia entre dos números. Puedes apoyarte en la recta numérica: avanza primero de 10 en 10 y, cuando ya estés cerca, cuenta los pasos que faltan.",
    sheets: [{ key: "sheet_resta", label: "Resta" }],
  },
  {
    id: "bruno",
    label: "Bruno",
    page: 1,
    helpSheetKey: "sheet_cero",
    mechanic:
      "Debes hacer clic para agregar monstruitos al elevador. Si el elevador no sube, te pasaste y necesitas quitar algunos. Si se cae, te faltaron. Observa bien lo que ocurre y ajusta hasta que quede equilibrado.",
    tip: "Aquí conviene estimar antes de probar. Puedes apoyarte en multiplicaciones o en sumas repetidas para calcular cuántos monstruitos caben y acercarte más rápido a la cantidad correcta.",
    sheets: [{ key: "sheet_cero", label: "El Cero" }],
  },
  {
    id: "armonia",
    label: "Armonía",
    page: 1,
    helpSheetKey: "sheet_division",
    mechanic:
      "Aparece una división con un solo número incorrecto y debes hacer clic justo sobre ese número. Cada acierto te da otra división y sigues jugando mientras dure la canción. La velocidad ayuda porque da puntos y combos, y necesitas 2000 puntos para ganar la hoja.",
    tip: "Este reto trabaja el algoritmo de la división. No trates de adivinar: revisa mentalmente cada paso de la cuenta hasta encontrar dónde ya no coincide.",
    sheets: [{ key: "sheet_division", label: "Algoritmo de la división" }],
  },
  {
    id: "galileo",
    label: "Galileo",
    page: 2,
    helpSheetKey: "sheet_multiplicacion",
    mechanic:
      "Verás multiplicaciones cayendo como meteoritos. Debes escribir la respuesta rápido y pulsar Enter antes de que impacten. El juego empieza con la tabla del 2 y luego va aumentando; de cada tabla aparecen 5 operaciones al azar. Si logras 10 aciertos consecutivos, ganas una vida.",
    tip: "Este reto trabaja tablas de multiplicar con rapidez. Más que apresurarte sin control, conviene intentar superar tu propia marca, revisar en cuáles te equivocaste y practicar con frecuencia. Hacer varios intentos cortos suele ayudar más que forzarte demasiado en una sola sesión.",
    sheets: [{ key: "sheet_multiplicacion", label: "Multiplicación" }],
  },
  {
    id: "chaman",
    label: "Chamán",
    page: 2,
    helpSheetKey: "sheet_al_juarizmi",
    mechanic:
      "Debes hacer clic exactamente sobre el símbolo de la operación que toca resolver primero. El juego calcula esa operación automáticamente. Si estás trabajando dentro de un paréntesis, debes seguir eligiendo las operaciones de ese mismo paréntesis hasta que ya no queden más dentro de él.",
    tip: "Aquí practicas jerarquía de operaciones. Primero van los paréntesis; dentro de ellos, sigue el orden correcto hasta terminarlos. Después revisa multiplicaciones y divisiones, y al final sumas y restas.",
    sheets: [{ key: "sheet_al_juarizmi", label: "Al-juarizmi" }],
  },
  {
    id: "general",
    label: "General de los Signos",
    page: 2,
    helpSheetKey: "sheet_negativos",
    mechanic:
      "Lee la operación con enteros y elige la respuesta correcta. Antes de contestar, fíjate bien si se trata de una suma o de una multiplicación, porque cada una usa reglas distintas. Si fallas, el juego muestra una animación para ayudarte a entender la ley que corresponde.",
    tip: "Aquí practicas las leyes de los signos. Lo primero es distinguir si vas a aplicar la ley de la suma o la de la multiplicación. Aunque las animaciones ayudan, al final conviene aprender bien esas leyes para reconocerlas y usarlas con seguridad.",
    sheets: [{ key: "sheet_negativos", label: "Los negativos" }],
  },
  {
    id: "eratostenes",
    label: "Eratóstenes",
    page: 2,
    helpSheetKey: "sheet_primos",
    mechanic:
      "En este reto te mueves con las flechas y disparas con la barra espaciadora. Antes de disparar, debes elegir el tipo de divisor con el que quieres atacar: 2, 3, 5, 7, o 1 si el número es primo de más de dos dígitos. No conviene disparar de más: si atacas con un número que no es divisor, en lugar de reducir al enemigo lo multiplicas y el número crece.",
    tip: "Aquí practicas divisores, criterios de divisibilidad y números primos. Antes de disparar, revisa si el número realmente cumple con el criterio del divisor que elegiste: par para 2, suma de cifras para 3, última cifra para 5, y en otros casos conviene probar con cuidado antes de actuar.",
    sheets: [{ key: "sheet_primos", label: "Números primos" }],
  },
  {
    id: "leonardo",
    label: "Leonardo de Pisa",
    page: 2,
    helpSheetKey: "sheet_leonardo",
    mechanic:
      "Lee el problema, piensa qué operación o qué pasos representan la situación y escribe solo la respuesta numérica. La dificultad va aumentando, así que conviene leer con calma antes de contestar.",
    tip: "Este reto trabaja razonamiento aritmético. No conviene tomar los números del enunciado y probar una operación al azar: primero identifica qué te piden y cómo se relacionan los datos. Si lo necesitas, puedes apoyarte en hoja y lápiz para hacer cuentas o dibujos sencillos.",
    sheets: [{ key: "sheet_leonardo", label: "Leonardo de Pisa" }],
  },
];

function MN_buildSofiaSupportStory() {
  const scenes = {
    sofia_menu: {
      title: "Sofía",
      background: "bg_sofia",
      music: "bgm_quiet",
      characters: MN_SOFIA_HELP_CHARACTERS,
      dialogs: [
        {
          speaker: "Sofía",
          text: "Hola. Puedo explicarte el Reino o ayudarte con un reto concreto de Aritmética.",
          stage: { focus: "Sofía" },
          choices: [
            { text: "¿Qué es el Reino de los Números?", next: "sofia_reino" },
            {
              text: "Explícame los desafíos de Aritmética.",
              next: "sofia_aritmetica",
            },
            {
              text: "Necesito ayuda con un minijuego.",
              next: "sofia_help_menu_1",
            },
            { text: "Adiós.", action: { type: "CLOSE_NOVELA" } },
          ],
        },
      ],
    },
    sofia_reino: {
      title: "Reino de los Números",
      background: "bg_sofia",
      music: "bgm_quiet",
      characters: MN_SOFIA_HELP_CHARACTERS,

      dialogs: [
        {
          speaker: "Sofía",
          text: "Este es el Reino de los Números. Nació de las ideas humanas sobre las matemáticas, pero con el tiempo se volvió un lugar propio, con reglas, caminos… y pesadillas.",
          stage: { focus: "Sofía" },
        },
        {
          speaker: "Sofía",
          text: "Hay 3 pilares en el Reino: Aritmética, Álgebra y Geometría.",
        },
        {
          speaker: "Sofía",
          text: "Cada área tiene un libro formado por varias hojas. Cada hoja guarda una pequeña comprensión: saber por qué se cuenta así, por qué se suman así, o por qué un signo puede cambiarlo todo.",
        },
        {
          speaker: "Sofía",
          text: "Los habitantes del Reino guardan esas hojas. Si superas sus desafíos, te entregarán una. Algunos, si lo haces especialmente bien, te darán dos.",
        },
        {
          speaker: "Nico",
          text: "¿Y tengo que reunir todas las hojas para despertar?",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Sofía",
          text: "No todas. Solo las suficientes para que el guardián de cada área vea que entiendes lo esencial.",
          stage: { focus: "Sofía" },
        },
        {
          speaker: "Sofía",
          text: "Aquí estás en el área de Aritmética. Su guardián es Fibonacci y lo encontrarás al final del mercado.",
        },
        {
          speaker: "Sofía",
          text: "Cuando tengas suficientes hojas de Aritmética, Fibonacci encuadernará el primer libro y te mostrará el camino hacia la región del Álgebra.",
        },
        {
          speaker: "Nico",
          text: "Suena enorme… En el examen apenas intento sobrevivir a los problemas.",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Sofía",
          text: "Por eso es un sueño… o una pesadilla. Pero aquí también tienes una ventaja: puedes fallar, aprender y volver a intentarlo.",
          stage: { focus: "Sofía" },
          choices: [{ text: "Volver con Sofía", next: "sofia_menu" }],
        },
      ],
    },
    sofia_aritmetica: {
      title: "Desafíos de Aritmética",
      background: "bg_sofia",
      music: "bgm_quiet",
      characters: MN_SOFIA_HELP_CHARACTERS,
      dialogs: [
        {
          speaker: "Sofía",
          text: "En Aritmética practicas contar, sumar, restar, multiplicar, dividir, jerarquía de operaciones, signos y razonamiento.",
          stage: { focus: "Sofía" },
        },
        {
          speaker: "Sofía",
          text: "Cada minijuego entrena una pieza distinta. Algunos piden rapidez, otros lectura cuidadosa y otros detectar patrones.",
        },
        {
          speaker: "Sofía",
          text: "Si te atoras en uno, usa mi ayuda por minijuego. Te diré qué hacer en pantalla, qué habilidad trabaja y qué hoja puedes consultar.",
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
      characters: MN_SOFIA_HELP_CHARACTERS,
      dialogs: [
        {
          speaker: "Sofía",
          text: "Dime con cuál minijuego necesitas apoyo.",
          stage: { focus: "Sofía" },
          choices: [],
        },
      ],
    },
    sofia_help_menu_2: {
      title: "Ayuda de Sofía",
      background: "bg_sofia",
      music: "bgm_quiet",
      characters: MN_SOFIA_HELP_CHARACTERS,
      dialogs: [
        {
          speaker: "Sofía",
          text: "Aquí están los retos restantes. Elige uno y te doy ayuda puntual.",
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

  MN_SOFIA_HELP_TOPICS.forEach((topic) => {
    const sceneKey = `sofia_help_${topic.id}`;
    const mechanicKey = `${sceneKey}_mechanic`;
    const tipKey = `${sceneKey}_tip`;
    const chooseMenu =
      topic.page === 1 ? "sofia_help_menu_1" : "sofia_help_menu_2";

    const relatedSheetChoice = {
      text: "Ver hoja relacionada",
      action: {
        type: "OPEN_SHEET",
        sheetKey: topic.helpSheetKey || topic.sheets[0].key,
        mode: "consult",
      },
      next: sceneKey,
    };

    scenes[sceneKey] = {
      title: topic.label,
      background: "bg_sofia",
      music: "bgm_quiet",
      characters: MN_SOFIA_HELP_CHARACTERS,
      dialogs: [
        {
          speaker: "Sofía",
          text: "¿Qué ayuda necesitas en este reto?",
          choices: [
            { text: "Mecánica del juego", next: mechanicKey },
            { text: "Consejo matemático", next: tipKey },
            relatedSheetChoice,
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
      characters: MN_SOFIA_HELP_CHARACTERS,
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
      characters: MN_SOFIA_HELP_CHARACTERS,
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

window.SOFIA_STORY = MN_buildSofiaSupportStory();

// ================== 2.B) SOFÍA – PUERTA AL ÁLGEBRA ==================
window.SOFIA_ALGEBRA_GATE_STORY = {
  start: "sofia_gate",
  order: ["sofia_gate", "exit"],
  scenes: {
    sofia_gate: {
      title: "Sofía",
      background: "bg_sofia",
      music: "bgm_quiet",
      characters: [
        {
          image: "ch_nico",
          x: 300,
          y: 540,
          scale: 0.45,
          flipX: false,
          name: "Nico",
        },
        {
          image: "ch_sofia",
          x: 600,
          y: 530,
          scale: 0.5,
          flipX: false,
          name: "Sofía",
        },
      ],
      dialogs: [
        {
          speaker: "Sofía",
          text: "Lo lograste… Leonardo ya encuadernó el Libro de Aritmética.",
          stage: { focus: "Sofía" },
        },
        {
          speaker: "Sofía",
          text: "¿Estás listo para partir al Área del Álgebra?",
          stage: { focus: "Sofía" },
          choices: [
            {
              text: "Sí. Llévame al Álgebra.",
              action: { type: "NAVIGATE", href: "proximamente.html" },
            },
            {
              text: "No todavía. Quiero terminar cosas aquí.",
              next: "exit",
            },
          ],
        },
      ],
    },

    // salida normal
    exit: { title: "Exit", music: "bgm_overworld", dialogs: [] },
  },
};

// ================== 3) NPCs BOSQUEJO – MUNDO 1: ARITMÉTICA ==================
// --- 3.1 Escriba de las Muescas (sistemas antiguos de numeración) ---
window.ESCRIBA_MUESCAS_STORY = {
  start: "escriba_intro",
  order: ["escriba_intro"],
  scenes: {
    escriba_intro: {
      title: "El Escriba de las Muescas",
      background: "bg_escriba",
      music: "bgm_overworld",
      characters: [
        {
          image: "ch_nico",
          x: 300,
          y: 540,
          scale: 0.4,
          flipX: false,
          name: "Nico",
        },
        {
          image: "ch_escriba",
          x: 600,
          y: 500,
          scale: 0.45,
          flipX: false,
          name: "Escriba",
        },
      ],
      dialogs: [
        {
          speaker: "Escriba",
          text: "Detente un momento, viajero. Antes de tus exámenes y pizarrones, el miedo a olvidar ya existía.",
          stage: { focus: "Escriba" },
        },
        {
          speaker: "Escriba",
          text: "Yo guardo las primeras marcas: muescas en huesos, líneas en piedra, montones de semillas para contar rebaños.",
        },
        {
          speaker: "Nico",
          text: "¿Así empezó el conteo?",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Escriba",
          text: "Así empezó todo: recordar cuántos días, cuántas presas, cuánta comida quedaba. No había '10' ni '20'; solo marcas.",
          stage: { focus: "Escriba" },
        },
        {
          speaker: "Escriba",
          text: "Te propondré un reto: descifrar qué cantidad representan estas muescas y cómo se relacionan con los números que usas hoy.",
        },
        {
          speaker: "Escriba",
          text: "Si lo resuelves, te daré una hoja del Libro de Aritmética.",
        },
      ],
    },
  },
};

// --- 3.2 Caja Rápida del Mercader (sumas, cálculo mental, agilidad) ---
window.CAJA_RAPIDA_STORY = {
  start: "caja_rapida_intro",
  order: ["caja_rapida_intro"],
  scenes: {
    caja_rapida_intro: {
      title: "La Caja Rápida del Mercader",
      background: "bg_caja_rapida",
      music: "bgm_overworld",
      characters: [
        {
          image: "ch_nico",
          x: 260,
          y: 560,
          scale: 0.35,
          flipX: false,
          name: "Nico",
        },
        {
          image: "ch_mercader",
          x: 560,
          y: 550,
          scale: 0.4,
          flipX: true,
          name: "Mercader",
        },
      ],
      dialogs: [
        {
          speaker: "Mercader",
          text: "¡Ah! Menos mal que llegas… Ya no sé a quién atender primero.",
          stage: { focus: "Mercader" },
        },
        {
          speaker: "Nico",
          text: "¿Hay algún problema?",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Mercader",
          text: "Siempre lo hay cuando uno vende cosas que no se consiguen en cualquier puesto.",
        },
        {
          speaker: "Mercader",
          text: "Estos objetos no son comunes. Algunos los buscan viajeros apurados; otros, gente que solo pasa un instante por el mercado.",
        },
        {
          speaker: "Mercader",
          text: "No tengo tiempo para largas charlas ni regateos. Aquí, quien sabe lo que quiere, se lleva lo que alcanza… y se va.",
        },
        {
          speaker: "Nico",
          text: "Parece que todos tienen prisa.",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Mercader",
          text: "La prisa es lo que vuelve peligrosas las cuentas sencillas.",
          stage: { focus: "Mercader" },
        },
        {
          speaker: "Mercader",
          text: "Cuando el mercado se llena, un error pequeño se multiplica: falta mercancía, sobran reclamos, y la reputación se pierde más rápido que las monedas.",
        },
        {
          speaker: "Mercader",
          text: "Yo me encargo de traer el inventario. Tú podrías ayudarme a mantener el orden… mientras aún quede algo en estas estanterías.",
        },
        {
          speaker: "Nico",
          text: "¿Hasta que se acaben los objetos?",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Mercader",
          text: "Exacto. Cuando el último artículo salga por esa mesa, sabré que puedes pensar con claridad incluso cuando todos te presionan.",
        },
        {
          speaker: "Mercader",
          text: "Si lo logras, compartiré contigo una hoja del Libro de Aritmética. No por rapidez… sino por saber mantener la cabeza fría.",
        },
        {
          speaker: "Mercader",
          text: "Ahora dime, viajero… ¿estás listo para atender al siguiente cliente?",
          stage: { focus: "Mercader" },
        },
      ],
    },
  },
};

// --- 3.3 Escalera de Sumas (Don Marino, el guardián cascarrabias) ---
window.ESCALERA_SUMAS_STORY = {
  start: "sumas_intro",
  order: ["sumas_intro"],
  scenes: {
    sumas_intro: {
      title: "El Guardián de la Escalera",
      background: "bg_sumas",
      music: "bgm_overworld",
      characters: [
        {
          image: "ch_nico",
          x: 220,
          y: 540,
          scale: 0.35,
          flipX: false,
          name: "Nico",
        },
        {
          image: "ch_escaleraSumas",
          x: 600,
          y: 420,
          scale: 0.3,
          flipX: false,
          name: "Don Marino",
        },
      ],
      dialogs: [
        {
          speaker: "Nico",
          text: "¿Usted es el guardián de esta escalera?",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Don Marino",
          text: "Guardián, campeón… y ahora espectador. Antes subía y bajaba esta escalera más rápido que nadie. Ahora las rodillas crujen más que la madera.",
          stage: { focus: "Don Marino" },
        },
        {
          speaker: "Don Marino",
          text: "Pero la escalera sigue aquí… y el agua también. Lo que ya no puedo hacer con las piernas, lo hago con la cabeza.",
        },
        {
          speaker: "Nico",
          text: "Si quiere, yo puedo jugar por usted.",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Don Marino",
          text: "¿Tú? Hmpf… al menos no pareces de los que se quedan contando con los dedos eternamente.",
          stage: { focus: "Don Marino" },
        },
        {
          speaker: "Don Marino",
          text: "Escucha: para subir esta escalera no basta saber que 4+3 son 7. Hay trucos: empezar desde el número mayor, completar decenas, usar el 5 y el 10 a tu favor.",
        },
        {
          speaker: "Don Marino",
          text: "Yo te iré susurrando esos trucos mientras subes. Tú pones las piernas; yo pongo la experiencia.",
        },
        {
          speaker: "Don Marino",
          text: "Si llegas alto, te ganarás hojas de cuaderno… y quizá me demuestres que todavía vale la pena enseñar a sumar sin miedo.",
        },
        {
          speaker: "Don Marino",
          text: "Anda, muchacho. Entra a la Escalera de Sumas antes de que el agua nos alcance hasta aquí.",
          stage: { focus: "Nico" },
        },
      ],
    },
  },
};

// --- 3.4 Qmar, Guardián del Sendero (restas como distancia en la recta numérica) ---
window.GUARDIAN_LUCIERNAGAS_STORY = {
  start: "guardian_luci_intro",
  order: ["guardian_luci_intro"],
  scenes: {
    guardian_luci_intro: {
      title: "El guardián del sendero",
      background: "bg_luciernagas",
      music: "bgm_overworld",
      characters: [
        {
          image: "ch_nico",
          x: 260,
          y: 560,
          scale: 0.35,
          flipX: false,
          name: "Nico",
        },
        {
          image: "ch_guardian",
          x: 660,
          y: 520,
          scale: 0.45,
          flipX: false,
          name: "Qmar",
        },
      ],
      dialogs: [
        {
          speaker: "Qmar",
          text: "Alto, viajero… Soy Qmar, Guardián del Sendero. Si entras sin luz, el bosque te traga.",
          stage: { focus: "Qmar" },
        },
        {
          speaker: "Qmar",
          text: "Este camino debería brillar con luciérnagas numéricas. Son pequeñas luces que marcan la recta del sendero… y evitan que la gente se pierda entre los árboles.",
        },
        {
          speaker: "Nico",
          text: "¿Perderse? ¿Tan grave es?",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Qmar",
          text: "Aquí la oscuridad confunde. Das diez pasos creyendo ir recto… y cuando volteas, ya no encuentras la salida. Ese es el miedo: caminar y caminar sin volver a ver el camino.",
        },
        {
          speaker: "Nico",
          text: "Entonces las luciérnagas son como… señales.",
        },
        {
          speaker: "Qmar",
          text: "Exacto. Cada luciérnaga guarda un número. Cuando se ordenan, el sendero se vuelve claro: sabes dónde estás y cuánto te falta para llegar.",
        },
        {
          speaker: "Qmar",
          text: "Pero esta noche escaparon. Se asustaron y ahora vuelan sin rumbo. Sin ellas, el sendero se apaga… y cualquiera puede desaparecer en el bosque.",
        },
        {
          speaker: "Qmar",
          text: "Tengo una pistola de burbujas mágicas: atrapa sin lastimar. Envuelve la luz y la guía de vuelta a su farol.",
        },
        {
          speaker: "Qmar",
          text: "El problema es que la burbuja solo se activa si le das la DISTANCIA exacta entre tu posición y la luciérnaga.",
        },
        {
          speaker: "Nico",
          text: "O sea… tengo que calcular cuánto falta de un número al otro. Como una resta.",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Qmar",
          text: "Así es. Si te equivocas, la luciérnaga se asusta… y se pierde más profundo en la oscuridad.",
        },
        {
          speaker: "Qmar",
          text: "Recupera diez luciérnagas y el sendero volverá a encenderse. Si lo logras, te daré una hoja del Libro de Aritmética.",
        },
        {
          speaker: "Qmar",
          text: "Respira. Mira la recta. Piensa la distancia. Y dispara solo cuando estés seguro. Yo sostengo la linterna… tú sostienes el camino.",
          stage: { focus: "Qmar" },
        },
      ],
    },
  },
};

// --- 3.5 Bruno – El Minero del Equilibrio (Divisiones) ---
window.MINEROS_STORY = {
  start: "bruno_intro",
  order: ["bruno_intro"],
  scenes: {
    bruno_intro: {
      title: "El Minero del Equilibrio",
      background: "bg_mina",
      music: "bgm_novela",
      characters: [
        {
          image: "ch_nico",
          x: 260,
          y: 560,
          scale: 0.35,
          flipX: false,
          name: "Nico",
        },
        {
          image: "ch_minero",
          x: 600,
          y: 540,
          scale: 0.45,
          flipX: false,
          name: "Bruno",
        },
      ],
      dialogs: [
        {
          speaker: "Bruno",
          text: "Alto ahí, muchacho. No te acerques tanto al borde.",
          stage: { focus: "Bruno" },
        },
        {
          speaker: "Nico",
          text: "¿Usted maneja este elevador?",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Bruno",
          text: "Desde antes de que los números te dieran pesadillas.",
          stage: { focus: "Bruno" },
        },
        {
          speaker: "Bruno",
          text: "Este pozo conecta los niveles más profundos de la mina. Pero no cualquiera puede subirlo.",
        },
        {
          speaker: "Nico",
          text: "¿Por qué? Parece… normal.",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Bruno",
          text: "El elevador sí. Los que no son normales son ellos.",
          stage: { focus: "Bruno" },
        },
        {
          speaker: "Bruno",
          text: "Los monstritos de esta mina tienen un sentido del equilibrio muy especial.",
        },
        {
          speaker: "Bruno",
          text: "Si falta peso, el elevador sube demasiado rápido… y entran en pánico.",
        },
        {
          speaker: "Bruno",
          text: "Saltan antes de llegar. Prefieren la caída al vértigo.",
        },
        {
          speaker: "Nico",
          text: "¿Y si hay demasiado peso?",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Bruno",
          text: "Entonces simplemente no sube.",
          stage: { focus: "Bruno" },
        },
        {
          speaker: "Bruno",
          text: "He aprendido que solo cuando el peso es exacto, confían en el viaje.",
        },
        {
          speaker: "Nico",
          text: "¿Exacto… cómo?",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Bruno",
          text: "Mira el contrapeso. Esa cifra es el total que el elevador puede soportar.",
          stage: { focus: "Bruno" },
        },
        {
          speaker: "Bruno",
          text: "Cada monstruito pesa lo mismo. Tu trabajo es decidir cuántos deben subir.",
        },
        {
          speaker: "Bruno",
          text: "Ni más, ni menos.",
        },
        {
          speaker: "Bruno",
          text: "Si entiendes el equilibrio, te lo recompensare con una hoja del libro de la aritmética.",
        },
      ],
    },
  },
};

// ================== 3.6 Galileo – Lluvia de Meteoritos (Tablas) ==================
window.GALILEO_TABLAS_STORY = {
  start: "galileo_intro",
  order: ["galileo_intro"],
  scenes: {
    galileo_intro: {
      title: "Galileo",
      background: "bg_galileo",
      music: "bgm_overworld",
      introVideo: "vid_galileo",
      characters: [
        {
          image: "ch_nico",
          x: 260,
          y: 560,
          scale: 0.35,
          flipX: false,
          name: "Nico",
        },
        {
          image: "ch_galileo",
          x: 600,
          y: 520,
          scale: 0.4,
          flipX: false,
          name: "Galileo",
        },
      ],
      dialogs: [
        {
          speaker: "Galileo",
          text: "Ah… te vi llegar. A veces el cielo me habla más de lo que yo quisiera.",
          stage: { focus: "Galileo" },
        },
        {
          speaker: "Nico",
          text: "¿Qué estaba observando?",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Galileo",
          text: "En tu tiempo me han dicho que entre Marte y Júpiter existe un mar de rocas, y no puedo dejar de pensar en eso.",
          stage: { focus: "Galileo" },
        },
        {
          speaker: "Galileo",
          text:
            "Creen que fue un planeta que jamás logró formarse… " +
            "o quizás uno que sufrió un impacto terrible hace millones de años.",
        },
        {
          speaker: "Galileo",
          text:
            "Ese caos primordial vive en mi mente desde que miré por primera vez el firmamento. " +
            "A veces sueño que debo atravesarlo para comprenderlo… pero el sueño se convierte en pesadilla.",
        },
        {
          speaker: "Galileo",
          text: "Aquí el caos toma forma de números. Debo navegar y calcular al mismo tiempo… y eso es demasiado para mí.",
        },
        {
          speaker: "Nico",
          text: "¿Tal vez yo pueda ayudarle?",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Galileo",
          text: "¿Me acompañarías? Mientras yo dirijo la nave, tú podrías ayudarme a descifrar el orden oculto en este caos.",
          stage: { focus: "Galileo" },
        },
        {
          speaker: "Galileo",
          text: "Juntos quizá podamos atravesar el cinturón… y comprender por qué incluso los sueños recuerdan la violencia de los cielos.",
        },
      ],
    },
  },
};

// --- 3.7 Armonia de la Division (division como precision y practica) ---
window.ARMONIA_DIVISION_STORY = {
  start: "armonia_division_intro",
  order: ["armonia_division_intro"],
  scenes: {
    armonia_division_intro: {
      title: "Armonia y el ritmo del error",
      background: "bg_mina",
      music: "bgm_overworld",
      characters: [
        {
          image: "ch_nico",
          x: 260,
          y: 560,
          scale: 0.35,
          flipX: false,
          name: "Nico",
        },
        {
          image: "ch_armonia",
          x: 620,
          y: 550,
          scale: 0.35,
          flipX: false,
          name: "Armonia",
        },
      ],
      dialogs: [
        {
          speaker: "Armonia",
          text: "Las notas no nacen perfectas. Se afinan.",
          stage: { focus: "Armonia" },
        },
        {
          speaker: "Armonia",
          text: "En música, el error no es enemigo... es parte del ensayo.",
          stage: { focus: "Armonia" },
        },
        {
          speaker: "Armonia",
          text: "Las divisiones funcionan igual: un descuido rompe el compás.",
          stage: { focus: "Armonia" },
        },
        {
          speaker: "Nico",
          text: "Entonces no se trata de hacerlo rápido, sino de mantener el ritmo.",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Armonia",
          text: "Exacto. Encuentra el fallo, corrige y continua.",
          stage: { focus: "Armonia" },
        },
        {
          speaker: "Armonia",
          text: "Si dominas ese pulso, el cálculo deja de sonar como ruido.",
          stage: { focus: "Armonia" },
        },
      ],
    },
  },
};

// --- 3.8 Chaman de la Jerarquía (orden de operaciones, enteros, signos) ---
window.CHAMAN_JERARQUIA_STORY = {
  start: "chaman_jerarquia",
  order: ["chaman_jerarquia"],
  scenes: {
    chaman_jerarquia: {
      title: "El chamán del orden",
      background: "bg_classroom",
      music: "bgm_overworld",
      characters: [
        {
          image: "ch_nico",
          x: 300,
          y: 560,
          scale: 0.32,
          flipX: false,
          name: "Nico",
        },
        {
          image: "ch_chaman",
          x: 600,
          y: 570,
          scale: 0.4,
          flipX: false,
          name: "Chamán",
        },
      ],
      dialogs: [
        {
          speaker: "Chamán",
          text: "Te he visto perderte una y otra vez en la misma pesadilla, muchacho. Esas operaciones gigantes que te persiguen no te dejan dormir, ¿verdad?",
          stage: { focus: "Chamán" },
        },
        {
          speaker: "Nico",
          text: "¿Por qué estamos aquí? ¿Cómo sabes eso? Siempre sueño con expresiones larguísimas... se me vienen encima y no sé por dónde empezar.",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Chamán",
          text: "Porque camino entre sueños y pesadillas. Yo no puedo hacer tu examen por ti, pero sí puedo darte un lugar seguro para practicar.",
          stage: { focus: "Chamán" },
        },
        {
          speaker: "Nico",
          text: "¿Seguro? En mis sueños siempre siento que si me equivoco, todo se derrumba.",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Chamán",
          text: "Aquí no. Voy a recrear esa misma pesadilla, pero dentro de un círculo de protección. Los monstruos se verán igual de aterradores, pero no podrán tocarte.",
          stage: { focus: "Chamán" },
        },
        {
          speaker: "Chamán",
          text: "Cada monstruo estará hecho de una expresión. Para encogerlo, toca la operación que debe resolverse primero: potencias, multiplicaciones, sumas… en el orden correcto.",
        },
        {
          speaker: "Chamán",
          text: "Si aciertas, la expresión se simplifica y el monstruo se hace más pequeño. Si fallas, te confundes y durante un instante no podrás tocar nada… y ellos seguirán avanzando.",
        },
        {
          speaker: "Chamán",
          text: "Tómatelo como un entrenamiento: cuantas más pesadillas domines aquí, más claro verás las operaciones cuando estés despierto.",
        },
        {
          speaker: "Nico",
          text: "Está bien… Si de todas formas ya sueño con esto, mejor practicar aquí que huir toda la noche.",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Chamán",
          text: "Entonces presta atención, pequeño caminante. El orden es tu mejor arma. Vamos a invocar a los monstruos del cálculo.",
          stage: { focus: "Chamán" },
        },
      ],
    },
  },
};

// --- 3.9 General de los Signos (campo minado de reglas de signos) ---
window.GENERAL_SIGNOS_STORY = {
  start: "general_signos_intro",
  order: ["general_signos_intro"],
  scenes: {
    general_signos_intro: {
      title: "El general de los signos",
      background: "bg_general",
      music: "bgm_overworld",
      characters: [
        {
          image: "ch_nico",
          x: 260,
          y: 560,
          scale: 0.35,
          flipX: false,
          name: "Nico",
        },
        {
          image: "ch_general",
          x: 620,
          y: 540,
          scale: 0.5,
          flipX: false,
          name: "General",
        },
      ],
      dialogs: [
        {
          speaker: "General",
          text: "Alto ahí, recluta. Has entrado a mi campo minado.",
          stage: { focus: "General" },
        },
        {
          speaker: "Nico",
          text: "¿Campo… minado?",
          stage: { focus: "Nico" },
        },
        {
          speaker: "General",
          text: "De números, por supuesto. Aquí no explotan cuerpos, explotan ejercicios mal resueltos.",
        },
        {
          speaker: "General",
          text: "Muchos soldados repiten reglas de memoria: 'más por menos es menos', 'menos por menos es más'…",
        },
        {
          speaker: "General",
          text: "Pero cuando se enfrentan a un problema real, no saben si deben sumar, restar o multiplicar, ni qué regla aplicar.",
        },
        {
          speaker: "Nico",
          text: "Sí… a veces veo +3 − 5 o −2 × −4 y me confundo. Siento que todo es igual: signos por todos lados.",
          stage: { focus: "Nico" },
        },
        {
          speaker: "General",
          text: "Exacto. Por eso diseñé este lugar. Cada casilla del camino es una prueba. Cada paso puede ser un avance… o una explosión.",
        },
        {
          speaker: "General",
          text: "Aquí entreno a mis soldados para distinguir, sin dudar, qué regla de signos usar y cuándo.",
        },
        {
          speaker: "General",
          text: "Suma de enteros con signo: ejércitos que empujan en sentidos opuestos o en el mismo. Multiplicación con signo: alianzas y traiciones entre esos ejércitos.",
        },
        {
          speaker: "General",
          text: "Si mezclas reglas o decides al azar, tu soldado se hunde en el campo. Si eliges bien, avanza.",
        },
        {
          speaker: "Nico",
          text: "¿Y cuántas oportunidades tengo… antes de que todos mis soldados desaparezcan?",
          stage: { focus: "Nico" },
        },
        {
          speaker: "General",
          text: "Cinco. Cinco intentos. Cada acierto hace avanzar al que va al frente. Cada error, uno cae… y yo observo.",
        },
        {
          speaker: "General",
          text: "No te preocupes, solo se destruye tu mala costumbre de no pensar los signos. Eso sí, el camino no perdona despistes.",
        },
        {
          speaker: "General",
          text: "Si logras que uno de tus soldados cruce el campo entero, sabré que puedes distinguir sin miedo qué regla aplicar en cada caso.",
        },
        {
          speaker: "General",
          text: "Entonces recibirás una hoja del Libro de Aritmética.",
        },
        {
          speaker: "Nico",
          text: "Suena a entrenamiento… y a tortura psicológica.",
          stage: { focus: "Nico" },
        },
        {
          speaker: "General",
          text: "Las buenas matemáticas siempre torturan un poco antes de volverse claras. La diferencia es que aquí puedes fallar y volver a intentarlo.",
        },
        {
          speaker: "General",
          text: "Ponte en marcha, recluta. Este campo minado no se limpiará solo.",
          stage: { focus: "General" },
        },
      ],
    },
  },
};

// --- 3.10 Eratóstenes – Los Fantasmas de los Divisores ---
window.ERATOSTENES_STORY = {
  start: "eratostenes_intro",
  order: ["eratostenes_intro"],
  scenes: {
    eratostenes_intro: {
      title: "Eratóstenes",
      background: "bg_divisores",
      music: "bgm_overworld",
      characters: [
        {
          image: "ch_nico",
          x: 160,
          y: 460,
          scale: 0.17,
          flipX: false,
          name: "Nico",
        },
        {
          image: "ch_eratostenes",
          x: 300,
          y: 480,
          scale: 0.2,
          flipX: false,
          name: "Eratóstenes",
        },
      ],
      dialogs: [
        {
          speaker: "Eratóstenes",
          text: "No avances tan rápido, muchacho. Aquí los números no se dejan ver con facilidad.",
          stage: { focus: "Eratóstenes" },
        },
        {
          speaker: "Nico",
          text: "¿A dónde dirige ese camino? Se ve… tenebroso.",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Eratóstenes",
          text: "Es el Cementerio de los Divisores. Aquí habitan números que se esconden de quien solo mira la superficie.",
        },
        {
          speaker: "Eratóstenes",
          text: "Muchos creen que un número es lo que aparenta ser. Pero por dentro… casi todos están hechos de otros más pequeños.",
          stage: { focus: "Eratóstenes" },
        },
        {
          speaker: "Eratóstenes",
          text: "Hay números que revelan su mitad con solo mirarlos. Otros aceptan dividirse en tres, o en cinco, sin oponer resistencia.",
        },
        {
          speaker: "Eratóstenes",
          text: "Pero cuando ninguno de esos caminos funciona… el número se vuelve solitario. Primo.",
          stage: { focus: "Eratóstenes" },
        },
        {
          speaker: "Nico",
          text: "Entonces… ¿no todos los números se pueden romper fácilmente?",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Eratóstenes",
          text: "Exacto. Y por eso diseñé un método: no busco al primo directamente.",
          stage: { focus: "Eratóstenes" },
        },
        {
          speaker: "Eratóstenes",
          text: "Con estas balas, disparo primero a lo evidente. Elimino lo que tiene mitad. Luego lo que acepta una tercera parte. Después lo que cae ante cinco o siete.",
        },
        {
          speaker: "Eratóstenes",
          text: "Cuando ya no queda ningún fantasma visible… lo que permanece es indivisible.",
          stage: { focus: "Eratóstenes" },
        },
        {
          speaker: "Nico",
          text: "¿Y si me equivoco de bala?",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Eratóstenes",
          text: "Entonces el número se fortalece. Los errores no destruyen… complican.",
          stage: { focus: "Eratóstenes" },
        },
        {
          speaker: "Eratóstenes",
          text: "Este no es un combate de fuerza, sino de paciencia y observación.",
          stage: { focus: "Eratóstenes" },
        },
        {
          speaker: "Eratóstenes",
          text: "Si logras revelar suficientes números ocultos, sabré que ya no disparas al azar.",
          stage: { focus: "Eratóstenes" },
        },
        {
          speaker: "Eratóstenes",
          text: "Y entonces, compartiré contigo hojas del Libro de la Aritmética.",
        },
        {
          speaker: "Eratóstenes",
          text: "Ahora entra al cementerio, Nico… y aprende a ver lo que los demás no ven.",
          stage: { focus: "Eratóstenes" },
        },
      ],
    },
  },
};

// --- 3.11 Leonardo de Pisa (Fibonacci) – Reto final de Aritmética (razonamiento) ---
// Nota: la escena exacta (bloqueado / reto / aprobado / perfecto) se decide desde el overworld
// según el número de hojas y el estado del reto final.
window.LEONARDO_PISA_STORY = {
  start: "leonardo_bloqueado",
  order: [
    "leonardo_bloqueado",
    "leonardo_reto",
    "leonardo_aprobado",
    "leonardo_perfecto",
    "exit",
  ],
  scenes: {
    // ───────────────── Estado 1: aún no se activa el reto final (< 9 hojas) ─────────────────
    leonardo_bloqueado: {
      title: "Leonardo de Pisa",
      background: "bg_leonardo",
      music: "bgm_quiet",
      characters: [
        {
          image: "ch_nico",
          x: 300,
          y: 540,
          scale: 0.4,
          flipX: false,
          name: "Nico",
        },
        {
          image: "ch_leonardo",
          x: 620,
          y: 515,
          scale: 0.5,
          flipX: false,
          name: "Leonardo de Pisa",
        },
      ],
      dialogs: [
        {
          speaker: "Leonardo de Pisa",
          text: "Veo que apenas llevas unas cuantas hojas del libro. Aún no estás listo para avanzar.",
          stage: { focus: "Leonardo de Pisa" },
        },
        {
          speaker: "Leonardo de Pisa",
          text: "No te apresures: el conocimiento se encuaderna hoja por hoja. Vuelve cuando hayas reunido más.",
          stage: { focus: "Leonardo de Pisa" },
          next: "exit",
        },
      ],
    },

    // ───────────────── Estado 2: umbral (exactamente 9 hojas) ─────────────────
    // Aquí el reto sí importa: si lo ganas, obtienes la hoja 10 y se abre el camino al Álgebra.
    leonardo_reto: {
      title: "Leonardo de Pisa",
      background: "bg_leonardo",
      music: "bgm_quiet",
      characters: [
        {
          image: "ch_nico",
          x: 300,
          y: 540,
          scale: 0.4,
          flipX: false,
          name: "Nico",
        },
        {
          image: "ch_leonardo",
          x: 620,
          y: 515,
          scale: 0.28,
          flipX: false,
          name: "Leonardo de Pisa",
        },
      ],
      dialogs: [
        {
          speaker: "Leonardo de Pisa",
          text: "Muy bien… ya casi has reunido suficientes hojas. Pero antes de celebrar, queda una prueba más.",
          stage: { focus: "Leonardo de Pisa" },
        },
        {
          speaker: "Leonardo de Pisa",
          text: "Un reto final. Si tu razonamiento es sólido, te daré la hoja que falta para cerrar el primer libro.",
          stage: { focus: "Leonardo de Pisa" },
        },
        {
          speaker: "Nico",
          text: "Entiendo... Haré el intento.",
          stage: { focus: "Nico" },
          next: "exit",
        },
      ],
    },

    // ───────────────── Estado 3: ya tienes suficientes hojas (10–14) ─────────────────
    // Pierdas o ganes, el camino puede abrirse. El reto queda como desafío opcional.
    leonardo_aprobado: {
      title: "Leonardo de Pisa",
      background: "bg_leonardo",
      music: "bgm_quiet",
      characters: [
        {
          image: "ch_nico",
          x: 300,
          y: 540,
          scale: 0.4,
          flipX: false,
          name: "Nico",
        },
        {
          image: "ch_leonardo",
          x: 620,
          y: 515,
          scale: 0.28,
          flipX: false,
          name: "Leonardo de Pisa",
        },
      ],
      dialogs: [
        {
          speaker: "Leonardo de Pisa",
          text: "Veo que ya reuniste suficientes hojas. Con eso basta para encuadernar el libro y abrir el camino al Álgebra.",
          stage: { focus: "Leonardo de Pisa" },
        },
        {
          speaker: "Leonardo de Pisa",
          text: "Pero si aún te quedan retos pendientes, puedes enfrentarlos. No por obligación… sino por dominio.",
          stage: { focus: "Leonardo de Pisa" },
        },
        {
          speaker: "Nico",
          text: "Entonces puedo seguir intentando para completar el libro... aunque ya pueda avanzar?",
          stage: { focus: "Nico" },
        },
        {
          speaker: "Leonardo de Pisa",
          text: "Exacto. Desarrollar todas tus habilidades te dará ventaja en el futuro.",
          stage: { focus: "Leonardo de Pisa" },
        },
        {
          speaker: "Leonardo de Pisa",
          text: "El camino al Álgebra ya está abierto. Si quieres, vuelve conmigo después para intentar mi reto por práctica.",
          stage: { focus: "Leonardo de Pisa" },
          next: "exit",
        },
      ],
    },

    // ───────────────── Estado 4: completista (16 hojas) ─────────────────
    leonardo_perfecto: {
      title: "Leonardo de Pisa",
      background: "bg_leonardo",
      music: "bgm_quiet",
      characters: [
        {
          image: "ch_nico",
          x: 300,
          y: 540,
          scale: 0.4,
          flipX: false,
          name: "Nico",
        },
        {
          image: "ch_leonardo",
          x: 620,
          y: 515,
          scale: 0.28,
          flipX: false,
          name: "Leonardo de Pisa",
        },
      ],
      dialogs: [
        {
          speaker: "Leonardo de Pisa",
          text: "Excelente. Veo que has conseguido todas las hojas del libro, incluso la mía. No cualquiera llega hasta aquí.",
          stage: { focus: "Leonardo de Pisa" },
        },
        {
          speaker: "Leonardo de Pisa",
          text: "En verdad eres alguien especial: constancia… y cabeza fría. Eso vale más que cualquier truco.",
          stage: { focus: "Leonardo de Pisa" },
        },
        {
          speaker: "Leonardo de Pisa",
          text: "Habla con Sofía cuando estés listo para el Álgebra.",
          stage: { focus: "Leonardo de Pisa" },
        },

        {
          speaker: "Leonardo de Pisa",
          text: "Ahora, practiquemos nuevamente este reto… no para abrirte el camino, sino para honrar lo que ya lograste.",
          stage: { focus: "Leonardo de Pisa" },
          next: "exit",
        },
      ],
    },
    exit: {
      title: "Exit de Leonardo",
      music: "bgm_overworld",
      dialogs: [],
    },
  },
};

// ================== CIERRE ARITMÉTICA (TEMP) ==================
window.LEONARDO_CIERRE_STORY = {
  start: "cierre",
  order: ["cierre", "exit"],
  scenes: {
    cierre: {
      title: "Cierre de Aritmética",
      background: "bg_leonardo",
      music: "bgm_quiet",
      introVideo: "vid_cierre", // <-- tu video temporal
      characters: [
        {
          image: "ch_nico",
          x: 300,
          y: 540,
          scale: 0.4,
          flipX: false,
          name: "Nico",
        },
        {
          image: "ch_leonardo",
          x: 620,
          y: 515,
          scale: 0.28,
          flipX: false,
          name: "Leonardo de Pisa",
        },
      ],
      dialogs: [
        {
          speaker: "Leonardo de Pisa",
          text: "Bien. Con estas hojas, el libro puede cerrarse.",
        },
        {
          speaker: "Leonardo de Pisa",
          text: "Cuando estés listo, habla con Sofía. Ella te guiará al Área del Álgebra.",
          next: "exit",
        },
      ],
    },
    exit: { title: "Exit", music: "bgm_overworld", dialogs: [] },
  },
};

[
  window.MN_STORY,
  window.SOFIA_STORY,
  window.SOFIA_ALGEBRA_GATE_STORY,
  window.ESCRIBA_MUESCAS_STORY,
  window.CAJA_RAPIDA_STORY,
  window.ESCALERA_SUMAS_STORY,
  window.GUARDIAN_LUCIERNAGAS_STORY,
  window.MINEROS_STORY,
  window.GALILEO_TABLAS_STORY,
  window.ARMONIA_DIVISION_STORY,
  window.CHAMAN_JERARQUIA_STORY,
  window.GENERAL_SIGNOS_STORY,
  window.ERATOSTENES_STORY,
  window.LEONARDO_PISA_STORY,
  window.LEONARDO_CIERRE_STORY,
].forEach(MN_scaleAritmeticaStory);
