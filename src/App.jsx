import React, { useState } from "react";
import Dashboard from "./components/Dashboard";
import Chatbot from "./components/Chatbot";
import "./App.css";

function App() {
  const [showChatbot, setShowChatbot] = useState(false);

  const toggleChatbot = () => {
    setShowChatbot(!showChatbot);
  };

  const closeChatbot = () => {
    setShowChatbot(false);
  };

  return (
    <div className="App">
      <Dashboard />
      {!showChatbot && (
        <button className="chatbot-button" onClick={toggleChatbot}>
          Chat with us
        </button>
      )}
      {showChatbot && <Chatbot onClose={closeChatbot} />}
    </div>
  );
}

export default App;
