import tkinter as tk
from functools import partial

# Winning combos (same as your JS) :contentReference[oaicite:3]{index=3}
WINNING_COMBOS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
]

def main():
    # --- Window (similar to body background) :contentReference[oaicite:4]{index=4}
    root = tk.Tk()
    root.title("Tic-Tac-Toe")
    root.configure(bg="#f4f4f4")

    # Container (like .container column centered) :contentReference[oaicite:5]{index=5}
    container = tk.Frame(root, bg="#f4f4f4")
    container.pack(expand=True)

    # --- Status (like #status) 
    status_var = tk.StringVar(value="Player X's Turn")
    status_label = tk.Label(container, textvariable=status_var, bg="#f4f4f4", font=("Arial", 16))
    status_label.pack(pady=15)

    # --- Board (like .board grid) 
    board_frame = tk.Frame(container, bg="#f4f4f4")
    board_frame.pack()

    # --- Restart button (like HTML button + CSS) 
    restart_btn = tk.Button(
        container,
        text="Restart Game",
        font=("Arial", 12),
        bg="#007BFF",
        fg="white",
        bd=0,
        padx=20,
        pady=10,
        cursor="hand2",
        activebackground="#0056b3",
        activeforeground="white",
    )
    restart_btn.pack(pady=20)

    # Button hover (matches button:hover idea) :contentReference[oaicite:9]{index=9}
    def on_btn_enter(_event):
        restart_btn.configure(bg="#0056b3")

    def on_btn_leave(_event):
        restart_btn.configure(bg="#007BFF")

    restart_btn.bind("<Enter>", on_btn_enter)
    restart_btn.bind("<Leave>", on_btn_leave)

    # --- Game state (same idea as JS variables) :contentReference[oaicite:10]{index=10}
    state = {
        "current_player": "X",
        "board_state": [None] * 9,
        "buttons": []
    }

    # --- Functions (mirror your JS structure) :contentReference[oaicite:11]{index=11}
    def check_win():
        for combo in WINNING_COMBOS:
            a, b, c = combo
            bs = state["board_state"]
            if bs[a] and bs[a] == bs[b] and bs[a] == bs[c]:
                return True
        return False

    def disable_board():
        for btn in state["buttons"]:
            btn.configure(state="disabled")

    def handle_move(index):
        bs = state["board_state"]
        if bs[index] is not None:
            return

        player = state["current_player"]
        bs[index] = player

        btn = state["buttons"][index]
        btn.configure(text=player, state="disabled")

        if check_win():
            status_var.set(f"Player {player} Wins!")
            disable_board()
            return

        if all(cell is not None for cell in bs):
            status_var.set("It's a Draw!")
            return

        # switch player (same as JS ternary) :contentReference[oaicite:12]{index=12}
        state["current_player"] = "O" if player == "X" else "X"
        status_var.set(f"Player {state['current_player']}'s Turn")

    def create_board():
        # clear old buttons (like board.innerHTML="") :contentReference[oaicite:13]{index=13}
        for w in board_frame.winfo_children():
            w.destroy()

        state["buttons"] = []

        # 3x3 cells (like .cell in CSS) :contentReference[oaicite:14]{index=14}
        for i in range(9):
            btn = tk.Button(
                board_frame,
                text="",
                font=("Arial", 24),
                width=4,      # simple sizing; the look matches “big square cells”
                height=2,
                bg="white",
                activebackground="#ddd",   # .cell:active :contentReference[oaicite:15]{index=15}
                bd=2,
                relief="solid",
                cursor="hand2",
                command=partial(handle_move, i)  # beginner-friendly: no lambda
            )
            row = i // 3
            col = i % 3
            btn.grid(row=row, column=col, padx=5, pady=5, sticky="nsew")
            state["buttons"].append(btn)

        for r in range(3):
            board_frame.grid_rowconfigure(r, weight=1)
        for c in range(3):
            board_frame.grid_columnconfigure(c, weight=1)

    def reset_game():
        state["board_state"] = [None] * 9
        state["current_player"] = "X"
        status_var.set("Player X's Turn")  # same as HTML/JS default 
        create_board()

    restart_btn.configure(command=reset_game)

    # start (like createBoard() at the bottom) :contentReference[oaicite:17]{index=17}
    create_board()
    root.mainloop()

if __name__ == "__main__":
    main()
