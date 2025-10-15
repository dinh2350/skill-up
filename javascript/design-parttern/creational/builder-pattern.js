/**
 * Builder Pattern
 *
 * The Builder Pattern is a creational pattern that lets you construct complex objects step by step.
 * The pattern allows you to produce different types and representations of an object using the same construction code.
 */

class Burger {
  constructor(builder) {
    this.size = builder.size;
    this.cheese = builder.cheese || false;
    this.pepperoni = builder.pepperoni || false;
    this.lettuce = builder.lettuce || false;
    this.tomato = builder.tomato || false;
  }

  print() {
    console.log(
      `This is a ${this.size} burger with cheese: ${this.cheese}, pepperoni: ${this.pepperoni}, lettuce: ${this.lettuce}, tomato: ${this.tomato}.`
    );
  }
}

class BurgerBuilder {
  constructor(size) {
    this.size = size;
  }

  addCheese() {
    this.cheese = true;
    return this;
  }

  addPepperoni() {
    this.pepperoni = true;
    return this;
  }

  addLettuce() {
    this.lettuce = true;
    return this;
  }

  addTomato() {
    this.tomato = true;
    return this;
  }

  build() {
    return new Burger(this);
  }
}

// Usage
const burger = new BurgerBuilder("large")
  .addCheese()
  .addPepperoni()
  .addLettuce()
  .build();

burger.print();
// Output: This is a large burger with cheese: true, pepperoni: true, lettuce: true, tomato: false.
