import { useState } from 'react'
import { trainings, studies } from '../data/mockData'
import StatusBadge from '../components/StatusBadge'

export default function Training() {
  const [selectedStudyId, setSelectedStudyId] = useState('all')
  const [openIds, setOpenIds] = useState([1, 3])

  const filtered = selectedStudyId === 'all'
    ? trainings
    : trainings.filter(t => t.studyId === Number(selectedStudyId))

  const toggle = id => setOpenIds(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  )

  const countByStatus = (staff, status) => staff.filter(s => s.status === status).length

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Training Tracker</h1>
            <p className="page-subtitle">Track acknowledgment status for each study training item.</p>
          </div>
          <button className="btn btn-primary">
            <PlusIcon /> Add Training
          </button>
        </div>
      </div>

      <div className="training-filter">
        <label>Filter by study:</label>
        <select
          value={selectedStudyId}
          onChange={e => setSelectedStudyId(e.target.value)}
        >
          <option value="all">All Studies</option>
          {studies.map(s => (
            <option key={s.id} value={s.id}>{s.studyNumber} — {s.title}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 && (
        <div className="card card-pad">
          <div className="empty-state">
            <h3>No trainings found</h3>
            <p>Try selecting a different study or add a new training item.</p>
          </div>
        </div>
      )}

      {filtered.map(training => {
        const study   = studies.find(s => s.id === training.studyId)
        const isOpen  = openIds.includes(training.id)
        const done    = countByStatus(training.staff, 'complete')
        const total   = training.staff.length
        const hasUrgent = training.staff.some(s => s.status === 'overdue' || s.status === 'reminded')

        return (
          <div className="training-block" key={training.id}>
            <div className="training-block-header" onClick={() => toggle(training.id)}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="training-block-title">{training.title}</span>
                  <span className="tag">{study.studyNumber}</span>
                  {hasUrgent && (
                    <span style={{ fontSize: '11px', color: '#D97706', fontWeight: 600 }}>
                      ⚠ Needs attention
                    </span>
                  )}
                </div>
                <div className="training-block-meta">
                  {training.version} · Sent {training.sentDate} · Follow-up every {training.cadenceDays} days
                </div>
              </div>

              <div className="training-block-right">
                <div className="progress-chips">
                  <span className="badge complete" style={{ fontSize: '11px' }}>
                    <span className="badge-dot" style={{ background: '#2EAA6A' }} />
                    {done}/{total} complete
                  </span>
                  {countByStatus(training.staff, 'overdue') > 0 && (
                    <span className="badge overdue" style={{ fontSize: '11px' }}>
                      <span className="badge-dot" style={{ background: '#EF4444' }} />
                      {countByStatus(training.staff, 'overdue')} overdue
                    </span>
                  )}
                  {countByStatus(training.staff, 'reminded') > 0 && (
                    <span className="badge reminded" style={{ fontSize: '11px' }}>
                      <span className="badge-dot" style={{ background: '#D97706' }} />
                      {countByStatus(training.staff, 'reminded')} reminded
                    </span>
                  )}
                </div>
                <ChevronIcon open={isOpen} />
              </div>
            </div>

            {isOpen && (
              <div className="training-block-table">
                <table>
                  <thead>
                    <tr>
                      <th>Staff Member</th>
                      <th>Status</th>
                      <th>Last Contacted</th>
                      <th>Days Since Contact</th>
                      <th>Filing Note</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {training.staff.map((member, i) => (
                      <tr key={i}>
                        <td className="td-name">{member.name}</td>
                        <td><StatusBadge status={member.status} /></td>
                        <td style={{ color: 'var(--text-muted)' }}>{member.lastContacted}</td>
                        <td>
                          {member.daysAgo != null ? (
                            <span style={{
                              color: member.daysAgo >= training.cadenceDays ? '#EF4444' : 'inherit',
                              fontWeight: member.daysAgo >= training.cadenceDays ? 600 : 400,
                            }}>
                              {member.daysAgo} days
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                          {member.filedAt ?? '—'}
                        </td>
                        <td>
                          {member.status === 'complete' ? (
                            <span style={{ fontSize: '12px', color: '#2EAA6A' }}>✓ Filed</span>
                          ) : (
                            <button className="action-pill">
                              {member.status === 'overdue' ? 'Escalate' : 'Remind'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

const PlusIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>

function ChevronIcon({ open }) {
  return (
    <svg
      className={`chevron${open ? ' open' : ''}`}
      width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    >
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  )
}
