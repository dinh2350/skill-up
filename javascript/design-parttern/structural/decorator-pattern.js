/**
 * Decorator Pattern
 *
 * The Decorator Pattern is a structural pattern that lets you attach new behaviors to objects by placing these objects inside special wrapper objects that contain the behaviors.
 */

class Book {
  constructor(title, author, price) {
    this.title = title;
    this.author = author;
    this.price = price;
  }

  getDetails() {
    return `${this.title} by ${this.author}`;
  }
}

// Decorator
function giftWrap(book) {
  book.isGiftWrapped = true;
  book.unwrap = function () {
    return `Unwrapped ${book.getDetails()}`;
  };
  book.getDetails = function () {
    return `${this.title} by ${this.author}, gift-wrapped`;
  };
  return book;
}

// Decorator
function hardback(book) {
  book.isHardback = true;
  book.price += 5;
  return book;
}

// Usage
let book = new Book("The Hobbit", "J.R.R. Tolkien", 10);
console.log(book.getDetails()); // Output: The Hobbit by J.R.R. Tolkien

book = giftWrap(book);
console.log(book.getDetails()); // Output: The Hobbit by J.R.R. Tolkien, gift-wrapped
console.log(book.isGiftWrapped); // Output: true

book = hardback(book);
console.log(book.price); // Output: 15
console.log(book.isHardback); // Output: true
