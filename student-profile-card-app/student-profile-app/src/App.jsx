import StudentProfileCard from './StudentProfileCard.jsx'

const student = {
  name: 'Ananya Sharma',
  rollNumber: 'CSE-2026-014',
  course: 'B.Tech, Computer Science',
  email: 'ananya.sharma@nithcollege.edu',
  skills: ['React', 'Python', 'SQL', 'Data Structures', 'UI Design'],
}

function App() {
  return (
    <main className="page">
      <StudentProfileCard student={student} />
    </main>
  )
}

export default App
