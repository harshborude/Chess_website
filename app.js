const express = require('express') ;
const socket = require('socket.io') ;
const http = require('http') ;
const path = require('path') ;
const { Chess } = require('chess.js') ;

const app = express() ;

const server = http.createServer(app) ;
const io = socket(server) ;

app.use(express.static(path.join(__dirname,'public'))) ;

app.set("view engine" , 'ejs') ;

const gameRoutes = require('./routes/gameRoutes') ;
app.use('/',gameRoutes) ;


const socketHandlers = require('./sockets/socketHandlers') ;
socketHandlers(io);


const PORT = process.env.PORT || 3000 ;
server.listen(PORT , () => {
  console.log(`Server is running on port ${PORT}`);
}) ;
