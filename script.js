document.addEventListener("DOMContentLoaded", () => {
  console.log("JavaScript is loaded and DOM is ready.");

  const chatbotButton = document.getElementById("chatbot-button");
  const chatbot = document.getElementById("chatbot");
  const chatbotClose = document.getElementById("chatbot-close");
  const chatbotMessages = document.getElementById("chatbot-messages");
  const chatbotInput = document.getElementById("chatbot-input");
  const chatbotSend = document.getElementById("chatbot-send");
  const toastContainer = document.getElementById("toast-container");

  let messages = [];
  let isBotResponding = false;

  // Load stored messages
  try {
    const storedMessages = localStorage.getItem("chatMessages");
    if (storedMessages) {
      messages = JSON.parse(storedMessages);
    }
  } catch (e) {
    console.error("Error parsing chatMessages from localStorage", e);
    localStorage.removeItem("chatMessages"); // Clear corrupted data
  }

  const renderMessages = () => {
    chatbotMessages.innerHTML = "";
    messages.forEach((message) => {
      const messageDiv = document.createElement("div");
      messageDiv.classList.add("message", message.sender);
      messageDiv.textContent = message.text;
      chatbotMessages.appendChild(messageDiv);
    });
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
  };

  const showMessageToast = (message, type = "error") => {
    const toast = document.createElement("div");
    toast.classList.add("toast", type);

    const icon = document.createElement("span");
    icon.classList.add("icon");
    icon.innerHTML = "&#x26A0;"; // Warning icon (exclamation in triangle)

    const text = document.createElement("span");
    text.textContent = message;

    const closeBtn = document.createElement("span");
    closeBtn.classList.add("close");
    closeBtn.innerHTML = "&times;"; // Close icon
    closeBtn.onclick = () => toast.remove();

    toast.appendChild(icon);
    toast.appendChild(text);
    toast.appendChild(closeBtn);

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 5000);
  };

  const handleSendMessage = () => {
    const inputText = chatbotInput.value.trim();
    if (inputText) {
      messages.push({ sender: "user", text: inputText });
      chatbotInput.value = "";
      renderMessages();
      localStorage.setItem("chatMessages", JSON.stringify(messages));

      isBotResponding = true;
      chatbotInput.disabled = true;
      chatbotSend.disabled = true;

      setTimeout(() => {
        messages.push({
          sender: "bot",
          text: "This is a response from the bot.",
        });
        renderMessages();
        localStorage.setItem("chatMessages", JSON.stringify(messages));
        isBotResponding = false;
        chatbotInput.disabled = false;
        chatbotSend.disabled = false;
        chatbotInput.focus();
      }, 1000);
    } else {
      showMessageToast("Please type a message before sending.");
    }
  };

  const closeChatbot = () => {
    chatbot.classList.add("hidden");
    messages = [];
    localStorage.setItem("chatMessages", JSON.stringify(messages));
    chatbotInput.focus();
  };

  // Open/Close Chatbot
  chatbotButton.addEventListener("click", (e) => {
    console.log("Chatbot button clicked");
    chatbot.classList.toggle("hidden");
    if (!chatbot.classList.contains("hidden")) {
      chatbotInput.focus();
    }
    e.stopPropagation(); // Prevent click from closing the chatbot immediately
  });

  chatbotClose.addEventListener("click", (e) => {
    console.log("Chatbot close button clicked");
    closeChatbot();
    e.stopPropagation(); // Prevent click from closing the chatbot immediately
  });

  chatbotInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  });

  chatbotSend.addEventListener("click", handleSendMessage);

  renderMessages();

  // Close chatbot if clicking outside
  document.addEventListener("click", (event) => {
    if (
      !chatbot.contains(event.target) &&
      !chatbotButton.contains(event.target) &&
      !chatbot.classList.contains("hidden")
    ) {
      closeChatbot();
    }
  });

  // Prevent event propagation for chatbot container
  chatbot.addEventListener("click", (event) => {
    event.stopPropagation();
  });
});

window.onload = () => {
  showTipMessage();
};

function showTipMessage() {
  const tipMessage = document.getElementById("tipMessage");
  tipMessage.style.display = "block";
  setTimeout(() => {
    tipMessage.style.display = "none";
  }, 5000); // Hide the tip message after 5 seconds
}
