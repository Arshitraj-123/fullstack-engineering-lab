import { useEffect, useState } from 'react'

const swatches = [
  { name: 'Terracotta', code: 'T-402', hex: '#c1652f' },
  { name: 'Harbor Blue', code: 'H-118', hex: '#3e6e8e' },
  { name: 'Moss', code: 'M-076', hex: '#5b7052' },
  { name: 'Marigold', code: 'Y-231', hex: '#d9a441' },
  { name: 'Plum', code: 'P-350', hex: '#6b4160' },
  { name: 'Charcoal', code: 'K-900', hex: '#33312c' },
]

function SwatchCard({ swatch, isActive, onSelect }) {
  return (
    <li>
      <button
        type="button"
        className={`swatch-card${isActive ? ' swatch-card-active' : ''}`}
        style={{ '--swatch-color': swatch.hex }}
        onClick={() => onSelect(swatch)}
        aria-pressed={isActive}
      >
        <span className="swatch-block" />
        <span className="swatch-label">
          <span className="swatch-name">{swatch.name}</span>
          <span className="swatch-code">{swatch.code}</span>
        </span>
      </button>
    </li>
  )
}

function ColorStation() {
  const [current, setCurrent] = useState(swatches[0])

  useEffect(() => {
    document.body.style.backgroundColor = current.hex
    return () => {
      document.body.style.backgroundColor = ''
    }
  }, [current])

  return (
    <section className="station" aria-label="Paint swatch picker">
      <div className="plaque">
        <p className="plaque-eyebrow">Currently tinted</p>
        <h1 className="plaque-name">{current.name}</h1>
        <p className="plaque-code">Reference {current.code}</p>
      </div>

      <ul className="swatch-row">
        {swatches.map((swatch) => (
          <SwatchCard
            key={swatch.code}
            swatch={swatch}
            isActive={swatch.code === current.code}
            onSelect={setCurrent}
          />
        ))}
      </ul>

      <p className="station-caption">Tap a chip to repaint the page behind this counter.</p>
    </section>
  )
}

export default ColorStation
