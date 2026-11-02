import { Link, useNavigate } from 'react-router-dom'
import StatusBadge from '../components/StatusBadge'
import { IS_READ_ONLY_DEMO, apiGet, useApiData } from '../lib/api'

const today = new Date().toLocaleDateString('en-US', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
})

export default function Dashboard() {
  const navigate = useNavigate()
  const { data, loading, error } = useApiData(
    () => apiGet('/dashboard/summary'),
    { stats: {}, attentionItems: [], studySummary: [] }
  )
  const { overdueCount = 0, awaitingCount = 0, completedCount = 0, activeStudies = 0 } = data.stats
  const { attentionItems, studySummary } = data

  function handleActionPill(item) {
    const type = item.status === 'overdue' ? 'pi' : 'second'
    navigate(`/email?studyId=${item.studyId}&trainingId=${item.trainingId}&personId=${item.personId}&type=${type}`)
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <p className="eyebrow">YOUR WORKSPACE, AT A GLANCE</p>
            <h1 className="page-title">A clearer day ahead, Alex.</h1>
            <p className="page-subtitle">Keep the follow-ups moving and every study in view.</p>
          </div>
          <div className="dashboard-header-actions"><span className="dashboard-date">{today}</span>
          <Link className="btn btn-secondary" to="/training">View training tracker <span aria-hidden="true">↗</span></Link>
          {!IS_READ_ONLY_DEMO && (
            <button className="btn btn-primary" onClick={() => navigate('/training?new=1')}>
              <PlusIcon /> New Training
            </button>
          )}
          </div>
        </div>
      </div>

      {error && <div className="api-message api-error">{error}</div>}
      {loading && <div className="api-message" role="status">Loading dashboard data...</div>}

      {/* Needs attention */}
      <section className="card attention-card" aria-labelledby="needs-attention-title" aria-busy={loading}>
        <div className="card-header">
          <div><h2 className="card-title" id="needs-attention-title"><span className="attention-dot" />Needs attention</h2><p className="card-description">Preview the next follow-up for each outstanding acknowledgment.</p></div>
          <span className="card-count">{loading || error ? '—' : `${attentionItems.length} to follow up`}</span>
        </div>
        <div className="table-wrap attention-desktop">
          <table>
            <thead>
              <tr>
                <th>Person</th>
                <th>Training</th>
                <th>Study</th>
                <th>Status</th>
                <th>Last contact</th>
                <th>Next step</th>
              </tr>
            </thead>
            <tbody>
              {attentionItems.map((item, i) => (
                <tr key={i}>
                  <td className="td-name"><span className="person-cell"><span className="table-avatar" aria-hidden="true">{item.person.replace(/^Dr\. /, '').split(' ').map(part => part[0]).slice(0, 2).join('')}</span>{item.person}</span></td>
                  <td>{item.training}</td>
                  <td><span className="tag">{item.study}</span></td>
                  <td><StatusBadge status={item.status} /></td>
                  <td style={{ color: item.daysAgo >= 14 ? '#BC5148' : 'inherit', fontWeight: item.daysAgo >= 14 ? '600' : '400' }}>
                    {item.daysAgo} days ago
                  </td>
                  <td>
                    <button className="action-pill" onClick={() => handleActionPill(item)}>
                      {item.status === 'overdue' ? 'Preview PI escalation' : 'Preview reminder'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="attention-mobile">
          {attentionItems.map(item => (
            <li className="staff-person" key={`${item.trainingId}-${item.personId}`}>
              <div className="staff-person-heading"><span className="td-name">{item.person}</span><StatusBadge status={item.status} /></div>
              <div className="attention-training">{item.training}</div>
              <span className="tag">{item.study}</span>
              <span className="contact-age contact-due">Last contacted {item.daysAgo} {item.daysAgo === 1 ? 'day' : 'days'} ago</span>
              <button className="action-pill" onClick={() => handleActionPill(item)}
                aria-label={`${item.status === 'overdue' ? 'Preview PI escalation' : 'Preview reminder'} for ${item.person}`}>
                {item.status === 'overdue' ? 'Preview PI escalation' : 'Preview reminder'}
              </button>
            </li>
          ))}
        </ul>
        {!loading && !error && attentionItems.length === 0 && <p className="training-staff-message">No follow-ups are due. Check the training tracker for other outstanding acknowledgments.</p>}
      </section>

      <h2 className="workspace-summary-title">Workspace summary</h2>
      <div className="stats-grid">
        <div className="stat-card stat-overdue">
          <div className="stat-icon" style={{ background: '#FEE2E2' }}>
            <AlertIcon color="#BC5148" />
          </div>
          <div className="stat-value" style={{ color: '#BC5148' }}>{loading || error ? '—' : overdueCount}</div>
          <div className="stat-label">Overdue</div>
          <div className="stat-sub">Require immediate action</div>
        </div>

        <div className="stat-card stat-awaiting">
          <div className="stat-icon" style={{ background: '#FEF3C7' }}>
            <ClockIcon color="#95651D" />
          </div>
          <div className="stat-value" style={{ color: '#95651D' }}>{loading || error ? '—' : awaitingCount}</div>
          <div className="stat-label">Awaiting Response</div>
          <div className="stat-sub">Sent or reminded</div>
        </div>

        <div className="stat-card stat-complete">
          <div className="stat-icon" style={{ background: '#E8F7EF' }}>
            <CheckIcon color="#32734A" />
          </div>
          <div className="stat-value" style={{ color: '#32734A' }}>{loading || error ? '—' : completedCount}</div>
          <div className="stat-label">Completed</div>
          <div className="stat-sub">Acknowledged &amp; filed</div>
        </div>

        <div className="stat-card stat-studies">
          <div className="stat-icon" style={{ background: '#EBF2FF' }}>
            <FileIcon color="#466E8A" />
          </div>
          <div className="stat-value" style={{ color: '#466E8A' }}>{loading || error ? '—' : activeStudies}</div>
          <div className="stat-label">Active Studies</div>
          <div className="stat-sub">With open trainings</div>
        </div>
      </div>

      <section className="study-overview section" aria-labelledby="study-overview-title">
        <div className="overview-header"><div><p className="eyebrow">THE BIGGER PICTURE</p><h2 id="study-overview-title">Your studies</h2></div><Link to="/studies" className="text-link">View all studies <span aria-hidden="true">↗</span></Link></div>
        <div className="dashboard-studies-grid">
          {studySummary.map((study, index) => (
            <Link to={`/training?studyId=${study.id}`} className="dashboard-study" key={study.id}>
              <div className="dashboard-study-top"><span className={`study-symbol study-symbol-${index % 3}`}><FileIcon color="currentColor" /></span><span className="study-number">{study.studyNumber}</span><span className="study-arrow" aria-hidden="true">↗</span></div>
              <h3>{study.title}</h3>
              <p className="study-owner">Coordinated by {study.coordinator}</p>
              <div className="study-training-counts"><span><strong>{study.activeTrainings}</strong> active trainings</span><span><strong>{study.completedTrainings}</strong> completed</span></div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

/* ── Inline icons ── */
const PlusIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const AlertIcon = ({ color }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
const ClockIcon = ({ color }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
const CheckIcon = ({ color }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
const FileIcon  = ({ color }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
