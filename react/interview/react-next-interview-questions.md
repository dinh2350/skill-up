# React & Next.js Interview Questions

This document contains a list of React and Next.js interview questions ranging from junior to senior levels.

## Junior Developer Questions (React)

1.  **What is React?**

    - React is a JavaScript library for building user interfaces, particularly for single-page applications. It allows developers to create reusable UI components.

2.  **What is JSX?**

    - JSX (JavaScript XML) is a syntax extension for JavaScript. It allows you to write HTML-like code in your JavaScript files, which makes creating React components more intuitive.

3.  **What is the difference between a class component and a functional component?**

    - **Class Components**: Use ES6 classes, have a `render` method, and can hold state and lifecycle methods.
    - **Functional Components**: Simple JavaScript functions that accept props and return React elements. With Hooks, they can now also manage state and side effects.

4.  **What are props?**

    - Props (short for properties) are read-only attributes that are passed from a parent component to a child component. They are used to pass data and event handlers down the component tree.

5.  **What is state?**

    - State is an object that represents the parts of the app that can change. Each component can have its own state. When a component's state changes, React re-renders the component.

6.  **What is the `useState` hook?**

    - `useState` is a Hook that lets you add React state to functional components. It returns an array with two values: the current state and a function to update it.

7.  **What is the `useEffect` hook?**
    - `useEffect` is a Hook that lets you perform side effects in functional components. It runs after every render by default, but you can control when it runs by passing a dependency array.

## Mid-level Developer Questions (React)

1.  **Explain the component lifecycle in React.**

    - Discuss the main lifecycle phases: Mounting, Updating, and Unmounting. For class components, mention methods like `componentDidMount`, `componentDidUpdate`, and `componentWillUnmount`. For functional components, explain how `useEffect` can be used to achieve the same.

2.  **What are React Hooks? Name a few.**

    - Hooks are functions that let you "hook into" React state and lifecycle features from functional components.
    - Examples: `useState`, `useEffect`, `useContext`, `useReducer`, `useCallback`, `useMemo`.

3.  **What is the context API?**

    - The Context API provides a way to pass data through the component tree without having to pass props down manually at every level. It's used for managing global state.

4.  **What is prop drilling?**

    - Prop drilling is the process of passing props from a higher-level component to a lower-level component through intermediate components that don't need the props themselves. Context API or state management libraries can help avoid this.

5.  **What is the difference between a controlled and an uncontrolled component?**

    - **Controlled Component**: An input form element whose value is controlled by React state.
    - **Uncontrolled Component**: An input form element whose value is handled by the DOM itself. You can use a `ref` to get its value when needed.

6.  **What are higher-order components (HOCs)?**
    - A higher-order component is a function that takes a component and returns a new component with additional props or logic. It's a pattern for reusing component logic.

## Senior Developer Questions (React)

1.  **How does React's reconciliation algorithm (Virtual DOM) work?**

    - Explain that React uses a Virtual DOM to keep a representation of the UI in memory. When the state changes, React creates a new Virtual DOM tree, compares it with the previous one (this process is called "diffing"), and then updates the real DOM only where necessary.

2.  **What is code-splitting in React?**

    - Code-splitting is a feature supported by bundlers like Webpack and Rollup, which can create multiple bundles that can be dynamically loaded at runtime. React's `React.lazy` and `Suspense` can be used to implement code-splitting for components.

3.  **Explain `useMemo` and `useCallback`.**

    - **`useMemo`**: Memoizes a value. It recomputes the memoized value only when one of the dependencies has changed. It's useful for expensive calculations.
    - **`useCallback`**: Memoizes a function. It returns a memoized version of the callback that only changes if one of the dependencies has changed. It's useful for passing callbacks to optimized child components that rely on reference equality.

4.  **How would you optimize the performance of a React application?**

    - Discuss strategies like:
      - Using `React.memo` for components.
      - Using `useMemo` and `useCallback`.
      - Code-splitting with `React.lazy` and `Suspense`.
      - Windowing or virtualization for long lists (e.g., with `react-window`).
      - Analyzing bundle size and removing unused dependencies.

5.  **What are render props?**
    - The term "render prop" refers to a technique for sharing code between React components using a prop whose value is a function. A component with a render prop takes a function that returns a React element and calls it instead of implementing its own render logic.

---

## Next.js Questions (All Levels)

1.  **What is Next.js?**

    - Next.js is a React framework for building production-grade applications. It provides features like server-side rendering, static site generation, and file-based routing out of the box.

2.  **What is the difference between Server-Side Rendering (SSR) and Static Site Generation (SSG)?**

    - **SSR**: The HTML is generated on the server for each request. This is useful for pages that have frequently changing data.
    - **SSG**: The HTML is generated at build time. This is great for performance as the content can be served from a CDN. It's suitable for pages that don't change often, like a blog or marketing site.

3.  **How does file-based routing work in Next.js?**

    - Next.js has a file-system based router. Any file inside the `pages` directory is automatically treated as a route. For example, `pages/about.js` becomes the `/about` route.

4.  **What are `getStaticProps` and `getServerSideProps`?**

    - **`getStaticProps` (SSG)**: A function that runs at build time to fetch data and pass it as props to a page.
    - **`getServerSideProps` (SSR)**: A function that runs on every request to fetch data and pass it as props to a page.

5.  **What is the `_app.js` file?**

    - The `_app.js` file is a custom App component that allows you to initialize pages. You can use it to keep state when navigating between pages, or to add global CSS.

6.  **What are API routes in Next.js?**

    - API routes provide a solution to build your API with Next.js. Any file inside the folder `pages/api` is mapped to `/api/*` and will be treated as an API endpoint instead of a page.

7.  **What is the Next.js Image component?**

    - The `<Image>` component is an extension of the HTML `<img>` element, evolved for the modern web. It provides automatic image optimization, resizing, and serving images in modern formats like WebP.

8.  **What is Incremental Static Regeneration (ISR)?**
    - ISR allows you to update static content after the site has been built. You can specify a `revalidate` time in `getStaticProps`, and Next.js will re-generate the page in the background after that time has passed. This combines the benefits of SSG with the ability to have fresh data.
