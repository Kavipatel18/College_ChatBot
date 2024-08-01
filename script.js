document.addEventListener("DOMContentLoaded", () => {
  console.log("JavaScript is loaded and DOM is ready.");
  localStorage.removeItem("chatMessages");
  const chatbotButton = document.getElementById("chatbot-button");
  const bvm = document.getElementById("bvmWeb");
  const chatbot = document.getElementById("chatbot");
  const chatbotClose = document.getElementById("chatbot-close");
  const chatbotMessages = document.getElementById("chatbot-messages");
  const chatbotInput = document.getElementById("chatbot-input");
  const chatbotSend = document.getElementById("chatbot-send");
  const toastContainer = document.getElementById("toast-container");

  let messages = [];
  let isBotResponding = false;
  let tipMessageTimeout;

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

      const logo = document.createElement("img");
      if (message.sender === "user") {
        logo.src = "./Photo/user.png"; // Path to user logo
        logo.alt = "User Logo";
      } else {
        logo.src = "../Photo/BVM Logo-1.png"; // Path to bot logo
        logo.alt = "BVM Logo";
      }

      const text = document.createElement("span");
      text.textContent = message.text;

      if (message.sender === "user") {
        messageDiv.appendChild(text);
        messageDiv.appendChild(logo);
      } else {
        messageDiv.appendChild(logo);
        messageDiv.appendChild(text);
      }
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
    messages = []; // Clear messages on close
    localStorage.setItem("chatMessages", JSON.stringify(messages));
    chatbotInput.focus();
  };

  const showTipMessage = () => {
    const tipMessage = document.getElementById("tipMessage");
    tipMessage.style.display = "block";
    clearTimeout(tipMessageTimeout);
    tipMessageTimeout = setTimeout(() => {
      tipMessage.style.display = "none";
    }, 5000); // Hide the tip message after 5 seconds
  };

  const hideTipMessage = () => {
    const tipMessage = document.getElementById("tipMessage");
    tipMessage.style.display = "none";
    clearTimeout(tipMessageTimeout);
  };

  // Open/Close Chatbot
  chatbotButton.addEventListener("click", (e) => {
    console.log("Chatbot button clicked");
    chatbot.classList.toggle("hidden");
    if (!chatbot.classList.contains("hidden")) {
      chatbotInput.focus();
    }
    e.stopPropagation(); // Prevent click from closing the chatbot immediately

    // Hide the tip message immediately if it's currently displayed
    hideTipMessage();
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
  bvm.addEventListener("click", (event) => {
    console.log("outside click");
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

  showTipMessage();
});
