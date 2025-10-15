/**
 * State Pattern
 *
 * The State Pattern is a behavioral pattern that lets an object alter its behavior when its internal state changes. It appears as if the object changed its class.
 */

class Light {
  constructor() {
    this.state = new OffState();
  }

  setState(state) {
    this.state = state;
  }

  on() {
    this.state.on(this);
  }

  off() {
    this.state.off(this);
  }
}

class State {
  on(light) {
    console.log("Light is already on");
  }

  off(light) {
    console.log("Light is already off");
  }
}

class OnState extends State {
  off(light) {
    console.log("Turning light off...");
    light.setState(new OffState());
  }
}

class OffState extends State {
  on(light) {
    console.log("Turning light on...");
    light.setState(new OnState());
  }
}

// Usage
const light = new Light();
light.on(); // Output: Turning light on...
light.off(); // Output: Turning light off...
light.off(); // Output: Light is already off
