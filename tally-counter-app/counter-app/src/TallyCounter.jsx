import { useState } from 'react'
import FlapDisplay from './FlapDisplay.jsx'

function TallyCounter() {
  const [count, setCount] = useState(0)

  const increment = () => setCount((current) => current + 1)
  const decrement = () => setCount((current) => current - 1)
  const reset = () => setCount(0)

  return (
    <section className="counter-panel" aria-label="Tally counter">
      <div className="rivet rivet-tl" aria-hidden="true" />
      <div className="rivet rivet-tr" aria-hidden="true" />
      <div className="rivet rivet-bl" aria-hidden="true" />
      <div className="rivet rivet-br" aria-hidden="true" />

      <header className="panel-header">
        <h1 className="panel-title">Tally Counter</h1>
        <span className="panel-serial">MODEL&nbsp;TC&#8209;03</span>
      </header>

      <FlapDisplay value={count} />

      <div className="control-row">
        <button
          type="button"
          className="control-btn control-decrement"
          onClick={decrement}
          aria-label="Decrement count"
        >
          <span className="btn-glyph">&minus;</span>
        </button>

        <button
          type="button"
          className="control-btn control-reset"
          onClick={reset}
          aria-label="Reset count to zero"
        >
          <span className="reset-label">Reset</span>
        </button>

        <button
          type="button"
          className="control-btn control-increment"
          onClick={increment}
          aria-label="Increment count"
        >
          <span className="btn-glyph">+</span>
        </button>
      </div>

      <p className="panel-caption">Press + or &minus; to log a count, Reset to clear the tally.</p>
    </section>
  )
}

export default TallyCounter
