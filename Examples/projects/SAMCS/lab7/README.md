# Tic-Tac-Toe (LAN / Local Network)

This is your original Tic-Tac-Toe UI, upgraded to a **LAN multiplayer** version (2 players) using a tiny Node.js + WebSocket server.

## 1) Install Node dependencies

```bash
npm install
```

## 2) Start the server

```bash
npm start
```

It will run on port **3000**.

## 3) Open the game on two devices (same Wi‑Fi / LAN)

- On the server machine:
  - `http://localhost:3000`

- On another device in the same local network:
  - `http://<YOUR_LAN_IP>:3000`

Example LAN IPs often look like:
- `192.168.1.50`
- `10.0.0.12`

## Notes
- First person to connect becomes **Player X**.
- Second person becomes **Player O**.
- Anyone else becomes **Spectator**.
- "Restart Game" resets the board for everyone.
