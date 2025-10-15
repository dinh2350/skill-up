/**
 * Strategy Pattern
 *
 * The Strategy Pattern is a behavioral pattern that lets you define a family of algorithms,
 * put each of them into a separate class, and make their objects interchangeable.
 */

class Shipping {
  setStrategy(strategy) {
    this.strategy = strategy;
  }

  calculate(pkg) {
    return this.strategy.calculate(pkg);
  }
}

class UPS {
  calculate(pkg) {
    // calculations...
    return "$45.95";
  }
}

class USPS {
  calculate(pkg) {
    // calculations...
    return "$39.40";
  }
}

class FedEx {
  calculate(pkg) {
    // calculations...
    return "$43.20";
  }
}

// Usage
const shipping = new Shipping();
const ups = new UPS();
const usps = new USPS();
const fedex = new FedEx();
const pkg = { from: "76712", to: "10012", weigth: "1.3" };

shipping.setStrategy(ups);
console.log("UPS Strategy: " + shipping.calculate(pkg)); // Output: UPS Strategy: $45.95

shipping.setStrategy(usps);
console.log("USPS Strategy: " + shipping.calculate(pkg)); // Output: USPS Strategy: $39.40

shipping.setStrategy(fedex);
console.log("FedEx Strategy: " + shipping.calculate(pkg)); // Output: FedEx Strategy: $43.20
