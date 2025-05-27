// UserViewModel.ts
import { ViewModel } from '../../src/ViewModel';

// Define the User model
export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
}

// Define event types
export enum UserEvent {
  LOADED = 'USER_LOADED',
  UPDATED = 'USER_UPDATED',
  ERROR = 'USER_ERROR'
}

/**
 * Example ViewModel for user data with async operations
 */
export class UserViewModel extends ViewModel<User[], UserEvent> {
  constructor() {
    super([]);
  }

  /**
   * Fetch users from a mock API
   */
  async fetchUsers(): Promise<void> {
    this.setLoading(true);
    this.setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock API response
      const users: User[] = [
        { id: 1, name: 'John Doe', email: 'john@example.com', phone: '555-1234' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '555-5678' },
        { id: 3, name: 'Bob Johnson', email: 'bob@example.com', phone: '555-9012' }
      ];
      
      // Update state with fetched data
      this.updateData(users);
      
      // Emit event
      this.emitEvent(UserEvent.LOADED);
    } catch (error) {
      // Handle error
      this.setError('Failed to fetch users');
      this.emitEvent(UserEvent.ERROR);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Add a new user
   */
  addUser(user: Omit<User, 'id'>): void {
    const currentUsers = this.getData();
    if (!currentUsers) return;
    
    // Generate a new ID
    const newId = currentUsers.length > 0 
      ? Math.max(...currentUsers.map(u => u.id)) + 1 
      : 1;
    
    // Create new user with ID
    const newUser: User = {
      id: newId,
      ...user
    };
    
    // Update state with new user added
    this.updateData([...currentUsers, newUser]);
    
    // Emit event
    this.emitEvent(UserEvent.UPDATED);
  }

  /**
   * Delete a user
   */
  deleteUser(id: number): void {
    const currentUsers = this.getData();
    if (!currentUsers) return;
    
    // Filter out the user to delete
    const updatedUsers = currentUsers.filter(user => user.id !== id);
    
    // Update state
    this.updateData(updatedUsers);
    
    // Emit event
    this.emitEvent(UserEvent.UPDATED);
  }

  /**
   * Update a user
   */
  updateUser(id: number, updates: Partial<Omit<User, 'id'>>): void {
    const currentUsers = this.getData();
    if (!currentUsers) return;
    
    // Map through users and update the matching one
    const updatedUsers = currentUsers.map(user => 
      user.id === id ? { ...user, ...updates } : user
    );
    
    // Update state
    this.updateData(updatedUsers);
    
    // Emit event
    this.emitEvent(UserEvent.UPDATED);
  }
}
