// General Utility modules
const path = require('path');
const fs = require('fs');
// For the HTTP server
const express = require('express');
const app = express();
const http = require('http').createServer(app);
// Import the Nunjucks package
const nunjucks = require('nunjucks');

// Start the socket server
const { Server, Socket } = require('socket.io');
const io = new Server(http, {
	// Allow cross origin requests
	// This allows for third party clients for the chat
	cors: {
		// The `*` is used as the wildcard here.
		origin: '*',
		methods: ['GET', 'POST'],
		allowedHeaders: ['content-type'],
	},
});

// Set nunjucks as the render engine
nunjucks.configure('views', {
	autoescape: true,
	express: app,
});
app.set('view engine', 'html');

// Tell the server what port it should use. 8080 is for testing purposes
const PORT = parseInt(process.env.PORT) || 8080;

// Set up the parser for requests that are json type
app.use(require('body-parser').json('application/json'));

// Use the public directory for files
app.use('/public', express.static(path.join(__dirname, 'public')));

// GAME DATA

let Game = {};

Game.currentMap = 'placeholder.png';

Game.getCurrentMap = function () {
	return '/public/assets/map/' + this.currentMap;
};

Game.setCurrentMap = function (mapFile) {
	this.currentMap = mapFile;
};

// SERVER RESPONSES

app.get('/', function (req, res) {
	res.status(200).render('index');
});

// SOCKET IO RESPONSES

// On socket connection
io.on('connection', (socket) => {
	console.log(socket.id + ' connected');

	socket.join('universal');

	socket.on('disconnect', () => {
		console.log(socket.id + ' disconnected');
	});
});

http.listen(PORT, function () {
	console.log('Listening on *:', PORT);
});
