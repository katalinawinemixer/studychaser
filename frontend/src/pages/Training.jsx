import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import StatusBadge from '../components/StatusBadge'
import { apiGet, apiPost, useApiData } from '../lib/api'
import Modal from '../components/Modal'

const EMPTY_FORM = { studyId: '', title: '', version: '', sentDate: '', cadenceDays: 14 }

export default function Training() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [selectedStudyId, setSelectedStudyId] = useState('all')
  const [openIds, setOpenIds] = useState([1, 3])
  const { data, loading, error, refetch } = useApiData(
    async () => {
      const [trainings, studies] = await Promise.all([apiGet('/trainings'), apiGet('/studies')])
      return { trainings, studies }
    },
    { trainings: [], studies: [] }
  )
  const { trainings, studies } = data

  const [addOpen, setAddOpen] = useState(() => searchParams.get('new') === '1')
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const set = key => e => setForm(prev => ({ ...prev, [key]: e.target.value }))

  function openModal() { setSubmitError(''); setForm(EMPTY_FORM); setAddOpen(true) }
  function closeModal() { setAddOpen(false); setSubmitError('') }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError('')
    try {
      await apiPost('/trainings', {
        ...form,
        studyId: Number(form.studyId),
        cadenceDays: Number(form.cadenceDays),
      })
      refetch()
      closeModal()
    } catch (err) {
      setSubmitError(err.message || 'Failed to add training')
    } finally {
      setSubmitting(false)
    }
  }

  function handleAction(training, member) {
    const type = member.status === 'overdue' ? 'pi' : 'second'
    navigate(`/email?studyId=${training.studyId}&trainingId=${training.id}&personId=${member.personId}&type=${type}`)
  }

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
          <button className="btn btn-primary" onClick={openModal}>
            <PlusIcon /> Add Training
          </button>
        </div>
      </div>

      {error && <div className="api-message api-error">{error}</div>}
      {loading && <div className="api-message">Loading trainings...</div>}

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
                  <span className="tag">{study?.studyNumber ?? 'Unknown study'}</span>
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
                            <button
                              className="action-pill"
                              onClick={() => handleAction(training, member)}
                            >
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

      {addOpen && (
        <Modal title="Add Training" onClose={closeModal}>
          <form onSubmit={handleSubmit} className="form-stack">
            <div className="form-group">
              <label className="form-label">Study <Req /></label>
              <select
                className="form-select"
                value={form.studyId}
                onChange={set('studyId')}
                required
              >
                <option value="">Select a study…</option>
                {studies.map(s => (
                  <option key={s.id} value={s.id}>{s.studyNumber} — {s.title}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Training Title <Req /></label>
              <input
                className="form-input"
                value={form.title}
                onChange={set('title')}
                placeholder="e.g. Amendment 5 Training"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Version</label>
              <input
                className="form-input"
                value={form.version}
                onChange={set('version')}
                placeholder="e.g. v5.0"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Date Sent</label>
              <input
                className="form-input"
                value={form.sentDate}
                onChange={set('sentDate')}
                placeholder="e.g. Jan 15, 2026"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Follow-up Cadence (days)</label>
              <input
                className="form-input"
                type="number"
                min="1"
                value={form.cadenceDays}
                onChange={set('cadenceDays')}
              />
            </div>

            {submitError && <div className="api-message api-error">{submitError}</div>}

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Adding…' : 'Add Training'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

const Req      = () => <span style={{ color: '#EF4444' }}>*</span>
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
