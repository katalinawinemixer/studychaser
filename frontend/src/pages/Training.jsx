import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { IS_READ_ONLY_DEMO, apiGet, apiPost, useApiData } from '../lib/api'
import Modal from '../components/Modal'
import TrainingStaffList from '../components/TrainingStaffList'
import TrainingDetails from '../components/TrainingDetails'
import { completionStatus, matchesWork, trainingCounts } from '../../../shared/trainingRecords'
import { recommendedEmailType } from '../../../shared/emailRules'

const EMPTY_FORM = { studyId: '', title: '', version: '', sentDate: '', cadenceDays: 14 }

export default function Training() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedTrainingId = searchParams.get('trainingId')
  const selectedPersonId = searchParams.get('personId')
  const selectedStudyId = searchParams.get('studyId') || 'all'
  const staffId = searchParams.get('staffId') || 'all'
  const work = searchParams.get('work') || 'all'
  const [expandedGroups, setExpandedGroups] = useState({})
  const { data, loading, error, refetch } = useApiData(
    async () => {
      const [trainings, studies, people] = await Promise.all([apiGet('/trainings'), apiGet('/studies'), apiGet('/people')])
      return { trainings, studies, people }
    },
    { trainings: [], studies: [], people: [] }
  )
  const { trainings, studies, people } = data
  const selectedTraining = trainings.find(training => training.id === Number(selectedTrainingId))

  function openDetails(training, personId, section) {
    setSearchParams(previous => {
      const next = new URLSearchParams(previous)
      next.set('trainingId', training.id)
      if (personId) next.set('personId', personId)
      else next.delete('personId')
      if (section) next.set('detailSection', section)
      else next.delete('detailSection')
      return next
    })
  }
  function closeDetails() {
    setSearchParams(previous => {
      const next = new URLSearchParams(previous)
      for (const key of ['trainingId', 'personId', 'detailSection']) next.delete(key)
      return next
    }, { replace: true })
  }

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
    const type = recommendedEmailType({ study: studies.find(study => study.id === training.studyId), member, people })
    navigate(`/email?studyId=${training.studyId}&trainingId=${training.id}&personId=${member.personId}&type=${type}`)
  }

  const filtered = trainings.filter(training => selectedStudyId === 'all' || training.studyId === Number(selectedStudyId))
    .map(training => ({ ...training, staff: training.staff.filter(member => (staffId === 'all' || member.personId === Number(staffId)) && matchesWork(member, work, training.cadenceDays)) }))
    .filter(training => (work === 'all' && staffId === 'all') || training.staff.length > 0)
  const visibleRecords = filtered.reduce((sum, training) => sum + training.staff.length, 0)

  function setFilter(key, value) {
    setExpandedGroups({})
    setSearchParams(previous => {
      const next = new URLSearchParams(previous)
      for (const field of ['trainingId', 'personId', 'detailSection']) next.delete(field)
      if (value === 'all') next.delete(key)
      else next.set(key, value)
      return next
    })
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Training tracker</h1>
            <p className="page-subtitle">Track training completion and evidence filing for each study.</p>
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

      <div className="training-filters" aria-label="Training filters">
        <div className="form-group"><label htmlFor="study-filter">Study</label>
        <select
          id="study-filter"
          value={selectedStudyId}
          onChange={e => setFilter('studyId', e.target.value)}
          disabled={loading}
        >
          <option value="all">All studies</option>
          {studies.map(s => (
            <option key={s.id} value={s.id}>{s.studyNumber} — {s.title}</option>
          ))}
        </select></div>
        <div className="form-group"><label htmlFor="staff-filter">Staff member</label><select id="staff-filter" value={staffId} onChange={e => setFilter('staffId', e.target.value)} disabled={loading}><option value="all">All staff</option>{people.map(person => <option value={person.id} key={person.id}>{person.name}</option>)}</select></div>
        <div className="form-group"><label htmlFor="work-filter">Work status</label><select id="work-filter" value={work} onChange={e => setFilter('work', e.target.value)} disabled={loading}><option value="all">All records</option><option value="follow-up">Follow-up due</option><option value="pending">Pending acknowledgment</option><option value="filing">Awaiting filing</option><option value="filed">Evidence filed</option><option value="complete">Training complete</option></select></div>
      </div>

      {!loading && <div className="tracker-toolbar"><p>{filtered.length} training {filtered.length === 1 ? 'item' : 'items'} · {visibleRecords} staff {visibleRecords === 1 ? 'record' : 'records'}</p><div className="toolbar-actions"><button className="text-button" onClick={() => setExpandedGroups(Object.fromEntries(filtered.map(training => [training.id, true])))}>Expand all</button><button className="text-button" onClick={() => setExpandedGroups(Object.fromEntries(filtered.map(training => [training.id, false])))}>Collapse all</button>{(work !== 'all' || staffId !== 'all' || selectedStudyId !== 'all') && <button className="text-button" onClick={() => { setSearchParams({}); setExpandedGroups({}) }}>Clear filters</button>}</div></div>}

      {!loading && !error && filtered.length === 0 && (
        <div className="card card-pad">
          <div className="empty-state">
            <h3>No trainings found</h3>
            <p>No staff records match these filters.</p>
            <button className="btn btn-secondary" onClick={() => { setSearchParams({}); setExpandedGroups({}) }}>Clear filters</button>
          </div>
        </div>
      )}

      {filtered.map(training => {
        const study   = studies.find(s => s.id === training.studyId)
        const counts = trainingCounts(training)
        const done = counts.completed
        const total   = training.staff.length
        const isOpen = expandedGroups[training.id] ?? (work !== 'all' || staffId !== 'all')

        return (
          <div className="training-block" key={training.id}>
            <button type="button" className="training-block-header"
              aria-expanded={isOpen} aria-controls={`training-panel-${training.id}`}
              onClick={() => setExpandedGroups(previous => ({ ...previous, [training.id]: !isOpen }))}>

              <span className="training-heading-text">
                <span className="training-heading-title">
                  <span className="training-block-title">{training.title}</span>
                  <span className="tag">{study?.studyNumber ?? 'Unknown study'}</span>
                </span>
                <span className="training-block-meta">
                  {training.version} · {total} {staffId !== 'all' || work !== 'all' ? 'matching ' : ''}staff {total === 1 ? 'record' : 'records'} · Follow-up every {training.cadenceDays} days
                </span>
              </span>

              <span className="training-block-right">
                <span className="progress-chips">
                  <span className={`badge ${done === total && total > 0 ? 'complete' : 'completion-count'}`}>
                    <span className="badge-dot" />
                    {done}/{total} complete
                  </span>
                  {counts.awaitingFiling > 0 && <span className="badge filing-awaiting-filing">{counts.awaitingFiling} awaiting filing</span>}
                  {training.staff.filter(member => completionStatus(member) !== 'complete' && member.status === 'overdue').length > 0 && (
                    <span className="badge overdue">
                      <span className="badge-dot" />
                      {training.staff.filter(member => completionStatus(member) !== 'complete' && member.status === 'overdue').length} overdue
                    </span>
                  )}
                </span>
                <ChevronIcon open={isOpen} />
              </span>
            </button>

            <div id={`training-panel-${training.id}`} hidden={!isOpen}>
              {isOpen && <><div className="training-detail-entry"><button className="record-history-link" aria-label={`View details for ${training.title}`} onClick={() => openDetails(training)}>Training details &amp; history →</button></div><TrainingStaffList key={`${training.id}-${staffId}-${work}`} training={training} showAll={['filed', 'complete'].includes(work) || staffId !== 'all'} onAction={handleAction} onDetails={(personId, section) => openDetails(training, personId, section)} /></>}
            </div>
          </div>
        )
      })}

      {!loading && !error && selectedTrainingId && !selectedTraining && <div className="api-message" role="alert">This training record could not be found. <button className="record-history-link" onClick={closeDetails}>Return to the tracker</button></div>}
      {selectedTraining && <TrainingDetails key={`${selectedTraining.id}-${selectedPersonId ?? ''}-${searchParams.get('detailSection') ?? ''}`} training={selectedTraining} study={studies.find(study => study.id === selectedTraining.studyId)} personId={selectedPersonId} initialSection={searchParams.get('detailSection')} onClose={closeDetails} onSaved={refetch} />}
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

const Req      = () => <span style={{ color: 'var(--overdue)' }}>*</span>
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
