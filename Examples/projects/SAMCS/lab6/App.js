import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaView, View, Text, Pressable, StyleSheet, useWindowDimensions } from "react-native";
import * as tf from "@tensorflow/tfjs";

export default function App() {
  var dims = useWindowDimensions();

  // ===== UI sizing to match: width: min(90vw, 300px), gap: 10px, cells ~100px =====
  var boardWidth = useMemo(function () {
    return Math.min(dims.width * 0.9, 300);
  }, [dims.width]);

  var gap = 10;

  var cellSize = useMemo(function () {
    // 3 cells + 2 gaps = boardWidth
    return Math.floor((boardWidth - gap * 2) / 3);
  }, [boardWidth]);

  // ===== Game state =====
  var [board, setBoard] = useState(Array(9).fill(null));
  var [isXNext, setIsXNext] = useState(true);
  var [gameStatus, setGameStatus] = useState(null);

  // ===== AI state =====
  var [model, setModel] = useState(null);
  var [isTraining, setIsTraining] = useState(true);

  function calculateWinner(squares) {
    var lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];

    for (var i = 0; i < lines.length; i++) {
      var a = lines[i][0];
      var b = lines[i][1];
      var c = lines[i][2];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  }

  function resetGame() {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setGameStatus(null);
  }

  // ===== 1) Train AI once =====
  useEffect(() => {
    async function trainAIModel() {
      setIsTraining(true);

      await tf.ready();

      var m = tf.sequential();
      m.add(tf.layers.dense({ inputShape: [9], units: 64, activation: "relu" }));
      m.add(tf.layers.dense({ units: 32, activation: "relu" }));
      m.add(tf.layers.dense({ units: 9, activation: "softmax" }));

      m.compile({ optimizer: "adam", loss: "categoricalCrossentropy" });

      // simple random training data (demo)
      var inputs = [];
      var outputs = [];
      for (var i = 0; i < 2000; i++) {
        var state = Array(9).fill(null).map(() => (Math.random() > 0.5 ? "X" : "O"));

        var move = Math.floor(Math.random() * 9);
        var output = Array(9).fill(0);
        output[move] = 1;

        inputs.push(state.map((cell) => (cell === "X" ? 1 : cell === "O" ? -1 : 0)));
        outputs.push(output);
      }

      var xs = tf.tensor2d(inputs);
      var ys = tf.tensor2d(outputs);

      await m.fit(xs, ys, { epochs: 20, batchSize: 32 });

      xs.dispose();
      ys.dispose();

      setModel(m);
      setIsTraining(false);
    }

    trainAIModel();
  }, []);

  // ===== 2) AI move when it's O's turn =====
  useEffect(() => {
    if (!isXNext && !gameStatus && model && !isTraining) {
      async function handleAIMove() {
        var inputArray = board.map((cell) => (cell === "X" ? 1 : cell === "O" ? -1 : 0));
        var inputTensor = tf.tensor2d([inputArray]);

        var prediction = model.predict(inputTensor);
        var predictionData = await prediction.data();

        inputTensor.dispose();
        prediction.dispose();

        var bestIndex = -1;
        var bestValue = -Infinity;

        for (var i = 0; i < 9; i++) {
          if (board[i] !== null) continue;
          if (predictionData[i] > bestValue) {
            bestValue = predictionData[i];
            bestIndex = i;
          }
        }

        if (bestIndex === -1) {
          bestIndex = board.findIndex((v) => v === null);
        }

        if (bestIndex !== -1) {
          var newBoard = board.slice();
          newBoard[bestIndex] = "O";
          setBoard(newBoard);
          setIsXNext(true);

          var winner = calculateWinner(newBoard);
          if (winner) setGameStatus("Player " + winner + " Wins!");
          else if (!newBoard.includes(null)) setGameStatus("It's a Draw!");
        }
      }

      handleAIMove();
    }
  }, [isXNext, gameStatus, board, model, isTraining]);

  function handlePress(index) {
    if (!isXNext) return;           // only human plays X
    if (gameStatus) return;
    if (isTraining) return;
    if (board[index]) return;

    var newBoard = board.slice();
    newBoard[index] = "X";
    setBoard(newBoard);
    setIsXNext(false);

    var winner = calculateWinner(newBoard);
    if (winner) setGameStatus("Player " + winner + " Wins!");
    else if (!newBoard.includes(null)) setGameStatus("It's a Draw!");
  }

  var statusText = useMemo(function () {
    if (isTraining) return "Training AI model...";
    if (gameStatus) return gameStatus;
    return isXNext ? "Player X's Turn" : "Player O's Turn";
  }, [isTraining, gameStatus, isXNext]);

  function renderCell(index) {
    var row = Math.floor(index / 3);
    var col = index % 3;

    return (
      <Pressable
        key={index}
        onPress={function () { handlePress(index); }}
        disabled={!isXNext || !!gameStatus || !!board[index] || isTraining}
        style={function (p) {
          return [
            styles.cell,
            {
              width: cellSize,
              height: cellSize,
              marginRight: col < 2 ? gap : 0,
              marginBottom: row < 2 ? gap : 0,
              backgroundColor: p.pressed ? "#ddd" : "#fff", // like .cell:active
              opacity: (!isXNext || !!gameStatus || !!board[index] || isTraining) ? 0.9 : 1,
            },
          ];
        }}
      >
        <Text style={[styles.cellText, { fontSize: Math.max(22, Math.floor(cellSize * 0.42)) }]}>
          {board[index] ? board[index] : ""}
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
          onPress={resetGame}
          style={function (p) {
            return [styles.button, { backgroundColor: p.pressed ? "#0056b3" : "#007BFF" }];
          }}
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
