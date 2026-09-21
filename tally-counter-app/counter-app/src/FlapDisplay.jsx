function FlapTile({ char, muted }) {
  return (
    <div className={`flap-tile${muted ? ' flap-tile-sign' : ''}`}>
      <span className="flap-digit">{char}</span>
      <span className="flap-seam" aria-hidden="true" />
    </div>
  )
}

function FlapDisplay({ value }) {
  const isNegative = value < 0
  const digits = Math.abs(value).toString().padStart(3, '0').split('')

  return (
    <div className="flap-display" role="status" aria-label={`Count is ${value}`}>
      <FlapTile char={isNegative ? '\u2212' : ''} muted />
      {digits.map((digit, index) => (
        <FlapTile key={index} char={digit} />
      ))}
    </div>
  )
}

export default FlapDisplay
