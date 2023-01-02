// Importamos express para trabajar con peticiones
const express = require('express');
// Importamos path para trabajar con archivos
const path = require('path');
// Importamos http para levantar un servidor
const http = require('http');
// Definimos una constante, que por ser constante va en mayusculas
// además intentamos traer el valor de la constante de una variable de ambiente
// pero si no está definida, entonces se asigna el valor 3000
const PORT = process.env.PORT || 3000;
// Importamos socket.io para trabajar con comunicaciones mediante sockets
const socket = require('socket.io');

// Instanciamos express
const app = express();
// Creamos una instancia del server
const server = http.createServer(app);
// Creamos una instancia del manejados de sockets en el server
const io = socket(server);

// Se le dice a express use la carpeta public como estatico, para facilitar el 
// acceso
app.use(express.static("public"));

// Inicialización del servidor
server.listen(PORT, () => {
    console.log("Servidor inicializado en el puerto %s", PORT);
});

// Vamos a crear un array para registrar las conexiones al juego
const connections = [null, null];

// Empezamos a codificar la respuesta a los eventos del socket
io.on('connection', socket => {
    // Inicializamos un contados de jugadores conectados
    let playerIndex = -1;

    for (const i in connections) {
        if(connections[i] === null) {
            playerIndex = i;
            console.log(connections);
            break;
        }
    }

    socket.emit('player-number', playerIndex);

    console.log(`Jugador ${playerIndex} se ha conectado.`);
    
    if (playerIndex === -1) return;
    connections[playerIndex] = false;
    
    socket.broadcast.emit('player-connection', playerIndex);
    
    socket.on('disconnect', () => {
        console.log(`Jugador ${playerIndex} se ha desconectado.`);
        connections[playerIndex] = null;
        socket.broadcast.emit('player-connection', playerIndex);
    });

    socket.on('player-ready', () => {
        socket.broadcast.emit('enemy-ready', playerIndex);
        connections[playerIndex] = true;
    });

    socket.on('check-players', () => {
        const players = [];
        for (const i in connections) {
            connections[i] === null ? 
                players.push({connected: false, ready: false}) :
                players.push({connected: true, ready: connections[i]});
        }
        socket.emit('check-players', players);
    });

    socket.on('fire', id => {
        console.log(`Disparo de ${playerIndex}`, id);
        socket.broadcast('fire', id);
    });

    socket.on('fire-reply', square => {
        console.log(square);
        socket.broadcast('fire-reply', square);
    });

    setTimeout(() => {
        connections[playerIndex] = null;
        socket.emit('timeout');
        socket.disconnect();
    }, 600000);
});