/**
 * Dependency Injection (DI) Pattern in TypeScript
 *
 * Dependency Injection is a design pattern in which a class requests dependencies from external sources rather than creating them itself.
 * This pattern is a form of Inversion of Control (IoC), where the control of creating dependencies is inverted from the class to an external entity.
 *
 * This leads to more decoupled, testable, and maintainable code.
 *
 * In this example, we'll demonstrate constructor injection, which is the most common form of DI.
 */

// 1. Define the dependency (the service)
interface ILogger {
  log(message: string): void;
}

// A concrete implementation of the logger service
class ConsoleLogger implements ILogger {
  log(message: string): void {
    console.log(`[ConsoleLogger]: ${message}`);
  }
}

// Another implementation, maybe for a file logger
class FileLogger implements ILogger {
  log(message: string): void {
    // In a real application, you would write this to a file.
    console.log(`[FileLogger]: Writing "${message}" to a file.`);
  }
}

// 2. Define the dependent class (the client)
// The `UserService` class needs a logger, but it doesn't create one itself.
// Instead, it receives a logger through its constructor.
class UserService {
  private logger: ILogger;

  // The dependency (ILogger) is "injected" via the constructor.
  constructor(logger: ILogger) {
    this.logger = logger;
  }

  createUser(name: string): void {
    // The UserService uses the logger without knowing its concrete implementation.
    this.logger.log(`Creating user: ${name}`);
    // ... logic to create a user
  }
}

// 3. The "Injector" or "Container"
// This is the part of the application that is responsible for creating the dependencies and injecting them.
// In a simple application, this might be the main entry point. In a framework like NestJS or Angular, the framework itself acts as the DI container.

console.log("--- Using ConsoleLogger ---");
// Create an instance of the dependency
const consoleLogger = new ConsoleLogger();
// Create an instance of the dependent class and inject the dependency
const userServiceWithConsole = new UserService(consoleLogger);
// Use the service
userServiceWithConsole.createUser("Alice");
// Output: [ConsoleLogger]: Creating user: Alice

console.log("\n--- Using FileLogger ---");
// We can easily swap the dependency without changing the UserService class.
const fileLogger = new FileLogger();
const userServiceWithFile = new UserService(fileLogger);
userServiceWithFile.createUser("Bob");
// Output: [FileLogger]: Writing "Creating user: Bob" to a file.

/**
 * Benefits demonstrated:
 *
 * 1. Decoupling: `UserService` is not tied to a specific logger implementation. It only knows about the `ILogger` interface.
 * 2. Testability: When testing `UserService`, we can easily inject a mock logger to verify that the `log` method is called, without actually writing to the console or a file.
 * 3. Flexibility: We can easily change the logger implementation (e.g., from ConsoleLogger to FileLogger) without modifying the `UserService` code.
 */
