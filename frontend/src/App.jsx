import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Volunteer from './pages/Volunteer'
import Volunteers from './pages/Volunteers'
import Tasks from './pages/Tasks'
import Reports from './pages/Reports'
import NotFound from './pages/NotFound'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/volunteer" element={<Volunteer />} />
        <Route path="/volunteers" element={<Volunteers />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App