import { trainings, studies } from '../data/mockData'
import StatusBadge from '../components/StatusBadge'

const attentionItems = []
trainings.forEach(t => {
  const study = studies.find(s => s.id === t.studyId)
  t.staff.forEach(member => {
    if (
      member.status === 'overdue' ||
      (member.status === 'reminded' && member.daysAgo >= t.cadenceDays) ||
      (member.status === 'sent'    && member.daysAgo >= t.cadenceDays)
    ) {
      attentionItems.push({
        person:     member.name,
        training:   t.title,
        study:      study.studyNumber,
        status:     member.status,
        daysAgo:    member.daysAgo,
        nextAction: member.status === 'overdue' ? 'Escalate to PI' : 'Send reminder',
      })
    }
  })
})
attentionItems.sort((a, b) => {
  const order = { overdue: 0, reminded: 1, sent: 2 }
  return (order[a.status] ?? 3) - (order[b.status] ?? 3)
})

const allStaff         = trainings.flatMap(t => t.staff)
const overdueCount     = allStaff.filter(s => s.status === 'overdue').length
const awaitingCount    = allStaff.filter(s => ['sent', 'reminded'].includes(s.status)).length
const completedCount   = allStaff.filter(s => s.status === 'complete').length
const activeStudies    = studies.filter(s => s.status === 'active').length

const today = new Date().toLocaleDateString('en-US', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
})

export default function Dashboard() {
  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Good morning, Katalina 👋</h1>
            <p className="page-subtitle">{today} — here's what needs your attention today.</p>
          </div>
          <button className="btn btn-primary">
            <PlusIcon /> New Training
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#FEE2E2' }}>
            <AlertIcon color="#EF4444" />
          </div>
          <div className="stat-value" style={{ color: '#EF4444' }}>{overdueCount}</div>
          <div className="stat-label">Overdue</div>
          <div className="stat-sub">Require immediate action</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#FEF3C7' }}>
            <ClockIcon color="#D97706" />
          </div>
          <div className="stat-value" style={{ color: '#D97706' }}>{awaitingCount}</div>
          <div className="stat-label">Awaiting Response</div>
          <div className="stat-sub">Sent or reminded</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#E8F7EF' }}>
            <CheckIcon color="#2EAA6A" />
          </div>
          <div className="stat-value" style={{ color: '#2EAA6A' }}>{completedCount}</div>
          <div className="stat-label">Completed</div>
          <div className="stat-sub">Acknowledged &amp; filed</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#EBF2FF' }}>
            <FileIcon color="#3B82F6" />
          </div>
          <div className="stat-value" style={{ color: '#3B82F6' }}>{activeStudies}</div>
          <div className="stat-label">Active Studies</div>
          <div className="stat-sub">With open trainings</div>
        </div>
      </div>

      {/* Needs attention */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Needs Attention</span>
          <span className="card-count">{attentionItems.length} items · sorted by urgency</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Person</th>
                <th>Training</th>
                <th>Study</th>
                <th>Status</th>
                <th>Days Since Contact</th>
                <th>Next Action</th>
              </tr>
            </thead>
            <tbody>
              {attentionItems.map((item, i) => (
                <tr key={i}>
                  <td className="td-name">{item.person}</td>
                  <td>{item.training}</td>
                  <td><span className="tag">{item.study}</span></td>
                  <td><StatusBadge status={item.status} /></td>
                  <td style={{ color: item.daysAgo >= 14 ? '#EF4444' : 'inherit', fontWeight: item.daysAgo >= 14 ? '600' : '400' }}>
                    {item.daysAgo} days
                  </td>
                  <td>
                    <button className="action-pill">{item.nextAction}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick summary */}
      <div className="card section">
        <div className="card-header">
          <span className="card-title">Training Summary by Study</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Study</th>
                <th>Title</th>
                <th>Active Trainings</th>
                <th>Completed Trainings</th>
                <th>Coordinator</th>
              </tr>
            </thead>
            <tbody>
              {studies.map(s => (
                <tr key={s.id}>
                  <td><span className="tag">{s.studyNumber}</span></td>
                  <td className="td-name">{s.title}</td>
                  <td>
                    <span style={{ fontWeight: 600, color: s.activeTrainings > 0 ? '#D97706' : 'inherit' }}>
                      {s.activeTrainings}
                    </span>
                  </td>
                  <td style={{ color: '#2EAA6A', fontWeight: 600 }}>{s.completedTrainings}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{s.coordinator}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ── Inline icons ── */
const PlusIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const AlertIcon = ({ color }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
const ClockIcon = ({ color }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
const CheckIcon = ({ color }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
const FileIcon  = ({ color }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
