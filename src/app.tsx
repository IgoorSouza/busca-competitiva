import { useState } from "react";

type Player = "blue" | "red" | null;
type Board = Player[][];

export default function App() {
  const BOARD_SIZE = 5 as const;
  const aiPlayer = "red" as const;

  const [board, setBoard] = useState<Board>(
    Array(BOARD_SIZE)
      .fill(null)
      .map(() => Array(BOARD_SIZE).fill(null))
  );
  const [currentPlayer, setCurrentPlayer] = useState<"blue" | "red">("blue");
  const [winner, setWinner] = useState<Player>(null);
  const [depth, setDepth] = useState(1);
  const [useAlphaBeta, setUseAlphaBeta] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);

  function handleCellClick(row: number, col: number) {
    if (
      winner ||
      board[row][col] !== null ||
      isAiThinking ||
      currentPlayer === aiPlayer
    )
      return;

    const newBoard = board.map((r) => [...r]);
    newBoard[row][col] = currentPlayer;
    setBoard(newBoard);

    const gameWinner = checkWinner(newBoard);
    if (gameWinner) {
      setWinner(gameWinner);
      return;
    }

    setIsAiThinking(true);

    setTimeout(() => {
      const move = getBestMove(newBoard);

      if (move) {
        const [r, c] = move;
        const aiBoard = newBoard.map((rw) => [...rw]);
        aiBoard[r][c] = aiPlayer;
        setBoard(aiBoard);

        const aiWinner = checkWinner(aiBoard);
        if (aiWinner) {
          setWinner(aiWinner);
        } else {
          setCurrentPlayer("blue");
        }
      }

      setIsAiThinking(false);
    }, 200);
  }

  function getBestMove(board: Board): [number, number] | null {
    const moves = getValidMoves(board);
    let bestMove: [number, number] | null = null;
    let bestScore = -Infinity;

    for (const [r, c] of moves) {
      const newBoard = board.map((rw) => [...rw]);
      newBoard[r][c] = "red";

      const result = minimax(newBoard, depth - 1, false, "red");

      if (result > bestScore) {
        bestScore = result;
        bestMove = [r, c];
      }
    }

    return bestMove;
  }

  function minimax(
    board: Board,
    depth: number,
    maximizing: boolean,
    player: "blue" | "red",
    alpha: number = -Infinity,
    beta: number = Infinity
  ): number {
    const winner = checkWinner(board);
    if (winner || depth === 0) {
      return evaluateBoard(board, player);
    }

    const moves = getValidMoves(board);
    if (moves.length === 0) return evaluateBoard(board, player);

    const opponent = player === "blue" ? "red" : "blue";
    let bestScore = maximizing ? -Infinity : Infinity;

    for (const [r, c] of moves) {
      const newBoard = board.map((rw) => [...rw]);
      newBoard[r][c] = maximizing ? player : opponent;

      const score = minimax(
        newBoard,
        depth - 1,
        !maximizing,
        player,
        alpha,
        beta
      );

      bestScore = maximizing
        ? Math.max(bestScore, score)
        : Math.min(bestScore, score);

      if (useAlphaBeta) {
        if (maximizing) {
          alpha = Math.max(alpha, bestScore);
        } else {
          beta = Math.min(beta, bestScore);
        }

        if (beta <= alpha) break;
      }
    }

    return bestScore;
  }

  function getValidMoves(board: Board): [number, number][] {
    const moves: [number, number][] = [];

    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        if (board[i][j] === null) moves.push([i, j]);
      }
    }

    return moves;
  }

  function evaluateBoard(board: Board, player: "blue" | "red"): number {
    const opponent = player === "blue" ? "red" : "blue";
    return (
      shortestConnection(board, opponent) - shortestConnection(board, player)
    );
  }

  function shortestConnection(board: Board, player: Player): number {
    const visited = Array(BOARD_SIZE)
      .fill(null)
      .map(() => Array(BOARD_SIZE).fill(false));
    const queue: { row: number; col: number; dist: number }[] = [];

    if (player === "blue") {
      for (let r = 0; r < BOARD_SIZE; r++) {
        if (board[r][0] !== "red") queue.push({ row: r, col: 0, dist: 0 });
      }
    } else if (player === "red") {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (board[0][c] !== "blue") queue.push({ row: 0, col: c, dist: 0 });
      }
    }

    while (queue.length > 0) {
      const { row, col, dist } = queue.shift()!;
      if (visited[row][col]) continue;
      visited[row][col] = true;

      if (
        (player === "blue" && col === BOARD_SIZE - 1) ||
        (player === "red" && row === BOARD_SIZE - 1)
      ) {
        return dist;
      }

      for (const [nr, nc] of getNeighbors(row, col)) {
        if (visited[nr][nc]) continue;
        const cell = board[nr][nc];

        if (cell === player) {
          queue.push({ row: nr, col: nc, dist });
        } else if (cell === null) {
          queue.push({ row: nr, col: nc, dist: dist + 1 });
        }
      }
    }

    return BOARD_SIZE * 2;
  }

  function getNeighbors(row: number, col: number): [number, number][] {
    const directions = [
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
    ];

    return directions
      .map(([dr, dc]) => [row + dr, col + dc] as [number, number])
      .filter(([r, c]) => r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE);
  }

  function checkWinner(board: Board): Player {
    if (checkIfPlayerWon("blue", board)) return "blue";
    if (checkIfPlayerWon("red", board)) return "red";
    return null;
  }

  function checkIfPlayerWon(player: Player, board: Board) {
    const visited = Array(BOARD_SIZE)
      .fill(null)
      .map(() => Array(BOARD_SIZE).fill(false));

    if (player === "blue") {
      for (let row = 0; row < BOARD_SIZE; row++) {
        if (board[row][0] === "blue" && !visited[row][0]) {
          if (dfs(row, 0, player, visited, board)) return true;
        }
      }
    } else if (player === "red") {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (board[0][col] === "red" && !visited[0][col]) {
          if (dfs(0, col, player, visited, board)) return true;
        }
      }
    }

    return false;
  }

  function dfs(
    row: number,
    col: number,
    player: Player,
    visited: boolean[][],
    board: Board
  ): boolean {
    if (
      (player === "blue" && col === BOARD_SIZE - 1) ||
      (player === "red" && row === BOARD_SIZE - 1)
    ) {
      return true;
    }

    visited[row][col] = true;

    for (const [nr, nc] of getNeighbors(row, col)) {
      if (!visited[nr][nc] && board[nr][nc] === player) {
        if (dfs(nr, nc, player, visited, board)) return true;
      }
    }

    return false;
  }

  function resetGame() {
    setBoard(
      Array(BOARD_SIZE)
        .fill(null)
        .map(() => Array(BOARD_SIZE).fill(null))
    );
    setCurrentPlayer("blue");
    setWinner(null);
    setIsAiThinking(false);
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-100 mb-2">HEX Game</h1>
          <p className="text-gray-400">
            Implementação com Minimax e Poda Alfa-Beta
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-gray-100 mb-4 flex items-center gap-2">
                Configurações
              </h2>

              <div className="space-y-4">
                <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-3 text-center font-semibold">
                  <p className="text-gray-200 text-sm">
                    Você joga como{" "}
                    <span className="font-bold text-blue-400">AZUL</span>
                  </p>
                  <p className="text-gray-200 text-sm">
                    IA joga como{" "}
                    <span className="font-bold text-red-400">VERMELHO</span>
                  </p>
                </div>

                <div>
                  <label className="text-gray-200 text-sm mb-2 block font-semibold">
                    Profundidade: {depth}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="4"
                    value={depth}
                    onChange={(e) => setDepth(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-gray-200 cursor-pointer text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={useAlphaBeta}
                      onChange={(e) => setUseAlphaBeta(e.target.checked)}
                      className="w-4 h-4"
                    />
                    Usar Poda Alfa-Beta
                  </label>
                </div>

                <button
                  onClick={resetGame}
                  className="w-full py-3 px-4 bg-gray-700 text-gray-100 rounded-lg font-semibold hover:bg-gray-600 transition"
                >
                  Novo Jogo
                </button>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-gray-100 font-bold mb-3">Objetivo</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <p className="font-semibold">
                  <span className="text-blue-500">Azul</span>: Conectar esquerda
                  → direita
                </p>
                <p className="font-semibold">
                  <span className="text-red-500 font-semibold">Vermelho</span>:
                  Conectar topo → baixo
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
              <div className="mb-4 text-center">
                {winner ? (
                  <div className="text-2xl font-bold">
                    <span
                      className={
                        winner === "blue" ? "text-blue-400" : "text-red-400"
                      }
                    >
                      Jogador {winner === "blue" ? "Azul" : "Vermelho"} venceu!
                    </span>
                  </div>
                ) : (
                  <div className="text-xl font-semibold text-gray-100">
                    {isAiThinking ? (
                      <span className="text-gray-400">IA pensando...</span>
                    ) : (
                      <>
                        Turno:{" "}
                        <span
                          className={
                            currentPlayer === "blue"
                              ? "text-blue-400"
                              : "text-red-400"
                          }
                        >
                          {currentPlayer === "blue" ? "Azul" : "Vermelho"}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="h-3 bg-blue-500 rounded-t-lg mb-2"></div>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 bg-red-500 rounded-l-lg"
                  style={{ height: `${BOARD_SIZE * 70}px` }}
                ></div>

                <div className="flex-1 flex flex-col items-center">
                  {board.map((row, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        marginLeft: `${i * 35}px`,
                        marginBottom: "-8px",
                      }}
                    >
                      {row.map((cell, j) => (
                        <div
                          key={`${i}-${j}`}
                          onClick={() => handleCellClick(i, j)}
                          className={`w-16 h-16 m-1 flex items-center justify-center cursor-pointer transition-all ${
                            cell === null
                              ? "bg-gray-700 hover:bg-gray-600"
                              : cell === "blue"
                              ? "bg-blue-500"
                              : "bg-red-500"
                          }`}
                          style={{
                            clipPath:
                              "polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)",
                            opacity: isAiThinking && cell === null ? 0.5 : 1,
                          }}
                        >
                          {cell && (
                            <div className="w-10 h-10 rounded-full bg-white/20"></div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                <div
                  className="w-3 bg-red-500 rounded-r-lg"
                  style={{ height: `${BOARD_SIZE * 70}px` }}
                ></div>
              </div>
              <div className="h-3 bg-blue-500 rounded-b-lg mt-2"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
