/**
 * Adapter Pattern
 *
 * The Adapter Pattern is a structural pattern that allows objects with incompatible interfaces to collaborate.
 * It acts as a wrapper between two objects.
 */

class OldCalculator {
  constructor() {
    this.operations = function (term1, term2, operation) {
      switch (operation) {
        case "add":
          return term1 + term2;
        case "sub":
          return term1 - term2;
        default:
          return NaN;
      }
    };
  }
}

class NewCalculator {
  constructor() {
    this.add = function (term1, term2) {
      return term1 + term2;
    };
    this.sub = function (term1, term2) {
      return term1 - term2;
    };
  }
}

class CalculatorAdapter {
  constructor() {
    const newCalc = new NewCalculator();

    this.operations = function (term1, term2, operation) {
      switch (operation) {
        case "add":
          return newCalc.add(term1, term2);
        case "sub":
          return newCalc.sub(term1, term2);
        default:
          return NaN;
      }
    };
  }
}

// Usage
const oldCalc = new OldCalculator();
console.log(oldCalc.operations(10, 5, "add")); // Output: 15

const newCalc = new NewCalculator();
console.log(newCalc.add(10, 5)); // Output: 15

const adaptedCalc = new CalculatorAdapter();
console.log(adaptedCalc.operations(10, 5, "add")); // Output: 15
