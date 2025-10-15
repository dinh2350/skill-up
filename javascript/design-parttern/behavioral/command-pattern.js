/**
 * Command Pattern
 *
 * The Command Pattern is a behavioral pattern that turns a request into a stand-alone object that contains all information about the request.
 * This transformation lets you pass requests as a method arguments, delay or queue a request’s execution, and support undoable operations.
 */

class Calculator {
  constructor() {
    this.value = 0;
  }

  add(value) {
    this.value += value;
    console.log(`Value: ${this.value}`);
  }

  subtract(value) {
    this.value -= value;
    console.log(`Value: ${this.value}`);
  }
}

class AddCommand {
  constructor(value) {
    this.value = value;
  }

  execute(calculator) {
    calculator.add(this.value);
  }
}

class SubtractCommand {
  constructor(value) {
    this.value = value;
  }

  execute(calculator) {
    calculator.subtract(this.value);
  }
}

// Usage
const calculator = new Calculator();
const addCommand = new AddCommand(10);
const subtractCommand = new SubtractCommand(5);

addCommand.execute(calculator); // Output: Value: 10
subtractCommand.execute(calculator); // Output: Value: 5
