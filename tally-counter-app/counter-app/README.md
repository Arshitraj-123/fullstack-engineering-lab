# Tally Counter

A React (Vite) counter app using `useState`, styled as a physical mechanical
tally / click-counter with a split-flap digit display, rather than a generic
rounded card with a big number in the middle.

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

- `src/App.jsx` — renders `TallyCounter`.
- `src/TallyCounter.jsx` — holds the `count` state and the three handlers
  (`increment`, `decrement`, `reset`), and renders the display plus the
  control row.
- `src/FlapDisplay.jsx` — turns the current count into a row of split-flap
  digit tiles (with a sign tile for negative counts).
- `src/index.css` — the visual design: brushed-metal panel, corner rivets, a
  recessed flap-display bezel, and chunky push-button controls (green +,
  red −, yellow Reset).

## Behavior

- **+** increments the count by 1.
- **−** decrements the count by 1 (it can go negative; the display shows a
  minus tile).
- **Reset** sets the count back to 0.
