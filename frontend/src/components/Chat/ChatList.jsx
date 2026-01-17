import { useState, useEffect } from 'react';
import { chatAPI } from '../../services/api';
import './Chat.css';

const ChatList = ({ onSelectChat, selectedChat, onlineUsers }) => {
  const [conversations, setConversations] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUnreadCounts();
    // Could load recent conversations from backend
    // For now, conversations are created when you search and select a user
  }, []);

  const loadUnreadCounts = async () => {
    try {
      const res = await chatAPI.getUnreadCounts();
      setUnreadCounts(res.data.unreadCounts || {});
    } catch (err) {
      console.error('Failed to load unread counts:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-list">Loading chats...</div>;
  }

  if (conversations.length === 0) {
    return (
      <div className="empty-list">
        <p>No conversations yet</p>
        <small>Click "New Chat" to start messaging</small>
      </div>
    );
  }

  return (
    <div className="chat-list">
      {conversations.map(chat => (
        <div
          key={chat.id}
          className={`chat-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
          onClick={() => onSelectChat(chat)}
        >
          <div className="chat-avatar">
            {chat.name.charAt(0)}
            {onlineUsers.has(chat.id) && <span className="online-indicator"></span>}
          </div>
          <div className="chat-details">
            <div className="chat-header">
              <span className="chat-name">{chat.name}</span>
              {unreadCounts[chat.id] > 0 && (
                <span className="unread-badge">{unreadCounts[chat.id]}</span>
              )}
            </div>
            <div className="chat-preview">{chat.lastMessage || 'Start chatting'}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatList;
