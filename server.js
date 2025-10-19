// ==========================
//  OS INVICTOS SERVER ⚽
//  Integra campo tático + AI + Chat do "Treinador Português"
// ==========================

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bodyParser = require('body-parser');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ==========================
//  Socket.IO – Sincroniza posições e desenhos no campo
// ==========================
io.on('connection', (socket) => {
  console.log('🔌 Novo cliente conectado');

  socket.on('move_circle', (data) => {
    socket.broadcast.emit('update_circle', data);
  });

  socket.on('path_draw', (data) => {
    socket.broadcast.emit('path_draw', data);
  });

  socket.on('disconnect', () => {
    console.log('❌ Cliente desconectado');
  });
});

// ==========================
//  Middleware e assets
// ==========================
app.use(bodyParser.json());
app.use(express.static(__dirname));

// ==========================
//  Rota /ai/analyze – posicionamento do time
// ==========================
app.post('/ai/analyze', (req, res) => {
  const ball = req.body.ball;
  const green = req.body.green;
  const red = [];

  // Gera posições do time vermelho espelhando o verde
  for (let i = 0; i < 10; i++) {
    const g = green[i];
    if (g) {
      red.push({
        id: 13 + i,
        left: 600 - g.left,
        top: g.top
      });
    }
  }

  // Faz o atacante marcar o jogador com a bola
  red[8] = {
    id: 21,
    left: ball.left - 9,
    top: ball.top
  };

  res.json({ red });
});
// ==========================
//  Rota /api/chat – Chat estilo Mourinho (via OpenRouter)
// ==========================
app.post('/api/chat', async (req, res) => {
  const message = req.body.message;
  const apiKey = process.env.OPENROUTER_KEY;

  if (!apiKey) {
    return res.status(500).json({
      reply: "Erro interno: OPENROUTER_KEY não configurada."
    });
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // leve e rápido
        messages: [
          {
            role: "system",
            content: "Tu és um treinador português lendário, sarcástico, confiante e direto. Foste campeão no Porto, Chelsea, Inter, Real Madrid e Manchester United. Fala com autoridade, ironia e sempre como se fosses o centro das atenções."
          },
          { role: "user", content: message }
        ],
        max_tokens: 200,
        temperature: 0.9
      }),
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || "O mister não tem tempo pra conversa fiada.";
    console.log("🧠 Chatbot respondeu:", reply);
    res.json({ reply });
  } catch (err) {
    console.error("Erro no OpenRouter:", err);
    res.json({ reply: "O mister não respondeu... deve estar irritado com o árbitro." });
  }
});

// ==========================
//  Inicia servidor
// ==========================
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`🏟️  Servidor rodando na porta ${PORT}`);
});

