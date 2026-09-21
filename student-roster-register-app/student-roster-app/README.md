# Class Register — Student List

A React (Vite) app that renders a list of five students by mapping over an
array, styled as a school class register rather than a generic rounded card
list.

## Run it

```bash
npm install
npm run dev
```

Then open the printed local URL in your browser.

## Build for production

```bash
npm run build
npm run preview
```

## Structure

- `src/App.jsx` — renders `ClassRegister`.
- `src/ClassRegister.jsx` — holds the `students` array and uses `.map()` to
  turn each entry into a `StudentRow`. Each row shows the student's name,
  roll number, and course.
- `src/index.css` — the visual design: cream ledger paper, a stitched thread
  divider, column rules, and a circled serial number stamp per row.

## Customize

Edit the `students` array at the top of `src/ClassRegister.jsx` to change who
appears on the register:

```jsx
const students = [
  { id: 1, name: 'Ananya Sharma', rollNumber: 'CSE-2026-014', course: 'B.Tech, Computer Science' },
  // ...add or edit entries here
]
```
