function PunchHoles() {
  return (
    <div className="punch-column" aria-hidden="true">
      <span className="hole" />
      <span className="hole" />
      <span className="hole" />
    </div>
  )
}

function Stamp({ rollNumber }) {
  return (
    <div className="stamp" aria-hidden="true">
      <span className="stamp-ring">
        <span className="stamp-text">{rollNumber}</span>
      </span>
    </div>
  )
}

function SkillStub({ label }) {
  return <li className="skill-stub">{label}</li>
}

function StudentProfileCard({ student }) {
  const { name, rollNumber, course, email, skills } = student
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <section className="ledger-card" aria-label={`Student card for ${name}`}>
      <PunchHoles />

      <div className="ledger-body">
        <header className="ledger-header">
          <p className="ledger-heading">Registrar's Record</p>
          <p className="ledger-subheading">Academic Year 2026&ndash;27</p>
        </header>

        <div className="ledger-main">
          <div className="photo-frame">
            <span className="tape tape-left" />
            <span className="tape tape-right" />
            <div className="photo-silhouette">{initials}</div>
          </div>

          <div className="ledger-identity">
            <h1 className="student-name">{name}</h1>
            <p className="student-course">{course}</p>
            <Stamp rollNumber={rollNumber} />
          </div>
        </div>

        <dl className="ledger-lines">
          <div className="ledger-row">
            <dt>Roll no.</dt>
            <dd>{rollNumber}</dd>
          </div>
          <div className="ledger-row">
            <dt>Course</dt>
            <dd>{course}</dd>
          </div>
          <div className="ledger-row">
            <dt>Email</dt>
            <dd>{email}</dd>
          </div>
        </dl>

        <div className="ledger-skills">
          <p className="skills-caption">Marked proficient in</p>
          <ul className="skills-list">
            {skills.map((skill) => (
              <SkillStub key={skill} label={skill} />
            ))}
          </ul>
        </div>

        <footer className="ledger-footer">
          <span>Filed by hand &middot; do not bend</span>
        </footer>
      </div>
    </section>
  )
}

export default StudentProfileCard
