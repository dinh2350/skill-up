/**
 * Facade Pattern
 *
 * The Facade Pattern is a structural pattern that provides a simplified interface to a library, a framework, or any other complex set of classes.
 */

class CPU {
  freeze() {
    console.log("CPU: Freezing...");
  }
  jump(position) {
    console.log(`CPU: Jumping to ${position}`);
  }
  execute() {
    console.log("CPU: Executing...");
  }
}

class Memory {
  load(position, data) {
    console.log(`Memory: Loading ${data} to ${position}`);
  }
}

class HardDrive {
  read(lba, size) {
    console.log(`Hard Drive: Reading ${size} sectors from LBA ${lba}`);
    return "some data";
  }
}

// Facade
class ComputerFacade {
  constructor() {
    this.processor = new CPU();
    this.ram = new Memory();
    this.hd = new HardDrive();
  }

  start() {
    this.processor.freeze();
    this.ram.load("0x00", this.hd.read("100", "1024"));
    this.processor.jump("0x00");
    this.processor.execute();
  }
}

// Usage
const computer = new ComputerFacade();
computer.start();
// Output:
// CPU: Freezing...
// Hard Drive: Reading 1024 sectors from LBA 100
// Memory: Loading some data to 0x00
// CPU: Jumping to 0x00
// CPU: Executing...
