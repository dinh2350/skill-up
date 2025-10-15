/**
 * Prototype Pattern
 *
 * The Prototype Pattern is a creational pattern that lets you copy existing objects without making your code dependent on their classes.
 * In JavaScript, this pattern is implemented using object cloning.
 */

const car = {
  wheels: 4,
  init() {
    return `I have ${this.wheels} wheels.`;
  },
};

// Usage
const myCar = Object.create(car, { owner: { value: "John" } });

console.log(myCar.init()); // Output: I have 4 wheels.
console.log(myCar.owner); // Output: John
console.log(myCar.__proto__ === car); // Output: true
