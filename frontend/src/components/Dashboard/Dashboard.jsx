import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { userAPI } from '../../services/api';
import ChatList from '../Chat/ChatList';
import ChatWindow from '../Chat/ChatWindow';
import GroupList from '../Group/GroupList';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { isConnected, onlineUsers } = useSocket();
  const [activeView, setActiveView] = useState('chats'); // 'chats' | 'groups'
  const [selectedChat, setSelectedChat] = useState(null);
  const [showUserSearch, setShowUserSearch] = useState(false);

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="user-info">
            <div className="user-avatar">{user?.name?.charAt(0) || 'U'}</div>
            <div>
              <div className="user-name">{user?.name || 'User'}</div>
              <div className="connection-status">
                <span className={`status-dot ${isConnected ? 'online' : 'offline'}`}></span>
                {isConnected ? 'Connected' : 'Disconnected'}
              </div>
            </div>
          </div>
          <button onClick={logout} className="btn-logout" title="Logout">
            💀
          </button>
        </div>

        <div className="view-tabs">
          <button
            className={`tab ${activeView === 'chats' ? 'active' : ''}`}
            onClick={() => setActiveView('chats')}
          >
            💬 Chats
          </button>
          <button
            className={`tab ${activeView === 'groups' ? 'active' : ''}`}
            onClick={() => setActiveView('groups')}
          >
            👥 Groups
          </button>
        </div>

        <div className="sidebar-content">
          {activeView === 'chats' ? (
            <>
              <button
                className="btn-new-chat"
                onClick={() => setShowUserSearch(true)}
              >
                ➕ New Chat
              </button>
              <ChatList
                onSelectChat={setSelectedChat}
                selectedChat={selectedChat}
                onlineUsers={onlineUsers}
              />
            </>
          ) : (
            <GroupList
              onSelectGroup={setSelectedChat}
              selectedGroup={selectedChat}
            />
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {selectedChat ? (
          <ChatWindow
            chat={selectedChat}
            isGroup={activeView === 'groups'}
            onClose={() => setSelectedChat(null)}
          />
        ) : (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <h2>Select a conversation</h2>
            <p>Choose a chat from the sidebar to start messaging</p>
          </div>
        )}
      </div>

      {/* User Search Modal */}
      {showUserSearch && (
        <UserSearchModal
          onClose={() => setShowUserSearch(false)}
          onSelectUser={(user) => {
            setSelectedChat(user);
            setShowUserSearch(false);
            setActiveView('chats');
          }}
        />
      )}
    </div>
  );
};

// Simple User Search Modal Component
const UserSearchModal = ({ onClose, onSelectUser }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await userAPI.searchUsers(query);
      setResults(res.data.users || []);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Search Users</h2>
          <button onClick={onClose} className="btn-close">✕</button>
        </div>
        <form onSubmit={handleSearch}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or mobile number..."
            autoFocus
          />
        </form>
        <div className="search-results">
          {loading ? (
            <div className="loading">Searching...</div>
          ) : results.length > 0 ? (
            results.map(user => (
              <div
                key={user.id}
                className="search-result-item"
                onClick={() => onSelectUser(user)}
              >
                <div className="user-avatar">{user.name.charAt(0)}</div>
                <div>
                  <div className="user-name">{user.name}</div>
                  <div className="user-mobile">{user.mobileNumber}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-results">No users found</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
