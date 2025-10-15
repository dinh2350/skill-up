/**
 * Visitor Pattern
 *
 * The Visitor Pattern is a behavioral pattern that lets you separate algorithms from the objects on which they operate.
 */

class Employee {
  constructor(name, salary) {
    this.name = name;
    this.salary = salary;
  }

  getSalary() {
    return this.salary;
  }

  setSalary(salary) {
    this.salary = salary;
  }

  accept(visitor) {
    visitor.visit(this);
  }
}

class ExtraSalary {
  visit(employee) {
    employee.setSalary(employee.getSalary() * 1.1);
  }
}

class SubstractSalary {
  visit(employee) {
    employee.setSalary(employee.getSalary() * 0.9);
  }
}

// Usage
const dev = new Employee("John", 1000);
console.log(dev.getSalary()); // Output: 1000

dev.accept(new ExtraSalary());
console.log(dev.getSalary()); // Output: 1100

dev.accept(new SubstractSalary());
console.log(dev.getSalary()); // Output: 990
