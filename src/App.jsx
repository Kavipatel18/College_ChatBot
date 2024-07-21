import React, { useState } from "react";
import Dashboard from "./components/Dashboard";
import Chatbot from "./components/Chatbot";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComments } from "@fortawesome/free-solid-svg-icons";
import "./App.css";

function App() {
  const [showChatbot, setShowChatbot] = useState(false);
  const [messages, setMessages] = useState([]);

  const toggleChatbot = () => {
    setShowChatbot(!showChatbot);
  };

  const closeChatbot = () => {
    setShowChatbot(false);
    clearMessages(); // Clear messages when closing
  };

  const addMessage = (message) => {
    setMessages([...messages, message]);
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return (
    <div className="App">
      <Dashboard />
      {!showChatbot && (
        <button className="chatbot-button" onClick={toggleChatbot}>
          <FontAwesomeIcon icon={faComments} />
        </button>
      )}
      {showChatbot && (
        <Chatbot
          onClose={closeChatbot}
          addMessage={addMessage}
          messages={messages}
        />
      )}
    </div>
  );
}

export default App;
