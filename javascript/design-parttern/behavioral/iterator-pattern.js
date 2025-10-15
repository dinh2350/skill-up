/**
 * Iterator Pattern
 *
 * The Iterator Pattern is a behavioral pattern that lets you traverse elements of a collection without exposing its underlying representation (list, stack, tree, etc.).
 */

class Iterator {
  constructor(items) {
    this.index = 0;
    this.items = items;
  }

  first() {
    this.reset();
    return this.next();
  }

  next() {
    return this.items[this.index++];
  }

  hasNext() {
    return this.index <= this.items.length;
  }

  reset() {
    this.index = 0;
  }

  each(callback) {
    for (let item = this.first(); this.hasNext(); item = this.next()) {
      callback(item);
    }
  }
}

// Usage
const items = ["one", 2, "circle", true, "Applepie"];
const iter = new Iterator(items);

iter.each(function (item) {
  console.log(item);
});
// Output:
// one
// 2
// circle
// true
// Applepie
