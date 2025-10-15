/**
 * Observer Pattern
 *
 * The Observer Pattern is a behavioral pattern that lets you define a subscription mechanism to notify multiple objects about any events that happen to the object they’re observing.
 */

class Subject {
  constructor() {
    this.observers = [];
  }

  subscribe(observer) {
    this.observers.push(observer);
  }

  unsubscribe(observer) {
    this.observers = this.observers.filter((obs) => obs !== observer);
  }

  notify(data) {
    this.observers.forEach((observer) => observer.update(data));
  }
}

class Observer {
  constructor(name) {
    this.name = name;
  }

  update(data) {
    console.log(`${this.name} received data: ${data}`);
  }
}

// Usage
const subject = new Subject();

const observer1 = new Observer("Observer 1");
const observer2 = new Observer("Observer 2");

subject.subscribe(observer1);
subject.subscribe(observer2);

subject.notify("Hello World!");
// Output:
// Observer 1 received data: Hello World!
// Observer 2 received data: Hello World!

subject.unsubscribe(observer1);

subject.notify("Goodbye World!");
// Output:
// Observer 2 received data: Goodbye World!
