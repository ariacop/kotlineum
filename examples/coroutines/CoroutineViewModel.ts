import { ViewModel } from '../../src/ViewModel';
import { CoroutineScope, createCoroutineScope, delay, withTimeout } from '../../src/Coroutines';
import { flow, flowOf, Flow, asFlow } from '../../src/Flow';
import { StateFlow } from '../../src/useStateFlow';

// Define data types for the example
export interface User {
  id: number;
  name: string;
  email: string;
}

export interface UserState {
  users: User[];
  selectedUserId: number | null;
}

// Define Intent types for MVI
export type UserIntent =
  | { type: 'FETCH_USERS' }
  | { type: 'SELECT_USER'; userId: number }
  | { type: 'DESELECT_USER' }
  | { type: 'ADD_USER'; user: User }
  | { type: 'REMOVE_USER'; userId: number }
  | { type: 'UPDATE_USER'; user: User }
  | { type: 'SEARCH_USERS'; query: string };

/**
 * Coroutine-based ViewModel that uses the MVI pattern
 */
export class UserViewModel extends ViewModel<UserState, string, UserIntent> {
  private coroutineScope: CoroutineScope;
  private userFlow: Flow<User[]>;

  constructor() {
    // Initialize state
    super({
      users: [],
      selectedUserId: null
    });

    // Create a CoroutineScope for managing asynchronous operations
    this.coroutineScope = createCoroutineScope();

    // Create a Flow of users
    // Create a Flow of users from StateFlow
    this.userFlow = flow(async (collector) => {
      let isActive = true;
      const subscription = this.getStateFlow().subscribe('user-flow', (state) => {
        if (state.data && isActive) {
          collector.emit(state.data.users);
        }
      });
      
      // Wait until the Flow is cancelled
      try {
        // Wait until the Flow is cancelled
        await new Promise<void>(() => {});
      } finally {
        isActive = false;
        subscription();
      }
    });
  }

  /**
   * Process intents in MVI pattern
   */
  protected processIntent(intent: UserIntent): void {
    switch (intent.type) {
      case 'FETCH_USERS':
        this.fetchUsers();
        break;
      case 'SELECT_USER':
        this.selectUser(intent.userId);
        break;
      case 'DESELECT_USER':
        this.deselectUser();
        break;
      case 'ADD_USER':
        this.addUser(intent.user);
        break;
      case 'REMOVE_USER':
        this.removeUser(intent.userId);
        break;
      case 'UPDATE_USER':
        this.updateUser(intent.user);
        break;
      case 'SEARCH_USERS':
        this.searchUsers(intent.query);
        break;
    }
  }

  /**
   * Fetch users using Coroutine
   */
  private fetchUsers(): void {
    // Show loading state
    this.setLoading(true);

    // Use coroutineScope to execute asynchronous operations
    this.coroutineScope.launch(async () => {
      try {
        // Simulate network delay
        await delay(1000);

        // Simulate API request
        const users: User[] = [
          { id: 1, name: 'Ali Mohammadi', email: 'ali@example.com' },
          { id: 2, name: 'Maryam Ahmadi', email: 'maryam@example.com' },
          { id: 3, name: 'Reza Hosseini', email: 'reza@example.com' },
          { id: 4, name: 'Zahra Karimi', email: 'zahra@example.com' },
          { id: 5, name: 'Mohammad Najafi', email: 'mohammad@example.com' }
        ];

        // Update state
        this.updateState({
          data: {
            ...this.stateFlow.getValue().data,
            users,
            selectedUserId: this.stateFlow.getValue().data?.selectedUserId || null
          },
          loading: false,
          error: null
        });

        // Emit event
        this.emitEvent('users-loaded');
      } catch (error) {
        // Handle error
        this.setError(error instanceof Error ? error.message : 'Error loading users');
      }
    });
  }

  /**
   * Select a user
   */
  private selectUser(userId: number): void {
    const currentState = this.stateFlow.getValue();
    const userData = currentState.data as UserState | null;
    this.updateState({
      data: {
        users: userData?.users || [],
        selectedUserId: userId
      }
    });
  }

  /**
   * Deselect user
   */
  private deselectUser(): void {
    const currentState = this.stateFlow.getValue();
    const userData = currentState.data as UserState | null;
    this.updateState({
      data: {
        users: userData?.users || [],
        selectedUserId: null
      }
    });
  }

  /**
   * Add new user
   */
  private addUser(user: User): void {
    const currentState = this.stateFlow.getValue();
    
    // Check if user ID is not duplicate
    if (currentState.data && currentState.data.users.some(u => u.id === user.id)) {
      this.setError('A user with this ID already exists');
      return;
    }

    const userData = currentState.data as UserState | null;
    this.updateState({
      data: {
        users: [...(userData?.users || []), user],
        selectedUserId: userData?.selectedUserId || null
      }
    });

    // Emit event
    this.emitEvent('user-added');
  }

  /**
   * Remove user
   */
  private removeUser(userId: number): void {
    const currentState = this.stateFlow.getValue();
    const userData = currentState.data as UserState | null;
    this.updateState({
      data: {
        users: userData?.users.filter(u => u.id !== userId) || [],
        selectedUserId: userData?.selectedUserId === userId ? null : (userData?.selectedUserId || null)
      }
    });

    // Emit event
    this.emitEvent('user-removed');
  }

  /**
   * Update user information
   */
  private updateUser(updatedUser: User): void {
    const currentState = this.stateFlow.getValue();
    const userData = currentState.data as UserState | null;
    this.updateState({
      data: {
        users: userData?.users.map(u => u.id === updatedUser.id ? updatedUser : u) || [],
        selectedUserId: userData?.selectedUserId || null
      }
    });

    // Emit event
    this.emitEvent('user-updated');
  }

  /**
   * Search users using Flow
   */
  private searchUsers(query: string): void {
    if (!query.trim()) {
      // If the search query is empty, display all users
      this.fetchUsers();
      return;
    }

    this.setLoading(true);

    this.coroutineScope.launch(async () => {
      try {
        // Use Flow to filter users
        const currentState = this.stateFlow.getValue();
        const userData = currentState.data as UserState | null;
        const users = userData?.users || [];
        const filteredUsers = query.trim() === '' 
          ? users 
          : users.filter(user => 
              user.name.toLowerCase().includes(query.toLowerCase()) || 
              user.email.toLowerCase().includes(query.toLowerCase())
            );

        // Simulate search delay
        await delay(300);

        // Update state
        this.updateState({
          data: {
            users: filteredUsers,
            selectedUserId: userData?.selectedUserId || null
          },
          loading: false
        });

        // Emit event
        this.emitEvent('search-completed');
      } catch (error) {
        this.setError(error instanceof Error ? error.message : 'Error searching users');
      }
    });
  }

  /**
   * Get selected user using Flow
   */
  async getSelectedUser(): Promise<User | null> {
    const currentState = this.stateFlow.getValue();
    
    if (!currentState.data || currentState.data.selectedUserId === null) {
      return null;
    }

    // Create Flow from users
    const usersFlow = flowOf(...(currentState.data.users || []));
    
    // Use Flow operations to find the user
    const user = await usersFlow
      .filter(user => user.id === currentState.data?.selectedUserId)
      .first();
      
    return user;
  }

  /**
   * Set loading state
   */
  protected setLoading(loading: boolean): void {
    this.updateState({
      loading
    });
  }

  /**
   * Set error
   */
  protected setError(error: string): void {
    this.updateState({
      error,
      loading: false
    });
  }

  /**
   * Clean up resources when ViewModel is destroyed
   */
  dispose(): void {
    // Cancel all coroutines
    this.coroutineScope.cancel();
    
    // Call dispose method from the base class
    super.dispose();
  }
}
