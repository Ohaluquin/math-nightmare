// palabras.js
// Pack único de álgebra para el juego de anagramas.
// "palabra" va SIN acentos para tecleo fácil.

(function () {
  window.PALABRAS_PACKS = {
    algebra: [
      {
        palabra: "algebra",
        pista1: "Rama de las matemáticas que usa símbolos.",
        pista2: "Generaliza operaciones con letras y números.",
      },

      {
        palabra: "variable",
        pista1: "Símbolo que representa un valor que puede cambiar.",
        pista2: "Suele representarse con letras como x o y.",
      },
      {
        palabra: "constante",
        pista1: "Valor fijo que no cambia.",
        pista2: "Ejemplo: el 5 en 2x + 5.",
      },
      {
        palabra: "valor",
        pista1: "Cantidad numérica que puede tomar una variable.",
        pista2: "Por ejemplo, el valor de x.",
      },

      {
        palabra: "expresion",
        pista1: "Combinación de números, variables y operaciones.",
        pista2: "Ejemplo: 3x + 2.",
      },
      {
        palabra: "termino",
        pista1: "Cada parte de una expresión separada por + o -.",
        pista2: "En 3x + 2 hay dos.",
      },
      {
        palabra: "coeficiente",
        pista1: "Número que multiplica a una variable.",
        pista2: "En 7x, es 7.",
      },
      {
        palabra: "semejantes",
        pista1: "Términos que tienen la misma parte literal.",
        pista2: "Por ejemplo, 3x y 5x.",
      },

      {
        palabra: "ecuacion",
        pista1: "Igualdad con una o más incógnitas.",
        pista2: "Se resuelve hallando valores que la hagan verdadera.",
      },
      {
        palabra: "igualdad",
        pista1: "Relación entre dos expresiones con el mismo valor.",
        pista2: "Se representa con el signo =.",
      },
      {
        palabra: "miembro",
        pista1: "Cada lado de una ecuación.",
        pista2: "Puede hablarse de primer y segundo miembro.",
      },
      {
        palabra: "incognita",
        pista1: "Valor desconocido que se busca encontrar.",
        pista2: "Suele representarse con una letra.",
      },
      {
        palabra: "solucion",
        pista1: "Valor que hace verdadera una ecuación.",
        pista2: "Es la respuesta correcta del problema algebraico.",
      },
      {
        palabra: "despeje",
        pista1: "Proceso de aislar una variable.",
        pista2: "Usa operaciones inversas para dejar sola la incógnita.",
      },
      {
        palabra: "sustitucion",
        pista1: "Reemplazar una variable por un valor o una expresión.",
        pista2: "Sirve para evaluar o comprobar resultados.",
      },

      {
        palabra: "parentesis",
        pista1: "Símbolo que agrupa operaciones o expresiones.",
        pista2: "A veces obliga a aplicar la distributiva.",
      },
      {
        palabra: "distributiva",
        pista1:
          "Propiedad que permite multiplicar un término por cada parte dentro del paréntesis.",
        pista2: "Ejemplo: 2(x + 3) = 2x + 6.",
      },

      {
        palabra: "factor",
        pista1: "Cada cantidad que multiplica a otra.",
        pista2: "En 3xy, 3, x y y son factores.",
      },
      {
        palabra: "producto",
        pista1: "Resultado de una multiplicación.",
        pista2: "También se usa en frases como 'el producto de 3 y x'.",
      },
      {
        palabra: "suma",
        pista1: "Operación de agregar cantidades.",
        pista2: "En lenguaje algebraico puede aparecer como 'más'.",
      },
      {
        palabra: "resta",
        pista1: "Operación de quitar o sustraer.",
        pista2: "También puede expresarse como 'menos'.",
      },
      {
        palabra: "diferencia",
        pista1: "Resultado de una resta.",
        pista2: "En problemas verbales suele indicar sustracción.",
      },
      {
        palabra: "cociente",
        pista1: "Resultado de una división.",
        pista2: "En frases: 'el cociente de a entre b'.",
      },

      {
        palabra: "doble",
        pista1: "Dos veces una cantidad.",
        pista2: "El doble de x se expresa como 2x.",
      },
      {
        palabra: "triple",
        pista1: "Tres veces una cantidad.",
        pista2: "El triple de x se expresa como 3x.",
      },
      {
        palabra: "mitad",
        pista1: "Una de dos partes iguales.",
        pista2: "La mitad de x se expresa como x/2.",
      },

      {
        palabra: "operacion",
        pista1: "Acción matemática como sumar, restar o multiplicar.",
        pista2: "En álgebra se aplica a números y variables.",
      },
    ],
  };

  // Pack fijo: álgebra
  window.PALABRAS_BASE = window.PALABRAS_PACKS.algebra;
})();
