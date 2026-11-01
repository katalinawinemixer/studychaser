import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Studies from './pages/Studies'
import Training from './pages/Training'
import People from './pages/People'
import EmailGenerator from './pages/EmailGenerator'
import { IS_READ_ONLY_DEMO } from './lib/api'
import { useLocation } from 'react-router-dom'

function WorkspaceHeader() {
  const { pathname } = useLocation()
  const title = { '/dashboard': 'Overview', '/studies': 'Studies', '/training': 'Training tracker', '/people': 'People', '/email': 'Email preview' }[pathname] ?? 'Workspace'
  return <header className="workspace-header"><div><span className="workspace-name">Study workspace</span><span className="breadcrumb-divider">/</span><span>{title}</span></div><span className="workspace-status"><span />Portfolio demo</span></header>
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <a className="skip-link" href="#main-content">Skip to content</a>
        <Sidebar />
        <main className="main-content" id="main-content">
          <WorkspaceHeader />
          <div className="page-content">
          {IS_READ_ONLY_DEMO && (
            <div className="demo-banner">
              <span className="demo-mark" aria-hidden="true">i</span>
              <strong>A little look inside StudyChaser.</strong>
              <span>Explore with synthetic data. Read-only demo; emails are preview only.</span>
            </div>
          )}
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/studies" element={<Studies />} />
            <Route path="/training" element={<Training />} />
            <Route path="/people" element={<People />} />
            <Route path="/email" element={<EmailGenerator />} />
          </Routes>
          <footer className="workspace-footer">StudyChaser <span>Built for the details that keep research moving.</span></footer>
          </div>
        </main>
      </div>
    </BrowserRouter>
  )
}
