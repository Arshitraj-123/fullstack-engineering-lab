const students = [
  { id: 1, name: 'Ananya Sharma', rollNumber: 'CSE-2026-014', course: 'B.Tech, Computer Science' },
  { id: 2, name: 'Rohan Verma', rollNumber: 'ECE-2026-032', course: 'B.Tech, Electronics' },
  { id: 3, name: 'Meera Nair', rollNumber: 'MEC-2026-008', course: 'B.Tech, Mechanical' },
  { id: 4, name: 'Kabir Singh', rollNumber: 'CSE-2026-021', course: 'B.Tech, Computer Science' },
  { id: 5, name: 'Ishita Rao', rollNumber: 'CIV-2026-045', course: 'B.Tech, Civil Engineering' },
]

function StudentRow({ student, serial }) {
  return (
    <tr className="register-row">
      <td className="cell cell-serial" data-label="No.">
        <span className="serial-mark">{String(serial).padStart(2, '0')}</span>
      </td>
      <td className="cell cell-name" data-label="Name">
        {student.name}
      </td>
      <td className="cell cell-roll" data-label="Roll no.">
        {student.rollNumber}
      </td>
      <td className="cell cell-course" data-label="Course">
        {student.course}
      </td>
    </tr>
  )
}

function ClassRegister() {
  return (
    <section className="register-book" aria-label="Class register">
      <header className="register-header">
        <div className="register-title">
          <p className="register-heading">Class Register</p>
          <p className="register-subheading">Section A &middot; Academic Year 2026&ndash;27</p>
        </div>
        <p className="register-count">{students.length} students enrolled</p>
      </header>

      <div className="register-thread" aria-hidden="true" />

      <table className="register-table">
        <thead>
          <tr>
            <th className="cell cell-serial">No.</th>
            <th className="cell cell-name">Name</th>
            <th className="cell cell-roll">Roll no.</th>
            <th className="cell cell-course">Course</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student, index) => (
            <StudentRow key={student.id} student={student} serial={index + 1} />
          ))}
        </tbody>
      </table>

      <footer className="register-footer">
        <span>Entries verified &middot; signed by class in-charge</span>
      </footer>
    </section>
  )
}

export default ClassRegister
