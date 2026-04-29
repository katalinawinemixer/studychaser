import { apiGet, useApiData } from '../lib/api'

export default function Studies() {
  const { data: studies, loading, error } = useApiData(() => apiGet('/studies'), [])

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Studies</h1>
            <p className="page-subtitle">{studies.length} active studies with open training requirements.</p>
          </div>
          <button className="btn btn-primary">
            <PlusIcon /> Add Study
          </button>
        </div>
      </div>

      {error && <div className="api-message api-error">{error}</div>}
      {loading && <div className="api-message">Loading studies...</div>}

      <div className="studies-grid">
        {studies.map(study => (
          <div className="study-card" key={study.id}>
            <div className="study-number">{study.studyNumber}</div>
            <div className="study-title">{study.title}</div>

            <div className="study-meta">
              <div className="study-meta-row">
                <PersonIcon />
                <span><strong>PI:</strong> {study.pi}</span>
              </div>
              <div className="study-meta-row">
                <CoordIcon />
                <span><strong>Coordinator:</strong> {study.coordinator}</span>
              </div>
              <div className="study-meta-row">
                <SponsorIcon />
                <span><strong>Sponsor:</strong> {study.sponsor}</span>
              </div>
              <div className="study-meta-row">
                <IrbIcon />
                <span><strong>IRB:</strong> {study.irb}</span>
              </div>
            </div>

            <div className="study-stats">
              <div>
                <div className="study-stat-val" style={{ color: study.activeTrainings > 0 ? '#D97706' : 'inherit' }}>
                  {study.activeTrainings}
                </div>
                <div className="study-stat-label">Active Trainings</div>
              </div>
              <div>
                <div className="study-stat-val" style={{ color: '#2EAA6A' }}>{study.completedTrainings}</div>
                <div className="study-stat-label">Completed</div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <span className="badge complete" style={{ fontSize: '11px' }}>
                  <span className="badge-dot" style={{ background: '#2EAA6A' }} />
                  Active
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const PlusIcon   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const PersonIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
const CoordIcon  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
const SponsorIcon= () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
const IrbIcon    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
