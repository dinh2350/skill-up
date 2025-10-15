/**
 * Factory Pattern
 *
 * The Factory Pattern is a creational pattern that provides an interface for creating objects in a superclass,
 * but allows subclasses to alter the type of objects that will be created.
 * It's useful when you need to create different objects based on some condition.
 */

class Dog {
  speak() {
    return "Woof!";
  }
}

class Cat {
  speak() {
    return "Meow!";
  }
}

class AnimalFactory {
  createAnimal(type) {
    switch (type) {
      case "dog":
        return new Dog();
      case "cat":
        return new Cat();
      default:
        throw new Error("Unknown animal type");
    }
  }
}

// Usage
const factory = new AnimalFactory();

const dog = factory.createAnimal("dog");
console.log(dog.speak()); // Output: Woof!

const cat = factory.createAnimal("cat");
console.log(cat.speak()); // Output: Meow!
