// sockets/socketHandlers.js

// Fixed socketHandler.js with proper WebRTC signaling AND Reconnection Logic
let waitingPlayer = null;

module.exports = (io) => {
    io.on('connection', socket => {
        console.log('🔗 New user connected:', socket.id);

        // --- MATCHMAKING LOGIC ---
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

        // --- NEW: RECONNECTION LOGIC ---
        socket.on('rejoin request', ({ room, role }) => {
            console.log(`Player ${socket.id} rejoining room: ${room}`);
            
            // 1. Join the socket to the old room
            socket.join(room);
            
            // 2. Tell the client they are good to go
            socket.emit("playerRole response", { role: role, room: room });
            
            // 3. Request board state from the other player in the room
            // (Since the server is stateless, we need the peer to tell us the board)
            socket.to(room).emit("request board state");
            
            // Optional: Notify opponent
            socket.to(room).emit("chat message", "Opponent has reconnected.");
        });

        // --- NEW: SYNC BOARD STATE ---
        socket.on("sync board state", ({ room, fen }) => {
            // Relay the board state (FEN) to the rejoining player
            socket.to(room).emit("update board", fen);
        });


        // --- GAMEPLAY LOGIC ---
        socket.on('make move', ({ room, move }) => {
            console.log(`♟️ Move in ${room}:`, move);
            socket.to(room).emit('opponentMove', move);
        });

        socket.on('chat message', (msg) => {
             // Note: In your original main.js you emitted 'chat message' with just the string
             // But in socketHandlers you were listening for 'chatMessage' object.
             // I've standardized it here to match your original main.js emit 
             // Ideally you should pass the room ID in the chat emit too.
             
             // Assuming your main.js sends just the message string, we broadcast to everyone (global)
             // OR simpler: just broadcast to all other clients if you don't have room in msg
             socket.broadcast.emit('response message', msg);
             
             // IF you update main.js to send { room, msg }, use:
             // socket.to(room).emit('response message', msg);
        });
        
        // Listener for the object version if you implemented that update
        socket.on('chatMessage', ({ room, message }) => {
            console.log(`💬 Chat in ${room}:`, message);
            socket.to(room).emit('chatMessage', message);
        });

        // --- WEBRTC SIGNALING ---
        socket.on('video-offer', ({ room, offer }) => {
            console.log(`📤 Relaying video offer in room: ${room}`);
            socket.to(room).emit('video-offer', { room, offer });
        });

        socket.on('video-answer', ({ room, answer }) => {
            console.log(`📤 Relaying video answer in room: ${room}`);
            socket.to(room).emit('video-answer', { room, answer });
        });

        socket.on('ice-candidate', ({ room, candidate }) => {
            console.log(`📤 Relaying ICE candidate in room: ${room}`);
            socket.to(room).emit('ice-candidate', { room, candidate });
        });

        // --- DISCONNECT LOGIC ---
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