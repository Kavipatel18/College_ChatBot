"use strict";

document.addEventListener("DOMContentLoaded", () => {
  console.log("JavaScript is loaded and DOM is ready.");

  // Clear local storage items
  localStorage.removeItem("chatMessages");
  localStorage.removeItem("no_of_message");

  // DOM element references

  const elements = {
    chatbotButton: document.getElementById("chatbot-button"),
    chatbotGif: document.getElementById("chatBot-gif"),
    bvm: document.getElementById("bvmWeb"),
    chatbot: document.getElementById("chatbot"),
    chatbotClose: document.getElementById("chatbot-close"),
    chatbotMessages: document.getElementById("chatbot-messages"),
    chatbotInput: document.getElementById("chatbot-input"),
    chatbotSend: document.getElementById("chatbot-send"),
    toastContainer: document.getElementById("toast-container"),
    tipMessageContainer: document.getElementById("tipMessageContainer"),
    loginContainer: document.getElementById("login-container"),
    photo: document.getElementById("photo"),
    chatbotHeader: document.getElementById("chatbot-header"),
    googleLoginBtn: document.getElementById("google-login-btn"),
  };
  if (localStorage.getItem("isLogin")) {
    elements.photo.src = sessionStorage.getItem("userPic");
  }
  // State variables
  let state = {
    messages: [],
    userName: sessionStorage.getItem("userName"),
    userEmail: sessionStorage.getItem("userEmail"),
    userPic: sessionStorage.getItem("userPic"),
    isBotResponding: false,
    nextReco: null,
    tipMessageTimeout: null,
    isFirstChatOpen: true,
    no_of_message: parseInt(localStorage.getItem("no_of_message")) || 0,
  };
  // Hide chatbot elements initially
  elements.chatbotButton.style.display = "none";
  elements.tipMessageContainer.style.display = "none";
  elements.chatbotGif.style.display = "none";

  // Show chatbot elements after iframe is loaded
  elements.bvm.addEventListener("load", () => {
    elements.chatbotButton.style.display = "flex";
    elements.tipMessageContainer.style.display = "flex";
    elements.chatbotGif.style.display = "flex";
  });

  var predefinedQuestions = [
    {
      question: "About BVM",
      answer: `Birla Vishvakarma Mahavidyalaya (BVM) is one of the premier engineering institutes located in Vallabh Vidyanagar, Gujarat. 
        <br><br>Established in 1948, it is known for its rich heritage and academic excellence in the field of engineering. 
        <br><br>BVM is affiliated with Gujarat Technological University (GTU).
        <br><br>For Furthur Information:
        <br>OUR BVM => About BVM`,
    },
    {
      question: "Admission",
      answer: `Online Application: 
      <br>Candidates need to apply online on the official website of the Admission Committee for Professional Courses (ACPC), Gujarat.
        <br><br>For All India Quota seats, applications are accepted based on JEE Main scores.
        <br><br>Postgraduate candidates can apply through the ACPC portal using their GATE scores.
        <br><br> For furthur enquiry check:<br> Academics => Admission Process`,
    },
    {
      question: "Faculty",
      answer: `You Can get Individual Faculty Detail in their respective Department Section.
        <br><br>You Can go there By:<br>Department => Faculty`,
    },
    {
      question: "Department",
      answer: `There are 10 Different Departments:
        <br>Computer 
        <br>Information Technology
        <br>Mechanical
        <br>Civil
        <br>Electrical 
        <br>Electronics 
        <br>Electronics & Communication 
        <br>Production
        <br>Structural 
        <br>Mathematics
        <br><a href="https://bvmengineering.ac.in/common_page1.aspx?page_id=8205" target="_blank">visit</a>`,
    },
    {
      question: "Training and Placement",
      answer: `The Training and Placement Cell plays a vital role in bridging the gap between students and the industry.
        <br><br>It organizes various training sessions, workshops, and career guidance programs to enhance students' skills and employability. 
        <br><br>The cell works closely with reputed companies to facilitate campus placements, offering students opportunities in top organizations.
        <br><br>For Furthur Information refer to below link:
        <br><a href="https://bvmengineering.ac.in/tnp/index.html" target="_blank">BVM TPC</a>`,
    },
  ];

  const closeLogin = document.getElementById("close-login");

  closeLogin.addEventListener("click", () => {
    elements.loginContainer.style.display = "none";
    elements.chatbotInput.disabled = false;
    elements.chatbotSend.disabled = false;
  });

  // Modify the displayLogIn function to show the close button
  function displayLogIn() {
    elements.loginContainer.style.display = "flex";
    elements.chatbotInput.disabled = true;
    elements.chatbotSend.disabled = true;
    closeLogin.style.display = "block"; // Ensure the close button is visible
  }

  // Add HTML for the custom modal
  const modalHTML = `
    <div id="logoutModal" class="modal">
      <div class="modal-content">
        <h2>Confirm Logout</h2>
        <p>Are you sure you want to log out?</p>
        <div class="modal-buttons">
          <button id="confirmLogout" class="modal-btn confirm">Yes, Log Out</button>
          <button id="cancelLogout" class="modal-btn cancel">Cancel</button>
        </div>
      </div>
    </div>
  `;

  // Insert the modal HTML into the page
  document.body.insertAdjacentHTML("beforeend", modalHTML);

  // Add styles for the modal
  const styles = `
    .modal {
      display: none;
      position: fixed;
      z-index: 1000;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0,0,0,0.5);
    }

    .modal-content {
      background-color: #fefefe;
      margin: 15% auto;
      padding: 20px;
      border: 1px solid #888;
      width: 300px;
      border-radius: 10px;
      text-align: center;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }

    .modal h2 {
      margin-top: 0;
      color: #333;
    }

    .modal-buttons {
      margin-top: 20px;
    }

    .modal-btn {
      padding: 10px 20px;
      margin: 0 10px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-weight: bold;
      transition: background-color 0.3s;
    }

    .modal-btn.confirm {
      background-color: #e74c3c;
      color: white;
    }

    .modal-btn.confirm:hover {
      background-color: #c0392b;
    }

    .modal-btn.cancel {
      background-color: #3498db;
      color: white;
    }

    .modal-btn.cancel:hover {
      background-color: #2980b9;
    }
  `;

  // Add the styles to the document
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);

  // Initialize Google API
  function initializeGoogleIdentity() {
    google.accounts.id.initialize({
      client_id: "googleclientid.apps.googleusercontent.com",
      callback: handleGoogleLoginResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    google.accounts.id.renderButton(
      document.getElementById("google-login-btn"),
      {
        theme: "outline",
        size: "large",
        width: 250,
      }
    );

    google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed()) {
        console.log(
          "One Tap UI not displayed:",
          notification.getNotDisplayedReason()
        );
      } else if (notification.isSkippedMoment()) {
        console.log("One Tap UI skipped:", notification.getSkippedReason());
      }
    });
  }

  // Modified window.onload
  window.onload = function () {
    // Check if user is already logged in
    fetch("http://127.0.0.1:5000/check_login")
      .then((response) => response.json())
      .then((data) => {
        if (data.isLoggedIn) {
          localStorage.setItem("isLogin", true);

          state.userName = data.name;
          state.userEmail = data.email;
          state.userPic = data.picture;
          state.no_of_message = data.message_count;
          sessionStorage.setItem("userName", state.userName);
          sessionStorage.setItem("userEmail", state.userEmail);
          sessionStorage.setItem("userPic", state.userPic);
          elements.photo.src = sessionStorage.getItem("userPic");
          // console.log(state.userPic);
          elements.chatbotInput.disabled = false;
          elements.chatbotSend.disabled = false;
        }
        initializeGoogleIdentity();
      })
      .catch((error) => {
        console.error("Error checking login status:", error);
        initializeGoogleIdentity();
      });
  };

  // Modified logout function
  function logout() {
    const modal = document.getElementById("logoutModal");
    const confirmBtn = document.getElementById("confirmLogout");
    const cancelBtn = document.getElementById("cancelLogout");

    modal.style.display = "block";

    confirmBtn.onclick = () => {
      modal.style.display = "none";
      performLogout();
    };

    cancelBtn.onclick = () => {
      modal.style.display = "none";
    };

    // Close the modal if clicking outside of it
    window.onclick = (event) => {
      if (event.target == modal) {
        modal.style.display = "none";
      }
    };
  }

  function performLogout() {
    // Send logout request to server
    fetch("http://127.0.0.1:5000/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: state.userEmail }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Logout successful:", data);

        // Reset state
        localStorage.removeItem("isLogin");
        state.userName = null;
        state.userEmail = null;
        state.userPic = null;
        sessionStorage.removeItem("userName");
        sessionStorage.removeItem("userEmail");
        sessionStorage.removeItem("userPic");
        elements.photo.src = "./Photo/user.png";

        // Clear messages
        // state.messages = [];
        // renderMessages();

        // Revoke Google token
        google.accounts.id.revoke(state.userEmail, (done) => {
          console.log("consent revoked");
          google.accounts.id.prompt(); // Reset One Tap UI
        });

        // Re-render the chatbot messages and predefined questions
        renderMessages();
        renderPredefinedQuestions();

        // Disable input and send button
        elements.chatbotInput.disabled = true;
        elements.chatbotSend.disabled = true;

        // Show login container
        elements.loginContainer.style.display = "flex";
      })
      .catch((error) => {
        console.error("Error logging out:", error);
        // Handle error (e.g., show error message to user)
      });
  }

  elements.photo.addEventListener("click", (e) => {
    if (!localStorage.getItem("isLogin")) {
      displayLogIn();
    } else {
      logout();
    }
  });

  function handleGoogleLoginResponse(response) {
    if (response.credential) {
      const credential = response.credential;
      const decodedCredential = parseJwt(credential);

      // Update user information
      state.userName = decodedCredential.name;
      state.userEmail = decodedCredential.email;
      state.userPic = decodedCredential.picture;
      sessionStorage.setItem("userName", state.userName);
      sessionStorage.setItem("userEmail", state.userEmail);
      sessionStorage.setItem("userPic", state.userPic);
      localStorage.setItem("isLogin", true);

      // Send user data to server for storage in MySQL
      fetch("http://127.0.0.1:5000/store_user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: state.userName,
          email: state.userEmail,
          picture: state.userPic,
          message_count: state.no_of_message,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("User data stored:", data);
          // Update UI
          elements.loginContainer.style.display = "none";
          elements.chatbotInput.disabled = false;
          elements.chatbotSend.disabled = false;
          elements.photo.src = sessionStorage.getItem("userPic");

          // Add welcome message
          state.messages.push({
            sender: "bot",
            text: `Hello ${state.userName}!`,
          });
          renderMessages();
          renderPredefinedQuestions();
        })
        .catch((error) => {
          console.error("Error storing user data:", error);
          // Handle error (e.g., show error message to user)
        });
    }
  }

  function parseJwt(token) {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    return JSON.parse(jsonPayload);
  }

  const renderPredefinedQuestions = () => {
    const messageGroupDiv = document.createElement("div");
    messageGroupDiv.classList.add("predefined_message-container");
    elements.chatbotMessages.appendChild(messageGroupDiv);
    predefinedQuestions.forEach((q) => {
      const messageDiv = document.createElement("div");
      messageDiv.classList.add("predefined_message", "bot");
      messageDiv.innerHTML = `<text class="predefined-question">${q.question}</text>`;

      messageGroupDiv.appendChild(messageDiv);

      messageDiv
        .querySelector(".predefined-question")
        .addEventListener("click", () => {
          // state.messages.push({
          //   sender: "user",
          //   text: q.question,
          // });
          handleSendMessage(q.question);
          // addPredefinedAnswer(q.answer);
        });
    });
    if (state.nextReco && localStorage.getItem("isLogin")) {
      const nextRecoDiv = document.createElement("div");
      nextRecoDiv.classList.add(
        "predefined_message",
        "bot",
        "next-reco",
        "recommendation-spark"
      );

      // Create a more dynamic and enticing recommendation presentation
      const sparkleEmoji = "✨";
      const lightBulbEmoji = "💡";
      const magicWandEmoji = "🪄";

      const catchyPhrases = ["Next Recommandation!"];

      const randomCatchyPhrase =
        catchyPhrases[Math.floor(Math.random() * catchyPhrases.length)];

      nextRecoDiv.innerHTML = `
    <text class="predefined-question">
      ${sparkleEmoji} ${randomCatchyPhrase}${lightBulbEmoji}
      <br>
      <strong>${state.nextReco[3]}</strong>
    </text>
  `;

      // Styling to make it more attractive
      nextRecoDiv.style.backgroundColor = "#ffe4e1";
      nextRecoDiv.style.border = "2px dashed #ff69b4";
      nextRecoDiv.style.transition = "all 0.3s ease";

      // Hover effect for interactivity
      nextRecoDiv.addEventListener("mouseenter", () => {
        nextRecoDiv.style.transform = "scale(1.05)";
        nextRecoDiv.style.boxShadow = "0 4px 10px rgba(0,0,0,0.2)";
      });

      nextRecoDiv.addEventListener("mouseleave", () => {
        nextRecoDiv.style.transform = "scale(1)";
        nextRecoDiv.style.boxShadow = "none";
      });

      messageGroupDiv.appendChild(nextRecoDiv);

      nextRecoDiv
        .querySelector(".predefined-question")
        .addEventListener("click", () => {
          // Add a subtle animation on click
          nextRecoDiv.style.animation = "pulse 0.5s";
          handleSendMessage(state.nextReco[1]);
          // Clear nextReco after it's used
          state.nextReco = null;
        });
    }

    elements.chatbotMessages.scrollTop = elements.chatbotMessages.scrollHeight;
  };

  const addPredefinedAnswer = (answer) => {
    state.messages.push({ sender: "bot", text: answer });
    renderMessages();
    localStorage.setItem("chatMessages", JSON.stringify(state.messages));
    state.no_of_message++;
    updateMessageCount();

    localStorage.setItem("no_of_message", state.no_of_message);
    console.log("incre", state.no_of_message);
    renderPredefinedQuestions();
    if (state.no_of_message >= 5 && !localStorage.getItem("isLogin")) {
      displayLogIn();
    }
  };

  try {
    const storedMessages = localStorage.getItem("chatMessages");
    if (storedMessages) {
      state.messages = JSON.parse(storedMessages);
    }
  } catch (e) {
    console.error("Error parsing chatMessages from localStorage", e);
    // localStorage.removeItem("chatMessages");
  }

  const renderMessages = () => {
    elements.chatbotMessages.innerHTML = "";
    state.messages.forEach((message) => {
      const messageDiv = document.createElement("div");
      messageDiv.classList.add("message", message.sender);

      const logo = document.createElement("img");
      if (message.sender === "user") {
        logo.src = localStorage.getItem("isLogin")
          ? sessionStorage.getItem("userPic")
          : "./Photo/user.png";
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
      elements.chatbotMessages.appendChild(messageDiv);
    });
    elements.chatbotMessages.scrollTop = elements.chatbotMessages.scrollHeight;
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

    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 5000);
  };

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

  const handleSendMessage = async (que = "") => {
    let inputText;
    if (que != "") {
      inputText = que;
    } else {
      inputText = elements.chatbotInput.value.trim();
    }
    if (inputText) {
      state.nextReco = null;
      state.messages.push({ sender: "user", text: inputText });
      elements.chatbotInput.value = "";
      renderMessages();
      localStorage.setItem("chatMessages", JSON.stringify(state.messages));

      state.isBotResponding = true;
      elements.chatbotInput.disabled = true;
      elements.chatbotSend.disabled = true;

      const correctedGreeting = correctGreeting(inputText);
      if (correctedGreeting) {
        state.messages.push({
          sender: "bot",
          text: "Hello! How can I help you today?",
        });
        renderMessages();
        localStorage.setItem("chatMessages", JSON.stringify(state.messages));
      } else if (isSorryMessage(inputText)) {
        state.messages.push({
          sender: "bot",
          text: "No need to apologize! How can I assist you?",
        });
        renderMessages();
        localStorage.setItem("chatMessages", JSON.stringify(state.messages));
      } else {
        try {
          const response = await fetch("http://127.0.0.1:5000/chatbot", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user_input: inputText,
              email: state.userEmail, // Add the user's email to the request
            }),
          });
          const data = await response.json();

          state.nextReco = data.recommendations;
          if (data.responses && data.responses.length > 0) {
            data.responses.forEach((resp, index) => {
              state.messages.push({
                sender: "bot",
                text: `<b style="color:grey;">Response-${index + 1} :</b><br>${
                  resp.response
                }`,
              });
            });
          } else {
            state.messages.push({
              sender: "bot",
              text: "I'm sorry, I couldn't find a relevant answer. Can you please rephrase your question?",
            });
          }

          renderMessages();
          renderPredefinedQuestions();
          localStorage.setItem("chatMessages", JSON.stringify(state.messages));
        } catch (error) {
          console.error("Error sending message to chatbot", error);
          state.messages.push({
            sender: "bot",
            text: "Sorry, something went wrong. Please try again later.",
          });
          renderMessages();
          renderPredefinedQuestions();
        }
      }
      state.no_of_message++;

      // Update message count on server
      updateMessageCount();

      state.isBotResponding = false;
      elements.chatbotInput.disabled = false;
      elements.chatbotSend.disabled = false;
      elements.chatbotInput.focus();
    } else {
      showMessageToast("Please type a message before sending.");
    }
  };

  function updateMessageCount() {
    fetch("http://127.0.0.1:5000/update_message_count", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: state.userEmail,
        message_count: state.no_of_message,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Message count updated:", data);
        if (state.no_of_message >= 5 && !localStorage.getItem("isLogin")) {
          displayLogIn();
        }
      })
      .catch((error) => {
        console.error("Error updating message count:", error);
      });
  }
  const showTipMessage = () => {
    const tipMessage = document.getElementById("tipMessage");
    tipMessage.style.display = "block";
    clearTimeout(state.tipMessageTimeout);
    state.tipMessageTimeout = setTimeout(() => {
      tipMessage.style.display = "none";
    }, 5000);
  };

  const hideTipMessage = () => {
    const tipMessage = document.getElementById("tipMessage");
    tipMessage.style.display = "none";
    clearTimeout(state.tipMessageTimeout);
  };

  elements.chatbotButton.addEventListener("click", (e) => {
    elements.chatbot.classList.toggle("hidden");

    if (!elements.chatbot.classList.contains("hidden")) {
      elements.chatbotInput.focus();

      if (state.isFirstChatOpen) {
        state.messages.push({
          sender: "bot",
          text: "Hello! How can I assist you today?",
        });
      }
      renderMessages();
      renderPredefinedQuestions();
      localStorage.setItem("chatMessages", JSON.stringify(state.messages));
      state.isFirstChatOpen = false;
    }

    e.stopPropagation();
    hideTipMessage();
  });

  elements.chatbotClose.addEventListener("click", (e) => {
    elements.chatbot.classList.add("hidden");
    e.stopPropagation();
  });

  elements.chatbotInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  });

  elements.chatbotSend.addEventListener("click", handleSendMessage);

  renderMessages();

  elements.bvm.addEventListener("click", (event) => {
    if (
      !elements.chatbot.contains(event.target) &&
      !elements.chatbotButton.contains(event.target) &&
      !elements.chatbot.classList.contains("hidden")
    ) {
      elements.chatbot.classList.add("hidden");
    }
  });

  elements.chatbot.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  showTipMessage();

  const handleWindowResize = () => {
    if (window.innerHeight < 400) {
      elements.chatbot.classList.add("hidden");
      elements.chatbotButton.style.display = "flex";
    } else {
      elements.chatbotButton.style.display = "flex";
    }
    if (window.innerWidth < 400) {
      elements.chatbot.classList.add("hidden");
      elements.chatbotButton.style.display = "flex";
    } else {
      elements.chatbotButton.style.display = "flex";
    }
  };

  window.addEventListener("resize", handleWindowResize);
  elements.chatbotButton.addEventListener("click", handleWindowResize);

  handleWindowResize();
});
