//App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Volunteer from './pages/Volunteer'
import Volunteers from './pages/Volunteers'
import Tasks from './pages/Tasks'
import Reports from './pages/Reports'
import Intake from './pages/Intake'
import VolunteerPortal from './pages/VolunteerPortal'
import NotFound from './pages/NotFound'
import PredictiveAlerts from './pages/PredictiveAlerts'
import Analytics from './pages/Analytics'
import ProtectedRoute from './components/ProtectedRoute'
import RoleSelect from './pages/RoleSelect'
import Chatbot from "./components/Chatbot"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/volunteers" element={<ProtectedRoute><Volunteers /></ProtectedRoute>} />
        <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/intake" element={<ProtectedRoute><Intake /></ProtectedRoute>} />
        <Route path="/volunteer" element={<Volunteer />} />
        <Route path="/my-tasks" element={<VolunteerPortal />} />
        <Route path="/predictive-alerts" element={<PredictiveAlerts />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="*" element={<NotFound />} />
        <Route path="/get-started" element={<RoleSelect />} />
        </Routes>
        <Chatbot />

      </BrowserRouter>
  )
}

export default App