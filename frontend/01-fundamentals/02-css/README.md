# CSS - Cascading Style Sheets

## 📋 Overview

CSS (Cascading Style Sheets) is a stylesheet language used to describe the presentation of a document written in HTML. It controls colors, fonts, spacing, layout, animations, and responsive design.

**Estimated Learning Time:** 3-4 weeks

---

## 📚 Table of Contents

1. [Introduction to CSS](#1-introduction-to-css)
2. [Selectors](#2-selectors)
3. [Colors and Backgrounds](#3-colors-and-backgrounds)
4. [Typography](#4-typography)
5. [Box Model](#5-box-model)
6. [Display and Positioning](#6-display-and-positioning)
7. [Flexbox](#7-flexbox)
8. [CSS Grid](#8-css-grid)
9. [Responsive Design](#9-responsive-design)
10. [Transitions and Animations](#10-transitions-and-animations)
11. [CSS Variables](#11-css-variables)
12. [Pseudo-classes and Pseudo-elements](#12-pseudo-classes-and-pseudo-elements)
13. [Advanced Techniques](#13-advanced-techniques)
14. [Best Practices](#14-best-practices)
15. [Practice Projects](#15-practice-projects)

---

## 1. Introduction to CSS

### What is CSS?

CSS stands for **Cascading Style Sheets**. The "cascade" refers to how styles are applied based on specificity and source order.

### Three Ways to Add CSS

```html
<!-- 1. Inline CSS (avoid) -->
<p style="color: red; font-size: 16px;">Text</p>

<!-- 2. Internal CSS -->
<head>
    <style>
        p {
            color: red;
            font-size: 16px;
        }
    </style>
</head>

<!-- 3. External CSS (recommended) -->
<head>
    <link rel="stylesheet" href="styles.css">
</head>
```

### CSS Syntax

```css
selector {
    property: value;
    property: value;
}

/* Example */
h1 {
    color: blue;
    font-size: 24px;
    margin-bottom: 20px;
}
```

### CSS Comments

```css
/* This is a single-line comment */

/*
 * This is a
 * multi-line comment
 */
```

---

## 2. Selectors

### Basic Selectors

```css
/* Universal Selector */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

/* Element/Type Selector */
p {
    color: black;
}

/* Class Selector */
.container {
    max-width: 1200px;
}

/* ID Selector */
#header {
    background: navy;
}

/* Attribute Selector */
input[type="text"] {
    border: 1px solid gray;
}

[href^="https"] {
    color: green;  /* Starts with https */
}

[href$=".pdf"] {
    color: red;    /* Ends with .pdf */
}

[href*="example"] {
    color: blue;   /* Contains "example" */
}
```

### Combinator Selectors

```css
/* Descendant Selector (space) */
article p {
    line-height: 1.6;  /* All p inside article */
}

/* Child Selector (>) */
ul > li {
    list-style: none;  /* Direct children only */
}

/* Adjacent Sibling Selector (+) */
h1 + p {
    font-size: 1.2em;  /* p immediately after h1 */
}

/* General Sibling Selector (~) */
h1 ~ p {
    color: gray;       /* All p after h1 */
}
```

### Grouping Selectors

```css
/* Multiple selectors */
h1, h2, h3, h4, h5, h6 {
    font-family: 'Georgia', serif;
    color: #333;
}

.btn-primary,
.btn-secondary,
.btn-danger {
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
}
```

### Specificity

Specificity determines which CSS rule is applied when multiple rules target the same element.

```
Specificity Hierarchy (from lowest to highest):
1. Type selectors (h1, p, div)           → 0,0,0,1
2. Class selectors (.class)               → 0,0,1,0
3. ID selectors (#id)                     → 0,1,0,0
4. Inline styles (style="...")            → 1,0,0,0
5. !important                             → Overrides all
```

```css
/* Specificity Examples */
p { color: black; }                    /* 0,0,0,1 */
.text { color: blue; }                 /* 0,0,1,0 */
p.text { color: green; }               /* 0,0,1,1 */
#content p.text { color: red; }        /* 0,1,1,1 */

/* !important - use sparingly */
p {
    color: black !important;           /* Wins over everything */
}
```

---

## 3. Colors and Backgrounds

### Color Values

```css
/* Named Colors */
color: red;
color: tomato;
color: rebeccapurple;

/* Hexadecimal */
color: #ff0000;        /* Red */
color: #f00;           /* Shorthand */
color: #ff000080;      /* With alpha (50% opacity) */

/* RGB / RGBA */
color: rgb(255, 0, 0);
color: rgba(255, 0, 0, 0.5);  /* 50% opacity */

/* HSL / HSLA */
color: hsl(0, 100%, 50%);     /* Hue, Saturation, Lightness */
color: hsla(0, 100%, 50%, 0.5);

/* Modern CSS */
color: rgb(255 0 0 / 50%);    /* New syntax */
color: hsl(0 100% 50% / 50%);
```

### Background Properties

```css
/* Background Color */
background-color: #f5f5f5;

/* Background Image */
background-image: url('image.jpg');
background-image: url('image.jpg'), url('pattern.png');

/* Background Repeat */
background-repeat: no-repeat;
background-repeat: repeat-x;
background-repeat: repeat-y;

/* Background Position */
background-position: center;
background-position: top right;
background-position: 50% 50%;
background-position: 20px 40px;

/* Background Size */
background-size: cover;      /* Cover entire container */
background-size: contain;    /* Fit without cropping */
background-size: 100% auto;
background-size: 200px 100px;

/* Background Attachment */
background-attachment: fixed;   /* Parallax effect */
background-attachment: scroll;

/* Shorthand */
background: #f5f5f5 url('image.jpg') no-repeat center/cover;
```

### Gradients

```css
/* Linear Gradient */
background: linear-gradient(to right, #ff0000, #0000ff);
background: linear-gradient(45deg, red, yellow, green);
background: linear-gradient(to bottom, #000 0%, #333 50%, #000 100%);

/* Radial Gradient */
background: radial-gradient(circle, #fff, #000);
background: radial-gradient(ellipse at top left, #fff, #000);

/* Conic Gradient */
background: conic-gradient(red, yellow, green, blue, red);

/* Repeating Gradients */
background: repeating-linear-gradient(
    45deg,
    #000 0px,
    #000 10px,
    #fff 10px,
    #fff 20px
);
```

---

## 4. Typography

### Font Properties

```css
/* Font Family */
font-family: 'Helvetica Neue', Arial, sans-serif;
font-family: 'Georgia', 'Times New Roman', serif;
font-family: 'Courier New', monospace;

/* Font Size */
font-size: 16px;
font-size: 1rem;      /* Relative to root */
font-size: 1.2em;     /* Relative to parent */
font-size: clamp(1rem, 2vw, 2rem);  /* Responsive */

/* Font Weight */
font-weight: normal;   /* 400 */
font-weight: bold;     /* 700 */
font-weight: 100;      /* Thin */
font-weight: 900;      /* Black */

/* Font Style */
font-style: normal;
font-style: italic;
font-style: oblique;

/* Font Variant */
font-variant: small-caps;

/* Shorthand */
font: italic bold 16px/1.5 'Helvetica', sans-serif;
/*    style weight size/line-height family */
```

### Text Properties

```css
/* Text Alignment */
text-align: left;
text-align: center;
text-align: right;
text-align: justify;

/* Text Decoration */
text-decoration: none;
text-decoration: underline;
text-decoration: line-through;
text-decoration: underline wavy red;

/* Text Transform */
text-transform: uppercase;
text-transform: lowercase;
text-transform: capitalize;

/* Text Indent */
text-indent: 2em;

/* Letter Spacing */
letter-spacing: 2px;
letter-spacing: 0.1em;

/* Word Spacing */
word-spacing: 4px;

/* Line Height */
line-height: 1.6;
line-height: 24px;

/* White Space */
white-space: nowrap;
white-space: pre-wrap;

/* Text Overflow */
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;

/* Word Break */
word-break: break-word;
overflow-wrap: break-word;
```

### Web Fonts

```css
/* Google Fonts (in HTML) */
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">

/* Using in CSS */
body {
    font-family: 'Roboto', sans-serif;
}

/* @font-face for custom fonts */
@font-face {
    font-family: 'CustomFont';
    src: url('fonts/custom.woff2') format('woff2'),
         url('fonts/custom.woff') format('woff');
    font-weight: normal;
    font-style: normal;
    font-display: swap;  /* Prevents FOIT */
}

.custom-text {
    font-family: 'CustomFont', sans-serif;
}
```

### CSS Units Reference

| Unit | Type | Description |
|------|------|-------------|
| `px` | Absolute | Pixels (fixed) |
| `em` | Relative | Relative to parent font-size |
| `rem` | Relative | Relative to root font-size |
| `%` | Relative | Percentage of parent |
| `vw` | Viewport | 1% of viewport width |
| `vh` | Viewport | 1% of viewport height |
| `vmin` | Viewport | 1% of smaller dimension |
| `vmax` | Viewport | 1% of larger dimension |
| `ch` | Relative | Width of "0" character |
| `ex` | Relative | Height of "x" character |

---

## 5. Box Model

### Understanding the Box Model

```
┌─────────────────────────────────────────┐
│                MARGIN                    │
│   ┌─────────────────────────────────┐   │
│   │           BORDER                │   │
│   │   ┌─────────────────────────┐   │   │
│   │   │        PADDING          │   │   │
│   │   │   ┌─────────────────┐   │   │   │
│   │   │   │     CONTENT     │   │   │   │
│   │   │   └─────────────────┘   │   │   │
│   │   └─────────────────────────┘   │   │
│   └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Box Model Properties

```css
/* Width and Height */
width: 300px;
height: 200px;
min-width: 100px;
max-width: 100%;
min-height: 50px;
max-height: 500px;

/* Padding (inside border) */
padding: 20px;                    /* All sides */
padding: 10px 20px;               /* Vertical | Horizontal */
padding: 10px 20px 15px;          /* Top | Horizontal | Bottom */
padding: 10px 20px 15px 25px;     /* Top | Right | Bottom | Left */

padding-top: 10px;
padding-right: 20px;
padding-bottom: 15px;
padding-left: 25px;

/* Margin (outside border) */
margin: 20px;
margin: 10px 20px;
margin: 10px auto;                /* Center horizontally */
margin-top: 10px;
margin-bottom: 20px;

/* Negative margins */
margin-top: -10px;

/* Border */
border: 1px solid black;
border-width: 2px;
border-style: solid;              /* solid, dashed, dotted, double, groove, ridge */
border-color: #333;

border-top: 2px dashed red;
border-radius: 8px;
border-radius: 50%;               /* Circle */
border-radius: 10px 20px 30px 40px;
```

### Box Sizing

```css
/* Default: content-box */
/* Width = content only */
.content-box {
    box-sizing: content-box;
    width: 300px;
    padding: 20px;
    border: 5px solid black;
    /* Total width = 300 + 40 + 10 = 350px */
}

/* Recommended: border-box */
/* Width = content + padding + border */
.border-box {
    box-sizing: border-box;
    width: 300px;
    padding: 20px;
    border: 5px solid black;
    /* Total width = 300px */
}

/* Apply to all elements (recommended) */
*, *::before, *::after {
    box-sizing: border-box;
}
```

### Outline vs Border

```css
/* Outline doesn't affect layout */
.focused {
    outline: 2px solid blue;
    outline-offset: 4px;
}

/* Border affects layout */
.bordered {
    border: 2px solid blue;
}
```

---

## 6. Display and Positioning

### Display Property

```css
/* Block - takes full width, new line */
display: block;

/* Inline - takes content width, same line */
display: inline;

/* Inline-block - inline + width/height/margin */
display: inline-block;

/* None - removes from document flow */
display: none;

/* Flex - flexbox container */
display: flex;

/* Grid - grid container */
display: grid;

/* Other values */
display: contents;     /* Remove box, keep children */
display: table;        /* Table layout */
display: list-item;    /* Like <li> */
```

### Visibility vs Display

```css
/* Hidden but takes space */
visibility: hidden;

/* Removed from layout */
display: none;

/* Transparent but interactive */
opacity: 0;
```

### Position Property

```css
/* Static (default) - normal flow */
position: static;

/* Relative - offset from normal position */
position: relative;
top: 10px;
left: 20px;
/* Original space is preserved */

/* Absolute - positioned relative to nearest positioned ancestor */
.parent {
    position: relative;  /* Creates positioning context */
}
.child {
    position: absolute;
    top: 0;
    right: 0;
    /* Removed from normal flow */
}

/* Fixed - positioned relative to viewport */
position: fixed;
top: 0;
left: 0;
width: 100%;
/* Stays in place during scroll */

/* Sticky - hybrid of relative and fixed */
position: sticky;
top: 0;
/* Sticks when reaching threshold */
```

### Z-Index (Stacking Order)

```css
/* Only works on positioned elements */
.behind {
    position: relative;
    z-index: 1;
}

.infront {
    position: relative;
    z-index: 10;
}

.top {
    position: relative;
    z-index: 100;
}

/* Negative z-index */
.background {
    position: absolute;
    z-index: -1;
}
```

### Float and Clear

```css
/* Float (legacy, use flexbox/grid instead) */
.float-left {
    float: left;
    margin-right: 20px;
}

.float-right {
    float: right;
    margin-left: 20px;
}

/* Clear floats */
.clear {
    clear: both;
}

/* Clearfix hack */
.clearfix::after {
    content: "";
    display: table;
    clear: both;
}
```

### Overflow

```css
overflow: visible;   /* Default - content overflows */
overflow: hidden;    /* Content clipped */
overflow: scroll;    /* Always show scrollbars */
overflow: auto;      /* Scrollbars when needed */

overflow-x: hidden;  /* Horizontal only */
overflow-y: auto;    /* Vertical only */

/* Scroll behavior */
scroll-behavior: smooth;
```

---

## 7. Flexbox

### Flex Container

```css
.container {
    display: flex;           /* or inline-flex */
    
    /* Main Axis Direction */
    flex-direction: row;           /* Default: left to right */
    flex-direction: row-reverse;   /* Right to left */
    flex-direction: column;        /* Top to bottom */
    flex-direction: column-reverse; /* Bottom to top */
    
    /* Wrapping */
    flex-wrap: nowrap;       /* Default: single line */
    flex-wrap: wrap;         /* Wrap to new lines */
    flex-wrap: wrap-reverse; /* Wrap upward */
    
    /* Shorthand */
    flex-flow: row wrap;
    
    /* Main Axis Alignment */
    justify-content: flex-start;    /* Start of main axis */
    justify-content: flex-end;      /* End of main axis */
    justify-content: center;        /* Center */
    justify-content: space-between; /* Even space between */
    justify-content: space-around;  /* Even space around */
    justify-content: space-evenly;  /* Equal space everywhere */
    
    /* Cross Axis Alignment */
    align-items: stretch;     /* Default: fill container */
    align-items: flex-start;  /* Start of cross axis */
    align-items: flex-end;    /* End of cross axis */
    align-items: center;      /* Center */
    align-items: baseline;    /* Text baseline */
    
    /* Multi-line Alignment */
    align-content: flex-start;
    align-content: flex-end;
    align-content: center;
    align-content: space-between;
    align-content: space-around;
    align-content: stretch;
    
    /* Gap between items */
    gap: 20px;
    row-gap: 20px;
    column-gap: 10px;
}
```

### Flex Items

```css
.item {
    /* Order */
    order: 0;        /* Default */
    order: -1;       /* Move to start */
    order: 1;        /* Move to end */
    
    /* Grow */
    flex-grow: 0;    /* Default: don't grow */
    flex-grow: 1;    /* Grow to fill space */
    flex-grow: 2;    /* Grow twice as much */
    
    /* Shrink */
    flex-shrink: 1;  /* Default: can shrink */
    flex-shrink: 0;  /* Don't shrink */
    
    /* Basis (initial size) */
    flex-basis: auto;    /* Use width/height */
    flex-basis: 200px;   /* Fixed initial size */
    flex-basis: 25%;     /* Percentage */
    
    /* Shorthand */
    flex: 0 1 auto;      /* grow shrink basis (default) */
    flex: 1;             /* flex: 1 1 0% */
    flex: auto;          /* flex: 1 1 auto */
    flex: none;          /* flex: 0 0 auto */
    
    /* Individual alignment */
    align-self: auto;
    align-self: flex-start;
    align-self: flex-end;
    align-self: center;
    align-self: stretch;
}
```

### Common Flexbox Patterns

```css
/* Center everything */
.center-all {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
}

/* Navigation bar */
.navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
}

/* Card layout */
.card-container {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
}

.card {
    flex: 1 1 300px;  /* Grow, shrink, min 300px */
    max-width: 400px;
}

/* Sticky footer */
.page {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
}

.page main {
    flex: 1;  /* Takes remaining space */
}

/* Equal height columns */
.columns {
    display: flex;
}

.column {
    flex: 1;  /* Equal width */
}
```

---

## 8. CSS Grid

### Grid Container

```css
.grid-container {
    display: grid;           /* or inline-grid */
    
    /* Define Columns */
    grid-template-columns: 200px 200px 200px;
    grid-template-columns: 1fr 1fr 1fr;       /* Equal fractions */
    grid-template-columns: repeat(3, 1fr);    /* Same as above */
    grid-template-columns: 200px 1fr 2fr;     /* Mixed */
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    
    /* Define Rows */
    grid-template-rows: 100px 200px;
    grid-template-rows: auto 1fr auto;
    
    /* Implicit rows/columns */
    grid-auto-rows: 100px;
    grid-auto-rows: minmax(100px, auto);
    grid-auto-columns: 1fr;
    
    /* Gap */
    gap: 20px;
    row-gap: 20px;
    column-gap: 10px;
    
    /* Alignment */
    justify-items: start | end | center | stretch;
    align-items: start | end | center | stretch;
    
    justify-content: start | end | center | space-between | space-around;
    align-content: start | end | center | space-between | space-around;
    
    /* Place shorthand */
    place-items: center;           /* align-items justify-items */
    place-content: center;         /* align-content justify-content */
}
```

### Grid Template Areas

```css
.grid-container {
    display: grid;
    grid-template-columns: 200px 1fr 200px;
    grid-template-rows: auto 1fr auto;
    grid-template-areas:
        "header header header"
        "sidebar main aside"
        "footer footer footer";
    min-height: 100vh;
}

.header { grid-area: header; }
.sidebar { grid-area: sidebar; }
.main { grid-area: main; }
.aside { grid-area: aside; }
.footer { grid-area: footer; }
```

### Grid Items

```css
.grid-item {
    /* Positioning by line numbers */
    grid-column-start: 1;
    grid-column-end: 3;
    grid-row-start: 1;
    grid-row-end: 2;
    
    /* Shorthand */
    grid-column: 1 / 3;      /* start / end */
    grid-row: 1 / 2;
    
    /* Span */
    grid-column: span 2;     /* Span 2 columns */
    grid-row: 1 / span 3;    /* Start at 1, span 3 rows */
    
    /* Area shorthand */
    grid-area: 1 / 1 / 2 / 3;  /* row-start / col-start / row-end / col-end */
    
    /* Named area */
    grid-area: header;
    
    /* Self alignment */
    justify-self: start | end | center | stretch;
    align-self: start | end | center | stretch;
    place-self: center;
}
```

### Common Grid Patterns

```css
/* Responsive grid */
.responsive-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
}

/* 12-column grid */
.twelve-col-grid {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 20px;
}

.span-4 { grid-column: span 4; }
.span-6 { grid-column: span 6; }
.span-8 { grid-column: span 8; }
.span-12 { grid-column: span 12; }

/* Masonry-like layout */
.masonry {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    grid-auto-rows: 10px;
    gap: 10px;
}

.masonry-item.small { grid-row: span 15; }
.masonry-item.medium { grid-row: span 25; }
.masonry-item.large { grid-row: span 35; }

/* Holy grail layout */
.holy-grail {
    display: grid;
    grid-template: 
        "header header header" auto
        "nav    main   aside" 1fr
        "footer footer footer" auto
        / 200px 1fr 200px;
    min-height: 100vh;
}
```

---

## 9. Responsive Design

### Media Queries

```css
/* Mobile First Approach (recommended) */
/* Base styles for mobile */
.container {
    padding: 10px;
}

/* Tablet and up */
@media (min-width: 768px) {
    .container {
        padding: 20px;
    }
}

/* Desktop and up */
@media (min-width: 1024px) {
    .container {
        padding: 40px;
        max-width: 1200px;
        margin: 0 auto;
    }
}

/* Large screens */
@media (min-width: 1440px) {
    .container {
        max-width: 1400px;
    }
}
```

### Common Breakpoints

```css
/* Mobile First Breakpoints */
/* xs: 0-479px (default styles) */
/* sm: 480px */
/* md: 768px */
/* lg: 1024px */
/* xl: 1280px */
/* 2xl: 1536px */

/* Example */
.grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
}

@media (min-width: 480px) {
    .grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (min-width: 768px) {
    .grid {
        grid-template-columns: repeat(3, 1fr);
    }
}

@media (min-width: 1024px) {
    .grid {
        grid-template-columns: repeat(4, 1fr);
    }
}
```

### Media Query Features

```css
/* Width */
@media (min-width: 768px) { }
@media (max-width: 767px) { }
@media (width: 768px) { }

/* Height */
@media (min-height: 600px) { }

/* Orientation */
@media (orientation: portrait) { }
@media (orientation: landscape) { }

/* Aspect Ratio */
@media (aspect-ratio: 16/9) { }
@media (min-aspect-ratio: 1/1) { }

/* Resolution */
@media (min-resolution: 2dppx) { }  /* Retina */
@media (-webkit-min-device-pixel-ratio: 2) { }

/* Hover capability */
@media (hover: hover) { }    /* Has hover */
@media (hover: none) { }     /* Touch device */

/* Pointer precision */
@media (pointer: fine) { }   /* Mouse */
@media (pointer: coarse) { } /* Touch */

/* Prefers color scheme */
@media (prefers-color-scheme: dark) {
    body {
        background: #1a1a1a;
        color: #ffffff;
    }
}

/* Prefers reduced motion */
@media (prefers-reduced-motion: reduce) {
    * {
        animation: none !important;
        transition: none !important;
    }
}

/* Combined queries */
@media (min-width: 768px) and (max-width: 1023px) { }
@media (min-width: 768px), (orientation: landscape) { }
@media not print { }
```

### Responsive Units

```css
/* Viewport units */
.hero {
    height: 100vh;      /* 100% viewport height */
    width: 100vw;       /* 100% viewport width */
}

/* Fluid typography */
.title {
    font-size: clamp(1.5rem, 4vw, 3rem);
    /* min, preferred, max */
}

/* Responsive spacing */
.section {
    padding: clamp(2rem, 5vw, 6rem);
}

/* Container queries (modern) */
.card-container {
    container-type: inline-size;
}

@container (min-width: 400px) {
    .card {
        display: flex;
    }
}
```

### Responsive Images

```css
/* Fluid images */
img {
    max-width: 100%;
    height: auto;
}

/* Object fit */
.cover-image {
    width: 100%;
    height: 300px;
    object-fit: cover;
    object-position: center;
}

/* Aspect ratio */
.video-container {
    aspect-ratio: 16 / 9;
}

.square {
    aspect-ratio: 1;
}
```

---

## 10. Transitions and Animations

### Transitions

```css
/* Basic transition */
.button {
    background: blue;
    transition: background 0.3s ease;
}

.button:hover {
    background: darkblue;
}

/* Multiple properties */
.card {
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

/* Transition properties */
.element {
    transition-property: all;
    transition-duration: 0.3s;
    transition-timing-function: ease;
    transition-delay: 0s;
    
    /* Shorthand */
    transition: all 0.3s ease 0s;
}

/* Timing functions */
transition-timing-function: ease;        /* Default */
transition-timing-function: ease-in;
transition-timing-function: ease-out;
transition-timing-function: ease-in-out;
transition-timing-function: linear;
transition-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Keyframe Animations

```css
/* Define animation */
@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

@keyframes slideIn {
    0% {
        transform: translateX(-100%);
        opacity: 0;
    }
    100% {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes bounce {
    0%, 20%, 50%, 80%, 100% {
        transform: translateY(0);
    }
    40% {
        transform: translateY(-30px);
    }
    60% {
        transform: translateY(-15px);
    }
}

/* Apply animation */
.element {
    animation: fadeIn 1s ease forwards;
}

/* Animation properties */
.animated {
    animation-name: slideIn;
    animation-duration: 1s;
    animation-timing-function: ease;
    animation-delay: 0s;
    animation-iteration-count: 1;        /* or infinite */
    animation-direction: normal;          /* or reverse, alternate */
    animation-fill-mode: forwards;        /* none, forwards, backwards, both */
    animation-play-state: running;        /* or paused */
    
    /* Shorthand */
    animation: slideIn 1s ease 0s 1 normal forwards running;
}

/* Multiple animations */
.multi {
    animation: fadeIn 1s ease, bounce 2s ease 1s infinite;
}
```

### Transform Property

```css
/* 2D Transforms */
transform: translate(50px, 100px);
transform: translateX(50px);
transform: translateY(100px);

transform: rotate(45deg);
transform: rotateZ(45deg);

transform: scale(1.5);
transform: scaleX(1.5);
transform: scaleY(0.5);

transform: skew(10deg, 5deg);
transform: skewX(10deg);
transform: skewY(5deg);

/* Multiple transforms */
transform: translate(-50%, -50%) rotate(45deg) scale(1.2);

/* 3D Transforms */
transform: perspective(500px) rotateY(45deg);
transform: rotateX(45deg);
transform: translateZ(100px);
transform: rotate3d(1, 1, 1, 45deg);

/* Transform origin */
transform-origin: center;           /* Default */
transform-origin: top left;
transform-origin: 50% 50%;
transform-origin: 100px 50px;

/* Perspective */
.container {
    perspective: 1000px;
    perspective-origin: center;
}

.child {
    transform: rotateY(45deg);
    transform-style: preserve-3d;
    backface-visibility: hidden;
}
```

### Animation Examples

```css
/* Loading spinner */
@keyframes spin {
    to { transform: rotate(360deg); }
}

.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

/* Pulse effect */
@keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
}

.pulse {
    animation: pulse 2s ease infinite;
}

/* Shake effect */
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
    20%, 40%, 60%, 80% { transform: translateX(10px); }
}

.shake:hover {
    animation: shake 0.5s ease;
}
```

---

## 11. CSS Variables

### Defining and Using Variables

```css
/* Define in :root for global scope */
:root {
    /* Colors */
    --color-primary: #3498db;
    --color-secondary: #2ecc71;
    --color-danger: #e74c3c;
    --color-warning: #f39c12;
    
    --color-text: #333333;
    --color-text-light: #666666;
    --color-background: #ffffff;
    
    /* Typography */
    --font-family: 'Inter', -apple-system, sans-serif;
    --font-size-base: 16px;
    --font-size-sm: 0.875rem;
    --font-size-lg: 1.25rem;
    --font-size-xl: 1.5rem;
    
    /* Spacing */
    --spacing-xs: 0.25rem;
    --spacing-sm: 0.5rem;
    --spacing-md: 1rem;
    --spacing-lg: 1.5rem;
    --spacing-xl: 2rem;
    
    /* Borders */
    --border-radius: 8px;
    --border-color: #e0e0e0;
    
    /* Shadows */
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.1);
    --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
    --shadow-lg: 0 10px 30px rgba(0,0,0,0.15);
    
    /* Transitions */
    --transition-fast: 150ms ease;
    --transition-normal: 300ms ease;
    --transition-slow: 500ms ease;
}

/* Using variables */
.button {
    background: var(--color-primary);
    color: white;
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--border-radius);
    font-family: var(--font-family);
    transition: background var(--transition-fast);
}

.button:hover {
    background: var(--color-secondary);
}
```

### Fallback Values

```css
.element {
    /* Fallback if variable not defined */
    color: var(--undefined-color, #333);
    
    /* Nested fallback */
    background: var(--theme-bg, var(--color-background, white));
}
```

### Dynamic Theming

```css
/* Light theme (default) */
:root {
    --bg-color: #ffffff;
    --text-color: #333333;
    --card-bg: #f5f5f5;
}

/* Dark theme */
[data-theme="dark"] {
    --bg-color: #1a1a1a;
    --text-color: #ffffff;
    --card-bg: #2d2d2d;
}

/* Auto dark mode */
@media (prefers-color-scheme: dark) {
    :root {
        --bg-color: #1a1a1a;
        --text-color: #ffffff;
        --card-bg: #2d2d2d;
    }
}

/* Usage */
body {
    background: var(--bg-color);
    color: var(--text-color);
}

.card {
    background: var(--card-bg);
}
```

### Scoped Variables

```css
/* Component-scoped variables */
.card {
    --card-padding: 1rem;
    --card-border-radius: 8px;
    
    padding: var(--card-padding);
    border-radius: var(--card-border-radius);
}

.card.large {
    --card-padding: 2rem;
    --card-border-radius: 16px;
}

/* Override with inline styles */
/* <div class="card" style="--card-padding: 3rem;"> */
```

---

## 12. Pseudo-classes and Pseudo-elements

### Common Pseudo-classes

```css
/* User Action */
a:hover { }
a:active { }
a:focus { }
a:focus-visible { }   /* Keyboard focus only */
a:visited { }

/* Form States */
input:focus { }
input:disabled { }
input:enabled { }
input:checked { }
input:required { }
input:optional { }
input:valid { }
input:invalid { }
input:placeholder-shown { }
input:read-only { }
input:read-write { }

/* Structural */
li:first-child { }
li:last-child { }
li:nth-child(2) { }
li:nth-child(odd) { }
li:nth-child(even) { }
li:nth-child(3n) { }       /* Every 3rd */
li:nth-child(3n+1) { }     /* 1st, 4th, 7th... */
li:nth-last-child(2) { }   /* 2nd from end */
li:only-child { }

/* Type-based */
p:first-of-type { }
p:last-of-type { }
p:nth-of-type(2) { }
p:only-of-type { }

/* Negation */
p:not(.special) { }
li:not(:last-child) { }
input:not([disabled]) { }

/* Empty */
div:empty { }

/* Target (URL hash) */
section:target { }

/* Has (parent selector - modern) */
.card:has(img) { }
.form:has(:invalid) { }
```

### Pseudo-classes Examples

```css
/* Zebra striped table */
tr:nth-child(even) {
    background: #f5f5f5;
}

/* Remove border from last item */
li:not(:last-child) {
    border-bottom: 1px solid #eee;
}

/* Style empty states */
.list:empty::before {
    content: "No items found";
    color: #999;
}

/* Focus styles */
button:focus-visible {
    outline: 2px solid blue;
    outline-offset: 2px;
}

/* Form validation */
input:valid {
    border-color: green;
}

input:invalid {
    border-color: red;
}

/* Parent selector */
.card:has(img) {
    display: flex;
}
```

### Pseudo-elements

```css
/* Before and After */
.element::before {
    content: "";
    display: block;
}

.element::after {
    content: "→";
    margin-left: 5px;
}

/* First letter and line */
p::first-letter {
    font-size: 2em;
    font-weight: bold;
    float: left;
}

p::first-line {
    font-weight: bold;
}

/* Selection */
::selection {
    background: #3498db;
    color: white;
}

/* Placeholder */
input::placeholder {
    color: #999;
    font-style: italic;
}

/* Marker (list bullets) */
li::marker {
    color: #3498db;
    font-size: 1.2em;
}

/* Scrollbar */
::-webkit-scrollbar {
    width: 8px;
}

::-webkit-scrollbar-track {
    background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
    background: #555;
}
```

### Pseudo-element Examples

```css
/* Icon before text */
.link-external::after {
    content: " ↗";
    font-size: 0.8em;
}

/* Required field indicator */
label.required::after {
    content: " *";
    color: red;
}

/* Decorative line */
.section-title::after {
    content: "";
    display: block;
    width: 50px;
    height: 3px;
    background: #3498db;
    margin-top: 10px;
}

/* Quote marks */
blockquote::before {
    content: open-quote;
    font-size: 3em;
    color: #ccc;
}

/* Clearfix */
.clearfix::after {
    content: "";
    display: table;
    clear: both;
}

/* Overlay */
.card::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    opacity: 0;
    transition: opacity 0.3s;
}

.card:hover::before {
    opacity: 1;
}
```

---

## 13. Advanced Techniques

### CSS Filters

```css
/* Filter functions */
filter: blur(5px);
filter: brightness(1.2);
filter: contrast(1.5);
filter: grayscale(100%);
filter: hue-rotate(90deg);
filter: invert(100%);
filter: opacity(50%);
filter: saturate(2);
filter: sepia(100%);
filter: drop-shadow(5px 5px 10px rgba(0,0,0,0.3));

/* Multiple filters */
filter: contrast(1.2) brightness(1.1) saturate(1.3);

/* Backdrop filter (frosted glass) */
.frosted {
    background: rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
}
```

### Clip Path

```css
/* Basic shapes */
clip-path: circle(50%);
clip-path: ellipse(50% 30% at 50% 50%);
clip-path: inset(10px 20px 30px 40px round 10px);
clip-path: polygon(50% 0%, 100% 100%, 0% 100%);

/* Complex polygon */
.hexagon {
    clip-path: polygon(
        25% 0%, 75% 0%, 
        100% 50%, 
        75% 100%, 25% 100%, 
        0% 50%
    );
}

/* Animated clip-path */
.reveal {
    clip-path: inset(0 100% 0 0);
    transition: clip-path 0.5s ease;
}

.reveal:hover {
    clip-path: inset(0 0 0 0);
}
```

### Blend Modes

```css
/* Mix blend mode */
.overlay-text {
    mix-blend-mode: multiply;
    mix-blend-mode: screen;
    mix-blend-mode: overlay;
    mix-blend-mode: difference;
    mix-blend-mode: color-dodge;
}

/* Background blend mode */
.hero {
    background: 
        linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)),
        url('image.jpg');
    background-blend-mode: overlay;
}
```

### Scroll Snap

```css
/* Container */
.scroll-container {
    scroll-snap-type: x mandatory;    /* or y, both */
    scroll-snap-type: x proximity;    /* Looser snapping */
    overflow-x: auto;
    scroll-behavior: smooth;
}

/* Items */
.scroll-item {
    scroll-snap-align: start;         /* start, center, end */
    scroll-snap-stop: always;         /* Stop at each item */
}

/* Full page scroll */
.page-container {
    height: 100vh;
    overflow-y: auto;
    scroll-snap-type: y mandatory;
}

.page-section {
    height: 100vh;
    scroll-snap-align: start;
}
```

### Writing Modes

```css
/* Vertical text */
.vertical {
    writing-mode: vertical-rl;        /* Right to left */
    writing-mode: vertical-lr;        /* Left to right */
}

/* Text orientation */
.vertical-text {
    writing-mode: vertical-rl;
    text-orientation: mixed;          /* Default */
    text-orientation: upright;        /* Characters upright */
    text-orientation: sideways;       /* Characters rotated */
}
```

### CSS Shapes

```css
/* Float around shapes */
.circle-float {
    float: left;
    width: 200px;
    height: 200px;
    shape-outside: circle(50%);
    clip-path: circle(50%);
}

.custom-shape {
    float: left;
    shape-outside: polygon(0 0, 100% 0, 100% 100%);
}

/* Shape margin */
.shaped {
    shape-outside: circle(50%);
    shape-margin: 20px;
}
```

### Modern CSS Features

```css
/* Container Queries */
.card-container {
    container-type: inline-size;
    container-name: card;
}

@container card (min-width: 400px) {
    .card {
        display: flex;
    }
}

/* CSS Nesting (native) */
.card {
    padding: 1rem;
    
    & .title {
        font-size: 1.5rem;
    }
    
    &:hover {
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    
    @media (min-width: 768px) {
        padding: 2rem;
    }
}

/* :has() selector */
.form:has(:invalid) .submit-btn {
    opacity: 0.5;
    pointer-events: none;
}

/* Subgrid */
.grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
}

.grid-item {
    display: grid;
    grid-template-rows: subgrid;
    grid-row: span 3;
}

/* Logical Properties */
.element {
    margin-inline: auto;          /* margin-left + margin-right */
    padding-block: 1rem;          /* padding-top + padding-bottom */
    border-inline-start: 1px solid;  /* border-left in LTR */
    inset: 0;                     /* top + right + bottom + left */
}

/* Accent Color */
input[type="checkbox"] {
    accent-color: #3498db;
}

/* Color Mix */
.mixed {
    background: color-mix(in srgb, red 50%, blue);
}
```

---

## 14. Best Practices

### CSS Architecture

```css
/* BEM Naming Convention */
/* Block__Element--Modifier */

.card { }
.card__header { }
.card__title { }
.card__body { }
.card__footer { }
.card--featured { }
.card--disabled { }

/* Example */
.navigation { }
.navigation__list { }
.navigation__item { }
.navigation__link { }
.navigation__link--active { }
```

### File Organization

```
styles/
├── base/
│   ├── _reset.css
│   ├── _typography.css
│   └── _variables.css
├── components/
│   ├── _buttons.css
│   ├── _cards.css
│   ├── _forms.css
│   └── _navigation.css
├── layout/
│   ├── _header.css
│   ├── _footer.css
│   ├── _sidebar.css
│   └── _grid.css
├── pages/
│   ├── _home.css
│   └── _about.css
├── utilities/
│   └── _helpers.css
└── main.css
```

### Performance Tips

```css
/* Avoid expensive selectors */
/* ❌ Bad */
div > * > * > a { }
[class^="btn"] { }

/* ✅ Good */
.nav-link { }
.btn { }

/* Minimize repaints */
/* ❌ Triggers layout */
.element {
    width: 100px;
    height: 100px;
    top: 10px;
    left: 10px;
}

/* ✅ Uses transform (GPU accelerated) */
.element {
    transform: translate(10px, 10px);
}

/* Use will-change sparingly */
.animated {
    will-change: transform, opacity;
}

/* Contain property */
.card {
    contain: layout style paint;
}

/* Content-visibility for off-screen content */
.section {
    content-visibility: auto;
    contain-intrinsic-size: 0 500px;
}
```

### Maintainability

```css
/* Use CSS Custom Properties */
:root {
    --spacing-unit: 8px;
}

.element {
    margin: calc(var(--spacing-unit) * 2);  /* 16px */
    padding: calc(var(--spacing-unit) * 3); /* 24px */
}

/* Document magic numbers */
.header {
    height: 64px;  /* Matches logo height + padding */
}

/* Use calc() for clarity */
.sidebar {
    width: calc(100% - 250px);  /* Full width minus nav */
}

/* Avoid !important */
/* If needed, document why */
.utility-hide {
    display: none !important;  /* Utility class - must override */
}
```

### Responsive Best Practices

```css
/* Mobile-first approach */
.element {
    /* Base mobile styles */
    padding: 1rem;
}

@media (min-width: 768px) {
    .element {
        padding: 2rem;
    }
}

/* Use relative units */
.text {
    font-size: 1rem;     /* Not 16px */
    margin: 1.5em;       /* Relative to font-size */
    max-width: 65ch;     /* ~65 characters */
}

/* Fluid typography */
h1 {
    font-size: clamp(2rem, 5vw, 4rem);
}

/* Avoid fixed heights */
.card {
    min-height: 200px;   /* Not height: 200px */
}
```

---

## 15. Practice Projects

### Project 1: Personal Profile Card
**Difficulty:** ⭐ Easy

Create a profile card with:
- Circular avatar image
- Name and title
- Social media icons
- Hover effects
- Box shadow

### Project 2: Responsive Navigation
**Difficulty:** ⭐⭐ Medium

Build a responsive navbar:
- Logo and menu items
- Hamburger menu for mobile
- Dropdown submenu
- Sticky header
- Smooth transitions

### Project 3: CSS Grid Gallery
**Difficulty:** ⭐⭐ Medium

Create an image gallery:
- Responsive grid layout
- Different sized images
- Hover zoom effect
- Lightbox overlay (CSS only)
- Lazy loading images

### Project 4: Animated Landing Page
**Difficulty:** ⭐⭐⭐ Hard

Build a landing page with:
- Hero section with parallax
- Scroll animations
- Animated statistics counter
- Testimonial carousel (CSS only)
- Contact form with validation states

### Project 5: Dashboard UI
**Difficulty:** ⭐⭐⭐ Hard

Create a dashboard layout:
- Sidebar navigation
- Header with search and user menu
- Cards with charts (placeholder)
- Data tables
- Dark/light theme toggle
- Fully responsive

---

## 📖 Additional Resources

### Documentation
- [MDN CSS Reference](https://developer.mozilla.org/en-US/docs/Web/CSS)
- [CSS Tricks](https://css-tricks.com/)
- [W3C CSS Specifications](https://www.w3.org/Style/CSS/)

### Interactive Learning
- [Flexbox Froggy](https://flexboxfroggy.com/)
- [Grid Garden](https://cssgridgarden.com/)
- [CSS Diner](https://flukeout.github.io/)
- [Flexbox Defense](http://www.flexboxdefense.com/)

### Tools
- [Can I Use](https://caniuse.com/) - Browser support
- [CSS Generator](https://cssgenerator.org/)
- [Clippy](https://bennettfeely.com/clippy/) - Clip-path generator
- [Cubic Bezier](https://cubic-bezier.com/) - Timing functions
- [CSS Gradient](https://cssgradient.io/)
- [Animista](https://animista.net/) - CSS animations

### Games and Challenges
- [100 Days CSS Challenge](https://100dayscss.com/)
- [CSS Battle](https://cssbattle.dev/)
- [Frontend Mentor](https://www.frontendmentor.io/)

---

## ✅ Learning Checklist

- [ ] Understand CSS selectors and specificity
- [ ] Master the box model and box-sizing
- [ ] Use colors, gradients, and backgrounds
- [ ] Apply typography and web fonts
- [ ] Create layouts with Flexbox
- [ ] Build complex layouts with CSS Grid
- [ ] Implement responsive design with media queries
- [ ] Add transitions and animations
- [ ] Use CSS variables for theming
- [ ] Apply pseudo-classes and pseudo-elements
- [ ] Follow CSS best practices and naming conventions
- [ ] Complete at least 3 practice projects

---

**Previous:** [HTML Fundamentals](../01-html/README.md)  
**Next:** [JavaScript Basics](../03-javascript/README.md)

*Estimated completion time: 3-4 weeks with daily practice*
