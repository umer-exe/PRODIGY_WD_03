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

const HUMAN = "X";
const AI = "O";
const LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

init();

// ---------- Init / Reset ----------
function init(){
  board = Array(9).fill(null);
  current = HUMAN;        // X always starts (per your earlier spec)
  gameOver = false;
  vsAI = false;           // default mode: Human vs Human

  // Hide any lingering result UI
  resultBanner.hidden = true;
  playAgainBtn.hidden = true;
  resultText.textContent = "";

  updateModeUI();
  render();
}

function playAgain(){
  board.fill(null);
  current = HUMAN;
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

  let outcome = evaluate(board);
  if (outcome !== null){ endGame(outcome); return; }

  current = current === HUMAN ? AI : HUMAN;
  render();

  if (vsAI && !gameOver && current === AI){
    // Small delay to feel natural
    setTimeout(()=>{
      const iBest = computeBestMove(board, AI);
      place(iBest, AI);

      outcome = evaluate(board);
      if (outcome !== null){ endGame(outcome); return; }

      current = HUMAN;
      render();
    }, 80);
  }
}

function place(index, mark){
  board[index] = mark;
  render();
}

function endGame(outcome){
  gameOver = true;
  render();
  if (outcome === HUMAN) showResult("X wins!");
  else if (outcome === AI) showResult("O wins!");
  else showResult("It's a draw!");
}

// ---------- Rules ----------
function evaluate(b){
  for (const [a,b1,c] of LINES){
    if (b[a] && b[a] === b[b1] && b[a] === b[c]) return b[a]; // 'X' or 'O'
  }
  if (b.every(Boolean)) return "draw";
  return null;
}

// ---------- AI: Unbeatable Minimax ----------
function computeBestMove(b, aiMark){
  // If first move, choose center if available for speed/strength
  if (b.every(x => x === null) && b[4] === null) return 4;

  let bestIndex = -1;
  let bestScore = -Infinity; // from AI's perspective

  // Try moves in good order (center -> corners -> edges)
  for (const i of orderedMoves(b)){
    if (b[i] != null) continue;
    const nb = b.slice();
    nb[i] = aiMark;
    const score = minimax(nb, false, 0); // next is human
    if (score > bestScore){
      bestScore = score;
      bestIndex = i;
    }
  }
  return bestIndex;
}

// minimax returns score from AI's perspective
// +10 (fast) for AI win, -10 (slow) for Human win, 0 for draw
function minimax(b, aiTurn, depth){
  const res = evaluate(b);
  if (res !== null){
    if (res === AI)   return 10 - depth;   // prefer quicker wins
    if (res === HUMAN) return depth - 10;  // prefer slower losses
    return 0;
  }

  const moves = orderedMoves(b);
  if (aiTurn){ // AI to play -> maximize
    let best = -Infinity;
    for (const i of moves){
      if (b[i] != null) continue;
      const nb = b.slice();
      nb[i] = AI;
      best = Math.max(best, minimax(nb, false, depth+1));
    }
    return best;
  } else {     // Human to play -> minimize
    let best = Infinity;
    for (const i of moves){
      if (b[i] != null) continue;
      const nb = b.slice();
      nb[i] = HUMAN;
      best = Math.min(best, minimax(nb, true, depth+1));
    }
    return best;
  }
}

// Prefer center -> corners -> edges
function orderedMoves(b){
  const out = [];
  if (b[4] == null) out.push(4);
  [0,2,6,8].forEach(i => { if (b[i] == null) out.push(i); });
  [1,3,5,7].forEach(i => { if (b[i] == null) out.push(i); });
  return out;
}
