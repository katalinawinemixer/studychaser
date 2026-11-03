import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Studies from './pages/Studies'
import Training from './pages/Training'
import People from './pages/People'
import EmailGenerator from './pages/EmailGenerator'
import { IS_READ_ONLY_DEMO } from './lib/api'
import { useLocation } from 'react-router-dom'
import seedData from './data/mockData'

function WorkspaceHeader() {
  const { pathname } = useLocation()
  const title = { '/dashboard': 'Overview', '/studies': 'Studies', '/training': 'Training tracker', '/people': 'People', '/email': 'Email preview' }[pathname] ?? 'Workspace'
  const snapshotDate = new Date(`${seedData.snapshotDate}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return <header className="workspace-header"><div className="workspace-breadcrumb"><span className="workspace-name">Workspace</span><span className="breadcrumb-divider" aria-hidden="true">/</span><span>{title}</span></div>{IS_READ_ONLY_DEMO && <details className="demo-context"><summary>Demo · {snapshotDate}</summary><p>Synthetic snapshot as of {snapshotDate}. Records are read-only, filing references are illustrative, and email previews never send messages. Contact ages use the snapshot date.</p></details>}</header>
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
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/studies" element={<Studies />} />
            <Route path="/training" element={<Training />} />
            <Route path="/people" element={<People />} />
            <Route path="/email" element={<EmailGenerator />} />
          </Routes>
          <footer className="workspace-footer">StudyChaser <span>Training completion and evidence filing, tracked separately.</span></footer>
          </div>
        </main>
      </div>
    </BrowserRouter>
  )
}
