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
