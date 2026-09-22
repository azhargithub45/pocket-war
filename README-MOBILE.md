# Mobile-only deployment

1. Create a GitHub repository from your phone.
2. Upload these 3 files to the repository root:
   - server.js
   - package.json
   - index.html
3. In Render, create New -> Web Service and connect the GitHub repo.
4. Runtime: Node.
5. Build Command: npm install
6. Start Command: npm start
7. Deploy.
8. Open the generated `https://....onrender.com` URL on both phones.
9. Player 1: CREATE ROOM. Share the 5-character code.
10. Player 2: enter code and JOIN ROOM.

Render supports inbound WebSockets. Public internet WebSockets use `wss://`; the app automatically uses `wss` when opened over HTTPS.
