/**
 * Mediator Pattern
 *
 * The Mediator Pattern is a behavioral pattern that lets you reduce chaotic dependencies between objects.
 * The pattern restricts direct communications between the objects and forces them to collaborate only via a mediator object.
 */

class Member {
  constructor(name) {
    this.name = name;
    this.chatroom = null;
  }

  send(message, toMember) {
    this.chatroom.send(message, this, toMember);
  }

  receive(message, fromMember) {
    console.log(`${fromMember.name} to ${this.name}: ${message}`);
  }
}

class Chatroom {
  constructor() {
    this.members = {};
  }

  addMember(member) {
    this.members[member.name] = member;
    member.chatroom = this;
  }

  send(message, fromMember, toMember) {
    toMember.receive(message, fromMember);
  }
}

// Usage
const chat = new Chatroom();

const bob = new Member("Bob");
const john = new Member("John");
const tim = new Member("Tim");

chat.addMember(bob);
chat.addMember(john);
chat.addMember(tim);

bob.send("Hey, John", john); // Output: Bob to John: Hey, John
john.send("What's up, Bob?", bob); // Output: John to Bob: What's up, Bob?
tim.send("Hi everyone!", bob); // Output: Tim to Bob: Hi everyone!
