/**
 * Constructor Pattern
 *
 * The Constructor Pattern is a class-based creational pattern that uses constructors to create specific types of objects.
 * In JavaScript, we can use ES6 classes to implement this pattern.
 */

class Person {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }

  greet() {
    return `Hello, my name is ${this.name} and I am ${this.age} years old.`;
  }
}

// Usage
const person1 = new Person("Alice", 30);
const person2 = new Person("Bob", 25);

console.log(person1.greet()); // Output: Hello, my name is Alice and I am 30 years old.
console.log(person2.greet()); // Output: Hello, my name is Bob and I am 25 years old.
