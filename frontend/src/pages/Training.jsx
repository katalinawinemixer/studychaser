import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { IS_READ_ONLY_DEMO, apiGet, apiPost, useApiData } from '../lib/api'
import Modal from '../components/Modal'
import TrainingStaffList from '../components/TrainingStaffList'

const EMPTY_FORM = { studyId: '', title: '', version: '', sentDate: '', cadenceDays: 14 }

export default function Training() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedStudyId = searchParams.get('studyId') || 'all'
  const [expandedGroups, setExpandedGroups] = useState({})
  const { data, loading, error, refetch } = useApiData(
    async () => {
      const [trainings, studies] = await Promise.all([apiGet('/trainings'), apiGet('/studies')])
      return { trainings, studies }
    },
    { trainings: [], studies: [] }
  )
  const { trainings, studies } = data

  const [addOpen, setAddOpen] = useState(() => !IS_READ_ONLY_DEMO && searchParams.get('new') === '1')
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

  function selectStudy(value) {
    setSearchParams(previous => {
      const next = new URLSearchParams(previous)
      if (value === 'all') next.delete('studyId')
      else next.set('studyId', value)
      return next
    })
  }

  const countByStatus = (staff, status) => staff.filter(s => s.status === status).length

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Training Tracker</h1>
            <p className="page-subtitle">Track acknowledgment status for each study training item.</p>
          </div>
          {!IS_READ_ONLY_DEMO && (
            <button className="btn btn-primary" onClick={openModal}>
              <PlusIcon /> Add Training
            </button>
          )}
        </div>
      </div>

      {error && <div className="api-message api-error">{error}</div>}
      {loading && <div className="api-message" role="status">Loading trainings...</div>}

      <div className="training-filter">
        <label htmlFor="study-filter">Filter by study:</label>
        <select
          id="study-filter"
          value={selectedStudyId}
          onChange={e => selectStudy(e.target.value)}
          disabled={loading}
        >
          <option value="all">All Studies</option>
          {studies.map(s => (
            <option key={s.id} value={s.id}>{s.studyNumber} — {s.title}</option>
          ))}
        </select>
      </div>

      {!loading && !error && filtered.length === 0 && (
        <div className="card card-pad">
          <div className="empty-state">
            <h3>No trainings found</h3>
            <p>{selectedStudyId !== 'all' ? 'This study has no training items to display.' : 'No training items are available yet.'}</p>
            {selectedStudyId !== 'all' && <button className="btn btn-secondary" onClick={() => selectStudy('all')}>View all studies</button>}
          </div>
        </div>
      )}

      {filtered.map(training => {
        const study   = studies.find(s => s.id === training.studyId)
        const done    = countByStatus(training.staff, 'complete')
        const total   = training.staff.length
        const hasUrgent = training.staff.some(member => member.status === 'overdue' ||
          (['sent', 'reminded'].includes(member.status) && member.daysAgo >= training.cadenceDays))
        const isOpen = expandedGroups[training.id] ?? hasUrgent

        return (
          <div className="training-block" key={training.id}>
            <button type="button" className="training-block-header"
              aria-expanded={isOpen} aria-controls={`training-panel-${training.id}`}
              onClick={() => setExpandedGroups(previous => ({ ...previous, [training.id]: !isOpen }))}>

              <span className="training-heading-text">
                <span className="training-heading-title">
                  <span className="training-block-title">{training.title}</span>
                  <span className="tag">{study?.studyNumber ?? 'Unknown study'}</span>
                  {hasUrgent && (
                    <span style={{ fontSize: '11px', color: '#95651D', fontWeight: 600 }}>
                      Needs attention
                    </span>
                  )}
                </span>
                <span className="training-block-meta">
                  {training.version} · Sent {training.sentDate} · Follow-up every {training.cadenceDays} days
                </span>
              </span>

              <span className="training-block-right">
                <span className="progress-chips">
                  <span className={`badge ${done === total && total > 0 ? 'complete' : 'completion-count'}`}>
                    <span className="badge-dot" />
                    {done}/{total} complete
                  </span>
                  {countByStatus(training.staff, 'overdue') > 0 && (
                    <span className="badge overdue" style={{ fontSize: '11px' }}>
                      <span className="badge-dot" style={{ background: '#BC5148' }} />
                      {countByStatus(training.staff, 'overdue')} overdue
                    </span>
                  )}
                  {countByStatus(training.staff, 'reminded') > 0 && (
                    <span className="badge reminded" style={{ fontSize: '11px' }}>
                      <span className="badge-dot" style={{ background: '#95651D' }} />
                      {countByStatus(training.staff, 'reminded')} reminded
                    </span>
                  )}
                </span>
                <ChevronIcon open={isOpen} />
              </span>
            </button>

            <div id={`training-panel-${training.id}`} hidden={!isOpen}>
              {isOpen && <TrainingStaffList training={training} onAction={handleAction} />}
            </div>
          </div>
        )
      })}

      {!IS_READ_ONLY_DEMO && addOpen && (
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

const Req      = () => <span style={{ color: '#BC5148' }}>*</span>
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
