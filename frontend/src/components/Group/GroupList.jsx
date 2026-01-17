import { useState, useEffect } from 'react';
import { groupAPI } from '../../services/api';
import './Group.css';

const GroupList = ({ onSelectGroup, selectedGroup }) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const res = await groupAPI.getUserGroups();
      setGroups(res.data.groups || []);
    } catch (err) {
      console.error('Failed to load groups:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-list">Loading groups...</div>;
  }

  return (
    <>
      <button
        className="btn-new-chat"
        onClick={() => setShowCreateModal(true)}
      >
        ➕ Create Group
      </button>

      <div className="chat-list">
        {groups.length === 0 ? (
          <div className="empty-list">
            <p>No groups yet</p>
            <small>Create a group to start</small>
          </div>
        ) : (
          groups.map(group => (
            <div
              key={group._id}
              className={`chat-item ${selectedGroup?._id === group._id ? 'active' : ''}`}
              onClick={() => onSelectGroup(group)}
            >
              <div className="chat-avatar">👥</div>
              <div className="chat-details">
                <div className="chat-header">
                  <span className="chat-name">{group.name}</span>
                  <span className="group-count">{group.members?.length || 0}</span>
                </div>
                <div className="chat-preview">{group.description || 'No description'}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onGroupCreated={(newGroup) => {
            setGroups(prev => [newGroup, ...prev]);
            setShowCreateModal(false);
          }}
        />
      )}
    </>
  );
};

// Simple Create Group Modal
const CreateGroupModal = ({ onClose, onGroupCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await groupAPI.createGroup({ name, description });
      onGroupCreated(res.data.group);
    } catch (err) {
      alert('Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Group</h2>
          <button onClick={onClose} className="btn-close">✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          <div className="form-group">
            <label>Group Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter group name..."
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this group about?"
              rows="3"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Creating...' : 'Create Group'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default GroupList;
