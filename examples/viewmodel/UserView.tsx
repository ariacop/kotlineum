import React, { useEffect, useState } from 'react';
import { useGlobalViewModel } from '../../src/useViewModel';
import { UserViewModel, User, UserEvent } from './UserViewModel';

/**
 * User list component using the UserViewModel
 */
export const UserList: React.FC = () => {
  // Use a global ViewModel instance
  const [state, viewModel] = useGlobalViewModel<User[], UserEvent, UserViewModel>('users', UserViewModel);
  const [notifications, setNotifications] = useState<string[]>([]);
  
  useEffect(() => {
    // Subscribe to events
    const unsubscribe = viewModel.subscribeToEvents('user-events', (event: UserEvent) => {
      const message = getEventMessage(event);
      if (message) {
        setNotifications(prev => [message, ...prev].slice(0, 5) as string[]);
      }
    });
    
    // Fetch users when component mounts
    viewModel.fetchUsers();
    
    return unsubscribe;
  }, [viewModel]);
  
  // Helper function to convert events to user-friendly messages
  const getEventMessage = (event: UserEvent): string => {
    const timestamp = new Date().toLocaleTimeString();
    switch (event) {
      case UserEvent.LOADED:
        return `[${timestamp}] Users loaded successfully`;
      case UserEvent.UPDATED:
        return `[${timestamp}] User list updated`;
      case UserEvent.ERROR:
        return `[${timestamp}] Error occurred`;
      default:
        return '';
    }
  };
  
  // Extract data from state
  const { data: users, loading, error } = state;
  
  return (
    <div className="user-list">
      <h3>User Management</h3>
      
      <div className="notifications">
        {notifications.length > 0 && (
          <>
            <h4>Notifications:</h4>
            <ul>
              {notifications.map((notification, index) => (
                <li key={index}>{notification}</li>
              ))}
            </ul>
          </>
        )}
      </div>
      
      <div className="actions">
        <button 
          onClick={() => viewModel.fetchUsers()}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh Users'}
        </button>
        <button
          onClick={() => viewModel.addUser({
            name: `New User ${Date.now()}`,
            email: `user${Date.now()}@example.com`,
            phone: '555-0000'
          })}
        >
          Add Random User
        </button>
      </div>
      
      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}
      
      {loading ? (
        <div className="loading">Loading users...</div>
      ) : (
        <>
          {users && users.length > 0 ? (
            <table className="users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.phone}</td>
                    <td>
                      <button onClick={() => viewModel.deleteUser(user.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No users found</p>
          )}
        </>
      )}
    </div>
  );
};

/**
 * User form component for adding new users
 */
export const UserForm: React.FC = () => {
  // Use the same global ViewModel instance as UserList
  const [state, viewModel] = useGlobalViewModel<User[], UserEvent, UserViewModel>('users', UserViewModel);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.email) {
      alert('Name and email are required');
      return;
    }
    
    // Add user
    viewModel.addUser(formData);
    
    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: ''
    });
  };
  
  return (
    <div className="user-form">
      <h3>Add New User</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="phone">Phone:</label>
          <input
            type="text"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>
        
        <button type="submit">Add User</button>
      </form>
    </div>
  );
};

/**
 * Complete example showing how to use ViewModels with async data
 */
export const UserViewExample: React.FC = () => {
  return (
    <div className="user-example">
      <h2>MVVM Pattern Example</h2>
      <p>This example demonstrates using ViewModels for async data fetching and state management</p>
      
      <div className="user-container">
        <UserList />
        <UserForm />
      </div>
      
      <div className="explanation">
        <h3>How it works:</h3>
        <ul>
          <li>Both components share the same ViewModel instance via <code>useGlobalViewModel</code></li>
          <li>The ViewModel handles data fetching, state management, and business logic</li>
          <li>Components only handle UI rendering and user interactions</li>
          <li>State changes in one component automatically update the other</li>
        </ul>
      </div>
    </div>
  );
};
