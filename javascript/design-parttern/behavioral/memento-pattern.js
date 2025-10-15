/**
 * Memento Pattern
 *
 * The Memento Pattern is a behavioral pattern that lets you save and restore the previous state of an object without revealing the details of its implementation.
 */

class Memento {
  constructor(state) {
    this.state = state;
  }

  getState() {
    return this.state;
  }
}

class Originator {
  constructor() {
    this.state = "";
  }

  setState(state) {
    this.state = state;
  }

  getState() {
    return this.state;
  }

  saveStateToMemento() {
    return new Memento(this.state);
  }

  getStateFromMemento(memento) {
    this.state = memento.getState();
  }
}

class CareTaker {
  constructor() {
    this.mementoList = [];
  }

  add(state) {
    this.mementoList.push(state);
  }

  get(index) {
    return this.mementoList[index];
  }
}

// Usage
const originator = new Originator();
const careTaker = new CareTaker();

originator.setState("State #1");
originator.setState("State #2");
careTaker.add(originator.saveStateToMemento());

originator.setState("State #3");
careTaker.add(originator.saveStateToMemento());

originator.setState("State #4");
console.log(`Current State: ${originator.getState()}`); // Output: Current State: State #4

originator.getStateFromMemento(careTaker.get(0));
console.log(`First saved State: ${originator.getState()}`); // Output: First saved State: State #2

originator.getStateFromMemento(careTaker.get(1));
console.log(`Second saved State: ${originator.getState()}`); // Output: Second saved State: State #3
