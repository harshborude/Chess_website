const socket = io() ;

var form = document.getElementById('message-form') ;
var message = document.getElementById('message') ;

form.addEventListener('submit' , (e) =>{
    e.preventDefault() ;
    if(message){
        socket.emit('chat message' , message.value ) ;
        // message.value = '' ;
        const messageElement = document.createElement('div') ;
        messageElement.classList.add('message' , 'my-message') ;
        messageElement.textContent = message.value ;
        

        const chatDisplay = document.getElementById('chat-display');
        chatDisplay.prepend(messageElement); // Add the new message to the top of the container
        
        message.value = '' ;
        // Scroll to the bottom
        chatDisplay.scrollTop = chatDisplay.scrollHeight;
    }
})

socket.on('response message' , msg => {
    const messageElement = document.createElement('div') ;
    messageElement.classList.add('message' , 'opposition-message') ;
    messageElement.textContent = msg ;
    // alert(msg) ;
    console.log(msg) ;
    const chatDisplay = document.getElementById('chat-display');
    chatDisplay.prepend(messageElement) ;

    // Scroll to the bottom
    chatDisplay.scrollTop = chatDisplay.scrollHeight;
})

