import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import StatusBadge from '../components/StatusBadge'
import { IS_READ_ONLY_DEMO, apiGet, useApiData } from '../lib/api'

export default function Dashboard() {
  const navigate = useNavigate()
  const [queue, setQueue] = useState('follow-up')
  const { data, loading, error } = useApiData(() => apiGet('/dashboard/summary'), { stats: {}, attentionItems: [], filingItems: [], studySummary: [] })
  const { assignmentCount = 0, pendingCount = 0, completedCount = 0, filedCount = 0, awaitingFilingCount = 0, activeStudies = 0 } = data.stats
  const followUps = data.attentionItems
  const items = queue === 'filing' ? data.filingItems : followUps
  const displayCount = value => loading || error ? '—' : value
  function openItem(item) {
    if (queue === 'filing') navigate(`/training?trainingId=${item.trainingId}&personId=${item.personId}&detailSection=records&work=filing`)
    else navigate(`/email?studyId=${item.studyId}&trainingId=${item.trainingId}&personId=${item.personId}&type=${item.emailType}`)
  }
  function actionLabel(item) {
    return queue === 'filing' ? 'Review filing' : item.emailType === 'pi' ? 'Preview PI escalation' : item.status === 'overdue' ? 'Preview overdue reminder' : 'Preview reminder'
  }
  return (
    <div className="dashboard">
      <div className="page-header page-header-row">
        <div><h1 className="page-title">Training overview</h1><p className="page-subtitle">{loading ? 'Loading your workspace…' : `${assignmentCount} staff records across ${activeStudies} active studies`}</p></div>
        {!IS_READ_ONLY_DEMO && <Link className="btn btn-primary" to="/training?new=1">New training</Link>}
      </div>
      {error && <div className="api-message api-error" role="alert">{error}</div>}
      <section className="work-queue card" aria-labelledby="work-queue-title" aria-busy={loading}>
        <div className="queue-heading"><div><h2 id="work-queue-title">Work to review</h2><p>Acknowledgments and evidence, tracked separately.</p></div><Link className="text-link" to={`/training?work=${queue}`}>Open tracker <span aria-hidden="true">→</span></Link></div>
        <nav className="queue-switcher" aria-label="Work queues">
          <button id="follow-up-queue" aria-pressed={queue === 'follow-up'} aria-controls="work-queue-records" onClick={() => setQueue('follow-up')}>Follow-ups due <span className="queue-count">{displayCount(followUps.length)}</span></button>
          <button id="filing-queue" aria-pressed={queue === 'filing'} aria-controls="work-queue-records" onClick={() => setQueue('filing')}>Awaiting filing <span className="queue-count filing-count">{displayCount(awaitingFilingCount)}</span></button>
        </nav>
        <div id="work-queue-records" role="region" aria-labelledby={queue === 'filing' ? 'filing-queue' : 'follow-up-queue'}>
          {loading && <p className="training-staff-message" role="status">Loading records…</p>}
          <div className="queue-table-wrap"><table className="queue-table"><thead><tr><th scope="col">Staff member</th><th scope="col">Training / study</th><th scope="col">{queue === 'filing' ? 'Evidence' : 'Status'}</th>{queue !== 'filing' && <th scope="col">Last contact</th>}<th scope="col"><span className="sr-only">Next action</span></th></tr></thead><tbody>
            {items.map(item => <tr key={`${item.trainingId}-${item.personId}`}>
              <th scope="row"><span className="person-cell"><span className="table-avatar" aria-hidden="true">{item.person.replace(/^Dr\. /, '').split(' ').slice(0, 2).map(word => word[0]).join('')}</span>{item.person}</span></th>
              <td><span className="queue-training">{item.training}</span><span className="queue-study">{item.study}</span></td>
              <td>{queue === 'filing' ? <span className="badge filing-awaiting-filing">Awaiting filing</span> : <StatusBadge status={item.status} />}</td>
              {queue !== 'filing' && <td className={item.status === 'overdue' ? 'contact-overdue' : 'contact-due'}>{item.daysAgo} days ago</td>}
              <td><button className={`action-pill${item.status === 'overdue' ? ' action-overdue' : ''}`} onClick={() => openItem(item)} aria-label={`${actionLabel(item)} for ${item.person}`}>{actionLabel(item)} <span aria-hidden="true">→</span></button></td>
            </tr>)}
          </tbody></table></div>
          <ul className="queue-mobile">{items.map(item => <li key={`${item.trainingId}-${item.personId}`}>
            <div className="queue-mobile-top"><strong>{item.person}</strong>{queue === 'filing' ? <span className="badge filing-awaiting-filing">Awaiting filing</span> : <StatusBadge status={item.status} />}</div>
            <p className="queue-training">{item.training}</p><p className="queue-study">{item.study}</p>
            <div className="queue-mobile-bottom">{queue !== 'filing' && <span className={item.status === 'overdue' ? 'contact-overdue' : 'contact-due'}>{item.daysAgo} days since contact</span>}<button className={`action-pill${item.status === 'overdue' ? ' action-overdue' : ''}`} onClick={() => openItem(item)} aria-label={`${actionLabel(item)} for ${item.person}`}>{queue === 'filing' ? 'Review filing' : item.status === 'overdue' ? 'Review overdue' : 'Preview reminder'} <span aria-hidden="true">→</span></button></div>
          </li>)}</ul>
          {!loading && !error && items.length === 0 && <div className="empty-state"><h3>{queue === 'filing' ? 'No evidence awaiting filing' : 'No follow-ups due'}</h3><p>{queue === 'filing' ? 'Completed staff records have their filing references recorded.' : 'Pending acknowledgments may still be within their follow-up window.'}</p></div>}
          {!loading && !error && queue === 'follow-up' && <p className="queue-explanation">Follow-ups become due after each training’s reminder interval. Red marks a record with an overdue status.</p>}
        </div>
      </section>
      <section className="record-overview" aria-labelledby="record-overview-title"><div className="section-heading"><h2 id="record-overview-title">Record summary</h2><p>One record per staff member, per training item</p></div>
        <div className="record-metrics">
          <Link to="/training?work=pending"><span>Pending acknowledgment</span><strong>{displayCount(pendingCount)}</strong><small>Staff records <span aria-hidden="true">→</span></small></Link>
          <Link to="/training?work=complete"><span>Training complete</span><strong>{displayCount(completedCount)}<small> / {displayCount(assignmentCount)}</small></strong><small>Filing tracked separately <span aria-hidden="true">→</span></small></Link>
          <Link to="/training?work=filed"><span>Evidence filed</span><strong>{displayCount(filedCount)}<small> / {displayCount(completedCount)}</small></strong><small>Of completed staff records <span aria-hidden="true">→</span></small></Link>
        </div>
      </section>
      <section className="study-overview" aria-labelledby="study-overview-title"><div className="section-heading"><h2 id="study-overview-title">Studies</h2><Link className="text-link" to="/studies">View study details <span aria-hidden="true">→</span></Link></div><div className="dashboard-studies-grid">
        {data.studySummary.map(study => <Link className="dashboard-study" key={study.id} to={`/training?studyId=${study.id}`}>
          <div className="dashboard-study-top"><span className="study-number">{study.studyNumber}</span><span aria-hidden="true">→</span></div><h3>{study.title}</h3><p className="study-owner">{study.trainingCount} training {study.trainingCount === 1 ? 'item' : 'items'} · {study.assignmentCount} staff records</p><div className="study-training-counts"><span><strong>{study.missingTrainings}</strong> pending</span><span><strong>{study.awaitingFilingCount}</strong> awaiting filing</span></div>
        </Link>)}
      </div></section>
    </div>
  )
}
