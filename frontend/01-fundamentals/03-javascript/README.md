# JavaScript - Programming Language for the Web

## 📋 Overview

JavaScript is a versatile, high-level programming language that enables interactive web pages. It's essential for frontend development and powers dynamic content, user interactions, and modern web applications.

**Estimated Learning Time:** 4-6 weeks

---

## 📚 Table of Contents

1. [Introduction to JavaScript](#1-introduction-to-javascript)
2. [Variables and Data Types](#2-variables-and-data-types)
3. [Operators](#3-operators)
4. [Control Flow](#4-control-flow)
5. [Functions](#5-functions)
6. [Arrays](#6-arrays)
7. [Objects](#7-objects)
8. [DOM Manipulation](#8-dom-manipulation)
9. [Events](#9-events)
10. [ES6+ Features](#10-es6-features)
11. [Asynchronous JavaScript](#11-asynchronous-javascript)
12. [Error Handling](#12-error-handling)
13. [Web APIs](#13-web-apis)
14. [Best Practices](#14-best-practices)
15. [Practice Projects](#15-practice-projects)

---

## 1. Introduction to JavaScript

### What is JavaScript?

JavaScript is a dynamic, interpreted programming language that runs in the browser and on servers (Node.js). It's the language of the web.

### Adding JavaScript to HTML

```html
<!-- 1. Inline (avoid) -->
<button onclick="alert('Hello!')">Click me</button>

<!-- 2. Internal Script -->
<script>
    console.log('Hello, World!');
</script>

<!-- 3. External Script (recommended) -->
<script src="script.js"></script>

<!-- 4. Modern: defer and async -->
<script src="script.js" defer></script>  <!-- Waits for HTML -->
<script src="analytics.js" async></script> <!-- Loads independently -->
```

### Your First JavaScript

```javascript
// Single-line comment

/*
 * Multi-line
 * comment
 */

// Output to console
console.log('Hello, World!');
console.warn('Warning message');
console.error('Error message');
console.table([{name: 'John', age: 30}]);

// Alert (avoid in production)
alert('Hello!');

// Prompt for input
const name = prompt('What is your name?');

// Confirm dialog
const confirmed = confirm('Are you sure?');
```

---

## 2. Variables and Data Types

### Variable Declaration

```javascript
// var - function scoped, avoid in modern JS
var oldWay = 'avoid this';

// let - block scoped, can be reassigned
let counter = 0;
counter = 1;  // OK

// const - block scoped, cannot be reassigned
const PI = 3.14159;
// PI = 3.14;  // Error!

// const with objects/arrays - reference is constant
const user = { name: 'John' };
user.name = 'Jane';  // OK - modifying property
// user = {};  // Error - reassigning reference
```

### Primitive Data Types

```javascript
// String
const firstName = 'John';
const lastName = "Doe";
const greeting = `Hello, ${firstName}!`;  // Template literal

// Number (integers and floats)
const age = 30;
const price = 19.99;
const negative = -10;
const infinity = Infinity;
const notANumber = NaN;

// Boolean
const isActive = true;
const isLoggedIn = false;

// Undefined
let notDefined;
console.log(notDefined);  // undefined

// Null
const empty = null;

// Symbol (unique identifier)
const id = Symbol('id');
const anotherId = Symbol('id');
console.log(id === anotherId);  // false

// BigInt (large integers)
const bigNumber = 9007199254740991n;
const anotherBig = BigInt('9007199254740991');
```

### Type Checking

```javascript
typeof 'hello';      // "string"
typeof 42;           // "number"
typeof true;         // "boolean"
typeof undefined;    // "undefined"
typeof null;         // "object" (JavaScript quirk)
typeof {};           // "object"
typeof [];           // "object"
typeof function(){}; // "function"
typeof Symbol();     // "symbol"
typeof 42n;          // "bigint"

// Better type checking
Array.isArray([]);           // true
Number.isNaN(NaN);           // true
Number.isFinite(42);         // true
Object.prototype.toString.call([]);  // "[object Array]"
```

### Type Conversion

```javascript
// String conversion
String(123);          // "123"
(123).toString();     // "123"
123 + '';             // "123"

// Number conversion
Number('123');        // 123
Number('hello');      // NaN
parseInt('42px');     // 42
parseFloat('3.14');   // 3.14
+'123';               // 123

// Boolean conversion
Boolean(1);           // true
Boolean(0);           // false
Boolean('');          // false
Boolean('hello');     // true
Boolean(null);        // false
Boolean(undefined);   // false
!!value;              // Convert to boolean

// Falsy values: false, 0, '', null, undefined, NaN
// Truthy values: everything else
```

---

## 3. Operators

### Arithmetic Operators

```javascript
// Basic arithmetic
5 + 3;    // 8 (addition)
5 - 3;    // 2 (subtraction)
5 * 3;    // 15 (multiplication)
5 / 3;    // 1.666... (division)
5 % 3;    // 2 (modulus/remainder)
5 ** 3;   // 125 (exponentiation)

// Increment/Decrement
let x = 5;
x++;      // Post-increment: returns 5, then x = 6
++x;      // Pre-increment: x = 7, returns 7
x--;      // Post-decrement
--x;      // Pre-decrement

// Assignment operators
let y = 10;
y += 5;   // y = y + 5 → 15
y -= 3;   // y = y - 3 → 12
y *= 2;   // y = y * 2 → 24
y /= 4;   // y = y / 4 → 6
y %= 4;   // y = y % 4 → 2
y **= 3;  // y = y ** 3 → 8
```

### Comparison Operators

```javascript
// Equality
5 == '5';     // true (loose equality, type coercion)
5 === '5';    // false (strict equality, no coercion)
5 != '5';     // false
5 !== '5';    // true

// Always use === and !== !

// Relational
5 > 3;        // true
5 < 3;        // false
5 >= 5;       // true
5 <= 4;       // false

// Comparing strings (lexicographic)
'apple' < 'banana';  // true
'2' > '12';          // true (string comparison!)
```

### Logical Operators

```javascript
// AND - returns first falsy or last value
true && true;     // true
true && false;    // false
'hello' && 'world';  // 'world'
0 && 'hello';     // 0

// OR - returns first truthy or last value
true || false;    // true
false || 'default';  // 'default'
null || undefined || 'fallback';  // 'fallback'

// NOT
!true;            // false
!false;           // true
!0;               // true
!'hello';         // false

// Nullish Coalescing (??) - only null/undefined
null ?? 'default';     // 'default'
undefined ?? 'default'; // 'default'
0 ?? 'default';        // 0 (not null/undefined)
'' ?? 'default';       // '' (not null/undefined)

// Optional Chaining (?.)
const user = { profile: { name: 'John' } };
user?.profile?.name;    // 'John'
user?.settings?.theme;  // undefined (no error)
user?.getFullName?.();  // undefined (safe method call)
```

### Ternary Operator

```javascript
// condition ? valueIfTrue : valueIfFalse
const age = 20;
const status = age >= 18 ? 'adult' : 'minor';

// Nested ternary (avoid for readability)
const score = 85;
const grade = score >= 90 ? 'A' 
            : score >= 80 ? 'B'
            : score >= 70 ? 'C'
            : 'F';
```

---

## 4. Control Flow

### If...Else Statements

```javascript
const age = 20;

if (age >= 18) {
    console.log('Adult');
} else if (age >= 13) {
    console.log('Teenager');
} else {
    console.log('Child');
}

// Single line (use sparingly)
if (age >= 18) console.log('Adult');

// Guard clause pattern
function processUser(user) {
    if (!user) return;
    if (!user.isActive) return;
    
    // Main logic here
    console.log('Processing:', user.name);
}
```

### Switch Statement

```javascript
const day = 'monday';

switch (day) {
    case 'monday':
    case 'tuesday':
    case 'wednesday':
    case 'thursday':
    case 'friday':
        console.log('Weekday');
        break;
    case 'saturday':
    case 'sunday':
        console.log('Weekend');
        break;
    default:
        console.log('Invalid day');
}

// Return from switch in functions
function getDayType(day) {
    switch (day) {
        case 'saturday':
        case 'sunday':
            return 'weekend';
        default:
            return 'weekday';
    }
}
```

### Loops

```javascript
// For loop
for (let i = 0; i < 5; i++) {
    console.log(i);  // 0, 1, 2, 3, 4
}

// While loop
let count = 0;
while (count < 5) {
    console.log(count);
    count++;
}

// Do...While loop (runs at least once)
let num = 0;
do {
    console.log(num);
    num++;
} while (num < 5);

// For...of (iterate values - arrays, strings)
const fruits = ['apple', 'banana', 'cherry'];
for (const fruit of fruits) {
    console.log(fruit);
}

// For...in (iterate keys - objects)
const person = { name: 'John', age: 30 };
for (const key in person) {
    console.log(`${key}: ${person[key]}`);
}

// Loop control
for (let i = 0; i < 10; i++) {
    if (i === 3) continue;  // Skip this iteration
    if (i === 7) break;     // Exit loop
    console.log(i);         // 0, 1, 2, 4, 5, 6
}

// Labeled statements (rare)
outer: for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
        if (i === 1 && j === 1) break outer;
        console.log(i, j);
    }
}
```

---

## 5. Functions

### Function Declaration

```javascript
// Function declaration (hoisted)
function greet(name) {
    return `Hello, ${name}!`;
}

// Function expression
const greet2 = function(name) {
    return `Hello, ${name}!`;
};

// Arrow function (ES6)
const greet3 = (name) => {
    return `Hello, ${name}!`;
};

// Arrow function - concise
const greet4 = name => `Hello, ${name}!`;
const add = (a, b) => a + b;
const getObject = () => ({ name: 'John' });  // Return object
```

### Parameters and Arguments

```javascript
// Default parameters
function greet(name = 'Guest') {
    return `Hello, ${name}!`;
}
greet();         // "Hello, Guest!"
greet('John');   // "Hello, John!"

// Rest parameters
function sum(...numbers) {
    return numbers.reduce((a, b) => a + b, 0);
}
sum(1, 2, 3, 4);  // 10

// Destructuring parameters
function createUser({ name, age, email = 'N/A' }) {
    return { name, age, email };
}
createUser({ name: 'John', age: 30 });

// Arguments object (not in arrow functions)
function oldSum() {
    let total = 0;
    for (let i = 0; i < arguments.length; i++) {
        total += arguments[i];
    }
    return total;
}
```

### Scope and Closures

```javascript
// Global scope
const globalVar = 'I am global';

function outer() {
    // Function scope
    const outerVar = 'I am outer';
    
    function inner() {
        // Block scope
        const innerVar = 'I am inner';
        
        // Closure - inner can access outer's variables
        console.log(globalVar);  // Accessible
        console.log(outerVar);   // Accessible
        console.log(innerVar);   // Accessible
    }
    
    inner();
    // console.log(innerVar);  // Error - not accessible
}

// Closure example
function createCounter() {
    let count = 0;
    return {
        increment: () => ++count,
        decrement: () => --count,
        getCount: () => count
    };
}

const counter = createCounter();
counter.increment();  // 1
counter.increment();  // 2
counter.getCount();   // 2
```

### Higher-Order Functions

```javascript
// Function that takes function as argument
function doOperation(a, b, operation) {
    return operation(a, b);
}

const result = doOperation(5, 3, (x, y) => x + y);  // 8

// Function that returns function
function multiplier(factor) {
    return (number) => number * factor;
}

const double = multiplier(2);
const triple = multiplier(3);
double(5);   // 10
triple(5);   // 15

// Callback pattern
function fetchData(callback) {
    setTimeout(() => {
        const data = { id: 1, name: 'John' };
        callback(data);
    }, 1000);
}

fetchData((data) => {
    console.log('Received:', data);
});
```

### IIFE (Immediately Invoked Function Expression)

```javascript
// Classic IIFE
(function() {
    const privateVar = 'secret';
    console.log('IIFE executed');
})();

// Arrow function IIFE
(() => {
    console.log('Arrow IIFE');
})();

// IIFE with parameters
((name) => {
    console.log(`Hello, ${name}!`);
})('John');
```

---

## 6. Arrays

### Creating Arrays

```javascript
// Array literal
const fruits = ['apple', 'banana', 'cherry'];

// Array constructor
const numbers = new Array(1, 2, 3);
const empty = new Array(5);  // [empty × 5]

// Array.from()
const chars = Array.from('hello');  // ['h', 'e', 'l', 'l', 'o']
const range = Array.from({ length: 5 }, (_, i) => i + 1);  // [1, 2, 3, 4, 5]

// Array.of()
const arr = Array.of(1, 2, 3);  // [1, 2, 3]

// Spread operator
const copy = [...fruits];
const merged = [...fruits, ...numbers];
```

### Array Methods - Mutating

```javascript
const arr = [1, 2, 3];

// Add/Remove from end
arr.push(4);         // [1, 2, 3, 4] - returns new length
arr.pop();           // [1, 2, 3] - returns removed element

// Add/Remove from beginning
arr.unshift(0);      // [0, 1, 2, 3] - returns new length
arr.shift();         // [1, 2, 3] - returns removed element

// Splice - add/remove at any position
arr.splice(1, 1);           // Remove 1 element at index 1
arr.splice(1, 0, 'a', 'b'); // Insert at index 1
arr.splice(1, 2, 'x');      // Replace 2 elements with 'x'

// Sort
const nums = [3, 1, 4, 1, 5];
nums.sort();                 // [1, 1, 3, 4, 5] - lexicographic!
nums.sort((a, b) => a - b);  // Ascending
nums.sort((a, b) => b - a);  // Descending

// Reverse
arr.reverse();

// Fill
const filled = new Array(5).fill(0);  // [0, 0, 0, 0, 0]
```

### Array Methods - Non-Mutating

```javascript
const fruits = ['apple', 'banana', 'cherry', 'banana'];

// Search
fruits.indexOf('banana');      // 1 (first index)
fruits.lastIndexOf('banana');  // 3 (last index)
fruits.includes('apple');      // true
fruits.find(f => f.startsWith('c'));     // 'cherry'
fruits.findIndex(f => f.startsWith('c')); // 2

// Slice
fruits.slice(1, 3);    // ['banana', 'cherry']
fruits.slice(-2);      // ['cherry', 'banana']

// Concat
const more = fruits.concat(['date', 'elderberry']);

// Join
fruits.join(', ');     // 'apple, banana, cherry, banana'

// Flat
const nested = [1, [2, 3], [4, [5, 6]]];
nested.flat();         // [1, 2, 3, 4, [5, 6]]
nested.flat(2);        // [1, 2, 3, 4, 5, 6]

// At (negative indexing)
fruits.at(-1);         // 'banana' (last element)
fruits.at(-2);         // 'cherry'
```

### Array Iteration Methods

```javascript
const numbers = [1, 2, 3, 4, 5];

// forEach - no return value
numbers.forEach((num, index) => {
    console.log(`${index}: ${num}`);
});

// map - transform each element
const doubled = numbers.map(num => num * 2);
// [2, 4, 6, 8, 10]

// filter - keep elements that pass test
const evens = numbers.filter(num => num % 2 === 0);
// [2, 4]

// reduce - accumulate to single value
const sum = numbers.reduce((acc, num) => acc + num, 0);
// 15

const max = numbers.reduce((max, num) => num > max ? num : max);
// 5

// reduceRight - right to left
const reversed = numbers.reduceRight((acc, num) => [...acc, num], []);

// every - all elements pass test
const allPositive = numbers.every(num => num > 0);  // true

// some - at least one passes test
const hasEven = numbers.some(num => num % 2 === 0);  // true

// flatMap - map + flat(1)
const sentences = ['Hello world', 'Goodbye world'];
const words = sentences.flatMap(s => s.split(' '));
// ['Hello', 'world', 'Goodbye', 'world']
```

### Chaining Array Methods

```javascript
const users = [
    { name: 'John', age: 30, active: true },
    { name: 'Jane', age: 25, active: false },
    { name: 'Bob', age: 35, active: true },
    { name: 'Alice', age: 28, active: true }
];

// Get names of active users over 26, sorted by age
const result = users
    .filter(user => user.active && user.age > 26)
    .sort((a, b) => a.age - b.age)
    .map(user => user.name);
// ['Alice', 'John', 'Bob']
```

---

## 7. Objects

### Creating Objects

```javascript
// Object literal
const person = {
    firstName: 'John',
    lastName: 'Doe',
    age: 30,
    greet() {
        return `Hello, I'm ${this.firstName}`;
    }
};

// Constructor function
function Person(name, age) {
    this.name = name;
    this.age = age;
}
const john = new Person('John', 30);

// Object.create()
const proto = { greet() { return 'Hello'; } };
const obj = Object.create(proto);

// Class syntax (ES6)
class User {
    constructor(name, email) {
        this.name = name;
        this.email = email;
    }
    
    greet() {
        return `Hello, ${this.name}`;
    }
}
const user = new User('John', 'john@email.com');
```

### Accessing Properties

```javascript
const person = {
    name: 'John',
    age: 30,
    'favorite-color': 'blue'
};

// Dot notation
person.name;            // 'John'

// Bracket notation
person['name'];         // 'John'
person['favorite-color']; // 'blue'

// Dynamic property access
const key = 'age';
person[key];            // 30

// Optional chaining
const city = person?.address?.city;  // undefined

// Nullish coalescing with optional chaining
const country = person?.address?.country ?? 'Unknown';
```

### Object Methods

```javascript
const person = { name: 'John', age: 30 };

// Get keys, values, entries
Object.keys(person);     // ['name', 'age']
Object.values(person);   // ['John', 30]
Object.entries(person);  // [['name', 'John'], ['age', 30]]

// From entries
const entries = [['a', 1], ['b', 2]];
Object.fromEntries(entries);  // { a: 1, b: 2 }

// Assign (merge/clone)
const clone = Object.assign({}, person);
const merged = Object.assign({}, obj1, obj2);

// Spread operator (preferred)
const clone2 = { ...person };
const merged2 = { ...obj1, ...obj2, extra: 'value' };

// Freeze (immutable)
Object.freeze(person);
person.name = 'Jane';  // Fails silently
Object.isFrozen(person);  // true

// Seal (can modify, can't add/remove)
Object.seal(person);
Object.isSealed(person);  // true

// Check property
'name' in person;              // true
person.hasOwnProperty('name'); // true
Object.hasOwn(person, 'name'); // true (modern)
```

### Destructuring Objects

```javascript
const person = {
    name: 'John',
    age: 30,
    email: 'john@email.com',
    address: {
        city: 'New York',
        country: 'USA'
    }
};

// Basic destructuring
const { name, age } = person;

// Rename variables
const { name: personName, age: personAge } = person;

// Default values
const { phone = 'N/A' } = person;

// Nested destructuring
const { address: { city, country } } = person;

// Rest pattern
const { name: n, ...rest } = person;
// rest = { age: 30, email: 'john@email.com', address: {...} }

// Function parameter destructuring
function greet({ name, age = 0 }) {
    return `Hello, ${name}! You are ${age}.`;
}
greet(person);
```

### Computed Properties and Shorthand

```javascript
// Property shorthand
const name = 'John';
const age = 30;
const person = { name, age };  // { name: 'John', age: 30 }

// Method shorthand
const obj = {
    greet() {
        return 'Hello';
    }
};

// Computed property names
const key = 'dynamicKey';
const obj2 = {
    [key]: 'value',
    [`${key}2`]: 'value2',
    ['method' + 'Name']() { return 'computed method'; }
};
```

### this Keyword

```javascript
// In object method
const person = {
    name: 'John',
    greet() {
        return `Hello, ${this.name}`;
    }
};

// Arrow functions don't have their own 'this'
const person2 = {
    name: 'John',
    greet: () => {
        return `Hello, ${this.name}`;  // 'this' is outer scope!
    }
};

// Binding this
function greet() {
    return `Hello, ${this.name}`;
}

const john = { name: 'John' };
const jane = { name: 'Jane' };

greet.call(john);           // 'Hello, John'
greet.apply(jane);          // 'Hello, Jane'
const boundGreet = greet.bind(john);
boundGreet();               // 'Hello, John'
```

---

## 8. DOM Manipulation

### Selecting Elements

```javascript
// Single element
const element = document.getElementById('myId');
const first = document.querySelector('.myClass');
const input = document.querySelector('input[type="text"]');

// Multiple elements (NodeList)
const elements = document.querySelectorAll('.myClass');
const divs = document.querySelectorAll('div');

// Convert to array for array methods
const elementsArray = [...elements];
const elementsArray2 = Array.from(elements);

// Other selectors
const byClass = document.getElementsByClassName('myClass');  // HTMLCollection
const byTag = document.getElementsByTagName('div');          // HTMLCollection
const byName = document.getElementsByName('email');          // NodeList

// Traversing
element.parentElement;
element.children;           // HTMLCollection
element.childNodes;         // NodeList (includes text nodes)
element.firstElementChild;
element.lastElementChild;
element.nextElementSibling;
element.previousElementSibling;
element.closest('.parent');  // Find ancestor
```

### Creating and Modifying Elements

```javascript
// Create element
const div = document.createElement('div');
const textNode = document.createTextNode('Hello');

// Set content
div.textContent = 'Plain text';       // Text only
div.innerHTML = '<span>HTML</span>';  // Parses HTML
div.innerText = 'Visible text';       // Respects CSS

// Set attributes
div.id = 'myDiv';
div.className = 'container';
div.classList.add('active', 'visible');
div.classList.remove('hidden');
div.classList.toggle('dark-mode');
div.classList.contains('active');    // true

div.setAttribute('data-id', '123');
div.getAttribute('data-id');         // '123'
div.removeAttribute('data-id');
div.hasAttribute('data-id');         // false

// Data attributes
div.dataset.userId = '456';          // data-user-id="456"
console.log(div.dataset.userId);     // '456'

// Styles
div.style.backgroundColor = 'blue';
div.style.cssText = 'color: red; font-size: 16px;';
getComputedStyle(div).backgroundColor;  // Get computed value
```

### DOM Manipulation

```javascript
// Add to DOM
parent.appendChild(child);
parent.append(child1, child2, 'text');  // Multiple items
parent.prepend(child);
parent.insertBefore(newNode, referenceNode);
sibling.after(newNode);
sibling.before(newNode);

// Replace
parent.replaceChild(newChild, oldChild);
oldChild.replaceWith(newChild);

// Remove
parent.removeChild(child);
element.remove();

// Clone
const clone = element.cloneNode(false);    // Shallow
const deepClone = element.cloneNode(true); // With children

// Insert HTML
element.insertAdjacentHTML('beforebegin', '<p>Before</p>');
element.insertAdjacentHTML('afterbegin', '<p>First child</p>');
element.insertAdjacentHTML('beforeend', '<p>Last child</p>');
element.insertAdjacentHTML('afterend', '<p>After</p>');

// Document Fragment (efficient batch insert)
const fragment = document.createDocumentFragment();
for (let i = 0; i < 100; i++) {
    const li = document.createElement('li');
    li.textContent = `Item ${i}`;
    fragment.appendChild(li);
}
list.appendChild(fragment);  // Single DOM update
```

### Working with Forms

```javascript
const form = document.querySelector('form');
const input = document.querySelector('input');

// Get/Set values
input.value;                     // Get value
input.value = 'New value';       // Set value

// Checkbox/Radio
checkbox.checked;                // true/false
checkbox.checked = true;

// Select dropdown
select.value;                    // Selected value
select.selectedIndex;            // Selected index
select.options;                  // All options
select.options[select.selectedIndex].text;  // Selected text

// Form data
const formData = new FormData(form);
formData.get('email');
formData.set('email', 'new@email.com');
formData.append('extra', 'value');

// Convert to object
const data = Object.fromEntries(formData);

// Submit form
form.submit();
form.reset();
```

---

## 9. Events

### Adding Event Listeners

```javascript
const button = document.querySelector('button');

// addEventListener (recommended)
button.addEventListener('click', function(event) {
    console.log('Clicked!', event);
});

// Arrow function
button.addEventListener('click', (e) => {
    console.log('Clicked!', e.target);
});

// Named function (can be removed)
function handleClick(e) {
    console.log('Clicked!');
}
button.addEventListener('click', handleClick);
button.removeEventListener('click', handleClick);

// Options
button.addEventListener('click', handler, {
    once: true,       // Remove after first call
    capture: true,    // Capture phase
    passive: true     // Won't call preventDefault
});

// Inline handlers (avoid)
// <button onclick="handleClick()">Click</button>
```

### Event Object

```javascript
element.addEventListener('click', (e) => {
    // Event properties
    e.type;            // 'click'
    e.target;          // Element that triggered event
    e.currentTarget;   // Element with listener attached
    e.timeStamp;       // When event occurred
    
    // Mouse events
    e.clientX;         // X relative to viewport
    e.clientY;         // Y relative to viewport
    e.pageX;           // X relative to document
    e.pageY;           // Y relative to document
    e.button;          // 0: left, 1: middle, 2: right
    
    // Keyboard events
    e.key;             // 'Enter', 'a', 'Shift'
    e.code;            // 'Enter', 'KeyA', 'ShiftLeft'
    e.altKey;          // Alt pressed?
    e.ctrlKey;         // Ctrl pressed?
    e.shiftKey;        // Shift pressed?
    e.metaKey;         // Cmd/Win pressed?
    
    // Control behavior
    e.preventDefault();   // Prevent default action
    e.stopPropagation();  // Stop bubbling
    e.stopImmediatePropagation();  // Stop all handlers
});
```

### Common Events

```javascript
// Mouse events
element.addEventListener('click', handler);
element.addEventListener('dblclick', handler);
element.addEventListener('mouseenter', handler);  // No bubble
element.addEventListener('mouseleave', handler);  // No bubble
element.addEventListener('mouseover', handler);   // Bubbles
element.addEventListener('mouseout', handler);    // Bubbles
element.addEventListener('mousemove', handler);
element.addEventListener('mousedown', handler);
element.addEventListener('mouseup', handler);
element.addEventListener('contextmenu', handler); // Right-click

// Keyboard events
document.addEventListener('keydown', handler);
document.addEventListener('keyup', handler);
document.addEventListener('keypress', handler);  // Deprecated

// Form events
input.addEventListener('focus', handler);
input.addEventListener('blur', handler);
input.addEventListener('input', handler);    // Every change
input.addEventListener('change', handler);   // On blur
form.addEventListener('submit', handler);
form.addEventListener('reset', handler);

// Window events
window.addEventListener('load', handler);        // All loaded
window.addEventListener('DOMContentLoaded', handler); // DOM ready
window.addEventListener('resize', handler);
window.addEventListener('scroll', handler);
window.addEventListener('beforeunload', handler);

// Touch events
element.addEventListener('touchstart', handler);
element.addEventListener('touchmove', handler);
element.addEventListener('touchend', handler);
```

### Event Delegation

```javascript
// Instead of adding listeners to each item
// Add one listener to parent

const list = document.querySelector('ul');

list.addEventListener('click', (e) => {
    // Check if clicked element is a list item
    if (e.target.matches('li')) {
        console.log('Clicked:', e.target.textContent);
    }
    
    // Or find closest matching ancestor
    const item = e.target.closest('li');
    if (item) {
        console.log('Clicked item:', item.textContent);
    }
});

// Works for dynamically added elements too!
```

### Custom Events

```javascript
// Create custom event
const event = new CustomEvent('userLogin', {
    detail: { userId: 123, username: 'john' },
    bubbles: true,
    cancelable: true
});

// Dispatch event
element.dispatchEvent(event);

// Listen for custom event
element.addEventListener('userLogin', (e) => {
    console.log('User logged in:', e.detail.username);
});
```

---

## 10. ES6+ Features

### Template Literals

```javascript
const name = 'John';
const age = 30;

// String interpolation
const message = `Hello, ${name}! You are ${age} years old.`;

// Multi-line strings
const html = `
    <div class="card">
        <h2>${name}</h2>
        <p>Age: ${age}</p>
    </div>
`;

// Expressions
const result = `Sum: ${5 + 3}`;
const greeting = `Hello, ${name.toUpperCase()}!`;

// Tagged templates
function highlight(strings, ...values) {
    return strings.reduce((result, str, i) => {
        return result + str + (values[i] ? `<mark>${values[i]}</mark>` : '');
    }, '');
}
const highlighted = highlight`Hello ${name}, you are ${age}!`;
```

### Destructuring

```javascript
// Array destructuring
const [first, second, ...rest] = [1, 2, 3, 4, 5];
const [a, , c] = [1, 2, 3];  // Skip elements
const [x = 0, y = 0] = [1];  // Default values

// Swapping variables
let m = 1, n = 2;
[m, n] = [n, m];

// Object destructuring
const { name, age } = { name: 'John', age: 30 };
const { name: userName } = { name: 'John' };  // Rename
const { phone = 'N/A' } = {};  // Default

// Nested destructuring
const { address: { city } } = { address: { city: 'NYC' } };

// Function parameters
function greet({ name, age = 0 }) {
    return `${name} is ${age}`;
}
```

### Spread and Rest Operators

```javascript
// Spread - expand elements
const arr1 = [1, 2, 3];
const arr2 = [...arr1, 4, 5];      // [1, 2, 3, 4, 5]
const arrCopy = [...arr1];

const obj1 = { a: 1, b: 2 };
const obj2 = { ...obj1, c: 3 };    // { a: 1, b: 2, c: 3 }
const objCopy = { ...obj1 };

Math.max(...arr1);                  // 3

// Rest - collect elements
function sum(...numbers) {
    return numbers.reduce((a, b) => a + b, 0);
}

const [first, ...others] = [1, 2, 3, 4];
const { a, ...remaining } = { a: 1, b: 2, c: 3 };
```

### Classes

```javascript
class Animal {
    // Private field
    #secret = 'hidden';
    
    // Static property
    static kingdom = 'Animalia';
    
    constructor(name) {
        this.name = name;
    }
    
    // Instance method
    speak() {
        return `${this.name} makes a sound`;
    }
    
    // Getter
    get info() {
        return `Animal: ${this.name}`;
    }
    
    // Setter
    set nickname(value) {
        this._nickname = value;
    }
    
    // Static method
    static create(name) {
        return new Animal(name);
    }
    
    // Private method
    #privateMethod() {
        return this.#secret;
    }
}

// Inheritance
class Dog extends Animal {
    constructor(name, breed) {
        super(name);  // Call parent constructor
        this.breed = breed;
    }
    
    speak() {
        return `${this.name} barks`;
    }
    
    fetch() {
        return `${this.name} fetches the ball`;
    }
}

const dog = new Dog('Buddy', 'Labrador');
dog.speak();   // "Buddy barks"
dog instanceof Dog;     // true
dog instanceof Animal;  // true
```

### Modules

```javascript
// Named exports (math.js)
export const PI = 3.14159;
export function add(a, b) {
    return a + b;
}
export class Calculator { }

// Default export (logger.js)
export default function log(message) {
    console.log(message);
}

// Named imports
import { PI, add } from './math.js';
import { add as sum } from './math.js';  // Rename
import * as math from './math.js';        // Import all

// Default import
import log from './logger.js';
import myLogger from './logger.js';  // Any name

// Mixed
import log, { PI, add } from './module.js';

// Dynamic import
const module = await import('./math.js');
// Or with .then()
import('./math.js').then(module => {
    console.log(module.PI);
});
```

### New Object/Array Features

```javascript
// Object.entries/fromEntries
const obj = { a: 1, b: 2 };
const entries = Object.entries(obj);  // [['a', 1], ['b', 2]]
const newObj = Object.fromEntries(entries);

// Array methods
[1, 2, 3].includes(2);           // true
[1, 2, 3].at(-1);                // 3
[1, [2, [3]]].flat(2);           // [1, 2, 3]
[1, 2].flatMap(x => [x, x * 2]); // [1, 2, 2, 4]

// Array.from
Array.from('hello');             // ['h', 'e', 'l', 'l', 'o']
Array.from({ length: 3 }, (_, i) => i);  // [0, 1, 2]

// Object.assign
Object.assign({}, obj1, obj2);

// Object.keys/values
Object.keys(obj);    // ['a', 'b']
Object.values(obj);  // [1, 2]
```

---

## 11. Asynchronous JavaScript

### Callbacks

```javascript
// Callback pattern
function fetchData(callback) {
    setTimeout(() => {
        const data = { id: 1, name: 'John' };
        callback(null, data);
    }, 1000);
}

fetchData((error, data) => {
    if (error) {
        console.error(error);
        return;
    }
    console.log(data);
});

// Callback hell (avoid!)
getUser(userId, (user) => {
    getPosts(user.id, (posts) => {
        getComments(posts[0].id, (comments) => {
            // Nested callbacks = hard to read
        });
    });
});
```

### Promises

```javascript
// Creating a promise
const promise = new Promise((resolve, reject) => {
    const success = true;
    
    setTimeout(() => {
        if (success) {
            resolve({ id: 1, name: 'John' });
        } else {
            reject(new Error('Failed to fetch'));
        }
    }, 1000);
});

// Using promises
promise
    .then(data => {
        console.log('Success:', data);
        return data.id;
    })
    .then(id => {
        console.log('ID:', id);
    })
    .catch(error => {
        console.error('Error:', error);
    })
    .finally(() => {
        console.log('Done');
    });

// Promise methods
Promise.all([promise1, promise2])
    .then(([result1, result2]) => { });  // All succeed

Promise.allSettled([promise1, promise2])
    .then(results => { });  // All complete (success or fail)

Promise.race([promise1, promise2])
    .then(firstResult => { });  // First to complete

Promise.any([promise1, promise2])
    .then(firstSuccess => { });  // First to succeed

// Create resolved/rejected promise
Promise.resolve(value);
Promise.reject(error);
```

### Async/Await

```javascript
// Async function
async function fetchUser(id) {
    try {
        const response = await fetch(`/api/users/${id}`);
        
        if (!response.ok) {
            throw new Error('User not found');
        }
        
        const user = await response.json();
        return user;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// Using async function
const user = await fetchUser(1);
// Or
fetchUser(1).then(user => console.log(user));

// Parallel execution
async function fetchAll() {
    const [users, posts] = await Promise.all([
        fetch('/api/users').then(r => r.json()),
        fetch('/api/posts').then(r => r.json())
    ]);
    return { users, posts };
}

// Sequential execution
async function sequential() {
    const user = await fetchUser(1);
    const posts = await fetchPosts(user.id);
    return { user, posts };
}

// Async arrow function
const fetchData = async () => {
    const data = await fetch('/api/data');
    return data.json();
};

// Top-level await (ES modules)
const config = await fetch('/config.json').then(r => r.json());
```

### Fetch API

```javascript
// GET request
const response = await fetch('https://api.example.com/data');
const data = await response.json();

// POST request
const response = await fetch('https://api.example.com/users', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token123'
    },
    body: JSON.stringify({
        name: 'John',
        email: 'john@email.com'
    })
});

// Handle response
if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
}

const result = await response.json();

// Other response methods
await response.text();
await response.blob();
await response.arrayBuffer();
await response.formData();

// Abort fetch
const controller = new AbortController();
const signal = controller.signal;

fetch(url, { signal })
    .then(response => response.json())
    .catch(err => {
        if (err.name === 'AbortError') {
            console.log('Fetch aborted');
        }
    });

// Abort after timeout
setTimeout(() => controller.abort(), 5000);
```

---

## 12. Error Handling

### Try...Catch

```javascript
try {
    // Code that might throw
    const result = riskyOperation();
    console.log(result);
} catch (error) {
    // Handle error
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
} finally {
    // Always runs
    cleanup();
}

// Catch specific errors
try {
    JSON.parse('invalid');
} catch (error) {
    if (error instanceof SyntaxError) {
        console.log('Invalid JSON');
    } else {
        throw error;  // Re-throw unknown errors
    }
}
```

### Throwing Errors

```javascript
// Throw built-in errors
throw new Error('Something went wrong');
throw new TypeError('Expected a string');
throw new RangeError('Value out of range');
throw new ReferenceError('Variable not defined');

// Custom error class
class ValidationError extends Error {
    constructor(message, field) {
        super(message);
        this.name = 'ValidationError';
        this.field = field;
    }
}

function validateEmail(email) {
    if (!email.includes('@')) {
        throw new ValidationError('Invalid email format', 'email');
    }
}

try {
    validateEmail('invalid');
} catch (error) {
    if (error instanceof ValidationError) {
        console.log(`${error.field}: ${error.message}`);
    }
}
```

### Async Error Handling

```javascript
// With promises
fetchData()
    .then(data => processData(data))
    .catch(error => {
        console.error('Error:', error);
    });

// With async/await
async function getData() {
    try {
        const data = await fetchData();
        return processData(data);
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

// Unhandled rejection
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled rejection:', event.reason);
    event.preventDefault();
});

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});
```

---

## 13. Web APIs

### Local Storage / Session Storage

```javascript
// localStorage - persists after browser close
localStorage.setItem('user', JSON.stringify({ id: 1, name: 'John' }));
const user = JSON.parse(localStorage.getItem('user'));
localStorage.removeItem('user');
localStorage.clear();

// sessionStorage - cleared when tab closes
sessionStorage.setItem('token', 'abc123');
const token = sessionStorage.getItem('token');

// Check storage availability
function storageAvailable(type) {
    try {
        const storage = window[type];
        const x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    } catch (e) {
        return false;
    }
}
```

### URL and URLSearchParams

```javascript
// URL API
const url = new URL('https://example.com/path?name=john&age=30');
url.hostname;     // 'example.com'
url.pathname;     // '/path'
url.search;       // '?name=john&age=30'
url.hash;         // ''

// URLSearchParams
const params = new URLSearchParams(url.search);
params.get('name');        // 'john'
params.has('age');         // true
params.set('age', '31');
params.append('city', 'NYC');
params.delete('name');
params.toString();         // 'age=31&city=NYC'

// Iterate params
for (const [key, value] of params) {
    console.log(`${key}: ${value}`);
}

// Build URL with params
const newUrl = new URL('https://api.example.com/search');
newUrl.searchParams.set('q', 'javascript');
newUrl.searchParams.set('page', '1');
console.log(newUrl.href);
```

### Date and Time

```javascript
// Create dates
const now = new Date();
const specific = new Date('2024-01-15');
const fromValues = new Date(2024, 0, 15, 10, 30, 0);  // Month is 0-indexed
const fromTimestamp = new Date(1705312200000);

// Get values
now.getFullYear();     // 2024
now.getMonth();        // 0-11
now.getDate();         // 1-31
now.getDay();          // 0-6 (Sunday = 0)
now.getHours();
now.getMinutes();
now.getSeconds();
now.getMilliseconds();
now.getTime();         // Timestamp

// Set values
now.setFullYear(2025);
now.setMonth(5);
now.setDate(20);

// Formatting
now.toISOString();        // '2024-01-15T10:30:00.000Z'
now.toLocaleDateString(); // '1/15/2024'
now.toLocaleTimeString(); // '10:30:00 AM'
now.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
});

// Intl.DateTimeFormat
const formatter = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'full',
    timeStyle: 'short'
});
formatter.format(now);
```

### Timers

```javascript
// setTimeout
const timeoutId = setTimeout(() => {
    console.log('Delayed');
}, 1000);
clearTimeout(timeoutId);

// setInterval
const intervalId = setInterval(() => {
    console.log('Repeated');
}, 1000);
clearInterval(intervalId);

// requestAnimationFrame
function animate() {
    // Update animation
    requestAnimationFrame(animate);
}
const animationId = requestAnimationFrame(animate);
cancelAnimationFrame(animationId);

// Debounce
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Throttle
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

const debouncedSearch = debounce(search, 300);
const throttledScroll = throttle(handleScroll, 100);
```

### Geolocation

```javascript
// Get current position
navigator.geolocation.getCurrentPosition(
    (position) => {
        console.log('Latitude:', position.coords.latitude);
        console.log('Longitude:', position.coords.longitude);
        console.log('Accuracy:', position.coords.accuracy);
    },
    (error) => {
        switch (error.code) {
            case error.PERMISSION_DENIED:
                console.log('Permission denied');
                break;
            case error.POSITION_UNAVAILABLE:
                console.log('Position unavailable');
                break;
            case error.TIMEOUT:
                console.log('Request timeout');
                break;
        }
    },
    {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    }
);

// Watch position
const watchId = navigator.geolocation.watchPosition(successCallback, errorCallback);
navigator.geolocation.clearWatch(watchId);
```

---

## 14. Best Practices

### Code Quality

```javascript
// Use const by default, let when needed
const MAX_ITEMS = 100;
let currentCount = 0;

// Use meaningful names
// ❌ Bad
const d = new Date();
const u = getUser();

// ✅ Good
const currentDate = new Date();
const currentUser = getUser();

// Use template literals
// ❌ Bad
const message = 'Hello, ' + name + '!';

// ✅ Good
const message = `Hello, ${name}!`;

// Use destructuring
// ❌ Bad
const name = user.name;
const age = user.age;

// ✅ Good
const { name, age } = user;

// Use default parameters
// ❌ Bad
function greet(name) {
    name = name || 'Guest';
}

// ✅ Good
function greet(name = 'Guest') { }

// Use nullish coalescing
// ❌ Bad
const value = input !== null && input !== undefined ? input : 'default';

// ✅ Good
const value = input ?? 'default';
```

### Functions

```javascript
// Single responsibility
// ❌ Bad
function processUser(user) {
    validateUser(user);
    saveUser(user);
    sendEmail(user);
    logActivity(user);
}

// ✅ Good
function processUser(user) {
    if (!validateUser(user)) return;
    saveUser(user);
}
function notifyUser(user) {
    sendEmail(user);
}

// Pure functions when possible
// ❌ Bad (impure)
let total = 0;
function add(value) {
    total += value;
    return total;
}

// ✅ Good (pure)
function add(a, b) {
    return a + b;
}

// Early returns
// ❌ Bad
function processData(data) {
    if (data) {
        if (data.isValid) {
            // Process...
        }
    }
}

// ✅ Good
function processData(data) {
    if (!data) return;
    if (!data.isValid) return;
    // Process...
}
```

### Error Handling

```javascript
// Always handle errors
// ❌ Bad
const data = JSON.parse(jsonString);

// ✅ Good
try {
    const data = JSON.parse(jsonString);
} catch (error) {
    console.error('Invalid JSON:', error);
    return null;
}

// Async error handling
// ❌ Bad
async function fetchData() {
    const response = await fetch(url);
    return response.json();
}

// ✅ Good
async function fetchData() {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Fetch failed:', error);
        throw error;
    }
}
```

### Performance

```javascript
// Avoid unnecessary DOM queries
// ❌ Bad
for (let i = 0; i < 100; i++) {
    document.getElementById('list').innerHTML += `<li>${i}</li>`;
}

// ✅ Good
const list = document.getElementById('list');
const fragment = document.createDocumentFragment();
for (let i = 0; i < 100; i++) {
    const li = document.createElement('li');
    li.textContent = i;
    fragment.appendChild(li);
}
list.appendChild(fragment);

// Debounce expensive operations
window.addEventListener('resize', debounce(handleResize, 250));
window.addEventListener('scroll', throttle(handleScroll, 100));

// Use appropriate data structures
// Use Set for unique values
const uniqueIds = new Set([1, 2, 3, 1, 2]);

// Use Map for key-value pairs with non-string keys
const userMap = new Map();
userMap.set(userObj, userData);
```

### Security

```javascript
// Sanitize user input
// ❌ Bad - XSS vulnerability
element.innerHTML = userInput;

// ✅ Good
element.textContent = userInput;

// Or sanitize HTML
function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Validate data
function validateEmail(email) {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
}

// Use HTTPS for API calls
// ❌ Bad
fetch('http://api.example.com/data');

// ✅ Good
fetch('https://api.example.com/data');
```

---

## 15. Practice Projects

### Project 1: Interactive Form Validation
**Difficulty:** ⭐ Easy

Build a form with:
- Real-time validation
- Error messages
- Password strength meter
- Submit with fetch

### Project 2: Todo Application
**Difficulty:** ⭐⭐ Medium

Create a todo app with:
- Add, edit, delete todos
- Mark complete
- Filter (all, active, completed)
- Local storage persistence
- Drag and drop reorder

### Project 3: Weather App
**Difficulty:** ⭐⭐ Medium

Build a weather app:
- Fetch from weather API
- Search by city
- Display current weather
- 5-day forecast
- Geolocation
- Unit conversion (C/F)

### Project 4: Quiz Game
**Difficulty:** ⭐⭐ Medium

Create an interactive quiz:
- Multiple choice questions
- Timer for each question
- Score tracking
- High scores (localStorage)
- Different categories

### Project 5: Expense Tracker
**Difficulty:** ⭐⭐⭐ Hard

Build an expense tracker:
- Add income/expenses
- Categories
- Charts/visualization
- Filter by date range
- Export to CSV
- LocalStorage or IndexedDB

---

## 📖 Additional Resources

### Documentation
- [MDN JavaScript Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide)
- [javascript.info](https://javascript.info/)
- [ECMAScript Specification](https://tc39.es/ecma262/)

### Interactive Learning
- [freeCodeCamp](https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/)
- [Codecademy JavaScript](https://www.codecademy.com/learn/introduction-to-javascript)
- [Exercism JavaScript Track](https://exercism.org/tracks/javascript)
- [JavaScript30](https://javascript30.com/)

### Books
- "Eloquent JavaScript" by Marijn Haverbeke (free online)
- "You Don't Know JS" series by Kyle Simpson
- "JavaScript: The Good Parts" by Douglas Crockford

### Practice
- [LeetCode](https://leetcode.com/)
- [Codewars](https://www.codewars.com/)
- [HackerRank](https://www.hackerrank.com/domains/javascript)

---

## ✅ Learning Checklist

- [ ] Understand variables and data types
- [ ] Master operators and control flow
- [ ] Write and use functions effectively
- [ ] Work with arrays and array methods
- [ ] Understand objects and object methods
- [ ] Manipulate the DOM
- [ ] Handle events and event delegation
- [ ] Use ES6+ features (destructuring, spread, classes)
- [ ] Work with Promises and async/await
- [ ] Handle errors properly
- [ ] Use Web APIs (localStorage, fetch, etc.)
- [ ] Follow JavaScript best practices
- [ ] Complete at least 3 practice projects

---

**Previous:** [CSS Fundamentals](../02-css/README.md)  
**Next:** [Phase 2: Intermediate](../../02-intermediate/README.md)

*Estimated completion time: 4-6 weeks with daily practice*
