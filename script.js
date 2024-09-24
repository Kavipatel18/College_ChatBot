"use strict";
document.addEventListener("DOMContentLoaded", () => {
  console.log("JavaScript is loaded and DOM is ready.");
  localStorage.removeItem("chatMessages");

  const chatbotButton = document.getElementById("chatbot-button");
  const chatbotGif = document.getElementById("chatBot-gif");
  const bvm = document.getElementById("bvmWeb");
  const chatbot = document.getElementById("chatbot");
  const chatbotClose = document.getElementById("chatbot-close");
  const chatbotMessages = document.getElementById("chatbot-messages");
  const chatbotInput = document.getElementById("chatbot-input");
  const chatbotSend = document.getElementById("chatbot-send");
  const toastContainer = document.getElementById("toast-container");
  const tipMessageContainer = document.getElementById("tipMessageContainer");

  // Hide chatbot button initially
  chatbotButton.style.display = "none";
  tipMessageContainer.style.display = "none";

  // Show the chatbot button after iframe is loaded
  bvm.addEventListener("load", () => {
    chatbotButton.style.display = "flex"; // Show the chatbot button
    tipMessageContainer.style.display = "flex";
  });

  let messages = [];
  let isBotResponding = false;
  let tipMessageTimeout;
  let isFirstChatOpen = true; // Flag to track if it's the first time opening

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
      text.innerHTML = message.text;

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

  // Levenshtein distance function to handle typo corrections
  const levenshteinDistance = (a, b) => {
    const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]).concat(
      Array.from({ length: a.length + 1 }, (_, j) =>
        Array(b.length + 1).fill(j)
      )
    );

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
    return matrix[a.length][b.length];
  };

  const correctGreeting = (text) => {
    const greetings = [
      "hello",
      "hi",
      "hey",
      "greetings",
      "good morning",
      "good afternoon",
      "good evening",
    ];
    const cleanedText = text.toLowerCase().trim();
    const closestGreeting = greetings.reduce(
      (closest, greeting) => {
        const distance = levenshteinDistance(cleanedText, greeting);
        return distance < closest.distance ? { greeting, distance } : closest;
      },
      { greeting: "", distance: Infinity }
    );

    return closestGreeting.distance <= 2 ? closestGreeting.greeting : null;
  };

  const isSorryMessage = (text) => {
    const sorryKeywords = [
      "sorry",
      "apologies",
      "my bad",
      "pardon",
      "excuse me",
    ];
    const cleanedText = text.toLowerCase().trim();
    return sorryKeywords.some((keyword) => cleanedText.includes(keyword));
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

      const correctedGreeting = correctGreeting(inputText);
      if (correctedGreeting) {
        messages.push({
          sender: "bot",
          text: "Hello! How can I help you today?",
        });
        renderMessages();
        localStorage.setItem("chatMessages", JSON.stringify(messages));
      } else if (isSorryMessage(inputText)) {
        messages.push({
          sender: "bot",
          text: "No need to apologize! How can I assist you?",
        });
        renderMessages();
        localStorage.setItem("chatMessages", JSON.stringify(messages));
      } else {
        // If not a greeting or sorry message, send the message to the backend chatbot
        try {
          const response = await fetch("http://127.0.0.1:5000/chatbot", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ user_input: inputText }),
          });
          const data = await response.json();

          // Iterate over each response in the "responses" array
          data.responses.map((resp, index) => {
            messages.push({
              sender: "bot",
              text: `<b style="color:grey;">Response-${index + 1} :</b><br>${
                resp.response
              }`,
            });
          });

          renderMessages();
          localStorage.setItem("chatMessages", JSON.stringify(messages));
        } catch (error) {
          console.error("Error sending message to chatbot", error);
          messages.push({
            sender: "bot",
            text: "Sorry, something went wrong.",
          });
          renderMessages();
        }
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

      // Add greeting message if the chatbot is opened for the first time
      if (isFirstChatOpen) {
        messages.push({
          sender: "bot",
          text: "Hello! How can I assist you today?",
        });
        renderMessages();
        localStorage.setItem("chatMessages", JSON.stringify(messages));
        isFirstChatOpen = false;
      }
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

  const handleWindowResize = () => {
    if (window.innerHeight < 400) {
      closeChatbot(); // Close the chatbot
      chatbotButton.style.display = "flex"; // Show chatbot button
    } else {
      chatbotButton.style.display = "flex"; // Ensure chatbot button is visible
    }
  };

  // Add an event listener for window resize
  window.addEventListener("resize", handleWindowResize);
  chatbotButton.addEventListener("click", handleWindowResize);

  // Initial check for window size
  handleWindowResize();
  // tipMessage.addEventListener("click", showTipMessage);
});
