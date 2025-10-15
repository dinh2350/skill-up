/**
 * Singleton Pattern
 *
 * The Singleton Pattern is a creational pattern that ensures a class has only one instance
 * and provides a global point of access to it.
 */

class Database {
  constructor(data) {
    if (Database.instance) {
      return Database.instance;
    }
    this.data = data;
    Database.instance = this;
  }

  getData() {
    return this.data;
  }
}

// Usage
const mongo = new Database("mongo");
console.log(mongo.getData()); // Output: mongo

const mysql = new Database("mysql");
console.log(mysql.getData()); // Output: mongo (because it returns the existing instance)
