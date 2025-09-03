// Fixed socketHandle.js with proper WebRTC signaling
let waitingPlayer = null;

module.exports = (io) => {
    io.on('connection', socket => {
        console.log('🔗 New user connected:', socket.id);

        socket.on('playerRole request', () => {
            if (waitingPlayer) {
                const roomName = `room-${waitingPlayer.id}-${socket.id}`;

                // Join both players to the room
                waitingPlayer.join(roomName);
                socket.join(roomName);

                // Assign roles
                io.to(waitingPlayer.id).emit('playerRole response', { role: 'w', room: roomName });
                io.to(socket.id).emit('playerRole response', { role: 'b', room: roomName });

                console.log('🎮 Game room created:', roomName);
                console.log('👤 White player:', waitingPlayer.id);
                console.log('👤 Black player:', socket.id);
                
                waitingPlayer = null;
            } else {
                waitingPlayer = socket;
                console.log('⏳ Player waiting for opponent:', socket.id);
            }
        });

        socket.on('make move', ({ room, move }) => {
            console.log(`♟️ Move in ${room}:`, move);
            socket.to(room).emit('opponentMove', move);
        });

        socket.on('chatMessage', ({ room, message }) => {
            console.log(`💬 Chat in ${room}:`, message);
            socket.to(room).emit('chatMessage', message);
        });

        // 🎯 CRITICAL FIX: Proper WebRTC signaling with detailed logging
        socket.on('video-offer', ({ room, offer }) => {
            console.log(`📤 Relaying video offer in room: ${room}`);
            console.log(`📊 Offer type: ${offer?.type}, SDP length: ${offer?.sdp?.length || 0}`);
            
            // Relay to all other clients in the room
            socket.to(room).emit('video-offer', { room, offer });
        });

        socket.on('video-answer', ({ room, answer }) => {
            console.log(`📤 Relaying video answer in room: ${room}`);
            console.log(`📊 Answer type: ${answer?.type}, SDP length: ${answer?.sdp?.length || 0}`);
            
            // Relay to all other clients in the room
            socket.to(room).emit('video-answer', { room, answer });
        });

        socket.on('ice-candidate', ({ room, candidate }) => {
            console.log(`📤 Relaying ICE candidate in room: ${room}`);
            console.log(`📊 Candidate: ${candidate?.candidate?.substring(0, 50)}...`);
            
            // Relay to all other clients in the room
            socket.to(room).emit('ice-candidate', { room, candidate });
        });

        socket.on('disconnect', () => {
            console.log('❌ Player disconnected:', socket.id);
            
            // Clear waiting player if they disconnect
            if (socket === waitingPlayer) {
                waitingPlayer = null;
                console.log('🧹 Cleared waiting player');
            }
        });
    });
};