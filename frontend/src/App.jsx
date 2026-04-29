import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Studies from './pages/Studies'
import Training from './pages/Training'
import People from './pages/People'
import EmailGenerator from './pages/EmailGenerator'

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/studies" element={<Studies />} />
            <Route path="/training" element={<Training />} />
            <Route path="/people" element={<People />} />
            <Route path="/email" element={<EmailGenerator />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
