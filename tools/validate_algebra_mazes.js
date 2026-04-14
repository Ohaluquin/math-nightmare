const fs = require("fs");
const path = require("path");

global.window = {};
const source = fs.readFileSync(
  path.join(__dirname, "..", "assets", "algebra", "data", "laberintos.js"),
  "utf8",
);
eval(source);

const mazes = window.ALGEBRA_LABERINTOS || [];
const optionLetters = ["A", "B", "C", "D"];
const requiredLetters = ["J", "M", "E", ...optionLetters];
const symbolLetters = ["J", "M", "E", ...optionLetters];

function keyOf(cell) {
  return `${cell.r},${cell.c}`;
}

function findCell(maze, target) {
  for (let r = 0; r < maze.length; r++) {
    for (let c = 0; c < maze[0].length; c++) {
      if (maze[r][c] === target) return { r, c };
    }
  }
  return null;
}

function bfsPath(maze, start, target, blockedLetters) {
  const rows = maze.length;
  const cols = maze[0].length;
  const queue = [start];
  const seen = new Set([keyOf(start)]);
  const parent = new Map();
  let head = 0;

  while (head < queue.length) {
    const cur = queue[head++];
    if (cur.r === target.r && cur.c === target.c) {
      const path = [];
      let cursorKey = keyOf(cur);
      while (cursorKey) {
        const [r, c] = cursorKey.split(",").map(Number);
        path.push({ r, c });
        cursorKey = parent.get(cursorKey) || null;
      }
      path.reverse();
      return path;
    }

    for (const [dr, dc] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nr = cur.r + dr;
      const nc = cur.c + dc;
      if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;

      const cell = maze[nr][nc];
      if (cell === "1") continue;
      if (blockedLetters.has(cell)) continue;

      const next = { r: nr, c: nc };
      const nextKey = keyOf(next);
      if (seen.has(nextKey)) continue;
      seen.add(nextKey);
      parent.set(nextKey, keyOf(cur));
      queue.push(next);
    }
  }

  return null;
}

function formatPathLength(label, path) {
  if (!path) return `${label}: sin ruta`;
  return `${label}: ${Math.max(0, path.length - 1)} pasos`;
}

function countLetters(maze) {
  const counts = Object.fromEntries(requiredLetters.map((letter) => [letter, 0]));
  for (const row of maze) {
    for (const cell of row) {
      if (counts[cell] !== undefined) counts[cell]++;
    }
  }
  return counts;
}

function blockedSymbolsExcept(...allowedLetters) {
  return new Set(symbolLetters.filter((letter) => !allowedLetters.includes(letter)));
}

let hasError = false;

for (const mazeDef of mazes) {
  const maze = mazeDef.matriz.map((row) => row.split(""));
  const rows = maze.length;
  const cols = maze[0]?.length ?? 0;
  const counts = countLetters(maze);

  for (const letter of requiredLetters) {
    if (counts[letter] !== 1) {
      console.error(`${mazeDef.id}: ${letter} aparece ${counts[letter]} veces`);
      hasError = true;
    }
  }

  if (rows !== 19 || cols !== 29) {
    console.error(`${mazeDef.id}: tamano invalido ${rows}x${cols}, esperado 19x29`);
    hasError = true;
  }

  const start = findCell(maze, "J");
  const mino = findCell(maze, "M");
  const exit = findCell(maze, "E");
  if (!start || !mino || !exit) continue;

  console.log(`\n${mazeDef.id}`);

  for (const option of optionLetters) {
    const optionCell = findCell(maze, option);
    if (!optionCell) continue;

    const pathFromStart = bfsPath(
      maze,
      start,
      optionCell,
      blockedSymbolsExcept("J", option),
    );
    const pathFromMino = bfsPath(
      maze,
      mino,
      optionCell,
      blockedSymbolsExcept("M", option),
    );
    const pathToExit = bfsPath(
      maze,
      optionCell,
      exit,
      blockedSymbolsExcept(option, "E"),
    );

    if (!pathFromStart) {
      console.error(`${mazeDef.id}: no se puede llegar a ${option} desde J sin pasar por otro simbolo`);
      hasError = true;
    }

    if (!pathFromMino) {
      console.error(`${mazeDef.id}: no se puede llegar a ${option} desde M sin pasar por otro simbolo`);
      hasError = true;
    }

    if (!pathToExit) {
      console.error(`${mazeDef.id}: desde ${option} no hay camino a E sin pasar por otro simbolo`);
      hasError = true;
    }

    console.log(formatPathLength(`  J -> ${option}`, pathFromStart));
    console.log(formatPathLength(`  M -> ${option}`, pathFromMino));
    console.log(formatPathLength(`  ${option} -> E`, pathToExit));
  }
}

if (hasError) {
  process.exit(1);
}

console.log(`\nOK: ${mazes.length} laberintos validos`);
