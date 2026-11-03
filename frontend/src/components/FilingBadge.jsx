import { filingStatus } from '../../../shared/trainingRecords'

const labels = { filed: 'Filed', 'awaiting-filing': 'Awaiting filing', 'not-ready': 'Awaiting completion' }

export default function FilingBadge({ member }) {
  const status = filingStatus(member)
  return <span className={`badge filing-${status}`}><span className="badge-dot" />{labels[status]}</span>
}
