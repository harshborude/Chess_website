// 🔥 FINAL FIXED video.js - OPPONENT VIDEO WILL WORK!
console.log("🚀🚀🚀🚀 Starting WebRTC video.js...");

const socket = io(); // Initialize socket.io connection

// 🎯 CRITICAL FIX: Use unique variable names to avoid conflicts with game.js
let localStream = null;
let peerConnection = null;
let videoCurrentRoom = null;  // 🔴 RENAMED to avoid conflict with game.js
let videoPlayerRole = null;   // 🔴 RENAMED to avoid conflict with game.js
let isInitiator = false;

const config = { 
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }
    ] 
};

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

// Make streams globally accessible for debugging
window.localStream = null;
window.peerConnection = null;

// Initialize media immediately when page loads
async function initializeMedia() {
    try {
        console.log("🎥 Requesting camera and microphone access...");
        localStream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 320, height: 240 }, // Optimize video size
            audio: true 
        });
        
        // Make globally accessible
        window.localStream = localStream;
        
        if (localVideo) {
            localVideo.srcObject = localStream;
            localVideo.muted = true; // Prevent echo
            console.log("✅ Local video stream attached successfully");
        } else {
            console.error("❌ localVideo element not found!");
        }
        
        return true;
    } catch (error) {
        console.error("❌ Failed to get user media:", error);
        alert("Please allow camera and microphone access to use video chat!");
        return false;
    }
}

// Create peer connection with proper event handlers
function createPeerConnection() {
    console.log("🔗 Creating new RTCPeerConnection...");
    console.log("🏠 Video current room:", videoCurrentRoom);
    
    const pc = new RTCPeerConnection(config);
    window.peerConnection = pc; // Make globally accessible
    
    // Handle ICE candidates
    pc.onicecandidate = (event) => {
        console.log("🧊 ICE candidate event:", event.candidate ? "Found" : "End");
        if (event.candidate && videoCurrentRoom) {
            console.log("📤 Sending ICE candidate to room:", videoCurrentRoom);
            socket.emit("ice-candidate", { 
                room: videoCurrentRoom, 
                candidate: event.candidate 
            });
        } else if (!videoCurrentRoom) {
            console.error("❌ Cannot send ICE candidate - videoCurrentRoom is null!");
        }
    };
    
    // 🎯 CRITICAL FIX: Enhanced remote stream handling
    pc.ontrack = (event) => {
        console.log("📺 🎉 RECEIVED REMOTE TRACK:", event.track.kind);
        console.log("📺 Remote streams count:", event.streams.length);
        
        if (event.streams && event.streams[0]) {
            const [remoteStream] = event.streams;
            console.log("📺 Remote stream tracks:", remoteStream.getTracks().length);
            
            if (remoteVideo) {
                remoteVideo.srcObject = remoteStream;
                console.log("✅ 🎉 REMOTE VIDEO STREAM ATTACHED SUCCESSFULLY!");
                
                // 🎯 CRITICAL: Force video to play
                remoteVideo.play().then(() => {
                    console.log("🎉 Remote video is playing!");
                }).catch(e => {
                    console.log("⚠️ Auto-play prevented, trying to enable:", e);
                    // Try to play after user interaction
                    document.addEventListener('click', () => {
                        remoteVideo.play();
                    }, { once: true });
                });
            } else {
                console.error("❌ remoteVideo element not found!");
            }
        } else {
            console.error("❌ No remote stream in track event!");
        }
    };
    
    // Enhanced connection monitoring
    pc.onconnectionstatechange = () => {
        console.log("🔗 Connection state changed to:", pc.connectionState);
        if (pc.connectionState === 'connected') {
            console.log("🎉 🎉 WebRTC CONNECTION ESTABLISHED SUCCESSFULLY!");
        } else if (pc.connectionState === 'failed') {
            console.error("❌ WebRTC connection failed!");
            retryConnection();
        }
    };
    
    pc.oniceconnectionstatechange = () => {
        console.log("🧊 ICE connection state:", pc.iceConnectionState);
        if (pc.iceConnectionState === 'connected') {
            console.log("🎉 ICE connection successful!");
        }
    };
    
    // 🎯 CRITICAL: Add local tracks immediately
    if (localStream) {
        console.log("➕ Adding local tracks to peer connection...");
        localStream.getTracks().forEach(track => {
            console.log(`➕ Adding ${track.kind} track to peer connection`);
            pc.addTrack(track, localStream);
        });
    } else {
        console.error("❌ No local stream available when creating peer connection!");
    }
    
    return pc;
}

// 🎯 ENHANCED: Proper offer creation
async function createOffer() {
    console.log("📞 Creating offer as initiator...");
    console.log("🏠 Video room when creating offer:", videoCurrentRoom);
    
    if (!videoCurrentRoom) {
        console.error("❌ Cannot create offer - no videoCurrentRoom assigned!");
        return;
    }
    
    if (!localStream) {
        console.log("⏳ Local stream not ready, initializing...");
        const success = await initializeMedia();
        if (!success) return;
    }
    
    // Create fresh peer connection
    if (peerConnection) {
        peerConnection.close();
    }
    peerConnection = createPeerConnection();
    
    try {
        console.log("📝 Creating offer with constraints...");
        const offer = await peerConnection.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true
        });
        
        console.log("📝 Setting local description...");
        await peerConnection.setLocalDescription(offer);
        
        console.log("📤 Sending offer to room:", videoCurrentRoom);
        console.log("📊 Offer SDP length:", offer.sdp.length);
        
        socket.emit("video-offer", { 
            room: videoCurrentRoom, 
            offer: offer 
        });
        
    } catch (error) {
        console.error("❌ Error creating offer:", error);
    }
}

// 🎯 ENHANCED: Proper answer creation
async function handleOffer(offer) {
    console.log("📥 Handling incoming offer...");
    console.log("🏠 Video room when handling offer:", videoCurrentRoom);
    console.log("📊 Received offer SDP length:", offer.sdp.length);
    
    if (!videoCurrentRoom) {
        console.error("❌ Cannot handle offer - no videoCurrentRoom assigned!");
        return;
    }
    
    if (!localStream) {
        console.log("⏳ Local stream not ready, initializing...");
        const success = await initializeMedia();
        if (!success) return;
    }
    
    // Create fresh peer connection
    if (peerConnection) {
        peerConnection.close();
    }
    peerConnection = createPeerConnection();
    
    try {
        console.log("📝 Setting remote description from offer...");
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        
        console.log("📝 Creating answer...");
        const answer = await peerConnection.createAnswer();
        
        console.log("📝 Setting local description with answer...");
        await peerConnection.setLocalDescription(answer);
        
        console.log("📤 Sending answer to room:", videoCurrentRoom);
        console.log("📊 Answer SDP length:", answer.sdp.length);
        
        socket.emit("video-answer", { 
            room: videoCurrentRoom, 
            answer: answer 
        });
        
    } catch (error) {
        console.error("❌ Error handling offer:", error);
    }
}

// Handle incoming answer
async function handleAnswer(answer) {
    console.log("📥 Handling incoming answer...");
    console.log("📊 Answer SDP length:", answer.sdp.length);
    
    if (!peerConnection) {
        console.error("❌ No peer connection exists to handle answer!");
        return;
    }
    
    try {
        console.log("📝 Setting remote description from answer...");
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        console.log("✅ Answer processed successfully");
        
    } catch (error) {
        console.error("❌ Error handling answer:", error);
    }
}

// Handle ICE candidates
async function handleIceCandidate(candidate) {
    console.log("📥 Handling ICE candidate...");
    
    if (!peerConnection) {
        console.error("❌ No peer connection exists for ICE candidate!");
        return;
    }
    
    try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        console.log("✅ ICE candidate added successfully");
        
    } catch (error) {
        console.error("❌ Error adding ICE candidate:", error);
    }
}

// Initialize media when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log("📱 DOM loaded, initializing media...");
    await initializeMedia();
});

// 🎯 CRITICAL FIX: Listen for room assignment from game.js
socket.on("playerRole response", ({ role, room }) => {
    console.log(`🎮 VIDEO.JS received role: ${role}, room: ${room}`);
    
    // 🔴 CRITICAL: Use unique variable names
    videoPlayerRole = role;
    videoCurrentRoom = room;
    isInitiator = (role === 'w');
    
    console.log("✅ Video room and role assigned:", { 
        videoPlayerRole, 
        videoCurrentRoom, 
        isInitiator 
    });
    
    // 🎯 Start WebRTC with proper timing
    setTimeout(() => {
        if (isInitiator) {
            console.log("🚀 Starting WebRTC as initiator (White player)");
            createOffer();
        } else {
            console.log("⏳ Waiting for offer as receiver (Black player)");
        }
    }, 3000); // Increased timeout for stability
});

// 🎯 ENHANCED: WebRTC signaling event handlers
socket.on("video-offer", async ({ room, offer }) => {
    console.log("📥 Received video offer for room:", room);
    console.log("🏠 My video room:", videoCurrentRoom);
    console.log("🎭 My video role:", videoPlayerRole, "Am I initiator?", isInitiator);
    
    if (room !== videoCurrentRoom) {
        console.warn("⚠️ Ignoring offer – room mismatch");
        console.log("Expected:", videoCurrentRoom, "Got:", room);
        return;
    }
    
    if (isInitiator) {
        console.warn("⚠️ Ignoring offer – I'm the initiator");
        return;
    }
    
    console.log("✅ Processing video offer...");
    await handleOffer(offer);
});

socket.on("video-answer", async ({ room, answer }) => {
    console.log("📥 Received video answer for room:", room);
    console.log("🏠 My video room:", videoCurrentRoom);
    
    if (room !== videoCurrentRoom) {
        console.warn("⚠️ Ignoring answer – room mismatch");
        return;
    }
    
    if (!isInitiator) {
        console.warn("⚠️ Ignoring answer – I'm not the initiator");
        return;
    }
    
    console.log("✅ Processing video answer...");
    await handleAnswer(answer);
});

socket.on("ice-candidate", async ({ room, candidate }) => {
    console.log("📥 Received ICE candidate for room:", room);
    console.log("🏠 My video room:", videoCurrentRoom);
    
    if (room !== videoCurrentRoom) {
        console.warn("⚠️ Ignoring ICE candidate – room mismatch");
        return;
    }
    
    console.log("✅ Processing ICE candidate...");
    await handleIceCandidate(candidate);
});

// 🎯 Enhanced retry mechanism
let retryCount = 0;
const maxRetries = 3;

function retryConnection() {
    if (retryCount >= maxRetries) {
        console.error("❌ Max retries reached, giving up");
        return;
    }
    
    retryCount++;
    console.log(`🔄 Retrying WebRTC connection (${retryCount}/${maxRetries})...`);
    
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    
    setTimeout(() => {
        if (isInitiator && videoCurrentRoom) {
            createOffer();
        }
    }, 3000);
}

// Monitor connection health
setInterval(() => {
    if (peerConnection && peerConnection.connectionState === 'failed' && retryCount < maxRetries) {
        console.log("🔄 Connection failed, retrying...");
        retryConnection();
    }
}, 5000);

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    console.log("🧹 Cleaning up WebRTC resources...");
    
    if (localStream) {
        localStream.getTracks().forEach(track => {
            track.stop();
            console.log(`🛑 Stopped ${track.kind} track`);
        });
    }
    
    if (peerConnection) {
        peerConnection.close();
        console.log("🛑 Peer connection closed");
    }
});

console.log("✅ video.js loaded successfully!");