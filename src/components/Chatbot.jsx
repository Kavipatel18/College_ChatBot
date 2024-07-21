import React, { useState, useRef, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Chatbot.css";
import { faAlignCenter } from "@fortawesome/free-solid-svg-icons";

const Chatbot = ({ onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isBotResponding, setIsBotResponding] = useState(false); // State for bot response
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null); // Ref for the input field

  // Load messages from localStorage when component mounts
  useEffect(() => {
    const storedMessages =
      JSON.parse(localStorage.getItem("chatMessages")) || [];
    setMessages(storedMessages);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Auto-focus input after bot response
  useEffect(() => {
    if (!isBotResponding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isBotResponding]);

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

  const handleSendMessage = () => {
    if (input.trim()) {
      setMessages([...messages, { sender: "user", text: input }]);
      setInput("");
      setIsBotResponding(true); // Set bot responding to true

      // Simulate a response from the chatbot
      setTimeout(() => {
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: "bot", text: "This is a response from the bot." },
        ]);
        setIsBotResponding(false); // Set bot responding to false
      }, 1000);
    } else {
      toast.error("Please type a message before sending.");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClose = () => {
    onClose();
    // Optionally clear messages from state here, but not from localStorage
    // setMessages([]);
  };

  return (
    <div className="chatbot">
      <div className="chatbot-header">
        <button className="chatbot-close" onClick={handleClose}>
          &times;
        </button>
        <h4>BVM ChatBot</h4>
      </div>
      <div className="chatbot-messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.sender}`}>
            {message.text}
          </div>
        ))}
        {/* Ref to scroll into view */}
        <div ref={messagesEndRef} />
      </div>
      <div className="chatbot-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={isBotResponding} // Disable input if bot is responding
          ref={inputRef} // Attach ref to input
        />
        <button onClick={handleSendMessage} disabled={isBotResponding}>
          Send
        </button>
      </div>
      <ToastContainer />
    </div>
  );
};

export default Chatbot;
