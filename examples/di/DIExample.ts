import { Injectable, Inject, Module, inject, provide } from '../../src/di';

// Define some interfaces for our services
interface Logger {
  log(message: string): void;
}

interface UserService {
  getCurrentUser(): User;
}

interface User {
  id: number;
  name: string;
  email: string;
}

// Implement a logger service
@Injectable()
class ConsoleLogger implements Logger {
  log(message: string): void {
    console.log(`[LOG]: ${message}`);
  }
}

// Implement a user service that depends on the logger
@Injectable()
class UserServiceImpl implements UserService {
  // Use property initialization with inject function instead of decorator
  private logger: Logger = inject<Logger>('logger');
  
  private currentUser: User = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com'
  };

  constructor() {
    this.logger.log('UserService created');
  }

  getCurrentUser(): User {
    this.logger.log('Getting current user');
    return this.currentUser;
  }
}

// Create a module for our application
const appModule = new Module({
  providers: [
    { provide: 'logger', useClass: ConsoleLogger },
    { provide: 'userService', useClass: UserServiceImpl }
  ]
});

// Register the module
appModule.register();

// Use the services
export function runDIExample() {
  // Get services using the inject function
  const userService = inject<UserService>('userService');
  const logger = inject<Logger>('logger');
  
  // Use the services
  logger.log('Starting application');
  const user = userService.getCurrentUser();
  logger.log(`Current user: ${user.name} (${user.email})`);
  
  return user;
}

// Example of providing a value directly
provide('config', {
  apiUrl: 'https://api.example.com',
  timeout: 5000
});

// Example of using the provided value
export function getConfig() {
  return inject<{ apiUrl: string; timeout: number }>('config');
}
