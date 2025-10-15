/**
 * Chain of Responsibility Pattern
 *
 * The Chain of Responsibility Pattern is a behavioral pattern that lets you pass requests along a chain of handlers.
 * Upon receiving a request, each handler decides either to process the request or to pass it to the next handler in the chain.
 */

class Request {
  constructor(amount) {
    this.amount = amount;
    console.log(`Requested: $${amount}\n`);
  }
}

class Handler {
  constructor() {
    this.next = null;
  }

  setNext(handler) {
    this.next = handler;
    return handler;
  }

  handle(request) {
    if (this.next) {
      this.next.handle(request);
    }
  }
}

class Bank extends Handler {
  handle(request) {
    if (request.amount < 500) {
      console.log(`Bank handles the request of $${request.amount}`);
    } else {
      super.handle(request);
    }
  }
}

class CreditUnion extends Handler {
  handle(request) {
    if (request.amount >= 500 && request.amount < 1000) {
      console.log(`Credit Union handles the request of $${request.amount}`);
    } else {
      super.handle(request);
    }
  }
}

class Loan extends Handler {
  handle(request) {
    if (request.amount >= 1000) {
      console.log(`Loan department handles the request of $${request.amount}`);
    } else {
      super.handle(request);
    }
  }
}

// Usage
const bank = new Bank();
const creditUnion = new CreditUnion();
const loan = new Loan();

bank.setNext(creditUnion).setNext(loan);

bank.handle(new Request(300));
bank.handle(new Request(700));
bank.handle(new Request(1200));
bank.handle(new Request(2000));
