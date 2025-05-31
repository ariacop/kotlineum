import React, { useEffect, useState } from 'react';
import { UserViewModel, User, UserIntent } from './CoroutineViewModel';

const CoroutineViewModelExample: React.FC = () => {
  // Create an instance of ViewModel
  const [viewModel] = useState<UserViewModel>(() => new UserViewModel());
  
  // Component states
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // New user form
  const [newUserName, setNewUserName] = useState<string>('');
  const [newUserEmail, setNewUserEmail] = useState<string>('');
  
  // User edit form
  const [editMode, setEditMode] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');

  // Subscribe to state changes
  useEffect(() => {
    const subscription = viewModel.getStateFlow().subscribe('coroutine-example', (state) => {
      if (state.data) {
        setUsers(state.data.users);
        setSelectedUserId(state.data.selectedUserId);
      }
      setLoading(state.loading);
      setError(state.error);
    });

    // Subscribe to events
    const eventSubscription = viewModel.getEventsFlow().subscribe('coroutine-example-events', (event) => {
      console.log('Event received:', event);
      
      // If a user is selected, get their information
      if (event === 'users-loaded' || event === 'user-updated') {
        updateSelectedUserInfo();
      }
    });

    // Fetch users on load
    viewModel.dispatch({ type: 'FETCH_USERS' });

    // Clean up subscriptions on unmount
    return () => {
      subscription();
      eventSubscription();
      viewModel.dispose();
    };
  }, [viewModel]);

  // Update selected user information
  const updateSelectedUserInfo = async () => {
    const user = await viewModel.getSelectedUser();
    setSelectedUser(user);
    
    if (user) {
      setEditName(user.name);
      setEditEmail(user.email);
    }
  };

  // Select user
  useEffect(() => {
    updateSelectedUserInfo();
  }, [selectedUserId]);

  // Search users
  const handleSearch = () => {
    viewModel.dispatch({ type: 'SEARCH_USERS', query: searchQuery });
  };

  // Add new user
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUserName.trim() || !newUserEmail.trim()) {
      return;
    }
    
    const newId = Math.max(0, ...users.map(u => u.id)) + 1;
    // Send new user data to ViewModel
    viewModel.dispatch({
      type: 'ADD_USER',
      user: {
        id: newId,
        name: newUserName,
        email: newUserEmail
      }
    });
    
    // Clear form fields
    setNewUserName('');
    setNewUserEmail('');
  };

  // Remove user
  const handleRemoveUser = (userId: number) => {
    viewModel.dispatch({ type: 'REMOVE_USER', userId });
  };

  // Select user for editing
  const handleSelectUser = (userId: number) => {
    viewModel.dispatch({ type: 'SELECT_USER', userId });
    setEditMode(true);
  };

  // Cancel editing user
  const handleDeselectUser = () => {
    viewModel.dispatch({ type: 'DESELECT_USER' });
    setEditMode(false);
  };

  // Save user changes
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser || !editName.trim() || !editEmail.trim()) {
      return;
    }
    // Send updated user data to ViewModel
    viewModel.dispatch({
      type: 'UPDATE_USER',
      user: {
        ...selectedUser,
        name: editName,
        email: editEmail
      }
    });
    
    // Exit edit mode
    setEditMode(false);
  };

  return (
    <div style={{ fontFamily: 'Tahoma, Arial, sans-serif', maxWidth: '800px', margin: '0 auto', padding: '20px', direction: 'ltr' }}>
      <h1 style={{ borderBottom: '2px solid #3f51b5', paddingBottom: '10px', color: '#3f51b5' }}>
        CoroutineViewModel Example with MVI
      </h1>
      
      {/* Search bar */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search users..."
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #ccc'
          }}
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3f51b5',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Search
        </button>
        <button
          onClick={() => viewModel.dispatch({ type: 'FETCH_USERS' })}
          disabled={loading}
          style={{
            padding: '8px 16px',
            backgroundColor: '#009688',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Show all
        </button>
      </div>
      
      {/* Display error */}
      {error && (
        <div style={{ 
          backgroundColor: '#ffebee', 
          color: '#c62828', 
          padding: '10px', 
          borderRadius: '4px', 
          marginBottom: '20px' 
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {/* Display loading status */}
      {loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '20px',
          color: '#3f51b5'
        }}>
          Loading...
        </div>
      )}
      
      <div style={{ display: 'flex', gap: '20px', flexDirection: 'row' }}>
        {/* User list */}
        <div style={{ flex: 1 }}>
          <h2 style={{ color: '#3f51b5' }}>User List</h2>
          
          {users.length === 0 && !loading ? (
            <p style={{ color: '#666' }}>No users found.</p>
          ) : (
            <ul style={{ 
              listStyle: 'none', 
              padding: 0,
              margin: 0,
              border: '1px solid #e0e0e0',
              borderRadius: '4px'
            }}>
              {users.map(user => (
                <li 
                  key={user.id}
                  style={{ 
                    padding: '12px 15px',
                    borderBottom: '1px solid #e0e0e0',
                    backgroundColor: user.id === selectedUserId ? '#e8eaf6' : 'transparent',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{user.name}</div>
                    <div style={{ color: '#666', fontSize: '0.9em' }}>{user.email}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button
                      onClick={() => handleSelectUser(user.id)}
                      style={{
                        padding: '5px 10px',
                        backgroundColor: '#3f51b5',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.8em'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleRemoveUser(user.id)}
                      style={{
                        padding: '5px 10px',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.8em'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          
          {/* Add new user form */}
          <div style={{ marginTop: '20px' }}>
            <h3 style={{ color: '#3f51b5' }}>Add New User</h3>
            <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                type="text"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="User name"
                style={{
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid #ccc'
                }}
                required
              />
              <input
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="User email"
                style={{
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid #ccc'
                }}
                required
              />
              <button
                type="submit"
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Add User
              </button>
            </form>
          </div>
        </div>
        
        {/* User editing section */}
        {selectedUser && (
          <div style={{ 
            flex: 1,
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            padding: '15px',
            backgroundColor: '#f5f5f5'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h2 style={{ color: '#3f51b5', margin: 0 }}>User Information</h2>
              <button
                onClick={handleDeselectUser}
                style={{
                  padding: '5px 10px',
                  backgroundColor: '#9e9e9e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
            
            {editMode ? (
              <form onSubmit={handleSaveUser} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Name:</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      border: '1px solid #ccc'
                    }}
                    required
                  />
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email:</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      border: '1px solid #ccc'
                    }}
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="submit"
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#3f51b5',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditMode(false);
                      setEditName(selectedUser.name);
                      setEditEmail(selectedUser.email);
                    }}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#9e9e9e',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>ID:</strong> {selectedUser.id}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Name:</strong> {selectedUser.name}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Email:</strong> {selectedUser.email}
                </div>
                <button
                  onClick={() => setEditMode(true)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#3f51b5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoroutineViewModelExample;
