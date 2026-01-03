# HTML - HyperText Markup Language

## 📋 Overview

HTML (HyperText Markup Language) is the standard markup language for creating web pages. It describes the structure of a web page and tells the browser how to display content.

**Estimated Learning Time:** 2-3 weeks

---

## 📚 Table of Contents

1. [Introduction to HTML](#1-introduction-to-html)
2. [HTML Document Structure](#2-html-document-structure)
3. [Text Elements](#3-text-elements)
4. [Links and Navigation](#4-links-and-navigation)
5. [Images and Media](#5-images-and-media)
6. [Lists](#6-lists)
7. [Tables](#7-tables)
8. [Forms and Input](#8-forms-and-input)
9. [Semantic HTML5](#9-semantic-html5)
10. [Meta Tags and SEO](#10-meta-tags-and-seo)
11. [Accessibility (a11y)](#11-accessibility-a11y)
12. [Best Practices](#12-best-practices)
13. [Practice Projects](#13-practice-projects)

---

## 1. Introduction to HTML

### What is HTML?

HTML stands for **HyperText Markup Language**. It's not a programming language; it's a markup language that uses tags to define elements within a document.

### How HTML Works

```
Browser Request → Server Response (HTML) → Browser Renders Page
```

### HTML Tags Syntax

```html
<tagname attribute="value">Content</tagname>

<!-- Self-closing tags -->
<tagname attribute="value" />
```

### Your First HTML File

```html
<!DOCTYPE html>
<html>
<head>
    <title>My First Page</title>
</head>
<body>
    <h1>Hello, World!</h1>
    <p>This is my first webpage.</p>
</body>
</html>
```

---

## 2. HTML Document Structure

### The DOCTYPE Declaration

```html
<!DOCTYPE html>
```
Tells the browser this is an HTML5 document.

### Basic Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Meta information goes here -->
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Page description for SEO">
    <title>Page Title</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <!-- Visible content goes here -->
    
    <script src="script.js"></script>
</body>
</html>
```

### Essential Head Elements

| Element | Purpose |
|---------|---------|
| `<meta charset>` | Character encoding (UTF-8) |
| `<meta viewport>` | Responsive design settings |
| `<title>` | Page title (browser tab) |
| `<link>` | External resources (CSS, fonts) |
| `<script>` | JavaScript files |
| `<style>` | Internal CSS |

---

## 3. Text Elements

### Headings (h1 - h6)

```html
<h1>Main Heading (only one per page)</h1>
<h2>Section Heading</h2>
<h3>Subsection Heading</h3>
<h4>Sub-subsection</h4>
<h5>Minor Heading</h5>
<h6>Smallest Heading</h6>
```

### Paragraphs and Text

```html
<p>This is a paragraph of text.</p>

<p>This paragraph has <strong>bold text</strong> and <em>italic text</em>.</p>

<p>You can also use <b>bold</b> and <i>italic</i> for styling only.</p>
```

### Text Formatting Tags

| Tag | Purpose | Example |
|-----|---------|---------|
| `<strong>` | Important text (bold) | `<strong>Important</strong>` |
| `<em>` | Emphasized text (italic) | `<em>Emphasized</em>` |
| `<mark>` | Highlighted text | `<mark>Highlighted</mark>` |
| `<small>` | Smaller text | `<small>Fine print</small>` |
| `<del>` | Deleted text | `<del>Removed</del>` |
| `<ins>` | Inserted text | `<ins>Added</ins>` |
| `<sub>` | Subscript | `H<sub>2</sub>O` |
| `<sup>` | Superscript | `x<sup>2</sup>` |
| `<code>` | Code snippet | `<code>console.log()</code>` |
| `<pre>` | Preformatted text | Preserves whitespace |
| `<blockquote>` | Block quotation | Long quotes |
| `<q>` | Inline quotation | Short quotes |
| `<abbr>` | Abbreviation | `<abbr title="HyperText Markup Language">HTML</abbr>` |

### Line Breaks and Horizontal Rules

```html
<p>First line<br>Second line</p>

<hr> <!-- Horizontal rule/divider -->
```

### Preformatted Text and Code

```html
<pre>
    This text
        preserves
            whitespace
</pre>

<pre><code>
function hello() {
    console.log("Hello, World!");
}
</code></pre>
```

---

## 4. Links and Navigation

### Basic Links

```html
<!-- External link -->
<a href="https://google.com">Visit Google</a>

<!-- Internal link -->
<a href="/about.html">About Us</a>

<!-- Relative link -->
<a href="../contact.html">Contact</a>
```

### Link Attributes

```html
<!-- Open in new tab -->
<a href="https://google.com" target="_blank" rel="noopener noreferrer">
    Google (new tab)
</a>

<!-- Download link -->
<a href="/files/document.pdf" download>Download PDF</a>

<!-- Email link -->
<a href="mailto:hello@example.com">Send Email</a>

<!-- Phone link -->
<a href="tel:+1234567890">Call Us</a>
```

### Anchor Links (Page Navigation)

```html
<!-- Link to section -->
<a href="#section1">Go to Section 1</a>

<!-- Target section -->
<section id="section1">
    <h2>Section 1</h2>
</section>
```

### Navigation Structure

```html
<nav>
    <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/about">About</a></li>
        <li><a href="/services">Services</a></li>
        <li><a href="/contact">Contact</a></li>
    </ul>
</nav>
```

---

## 5. Images and Media

### Images

```html
<!-- Basic image -->
<img src="image.jpg" alt="Description of image">

<!-- With dimensions -->
<img src="image.jpg" alt="Description" width="300" height="200">

<!-- Lazy loading -->
<img src="image.jpg" alt="Description" loading="lazy">
```

### Responsive Images

```html
<!-- srcset for different resolutions -->
<img 
    src="image-small.jpg"
    srcset="image-small.jpg 480w,
            image-medium.jpg 800w,
            image-large.jpg 1200w"
    sizes="(max-width: 600px) 480px,
           (max-width: 900px) 800px,
           1200px"
    alt="Responsive image"
>

<!-- Picture element for art direction -->
<picture>
    <source media="(min-width: 1200px)" srcset="large.jpg">
    <source media="(min-width: 768px)" srcset="medium.jpg">
    <img src="small.jpg" alt="Description">
</picture>
```

### Figure and Figcaption

```html
<figure>
    <img src="chart.png" alt="Sales chart for 2024">
    <figcaption>Figure 1: Annual sales data for 2024</figcaption>
</figure>
```

### Video

```html
<video controls width="640" height="360">
    <source src="video.mp4" type="video/mp4">
    <source src="video.webm" type="video/webm">
    Your browser does not support the video tag.
</video>

<!-- Video attributes -->
<video 
    controls 
    autoplay 
    muted 
    loop 
    poster="thumbnail.jpg"
    preload="metadata"
>
    <source src="video.mp4" type="video/mp4">
</video>
```

### Audio

```html
<audio controls>
    <source src="audio.mp3" type="audio/mpeg">
    <source src="audio.ogg" type="audio/ogg">
    Your browser does not support the audio tag.
</audio>
```

### Embedding External Content

```html
<!-- YouTube video -->
<iframe 
    width="560" 
    height="315" 
    src="https://www.youtube.com/embed/VIDEO_ID"
    title="YouTube video"
    frameborder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media"
    allowfullscreen
></iframe>

<!-- Google Maps -->
<iframe 
    src="https://maps.google.com/maps?q=location&output=embed"
    width="600" 
    height="450"
    loading="lazy"
></iframe>
```

---

## 6. Lists

### Unordered Lists

```html
<ul>
    <li>Item 1</li>
    <li>Item 2</li>
    <li>Item 3</li>
</ul>
```

### Ordered Lists

```html
<!-- Default numbering -->
<ol>
    <li>First item</li>
    <li>Second item</li>
    <li>Third item</li>
</ol>

<!-- Custom start and type -->
<ol start="5" type="A">
    <li>Item E</li>
    <li>Item F</li>
</ol>

<!-- Reversed -->
<ol reversed>
    <li>Third</li>
    <li>Second</li>
    <li>First</li>
</ol>
```

### Description Lists

```html
<dl>
    <dt>HTML</dt>
    <dd>HyperText Markup Language - structure of web pages</dd>
    
    <dt>CSS</dt>
    <dd>Cascading Style Sheets - styling of web pages</dd>
    
    <dt>JavaScript</dt>
    <dd>Programming language - interactivity of web pages</dd>
</dl>
```

### Nested Lists

```html
<ul>
    <li>Frontend
        <ul>
            <li>HTML</li>
            <li>CSS</li>
            <li>JavaScript</li>
        </ul>
    </li>
    <li>Backend
        <ul>
            <li>Node.js</li>
            <li>Python</li>
            <li>Java</li>
        </ul>
    </li>
</ul>
```

---

## 7. Tables

### Basic Table Structure

```html
<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Age</th>
            <th>City</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>John</td>
            <td>25</td>
            <td>New York</td>
        </tr>
        <tr>
            <td>Jane</td>
            <td>30</td>
            <td>London</td>
        </tr>
    </tbody>
    <tfoot>
        <tr>
            <td colspan="3">Total: 2 people</td>
        </tr>
    </tfoot>
</table>
```

### Table with Caption and Spanning

```html
<table>
    <caption>Employee Information</caption>
    <thead>
        <tr>
            <th>Name</th>
            <th colspan="2">Contact</th>
        </tr>
        <tr>
            <th></th>
            <th>Email</th>
            <th>Phone</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td rowspan="2">John Doe</td>
            <td>john@email.com</td>
            <td>123-456-7890</td>
        </tr>
        <tr>
            <td>john.doe@work.com</td>
            <td>098-765-4321</td>
        </tr>
    </tbody>
</table>
```

### Accessible Tables

```html
<table>
    <caption>Quarterly Sales Report</caption>
    <thead>
        <tr>
            <th scope="col">Product</th>
            <th scope="col">Q1</th>
            <th scope="col">Q2</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <th scope="row">Widget A</th>
            <td>$10,000</td>
            <td>$12,000</td>
        </tr>
        <tr>
            <th scope="row">Widget B</th>
            <td>$8,000</td>
            <td>$9,500</td>
        </tr>
    </tbody>
</table>
```

---

## 8. Forms and Input

### Basic Form Structure

```html
<form action="/submit" method="POST">
    <label for="name">Name:</label>
    <input type="text" id="name" name="name" required>
    
    <button type="submit">Submit</button>
</form>
```

### Input Types

```html
<!-- Text inputs -->
<input type="text" placeholder="Enter text">
<input type="email" placeholder="email@example.com">
<input type="password" placeholder="Password">
<input type="tel" placeholder="Phone number">
<input type="url" placeholder="https://example.com">
<input type="search" placeholder="Search...">

<!-- Number inputs -->
<input type="number" min="0" max="100" step="1">
<input type="range" min="0" max="100" value="50">

<!-- Date/Time inputs -->
<input type="date">
<input type="time">
<input type="datetime-local">
<input type="month">
<input type="week">

<!-- Selection inputs -->
<input type="checkbox" id="agree">
<input type="radio" name="gender" value="male">
<input type="radio" name="gender" value="female">

<!-- File input -->
<input type="file" accept=".pdf,.doc,.docx">
<input type="file" accept="image/*" multiple>

<!-- Color picker -->
<input type="color" value="#ff0000">

<!-- Hidden field -->
<input type="hidden" name="userId" value="12345">
```

### Form Elements

```html
<form action="/register" method="POST" enctype="multipart/form-data">
    <!-- Fieldset grouping -->
    <fieldset>
        <legend>Personal Information</legend>
        
        <label for="firstName">First Name:</label>
        <input type="text" id="firstName" name="firstName" required>
        
        <label for="lastName">Last Name:</label>
        <input type="text" id="lastName" name="lastName" required>
    </fieldset>
    
    <!-- Textarea -->
    <label for="bio">Bio:</label>
    <textarea id="bio" name="bio" rows="4" cols="50" 
              placeholder="Tell us about yourself..."></textarea>
    
    <!-- Select dropdown -->
    <label for="country">Country:</label>
    <select id="country" name="country">
        <option value="">Select a country</option>
        <optgroup label="North America">
            <option value="us">United States</option>
            <option value="ca">Canada</option>
        </optgroup>
        <optgroup label="Europe">
            <option value="uk">United Kingdom</option>
            <option value="de">Germany</option>
        </optgroup>
    </select>
    
    <!-- Datalist (autocomplete) -->
    <label for="browser">Browser:</label>
    <input list="browsers" id="browser" name="browser">
    <datalist id="browsers">
        <option value="Chrome">
        <option value="Firefox">
        <option value="Safari">
        <option value="Edge">
    </datalist>
    
    <!-- Buttons -->
    <button type="submit">Register</button>
    <button type="reset">Clear Form</button>
    <button type="button" onclick="validate()">Validate</button>
</form>
```

### Form Validation Attributes

```html
<input type="text" required>                    <!-- Required field -->
<input type="text" minlength="3" maxlength="50"> <!-- Length limits -->
<input type="number" min="18" max="100">        <!-- Number range -->
<input type="email" pattern="[a-z]+@[a-z]+\.[a-z]+"> <!-- Pattern -->
<input type="text" readonly value="Cannot edit"> <!-- Read only -->
<input type="text" disabled>                     <!-- Disabled -->
<input type="text" autofocus>                    <!-- Auto focus -->
<input type="text" autocomplete="name">          <!-- Autocomplete -->
```

---

## 9. Semantic HTML5

### Why Semantic HTML?

- **Accessibility**: Screen readers understand content structure
- **SEO**: Search engines better understand page content
- **Maintainability**: Code is easier to read and maintain
- **Consistency**: Standard structure across web pages

### Semantic Layout Elements

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Semantic HTML Example</title>
</head>
<body>
    <header>
        <nav>
            <ul>
                <li><a href="/">Home</a></li>
                <li><a href="/about">About</a></li>
            </ul>
        </nav>
    </header>
    
    <main>
        <article>
            <header>
                <h1>Article Title</h1>
                <time datetime="2024-01-15">January 15, 2024</time>
            </header>
            
            <section>
                <h2>Section 1</h2>
                <p>Content...</p>
            </section>
            
            <section>
                <h2>Section 2</h2>
                <p>More content...</p>
            </section>
            
            <footer>
                <p>Written by Author Name</p>
            </footer>
        </article>
        
        <aside>
            <h3>Related Articles</h3>
            <ul>
                <li><a href="#">Related 1</a></li>
                <li><a href="#">Related 2</a></li>
            </ul>
        </aside>
    </main>
    
    <footer>
        <p>&copy; 2024 Company Name</p>
        <address>
            Contact: <a href="mailto:info@example.com">info@example.com</a>
        </address>
    </footer>
</body>
</html>
```

### Semantic Elements Reference

| Element | Purpose |
|---------|---------|
| `<header>` | Introductory content, navigation |
| `<nav>` | Navigation links |
| `<main>` | Main content (one per page) |
| `<article>` | Self-contained content |
| `<section>` | Thematic grouping of content |
| `<aside>` | Sidebar, tangential content |
| `<footer>` | Footer content |
| `<figure>` | Self-contained media |
| `<figcaption>` | Caption for figure |
| `<time>` | Date/time |
| `<mark>` | Highlighted text |
| `<details>` | Collapsible content |
| `<summary>` | Summary for details |
| `<dialog>` | Dialog box/modal |

### Interactive Elements

```html
<!-- Collapsible content -->
<details>
    <summary>Click to expand</summary>
    <p>Hidden content that appears when expanded.</p>
</details>

<!-- Dialog/Modal -->
<dialog id="myDialog">
    <h2>Dialog Title</h2>
    <p>Dialog content</p>
    <button onclick="document.getElementById('myDialog').close()">Close</button>
</dialog>

<!-- Progress bar -->
<progress value="70" max="100">70%</progress>

<!-- Meter -->
<meter value="0.6" min="0" max="1" low="0.3" high="0.7" optimum="0.8">
    60%
</meter>
```

---

## 10. Meta Tags and SEO

### Essential Meta Tags

```html
<head>
    <!-- Character encoding -->
    <meta charset="UTF-8">
    
    <!-- Viewport for responsive design -->
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Page description (important for SEO) -->
    <meta name="description" content="A comprehensive guide to learning HTML from scratch.">
    
    <!-- Keywords (less important now) -->
    <meta name="keywords" content="HTML, web development, tutorial">
    
    <!-- Author -->
    <meta name="author" content="Your Name">
    
    <!-- Robots directive -->
    <meta name="robots" content="index, follow">
    
    <!-- Page title -->
    <title>Learn HTML - Complete Guide | Your Site</title>
</head>
```

### Open Graph (Social Media)

```html
<!-- Facebook/LinkedIn -->
<meta property="og:title" content="Learn HTML - Complete Guide">
<meta property="og:description" content="A comprehensive guide to learning HTML.">
<meta property="og:image" content="https://example.com/image.jpg">
<meta property="og:url" content="https://example.com/html-guide">
<meta property="og:type" content="article">

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Learn HTML - Complete Guide">
<meta name="twitter:description" content="A comprehensive guide to learning HTML.">
<meta name="twitter:image" content="https://example.com/image.jpg">
```

### Favicon and Icons

```html
<!-- Favicon -->
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">

<!-- Apple Touch Icon -->
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">

<!-- Web App Manifest -->
<link rel="manifest" href="/site.webmanifest">

<!-- Theme color -->
<meta name="theme-color" content="#ffffff">
```

### Canonical and Language

```html
<!-- Canonical URL (prevent duplicate content) -->
<link rel="canonical" href="https://example.com/page">

<!-- Alternate languages -->
<link rel="alternate" hreflang="en" href="https://example.com/en/page">
<link rel="alternate" hreflang="es" href="https://example.com/es/page">
<link rel="alternate" hreflang="x-default" href="https://example.com/page">
```

---

## 11. Accessibility (a11y)

### Why Accessibility Matters

- Legal requirements (ADA, WCAG)
- Better user experience for everyone
- Improved SEO
- Larger audience reach

### ARIA Attributes

```html
<!-- Roles -->
<div role="navigation">...</div>
<div role="main">...</div>
<div role="button" tabindex="0">Click me</div>

<!-- Labels -->
<button aria-label="Close dialog">×</button>
<input type="text" aria-labelledby="nameLabel">
<div id="nameLabel">Your Name</div>

<!-- States -->
<button aria-expanded="false">Menu</button>
<div aria-hidden="true">Decorative content</div>
<input aria-invalid="true" aria-describedby="error">
<span id="error">Please enter a valid email</span>

<!-- Live regions -->
<div aria-live="polite">Updated content here</div>
<div aria-live="assertive">Important alert!</div>
```

### Accessible Forms

```html
<form>
    <!-- Proper labeling -->
    <label for="email">Email Address:</label>
    <input 
        type="email" 
        id="email" 
        name="email"
        aria-required="true"
        aria-describedby="emailHelp"
    >
    <span id="emailHelp">We'll never share your email.</span>
    
    <!-- Error handling -->
    <label for="password">Password:</label>
    <input 
        type="password" 
        id="password"
        aria-invalid="true"
        aria-describedby="passwordError"
    >
    <span id="passwordError" role="alert">
        Password must be at least 8 characters.
    </span>
</form>
```

### Accessible Images

```html
<!-- Informative image -->
<img src="chart.png" alt="Sales increased by 25% in Q4 2024">

<!-- Decorative image -->
<img src="decoration.png" alt="" role="presentation">

<!-- Complex image with long description -->
<figure>
    <img src="infographic.png" alt="Company growth infographic" 
         aria-describedby="infographicDesc">
    <figcaption id="infographicDesc">
        Detailed description of the infographic...
    </figcaption>
</figure>
```

### Keyboard Navigation

```html
<!-- Skip link -->
<a href="#main-content" class="skip-link">Skip to main content</a>

<!-- Tab order -->
<button tabindex="1">First</button>
<button tabindex="2">Second</button>
<button tabindex="-1">Not in tab order</button>

<!-- Focus management -->
<div tabindex="0" role="button" 
     onkeydown="if(event.key==='Enter') this.click()">
    Clickable div
</div>
```

### Accessibility Checklist

- [ ] All images have appropriate alt text
- [ ] Form inputs have associated labels
- [ ] Color is not the only way to convey information
- [ ] Sufficient color contrast (4.5:1 for text)
- [ ] Page is navigable by keyboard
- [ ] Focus indicators are visible
- [ ] Headings are in logical order (h1 → h2 → h3)
- [ ] Links have descriptive text (not "click here")
- [ ] Error messages are clear and helpful
- [ ] Dynamic content updates are announced

---

## 12. Best Practices

### Code Organization

```html
<!-- Good: Clean, indented, readable -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Title</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header>
        <nav>
            <ul>
                <li><a href="/">Home</a></li>
            </ul>
        </nav>
    </header>
    
    <main>
        <article>
            <h1>Main Title</h1>
            <p>Content goes here.</p>
        </article>
    </main>
    
    <footer>
        <p>&copy; 2024</p>
    </footer>
    
    <script src="script.js"></script>
</body>
</html>
```

### Naming Conventions

```html
<!-- Use lowercase for tags and attributes -->
<div class="container">

<!-- Use kebab-case for classes and IDs -->
<div id="main-content" class="hero-section">

<!-- Meaningful names -->
<button class="btn-primary">Submit</button>
<nav class="main-navigation">
```

### Performance Tips

```html
<!-- Defer JavaScript -->
<script src="script.js" defer></script>

<!-- Async for independent scripts -->
<script src="analytics.js" async></script>

<!-- Preload critical resources -->
<link rel="preload" href="font.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="hero.jpg" as="image">

<!-- Lazy load images -->
<img src="image.jpg" loading="lazy" alt="Description">

<!-- DNS prefetch for external resources -->
<link rel="dns-prefetch" href="//fonts.googleapis.com">
```

### Common Mistakes to Avoid

```html
<!-- ❌ Bad: Using div for everything -->
<div class="header">
    <div class="nav">...</div>
</div>

<!-- ✅ Good: Using semantic elements -->
<header>
    <nav>...</nav>
</header>

<!-- ❌ Bad: Missing alt text -->
<img src="photo.jpg">

<!-- ✅ Good: Descriptive alt text -->
<img src="photo.jpg" alt="Team meeting in conference room">

<!-- ❌ Bad: Using tables for layout -->
<table>
    <tr><td>Column 1</td><td>Column 2</td></tr>
</table>

<!-- ✅ Good: Using CSS for layout -->
<div class="grid">
    <div>Column 1</div>
    <div>Column 2</div>
</div>

<!-- ❌ Bad: Inline styles -->
<p style="color: red; font-size: 20px;">Text</p>

<!-- ✅ Good: External CSS -->
<p class="error-message">Text</p>
```

---

## 13. Practice Projects

### Project 1: Personal Profile Page
**Difficulty:** ⭐ Easy

Create a simple profile page with:
- Your photo and name
- Brief bio paragraph
- List of skills
- Links to social media
- Contact form

### Project 2: Recipe Page
**Difficulty:** ⭐ Easy

Build a recipe page featuring:
- Recipe title and image
- Ingredients list (unordered list)
- Instructions (ordered list)
- Nutritional information table
- Related recipes section

### Project 3: Blog Article
**Difficulty:** ⭐⭐ Medium

Create a blog article with:
- Header with navigation
- Article with proper heading hierarchy
- Images with captions
- Blockquotes
- Sidebar with related posts
- Comments section form
- Footer with copyright

### Project 4: Landing Page
**Difficulty:** ⭐⭐ Medium

Build a product landing page:
- Hero section with call-to-action
- Features section
- Pricing table
- Testimonials
- FAQ with collapsible answers
- Newsletter signup form
- Footer with multiple columns

### Project 5: Documentation Page
**Difficulty:** ⭐⭐⭐ Hard

Create a technical documentation:
- Fixed sidebar navigation
- Multiple sections with anchor links
- Code examples with `<pre>` and `<code>`
- Tables for reference
- Proper semantic structure
- Accessibility compliant

---

## 📖 Additional Resources

### Documentation
- [MDN HTML Reference](https://developer.mozilla.org/en-US/docs/Web/HTML)
- [W3C HTML Specification](https://html.spec.whatwg.org/)
- [HTML Living Standard](https://html.spec.whatwg.org/multipage/)

### Interactive Learning
- [freeCodeCamp HTML Course](https://www.freecodecamp.org/learn/responsive-web-design/)
- [Codecademy HTML Course](https://www.codecademy.com/learn/learn-html)
- [W3Schools HTML Tutorial](https://www.w3schools.com/html/)

### Tools
- [HTML Validator](https://validator.w3.org/)
- [Can I Use](https://caniuse.com/) - Browser compatibility
- [HTML5 Outliner](https://gsnedders.html5.org/outliner/) - Document structure

### Accessibility
- [WAVE Accessibility Tool](https://wave.webaim.org/)
- [WCAG Guidelines](https://www.w3.org/WAI/standards-guidelines/wcag/)
- [A11y Project](https://www.a11yproject.com/)

---

## ✅ Learning Checklist

- [ ] Understand HTML document structure
- [ ] Master all text formatting elements
- [ ] Create links and navigation
- [ ] Work with images and media
- [ ] Build lists and tables
- [ ] Create accessible forms
- [ ] Use semantic HTML5 elements
- [ ] Implement meta tags for SEO
- [ ] Apply accessibility best practices
- [ ] Complete at least 3 practice projects

---

**Next:** [CSS Fundamentals](../02-css/README.md)

*Estimated completion time: 2-3 weeks with daily practice*
