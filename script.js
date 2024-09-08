// script.js
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
  const tipMessageContainer=document.getElementById("tipMessageContainer");

// Hide chatbot button initially
chatbotButton.style.display = "none";
tipMessageContainer.style.display="none";

// Show the chatbot button after iframe is loaded
bvm.addEventListener("load", () => {
  chatbotButton.style.display = "flex"; // Show the chatbot button
  tipMessageContainer.style.display="flex";
});

  let messages = [];
  let isBotResponding = false;
  let tipMessageTimeout;

  try {
    const storedMessages = localStorage.getItem("chatMessages");
    if (storedMessages) {
      messages = JSON.parse(storedMessages);
    }
  } catch (e) {
    console.error("Error parsing chatMessages from localStorage", e);
    localStorage.removeItem("chatMessages");
  }

  const renderMessages = () => {
    chatbotMessages.innerHTML = "";
    messages.forEach((message) => {
      const messageDiv = document.createElement("div");
      messageDiv.classList.add("message", message.sender);

      const logo = document.createElement("img");
      if (message.sender === "user") {
        logo.src = "./Photo/user.png";
        logo.alt = "User Logo";
      } else {
        logo.src = "../Photo/BVM Logo-1.png";
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
    icon.innerHTML = "&#x26A0;";

    const text = document.createElement("span");
    text.textContent = message;

    const closeBtn = document.createElement("span");
    closeBtn.classList.add("close");
    closeBtn.innerHTML = "&times;";
    closeBtn.onclick = () => toast.remove();

    toast.appendChild(icon);
    toast.appendChild(text);
    toast.appendChild(closeBtn);

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 5000);
  };

  const handleSendMessage = async () => {
    const inputText = chatbotInput.value.trim();
    if (inputText) {
      messages.push({ sender: "user", text: inputText });
      chatbotInput.value = "";
      renderMessages();
      localStorage.setItem("chatMessages", JSON.stringify(messages));

      isBotResponding = true;
      chatbotInput.disabled = true;
      chatbotSend.disabled = true;

      try {
        const response = await fetch("http://127.0.0.1:5000/chatbot", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_input: inputText }),
        });
        const data = await response.json();

        messages.push({ sender: "bot", text: data.response });
        renderMessages();
        localStorage.setItem("chatMessages", JSON.stringify(messages));
      } catch (error) {
        console.error("Error sending message to chatbot", error);
        messages.push({ sender: "bot", text: "Sorry, something went wrong." });
        renderMessages();
      }

      isBotResponding = false;
      chatbotInput.disabled = false;
      chatbotSend.disabled = false;
      chatbotInput.focus();
    } else {
      showMessageToast("Please type a message before sending.");
    }
  };

  const closeChatbot = () => {
    chatbot.classList.add("hidden");
    messages = [];
    localStorage.setItem("chatMessages", JSON.stringify(messages));
    // chatbotInput.focus();
  };

  const showTipMessage = () => {
    const tipMessage = document.getElementById("tipMessage");
    tipMessage.style.display = "block";
    clearTimeout(tipMessageTimeout);
    tipMessageTimeout = setTimeout(() => {
      tipMessage.style.display = "none";
    }, 5000);
  };

  const hideTipMessage = () => {
    const tipMessage = document.getElementById("tipMessage");
    tipMessage.style.display = "none";
    clearTimeout(tipMessageTimeout);
  };

  chatbotButton.addEventListener("click", (e) => {
    chatbot.classList.toggle("hidden");
    if (!chatbot.classList.contains("hidden")) {
      chatbotInput.focus();
    }
    e.stopPropagation();
    hideTipMessage();
  });

  chatbotClose.addEventListener("click", (e) => {
    closeChatbot();
    e.stopPropagation();
  });

  chatbotInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  });

  chatbotSend.addEventListener("click", handleSendMessage);

  renderMessages();

  document.addEventListener("click", (event) => {
    if (
      !chatbot.contains(event.target) &&
      !chatbotButton.contains(event.target) &&
      !chatbot.classList.contains("hidden")
    ) {
      console.log(event);
      closeChatbot();
    }
  });

  chatbot.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  showTipMessage();
});
