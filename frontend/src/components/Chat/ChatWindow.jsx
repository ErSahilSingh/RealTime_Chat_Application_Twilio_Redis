import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { chatAPI } from '../../services/api';
import './Chat.css';

const ChatWindow = ({ chat, isGroup, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    loadMessages();
    
    if (socket) {
      // Listen for new messages
      socket.on('receive_message', handleNewMessage);
      socket.on('group_message_received', handleNewMessage);
      socket.on('typing_status', handleTyping);
      socket.on('message_delivered', handleDelivered);
      
      return () => {
        socket.off('receive_message', handleNewMessage);
        socket.off('group_message_received', handleNewMessage);
        socket.off('typing_status', handleTyping);
        socket.off('message_delivered', handleDelivered);
      };
    }
  }, [chat, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const res = isGroup
        ? await chatAPI.getGroupMessages(chat.id)
        : await chatAPI.getChatHistory(chat.id);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = (message) => {
    if (isGroup) {
      if (message.groupId === chat.id) {
        setMessages(prev => [...prev, message]);
      }
    } else {
      if (message.from.id === chat.id || message.to === chat.id) {
        setMessages(prev => [...prev, message]);
      }
    }
  };

  const handleTyping = ({ userId, isTyping }) => {
    if (userId === chat.id) {
      setTyping(isTyping);
    }
  };

  const handleDelivered = ({ messageId }) => {
    setMessages(prev =>
      prev.map(msg => msg.id === messageId ? { ...msg, delivered: true } : msg)
    );
  };

  const sendMessage = () => {
    if (!inputText.trim() || !isConnected) return;

    const event = isGroup ? 'group_message' : 'private_message';
    const payload = isGroup
      ? { groupId: chat.id, text: inputText }
      : { to: chat.id, text: inputText };

    socket.emit(event, payload);

    // Optimistically add message
    const newMsg = {
      id: `temp-${Date.now()}`,
      text: inputText,
      from: { id: 'me' },
      timestamp: new Date(),
      delivered: false
    };
    setMessages(prev => [...prev, newMsg]);
    setInputText('');
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);

    // Send typing indicator
    if (!isGroup && socket) {
      socket.emit('typing', { to: chat.id, isTyping: true });

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', { to: chat.id, isTyping: false });
      }, 2000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-window-header">
        <button className="btn-back" onClick={onClose}>←</button>
        <div className="chat-avatar">{chat.name?.charAt(0) || '?'}</div>
        <div className="chat-info">
          <div className="chat-name">{chat.name || 'Unknown'}</div>
          <div className="chat-status">
            {typing ? 'typing...' : isConnected ? 'online' : 'offline'}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-container">
        {loading ? (
          <div className="loading-messages">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet</p>
            <small>Send a message to start the conversation</small>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={msg.id || idx}
              className={`message ${msg.from?.id === 'me' || msg.from?.id === chat.id ? 'received' : 'sent'}`}
            >
              {isGroup && msg.from?.id !== 'me' && (
                <div className="message-sender">{msg.from?.name}</div>
              )}
              <div className="message-content">
                <div className="message-text">{msg.text}</div>
                <div className="message-meta">
                  {new Date(msg.timestamp).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                  {msg.from?.id === 'me' && (
                    <span className="delivery-status">
                      {msg.delivered ? '✓✓' : '✓'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input-container">
        <textarea
          value={inputText}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          rows="1"
          disabled={!isConnected}
        />
        <button
          onClick={sendMessage}
          disabled={!inputText.trim() || !isConnected}
          className="btn-send"
        >
          ➤
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;
