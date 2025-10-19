// ==========================
//  OS INVICTOS SERVER ⚽
//  Integra campo tático + AI + Chat do "Treinador Português"
// ==========================

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

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
//  Rota /api/chat – Chat estilo Mourinho
// ==========================
app.post('/api/chat', async (req, res) => {
  const message = req.body.message;
  const apiKey = process.env.RAPIDAPI_KEY;

  if (!apiKey) {
    return res.status(500).json({
      reply: "Erro interno: RAPIDAPI_KEY não configurada no servidor."
    });
  }

  try {
    const rapidResponse = await fetch("https://chatgpt-42.p.rapidapi.com/conversationgpt4", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "chatgpt-42.p.rapidapi.com"
      },
      body: JSON.str

