import { useState } from 'react'
import StatusBadge from './StatusBadge'

function ContactAge({ member, cadenceDays }) {
  if (member.daysAgo == null) return <span className="contact-age">{member.lastContacted || 'No contact recorded'}</span>
  return (
    <span className={`contact-age${member.daysAgo >= cadenceDays ? ' contact-due' : ''}`}>
      Last contacted {member.daysAgo} {member.daysAgo === 1 ? 'day' : 'days'} ago
    </span>
  )
}

function MemberDetails({ member }) {
  return (
    <details className="member-details">
      <summary>More details<span className="sr-only"> for {member.name}</span></summary>
      <dl>
        <div><dt>Last contacted</dt><dd>{member.lastContacted || 'No contact recorded'}</dd></div>
        <div><dt>Filing note</dt><dd>{member.filedAt || 'No filing note recorded.'}</dd></div>
      </dl>
    </details>
  )
}

function PreviewAction({ training, member, onAction }) {
  if (member.status === 'complete') return null
  const label = member.status === 'overdue' ? 'Preview PI escalation' : 'Preview reminder'
  return (
    <button className="action-pill" onClick={() => onAction(training, member)}
      aria-label={`${label} for ${member.name}`}>
      {label}
    </button>
  )
}

function StaffRows({ members, training, onAction }) {
  return (
    <>
      <div className="staff-desktop">
        <table>
          <caption className="sr-only">Staff records for {training.title}</caption>
          <thead><tr><th scope="col">Staff member</th><th scope="col">Status</th><th scope="col">Last contact</th><th scope="col">Next step</th><th scope="col">Details</th></tr></thead>
          <tbody>
            {members.map(member => (
              <tr key={member.personId}>
                <th scope="row" className="td-name">{member.name}</th>
                <td><StatusBadge status={member.status} /></td>
                <td><ContactAge member={member} cadenceDays={training.cadenceDays} /></td>
                <td><PreviewAction training={training} member={member} onAction={onAction} /></td>
                <td><MemberDetails member={member} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="staff-mobile">
        {members.map(member => (
          <li className="staff-person" key={member.personId}>
            <div className="staff-person-heading"><span className="td-name">{member.name}</span><StatusBadge status={member.status} /></div>
            <ContactAge member={member} cadenceDays={training.cadenceDays} />
            <PreviewAction training={training} member={member} onAction={onAction} />
            <MemberDetails member={member} />
          </li>
        ))}
      </ul>
    </>
  )
}

export default function TrainingStaffList({ training, onAction }) {
  const [showCompleted, setShowCompleted] = useState(false)
  const pending = training.staff.filter(member => member.status !== 'complete')
  const completed = training.staff.filter(member => member.status === 'complete')
  const completedId = `completed-staff-${training.id}`

  return (
    <div className="training-staff">
      {pending.length > 0 ? <StaffRows members={pending} training={training} onAction={onAction} /> : (
        <p className="training-staff-message">{completed.length > 0 ? 'All staff have completed this training.' : 'No staff assigned to this training.'}</p>
      )}
      {completed.length > 0 && (
        <>
          <div className="completed-toggle-row">
            <button className="btn btn-secondary" aria-expanded={showCompleted} aria-controls={completedId}
              onClick={() => setShowCompleted(value => !value)}>
              {showCompleted ? 'Hide' : 'Show'} {completed.length} completed staff
            </button>
          </div>
          <div id={completedId} hidden={!showCompleted}>
            <StaffRows members={completed} training={training} onAction={onAction} />
          </div>
        </>
      )}
    </div>
  )
}
