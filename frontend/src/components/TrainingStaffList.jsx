import { useState } from 'react'
import StatusBadge from './StatusBadge'
import FilingBadge from './FilingBadge'
import { completionStatus, filingReference, filingStatus, needsFollowUp } from '../../../shared/trainingRecords'

function CompletionBadge({ member }) {
  const complete = completionStatus(member) === 'complete'
  const followUp = { sent: 'Sent', reminded: 'Reminded', overdue: 'Overdue', 'not-sent': 'Not sent' }[member.status]
  return <span className="completion-status-stack"><StatusBadge status={complete ? 'complete' : 'pending'} />{!complete && followUp && <span className={`follow-up-label ${member.status === 'overdue' ? 'contact-overdue' : ''}`}>{followUp}</span>}</span>
}

function ContactAge({ member, cadenceDays }) {
  if (member.daysAgo == null) return <span className="contact-age">{member.lastContacted || 'No contact recorded'}</span>
  return (
    <span className={`contact-age${member.status === 'overdue' && completionStatus(member) !== 'complete' ? ' contact-overdue' : needsFollowUp(member, cadenceDays) ? ' contact-due' : ''}`}>
      Last contacted {member.daysAgo} {member.daysAgo === 1 ? 'day' : 'days'} ago
    </span>
  )
}

function MemberDetails({ member, onDetails }) {
  return (
    <details className="member-details">
      <summary>More details<span className="sr-only"> for {member.name}</span></summary>
      <dl>
        <div><dt>Last contacted</dt><dd>{member.lastContacted || 'No contact recorded'}</dd></div>
        <div><dt>Filing reference</dt><dd>{filingReference(member) || 'No filing reference recorded.'}</dd></div>
      </dl>
      <button className="record-history-link" onClick={() => onDetails(member.personId)}>View activity history<span className="sr-only"> for {member.name}</span></button>
    </details>
  )
}

function PreviewAction({ training, member, onAction, onDetails }) {
  if (completionStatus(member) === 'complete') return filingStatus(member) === 'awaiting-filing' ? <button className="action-pill" onClick={() => onDetails(member.personId, 'records')}>Review filing<span className="sr-only"> for {member.name}</span></button> : null
  const label = member.status === 'overdue' ? 'Review overdue follow-up' : 'Preview reminder'
  return (
    <button className="action-pill" onClick={() => onAction(training, member)}
      aria-label={`${label} for ${member.name}`}>
      {label}
    </button>
  )
}

function StaffRows({ members, training, onAction, onDetails }) {
  return (
    <>
      <div className="staff-desktop">
        <table>
          <caption className="sr-only">Staff records for {training.title}</caption>
          <thead><tr><th scope="col">Staff member</th><th scope="col">Training</th><th scope="col">Evidence filing</th><th scope="col">Last contact</th><th scope="col">Next step</th><th scope="col">Details</th></tr></thead>
          <tbody>
            {members.map(member => (
              <tr key={member.personId}>
                <th scope="row" className="td-name">{member.name}</th>
                <td><CompletionBadge member={member} /></td>
                <td><FilingBadge member={member} /></td>
                <td><ContactAge member={member} cadenceDays={training.cadenceDays} /></td>
                <td><PreviewAction training={training} member={member} onAction={onAction} onDetails={onDetails} /></td>
                <td><MemberDetails member={member} onDetails={onDetails} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="staff-mobile">
        {members.map(member => (
          <li className="staff-person" key={member.personId}>
            <div className="staff-person-heading"><span className="td-name">{member.name}</span><CompletionBadge member={member} /></div>
            <div className="mobile-filing-status"><span>Evidence filing</span><FilingBadge member={member} /></div>
            <ContactAge member={member} cadenceDays={training.cadenceDays} />
            <PreviewAction training={training} member={member} onAction={onAction} onDetails={onDetails} />
            <MemberDetails member={member} onDetails={onDetails} />
          </li>
        ))}
      </ul>
    </>
  )
}

export default function TrainingStaffList({ training, onAction, onDetails, showAll = false }) {
  const [showCompleted, setShowCompleted] = useState(showAll)
  const pending = training.staff.filter(member => completionStatus(member) !== 'complete' || filingStatus(member) !== 'filed')
  const completed = training.staff.filter(member => completionStatus(member) === 'complete' && filingStatus(member) === 'filed')
  const completedId = `completed-staff-${training.id}`

  return (
    <div className="training-staff">
      {pending.length > 0 ? <StaffRows members={pending} training={training} onAction={onAction} onDetails={onDetails} /> : (
        <p className="training-staff-message">{completed.length > 0 ? 'All staff have completed training and have a filing reference recorded.' : 'No staff assigned to this training.'}</p>
      )}
      {completed.length > 0 && (
        <>
          <div className="completed-toggle-row">
            <button className="btn btn-secondary" aria-expanded={showCompleted} aria-controls={completedId}
              onClick={() => setShowCompleted(value => !value)}>
              {showCompleted ? 'Hide' : 'Show'} {completed.length} completed and filed staff
            </button>
          </div>
          <div id={completedId} hidden={!showCompleted}>
            <StaffRows members={completed} training={training} onAction={onAction} onDetails={onDetails} />
          </div>
        </>
      )}
    </div>
  )
}
