# What are template engines in Express.js?

Template engines in Express.js are tools that enable dynamic HTML generation by combining static templates with data. They allow you to create reusable HTML structures with placeholders that get replaced with actual data at runtime, enabling server-side rendering (SSR) of web pages.

## What is a Template Engine?

A template engine is a software component that:

- **Separates presentation from logic** by using templates with placeholders
- **Generates HTML dynamically** by merging templates with data
- **Provides templating syntax** for loops, conditions, and data binding
- **Enables code reusability** through partials and layouts
- **Supports template inheritance** for consistent page structure

## Popular Express.js Template Engines

### Overview of Major Template Engines

| Template Engine | Syntax Style      | Performance | Features                       | Learning Curve |
| --------------- | ----------------- | ----------- | ------------------------------ | -------------- |
| EJS             | HTML-like         | Good        | Simple, JavaScript expressions | Easy           |
| Pug (Jade)      | Indentation-based | Excellent   | Concise, powerful features     | Moderate       |
| Handlebars      | Mustache-based    | Good        | Logic-less, helpers            | Easy           |
| Mustache        | Logic-less        | Good        | Simple, language-agnostic      | Easy           |
| Nunjucks        | Jinja2-like       | Excellent   | Rich features, extensible      | Moderate       |
| Hbs             | Handlebars        | Good        | Simplified Handlebars          | Easy           |

## Setting Up Template Engines in Express

### Basic Express Template Engine Setup

```javascript
const express = require("express");
const path = require("path");
const app = express();

// Set the view engine
app.set("view engine", "ejs");

// Set the views directory
app.set("views", path.join(__dirname, "views"));

// Optional: Set views cache (production optimization)
if (process.env.NODE_ENV === "production") {
  app.set("view cache", true);
}

app.get("/", (req, res) => {
  const data = {
    title: "Welcome to My App",
    user: { name: "John Doe", email: "john@example.com" },
    items: ["Item 1", "Item 2", "Item 3"],
  };

  res.render("index", data);
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
```

### Multiple Template Engines

```javascript
const express = require("express");
const path = require("path");
const app = express();

// Configure multiple template engines
app.engine("ejs", require("ejs").__express);
app.engine("pug", require("pug").__express);
app.engine("hbs", require("express-handlebars")());

// Set default view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Route using default engine (EJS)
app.get("/", (req, res) => {
  res.render("index", { title: "EJS Page" });
});

// Route using specific engine (Pug)
app.get("/pug", (req, res) => {
  res.render("pugpage.pug", { title: "Pug Page" });
});

// Route using specific engine (Handlebars)
app.get("/handlebars", (req, res) => {
  res.render("hbspage.hbs", { title: "Handlebars Page" });
});

app.listen(3000);
```

## EJS (Embedded JavaScript)

### Basic EJS Setup

```javascript
// app.js
const express = require("express");
const app = express();

app.set("view engine", "ejs");
app.set("views", "./views");

app.get("/", (req, res) => {
  const data = {
    title: "EJS Example",
    user: {
      name: "Alice",
      age: 28,
      isAdmin: true,
    },
    products: [
      { id: 1, name: "Laptop", price: 999.99 },
      { id: 2, name: "Phone", price: 699.99 },
      { id: 3, name: "Tablet", price: 399.99 },
    ],
    currentDate: new Date(),
  };

  res.render("index", data);
});

app.listen(3000);
```

### EJS Template Examples

```html
<!-- views/index.ejs -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title><%= title %></title>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 40px;
      }
      .product {
        border: 1px solid #ccc;
        padding: 10px;
        margin: 10px 0;
      }
      .admin {
        color: red;
        font-weight: bold;
      }
    </style>
  </head>
  <body>
    <h1>Welcome to <%= title %></h1>

    <!-- Conditional rendering -->
    <% if (user.isAdmin) { %>
    <p class="admin">Admin User: <%= user.name %></p>
    <% } else { %>
    <p>Regular User: <%= user.name %></p>
    <% } %>

    <p>Age: <%= user.age %></p>

    <!-- Loop through array -->
    <h2>Products</h2>
    <% if (products && products.length > 0) { %> <% products.forEach(product =>
    { %>
    <div class="product">
      <h3><%= product.name %></h3>
      <p>Price: $<%= product.price.toFixed(2) %></p>
      <p>ID: <%= product.id %></p>
    </div>
    <% }); %> <% } else { %>
    <p>No products available</p>
    <% } %>

    <!-- Include partial -->
    <%- include('partials/footer', { date: currentDate }) %>
  </body>
</html>
```

```html
<!-- views/partials/footer.ejs -->
<footer>
  <hr />
  <p>&copy; 2025 My Company. Generated on <%= date.toLocaleDateString() %></p>
</footer>
```

### Advanced EJS Features

```javascript
// Advanced EJS configuration
const express = require("express");
const app = express();

app.set("view engine", "ejs");
app.set("views", "./views");

// Custom EJS options
app.locals.siteName = "My Awesome Site";
app.locals.formatCurrency = (amount) => `$${amount.toFixed(2)}`;
app.locals.formatDate = (date) =>
  date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

// Helper functions available in all templates
app.locals.truncate = (str, length = 100) => {
  return str.length > length ? str.substring(0, length) + "..." : str;
};

app.get("/products/:id", (req, res) => {
  const product = {
    id: req.params.id,
    name: "Professional Laptop",
    price: 1299.99,
    description:
      "A high-performance laptop perfect for professional work and gaming. Features the latest processor, ample RAM, and a stunning display.",
    inStock: true,
    reviews: [
      { user: "John", rating: 5, comment: "Excellent laptop!" },
      { user: "Jane", rating: 4, comment: "Great performance" },
    ],
    createdAt: new Date(),
  };

  res.render("product-detail", { product });
});

app.listen(3000);
```

```html
<!-- views/product-detail.ejs -->
<!DOCTYPE html>
<html>
  <head>
    <title><%= product.name %> - <%= siteName %></title>
  </head>
  <body>
    <h1><%= product.name %></h1>

    <div class="product-info">
      <p><strong>Price:</strong> <%= formatCurrency(product.price) %></p>
      <p>
        <strong>Description:</strong> <%= truncate(product.description, 150) %>
      </p>
      <p><strong>Available:</strong> <%= product.inStock ? 'Yes' : 'No' %></p>
      <p><strong>Added:</strong> <%= formatDate(product.createdAt) %></p>
    </div>

    <h3>Reviews</h3>
    <% if (product.reviews.length > 0) { %> <% product.reviews.forEach(review =>
    { %>
    <div class="review">
      <strong><%= review.user %></strong>
      <span>(<%= review.rating %>/5 stars)</span>
      <p><%= review.comment %></p>
    </div>
    <% }); %> <% } else { %>
    <p>No reviews yet.</p>
    <% } %>
  </body>
</html>
```

## Pug (formerly Jade)

### Basic Pug Setup

```javascript
// app.js
const express = require("express");
const app = express();

app.set("view engine", "pug");
app.set("views", "./views");

app.get("/", (req, res) => {
  res.render("index", {
    title: "Pug Example",
    user: { name: "Bob", isVip: true },
    menu: ["Home", "About", "Contact"],
    products: [
      { name: "Laptop", price: 999, featured: true },
      { name: "Mouse", price: 25, featured: false },
      { name: "Keyboard", price: 75, featured: true },
    ],
  });
});

app.listen(3000);
```

### Pug Template Examples

```pug
//- views/layout.pug
doctype html
html(lang="en")
  head
    meta(charset="UTF-8")
    meta(name="viewport" content="width=device-width, initial-scale=1.0")
    title= title
    style.
      body { font-family: Arial, sans-serif; margin: 40px; }
      .vip { color: gold; }
      .featured { background-color: #f0f8ff; border: 2px solid #007acc; }
      nav ul { list-style: none; padding: 0; }
      nav li { display: inline; margin-right: 20px; }
  body
    header
      h1= title
    nav
      ul
        each item in menu
          li: a(href=`/${item.toLowerCase()}`)= item
    main
      block content
    footer
      p &copy; 2025 My Company
```

```pug
//- views/index.pug
extends layout

block content
  //- Conditional rendering
  if user.isVip
    p.vip Welcome VIP member: #{user.name}!
  else
    p Welcome #{user.name}

  //- Iteration with conditionals
  h2 Products
  if products && products.length
    each product in products
      div(class= product.featured ? 'product featured' : 'product')
        h3= product.name
        p Price: $#{product.price}
        if product.featured
          span (Featured Product)
  else
    p No products available

  //- Mixin usage
  +productCard('Special Offer', 199, true)

//- Mixin definition
mixin productCard(name, price, isFeatured)
  div(class= isFeatured ? 'product featured' : 'product')
    h4= name
    p= `$${price}`
    if isFeatured
      badge Featured
```

### Advanced Pug Features

```pug
//- views/advanced.pug
extends layout

//- Mixins with attributes and blocks
mixin card(title, className)
  div(class=`card ${className || ''}`)
    if title
      h3.card-title= title
    div.card-body
      if block
        block
      else
        p No content

//- Mixin with default values and validation
mixin button(text, type = 'button', disabled = false)
  - const validTypes = ['button', 'submit', 'reset']
  - const buttonType = validTypes.includes(type) ? type : 'button'

  button(type=buttonType disabled=disabled)
    = text

block content
  //- Use mixins
  +card('User Profile', 'user-card')
    p Name: #{user.name}
    p Status: #{user.isVip ? 'VIP' : 'Regular'}
    +button('Edit Profile', 'button')
    +button('Save', 'submit', !user.canEdit)

  //- Advanced conditionals
  case user.role
    when 'admin'
      p You have administrative privileges
    when 'moderator'
      p You have moderation privileges
    when 'user'
      p Standard user access
    default
      p Unknown user role

  //- Complex data manipulation
  - const featuredProducts = products.filter(p => p.featured)
  - const regularProducts = products.filter(p => !p.featured)

  if featuredProducts.length
    h2 Featured Products
    each product in featuredProducts
      +card(product.name, 'featured')
        p= `Price: $${product.price}`

  if regularProducts.length
    h2 Other Products
    each product in regularProducts
      +card(product.name)
        p= `Price: $${product.price}`
```

## Handlebars

### Basic Handlebars Setup

```javascript
// app.js
const express = require("express");
const exphbs = require("express-handlebars");
const app = express();

// Configure Handlebars
app.engine(
  "handlebars",
  exphbs({
    layoutsDir: "views/layouts",
    partialsDir: "views/partials",
    defaultLayout: "main",
    extname: ".handlebars",
    helpers: {
      // Custom helpers
      formatCurrency: (amount) => `$${amount.toFixed(2)}`,
      formatDate: (date) => date.toLocaleDateString(),
      json: (context) => JSON.stringify(context),
      eq: (a, b) => a === b,
      gt: (a, b) => a > b,
      lt: (a, b) => a < b,
      or: (a, b) => a || b,
      and: (a, b) => a && b,
    },
  })
);

app.set("view engine", "handlebars");

app.get("/", (req, res) => {
  res.render("home", {
    title: "Handlebars Example",
    user: {
      name: "Charlie",
      email: "charlie@example.com",
      role: "admin",
      preferences: {
        theme: "dark",
        notifications: true,
      },
    },
    products: [
      {
        id: 1,
        name: "Laptop",
        price: 999.99,
        category: "electronics",
        inStock: true,
      },
      { id: 2, name: "Book", price: 19.99, category: "books", inStock: false },
      {
        id: 3,
        name: "Headphones",
        price: 149.99,
        category: "electronics",
        inStock: true,
      },
    ],
    stats: {
      totalProducts: 3,
      averagePrice: 389.99,
    },
  });
});

app.listen(3000);
```

### Handlebars Template Examples

```handlebars
{{!-- views/layouts/main.handlebars --}}
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{title}} - My Site</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .admin { color: red; font-weight: bold; }
        .product { border: 1px solid #ccc; padding: 15px; margin: 10px 0; }
        .out-of-stock { opacity: 0.5; background-color: #f5f5f5; }
        .electronics { border-left: 4px solid blue; }
        .books { border-left: 4px solid green; }
    </style>
</head>
<body>
    <header>
        <h1>{{title}}</h1>
        {{> navigation}}
    </header>

    <main>
        {{{body}}}
    </main>

    <footer>
        {{> footer}}
    </footer>
</body>
</html>
```

```handlebars
{{!-- views/home.handlebars --}}
<div class="welcome">
    {{#if user}}
        <h2>Welcome, {{user.name}}!</h2>
        <p>Email: {{user.email}}</p>

        {{#if (eq user.role 'admin')}}
            <p class="admin">You have administrator privileges</p>
        {{/if}}

        <h3>Your Preferences</h3>
        <ul>
            <li>Theme: {{user.preferences.theme}}</li>
            <li>Notifications: {{#if user.preferences.notifications}}Enabled{{else}}Disabled{{/if}}</li>
        </ul>
    {{else}}
        <h2>Welcome, Guest!</h2>
        <p><a href="/login">Please log in</a></p>
    {{/if}}
</div>

<div class="products-section">
    <h2>Products ({{stats.totalProducts}} total)</h2>
    <p>Average Price: {{formatCurrency stats.averagePrice}}</p>

    {{#if products}}
        {{#each products}}
            <div class="product {{category}} {{#unless inStock}}out-of-stock{{/unless}}">
                <h3>{{name}} (ID: {{id}})</h3>
                <p>Price: {{formatCurrency price}}</p>
                <p>Category: {{category}}</p>
                <p>Status:
                    {{#if inStock}}
                        <span style="color: green;">In Stock</span>
                    {{else}}
                        <span style="color: red;">Out of Stock</span>
                    {{/if}}
                </p>

                {{#if (and inStock (gt price 100))}}
                    <p><strong>Premium Item Available!</strong></p>
                {{/if}}
            </div>
        {{/each}}
    {{else}}
        <p>No products available</p>
    {{/if}}
</div>

{{!-- Using a custom partial with data --}}
{{> product-summary products=products}}
```

```handlebars
{{! views/partials/navigation.handlebars }}
<nav>
  <ul style="list-style: none; padding: 0;">
    <li style="display: inline; margin-right: 20px;"><a href="/">Home</a></li>
    <li style="display: inline; margin-right: 20px;"><a
        href="/products"
      >Products</a></li>
    {{#if user}}
      <li style="display: inline; margin-right: 20px;"><a
          href="/profile"
        >Profile</a></li>
      {{#if (eq user.role "admin")}}
        <li style="display: inline; margin-right: 20px;"><a
            href="/admin"
          >Admin</a></li>
      {{/if}}
      <li style="display: inline; margin-right: 20px;"><a
          href="/logout"
        >Logout</a></li>
    {{else}}
      <li style="display: inline; margin-right: 20px;"><a
          href="/login"
        >Login</a></li>
    {{/if}}
  </ul>
</nav>
```

```handlebars
{{! views/partials/product-summary.handlebars }}
<div class="summary">
  <h3>Product Summary</h3>
  {{#if products}}
    <ul>
      {{#each products}}
        <li>
          {{name}}
          -
          {{formatCurrency price}}
          {{#unless inStock}}(Out of Stock){{/unless}}
        </li>
      {{/each}}
    </ul>

    {{#if (gt products.length 5)}}
      <p><em>Showing large product catalog</em></p>
    {{/if}}
  {{else}}
    <p>No products to summarize</p>
  {{/if}}
</div>
```

```handlebars
{{! views/partials/footer.handlebars }}
<hr />
<p>&copy; 2025 My Company. All rights reserved.</p>
<p>Generated on {{formatDate (new Date)}}</p>
```

## Nunjucks Template Engine

### Basic Nunjucks Setup

```javascript
// app.js
const express = require("express");
const nunjucks = require("nunjucks");
const app = express();

// Configure Nunjucks
nunjucks.configure("views", {
  autoescape: true,
  express: app,
  watch: true, // Enable auto-reload in development
  noCache: process.env.NODE_ENV !== "production",
});

app.set("view engine", "njk");

// Global variables
app.locals.siteName = "My Nunjucks Site";
app.locals.version = "1.0.0";

app.get("/", (req, res) => {
  res.render("index.njk", {
    title: "Nunjucks Example",
    user: {
      name: "David",
      isAuthenticated: true,
      permissions: ["read", "write", "admin"],
    },
    articles: [
      {
        id: 1,
        title: "First Article",
        excerpt: "This is the first article excerpt...",
        publishedAt: new Date("2024-01-15"),
        tags: ["tech", "javascript"],
        author: { name: "Alice", avatar: "/avatars/alice.jpg" },
      },
      {
        id: 2,
        title: "Second Article",
        excerpt: "This is the second article excerpt...",
        publishedAt: new Date("2024-02-20"),
        tags: ["design", "ui"],
        author: { name: "Bob", avatar: "/avatars/bob.jpg" },
      },
    ],
  });
});

app.listen(3000);
```

### Nunjucks Template Examples

```html
{# views/base.njk #}
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{% block title %}{{ siteName }}{% endblock %}</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 40px;
        line-height: 1.6;
      }
      .article {
        border: 1px solid #ddd;
        padding: 20px;
        margin: 15px 0;
      }
      .tags {
        margin: 10px 0;
      }
      .tag {
        background: #007acc;
        color: white;
        padding: 3px 8px;
        border-radius: 12px;
        font-size: 12px;
        margin-right: 5px;
      }
      .author {
        display: flex;
        align-items: center;
        margin-top: 10px;
      }
      .author img {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        margin-right: 10px;
      }
    </style>
    {% block head %}{% endblock %}
  </head>
  <body>
    <header>
      {% block header %}
      <h1>{{ siteName }}</h1>
      {% endblock %}
    </header>

    <main>{% block content %}{% endblock %}</main>

    <footer>
      {% block footer %}
      <hr />
      <p>&copy; 2025 {{ siteName }}. Version {{ version }}</p>
      {% endblock %}
    </footer>
  </body>
</html>
```

```html
{# views/index.njk #} {% extends "base.njk" %} {% block title %}{{ title }} - {{
siteName }}{% endblock %} {% block content %}
<div class="welcome">
  {% if user.isAuthenticated %}
  <h2>Welcome back, {{ user.name }}!</h2>

  <h3>Your Permissions:</h3>
  <ul>
    {% for permission in user.permissions %}
    <li>{{ permission | capitalize }}</li>
    {% endfor %}
  </ul>

  {% if 'admin' in user.permissions %}
  <p style="color: red; font-weight: bold;">You have administrative access</p>
  {% endif %} {% else %}
  <h2>Welcome, Guest!</h2>
  <p><a href="/login">Please log in</a></p>
  {% endif %}
</div>

<section class="articles">
  <h2>Latest Articles ({{ articles | length }})</h2>

  {% if articles %} {% for article in articles %}
  <article class="article">
    <h3>{{ article.title }}</h3>
    <p>{{ article.excerpt }}</p>

    <div class="tags">
      {% for tag in article.tags %}
      <span class="tag">{{ tag }}</span>
      {% endfor %}
    </div>

    <div class="author">
      <img src="{{ article.author.avatar }}" alt="{{ article.author.name }}" />
      <span>By {{ article.author.name }}</span>
      <span> • {{ article.publishedAt | date('F j, Y') }}</span>
    </div>

    {% if loop.first %}
    <p><em>Latest article!</em></p>
    {% endif %}
  </article>
  {% endfor %} {% else %}
  <p>No articles available</p>
  {% endif %}
</section>

{# Using macros #} {% from 'macros.njk' import renderButton, renderCard %} {{
renderButton('Read More', '/articles', 'primary') }} {{ renderCard('Newsletter',
'Subscribe to get updates', 'newsletter-form') }} {% endblock %}
```

```html
{# views/macros.njk #} {% macro renderButton(text, url, type='button') %}
<a
  href="{{ url }}"
  class="btn btn-{{ type }}"
  style="background: #007acc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;"
>
  {{ text }}
</a>
{% endmacro %} {% macro renderCard(title, description, className='') %}
<div
  class="card {{ className }}"
  style="border: 1px solid #ddd; padding: 20px; margin: 10px 0;"
>
  {% if title %}
  <h4>{{ title }}</h4>
  {% endif %} {% if description %}
  <p>{{ description }}</p>
  {% endif %} {{ caller() if caller }}
</div>
{% endmacro %} {% macro renderForm(fields) %}
<form method="POST">
  {% for field in fields %}
  <div style="margin: 10px 0;">
    <label>{{ field.label }}:</label>
    <input
      type="{{ field.type | default('text') }}"
      name="{{ field.name }}"
      {%
      if
      field.required
      %}required{%
      endif
      %}
      {%
      if
      field.placeholder
      %}placeholder="{{ field.placeholder }}"
      {%
      endif
      %}
      style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"
    />
  </div>
  {% endfor %}
  <button
    type="submit"
    style="background: #007acc; color: white; padding: 10px 20px; border: none; border-radius: 4px;"
  >
    Submit
  </button>
</form>
{% endmacro %}
```

## Template Engine Performance Optimization

### Caching Configuration

```javascript
const express = require("express");
const app = express();

// Environment-based optimization
const isProduction = process.env.NODE_ENV === "production";

// EJS with caching
app.set("view engine", "ejs");
app.set("views", "./views");

if (isProduction) {
  // Enable view caching in production
  app.set("view cache", true);

  // Compile all templates at startup
  app.set("view options", {
    cache: true,
    compileDebug: false,
  });
}

// Performance monitoring middleware
app.use((req, res, next) => {
  const startTime = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    console.log(`${req.method} ${req.path} - ${duration}ms`);
  });

  next();
});

// Optimized rendering with data preparation
app.get("/products", async (req, res) => {
  try {
    const startTime = Date.now();

    // Prepare all data before rendering
    const products = await getProducts(); // Mock async function
    const categories = await getCategories();
    const user = await getCurrentUser(req);

    const renderData = {
      title: "Products",
      products: products,
      categories: categories,
      user: user,
      meta: {
        totalProducts: products.length,
        renderTime: Date.now() - startTime,
      },
    };

    res.render("products", renderData);
  } catch (error) {
    res.status(500).render("error", {
      error: error.message,
      title: "Error",
    });
  }
});

// Mock async functions
async function getProducts() {
  return [
    { id: 1, name: "Product 1", price: 99.99 },
    { id: 2, name: "Product 2", price: 149.99 },
  ];
}

async function getCategories() {
  return ["Electronics", "Books", "Clothing"];
}

async function getCurrentUser(req) {
  return { name: "John Doe", isLoggedIn: true };
}

app.listen(3000);
```

### Template Compilation and Preloading

```javascript
const express = require("express");
const fs = require("fs");
const path = require("path");
const ejs = require("ejs");
const app = express();

// Template precompilation for production
class TemplateManager {
  constructor() {
    this.compiledTemplates = new Map();
    this.templateCache = new Map();
  }

  async precompileTemplates() {
    const viewsDir = path.join(__dirname, "views");
    const templateFiles = this.findTemplateFiles(viewsDir);

    for (const filePath of templateFiles) {
      try {
        const templateContent = fs.readFileSync(filePath, "utf8");
        const relativePath = path.relative(viewsDir, filePath);
        const templateName = relativePath.replace(/\.ejs$/, "");

        // Precompile template
        const compiled = ejs.compile(templateContent, {
          filename: filePath,
          cache: true,
        });

        this.compiledTemplates.set(templateName, compiled);
        console.log(`Precompiled template: ${templateName}`);
      } catch (error) {
        console.error(`Error precompiling ${filePath}:`, error.message);
      }
    }
  }

  findTemplateFiles(dir, files = []) {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        this.findTemplateFiles(fullPath, files);
      } else if (item.endsWith(".ejs")) {
        files.push(fullPath);
      }
    }

    return files;
  }

  async renderTemplate(templateName, data) {
    const compiled = this.compiledTemplates.get(templateName);
    if (compiled) {
      return compiled(data);
    }
    throw new Error(`Template not found: ${templateName}`);
  }
}

const templateManager = new TemplateManager();

// Initialize templates on startup
(async () => {
  if (process.env.NODE_ENV === "production") {
    await templateManager.precompileTemplates();
  }
})();

app.set("view engine", "ejs");
app.set("views", "./views");

// Custom render function for production
app.use((req, res, next) => {
  const originalRender = res.render;

  res.render = function (templateName, data, callback) {
    if (
      process.env.NODE_ENV === "production" &&
      templateManager.compiledTemplates.has(templateName)
    ) {
      try {
        const html = templateManager.renderTemplate(templateName, {
          ...app.locals,
          ...data,
        });
        return this.send(html);
      } catch (error) {
        console.error("Template rendering error:", error);
        return originalRender.call(this, templateName, data, callback);
      }
    }

    return originalRender.call(this, templateName, data, callback);
  };

  next();
});

app.get("/", (req, res) => {
  res.render("index", {
    title: "Optimized Template",
    message: "This template is optimized for performance",
  });
});

app.listen(3000);
```

## Choosing the Right Template Engine

### Decision Matrix

```javascript
// Template engine selection helper
class TemplateEngineSelector {
  static getRecommendation(requirements) {
    const {
      teamExperience,
      performanceNeeds,
      syntaxPreference,
      projectComplexity,
      maintenanceRequirements,
    } = requirements;

    const scores = {
      ejs: this.scoreEJS(requirements),
      pug: this.scorePug(requirements),
      handlebars: this.scoreHandlebars(requirements),
      nunjucks: this.scoreNunjucks(requirements),
    };

    const recommended = Object.entries(scores).sort(
      ([, a], [, b]) => b - a
    )[0][0];

    return {
      recommended,
      scores,
      reasoning: this.getReasoningFor(recommended, requirements),
    };
  }

  static scoreEJS(req) {
    let score = 0;
    if (req.teamExperience === "beginner") score += 30;
    if (req.syntaxPreference === "html-like") score += 25;
    if (req.performanceNeeds === "moderate") score += 20;
    if (req.projectComplexity === "simple") score += 15;
    return score;
  }

  static scorePug(req) {
    let score = 0;
    if (req.teamExperience === "advanced") score += 25;
    if (req.syntaxPreference === "concise") score += 30;
    if (req.performanceNeeds === "high") score += 25;
    if (req.projectComplexity === "complex") score += 20;
    return score;
  }

  static scoreHandlebars(req) {
    let score = 0;
    if (req.teamExperience === "intermediate") score += 20;
    if (req.syntaxPreference === "logic-less") score += 30;
    if (req.maintenanceRequirements === "low") score += 20;
    if (req.projectComplexity === "moderate") score += 15;
    return score;
  }

  static scoreNunjucks(req) {
    let score = 0;
    if (req.teamExperience === "advanced") score += 20;
    if (req.performanceNeeds === "high") score += 25;
    if (req.projectComplexity === "complex") score += 25;
    if (req.syntaxPreference === "powerful") score += 20;
    return score;
  }

  static getReasoningFor(engine, requirements) {
    const reasons = {
      ejs: [
        "Easy to learn for HTML developers",
        "JavaScript expressions feel natural",
        "Good community support",
      ],
      pug: [
        "Excellent performance",
        "Clean, concise syntax",
        "Powerful features and mixins",
      ],
      handlebars: [
        "Logic-less templates promote separation",
        "Good for team collaboration",
        "Extensive helper system",
      ],
      nunjucks: [
        "Feature-rich with inheritance",
        "Good performance characteristics",
        "Powerful template features",
      ],
    };

    return reasons[engine] || [];
  }
}

// Usage example
const projectRequirements = {
  teamExperience: "intermediate",
  performanceNeeds: "high",
  syntaxPreference: "concise",
  projectComplexity: "complex",
  maintenanceRequirements: "moderate",
};

const recommendation =
  TemplateEngineSelector.getRecommendation(projectRequirements);
console.log("Recommended template engine:", recommendation);
```

## Best Practices

### Template Organization

```javascript
// Organized template structure
const express = require("express");
const path = require("path");
const app = express();

// Template engine configuration
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Template organization structure:
// views/
//   ├── layouts/
//   │   ├── main.ejs
//   │   ├── admin.ejs
//   │   └── auth.ejs
//   ├── partials/
//   │   ├── header.ejs
//   │   ├── footer.ejs
//   │   ├── navigation.ejs
//   │   └── components/
//   │       ├── product-card.ejs
//   │       └── user-profile.ejs
//   ├── pages/
//   │   ├── home.ejs
//   │   ├── about.ejs
//   │   └── contact.ejs
//   ├── products/
//   │   ├── list.ejs
//   │   ├── detail.ejs
//   │   └── edit.ejs
//   └── errors/
//       ├── 404.ejs
//       └── 500.ejs

// Template data preparation service
class TemplateDataService {
  static async prepareCommonData(req) {
    return {
      user: await this.getCurrentUser(req),
      navigation: await this.getNavigationItems(req),
      notifications: await this.getNotifications(req),
      meta: {
        timestamp: new Date(),
        environment: process.env.NODE_ENV,
        version: process.env.APP_VERSION,
      },
    };
  }

  static async getCurrentUser(req) {
    // Mock user data
    return req.session?.user || null;
  }

  static async getNavigationItems(req) {
    const items = [
      { name: "Home", url: "/", active: req.path === "/" },
      {
        name: "Products",
        url: "/products",
        active: req.path.startsWith("/products"),
      },
      { name: "About", url: "/about", active: req.path === "/about" },
    ];

    return items;
  }

  static async getNotifications(req) {
    // Mock notifications
    return [{ type: "info", message: "Welcome to our site!" }];
  }
}

// Middleware to prepare common template data
app.use(async (req, res, next) => {
  try {
    res.locals.common = await TemplateDataService.prepareCommonData(req);
    next();
  } catch (error) {
    console.error("Error preparing template data:", error);
    next();
  }
});

// Route handlers
app.get("/", async (req, res) => {
  try {
    const data = {
      title: "Home Page",
      featuredProducts: await getFeaturedProducts(),
    };

    res.render("pages/home", data);
  } catch (error) {
    res.status(500).render("errors/500", { error: error.message });
  }
});

app.get("/products/:id", async (req, res) => {
  try {
    const product = await getProduct(req.params.id);
    if (!product) {
      return res.status(404).render("errors/404", {
        title: "Product Not Found",
      });
    }

    res.render("products/detail", {
      title: product.name,
      product: product,
      relatedProducts: await getRelatedProducts(product.category),
    });
  } catch (error) {
    res.status(500).render("errors/500", { error: error.message });
  }
});

// Mock functions
async function getFeaturedProducts() {
  return [{ id: 1, name: "Featured Product 1", price: 99.99 }];
}

async function getProduct(id) {
  return { id, name: `Product ${id}`, price: 149.99, category: "electronics" };
}

async function getRelatedProducts(category) {
  return [{ id: 2, name: "Related Product 1", price: 79.99 }];
}

app.listen(3000);
```

## Summary

### Template Engine Benefits:

1. **Separation of Concerns** - Keep HTML separate from business logic
2. **Code Reusability** - Use layouts, partials, and components
3. **Dynamic Content** - Generate HTML based on data
4. **Maintainability** - Easier to update UI across the application
5. **Team Collaboration** - Designers and developers can work independently

### Key Features:

- **Template Inheritance** - Base layouts with content blocks
- **Partials/Components** - Reusable template pieces
- **Helpers/Filters** - Custom functions for data formatting
- **Conditional Rendering** - Show/hide content based on data
- **Loops** - Iterate over collections
- **Data Binding** - Display dynamic content securely

### Choosing Guidelines:

- **EJS**: Choose for HTML familiarity and JavaScript comfort
- **Pug**: Choose for concise syntax and high performance
- **Handlebars**: Choose for logic-less templates and team safety
- **Nunjucks**: Choose for powerful features and flexibility

Template engines are essential for building maintainable web applications with clean separation between presentation and logic, enabling efficient development and easier maintenance.
