# TypeScript Interview Questions

This document contains a list of TypeScript interview questions ranging from junior to senior levels.

## Junior Developer Questions

1.  **What is TypeScript?**

    - TypeScript is a statically typed superset of JavaScript that compiles to plain JavaScript. It adds optional static types, classes, and interfaces to JavaScript.

2.  **Why use TypeScript over JavaScript?**

    - **Static Typing**: Catch errors during development before they happen in production.
    - **Better Tooling**: Improved autocompletion, navigation, and refactoring.
    - **Readability**: Types make the code easier to read and understand.
    - **Scalability**: It's easier to maintain large codebases.

3.  **What are the basic types in TypeScript?**

    - `string`, `number`, `boolean`, `array` (e.g., `number[]` or `Array<number>`), `any`, `null`, `undefined`, `void`, `object`.

4.  **What are interfaces?**

    - Interfaces in TypeScript are used to define the shape of an object. They are a powerful way of defining contracts within your code and for code outside of your project.

5.  **What is the difference between an `interface` and a `type` alias?**

    - **Interfaces**: Can be implemented by classes and can be extended. Declaration merging is possible with interfaces.
    - **Type Aliases**: Can be used for primitives, unions, tuples, and more complex types. They cannot be implemented by classes and do not support declaration merging.

6.  **What are enums?**
    - Enums allow a developer to define a set of named constants. Using enums can make it easier to document intent, or create a set of distinct cases.

## Mid-level Developer Questions

1.  **What are generics?**

    - Generics allow you to create reusable components that can work with a variety of types rather than a single one. This allows users to consume these components and use their own types.

2.  **What are decorators?**

    - Decorators are a special kind of declaration that can be attached to a class declaration, method, accessor, property, or parameter. Decorators use the form `@expression`, where `expression` must evaluate to a function that will be called at runtime with information about the decorated declaration.

3.  **What is the difference between the `unknown` and `any` types?**

    - **`any`**: Opts out of type checking. You can do anything with a value of type `any`.
    - **`unknown`**: A type-safe counterpart of `any`. You must perform some form of type checking (like using a type guard) before you can perform operations on a value of type `unknown`.

4.  **What are utility types? Give some examples.**

    - Utility types are built-in generic types that facilitate common type transformations.
    - Examples:
      - `Partial<T>`: Makes all properties of `T` optional.
      - `Readonly<T>`: Makes all properties of `T` readonly.
      - `Pick<T, K>`: Creates a type by picking a set of properties `K` from `T`.
      - `Omit<T, K>`: Creates a type by picking all properties from `T` and then removing `K`.

5.  **What are type guards?**

    - A type guard is some expression that performs a runtime check that guarantees the type in some scope. `typeof`, `instanceof`, and `in` are common type guards. You can also create user-defined type guards.

6.  **What is the `never` type?**
    - The `never` type represents the type of values that never occur. For instance, `never` is the return type for a function expression or an arrow function expression that always throws an exception or one that never returns.

## Senior Developer Questions

1.  **What are conditional types?**

    - Conditional types help create types that depend on a condition. They take a form that looks like a conditional expression in JavaScript: `T extends U ? X : Y`.

2.  **Explain how `keyof` and `typeof` operators work.**

    - **`typeof`**: When used in a type context, `typeof` gets the type of a variable or property.
    - **`keyof`**: Takes an object type and produces a string or numeric literal union of its keys.

3.  **What are mapped types?**

    - A mapped type is a generic type which uses a union of `PropertyKey`s (created by a `keyof`) to iterate through keys of one type to create another. They allow you to take an existing type and make each of its properties optional, readonly, or nullable.

4.  **How does declaration merging work in TypeScript?**

    - Declaration merging is a feature where the compiler merges two or more separate declarations declared with the same name into a single definition. This is most commonly seen with interfaces.

5.  **What are some advanced uses of generics?**

    - Discuss creating complex generic constraints, using generics with conditional types, and creating generic utility types for advanced type manipulation.

6.  **How would you configure `tsconfig.json` for a large-scale project?**

    - Discuss important compiler options like `strict`, `noImplicitAny`, `strictNullChecks`, `paths` for module resolution, `composite` for project references, and `target`/`lib` for controlling the JavaScript output and available APIs.

7.  **What is module resolution in TypeScript?**
    - Explain how TypeScript locates modules. Discuss the difference between `Classic` and `Node` module resolution strategies and how `baseUrl` and `paths` in `tsconfig.json` can be used to manage module paths.
