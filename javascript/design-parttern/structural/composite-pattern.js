/**
 * Composite Pattern
 *
 * The Composite Pattern is a structural pattern that lets you compose objects into tree structures and then work with these structures as if they were individual objects.
 */

class Component {
  constructor(name) {
    this.name = name;
  }

  add(component) {}
  remove(component) {}
  display() {}
}

class Leaf extends Component {
  constructor(name) {
    super(name);
  }

  display() {
    console.log(this.name);
  }
}

class Composite extends Component {
  constructor(name) {
    super(name);
    this.children = [];
  }

  add(component) {
    this.children.push(component);
  }

  remove(component) {
    const index = this.children.indexOf(component);
    if (index !== -1) {
      this.children.splice(index, 1);
    }
  }

  display() {
    console.log(this.name);
    this.children.forEach((child) => {
      child.display();
    });
  }
}

// Usage
const tree = new Composite("root");
const branch1 = new Composite("branch1");
const branch2 = new Composite("branch2");

const leaf1 = new Leaf("leaf1");
const leaf2 = new Leaf("leaf2");
const leaf3 = new Leaf("leaf3");

tree.add(branch1);
tree.add(branch2);

branch1.add(leaf1);
branch1.add(leaf2);

branch2.add(leaf3);

tree.display();
// Output:
// root
// branch1
// leaf1
// leaf2
// branch2
// leaf3
