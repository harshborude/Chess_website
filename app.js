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
// let waitingPlayer = null ;

// io.on('connection' , socket => {//socket ak unnique info he us bande ki
//     console.log('a new user connected: ' , socket.id) ;

//     socket.on('playerRole request' , () => {
//         if(waitingPlayer) {
//             const roomName = `room-${waitingPlayer.id}-${socket.id}` ;

//             waitingPlayer.join(roomName) ;
//             socket.join(roomName) ;

//             io.to(waitingPlayer.id).emit("playerRole response" , { role: 'w' , room: roomName}) ;
//             io.to(socket.id).emit("playerRole response" , { role: 'b' , room: roomName}) ;

//             console.log(`Room created: ${roomName}`) ;
//             waitingPlayer = null 
//         }else{
//             waitingPlayer = socket ;
//             // socket.emit('playerRole response' , 'w') ; //you can add WAIT featcher on here
//             console.log("Player waiting for an opponent:", socket.id) ;
//         }
//     })

//     socket.on('make move' , ({ room , move})=>{
//         console.log(`Move received in ${room}:`, move);

//         // Broadcast the move to the other player in the same room
//         socket.to(room).emit("opponentMove", move);
//     })

//     socket.on('chat message' , (msg) => {
//         socket.broadcast.emit('response message' , msg) ;
//     })

//     socket.on('disconnect' , ()=>{
//         // console.log("disconnect" , socket )
//         console.log("Player disconnected:", socket.id);
//         if (socket === waitingPlayer) {
//             waitingPlayer = null; // Clear the waiting player if they disconnect
//         }
//     })
// })


server.listen(3000) ;
