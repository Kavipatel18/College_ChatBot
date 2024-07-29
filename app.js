function showChatBot() {
    const chatbotContainer = document.getElementById("chatbotContainer");
    chatbotContainer.style.display = "block";
}

function hideChatBot() {
    const chatbotContainer = document.getElementById("chatbotContainer");
    chatbotContainer.style.display = "none";
}

function showGif() {
    const gifContainer = document.getElementById("gifContainer");
    gifContainer.style.display = "block";
    setTimeout(() => {
        gifContainer.style.display = "none";
    }, 5000); // Hide the GIF after 5 seconds
}

function handleKeyPress(event) {
    if (event.key === "Enter") {
        sendMessage();
    }
}

function sendMessage() {
    const chatInput = document.getElementById("chatInput");
    const message = chatInput.value.trim();
    if (message) {
        const chatbotBody = document.getElementById("chatbotBody");
        const messageElement = document.createElement("div");
        messageElement.textContent = message;
        chatbotBody.appendChild(messageElement);
        chatInput.value = "";
        chatbotBody.scrollTop = chatbotBody.scrollHeight; // Scroll to the bottom
    }
}

// Show the GIF when the page loads
window.onload = showGif;
