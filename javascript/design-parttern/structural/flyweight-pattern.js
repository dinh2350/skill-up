/**
 * Flyweight Pattern
 *
 * The Flyweight Pattern is a structural pattern that lets you fit more objects into the available amount of RAM
 * by sharing common parts of state between multiple objects instead of keeping all of the data in each object.
 */

class Book {
  constructor(title, author, isbn) {
    this.title = title;
    this.author = author;
    this.isbn = isbn;
  }
}

const books = new Map();

const createBook = (title, author, isbn) => {
  const existingBook = books.get(isbn);

  if (existingBook) {
    return existingBook;
  }

  const book = new Book(title, author, isbn);
  books.set(isbn, book);

  return book;
};

const bookList = [];

const addBook = (title, author, isbn, availability, sales) => {
  const book = createBook(title, author, isbn);

  bookList.push({
    ...book,
    availability,
    sales,
  });

  return book;
};

// Usage
addBook("The Hobbit", "J.R.R. Tolkien", "12345", true, 100);
addBook("The Hobbit", "J.R.R. Tolkien", "12345", false, 50);
addBook("The Lord of the Rings", "J.R.R. Tolkien", "67890", true, 200);

console.log("Total books created: ", books.size); // Output: Total books created:  2
console.log("Total books in list: ", bookList.length); // Output: Total books in list:  3
console.log(bookList);
