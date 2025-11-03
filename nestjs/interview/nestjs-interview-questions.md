# NestJS Interview Questions

This document contains a list of NestJS interview questions ranging from junior to senior levels.

## Junior Developer Questions

1.  **What is NestJS?**

    - NestJS is a progressive Node.js framework for building efficient, reliable, and scalable server-side applications. It uses modern JavaScript, is built with and fully supports TypeScript, and combines elements of OOP (Object-Oriented Programming), FP (Functional Programming), and FRP (Functional Reactive Programming).

2.  **What are the main building blocks of a NestJS application?**

    - **Modules**: Used to organize the application structure.
    - **Controllers**: Responsible for handling incoming requests and returning responses.
    - **Providers (Services)**: Can be injected as dependencies into other components. They are used to abstract business logic.

3.  **What is a decorator in NestJS? Give some examples.**

    - Decorators are a key feature of NestJS, used to add metadata to classes, methods, or properties.
    - Examples: `@Module()`, `@Controller()`, `@Injectable()`, `@Get()`, `@Post()`, `@Body()`, `@Param()`.

4.  **What is a DTO (Data Transfer Object)?**

    - A DTO is an object that defines how data will be sent over the network. It's a good practice to use DTOs to validate the request body. The `class-validator` and `class-transformer` libraries are often used for this.

5.  **How do you define a route in NestJS?**

    - Routes are defined within a controller using decorators like `@Get()`, `@Post()`, `@Put()`, `@Delete()`, etc. The path for the controller is defined with the `@Controller()` decorator.

6.  **What is dependency injection in NestJS?**
    - Dependency Injection (DI) is a design pattern where a class requests dependencies from external sources rather than creating them itself. NestJS has a built-in DI system. You can inject a provider (like a service) into a controller by adding it to the controller's constructor.

7.  **What are Injection Scopes in NestJS?**
    - Injection scopes determine the lifetime of a provider instance. NestJS supports three scopes:
      - **SINGLETON (default)**: A single instance is shared across the entire application. The instance is created once and reused.
      - **REQUEST**: A new instance is created for each incoming request and garbage collected after the request completes.
      - **TRANSIENT**: A new instance is created each time the provider is injected.
    - You can specify the scope using the `@Injectable()` decorator: `@Injectable({ scope: Scope.REQUEST })`
    - **Important considerations**:
      - REQUEST-scoped providers can impact performance as new instances are created for each request.
      - When a provider is REQUEST-scoped, all providers that depend on it become REQUEST-scoped as well.
      - TRANSIENT providers are never shared, so each consumer gets a fresh instance.

## Mid-level Developer Questions

1.  **What are pipes in NestJS?**

    - Pipes are used for transformation and validation of incoming data. They operate on the arguments being processed by a route handler. A common use case is validating the request body against a DTO. NestJS comes with built-in pipes like `ValidationPipe` and `ParseIntPipe`.

2.  **What are guards in NestJS?**

    - Guards are used for authorization. They determine whether a given request will be handled by the route handler or not, depending on certain conditions (like user roles or permissions). They implement the `CanActivate` interface.

3.  **What are interceptors in NestJS?**

    - Interceptors are used to bind extra logic to a request/response cycle. They can transform the result from a method, transform the exception thrown from a method, extend the basic method behavior, or completely override a method. They implement the `NestInterceptor` interface.

4.  **What is the difference between middleware and interceptors?**

    - **Middleware**: Runs before the route handler. It has access to the raw request and response objects (`req`, `res`). It's mainly used for tasks like logging, CORS, or handling cookies. Middleware is less "Nest-aware" than interceptors.
    - **Interceptors**: Have access to the `ExecutionContext`, which provides more details about the current process. They can be used for both request and response manipulation and are more integrated into the NestJS lifecycle.

5.  **How do you handle configuration in a NestJS application?**

    - The `@nestjs/config` module is the standard way to handle configuration. It uses a `.env` file to store environment variables and provides a `ConfigService` to access them in a type-safe way.

6.  **Explain how to connect to a database in NestJS.**
    - NestJS provides modules for integrating with various databases. For SQL databases, `@nestjs/typeorm` is commonly used. For NoSQL databases like MongoDB, `@nestjs/mongoose` is a popular choice. You configure the connection in the root module and then inject the repository or model into your services.

7.  **What are Dynamic Modules in NestJS?**
    - Dynamic modules allow you to create customizable modules that can register providers dynamically at runtime. They're essential for creating reusable modules that need configuration.
    - **Key characteristics**:
      - They return a `DynamicModule` object instead of being decorated with `@Module()`.
      - Commonly use static methods like `register()`, `forRoot()`, or `forRootAsync()` to accept configuration.
      - The returned object must include a `module` property pointing to the module class itself.
    - **Common patterns**:
      - **`register()`**: Used for configuring a module with specific options for the calling module. Each importing module gets its own instance.
      - **`forRoot()`**: Used for configuring a module once at the root level, typically for singleton services like database connections.
      - **`forRootAsync()`**: Similar to `forRoot()` but accepts asynchronous configuration (useful for `ConfigService`).
      - **`forFeature()`**: Used to configure specific features of a module in different contexts (e.g., specific repositories in TypeORM).
    - **Example use case**: The `@nestjs/config` module uses `ConfigModule.forRoot()` to accept configuration options, and `TypeOrmModule.forRoot()` accepts database connection options.
    - **Benefits**: Enables creation of highly reusable and configurable modules that can be shared across projects or published as npm packages.

## Senior Developer Questions

1.  **What are custom decorators? How do you create one?**

    - Custom decorators allow you to compose multiple decorators into one or to create a decorator that extracts data from the request in a reusable way. You can create a custom decorator using the `createParamDecorator()` function.

2.  **Explain the request lifecycle in NestJS.**

    - A request goes through the following flow:
      1.  Middleware
      2.  Guards
      3.  Interceptors (before the handler)
      4.  Pipes
      5.  Route Handler
      6.  Interceptors (after the handler)
      7.  Exception Filters

3.  **What are microservices in the context of NestJS?**

    - NestJS has first-class support for building microservices. It provides a `Microservice` module that allows you to create services that communicate over different transport layers like TCP, Redis, gRPC, or RabbitMQ.

4.  **How does NestJS handle asynchronous operations?**

    - NestJS is built on Node.js and fully supports `async/await`. Route handlers, services, and other components can be `async` functions that return a `Promise`. NestJS will automatically resolve the promise before sending the response.

5.  **What are some strategies for testing a NestJS application?**

    - Discuss different types of testing:
      - **Unit Testing**: Testing individual components (services, controllers) in isolation. NestJS provides a `Test.createTestingModule()` to create a testing module.
      - **Integration Testing**: Testing how multiple components work together, often involving a database connection.
      - **End-to-End (e2e) Testing**: Testing the full request/response cycle. The NestJS starter project comes with a setup for e2e testing using Supertest.

6.  **How would you implement a custom provider?**

    - Discuss the different ways to define a provider:
      - **Class Provider**: The standard way, using `@Injectable()`.
      - **Value Provider**: Using `useValue` to provide a constant value.
      - **Factory Provider**: Using `useFactory` to dynamically create a provider. This is useful when the provider has complex dependencies.
      - **Alias Provider**: Using `useExisting` to create an alias for an existing provider.

7.  **What is CQRS (Command and Query Responsibility Segregation) and how can it be implemented in NestJS?**
    - CQRS is a pattern that separates read and write operations for a data store. NestJS provides a `@nestjs/cqrs` module that helps implement this pattern with building blocks like Commands, Queries, Events, and Sagas.

8.  **What is Module Reference and how is it used?**
    - `ModuleRef` is a class that provides access to the internal list of providers and allows you to retrieve any provider dynamically at runtime using its injection token.
    - **Key features**:
      - **`get()`**: Retrieves a provider instance by token. Works with singleton-scoped providers.
      - **`resolve()`**: Similar to `get()` but works with REQUEST-scoped and TRANSIENT-scoped providers, returning a new instance.
      - **`create()`**: Dynamically instantiates a class that hasn't been registered as a provider.
    - **Use cases**:
      - Accessing providers dynamically when the specific provider isn't known at compile time.
      - Implementing factory patterns or plugin systems.
      - Working with circular dependencies in complex scenarios.
    - **Example**: `const service = this.moduleRef.get(MyService);`
    - **Important**: You must inject `ModuleRef` into your class constructor to use it.

9.  **What is Lazy-loading Modules in NestJS?**
    - Lazy-loading allows you to load modules on-demand rather than at application startup, which can significantly reduce bootstrap time and memory footprint.
    - **Key concepts**:
      - Particularly useful for serverless environments (AWS Lambda, Google Cloud Functions) where startup time matters.
      - Background jobs, cron tasks, or CLI applications that don't need all modules loaded at once.
      - Modules are loaded using `LazyModuleLoader` service.
    - **Implementation**:
      - Inject `LazyModuleLoader` into your service or controller.
      - Use `lazyModuleLoader.load()` to load a module at runtime.
      - Returns a module reference that you can use to retrieve providers.
    - **Example**:
      ```typescript
      const moduleRef = await this.lazyModuleLoader.load(() => LazyModule);
      const service = moduleRef.get(LazyService);
      ```
    - **Benefits**: Improved application startup time, reduced memory usage, better resource utilization in serverless environments.
    - **Considerations**: First invocation will be slower as the module needs to be loaded and initialized.

10. **What is Execution Context in NestJS?**
    - `ExecutionContext` is an object that provides details about the current request being processed. It's available in guards, interceptors, and exception filters.
    - **Key features**:
      - Extends `ArgumentsHost` and provides additional methods for getting handler and class references.
      - **`getHandler()`**: Returns a reference to the route handler method being invoked.
      - **`getClass()`**: Returns the type of the controller class to which the current handler belongs.
      - **`switchToHttp()`**: Returns an HTTP-specific context (request, response, next).
      - **`switchToRpc()`**: Returns an RPC-specific context for microservices.
      - **`switchToWs()`**: Returns a WebSocket-specific context.
      - **`getType()`**: Returns the context type ('http', 'rpc', 'ws').
    - **Use cases**:
      - Creating context-aware guards that work across HTTP, WebSocket, and microservices.
      - Accessing custom metadata attached to handlers using `Reflector`.
      - Building universal interceptors that handle different transport layers.
    - **Example**:
      ```typescript
      const request = context.switchToHttp().getRequest();
      const handler = context.getHandler();
      ```

11. **What are Lifecycle Events in NestJS?**
    - Lifecycle events (hooks) allow you to respond to key moments in the lifecycle of a module, provider, or controller.
    - **Available lifecycle hooks** (in order):
      1. **`onModuleInit()`**: Called once the host module's dependencies have been resolved. Good for initialization logic.
      2. **`onApplicationBootstrap()`**: Called once all modules have been initialized, just before the application starts listening for connections.
      3. **`onModuleDestroy()`**: Called when the module is being destroyed (before cleanup).
      4. **`beforeApplicationShutdown()`**: Called before the application shutdown process begins. Receives a signal parameter.
      5. **`onApplicationShutdown()`**: Called during the shutdown process. Cleanup logic goes here.
    - **Implementation**: Classes implement interfaces like `OnModuleInit`, `OnApplicationBootstrap`, etc.
    - **Example**:
      ```typescript
      @Injectable()
      export class MyService implements OnModuleInit, OnApplicationShutdown {
        onModuleInit() {
          console.log('Module initialized');
        }
        onApplicationShutdown(signal?: string) {
          console.log('Application shutting down', signal);
        }
      }
      ```
    - **Use cases**: Database connection setup/teardown, graceful shutdown, resource cleanup, cache warming, subscription management.

12. **What is the Discovery Service in NestJS?**
    - `DiscoveryService` is part of the `@nestjs/core` package that allows you to discover and retrieve information about providers, controllers, and their metadata at runtime.
    - **Key features**:
      - **`getProviders()`**: Returns all providers registered in the application.
      - **`getControllers()`**: Returns all controllers registered in the application.
      - Each returned wrapper contains the instance and metadata about the provider/controller.
      - Works in conjunction with `MetadataScanner` and `Reflector` to inspect decorators and metadata.
    - **Use cases**:
      - Building framework extensions or plugins that need to discover decorated classes.
      - Implementing automatic registration systems (e.g., finding all classes with a specific decorator).
      - Creating command patterns where you discover all command handlers automatically.
      - Building scheduling systems that discover methods with `@Cron()` decorators.
    - **Example**:
      ```typescript
      const providers = this.discoveryService.getProviders();
      const myProviders = providers.filter(wrapper => 
        wrapper.metatype && this.reflector.get('my-metadata', wrapper.metatype)
      );
      ```
    - **Best practice**: Often used with custom decorators and the `Reflector` service to build powerful meta-programming capabilities.
    - **Note**: This is an advanced feature typically used when building libraries, frameworks, or complex plugin systems on top of NestJS.
