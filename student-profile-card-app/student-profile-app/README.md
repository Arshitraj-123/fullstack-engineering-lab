# Student Profile Card

A small React (Vite) app that renders one component, `StudentProfileCard`, styled
as a registrar's index card rather than a generic rounded "dashboard card."

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

- `src/App.jsx` — holds the sample student data and renders the card.
- `src/StudentProfileCard.jsx` — the functional component. Displays name,
  roll number, course, email, and a list of skills.
- `src/index.css` — the visual design: cream index-card paper, ruled lines,
  a rust ink stamp for the roll number, punch holes, and taped photo corners.

## Customize

Edit the `student` object in `src/App.jsx` to swap in real data:

```jsx
const student = {
  name: 'Ananya Sharma',
  rollNumber: 'CSE-2026-014',
  course: 'B.Tech, Computer Science',
  email: 'ananya.sharma@nithcollege.edu',
  skills: ['React', 'Python', 'SQL', 'Data Structures', 'UI Design'],
}
```
