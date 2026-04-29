import { people, studies } from '../data/mockData'

function initials(name) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

export default function People() {
  const missingAnyone = people.filter(p => p.missingTrainings > 0)

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
          <button className="btn btn-primary">
            <PlusIcon /> Add Person
          </button>
        </div>
      </div>

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
    </div>
  )
}

const PlusIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
