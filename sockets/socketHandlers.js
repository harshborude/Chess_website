let waitingPlayer = null ; 

module.exports = (io) => {
    io.on('connection' , socket => {
        console.log('A new user connected: ' , socket.id ) ;

        socket.on('playerRole request' , () => {
            if(waitingPlayer) {
                const roomName = `room-${waitingPlayer.id}-${socket.id}` ;

                waitingPlayer.join(roomName) ;
                socket.join(roomName) ;

                io.to(waitingPlayer.id).emit('playerRole response' , {role: 'w' , room: roomName}) ;
                io.to(socket.id).emit('playerRole response' , {role: 'b' , room: roomName}) ;

                console.log('Room created: ',roomName) ;
                waitingPlayer = null ;
            } else {
                waitingPlayer = socket ; 
                console.log('player waiting for an opponent: ' , socket.id) ;
            }
        })

        socket.on('make move' , ({room , move}) => {
            console.log(`Move received in ${room}:`, move);
            socket.to(room).emit('opponentMove', move);
        })

        socket.on('chatMessage' , ({ room ,  message }) =>{
            console.log(`message received in ${room}:`, message);
            socket.to(room).emit('chatMessage' , message) ;
        } ) 

        socket.on('disconnect', () => {
            console.log('Player disconnected:', socket.id);
            if (socket === waitingPlayer) {
                waitingPlayer = null;
            }
        });
    })
}