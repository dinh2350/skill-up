/**
 * Bridge Pattern
 *
 * The Bridge Pattern is a structural pattern that lets you split a large class or a set of closely related classes into two separate hierarchies—abstraction and implementation—which can be developed independently of each other.
 */

// Abstraction
class Shape {
  constructor(color) {
    this.color = color;
  }
}

// Refined Abstraction
class Circle extends Shape {
  constructor(color) {
    super(color);
  }

  draw() {
    this.color.applyColor("circle");
  }
}

// Refined Abstraction
class Square extends Shape {
  constructor(color) {
    super(color);
  }

  draw() {
    this.color.applyColor("square");
  }
}

// Implementor
class Color {
  applyColor(shape) {
    throw new Error("This method must be overwritten!");
  }
}

// Concrete Implementor
class Red extends Color {
  applyColor(shape) {
    console.log(`Applying red color to ${shape}`);
  }
}

// Concrete Implementor
class Blue extends Color {
  applyColor(shape) {
    console.log(`Applying blue color to ${shape}`);
  }
}

// Usage
const redCircle = new Circle(new Red());
redCircle.draw(); // Output: Applying red color to circle

const blueSquare = new Square(new Blue());
blueSquare.draw(); // Output: Applying blue color to square
