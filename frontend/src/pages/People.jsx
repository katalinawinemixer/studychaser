import { useState } from 'react'
import { apiGet, apiPost, useApiData } from '../lib/api'
import Modal from '../components/Modal'

function initials(name) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

const EMPTY_FORM = { name: '', email: '', role: '', studyIds: [] }

export default function People() {
  const { data, loading, error, refetch } = useApiData(
    async () => {
      const [people, studies] = await Promise.all([apiGet('/people'), apiGet('/studies')])
      return { people, studies }
    },
    { people: [], studies: [] }
  )
  const { people, studies } = data
  const missingAnyone = people.filter(p => p.missingTrainings > 0)

  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const set = key => e => setForm(prev => ({ ...prev, [key]: e.target.value }))

  function toggleStudy(id) {
    setForm(prev => ({
      ...prev,
      studyIds: prev.studyIds.includes(id)
        ? prev.studyIds.filter(x => x !== id)
        : [...prev.studyIds, id],
    }))
  }

  function openModal() { setSubmitError(''); setForm(EMPTY_FORM); setAddOpen(true) }
  function closeModal() { setAddOpen(false); setSubmitError('') }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError('')
    try {
      await apiPost('/people', form)
      refetch()
      closeModal()
    } catch (err) {
      setSubmitError(err.message || 'Failed to add person')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">People</h1>
            <p className="page-subtitle">
              {people.length} staff members across {studies.length} studies.
              {missingAnyone.length > 0 && (
                <span style={{ color: '#D97706', fontWeight: 600 }}>
                  {' '}{missingAnyone.length} {missingAnyone.length === 1 ? 'person has' : 'people have'} outstanding trainings.
                </span>
              )}
            </p>
          </div>
          <button className="btn btn-primary" onClick={openModal}>
            <PlusIcon /> Add Person
          </button>
        </div>
      </div>

      {error && <div className="api-message api-error">{error}</div>}
      {loading && <div className="api-message">Loading people...</div>}

      <div className="people-grid">
        {people.map(person => {
          const personStudies = studies.filter(s => person.studyIds.includes(s.id))

          return (
            <div className="person-card" key={person.id}>
              <div className="person-header">
                <div
                  className="person-avatar"
                  style={person.missingTrainings > 0 ? { background: '#FEF3C7', color: '#D97706' } : {}}
                >
                  {initials(person.name)}
                </div>
                <div>
                  <div className="person-name">{person.name}</div>
                  <div className="person-role">{person.role}</div>
                  <div className="person-email">{person.email}</div>
                </div>
              </div>

              <div className="person-studies">
                {personStudies.map(s => (
                  <span className="tag" key={s.id}>{s.studyNumber}</span>
                ))}
              </div>

              <div className="person-stats">
                <div>
                  <div
                    className="person-stat-val"
                    style={{ color: person.missingTrainings > 0 ? '#D97706' : '#2EAA6A' }}
                  >
                    {person.missingTrainings}
                  </div>
                  <div className="person-stat-label">Outstanding</div>
                </div>
                <div>
                  <div className="person-stat-val" style={{ color: '#2EAA6A' }}>
                    {person.completedTrainings}
                  </div>
                  <div className="person-stat-label">Completed</div>
                </div>
                <div style={{ marginLeft: 'auto', alignSelf: 'flex-end' }}>
                  {person.missingTrainings === 0 ? (
                    <span className="badge complete" style={{ fontSize: '11px' }}>
                      <span className="badge-dot" style={{ background: '#2EAA6A' }} />
                      Up to date
                    </span>
                  ) : (
                    <span className="badge reminded" style={{ fontSize: '11px' }}>
                      <span className="badge-dot" style={{ background: '#D97706' }} />
                      Action needed
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {addOpen && (
        <Modal title="Add Person" onClose={closeModal}>
          <form onSubmit={handleSubmit} className="form-stack">
            <div className="form-group">
              <label className="form-label">Full Name <Req /></label>
              <input
                className="form-input"
                value={form.name}
                onChange={set('name')}
                placeholder="First Last"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email <Req /></label>
              <input
                className="form-input"
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="name@institution.org"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <input
                className="form-input"
                value={form.role}
                onChange={set('role')}
                placeholder="e.g. Sub-Investigator, Research Nurse"
              />
            </div>
            {studies.length > 0 && (
              <div className="form-group">
                <label className="form-label">Studies</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '2px' }}>
                  {studies.map(s => (
                    <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={form.studyIds.includes(s.id)}
                        onChange={() => toggleStudy(s.id)}
                        style={{ accentColor: 'var(--accent)', width: '15px', height: '15px' }}
                      />
                      <span className="tag" style={{ marginRight: '4px' }}>{s.studyNumber}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{s.title}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {submitError && <div className="api-message api-error">{submitError}</div>}

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Adding…' : 'Add Person'}
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
