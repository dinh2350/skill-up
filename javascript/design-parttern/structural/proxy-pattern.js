/**
 * Proxy Pattern
 *
 * The Proxy Pattern is a structural pattern that lets you provide a substitute or placeholder for another object.
 * A proxy controls access to the original object, allowing you to perform something either before or after the request gets through to the original object.
 */

class RealImage {
  constructor(fileName) {
    this.fileName = fileName;
    this.loadFromDisk(fileName);
  }

  display() {
    console.log(`Displaying ${this.fileName}`);
  }

  loadFromDisk(fileName) {
    console.log(`Loading ${fileName}`);
  }
}

class ProxyImage {
  constructor(fileName) {
    this.fileName = fileName;
    this.realImage = null;
  }

  display() {
    if (this.realImage === null) {
      this.realImage = new RealImage(this.fileName);
    }
    this.realImage.display();
  }
}

// Usage
const image = new ProxyImage("test.jpg");

// Image will be loaded from disk only when display() is called
image.display();
// Output:
// Loading test.jpg
// Displaying test.jpg

// Image will not be loaded from disk again
image.display();
// Output:
// Displaying test.jpg
