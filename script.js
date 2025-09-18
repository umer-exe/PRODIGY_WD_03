// ---------- State ----------
const boardEl = document.getElementById("board");
const cells = [...boardEl.querySelectorAll(".cell")];
const turnChip = document.getElementById("turnChip");
const resultBanner = document.getElementById("resultBanner");
const resultText = document.getElementById("resultText");
const playAgainBtn = document.getElementById("playAgain");
const resetBtn = document.getElementById("resetBtn");
const modeHuman = document.getElementById("modeHuman");
const modeAI = document.getElementById("modeAI");

let board, current, gameOver, vsAI;
const LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

init();

// ---------- Init / Reset ----------
function init(){
  board = Array(9).fill(null);
  current = "X";
  gameOver = false;
  vsAI = false;             // default: Human vs Human

  // Hide any lingering result UI
  resultBanner.hidden = true;
  playAgainBtn.hidden = true;
  resultText.textContent = "";

  updateModeUI();
  render();
}

function playAgain(){
  board.fill(null);
  current = "X";
  gameOver = false;

  resultBanner.hidden = true;
  playAgainBtn.hidden = true;
  resultText.textContent = "";

  render();
}

function resetGame(){
  init();
}

// ---------- UI ----------
function render(){
  cells.forEach((c,i)=>{
    c.textContent = board[i] ?? "";
    c.disabled = Boolean(board[i]) || gameOver;
  });
  turnChip.textContent = gameOver ? "Game over" : `Turn: ${current}`;
}

function showResult(text){
  resultText.textContent = text;
  resultBanner.hidden = false;
  playAgainBtn.hidden = false;
}

// ---------- Events ----------
cells.forEach(cell=>{
  cell.addEventListener("click", onCellClick);
  cell.addEventListener("keydown", onCellKey);
});
playAgainBtn.addEventListener("click", playAgain);
resetBtn.addEventListener("click", resetGame);

modeHuman.addEventListener("click", ()=>{
  vsAI = false; updateModeUI(); playAgain();
});
modeAI.addEventListener("click", ()=>{
  vsAI = true;  updateModeUI(); playAgain();
});

function updateModeUI(){
  modeHuman.classList.toggle("selected", !vsAI);
  modeHuman.setAttribute("aria-pressed", String(!vsAI));
  modeAI.classList.toggle("selected", vsAI);
  modeAI.setAttribute("aria-pressed", String(vsAI));
}

// Keyboard navigation for grid
function onCellKey(e){
  const i = Number(this.dataset.i);
  const r = Math.floor(i/3), c = i%3;
  let target = i;

  switch(e.key){
    case "ArrowLeft": target = r*3 + Math.max(0, c-1); break;
    case "ArrowRight": target = r*3 + Math.min(2, c+1); break;
    case "ArrowUp": target = Math.max(0, (r-1)*3 + c); break;
    case "ArrowDown": target = Math.min(8, (r+1)*3 + c); break;
    case "Enter":
    case " ": this.click(); return;
    default: return;
  }
  e.preventDefault();
  cells[target].focus();
}

function onCellClick(){
  const i = Number(this.dataset.i);
  if (gameOver || board[i]) return;

  place(i, current);

  const result = evaluateBoard(board);
  if (result !== null){
    endGame(result);
    return;
  }

  current = current === "X" ? "O" : "X";
  render();

  if (vsAI && !gameOver && current === "O"){
    setTimeout(()=>{
      const aiMove = bestMove(board, "O");
      place(aiMove, "O");

      const res2 = evaluateBoard(board);
      if (res2 !== null){ endGame(res2); return; }

      current = "X";
      render();
    }, 80);
  }
}

function place(index, mark){
  board[index] = mark;
  render();
}

function endGame(result){
  gameOver = true;
  render();
  if (result === 1) showResult("X wins!");
  else if (result === -1) showResult("O wins!");
  else showResult("It's a draw!");
}

// ---------- Rules & Evaluation ----------
function evaluateBoard(b){
  for (const [a,b1,c] of LINES){
    if (b[a] && b[a] === b[b1] && b[a] === b[c]){
      return b[a] === "X" ? 1 : -1;
    }
  }
  if (b.every(Boolean)) return 0;
  return null;
}

// ---------- AI (Minimax with memo + move ordering) ----------
const memo = new Map();

function bestMove(b, aiMark){
  // AI is 'O'; minimize X's score
  let bestIdx = -1, bestScore = Infinity;
  for (const i of orderedMoves(b)){
    const newB = b.slice(); newB[i] = aiMark;
    const score = minimax(newB, true, 0); // X turn next (maximize)
    if (score < bestScore){ bestScore = score; bestIdx = i; }
  }
  return bestIdx;
}

function minimax(b, isMax, depth){
  const key = b.join("") + (isMax ? "M" : "m");
  if (memo.has(key)) return memo.get(key);

  const evalRes = evaluateBoard(b);
  if (evalRes !== null){
    const scored = evalRes === 1 ? 10 - depth
                 : evalRes === -1 ? depth - 10
                 : 0;
    memo.set(key, scored);
    return scored;
  }

  const moves = orderedMoves(b);
  if (isMax){ // X turn
    let best = -Infinity;
    for (const i of moves){
      const nb = b.slice(); nb[i] = "X";
      best = Math.max(best, minimax(nb, false, depth+1));
    }
    memo.set(key, best); return best;
  } else {    // O turn
    let best = Infinity;
    for (const i of moves){
      const nb = b.slice(); nb[i] = "O";
      best = Math.min(best, minimax(nb, true, depth+1));
    }
    memo.set(key, best); return best;
  }
}

function orderedMoves(b){
  const order = [];
  if (!b[4]) order.push(4);
  [0,2,6,8].forEach(i=>{ if(!b[i]) order.push(i); });
  [1,3,5,7].forEach(i=>{ if(!b[i]) order.push(i); });
  return order;
}
