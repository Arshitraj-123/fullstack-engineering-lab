# Paint Swatch Station

A React app that changes the page's background color when the user clicks a
color button — styled as a hardware-store paint-chip counter instead of a
row of plain colored squares.

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

- `src/App.jsx` — renders `ColorStation`.
- `src/ColorStation.jsx` — holds the `swatches` array and the `current`
  state (`useState`). A `useEffect` applies `current.hex` to
  `document.body.style.backgroundColor` whenever the selection changes, so
  clicking a swatch repaints the whole page, not just a box inside it.
- `src/index.css` — the visual design: a museum-placard style readout for
  the active color, and paint-chip cards (color block + printed name and
  reference code) for each option.

## Customize

Edit the `swatches` array in `src/ColorStation.jsx` to change the palette:

```jsx
const swatches = [
  { name: 'Terracotta', code: 'T-402', hex: '#c1652f' },
  // ...add or edit entries here
]
```
