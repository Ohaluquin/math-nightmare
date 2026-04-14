// assets/algebra/data/catalog.js
// Catalogo de casos para DespejesScene

window.ALGEBRA_DESPEJES_CATALOG = [
  {
    id: "ab_minus_c_eq_d__b",
    difficulty: 1,
    objectiveText: "Despeja b",
    steps: [
      { eqL: "ab - c", eqR: "d", terms: ["a", "b", "c", "d"], goal: { op: "addInv", term: "c" }, warn: [{ op: "addInv", term: "a", msg: "Valido operar con a, pero primero neutraliza el -c." }, { op: "addInv", term: "d", msg: "Operar con d no te acerca: primero neutraliza el -c." }], valid: [{ op: "mulInv", term: "a" }, { op: "mulInv", term: "b" }, { op: "mulFactor", term: "a" }, { op: "mulFactor", term: "b" }], invalidMsg: "Ese movimiento no ayuda a aislar b aqui." },
      { eqL: "ab - c + c", eqR: "d + c", terms: ["c"], goal: { op: "simplify", term: null }, valid: [], warn: [], invalidMsg: "Aqui si puedes simplificar: usa el boton Simplificar.", allowNoTermFor: ["simplify"] },
      { eqL: "ab + 0", eqR: "d + c", terms: ["0"], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Aun falta simplificar: usa Simplificar." },
      { eqL: "ab", eqR: "d + c", terms: ["a", "b"], goal: { op: "mulInv", term: "a" }, warn: [{ op: "mulInv", term: "b", msg: "Dividir entre b destruye el objetivo. Divide entre a." }], invalidMsg: "Para aislar b, debes eliminar el factor a." },
      { eqL: "ab/a", eqR: "(d + c)/a", terms: ["a"], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Necesitas simplificar: a/a se convierte en 1." },
      { eqL: "1b", eqR: "(d + c)/a", terms: ["1"], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Simplifica: 1*b se reduce a b." },
      { eqL: "b", eqR: "(d + c)/a", terms: [], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Pulsa Simplificar para continuar.", isTerminal: true }
    ]
  },
  {
    id: "ax_plus_b_eq_c__x",
    difficulty: 1,
    objectiveText: "Despeja x",
    steps: [
      { eqL: "ax + b", eqR: "c", terms: ["a", "x", "b", "c"], goal: { op: "addInv", term: "b" }, warn: [{ op: "addInv", term: "a", msg: "a multiplica a x; primero elimina el +b." }, { op: "addInv", term: "c", msg: "Operar con c no te acerca: primero elimina el +b." }], invalidMsg: "Primero debes eliminar el +b." },
      { eqL: "ax + b - b", eqR: "c - b", terms: ["b"], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Usa Simplificar para cancelar b - b." },
      { eqL: "ax + 0", eqR: "c - b", terms: ["0"], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Aun hay un 0 que puedes simplificar." },
      { eqL: "ax", eqR: "c - b", terms: ["a"], goal: { op: "mulInv", term: "a" }, invalidMsg: "Para aislar x, elimina el factor a." },
      { eqL: "ax/a", eqR: "(c - b)/a", terms: ["a"], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Simplifica: a/a se convierte en 1." },
      { eqL: "1x", eqR: "(c - b)/a", terms: ["1"], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Simplifica: 1*x se reduce a x." },
      { eqL: "x", eqR: "(c - b)/a", terms: [], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Pulsa Simplificar para continuar.", isTerminal: true }
    ]
  },
  {
    id: "x_minus_a_eq_b__x",
    difficulty: 1,
    objectiveText: "Despeja x",
    steps: [
      { eqL: "x - a", eqR: "b", terms: ["a", "b"], goal: { op: "addInv", term: "a" }, invalidMsg: "Para aislar x, debes sumar a en ambos lados." },
      { eqL: "x - a + a", eqR: "b + a", terms: ["a"], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Usa Simplificar para cancelar -a + a." },
      { eqL: "x + 0", eqR: "b + a", terms: ["0"], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Aun hay un 0 que debes simplificar." },
      { eqL: "x", eqR: "b + a", terms: [], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Pulsa Simplificar para continuar.", isTerminal: true }
    ]
  },
  {
    id: "a_plus_y_eq_b__y",
    difficulty: 1,
    objectiveText: "Despeja y",
    steps: [
      { eqL: "a + y", eqR: "b", terms: ["a", "b", "y"], goal: { op: "addInv", term: "a" }, invalidMsg: "Para aislar y, elimina el +a." },
      { eqL: "a + y - a", eqR: "b - a", terms: ["a"], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Usa Simplificar para cancelar a - a." },
      { eqL: "0 + y", eqR: "b - a", terms: ["0"], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Aun hay un 0 que puedes simplificar." },
      { eqL: "y", eqR: "b - a", terms: [], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Pulsa Simplificar para continuar.", isTerminal: true }
    ]
  },
  {
    id: "(x_div_a)_plus_c_eq_d__x",
    difficulty: 1,
    objectiveText: "Despeja x",
    steps: [
      { eqL: "x/a + c", eqR: "d", terms: ["a", "c", "d"], goal: { op: "addInv", term: "c" }, invalidMsg: "Primero elimina el +c." },
      { eqL: "x/a + c - c", eqR: "d - c", terms: ["c"], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Usa Simplificar para cancelar c - c." },
      { eqL: "x/a + 0", eqR: "d - c", terms: ["0"], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Aun hay un 0 que puedes simplificar." },
      { eqL: "x/a", eqR: "d - c", terms: ["a"], goal: { op: "mulFactor", term: "a" }, invalidMsg: "Ahora multiplica por a para quitar la division." },
      { eqL: "x/a * a", eqR: "(d - c) * a", terms: ["a"], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Simplifica: a/a se convierte en 1." },
      { eqL: "x * 1", eqR: "(d - c) * a", terms: ["1"], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Simplifica: factor 1 se elimina." },
      { eqL: "x", eqR: "(d - c) * a", terms: [], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Pulsa Simplificar para continuar.", isTerminal: true }
    ]
  },
  {
    id: "(x_div_a)_minus_c_eq_d__x",
    difficulty: 1,
    objectiveText: "Despeja x",
    steps: [
      { eqL: "x/a - c", eqR: "d", terms: ["a", "c", "d"], goal: { op: "addInv", term: "c" }, invalidMsg: "Primero neutraliza el -c sumando c." },
      { eqL: "x/a - c + c", eqR: "d + c", terms: ["c"], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Usa Simplificar para cancelar -c + c." },
      { eqL: "x/a + 0", eqR: "d + c", terms: ["0"], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Aun hay un 0 que puedes simplificar." },
      { eqL: "x/a", eqR: "d + c", terms: ["a"], goal: { op: "mulFactor", term: "a" }, invalidMsg: "Ahora multiplica por a para quitar la division." },
      { eqL: "x/a * a", eqR: "(d + c) * a", terms: ["a"], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Simplifica: a/a se convierte en 1." },
      { eqL: "x * 1", eqR: "(d + c) * a", terms: ["1"], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Simplifica: factor 1 se elimina." },
      { eqL: "x", eqR: "(d + c) * a", terms: [], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Pulsa Simplificar para continuar.", isTerminal: true }
    ]
  },
  {
    id: "(x_plus_a)_div_b_eq_c__x",
    difficulty: 2,
    objectiveText: "Despeja x",
    steps: [
      { eqL: "(x + a)/b", eqR: "c", terms: ["b", "a", "c"], goal: { op: "mulFactor", term: "b" }, warn: [{ op: "addInv", term: "a", msg: "a esta dentro del parentesis. Primero quita la division entre b." }, { op: "mulInv", term: "b", msg: "Dividir entre b aqui empeora. Mejor multiplica por b." }], invalidMsg: "Primero debes eliminar la division entre b: multiplica por b." },
      { eqL: "(x + a)/b * b", eqR: "c * b", terms: ["b"], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Simplifica: b/b se convierte en 1." },
      { eqL: "(x + a) * 1", eqR: "c * b", terms: ["1"], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Simplifica: factor 1 se elimina." },
      { eqL: "x + a", eqR: "c * b", terms: ["a"], goal: { op: "addInv", term: "a" }, invalidMsg: "Para aislar x, elimina el +a." },
      { eqL: "x + a - a", eqR: "bc - a", terms: ["a"], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Usa Simplificar para cancelar a - a." },
      { eqL: "x + 0", eqR: "bc - a", terms: ["0"], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Aun hay un 0 que puedes simplificar." },
      { eqL: "x", eqR: "bc - a", terms: [], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Pulsa Simplificar para continuar.", isTerminal: true }
    ]
  },
  {
    id: "a_times_(x_minus_b)_eq_c__x",
    difficulty: 2,
    objectiveText: "Despeja x",
    steps: [
      { eqL: "a(x - b)", eqR: "c", terms: ["a", "b", "c"], goal: { op: "mulInv", term: "a" }, invalidMsg: "Primero divide entre a para eliminar el factor externo." },
      { eqL: "a(x - b)/a", eqR: "c/a", terms: ["a"], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Simplifica: a/a se convierte en 1." },
      { eqL: "1(x - b)", eqR: "c/a", terms: ["1"], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Simplifica: 1 multiplicando no cambia la expresion." },
      { eqL: "x - b", eqR: "c/a", terms: ["b"], goal: { op: "addInv", term: "b" }, invalidMsg: "Para aislar x, suma b en ambos lados." },
      { eqL: "x - b + b", eqR: "c/a + b", terms: ["b"], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Usa Simplificar para cancelar -b + b." },
      { eqL: "x + 0", eqR: "c/a + b", terms: ["0"], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Aun hay un 0 que puedes simplificar." },
      { eqL: "x", eqR: "c/a + b", terms: [], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Pulsa Simplificar para continuar.", isTerminal: true }
    ]
  },
  {
    id: "(x_div_a)_plus_b_eq_c__x",
    difficulty: 2,
    objectiveText: "Despeja x",
    steps: [
      { eqL: "x/a + b", eqR: "c", terms: ["b", "a", "c"], goal: { op: "addInv", term: "b" }, invalidMsg: "Para acercarte a x, primero elimina +b." },
      { eqL: "x/a + b - b", eqR: "c - b", terms: ["b"], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Usa Simplificar para cancelar b - b." },
      { eqL: "x/a + 0", eqR: "c - b", terms: ["0"], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Aun hay un 0 que puedes simplificar." },
      { eqL: "x/a", eqR: "c - b", terms: ["a"], goal: { op: "mulFactor", term: "a" }, invalidMsg: "Debes multiplicar por a para despejar x." },
      { eqL: "x/a * a", eqR: "(c - b) * a", terms: ["a"], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Simplifica: a/a se convierte en 1." },
      { eqL: "x * 1", eqR: "(c - b) * a", terms: ["1"], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Simplifica: factor 1 se elimina." },
      { eqL: "x", eqR: "(c - b) * a", terms: [], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Pulsa Simplificar para continuar.", isTerminal: true }
    ]
  },
  {
    id: "((ab_plus_c)_div_d)_plus_e_eq_f__b",
    difficulty: 3,
    objectiveText: "Despeja b",
    steps: [
      { eqL: "(ab + c)/d + e", eqR: "f", terms: ["e", "d", "c", "a"], goal: { op: "addInv", term: "e" }, warn: [{ op: "mulFactor", term: "d", msg: "Aun hay un +e afuera. Primero quitalo." }, { op: "addInv", term: "c", msg: "c esta dentro del numerador. Primero quita el +e." }], invalidMsg: "Ese movimiento no es el primero correcto para aislar b." },
      { eqL: "(ab + c)/d + e - e", eqR: "f - e", terms: ["e"], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Simplifica: e - e -> 0." },
      { eqL: "(ab + c)/d + 0", eqR: "f - e", terms: ["0"], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Simplifica: +0 se elimina." },
      { eqL: "(ab + c)/d", eqR: "f - e", terms: ["d"], goal: { op: "mulFactor", term: "d" }, invalidMsg: "Debes eliminar la division entre d multiplicando por d." },
      { eqL: "(ab + c)/d * d", eqR: "(f - e) * d", terms: ["d"], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Simplifica: d/d -> 1." },
      { eqL: "(ab + c) * 1", eqR: "(f - e) * d", terms: ["1"], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Simplifica: factor 1 se elimina." },
      { eqL: "ab + c", eqR: "(f - e) * d", terms: ["c"], goal: { op: "addInv", term: "c" }, invalidMsg: "Debes eliminar el +c." },
      { eqL: "ab + c - c", eqR: "d(f - e) - c", terms: ["c"], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Simplifica: c - c -> 0." },
      { eqL: "ab + 0", eqR: "d(f - e) - c", terms: ["0"], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Simplifica: +0 se elimina." },
      { eqL: "ab", eqR: "d(f - e) - c", terms: ["a", "b"], goal: { op: "mulInv", term: "a" }, warn: [{ op: "mulInv", term: "b", msg: "Dividir entre b destruye el objetivo. Divide entre a." }], invalidMsg: "Para aislar b, elimina el factor a." },
      { eqL: "ab/a", eqR: "[d(f - e) - c]/a", terms: ["a"], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Simplifica: a/a -> 1." },
      { eqL: "1b", eqR: "[d(f - e) - c]/a", terms: ["1"], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Simplifica: 1*b -> b." },
      { eqL: "b", eqR: "[d(f - e) - c]/a", terms: [], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Pulsa Simplificar para continuar.", isTerminal: true }
    ]
  },
  {
    id: "((x_minus_a)_div_b)_minus_c_eq_d__x",
    difficulty: 3,
    objectiveText: "Despeja x",
    steps: [
      { eqL: "(x - a)/b - c", eqR: "d", terms: ["c", "b", "a"], goal: { op: "addInv", term: "c" }, invalidMsg: "Primero elimina el -c sumando c." },
      { eqL: "(x - a)/b - c + c", eqR: "d + c", terms: ["c"], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Simplifica: -c + c -> 0." },
      { eqL: "(x - a)/b + 0", eqR: "d + c", terms: ["0"], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Simplifica: +0 se elimina." },
      { eqL: "(x - a)/b", eqR: "d + c", terms: ["b"], goal: { op: "mulFactor", term: "b" }, invalidMsg: "Quita la division entre b multiplicando por b." },
      { eqL: "(x - a)/b * b", eqR: "(d + c) * b", terms: ["b"], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Simplifica: b/b -> 1." },
      { eqL: "(x - a) * 1", eqR: "(d + c) * b", terms: ["1"], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Simplifica: factor 1 se elimina." },
      { eqL: "x - a", eqR: "(d + c) * b", terms: ["a"], goal: { op: "addInv", term: "a" }, invalidMsg: "Ahora debes neutralizar el -a." },
      { eqL: "x - a + a", eqR: "b(d + c) + a", terms: ["a"], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Simplifica: -a + a -> 0." },
      { eqL: "x + 0", eqR: "b(d + c) + a", terms: ["0"], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Simplifica: +0 se elimina." },
      { eqL: "x", eqR: "b(d + c) + a", terms: [], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Pulsa Simplificar para continuar.", isTerminal: true }
    ]
  },
  {
    id: "((ay_minus_b)_div_c)_plus_d_eq_e__y",
    difficulty: 3,
    objectiveText: "Despeja y",
    steps: [
      { eqL: "(ay - b)/c + d", eqR: "e", terms: ["d", "c", "b", "a"], goal: { op: "addInv", term: "d" }, invalidMsg: "Primero elimina el +d." },
      { eqL: "(ay - b)/c + d - d", eqR: "e - d", terms: ["d"], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Simplifica: d - d -> 0." },
      { eqL: "(ay - b)/c + 0", eqR: "e - d", terms: ["0"], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Simplifica: +0 se elimina." },
      { eqL: "(ay - b)/c", eqR: "e - d", terms: ["c"], goal: { op: "mulFactor", term: "c" }, invalidMsg: "Debes multiplicar por c para quitar la division." },
      { eqL: "(ay - b)/c * c", eqR: "(e - d) * c", terms: ["c"], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Simplifica: c/c -> 1." },
      { eqL: "(ay - b) * 1", eqR: "(e - d) * c", terms: ["1"], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Simplifica: factor 1 se elimina." },
      { eqL: "ay - b", eqR: "(e - d) * c", terms: ["b"], goal: { op: "addInv", term: "b" }, invalidMsg: "Neutraliza el -b sumando b." },
      { eqL: "ay - b + b", eqR: "c(e - d) + b", terms: ["b"], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Simplifica: -b + b -> 0." },
      { eqL: "ay + 0", eqR: "c(e - d) + b", terms: ["0"], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Simplifica: +0 se elimina." },
      { eqL: "ay", eqR: "c(e - d) + b", terms: ["a", "y"], goal: { op: "mulInv", term: "a" }, invalidMsg: "Para aislar y, divide entre a." },
      { eqL: "ay/a", eqR: "[c(e - d) + b]/a", terms: ["a"], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Simplifica: a/a -> 1." },
      { eqL: "1y", eqR: "[c(e - d) + b]/a", terms: ["1"], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Simplifica: 1y -> y." },
      { eqL: "y", eqR: "[c(e - d) + b]/a", terms: [], goal: { op: "simplify", term: null }, allowNoTermFor: ["simplify"], invalidMsg: "Pulsa Simplificar para continuar.", isTerminal: true }
    ]
  }
];

