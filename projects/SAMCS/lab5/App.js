import React, { useMemo, useState } from "react";
import { SafeAreaView, View, Text, Pressable, StyleSheet, useWindowDimensions } from "react-native";

function checkWin(boardState) {
  var winningCombos = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];

  for (var i = 0; i < winningCombos.length; i++) {
    var a = winningCombos[i][0];
    var b = winningCombos[i][1];
    var c = winningCombos[i][2];

    if (boardState[a] && boardState[a] === boardState[b] && boardState[a] === boardState[c]) {
      return true;
    }
  }
  return false;
}

function isDraw(boardState) {
  for (var i = 0; i < boardState.length; i++) {
    if (!boardState[i]) return false;
  }
  return true;
}

export default function App() {
  var dims = useWindowDimensions();

  var boardWidth = useMemo(function () {
    return Math.min(dims.width * 0.9, 300);
  }, [dims.width]);

  var gap = 10;

  var cellSize = useMemo(function () {
    return Math.floor((boardWidth - gap * 2) / 3);
  }, [boardWidth]);

  var [boardState, setBoardState] = useState(Array(9).fill(null));
  var [currentPlayer, setCurrentPlayer] = useState("X");
  var [statusText, setStatusText] = useState("Player X's Turn");
  var [gameOver, setGameOver] = useState(false);

  function resetGame() {
    setBoardState(Array(9).fill(null));
    setCurrentPlayer("X");
    setStatusText("Player X's Turn");
    setGameOver(false);
  }

  function handleMove(index) {
    if (gameOver) return;
    if (boardState[index]) return;

    var next = boardState.slice();
    next[index] = currentPlayer;

    if (checkWin(next)) {
      setBoardState(next);
      setStatusText("Player " + currentPlayer + " Wins!");
      setGameOver(true);
      return;
    }

    if (isDraw(next)) {
      setBoardState(next);
      setStatusText("It's a Draw!");
      setGameOver(true);
      return;
    }

    var nextPlayer = currentPlayer === "X" ? "O" : "X";
    setBoardState(next);
    setCurrentPlayer(nextPlayer);
    setStatusText("Player " + nextPlayer + "'s Turn");
  }

  function renderCell(index) {
    var row = Math.floor(index / 3);
    var col = index % 3;

    return (
      <Pressable
        key={index}
        onPress={function () { handleMove(index); }}
        disabled={gameOver || !!boardState[index]}
        style={function (p) {
          return [
            styles.cell,
            {
              width: cellSize,
              height: cellSize,
              marginRight: col < 2 ? gap : 0,
              marginBottom: row < 2 ? gap : 0,
              backgroundColor: p.pressed ? "#ddd" : "#fff",
            },
          ];
        }}
      >
        <Text style={[styles.cellText, { fontSize: Math.max(22, Math.floor(cellSize * 0.42)) }]}>
          {boardState[index] ? boardState[index] : ""}
        </Text>
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={styles.body}>
      <View style={styles.container}>
        <Text style={styles.status}>{statusText}</Text>

        <View style={[styles.board, { width: boardWidth }]}>
          {Array(9).fill(null).map((_, i) => renderCell(i))}
        </View>

        <Pressable
          style={function (p) {
            return [styles.button, { backgroundColor: p.pressed ? "#0056b3" : "#007BFF" }];
          }}
          onPress={resetGame}
        >
          <Text style={styles.buttonText}>Restart Game</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

var styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: "#f4f4f4",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    alignItems: "center",
  },
  status: {
    margin: 15,
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
  },
  board: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    borderWidth: 2,
    borderColor: "#333",
    alignItems: "center",
    justifyContent: "center",
  },
  cellText: {
    fontWeight: "700",
  },
  button: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
